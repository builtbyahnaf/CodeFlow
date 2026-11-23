import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { runConformanceSuite } from './harness.js';

const source = await fs.readFile(
  new URL('../fixtures/javascript/unicode.js', import.meta.url),
  'utf8',
);

/**
 * The conformance harness calls an adapter with only `{path, runId}`. The host
 * normally supplies text and the module kind; this wrapper does the same thing
 * with a committed fixture so the suite exercises real mapping.
 */
const fixtureAdapter = {
  ...javascriptAdapter,
  analyze(input) {
    return javascriptAdapter.analyze({
      ...input,
      text: source,
      jsModuleKind: 'module',
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

test('the JavaScript adapter passes the same conformance rules as the mock and C++', async () => {
  const suite = await runConformanceSuite({
    name: 'javascript',
    adapter: fixtureAdapter,
    sourceFile: 'src/adapters/javascript/index.js',
    fixturePath: 'src/unicode.js',
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

test('the JavaScript adapter claims CFG but not C++ or DFG support', () => {
  assert.equal(javascriptAdapter.extensions.includes('.cpp'), false);
  assert.equal(javascriptAdapter.extensions.includes('.js'), true);
  assert.equal(javascriptAdapter.capabilities.generateCFG, true);
  assert.equal(javascriptAdapter.capabilities.generateDFG, false);
  assert.equal(javascriptAdapter.capabilities.parse, 'partial');
});
