import test from 'node:test';
import assert from 'node:assert/strict';

import { mockAdapter } from '../../src/adapters/mock/index.js';
import { runConformanceSuite } from './harness.js';

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

test('the mock adapter passes every conformance rule', async () => {
  const suite = await runConformanceSuite({
    name: 'mock',
    adapter: mockAdapter,
    sourceFile: 'src/adapters/mock/index.js',
    fixturePath: 'sample.mock',
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
});

test('the mock adapter claims only what it can do', () => {
  assert.deepEqual(mockAdapter.extensions, ['.mock']);
  assert.ok(!mockAdapter.extensions.includes('.js'));
  assert.ok(!mockAdapter.extensions.includes('.cpp'));
  assert.equal(mockAdapter.capabilities.generateCFG, false);
  assert.equal(mockAdapter.capabilities.generateDFG, false);
});
