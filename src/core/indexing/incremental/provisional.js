/**
 * In-memory provisional overlay for dirty (unsaved) editor buffers
 * (Phase 9 §6, P9-08, AC-9.6).
 *
 * Rules:
 * - Dirty buffers are analyzed from in-memory text and NEVER written to the
 *   authoritative SQLite/disk index store.
 * - Overlay records carry `provisional: true`.
 * - Cross-file relationships originating from a provisional buffer are capped
 *   at `status: 'possible'` (never `'resolved'`) because the saved state on
 *   disk may differ.
 * - Overlay capacity is capped at `maxFiles` (default 4: active file + up to 3
 *   visible editors). Exceeding the cap refuses additional provisional entries
 *   and falls back to saved-state analysis with `fallbackToSavedStale: true`.
 * - On save: the provisional entry is removed (`reconcileOnSave`) so the
 *   authoritative incremental save path takes over.
 * - On revert/close or external disk overwrite: the provisional entry is
 *   dropped (`discardOnRevert`) restoring the authoritative saved view.
 */

export const DEFAULT_MAX_PROVISIONAL_FILES = 4;

/**
 * @param {{maxFiles?: number}} [options]
 */
export function createProvisionalOverlay(options = {}) {
  const maxFiles = Math.max(
    1,
    Math.trunc(Number(options.maxFiles) || DEFAULT_MAX_PROVISIONAL_FILES),
  );

  /**
   * @type {Map<string, {
   *   fileId: string,
   *   path: string,
   *   contentHash: string,
   *   updatedAt: number,
   *   fileRow: Record<string, any>,
   *   symbolRows: Array<Record<string, any>>,
   *   relationshipRows: Array<Record<string, any>>,
   *   dependencyRows: Array<Record<string, any>>,
   *   analysisStateRow: Record<string, any>,
   * }>}
   */
  const entries = new Map();

  /**
   * Store or update a dirty buffer's projected rows in the in-memory overlay.
   *
   * @param {{
   *   fileId: string,
   *   path: string,
   *   contentHash: string,
   *   updatedAt?: number,
   *   projected: {
   *     fileRow: Record<string, any>,
   *     symbolRows: Array<Record<string, any>>,
   *     relationshipRows: Array<Record<string, any>>,
   *     dependencyRows: Array<Record<string, any>>,
   *     analysisStateRow: Record<string, any>,
   *   },
   * }} input
   */
  function setDirtyFile({ fileId, path, contentHash, updatedAt = 0, projected }) {
    if (!entries.has(fileId) && entries.size >= maxFiles) {
      return {
        ok: false,
        code: 'E_PROVISIONAL_CAP',
        fallbackToSavedStale: true,
        maxFiles,
        message: `Provisional dirty-buffer cap (${maxFiles} files) reached; falling back to saved state with stale badge.`,
      };
    }

    const symbolIdsInFile = new Set((projected.symbolRows ?? []).map((s) => s.symbol_id));
    const provisionalSymbols = (projected.symbolRows ?? []).map((sym) => ({
      ...sym,
      provisional: true,
    }));

    // Cap cross-file relationships from provisional buffers at 'possible'
    const provisionalRelationships = (projected.relationshipRows ?? []).map((rel) => {
      const isSameFileTarget = symbolIdsInFile.has(rel.to_id);
      const downgradedStatus =
        !isSameFileTarget && (rel.status === 'resolved' || rel.status === 'inferred')
          ? 'possible'
          : rel.status;
      return {
        ...rel,
        status: downgradedStatus,
        reason:
          downgradedStatus !== rel.status ? rel.reason || 'provisional_dirty_buffer' : rel.reason,
        provisional: true,
      };
    });

    const entry = {
      fileId,
      path,
      contentHash,
      updatedAt,
      fileRow: {
        ...projected.fileRow,
        provisional: true,
      },
      symbolRows: provisionalSymbols,
      relationshipRows: provisionalRelationships,
      dependencyRows: (projected.dependencyRows ?? []).map((d) => ({ ...d, provisional: true })),
      analysisStateRow: {
        ...projected.analysisStateRow,
        provisional: true,
      },
    };

    entries.set(fileId, entry);
    return {
      ok: true,
      provisional: true,
      fileId,
      activeCount: entries.size,
    };
  }

  /**
   * Drop the provisional overlay for `fileId` when the document is saved so the
   * authoritative index commit becomes the sole truth.
   *
   * @param {string} fileId
   */
  function reconcileOnSave(fileId) {
    const existed = entries.delete(fileId);
    return { ok: true, reconciled: existed, activeCount: entries.size };
  }

  /**
   * Drop the provisional overlay when edits are reverted or the buffer closes
   * without saving.
   *
   * @param {string} fileId
   */
  function discardOnRevert(fileId) {
    const existed = entries.delete(fileId);
    return { ok: true, discarded: existed, activeCount: entries.size };
  }

  /**
   * Handle an external disk change while a buffer is dirty: marks the overlay
   * entry conflicted or drops it when the user reloads from disk.
   *
   * @param {string} fileId
   * @param {string} diskContentHash
   */
  function handleExternalOverwrite(fileId, diskContentHash) {
    const current = entries.get(fileId);
    if (!current) {
      return { ok: true, conflicted: false };
    }
    if (current.contentHash === diskContentHash) {
      entries.delete(fileId);
      return { ok: true, conflicted: false, convergedWithDisk: true };
    }
    return {
      ok: true,
      conflicted: true,
      fileId,
      dirtyHash: current.contentHash,
      diskHash: diskContentHash,
    };
  }

  /**
   * Return a merged read-only view combining the authoritative store snapshot
   * with any active provisional overlay entries without mutating the store.
   *
   * @param {Record<string, any>} authoritativeSnapshot
   * @returns {Record<string, any>}
   */
  function mergeWithAuthoritative(authoritativeSnapshot) {
    if (entries.size === 0) {
      return authoritativeSnapshot;
    }
    const merged = structuredClone(authoritativeSnapshot);

    for (const [fileId, entry] of entries.entries()) {
      // Remove authoritative rows for this fileId in the merged view only
      delete merged.files[fileId];
      delete merged.analysis_state[fileId];
      const oldSymIds = new Set();
      for (const [symId, symRow] of Object.entries(merged.symbols)) {
        if (symRow.file_id === fileId) {
          oldSymIds.add(symId);
          delete merged.symbols[symId];
        }
      }
      for (const [relId, relRow] of Object.entries(merged.relationships)) {
        if (relRow.site_file === fileId || oldSymIds.has(relRow.from_id)) {
          delete merged.relationships[relId];
        }
      }
      for (const [depKey, depRow] of Object.entries(merged.dependencies)) {
        if (depRow.from_file === fileId) {
          delete merged.dependencies[depKey];
        }
      }

      // Overlay provisional rows
      merged.files[fileId] = entry.fileRow;
      merged.analysis_state[fileId] = entry.analysisStateRow;
      for (const sym of entry.symbolRows) {
        merged.symbols[sym.symbol_id] = sym;
      }
      for (const rel of entry.relationshipRows) {
        merged.relationships[rel.rel_id] = rel;
      }
      for (const dep of entry.dependencyRows) {
        const key = `${dep.from_file}|${dep.to_file}|${dep.type}`;
        merged.dependencies[key] = dep;
      }
    }

    return merged;
  }

  function has(fileId) {
    return entries.has(fileId);
  }

  function get(fileId) {
    return entries.get(fileId) ?? null;
  }

  function clear() {
    entries.clear();
  }

  return {
    setDirtyFile,
    reconcileOnSave,
    discardOnRevert,
    handleExternalOverwrite,
    mergeWithAuthoritative,
    has,
    get,
    count: () => entries.size,
    maxFiles: () => maxFiles,
    clear,
  };
}
