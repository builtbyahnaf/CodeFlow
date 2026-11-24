/**
 * Keyboard Navigation & Focus Model (Phase 12 §5.1, P12-05, P12-06, AC-12.8).
 *
 * Implements non-trapping keyboard navigation, spatial edge-following,
 * natural reading-order node cycling, and shortcut discovery.
 */

export const KEYBOARD_ACTIONS = Object.freeze({
  MOVE_UP: 'MOVE_UP',
  MOVE_DOWN: 'MOVE_DOWN',
  MOVE_LEFT: 'MOVE_LEFT',
  MOVE_RIGHT: 'MOVE_RIGHT',
  CYCLE_NEXT: 'CYCLE_NEXT',
  CYCLE_PREV: 'CYCLE_PREV',
  OPEN_DETAIL: 'OPEN_DETAIL',
  OPEN_SOURCE: 'OPEN_SOURCE',
  PREVIEW_SOURCE: 'PREVIEW_SOURCE',
  EXPAND: 'EXPAND',
  COLLAPSE: 'COLLAPSE',
  SEARCH: 'SEARCH',
  BREADCRUMB_BACK: 'BREADCRUMB_BACK',
  CYCLE_PERSPECTIVE: 'CYCLE_PERSPECTIVE',
  TOGGLE_FILTERS: 'TOGGLE_FILTERS',
  ESCAPE: 'ESCAPE',
  SHOW_HELP: 'SHOW_HELP',
});

/** Human-readable keyboard shortcut guide for the help overlay (`?`). */
export const SHORTCUT_REGISTRY = Object.freeze([
  { action: KEYBOARD_ACTIONS.CYCLE_NEXT, key: 'Tab', label: 'Cycle next visible node' },
  { action: KEYBOARD_ACTIONS.CYCLE_PREV, key: 'Shift+Tab', label: 'Cycle previous visible node' },
  { action: KEYBOARD_ACTIONS.MOVE_UP, key: 'ArrowUp', label: 'Move to node above / incoming call' },
  { action: KEYBOARD_ACTIONS.MOVE_DOWN, key: 'ArrowDown', label: 'Move to node below / outgoing call' },
  { action: KEYBOARD_ACTIONS.MOVE_LEFT, key: 'ArrowLeft', label: 'Move left / collapse cluster' },
  { action: KEYBOARD_ACTIONS.MOVE_RIGHT, key: 'ArrowRight', label: 'Move right / expand cluster' },
  { action: KEYBOARD_ACTIONS.OPEN_DETAIL, key: 'Enter', label: 'Open node details' },
  { action: KEYBOARD_ACTIONS.OPEN_SOURCE, key: 'Ctrl+Enter / O', label: 'Reveal in source editor' },
  { action: KEYBOARD_ACTIONS.PREVIEW_SOURCE, key: 'Shift+Space / Space', label: 'Preview source slice' },
  { action: KEYBOARD_ACTIONS.EXPAND, key: '+ / E', label: 'Expand cluster members' },
  { action: KEYBOARD_ACTIONS.COLLAPSE, key: '- / C', label: 'Collapse cluster members' },
  { action: KEYBOARD_ACTIONS.SEARCH, key: 'Ctrl+F / /', label: 'Search symbols and files' },
  { action: KEYBOARD_ACTIONS.BREADCRUMB_BACK, key: 'Backspace / Alt+Left', label: 'Navigate to parent breadcrumb' },
  { action: KEYBOARD_ACTIONS.CYCLE_PERSPECTIVE, key: 'P', label: 'Cycle graph perspectives' },
  { action: KEYBOARD_ACTIONS.TOGGLE_FILTERS, key: 'F', label: 'Toggle filter panel' },
  { action: KEYBOARD_ACTIONS.ESCAPE, key: 'Escape', label: 'Clear selection / exit focus' },
  { action: KEYBOARD_ACTIONS.SHOW_HELP, key: '?', label: 'Show keyboard shortcuts' },
]);

/**
 * Sort positioned nodes into predictable reading order (top-to-bottom, left-to-right).
 *
 * @param {Array<{id: string, x?: number, y?: number}>} nodes
 * @returns {Array<{id: string, x?: number, y?: number}>}
 */
export function sortNodesInReadingOrder(nodes) {
  return [...nodes].sort((a, b) => {
    const ya = a.y ?? 0;
    const yb = b.y ?? 0;
    if (Math.abs(ya - yb) > 20) {
      return ya - yb;
    }
    return (a.x ?? 0) - (b.x ?? 0);
  });
}

/**
 * Find the next node along visual or structural edges in a directional movement.
 *
 * @param {string|null} focusedId
 * @param {'UP'|'DOWN'|'LEFT'|'RIGHT'} direction
 * @param {Array<{id: string, x?: number, y?: number}>} nodes
 * @param {Array<{from: string, to: string}>} edges
 * @returns {string|null}
 */
