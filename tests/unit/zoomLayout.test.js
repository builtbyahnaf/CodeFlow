import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeAnchoredIncrementalLayout,
  virtualizeViewport,
} from '../../src/core/graph/zoom/layout.js';

test('computeAnchoredIncrementalLayout preserves anchor and existing node coordinates on expand/refresh and honors prefers-reduced-motion (P10-18, P10-20, AC-10.7)', () => {
  const previousNodes = [
    { id: 'cluster:dir:src', x: 300, y: 150, width: 180, height: 64 },
    { id: 'cluster:dir:docs', x: 600, y: 150, width: 180, height: 64 },
  ];

  const nextNodes = [
    { id: 'cluster:dir:src', label: 'src' },
    { id: 'cluster:dir:docs', label: 'docs' },
    { id: 'file:src/new1.js', label: 'new1.js' },
    { id: 'file:src/new2.js', label: 'new2.js' },
  ];

  const layout = computeAnchoredIncrementalLayout({
    previousNodes,
    nextNodes,
    anchorNodeId: 'cluster:dir:src',
    reducedMotion: false,
  });

  assert.equal(layout.reusedCount, 2);
  assert.equal(layout.placedNewCount, 2);
  assert.equal(layout.transitionMs, 220);

  const srcNode = layout.nodes.find((n) => n.id === 'cluster:dir:src');
  const docsNode = layout.nodes.find((n) => n.id === 'cluster:dir:docs');
  assert.equal(srcNode.x, 300, 'anchor X coordinate must not jump on expansion');
  assert.equal(srcNode.y, 150, 'anchor Y coordinate must not jump on expansion');
  assert.equal(docsNode.x, 600);
  assert.equal(docsNode.y, 150);

  const reduced = computeAnchoredIncrementalLayout({
    previousNodes,
    nextNodes,
    anchorNodeId: 'cluster:dir:src',
    reducedMotion: true,
  });
  assert.equal(reduced.transitionMs, 0);
  assert.ok(reduced.nodes.every((n) => n.animated === false));
});

test('virtualizeViewport culls offscreen nodes on a 2,000-node synthetic level while keeping visible nodes and edges interactive (P10-18)', () => {
  const nodes = Array.from({ length: 2000 }, (_, i) => ({
    id: `n:${i}`,
    x: (i % 50) * 250,
    y: Math.floor(i / 50) * 150,
    width: 180,
    height: 64,
  }));
  const edges = Array.from({ length: 1999 }, (_, i) => ({
    from: `n:${i}`,
    to: `n:${i + 1}`,
  }));

  const virtualized = virtualizeViewport({
    nodes,
    edges,
    viewport: { x: 0, y: 0, width: 1000, height: 600, zoom: 1 },
    padding: 100,
  });

  assert.equal(virtualized.totalNodes, 2000);
  assert.ok(virtualized.visibleNodes.length > 0 && virtualized.visibleNodes.length < 100);
  assert.ok(virtualized.culledNodeCount > 1900);
});
