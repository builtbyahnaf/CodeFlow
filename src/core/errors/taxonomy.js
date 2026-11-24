/**
 * Comprehensive Error Taxonomy (Phase 12 §8, P12-16, AC-12.10).
 *
 * Maps every CodeFlow error code to a user-facing message, log severity,
 * and actionable recovery guidance.
 */

/**
 * @typedef {'error' | 'warn' | 'info'} ErrorSeverity
 *
 * @typedef {{
 *   code: string,
 *   userMessage: string,
 *   severity: ErrorSeverity,
 *   recoveryAction: string,
 * }} TaxonomyEntry
 */

/** Comprehensive registry of all CodeFlow system error codes. */
export const ERROR_TAXONOMY = Object.freeze({
  E_PROTOCOL: Object.freeze({
    code: 'E_PROTOCOL',
    userMessage: 'Protocol communication mismatch between extension and webview.',
    severity: 'error',
    recoveryAction: 'Reload the CodeFlow explorer window.',
  }),
  E_VALIDATION: Object.freeze({
    code: 'E_VALIDATION',
    userMessage: 'Malformed or invalid request payload.',
    severity: 'error',
    recoveryAction: 'Verify input parameters and retry the operation.',
  }),
  E_UNSUPPORTED: Object.freeze({
    code: 'E_UNSUPPORTED',
    userMessage: 'Requested construct or operation is not supported by the language adapter.',
    severity: 'warn',
    recoveryAction: 'View the limitations panel for supported language constructs.',
  }),
  E_TIMEOUT: Object.freeze({
    code: 'E_TIMEOUT',
    userMessage: 'Analysis operation exceeded its configured time budget.',
    severity: 'warn',
    recoveryAction: 'Increase timeoutMs in settings or reduce the scope of analysis.',
  }),
  E_CANCELLED: Object.freeze({
    code: 'E_CANCELLED',
    userMessage: 'The in-flight operation was cancelled by a subsequent action or user request.',
    severity: 'info',
    recoveryAction: 'No action required.',
  }),
  E_ADAPTER: Object.freeze({
    code: 'E_ADAPTER',
    userMessage: 'Language adapter encountered a failure while analyzing source.',
    severity: 'error',
    recoveryAction: 'Verify toolchain paths and check compile_commands.json.',
  }),
  E_LIMIT: Object.freeze({
    code: 'E_LIMIT',
    userMessage: 'Analysis budget or module ceiling exceeded.',
    severity: 'warn',
    recoveryAction: 'Adjust module/line ceilings in CodeFlow settings.',
  }),
  E_CFG_INVARIANT: Object.freeze({
    code: 'E_CFG_INVARIANT',
    userMessage: 'Control-flow graph invariant check failed.',
    severity: 'error',
    recoveryAction: 'Report diagnostic log to CodeFlow maintainers.',
  }),
  E_PARSE: Object.freeze({
    code: 'E_PARSE',
    userMessage: 'Source file could not be parsed as valid code.',
    severity: 'warn',
    recoveryAction: 'Fix syntax errors in the source file and re-analyze.',
  }),
  E_STALE: Object.freeze({
    code: 'E_STALE',
    userMessage: 'Document has unsaved or recent modifications since last analysis.',
    severity: 'info',
    recoveryAction: 'Save file or trigger refresh.',
  }),
  E_INDEX_LOCK: Object.freeze({
    code: 'E_INDEX_LOCK',
    userMessage: 'Project index is currently locked by another background operation.',
    severity: 'warn',
    recoveryAction: 'Wait for the current indexing pass to finish or cancel it.',
  }),
  E_MEMORY_CEILING: Object.freeze({
    code: 'E_MEMORY_CEILING',
    userMessage: 'Subsystem memory ceiling reached; cached representations evicted.',
    severity: 'warn',
    recoveryAction: 'No action required; evicted items will recompute on demand.',
  }),
  E_INTERNAL: Object.freeze({
    code: 'E_INTERNAL',
    userMessage: 'An unexpected internal error occurred.',
    severity: 'error',
    recoveryAction: 'Check CodeFlow logs for full diagnostics.',
  }),
});

/**
 * Lookup the taxonomy entry for a given error code.
 *
 * @param {string} code
 * @returns {TaxonomyEntry}
 */
export function describeError(code) {
  const entry = ERROR_TAXONOMY[code];
  if (entry) {
    return entry;
  }
  return {
    code: String(code || 'E_INTERNAL'),
    userMessage: `An unknown error occurred (${code}).`,
    severity: 'error',
    recoveryAction: 'Check CodeFlow logs for full diagnostics.',
  };
}
