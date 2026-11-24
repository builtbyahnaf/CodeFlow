import test from 'node:test';
import assert from 'node:assert/strict';

import { applyZoomFilters } from '../../src/core/graph/zoom/filters.js';

test('applyZoomFilters filters nodes and edges by kind, relationshipType, and statusMix and builds visible chips (P10-15)', () => {
  const viewDto = {
    nodes: [
      {
        id: 'c1',
        kind: 'directory_cluster',
        displayStatus: 'mixed',
        statusMix: { counts: { resolved: 5, unresolved: 1 } },
      },
      {
        id: 'c2',
        kind: 'directory_cluster',
        displayStatus: 'resolved',
        statusMix: { counts: { resolved: 4, unresolved: 0 } },
      },
    ],
    edges: [{ id: 'b1', from: 'c1', to: 'c2', type: 'calls', displayStatus: 'unresolved' }],
  };

  const filtered = applyZoomFilters(viewDto, {
    kinds: ['directory_cluster'],
    statuses: ['unresolved'],
  });
  assert.equal(filtered.nodes.length, 1);
  assert.equal(filtered.nodes[0].id, 'c1');
  assert.equal(filtered.chips.length, 2);
});
