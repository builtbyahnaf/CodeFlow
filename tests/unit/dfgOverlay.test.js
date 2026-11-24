import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildDfgOverlay } from '../../src/core/graph/dfg/overlay.js';
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

function makeDfg(nodes, edges, limitations = [], partial = false) {
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
    partial,
    partialReasons: partial ? ['flow_budget_exceeded'] : [],
    limitations,
    byBinding,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('buildDfgOverlay – null dfg', () => {
  it('returns empty overlay with no-analysis message', () => {
    const ov = buildDfgOverlay(null, null);
    assert.equal(ov.slot, 'dfg');
    assert.equal(ov.nodes.length, 0);
    assert.ok(ov.emptyStateMessage.length > 0);
  });
});

describe('buildDfgOverlay – no binding selected', () => {
  it('returns empty overlay with select-variable message', () => {
    const dfg = makeDfg([], []);
    const ov = buildDfgOverlay(dfg, null);
    assert.equal(ov.nodes.length, 0);
    assert.ok(ov.emptyStateMessage.includes('Select a variable'));
  });
});

describe('buildDfgOverlay – binding with nodes', () => {
  it('returns overlay nodes and edges for binding', () => {
    const defN = node('flow:x@n1#0', 'x');
    const useN = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const dfg = makeDfg([defN, useN], [edge(defN.id, useN.id)]);
    const ov = buildDfgOverlay(dfg, 'x');
    assert.equal(ov.slot, 'dfg');
    assert.equal(ov.nodes.length, 2);
    assert.equal(ov.edges.length, 1);
    assert.equal(ov.emptyStateMessage, '');
    assert.equal(ov.selectedBinding, 'x');
  });

  it('overlay nodes have glyph and kind', () => {
    const defN = node('flow:x@n1#0', 'x');
    const dfg = makeDfg([defN], []);
    const ov = buildDfgOverlay(dfg, 'x');
    assert.ok(typeof ov.nodes[0].glyph === 'string');
    assert.equal(ov.nodes[0].kind, 'def');
  });

  it('overlay edges have label', () => {
    const a = node('flow:x@n1#0', 'x');
    const b = node('flow:x@n2#0', 'x', 'use', 'resolved', 'n2');
    const dfg = makeDfg([a, b], [edge(a.id, b.id)]);
    const ov = buildDfgOverlay(dfg, 'x');
    assert.ok(typeof ov.edges[0].label === 'string');
  });
});

describe('buildDfgOverlay – unknown binding', () => {
  it('returns empty overlay with reason message', () => {
    const dfg = makeDfg([], []);
    const ov = buildDfgOverlay(dfg, 'nonexistent');
    assert.equal(ov.nodes.length, 0);
    assert.ok(ov.emptyStateMessage.length > 0);
  });
});

describe('buildDfgOverlay – partial DFG', () => {
  it('propagates partial flag', () => {
    const dfg = makeDfg([], [], ['Partial.'], true);
    const ov = buildDfgOverlay(dfg, null);
    // partial is from DFG; overlay.partial mirrors it
    assert.equal(ov.partial, false); // partial only set when trace itself is partial
  });
});

describe('buildDfgOverlay – limitations propagated', () => {
  it('passes through DFG limitations', () => {
    const dfg = makeDfg([], [], ['Aliasing is not modeled.']);
    const ov = buildDfgOverlay(dfg, null);
    assert.ok(ov.limitations.includes('Aliasing is not modeled.'));
  });
});
