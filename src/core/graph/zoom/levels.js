/**
 * Semantic zoom level hierarchy, caps, overlay slots, and bounded gesture
 * transition rules (Phase 10 §5, §16, P10-01, AC-10.6).
 */

export const ZOOM_LEVELS = Object.freeze({
  L0_WORKSPACE: 'workspace',
  L1_MODULE: 'module',
  L2_FILE: 'file',
  L3_SYMBOL: 'symbol',
  L4_FUNCTION: 'function',
  L5_STATEMENT: 'statement',
});

export const LEVEL_ORDER = Object.freeze([
  ZOOM_LEVELS.L0_WORKSPACE,
  ZOOM_LEVELS.L1_MODULE,
  ZOOM_LEVELS.L2_FILE,
  ZOOM_LEVELS.L3_SYMBOL,
  ZOOM_LEVELS.L4_FUNCTION,
  ZOOM_LEVELS.L5_STATEMENT,
]);

export const LEVEL_CAPS = Object.freeze({
  [ZOOM_LEVELS.L0_WORKSPACE]: 60,
  [ZOOM_LEVELS.L1_MODULE]: 120,
  [ZOOM_LEVELS.L2_FILE]: 120,
  [ZOOM_LEVELS.L3_SYMBOL]: 150,
  [ZOOM_LEVELS.L4_FUNCTION]: 150,
  [ZOOM_LEVELS.L5_STATEMENT]: 100,
});

export const LEVEL_LABELS = Object.freeze({
  [ZOOM_LEVELS.L0_WORKSPACE]: 'L0 Workspace',
  [ZOOM_LEVELS.L1_MODULE]: 'L1 Module',
  [ZOOM_LEVELS.L2_FILE]: 'L2 File',
  [ZOOM_LEVELS.L3_SYMBOL]: 'L3 Symbol',
  [ZOOM_LEVELS.L4_FUNCTION]: 'L4 Function',
  [ZOOM_LEVELS.L5_STATEMENT]: 'L5 Statement',
});

/**
 * Overlay slots attach to L4/L5 without forking the level hierarchy
 * (Phase 10 §16 handoff to Phase 11 DFG overlay).
 */
export const OVERLAY_SLOTS = Object.freeze({
  DFG: 'dfg',
});

/**
 * Return the next finer zoom level, or `null` if already at `L5_STATEMENT`.
 *
 * @param {string} level
 * @returns {string|null}
 */
export function nextChildLevel(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  if (idx < 0 || idx + 1 >= LEVEL_ORDER.length) {
    return null;
  }
  return LEVEL_ORDER[idx + 1];
}

/**
 * Return the parent coarser zoom level, or `null` if already at `L0_WORKSPACE`.
 *
 * @param {string} level
 * @returns {string|null}
 */
export function parentLevel(level) {
  const idx = LEVEL_ORDER.indexOf(level);
  if (idx <= 0) {
    return null;
  }
  return LEVEL_ORDER[idx - 1];
}

/**
 * Evaluate a wheel/pinch zoom gesture (Phase 10 §5.2, AC-10.6):
 * - Wheel/pinch zoom is visual by default (`action: 'visual_scale'`).
 * - Never changes semantic level while mid-pan (`isPanning === true`).
 * - Never changes semantic level more than once per gesture
 *   (`transitionsInGesture >= 1`).
 * - Only crosses into a finer level when `nextScale >= expandThreshold`
 *   (default `1.85`) AND the pointer is over an expandable cluster
 *   (`overExpandableCluster === true`).
 *
 * @param {{
 *   currentLevel: string,
 *   currentScale?: number,
 *   scaleDelta?: number,
 *   overExpandableCluster?: boolean,
 *   targetClusterId?: string|null,
 *   transitionsInGesture?: number,
 *   isPanning?: boolean,
 *   expandThreshold?: number,
 * }} input
 */
export function evaluateZoomGesture(input = {}) {
  const currentLevel = LEVEL_ORDER.includes(input.currentLevel)
    ? input.currentLevel
    : ZOOM_LEVELS.L0_WORKSPACE;
  const currentScale = Number.isFinite(input.currentScale) ? Number(input.currentScale) : 1;
  const scaleDelta = Number.isFinite(input.scaleDelta) ? Number(input.scaleDelta) : 0;
  const nextScale = Math.min(4, Math.max(0.25, Number((currentScale + scaleDelta).toFixed(3))));
  const expandThreshold = Number.isFinite(input.expandThreshold)
    ? Number(input.expandThreshold)
    : 1.85;
  const transitionsInGesture = Math.max(0, Math.trunc(Number(input.transitionsInGesture) || 0));

  if (input.isPanning) {
    return {
      action: 'visual_scale',
      levelChanged: false,
      currentLevel,
      nextLevel: currentLevel,
      scale: currentScale,
      affordance: null,
    };
  }

  if (transitionsInGesture >= 1) {
    return {
      action: 'visual_scale',
      levelChanged: false,
      currentLevel,
      nextLevel: currentLevel,
      scale: nextScale,
      affordance: null,
    };
  }

  const childLevel = nextChildLevel(currentLevel);
  if (input.overExpandableCluster && childLevel && nextScale >= expandThreshold && scaleDelta > 0) {
    return {
      action: 'expand_cluster',
      levelChanged: true,
      currentLevel,
      nextLevel: childLevel,
      targetClusterId: input.targetClusterId ?? null,
      scale: 1,
      affordance: 'Zoomed in to expand cluster',
    };
  }

  const showAffordance = Boolean(
    input.overExpandableCluster && childLevel && nextScale >= expandThreshold * 0.75,
  );

  return {
    action: 'visual_scale',
    levelChanged: false,
    currentLevel,
    nextLevel: currentLevel,
    scale: nextScale,
    affordance: showAffordance ? 'Zoom in or press Enter to expand cluster' : null,
  };
}
