import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { validateDfg, createEmptyDfg, dfgCacheKey, makeFlowNodeId } from '../../src/core/graph/dfg/model.js';
import { DFG_DTO_VERSION } from '../../src/core/graph/dfg/kinds.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeNode(overrides = {}) {
  return {
    id: 'flow:x@n1#0',
    bindingId: 'x',
    cfgNodeId: 'n1',
    kind: 'def',
    range: null,
    status: 'resolved',
    ...overrides,
  };
}

function makeEdge(overrides = {}) {
  return {
    from: 'flow:x@n1#0',
    to:   'flow:x@n2#0',
    kind: 'reaching',
    status: 'resolved',
    ...overrides,
  };
}

function minDfg(overrides = {}) {
  return {
    functionId: 'fn:foo',
    fileId: 'file:src/a.js',
    nodes: [],
    edges: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// makeFlowNodeId
// ---------------------------------------------------------------------------

describe('makeFlowNodeId', () => {
  it('produces the canonical scheme', () => {
    assert.equal(makeFlowNodeId('x', 'n1', 0), 'flow:x@n1#0');
    assert.equal(makeFlowNodeId('a.b', 'cfg:entry', 3), 'flow:a.b@cfg:entry#3');
  });
});

// ---------------------------------------------------------------------------
// validateDfg – structural
// ---------------------------------------------------------------------------

describe('validateDfg – structural', () => {
  it('rejects null', () => {
    const r = validateDfg(null);
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.code === 'E_DFG_NOT_OBJECT'));
  });

  it('rejects array', () => {
    const r = validateDfg([]);
    assert.equal(r.ok, false);
  });

  it('rejects missing functionId', () => {
    const r = validateDfg({ fileId: 'f', nodes: [], edges: [] });
    assert.equal(r.ok, false);
    assert.ok(r.issues.some((i) => i.code === 'E_DFG_BAD_FUNCTION'));
  });

  it('accepts minimal valid DFG', () => {
    const r = validateDfg(minDfg());
    assert.equal(r.ok, true);
    assert.ok(r.dfg);
    assert.equal(r.dfg.version, DFG_DTO_VERSION);
  });

  it('builds byBinding index', () => {
    const r = validateDfg({
      ...minDfg(),
      nodes: [
        makeNode({ id: 'flow:x@n1#0', bindingId: 'x', cfgNodeId: 'n1' }),
        makeNode({ id: 'flow:x@n2#0', bindingId: 'x', cfgNodeId: 'n2', kind: 'use' }),
        makeNode({ id: 'flow:y@n1#0', bindingId: 'y', cfgNodeId: 'n1' }),
      ],
      edges: [],
    });
    assert.equal(r.ok, true);
    assert.equal(r.dfg.byBinding['x'].length, 2);
    assert.equal(r.dfg.byBinding['y'].length, 1);
  });
});

// ---------------------------------------------------------------------------
// validateDfg – node validation
// ---------------------------------------------------------------------------

