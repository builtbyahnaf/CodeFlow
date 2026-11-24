/**
 * Hybrid execution and incremental indexing coordinator (Phase 9 §7, §8,
 * P9-10..P9-14).
 *
 * Orchestrates:
 *   event -> debouncer -> normalize -> classify -> priority queue ->
 *   worker pool -> provisional overlay (if dirty) OR atomic store transaction
 *   (if saved) -> reverse-dependency cascade -> local telemetry & status.
 */

import { shouldIndexPath } from '../exclusions.js';
import { computeContentFingerprint } from '../fingerprints.js';
import { CHANGE_KINDS, normalizeChangeEvent } from './events.js';
import { createIncrementalDebouncer } from './debounce.js';
import { diffFileRows } from './signatures.js';
import { classifyChange, INVALIDATION_CLASSES } from './classify.js';
import { buildReverseDependencyGraph, planInvalidationCascade } from './cascade.js';
import { evaluateUncertaintyGuardrails } from './guardrails.js';
import { createProvisionalOverlay } from './provisional.js';
import {
  EXECUTION_PRIORITIES,
  createPriorityTaskQueue,
  resolveWorkerPoolSize,
} from './priorityQueue.js';
import { createBackpressureController } from './backpressure.js';
import { createIncrementalTelemetry } from './telemetry.js';
import { extractStoredFileRows, projectIncrementalRun } from './projection.js';
import { createFileId } from '../../csr/identity.js';

export { extractStoredFileRows, projectIncrementalRun };

/**
 * Create the Phase 9 incremental coordinator.
 *
 * @param {{
 *   store: {getConfig: () => Record<string, any>, getSnapshot: () => Record<string, any>, writeBatch: (batch: Record<string, any>) => {ok: boolean, [key: string]: any}},
 *   readWorkspaceFile: (relativePath: string) => Promise<string>,
 *   listWorkspaceFiles?: () => Promise<Array<{path: string, sizeBytes?: number}>>,
 *   analyzeFile: (input: {path: string, source: string, runId: string, token?: {isCancelled?: boolean}}) => Promise<
 *     {ok: true, run: Record<string, any>} | {ok: false, code: string, message: string}
 *   >,
 *   cpuCount?: number,
 *   debounceMs?: number,
 *   maxProvisionalFiles?: number,
 *   clock?: () => number,
 * }} options
 */
