/**
 * Deterministic layered layout for CFGs.
 *
 * Layout runs in the extension host, before the DTO crosses the webview
 * boundary. The webview therefore never blocks its main thread on graph
 * computation; it only draws positions that are already in the DTO.
 *
 * Back edges (`loop_back`, `continue`) do not participate in rank assignment,
 * so loops do not push the graph forever downwards. A residual cycle is
 * tolerated by capping rank relaxation.
 */

import { BACK_EDGE_KINDS } from './kinds.js';

export const CFG_LAYOUT_DEFAULTS = Object.freeze({
  horizontalGap: 64,
  verticalGap: 52,
  padding: 32,
  maxRank: 400,
});

const NODE_SIZES = Object.freeze({
  entry: { width: 150, height: 48 },
  exit: { width: 130, height: 48 },
  condition: { width: 160, height: 52 },
  multiway: { width: 180, height: 56 },
  merge: { width: 120, height: 44 },
  loop_header: { width: 170, height: 52 },
  loop_latch: { width: 160, height: 44 },
  loop_body_entry: { width: 160, height: 48 },
  catch_entry: { width: 140, height: 48 },
  finally_entry: { width: 140, height: 48 },
  return: { width: 170, height: 48 },
  throw: { width: 150, height: 48 },
  call: { width: 200, height: 56 },
  await: { width: 160, height: 48 },
  unmodeled: { width: 200, height: 56 },
  unreachable: { width: 200, height: 52 },
  break: { width: 140, height: 44 },
  continue: { width: 150, height: 44 },
  statement: { width: 190, height: 52 },
});

const LABEL_CHAR_WIDTH = 7;
const LABEL_LINE_HEIGHT = 15;
const MAX_NODE_WIDTH = 560;
const MAX_NODE_HEIGHT = 240;

const SHAPE_METRICS = Object.freeze({
  entry: { textScale: 1.18, horizontalPadding: 34, verticalPadding: 18 },
  exit: { textScale: 1.18, horizontalPadding: 34, verticalPadding: 18 },
  condition: { textScale: 1.72, horizontalPadding: 54, verticalPadding: 30 },
  multiway: { textScale: 1.32, horizontalPadding: 44, verticalPadding: 24 },
  loop_header: { textScale: 1.28, horizontalPadding: 42, verticalPadding: 24 },
  loop_latch: { textScale: 1.18, horizontalPadding: 36, verticalPadding: 20 },
  loop_body_entry: { textScale: 1.08, horizontalPadding: 28, verticalPadding: 20 },
  return: { textScale: 1.34, horizontalPadding: 46, verticalPadding: 22 },
  throw: { textScale: 1.34, horizontalPadding: 46, verticalPadding: 22 },
  call: { textScale: 1.12, horizontalPadding: 38, verticalPadding: 22 },
  await: { textScale: 1.12, horizontalPadding: 38, verticalPadding: 22 },
  merge: { textScale: 1.12, horizontalPadding: 30, verticalPadding: 18 },
  unmodeled: { textScale: 1.05, horizontalPadding: 28, verticalPadding: 22 },
  unreachable: { textScale: 1.05, horizontalPadding: 28, verticalPadding: 22 },
});

/**
 * @param {string|undefined} kind
 * @returns {{textScale: number, horizontalPadding: number, verticalPadding: number}}
 */
function metricsFor(kind) {
  return SHAPE_METRICS[kind ?? 'statement'] ?? {
    textScale: 1,
    horizontalPadding: 24,
    verticalPadding: 20,
  };
}

/**
 * @param {{nodes: Array<{id: string, kind: string, unreachable?: boolean}>, edges: Array<{from: string, to: string, kind: string}>}} cfg
 * @param {Partial<typeof CFG_LAYOUT_DEFAULTS>} [options]
 * @returns {{positions: Record<string, {x: number, y: number, width: number, height: number, layer: number}>, width: number, height: number, layers: string[][]}}
 */
