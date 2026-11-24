import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ensureStatusQualification,
  formatLimitations,
  lintExplanationText,
  qualifyStatus,
} from '../../src/core/explanation/phrasing.js';

test('qualifyStatus emits mandatory uncertainty phrases for non-resolved statuses', () => {
  assert.equal(qualifyStatus('resolved', { action: 'Calls `foo`' }), 'Calls `foo`');
  assert.match(qualifyStatus('inferred', { basis: 'same-file type' }), /inferred from same-file type/);
  assert.match(qualifyStatus('possible', { count: 3 }), /3 possible targets/);
  assert.match(qualifyStatus('unresolved', { reason: 'computed_member' }), /could not be resolved \(computed_member\)/);
  assert.match(qualifyStatus('stale'), /based on source before the last edit/);
});

test('prohibited-language linter rejects advice, certainty overclaims, unproven algorithms, and status mismatches', () => {
  for (const bad of [
    'You should refactor this loop.',
    'Consider refactoring into smaller helpers.',
    'This branch will execute on every call.',
    'The loop always terminates.',
    'Implements quicksort over the array.',
    'Uses binary search to locate the element.',
    'Calls `save()` which saves to the database.',
  ]) {
    const res = lintExplanationText(bad);
    assert.equal(res.ok, false, `expected rejection for "${bad}"`);
  }

  assert.equal(
    lintExplanationText('Calls `helper` (resolved).', { status: 'resolved' }).ok,
    true,
  );
  assert.equal(
    lintExplanationText('Calls `helper` (may call target).', { status: 'resolved' }).ok,
    false,
  );
  assert.equal(
    lintExplanationText('Calls `helper`.', { status: 'possible' }).ok,
    false,
  );
  assert.equal(
    lintExplanationText('Calls `helper`.', { status: 'unresolved' }).ok,
    false,
  );
  assert.equal(
    lintExplanationText('Calls `helper`.', { status: 'inferred' }).ok,
    false,
  );
  assert.equal(
    lintExplanationText('Calls `helper`.', { status: 'stale' }).ok,
    false,
  );
});

test('stale qualification is applied centrally without inventing other statuses', () => {
  assert.equal(
    ensureStatusQualification('Returns `sum`.', 'stale'),
    'Returns `sum`, based on source before the last edit.',
  );
  // Already-qualified text is left alone, so a rule can phrase it itself.
  const qualified = 'Returns `sum`, based on source before the last edit.';
  assert.equal(ensureStatusQualification(qualified, 'stale'), qualified);
  // Non-stale statuses never get a fabricated qualification.
  assert.equal(ensureStatusQualification('Returns `sum`.', 'resolved'), 'Returns `sum`.');
  assert.equal(ensureStatusQualification('Returns `sum`.', 'inferred'), 'Returns `sum`.');
});

test('formatLimitations returns honest disclosures for partial, unresolved, unmodeled, or stale subjects', () => {
  assert.equal(formatLimitations({ completeness: 'full', unresolvedEdges: 0, unmodeledCount: 0 }), '');
  const partial = formatLimitations({
    completeness: 'partial',
    unresolvedEdges: 2,
    unmodeledCount: 1,
    stale: true,
  });
  assert.match(partial, /What this analysis cannot establish/);
  assert.match(partial, /partial/);
  assert.match(partial, /2 unresolved/);
  assert.match(partial, /1 unmodeled/);
  assert.match(partial, /before the last edit/);
});
