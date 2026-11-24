import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeFocusNeighborhood,
  isEdgeDimmed,
  isNodeDimmed,
} from '../../src/core/graph/calls/focus.js';

test('computeFocusNeighborhood includes focused node and immediate 1-hop neighbors only', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const edges = [
    { from: 'a', to: 'b' },
    { from: 'b', to: 'c' },
    { from: 'c', to: 'd' },
  ];

  const none = computeFocusNeighborhood(null, nodes, edges);
  assert.equal(none.size, 0);
  assert.equal(isNodeDimmed('a', none), false);
  assert.equal(isEdgeDimmed(edges[0], none), false);

  const hood = computeFocusNeighborhood('b', nodes, edges);
  assert.deepEqual([...hood].sort(), ['a', 'b', 'c']);
  assert.equal(isNodeDimmed('a', hood), false);
  assert.equal(isNodeDimmed('b', hood), false);
  assert.equal(isNodeDimmed('c', hood), false);
  assert.equal(isNodeDimmed('d', hood), true);

  assert.equal(isEdgeDimmed({ from: 'a', to: 'b' }, hood), false);
  assert.equal(isEdgeDimmed({ from: 'c', to: 'd' }, hood), true);
});
