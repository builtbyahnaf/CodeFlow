import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ZOOM_LEVELS,
  LEVEL_ORDER,
  LEVEL_CAPS,
  OVERLAY_SLOTS,
  nextChildLevel,
  parentLevel,
  evaluateZoomGesture,
} from '../../src/core/graph/zoom/levels.js';

test('ZOOM_LEVELS defines L0..L5 hierarchy, caps, and Phase 11 DFG overlay slot (P10-01)', () => {
  assert.equal(LEVEL_ORDER.length, 6);
  assert.equal(LEVEL_CAPS[ZOOM_LEVELS.L0_WORKSPACE], 60);
  assert.equal(LEVEL_CAPS[ZOOM_LEVELS.L4_FUNCTION], 150);
  assert.equal(OVERLAY_SLOTS.DFG, 'dfg');

  assert.equal(nextChildLevel(ZOOM_LEVELS.L0_WORKSPACE), ZOOM_LEVELS.L1_MODULE);
  assert.equal(nextChildLevel(ZOOM_LEVELS.L5_STATEMENT), null);
  assert.equal(parentLevel(ZOOM_LEVELS.L0_WORKSPACE), null);
  assert.equal(parentLevel(ZOOM_LEVELS.L4_FUNCTION), ZOOM_LEVELS.L3_SYMBOL);
});

test('evaluateZoomGesture keeps wheel zoom visual by default and never transitions level more than once per gesture (AC-10.6)', () => {
  // Visual zoom when not hovering an expandable cluster
  const visual = evaluateZoomGesture({
    currentLevel: ZOOM_LEVELS.L0_WORKSPACE,
    currentScale: 1,
    scaleDelta: 1.2,
    overExpandableCluster: false,
  });
  assert.equal(visual.action, 'visual_scale');
  assert.equal(visual.levelChanged, false);

  // Blocked while mid-pan
  const midPan = evaluateZoomGesture({
    currentLevel: ZOOM_LEVELS.L0_WORKSPACE,
    currentScale: 1.5,
    scaleDelta: 0.6,
    overExpandableCluster: true,
    isPanning: true,
  });
  assert.equal(midPan.levelChanged, false);

  // Crosses threshold over expandable cluster -> transitions once
  const expanded = evaluateZoomGesture({
    currentLevel: ZOOM_LEVELS.L0_WORKSPACE,
    currentScale: 1.5,
    scaleDelta: 0.5,
    overExpandableCluster: true,
    targetClusterId: 'cluster:dir:src',
    transitionsInGesture: 0,
  });
  assert.equal(expanded.action, 'expand_cluster');
  assert.equal(expanded.levelChanged, true);
  assert.equal(expanded.nextLevel, ZOOM_LEVELS.L1_MODULE);

  // Second transition in the same gesture is blocked (AC-10.6)
  const secondInGesture = evaluateZoomGesture({
    currentLevel: ZOOM_LEVELS.L1_MODULE,
    currentScale: 1.5,
    scaleDelta: 0.5,
    overExpandableCluster: true,
    transitionsInGesture: 1,
  });
  assert.equal(secondInGesture.levelChanged, false);
});
