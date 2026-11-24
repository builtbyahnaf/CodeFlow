/**
 * Public entry point for Phase 10 semantic zoom (`src/core/graph/zoom/`).
 */

export {
  ZOOM_LEVELS,
  LEVEL_ORDER,
  LEVEL_CAPS,
  LEVEL_LABELS,
  OVERLAY_SLOTS,
  nextChildLevel,
  parentLevel,
  evaluateZoomGesture,
} from './levels.js';

export { createStatusDistribution, mergeStatusDistributions } from './distributions.js';

export { formatBreadcrumbSegments, createNavigationStack } from './breadcrumbs.js';

export { formatEdgeBundleLabel, bundleClusterEdges } from './edgeBundles.js';

export {
  EXPANSION_DEFAULTS,
  clampExpansionPageSize,
  createClusterExpansionService,
} from './expansion.js';

export {
  buildWorkspaceOverview,
  buildModuleView,
  buildFileView,
  buildFunctionView,
  buildStatementView,
} from './aggregator.js';

export {
  searchAcrossZoomLevels,
  resolveSearchTargetBreadcrumbs,
  applyZoomFilters,
  computeDirectionalHighlight,
} from './search.js';

export {
  MAX_TRANSITION_MS,
  computeAnchoredIncrementalLayout,
  virtualizeViewport,
} from './layout.js';

export { MINIMAP_DEFAULTS, buildMinimapModel, recenterViewportFromMinimap } from './minimap.js';

export { serializeZoomNavigationState, restoreZoomNavigationState } from './persistence.js';

export { createSemanticZoomSession } from './session.js';
