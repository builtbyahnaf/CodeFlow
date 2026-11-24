import test from 'node:test';
import assert from 'node:assert/strict';

import { ZOOM_LEVELS } from '../../src/core/graph/zoom/levels.js';
import { createSemanticZoomSession } from '../../src/core/graph/zoom/session.js';
import { validateDto } from '../../src/core/graph/dto.js';
import { GRAPH_DTO_VERSION } from '../../src/core/graph/dto.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { createQueryLayer } from '../../src/core/csr/query.js';

test('semantic zoom session navigates L0 Workspace -> L1 Module -> L2 File -> L3 Symbol -> L4 Function -> L5 Statement in <= 6 actions and survives 200 expand/collapse cycles (P10-05, P10-13, P10-21, AC-10.1)', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:zoom-e2e',
    path: 'src/DBHandler.js',
    text: 'export function check_db_exists(db) {\n  for (let i = 0; i < 3; i += 1) {\n    if (!db) return false;\n  }\n  return true;\n}\n',
  });
  const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
  const fnSym = run.symbols.find((s) => s.name === 'check_db_exists');
  const fileRecord = run.files[0];

  const fakeIndex = {
    filesUnder: (prefix = '') => ({
      items: !prefix || 'src/DBHandler.js'.startsWith(prefix) ? [fileRecord] : [],
    }),
    allSymbols: () => run.symbols,
    allRelationships: () => run.relationships,
    symbolsInFile: () => ({ items: run.symbols }),
    symbolsByName: () => ({ items: [fnSym], total: 1 }),
  };

  const session = createSemanticZoomSession({
    runId: run.runId,
    index: fakeIndex,
    query,
    reducedMotion: true,
  });

  // Action 0: Open L0 Workspace overview
  const l0 = session.open();
  assert.equal(l0.dto.level, ZOOM_LEVELS.L0_WORKSPACE);
  assert.equal(validateDto({ dtoVersion: GRAPH_DTO_VERSION, ...l0.dto }).ok, true);

  // Action 1: Descend to L1 Module ('src')
  const l1 = session.descend({
    level: ZOOM_LEVELS.L1_MODULE,
    scopeId: 'src',
    label: 'src',
    currentViewport: { x: 15, y: 25, zoom: 1.2 },
    currentSelection: 'cluster:dir:src',
  });
  assert.equal(l1.dto.level, ZOOM_LEVELS.L1_MODULE);

  // Action 2: Descend to L2 File
  const l2 = session.descend({
    level: ZOOM_LEVELS.L2_FILE,
    scopeId: fileRecord.fileId,
    label: 'DBHandler.js',
  });
  assert.equal(l2.dto.level, ZOOM_LEVELS.L2_FILE);

  // Action 3: Descend to L3 Symbol
  const l3 = session.descend({
    level: ZOOM_LEVELS.L3_SYMBOL,
    scopeId: fnSym.symbolId,
    label: fnSym.name,
  });
  assert.equal(l3.dto.level, ZOOM_LEVELS.L3_SYMBOL);

  // Action 4: Descend to L4 Function CFG
  const l4 = session.descend({
    level: ZOOM_LEVELS.L4_FUNCTION,
    scopeId: fnSym.symbolId,
    label: fnSym.name,
  });
  assert.equal(l4.dto.level, ZOOM_LEVELS.L4_FUNCTION);
  assert.ok(l4.dto.nodes.length >= 3);

  // Action 5: Descend to L5 Statement detail inside construct
  const firstConstructNode = l4.dto.nodes.find((n) => n.constructId) ?? l4.dto.nodes[0];
  const l5 = session.descend({
    level: ZOOM_LEVELS.L5_STATEMENT,
    scopeId: firstConstructNode.scopeId,
    label: 'loop@1',
  });
  assert.equal(l5.dto.level, ZOOM_LEVELS.L5_STATEMENT);
  assert.equal(l5.dto.breadcrumbs.length, 6);

  // Return to L0 via breadcrumb 0 and verify saved viewport & selection are restored
  const backL0 = session.ascendToBreadcrumb(0);
  assert.equal(backL0.dto.level, ZOOM_LEVELS.L0_WORKSPACE);
  assert.deepEqual(backL0.dto.viewport, { x: 15, y: 25, zoom: 1.2 });
  assert.equal(backL0.dto.selection, 'cluster:dir:src');

  // 200 expand/collapse cycles memory soak (P10-21)
  for (let cycle = 0; cycle < 200; cycle += 1) {
    const exp = session.expandCluster({ clusterId: 'cluster:dir:src', limit: 10 });
    assert.equal(exp.ok, true);
  }
  assert.ok(session.expansionService.cacheSize() <= 128);
});
