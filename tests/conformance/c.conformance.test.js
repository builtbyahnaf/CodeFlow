import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { cAdapter } from '../../src/adapters/c/index.js';
import { runConformanceSuite } from './harness.js';

const source = await fs.readFile(new URL('../fixtures/c/unicode.c', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/c/ast-unicode.json', import.meta.url), 'utf8');

/**
 * Conformance wrapper supplying text and AST fixtures.
 */
const fixtureAdapter = {
  ...cAdapter,
  analyze(input) {
    return cAdapter.analyze({
      ...input,
      text: source,
      workspaceRoot: 'D:/w',
      cAst: ast,
      cMode: 'compile-db',
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

test('the C adapter passes the same conformance rules as mock, cpp, and js', async () => {
  const suite = await runConformanceSuite({
    name: 'c',
    adapter: fixtureAdapter,
    sourceFile: 'src/adapters/c/index.js',
    fixturePath: 'src/unicode.c',
  });

  const failed = suite.results.filter((entry) => !entry.passed);
  assert.deepEqual(
    failed.map((entry) => `${entry.id}: ${entry.detail}`),
    [],
    'every conformance rule must pass for C adapter',
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

test('the C adapter claims CFG and C extensions but not DFG or JS', () => {
  assert.equal(cAdapter.extensions.includes('.js'), false);
  assert.equal(cAdapter.extensions.includes('.c'), true);
  assert.equal(cAdapter.extensions.includes('.h'), true);
  assert.equal(cAdapter.capabilities.generateCFG, true);
  assert.equal(cAdapter.capabilities.generateDFG, false);
  assert.equal(cAdapter.capabilities.parse, 'partial');
});
