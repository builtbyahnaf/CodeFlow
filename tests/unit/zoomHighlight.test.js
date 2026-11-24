import test from 'node:test';
import assert from 'node:assert/strict';

import { computeDirectionalHighlight } from '../../src/core/graph/zoom/highlight.js';

test('computeDirectionalHighlight computes incoming, outgoing, and dimmed sets with per-direction status distributions (P10-12)', () => {
  const res = computeDirectionalHighlight({
    focusNodeId: 'center',
    nodes: [{ id: 'caller' }, { id: 'center' }, { id: 'callee' }, { id: 'unconnected' }],
    edges: [
      { from: 'caller', to: 'center', status: 'resolved' },
      { from: 'center', to: 'callee', status: 'possible' },
    ],
  });

  assert.deepEqual(res.incomingNodeIds, ['caller']);
  assert.deepEqual(res.outgoingNodeIds, ['callee']);
  assert.deepEqual(res.dimmedNodeIds, ['unconnected']);
  assert.equal(res.incomingStatusMix.counts.resolved, 1);
  assert.equal(res.outgoingStatusMix.counts.possible, 1);
});
