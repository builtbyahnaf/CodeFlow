/**
 * Visible filter chips and level node/edge filtering for semantic zoom
 * (Phase 10 §9, P10-15).
 */

/**
 * Filter a zoom level's nodes and edges by `kinds`, `relationshipTypes`, and
 * `statuses` and return visible filter chips so filters are never hidden state
 * (P10-15).
 *
 * @param {{nodes: Array<Record<string, any>>, edges: Array<Record<string, any>>}} viewDto
 * @param {{kinds?: string[], relationshipTypes?: string[], statuses?: string[]}} [filters]
 */
export function applyZoomFilters(viewDto, filters = {}) {
  const kinds = Array.isArray(filters.kinds) ? filters.kinds.filter(Boolean) : [];
  const relTypes = Array.isArray(filters.relationshipTypes)
    ? filters.relationshipTypes.filter(Boolean)
    : [];
  const statuses = Array.isArray(filters.statuses) ? filters.statuses.filter(Boolean) : [];

  const kindSet = kinds.length > 0 ? new Set(kinds) : null;
  const typeSet = relTypes.length > 0 ? new Set(relTypes) : null;
  const statusSet = statuses.length > 0 ? new Set(statuses) : null;

  const nodes = (viewDto?.nodes ?? []).filter((node) => {
    if (kindSet && !kindSet.has(node.kind)) {
      return false;
    }
    if (statusSet) {
      const nodeStatus = node.displayStatus ?? node.status ?? 'resolved';
      const hasMatchingStatusInMix = node.statusMix?.counts
        ? statuses.some((st) => Number(node.statusMix.counts[st] ?? 0) > 0)
        : false;
      if (!statusSet.has(nodeStatus) && !hasMatchingStatusInMix) {
        return false;
      }
    }
    return true;
  });

  const visibleNodeIds = new Set(nodes.map((n) => n.id));
  const edges = (viewDto?.edges ?? []).filter((edge) => {
    if (!visibleNodeIds.has(edge.from) || !visibleNodeIds.has(edge.to)) {
      return false;
    }
    if (typeSet && !typeSet.has(edge.type ?? edge.kind)) {
      return false;
    }
    if (statusSet) {
      const edgeStatus = edge.displayStatus ?? edge.status ?? 'resolved';
      const hasMatchingMix = edge.statusMix?.counts
        ? statuses.some((st) => Number(edge.statusMix.counts[st] ?? 0) > 0)
        : false;
      if (!statusSet.has(edgeStatus) && !hasMatchingMix) {
        return false;
      }
    }
    return true;
  });

  /** @type {Array<{id: string, category: 'kind'|'relationshipType'|'status', value: string, label: string}>} */
  const chips = [
    ...kinds.map((k) => ({
      id: `kind:${k}`,
      category: /** @type {'kind'} */ ('kind'),
      value: k,
      label: `kind: ${k}`,
    })),
    ...relTypes.map((t) => ({
      id: `type:${t}`,
      category: /** @type {'relationshipType'} */ ('relationshipType'),
      value: t,
      label: `edge: ${t}`,
    })),
    ...statuses.map((s) => ({
      id: `status:${s}`,
      category: /** @type {'status'} */ ('status'),
      value: s,
      label: `status: ${s}`,
    })),
  ];

  return {
    nodes,
    edges,
    chips,
    hiddenNodeCount: Math.max(0, (viewDto?.nodes?.length ?? 0) - nodes.length),
    hiddenEdgeCount: Math.max(0, (viewDto?.edges?.length ?? 0) - edges.length),
  };
}
