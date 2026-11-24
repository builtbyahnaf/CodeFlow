/**
 * Minimap density heat grid and viewport recentering calculator
 * (Phase 10 §9, P10-16).
 *
 * Automatically hides when the active level has fewer than `minNodesToShow`
 * nodes (default 12).
 */

export const MINIMAP_DEFAULTS = Object.freeze({
  gridCols: 8,
  gridRows: 6,
  minNodesToShow: 12,
});

/**
 * Build a headless minimap model from positioned graph nodes and the current
 * viewport rectangle.
 *
 * @param {{
 *   nodes: Array<{id: string, x?: number, y?: number, width?: number, height?: number}>,
 *   viewport?: {x: number, y: number, width?: number, height?: number, zoom?: number},
 *   gridCols?: number,
 *   gridRows?: number,
 *   minNodesToShow?: number,
 * }} input
 */
export function buildMinimapModel(input = {}) {
  const nodes = Array.isArray(input.nodes) ? input.nodes : [];
  const minNodes = Math.max(
    1,
    Math.trunc(Number(input.minNodesToShow) || MINIMAP_DEFAULTS.minNodesToShow),
  );
  const cols = Math.max(2, Math.trunc(Number(input.gridCols) || MINIMAP_DEFAULTS.gridCols));
  const rows = Math.max(2, Math.trunc(Number(input.gridRows) || MINIMAP_DEFAULTS.gridRows));

  if (nodes.length < minNodes) {
    return {
      visible: false,
      nodeCount: nodes.length,
      bounds: { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 },
      viewportRect: { x: 0, y: 0, width: 1, height: 1 },
      densityGrid: [],
    };
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const node of nodes) {
    const x = Number(node.x ?? 0);
    const y = Number(node.y ?? 0);
    const w = Number(node.width ?? 180);
    const h = Number(node.height ?? 64);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x + w > maxX) maxX = x + w;
    if (y + h > maxY) maxY = y + h;
  }

  const worldWidth = Math.max(1, maxX - minX);
  const worldHeight = Math.max(1, maxY - minY);

  const grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  let maxCellCount = 0;

  for (const node of nodes) {
    const cx = Number(node.x ?? 0) + Number(node.width ?? 180) * 0.5;
    const cy = Number(node.y ?? 0) + Number(node.height ?? 64) * 0.5;
    const col = Math.min(cols - 1, Math.max(0, Math.floor(((cx - minX) / worldWidth) * cols)));
    const row = Math.min(rows - 1, Math.max(0, Math.floor(((cy - minY) / worldHeight) * rows)));
    grid[row][col] += 1;
    if (grid[row][col] > maxCellCount) {
      maxCellCount = grid[row][col];
    }
  }

  const densityGrid = grid.map((rowValues, rIdx) =>
    rowValues.map((count, cIdx) => ({
      row: rIdx,
      col: cIdx,
      count,
      heat: maxCellCount > 0 ? Number((count / maxCellCount).toFixed(3)) : 0,
    })),
  );

  const vp = input.viewport ?? {
    x: minX,
    y: minY,
    width: worldWidth,
    height: worldHeight,
    zoom: 1,
  };
  const vpWidth = Number(vp.width ?? worldWidth);
  const vpHeight = Number(vp.height ?? worldHeight);

  return {
    visible: true,
    nodeCount: nodes.length,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: worldWidth,
      height: worldHeight,
    },
    viewportRect: {
      x: Number(((Number(vp.x ?? minX) - minX) / worldWidth).toFixed(4)),
      y: Number(((Number(vp.y ?? minY) - minY) / worldHeight).toFixed(4)),
      width: Number(Math.min(1, vpWidth / worldWidth).toFixed(4)),
      height: Number(Math.min(1, vpHeight / worldHeight).toFixed(4)),
    },
    densityGrid,
  };
}

/**
 * Convert a normalized `[0..1]` click position on the minimap into recentered
 * world viewport coordinates.
 *
 * @param {{
 *   normalizedX: number,
 *   normalizedY: number,
 *   minimapModel: ReturnType<typeof buildMinimapModel>,
 *   viewportWidth?: number,
 *   viewportHeight?: number,
 *   zoom?: number,
 * }} input
 */
export function recenterViewportFromMinimap({
  normalizedX,
  normalizedY,
  minimapModel,
  viewportWidth = 800,
  viewportHeight = 600,
  zoom = 1,
}) {
  const clampedX = Math.min(1, Math.max(0, Number(normalizedX) || 0));
  const clampedY = Math.min(1, Math.max(0, Number(normalizedY) || 0));
  const bounds = minimapModel.bounds;
  const centerX = bounds.minX + clampedX * bounds.width;
  const centerY = bounds.minY + clampedY * bounds.height;
  return {
    x: Math.round(centerX - viewportWidth * 0.5),
    y: Math.round(centerY - viewportHeight * 0.5),
    zoom,
  };
}
