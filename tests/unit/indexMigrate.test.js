import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyIndexSnapshot } from '../../src/core/indexing/schema.js';
import { migrateIndexSchema } from '../../src/core/indexing/migrate.js';

test('migrateIndexSchema is a no-op when schema_version matches targetVersion (1 -> 1)', () => {
  const snap = createEmptyIndexSnapshot({ now: 500 });
  const result = migrateIndexSchema(snap, 1, { now: 600 });

  assert.equal(result.ok, true);
  assert.equal(result.migrated, false);
  assert.equal(result.fromVersion, 1);
  assert.equal(result.toVersion, 1);
});

test('migrateIndexSchema executes registered migration path (1 -> 2) deterministically', () => {
  const snap = createEmptyIndexSnapshot({ now: 500 });
  const result = migrateIndexSchema(snap, 2, { now: 900 });

  assert.equal(result.ok, true);
  assert.equal(result.migrated, true);
  assert.equal(result.fromVersion, 1);
  assert.equal(result.toVersion, 2);
  assert.equal(result.snapshot.meta.schema_version, 2);
  assert.equal(result.snapshot.meta.updated_at, 900);
});

test('migrateIndexSchema rejects incompatible major versions with E_SCHEMA_INCOMPATIBLE and rebuildRequired', () => {
  const snap = createEmptyIndexSnapshot({ now: 500 });
  snap.meta.schema_version = 99;

  const result = migrateIndexSchema(snap, 1);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_SCHEMA_INCOMPATIBLE');
  assert.equal(result.rebuildRequired, true);
});
