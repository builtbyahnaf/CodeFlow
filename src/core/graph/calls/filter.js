/**
 * Call-graph neighbor and relationship filter normalization and matching
 * (Phase 7 §4, §5).
 */

import { CALL_RELATIONSHIP_TYPES, CALL_STATUSES } from './kinds.js';

const VALID_STATUSES = new Set(CALL_STATUSES);
const VALID_TYPES = new Set(CALL_RELATIONSHIP_TYPES);

/**
 * Normalize raw filter criteria into a canonical structure.
 *
 * @param {{
 *   statuses?: string[]|null,
 *   kinds?: string[]|null,
 *   types?: string[]|null,
 *   fileId?: string|null,
 * }} [raw]
 * @returns {{
 *   statuses: string[]|null,
 *   kinds: string[]|null,
 *   types: string[]|null,
 *   fileId: string|null,
 * }}
 */
export function normalizeCallFilter(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const statuses = Array.isArray(source.statuses)
    ? source.statuses.filter((s) => typeof s === 'string' && VALID_STATUSES.has(s))
    : [];
  const kinds = Array.isArray(source.kinds)
    ? source.kinds.filter((k) => typeof k === 'string' && k.length > 0)
    : [];
  const types = Array.isArray(source.types)
    ? source.types.filter((t) => typeof t === 'string' && VALID_TYPES.has(t))
    : [];
  const fileId =
    typeof source.fileId === 'string' && source.fileId.trim().length > 0
      ? source.fileId.trim()
      : null;

  return {
    statuses: statuses.length > 0 ? [...new Set(statuses)] : null,
    kinds: kinds.length > 0 ? [...new Set(kinds)] : null,
    types: types.length > 0 ? [...new Set(types)] : null,
    fileId,
  };
}

/**
 * True when a candidate neighbor and relationship match the active filter.
 *
 * @param {{kind?: string, fileId?: string|null}} neighbor
 * @param {{status?: string, strongestStatus?: string, type?: string}} relationship
 * @param {ReturnType<typeof normalizeCallFilter>|Record<string, any>} [filter]
 * @returns {boolean}
 */
export function matchesCallFilter(neighbor, relationship, filter = {}) {
  const norm =
    filter && 'statuses' in filter && 'fileId' in filter
      ? /** @type {ReturnType<typeof normalizeCallFilter>} */ (filter)
      : normalizeCallFilter(filter);

  if (norm.statuses && norm.statuses.length > 0) {
    const statusMatch =
      (relationship?.status && norm.statuses.includes(relationship.status)) ||
      (relationship?.strongestStatus && norm.statuses.includes(relationship.strongestStatus));
    if (!statusMatch) {
      return false;
    }
  }
  if (norm.types && norm.types.length > 0) {
    if (!relationship?.type || !norm.types.includes(relationship.type)) {
      return false;
    }
  }
  if (norm.kinds && norm.kinds.length > 0) {
    if (!neighbor?.kind || !norm.kinds.includes(neighbor.kind)) {
      return false;
    }
  }
  if (norm.fileId) {
    if ((neighbor?.fileId ?? '') !== norm.fileId) {
      return false;
    }
  }
  return true;
}
