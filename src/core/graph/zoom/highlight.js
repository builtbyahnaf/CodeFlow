/**
 * Directional incoming/outgoing highlight emphasis and per-status counts
 * for a focused node in semantic zoom (Phase 10 §9, P10-12).
 */

import { createStatusDistribution } from './distributions.js';

/**
 * Compute incoming/outgoing highlight emphasis and per-status counts from a
 * focused node (Phase 10 §9, P10-12).
 *
 * @param {{
 *   focusNodeId: string,
 *   nodes: Array<Record<string, any>>,
 *   edges: Array<Record<string, any>>,
 * }} input
 */
export function computeDirectionalHighlight({ focusNodeId, nodes = [], edges = [] }) {
  const incomingEdges = edges.filter((e) => e.to === focusNodeId);
  const outgoingEdges = edges.filter((e) => e.from === focusNodeId);

  const incomingNodeIds = new Set(incomingEdges.map((e) => e.from));
  const outgoingNodeIds = new Set(outgoingEdges.map((e) => e.to));

  const incomingStatusMix = createStatusDistribution(
    incomingEdges.flatMap((e) => (Array.isArray(e.memberEdges) ? e.memberEdges : [e])),
  );
  const outgoingStatusMix = createStatusDistribution(
    outgoingEdges.flatMap((e) => (Array.isArray(e.memberEdges) ? e.memberEdges : [e])),
  );

  return {
    focusNodeId,
    incomingNodeIds: [...incomingNodeIds].sort(),
    outgoingNodeIds: [...outgoingNodeIds].sort(),
    dimmedNodeIds: nodes
      .map((n) => n.id)
      .filter((id) => id !== focusNodeId && !incomingNodeIds.has(id) && !outgoingNodeIds.has(id))
      .sort(),
    incomingStatusMix,
    outgoingStatusMix,
  };
}
