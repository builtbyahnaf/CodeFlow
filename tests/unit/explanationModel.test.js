import test from 'node:test';
import assert from 'node:assert/strict';

import {
  RULESET_VERSION,
  assembleFragments,
  createEvidenceRef,
  explanationId,
  validateExplanationItem,
} from '../../src/core/explanation/model.js';
import { createExplanationCache } from '../../src/core/explanation/cache.js';

test('validateExplanationItem enforces non-empty evidence, valid depth, and plain text', () => {
  const ref = createEvidenceRef({ kind: 'source', id: 'file:a:1:0-1:5', label: 'line 2' });
  assert.ok(ref);

  const valid = validateExplanationItem({
    id: explanationId('n1', 'stmt.generic', 1),
    subjectId: 'n1',
    topic: 'statement',
    depth: 1,
    text: 'Executes statement `x = 1`.',
    evidence: [ref],
    claim: 'grounded',
    status: 'resolved',
    ruleId: 'stmt.generic',
    rulesetVersion: RULESET_VERSION,
  });
  assert.equal(valid.ok, true);

  const missingEvidence = validateExplanationItem({
    id: 'exp:1',
    subjectId: 'n1',
    topic: 'statement',
    depth: 1,
    text: 'Executes statement.',
    evidence: [],
    claim: 'grounded',
    ruleId: 'stmt.generic',
    rulesetVersion: RULESET_VERSION,
  });
  assert.equal(missingEvidence.ok, false);
  assert.equal(missingEvidence.code, 'E_EXPLANATION');

  const badDepth = validateExplanationItem({
    id: 'exp:1',
    subjectId: 'n1',
    topic: 'statement',
    depth: 9,
    text: 'Executes statement.',
    evidence: [ref],
    claim: 'grounded',
    ruleId: 'stmt.generic',
    rulesetVersion: RULESET_VERSION,
  });
  assert.equal(badDepth.ok, false);

  const htmlText = validateExplanationItem({
    id: 'exp:1',
    subjectId: 'n1',
    topic: 'statement',
    depth: 1,
    text: '<b>Executes</b> statement.',
    evidence: [ref],
    claim: 'grounded',
    ruleId: 'stmt.generic',
    rulesetVersion: RULESET_VERSION,
  });
  assert.equal(htmlText.ok, false);
});

test('assembleFragments drops fragments lacking valid evidence and dedupes refs', () => {
  const ref = createEvidenceRef({ kind: 'source', id: 'r1', label: 'line 1' });
  const assembled = assembleFragments([
    { text: 'First grounded sentence', evidence: [ref] },
    { text: 'Unsupported fragment', evidence: [] },
    { text: '<b>HTML fragment</b>', evidence: [ref] },
    { text: 'Second grounded sentence', evidence: [ref] },
  ]);
  assert.equal(assembled.droppedCount, 2);
  assert.equal(assembled.text, 'First grounded sentence. Second grounded sentence.');
  assert.equal(assembled.evidence.length, 1);
});

test('explanation cache isolates runs, ruleset versions, depth, and staleness', () => {
  const cache = createExplanationCache({ maxEntries: 4 });
  const key = {
    runId: 'run:1',
    rulesetVersion: '1.0.0',
    depth: 2,
    stale: false,
    subjectKey: 'node:n1',
  };
  assert.equal(cache.get(key), undefined);
  cache.set(key, { text: 'cached' });
  assert.deepEqual(cache.get(key), { text: 'cached' });
  assert.equal(cache.get({ ...key, depth: 3 }), undefined);
  assert.equal(cache.get({ ...key, rulesetVersion: '1.0.1' }), undefined);
  assert.equal(cache.get({ ...key, stale: true }), undefined);
  assert.equal(cache.get({ ...key, runId: 'run:2' }), undefined);

  assert.equal(cache.invalidateRun('run:1'), 1);
  assert.equal(cache.get(key), undefined);
});
