/**
 * Call-graph cursor encoding/decoding and limit clamping (Phase 7 §5, §13).
 *
 * Cursors embed `runId` so an analysis reload or edit invalidates old cursors
 * cleanly and restarts pagination at offset 0 with a `stale_cursor_reset`
 * notice rather than serving a drifted offset.
 */

import { CALL_LIMITS } from './kinds.js';

/**
 * @param {{runId: string, offset: number}} input
 * @returns {string}
 */
export function encodeCallCursor({ runId, offset }) {
  return `${String(runId ?? '')}::${Math.max(0, Math.trunc(Number(offset) || 0))}`;
}

/**
 * @param {unknown} cursor
 * @param {string} currentRunId
 * @returns {{offset: number, reset: boolean}}
 */
export function decodeCallCursor(cursor, currentRunId) {
  if (typeof cursor !== 'string' || cursor.length === 0) {
    return { offset: 0, reset: false };
  }
  const sep = cursor.lastIndexOf('::');
  if (sep < 0) {
    return { offset: 0, reset: true };
  }
  const cursorRunId = cursor.slice(0, sep);
  const rawOffset = Number(cursor.slice(sep + 2));
  if (cursorRunId !== currentRunId || !Number.isInteger(rawOffset) || rawOffset < 0) {
    return { offset: 0, reset: true };
  }
  return { offset: rawOffset, reset: false };
}

/**
 * @param {unknown} limit
 * @returns {number}
 */
export function clampCallPageSize(limit) {
  const num = Number(limit);
  if (!Number.isFinite(num)) {
    return CALL_LIMITS.defaultPageSize;
  }
  return Math.min(CALL_LIMITS.maxPageSize, Math.max(1, Math.trunc(num)));
}

/**
 * @param {unknown} depth
 * @returns {number}
 */
export function clampCallDepth(depth) {
  const num = Number(depth);
  if (!Number.isFinite(num)) {
    return CALL_LIMITS.defaultDepth;
  }
  return Math.min(CALL_LIMITS.maxDepth, Math.max(1, Math.trunc(num)));
}

/**
 * @param {unknown} maxNodes
 * @returns {number}
 */
export function clampCallMaxNodes(maxNodes) {
  const num = Number(maxNodes);
  if (!Number.isFinite(num)) {
    return CALL_LIMITS.maxNodes;
  }
  return Math.min(CALL_LIMITS.maxNodes, Math.max(2, Math.trunc(num)));
}
