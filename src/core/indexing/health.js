/**
 * Index health evaluation and staleness classification (Phase 8 §11).
 *
 * Separates structural integrity verification (`ok` vs `corrupt`) from
 * workspace-relative staleness calculation (`complete`, `partial`, `stale`).
 */

import { validateIndexSnapshot } from './schema.js';

/**
 * Evaluate the effective scope and stale-file set of an index snapshot against
 * live disk hashes.
 *
 * @param {Record<string, any>} snapshot
 * @param {Record<string, string>} [diskHashes]
 * @returns {{
 *   scope: 'complete'|'partial',
 *   rawScope: 'complete'|'partial'|'stale',
 *   staleFiles: string[],
 * }}
 */
export function evaluateIndexScope(snapshot, diskHashes = {}) {
  const state = snapshot?.meta?.state ?? 'unindexed';
  /** @type {string[]} */
  const staleFiles = [];
  for (const fileRow of Object.values(snapshot?.files ?? {})) {
    const diskHash = diskHashes[fileRow.file_id] ?? diskHashes[fileRow.path];
    if (diskHash && diskHash !== fileRow.content_hash) {
      staleFiles.push(fileRow.file_id);
    }
  }
  if (staleFiles.length > 0) {
    return {
      scope: 'partial',
      rawScope: 'stale',
      staleFiles,
    };
  }
  const anyFailedOrOversizedFile = Object.values(snapshot?.analysis_state ?? {}).some(
    (s) => s.completeness === 'failed' || s.completeness === 'oversized',
  );
  if (state === 'complete' && !anyFailedOrOversizedFile) {
    return {
      scope: 'complete',
      rawScope: 'complete',
      staleFiles: [],
    };
  }
  return {
    scope: 'partial',
    rawScope: 'partial',
    staleFiles,
  };
}

/**
 * Compute a structured health report for an index snapshot.
 *
 * @param {Record<string, any>} snapshot
 * @param {Record<string, string>} [diskHashes]
 */
export function evaluateIndexHealth(snapshot, diskHashes = {}) {
  const checked = validateIndexSnapshot(snapshot);
  const { scope, staleFiles, rawScope } = evaluateIndexScope(snapshot, diskHashes);
  return {
    ok: checked.ok,
    integrity: checked.ok ? 'ok' : 'corrupt',
    schemaVersion: checked.ok ? checked.schemaVersion : null,
    state: snapshot?.meta?.state ?? 'corrupt',
    staleFileCount: staleFiles.length,
    staleFileIds: staleFiles,
    scope: rawScope === 'stale' ? 'stale' : scope,
    issues: checked.ok ? [] : checked.issues,
  };
}
