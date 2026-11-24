/**
 * Backpressure, continuous-typing pause/resume, CPU budget throttling, and
 * event-loop responsiveness guard (Phase 9 §7.3, §7.4, P9-12, P9-13).
 *
 * Rules:
 * - If queue depth > `maxQueueDepth` (default 500) OR the user has been typing
 *   continuously for > `continuousTypingThresholdMs` (default 10,000 ms), pause
 *   P2/P3 background tasks and report status `'paused_while_typing'`.
 * - Resume P2/P3 after `idleResumeMs` (default 2,000 ms) of no typing events.
 * - While the user is actively typing, background analysis concurrency is
 *   capped at 50% of the worker pool (`Math.max(1, Math.floor(poolSize * 0.5))`).
 * - Event-loop responsiveness guard: if an event-loop lag sample exceeds
 *   `lagThresholdMs` (default 100 ms), throttle background work until the next
 *   idle window and increment `responsiveness_throttle`.
 */

export const BACKPRESSURE_DEFAULTS = Object.freeze({
  maxQueueDepth: 500,
  continuousTypingThresholdMs: 10_000,
  idleResumeMs: 2000,
  lagThresholdMs: 100,
  maxWriteBatchFiles: 50,
  maxWriteDurationMs: 2000,
});

/**
 * @param {{
 *   maxQueueDepth?: number,
 *   continuousTypingThresholdMs?: number,
 *   idleResumeMs?: number,
 *   lagThresholdMs?: number,
 *   poolSize?: number,
 * }} [options]
 */
export function createBackpressureController(options = {}) {
  const maxQueueDepth = Math.max(
    10,
    Number(options.maxQueueDepth) || BACKPRESSURE_DEFAULTS.maxQueueDepth,
  );
  const continuousTypingThresholdMs = Math.max(
    1000,
    Number(options.continuousTypingThresholdMs) ||
      BACKPRESSURE_DEFAULTS.continuousTypingThresholdMs,
  );
  const idleResumeMs = Math.max(
    200,
    Number(options.idleResumeMs) || BACKPRESSURE_DEFAULTS.idleResumeMs,
  );
  const lagThresholdMs = Math.max(
    20,
    Number(options.lagThresholdMs) || BACKPRESSURE_DEFAULTS.lagThresholdMs,
  );
  const poolSize = Math.min(4, Math.max(2, Number(options.poolSize) || 4));

  /** @type {number|null} */
  let typingStartedAt = null;
  /** @type {number|null} */
  let lastKeystrokeAt = null;
  let pausedForTyping = false;
  let pausedForQueueDepth = false;
  let throttledForLag = false;
  let responsivenessThrottleCount = 0;
  let lastLagMs = 0;

  /**
   * Record a user keystroke/typing event at timestamp `now`.
   *
   * @param {number} now
   */
  function recordTyping(now) {
    if (lastKeystrokeAt !== null && now - lastKeystrokeAt >= idleResumeMs) {
      // Previous typing session ended; start a fresh window.
      typingStartedAt = now;
    } else if (typingStartedAt === null) {
      typingStartedAt = now;
    }
    lastKeystrokeAt = now;

    if (now - typingStartedAt >= continuousTypingThresholdMs) {
      pausedForTyping = true;
    }
  }

  /**
   * Evaluate queue depth and idle elapsed time at timestamp `now`.
   *
   * @param {{now: number, queueDepth?: number}} state
   */
  function evaluate({ now, queueDepth = 0 }) {
    if (lastKeystrokeAt !== null && now - lastKeystrokeAt >= idleResumeMs) {
      typingStartedAt = null;
      lastKeystrokeAt = null;
      pausedForTyping = false;
      throttledForLag = false;
    }

    pausedForQueueDepth = queueDepth > maxQueueDepth;
    const isActivelyTyping = lastKeystrokeAt !== null && now - lastKeystrokeAt < idleResumeMs;
    const pauseBackground = pausedForTyping || pausedForQueueDepth || throttledForLag;

    const allowedConcurrency = isActivelyTyping
      ? Math.max(1, Math.floor(poolSize * 0.5))
      : poolSize;

    let status = 'active';
    if (throttledForLag) {
      status = 'lag_throttled';
    } else if (pausedForTyping || pausedForQueueDepth) {
      status = 'paused_while_typing';
    } else if (queueDepth > 0) {
      status = 'catching_up';
    }

    return {
      status,
      pauseBackground,
      pausedForTyping,
      pausedForQueueDepth,
      throttledForLag,
      isActivelyTyping,
      allowedConcurrency,
      responsivenessThrottleCount,
      lastLagMs,
    };
  }

  /**
   * Record an event-loop lag sample (Phase 9 §7.4). If `lagMs > lagThresholdMs`,
   * activates lag throttling and increments `responsiveness_throttle`.
   *
   * @param {number} lagMs
   */
  function recordEventLoopLag(lagMs) {
    lastLagMs = Math.max(0, Number(lagMs) || 0);
    if (lastLagMs > lagThresholdMs) {
      throttledForLag = true;
      responsivenessThrottleCount += 1;
      return { throttled: true, responsivenessThrottleCount };
    }
    return { throttled: false, responsivenessThrottleCount };
  }

  /**
   * Clear lag throttle once an idle window is reached.
   */
  function clearLagThrottle() {
    throttledForLag = false;
  }

  return {
    recordTyping,
    evaluate,
    recordEventLoopLag,
    clearLagThrottle,
    stats: () => ({
      pausedForTyping,
      pausedForQueueDepth,
      throttledForLag,
      responsivenessThrottleCount,
      lastLagMs,
      poolSize,
    }),
  };
}
