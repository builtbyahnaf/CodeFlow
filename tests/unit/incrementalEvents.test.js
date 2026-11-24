import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CHANGE_KINDS,
  normalizeChangeEvent,
  coalesceEventSequence,
} from '../../src/core/indexing/incremental/events.js';

test('normalizeChangeEvent validates kinds, paths, renames, and global events (P9-01)', () => {
  const dirty = normalizeChangeEvent({
    kind: CHANGE_KINDS.EDITOR_DIRTY,
    path: 'src\\core\\a.js',
    text: 'export const x = 1;',
    timestamp: 100,
  });
  assert.equal(dirty.ok, true);
  assert.equal(dirty.event.path, 'src/core/a.js');
  assert.equal(dirty.event.fileId, 'file:src/core/a.js');
  assert.equal(dirty.event.dirty, true);

  const rename = normalizeChangeEvent({
    kind: CHANGE_KINDS.FILE_RENAME,
    fromPath: 'src/old.js',
    toPath: 'src/new.js',
    timestamp: 200,
  });
  assert.equal(rename.ok, true);
  assert.equal(rename.event.fromFileId, 'file:src/old.js');
  assert.equal(rename.event.toFileId, 'file:src/new.js');

  const badKind = normalizeChangeEvent({ kind: 'unknown_event', path: 'src/a.js' });
  assert.equal(badKind.ok, false);
  assert.equal(badKind.code, 'E_EVENT_INVALID');

  const missingRenameTarget = normalizeChangeEvent({
    kind: CHANGE_KINDS.FILE_RENAME,
    fromPath: 'src/old.js',
  });
  assert.equal(missingRenameTarget.ok, false);
});

test('coalesceEventSequence drops IME composition events and collapses rapid edits on the same file', () => {
  const sequence = coalesceEventSequence([
    {
      kind: CHANGE_KINDS.EDITOR_DIRTY,
      path: 'src/a.js',
      text: 'v1',
      imeComposing: true,
      timestamp: 10,
    },
    {
      kind: CHANGE_KINDS.EDITOR_DIRTY,
      path: 'src/a.js',
      text: 'v2',
      timestamp: 20,
    },
    {
      kind: CHANGE_KINDS.EDITOR_SAVE,
      path: 'src/a.js',
      text: 'v3-saved',
      timestamp: 30,
    },
    {
      kind: CHANGE_KINDS.COMPILE_DB_CHANGE,
      path: 'compile_commands.json',
      timestamp: 40,
    },
  ]);

  assert.equal(sequence.length, 2);
  assert.equal(sequence[0].kind, CHANGE_KINDS.COMPILE_DB_CHANGE);
  assert.equal(sequence[1].kind, CHANGE_KINDS.EDITOR_SAVE);
  assert.equal(sequence[1].text, 'v3-saved');
  assert.equal(sequence[1].dirty, false);
});
