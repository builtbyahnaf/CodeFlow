import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDfg } from '../../src/core/graph/dfg/builder.js';
import { DFG_DTO_VERSION } from '../../src/core/graph/dfg/kinds.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cfgNode(id, kind = 'statement', successors = [], predecessors = []) {
  return { id, kind, successors, predecessors };
}

const BASE_BINDING = {
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
    fileId: 'file:src/a.js',
    cfgNodes: [cfgNode('entry', 'entry', ['exit']), cfgNode('exit', 'exit', [])],
    entryNodeId: 'entry',
    dataFactsMap: new Map(),
    bindings: [],
    params: [],
    calls: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Empty / fallback
// ---------------------------------------------------------------------------

describe('buildDfg – empty/fallback', () => {
  it('returns partial DFG when no CFG nodes', () => {
    const dfg = buildDfg({ ...minBuild(), cfgNodes: [] });
    assert.equal(dfg.partial, true);
    assert.ok(dfg.partialReasons.includes('missing_cfg'));
    assert.equal(dfg.nodes.length, 0);
  });

  it('returns valid DFG version', () => {
    const dfg = buildDfg(minBuild());
    assert.equal(dfg.version, DFG_DTO_VERSION);
  });
});

// ---------------------------------------------------------------------------
// Def/use extraction + reaching edges (straight-line)
// ---------------------------------------------------------------------------

describe('buildDfg – straight-line reaching', () => {
  it('emits a reaching edge from def to use', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['n2']),
        cfgNode('n2', 'statement', ['exit']),
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n2', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_BINDING],
    });
    assert.equal(dfg.partial, false);
    const reachEdges = dfg.edges.filter((e) => e.kind === 'assign' || e.kind === 'reaching');
    assert.ok(reachEdges.length >= 1, 'should have at least one reaching/assign edge');
  });

  it('def killed by redefinition does not reach past the kill', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1', 'statement', ['n2']),  // def x
        cfgNode('n2', 'statement', ['n3']),  // redef x (kills n1's def)
        cfgNode('n3', 'statement', ['exit']),// use x
        cfgNode('exit', 'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n2', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n3', [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_BINDING],
    });
    // The use at n3 should only be reached by n2's def, not n1's
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'n3' && n.kind === 'use');
    assert.ok(useNode, 'use node at n3 should exist');
    const incoming = dfg.edges.filter(
      (e) => e.to === useNode.id && (e.kind === 'assign' || e.kind === 'reaching'),
    );
    for (const edge of incoming) {
      const defNode = dfg.nodes.find((n) => n.id === edge.from);
      assert.equal(defNode.cfgNodeId, 'n2', 'only n2 def should reach n3 use');
    }
  });
});

// ---------------------------------------------------------------------------
// Loop-carried edges
// ---------------------------------------------------------------------------

describe('buildDfg – loop-carried edges', () => {
  it('emits loop_carried edge for back edge', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry',  'entry',       ['header']),
        cfgNode('header', 'loop_header', ['body', 'exit']),
        cfgNode('body',   'statement',   ['latch']),
        cfgNode('latch',  'loop_latch',  ['header']),  // back edge to header
        cfgNode('exit',   'exit',        []),
      ],
      dataFactsMap: new Map([
        ['entry',  [{ bindingId: 'i', op: 'assign', status: 'resolved' }]],
        ['body',   [{ bindingId: 'i', op: 'read',   status: 'resolved' }]],
        ['latch',  [{ bindingId: 'i', op: 'assign', status: 'resolved' }]],
      ]),
      bindings: [{ ...BASE_BINDING, id: 'i', name: 'i' }],
    });
    const loopEdges = dfg.edges.filter((e) => e.kind === 'loop_carried');
    assert.ok(loopEdges.length >= 1, 'expected at least one loop_carried edge');
  });
});

// ---------------------------------------------------------------------------
// Param synthesis
// ---------------------------------------------------------------------------

