/**
 * DFG query layer.
 *
 * Given a built Dfg, answers common questions used by the UI and explanation
 * engine without re-running analysis.
 *
 * All queries are pure (no side effects) and bounded (they honour the
 * SLICE_BUDGET_MS limit). Heavy queries return a `partial` flag when truncated.
 */

import { SLICE_BUDGET_MS } from './kinds.js';

/**
 * @typedef {import('./model.js').FlowNode} FlowNode
 * @typedef {import('./model.js').FlowEdge} FlowEdge
 * @typedef {import('./model.js').Dfg} Dfg
 */

/**
 * @typedef {Object} TraceResult
 * @property {FlowNode[]} nodes
 * @property {FlowEdge[]} edges
 * @property {boolean} partial
 * @property {string} [partialReason]
 */

/**
 * @typedef {Object} SliceResult
 * @property {FlowNode[]} nodes
 * @property {FlowEdge[]} edges
 * @property {boolean} partial
 * @property {string} [partialReason]
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an adjacency map from edges.
 *
 * @param {FlowEdge[]} edges
 * @param {'forward'|'backward'} direction
 * @returns {Map<string, FlowEdge[]>}
 */
function buildAdjacency(edges, direction) {
  /** @type {Map<string, FlowEdge[]>} */
  const adj = new Map();
  for (const e of edges) {
    const key = direction === 'forward' ? e.from : e.to;
    let arr = adj.get(key);
    if (!arr) { arr = []; adj.set(key, arr); }
    arr.push(e);
  }
  return adj;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Collect all FlowNodes for a given binding.
 *
 * @param {Dfg} dfg
 * @param {string} bindingId
 * @returns {FlowNode[]}
 */
export function nodesForBinding(dfg, bindingId) {
  return dfg.byBinding[bindingId] ?? [];
}

/**
 * Find the def(s) that reach a given use node.
 *
 * @param {Dfg} dfg
 * @param {string} useNodeId
 * @returns {FlowNode[]}
 */
export function defsReachingUse(dfg, useNodeId) {
  return dfg.edges
    .filter((e) => e.to === useNodeId && (e.kind === 'reaching' || e.kind === 'assign'))
    .map((e) => dfg.nodes.find((n) => n.id === e.from))
    .filter(Boolean);
}

/**
 * Find all uses that a given def reaches.
 *
 * @param {Dfg} dfg
 * @param {string} defNodeId
 * @returns {FlowNode[]}
 */
export function usesReachedByDef(dfg, defNodeId) {
  return dfg.edges
    .filter((e) => e.from === defNodeId && (e.kind === 'reaching' || e.kind === 'assign'))
    .map((e) => dfg.nodes.find((n) => n.id === e.to))
    .filter(Boolean);
}

/**
 * Compute all loop-carried edges in the DFG.
 *
 * @param {Dfg} dfg
 * @returns {FlowEdge[]}
 */
export function loopCarriedEdges(dfg) {
  return dfg.edges.filter((e) => e.kind === 'loop_carried');
}

/**
 * Variable trace: given a binding, return all nodes and edges in its flow
 * sub-graph, up to the slicing budget.
 *
 * @param {Dfg} dfg
 * @param {string} bindingId
 * @param {number} [budgetMs]
 * @returns {TraceResult}
 */
export function traceBinding(dfg, bindingId, budgetMs = SLICE_BUDGET_MS) {
  const startMs = Date.now();
  const seeds = new Set((dfg.byBinding[bindingId] ?? []).map((n) => n.id));
  const visitedNodes = new Set(seeds);
  const visitedEdges = new Set();

  // Forward adjacency
  const fwd = buildAdjacency(dfg.edges, 'forward');
  const bwd = buildAdjacency(dfg.edges, 'backward');

  const queue = [...seeds];
  let partial = false;

  while (queue.length > 0) {
    if (Date.now() - startMs > budgetMs) {
      partial = true;
      break;
    }
    const id = queue.shift();
    for (const adj of [fwd, bwd]) {
      const edges = adj.get(id) ?? [];
      for (const e of edges) {
        const edgeKey = `${e.from}→${e.to}`;
        if (!visitedEdges.has(edgeKey)) {
          visitedEdges.add(edgeKey);
          const other = adj === fwd ? e.to : e.from;
          if (!visitedNodes.has(other)) {
            visitedNodes.add(other);
            queue.push(other);
          }
        }
      }
    }
  }

  const nodeMap = new Map(dfg.nodes.map((n) => [n.id, n]));
  const nodes = [...visitedNodes].map((id) => nodeMap.get(id)).filter(Boolean);
  const edges = dfg.edges.filter((e) =>
    visitedNodes.has(e.from) && visitedNodes.has(e.to),
  );

  return {
    nodes: /** @type {FlowNode[]} */ (nodes),
    edges,
    partial,
    ...(partial ? { partialReason: 'too_large' } : {}),
  };
}

/**
 * Backward slice from a use node: find all defs (transitively) that could
 * have contributed the value at this use.
 *
 * @param {Dfg} dfg
 * @param {string} useNodeId
 * @param {number} [budgetMs]
 * @returns {SliceResult}
 */
export function backwardSlice(dfg, useNodeId, budgetMs = SLICE_BUDGET_MS) {
  const startMs = Date.now();
  const bwd = buildAdjacency(dfg.edges, 'backward');
  const visited = new Set([useNodeId]);
  const visitedEdges = new Set();
  const queue = [useNodeId];
  let partial = false;

  while (queue.length > 0) {
    if (Date.now() - startMs > budgetMs) {
      partial = true;
      break;
    }
    const id = queue.shift();
    const edges = bwd.get(id) ?? [];
    for (const e of edges) {
      const key = `${e.from}→${e.to}`;
      if (!visitedEdges.has(key)) {
        visitedEdges.add(key);
        if (!visited.has(e.from)) {
          visited.add(e.from);
          queue.push(e.from);
        }
      }
    }
  }

  const nodeMap = new Map(dfg.nodes.map((n) => [n.id, n]));
  const nodes = [...visited].map((id) => nodeMap.get(id)).filter(Boolean);
  const edges = dfg.edges.filter(
    (e) => visitedEdges.has(`${e.from}→${e.to}`),
  );

  return {
    nodes: /** @type {FlowNode[]} */ (nodes),
    edges,
    partial,
    ...(partial ? { partialReason: 'too_large' } : {}),
  };
}

/**
 * Forward slice from a def node: find all uses that transitively receive
 * this value.
 *
 * @param {Dfg} dfg
 * @param {string} defNodeId
 * @param {number} [budgetMs]
 * @returns {SliceResult}
 */
export function forwardSlice(dfg, defNodeId, budgetMs = SLICE_BUDGET_MS) {
  const startMs = Date.now();
  const fwd = buildAdjacency(dfg.edges, 'forward');
  const visited = new Set([defNodeId]);
  const visitedEdges = new Set();
  const queue = [defNodeId];
  let partial = false;

  while (queue.length > 0) {
    if (Date.now() - startMs > budgetMs) {
      partial = true;
      break;
    }
    const id = queue.shift();
    const edges = fwd.get(id) ?? [];
    for (const e of edges) {
      const key = `${e.from}→${e.to}`;
      if (!visitedEdges.has(key)) {
        visitedEdges.add(key);
        if (!visited.has(e.to)) {
          visited.add(e.to);
          queue.push(e.to);
        }
      }
    }
  }

  const nodeMap = new Map(dfg.nodes.map((n) => [n.id, n]));
  const nodes = [...visited].map((id) => nodeMap.get(id)).filter(Boolean);
  const edges = dfg.edges.filter(
    (e) => visitedEdges.has(`${e.from}→${e.to}`),
  );

  return {
    nodes: /** @type {FlowNode[]} */ (nodes),
    edges,
    partial,
    ...(partial ? { partialReason: 'too_large' } : {}),
  };
}

/**
 * Summarise the flow of a binding as human-readable detail-panel entries.
 *
 * @param {Dfg} dfg
 * @param {string} bindingId
 * @returns {Array<{text: string, status: string, reasonCode?: string}>}
 */
