import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import { detectCallCycles } from '../../src/core/graph/calls/cycles.js';

test('detectCallCycles identifies direct self-recursion and mutual recursion cycles', () => {
  const nodes = [{ id: 'fn:a' }, { id: 'fn:b' }, { id: 'fn:c' }, { id: 'fn:d' }];
  const edges = [
    { id: 'e:self', from: 'fn:a', to: 'fn:a' },
    { id: 'e:bc', from: 'fn:b', to: 'fn:c' },
    { id: 'e:cb', from: 'fn:c', to: 'fn:b' },
    { id: 'e:cd', from: 'fn:c', to: 'fn:d' },
  ];

  const result = detectCallCycles(nodes, edges);
  assert.equal(result.cycleEdgeIds.has('e:self'), true);
  assert.equal(result.cycleEdgeIds.has('e:bc'), true);
  assert.equal(result.cycleEdgeIds.has('e:cb'), true);
  assert.equal(result.cycleEdgeIds.has('e:cd'), false);

  assert.equal(result.cyclicSymbolIds.has('fn:a'), true);
  assert.equal(result.cyclicSymbolIds.has('fn:b'), true);
  assert.equal(result.cyclicSymbolIds.has('fn:c'), true);
  assert.equal(result.cyclicSymbolIds.has('fn:d'), false);

  assert.equal(
    result.cycles.some((c) => c.kind === 'self' && c.members.includes('fn:a')),
    true,
  );
  assert.equal(
    result.cycles.some(
      (c) => c.kind === 'mutual' && c.members.includes('fn:b') && c.members.includes('fn:c'),
    ),
    true,
  );
});

test('a diamond DAG reports zero cycles', () => {
  const nodes = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const edges = [
    { id: 'e1', from: 'a', to: 'b' },
    { id: 'e2', from: 'a', to: 'c' },
    { id: 'e3', from: 'b', to: 'd' },
    { id: 'e4', from: 'c', to: 'd' },
  ];

  const result = detectCallCycles(nodes, edges);
  assert.equal(result.cycles.length, 0);
  assert.equal(result.cycleEdgeIds.size, 0);
  assert.equal(result.cyclicSymbolIds.size, 0);
});

test('cycle detection over 500 nodes and 1000 edges completes well under 100 ms', () => {
  const nodes = Array.from({ length: 500 }, (_, i) => ({ id: `fn:${i}` }));
  const edges = [];
  for (let i = 0; i < 499; i += 1) {
    edges.push({ id: `e:seq:${i}`, from: `fn:${i}`, to: `fn:${i + 1}` });
  }
  for (let i = 0; i < 450; i += 10) {
    edges.push({ id: `e:back:${i}`, from: `fn:${i + 3}`, to: `fn:${i}` });
  }

  const t0 = performance.now();
  const result = detectCallCycles(nodes, edges);
  const elapsed = performance.now() - t0;

  assert.ok(result.cycles.length >= 45);
  assert.ok(elapsed < 100, `expected < 100 ms, took ${elapsed.toFixed(2)} ms`);
});
