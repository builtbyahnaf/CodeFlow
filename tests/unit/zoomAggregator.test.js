import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import {
  buildWorkspaceOverview,
  buildModuleView,
  buildFileView,
  buildFunctionView,
  buildStatementView,
} from '../../src/core/graph/zoom/aggregator.js';

test('10,000-file workspace overview aggregates into <= 60 clusters in < 2s with exact counts and unresolved surfacing (P10-02, P10-04, P10-22, AC-10.2, AC-10.4)', () => {
  // Generate a 10,000-file workspace across 80 top-level directories
  const files = Array.from({ length: 10_000 }, (_, i) => ({
    fileId: `file:dir_${i % 80}/mod_${i}.js`,
    path: `dir_${i % 80}/sub_${i % 5}/mod_${i}.js`,
    language: 'javascript',
  }));
  const symbols = Array.from({ length: 10_000 }, (_, i) => ({
    symbolId: `sym:${i}`,
    name: `fn_${i}`,
    qualifiedName: `fn_${i}`,
    kind: 'function',
    fileId: `file:dir_${i % 80}/mod_${i}.js`,
  }));
  const relationships = [
    {
      relationshipId: 'rel:unresolved-1',
      from: 'sym:0',
      to: 'sym:ext',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'dynamic_dispatch',
    },
    {
      relationshipId: 'rel:resolved-1',
      from: 'sym:0',
      to: 'sym:1',
      type: 'calls',
      status: 'resolved',
    },
  ];

  let filesUnderCalls = 0;
  const fakeIndex = {
    filesUnder: () => {
      filesUnderCalls += 1;
      return { items: files };
    },
    allSymbols: () => symbols,
    allRelationships: () => relationships,
  };

  const t0 = performance.now();
  const overview = buildWorkspaceOverview({ index: fakeIndex });
  const elapsedMs = performance.now() - t0;

  assert.ok(
    elapsedMs < 2000,
    `expected 10k-file L0 overview < 2000ms, got ${elapsedMs.toFixed(2)}ms`,
  );
  assert.equal(filesUnderCalls, 1, 'must never trigger a per-file query storm');
  assert.ok(overview.nodes.length <= 60, `expected <= 60 clusters, got ${overview.nodes.length}`);
  assert.equal(overview.totalFiles, 10_000);
  assert.equal(overview.totalSymbols, 10_000);
  assert.equal(overview.capped, true);

  // Sum of fileCounts across all L0 clusters equals 10,000
  const summedFiles = overview.nodes.reduce((sum, n) => sum + n.fileCount, 0);
  assert.equal(summedFiles, 10_000);

  // dir_0 contains 1 resolved and 1 unresolved call -> mixed status + "1 unresolved" badge
  const dir0Cluster = overview.nodes.find((n) => n.scopeId === 'dir_0');
  assert.equal(dir0Cluster.displayStatus, 'mixed');
  assert.ok(dir0Cluster.badges.includes('1 unresolved'));

  // 1,000-file L1 module view completes in < 1,000 ms
  const moduleFiles = files.slice(0, 1000).map((f, i) => ({
    ...f,
    path: `src/pkg_${i % 10}/f_${i}.js`,
  }));
  const m0 = performance.now();
  const moduleView = buildModuleView({
    modulePrefix: 'src',
    index: {
      filesUnder: () => ({ items: moduleFiles }),
      allSymbols: () => [],
      allRelationships: () => [],
    },
  });
  const moduleMs = performance.now() - m0;
  assert.ok(
    moduleMs < 1000,
    `expected 1k-file L1 module view < 1000ms, got ${moduleMs.toFixed(2)}ms`,
  );
  assert.equal(moduleView.nodes.length, 10);
});

