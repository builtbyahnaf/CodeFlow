/**
 * Logical Schema v1 for the optional CodeFlow project index (Phase 8 §6).
 *
 * Defines the canonical tables (`meta`, `files`, `symbols`, `relationships`,
 * `dependencies`, `analysis_state`), SQL DDL for SQLite-backed stores, and
 * structural validation for serialized snapshots.
 *
 * Raw source text is NEVER stored in the index — only file paths, hashes,
 * 0-based UTF-16 ranges, and derived CSR entities.
 */

export const INDEX_SCHEMA_VERSION = 1;

export const SUPPORTED_SCHEMA_MAJORS = Object.freeze([1]);

export const INDEX_STATES = Object.freeze([
  'unindexed',
  'indexing',
  'complete',
  'partial',
  'cancelled',
  'failed',
  'corrupt',
]);

export const DEPENDENCY_TYPES = Object.freeze(['imports', 'includes']);

export const DEPENDENCY_STATUSES = Object.freeze(['resolved', 'unresolved']);

export const ANALYSIS_COMPLETENESS = Object.freeze(['full', 'partial', 'failed']);

export const LOGICAL_TABLES = Object.freeze([
  'meta',
  'files',
  'symbols',
  'relationships',
  'dependencies',
  'analysis_state',
]);

const FORBIDDEN_RAW_SOURCE_KEYS = Object.freeze([
  'source',
  'rawSource',
  'sourceText',
  'text',
  'body',
  'ast',
]);

/**
 * Logical SQL DDL matching Phase 8 §6. Used by SQLite engines and documented
 * in `docs/INDEXING_SPECIFICATION.md`.
 */
export const SCHEMA_V1_DDL = Object.freeze([
  `CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS files (
    file_id TEXT PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL,
    content_hash TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    line_count INTEGER NOT NULL,
    indexed_at INTEGER NOT NULL,
    run_id TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS symbols (
    symbol_id TEXT PRIMARY KEY,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    qualified_name TEXT NOT NULL,
    language TEXT NOT NULL,
    file_id TEXT NOT NULL REFERENCES files(file_id) ON DELETE CASCADE,
    parent_id TEXT,
    start_line INTEGER NOT NULL,
    start_col INTEGER NOT NULL,
    end_line INTEGER NOT NULL,
    end_col INTEGER NOT NULL,
    visibility TEXT,
    extensions_json TEXT,
    run_id TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS relationships (
    rel_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    from_id TEXT NOT NULL,
    to_id TEXT NOT NULL,
    status TEXT NOT NULL,
    reason TEXT,
    site_file TEXT,
    site_start_line INTEGER,
    site_end_line INTEGER,
    run_id TEXT NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS dependencies (
    from_file TEXT NOT NULL,
    to_file TEXT NOT NULL,
    type TEXT NOT NULL,
    status TEXT NOT NULL,
    run_id TEXT NOT NULL,
    PRIMARY KEY (from_file, to_file, type)
  );`,
  `CREATE TABLE IF NOT EXISTS analysis_state (
    file_id TEXT PRIMARY KEY,
    completeness TEXT NOT NULL,
    diagnostics_json TEXT,
    updated_at INTEGER NOT NULL
  );`,
]);

/**
 * Create a clean, empty Schema v1 snapshot.
 *
 * @param {{createdBy?: string, schemaVersion?: number, state?: string, now?: number}} [options]
 * @returns {Record<string, any>}
 */
export function createEmptyIndexSnapshot(options = {}) {
  const schemaVersion = Number(options.schemaVersion ?? INDEX_SCHEMA_VERSION);
  const createdBy = String(options.createdBy ?? '0.0.1');
  const state = String(options.state ?? 'unindexed');
  const now = Number(options.now ?? 0);
  return {
    format: 'codeflow-index-v1',
    meta: {
      schema_version: schemaVersion,
      created_by: createdBy,
      last_run_id: '',
      state,
      updated_at: now,
    },
    files: {},
    symbols: {},
    relationships: {},
    dependencies: {},
    analysis_state: {},
  };
}

/**
 * Validate a persisted index snapshot and check referential integrity
 * (simulating `PRAGMA integrity_check`).
 *
 * @param {unknown} raw
 * @returns {{ok: true, snapshot: Record<string, any>, schemaVersion: number} | {ok: false, code: 'E_CORRUPT'|'E_SCHEMA_INVALID', message: string, issues: string[]}}
 */
