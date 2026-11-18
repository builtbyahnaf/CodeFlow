/**
 * Size ceilings for a single CSR run.
 *
 * These are correctness limits, not performance tuning: an adapter that emits
 * an unbounded array must be stopped at the boundary rather than allowed to
 * exhaust memory in the host. Oversized input is rejected with `E_LIMIT`; it is
 * never truncated, because silent truncation would turn an incomplete graph into
 * a graph that merely looks complete.
 *
 * Phase 8/9 may raise the collection limits for large workspaces, but the
 * invariant stays: the registry refuses before the data reaches consumers.
 */

export const CSR_LIMITS = Object.freeze({
  maxFiles: 5_000,
  maxSymbols: 200_000,
  maxRelationships: 500_000,
  maxConstructs: 200_000,
  maxDataFacts: 500_000,
  maxDiagnostics: 10_000,
  maxEvidencePerRelationship: 32,
  maxAffectsPerDiagnostic: 64,
  maxStringLength: 4_096,
  maxPathLength: 1_024,
  maxNameLength: 512,
  maxMessageLength: 2_000,
  maxExtensionsKeys: 128,
  maxSerializedBytes: 8_000_000,
});

/**
 * @typedef {{path: string, message: string, code: 'E_LIMIT'}} LimitIssue
 */

/**
 * @param {unknown} value
 * @param {number} max
 * @param {string} path
 * @param {string} label
 * @param {LimitIssue[]} issues
 */
function checkArray(value, max, path, label, issues) {
  if (Array.isArray(value) && value.length > max) {
    issues.push({
      path,
      code: 'E_LIMIT',
      message: `${label} has ${value.length} entries; the limit is ${max}.`,
    });
  }
}

/**
 * @param {unknown} value
 * @param {number} max
 * @param {string} path
 * @param {string} label
 * @param {LimitIssue[]} issues
 */
function checkString(value, max, path, label, issues) {
  if (typeof value === 'string' && value.length > max) {
    issues.push({
      path,
      code: 'E_LIMIT',
      message: `${label} is ${value.length} code units; the limit is ${max}.`,
    });
  }
}

/**
 * @param {unknown} run
 * @returns {{ok: true} | {ok: false, issues: LimitIssue[]}}
 */
export function enforceLimits(run) {
  /** @type {LimitIssue[]} */
  const issues = [];

  if (typeof run !== 'object' || run === null || Array.isArray(run)) {
    return { ok: true };
  }
  const candidate = /** @type {Record<string, unknown>} */ (run);

  checkArray(candidate.files, CSR_LIMITS.maxFiles, 'files', 'files', issues);
  checkArray(candidate.symbols, CSR_LIMITS.maxSymbols, 'symbols', 'symbols', issues);
  checkArray(
    candidate.relationships,
    CSR_LIMITS.maxRelationships,
    'relationships',
    'relationships',
    issues,
  );
  checkArray(
    candidate.controlConstructs,
    CSR_LIMITS.maxConstructs,
    'controlConstructs',
    'controlConstructs',
    issues,
  );
  checkArray(candidate.dataFacts, CSR_LIMITS.maxDataFacts, 'dataFacts', 'dataFacts', issues);
  checkArray(
    candidate.diagnostics,
    CSR_LIMITS.maxDiagnostics,
    'diagnostics',
    'diagnostics',
    issues,
  );

  checkString(candidate.runId, CSR_LIMITS.maxStringLength, 'runId', 'runId', issues);
  checkString(candidate.adapterId, CSR_LIMITS.maxStringLength, 'adapterId', 'adapterId', issues);
  checkString(candidate.language, CSR_LIMITS.maxStringLength, 'language', 'language', issues);

  if (Array.isArray(candidate.files)) {
    candidate.files.forEach((file, index) => {
      if (typeof file !== 'object' || file === null) {
        return;
      }
      const record = /** @type {Record<string, unknown>} */ (file);
      checkString(record.path, CSR_LIMITS.maxPathLength, `files[${index}].path`, 'path', issues);
      checkString(
        record.contentHash,
        CSR_LIMITS.maxStringLength,
        `files[${index}].contentHash`,
        'contentHash',
        issues,
      );
    });
  }

  if (Array.isArray(candidate.symbols)) {
    candidate.symbols.forEach((symbol, index) => {
      if (typeof symbol !== 'object' || symbol === null) {
        return;
      }
      const record = /** @type {Record<string, unknown>} */ (symbol);
      checkString(record.name, CSR_LIMITS.maxNameLength, `symbols[${index}].name`, 'name', issues);
      checkString(
        record.qualifiedName,
        CSR_LIMITS.maxNameLength,
        `symbols[${index}].qualifiedName`,
        'qualifiedName',
        issues,
      );
      checkString(
        record.signature,
        CSR_LIMITS.maxStringLength,
        `symbols[${index}].signature`,
        'signature',
        issues,
      );
    });
  }

  if (Array.isArray(candidate.relationships)) {
    candidate.relationships.forEach((relationship, index) => {
      if (typeof relationship !== 'object' || relationship === null) {
        return;
      }
      const record = /** @type {Record<string, unknown>} */ (relationship);
      checkArray(
        record.evidence,
        CSR_LIMITS.maxEvidencePerRelationship,
        `relationships[${index}].evidence`,
        'evidence',
        issues,
      );
    });
  }

  if (Array.isArray(candidate.diagnostics)) {
    candidate.diagnostics.forEach((diagnostic, index) => {
      if (typeof diagnostic !== 'object' || diagnostic === null) {
        return;
      }
      const record = /** @type {Record<string, unknown>} */ (diagnostic);
      checkString(
        record.message,
        CSR_LIMITS.maxMessageLength,
        `diagnostics[${index}].message`,
        'message',
        issues,
      );
      checkArray(
        record.affects,
        CSR_LIMITS.maxAffectsPerDiagnostic,
        `diagnostics[${index}].affects`,
        'affects',
        issues,
      );
    });
  }

  return issues.length === 0 ? { ok: true } : { ok: false, issues };
}
