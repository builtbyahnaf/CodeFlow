/**
 * Call-graph focus mode neighborhood calculator (Phase 7 §4, P7-11).
 *
 * Computes the immediate 1-hop neighborhood around a focused node so non-neighbor
 * nodes and edges can be dimmed without altering total caller/callee counts.
 */

/**
 * Compute the set of node ids in the immediate 1-hop neighborhood of
 * `focusedNodeId`. Returns an empty Set when `focusedNodeId` is null or not
 * present in `nodes`.
 *
 * @param {string|null|undefined} focusedNodeId
 * @param {Array<{id: string}>} nodes
 * @param {Array<{from: string, to: string}>} edges
 * @returns {Set<string>}
 */
export function computeFocusNeighborhood(focusedNodeId, nodes, edges) {
  /** @type {Set<string>} */
  const neighborhood = new Set();
  if (typeof focusedNodeId !== 'string' || focusedNodeId.length === 0) {
    return neighborhood;
  }
  const exists = (Array.isArray(nodes) ? nodes : []).some((node) => node?.id === focusedNodeId);
  if (!exists) {
    return neighborhood;
  }
  neighborhood.add(focusedNodeId);
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (edge?.from === focusedNodeId && typeof edge.to === 'string') {
      neighborhood.add(edge.to);
    }
    if (edge?.to === focusedNodeId && typeof edge.from === 'string') {
      neighborhood.add(edge.from);
    }
  }
  return neighborhood;
}

/**
 * @param {string} nodeId
 * @param {Set<string>} neighborhood
 * @returns {boolean}
 */
export function isNodeDimmed(nodeId, neighborhood) {
  return neighborhood.size > 0 && !neighborhood.has(nodeId);
}

/**
 * @param {{from: string, to: string}} edge
 * @param {Set<string>} neighborhood
 * @returns {boolean}
 */
export function isEdgeDimmed(edge, neighborhood) {
  return neighborhood.size > 0 && !(neighborhood.has(edge.from) && neighborhood.has(edge.to));
}
