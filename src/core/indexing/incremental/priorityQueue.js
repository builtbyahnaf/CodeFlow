/**
 * Priority task queue, per-file supersession by `(fileId, contentHash)`,
 * cooperative preemption, and P3 aging (Phase 9 §7.1, §7.2, §15, P9-10, P9-11).
 *
 * Priorities:
 * - P0 (`0`): Active editor file & user-initiated zoom expansion (Phase 10 handoff)
 * - P1 (`1`): Visible editors
 * - P2 (`2`): Recently navigated files (last 10)
 * - P3 (`3`): Background index maintenance & cascade re-analysis
 *
 * Supersession rule (AC-9.7):
 * - A newer task for the same `fileId` cancels any queued or in-flight task for
 *   that `fileId`.
 * - Each task is stamped with `(fileId, contentHash, generation)`.
 * - Before committing a finished task, `canCommit(task)` verifies that no newer
 *   generation or different `contentHash` has superseded it.
 */

export const EXECUTION_PRIORITIES = Object.freeze({
  P0_ACTIVE: 0,
  P1_VISIBLE: 1,
  P2_RECENT: 2,
  P3_BACKGROUND: 3,
});

/**
 * Compute default worker pool concurrency `min(max(cpus - 1, 2), 4)`
 * (Phase 9 §7.2: never 1, never unbounded).
 *
 * @param {number} [cpuCount]
 * @returns {number}
 */
export function resolveWorkerPoolSize(cpuCount = 4) {
  const safeCpus = Number.isFinite(Number(cpuCount)) ? Math.trunc(Number(cpuCount)) : 4;
  return Math.min(4, Math.max(2, safeCpus - 1));
}

/**
 * @param {{
 *   maxQueueDepth?: number,
 *   agingIntervalMs?: number,
 * }} [options]
 */
