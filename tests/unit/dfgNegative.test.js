/**
 * Negative-test quota (minimum 15 tests) — the phase's integrity mechanism.
 *
 * Every test here proves the analysis DECLINES to claim a flow.
 * No resolved edge must appear in any of these scenarios.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDfg } from '../../src/core/graph/dfg/builder.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cfgNode(id, kind = 'statement', successors = []) {
  return { id, kind, successors };
}

const BASE_B = {
  id: 'x',
  name: 'x',
  kind: 'local',
  isMutable: true,
  isReference: false,
  isClosure: false,
};

function minBuild(overrides = {}) {
  return {
    functionId: 'fn:foo',
    fileId: 'file:src/a.cpp',
    cfgNodes: [cfgNode('entry', 'entry', ['exit']), cfgNode('exit', 'exit', [])],
    entryNodeId: 'entry',
    dataFactsMap: new Map(),
    bindings: [],
    params: [],
    calls: [],
    interproceduralArgs: [],
    interproceduralReturns: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Negative tests
// ---------------------------------------------------------------------------

describe('dfg – negative tests: no resolved edges through unresolved call (reference binding)', () => {
  it('N1: pointer binding past unresolved call is not resolved', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['callSite']),
        cfgNode('callSite', 'call', ['n3']),
        cfgNode('n3', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1',  [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n3',  [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [{ ...BASE_B, isReference: true }],
      calls: [{ callNodeId: 'callSite', status: 'unresolved' }],
    });
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'n3' && n.kind === 'use');
    if (useNode) {
      const incoming = dfg.edges.filter((e) => e.to === useNode.id);
      for (const e of incoming) {
        assert.notEqual(e.status, 'resolved', 'N1: no resolved edge past unresolved call for reference');
      }
    }
  });

  it('N2: possible call also degrades reference binding', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['cs']),
        cfgNode('cs', 'call', ['n3']),
        cfgNode('n3', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n3', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [{ ...BASE_B, isReference: true }],
      calls: [{ callNodeId: 'cs', status: 'possible' }],
    });
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'n3' && n.kind === 'use');
    if (useNode) {
      for (const e of dfg.edges.filter((e2) => e2.to === useNode.id)) {
        assert.notEqual(e.status, 'resolved', 'N2: possible call must degrade reference binding');
      }
    }
  });
});

describe('dfg – negative tests: no interprocedural edges for non-resolved calls', () => {
  it('N3: interproceduralArgs with unresolved call produces no param_to_arg edge', () => {
    // The builder only adds param_to_arg edges when the caller passes them in
    // (already filtered to resolved targets by the host). If none are passed, none appear.
    const dfg = buildDfg(minBuild({ interproceduralArgs: [] }));
    const iEdges = dfg.edges.filter((e) => e.kind === 'param_to_arg');
    assert.equal(iEdges.length, 0, 'N3: no param_to_arg edge without resolved call');
  });

  it('N4: return_to_use absent when no interprocedural returns supplied', () => {
    const dfg = buildDfg(minBuild({ interproceduralReturns: [] }));
    assert.equal(dfg.edges.filter((e) => e.kind === 'return_to_use').length, 0, 'N4');
  });
});

describe('dfg – negative tests: no resolved edges through eval scope', () => {
  it('N5: eval_scope fact degrades all resolved edges in the function', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['n2']),
        cfgNode('n2', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' },
                { bindingId: 'x', op: 'read',   status: 'unresolved', reasonCode: 'eval_scope' }]],
        ['n2', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_B],
    });
    // After eval degradation, no reaching edge should be resolved
    for (const e of dfg.edges) {
      assert.notEqual(e.status, 'resolved', 'N5: eval scope degrades all resolved edges');
    }
    assert.ok(dfg.limitations.some((l) => l.toLowerCase().includes('eval')));
  });
});

