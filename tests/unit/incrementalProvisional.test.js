import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyIndexSnapshot } from '../../src/core/indexing/schema.js';
import { createProvisionalOverlay } from '../../src/core/indexing/incremental/provisional.js';

function makeProjected(fileId, path, toSymbolId = 'sym:external') {
  return {
    fileRow: {
      file_id: fileId,
      path,
      language: 'javascript',
      content_hash: `sha256:dirty-${fileId}`,
      size_bytes: 50,
      line_count: 3,
      indexed_at: 100,
      run_id: 'run:dirty',
    },
    symbolRows: [
      {
        symbol_id: `sym:${fileId}`,
        kind: 'function',
        name: 'fn',
        qualified_name: 'fn',
        language: 'javascript',
        file_id: fileId,
        start_line: 0,
        start_col: 0,
        end_line: 2,
        end_col: 1,
      },
    ],
    relationshipRows: [
      {
        rel_id: `rel:${fileId}`,
        type: 'calls',
        from_id: `sym:${fileId}`,
        to_id: toSymbolId,
        status: 'resolved',
        site_file: fileId,
        site_start_line: 1,
        site_end_line: 1,
        run_id: 'run:dirty',
      },
    ],
    dependencyRows: [],
    analysisStateRow: {
      file_id: fileId,
      completeness: 'full',
      diagnostics_json: '[]',
      updated_at: 100,
    },
  };
}

test('provisional overlay keeps dirty-buffer analysis in memory, caps cross-file edges at possible, enforces 4-file cap, and reconciles on save/revert (P9-08, AC-9.6)', () => {
  const authoritative = createEmptyIndexSnapshot({ now: 50, state: 'complete' });
  authoritative.files['file:a'] = {
    file_id: 'file:a',
    path: 'src/a.js',
    language: 'javascript',
    content_hash: 'sha256:saved-a',
    size_bytes: 40,
    line_count: 2,
    indexed_at: 50,
    run_id: 'run:saved',
  };

  const overlay = createProvisionalOverlay({ maxFiles: 2 });
  const setA = overlay.setDirtyFile({
    fileId: 'file:a',
    path: 'src/a.js',
    contentHash: 'sha256:dirty-a',
    projected: makeProjected('file:a', 'src/a.js', 'sym:cross_file_target'),
  });
  assert.equal(setA.ok, true);
  assert.equal(setA.provisional, true);

  // Authoritative snapshot is untouched
  assert.equal(authoritative.files['file:a'].content_hash, 'sha256:saved-a');

  // Merged view shows provisional rows and downgrades cross-file edge to 'possible'
  const merged = overlay.mergeWithAuthoritative(authoritative);
  assert.equal(merged.files['file:a'].provisional, true);
  assert.equal(merged.relationships['rel:file:a'].status, 'possible');
  assert.equal(merged.relationships['rel:file:a'].provisional, true);

  // Fill second slot, then verify 3rd file hits cap and falls back to saved state
  overlay.setDirtyFile({
    fileId: 'file:b',
    path: 'src/b.js',
    contentHash: 'sha256:dirty-b',
    projected: makeProjected('file:b', 'src/b.js'),
  });
  const third = overlay.setDirtyFile({
    fileId: 'file:c',
    path: 'src/c.js',
    contentHash: 'sha256:dirty-c',
    projected: makeProjected('file:c', 'src/c.js'),
  });
  assert.equal(third.ok, false);
  assert.equal(third.code, 'E_PROVISIONAL_CAP');
  assert.equal(third.fallbackToSavedStale, true);

  // External overwrite detection while buffer is dirty
  const conflict = overlay.handleExternalOverwrite('file:a', 'sha256:external-change');
  assert.equal(conflict.conflicted, true);

  // Reconcile on save drops overlay entry for file:a
  overlay.reconcileOnSave('file:a');
  assert.equal(overlay.has('file:a'), false);

  // Discard on revert drops overlay entry for file:b
  overlay.discardOnRevert('file:b');
  assert.equal(overlay.count(), 0);
});
