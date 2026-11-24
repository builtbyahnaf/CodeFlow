import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCppSource } from '../../src/adapters/cpp/builtinEngine.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import { cppAdapter } from '../../src/adapters/cpp/index.js';

test('built-in fallback engine provides seamless analysis when Clang is absent', () => {
  const code = `
int calculate(int a, int b) {
  if (a > b) return a;
  return b;
}
`;
  const run = parseCppSource({
    runId: 'run:fallback-test',
    path: 'src/main.cpp',
    text: code,
    language: 'cpp',
  });
  assert.equal(run.adapterId, 'cpp-clang');
  assert.equal(run.completeness, 'partial');
  assert.ok(run.diagnostics.some((d) => d.code === 'builtin_engine'));
  const fn = run.symbols.find((s) => s.name === 'calculate');
  assert.ok(fn);
  assert.equal(fn.kind, 'function');

  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const query = registry.query(run);
  const fns = query.cfgFunctions();
  assert.equal(fns.ok, true);
  assert.equal(fns.functions.length, 1);
});
