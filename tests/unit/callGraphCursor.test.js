import test from 'node:test';
import assert from 'node:assert/strict';

import {
  clampCallDepth,
  clampCallMaxNodes,
  clampCallPageSize,
  decodeCallCursor,
  encodeCallCursor,
} from '../../src/core/graph/calls/cursor.js';

test('encodeCallCursor and decodeCallCursor round-trip when runId matches', () => {
  const cursor = encodeCallCursor({ runId: 'run:abc', offset: 100 });
  assert.equal(cursor, 'run:abc::100');
  assert.deepEqual(decodeCallCursor(cursor, 'run:abc'), { offset: 100, reset: false });
  assert.deepEqual(decodeCallCursor('', 'run:abc'), { offset: 0, reset: false });
});

test('decodeCallCursor resets to offset 0 when runId differs or cursor is malformed', () => {
  assert.deepEqual(decodeCallCursor('run:old::100', 'run:new'), { offset: 0, reset: true });
  assert.deepEqual(decodeCallCursor('corrupt', 'run:new'), { offset: 0, reset: true });
  assert.deepEqual(decodeCallCursor('run:new::-5', 'run:new'), { offset: 0, reset: true });
  assert.deepEqual(decodeCallCursor('run:new::NaN', 'run:new'), { offset: 0, reset: true });
});

test('clamping helpers enforce page size 1..200, depth 1..6, and maxNodes 2..500', () => {
  assert.equal(clampCallPageSize(undefined), 100);
  assert.equal(clampCallPageSize(0), 1);
  assert.equal(clampCallPageSize(500), 200);

  assert.equal(clampCallDepth(undefined), 3);
  assert.equal(clampCallDepth(-1), 1);
  assert.equal(clampCallDepth(20), 6);

  assert.equal(clampCallMaxNodes(undefined), 500);
  assert.equal(clampCallMaxNodes(1), 2);
  assert.equal(clampCallMaxNodes(5000), 500);
});