export function findNextNodeInDirection(focusedId, direction, nodes, edges) {
  if (!focusedId || nodes.length === 0) {
    return nodes[0]?.id ?? null;
  }
  const current = nodes.find((n) => n.id === focusedId);
  if (!current) {
    return nodes[0]?.id ?? null;
  }

  // Check structural edges first
  const connectedTargets = new Set();
  if (direction === 'DOWN' || direction === 'RIGHT') {
    for (const e of edges) {
      if (e.from === focusedId) connectedTargets.add(e.to);
    }
  } else {
    for (const e of edges) {
      if (e.to === focusedId) connectedTargets.add(e.from);
    }
  }

  const curX = current.x ?? 0;
  const curY = current.y ?? 0;

  // Filter candidates by geometric direction
  let bestId = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const candidate of nodes) {
    if (candidate.id === focusedId) continue;
    const candX = candidate.x ?? 0;
    const candY = candidate.y ?? 0;
    const dx = candX - curX;
    const dy = candY - curY;

    let validDirection = false;
    switch (direction) {
      case 'UP':
        validDirection = dy < -5;
        break;
      case 'DOWN':
        validDirection = dy > 5;
        break;
      case 'LEFT':
        validDirection = dx < -5;
        break;
      case 'RIGHT':
        validDirection = dx > 5;
        break;
    }

    if (!validDirection) continue;

    // Euclidean distance, giving preference to structural edge connections
    const dist = Math.hypot(dx, dy);
    const score = connectedTargets.has(candidate.id) ? dist * 0.5 : dist;

    if (score < bestDistance) {
      bestDistance = score;
      bestId = candidate.id;
    }
  }

  return bestId ?? focusedId;
}

/**
 * Pure keyboard event evaluator. Converts raw key event properties to a semantic action.
 *
 * @param {{
 *   key: string,
 *   code?: string,
 *   shiftKey?: boolean,
 *   ctrlKey?: boolean,
 *   metaKey?: boolean,
 *   altKey?: boolean
 * }} event
 * @returns {string|null} Action enum member or null if unhandled
 */
export function evaluateKeyboardEvent(event) {
  const isCtrlOrMeta = Boolean(event.ctrlKey || event.metaKey);
  const key = event.key;

  if (key === 'Escape') return KEYBOARD_ACTIONS.ESCAPE;
  if (key === '?') return KEYBOARD_ACTIONS.SHOW_HELP;

  if (isCtrlOrMeta && (key.toLowerCase() === 'f' || key === 'F')) {
    return KEYBOARD_ACTIONS.SEARCH;
  }
  if (!isCtrlOrMeta && key === '/') {
    return KEYBOARD_ACTIONS.SEARCH;
  }

  if (key === 'Tab') {
    return event.shiftKey ? KEYBOARD_ACTIONS.CYCLE_PREV : KEYBOARD_ACTIONS.CYCLE_NEXT;
  }

  if (key === 'ArrowUp') return KEYBOARD_ACTIONS.MOVE_UP;
  if (key === 'ArrowDown') return KEYBOARD_ACTIONS.MOVE_DOWN;
  if (key === 'ArrowLeft') {
    return event.altKey ? KEYBOARD_ACTIONS.BREADCRUMB_BACK : KEYBOARD_ACTIONS.MOVE_LEFT;
  }
  if (key === 'ArrowRight') return KEYBOARD_ACTIONS.MOVE_RIGHT;

  if (key === 'Enter') {
    return isCtrlOrMeta ? KEYBOARD_ACTIONS.OPEN_SOURCE : KEYBOARD_ACTIONS.OPEN_DETAIL;
  }
  if (key === 'o' || key === 'O') return KEYBOARD_ACTIONS.OPEN_SOURCE;

  if (key === ' ' || key === 'Space') {
    return KEYBOARD_ACTIONS.PREVIEW_SOURCE;
  }

  if (key === '+' || key === '=' || key === 'e' || key === 'E') return KEYBOARD_ACTIONS.EXPAND;
  if (key === '-' || key === '_' || key === 'c' || key === 'C') return KEYBOARD_ACTIONS.COLLAPSE;

  if (key === 'Backspace') return KEYBOARD_ACTIONS.BREADCRUMB_BACK;
  if (!isCtrlOrMeta && (key === 'p' || key === 'P')) return KEYBOARD_ACTIONS.CYCLE_PERSPECTIVE;
  if (!isCtrlOrMeta && (key === 'f' || key === 'F')) return KEYBOARD_ACTIONS.TOGGLE_FILTERS;

  return null;
}
