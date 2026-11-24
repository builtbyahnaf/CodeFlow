import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javaAdapter } from '../../src/adapters/java/index.js';
import { runConformanceSuite } from './harness.js';

const source = await fs.readFile(new URL('../fixtures/java/unicode.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-unicode.json', import.meta.url), 'utf8');

/**
 * Conformance wrapper supplying text and AST fixtures.
 */
const fixtureAdapter = {
  ...javaAdapter,
  analyze(input) {
    return javaAdapter.analyze({
      ...input,
      text: source,
      workspaceRoot: 'D:/w',
      javaAst: ast,
      javaMode: 'compile-db',
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

test('the Java adapter passes the same conformance rules as mock, cpp, and c', async () => {
  const suite = await runConformanceSuite({
    name: 'java',
    adapter: fixtureAdapter,
    sourceFile: 'src/adapters/java/index.js',
    fixturePath: 'src/UnicodeTest.java',
  });

  const failed = suite.results.filter((entry) => !entry.passed);
  assert.deepEqual(
    failed.map((entry) => `${entry.id}: ${entry.detail}`),
    [],
    'every conformance rule must pass for Java adapter',
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

test('the Java adapter claims CFG and Java extensions but not DFG or C++', () => {
  assert.equal(javaAdapter.extensions.includes('.js'), false);
  assert.equal(javaAdapter.extensions.includes('.cpp'), false);
  assert.equal(javaAdapter.extensions.includes('.java'), true);
  assert.equal(javaAdapter.capabilities.generateCFG, true);
  assert.equal(javaAdapter.capabilities.generateDFG, false);
  assert.equal(javaAdapter.capabilities.parse, 'partial');
});
