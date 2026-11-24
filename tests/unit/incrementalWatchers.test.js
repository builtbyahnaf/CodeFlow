import test from 'node:test';
import assert from 'node:assert/strict';

import {
  toWorkspaceRelativePath,
  registerIncrementalWatchers,
} from '../../src/extension/indexing/watchers.js';
import { CHANGE_KINDS } from '../../src/core/indexing/incremental/events.js';

test('toWorkspaceRelativePath normalizes inside-workspace paths and rejects outside paths', () => {
  assert.equal(
    toWorkspaceRelativePath('/workspace/project', '/workspace/project/src/a.js'),
    'src/a.js',
  );
  assert.equal(toWorkspaceRelativePath('/workspace/project', '/workspace/other/a.js'), null);
});

test('registerIncrementalWatchers routes editor, save, config, compile_commands.json, file rename/delete, and respects Restricted Mode', async () => {
  /** @type {Array<Record<string, any>>} */
  const ingested = [];
  /** @type {Array<Record<string, any>>} */
  const processedNow = [];
  let trusted = false;

  const handlers = {};
  const fakeHostEvents = {
    onDidChangeTextDocument: (cb) => {
      handlers.change = cb;
      return { dispose() {} };
    },
    onDidSaveTextDocument: (cb) => {
      handlers.save = cb;
      return { dispose() {} };
    },
    onDidCloseTextDocument: (cb) => {
      handlers.close = cb;
      return { dispose() {} };
    },
    onDidCreateFiles: (cb) => {
      handlers.create = cb;
      return { dispose() {} };
    },
    onDidDeleteFiles: (cb) => {
      handlers.delete = cb;
      return { dispose() {} };
    },
    onDidRenameFiles: (cb) => {
      handlers.rename = cb;
      return { dispose() {} };
    },
    onDidChangeConfiguration: (cb) => {
      handlers.config = cb;
      return { dispose() {} };
    },
  };

  const sub = registerIncrementalWatchers({
    workspaceRoot: () => '/workspace/app',
    isTrusted: () => trusted,
    coordinator: /** @type {any} */ ({
      ingest: (ev) => ingested.push(ev),
      processSingleFileNow: async (ev) => processedNow.push(ev),
    }),
    hostEvents: fakeHostEvents,
  });

  // In Restricted Mode (trusted === false), events are ignored
  handlers.change({
    document: { uri: { scheme: 'file', fsPath: '/workspace/app/src/a.js' }, getText: () => 'x' },
  });
  assert.equal(ingested.length, 0);

  // Enable workspace trust
  trusted = true;
  handlers.change({
    document: { uri: { scheme: 'file', fsPath: '/workspace/app/src/a.js' }, getText: () => 'x' },
  });
  assert.equal(ingested.length, 1);
  assert.equal(ingested[0].kind, CHANGE_KINDS.EDITOR_DIRTY);
  assert.equal(ingested[0].path, 'src/a.js');

  // Saving .codeflow/config.json routes to CONFIG_CHANGE
  handlers.save({
    uri: { scheme: 'file', fsPath: '/workspace/app/.codeflow/config.json' },
  });
  assert.equal(processedNow.at(-1).kind, CHANGE_KINDS.CONFIG_CHANGE);

  // Saving compile_commands.json routes to COMPILE_DB_CHANGE
  handlers.save({
    uri: { scheme: 'file', fsPath: '/workspace/app/build/compile_commands.json' },
  });
  assert.equal(processedNow.at(-1).kind, CHANGE_KINDS.COMPILE_DB_CHANGE);

  // Rename and delete
  handlers.rename({
    files: [
      {
        oldUri: { fsPath: '/workspace/app/src/old.js' },
        newUri: { fsPath: '/workspace/app/src/new.js' },
      },
    ],
  });
  assert.equal(processedNow.at(-1).kind, CHANGE_KINDS.FILE_RENAME);

  handlers.delete({
    files: [{ fsPath: '/workspace/app/src/new.js' }],
  });
  assert.equal(processedNow.at(-1).kind, CHANGE_KINDS.FILE_DELETE);

  sub.dispose();
});
