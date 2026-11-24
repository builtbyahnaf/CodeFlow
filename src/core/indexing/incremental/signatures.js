/**
 * Symbol signature normalization and deterministic row diffing (Phase 9 §5.1, §8, P9-05).
 *
 * Governing rule:
 * "Signature" = normalized parameter list, return type (when resolved), kind,
 * visibility, exported-ness, and template-ness. Line numbers and body hashes
 * are deliberately excluded from signature comparison so comment/whitespace
 * edits and function-body-only edits stay `local`.
 */

import { hashHex } from '../../csr/hash.js';

/**
 * Compute a line-independent semantic signature hash for a symbol row.
 *
 * @param {Record<string, any>} symbolRow
 * @returns {string}
 */
export function computeSymbolSignature(symbolRow = {}) {
  let ext = {};
  if (typeof symbolRow.extensions_json === 'string' && symbolRow.extensions_json.length > 0) {
    try {
      ext = JSON.parse(symbolRow.extensions_json) ?? {};
    } catch {
      ext = {};
    }
  } else if (symbolRow.extensions && typeof symbolRow.extensions === 'object') {
    ext = symbolRow.extensions;
  }

  const descriptor = {
    symbolId: String(symbolRow.symbol_id ?? symbolRow.symbolId ?? ''),
    kind: String(symbolRow.kind ?? ''),
    name: String(symbolRow.name ?? ''),
    qualifiedName: String(symbolRow.qualified_name ?? symbolRow.qualifiedName ?? ''),
    visibility: String(symbolRow.visibility ?? 'public'),
    parentId: String(symbolRow.parent_id ?? symbolRow.parentId ?? ''),
    signature: String(symbolRow.signature ?? ext.signature ?? ''),
    parameters: Array.isArray(ext.parameters) ? ext.parameters : [],
    returnType: String(ext.returnType ?? ''),
    exported: Boolean(ext.exported ?? symbolRow.visibility === 'public'),
    isTemplate: Boolean(ext.isTemplate ?? false),
  };

  return `sig:${hashHex(JSON.stringify(descriptor))}`;
}

/**
 * True when a symbol row is a function-local variable inside a function body
 * rather than part of the file's callable/exported declaration surface.
 *
 * @param {Record<string, any>} row
 * @returns {boolean}
 */
export function isFunctionLocalVariable(row = {}) {
  const kind = String(row.kind ?? '');
  const visibility = String(row.visibility ?? '');
  const parentId = row.parent_id ?? row.parentId;
  if (kind === 'variable' && (visibility === 'local' || Boolean(parentId))) {
    return true;
  }
  return false;
}

/**
 * Compare previous and new index rows for a single file in $O(N)$ keyed by ID.
 *
 * @param {{
 *   fileRow?: Record<string, any>,
 *   symbolRows?: Array<Record<string, any>>,
 *   relationshipRows?: Array<Record<string, any>>,
 *   dependencyRows?: Array<Record<string, any>>,
 * }} previous
 * @param {{
 *   fileRow?: Record<string, any>,
 *   symbolRows?: Array<Record<string, any>>,
 *   relationshipRows?: Array<Record<string, any>>,
 *   dependencyRows?: Array<Record<string, any>>,
 * }} next
 */
