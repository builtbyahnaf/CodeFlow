/**
 * Public surface for the Phase 7 Call Graph and Cross-File Relationship layer.
 */

export {
  CALL_SCOPES,
  CALL_SCOPE_REASONS,
  CALL_RELATIONSHIP_TYPES,
  CALL_STATUSES,
  CALL_NODE_KINDS,
  CALL_LIMITS,
  STATUS_STRENGTH,
  formatScopeBanner,
  callEdgeDash,
  callEdgeGlyph,
} from './kinds.js';

export { mergeStatusPair, mergeEvidenceSources } from './merge.js';
export { detectCallCycles } from './cycles.js';
export { createAdapterEvidenceSource, createIndexEvidenceSource } from './sources.js';
export {
  encodeCallCursor,
  decodeCallCursor,
  clampCallPageSize,
  clampCallDepth,
  clampCallMaxNodes,
} from './cursor.js';
export { buildUnresolvedBucket, buildCandidateBuckets } from './buckets.js';
export { createCallGraphQueryService } from './query.js';
export { createCallGraphSession } from './ego.js';
