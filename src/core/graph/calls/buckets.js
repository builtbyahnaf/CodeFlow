/**
 * Unresolved target bucket and virtual/overload candidate bucket aggregation
 * (Phase 7 §4, §13, P7-12).
 */

import { CALL_LIMITS } from './kinds.js';

/**
 * Aggregate unresolved outgoing call sites for a given origin symbol into a
 * single expandable bucket sorted by `reasonCode`.
 *
 * @param {string} symbolId
 * @param {Array<Record<string, any>>} unresolvedSites
 * @returns {{
 *   id: string,
 *   symbolId: string,
 *   count: number,
 *   reasons: Array<{reasonCode: string, count: number}>,
 *   items: Array<Record<string, any>>,
 * }}
 */
export function buildUnresolvedBucket(symbolId, unresolvedSites) {
  const matching = (Array.isArray(unresolvedSites) ? unresolvedSites : []).filter(
    (site) => site.from === symbolId,
  );
  /** @type {Map<string, number>} */
  const byReason = new Map();
  for (const site of matching) {
    const code = site.reasonCode || 'unresolved_target';
    byReason.set(code, (byReason.get(code) ?? 0) + 1);
  }
  const reasons = [...byReason.entries()]
    .map(([reasonCode, count]) => ({ reasonCode, count }))
    .sort((a, b) => (a.reasonCode < b.reasonCode ? -1 : a.reasonCode > b.reasonCode ? 1 : 0));
  return {
    id: `bucket:unresolved:${symbolId}`,
    symbolId,
    count: matching.length,
    reasons,
    items: matching,
  };
}

/**
 * Aggregate `possible` candidate sets (virtual dispatch, ambiguous overloads)
 * when a `(from, reasonCode)` group exceeds `threshold` (default 5).
 *
 * @param {Iterable<Record<string, any>>} edges
 * @param {number} [threshold]
 * @returns {Array<{id: string, from: string, reasonCode: string, candidates: string[]}>}
 */
export function buildCandidateBuckets(edges, threshold = CALL_LIMITS.candidateBucketThreshold) {
  /** @type {Array<{id: string, from: string, reasonCode: string, candidates: string[]}>} */
  const candidateBuckets = [];
  const byFromReason = new Map();
  for (const edge of edges ?? []) {
    if (edge?.status === 'possible' && edge.reasonCode) {
      const key = `${edge.from}|${edge.reasonCode}`;
      const list = byFromReason.get(key) ?? [];
      list.push(edge);
      byFromReason.set(key, list);
    }
  }
  for (const [key, group] of byFromReason.entries()) {
    const allCands = [...new Set(group.flatMap((e) => e.candidates ?? [e.to]))].sort();
    if (allCands.length > threshold) {
      const [from, reasonCode] = key.split('|');
      candidateBuckets.push({
        id: `bucket:candidates:${from}:${reasonCode}`,
        from,
        reasonCode,
        candidates: allCands,
      });
    }
  }
  return candidateBuckets;
}
