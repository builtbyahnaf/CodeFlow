/**
 * Local-only, content-free incremental indexing telemetry (Phase 9 §9, AC-9.8).
 *
 * All metrics are held in memory for `CodeFlow: Show Index Status` and
 * diagnostic inspection. Source code, symbol names, and file paths are NEVER
 * stored or emitted by this module.
 */

const MAX_DURATION_SAMPLES = 256;

/**
 * Compute p50 (median) and p95 from a numeric array.
 *
 * @param {number[]} samples
 * @returns {{count: number, p50Ms: number, p95Ms: number}}
 */
export function computePercentiles(samples = []) {
  if (!Array.isArray(samples) || samples.length === 0) {
    return { count: 0, p50Ms: 0, p95Ms: 0 };
  }
  const sorted = [...samples].sort((a, b) => a - b);
  const p50Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.5));
  const p95Index = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return {
    count: sorted.length,
    p50Ms: Number(sorted[p50Index].toFixed(2)),
    p95Ms: Number(sorted[p95Index].toFixed(2)),
  };
}

export function createIncrementalTelemetry() {
  let eventsProcessed = 0;
  let debounceCoalesced = 0;
  let tasksEnqueued = 0;
  let tasksStarted = 0;
  let tasksCompleted = 0;
  let tasksCancelled = 0;
  let tasksSuperseded = 0;
  let tasksDropped = 0;
  let cacheHits = 0;
  let cacheMisses = 0;
  let dbTransactions = 0;
  let dbRowsWritten = 0;
  let responsivenessThrottles = 0;
  let provisionalRuns = 0;

  const classifications = {
    local: 0,
    dependent: 0,
    global: 0,
  };

  const escalations = {
    none: 0,
    direct_dependents: 0,
    module_subtree: 0,
    full_project: 0,
  };

  /** @type {{javascript: number[], cpp: number[]}} */
  const durationsByLanguage = {
    javascript: [],
    cpp: [],
  };

  function recordEvent({ coalesced = false } = {}) {
    eventsProcessed += 1;
    if (coalesced) {
      debounceCoalesced += 1;
    }
  }

  function recordTaskEnqueued({ superseded = false } = {}) {
    tasksEnqueued += 1;
    if (superseded) {
      tasksSuperseded += 1;
    }
  }

  function recordTaskStarted() {
    tasksStarted += 1;
  }

  function recordTaskCompleted({
    language = 'javascript',
    durationMs = 0,
    provisional = false,
  } = {}) {
    tasksCompleted += 1;
    if (provisional) {
      provisionalRuns += 1;
    }
    const bucket = language === 'cpp' ? durationsByLanguage.cpp : durationsByLanguage.javascript;
    bucket.push(Math.max(0, Number(durationMs) || 0));
    if (bucket.length > MAX_DURATION_SAMPLES) {
      bucket.shift();
    }
  }

  function recordTaskCancelled({ dropped = false } = {}) {
    if (dropped) {
      tasksDropped += 1;
    } else {
      tasksCancelled += 1;
    }
  }

  function recordClassification(scopeClass, escalationLevel = 'none') {
    if (scopeClass in classifications) {
      classifications[scopeClass] += 1;
    }
    if (escalationLevel in escalations) {
      escalations[escalationLevel] += 1;
    }
  }

  function recordCacheLookup(hit) {
    if (hit) {
      cacheHits += 1;
    } else {
      cacheMisses += 1;
    }
  }

  function recordDbWrite({ rowCount = 0 } = {}) {
    dbTransactions += 1;
    dbRowsWritten += Math.max(0, Number(rowCount) || 0);
  }

  function recordResponsivenessThrottle() {
    responsivenessThrottles += 1;
  }

  function snapshot() {
    const totalCache = cacheHits + cacheMisses;
    return {
      eventsProcessed,
      debounceCoalesced,
      debounceCoalescingRatio:
        eventsProcessed > 0 ? Number((debounceCoalesced / eventsProcessed).toFixed(4)) : 0,
      tasks: {
        enqueued: tasksEnqueued,
        started: tasksStarted,
        completed: tasksCompleted,
        cancelled: tasksCancelled,
        superseded: tasksSuperseded,
        dropped: tasksDropped,
      },
      classifications: { ...classifications },
      escalations: { ...escalations },
      cache: {
        hits: cacheHits,
        misses: cacheMisses,
        hitRatio: totalCache > 0 ? Number((cacheHits / totalCache).toFixed(4)) : 0,
      },
      db: {
        transactions: dbTransactions,
        rowsWritten: dbRowsWritten,
      },
      responsivenessThrottles,
      provisionalRuns,
      durations: {
        javascript: computePercentiles(durationsByLanguage.javascript),
        cpp: computePercentiles(durationsByLanguage.cpp),
      },
    };
  }

  function reset() {
    eventsProcessed = 0;
    debounceCoalesced = 0;
    tasksEnqueued = 0;
    tasksStarted = 0;
    tasksCompleted = 0;
    tasksCancelled = 0;
    tasksSuperseded = 0;
    tasksDropped = 0;
    cacheHits = 0;
    cacheMisses = 0;
    dbTransactions = 0;
    dbRowsWritten = 0;
    responsivenessThrottles = 0;
    provisionalRuns = 0;
    classifications.local = 0;
    classifications.dependent = 0;
    classifications.global = 0;
    escalations.none = 0;
    escalations.direct_dependents = 0;
    escalations.module_subtree = 0;
    escalations.full_project = 0;
    durationsByLanguage.javascript.length = 0;
    durationsByLanguage.cpp.length = 0;
  }

  return {
    recordEvent,
    recordTaskEnqueued,
    recordTaskStarted,
    recordTaskCompleted,
    recordTaskCancelled,
    recordClassification,
    recordCacheLookup,
    recordDbWrite,
    recordResponsivenessThrottle,
    snapshot,
    reset,
  };
}
