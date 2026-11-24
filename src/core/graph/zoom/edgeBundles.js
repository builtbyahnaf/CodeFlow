/**
 * Edge bundling per relationship type with status distributions
 * (Phase 10 §5.3 Rule #4, P10-11).
 *
 * Non-negotiable rule:
 * Edge bundles NEVER merge `calls` and `references` (or `imports`/`includes`).
 * Bundling is strictly keyed by `(fromClusterId, toClusterId, relationshipType)`.
 */

import { createStatusDistribution } from './distributions.js';

/**
 * Format a human-readable bundle label preserving non-resolved counts
 * (e.g. `"12 calls (2 unresolved)"`, `"4 imports"`).
 *
 * @param {string} type
 * @param {ReturnType<typeof createStatusDistribution>} statusMix
 * @returns {string}
 */
export function formatEdgeBundleLabel(type, statusMix) {
  const total = statusMix.total;
  const noun = total === 1 ? type.replace(/s$/, '') : type;
  /** @type {string[]} */
  const qualifiers = [];
  if (statusMix.counts.unresolved > 0) {
    qualifiers.push(`${statusMix.counts.unresolved} unresolved`);
  }
  if (statusMix.counts.possible > 0) {
    qualifiers.push(`${statusMix.counts.possible} possible`);
  }
  if (statusMix.counts.stale > 0) {
    qualifiers.push(`${statusMix.counts.stale} stale`);
  }
  const suffix = qualifiers.length > 0 ? ` (${qualifiers.join(', ')})` : '';
  return `${total} ${noun}${suffix}`;
}

/**
 * Bundle edges between clusters or aggregate nodes strictly per relationship type.
 *
 * @param {Array<{
 *   id?: string,
 *   relationshipId?: string,
 *   from: string,
 *   to: string,
 *   type?: string,
 *   status?: string,
 *   stale?: boolean,
 *   reasonCode?: string,
 * }>} edges
 * @param {Record<string, string> | Map<string, string>} [endpointClusterMap]
 */
export function bundleClusterEdges(edges = [], endpointClusterMap = new Map()) {
  const resolveEndpoint = (id) => {
    if (endpointClusterMap instanceof Map) {
      return endpointClusterMap.get(id) ?? id;
    }
    return endpointClusterMap?.[id] ?? id;
  };

  /** @type {Map<string, Array<Record<string, any>>>} */
  const groups = new Map();

  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      continue;
    }
    const fromCluster = resolveEndpoint(edge.from);
    const toCluster = resolveEndpoint(edge.to);
    if (!fromCluster || !toCluster || fromCluster === toCluster) {
      continue;
    }
    const relType = String(edge.type ?? 'calls');
    const key = `${fromCluster}|${toCluster}|${relType}`;
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = [];
      groups.set(key, bucket);
    }
    bucket.push(edge);
  }

  /** @type {Array<Record<string, any>>} */
  const bundles = [];
  for (const [key, memberEdges] of [...groups.entries()].sort((a, b) =>
    a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
  )) {
    const [from, to, type] = key.split('|');
    const statusMix = createStatusDistribution(memberEdges);
    const bundleId = `bundle:${from}->${to}:${type}`;
    bundles.push({
      id: bundleId,
      from,
      to,
      type,
      count: memberEdges.length,
      label: formatEdgeBundleLabel(type, statusMix),
      statusMix,
      displayStatus: statusMix.displayStatus,
      badges: statusMix.badges,
      memberEdges: memberEdges.map((e, idx) => ({
        id: e.id ?? e.relationshipId ?? `${bundleId}#${idx}`,
        from: e.from,
        to: e.to,
        type,
        status: e.status ?? 'resolved',
        ...(e.reasonCode ? { reasonCode: e.reasonCode } : {}),
      })),
    });
  }

  return bundles;
}
