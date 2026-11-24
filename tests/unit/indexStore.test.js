import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createIndexStore,
  createMemoryFsAdapter,
  resolveCodeflowArtifactPath,
} from '../../src/storage/indexStore.js';

test('resolveCodeflowArtifactPath enforces .codeflow/ workspace containment', () => {
  const safe = resolveCodeflowArtifactPath('/workspace/app', 'index/codeflow.sqlite');
  assert.equal(safe.ok, true);

  const traversal = resolveCodeflowArtifactPath('/workspace/app', '../src/main.js');
  assert.equal(traversal.ok, false);
  assert.equal(traversal.code, 'E_PATH_UNSAFE');
});

test('createIndexStore commits batches atomically and rolls back on simulated disk-full failure (P8-05)', () => {
  const memFs = createMemoryFsAdapter();
  const store = createIndexStore({
    workspaceRoot: '/workspace/app',
    fsAdapter: memFs,
    clock: () => 10_000,
    pid: 101,
    hostname: 'dev-host',
  });

  const firstWrite = store.writeBatch({
    files: [
      {
        file_id: 'file:a',
        path: 'src/a.js',
        language: 'javascript',
        content_hash: 'sha256:111',
        size_bytes: 50,
        line_count: 3,
      },
    ],
    symbols: [
      {
        symbol_id: 'sym:a',
        kind: 'function',
        name: 'a',
        qualified_name: 'a',
        language: 'javascript',
        file_id: 'file:a',
        start_line: 0,
        start_col: 0,
        end_line: 2,
        end_col: 1,
      },
    ],
    analysisStates: [{ file_id: 'file:a', completeness: 'full', diagnostics: [] }],
    runId: 'run:1',
    state: 'complete',
  });
  assert.equal(firstWrite.ok, true);
  assert.equal(store.stats().fileCount, 1);

  // Simulate ENOSPC disk-full failure during second batch commit
  memFs.setFailNextWrite(true);
  const failedWrite = store.writeBatch({
    files: [
      {
        file_id: 'file:b',
        path: 'src/b.js',
        language: 'javascript',
        content_hash: 'sha256:222',
        size_bytes: 60,
        line_count: 4,
      },
    ],
    runId: 'run:2',
    state: 'complete',
  });
  assert.equal(failedWrite.ok, false);
  assert.equal(failedWrite.code, 'E_IO');

  // Prior committed records remain intact and queryable
  assert.equal(store.stats().fileCount, 1);
  assert.equal(store.symbolById('sym:a')?.name, 'a');
  assert.equal(store.symbolById('sym:b'), null);
});

test('createIndexStore detects truncated/corrupt DB files, quarantines them to .corrupt-<ts>, and supports repair/reset/clear (P8-06)', () => {
  const memFs = createMemoryFsAdapter();
  const store = createIndexStore({
    workspaceRoot: '/workspace/corrupt-test',
    fsAdapter: memFs,
    clock: () => 20_000,
    pid: 101,
    hostname: 'dev-host',
  });

  store.open({ createIfMissing: true });
  // Write a truncated/corrupt payload directly to codeflow.sqlite
  memFs.writeFileSync(store.paths.dbPath, '{"magic":"CODEFLOW_SQLITE_V1","snapshot":{truncated');

  const reopened = store.open();
  assert.equal(reopened.ok, false);
  assert.equal(reopened.code, 'E_CORRUPT');
  assert.equal(reopened.rebuildRequired, true);
  assert.ok(memFs.existsSync(`${store.paths.dbPath}.corrupt-20000`));

  // Reset rebuilds a clean Schema v1 snapshot
  const resetRes = store.reset();
  assert.equal(resetRes.ok, true);
  assert.equal(store.health().ok, true);

  // Clear removes the entire .codeflow/ directory
  const clearRes = store.clear();
  assert.equal(clearRes.ok, true);
  assert.equal(memFs.existsSync(store.paths.codeflowDir), false);
});

test('createIndexStore enforces single-writer lock and degrades second window to read-only mode (P8-08)', () => {
  const memFs = createMemoryFsAdapter();
  const writerStore = createIndexStore({
    workspaceRoot: '/workspace/shared',
    fsAdapter: memFs,
    clock: () => 30_000,
    pid: 500,
    hostname: 'dev-host',
    isProcessAlive: (pid) => pid === 500,
  });

  writerStore.writeBatch({
    files: [
      {
        file_id: 'file:shared',
        path: 'src/shared.js',
        language: 'javascript',
        content_hash: 'sha256:999',
        size_bytes: 30,
        line_count: 2,
      },
    ],
    state: 'complete',
  });

  const readerStore = createIndexStore({
    workspaceRoot: '/workspace/shared',
    fsAdapter: memFs,
    clock: () => 31_000,
    pid: 501,
    hostname: 'dev-host',
    isProcessAlive: (pid) => pid === 500,
  });

  const opened = readerStore.open();
  assert.equal(opened.ok, true);
  assert.equal(opened.readOnly, true);
  assert.equal(readerStore.isReadOnly(), true);
  assert.equal(readerStore.stats().fileCount, 1);

  const blockedWrite = readerStore.writeBatch({ state: 'complete' });
  assert.equal(blockedWrite.ok, false);
  assert.equal(blockedWrite.code, 'E_READ_ONLY');

  writerStore.close();
});
