/**
 * Incremental change classification (Phase 9 §5.1, P9-05).
 *
 * Classifies an edit or workspace event into `local`, `dependent`, or `global`
 * invalidation scope according to the normative §5.1 decision table.
 */

import { CHANGE_KINDS } from './events.js';

export const INVALIDATION_CLASSES = Object.freeze({
  LOCAL: 'local',
  DEPENDENT: 'dependent',
  GLOBAL: 'global',
});

const HEADER_EXTENSIONS = new Set(['.h', '.hpp', '.hh', '.hxx']);

/**
 * True when `filePath` is a C/C++ header file.
 *
 * @param {string} filePath
 * @returns {boolean}
 */
export function isCppHeaderPath(filePath) {
  const lower = String(filePath ?? '').toLowerCase();
  for (const ext of HEADER_EXTENSIONS) {
    if (lower.endsWith(ext)) {
      return true;
    }
  }
  return false;
}

/**
 * Classify a file change or workspace event into `local`, `dependent`, or
 * `global` invalidation scope (Phase 9 §5.1).
 *
 * @param {{
 *   event?: {kind?: string, path?: string},
 *   rowDiff?: ReturnType<typeof import('./signatures.js').diffFileRows>,
 *   isHeaderFile?: boolean,
 *   compileDbChanged?: boolean,
 *   toolchainChanged?: boolean,
 *   configChanged?: boolean,
 * }} input
 * @returns {{
 *   scopeClass: 'local'|'dependent'|'global',
 *   reason: string,
 *   replaceFileRowsOnly: boolean,
 *   reanalyzeDependents: boolean,
 *   transitiveDependents: boolean,
 *   affectedDependencyTargets: string[],
 * }}
 */
export function classifyChange(input = {}) {
  const kind = input.event?.kind ?? '';
  const filePath = input.event?.path ?? '';

  if (input.compileDbChanged || kind === CHANGE_KINDS.COMPILE_DB_CHANGE) {
    return {
      scopeClass: INVALIDATION_CLASSES.GLOBAL,
      reason: 'compile_db_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: true,
      affectedDependencyTargets: [],
    };
  }

  if (input.toolchainChanged || kind === CHANGE_KINDS.TOOLCHAIN_CHANGE) {
    return {
      scopeClass: INVALIDATION_CLASSES.GLOBAL,
      reason: 'toolchain_version_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: true,
      affectedDependencyTargets: [],
    };
  }

  if (input.configChanged || kind === CHANGE_KINDS.CONFIG_CHANGE) {
    return {
      scopeClass: INVALIDATION_CLASSES.GLOBAL,
      reason: 'config_exclusions_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: false,
      affectedDependencyTargets: [],
    };
  }

  if (kind === CHANGE_KINDS.BULK_BURST) {
    return {
      scopeClass: INVALIDATION_CLASSES.GLOBAL,
      reason: 'bulk_watcher_burst',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: true,
      affectedDependencyTargets: [],
    };
  }

  if (kind === CHANGE_KINDS.FILE_DELETE || kind === CHANGE_KINDS.FILE_RENAME) {
    return {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      reason: kind === CHANGE_KINDS.FILE_RENAME ? 'file_renamed' : 'file_deleted',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: isCppHeaderPath(filePath),
      affectedDependencyTargets: [],
    };
  }

  const diff = input.rowDiff;
  const isHeader = input.isHeaderFile ?? isCppHeaderPath(filePath);

  if (!diff) {
    return {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      reason: 'missing_diff_conservative_dependent',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: isHeader,
      affectedDependencyTargets: [],
    };
  }

  // Row 1: Comments/whitespace only (no symbols, no relationships, no dependencies changed)
  if (diff.isSemanticNoOp) {
    return {
      scopeClass: INVALIDATION_CLASSES.LOCAL,
      reason: 'comments_or_whitespace_only',
      replaceFileRowsOnly: true,
      reanalyzeDependents: false,
      transitiveDependents: false,
      affectedDependencyTargets: [],
    };
  }

  // Row 5: C++ header file declaration/symbol/dependency change -> transitive dependents
  if (isHeader && (!diff.symbolsIdentical || !diff.dependenciesIdentical)) {
    return {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      reason: 'header_declarations_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: true,
      affectedDependencyTargets: [...diff.addedDependencyTargets, ...diff.removedDependencyTargets],
    };
  }

  // Row 3: Symbol added/removed/renamed/kind/visibility/signature changed -> dependent
  if (!diff.symbolsIdentical) {
    return {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      reason: 'symbol_surface_or_signature_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: isHeader,
      affectedDependencyTargets: [...diff.addedDependencyTargets, ...diff.removedDependencyTargets],
    };
  }

  // Row 4: Include/import set changed -> dependent (old and new targets)
  if (!diff.dependenciesIdentical) {
    return {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      reason: 'include_or_import_set_changed',
      replaceFileRowsOnly: false,
      reanalyzeDependents: true,
      transitiveDependents: false,
      affectedDependencyTargets: [...diff.addedDependencyTargets, ...diff.removedDependencyTargets],
    };
  }

  // Row 2: Function body changed (internal calls/constructs changed), but
  // exported symbol set, signatures, and imports/includes are unchanged -> local!
  return {
    scopeClass: INVALIDATION_CLASSES.LOCAL,
    reason: 'function_body_only',
    replaceFileRowsOnly: true,
    reanalyzeDependents: false,
    transitiveDependents: false,
    affectedDependencyTargets: [],
  };
}
