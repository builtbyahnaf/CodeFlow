/**
 * CSR validation.
 *
 * Two modes:
 * - `strict` (tests, CI, development): fail fast, return every issue with a
 *   precise JSON path.
 * - `defensive` (production adapter boundary): drop invalid records one at a
 *   time, report a diagnostic per dropped record, and mark the run `partial`.
 *   Dropping is never silent.
 *
 * Validation is total: it returns typed issues and never throws. It runs once,
 * at the adapter boundary; core-to-core calls trust validated data.
 */

import { CSR_LIMITS, enforceLimits } from './limits.js';
import { isReasonCode } from './reasons.js';
import { rangeShapeIssues } from './provenance.js';
import {
  COMPLETENESS_LEVELS,
  CONTROL_CONSTRUCT_KINDS,
  CSR_VERSION,
  DATA_FACT_KINDS,
  DIAGNOSTIC_SEVERITIES,
  EVIDENCE_KINDS,
  isCompatibleCsrVersion,
  isNewerMinor,
  RELATIONSHIP_TYPES,
  RESOLUTION_STATUSES,
  SYMBOL_KINDS,
  VISIBILITIES,
} from './types.js';

/**
 * @typedef {Object} ValidationIssue
 * @property {string} path
 * @property {string} message
 * @property {string} [code]
 * @property {boolean} [dropped]
 */

/**
 * @typedef {Object} DroppedRecord
 * @property {'files'|'symbols'|'relationships'|'controlConstructs'|'dataFacts'|'diagnostics'} collection
 * @property {string} path
 * @property {string} [id]
 * @property {ValidationIssue[]} issues
 */

/**
 * @typedef {Object} ValidationOptions
 * @property {'strict'|'defensive'} [mode]
 * @property {string} [expectedAdapterId]
 */

/**
 * @param {unknown} run
 * @param {ValidationOptions} [options]
 * @returns {{ok: true, run: import('./entities.js').AnalysisRun, issues: ValidationIssue[], dropped: DroppedRecord[]} | {ok: false, issues: ValidationIssue[], dropped: DroppedRecord[]}}
 */
