/**
 * Deterministic layered layout.
 *
 * Phase 0 needs positions so the webview can draw something without owning a
 * layout algorithm. Phase 4 benchmarks real engines (Cytoscape/ELK/dagre) and
 * replaces this behind the renderer boundary; until then, deterministic output
 * is more valuable than pretty output because it makes tests stable.
 */

/**
 * @typedef {import('./model.js').Graph} Graph
 * @typedef {{x: number, y: number, width: number, height: number, layer: number}} Position
 */

export const LAYOUT_DEFAULTS = Object.freeze({
  nodeWidth: 190,
  nodeHeight: 54,
  horizontalGap: 90,
  verticalGap: 26,
  maxLayers: 40,
});

/**
 * @param {Graph} graph
 * @param {Partial<typeof LAYOUT_DEFAULTS>} [options]
 * @returns {{positions: Record<string, Position>, width: number, height: number, layers: string[][]}}
 */
export function computeLayout(graph, options = {}) {
  const config = { ...LAYOUT_DEFAULTS, ...options };
  const nodeIds = graph.nodes.map((node) => node.id);
  /** @type {Map<string, number>} */
  const layerOf = new Map();

  /** @type {Map<string, string[]>} */
  const incoming = new Map(nodeIds.map((id) => [id, []]));
  /** @type {Map<string, string[]>} */
  const outgoing = new Map(nodeIds.map((id) => [id, []]));

  for (const edge of graph.edges) {
    if (!incoming.has(edge.to) || !incoming.has(edge.from) || edge.from === edge.to) {
      continue;
    }
    incoming.get(edge.to)?.push(edge.from);
    outgoing.get(edge.from)?.push(edge.to);
  }

  // Kahn's algorithm gives a topological order; cycles are handled afterwards.
  /** @type {Map<string, number>} */
  const indegree = new Map(nodeIds.map((id) => [id, incoming.get(id)?.length ?? 0]));
  const ready = nodeIds.filter((id) => (indegree.get(id) ?? 0) === 0).sort();
  /** @type {string[]} */
  const order = [];

  while (ready.length > 0) {
    const id = /** @type {string} */ (ready.shift());
    order.push(id);
    for (const next of (outgoing.get(id) ?? []).slice().sort()) {
      const remaining = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, remaining);
      if (remaining === 0) {
        ready.push(next);
        ready.sort();
      }
    }
  }

  let maxLayer = 0;
  for (const id of order) {
    const predecessors = incoming.get(id) ?? [];
    const layer =
      predecessors.length === 0
        ? 0
        : Math.max(...predecessors.map((pred) => layerOf.get(pred) ?? 0)) + 1;
    layerOf.set(id, layer);
    maxLayer = Math.max(maxLayer, layer);
  }

  // Nodes inside a cycle never reach indegree 0. Place them after everything
  // that could be ordered, rather than dropping them.
  const cyclic = nodeIds.filter((id) => !layerOf.has(id)).sort();
  for (const id of cyclic) {
    layerOf.set(id, Math.min(maxLayer + 1, config.maxLayers));
  }

  /** @type {Map<number, string[]>} */
  const byLayer = new Map();
  for (const id of nodeIds.slice().sort()) {
    const layer = Math.min(layerOf.get(id) ?? 0, config.maxLayers);
    if (!byLayer.has(layer)) {
      byLayer.set(layer, []);
    }
    byLayer.get(layer)?.push(id);
  }

  /** @type {Record<string, Position>} */
  const positions = {};
  /** @type {string[][]} */
  const layers = [];
  let tallest = 0;

  for (const layer of [...byLayer.keys()].sort((a, b) => a - b)) {
    const ids = byLayer.get(layer) ?? [];
    layers.push(ids);
    ids.forEach((id, index) => {
      positions[id] = {
        x: layer * (config.nodeWidth + config.horizontalGap),
        y: index * (config.nodeHeight + config.verticalGap),
        width: config.nodeWidth,
        height: config.nodeHeight,
        layer,
      };
    });
    tallest = Math.max(tallest, ids.length);
  }

  return {
    positions,
    width: Math.max(1, layers.length) * (config.nodeWidth + config.horizontalGap),
    height: Math.max(1, tallest) * (config.nodeHeight + config.verticalGap),
    layers,
  };
}
