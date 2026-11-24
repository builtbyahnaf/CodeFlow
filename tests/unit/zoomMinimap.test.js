import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMinimapModel,
  recenterViewportFromMinimap,
} from '../../src/core/graph/zoom/minimap.js';

test('buildMinimapModel hides below threshold, computes density heat grid at 500 nodes, and recenters viewport on click (P10-16)', () => {
  const small = buildMinimapModel({
    nodes: [{ id: 'n1', x: 0, y: 0 }],
    minNodesToShow: 12,
  });
  assert.equal(small.visible, false);

  const nodes = Array.from({ length: 500 }, (_, i) => ({
    id: `n:${i}`,
    x: (i % 25) * 200,
    y: Math.floor(i / 25) * 120,
    width: 180,
    height: 64,
  }));
  const model = buildMinimapModel({
    nodes,
    viewport: { x: 0, y: 0, width: 1000, height: 800, zoom: 1 },
  });
  assert.equal(model.visible, true);
  assert.equal(model.nodeCount, 500);
  assert.equal(model.densityGrid.length, 6);
  assert.equal(model.densityGrid[0].length, 8);

  const recentered = recenterViewportFromMinimap({
    normalizedX: 0.5,
    normalizedY: 0.5,
    minimapModel: model,
    viewportWidth: 1000,
    viewportHeight: 800,
  });
  assert.ok(recentered.x > 1000);
  assert.ok(recentered.y > 400);
});