test('L2 dense file symbol clustering, L4 1,500-node CFG construct clustering, and L5 statement view with DFG overlay slot (P10-09, P10-10)', () => {  // L2 File with 160 symbols (> 120 cap) groups by kind
  const denseSymbols = [
    ...Array.from({ length: 100 }, (_, i) => ({
      symbolId: `sym:fn_${i}`,
      name: `fn_${i}`,
      kind: 'function',
      fileId: 'file:dense.js',
    })),
    ...Array.from({ length: 60 }, (_, i) => ({
      symbolId: `sym:var_${i}`,
      name: `var_${i}`,
      kind: 'variable',
      fileId: 'file:dense.js',
    })),
  ];
  const fileView = buildFileView({
    fileId: 'file:dense.js',
    index: {
      symbolsInFile: () => ({ items: denseSymbols }),
      allRelationships: () => [],
    },
  });
  assert.equal(fileView.groupedByKind, true);
  assert.equal(fileView.nodes.length, 2);
  assert.ok(fileView.nodes.some((n) => n.label === '100 functions'));

  // L4 Function with 1,500 CFG nodes (> 150 cap) clusters constructs and preserves unmodeled markers
  const cfgNodes = [
    { id: 'cfg:entry', kind: 'entry', label: 'entry' },
    ...Array.from({ length: 1498 }, (_, i) => ({
      id: `cfg:n_${i}`,
      kind: i === 50 ? 'unmodeled' : 'statement',
      label: `stmt_${i}`,
      constructId: `loop_${Math.floor(i / 50)}`,
    })),
    { id: 'cfg:exit', kind: 'exit', label: 'exit' },
  ];
  const cfgEdges = Array.from({ length: 1499 }, (_, i) => ({
    id: `e:${i}`,
    from: cfgNodes[i].id,
    to: cfgNodes[i + 1].id,
    kind: 'normal',
  }));
  const fnView = buildFunctionView({
    cfg: { symbolId: 'sym:bigFn', nodes: cfgNodes, edges: cfgEdges },
  });
  assert.equal(fnView.clusteredConstructs, true);
  assert.ok(
    fnView.nodes.length <= 35,
    `expected clustered L4 nodes <= 35, got ${fnView.nodes.length}`,
  );
  const loop1Cluster = fnView.nodes.find((n) => n.id.endsWith(':loop_1'));
  assert.equal(loop1Cluster.hasUnmodeled, true);
  assert.ok(loop1Cluster.badges.includes('1 unmodeled'));

  // L5 Statement view inside loop_1 with Phase 11 DFG overlay slot
  const stmtView = buildStatementView({
    symbolId: 'sym:bigFn',
    constructId: 'loop_1',
    cfg: { nodes: cfgNodes, edges: cfgEdges },
    activeOverlays: ['dfg'],
    dfgEdges: [{ id: 'dfg:1', from: 'cfg:n_50', to: 'cfg:n_51', kind: 'def_use' }],
  });
  assert.equal(stmtView.nodes.length, 50);
  assert.equal(stmtView.overlays.dfg.length, 1);
});

test('unindexed runs fall back to run files and L1 file nodes keep a valid fileId scope', () => {
  const files = [{ fileId: 'file:src/a.js', path: 'src/a.js', language: 'javascript' }];
  const symbols = [
    { symbolId: 'sym:a', name: 'a', qualifiedName: 'a', kind: 'function', fileId: 'file:src/a.js' },
  ];
  const query = {
    allSymbols: () => ({ ok: true, value: symbols }),
    allRelationships: () => ({ ok: true, value: [] }),
  };
  const emptyIndex = {
    filesUnder: () => ({ items: [] }),
    allSymbols: () => [],
    allRelationships: () => [],
  };

  const overview = buildWorkspaceOverview({ index: emptyIndex, query, files });
  assert.equal(overview.totalFiles, 1);
  assert.equal(overview.nodes.length, 1);
  assert.equal(overview.nodes[0].fileCount, 1);

  const moduleView = buildModuleView({ modulePrefix: 'src', index: emptyIndex, query, files });
  const fileNode = moduleView.nodes.find((node) => node.kind === 'file');
  assert.ok(fileNode);
  assert.equal(fileNode.scopeId, 'file:src/a.js');
  assert.equal(fileNode.expandable, true);
});

