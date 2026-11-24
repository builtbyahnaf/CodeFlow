/**
 * Public entry point for Phase 9 incremental indexing and hybrid execution
 * (`src/core/indexing/incremental/`).
 */

export { CHANGE_KINDS, normalizeChangeEvent, coalesceEventSequence } from './events.js';

export { DEBOUNCE_DEFAULTS, clampDebounceMs, createIncrementalDebouncer } from './debounce.js';

export { computeSymbolSignature, diffFileRows } from './signatures.js';

export { INVALIDATION_CLASSES, isCppHeaderPath, classifyChange } from './classify.js';

export { CASCADE_DEFAULTS, ESCALATION_LEVELS, estimateCascadeCost } from './costModel.js';

export { buildReverseDependencyGraph, planInvalidationCascade } from './cascade.js';

export { extractStoredFileRows, projectIncrementalRun } from './projection.js';

export { evaluateUncertaintyGuardrails } from './guardrails.js';

export { DEFAULT_MAX_PROVISIONAL_FILES, createProvisionalOverlay } from './provisional.js';

export {
  EXECUTION_PRIORITIES,
  resolveWorkerPoolSize,
  createPriorityTaskQueue,
} from './priorityQueue.js';

export { BACKPRESSURE_DEFAULTS, createBackpressureController } from './backpressure.js';

export { computePercentiles, createIncrementalTelemetry } from './telemetry.js';

export { createIncrementalCoordinator } from './coordinator.js';

export { createDeterministicRng, generateDeterministicEditSequence } from './scenarios.js';
