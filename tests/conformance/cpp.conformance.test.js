import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { cppAdapter } from '../../src/adapters/cpp/index.js';
import { runConformanceSuite } from './harness.js';

const source = await fs.readFile(new URL('../fixtures/cpp/unicode.cpp', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/cpp/ast-unicode.json', import.meta.url), 'utf8');

/**
 * The conformance harness calls an adapter with only `{path, runId}`. The host
 * normally supplies the AST; this wrapper does the same thing with a committed
 * fixture so the suite exercises real mapping, not an empty fallback.
 */
const fixtureAdapter = {
  ...cppAdapter,
  analyze(input) {
    return cppAdapter.analyze({
      ...input,
      text: source,
      workspaceRoot: 'D:/w',
      cppAst: ast,
      cppMode: 'compile-db',
    });
  },
};

const RULE_IDS = [
  'C-01',
  'C-02',
  'C-03',
  'C-04',
  'C-05',
  'C-06',
  'C-07',
  'C-08',
  'C-09',
  'C-10',
  'C-11',
  'C-12',
];

test('the C++ adapter passes the same conformance rules as the mock', async () => {
  const suite = await runConformanceSuite({
    name: 'cpp',
    adapter: fixtureAdapter,
    sourceFile: 'src/adapters/cpp/index.js',
    fixturePath: 'src/unicode.cpp',
  });

  const failed = suite.results.filter((entry) => !entry.passed);
  assert.deepEqual(
    failed.map((entry) => `${entry.id}: ${entry.detail}`),
    [],
    'every conformance rule must pass',
  );
  assert.deepEqual(
    suite.results.map((entry) => entry.id),
    RULE_IDS,
    'the suite reports every rule in order',
  );
  assert.equal(suite.passed, true);

  const encoding = suite.results.find((entry) => entry.id === 'C-12');
  assert.match(encoding.detail, /naïve/);
});

test('the C++ adapter claims CFG but not DFG or JavaScript support', () => {
  assert.equal(cppAdapter.extensions.includes('.js'), false);
  assert.equal(cppAdapter.extensions.includes('.cpp'), true);
  assert.equal(cppAdapter.capabilities.generateCFG, true);
  assert.equal(cppAdapter.capabilities.generateDFG, false);
  assert.equal(cppAdapter.capabilities.parse, 'partial');
});