export function diffFileRows(previous = {}, next = {}) {
  const prevSymbols = new Map(
    (previous.symbolRows ?? []).map((row) => [row.symbol_id ?? row.symbolId, row]),
  );
  const nextSymbols = new Map(
    (next.symbolRows ?? []).map((row) => [row.symbol_id ?? row.symbolId, row]),
  );

  /** @type {string[]} */
  const addedSymbols = [];
  /** @type {string[]} */
  const removedSymbols = [];
  /** @type {string[]} */
  const signatureChangedSymbols = [];
  /** @type {string[]} */
  const rangeShiftedSymbols = [];
  /** @type {string[]} */
  const localBodySymbolChanges = [];

  for (const [id, nextRow] of nextSymbols.entries()) {
    const prevRow = prevSymbols.get(id);
    if (!prevRow) {
      if (isFunctionLocalVariable(nextRow)) {
        localBodySymbolChanges.push(id);
      } else {
        addedSymbols.push(id);
      }
      continue;
    }
    if (computeSymbolSignature(prevRow) !== computeSymbolSignature(nextRow)) {
      if (isFunctionLocalVariable(nextRow)) {
        localBodySymbolChanges.push(id);
      } else {
        signatureChangedSymbols.push(id);
      }
    } else if (
      prevRow.start_line !== nextRow.start_line ||
      prevRow.end_line !== nextRow.end_line ||
      prevRow.start_col !== nextRow.start_col ||
      prevRow.end_col !== nextRow.end_col
    ) {
      rangeShiftedSymbols.push(id);
    }
  }

  for (const [id, prevRow] of prevSymbols.entries()) {
    if (!nextSymbols.has(id)) {
      if (isFunctionLocalVariable(prevRow)) {
        localBodySymbolChanges.push(id);
      } else {
        removedSymbols.push(id);
      }
    }
  }

  // Compare relationships keyed by (type, from_id, to_id, status, reason) —
  // excluding call-site line numbers so pure line shifts do not look like new
  // semantic call targets.
  function semanticRelKey(row) {
    return [
      row.type ?? '',
      row.from_id ?? row.from ?? '',
      row.to_id ?? row.to ?? '',
      row.status ?? '',
      row.reason ?? row.reasonCode ?? '',
    ].join('|');
  }

  const prevRels = new Set((previous.relationshipRows ?? []).map(semanticRelKey));
  const nextRels = new Set((next.relationshipRows ?? []).map(semanticRelKey));
  /** @type {string[]} */
  const addedRelationships = [];
  /** @type {string[]} */
  const removedRelationships = [];

  for (const key of nextRels) {
    if (!prevRels.has(key)) {
      addedRelationships.push(key);
    }
  }
  for (const key of prevRels) {
    if (!nextRels.has(key)) {
      removedRelationships.push(key);
    }
  }

  // Compare file dependencies (imports / includes)
  function depKey(row) {
    return `${row.to_file ?? row.toFile}|${row.type ?? 'imports'}|${row.status ?? 'resolved'}`;
  }

  const prevDeps = new Map((previous.dependencyRows ?? []).map((d) => [depKey(d), d]));
  const nextDeps = new Map((next.dependencyRows ?? []).map((d) => [depKey(d), d]));
  /** @type {string[]} */
  const addedDependencyTargets = [];
  /** @type {string[]} */
  const removedDependencyTargets = [];

  for (const [key, row] of nextDeps.entries()) {
    if (!prevDeps.has(key)) {
      addedDependencyTargets.push(row.to_file ?? row.toFile);
    }
  }
  for (const [key, row] of prevDeps.entries()) {
    if (!nextDeps.has(key)) {
      removedDependencyTargets.push(row.to_file ?? row.toFile);
    }
  }

  const symbolsIdentical =
    addedSymbols.length === 0 &&
    removedSymbols.length === 0 &&
    signatureChangedSymbols.length === 0;
  const relationshipsIdentical =
    addedRelationships.length === 0 && removedRelationships.length === 0;
  const dependenciesIdentical =
    addedDependencyTargets.length === 0 && removedDependencyTargets.length === 0;

  return {
    addedSymbols: addedSymbols.sort(),
    removedSymbols: removedSymbols.sort(),
    signatureChangedSymbols: signatureChangedSymbols.sort(),
    rangeShiftedSymbols: rangeShiftedSymbols.sort(),
    localBodySymbolChanges: localBodySymbolChanges.sort(),
    addedRelationships: addedRelationships.sort(),
    removedRelationships: removedRelationships.sort(),
    addedDependencyTargets: [...new Set(addedDependencyTargets)].sort(),
    removedDependencyTargets: [...new Set(removedDependencyTargets)].sort(),
    symbolsIdentical,
    relationshipsIdentical,
    dependenciesIdentical,
    isSemanticNoOp:
      symbolsIdentical &&
      relationshipsIdentical &&
      dependenciesIdentical &&
      localBodySymbolChanges.length === 0,
  };
}
