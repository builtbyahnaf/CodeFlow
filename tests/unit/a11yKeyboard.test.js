import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  KEYBOARD_ACTIONS,
  SHORTCUT_REGISTRY,
  sortNodesInReadingOrder,
  findNextNodeInDirection,
  evaluateKeyboardEvent,
} from '../../src/visualization/a11y/index.js';

describe('Keyboard navigation & shortcut mappings (P12-05, AC-12.8)', () => {
  it('shortcut registry covers all major graph operations', () => {
    assert.ok(SHORTCUT_REGISTRY.length >= 15);
    for (const item of SHORTCUT_REGISTRY) {
      assert.ok(item.action, 'Action must be defined');
      assert.ok(item.key, 'Key must be defined');
      assert.ok(item.label, 'Label must be defined');
    }
  });

  it('evaluateKeyboardEvent handles directional arrows and modifiers', () => {
    assert.equal(evaluateKeyboardEvent({ key: 'ArrowUp' }), KEYBOARD_ACTIONS.MOVE_UP);
    assert.equal(evaluateKeyboardEvent({ key: 'ArrowDown' }), KEYBOARD_ACTIONS.MOVE_DOWN);
    assert.equal(evaluateKeyboardEvent({ key: 'ArrowLeft' }), KEYBOARD_ACTIONS.MOVE_LEFT);
    assert.equal(evaluateKeyboardEvent({ key: 'ArrowRight' }), KEYBOARD_ACTIONS.MOVE_RIGHT);
    assert.equal(
      evaluateKeyboardEvent({ key: 'ArrowLeft', altKey: true }),
      KEYBOARD_ACTIONS.BREADCRUMB_BACK,
    );
  });

  it('evaluateKeyboardEvent handles Tab and Shift+Tab cycling', () => {
    assert.equal(evaluateKeyboardEvent({ key: 'Tab' }), KEYBOARD_ACTIONS.CYCLE_NEXT);
    assert.equal(
      evaluateKeyboardEvent({ key: 'Tab', shiftKey: true }),
      KEYBOARD_ACTIONS.CYCLE_PREV,
    );
  });

  it('evaluateKeyboardEvent handles source opening and previewing', () => {
    assert.equal(evaluateKeyboardEvent({ key: 'Enter' }), KEYBOARD_ACTIONS.OPEN_DETAIL);
    assert.equal(
      evaluateKeyboardEvent({ key: 'Enter', ctrlKey: true }),
      KEYBOARD_ACTIONS.OPEN_SOURCE,
    );
    assert.equal(evaluateKeyboardEvent({ key: 'o' }), KEYBOARD_ACTIONS.OPEN_SOURCE);
    assert.equal(evaluateKeyboardEvent({ key: ' ' }), KEYBOARD_ACTIONS.PREVIEW_SOURCE);
  });

  it('evaluateKeyboardEvent handles search and help triggers', () => {
    assert.equal(
      evaluateKeyboardEvent({ key: 'f', ctrlKey: true }),
      KEYBOARD_ACTIONS.SEARCH,
    );
    assert.equal(evaluateKeyboardEvent({ key: '/' }), KEYBOARD_ACTIONS.SEARCH);
    assert.equal(evaluateKeyboardEvent({ key: '?' }), KEYBOARD_ACTIONS.SHOW_HELP);
    assert.equal(evaluateKeyboardEvent({ key: 'Escape' }), KEYBOARD_ACTIONS.ESCAPE);
  });
});

describe('Spatial & reading order sorting (P12-06, AC-12.8)', () => {
  it('sortNodesInReadingOrder sorts primarily top-to-bottom, secondarily left-to-right', () => {
    const nodes = [
      { id: 'b', x: 200, y: 100 },
      { id: 'a', x: 50, y: 100 },
      { id: 'c', x: 10, y: 300 },
      { id: 'top', x: 100, y: 10 },
    ];
    const sorted = sortNodesInReadingOrder(nodes);
    assert.deepEqual(
      sorted.map((n) => n.id),
      ['top', 'a', 'b', 'c'],
    );
  });

  it('findNextNodeInDirection navigates downwards to closest node', () => {
    const nodes = [
      { id: 'start', x: 100, y: 100 },
      { id: 'down1', x: 100, y: 200 },
      { id: 'down2', x: 100, y: 400 },
      { id: 'up1', x: 100, y: 50 },
    ];
    const target = findNextNodeInDirection('start', 'DOWN', nodes, []);
    assert.equal(target, 'down1');
  });

  it('findNextNodeInDirection prioritizes connected structural edge targets', () => {
    const nodes = [
      { id: 'curr', x: 100, y: 100 },
      { id: 'near_unconnected', x: 120, y: 160 },
      { id: 'connected_target', x: 100, y: 180 },
    ];
    const edges = [{ from: 'curr', to: 'connected_target' }];
    const target = findNextNodeInDirection('curr', 'DOWN', nodes, edges);
    assert.equal(target, 'connected_target');
  });
});
