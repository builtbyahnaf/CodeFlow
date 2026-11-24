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