export function createIncrementalCoordinator({
  store,
  readWorkspaceFile,
  listWorkspaceFiles = async () => [],
  analyzeFile,
  cpuCount = 4,
  debounceMs = 350,
  maxProvisionalFiles = 4,
  clock = () => Date.now(),
}) {
  const poolSize = resolveWorkerPoolSize(cpuCount);
  const queue = createPriorityTaskQueue();
  const backpressure = createBackpressureController({ poolSize });
  const telemetry = createIncrementalTelemetry();
  const provisional = createProvisionalOverlay({ maxFiles: maxProvisionalFiles });

  /** @type {Set<string>} */
  const staleOnFailureFileIds = new Set();
  /** @type {Array<Record<string, any>>} */
  const flushedEvents = [];
  let runSeq = 0;
  let disposed = false;

  const debouncer = createIncrementalDebouncer({
    debounceMs,
    onFlush: (event) => {
      flushedEvents.push(event);
    },
    onBulkBurst: (burst) => {
      flushedEvents.push(burst);
    },
  });

  /**
   * Reconcile index rows when `.codeflow/config.json` exclusions change (P9-04):
   * - Removes any currently indexed file that is now excluded.
   * - Indexes any workspace file that is newly included.
   */
  async function reconcileConfigChange() {
    const config = store.getConfig();
    const snap = store.getSnapshot();
    /** @type {string[]} */
    const newlyExcludedFileIds = [];

    for (const fileRow of Object.values(snap.files ?? {})) {
      const check = shouldIndexPath(fileRow.path, {
        include: config.include,
        exclude: config.exclude,
      });
      if (!check.allowed) {
        newlyExcludedFileIds.push(fileRow.file_id);
      }
    }

    if (newlyExcludedFileIds.length > 0) {
      store.writeBatch({
        deletedFileIds: newlyExcludedFileIds,
        state: 'complete',
      });
      telemetry.recordDbWrite({ rowCount: newlyExcludedFileIds.length });
    }

    const candidates = await listWorkspaceFiles();
    /** @type {string[]} */
    const newlyIncludedPaths = [];
    for (const entry of candidates) {
      const check = shouldIndexPath(entry.path, {
        include: config.include,
        exclude: config.exclude,
      });
      if (!check.allowed) {
        continue;
      }
      const fileId = createFileId(check.normalizedPath);
      if (!snap.files?.[fileId]) {
        newlyIncludedPaths.push(check.normalizedPath);
      }
    }

    for (const relPath of newlyIncludedPaths) {
      await processSingleFileNow({
        kind: CHANGE_KINDS.FILE_CREATE,
        path: relPath,
        priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
      });
    }

    return {
      ok: true,
      removedExcludedCount: newlyExcludedFileIds.length,
      addedIncludedCount: newlyIncludedPaths.length,
    };
  }

  /**
   * Immediately process a single normalized change event (or enqueue and drain).
   *
   * @param {Record<string, any>} rawEvent
   * @param {{cascadeDepth?: number}} [execOptions]
   */
  async function processSingleFileNow(rawEvent, execOptions = {}) {
    if (disposed) {
      return { ok: false, code: 'E_CANCELLED', message: 'Coordinator is disposed.' };
    }
    const parsed =
      rawEvent?.fileId !== undefined
        ? { ok: true, event: rawEvent }
        : normalizeChangeEvent(rawEvent);
    if (!parsed.ok) {
      return parsed;
    }
    const event = parsed.event;
    const now = clock();

    if (event.kind === CHANGE_KINDS.CONFIG_CHANGE) {
      telemetry.recordClassification(INVALIDATION_CLASSES.GLOBAL, 'none');
      return reconcileConfigChange();
    }

    if (event.kind === CHANGE_KINDS.EDITOR_REVERT) {
      const dropped = provisional.discardOnRevert(event.fileId);
      return { ok: true, kind: event.kind, discardedProvisional: dropped.discarded };
    }

    if (event.kind === CHANGE_KINDS.FILE_DELETE) {
      provisional.discardOnRevert(event.fileId);
      const snap = store.getSnapshot();
      const reverseGraph = buildReverseDependencyGraph(snap);
      const classification = classifyChange({ event });
      const cascade = planInvalidationCascade({
        changedFileIds: [event.fileId],
        classification,
        reverseGraph,
        allFiles: snap.files,
      });
      telemetry.recordClassification(classification.scopeClass, cascade.escalationLevel);
      store.writeBatch({
        deletedFileIds: [event.fileId],
        state: 'complete',
      });
      telemetry.recordDbWrite({ rowCount: 1 });

      if ((execOptions.cascadeDepth ?? 0) < 2) {
        for (const depFileId of cascade.dependentFileIds) {
          const depPath = store.getSnapshot().files?.[depFileId]?.path;
          if (depPath) {
            await processSingleFileNow(
              {
                kind: CHANGE_KINDS.WATCHER_CHANGE,
                path: depPath,
                priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
              },
              { cascadeDepth: (execOptions.cascadeDepth ?? 0) + 1 },
            );
          }
        }
      }

      return {
        ok: true,
        classification,
        cascade,
        deletedFileId: event.fileId,
      };
    }

    if (event.kind === CHANGE_KINDS.FILE_RENAME) {
      provisional.discardOnRevert(event.fromFileId);
      const snap = store.getSnapshot();
      const reverseGraph = buildReverseDependencyGraph(snap);
      const classification = classifyChange({ event });
      const cascade = planInvalidationCascade({
        changedFileIds: [event.fromFileId, event.toFileId],
        classification,
        reverseGraph,
        allFiles: snap.files,
      });
      store.writeBatch({
        deletedFileIds: [event.fromFileId],
      });
      const created = await processSingleFileNow(
        {
          kind: CHANGE_KINDS.FILE_CREATE,
          path: event.toPath,
          ...(typeof event.text === 'string' ? { text: event.text } : {}),
          priority: event.priority ?? EXECUTION_PRIORITIES.P2_RECENT,
        },
        { cascadeDepth: (execOptions.cascadeDepth ?? 0) + 1 },
      );
      if ((execOptions.cascadeDepth ?? 0) < 2) {
        for (const depFileId of cascade.dependentFileIds) {
          const depPath = store.getSnapshot().files?.[depFileId]?.path;
          if (depPath) {
            await processSingleFileNow(
              {
                kind: CHANGE_KINDS.WATCHER_CHANGE,
                path: depPath,
                priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
              },
              { cascadeDepth: (execOptions.cascadeDepth ?? 0) + 1 },
            );
          }
        }
      }
      return {
        ok: created.ok,
        classification,
        cascade,
        renamedFrom: event.fromFileId,
        renamedTo: event.toFileId,
      };
    }

    const config = store.getConfig();
    const check = shouldIndexPath(event.path, {
      include: config.include,
      exclude: config.exclude,
    });
    if (!check.allowed) {
      return { ok: true, skippedExcluded: true, reason: check.reason };
    }

    let sourceText;
    try {
      sourceText =
        typeof event.text === 'string' ? event.text : await readWorkspaceFile(check.normalizedPath);
    } catch (error) {
      return {
        ok: false,
        code: 'E_IO',
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const fp = computeContentFingerprint(sourceText);
    const snap = store.getSnapshot();
    const previousRows = extractStoredFileRows(snap, event.fileId);

    // Content hash short-circuit: if not dirty, not a cascade dependent
    // invalidation, and hash matches stored row, skip re-analysis (cache hit!).
    if (
      !event.dirty &&
      !(Number(execOptions.cascadeDepth) > 0) &&
      previousRows.fileRow &&
      previousRows.fileRow.content_hash === fp.contentHash &&
      !staleOnFailureFileIds.has(event.fileId) &&
      !provisional.has(event.fileId)
    ) {
      telemetry.recordCacheLookup(true);
      return {
        ok: true,
        cacheHit: true,
        fileId: event.fileId,
        classification: {
          scopeClass: INVALIDATION_CLASSES.LOCAL,
          reason: 'unchanged_content_hash',
        },
      };
    }
    telemetry.recordCacheLookup(false);

    const enqueued = queue.enqueue({
      fileId: event.fileId,
      path: check.normalizedPath,
      contentHash: fp.contentHash,
      priority:
        event.priority ??
        (event.dirty ? EXECUTION_PRIORITIES.P0_ACTIVE : EXECUTION_PRIORITIES.P2_RECENT),
      dirty: event.dirty,
      enqueuedAt: now,
    });
    telemetry.recordTaskEnqueued({ superseded: enqueued.superseded });

    const task = queue.dequeue({ now });
    if (!task) {
      return { ok: true, queued: true };
    }

    telemetry.recordTaskStarted();
    const runStartedAt = clock();
    runSeq += 1;
    const runId = `run:inc-${now.toString(36)}-${runSeq}`;

    const analyzed = await analyzeFile({
      path: check.normalizedPath,
      source: sourceText,
      runId,
      token: task.token,
    });
    const durationMs = Math.max(0, clock() - runStartedAt);

    if (!queue.canCommit(task)) {
      queue.complete(task);
      telemetry.recordTaskCancelled({ dropped: true });
      return {
        ok: true,
        superseded: true,
        committed: false,
        fileId: event.fileId,
      };
    }

    // Stale-on-failure guardrail (P9-09): if analysis fails, keep previous rows
    // in store and mark the file stale instead of overwriting with empty rows.
    if (!analyzed.ok) {
      queue.complete(task);
      staleOnFailureFileIds.add(event.fileId);
      const guard = evaluateUncertaintyGuardrails({
        fileId: event.fileId,
        filePath: check.normalizedPath,
        language: check.language,
        analysisFailed: true,
        failureReason: analyzed.message,
        allFiles: snap.files,
      });
      return {
        ok: false,
        code: analyzed.code ?? 'E_ANALYSIS_FAILED',
        message: analyzed.message,
        staleMarked: true,
        preservedPreviousRows: Boolean(previousRows.fileRow),
        guardrails: guard,
      };
    }

    const projected = projectIncrementalRun({
      relativePath: check.normalizedPath,
      contentHash: fp.contentHash,
      sizeBytes: fp.sizeBytes,
      lineCount: fp.lineCount,
      run: analyzed.run,
      now: clock(),
    });

    // Dirty buffer path (Phase 9 §6): write to in-memory provisional overlay ONLY.
    if (event.dirty) {
      queue.complete(task);
      const overlayRes = provisional.setDirtyFile({
        fileId: event.fileId,
        path: check.normalizedPath,
        contentHash: fp.contentHash,
        updatedAt: clock(),
        projected,
      });
      telemetry.recordTaskCompleted({
        language: check.language,
        durationMs,
        provisional: true,
      });
      return {
        ...overlayRes,
        fileId: event.fileId,
      };
    }

    // Save/watcher authoritative path: drop any provisional overlay for this file.
    provisional.reconcileOnSave(event.fileId);
    staleOnFailureFileIds.delete(event.fileId);

    const rowDiff = previousRows.fileRow ? diffFileRows(previousRows, projected) : null;
    const classification = classifyChange({
      event,
      rowDiff,
    });

    const reverseGraph = buildReverseDependencyGraph(snap);
    const cascade = planInvalidationCascade({
      changedFileIds: [event.fileId],
      classification,
      reverseGraph,
      allFiles: snap.files,
    });

    const hasUnresolvedImport = (analyzed.run.diagnostics ?? []).some((d) =>
      String(d.code ?? '').includes('unresolved'),
    );
    const guardrails = evaluateUncertaintyGuardrails({
      fileId: event.fileId,
      filePath: check.normalizedPath,
      language: check.language,
      hasUnresolvedImport,
      allFiles: snap.files,
    });

    if (guardrails.forcePartialCompleteness) {
      projected.analysisStateRow.completeness = 'partial';
    }

    const writeRes = store.writeBatch({
      files: [projected.fileRow],
      symbols: projected.symbolRows,
      relationships: projected.relationshipRows,
      dependencies: projected.dependencyRows,
      analysisStates: [projected.analysisStateRow],
      runId,
      state: guardrails.forcePartialCompleteness ? 'partial' : 'complete',
    });
    queue.complete(task);

    if (!writeRes.ok) {
      return writeRes;
    }

    telemetry.recordClassification(classification.scopeClass, cascade.escalationLevel);
    telemetry.recordDbWrite({
      rowCount:
        1 +
        projected.symbolRows.length +
        projected.relationshipRows.length +
        projected.dependencyRows.length,
    });
    telemetry.recordTaskCompleted({
      language: check.language,
      durationMs,
      provisional: false,
    });

    const allDependents = [
      ...new Set([...cascade.dependentFileIds, ...guardrails.extraInvalidatedFileIds]),
    ];

    if (classification.reanalyzeDependents && (execOptions.cascadeDepth ?? 0) < 2) {
      for (const depFileId of allDependents) {
        const depPath = store.getSnapshot().files?.[depFileId]?.path;
        if (depPath && depFileId !== event.fileId) {
          await processSingleFileNow(
            {
              kind: CHANGE_KINDS.WATCHER_CHANGE,
              path: depPath,
              priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
            },
            { cascadeDepth: (execOptions.cascadeDepth ?? 0) + 1 },
          );
        }
      }
    }

    return {
      ok: true,
      committed: true,
      provisional: false,
      fileId: event.fileId,
      rowDiff,
      classification,
      cascade,
      guardrails,
      reanalyzedDependents: allDependents,
    };
  }

  /**
   * Ingest an event through the debouncer (for editor typing / rapid watcher events).
   *
   * @param {Record<string, any>} rawEvent
   * @param {number} [now]
   */
  function ingest(rawEvent, now = clock()) {
    if (rawEvent?.kind === CHANGE_KINDS.EDITOR_DIRTY) {
      backpressure.recordTyping(now);
    }
    const res = debouncer.push(rawEvent, now);
    telemetry.recordEvent({ coalesced: Boolean(res.coalesced || res.bulkMode || res.heldForIme) });
    return res;
  }

  /**
   * Advance the debouncer clock to `now` and process all flushed events.
   *
   * @param {number} [now]
   */
  async function flushDue(now = clock()) {
    debouncer.tick(now);
    /** @type {Array<Record<string, any>>} */
    const results = [];
    while (flushedEvents.length > 0) {
      const next = flushedEvents.shift();
      if (next.kind === CHANGE_KINDS.BULK_BURST) {
        for (const p of next.paths ?? []) {
          results.push(
            await processSingleFileNow({
              kind: CHANGE_KINDS.WATCHER_CHANGE,
              path: p,
              priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
            }),
          );
        }
      } else {
        results.push(await processSingleFileNow(next));
      }
    }
    return results;
  }

  /**
   * Return the effective snapshot combining authoritative saved state and any
   * in-memory provisional dirty-buffer overlay.
   */
  function getEffectiveSnapshot() {
    return provisional.mergeWithAuthoritative(store.getSnapshot());
  }

  function isFileStale(fileId) {
    return staleOnFailureFileIds.has(fileId);
  }

  function cancelAll() {
    debouncer.clear();
    flushedEvents.length = 0;
    queue.cancelAll();
  }

  function dispose() {
    disposed = true;
    cancelAll();
    provisional.clear();
    staleOnFailureFileIds.clear();
  }

  return {
    ingest,
    flushDue,
    processSingleFileNow,
    reconcileConfigChange,
    getEffectiveSnapshot,
    isFileStale,
    provisional,
    debouncer,
    queue,
    backpressure,
    telemetry,
    cancelAll,
    dispose,
  };
}
