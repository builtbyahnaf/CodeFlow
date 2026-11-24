/**
 * Explicit semantic-zoom navigation stack and addressable breadcrumbs
 * (Phase 10 §5.1, §8, §9, P10-01, P10-13).
 *
 * Carries `{level, scopeId, focusId, label, viewport, selection, overlays}` at
 * every step so clicking any ancestor breadcrumb restores that exact level,
 * viewport, and selection.
 */

import { ZOOM_LEVELS, LEVEL_ORDER } from './levels.js';

const DEFAULT_VIEWPORT = Object.freeze({ x: 0, y: 0, zoom: 1 });

/**
 * Format an addressable breadcrumb path from workspace root down to the active
 * level (`workspace / src / DBHandler.js / check_db_exists / loop@14`).
 *
 * @param {Array<{level: string, scopeId: string, label: string, focusId?: string|null}>} stack
 * @returns {Array<{index: number, level: string, scopeId: string, label: string, focusId: string|null}>}
 */
export function formatBreadcrumbSegments(stack = []) {
  return stack.map((entry, index) => ({
    index,
    level: entry.level,
    scopeId: entry.scopeId,
    label: entry.label || entry.scopeId || entry.level,
    focusId: entry.focusId ?? null,
  }));
}

/**
 * Create a navigation state stack starting at `L0_WORKSPACE` (or a provided
 * initial entry).
 *
 * @param {{
 *   level?: string,
 *   scopeId?: string,
 *   focusId?: string|null,
 *   label?: string,
 *   viewport?: {x: number, y: number, zoom: number},
 *   selection?: string|null,
 *   overlays?: string[],
 * }} [initial]
 */
