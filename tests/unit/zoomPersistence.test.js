import test from 'node:test';
import assert from 'node:assert/strict';

import { ZOOM_LEVELS } from '../../src/core/graph/zoom/levels.js';
import {
  serializeZoomNavigationState,
  restoreZoomNavigationState,
} from '../../src/core/graph/zoom/persistence.js';

test('serializeZoomNavigationState and restoreZoomNavigationState restore exact state or fall back to deepest surviving ancestor (P10-17, AC-10.8)', () => {
  const saved = serializeZoomNavigationState({
    graphId: 'zoom:fn',
    runId: 'run:100',
    level: ZOOM_LEVELS.L4_FUNCTION,
    scopeId: 'sym:deletedFn',
    focusId: 'sym:deletedFn',
    viewport: { x: 50, y: 90, zoom: 1.4 },
    breadcrumbPath: [
      { level: ZOOM_LEVELS.L0_WORKSPACE, scopeId: 'workspace', label: 'workspace' },
      { level: ZOOM_LEVELS.L1_MODULE, scopeId: 'src', label: 'src' },
      {
        level: ZOOM_LEVELS.L2_FILE,
        scopeId: 'file:src/keep.js',
        label: 'keep.js',
        viewport: { x: 10, y: 20, zoom: 1.1 },
      },
      { level: ZOOM_LEVELS.L4_FUNCTION, scopeId: 'sym:deletedFn', label: 'deletedFn' },
    ],
    filters: { kinds: ['function'], relationshipTypes: [], statuses: [] },
  });

  // 1. Exact restore when runId and scopeId are still valid
  const exact = restoreZoomNavigationState(saved, {
    currentRunId: 'run:100',
    scopeExists: () => true,
  });
  assert.equal(exact.restoredExact, true);
  assert.equal(exact.fellBackToAncestor, false);
  assert.equal(exact.state.level, ZOOM_LEVELS.L4_FUNCTION);
  assert.equal(exact.state.scopeId, 'sym:deletedFn');

  // 2. When sym:deletedFn no longer exists after re-analysis, falls back to deepest surviving ancestor (L2 file:src/keep.js)
  const ancestorFallback = restoreZoomNavigationState(saved, {
    currentRunId: 'run:101',
    scopeExists: (_level, scopeId) => scopeId !== 'sym:deletedFn',
  });
  assert.equal(ancestorFallback.restoredExact, false);
  assert.equal(ancestorFallback.fellBackToAncestor, true);
  assert.equal(ancestorFallback.state.level, ZOOM_LEVELS.L2_FILE);
  assert.equal(ancestorFallback.state.scopeId, 'file:src/keep.js');
  assert.deepEqual(ancestorFallback.state.viewport, { x: 10, y: 20, zoom: 1.1 });
  assert.match(ancestorFallback.notice, /restored ancestor "keep\.js"/);

  // 3. Corrupt state or forbidden raw-source keys fall back safely to workspace root
  const corrupt = restoreZoomNavigationState({
    ...saved,
    sourceText: 'forbidden raw source',
  });
  assert.equal(corrupt.state.level, ZOOM_LEVELS.L0_WORKSPACE);
  assert.equal(corrupt.state.scopeId, 'workspace');
});
