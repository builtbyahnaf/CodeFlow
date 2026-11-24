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