export function validateAnalysisRun(run, options = {}) {
  const mode = options.mode === 'defensive' ? 'defensive' : 'strict';
  const defensive = mode === 'defensive';
  /** @type {ValidationIssue[]} */
  const issues = [];
  /** @type {DroppedRecord[]} */
  const dropped = [];

  if (!isPlainObject(run)) {
    return {
      ok: false,
      issues: [{ path: '$', message: 'Analysis run must be an object.', code: 'E_VALIDATION' }],
      dropped,
    };
  }
  const candidate = /** @type {Record<string, unknown>} */ (run);

  // --- top-level, fatal checks -------------------------------------------------
  for (const field of ['runId', 'adapterId', 'adapterVersion', 'language']) {
    if (typeof candidate[field] !== 'string' || candidate[field].length === 0) {
      issues.push({
        path: field,
        message: `${field} must be a non-empty string.`,
        code: 'E_VALIDATION',
      });
    }
  }
  if (options.expectedAdapterId && candidate.adapterId !== options.expectedAdapterId) {
    issues.push({
      path: 'adapterId',
      message: `adapterId must be "${options.expectedAdapterId}", received "${String(
        candidate.adapterId,
      )}".`,
      code: 'E_VALIDATION',
    });
  }
  if (!isCompatibleCsrVersion(candidate.csrVersion)) {
    issues.push({
      path: 'csrVersion',
      message: `Unsupported csrVersion "${String(
        candidate.csrVersion,
      )}"; this build supports major ${CSR_VERSION.split('.')[0]}.`,
      code: 'E_VALIDATION',
    });
  }
  if (!COMPLETENESS_LEVELS.includes(String(candidate.completeness))) {
    issues.push({
      path: 'completeness',
      message: `completeness must be one of ${COMPLETENESS_LEVELS.join(', ')}.`,
      code: 'E_VALIDATION',
    });
  }
  validateScope(candidate.scope, issues);

  for (const collection of [
    'files',
    'symbols',
    'relationships',
    'controlConstructs',
    'dataFacts',
    'diagnostics',
  ]) {
    if (candidate[collection] !== undefined && !Array.isArray(candidate[collection])) {
      issues.push({
        path: collection,
        message: `${collection} must be an array.`,
        code: 'E_VALIDATION',
      });
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues, dropped };
  }

  const limits = enforceLimits(candidate);
  if (!limits.ok) {
    return {
      ok: false,
      issues: limits.issues.map((issue) => ({ ...issue, code: 'E_LIMIT' })),
      dropped,
    };
  }

  const completeness = /** @type {import('./entities.js').AnalysisRun['completeness']} */ (
    candidate.completeness
  );

  // --- files -------------------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const files = [];
  /** @type {Map<string, Record<string, unknown>>} */
  const fileById = new Map();
  for (const [index, entry] of arrayOf(candidate.files).entries()) {
    const path = `files[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateFile(entry, path, local);
    const id = isPlainObject(entry) ? /** @type {Record<string, unknown>} */ (entry).fileId : '';
    if (typeof id === 'string' && fileById.has(id)) {
      local.push({ path: `${path}.fileId`, message: `Duplicate fileId "${id}".` });
    }
    if (local.length === 0) {
      const record = /** @type {Record<string, unknown>} */ (entry);
      files.push(record);
      fileById.set(String(record.fileId), record);
    } else {
      collect(mode, issues, dropped, 'files', path, id, local);
    }
  }

  // --- symbols -----------------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const symbols = [];
  /** @type {Map<string, Record<string, unknown>>} */
  const symbolById = new Map();
  /** @type {Map<string, string>} */
  const identityOwner = new Map();
  for (const [index, entry] of arrayOf(candidate.symbols).entries()) {
    const path = `symbols[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateSymbol(entry, path, fileById, local);
    const record = isPlainObject(entry) ? /** @type {Record<string, unknown>} */ (entry) : {};
    const id = typeof record.symbolId === 'string' ? record.symbolId : '';
    if (id && symbolById.has(id)) {
      local.push({ path: `${path}.symbolId`, message: `Duplicate symbolId "${id}".` });
    }
    const identityKey = symbolIdentityKey(record);
    if (identityKey && identityOwner.has(identityKey)) {
      local.push({
        path: `${path}.qualifiedName`,
        message: `Duplicate symbol identity (file, kind, qualifiedName, disambiguator) shared with "${identityOwner.get(
          identityKey,
        )}".`,
      });
    }
    if (local.length === 0) {
      symbols.push(record);
      symbolById.set(String(record.symbolId), record);
      if (identityKey) {
        identityOwner.set(identityKey, String(record.symbolId));
      }
    } else {
      collect(mode, issues, dropped, 'symbols', path, id, local);
    }
  }

  // Parent references and cycles are checked after all symbols are known.
  const parentIssues = validateParents(symbols, symbolById);
  if (parentIssues.length > 0) {
    if (defensive) {
      const doomed = new Set(parentIssues.map((entry) => entry.id));
      // Dropping a parent orphans its descendants; drop them too rather than
      // leaving records that point at symbols that no longer exist.
      let changed = true;
      while (changed) {
        changed = false;
        for (const symbol of symbols) {
          if (
            !doomed.has(String(symbol.symbolId)) &&
            typeof symbol.parentId === 'string' &&
            doomed.has(symbol.parentId)
          ) {
            doomed.add(String(symbol.symbolId));
            changed = true;
          }
        }
      }
      const indexById = new Map(symbols.map((symbol, index) => [String(symbol.symbolId), index]));
      for (const entry of parentIssues) {
        dropped.push({
          collection: 'symbols',
          path: `symbols[${indexById.get(entry.id) ?? 0}]`,
          id: entry.id,
          issues: [entry.issue],
        });
        issues.push({ ...entry.issue, dropped: true });
      }
      for (let index = symbols.length - 1; index >= 0; index -= 1) {
        if (doomed.has(String(symbols[index].symbolId))) {
          symbolById.delete(String(symbols[index].symbolId));
          symbols.splice(index, 1);
        }
      }
    } else {
      for (const entry of parentIssues) {
        issues.push(entry.issue);
      }
    }
  }

  // --- relationships -----------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const relationships = [];
  /** @type {Set<string>} */
  const relationshipIds = new Set();
  for (const [index, entry] of arrayOf(candidate.relationships).entries()) {
    const path = `relationships[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateRelationship(entry, path, fileById, symbolById, local);
    const record = isPlainObject(entry) ? /** @type {Record<string, unknown>} */ (entry) : {};
    const id = typeof record.relationshipId === 'string' ? record.relationshipId : '';
    if (id && relationshipIds.has(id)) {
      local.push({ path: `${path}.relationshipId`, message: `Duplicate relationshipId "${id}".` });
    }
    if (local.length === 0) {
      relationships.push(record);
      relationshipIds.add(String(record.relationshipId));
    } else {
      collect(mode, issues, dropped, 'relationships', path, id, local);
    }
  }

  // --- control constructs ------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const constructs = [];
  /** @type {Map<string, Record<string, unknown>>} */
  const constructById = new Map();
  for (const [index, entry] of arrayOf(candidate.controlConstructs).entries()) {
    const path = `controlConstructs[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateConstruct(entry, path, fileById, symbolById, local);
    const record = isPlainObject(entry) ? /** @type {Record<string, unknown>} */ (entry) : {};
    const id = typeof record.constructId === 'string' ? record.constructId : '';
    if (id && constructById.has(id)) {
      local.push({ path: `${path}.constructId`, message: `Duplicate constructId "${id}".` });
    }
    if (local.length === 0) {
      constructs.push(record);
      constructById.set(String(record.constructId), record);
    } else {
      collect(mode, issues, dropped, 'controlConstructs', path, id, local);
    }
  }

  const constructLinks = validateConstructLinks(constructs, constructById);
  let survivingConstructs = constructs;
  if (constructLinks.length > 0) {
    if (defensive) {
      const doomed = new Set(constructLinks.map((entry) => entry.id));
      let changed = true;
      while (changed) {
        changed = false;
        for (const construct of constructs) {
          const id = String(construct.constructId);
          if (doomed.has(id)) {
            continue;
          }
          const parentId = typeof construct.parentId === 'string' ? construct.parentId : '';
          const children = Array.isArray(construct.children) ? construct.children.map(String) : [];
          if (doomed.has(parentId) || children.some((child) => doomed.has(child))) {
            doomed.add(id);
            changed = true;
          }
        }
      }
      for (const entry of constructLinks) {
        dropped.push({
          collection: 'controlConstructs',
          path: 'controlConstructs',
          id: entry.id,
          issues: [entry.issue],
        });
        issues.push({ ...entry.issue, dropped: true });
      }
      survivingConstructs = constructs.filter(
        (construct) => !doomed.has(String(construct.constructId)),
      );
    } else {
      for (const entry of constructLinks) {
        issues.push(entry.issue);
      }
    }
  }

  // --- data facts --------------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const dataFacts = [];
  /** @type {Set<string>} */
  const factIds = new Set();
  for (const [index, entry] of arrayOf(candidate.dataFacts).entries()) {
    const path = `dataFacts[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateDataFact(entry, path, fileById, symbolById, local);
    const record = isPlainObject(entry) ? /** @type {Record<string, unknown>} */ (entry) : {};
    const id = typeof record.factId === 'string' ? record.factId : '';
    if (id && factIds.has(id)) {
      local.push({ path: `${path}.factId`, message: `Duplicate factId "${id}".` });
    }
    if (local.length === 0) {
      dataFacts.push(record);
      factIds.add(String(record.factId));
    } else {
      collect(mode, issues, dropped, 'dataFacts', path, id, local);
    }
  }

  // --- diagnostics -------------------------------------------------------------
  /** @type {Record<string, unknown>[]} */
  const diagnostics = [];
  const knownIds = new Set([
    ...fileById.keys(),
    ...symbolById.keys(),
    ...relationshipIds,
    ...constructById.keys(),
    ...factIds,
  ]);
  for (const [index, entry] of arrayOf(candidate.diagnostics).entries()) {
    const path = `diagnostics[${index}]`;
    /** @type {ValidationIssue[]} */
    const local = [];
    validateDiagnostic(entry, path, fileById, knownIds, local);
    if (local.length === 0) {
      diagnostics.push(/** @type {Record<string, unknown>} */ (entry));
    } else {
      collect(mode, issues, dropped, 'diagnostics', path, '', local);
    }
  }

  if (issues.length > 0 && !defensive) {
    return { ok: false, issues, dropped };
  }

  /** @type {import('./entities.js').AnalysisRun['completeness']} */
  let finalCompleteness = completeness;
  if (dropped.length > 0 && finalCompleteness === 'full') {
    finalCompleteness = 'partial';
  }
  for (const entry of dropped) {
    diagnostics.push({
      severity: 'warning',
      code: 'csr_record_dropped',
      message: `Dropped ${entry.path}${entry.id ? ` (${entry.id})` : ''}: ${
        entry.issues[0]?.message ?? 'invalid record'
      }`,
      affects: entry.id ? [entry.id] : [],
    });
  }

  const normalized = normalizeRun({
    candidate,
    completeness: finalCompleteness,
    files,
    symbols,
    relationships,
    controlConstructs: survivingConstructs,
    dataFacts,
    diagnostics,
  });

  if (isNewerMinor(candidate.csrVersion)) {
    normalized.diagnostics.push({
      severity: 'info',
      code: 'csr_newer_minor',
      message: `The adapter emitted CSR ${String(
        candidate.csrVersion,
      )}; this build reads it as ${CSR_VERSION} and ignores newer fields.`,
      affects: [],
    });
  }

  return { ok: true, run: normalized, issues, dropped };
}

/**
 * @param {'strict'|'defensive'} mode
 * @param {ValidationIssue[]} issues
 * @param {DroppedRecord[]} dropped
 * @param {DroppedRecord['collection']} collection
 * @param {string} path
 * @param {unknown} id
 * @param {ValidationIssue[]} local
 */
function collect(mode, issues, dropped, collection, path, id, local) {
  if (mode === 'strict') {
    issues.push(...local);
    return;
  }
  dropped.push({
    collection,
    path,
    id: typeof id === 'string' && id.length > 0 ? id : undefined,
    issues: local,
  });
  issues.push(...local.map((issue) => ({ ...issue, dropped: true })));
}

/**
 * @param {unknown} value
 * @returns {unknown[]}
 */
function arrayOf(value) {
  return Array.isArray(value) ? value : [];
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} scope
 * @param {ValidationIssue[]} issues
 */
function validateScope(scope, issues) {
  if (scope === undefined) {
    return;
  }
  if (!isPlainObject(scope)) {
    issues.push({ path: 'scope', message: 'scope must be an object.' });
    return;
  }
  if (scope.kind !== 'file' && scope.kind !== 'workspace') {
    issues.push({ path: 'scope.kind', message: 'scope.kind must be "file" or "workspace".' });
  }
  if (scope.path !== undefined && typeof scope.path !== 'string') {
    issues.push({ path: 'scope.path', message: 'scope.path must be a string when present.' });
  }
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {ValidationIssue[]} issues
 */
function validateFile(entry, path, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'File record must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  requireString(record.fileId, `${path}.fileId`, 'fileId', issues);
  if (typeof record.fileId === 'string' && !record.fileId.startsWith('file:')) {
    issues.push({ path: `${path}.fileId`, message: 'fileId must start with "file:".' });
  }
  const pathIssues = workspacePathIssues(record.path);
  for (const message of pathIssues) {
    issues.push({ path: `${path}.path`, message });
  }
  requireString(record.language, `${path}.language`, 'language', issues);
  requireString(record.contentHash, `${path}.contentHash`, 'contentHash', issues);
  if (!Number.isInteger(record.sizeBytes) || Number(record.sizeBytes) < 0) {
    issues.push({ path: `${path}.sizeBytes`, message: 'sizeBytes must be a non-negative integer.' });
  }
  if (!Number.isInteger(record.lineCount) || Number(record.lineCount) < 1) {
    issues.push({ path: `${path}.lineCount`, message: 'lineCount must be a positive integer.' });
  }
  if (record.generated !== undefined && typeof record.generated !== 'boolean') {
    issues.push({ path: `${path}.generated`, message: 'generated must be a boolean when present.' });
  }
  if (record.extensions !== undefined && !isPlainObject(record.extensions)) {
    issues.push({ path: `${path}.extensions`, message: 'extensions must be an object when present.' });
  }
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @param {ValidationIssue[]} issues
 */
function validateSymbol(entry, path, fileById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'Symbol must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  requireString(record.symbolId, `${path}.symbolId`, 'symbolId', issues);
  if (typeof record.symbolId === 'string' && !record.symbolId.startsWith('symbol:')) {
    issues.push({ path: `${path}.symbolId`, message: 'symbolId must start with "symbol:".' });
  }
  if (!SYMBOL_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path}.kind`,
      message: `Unknown symbol kind "${String(record.kind)}"; expected one of ${SYMBOL_KINDS.join(
        ', ',
      )}.`,
    });
  }
  if (typeof record.name !== 'string') {
    issues.push({ path: `${path}.name`, message: 'name must be a string.' });
  }
  requireString(record.qualifiedName, `${path}.qualifiedName`, 'qualifiedName', issues);
  requireString(record.language, `${path}.language`, 'language', issues);

  if (record.declaration === undefined) {
    issues.push({ path: `${path}.declaration`, message: 'declaration range is required.' });
  } else {
    validateRange(record.declaration, `${path}.declaration`, fileById, issues);
  }
  if (record.signature !== undefined && typeof record.signature !== 'string') {
    issues.push({ path: `${path}.signature`, message: 'signature must be a string when present.' });
  }
  if (record.parentId !== undefined && typeof record.parentId !== 'string') {
    issues.push({ path: `${path}.parentId`, message: 'parentId must be a string when present.' });
  }
  if (record.visibility !== undefined && !VISIBILITIES.includes(String(record.visibility))) {
    issues.push({
      path: `${path}.visibility`,
      message: `visibility must be one of ${VISIBILITIES.join(', ')}.`,
    });
  }
  if (record.disambiguator !== undefined) {
    if (
      typeof record.disambiguator !== 'string' ||
      !/^[A-Za-z0-9_.+~-]+$/.test(record.disambiguator)
    ) {
      issues.push({
        path: `${path}.disambiguator`,
        message:
          'disambiguator must be a stable token of A-Z, a-z, 0-9, "_", ".", "+", "~" or "-".',
      });
    }
  }
  if (record.extensions !== undefined && !isPlainObject(record.extensions)) {
    issues.push({ path: `${path}.extensions`, message: 'extensions must be an object when present.' });
  }
}

