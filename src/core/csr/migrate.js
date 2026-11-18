/**
 * CSR migration harness.
 *
 * A migration is an explicit, single-step function. Chains are built by walking
 * adjacent versions; a missing step is an error, never a silent skip. Phase 8
 * will persist runs, so this mechanism has to exist before the first row is
 * written.
 *
 * The `1.0.0 -> 1.1.0` step is real: 1.0.0 was the Phase 0 provisional shape,
 * which used `symbols[].range`, `relationships[].reason`, and an `unknown`
 * relationship status. 1.1.0 is the normative Phase 1 shape.
 */

import { CSR_VERSION, parseCsrVersion } from './types.js';
import { validateAnalysisRun } from './validate.js';

/**
 * @typedef {(run: Record<string, unknown>) => Record<string, unknown>} MigrationStep
 * @typedef {{from: string, to: string, description: string, migrate: MigrationStep}} Migration
 */

/** @type {Migration[]} */
export const MIGRATIONS = [
  {
    from: '1.0.0',
    to: '1.1.0',
    description:
      'Rename provisional symbol/relationship fields and fill fields that became required.',
    migrate(run) {
      const next = cloneValue(run);
      next.csrVersion = '1.1.0';
      const language = typeof next.language === 'string' ? next.language : 'unknown';
      next.adapterVersion =
        typeof next.adapterVersion === 'string' && next.adapterVersion.length > 0
          ? next.adapterVersion
          : 'legacy';
      next.scope = isPlainObject(next.scope) ? next.scope : { kind: 'workspace' };
      next.diagnostics = Array.isArray(next.diagnostics) ? next.diagnostics : [];
      next.controlConstructs = Array.isArray(next.controlConstructs) ? next.controlConstructs : [];
      next.dataFacts = Array.isArray(next.dataFacts) ? next.dataFacts : [];

      if (Array.isArray(next.files)) {
        next.files = next.files.map((file) => {
          if (!isPlainObject(file)) {
            return file;
          }
          return {
            ...file,
            sizeBytes: Number.isInteger(file.sizeBytes) ? file.sizeBytes : 0,
            generated: file.generated === true,
          };
        });
      }

      if (Array.isArray(next.symbols)) {
        next.symbols = next.symbols.map((symbol) => {
          if (!isPlainObject(symbol)) {
            return symbol;
          }
          const migrated = { ...symbol };
          if (migrated.declaration === undefined && migrated.range !== undefined) {
            migrated.declaration = migrated.range;
          }
          delete migrated.range;
          if (typeof migrated.language !== 'string' || migrated.language.length === 0) {
            migrated.language = language;
          }
          return migrated;
        });
      }

      if (Array.isArray(next.relationships)) {
        next.relationships = next.relationships.map((relationship) => {
          if (!isPlainObject(relationship)) {
            return relationship;
          }
          const migrated = { ...relationship };
          if (migrated.reasonCode === undefined && typeof migrated.reason === 'string') {
            migrated.reasonCode = migrated.reason;
          }
          delete migrated.reason;
          if (migrated.status === 'unknown') {
            migrated.status = 'unresolved';
            if (typeof migrated.reasonCode !== 'string' || migrated.reasonCode.length === 0) {
              migrated.reasonCode = 'parse_error';
            }
          }
          if (!Array.isArray(migrated.evidence)) {
            migrated.evidence = [];
          }
          return migrated;
        });
      }

      return next;
    },
  },
];

/**
 * @param {unknown} run
 * @param {string} [targetVersion]
 * @returns {{ok: true, run: import('./entities.js').AnalysisRun, from: string, to: string, applied: string[]} | {ok: false, code: string, message: string, issues?: Array<{path: string, message: string}>}}
 */
export function migrateRun(run, targetVersion = CSR_VERSION) {
  if (!isPlainObject(run)) {
    return { ok: false, code: 'E_VERSION', message: 'Analysis run must be an object.' };
  }
  const from = typeof run.csrVersion === 'string' ? run.csrVersion : '';
  const source = parseCsrVersion(from);
  const target = parseCsrVersion(targetVersion);
  if (!source || !target) {
    return {
      ok: false,
      code: 'E_VERSION',
      message: `Cannot migrate CSR version "${from}" to "${targetVersion}".`,
    };
  }
  if (source.major !== target.major) {
    return {
      ok: false,
      code: 'E_VERSION',
      message: `Refusing to migrate across major versions: "${from}" to "${targetVersion}".`,
    };
  }
  if (compareVersions(source, target) > 0) {
    return {
      ok: false,
      code: 'E_VERSION',
      message: `Refusing to downgrade CSR from "${from}" to "${targetVersion}".`,
    };
  }

  let current = cloneValue(run);
  /** @type {string[]} */
  const applied = [];
  let version = from;
  let guard = 0;

  while (version !== targetVersion && guard < 256) {
    guard += 1;
    const step = MIGRATIONS.find((candidate) => candidate.from === version);
    if (!step) {
      return {
        ok: false,
        code: 'E_MIGRATION_MISSING',
        message: `No migration step from CSR ${version}; cannot reach ${targetVersion}.`,
      };
    }
    current = step.migrate(current);
    applied.push(`${step.from} -> ${step.to}`);
    version = step.to;
  }

  if (version !== targetVersion) {
    return {
      ok: false,
      code: 'E_MIGRATION_MISSING',
      message: `Migration did not reach ${targetVersion} (stopped at ${version}).`,
    };
  }

  const validation = validateAnalysisRun(current, { mode: 'strict' });
  if (!validation.ok) {
    return {
      ok: false,
      code: 'E_VALIDATION',
      message: `Migrated run is not valid CSR ${targetVersion}.`,
      issues: validation.issues,
    };
  }

  return {
    ok: true,
    run: validation.run,
    from,
    to: targetVersion,
    applied,
  };
}

/**
 * @param {{major: number, minor: number, patch: number}} a
 * @param {{major: number, minor: number, patch: number}} b
 * @returns {number}
 */
function compareVersions(a, b) {
  if (a.major !== b.major) {
    return a.major - b.major;
  }
  if (a.minor !== b.minor) {
    return a.minor - b.minor;
  }
  return a.patch - b.patch;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  if (Array.isArray(value)) {
    return /** @type {T} */ (value.map((entry) => cloneValue(entry)));
  }
  if (isPlainObject(value)) {
    /** @type {Record<string, unknown>} */
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = cloneValue(entry);
    }
    return /** @type {T} */ (copy);
  }
  return value;
}
