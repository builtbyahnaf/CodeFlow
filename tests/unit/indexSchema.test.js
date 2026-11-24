import test from 'node:test';
import assert from 'node:assert/strict';

import {
  INDEX_SCHEMA_VERSION,
  SCHEMA_V1_DDL,
  createEmptyIndexSnapshot,
  validateIndexSnapshot,
} from '../../src/core/indexing/schema.js';

test('createEmptyIndexSnapshot initializes Schema v1 with all six logical tables', () => {
  const snap = createEmptyIndexSnapshot({
    createdBy: 'codeflow@0.1.815',
    now: 1700000000000,
  });

  assert.equal(snap.meta.schema_version, INDEX_SCHEMA_VERSION);
  assert.equal(snap.meta.created_by, 'codeflow@0.1.815');
  assert.equal(snap.meta.state, 'unindexed');
  assert.deepEqual(snap.files, {});
  assert.deepEqual(snap.symbols, {});
  assert.deepEqual(snap.relationships, {});
  assert.deepEqual(snap.dependencies, {});
  assert.deepEqual(snap.analysis_state, {});
  assert.equal(SCHEMA_V1_DDL.length, 6);

  const check = validateIndexSnapshot(snap);
  assert.equal(check.ok, true);
  assert.equal(check.schemaVersion, 1);
});

test('validateIndexSnapshot enforces referential integrity across files, symbols, relationships, and dependencies', () => {
  const snap = createEmptyIndexSnapshot({ now: 100 });
  snap.files['file:a'] = {
    file_id: 'file:a',
    path: 'src/a.js',
    language: 'javascript',
    content_hash: 'sha256:aaa',
    size_bytes: 120,
    line_count: 10,
    indexed_at: 100,
    run_id: 'run:1',
  };
  snap.symbols['sym:1'] = {
    symbol_id: 'sym:1',
    kind: 'function',
    name: 'alpha',
    qualified_name: 'alpha',
    language: 'javascript',
    file_id: 'file:a',
    parent_id: null,
    start_line: 0,
    start_col: 0,
    end_line: 3,
    end_col: 1,
    visibility: 'public',
    extensions_json: null,
    run_id: 'run:1',
  };
  snap.relationships['rel:1'] = {
    rel_id: 'rel:1',
    type: 'calls',
    from_id: 'sym:1',
    to_id: 'sym:ext',
    status: 'unresolved',
    reason: 'dynamic_dispatch',
    site_file: 'file:a',
    site_start_line: 1,
    site_end_line: 1,
    run_id: 'run:1',
  };
  snap.dependencies['file:a|file:b|imports'] = {
    from_file: 'file:a',
    to_file: 'file:b',
    type: 'imports',
    status: 'resolved',
    run_id: 'run:1',
  };
  snap.analysis_state['file:a'] = {
    file_id: 'file:a',
    completeness: 'full',
    diagnostics_json: '[]',
    updated_at: 100,
  };

  assert.equal(validateIndexSnapshot(snap).ok, true);

  // Orphan symbol referencing missing file_id
  const orphanSymbol = structuredClone(snap);
  orphanSymbol.symbols['sym:1'].file_id = 'file:missing';
  const badSym = validateIndexSnapshot(orphanSymbol);
  assert.equal(badSym.ok, false);
  assert.equal(badSym.code, 'E_SCHEMA_INVALID');
  assert.ok(badSym.issues.some((msg) => msg.includes('orphan file_id')));

  // Orphan relationship referencing missing from_id
  const orphanRel = structuredClone(snap);
  orphanRel.relationships['rel:1'].from_id = 'sym:missing';
  const badRel = validateIndexSnapshot(orphanRel);
  assert.equal(badRel.ok, false);
  assert.ok(badRel.issues.some((msg) => msg.includes('orphan from_id')));
});

test('validateIndexSnapshot rejects raw source text or AST blobs in index records (Phase 8 §5)', () => {
  const snap = createEmptyIndexSnapshot({ now: 100 });
  snap.files['file:a'] = {
    file_id: 'file:a',
    path: 'src/a.js',
    language: 'javascript',
    content_hash: 'sha256:aaa',
    size_bytes: 50,
    line_count: 2,
    indexed_at: 100,
    run_id: 'run:1',
    rawSource: 'function secret() {}',
  };

  const result = validateIndexSnapshot(snap);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.includes('forbidden raw-source key "rawSource"')));
});
