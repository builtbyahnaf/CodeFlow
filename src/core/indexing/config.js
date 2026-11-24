/**
 * `.codeflow/config.json` validation and fail-soft normalization (Phase 8 §5, §8).
 *
 * `config.json` is the only file in `.codeflow/` a user may edit by hand.
 * Invalid values or unsafe patterns (path traversal `..`, absolute paths, NUL
 * bytes) never crash the extension: they are dropped with a structured warning
 * diagnostic while safe defaults remain active.
 */

import { INDEX_SCHEMA_VERSION } from './schema.js';

export const DEFAULT_INDEX_CONFIG = Object.freeze({
  version: INDEX_SCHEMA_VERSION,
  schemaVersion: INDEX_SCHEMA_VERSION,
  exclude: [],
  include: [],
  maxFileSizeKb: 2048,
  batchSize: 50,
  maxConcurrency: 4,
  stressCeilingFiles: 25_000,
});

/**
 * True when a user-supplied glob pattern is a safe workspace-relative pattern.
 *
 * @param {unknown} pattern
 * @returns {pattern is string}
 */
export function isSafeGlobPattern(pattern) {
  if (typeof pattern !== 'string') {
    return false;
  }
  const trimmed = pattern.trim();
  if (trimmed.length === 0 || trimmed.length > 512 || trimmed.includes('\u0000')) {
    return false;
  }
  const unix = trimmed.replace(/\\/g, '/');
  if (unix.startsWith('/') || /^[A-Za-z]:/.test(unix)) {
    return false;
  }
  const segments = unix.split('/');
  if (segments.includes('..')) {
    return false;
  }
  return true;
}

/**
 * Validate and normalize a raw `.codeflow/config.json` object or JSON string.
 * Never throws.
 *
 * @param {unknown} raw
 * @returns {{
 *   config: {
 *     version: number,
 *     schemaVersion: number,
 *     exclude: string[],
 *     include: string[],
 *     maxFileSizeKb: number,
 *     batchSize: number,
 *     maxConcurrency: number,
 *     stressCeilingFiles: number,
 *   },
 *   diagnostics: Array<{code: string, severity: 'warning', message: string}>,
 * }}
 */
export function normalizeIndexConfig(raw) {
  /** @type {Array<{code: string, severity: 'warning', message: string}>} */
  const diagnostics = [];
  /** @type {Record<string, any>} */
  let parsed = {};

  if (typeof raw === 'string') {
    try {
      const candidate = JSON.parse(raw);
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        parsed = candidate;
      } else {
        diagnostics.push({
          code: 'invalid_index_config',
          severity: 'warning',
          message: '.codeflow/config.json must be a JSON object; using defaults.',
        });
      }
    } catch (error) {
      diagnostics.push({
        code: 'invalid_index_config',
        severity: 'warning',
        message: `Could not parse .codeflow/config.json (${error instanceof Error ? error.message : String(error)}); using defaults.`,
      });
    }
  } else if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    parsed = /** @type {Record<string, any>} */ (raw);
  } else if (raw !== undefined && raw !== null) {
    diagnostics.push({
      code: 'invalid_index_config',
      severity: 'warning',
      message: 'Index configuration must be an object; using defaults.',
    });
  }

  /**
   * @param {unknown} list
   * @param {'exclude'|'include'} field
   * @returns {string[]}
   */
  function cleanPatterns(list, field) {
    if (list === undefined) {
      return [];
    }
    if (!Array.isArray(list)) {
      diagnostics.push({
        code: 'invalid_index_config',
        severity: 'warning',
        message: `"${field}" in .codeflow/config.json must be an array of workspace-relative patterns.`,
      });
      return [];
    }
    /** @type {string[]} */
    const accepted = [];
    for (const item of list) {
      if (isSafeGlobPattern(item)) {
        accepted.push(item.trim().replace(/\\/g, '/'));
      } else {
        diagnostics.push({
          code: 'unsafe_index_pattern',
          severity: 'warning',
          message: `Rejected unsafe or malformed ${field} pattern "${String(item)}".`,
        });
      }
    }
    return [...new Set(accepted)];
  }

  const maxFileSizeKb = Number.isFinite(Number(parsed.maxFileSizeKb))
    ? Math.min(16_384, Math.max(1, Math.trunc(Number(parsed.maxFileSizeKb))))
    : DEFAULT_INDEX_CONFIG.maxFileSizeKb;

  const batchSize = Number.isFinite(Number(parsed.batchSize))
    ? Math.min(500, Math.max(5, Math.trunc(Number(parsed.batchSize))))
    : DEFAULT_INDEX_CONFIG.batchSize;

  const maxConcurrency = Number.isFinite(Number(parsed.maxConcurrency))
    ? Math.min(8, Math.max(1, Math.trunc(Number(parsed.maxConcurrency))))
    : DEFAULT_INDEX_CONFIG.maxConcurrency;

  const stressCeilingFiles = Number.isFinite(Number(parsed.stressCeilingFiles))
    ? Math.min(100_000, Math.max(100, Math.trunc(Number(parsed.stressCeilingFiles))))
    : DEFAULT_INDEX_CONFIG.stressCeilingFiles;

  const rawVersion = parsed.schemaVersion ?? parsed.version;
  const schemaVersion =
    Number.isInteger(rawVersion) && rawVersion > 0
      ? rawVersion
      : DEFAULT_INDEX_CONFIG.schemaVersion;

  return {
    config: {
      version: schemaVersion,
      schemaVersion,
      exclude: cleanPatterns(parsed.exclude, 'exclude'),
      include: cleanPatterns(parsed.include, 'include'),
      maxFileSizeKb,
      batchSize,
      maxConcurrency,
      stressCeilingFiles,
    },
    diagnostics,
  };
}
