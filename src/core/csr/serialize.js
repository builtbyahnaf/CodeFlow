/**
 * Deterministic CSR serialization.
 *
 * Two runs over identical input must serialize to identical bytes. That is a
 * hard requirement for Phase 9: non-deterministic ordering would look like
 * change and create phantom invalidations.
 *
 * Rules:
 * - collections are sorted by documented keys before output;
 * - object keys are emitted in sorted order, including inside `extensions`;
 * - timings (`startedAt`, `durationMs`) are excluded from the deterministic
 *   payload; they are metadata, not facts;
 * - the serialized payload is versioned by the run's `csrVersion`.
 */

import { hashHex } from './hash.js';
import { validateAnalysisRun } from './validate.js';

/**
 * @param {import('./entities.js').AnalysisRun} run
 * @returns {import('./entities.js').AnalysisRun}
 */
export function canonicalRun(run) {
  const candidate = /** @type {Record<string, unknown>} */ (run);
  /** @type {Record<string, unknown>} */
  const canonical = {
    runId: candidate.runId,
    adapterId: candidate.adapterId,
    adapterVersion: candidate.adapterVersion,
    language: candidate.language,
    csrVersion: candidate.csrVersion,
    scope: candidate.scope,
    completeness: candidate.completeness,
    files: sortBy(arrayOf(candidate.files), (file) => String(file.fileId)),
    symbols: sortBy(arrayOf(candidate.symbols), (symbol) => String(symbol.symbolId)),
    relationships: sortBy(
      arrayOf(candidate.relationships),
      (relationship) =>
        `${String(relationship.type)}\u0000${String(relationship.from)}\u0000${String(
          relationship.to,
        )}\u0000${String(relationship.relationshipId)}`,
    ),
    controlConstructs: sortBy(arrayOf(candidate.controlConstructs), (construct) =>
      String(construct.constructId),
    ),
    dataFacts: sortBy(arrayOf(candidate.dataFacts), (fact) => String(fact.factId)),
    diagnostics: sortBy(
      arrayOf(candidate.diagnostics),
      (diagnostic) =>
        `${String(diagnostic.severity)}\u0000${String(diagnostic.code)}\u0000${String(
          diagnostic.message,
        )}\u0000${Array.isArray(diagnostic.affects) ? diagnostic.affects.join(',') : ''}`,
    ),
  };
  if (isPlainObject(candidate.extensions)) {
    canonical.extensions = candidate.extensions;
  }
  return /** @type {import('./entities.js').AnalysisRun} */ (canonical);
}

/**
 * @param {import('./entities.js').AnalysisRun} run
 * @returns {string}
 */
export function serializeRun(run) {
  return stableStringify(canonicalRun(run));
}

/**
 * Change-detection hash. Stable across processes and platforms.
 *
 * @param {import('./entities.js').AnalysisRun} run
 * @returns {string} sixteen hex characters
 */
export function hashRun(run) {
  return hashHex(serializeRun(run));
}

/**
 * @param {string} json
 * @param {{mode?: 'strict'|'defensive'}} [options]
 * @returns {{ok: true, run: import('./entities.js').AnalysisRun} | {ok: false, issues: Array<{path: string, message: string}>}}
 */
export function parseRun(json, options = {}) {
  let parsed;
  try {
    parsed = JSON.parse(json);
  } catch (error) {
    return {
      ok: false,
      issues: [
        {
          path: '$',
          message: `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  const validation = validateAnalysisRun(parsed, { mode: options.mode ?? 'strict' });
  if (!validation.ok) {
    return { ok: false, issues: validation.issues };
  }
  return { ok: true, run: validation.run };
}

/**
 * JSON with recursively sorted object keys. Arrays keep their (already sorted)
 * order.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function stableStringify(value) {
  return JSON.stringify(sortKeys(value));
}

/**
 * @param {unknown} value
 * @returns {unknown}
 */
function sortKeys(value) {
  if (Array.isArray(value)) {
    return value.map((entry) => sortKeys(entry));
  }
  if (isPlainObject(value)) {
    /** @type {Record<string, unknown>} */
    const sorted = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) {
        sorted[key] = sortKeys(value[key]);
      }
    }
    return sorted;
  }
  return value;
}

/**
 * @template T
 * @param {T[]} values
 * @param {(value: T) => string} key
 * @returns {T[]}
 */
function sortBy(values, key) {
  return values
    .map((value) => ({ value, key: key(/** @type {T} */ (value)) }))
    .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0))
    .map((entry) => entry.value);
}

/**
 * @param {unknown} value
 * @returns {unknown[]}
 */
function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
