/**
 * Per-document debouncing, trailing max-wait flush, IME composition gating, and
 * burst/branch-switch coalescing (Phase 9 §4, P9-02, P9-03).
 *
 * Policy:
 * - Per-document debounce: 350 ms default (clamped 100–2000 ms), reset on each
 *   change to that document.
 * - Maximum wait under continuous typing: 3,000 ms trailing flush so an
 *   actively edited file still refreshes periodically.
 * - Burst coalescing: if > 25 distinct files change within a 1,000 ms window,
 *   switch to bulk mode (`bulk_burst`) and emit a single bulk invalidation pass
 *   instead of thrashing per-file.
 * - IME composition: events flagged `imeComposing: true` or arriving while a
 *   document is in an active composition session are held until composition ends.
 */

import { CHANGE_KINDS, normalizeChangeEvent } from './events.js';

export const DEBOUNCE_DEFAULTS = Object.freeze({
  debounceMs: 350,
  minDebounceMs: 100,
  maxDebounceMs: 2000,
  maxWaitMs: 3000,
  burstWindowMs: 1000,
  burstThresholdFiles: 25,
});

/**
 * Clamp user-configured debounce duration into `[100, 2000]`.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function clampDebounceMs(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return DEBOUNCE_DEFAULTS.debounceMs;
  }
  return Math.min(
    DEBOUNCE_DEFAULTS.maxDebounceMs,
    Math.max(DEBOUNCE_DEFAULTS.minDebounceMs, Math.trunc(num)),
  );
}

/**
 * Create a deterministic incremental event debouncer with injectable clock/timer
 * support so timing storms can be unit-tested synchronously.
 *
 * @param {{
 *   debounceMs?: number,
 *   maxWaitMs?: number,
 *   burstWindowMs?: number,
 *   burstThresholdFiles?: number,
 *   onFlush: (event: Record<string, any>) => void,
 *   onBulkBurst?: (summary: {kind: string, paths: string[], timestamp: number}) => void,
 * }} options
 */