export function createNavigationStack(initial = {}) {
  const startLevel = LEVEL_ORDER.includes(initial.level) ? initial.level : ZOOM_LEVELS.L0_WORKSPACE;

  /**
   * @type {Array<{
   *   level: string,
   *   scopeId: string,
   *   focusId: string|null,
   *   label: string,
   *   viewport: {x: number, y: number, zoom: number},
   *   selection: string|null,
   *   overlays: string[],
   * }>}
   */
  const stack = [
    {
      level: startLevel,
      scopeId: String(initial.scopeId ?? 'workspace'),
      focusId: initial.focusId ?? null,
      label: String(initial.label ?? 'workspace'),
      viewport: {
        x: Number(initial.viewport?.x ?? DEFAULT_VIEWPORT.x),
        y: Number(initial.viewport?.y ?? DEFAULT_VIEWPORT.y),
        zoom: Number(initial.viewport?.zoom ?? DEFAULT_VIEWPORT.zoom),
      },
      selection: initial.selection ?? null,
      overlays: Array.isArray(initial.overlays) ? [...initial.overlays] : [],
    },
  ];

  function current() {
    return structuredClone(stack[stack.length - 1]);
  }

  /**
   * Update viewport, selection, focus, or active overlays on the current level
   * before descending so returning via breadcrumb restores the exact state.
   *
   * @param {{
   *   focusId?: string|null,
   *   viewport?: {x: number, y: number, zoom: number},
   *   selection?: string|null,
   *   overlays?: string[],
   * }} patch
   */
  function updateCurrent(patch = {}) {
    const top = stack[stack.length - 1];
    if (patch.focusId !== undefined) {
      top.focusId = patch.focusId;
    }
    if (patch.selection !== undefined) {
      top.selection = patch.selection;
    }
    if (patch.viewport && typeof patch.viewport === 'object') {
      top.viewport = {
        x: Number(patch.viewport.x ?? top.viewport.x),
        y: Number(patch.viewport.y ?? top.viewport.y),
        zoom: Number(patch.viewport.zoom ?? top.viewport.zoom),
      };
    }
    if (Array.isArray(patch.overlays)) {
      top.overlays = [...new Set(patch.overlays)];
    }
    return current();
  }

  /**
   * Explicitly descend to a child level (`module`, `file`, `symbol`,
   * `function`, `statement`).
   *
   * @param {{
   *   level: string,
   *   scopeId: string,
   *   focusId?: string|null,
   *   label?: string,
   *   viewport?: {x: number, y: number, zoom: number},
   *   selection?: string|null,
   * }} target
   */
  function descend(target) {
    if (!LEVEL_ORDER.includes(target?.level)) {
      return {
        ok: false,
        code: 'E_ZOOM_LEVEL',
        message: `Unknown zoom level: "${String(target?.level)}"`,
      };
    }
    const top = stack[stack.length - 1];
    stack.push({
      level: target.level,
      scopeId: String(target.scopeId ?? target.level),
      focusId: target.focusId ?? null,
      label: String(target.label ?? target.scopeId ?? target.level),
      viewport: {
        x: Number(target.viewport?.x ?? DEFAULT_VIEWPORT.x),
        y: Number(target.viewport?.y ?? DEFAULT_VIEWPORT.y),
        zoom: Number(target.viewport?.zoom ?? DEFAULT_VIEWPORT.zoom),
      },
      selection: target.selection ?? target.focusId ?? null,
      overlays: [...top.overlays],
    });
    return {
      ok: true,
      state: current(),
      breadcrumbs: formatBreadcrumbSegments(stack),
    };
  }

  /**
   * Return to an ancestor breadcrumb by index (`0 .. stack.length - 1`),
   * restoring its saved viewport and selection (P10-13).
   *
   * @param {number} index
   */
  function ascendTo(index) {
    const targetIdx = Math.trunc(Number(index));
    if (!Number.isInteger(targetIdx) || targetIdx < 0 || targetIdx >= stack.length) {
      return {
        ok: false,
        code: 'E_BREADCRUMB_RANGE',
        message: `Breadcrumb index ${String(index)} is out of bounds.`,
      };
    }
    stack.splice(targetIdx + 1);
    return {
      ok: true,
      state: current(),
      breadcrumbs: formatBreadcrumbSegments(stack),
    };
  }

  function ascendOne() {
    if (stack.length <= 1) {
      return {
        ok: true,
        state: current(),
        breadcrumbs: formatBreadcrumbSegments(stack),
      };
    }
    return ascendTo(stack.length - 2);
  }

  /**
   * Replace the entire stack (used when jumping directly to a search result or
   * restoring persisted navigation state).
   *
   * @param {Array<{
   *   level: string,
   *   scopeId: string,
   *   focusId?: string|null,
   *   label: string,
   *   viewport?: {x: number, y: number, zoom: number},
   *   selection?: string|null,
   *   overlays?: string[],
   * }>} nextEntries
   */
  function replaceStack(nextEntries) {
    if (!Array.isArray(nextEntries) || nextEntries.length === 0) {
      return { ok: false, code: 'E_EMPTY_STACK', message: 'Navigation stack cannot be empty.' };
    }
    stack.length = 0;
    for (const item of nextEntries) {
      stack.push({
        level: LEVEL_ORDER.includes(item.level) ? item.level : ZOOM_LEVELS.L0_WORKSPACE,
        scopeId: String(item.scopeId ?? 'workspace'),
        focusId: item.focusId ?? null,
        label: String(item.label ?? item.scopeId ?? item.level),
        viewport: {
          x: Number(item.viewport?.x ?? 0),
          y: Number(item.viewport?.y ?? 0),
          zoom: Number(item.viewport?.zoom ?? 1),
        },
        selection: item.selection ?? item.focusId ?? null,
        overlays: Array.isArray(item.overlays) ? [...item.overlays] : [],
      });
    }
    return {
      ok: true,
      state: current(),
      breadcrumbs: formatBreadcrumbSegments(stack),
    };
  }

  return {
    current,
    updateCurrent,
    descend,
    ascendTo,
    ascendOne,
    replaceStack,
    breadcrumbs: () => formatBreadcrumbSegments(stack),
    depth: () => stack.length,
    snapshotStack: () => structuredClone(stack),
  };
}
