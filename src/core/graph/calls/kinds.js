/**
 * Call-graph vocabulary, limits, scope banners, and non-color edge encodings.
 *
 * Kept in `src/core/graph/calls/` with zero adapter, host, or webview imports.
 */

import { dashForStatus, glyphForStatus } from '../cfg/kinds.js';

export const CALL_SCOPES = Object.freeze(['complete', 'partial', 'same_file_only']);

export const CALL_SCOPE_REASONS = Object.freeze([
  'no_index',
  'index_partial',
  'index_stale',
  'analysis_partial',
  'same_file_adapter',
  'stale_cursor_reset',
]);

export const CALL_RELATIONSHIP_TYPES = Object.freeze([
  'calls',
  'instantiates',
  'overrides',
  'references',
]);

export const CALL_STATUSES = Object.freeze([
  'resolved',
  'inferred',
  'possible',
  'unresolved',
  'stale',
]);

export const CALL_NODE_KINDS = Object.freeze([
  'function',
  'method',
  'constructor',
  'destructor',
  'lambda',
  'closure',
  'class',
  'struct',
  'interface',
  'module',
  'file',
  'variable',
  'parameter',
  'field',
  'property',
  'unresolved_bucket',
  'candidate_bucket',
  'unknown',
]);

export const CALL_LIMITS = Object.freeze({
  defaultPageSize: 100,
  maxPageSize: 200,
  defaultDepth: 3,
  maxDepth: 6,
  maxNodes: 500,
  candidateBucketThreshold: 5,
});

/**
 * Numerical precedence of resolution statuses (excluding `stale`, which is a
 * provenance property rather than a strength level).
 */
export const STATUS_STRENGTH = Object.freeze({
  resolved: 4,
  inferred: 3,
  possible: 2,
  unresolved: 1,
});

/**
 * Format an honest scope label per Phase 7 §8.
 * Never renders a bare count for `same_file_only` or `partial` scopes.
 *
 * @param {'complete'|'partial'|'same_file_only'} scope
 * @param {number} count
 * @param {'callers'|'callees'|'neighbors'} [noun]
 * @returns {string}
 */
export function formatScopeBanner(scope, count, noun = 'callers') {
  const safeCount = Math.max(0, Number.isInteger(count) ? count : 0);
  const word = safeCount === 1 ? (noun.endsWith('s') ? noun.slice(0, -1) : noun) : noun;
  if (scope === 'complete') {
    return `${safeCount} ${word}`;
  }
  if (scope === 'partial') {
    return `${safeCount} ${word} (index partial — may be incomplete)`;
  }
  return `${safeCount} ${word} in this file · Project-wide ${noun} require indexing`;
}

/**
 * Non-color SVG dash pattern for a call edge.
 *
 * @param {string} status
 * @param {boolean} [isCycle]
 * @returns {string}
 */
export function callEdgeDash(status, isCycle = false) {
  if (status === 'resolved' && isCycle) {
    return '10 4';
  }
  return dashForStatus(status);
}

/**
 * Non-color glyph hint for a call edge, distinguishing `possible` (`○`) from
 * `resolved` (`●`) and marking recursive/mutual cycle edges (`↻`).
 *
 * @param {string} status
 * @param {boolean} [isCycle]
 * @returns {string}
 */
export function callEdgeGlyph(status, isCycle = false) {
  const base = glyphForStatus(status);
  return isCycle ? `${base} ↻` : base;
}
