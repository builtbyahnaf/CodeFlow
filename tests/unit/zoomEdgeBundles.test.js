import test from 'node:test';
import assert from 'node:assert/strict';

import { bundleClusterEdges } from '../../src/core/graph/zoom/edgeBundles.js';

test('bundleClusterEdges bundles per relationship type without merging calls and references and formats status counts (P10-11)', () => {
  const clusterMap = {
    'sym:a1': 'cluster:dir:a',
    'sym:a2': 'cluster:dir:a',
    'sym:b1': 'cluster:dir:b',
    'sym:b2': 'cluster:dir:b',
  };

  // 12 calls (10 resolved, 2 unresolved) + 3 references between cluster:dir:a and cluster:dir:b
  const edges = [
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `rel:call:${i}`,
      from: 'sym:a1',
      to: 'sym:b1',
      type: 'calls',
      status: 'resolved',
    })),
    {
      id: 'rel:call:u1',
      from: 'sym:a2',
      to: 'sym:b2',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'dynamic_dispatch',
    },
    {
      id: 'rel:call:u2',
      from: 'sym:a2',
      to: 'sym:b1',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'unresolved_target',
    },
    ...Array.from({ length: 3 }, (_, i) => ({
      id: `rel:ref:${i}`,
      from: 'sym:a1',
      to: 'sym:b2',
      type: 'references',
      status: 'resolved',
    })),
  ];

  const bundles = bundleClusterEdges(edges, clusterMap);
  assert.equal(bundles.length, 2, 'calls and references must remain separate bundles');

  const callBundle = bundles.find((b) => b.type === 'calls');
  const refBundle = bundles.find((b) => b.type === 'references');

  assert.equal(callBundle.count, 12);
  assert.equal(callBundle.label, '12 calls (2 unresolved)');
  assert.equal(callBundle.displayStatus, 'mixed');
  assert.equal(callBundle.memberEdges.length, 12);

  assert.equal(refBundle.count, 3);
  assert.equal(refBundle.label, '3 references');
  assert.equal(refBundle.displayStatus, 'resolved');
});
