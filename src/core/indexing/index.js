/**
 * Public entry point for the headless indexing core (`src/core/indexing/`).
 */

export {
  INDEX_SCHEMA_VERSION,
  INDEX_STATES,
  DEPENDENCY_TYPES,
  DEPENDENCY_STATUSES,
  ANALYSIS_COMPLETENESS,
  SCHEMA_V1_DDL,
  createEmptyIndexSnapshot,
  validateIndexSnapshot,
} from './schema.js';

export { SUPPORTED_SCHEMA_MIGRATIONS, migrateIndexSchema } from './migrate.js';

export { DEFAULT_INDEX_CONFIG, isSafeGlobPattern, normalizeIndexConfig } from './config.js';

export {
  ALWAYS_EXCLUDED_DIRS,
  DEFAULT_EXCLUDED_DIRS,
  DEFAULT_SUPPORTED_EXTENSIONS,
  BINARY_EXTENSIONS,
  globToRegExp,
  parseGitignoreHints,
  shouldIndexPath,
} from './exclusions.js';

export { pathDepth, orderCandidateFiles, planIndexBatches } from './ordering.js';

export { computeContentFingerprint, diffWorkspaceFingerprints } from './fingerprints.js';

export { STALE_LOCK_THRESHOLD_MS, createLockPayload, evaluateLockState } from './locks.js';

export {
  rowToSymbol,
  rowToRelationship,
  computeLogicalIndexHash,
  createIndexQuerySurface,
} from './queries.js';

export { evaluateIndexScope, evaluateIndexHealth } from './health.js';

export {
  FIRST_OPEN_ACTIONS,
  FIRST_OPEN_CHOICES,
  decideFirstOpenAction,
  formatIndexStatusBar,
} from './workflow.js';

export * from './incremental/index.js';
