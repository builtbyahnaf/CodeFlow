/**
 * CSR entity factories and draft validation.
 *
 * DRAFT (Phase 0). The point of this module is to prove two things early:
 * 1. Entities can be created without any language knowledge.
 * 2. Invalid adapter output can be rejected with an actionable message.
 *
 * Phase 1 replaces this with the normative model. Behaviour that Phase 1 keeps:
 * validation returns structured errors instead of throwing, and provenance is
 * mandatory for every symbol.
 */

import {
  COMPLETENESS_LEVELS,
  CSR_VERSION,
  DIAGNOSTIC_SEVERITIES,
  REASON_CODES,
  RELATIONSHIP_TYPES,
  RESOLUTION_STATUSES,
  SYMBOL_KINDS,
} from './types.js';

/**
 * @typedef {Object} SourceRange
 * @property {string} fileId
 * @property {number} startLine   0-based
 * @property {number} startColumn 0-based, UTF-16 code units
 * @property {number} endLine     0-based, inclusive
 * @property {number} endColumn   0-based, exclusive
 */

/**
 * @typedef {Object} SymbolRecord
 * @property {string} symbolId
 * @property {string} kind
 * @property {string} name
 * @property {string} qualifiedName
 * @property {SourceRange} declaration
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} Relationship
 * @property {string} relationshipId
 * @property {string} type
 * @property {string} from
 * @property {string} to
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @property {string} [reasonCode]
 * @property {SourceRange} [site]
 */

/**
 * @typedef {Object} FileRecord
 * @property {string} fileId
 * @property {string} path       workspace-relative, forward slashes
 * @property {string} language
 * @property {string} contentHash
 * @property {number} lineCount
 */

/**
 * @typedef {Object} Diagnostic
 * @property {'info'|'warning'|'error'} severity
 * @property {string} code
 * @property {string} message
 * @property {string[]} [affects]
 */

/**
 * @typedef {Object} AnalysisRun
 * @property {string} runId
 * @property {string} adapterId
 * @property {string} language
 * @property {string} csrVersion
 * @property {'full'|'partial'|'syntactic_only'} completeness
 * @property {FileRecord[]} files
 * @property {SymbolRecord[]} symbols
 * @property {Relationship[]} relationships
 * @property {Diagnostic[]} diagnostics
 */

/**
 * @param {Partial<SourceRange>} input
 * @returns {SourceRange}
 */
export function createSourceRange(input) {
  return {
    fileId: String(input.fileId ?? ''),
    startLine: Number(input.startLine ?? 0),
    startColumn: Number(input.startColumn ?? 0),
    endLine: Number(input.endLine ?? 0),
    endColumn: Number(input.endColumn ?? 0),
  };
}

/**
 * @param {Partial<SymbolRecord> & {declaration: SourceRange}} input
 * @returns {SymbolRecord}
 */
export function createSymbol(input) {
  /** @type {SymbolRecord} */
  const symbol = {
    symbolId: String(input.symbolId ?? ''),
    kind: String(input.kind ?? 'unknown'),
    name: String(input.name ?? ''),
    qualifiedName: String(input.qualifiedName ?? input.name ?? ''),
    declaration: input.declaration,
  };
  if (input.extensions) {
    symbol.extensions = input.extensions;
  }
  return symbol;
}

/**
 * @param {Partial<Relationship>} input
 * @returns {Relationship}
 */
export function createRelationship(input) {
  /** @type {Relationship} */
  const relationship = {
    relationshipId: String(input.relationshipId ?? ''),
    type: String(input.type ?? 'references'),
    from: String(input.from ?? ''),
    to: String(input.to ?? ''),
    status: /** @type {Relationship['status']} */ (input.status ?? 'unresolved'),
  };
  if (input.reasonCode) {
    relationship.reasonCode = input.reasonCode;
  }
  if (input.site) {
    relationship.site = input.site;
  }
  return relationship;
}

/**
 * @param {Partial<AnalysisRun>} input
 * @returns {AnalysisRun}
 */
export function createAnalysisRun(input) {
  return {
    runId: String(input.runId ?? ''),
    adapterId: String(input.adapterId ?? ''),
    language: String(input.language ?? ''),
    csrVersion: String(input.csrVersion ?? CSR_VERSION),
    completeness: /** @type {AnalysisRun['completeness']} */ (input.completeness ?? 'partial'),
    files: Array.isArray(input.files) ? input.files : [],
    symbols: Array.isArray(input.symbols) ? input.symbols : [],
    relationships: Array.isArray(input.relationships) ? input.relationships : [],
    diagnostics: Array.isArray(input.diagnostics) ? input.diagnostics : [],
  };
}

/**
 * @typedef {Object} ValidationIssue
 * @property {string} path
 * @property {string} message
 */

