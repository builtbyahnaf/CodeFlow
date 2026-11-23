import test from 'node:test';
import assert from 'node:assert/strict';

import { createPreviewController } from '../../src/webview/previewController.js';

/** Deterministic clock so hover intent is tested without real time. */
function createClock() {
  let now = 0;
  let sequence = 0;
  const timers = new Map();

  const setTimeout = (callback, ms) => {
    const id = ++sequence;
    timers.set(id, { id, at: now + Math.max(0, Number(ms) || 0), callback });
    return id;
  };
  const clearTimeout = (id) => {
    timers.delete(id);
  };
  const advance = (ms) => {
    const target = now + ms;
    for (;;) {
      let next = null;
      for (const timer of timers.values()) {
        if (timer.at > target) {
          continue;
        }
        if (!next || timer.at < next.at || (timer.at === next.at && timer.id < next.id)) {
          next = timer;
        }
      }
      if (!next) {
        break;
      }
      timers.delete(next.id);
      now = next.at;
      next.callback();
    }
    now = target;
  };

  return { setTimeout, clearTimeout, advance, pending: () => timers.size };
}

function createHarness(options = {}) {
  const clock = createClock();
  const shown = [];
  const hidden = [];
  const controller = createPreviewController({
    setTimeout: clock.setTimeout,
    clearTimeout: clock.clearTimeout,
    delayMs: 300,
    graceMs: 150,
    moveTolerance: 12,
    onShow: (nodeId, anchor) => shown.push({ nodeId, anchor }),
    onHide: (nodeId) => hidden.push(nodeId),
    ...options,
  });
  return { controller, clock, shown, hidden };
}

test('a node appears only after the dwell delay', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 10, y: 20 });
  clock.advance(299);
  assert.equal(controller.isVisible(), false);
  assert.equal(shown.length, 0);

  clock.advance(1);
  assert.equal(controller.isVisible(), true);
  assert.equal(controller.currentId(), 'n1');
  assert.deepEqual(shown, [{ nodeId: 'n1', anchor: { x: 10, y: 20 } }]);
});

test('leaving before the delay cancels the preview entirely', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(100);
  controller.pointerLeave();
  clock.advance(1_000);
  assert.equal(controller.isVisible(), false);
  assert.equal(shown.length, 0);
});

test('pointer movement beyond the tolerance restarts the dwell timer', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(200);
  controller.pointerMove({ x: 100, y: 100 });
  clock.advance(200);
  assert.equal(shown.length, 0, 'dwell must restart after a real move');
  clock.advance(100);
  assert.equal(shown.length, 1);
  assert.deepEqual(shown[0].anchor, { x: 100, y: 100 });
});

test('small jitter does not restart the dwell timer', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(100);
  controller.pointerMove({ x: 3, y: 4 });
  clock.advance(200);
  assert.equal(shown.length, 1);
});

test('switching nodes hides the old preview immediately', () => {
  const { controller, clock, hidden } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  controller.pointerEnter('n2', { x: 5, y: 5 });
  assert.deepEqual(hidden, ['n1']);
  clock.advance(300);
  assert.equal(controller.currentId(), 'n2');
});

test('leaving the node keeps the card briefly so the pointer can reach it', () => {
  const { controller, clock, hidden } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  controller.pointerLeave();
  clock.advance(149);
  assert.equal(controller.isVisible(), true);
  clock.advance(1);
  assert.equal(controller.isVisible(), false);
  assert.deepEqual(hidden, ['n1']);
});

test('entering the card cancels the hide', () => {
  const { controller, clock, hidden } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  controller.pointerLeave();
  controller.pointerEnterCard();
  clock.advance(1_000);
  assert.equal(controller.isVisible(), true);
  assert.equal(hidden.length, 0);
});

test('a pinned preview survives leaving the node and the card', () => {
  const { controller, clock } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  assert.equal(controller.togglePin(), true);
  controller.pointerLeave();
  clock.advance(1_000);
  assert.equal(controller.isVisible(), true);
  controller.pointerLeaveCard();
  clock.advance(1_000);
  assert.equal(controller.isVisible(), true);
});

test('Escape dismisses even a pinned preview', () => {
  const { controller, clock, hidden } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  controller.togglePin();
  controller.dismiss();
  assert.equal(controller.isVisible(), false);
  assert.equal(controller.isPinned(), false);
  assert.deepEqual(hidden, ['n1']);
  clock.advance(1_000);
  assert.equal(hidden.length, 1);
});

test('disabling previews hides the card and blocks new ones', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  controller.configure({ enabled: false });
  assert.equal(controller.isVisible(), false);

  controller.pointerEnter('n2', { x: 0, y: 0 });
  clock.advance(300);
  assert.equal(shown.length, 1, 'no preview while disabled');

  controller.configure({ enabled: true, delayMs: 10 });
  controller.pointerEnter('n3', { x: 0, y: 0 });
  clock.advance(10);
  assert.equal(shown.length, 2);
});

test('destroy clears pending timers and resets state', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('n1', { x: 0, y: 0 });
  controller.destroy();
  clock.advance(1_000);
  assert.equal(shown.length, 0);
  assert.equal(clock.pending(), 0);
  assert.equal(controller.currentId(), null);
});

test('invalid node ids are ignored', () => {
  const { controller, clock, shown } = createHarness();
  controller.pointerEnter('', { x: 0, y: 0 });
  controller.pointerEnter(null, { x: 0, y: 0 });
  clock.advance(300);
  assert.equal(shown.length, 0);
});

test('pinByDefault pins newly shown previews until configured off', () => {
  const { controller, clock } = createHarness({ pinByDefault: true });
  controller.pointerEnter('n1', { x: 0, y: 0 });
  clock.advance(300);
  assert.equal(controller.isVisible(), true);
  assert.equal(controller.isPinned(), true);

  controller.pointerLeave();
  controller.pointerLeaveCard();
  clock.advance(1_000);
  assert.equal(controller.isVisible(), true);

  controller.dismiss();
  controller.configure({ pinByDefault: false });
  controller.pointerEnter('n2', { x: 0, y: 0 });
  clock.advance(300);
  assert.equal(controller.isPinned(), false);
  controller.pointerLeave();
  clock.advance(150);
  assert.equal(controller.isVisible(), false);
});
