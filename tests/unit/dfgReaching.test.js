import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  computeGenKill,
  reachingDefinitions,
  findBackEdges,
  encodeDefKey,
  decodeDefKey,
} from '../../src/core/graph/dfg/reaching.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal CfgNodeShim.
 *
 * @param {string} id
 * @param {string[]} successors
 * @param {string[]} [predecessors]
 */
function node(id, successors = [], predecessors = []) {
  return { id, kind: 'statement', successors, predecessors };
}

// ---------------------------------------------------------------------------
// encodeDefKey / decodeDefKey
// ---------------------------------------------------------------------------

describe('encodeDefKey / decodeDefKey', () => {
  it('round-trips', () => {
    const key = encodeDefKey('x', 'flow:x@n1#0');
    const { bindingId, flowNodeId } = decodeDefKey(key);
    assert.equal(bindingId, 'x');
    assert.equal(flowNodeId, 'flow:x@n1#0');
  });

  it('distinguishes different bindings', () => {
    assert.notEqual(encodeDefKey('a', 'fn1'), encodeDefKey('b', 'fn1'));
  });
});

// ---------------------------------------------------------------------------
// computeGenKill – straight-line
// ---------------------------------------------------------------------------

describe('computeGenKill – straight-line', () => {
  it('GEN contains the last def for a binding', () => {
    const nodes = [node('n1', ['n2']), node('n2', [])];
    const defsPerNode = new Map([
      ['n1', [{ bindingId: 'x', flowNodeId: 'flow:x@n1#0', cfgNodeId: 'n1', status: 'resolved' }]],
      ['n2', []],
    ]);
    const { gen, kill } = computeGenKill(nodes, defsPerNode);
    assert.ok(gen.get('n1').has(encodeDefKey('x', 'flow:x@n1#0')));
    assert.equal(kill.get('n1').size, 0); // no other defs for x
  });

  it('KILL at n2 removes n1 def when n2 redefines x', () => {
    const nodes = [node('n1', ['n2']), node('n2', [])];
    const defsPerNode = new Map([
      ['n1', [{ bindingId: 'x', flowNodeId: 'flow:x@n1#0', cfgNodeId: 'n1', status: 'resolved' }]],
      ['n2', [{ bindingId: 'x', flowNodeId: 'flow:x@n2#0', cfgNodeId: 'n2', status: 'resolved' }]],
    ]);
    const { kill } = computeGenKill(nodes, defsPerNode);
    // n2 kills n1's def
    assert.ok(kill.get('n2').has(encodeDefKey('x', 'flow:x@n1#0')));
    // n1 kills n2's def (all other defs)
    assert.ok(kill.get('n1').has(encodeDefKey('x', 'flow:x@n2#0')));
  });
});

// ---------------------------------------------------------------------------
// reachingDefinitions – straight-line
// ---------------------------------------------------------------------------

