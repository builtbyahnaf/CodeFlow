import test from 'node:test';
import assert from 'node:assert/strict';

import {
  searchAcrossZoomLevels,
  resolveSearchTargetBreadcrumbs,
  applyZoomFilters,
  computeDirectionalHighlight,
} from '../../src/core/graph/zoom/search.js';

test('searchAcrossZoomLevels and resolveSearchTargetBreadcrumbs reach 20 random indexed symbols with full ancestor breadcrumbs (P10-14, AC-10.9)', () => {
  const files = Array.from({ length: 20 }, (_, i) => ({
    fileId: `file:pkg_${i % 4}/mod_${i}.js`,
    path: `pkg_${i % 4}/mod_${i}.js`,
  }));
  const symbols = Array.from({ length: 20 }, (_, i) => ({
    symbolId: `sym:target_${i}`,
    name: `target_${i}`,
    qualifiedName: `pkg_${i % 4}.target_${i}`,
    kind: i % 2 === 0 ? 'function' : 'variable',
    fileId: `file:pkg_${i % 4}/mod_${i}.js`,
  }));

  const fakeIndex = {
    filesUnder: () => ({ items: files }),
    symbolsByName: (prefix) => ({
      items: symbols.filter((s) => s.name.includes(prefix)),
      total: symbols.length,
    }),
  };

  for (let i = 0; i < 20; i += 1) {
    const res = searchAcrossZoomLevels({
      queryText: `target_${i}`,
      index: fakeIndex,
    });
    assert.equal(res.ok, true);
    const match = res.items.find((item) => item.id === `sym:target_${i}`);
    assert.ok(match, `symbol target_${i} must be reachable via search`);

    const crumbs = resolveSearchTargetBreadcrumbs(match);
    assert.equal(crumbs[0].level, 'workspace');
    assert.equal(crumbs[1].level, 'module');
    assert.equal(crumbs[1].scopeId, `pkg_${i % 4}`);
    assert.equal(crumbs[2].level, 'file');
    assert.equal(crumbs[3].scopeId, `sym:target_${i}`);
  }
});

test('applyZoomFilters generates visible filter chips and computeDirectionalHighlight separates incoming and outgoing status counts (P10-12, P10-15)', () => {
  const viewDto = {
    nodes: [
      { id: 'n1', kind: 'function', displayStatus: 'resolved' },
      { id: 'n2', kind: 'function', displayStatus: 'unresolved' },
      { id: 'n3', kind: 'variable', displayStatus: 'resolved' },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2', type: 'calls', status: 'unresolved' },
      { id: 'e2', from: 'n2', to: 'n3', type: 'references', status: 'resolved' },
    ],
  };

  const filtered = applyZoomFilters(viewDto, {
    kinds: ['function'],
    relationshipTypes: ['calls'],
    statuses: ['resolved', 'unresolved'],
  });
  assert.equal(filtered.nodes.length, 2);
  assert.equal(filtered.edges.length, 1);
  assert.equal(filtered.hiddenNodeCount, 1);
  assert.equal(filtered.chips.length, 4);

  const highlight = computeDirectionalHighlight({
    focusNodeId: 'n2',
    nodes: viewDto.nodes,
    edges: viewDto.edges,
  });
  assert.deepEqual(highlight.incomingNodeIds, ['n1']);
  assert.deepEqual(highlight.outgoingNodeIds, ['n3']);
  assert.equal(highlight.incomingStatusMix.counts.unresolved, 1);
  assert.equal(highlight.outgoingStatusMix.counts.resolved, 1);
});