export function createPriorityTaskQueue(options = {}) {
  const maxQueueDepth = Math.max(10, Math.trunc(Number(options.maxQueueDepth) || 500));
  const agingIntervalMs = Math.max(100, Math.trunc(Number(options.agingIntervalMs) || 2500));

  let sequence = 0;
  /** @type {Map<string, number>} */
  const latestGenerationByFile = new Map();
  /** @type {Map<string, string>} */
  const latestHashByFile = new Map();
  /** @type {Map<string, Record<string, any>>} */
  const queuedByFile = new Map();
  /** @type {Map<string, Record<string, any>>} */
  const inFlightByFile = new Map();

  let supersededCount = 0;
  let preemptedCount = 0;

  /**
   * Compute effective priority including aging so P3 tasks cannot starve
   * indefinitely behind a stream of higher-priority tasks (§13).
   *
   * @param {Record<string, any>} task
   * @param {number} now
   * @returns {number}
   */
  function effectivePriority(task, now) {
    const ageMs = Math.max(0, now - Number(task.enqueuedAt || 0));
    const promotions = Math.floor(ageMs / agingIntervalMs);
    return Math.max(EXECUTION_PRIORITIES.P0_ACTIVE, task.priority - promotions);
  }

  /**
   * Enqueue a task for `fileId` with `(contentHash, priority)`. Supersedes any
   * older queued or in-flight task for the same `fileId`.
   *
   * @param {{
   *   fileId: string,
   *   path?: string,
   *   contentHash: string,
   *   priority?: number,
   *   dirty?: boolean,
   *   payload?: Record<string, any>,
   *   enqueuedAt?: number,
   * }} input
   */
  function enqueue(input) {
    const fileId = String(input.fileId ?? '');
    const contentHash = String(input.contentHash ?? '');
    const priority = Number.isInteger(input.priority)
      ? Math.min(3, Math.max(0, Number(input.priority)))
      : EXECUTION_PRIORITIES.P3_BACKGROUND;
    const now = Number(input.enqueuedAt ?? 0);

    sequence += 1;
    const generation = sequence;
    latestGenerationByFile.set(fileId, generation);
    latestHashByFile.set(fileId, contentHash);

    let superseded = false;
    if (queuedByFile.has(fileId)) {
      const oldQueued = queuedByFile.get(fileId);
      oldQueued.token.isCancelled = true;
      queuedByFile.delete(fileId);
      supersededCount += 1;
      superseded = true;
    }

    if (inFlightByFile.has(fileId)) {
      const oldInFlight = inFlightByFile.get(fileId);
      oldInFlight.token.isCancelled = true;
      oldInFlight.superseded = true;
      inFlightByFile.delete(fileId);
      supersededCount += 1;
      superseded = true;
    }

    // Preemption: if this is P0 or P1, flag any in-flight P2/P3 task to yield
    // at its next checkpoint (§7.1).
    if (priority <= EXECUTION_PRIORITIES.P1_VISIBLE) {
      for (const running of inFlightByFile.values()) {
        if (running.priority >= EXECUTION_PRIORITIES.P2_RECENT && !running.preemptRequested) {
          running.preemptRequested = true;
          preemptedCount += 1;
        }
      }
    }

    const task = {
      taskId: `task:${generation}`,
      fileId,
      path: input.path ?? fileId,
      contentHash,
      priority,
      generation,
      dirty: input.dirty === true,
      payload: input.payload ?? {},
      enqueuedAt: now,
      preemptRequested: false,
      superseded: false,
      token: { isCancelled: false },
    };

    queuedByFile.set(fileId, task);
    return {
      ok: true,
      task,
      superseded,
      queueDepth: queuedByFile.size,
      saturated: queuedByFile.size > maxQueueDepth,
    };
  }

  /**
   * Dedicated P0 priority lane for Phase 10 semantic-zoom expansion queries
   * (§15 handoff).
   *
   * @param {{id: string, payload?: Record<string, any>, enqueuedAt?: number}} request
   */
  function enqueueZoomExpansion(request) {
    return enqueue({
      fileId: `zoom:${request.id}`,
      contentHash: `zoom:${request.id}`,
      priority: EXECUTION_PRIORITIES.P0_ACTIVE,
      payload: request.payload,
      enqueuedAt: request.enqueuedAt,
    });
  }

  /**
   * Dequeue the highest-priority eligible task. When `pauseBackground === true`
   * (typing backpressure), only P0 and P1 tasks are eligible to start.
   *
   * @param {{now?: number, pauseBackground?: boolean}} [dequeueOptions]
   */
  function dequeue(dequeueOptions = {}) {
    const now = Number(dequeueOptions.now ?? 0);
    const pauseBackground = dequeueOptions.pauseBackground === true;

    const candidates = [...queuedByFile.values()]
      .filter((task) => {
        if (task.token.isCancelled) {
          return false;
        }
        if (pauseBackground && task.priority >= EXECUTION_PRIORITIES.P2_RECENT) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        const effA = effectivePriority(a, now);
        const effB = effectivePriority(b, now);
        if (effA !== effB) {
          return effA - effB;
        }
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.generation - b.generation;
      });

    const picked = candidates[0];
    if (!picked) {
      return null;
    }
    queuedByFile.delete(picked.fileId);
    inFlightByFile.set(picked.fileId, picked);
    return picked;
  }

  /**
   * Verify whether a completed task is still authoritative and allowed to
   * commit its results (AC-9.7).
   *
   * @param {{fileId: string, contentHash: string, generation: number, token?: {isCancelled?: boolean}}} task
   * @returns {boolean}
   */
  function canCommit(task) {
    if (!task || task.token?.isCancelled) {
      return false;
    }
    const latestGen = latestGenerationByFile.get(task.fileId);
    const latestHash = latestHashByFile.get(task.fileId);
    if (latestGen !== undefined && task.generation !== latestGen) {
      return false;
    }
    if (latestHash !== undefined && task.contentHash !== latestHash) {
      return false;
    }
    return true;
  }

  /**
   * Mark an in-flight task finished.
   *
   * @param {{fileId: string, generation: number}} task
   */
  function complete(task) {
    const current = inFlightByFile.get(task?.fileId);
    if (current && current.generation === task.generation) {
      inFlightByFile.delete(task.fileId);
    }
  }

  /**
   * Re-queue a cooperatively preempted P2/P3 task if it has not been superseded.
   *
   * @param {Record<string, any>} task
   */
  function requeuePreempted(task) {
    complete(task);
    if (!canCommit(task)) {
      return { ok: false, reason: 'superseded' };
    }
    task.preemptRequested = false;
    queuedByFile.set(task.fileId, task);
    return { ok: true };
  }

  /**
   * Cancel all queued and in-flight tasks (used on user cancel or extension
   * shutdown, AC-9.9).
   */
  function cancelAll() {
    for (const task of queuedByFile.values()) {
      task.token.isCancelled = true;
    }
    for (const task of inFlightByFile.values()) {
      task.token.isCancelled = true;
    }
    queuedByFile.clear();
    inFlightByFile.clear();
  }

  function stats() {
    return {
      queuedCount: queuedByFile.size,
      inFlightCount: inFlightByFile.size,
      supersededCount,
      preemptedCount,
      maxQueueDepth,
    };
  }

  return {
    enqueue,
    enqueueZoomExpansion,
    dequeue,
    canCommit,
    complete,
    requeuePreempted,
    cancelAll,
    stats,
  };
}