test('builtin and standard-library calls do not create unresolved zoom badges', () => {
  const files = [
    { fileId: 'file:src/app.js', path: 'src/app.js', language: 'javascript' },
    { fileId: 'file:lib/util.js', path: 'lib/util.js', language: 'javascript' },
  ];
  const symbols = [
    { symbolId: 'sym:app', name: 'app', qualifiedName: 'app', kind: 'function', fileId: 'file:src/app.js' },
    { symbolId: 'sym:util', name: 'util', qualifiedName: 'util', kind: 'function', fileId: 'file:lib/util.js' },
  ];
  const relationships = [
    {
      relationshipId: 'rel:console',
      from: 'sym:app',
      to: 'external:global.console.log',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'out_of_scope',
    },
    {
      relationshipId: 'rel:document',
      from: 'sym:app',
      to: 'external:global.document.getElementById',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'out_of_scope',
    },
    {
      relationshipId: 'rel:stl',
      from: 'sym:util',
      to: 'external:std::vector::push_back',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'out_of_scope',
    },
    {
      relationshipId: 'rel:unknown',
      from: 'sym:util',
      to: 'external:mysteryService.run',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'unknown_receiver',
    },
  ];

  const overview = buildWorkspaceOverview({
    index: {
      filesUnder: () => ({ items: files }),
      allSymbols: () => symbols,
      allRelationships: () => relationships,
    },
  });

  const srcCluster = overview.nodes.find((node) => node.scopeId === 'src');
  const libCluster = overview.nodes.find((node) => node.scopeId === 'lib');
  assert.ok(srcCluster && libCluster);

  // Only DOM/runtime builtins live in src: the cluster is fully resolved and
  // must not advertise an unresolved badge.
  assert.equal(srcCluster.displayStatus, 'resolved');
  assert.deepEqual(srcCluster.badges, []);

  // lib still contains one genuinely unknown target next to the normalized STL
  // call, so the honest unresolved badge survives and the aggregate stays mixed
  // instead of collapsing to a single status.
  assert.equal(libCluster.displayStatus, 'mixed');
  assert.ok(libCluster.badges.includes('1 unresolved'));
});

test('L1 root module view scopes to root files and L2 file view resolves STL calls', () => {
  const files = [
    { fileId: 'file:index.js', path: 'index.js', language: 'javascript' },
    { fileId: 'file:src/main.cpp', path: 'src/main.cpp', language: 'cpp' },
  ];
  const symbols = [
    { symbolId: 'sym:main', name: 'main', qualifiedName: 'main', kind: 'function', fileId: 'file:src/main.cpp' },
  ];
  const relationships = [
    {
      relationshipId: 'rel:sort',
      from: 'sym:main',
      to: 'external:std::sort',
      type: 'calls',
      status: 'unresolved',
      reasonCode: 'out_of_scope',
    },
  ];
  const fakeIndex = {
    filesUnder: () => ({ items: files }),
    allSymbols: () => symbols,
    allRelationships: () => relationships,
    symbolsInFile: (fid) => ({ items: symbols.filter((s) => s.fileId === fid) }),
  };

  const rootMod = buildModuleView({ modulePrefix: '.', index: fakeIndex, files });
  assert.ok(rootMod.nodes.some((n) => n.scopeId === 'file:index.js'));
  assert.equal(
    rootMod.nodes.some((n) => n.scopeId === 'file:src/main.cpp'),
    false,
    'root L1 view should not dump nested src files as direct root files',
  );

  const fileView = buildFileView({ fileId: 'file:src/main.cpp', index: fakeIndex });
  const mainNode = fileView.nodes.find((n) => n.id === 'sym:main');
  assert.ok(mainNode);
  assert.equal(mainNode.displayStatus, 'resolved');
  assert.deepEqual(mainNode.badges, []);
});
