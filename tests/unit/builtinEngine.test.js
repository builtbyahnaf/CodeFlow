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

test('parseCppSource extracts while loop constructs with condition ranges', () => {
  const code = `
void countdown(int n) {
  while (n > 0) {
    n = n - 1;
  }
}
`;
  const run = parseCppSource({ runId: 'run:4', path: 'src/loop.cpp', text: code });
  const whileCc = run.controlConstructs.find((cc) => cc.kind === 'while');
  assert.ok(whileCc);
  assert.ok(whileCc.condition);
});

test('parseCppSource extracts for loop constructs with iteration metadata', () => {
  const code = `
int sum(int n) {
  int total = 0;
  for (int i = 0; i < n; ++i) {
    total += i;
  }
  return total;
}
`;
  const run = parseCppSource({ runId: 'run:5', path: 'src/for.cpp', text: code });
  const forCc = run.controlConstructs.find((cc) => cc.kind === 'for');
  assert.ok(forCc);
  assert.equal(forCc.extensions?.hasInit, true);
  assert.equal(forCc.extensions?.hasCondition, true);
});

test('parseCppSource extracts switch, case, and default branches', () => {
  const code = `
int eval(int op) {
  switch (op) {
    case 1: return 10;
    case 2: return 20;
    default: return -1;
  }
}
`;
  const run = parseCppSource({ runId: 'run:6', path: 'src/switch.cpp', text: code });
  const kinds = run.controlConstructs.map((cc) => cc.kind);
  assert.ok(kinds.includes('switch'));
  assert.ok(kinds.includes('case'));
  assert.ok(kinds.includes('default'));
});
