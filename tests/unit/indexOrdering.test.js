import test from 'node:test';
import assert from 'node:assert/strict';

import {
  pathDepth,
  orderCandidateFiles,
  planIndexBatches,
} from '../../src/core/indexing/ordering.js';

test('orderCandidateFiles sorts shallow-first, then byte size ascending, then path lexicographically', () => {
  assert.equal(pathDepth('index.js'), 0);
  assert.equal(pathDepth('src/app.js'), 1);
  assert.equal(pathDepth('src/core/graph/cfg.js'), 3);

  const candidates = [
    { path: 'src/deep/b.js', sizeBytes: 100 },
    { path: 'root.js', sizeBytes: 500 },
    { path: 'src/b.js', sizeBytes: 300 },
    { path: 'src/a.js', sizeBytes: 300 },
    { path: 'src/small.js', sizeBytes: 50 },
  ];

  const ordered = orderCandidateFiles(candidates);
  assert.deepEqual(
    ordered.map((c) => c.path),
    ['root.js', 'src/small.js', 'src/a.js', 'src/b.js', 'src/deep/b.js'],
  );
});

test('planIndexBatches partitions ordered files into deterministic fixed-size batches', () => {
  const items = Array.from({ length: 12 }, (_, i) => ({ path: `src/f${i}.js` }));
  const batches = planIndexBatches(items, 5);

  assert.equal(batches.length, 3);
  assert.equal(batches[0].length, 5);
  assert.equal(batches[1].length, 5);
  assert.equal(batches[2].length, 2);
});