/**
 * @param {Record<string, unknown>} record
 * @returns {string}
 */
function symbolIdentityKey(record) {
  if (typeof record.kind !== 'string' || typeof record.qualifiedName !== 'string') {
    return '';
  }
  const declaration = isPlainObject(record.declaration) ? record.declaration : {};
  const fileId = typeof declaration.fileId === 'string' ? declaration.fileId : '';
  if (!fileId) {
    return '';
  }
  return [
    fileId,
    record.kind,
    record.qualifiedName,
    typeof record.disambiguator === 'string' ? record.disambiguator : '',
  ].join('|');
}

/**
 * @param {Record<string, unknown>[]} symbols
 * @param {Map<string, Record<string, unknown>>} symbolById
 * @returns {Array<{id: string, issue: ValidationIssue}>}
 */
function validateParents(symbols, symbolById) {
  /** @type {Array<{id: string, issue: ValidationIssue}>} */
  const problems = [];
  for (const [index, symbol] of symbols.entries()) {
    const parentId = symbol.parentId;
    if (typeof parentId === 'string' && parentId.length > 0 && !symbolById.has(parentId)) {
      problems.push({
        id: String(symbol.symbolId),
        issue: {
          path: `symbols[${index}].parentId`,
          message: `parentId "${parentId}" is not a declared symbol.`,
        },
      });
    }
  }

  const state = new Map();
  /**
   * @param {string} id
   * @param {string[]} trail
   * @returns {string | null}
   */
  function visit(id, trail) {
    if (state.get(id) === 'done') {
      return null;
    }
    if (state.get(id) === 'visiting') {
      return id;
    }
    state.set(id, 'visiting');
    const symbol = symbolById.get(id);
    const parentId = symbol && typeof symbol.parentId === 'string' ? symbol.parentId : '';
    if (parentId && symbolById.has(parentId)) {
      const cycle = visit(parentId, [...trail, id]);
      if (cycle) {
        return cycle;
      }
    }
    state.set(id, 'done');
    return null;
  }

  for (const symbol of symbols) {
    const id = String(symbol.symbolId);
    const cycle = visit(id, []);
    if (cycle) {
      const index = symbols.indexOf(symbol);
      problems.push({
        id,
        issue: {
          path: `symbols[${index}].parentId`,
          message: `Cyclic parentId chain detected at "${cycle}".`,
        },
      });
      break;
    }
  }
  return problems;
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @param {Map<string, Record<string, unknown>>} symbolById
 * @param {ValidationIssue[]} issues
 */
function validateRelationship(entry, path, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'Relationship must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  requireString(record.relationshipId, `${path}.relationshipId`, 'relationshipId', issues);
  if (!RELATIONSHIP_TYPES.includes(String(record.type))) {
    issues.push({
      path: `${path}.type`,
      message: `Unknown relationship type "${String(
        record.type,
      )}"; expected one of ${RELATIONSHIP_TYPES.join(', ')}.`,
    });
  }
  const status = String(record.status);
  if (!RESOLUTION_STATUSES.includes(status)) {
    issues.push({
      path: `${path}.status`,
      message: `status must be one of ${RESOLUTION_STATUSES.join(', ')}.`,
    });
  } else if (status !== 'resolved') {
    if (typeof record.reasonCode !== 'string' || record.reasonCode.length === 0) {
      issues.push({
        path: `${path}.reasonCode`,
        message: `A "${status}" relationship must carry a reasonCode.`,
      });
    } else if (!isReasonCode(record.reasonCode)) {
      issues.push({
        path: `${path}.reasonCode`,
        message: `Unknown reasonCode "${record.reasonCode}".`,
      });
    }
  } else if (record.reasonCode !== undefined && !isReasonCode(record.reasonCode)) {
    issues.push({
      path: `${path}.reasonCode`,
      message: `Unknown reasonCode "${String(record.reasonCode)}".`,
    });
  }

  const from = record.from;
  if (typeof from !== 'string' || from.length === 0) {
    issues.push({ path: `${path}.from`, message: 'from must be a symbolId.' });
  } else if (!symbolById.has(from)) {
    issues.push({ path: `${path}.from`, message: `Unknown source symbol "${from}".` });
  }
  const to = record.to;
  if (typeof to !== 'string' || to.length === 0) {
    issues.push({ path: `${path}.to`, message: 'to must be a symbolId or external target id.' });
  } else if (status === 'resolved' && !symbolById.has(to)) {
    issues.push({
      path: `${path}.to`,
      message: `A resolved relationship must target a declared symbol; "${to}" is unknown.`,
    });
  }

  if (record.site !== undefined) {
    validateRange(record.site, `${path}.site`, fileById, issues);
  }
  if (record.evidence !== undefined) {
    if (!Array.isArray(record.evidence)) {
      issues.push({ path: `${path}.evidence`, message: 'evidence must be an array when present.' });
    } else {
      record.evidence.forEach((evidence, index) => {
        const evidencePath = `${path}.evidence[${index}]`;
        if (!isPlainObject(evidence)) {
          issues.push({ path: evidencePath, message: 'Evidence must be an object.' });
          return;
        }
        if (!EVIDENCE_KINDS.includes(String(evidence.kind))) {
          issues.push({
            path: `${evidencePath}.kind`,
            message: `Unknown evidence kind "${String(evidence.kind)}".`,
          });
        }
        if (evidence.range !== undefined) {
          validateRange(evidence.range, `${evidencePath}.range`, fileById, issues);
        }
        for (const field of ['symbolId', 'relationshipId', 'diagnosticCode', 'note']) {
          if (evidence[field] !== undefined && typeof evidence[field] !== 'string') {
            issues.push({
              path: `${evidencePath}.${field}`,
              message: `${field} must be a string when present.`,
            });
          }
        }
      });
    }
  }
  if (record.extensions !== undefined && !isPlainObject(record.extensions)) {
    issues.push({ path: `${path}.extensions`, message: 'extensions must be an object when present.' });
  }
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @param {Map<string, Record<string, unknown>>} symbolById
 * @param {ValidationIssue[]} issues
 */
function validateConstruct(entry, path, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'Control construct must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  requireString(record.constructId, `${path}.constructId`, 'constructId', issues);
  if (!CONTROL_CONSTRUCT_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path}.kind`,
      message: `Unknown control construct kind "${String(record.kind)}".`,
    });
  }
  if (record.parentId !== undefined && typeof record.parentId !== 'string') {
    issues.push({ path: `${path}.parentId`, message: 'parentId must be a string when present.' });
  }
  if (!Array.isArray(record.children)) {
    issues.push({ path: `${path}.children`, message: 'children must be an array.' });
  } else {
    record.children.forEach((child, index) => {
      if (typeof child !== 'string') {
        issues.push({
          path: `${path}.children[${index}]`,
          message: 'child construct ids must be strings.',
        });
      }
    });
  }
  if (record.symbolId !== undefined) {
    if (typeof record.symbolId !== 'string' || !symbolById.has(record.symbolId)) {
      issues.push({
        path: `${path}.symbolId`,
        message: `symbolId "${String(record.symbolId)}" is not a declared symbol.`,
      });
    }
  }
  if (record.condition !== undefined) {
    validateRange(record.condition, `${path}.condition`, fileById, issues);
  }
  validateRange(record.sourceRange, `${path}.sourceRange`, fileById, issues);
}

/**
 * @param {Record<string, unknown>[]} constructs
 * @param {Map<string, Record<string, unknown>>} constructById
 * @returns {Array<{id: string, issue: ValidationIssue}>}
 */
function validateConstructLinks(constructs, constructById) {
  /** @type {Array<{id: string, issue: ValidationIssue}>} */
  const problems = [];
  for (const [index, construct] of constructs.entries()) {
    const id = String(construct.constructId);
    if (typeof construct.parentId === 'string' && !constructById.has(construct.parentId)) {
      problems.push({
        id,
        issue: {
          path: `controlConstructs[${index}].parentId`,
          message: `parentId "${construct.parentId}" is not a declared construct.`,
        },
      });
    }
    if (Array.isArray(construct.children)) {
      for (const child of construct.children) {
        if (!constructById.has(child)) {
          problems.push({
            id,
            issue: {
              path: `controlConstructs[${index}].children`,
              message: `child "${String(child)}" is not a declared construct.`,
            },
          });
        }
      }
    }
  }

  const state = new Map();
  /**
   * @param {string} id
   * @returns {boolean}
   */
  function hasCycle(id) {
    if (state.get(id) === 'done') {
      return false;
    }
    if (state.get(id) === 'visiting') {
      return true;
    }
    state.set(id, 'visiting');
    const construct = constructById.get(id);
    const children = construct && Array.isArray(construct.children) ? construct.children : [];
    for (const child of children) {
      if (constructById.has(child) && hasCycle(child)) {
        return true;
      }
    }
    state.set(id, 'done');
    return false;
  }

  for (const construct of constructs) {
    const id = String(construct.constructId);
    if (hasCycle(id)) {
      problems.push({
        id,
        issue: {
          path: 'controlConstructs',
          message: `Cyclic children chain detected at "${id}".`,
        },
      });
      break;
    }
  }
  return problems;
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @param {Map<string, Record<string, unknown>>} symbolById
 * @param {ValidationIssue[]} issues
 */
function validateDataFact(entry, path, fileById, symbolById, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'Data fact must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  requireString(record.factId, `${path}.factId`, 'factId', issues);
  if (!DATA_FACT_KINDS.includes(String(record.kind))) {
    issues.push({
      path: `${path}.kind`,
      message: `Unknown data fact kind "${String(record.kind)}".`,
    });
  }
  if (typeof record.symbolId !== 'string' || !symbolById.has(record.symbolId)) {
    issues.push({
      path: `${path}.symbolId`,
      message: `symbolId "${String(record.symbolId)}" is not a declared symbol.`,
    });
  }
  validateRange(record.at, `${path}.at`, fileById, issues);
  if (record.relatedSymbolId !== undefined) {
    if (typeof record.relatedSymbolId !== 'string' || !symbolById.has(record.relatedSymbolId)) {
      issues.push({
        path: `${path}.relatedSymbolId`,
        message: `relatedSymbolId "${String(record.relatedSymbolId)}" is not a declared symbol.`,
      });
    }
  }
  const status = String(record.status);
  if (!RESOLUTION_STATUSES.includes(status)) {
    issues.push({
      path: `${path}.status`,
      message: `status must be one of ${RESOLUTION_STATUSES.join(', ')}.`,
    });
  } else if (status !== 'resolved') {
    if (typeof record.reasonCode !== 'string' || !isReasonCode(record.reasonCode)) {
      issues.push({
        path: `${path}.reasonCode`,
        message: `A "${status}" data fact must carry a known reasonCode.`,
      });
    }
  }
}

/**
 * @param {unknown} entry
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @param {Set<string>} knownIds
 * @param {ValidationIssue[]} issues
 */
function validateDiagnostic(entry, path, fileById, knownIds, issues) {
  if (!isPlainObject(entry)) {
    issues.push({ path, message: 'Diagnostic must be an object.' });
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (entry);
  if (!DIAGNOSTIC_SEVERITIES.includes(String(record.severity))) {
    issues.push({
      path: `${path}.severity`,
      message: `severity must be one of ${DIAGNOSTIC_SEVERITIES.join(', ')}.`,
    });
  }
  requireString(record.code, `${path}.code`, 'code', issues);
  requireString(record.message, `${path}.message`, 'message', issues);
  if (record.sourceRange !== undefined) {
    validateRange(record.sourceRange, `${path}.sourceRange`, fileById, issues);
  }
  if (record.affects !== undefined) {
    if (!Array.isArray(record.affects)) {
      issues.push({ path: `${path}.affects`, message: 'affects must be an array.' });
    } else {
      record.affects.forEach((id, index) => {
        if (typeof id !== 'string') {
          issues.push({
            path: `${path}.affects[${index}]`,
            message: 'affects entries must be strings.',
          });
        } else if (
          (id.startsWith('symbol:') || id.startsWith('rel:') || id.startsWith('file:')) &&
          !knownIds.has(id)
        ) {
          issues.push({
            path: `${path}.affects[${index}]`,
            message: `affects references unknown id "${id}".`,
          });
        }
      });
    }
  }
}

/**
 * @param {unknown} range
 * @param {string} path
 * @param {Map<string, Record<string, unknown>> | null} fileById
 * @param {ValidationIssue[]} issues
 */
function validateRange(range, path, fileById, issues) {
  const shapeIssues = rangeShapeIssues(range);
  const fields = ['fileId', 'startLine', 'startColumn', 'endLine', 'endColumn'];
  for (const message of shapeIssues) {
    const field = fields.find((candidate) => message.startsWith(candidate));
    issues.push({ path: field ? `${path}.${field}` : path, message });
  }
  if (shapeIssues.length > 0 || !isPlainObject(range)) {
    return;
  }
  const record = /** @type {Record<string, unknown>} */ (range);
  if (fileById) {
    if (!fileById.has(record.fileId)) {
      issues.push({ path: `${path}.fileId`, message: `Unknown fileId "${String(record.fileId)}".` });
    } else {
      const file = /** @type {Record<string, unknown>} */ (fileById.get(record.fileId));
      if (Number.isInteger(record.endLine) && Number(record.endLine) >= Number(file.lineCount)) {
        issues.push({
          path: `${path}.endLine`,
          message: `endLine ${String(record.endLine)} exceeds lineCount ${String(file.lineCount)}.`,
        });
      }
      if (Number.isInteger(record.startLine) && Number(record.startLine) >= Number(file.lineCount)) {
        issues.push({
          path: `${path}.startLine`,
          message: `startLine ${String(
            record.startLine,
          )} exceeds lineCount ${String(file.lineCount)}.`,
        });
      }
    }
  }
  for (const field of ['startOffset', 'endOffset']) {
    if (record[field] !== undefined) {
      if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
        issues.push({ path: `${path}.${field}`, message: `${field} must be a non-negative integer.` });
      }
    }
  }
}

/**
 * @param {unknown} value
 * @param {string} path
 * @param {string} label
 * @param {ValidationIssue[]} issues
 */
function requireString(value, path, label, issues) {
  if (typeof value !== 'string' || value.length === 0) {
    issues.push({ path, message: `${label} must be a non-empty string.` });
  }
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function workspacePathIssues(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return ['path must be a non-empty string.'];
  }
  /** @type {string[]} */
  const issues = [];
  if (value.length > CSR_LIMITS.maxPathLength) {
    issues.push(`path exceeds ${CSR_LIMITS.maxPathLength} code units.`);
  }
  if (value.includes('\\')) {
    issues.push('path must use forward slashes.');
  }
  if (value.startsWith('/') || /^[A-Za-z]:/.test(value)) {
    issues.push('path must be workspace-relative, not absolute.');
  }
  const segments = value.split('/');
  if (segments.includes('..')) {
    issues.push('path must not contain ".." segments.');
  }
  if (segments.includes('')) {
    issues.push('path must not contain empty segments.');
  }
  if (/[\u0000-\u001f]/.test(value)) {
    issues.push('path must not contain control characters.');
  }
  return issues;
}

/**
 * @param {{candidate: Record<string, unknown>, completeness: import('./entities.js').AnalysisRun['completeness'], files: Record<string, unknown>[], symbols: Record<string, unknown>[], relationships: Record<string, unknown>[], controlConstructs: Record<string, unknown>[], dataFacts: Record<string, unknown>[], diagnostics: Record<string, unknown>[]}} input
 * @returns {import('./entities.js').AnalysisRun}
 */
function normalizeRun(input) {
  const candidate = input.candidate;
  /** @type {import('./entities.js').AnalysisRun} */
  const run = {
    runId: String(candidate.runId),
    adapterId: String(candidate.adapterId),
    adapterVersion: String(candidate.adapterVersion),
    language: String(candidate.language),
    csrVersion: String(candidate.csrVersion ?? CSR_VERSION),
    scope: normalizeScope(candidate.scope),
    completeness: input.completeness,
    files: input.files.map(normalizeFile),
    symbols: input.symbols.map(normalizeSymbol),
    relationships: input.relationships.map(normalizeRelationship),
    controlConstructs: input.controlConstructs.map(normalizeConstruct),
    dataFacts: input.dataFacts.map(normalizeDataFact),
    diagnostics: input.diagnostics.map(normalizeDiagnostic),
  };
  if (typeof candidate.startedAt === 'string') {
    run.startedAt = candidate.startedAt;
  }
  if (Number.isFinite(candidate.durationMs)) {
    run.durationMs = Number(candidate.durationMs);
  }
  if (isPlainObject(candidate.extensions)) {
    run.extensions = cloneValue(candidate.extensions);
  }
  return run;
}

/**
 * @param {unknown} scope
 * @returns {import('./entities.js').AnalysisScope}
 */
function normalizeScope(scope) {
  if (!isPlainObject(scope)) {
    return { kind: 'workspace' };
  }
  /** @type {import('./entities.js').AnalysisScope} */
  const normalized = { kind: scope.kind === 'file' ? 'file' : 'workspace' };
  if (typeof scope.path === 'string' && scope.path.length > 0) {
    normalized.path = scope.path;
  }
  return normalized;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').FileRecord}
 */
function normalizeFile(record) {
  /** @type {import('./entities.js').FileRecord} */
  const file = {
    fileId: String(record.fileId),
    path: String(record.path),
    language: String(record.language),
    contentHash: String(record.contentHash),
    sizeBytes: Number(record.sizeBytes),
    lineCount: Number(record.lineCount),
    generated: record.generated === true,
  };
  if (isPlainObject(record.extensions)) {
    file.extensions = cloneValue(record.extensions);
  }
  return file;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').SymbolRecord}
 */
function normalizeSymbol(record) {
  /** @type {import('./entities.js').SymbolRecord} */
  const symbol = {
    symbolId: String(record.symbolId),
    kind: String(record.kind),
    name: typeof record.name === 'string' ? record.name : '',
    qualifiedName: String(record.qualifiedName),
    language: String(record.language),
    declaration: normalizeRange(record.declaration),
  };
  if (typeof record.signature === 'string') {
    symbol.signature = record.signature;
  }
  if (typeof record.parentId === 'string' && record.parentId.length > 0) {
    symbol.parentId = record.parentId;
  }
  if (typeof record.visibility === 'string') {
    symbol.visibility = /** @type {import('./entities.js').SymbolRecord['visibility']} */ (
      record.visibility
    );
  }
  if (typeof record.disambiguator === 'string') {
    symbol.disambiguator = record.disambiguator;
  }
  if (isPlainObject(record.extensions)) {
    symbol.extensions = cloneValue(record.extensions);
  }
  return symbol;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').Relationship}
 */
function normalizeRelationship(record) {
  /** @type {import('./entities.js').Relationship} */
  const relationship = {
    relationshipId: String(record.relationshipId),
    type: String(record.type),
    from: String(record.from),
    to: String(record.to),
    status: /** @type {import('./entities.js').Relationship['status']} */ (record.status),
    evidence: Array.isArray(record.evidence)
      ? record.evidence.map((evidence) =>
          normalizeEvidence(/** @type {Record<string, unknown>} */ (evidence)),
        )
      : [],
  };
  if (typeof record.reasonCode === 'string') {
    relationship.reasonCode = record.reasonCode;
  }
  if (isPlainObject(record.site)) {
    relationship.site = normalizeRange(record.site);
  }
  if (isPlainObject(record.extensions)) {
    relationship.extensions = cloneValue(record.extensions);
  }
  return relationship;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').Evidence}
 */
function normalizeEvidence(record) {
  /** @type {import('./entities.js').Evidence} */
  const evidence = {
    kind: /** @type {import('./entities.js').Evidence['kind']} */ (record.kind ?? 'source_range'),
  };
  if (isPlainObject(record.range)) {
    evidence.range = normalizeRange(record.range);
  }
  for (const field of ['symbolId', 'relationshipId', 'diagnosticCode', 'note']) {
    if (typeof record[field] === 'string') {
      evidence[field] = record[field];
    }
  }
  return evidence;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').ControlConstruct}
 */
function normalizeConstruct(record) {
  /** @type {import('./entities.js').ControlConstruct} */
  const construct = {
    constructId: String(record.constructId),
    kind: String(record.kind),
    children: Array.isArray(record.children) ? record.children.map(String) : [],
    sourceRange: normalizeRange(record.sourceRange),
  };
  if (typeof record.parentId === 'string' && record.parentId.length > 0) {
    construct.parentId = record.parentId;
  }
  if (typeof record.symbolId === 'string' && record.symbolId.length > 0) {
    construct.symbolId = record.symbolId;
  }
  if (isPlainObject(record.condition)) {
    construct.condition = normalizeRange(record.condition);
  }
  if (isPlainObject(record.extensions)) {
    construct.extensions = cloneValue(record.extensions);
  }
  return construct;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').DataFact}
 */
function normalizeDataFact(record) {
  /** @type {import('./entities.js').DataFact} */
  const fact = {
    factId: String(record.factId),
    kind: String(record.kind),
    symbolId: String(record.symbolId),
    at: normalizeRange(record.at),
    status: /** @type {import('./entities.js').DataFact['status']} */ (record.status),
  };
  if (typeof record.relatedSymbolId === 'string') {
    fact.relatedSymbolId = record.relatedSymbolId;
  }
  if (typeof record.reasonCode === 'string') {
    fact.reasonCode = record.reasonCode;
  }
  if (isPlainObject(record.extensions)) {
    fact.extensions = cloneValue(record.extensions);
  }
  return fact;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').Diagnostic}
 */
function normalizeDiagnostic(record) {
  /** @type {import('./entities.js').Diagnostic} */
  const diagnostic = {
    severity: /** @type {import('./entities.js').Diagnostic['severity']} */ (record.severity),
    code: String(record.code),
    message: String(record.message),
    affects: Array.isArray(record.affects) ? record.affects.map(String) : [],
  };
  if (isPlainObject(record.sourceRange)) {
    diagnostic.sourceRange = normalizeRange(record.sourceRange);
  }
  return diagnostic;
}

/**
 * @param {Record<string, unknown>} record
 * @returns {import('./entities.js').SourceRange}
 */
function normalizeRange(record) {
  /** @type {import('./entities.js').SourceRange} */
  const range = {
    fileId: String(record.fileId),
    startLine: Number(record.startLine),
    startColumn: Number(record.startColumn),
    endLine: Number(record.endLine),
    endColumn: Number(record.endColumn),
  };
  if (Number.isInteger(record.startOffset)) {
    range.startOffset = Number(record.startOffset);
  }
  if (Number.isInteger(record.endOffset)) {
    range.endOffset = Number(record.endOffset);
  }
  return range;
}

/**
 * @template T
 * @param {T} value
 * @returns {T}
 */
function cloneValue(value) {
  if (Array.isArray(value)) {
    return /** @type {T} */ (value.map((entry) => cloneValue(entry)));
  }
  if (isPlainObject(value)) {
    /** @type {Record<string, unknown>} */
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      copy[key] = cloneValue(entry);
    }
    return /** @type {T} */ (copy);
  }
  return value;
}
