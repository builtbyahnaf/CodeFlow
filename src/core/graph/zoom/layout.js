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
 * Compute dynamic node box dimensions from wrapped label lines and badges so
 * long file paths, directory names, and symbol names never overflow their box.
 *
 * @param {Record<string, any>} node
 * @returns {{width: number, height: number}}
 */
function zoomSizeFor(node) {
  if (
    Number.isFinite(node?.position?.width) &&
    Number.isFinite(node?.position?.height)
  ) {
    return {
      width: Number(node.position.width),
      height: Number(node.position.height),
    };
  }
  if (Number.isFinite(node?.width) && Number.isFinite(node?.height)) {
    return {
      width: Number(node.width),
      height: Number(node.height),
    };
  }
  const lines =
    Array.isArray(node?.labelLines) && node.labelLines.length > 0
      ? node.labelLines.map(String)
      : String(node?.label ?? node?.id ?? '')
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);
  const longest = lines.reduce((max, l) => Math.max(max, l.length), 0);
  const badgeText =
    typeof node?.badge === 'string' && node.badge.length > 0
      ? node.badge
      : Array.isArray(node?.badges) && node.badges.length > 0
        ? node.badges.join(' · ')
        : '';
  const hasBadges = badgeText.length > 0;
  const contentChars = Math.max(longest, Math.ceil(badgeText.length * 0.78));
  const width = Math.min(440, Math.max(DEFAULT_NODE_WIDTH, Math.round(contentChars * 8.2 + 44)));
  const height = Math.min(
    320,
    Math.max(DEFAULT_NODE_HEIGHT, Math.max(1, lines.length) * 17 + (hasBadges ? 16 : 0) + 30),
  );
  return { width, height };
}

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

  const sizes = nextNodes.map((node) => zoomSizeFor(node));
  const maxWidth = sizes.reduce((m, s) => Math.max(m, s.width), DEFAULT_NODE_WIDTH);
  const maxHeight = sizes.reduce((m, s) => Math.max(m, s.height), DEFAULT_NODE_HEIGHT);
  const stepX = Math.max(GRID_GAP_X, maxWidth + 44);
  const stepY = Math.max(GRID_GAP_Y, maxHeight + 36);

  const safeCols = Math.max(1, Math.trunc(Number(columns) || 4));
  let reusedCount = 0;
  let placedNewCount = 0;

  const positionedNodes = nextNodes.map((node, index) => {
    const size = sizes[index];
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

    if (
      node.position &&
      Number.isFinite(node.position.x) &&
      Number.isFinite(node.position.y)
    ) {
      placedNewCount += 1;
      return {
        ...node,
        x: Number(node.position.x),
        y: Number(node.position.y),
        width: size.width,
        height: size.height,
        animated: !reducedMotion,
      };
    }

    const col = placedNewCount % safeCols;
    const row = Math.floor(placedNewCount / safeCols);
    placedNewCount += 1;

    const x =
      node.id === anchorNodeId
        ? anchorCoords.x
        : anchorCoords.x + col * stepX + (index === 0 ? 0 : 40);
    const y = node.id === anchorNodeId ? anchorCoords.y : anchorCoords.y + row * stepY;

    return {
      ...node,
      x,
      y,
      width: size.width,
      height: size.height,
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
