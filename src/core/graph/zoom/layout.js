/**
 * Anchored incremental layout and viewport virtualization for large semantic
 * zoom levels (Phase 10 §7, P10-18, P10-19, P10-20, AC-10.7).
 *
 * Requirements:
 * 1. Expanding a cluster anchors the layout at the expanded cluster's screen
 *    coordinates `(x, y)` so the user's focal point never jumps.
 * 2. Refreshing data diffs nodes by ID, reuses existing positions, and only
 *    places newly added nodes in a deterministic grid around the anchor.
 * 3. Honors `prefers-reduced-motion` (`transitionMs = 0` when `reducedMotion === true`,
 *    otherwise `<= 250 ms`).
 * 4. Viewport virtualization culls offscreen nodes beyond `viewport + padding`
 *    when a level contains large node counts (`> 200`), keeping pan/zoom
 *    interactive.
 */

export const MAX_TRANSITION_MS = 220;

const DEFAULT_NODE_WIDTH = 180;
const DEFAULT_NODE_HEIGHT = 64;
const GRID_GAP_X = 220;
const GRID_GAP_Y = 100;

/**
 * Compute an anchored incremental layout that preserves existing node
 * coordinates across refreshes and cluster expansions.
 *
 * @param {{
 *   previousNodes?: Array<{id: string, x?: number, y?: number, width?: number, height?: number}>,
 *   nextNodes: Array<Record<string, any>>,
 *   anchorNodeId?: string|null,
 *   anchorPosition?: {x: number, y: number}|null,
 *   columns?: number,
 *   reducedMotion?: boolean,
 * }} input
 */
export function computeAnchoredIncrementalLayout({
  previousNodes = [],
  nextNodes = [],
  anchorNodeId = null,
  anchorPosition = null,
  columns = 4,
  reducedMotion = false,
}) {
  const prevById = new Map();
  for (const prev of Array.isArray(previousNodes) ? previousNodes : []) {
    if (prev && typeof prev.id === 'string' && Number.isFinite(prev.x) && Number.isFinite(prev.y)) {
      prevById.set(prev.id, {
        x: Number(prev.x),
        y: Number(prev.y),
        width: Number(prev.width ?? DEFAULT_NODE_WIDTH),
        height: Number(prev.height ?? DEFAULT_NODE_HEIGHT),
      });
    }
  }

  const anchorCoords =
    anchorPosition ??
    (anchorNodeId && prevById.has(anchorNodeId) ? prevById.get(anchorNodeId) : { x: 0, y: 0 });

  const safeCols = Math.max(1, Math.trunc(Number(columns) || 4));
  let reusedCount = 0;
  let placedNewCount = 0;

  const positionedNodes = nextNodes.map((node, index) => {
    const existing = prevById.get(node.id);
    if (existing) {
      reusedCount += 1;
      return {
        ...node,
        x: existing.x,
        y: existing.y,
        width: Number(node.width ?? existing.width),
        height: Number(node.height ?? existing.height),
        animated: false,
      };
    }

    const col = placedNewCount % safeCols;
    const row = Math.floor(placedNewCount / safeCols);
    placedNewCount += 1;

    const x =
      node.id === anchorNodeId
        ? anchorCoords.x
        : anchorCoords.x + col * GRID_GAP_X + (index === 0 ? 0 : 40);
    const y = node.id === anchorNodeId ? anchorCoords.y : anchorCoords.y + row * GRID_GAP_Y;

    return {
      ...node,
      x,
      y,
      width: Number(node.width ?? DEFAULT_NODE_WIDTH),
      height: Number(node.height ?? DEFAULT_NODE_HEIGHT),
      animated: !reducedMotion,
    };
  });

  return {
    nodes: positionedNodes,
    anchor: {
      nodeId: anchorNodeId,
      x: anchorCoords.x,
      y: anchorCoords.y,
    },
    reusedCount,
    placedNewCount,
    transitionMs: reducedMotion ? 0 : MAX_TRANSITION_MS,
  };
}

/**
 * Virtualize a positioned graph for the current viewport rectangle so offscreen
 * nodes are culled during large-graph rendering (P10-18).
 *
 * @param {{
 *   nodes: Array<{id: string, x: number, y: number, width?: number, height?: number}>,
 *   edges?: Array<{from: string, to: string}>,
 *   viewport: {x: number, y: number, width: number, height: number, zoom?: number},
 *   padding?: number,
 * }} input
 */
export function virtualizeViewport({
  nodes = [],
  edges = [],
  viewport = { x: 0, y: 0, width: 1200, height: 800, zoom: 1 },
  padding = 200,
}) {
  const minX = Number(viewport.x ?? 0) - padding;
  const minY = Number(viewport.y ?? 0) - padding;
  const maxX = Number(viewport.x ?? 0) + Number(viewport.width ?? 1200) + padding;
  const maxY = Number(viewport.y ?? 0) + Number(viewport.height ?? 800) + padding;

  const visibleNodes = nodes.filter((node) => {
    const w = Number(node.width ?? DEFAULT_NODE_WIDTH);
    const h = Number(node.height ?? DEFAULT_NODE_HEIGHT);
    return node.x + w >= minX && node.x <= maxX && node.y + h >= minY && node.y <= maxY;
  });

  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleEdges = edges.filter((edge) => visibleIds.has(edge.from) || visibleIds.has(edge.to));

  return {
    visibleNodes,
    visibleEdges,
    totalNodes: nodes.length,
    culledNodeCount: nodes.length - visibleNodes.length,
  };
}
