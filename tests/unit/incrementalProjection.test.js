import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyIndexSnapshot } from '../../src/core/indexing/schema.js';
import {
  extractStoredFileRows,
  projectIncrementalRun,
} from '../../src/core/indexing/incremental/projection.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';

test('projectIncrementalRun and extractStoredFileRows round-trip CSR runs into Schema v1 rows', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:proj-1',
    path: 'src/util.js',
    text: 'export function double(n) { return n * 2; }\n',
  });

  const projected = projectIncrementalRun({
    relativePath: 'src/util.js',
    contentHash: 'sha256:util',
    sizeBytes: 44,
    lineCount: 2,
    run,
    now: 5000,
  });

  assert.equal(projected.fileRow.path, 'src/util.js');
  assert.ok(projected.symbolRows.some((s) => s.name === 'double'));

  const snap = createEmptyIndexSnapshot({ now: 5000 });
  snap.files[projected.fileRow.file_id] = projected.fileRow;
  for (const sym of projected.symbolRows) {
    snap.symbols[sym.symbol_id] = sym;
  }

  const extracted = extractStoredFileRows(snap, projected.fileRow.file_id);
  assert.equal(extracted.fileRow.path, 'src/util.js');
  assert.equal(extracted.symbolRows.length, projected.symbolRows.length);
});
