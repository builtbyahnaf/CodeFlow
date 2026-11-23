/**
 * Hover-intent state machine.
 *
 * Dwell time plus pointer stability prevents preview flicker while scanning a
 * graph. The controller owns timers but no DOM, so the behaviour is testable
 * with a fake clock.
 */

/**
 * @typedef {{x: number, y: number}} Point
 */

/**
 * @param {{
 *   delayMs?: number,
 *   moveTolerance?: number,
 *   graceMs?: number,
 *   enabled?: boolean,
 *   setTimeout?: (handler: Function, ms: number) => unknown,
 *   clearTimeout?: (handle: unknown) => void,
 *   onShow?: (nodeId: string, anchor: Point) => void,
 *   onHide?: (nodeId: string|null) => void,
 * }} [options]
 */
export function createPreviewController(options = {}) {
  const schedule = options.setTimeout ?? ((handler, ms) => setTimeout(handler, ms));
  const cancel = options.clearTimeout ?? ((handle) => clearTimeout(handle));

  let delayMs = Math.max(0, Number(options.delayMs ?? 300));
  let moveTolerance = Math.max(0, Number(options.moveTolerance ?? 12));
  const graceMs = Math.max(0, Number(options.graceMs ?? 150));
  let enabled = options.enabled !== false;
  let pinByDefault = Boolean(options.pinByDefault);

  let currentId = null;
  let anchor = { x: 0, y: 0 };
  let dwellTimer = null;
  let graceTimer = null;
  let pointerInside = false;
  let pinned = false;
  let visible = false;

  function clearDwell() {
    if (dwellTimer !== null) {
      cancel(dwellTimer);
      dwellTimer = null;
    }
  }

  function clearGrace() {
    if (graceTimer !== null) {
      cancel(graceTimer);
      graceTimer = null;
    }
  }

  function show() {
    if (!enabled || currentId === null) {
      return;
    }
    visible = true;
    if (pinByDefault) {
      pinned = true;
    }
    options.onShow?.(currentId, { ...anchor });
  }

  function hide() {
    clearDwell();
    clearGrace();
    if (!visible && currentId === null) {
      return;
    }
    const previous = currentId;
    visible = false;
    currentId = null;
    pinned = false;
    options.onHide?.(previous);
  }

  function armDwell() {
    clearDwell();
    if (!enabled || currentId === null) {
      return;
    }
    dwellTimer = schedule(() => {
      dwellTimer = null;
      show();
    }, delayMs);
  }

  function armGrace() {
    if (pinned) {
      return;
    }
    clearGrace();
    graceTimer = schedule(() => {
      graceTimer = null;
      hide();
    }, graceMs);
  }

  return {
    /**
     * @param {string} nodeId
     * @param {Point} point
     */
    pointerEnter(nodeId, point) {
      if (typeof nodeId !== 'string' || nodeId.length === 0) {
        return;
      }
      pointerInside = true;
      clearGrace();
      if (visible && currentId === nodeId) {
        return;
      }
      if (visible) {
        options.onHide?.(currentId);
        visible = false;
      }
      currentId = nodeId;
      anchor = { x: Number(point?.x ?? 0), y: Number(point?.y ?? 0) };
      pinned = false;
      armDwell();
    },

    /**
     * Movement larger than the tolerance restarts the dwell timer.
     *
     * @param {Point} point
     */
    pointerMove(point) {
      if (currentId === null || visible) {
        return;
      }
      const x = Number(point?.x ?? 0);
      const y = Number(point?.y ?? 0);
      const dx = x - anchor.x;
      const dy = y - anchor.y;
      if (Math.hypot(dx, dy) > moveTolerance) {
        anchor = { x, y };
        armDwell();
      }
    },

    /** Pointer left the node: give the user time to reach the card. */
    pointerLeave() {
      pointerInside = false;
      clearDwell();
      if (!visible) {
        currentId = null;
        return;
      }
      armGrace();
    },

    /** Pointer entered the card; cancel the hide. */
    pointerEnterCard() {
      pointerInside = true;
      clearGrace();
    },

    pointerLeaveCard() {
      pointerInside = false;
      if (visible) {
        armGrace();
      }
    },

    togglePin() {
      pinned = !pinned;
      if (pinned) {
        clearGrace();
      } else if (!pointerInside) {
        armGrace();
      }
      return pinned;
    },

    /** @param {boolean} value */
    setPinned(value) {
      pinned = Boolean(value);
      if (pinned) {
        clearGrace();
      }
      return pinned;
    },

    /** Esc always exits, even when pinned. */
    dismiss() {
      hide();
    },

    /**
     * Live settings changes must not require a reload.
     *
     * @param {{delayMs?: number, enabled?: boolean, moveTolerance?: number, pinByDefault?: boolean}} next
     */
    configure(next = {}) {
      if (next.delayMs !== undefined) {
        delayMs = Math.max(0, Number(next.delayMs));
      }
      if (next.moveTolerance !== undefined) {
        moveTolerance = Math.max(0, Number(next.moveTolerance));
      }
      if (next.pinByDefault !== undefined) {
        pinByDefault = Boolean(next.pinByDefault);
      }
      if (next.enabled !== undefined) {
        enabled = Boolean(next.enabled);
        if (!enabled) {
          hide();
        }
      }
    },

    isVisible: () => visible,
    isPinned: () => pinned,
    currentId: () => currentId,
    destroy() {
      clearDwell();
      clearGrace();
      currentId = null;
      visible = false;
      pinned = false;
    },
  };
}
