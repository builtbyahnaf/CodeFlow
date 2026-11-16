/**
 * Reason codes for every non-certain fact.
 *
 * A reason code answers "why is this not certain?" in a form the UI can group
 * and filter. It is deliberately not free text: diagnostics carry prose.
 */

import { REASON_CODES, REASON_CODE_DESCRIPTIONS } from './types.js';

/** @type {ReadonlySet<string>} */
const CODE_SET = new Set(REASON_CODES);

/**
 * @param {unknown} value
 * @returns {boolean}
 */
export function isReasonCode(value) {
  return typeof value === 'string' && CODE_SET.has(value);
}

/**
 * @param {string} code
 * @returns {string}
 */
export function describeReason(code) {
  return REASON_CODE_DESCRIPTIONS[code] ?? `Unknown reason code "${code}".`;
}

/**
 * Group reason codes into the categories the UI exposes.
 *
 * @param {string} code
 * @returns {'dynamic'|'environment'|'scope'|'source'|'internal'|'unknown'}
 */
export function reasonCategory(code) {
  switch (code) {
    case 'dynamic_dispatch':
    case 'function_pointer':
      return 'dynamic';
    case 'missing_compile_db':
    case 'unknown_import_target':
    case 'unsupported_language':
      return 'environment';
    case 'out_of_scope':
    case 'too_deep':
    case 'overload_ambiguous':
      return 'scope';
    case 'macro_expansion':
    case 'generated_source':
    case 'parse_error':
    case 'index_stale':
      return 'source';
    case 'budget_exceeded':
    case 'cancelled':
    case 'adapter_error':
    case 'internal_error':
      return 'internal';
    case 'mock_data':
      return 'unknown';
    default:
      return 'unknown';
  }
}

/**
 * The set of reason codes that make sense for adapter failure states.
 * Used by the registry when it synthesises a degraded run.
 */
export const FAILURE_REASON_CODES = Object.freeze([
  'adapter_error',
  'cancelled',
  'budget_exceeded',
  'internal_error',
  'parse_error',
]);
