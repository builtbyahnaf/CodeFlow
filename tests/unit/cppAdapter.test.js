import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { CPP_ADAPTER_ID, CPP_EXTENSIONS, cppAdapter } from '../../src/adapters/cpp/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import { validateAnalysisRun } from '../../src/core/csr/entities.js';

const astText = await fs.readFile(
  new URL('../fixtures/cpp/ast-basic.json', import.meta.url),
  'utf8',
);
const sourceText = await fs.readFile(new URL('../fixtures/cpp/basic.cpp', import.meta.url), 'utf8');

test('the C++ adapter declares its real capabilities and extensions', () => {
  assert.equal(cppAdapter.id, CPP_ADAPTER_ID);
  assert.deepEqual(cppAdapter.languages, ['cpp']);
  for (const extension of ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h', '.ipp']) {
    assert.ok(CPP_EXTENSIONS.includes(extension), extension);
  }
  assert.equal(cppAdapter.extensions.includes('.js'), false);
  assert.equal(cppAdapter.capabilities.parse, 'partial');
  assert.equal(cppAdapter.capabilities.resolveCalls, 'partial');
  assert.equal(cppAdapter.capabilities.generateCFG, true);
});

test('the adapter maps a host-supplied AST into CSR', () => {
  const run = cppAdapter.analyze({
    runId: 'run:cpp-adapter-1',
    path: 'src/main.cpp',
    text: sourceText,
    workspaceRoot: 'D:/w',
    cppAst: astText,
    cppMode: 'compile-db',
  });
  assert.equal(run.adapterId, CPP_ADAPTER_ID);
  assert.equal(run.completeness, 'full');
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('a missing AST degrades to a diagnosed, partial run', () => {
  const run = cppAdapter.analyze({
    runId: 'run:cpp-adapter-2',
    path: 'src/main.cpp',
    text: sourceText,
    workspaceRoot: 'D:/w',
  });
  assert.equal(run.completeness, 'partial');
  assert.ok(run.diagnostics.some((diagnostic) => diagnostic.code === 'parse_error'));
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('the registry resolves C++ files and rejects the adapter input cleanly', async () => {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);

  assert.equal(registry.resolve('src/main.cpp').id, CPP_ADAPTER_ID);
  assert.equal(registry.resolve('src/main.cc').id, CPP_ADAPTER_ID);
  assert.equal(registry.resolve('include/widget.hpp').id, CPP_ADAPTER_ID);
  assert.equal(registry.resolve('src/main.rs'), null);

  const result = await registry.analyze({
    runId: 'run:cpp-adapter-3',
    path: 'src/main.cpp',
    text: sourceText,
    workspaceRoot: 'D:/w',
    cppAst: JSON.parse(astText),
  });
  assert.equal(result.ok, true);
  assert.equal(result.adapterId, CPP_ADAPTER_ID);
  assert.equal(result.run.language, 'cpp');
});
