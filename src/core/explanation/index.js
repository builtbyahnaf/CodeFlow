/**
 * Public surface for the Phase 6 Deterministic Explanation Engine.
 */

export {
  RULESET_VERSION,
  EXPLANATION_TOPICS,
  EVIDENCE_KINDS,
  CLAIM_KINDS,
  DEPTH_LEVELS,
  RESOLUTION_STATUSES,
  createEvidenceRef,
  dedupeEvidence,
  explanationId,
  assembleFragments,
  validateExplanationItem,
} from './model.js';

export {
  BANNED_PHRASING_RULES,
  qualifyStatus,
  ensureStatusQualification,
  formatCallSummary,
  formatLimitations,
  lintExplanationText,
} from './phrasing.js';

export {
  EXPLANATION_DEFAULTS,
  clampExplanationDepth,
  resolveExplanationSettings,
  explanationSettingsChanged,
} from './settings.js';

export { createExplanationCache } from './cache.js';
export { extractFunctionFacts, extractNodeFacts, rangeEvidence } from './facts.js';
export { RULE_GROUPS } from './rules/catalog.js';
export { createExplanationEngine } from './engine.js';
