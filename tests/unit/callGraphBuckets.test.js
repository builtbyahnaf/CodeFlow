import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCandidateBuckets,
  buildUnresolvedBucket,
} from '../../src/core/graph/calls/buckets.js';

test('buildUnresolvedBucket groups unresolved sites by origin symbol and sorts reason counts', () => {
  const sites = [
    { from: 'sym:a', to: 'ext:1', reasonCode: 'unknown_receiver' },
    { from: 'sym:a', to: 'ext:2', reasonCode: 'computed_member' },
    { from: 'sym:a', to: 'ext:3', reasonCode: 'unknown_receiver' },
    { from: 'sym:b', to: 'ext:4', reasonCode: 'function_pointer' },
  ];

  const bucket = buildUnresolvedBucket('sym:a', sites);
  assert.equal(bucket.id, 'bucket:unresolved:sym:a');
  assert.equal(bucket.count, 3);
  assert.deepEqual(bucket.reasons, [
    { reasonCode: 'computed_member', count: 1 },
    { reasonCode: 'unknown_receiver', count: 2 },
  ]);
});

test('buildCandidateBuckets only creates a bucket when candidate count exceeds threshold', () => {
  const smallEdge = {
    from: 'sym:a',
    to: 'sym:c1',
    status: 'possible',
    reasonCode: 'dynamic_dispatch',
    candidates: ['sym:c1', 'sym:c2', 'sym:c3'],
  };
  assert.equal(buildCandidateBuckets([smallEdge], 5).length, 0);

  const largeEdge = {
    from: 'sym:a',
    to: 'sym:c1',
    status: 'possible',
    reasonCode: 'dynamic_dispatch',
    candidates: ['sym:c1', 'sym:c2', 'sym:c3', 'sym:c4', 'sym:c5', 'sym:c6'],
  };
  const buckets = buildCandidateBuckets([largeEdge], 5);
  assert.equal(buckets.length, 1);
  assert.equal(buckets[0].id, 'bucket:candidates:sym:a:dynamic_dispatch');
  assert.equal(buckets[0].candidates.length, 6);
});
