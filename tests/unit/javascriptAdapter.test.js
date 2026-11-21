import test from 'node:test';
import assert from 'node:assert/strict';

import {
  JS_ADAPTER_ID,
  JS_EXTENSIONS,
  javascriptAdapter,
} from '../../src/adapters/javascript/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';

test('the JavaScript adapter declares honest capabilities and extensions', () => {
  assert.equal(javascriptAdapter.id, JS_ADAPTER_ID);
  assert.deepEqual(javascriptAdapter.languages, ['javascript']);
  for (const extension of ['.js', '.mjs', '.cjs', '.jsx', '.ts']) {
    assert.ok(JS_EXTENSIONS.includes(extension), extension);
  }
  assert.equal(javascriptAdapter.extensions.includes('.cpp'), false);
  assert.equal(javascriptAdapter.capabilities.parse, 'partial');
  assert.equal(javascriptAdapter.capabilities.discoverDeclarations, true);
  assert.equal(javascriptAdapter.capabilities.resolveTypes, false);
  assert.equal(javascriptAdapter.capabilities.generateCFG, false);
  assert.equal(javascriptAdapter.capabilities.generateDFG, false);
});

test('TypeScript is rejected with a typed diagnostic, never half-parsed', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-ts',
    path: 'src/types.ts',
    text: 'export function typed(value: number): number { return value; }',
  });
  assert.equal(run.completeness, 'partial');
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const diagnostic = run.diagnostics.find((entry) => entry.code === 'unsupported_language');
  assert.ok(diagnostic);
  assert.equal(diagnostic.severity, 'error');
  assert.equal(run.symbols.length, 0);
  assert.equal(run.language, 'typescript');
});

test('JSX is rejected as unsupported syntax with no invented symbols', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-jsx',
    path: 'src/component.jsx',
    text: 'export const view = <div />;',
  });
  assert.equal(run.completeness, 'partial');
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  assert.ok(run.diagnostics.some((entry) => entry.code === 'unsupported_syntax'));
  assert.equal(run.symbols.length, 0);
});

test('a parse error becomes a valid partial run, not an exception', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-parse',
    path: 'src/broken.js',
    text: 'export function broken( {',
    jsModuleKind: 'module',
  });
  assert.equal(run.completeness, 'partial');
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  assert.ok(run.diagnostics.some((entry) => entry.code === 'parse_error'));
});

test('a missing text payload is diagnosed instead of pretending the file is empty', () => {
  const run = javascriptAdapter.analyze({ runId: 'run:js-no-text', path: 'src/app.js' });
  assert.equal(run.completeness, 'partial');
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  assert.ok(run.diagnostics.some((entry) => entry.code === 'source_unavailable'));
});

test('the registry resolves JavaScript extensions and returns the adapter id', async () => {
  const registry = createAdapterRegistry();
  registry.register(javascriptAdapter);

  assert.equal(registry.resolve('src/app.js').id, JS_ADAPTER_ID);
  assert.equal(registry.resolve('src/app.mjs').id, JS_ADAPTER_ID);
  assert.equal(registry.resolve('src/app.cjs').id, JS_ADAPTER_ID);
  assert.equal(registry.resolve('src/app.jsx').id, JS_ADAPTER_ID);
  assert.equal(registry.resolve('src/app.cpp'), null);

  const result = await registry.analyze({
    runId: 'run:js-registry',
    path: 'src/app.js',
    text: 'export const value = 1;',
    jsModuleKind: 'module',
  });
  assert.equal(result.ok, true);
  assert.equal(result.adapterId, JS_ADAPTER_ID);
  assert.equal(result.run.language, 'javascript');
});