export function validateIndexSnapshot(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      ok: false,
      code: 'E_CORRUPT',
      message: 'Index snapshot is not a valid object.',
      issues: ['Root must be a plain object.'],
    };
  }
  const candidate = /** @type {Record<string, any>} */ (raw);
  /** @type {string[]} */
  const issues = [];

  if (!candidate.meta || typeof candidate.meta !== 'object' || Array.isArray(candidate.meta)) {
    issues.push('Missing or invalid meta table.');
  }
  for (const table of ['files', 'symbols', 'relationships', 'dependencies', 'analysis_state']) {
    if (
      !candidate[table] ||
      typeof candidate[table] !== 'object' ||
      Array.isArray(candidate[table])
    ) {
      issues.push(`Missing or invalid "${table}" table.`);
    }
  }
  if (issues.length > 0) {
    return {
      ok: false,
      code: 'E_CORRUPT',
      message: issues.join(' '),
      issues,
    };
  }

  const rawVersion = Number(candidate.meta.schema_version);
  if (!Number.isInteger(rawVersion) || rawVersion < 1) {
    return {
      ok: false,
      code: 'E_CORRUPT',
      message: `Invalid meta.schema_version "${String(candidate.meta.schema_version)}".`,
      issues: ['meta.schema_version must be a positive integer.'],
    };
  }

  const files = candidate.files;
  const symbols = candidate.symbols;

  for (const [fileId, fileRow] of Object.entries(files)) {
    if (!fileRow || typeof fileRow.path !== 'string' || typeof fileRow.content_hash !== 'string') {
      issues.push(`Corrupt file row "${fileId}".`);
      continue;
    }
    for (const badKey of FORBIDDEN_RAW_SOURCE_KEYS) {
      if (badKey in fileRow) {
        issues.push(`File row "${fileId}" contains forbidden raw-source key "${badKey}".`);
      }
    }
  }

  for (const [symbolId, sym] of Object.entries(symbols)) {
    if (!sym || typeof sym !== 'object') {
      issues.push(`Corrupt symbol row "${symbolId}".`);
      continue;
    }
    if (typeof sym.file_id !== 'string' || !Object.hasOwn(files, sym.file_id)) {
      issues.push(`Symbol "${symbolId}" has orphan file_id "${String(sym.file_id)}".`);
    }
    for (const badKey of FORBIDDEN_RAW_SOURCE_KEYS) {
      if (badKey in sym) {
        issues.push(`Symbol row "${symbolId}" contains forbidden raw-source key "${badKey}".`);
      }
    }
  }

  for (const [relId, rel] of Object.entries(candidate.relationships)) {
    if (!rel || typeof rel !== 'object') {
      issues.push(`Corrupt relationship row "${relId}".`);
      continue;
    }
    if (typeof rel.from_id !== 'string' || !Object.hasOwn(symbols, rel.from_id)) {
      issues.push(`Relationship "${relId}" has orphan from_id "${String(rel.from_id)}".`);
    }
    if (rel.site_file && !Object.hasOwn(files, rel.site_file)) {
      issues.push(`Relationship "${relId}" has orphan site_file "${String(rel.site_file)}".`);
    }
  }

  for (const [depKey, dep] of Object.entries(candidate.dependencies)) {
    if (!dep || typeof dep !== 'object') {
      issues.push(`Corrupt dependency row "${depKey}".`);
      continue;
    }
    if (typeof dep.from_file !== 'string' || !Object.hasOwn(files, dep.from_file)) {
      issues.push(`Dependency "${depKey}" has orphan from_file "${String(dep.from_file)}".`);
    }
  }

  for (const [fileId, stateRow] of Object.entries(candidate.analysis_state)) {
    if (!stateRow || !Object.hasOwn(files, fileId)) {
      issues.push(`Analysis state "${fileId}" has orphan file_id "${fileId}".`);
    }
  }

  if (issues.length > 0) {
    return {
      ok: false,
      code: 'E_SCHEMA_INVALID',
      message: issues.join(' '),
      issues,
    };
  }

  return {
    ok: true,
    snapshot: candidate,
    schemaVersion: rawVersion,
  };
}
