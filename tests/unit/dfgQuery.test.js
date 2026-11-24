import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  nodesForBinding,
  defsReachingUse,
  usesReachedByDef,
  loopCarriedEdges,
  traceBinding,
  backwardSlice,
  forwardSlice,
  bindingDetailEntries,
  hasInterproceduralFlows,
} from '../../src/core/graph/dfg/query.js';
import { DFG_DTO_VERSION } from '../../src/core/graph/dfg/kinds.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function node(id, bindingId, kind = 'def', status = 'resolved', cfgNodeId = 'n1') {
  return { id, bindingId, cfgNodeId, kind, range: null, status };
}

function edge(from, to, kind = 'reaching', status = 'resolved') {
  return { from, to, kind, status };
}

function makeDfg(nodes, edges, limitations = []) {
  const byBinding = {};
  for (const n of nodes) {
    if (!byBinding[n.bindingId]) byBinding[n.bindingId] = [];
    byBinding[n.bindingId].push(n);
  }
  return {
    version: DFG_DTO_VERSION,
    functionId: 'fn:foo',
    fileId: 'file:a.js',
    nodes,
    edges,
    partial: false,
    partialReasons: [],
    limitations,
    byBinding,
  };
}

// ---------------------------------------------------------------------------
// nodesForBinding
// ---------------------------------------------------------------------------

describe('nodesForBinding', () => {
  it('returns nodes for the binding', () => {
    const dfg = makeDfg([node('flow:x@n1#0', 'x'), node('flow:y@n1#0', 'y')], []);
    assert.equal(nodesForBinding(dfg, 'x').length, 1);
    assert.equal(nodesForBinding(dfg, 'y').length, 1);
  });

  it('returns empty array for unknown binding', () => {
    const dfg = makeDfg([], []);
    assert.deepEqual(nodesForBinding(dfg, 'z'), []);
  });
});

// ---------------------------------------------------------------------------
// defsReachingUse
// ---------------------------------------------------------------------------

describe('defsReachingUse', () => {
  it('returns defs that have reaching/assign edges to the use', () => {
    const defN = node('flow:x@n1#0', 'x', 'def');
    const useN = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const dfg = makeDfg([defN, useN], [edge(defN.id, useN.id, 'assign')]);
    const defs = defsReachingUse(dfg, useN.id);
    assert.equal(defs.length, 1);
    assert.equal(defs[0].id, defN.id);
  });
});

// ---------------------------------------------------------------------------
// usesReachedByDef
// ---------------------------------------------------------------------------

describe('usesReachedByDef', () => {
  it('returns uses reached by the def', () => {
    const defN = node('flow:x@n1#0', 'x', 'def');
    const useN = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const dfg = makeDfg([defN, useN], [edge(defN.id, useN.id)]);
    const uses = usesReachedByDef(dfg, defN.id);
    assert.equal(uses.length, 1);
    assert.equal(uses[0].id, useN.id);
  });
});

// ---------------------------------------------------------------------------
// loopCarriedEdges
// ---------------------------------------------------------------------------

describe('loopCarriedEdges', () => {
  it('filters to loop_carried kind', () => {
    const a = node('flow:x@n1#0', 'x');
    const b = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const dfg = makeDfg([a, b], [
      edge(a.id, b.id, 'loop_carried'),
      edge(a.id, b.id, 'reaching'),
    ]);
    const lc = loopCarriedEdges(dfg);
    assert.equal(lc.length, 1);
    assert.equal(lc[0].kind, 'loop_carried');
  });
});

// ---------------------------------------------------------------------------
// traceBinding
// ---------------------------------------------------------------------------

describe('traceBinding', () => {
  it('returns all nodes and edges for the binding', () => {
    const defN = node('flow:x@n1#0', 'x', 'def');
    const useN = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const unrelated = node('flow:y@n3#0', 'y', 'def', 'resolved', 'n3');
    const dfg = makeDfg([defN, useN, unrelated], [edge(defN.id, useN.id)]);
    const { nodes, edges, partial } = traceBinding(dfg, 'x');
    assert.equal(partial, false);
    assert.equal(nodes.length, 2);
    assert.equal(edges.length, 1);
  });

  it('returns empty for unknown binding', () => {
    const dfg = makeDfg([], []);
    const { nodes } = traceBinding(dfg, 'z');
    assert.equal(nodes.length, 0);
  });
});

// ---------------------------------------------------------------------------
// backwardSlice
// ---------------------------------------------------------------------------

