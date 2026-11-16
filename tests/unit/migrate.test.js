import test from 'node:test';
import assert from 'node:assert/strict';

import { createMockAnalysis } from '../../src/adapters/mock/index.js';
import { migrateRun } from '../../src/core/csr/migrate.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';

function legacyRun() {
  const run = structuredClone(createMockAnalysis());
  run.csrVersion = '1.0.0';
  delete run.adapterVersion;
  delete run.scope;
  delete run.controlConstructs;
  delete run.dataFacts;

  for (const symbol of run.symbols) {
    symbol.range = symbol.declaration;
    delete symbol.declaration;
  }
  for (const relationship of run.relationships) {
    if (relationship.reasonCode) {
      relationship.reason = relationship.reasonCode;
      delete relationship.reasonCode;
    }
    delete relationship.evidence;
  }
  const unresolved = run.relationships.find((relationship) => relationship.status === 'unresolved');
  unresolved.status = 'unknown';
  delete unresolved.reason;
  return run;
}

test('1.0.0 migrates to 1.1.0 through the explicit step', () => {
  const legacy = legacyRun();
  const result = migrateRun(legacy);
  assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result));
  assert.equal(result.from, '1.0.0');
  assert.equal(result.to, '1.1.0');
  assert.deepEqual(result.applied, ['1.0.0 -> 1.1.0']);

  assert.equal(result.run.csrVersion, '1.1.0');
  assert.equal(result.run.adapterVersion, 'legacy');
  assert.deepEqual(result.run.scope, { kind: 'workspace' });
  assert.deepEqual(result.run.controlConstructs, []);
  assert.deepEqual(result.run.dataFacts, []);
  assert.equal(validateAnalysisRun(result.run).ok, true);

  assert.ok(result.run.symbols.every((symbol) => symbol.declaration && !symbol.range));
  const migratedUnknown = result.run.relationships.find(
    (relationship) => relationship.status === 'unresolved' && relationship.reasonCode === 'parse_error',
  );
  assert.ok(migratedUnknown, 'unknown status becomes unresolved with parse_error');
});

test('migration does not mutate its input', () => {
  const legacy = legacyRun();
  const before = JSON.stringify(legacy);
  migrateRun(legacy);
  assert.equal(JSON.stringify(legacy), before);
});

test('a missing migration step is an error, never a silent skip', () => {
  const legacy = legacyRun();
  legacy.csrVersion = '1.0.1';
  const result = migrateRun(legacy);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_MIGRATION_MISSING');
});

test('downgrades and cross-major migrations are refused', () => {
  const newer = createMockAnalysis();
  newer.csrVersion = '1.2.0';
  const downgrade = migrateRun(newer, '1.1.0');
  assert.equal(downgrade.ok, false);
  assert.equal(downgrade.code, 'E_VERSION');

  const major = createMockAnalysis();
  major.csrVersion = '2.0.0';
  const crossMajor = migrateRun(major, '1.1.0');
  assert.equal(crossMajor.ok, false);
  assert.equal(crossMajor.code, 'E_VERSION');
});

test('a migration that produces invalid CSR is reported', () => {
  const legacy = legacyRun();
  legacy.symbols[0].kind = 'hologram';
  const result = migrateRun(legacy);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_VALIDATION');
  assert.ok(result.issues.length > 0);
});