describe('buildDfg – param synthesis', () => {
  it('synthesizes param site for each parameter', () => {
    const dfg = buildDfg({
      ...minBuild(),
      params: [
        { ...BASE_BINDING, id: 'a', name: 'a', kind: 'param' },
        { ...BASE_BINDING, id: 'b', name: 'b', kind: 'param' },
      ],
    });
    const paramNodes = dfg.nodes.filter((n) => n.kind === 'param');
    assert.equal(paramNodes.length, 2);
  });

  it('marks reference params as possible', () => {
    const dfg = buildDfg({
      ...minBuild(),
      params: [{ ...BASE_BINDING, id: 'ref', name: 'ref', kind: 'param', isReference: true }],
    });
    const pNode = dfg.nodes.find((n) => n.kind === 'param');
    assert.equal(pNode.status, 'possible');
    assert.equal(pNode.reasonCode, 'reference_parameter');
  });
});

// ---------------------------------------------------------------------------
// Limitation detection
// ---------------------------------------------------------------------------

describe('buildDfg – limitations', () => {
  it('adds pointer/alias limitation when reference binding present', () => {
    const dfg = buildDfg({
      ...minBuild(),
      bindings: [{ ...BASE_BINDING, isReference: true }],
    });
    assert.ok(dfg.limitations.some((l) => l.includes('pointer')));
  });

  it('adds eval limitation when eval_scope reason code in facts', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1',    'unmodeled', ['exit']),
        cfgNode('exit',  'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1', [{ bindingId: 'x', op: 'read', status: 'unresolved', reasonCode: 'eval_scope' }]],
      ]),
      bindings: [BASE_BINDING],
    });
    assert.ok(dfg.limitations.some((l) => l.toLowerCase().includes('eval')));
  });
});

// ---------------------------------------------------------------------------
// Conservative kill for unresolved calls
// ---------------------------------------------------------------------------

describe('buildDfg – conservative kill at unresolved call', () => {
  it('no resolved edge produced across unresolved call for reference binding', () => {
    const dfg = buildDfg({
      ...minBuild(),
      cfgNodes: [
        cfgNode('entry', 'entry', ['n1']),
        cfgNode('n1',    'statement', ['callSite']),  // def x
        cfgNode('callSite', 'call',  ['n3']),         // unresolved call
        cfgNode('n3',    'statement', ['exit']),       // use x
        cfgNode('exit',  'exit', []),
      ],
      dataFactsMap: new Map([
        ['n1',       [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['n3',       [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [{ ...BASE_BINDING, isReference: true }],
      calls: [{ callNodeId: 'callSite', status: 'unresolved' }],
    });
    // The use at n3 should not have a `resolved` edge from n1's def
    const useNode = dfg.nodes.find((n) => n.cfgNodeId === 'n3' && n.kind === 'use');
    if (useNode) {
      const incoming = dfg.edges.filter((e) => e.to === useNode.id);
      for (const e of incoming) {
        assert.notEqual(e.status, 'resolved', 'No resolved edge should cross an unresolved call for reference binding');
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------------

describe('buildDfg – determinism', () => {
  it('produces identical nodes/edges across two runs', () => {
    const opts = minBuild({
      dataFactsMap: new Map([
        ['entry', [{ bindingId: 'x', op: 'assign', status: 'resolved' }]],
        ['exit',  [{ bindingId: 'x', op: 'read',   status: 'resolved' }]],
      ]),
      bindings: [BASE_BINDING],
    });
    const a = buildDfg(opts);
    const b = buildDfg(opts);
    assert.deepEqual(
      a.nodes.map((n) => n.id).sort(),
      b.nodes.map((n) => n.id).sort(),
    );
    assert.deepEqual(
      a.edges.map((e) => `${e.from}→${e.to}`).sort(),
      b.edges.map((e) => `${e.from}→${e.to}`).sort(),
    );
  });
});
