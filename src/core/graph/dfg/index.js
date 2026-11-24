/**
 * Public entry point for Phase 11 data-flow graph (`src/core/graph/dfg/`).
 *
 * Re-exports only the symbols that callers outside this module should use.
 * Internal helpers (reaching.js, defuse.js) are intentionally not re-exported.
 */

// Vocabulary
export {
  FLOW_NODE_KINDS,
  FLOW_EDGE_KINDS,
  FLOW_STATUSES,
  FLOW_REASON_CODES,
  DFG_DTO_VERSION,
  REACHING_DEF_BUDGET_ITERATIONS,
  REACHING_DEF_BUDGET_MS,
  SLICE_BUDGET_MS,
  DFG_CACHE_CAPACITY,
  flowEdgeLabel,
  glyphForFlowStatus,
} from './kinds.js';

// Model
export { validateDfg, createEmptyDfg, dfgCacheKey, makeFlowNodeId } from './model.js';

// Builder
export { buildDfg, LIMITATIONS } from './builder.js';

// Query
export {
  nodesForBinding,
  defsReachingUse,
  usesReachedByDef,
  loopCarriedEdges,
  traceBinding,
  backwardSlice,
  forwardSlice,
  bindingDetailEntries,
  hasInterproceduralFlows,
} from './query.js';

// DTO & Overlay
export { toDfgDto, fromDfgDto } from './dto.js';
export { buildDfgOverlay } from './overlay.js';

// Cache
export { createLruCache, createDfgCache } from './cache.js';

// Low-level (for tests)
export { extractSites, extractParamSites } from './defuse.js';
export { reachingDefinitions, findBackEdges, encodeDefKey, decodeDefKey } from './reaching.js';
