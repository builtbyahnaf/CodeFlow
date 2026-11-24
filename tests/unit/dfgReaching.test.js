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

describe('reachingDefinitions – straight-line', () => {
  it('propagates def to successor', () => {
    const nodes = [node('entry', ['n1']), node('n1', ['exit']), node('exit', [])];
    const defsPerNode = new Map([
      ['entry', [{ bindingId: 'x', flowNodeId: 'flow:x@entry#0', cfgNodeId: 'entry', status: 'resolved' }]],
      ['n1', []],
      ['exit', []],
    ]);
    const { gen, kill } = computeGenKill(nodes, defsPerNode);
    const result = reachingDefinitions(nodes, gen, kill);
    assert.equal(result.partial, false);
    // def reaches exit
    assert.ok(result.inSets.get('exit').has(encodeDefKey('x', 'flow:x@entry#0')));
  });

  it('def killed by redefinition does not reach past kill', () => {
    // entry -def x-> n1 -redef x-> exit
    const nodes = [node('entry', ['n1']), node('n1', ['exit']), node('exit', [])];
    const defsPerNode = new Map([
      ['entry', [{ bindingId: 'x', flowNodeId: 'flow:x@entry#0', cfgNodeId: 'entry', status: 'resolved' }]],
      ['n1',    [{ bindingId: 'x', flowNodeId: 'flow:x@n1#0',    cfgNodeId: 'n1',    status: 'resolved' }]],
      ['exit', []],
    ]);
    const { gen, kill } = computeGenKill(nodes, defsPerNode);
    const result = reachingDefinitions(nodes, gen, kill);
    // only n1's def reaches exit
    assert.ok( result.inSets.get('exit').has(encodeDefKey('x', 'flow:x@n1#0')));
    assert.ok(!result.inSets.get('exit').has(encodeDefKey('x', 'flow:x@entry#0')));
  });

  it('two defs merge at join node', () => {
    // entry -> true_br -> merge
    //       -> false_br -> merge
    const nodes = [
      node('entry',     ['true_br', 'false_br']),
      node('true_br',   ['merge']),
      node('false_br',  ['merge']),
      node('merge',     []),
    ];
    const defsPerNode = new Map([
      ['entry',    []],
      ['true_br',  [{ bindingId: 'x', flowNodeId: 'flow:x@true_br#0',  cfgNodeId: 'true_br',  status: 'resolved' }]],
      ['false_br', [{ bindingId: 'x', flowNodeId: 'flow:x@false_br#0', cfgNodeId: 'false_br', status: 'resolved' }]],
      ['merge',    []],
    ]);
    const { gen, kill } = computeGenKill(nodes, defsPerNode);
    const result = reachingDefinitions(nodes, gen, kill);
    // Both defs reach merge
    assert.ok(result.inSets.get('merge').has(encodeDefKey('x', 'flow:x@true_br#0')));
    assert.ok(result.inSets.get('merge').has(encodeDefKey('x', 'flow:x@false_br#0')));
  });

  it('budget exhaustion returns partial=true', () => {
    // Build a large-ish cycle to exhaust iteration budget
    const nodes = Array.from({ length: 5 }, (_, i) => node(`n${i}`, [`n${(i + 1) % 5}`]));
    const defsPerNode = new Map(
      nodes.map((n) => [n.id, [{ bindingId: 'x', flowNodeId: `flow:x@${n.id}#0`, cfgNodeId: n.id, status: 'resolved' }]])
    );
    const { gen, kill } = computeGenKill(nodes, defsPerNode);
    const result = reachingDefinitions(nodes, gen, kill, 1, 0); // budget = 1 iteration
    assert.equal(result.partial, true);
    assert.equal(result.partialReason, 'flow_budget_exceeded');
  });
});

// ---------------------------------------------------------------------------
// findBackEdges
// ---------------------------------------------------------------------------

describe('findBackEdges', () => {
  it('finds no back edges in a DAG', () => {
    const nodes = [node('a', ['b']), node('b', ['c']), node('c', [])];
    const back = findBackEdges(nodes, 'a');
    assert.equal(back.length, 0);
  });

  it('finds the back edge in a simple loop', () => {
    // entry -> body -> latch -> body (back edge)
    const nodes = [
      node('entry', ['body']),
      node('body',  ['latch']),
      node('latch', ['body', 'exit']),
      node('exit',  []),
    ];
    const back = findBackEdges(nodes, 'entry');
    assert.ok(back.some((e) => e.from === 'latch' && e.to === 'body'));
  });

  it('finds back edge in a self-loop', () => {
    const nodes = [node('a', ['a', 'b']), node('b', [])];
    const back = findBackEdges(nodes, 'a');
    assert.ok(back.some((e) => e.from === 'a' && e.to === 'a'));
  });
});