/**
 * Validate an analysis run at the adapter boundary.
 *
 * Rules enforced in this draft:
 * - Required scalars are present.
 * - Enums are closed.
 * - Symbol IDs are unique and every symbol has a valid range inside a known file.
 * - Non-`resolved` relationships carry a reason code from the closed list.
 * - A `resolved` relationship must point at a declared symbol.
 *
 * @param {unknown} run
 * @returns {{ok: true, run: AnalysisRun} | {ok: false, issues: ValidationIssue[]}}
 */
export function validateAnalysisRun(run) {
  /** @type {ValidationIssue[]} */
  const issues = [];

  if (typeof run !== 'object' || run === null || Array.isArray(run)) {
    return { ok: false, issues: [{ path: '$', message: 'Analysis run must be an object.' }] };
  }

  const candidate = /** @type {Record<string, unknown>} */ (run);

  for (const field of ['runId', 'adapterId', 'language', 'csrVersion']) {
    if (typeof candidate[field] !== 'string' || candidate[field].length === 0) {
      issues.push({ path: field, message: `${field} must be a non-empty string.` });
    }
  }

  if (!COMPLETENESS_LEVELS.includes(String(candidate.completeness))) {
    issues.push({
      path: 'completeness',
      message: `completeness must be one of ${COMPLETENESS_LEVELS.join(', ')}.`,
    });
  }

  const files = Array.isArray(candidate.files) ? candidate.files : [];
  if (!Array.isArray(candidate.files)) {
    issues.push({ path: 'files', message: 'files must be an array.' });
  }

  /** @type {Map<string, Record<string, unknown>>} */
  const fileById = new Map();
  files.forEach((file, index) => {
    const path = `files[${index}]`;
    if (typeof file !== 'object' || file === null) {
      issues.push({ path, message: 'File record must be an object.' });
      return;
    }
    const record = /** @type {Record<string, unknown>} */ (file);
    const fileId = record.fileId;
    if (typeof fileId !== 'string' || fileId.length === 0) {
      issues.push({ path: `${path}.fileId`, message: 'fileId must be a non-empty string.' });
      return;
    }
    if (fileById.has(fileId)) {
      issues.push({ path: `${path}.fileId`, message: `Duplicate fileId "${fileId}".` });
      return;
    }
    fileById.set(fileId, record);
    if (typeof record.path !== 'string' || record.path.length === 0) {
      issues.push({ path: `${path}.path`, message: 'path must be a non-empty string.' });
    }
    if (!Number.isInteger(record.lineCount) || Number(record.lineCount) < 1) {
      issues.push({ path: `${path}.lineCount`, message: 'lineCount must be a positive integer.' });
    }
  });

  const symbols = Array.isArray(candidate.symbols) ? candidate.symbols : [];
  if (!Array.isArray(candidate.symbols)) {
    issues.push({ path: 'symbols', message: 'symbols must be an array.' });
  }

  /** @type {Set<string>} */
  const symbolIds = new Set();
  symbols.forEach((symbol, index) => {
    const path = `symbols[${index}]`;
    if (typeof symbol !== 'object' || symbol === null) {
      issues.push({ path, message: 'Symbol must be an object.' });
      return;
    }
    const record = /** @type {Record<string, unknown>} */ (symbol);
    const symbolId = record.symbolId;
    if (typeof symbolId !== 'string' || symbolId.length === 0) {
      issues.push({ path: `${path}.symbolId`, message: 'symbolId must be a non-empty string.' });
      return;
    }
    if (symbolIds.has(symbolId)) {
      issues.push({ path: `${path}.symbolId`, message: `Duplicate symbolId "${symbolId}".` });
      return;
    }
    symbolIds.add(symbolId);

    if (!SYMBOL_KINDS.includes(String(record.kind))) {
      issues.push({
        path: `${path}.kind`,
        message: `Unknown symbol kind "${String(record.kind)}".`,
      });
    }

    const declaration = record.declaration;
    if (typeof declaration !== 'object' || declaration === null) {
      issues.push({ path: `${path}.declaration`, message: 'declaration range is required.' });
      return;
    }
    issues.push(...validateRange(declaration, `${path}.declaration`, fileById));
  });

  const relationships = Array.isArray(candidate.relationships) ? candidate.relationships : [];
  if (!Array.isArray(candidate.relationships)) {
    issues.push({ path: 'relationships', message: 'relationships must be an array.' });
  }

  /** @type {Set<string>} */
  const relationshipIds = new Set();
  relationships.forEach((relationship, index) => {
    const path = `relationships[${index}]`;
    if (typeof relationship !== 'object' || relationship === null) {
      issues.push({ path, message: 'Relationship must be an object.' });
      return;
    }
    const record = /** @type {Record<string, unknown>} */ (relationship);
    const id = record.relationshipId;
    if (typeof id !== 'string' || id.length === 0) {
      issues.push({
        path: `${path}.relationshipId`,
        message: 'relationshipId must be a non-empty string.',
      });
      return;
    }
    if (relationshipIds.has(id)) {
      issues.push({ path: `${path}.relationshipId`, message: `Duplicate relationshipId "${id}".` });
      return;
    }
    relationshipIds.add(id);

    if (!RELATIONSHIP_TYPES.includes(String(record.type))) {
      issues.push({
        path: `${path}.type`,
        message: `Unknown relationship type "${String(record.type)}".`,
      });
    }

    const status = String(record.status);
    if (!RESOLUTION_STATUSES.includes(status)) {
      issues.push({
        path: `${path}.status`,
        message: `status must be one of ${RESOLUTION_STATUSES.join(', ')}.`,
      });
    } else if (status !== 'resolved') {
      const reason = record.reasonCode;
      if (typeof reason !== 'string' || reason.length === 0) {
        issues.push({
          path: `${path}.reasonCode`,
          message: `A "${status}" relationship must carry a reasonCode.`,
        });
      } else if (!REASON_CODES.includes(reason)) {
        issues.push({
          path: `${path}.reasonCode`,
          message: `Unknown reasonCode "${reason}".`,
        });
      }
    }

    const from = record.from;
    const to = record.to;
    if (typeof from !== 'string' || from.length === 0) {
      issues.push({ path: `${path}.from`, message: 'from must be a symbolId.' });
    } else if (!symbolIds.has(from)) {
      issues.push({ path: `${path}.from`, message: `Unknown source symbol "${from}".` });
    }
    if (typeof to !== 'string' || to.length === 0) {
      issues.push({ path: `${path}.to`, message: 'to must be a symbolId or external target id.' });
    } else if (status === 'resolved' && !symbolIds.has(to)) {
      issues.push({
        path: `${path}.to`,
        message: `A resolved relationship must target a declared symbol; "${to}" is unknown.`,
      });
    }

    if (record.site !== undefined) {
      if (typeof record.site !== 'object' || record.site === null) {
        issues.push({ path: `${path}.site`, message: 'site must be a range object.' });
      } else {
        issues.push(...validateRange(record.site, `${path}.site`, fileById));
      }
    }
  });

  const diagnostics = Array.isArray(candidate.diagnostics) ? candidate.diagnostics : [];
  if (!Array.isArray(candidate.diagnostics)) {
    issues.push({ path: 'diagnostics', message: 'diagnostics must be an array.' });
  }
  diagnostics.forEach((diagnostic, index) => {
    const path = `diagnostics[${index}]`;
    if (typeof diagnostic !== 'object' || diagnostic === null) {
      issues.push({ path, message: 'Diagnostic must be an object.' });
      return;
    }
    const record = /** @type {Record<string, unknown>} */ (diagnostic);
    if (!DIAGNOSTIC_SEVERITIES.includes(String(record.severity))) {
      issues.push({ path: `${path}.severity`, message: 'Unknown diagnostic severity.' });
    }
    if (typeof record.code !== 'string' || record.code.length === 0) {
      issues.push({ path: `${path}.code`, message: 'Diagnostic code is required.' });
    }
    if (typeof record.message !== 'string' || record.message.length === 0) {
      issues.push({ path: `${path}.message`, message: 'Diagnostic message is required.' });
    }
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  return { ok: true, run: createAnalysisRun(candidate) };
}

/**
 * @param {unknown} range
 * @param {string} path
 * @param {Map<string, Record<string, unknown>>} fileById
 * @returns {ValidationIssue[]}
 */
function validateRange(range, path, fileById) {
  /** @type {ValidationIssue[]} */
  const issues = [];
  if (typeof range !== 'object' || range === null) {
    return [{ path, message: 'Range must be an object.' }];
  }
  const record = /** @type {Record<string, unknown>} */ (range);
  const fileId = record.fileId;
  if (typeof fileId !== 'string' || !fileById.has(fileId)) {
    issues.push({ path: `${path}.fileId`, message: `Unknown fileId "${String(fileId)}".` });
  }
  for (const field of ['startLine', 'startColumn', 'endLine', 'endColumn']) {
    if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
      issues.push({
        path: `${path}.${field}`,
        message: `${field} must be a non-negative integer.`,
      });
    }
  }
  if (
    Number.isInteger(record.startLine) &&
    Number.isInteger(record.endLine) &&
    Number(record.endLine) < Number(record.startLine)
  ) {
    issues.push({ path: `${path}.endLine`, message: 'endLine must be >= startLine.' });
  }
  if (
    Number.isInteger(record.startLine) &&
    Number.isInteger(record.endLine) &&
    Number(record.startLine) === Number(record.endLine) &&
    Number.isInteger(record.startColumn) &&
    Number.isInteger(record.endColumn) &&
    Number(record.endColumn) < Number(record.startColumn)
  ) {
    issues.push({ path: `${path}.endColumn`, message: 'endColumn must be >= startColumn.' });
  }
  const file = typeof fileId === 'string' ? fileById.get(fileId) : undefined;
  if (
    file &&
    Number.isInteger(record.endLine) &&
    Number(record.endLine) >= Number(file.lineCount)
  ) {
    issues.push({
      path: `${path}.endLine`,
      message: `endLine ${String(record.endLine)} exceeds lineCount ${String(file.lineCount)}.`,
    });
  }
  return issues;
}
