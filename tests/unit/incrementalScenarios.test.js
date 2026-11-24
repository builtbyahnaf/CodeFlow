import test from 'node:test';
import assert from 'node:assert/strict';

import { createIndexStore, createMemoryFsAdapter } from '../../src/storage/indexStore.js';
import { createIndexingPipeline } from '../../src/extension/indexing/pipeline.js';
import {
  CHANGE_KINDS,
  createIncrementalCoordinator,
  generateDeterministicEditSequence,
} from '../../src/core/indexing/index.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';

function createScenarioWorkspace(fileMap, memFs = createMemoryFsAdapter(), pid = 100) {
  const root = '/workspace/scenario';
  const store = createIndexStore({
    workspaceRoot: root,
    fsAdapter: memFs,
    pid,
    hostname: 'scenario-host',
    isProcessAlive: (p) => p === 100,
  });

  const analyzeFile = async ({ path: relPath, source, runId }) => {
    const run = javascriptAdapter.analyze({
      runId,
      path: relPath,
      text: source,
    });
    return { ok: true, run };
  };

  const pipeline = createIndexingPipeline({
    store,
    listWorkspaceFiles: async () =>
      Object.entries(fileMap).map(([p, text]) => ({
        path: p,
        sizeBytes: Buffer.byteLength(text, 'utf8'),
      })),
    readWorkspaceFile: async (p) => fileMap[p],
    analyzeFile,
  });

  const coordinator = createIncrementalCoordinator({
    store,
    listWorkspaceFiles: async () =>
      Object.entries(fileMap).map(([p, text]) => ({
        path: p,
        sizeBytes: Buffer.byteLength(text, 'utf8'),
      })),
    readWorkspaceFile: async (p) => fileMap[p],
    analyzeFile,
  });

  return { store, pipeline, coordinator, memFs };
}

test('500-edit equivalence test: after 500 random edits, creates, deletes, and renames, the incremental index equals a clean full rebuild (P9-15, AC-9.1)', async () => {
  /** @type {Record<string, string>} */
  const initialFiles = {};
  for (let i = 0; i < 12; i += 1) {
    initialFiles[`src/mod_${i}.js`] = `export function fn_${i}(x) {\n  return x + ${i};\n}\n`;
  }

  const liveFiles = { ...initialFiles };
  const incremental = createScenarioWorkspace(liveFiles);
  await incremental.pipeline.runIndexing();

  const { operations, finalFiles } = generateDeterministicEditSequence(initialFiles, {
    editCount: 500,
    seed: 20261124,
  });
  assert.equal(operations.length, 500);

  for (const op of operations) {
    if (op.kind === CHANGE_KINDS.FILE_DELETE) {
      delete liveFiles[op.path];
    } else if (op.kind === CHANGE_KINDS.FILE_RENAME) {
      delete liveFiles[op.fromPath];
      liveFiles[op.toPath] = op.text;
    } else {
      liveFiles[op.path] = op.text;
    }
    const res = await incremental.coordinator.processSingleFileNow(op);
    assert.equal(res.ok, true, `operation ${op.kind} on ${op.path ?? op.toPath} failed`);
  }

  assert.deepEqual(Object.keys(liveFiles).sort(), Object.keys(finalFiles).sort());

  // Build a fresh full index from scratch over finalFiles
  const cleanRebuild = createScenarioWorkspace(finalFiles);
  const rebuildRes = await cleanRebuild.pipeline.runIndexing({ rebuild: true });
  assert.equal(rebuildRes.ok, true);

  assert.equal(
    incremental.store.stats().fileCount,
    cleanRebuild.store.stats().fileCount,
    'incremental file count must match full rebuild',
  );
  assert.equal(
    incremental.store.stats().symbolCount,
    cleanRebuild.store.stats().symbolCount,
    'incremental symbol count must match full rebuild',
  );
  assert.equal(
    incremental.store.logicalHash(),
    cleanRebuild.store.logicalHash(),
    '500-edit incremental logicalHash must exactly match full rebuild logicalHash',
  );
});

test('multi-window incremental coherence and 1-hour simulated soak keep memory bounded and readers convergent (P9-17, P9-18, AC-9.10)', async () => {
  const sharedFs = createMemoryFsAdapter();
  const files = {
    'src/shared.js': 'export function shared(x) { return x; }\n',
  };

  // Window 1 (writer, pid 100) and Window 2 (read-only observer, pid 200)
  const win1 = createScenarioWorkspace(files, sharedFs, 100);
  await win1.pipeline.runIndexing();

  files['src/shared.js'] =
    'export function shared(x) { return x + 1; }\nexport function addedInWin1() { return 2; }\n';
  await win1.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/shared.js',
  });

  const win2 = createScenarioWorkspace(files, sharedFs, 200);
  const open2 = win2.store.open();
  assert.equal(open2.ok, true);
  assert.equal(open2.readOnly, true);
  assert.equal(win2.store.symbolsByName('addedInWin1').total, 1);
  assert.equal(win2.store.logicalHash(), win1.store.logicalHash());

  // Simulated 1-hour soak: 600 rapid debounced typing + save cycles across 3,600,000 ms
  for (let tick = 1; tick <= 600; tick += 1) {
    const now = tick * 6000;
    win1.coordinator.ingest(
      {
        kind: CHANGE_KINDS.EDITOR_DIRTY,
        path: 'src/shared.js',
        text: `export function shared(x) { return x + ${tick}; }\n`,
        dirty: true,
      },
      now,
    );
    await win1.coordinator.flushDue(now + 400);
  }
  const snap = win1.coordinator.telemetry.snapshot();
  assert.equal(snap.eventsProcessed, 600);
  assert.ok(
    snap.durations.javascript.count <= 256,
    'duration ring buffer must stay bounded at 256',
  );
  assert.ok(win1.coordinator.provisional.count() <= win1.coordinator.provisional.maxFiles());
  win1.coordinator.dispose();
});
