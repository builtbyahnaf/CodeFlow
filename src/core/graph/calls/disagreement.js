/**
 * Cross-source disagreement detection for call-graph merging (Phase 7 §6, P7-07).
 *
 * When a `resolved` edge is present in source A but absent in source B that
 * also covers the origin symbol `from`, emits a `source_disagreement`
 * diagnostic so discrepancies are surfaced in the diagnostics panel rather
 * than hidden.
 */

/**
 * Detect `resolved` edges present in one evidence source but absent in another
 * evidence source that covers the same origin symbol.
 *
 * @param {Iterable<Record<string, any>>} mergedEdges
 * @param {Array<{sourceId: string}>} sortedSources
 * @param {Map<string, Set<string>>} coveredBySource
 * @returns {Array<{
 *   code: 'source_disagreement',
 *   severity: 'warning',
 *   message: string,
 *   from: string,
 *   to: string,
 *   type: string,
 *   sources: string[],
 * }>}
 */
export function detectRelationshipDisagreements(mergedEdges, sortedSources, coveredBySource) {
  if (!Array.isArray(sortedSources) || sortedSources.length <= 1) {
    return [];
  }
  /** @type {Array<{code: 'source_disagreement', severity: 'warning', message: string, from: string, to: string, type: string, sources: string[]}>} */
  const diagnostics = [];
  /** @type {Set<string>} */
  const seen = new Set();

  for (const edge of mergedEdges ?? []) {
    if (edge?.strongestStatus !== 'resolved') {
      continue;
    }
    const presentIn = new Set(edge.sourceIds ?? []);
    const missingFrom = [];
    for (const source of sortedSources) {
      const covered = coveredBySource.get(source.sourceId);
      if (covered?.has(edge.from) && !presentIn.has(source.sourceId)) {
        missingFrom.push(source.sourceId);
      }
    }
    if (missingFrom.length > 0) {
      const key = `disagree|${edge.from}|${edge.to}|${edge.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        diagnostics.push({
          code: 'source_disagreement',
          severity: 'warning',
          message: `Resolved ${edge.type} edge "${edge.from} -> ${edge.to}" is present in [${[...presentIn].join(', ')}] but absent in [${missingFrom.join(', ')}].`,
          from: edge.from,
          to: edge.to,
          type: edge.type,
          sources: [...presentIn, ...missingFrom],
        });
      }
    }
  }

  return diagnostics;
}