export function createIncrementalDebouncer({
  debounceMs = DEBOUNCE_DEFAULTS.debounceMs,
  maxWaitMs = DEBOUNCE_DEFAULTS.maxWaitMs,
  burstWindowMs = DEBOUNCE_DEFAULTS.burstWindowMs,
  burstThresholdFiles = DEBOUNCE_DEFAULTS.burstThresholdFiles,
  onFlush,
  onBulkBurst,
}) {
  let effectiveDebounceMs = clampDebounceMs(debounceMs);
  const effectiveMaxWaitMs = Math.max(effectiveDebounceMs, Number(maxWaitMs) || 3000);
  const effectiveBurstWindowMs = Math.max(100, Number(burstWindowMs) || 1000);
  const effectiveBurstThreshold = Math.max(2, Number(burstThresholdFiles) || 25);

  /**
   * @type {Map<string, {
   *   event: Record<string, any>,
   *   firstSeenAt: number,
   *   lastSeenAt: number,
   *   dueAt: number,
   *   count: number,
   * }>}
   */
  const pendingByPath = new Map();
  /** @type {Set<string>} */
  const composingPaths = new Set();
  /** @type {Array<{path: string, timestamp: number}>} */
  let recentWindow = [];
  let totalIngested = 0;
  let totalFlushed = 0;
  let totalCoalesced = 0;
  let bulkBurstsTriggered = 0;

  function pruneBurstWindow(now) {
    const cutoff = now - effectiveBurstWindowMs;
    recentWindow = recentWindow.filter((item) => item.timestamp >= cutoff);
  }

  /**
   * Set or clear IME composition state for a file path.
   *
   * @param {string} filePath
   * @param {boolean} active
   * @param {number} [now]
   */
  function setImeComposition(filePath, active, now = 0) {
    const norm = String(filePath ?? '').replace(/\\/g, '/');
    if (active) {
      composingPaths.add(norm);
    } else {
      composingPaths.delete(norm);
      const pending = pendingByPath.get(norm);
      if (pending) {
        pending.dueAt = now + effectiveDebounceMs;
      }
    }
  }

  /**
   * Push a raw or normalized change event into the debouncer.
   *
   * @param {Record<string, any>} rawEvent
   * @param {number} [now]
   */
  function push(rawEvent, now = Number(rawEvent?.timestamp ?? 0)) {
    const parsed =
      rawEvent?.fileId !== undefined
        ? { ok: true, event: rawEvent }
        : normalizeChangeEvent({ ...rawEvent, timestamp: now });
    if (!parsed.ok) {
      return { ok: false, code: parsed.code, message: parsed.message };
    }
    const event = parsed.event;
    totalIngested += 1;

    if (event.imeComposing || composingPaths.has(event.path)) {
      totalCoalesced += 1;
      const existing = pendingByPath.get(event.path);
      pendingByPath.set(event.path, {
        event: { ...event, imeComposing: false },
        firstSeenAt: existing ? existing.firstSeenAt : now,
        lastSeenAt: now,
        dueAt: Number.POSITIVE_INFINITY,
        count: (existing?.count ?? 0) + 1,
      });
      return { ok: true, heldForIme: true };
    }

    // Track distinct file changes in the burst window (for git checkout / branch switches).
    if (event.path && event.kind !== CHANGE_KINDS.EDITOR_DIRTY) {
      pruneBurstWindow(now);
      recentWindow.push({ path: event.path, timestamp: now });
      const distinctPaths = [...new Set(recentWindow.map((item) => item.path))];
      if (distinctPaths.length > effectiveBurstThreshold) {
        // Coalesce all pending watcher/file events into one bulk pass!
        const allPaths = [...new Set([...distinctPaths, ...pendingByPath.keys()])].sort();
        totalCoalesced += pendingByPath.size;
        pendingByPath.clear();
        recentWindow = [];
        bulkBurstsTriggered += 1;
        totalFlushed += 1;
        const burstPayload = {
          kind: CHANGE_KINDS.BULK_BURST,
          paths: allPaths,
          timestamp: now,
        };
        if (typeof onBulkBurst === 'function') {
          onBulkBurst(burstPayload);
        } else {
          onFlush(burstPayload);
        }
        return { ok: true, bulkMode: true, fileCount: allPaths.length };
      }
    }

    const existing = pendingByPath.get(event.path);
    if (existing) {
      totalCoalesced += 1;
      const elapsedSinceFirst = now - existing.firstSeenAt;
      if (elapsedSinceFirst >= effectiveMaxWaitMs) {
        // Trailing max-wait trigger reached under continuous typing: flush immediately.
        pendingByPath.delete(event.path);
        totalFlushed += 1;
        onFlush(event);
        return { ok: true, flushedTrailing: true };
      }
      const maxDueAt = existing.firstSeenAt + effectiveMaxWaitMs;
      pendingByPath.set(event.path, {
        event,
        firstSeenAt: existing.firstSeenAt,
        lastSeenAt: now,
        dueAt: Math.min(now + effectiveDebounceMs, maxDueAt),
        count: existing.count + 1,
      });
      return { ok: true, coalesced: true };
    }

    pendingByPath.set(event.path, {
      event,
      firstSeenAt: now,
      lastSeenAt: now,
      dueAt: now + effectiveDebounceMs,
      count: 1,
    });
    return { ok: true, scheduled: true };
  }

  /**
   * Advance the clock to `now` and flush all due events in deterministic path order.
   *
   * @param {number} now
   * @returns {Array<Record<string, any>>}
   */
  function tick(now) {
    /** @type {Array<Record<string, any>>} */
    const flushed = [];
    const entries = [...pendingByPath.entries()].sort((a, b) =>
      a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    );
    for (const [filePath, entry] of entries) {
      if (composingPaths.has(filePath)) {
        continue;
      }
      if (now >= entry.dueAt) {
        pendingByPath.delete(filePath);
        totalFlushed += 1;
        flushed.push(entry.event);
        onFlush(entry.event);
      }
    }
    return flushed;
  }

  /**
   * Flush all non-IME pending events immediately.
   */
  function flushAll() {
    return tick(Number.MAX_SAFE_INTEGER);
  }

  /**
   * Update debounce duration dynamically on `onDidChangeConfiguration`.
   *
   * @param {number} nextDebounceMs
   */
  function setDebounceMs(nextDebounceMs) {
    effectiveDebounceMs = clampDebounceMs(nextDebounceMs);
  }

  function stats() {
    return {
      debounceMs: effectiveDebounceMs,
      pendingCount: pendingByPath.size,
      totalIngested,
      totalFlushed,
      totalCoalesced,
      bulkBurstsTriggered,
      coalescingRatio: totalIngested > 0 ? totalCoalesced / totalIngested : 0,
    };
  }

  function clear() {
    pendingByPath.clear();
    composingPaths.clear();
    recentWindow = [];
  }

  return {
    push,
    tick,
    flushAll,
    setImeComposition,
    setDebounceMs,
    stats,
    clear,
  };
}
