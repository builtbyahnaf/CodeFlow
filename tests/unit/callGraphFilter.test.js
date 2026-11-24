import test from 'node:test';
import assert from 'node:assert/strict';

import { matchesCallFilter, normalizeCallFilter } from '../../src/core/graph/calls/filter.js';

test('normalizeCallFilter drops unknown statuses and types and trims fileId', () => {
  const norm = normalizeCallFilter({
    statuses: ['resolved', 'bogus', 'resolved'],
    types: ['calls', 'invalid_type'],
    kinds: ['function', ''],
    fileId: '  file:a  ',
  });
  assert.deepEqual(norm, {
    statuses: ['resolved'],
    types: ['calls'],
    kinds: ['function'],
    fileId: 'file:a',
  });
  assert.deepEqual(normalizeCallFilter(), {
    statuses: null,
    types: null,
    kinds: null,
    fileId: null,
  });
});

test('matchesCallFilter checks status, strongestStatus, type, kind, and fileId', () => {
  const neighbor = { kind: 'method', fileId: 'file:a' };
  const rel = { status: 'stale', strongestStatus: 'resolved', type: 'calls' };

  assert.equal(matchesCallFilter(neighbor, rel, {}), true);
  assert.equal(matchesCallFilter(neighbor, rel, { statuses: ['resolved'] }), true);
  assert.equal(matchesCallFilter(neighbor, rel, { statuses: ['possible'] }), false);
  assert.equal(matchesCallFilter(neighbor, rel, { types: ['instantiates'] }), false);
  assert.equal(matchesCallFilter(neighbor, rel, { kinds: ['method'] }), true);
  assert.equal(matchesCallFilter(neighbor, rel, { kinds: ['function'] }), false);
  assert.equal(matchesCallFilter(neighbor, rel, { fileId: 'file:a' }), true);
  assert.equal(matchesCallFilter(neighbor, rel, { fileId: 'file:b' }), false);
});
