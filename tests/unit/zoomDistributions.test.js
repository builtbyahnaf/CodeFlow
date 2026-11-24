import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createStatusDistribution,
  mergeStatusDistributions,
} from '../../src/core/graph/zoom/distributions.js';

test('createStatusDistribution never collapses mixed or uncertain members into resolved and surfaces badges above the fold (P10-03, P10-04, AC-10.5)', () => {
  // Pure resolved set -> displayStatus: 'resolved'
  const allResolved = createStatusDistribution([{ status: 'resolved' }, { status: 'resolved' }]);
  assert.equal(allResolved.displayStatus, 'resolved');
  assert.equal(allResolved.completeness, 'full');
  assert.deepEqual(allResolved.badges, []);

  // 396 resolved + 3 unresolved + 1 unmodeled -> displayStatus MUST be 'mixed', never 'resolved'!
  const items = [
    ...Array.from({ length: 396 }, () => ({ status: 'resolved' })),
    { status: 'unresolved' },
    { status: 'unresolved' },
    { status: 'unresolved' },
    { status: 'possible', unmodeled: true, degradationCount: 1 },
  ];
  const mixed = createStatusDistribution(items);
  assert.equal(mixed.total, 400);
  assert.equal(mixed.displayStatus, 'mixed');
  assert.equal(mixed.completeness, 'partial');
  assert.equal(mixed.counts.unresolved, 3);
  assert.equal(mixed.counts.possible, 1);
  assert.equal(mixed.unmodeledCount, 1);
  assert.ok(mixed.badges.includes('3 unresolved'));
  assert.ok(mixed.badges.includes('1 possible'));
  assert.ok(mixed.badges.includes('1 unmodeled'));

  // Merging distributions preserves all non-resolved counts and partial completeness
  const merged = mergeStatusDistributions([allResolved, mixed]);
  assert.equal(merged.total, 402);
  assert.equal(merged.displayStatus, 'mixed');
  assert.equal(merged.completeness, 'partial');
});
