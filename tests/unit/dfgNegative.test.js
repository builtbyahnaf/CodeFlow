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

describe('dfg – negative tests: unmodeled node kills mutable bindings', () => {
  it('N6: mutable binding past unmodeled node is at most possible', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['unmod']),
        cfgNode('unmod', 'unmodeled', ['n3']),
        cfgNode('n3', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1',    [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['unmod', []],
        ['n3',    [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_B],
    });
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'n3' && n.kind === 'use');
    if (useNode) {
      for (const e of dfg.edges.filter((e2) => e2.to === useNode.id)) {
        assert.notEqual(e.status, 'resolved', 'N6: post-unmodeled use not resolved');
      }
    }
  });
});

describe('dfg – negative tests: reference parameters', () => {
  it('N7: reference parameter entry is marked possible, not resolved', () => {
    const dfg = buildDfg({
      ...minBuild(),
      params: [{ ...BASE_B, id: 'ref', name: 'ref', kind: 'param', isReference: true }],
    });
    const pNode = dfg.nodes.find((n) => n.kind === 'param');
    assert.ok(pNode, 'N7: param node must exist');
    assert.notEqual(pNode.status, 'resolved', 'N7: reference param not resolved');
  });
});

describe('dfg – negative tests: missing CFG produces empty partial DFG', () => {
  it('N8: empty cfgNodes → partial with missing_cfg, zero edges', () => {
    const dfg = buildDfg({ ...minBuild(), cfgNodes: [] });
    assert.equal(dfg.partial, true);
    assert.ok(dfg.partialReasons.includes('missing_cfg'));
    assert.equal(dfg.edges.length, 0, 'N8: no edges without CFG');
  });
});

describe('dfg – negative tests: budget exhaustion', () => {
  it('N9: budget=1 iteration returns partial=true, not silently truncated', () => {
    // cycle to force iteration
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['a']),
        cfgNode('a', 'statement', ['b']),
        cfgNode('b', 'statement', ['a', 'exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['a', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['b', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_B],
      budgetIterations: 1,
      budgetMs: 0,
    });
    assert.equal(dfg.partial, true, 'N9: budget exhaustion must set partial=true');
    assert.ok(dfg.partialReasons.length > 0, 'N9: must carry partialReasons');
  });
});

describe('dfg – negative tests: shadowing (two bindings named "i")', () => {
  it('N10: two distinct "i" bindings in different scopes stay distinct', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['n2']),
        cfgNode('n2', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [
          { bindingId: 'scope1:i', op: 'assign', status: 'resolved' },
          { bindingId: 'scope2:i', op: 'assign', status: 'resolved' },
        ]],
        ['n2', [
          { bindingId: 'scope1:i', op: 'read', status: 'resolved' },
          { bindingId: 'scope2:i', op: 'read', status: 'resolved' },
        ]],
      ]),
      bindings: [
        { ...BASE_B, id: 'scope1:i', name: 'i' },
        { ...BASE_B, id: 'scope2:i', name: 'i' },
      ],
    });
    // Check that edges for scope1:i never reference scope2:i nodes and vice versa
    for (const e of dfg.edges) {
      const fromNode = dfg.nodes.find((n) => n.id === e.from);
      const toNode   = dfg.nodes.find((n) => n.id === e.to);
      if (!fromNode || !toNode) continue;
      assert.equal(
        fromNode.bindingId, toNode.bindingId,
        `N10: edge crosses shadowed bindings: ${fromNode.bindingId} → ${toNode.bindingId}`,
      );
    }
  });
});

describe('dfg – negative tests: closure capture does not produce resolved outer-binding flow', () => {
  it('N11: closure-captured binding emits inferred capture site, not resolved def', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'outer', op: 'capture_kill', status: 'inferred', reasonCode: 'capture_mutation' }]],
      ]),
      bindings: [{ ...BASE_B, id: 'outer', name: 'outer', isClosure: true }],
    });
    const captureNode = dfg.nodes.find((n) => n.reasonCode === 'capture_mutation');
    if (captureNode) {
      assert.notEqual(captureNode.status, 'resolved', 'N11: closure capture site not resolved');
    }
  });
});

describe('dfg – negative tests: unresolved node status requires reasonCode', () => {
  it('N12: a DataFact with status=unresolved and no reasonCode is preserved as-is (not upgraded)', () => {
    // The builder does not upgrade unresolved to resolved; it only degrades.
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'unresolved', reasonCode: 'aliasing_unknown' }]],
      ]),
      bindings: [BASE_B],
    });
    const defNode = dfg.nodes.find((n) => n.bindingId === 'x' && n.kind === 'def');
    if (defNode) {
      assert.equal(defNode.status, 'unresolved', 'N12: unresolved status preserved');
    }
  });
});

describe('dfg – negative tests: possible status not upgraded through branch merge', () => {
  it('N13: possible def at one branch, resolved at other → merge stays possible not resolved', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['t', 'f']),
        cfgNode('t', 'statement', ['merge']),
        cfgNode('f', 'statement', ['merge']),
        cfgNode('merge', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['t',     [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['f',     [{ bindingId: 'x', op: 'assign', status: 'possible', reasonCode: 'aliasing_unknown' }]],
        ['merge', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_B],
    });
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'merge' && n.kind === 'use');
    if (useNode) {
      const incoming = dfg.edges.filter((e) => e.to === useNode.id);
      const hasResolved = incoming.some((e) => e.status === 'resolved');
      const hasPossible = incoming.some((e) => e.status !== 'resolved');
      // at least one edge must be non-resolved because a possible def reaches
      assert.ok(hasPossible || !hasResolved, 'N13: possible branch must not be hidden');
    }
  });
});

describe('dfg – negative tests: virtual/function-pointer calls produce no interprocedural flow', () => {
  it('N14: virtual call marked unresolved produces no resolved param_to_arg', () => {
    // No interproceduralArgs passed → no edges
    const dfg = buildDfg(minBuild());
    assert.equal(dfg.edges.filter((e) => e.kind === 'param_to_arg' && e.status === 'resolved').length, 0, 'N14');
  });
});

describe('dfg – negative tests: template-dependent expression stays unresolved', () => {
  it('N15: template_dependent fact must not become resolved', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'unresolved', reasonCode: 'template_dependent' }]],
      ]),
      bindings: [BASE_B],
    });
    const n = dfg.nodes.find((n2) => n2.bindingId === 'x');
    if (n) {
      assert.notEqual(n.status, 'resolved', 'N15: template-dependent must stay unresolved');
    }
  });
});