export function layoutCfg(cfg, options = {}) {
  const config = { ...CFG_LAYOUT_DEFAULTS, ...options };
  const nodes = Array.isArray(cfg.nodes) ? cfg.nodes : [];
  const edges = Array.isArray(cfg.edges) ? cfg.edges : [];
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const entry = nodes.find((node) => node.kind === 'entry') ?? nodes[0];

  /** @type {Map<string, string[]>} */
  const predecessors = new Map();
  for (const node of nodes) {
    predecessors.set(node.id, []);
  }
  for (const edge of edges) {
    if (BACK_EDGE_KINDS.includes(edge.kind)) {
      continue;
    }
    if (!byId.has(edge.from) || !byId.has(edge.to)) {
      continue;
    }
    predecessors.get(edge.to)?.push(edge.from);
  }

  /** @type {Map<string, number>} */
  const ranks = new Map();
  for (const node of nodes) {
    ranks.set(node.id, 0);
  }
  if (entry) {
    ranks.set(entry.id, 0);
  }

  let changed = true;
  let passes = 0;
  while (changed && passes < config.maxRank) {
    changed = false;
    passes += 1;
    for (const node of nodes) {
      if (node === entry) {
        continue;
      }
      let best = ranks.get(node.id) ?? 0;
      for (const previous of predecessors.get(node.id) ?? []) {
        best = Math.max(best, (ranks.get(previous) ?? 0) + 1);
      }
      if (best !== ranks.get(node.id) && best <= config.maxRank) {
        ranks.set(node.id, best);
        changed = true;
      }
    }
  }

  let maxRank = 0;
  for (const rank of ranks.values()) {
    maxRank = Math.max(maxRank, rank);
  }
  for (const node of nodes) {
    if (node.unreachable) {
      ranks.set(node.id, maxRank + 2);
    }
  }
  maxRank = 0;
  for (const rank of ranks.values()) {
    maxRank = Math.max(maxRank, rank);
  }

  /** @type {Map<string, number>} */
  const branchPriority = new Map();
  const priorityOfEdge = (kind) => {
    if (kind === 'true') return 0;
    if (kind === 'case') return 1;
    if (kind === 'seq' || kind === 'loop_back') return 2;
    if (kind === 'false' || kind === 'default') return 3;
    return 2;
  };
  for (const edge of edges) {
    if (!byId.has(edge.from) || !byId.has(edge.to)) {
      continue;
    }
    const p = priorityOfEdge(edge.kind);
    const existing = branchPriority.get(edge.to);
    if (existing === undefined || p < existing) {
      branchPriority.set(edge.to, p);
    }
  }

  /** @type {string[][]} */
  const layers = Array.from({ length: maxRank + 1 }, () => []);
  for (const node of nodes) {
    layers[ranks.get(node.id) ?? 0].push(node.id);
  }
  for (const layer of layers) {
    layer.sort((a, b) => {
      const pa = branchPriority.get(a) ?? 2;
      const pb = branchPriority.get(b) ?? 2;
      if (pa !== pb) {
        return pa - pb;
      }
      return a < b ? -1 : a > b ? 1 : 0;
    });
  }

  /** @type {Record<string, {x: number, y: number, width: number, height: number, layer: number}>} */
  const positions = {};
  /** @type {number[]} */
  const layerWidths = [];
  for (const layer of layers) {
    let width = 0;
    for (const id of layer) {
      const node = byId.get(id);
      width += sizeFor(node).width + config.horizontalGap;
    }
    layerWidths.push(Math.max(0, width - config.horizontalGap));
  }
  const widest = layerWidths.length > 0 ? Math.max(...layerWidths) : 0;

  let y = config.padding;
  for (let layerIndex = 0; layerIndex < layers.length; layerIndex += 1) {
    const layer = layers[layerIndex];
    const rowHeight =
      layer.length === 0
        ? 0
        : Math.max(...layer.map((id) => sizeFor(byId.get(id)).height));
    let x = config.padding + Math.max(0, (widest - layerWidths[layerIndex]) / 2);
    for (const id of layer) {
      const node = byId.get(id);
      const size = sizeFor(node);
      positions[id] = {
        x,
        y,
        width: size.width,
        height: size.height,
        layer: layerIndex,
      };
      x += size.width + config.horizontalGap;
    }
    y += rowHeight + config.verticalGap;
  }

  const width = Math.max(config.padding * 2 + widest, config.padding * 2 + 120);
  const height = Math.max(config.padding * 2 + 120, y - config.verticalGap + config.padding);
  return { positions, width, height, layers };
}

/**
 * Size a node from its shape and its wrapped label. Labels are never
 * truncated, so a long declaration simply gets a wider and taller node.
 *
 * @param {{kind?: string, labelLines?: string[]}|null|undefined} node
 * @returns {{width: number, height: number}}
 */
function sizeFor(node) {
  const kind = node?.kind ?? 'statement';
  const base = NODE_SIZES[kind] ?? NODE_SIZES.statement;
  const lines =
    Array.isArray(node?.labelLines) && node.labelLines.length > 0
      ? node.labelLines
      : [];
  if (lines.length === 0) {
    return base;
  }
  const metrics = metricsFor(kind);
  const longest = Math.max(...lines.map((line) => String(line).length));
  const width = Math.min(
    MAX_NODE_WIDTH,
    Math.max(
      base.width,
      Math.ceil(longest * LABEL_CHAR_WIDTH * metrics.textScale + metrics.horizontalPadding),
    ),
  );
  const height = Math.min(
    MAX_NODE_HEIGHT,
    Math.max(
      base.height,
      Math.ceil(lines.length * LABEL_LINE_HEIGHT + metrics.verticalPadding),
    ),
  );
  return { width, height };
}
