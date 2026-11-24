import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCppSource } from '../../src/adapters/cpp/builtinEngine.js';

test('parseCppSource extracts functions from basic source text', () => {
  const code = 'int add(int a, int b) { return a + b; }';
  const run = parseCppSource({ runId: 'run:1', path: 'src/calc.cpp', text: code });
  const fn = run.symbols.find((s) => s.name === 'add');
  assert.ok(fn);
  assert.equal(fn.kind, 'function');
  assert.equal(fn.qualifiedName, 'add');
});

test('parseCppSource handles multiple functions and preserves order', () => {
  const code = `
int square(int x) { return x * x; }
int cube(int x) { return x * square(x); }
`;
  const run = parseCppSource({ runId: 'run:2', path: 'src/math.cpp', text: code });
  const names = run.symbols.filter((s) => s.kind === 'function').map((s) => s.name);
  assert.deepEqual(names, ['square', 'cube']);
});

test('parseCppSource extracts if and if-else control constructs', () => {
  const code = `
int clamp(int v, int lo, int hi) {
  if (v < lo) {
    return lo;
  }
  return hi;
}
`;
  const run = parseCppSource({ runId: 'run:3', path: 'src/clamp.cpp', text: code });
  const ifConstruct = run.controlConstructs.find((cc) => cc.kind === 'if');
  assert.ok(ifConstruct);
  assert.ok(ifConstruct.condition);
});
