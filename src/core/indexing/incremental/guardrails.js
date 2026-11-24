/**
 * Correctness guardrails for uncertain dependency completeness, failed
 * re-analysis, excluded targets, and non-determinism checks (Phase 9 §5.3,
 * P9-07, P9-09).
 *
 * Governing rule: incorrect reuse is worse than redundant work. Uncertainty
 * always widens invalidation and marks affected results `partial` or `stale`.
 */

/**
 * Evaluate Phase 9 §5.3 uncertainty guardrails for an incremental update.
 *
 * @param {{
 *   fileId: string,
 *   filePath: string,
 *   language?: 'cpp'|'javascript',
 *   hasCompileDb?: boolean,
 *   hasUnresolvedImport?: boolean,
 *   excludedImportTargets?: string[],
 *   renameWithoutDeps?: boolean,
 *   oldFileId?: string,
 *   oldFilePath?: string,
 *   analysisFailed?: boolean,
 *   failureReason?: string,
 *   firstPassLogicalHash?: string,
 *   secondPassLogicalHash?: string,
 *   allFiles?: Record<string, {file_id: string, path: string}>,
 * }} context
 */
export function evaluateUncertaintyGuardrails(context) {
  /** @type {Array<{code: string, severity: 'warning'|'error', message: string}>} */
  const diagnostics = [];
  /** @type {Set<string>} */
  const extraInvalidatedFileIds = new Set();
  let forcePartialCompleteness = false;
  let preservePreviousRowsAsStale = false;
  /** @type {string[]} */
  const downgradeEdgesToUnresolvedForTargets = [];

  const fileDir = String(context.filePath ?? '')
    .replace(/\\/g, '/')
    .split('/')
    .slice(0, -1)
    .join('/');

  function addDirectoryPeers(dirPrefix) {
    for (const row of Object.values(context.allFiles ?? {})) {
      const norm = String(row.path ?? '').replace(/\\/g, '/');
      const rowDir = norm.split('/').slice(0, -1).join('/');
      if (
        row.file_id !== context.fileId &&
        (rowDir === dirPrefix || norm.startsWith(`${dirPrefix}/`))
      ) {
        extraInvalidatedFileIds.add(row.file_id);
      }
    }
  }

  // Row 1: Dependency graph incomplete (no compile DB for C++ or unresolved import)
  if (
    (context.language === 'cpp' && context.hasCompileDb === false) ||
    context.hasUnresolvedImport === true
  ) {
    forcePartialCompleteness = true;
    addDirectoryPeers(fileDir);
    diagnostics.push({
      code: 'uncertainty_widened_invalidation',
      severity: 'warning',
      message:
        'Dependency graph is incomplete for this file (missing compile_commands.json or unresolved import); widened invalidation to directory peers and marked dependent results partial.',
    });
  }

  // Row 2: Import resolved but target is excluded from indexing
  if (Array.isArray(context.excludedImportTargets) && context.excludedImportTargets.length > 0) {
    downgradeEdgesToUnresolvedForTargets.push(...context.excludedImportTargets);
    forcePartialCompleteness = true;
    diagnostics.push({
      code: 'excluded_dependency_target',
      severity: 'warning',
      message: `Imported target (${context.excludedImportTargets.join(', ')}) is excluded from indexing; cross-file edges marked unresolved.`,
    });
  }

  // Row 3: Rename without detectable dependency info -> delete+add and invalidate peers of both paths
  if (context.renameWithoutDeps) {
    forcePartialCompleteness = true;
    addDirectoryPeers(fileDir);
    if (context.oldFilePath) {
      const oldDir = String(context.oldFilePath)
        .replace(/\\/g, '/')
        .split('/')
        .slice(0, -1)
        .join('/');
      addDirectoryPeers(oldDir);
    }
    diagnostics.push({
      code: 'rename_without_dependencies',
      severity: 'warning',
      message:
        'File renamed without complete dependency information; invalidated directory peers of both old and new paths.',
    });
  }

  // Row 4: Analysis failure on a changed file -> keep previous rows but mark stale
  if (context.analysisFailed) {
    preservePreviousRowsAsStale = true;
    forcePartialCompleteness = true;
    diagnostics.push({
      code: 'stale_on_analysis_failure',
      severity: 'error',
      message: `Incremental analysis failed for "${context.filePath}" (${context.failureReason ?? 'adapter error'}); previous index rows retained and marked stale.`,
    });
  }

  // Row 5: Determinism check failure (two runs on identical input disagree)
  if (
    context.firstPassLogicalHash &&
    context.secondPassLogicalHash &&
    context.firstPassLogicalHash !== context.secondPassLogicalHash
  ) {
    diagnostics.push({
      code: 'analysis_nondeterministic',
      severity: 'warning',
      message: `Determinism check failed for "${context.filePath}" (${context.firstPassLogicalHash} vs ${context.secondPassLogicalHash}); keeping newer result.`,
    });
  }

  return {
    forcePartialCompleteness,
    preservePreviousRowsAsStale,
    extraInvalidatedFileIds: [...extraInvalidatedFileIds].sort(),
    downgradeEdgesToUnresolvedForTargets,
    diagnostics,
  };
}
