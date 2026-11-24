import test from 'node:test';
import assert from 'node:assert/strict';

import { ZOOM_LEVELS } from '../../src/core/graph/zoom/levels.js';
import { createNavigationStack } from '../../src/core/graph/zoom/breadcrumbs.js';

test('createNavigationStack tracks level descent and restores exact ancestor viewport and selection on breadcrumb click (P10-01, P10-13)', () => {
  const stack = createNavigationStack({
    level: ZOOM_LEVELS.L0_WORKSPACE,
    scopeId: 'workspace',
    label: 'workspace',
  });

  // Pan/select at L0 before descending
  stack.updateCurrent({
    viewport: { x: 120, y: 80, zoom: 1.25 },
    selection: 'cluster:dir:src',
    focusId: 'cluster:dir:src',
  });

  // Descend L0 -> L1 -> L2 -> L4 -> L5
  stack.descend({ level: ZOOM_LEVELS.L1_MODULE, scopeId: 'src', label: 'src' });
  stack.updateCurrent({
    viewport: { x: -40, y: 200, zoom: 1.5 },
    selection: 'file:src/DBHandler.js',
  });
  stack.descend({
    level: ZOOM_LEVELS.L2_FILE,
    scopeId: 'file:src/DBHandler.js',
    label: 'DBHandler.js',
  });
  stack.descend({
    level: ZOOM_LEVELS.L4_FUNCTION,
    scopeId: 'sym:check_db_exists',
    label: 'check_db_exists',
  });
  stack.descend({
    level: ZOOM_LEVELS.L5_STATEMENT,
    scopeId: 'loop@14',
    label: 'loop@14',
  });

  const crumbs = stack.breadcrumbs();
  assert.deepEqual(
    crumbs.map((c) => c.label),
    ['workspace', 'src', 'DBHandler.js', 'check_db_exists', 'loop@14'],
  );

  // Return to L1 ('src' at index 1) -> restores L1's exact viewport and selection
  const returnedL1 = stack.ascendTo(1);
  assert.equal(returnedL1.ok, true);
  assert.equal(returnedL1.state.level, ZOOM_LEVELS.L1_MODULE);
  assert.deepEqual(returnedL1.state.viewport, { x: -40, y: 200, zoom: 1.5 });
  assert.equal(returnedL1.state.selection, 'file:src/DBHandler.js');

  // Return to L0 ('workspace' at index 0) -> restores L0's exact viewport and selection
  const returnedL0 = stack.ascendOne();
  assert.equal(returnedL0.state.level, ZOOM_LEVELS.L0_WORKSPACE);
  assert.deepEqual(returnedL0.state.viewport, { x: 120, y: 80, zoom: 1.25 });
  assert.equal(returnedL0.state.selection, 'cluster:dir:src');
});
