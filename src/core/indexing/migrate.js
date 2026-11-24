/**
 * Explicit index schema migration harness (Phase 8 §6, P8-03).
 *
 * Compatible sequential steps (`1 -> 2`) migrate in memory without mutating the
 * input snapshot. Unknown or incompatible major versions return
 * `E_SCHEMA_INCOMPATIBLE` with `rebuildRequired: true`.
 */

import { INDEX_SCHEMA_VERSION, validateIndexSnapshot } from './schema.js';

export const SUPPORTED_SCHEMA_MIGRATIONS = Object.freeze({
  /**
   * Step 1 -> 2 (test/evolution step): updates `meta.schema_version` to 2 and
   * records `meta.migrated_from = 1`.
   *
   * @param {Record<string, any>} snapshot
   * @param {{now?: number}} [options]
   */
  1: (snapshot, options = {}) => ({
    ...snapshot,
    meta: {
      ...snapshot.meta,
      schema_version: 2,
      migrated_from: 1,
      updated_at: Number(options.now ?? snapshot.meta?.updated_at ?? 0),
    },
  }),
});

/**
 * Migrate an index snapshot to `targetVersion` (default `INDEX_SCHEMA_VERSION`).
 *
 * @param {unknown} rawSnapshot
 * @param {number} [targetVersion]
 * @param {{now?: number}} [options]
 * @returns {{
 *   ok: true,
 *   snapshot: Record<string, any>,
 *   migrated: boolean,
 *   fromVersion: number,
 *   toVersion: number,
 * } | {
 *   ok: false,
 *   code: 'E_CORRUPT'|'E_SCHEMA_INCOMPATIBLE',
 *   message: string,
 *   rebuildRequired: boolean,
 * }}
 */
export function migrateIndexSchema(
  rawSnapshot,
  targetVersion = INDEX_SCHEMA_VERSION,
  options = {},
) {
  const checked = validateIndexSnapshot(rawSnapshot);
  if (!checked.ok) {
    return {
      ok: false,
      code: 'E_CORRUPT',
      message: checked.message,
      rebuildRequired: true,
    };
  }

  const fromVersion = checked.schemaVersion;
  if (fromVersion === targetVersion) {
    return {
      ok: true,
      snapshot: structuredClone(checked.snapshot),
      migrated: false,
      fromVersion,
      toVersion: targetVersion,
    };
  }

  if (fromVersion > targetVersion || fromVersion < 1 || targetVersion > 2) {
    return {
      ok: false,
      code: 'E_SCHEMA_INCOMPATIBLE',
      message: `Schema version ${fromVersion} is incompatible with target version ${targetVersion}; rebuild required.`,
      rebuildRequired: true,
    };
  }

  let current = structuredClone(checked.snapshot);
  let version = fromVersion;
  while (version < targetVersion) {
    const step = SUPPORTED_SCHEMA_MIGRATIONS[version];
    if (!step) {
      return {
        ok: false,
        code: 'E_SCHEMA_INCOMPATIBLE',
        message: `No migration step from schema v${version} to v${version + 1}.`,
        rebuildRequired: true,
      };
    }
    current = step(current, options);
    version += 1;
  }

  return {
    ok: true,
    snapshot: current,
    migrated: true,
    fromVersion,
    toVersion: targetVersion,
  };
}
