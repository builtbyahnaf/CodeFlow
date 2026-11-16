/**
 * CSR entity factories.
 *
 * Every factory is total: it accepts a partial object and returns a complete,
 * JSON-shaped entity with documented defaults. Factories never invent certainty:
 * a relationship without a `reasonCode` stays without one so validation rejects
 * it, and an omitted declaration becomes the zero range at the start of an
 * unnamed file rather than a plausible-looking guess.
 *
 * Validation lives in `validate.js` and is re-exported here for callers that
 * already import the entity module.
 */

import { CSR_VERSION } from './types.js';

/**
 * @typedef {Object} SourceRange
 * @property {string} fileId
 * @property {number} startLine
 * @property {number} startColumn
 * @property {number} endLine
 * @property {number} endColumn
 * @property {number} [startOffset]
 * @property {number} [endOffset]
 */

/**
 * @typedef {Object} FileRecord
 * @property {string} fileId
 * @property {string} path
 * @property {string} language
 * @property {string} contentHash
 * @property {number} sizeBytes
 * @property {number} lineCount
 * @property {boolean} generated
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} SymbolRecord
 * @property {string} symbolId
 * @property {string} kind
 * @property {string} name
 * @property {string} qualifiedName
 * @property {string} language
 * @property {SourceRange} declaration
 * @property {string} [signature]
 * @property {string} [parentId]
 * @property {'public'|'protected'|'private'|'internal'|'package'|'local'|'unknown'} [visibility]
 * @property {string} [disambiguator]
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} Evidence
 * @property {'source_range'|'symbol'|'relationship'|'diagnostic'|'macro_expansion'|'import'|'heuristic'} kind
 * @property {SourceRange} [range]
 * @property {string} [symbolId]
 * @property {string} [relationshipId]
 * @property {string} [diagnosticCode]
 * @property {string} [note]
 */

/**
 * @typedef {Object} Relationship
 * @property {string} relationshipId
 * @property {string} type
 * @property {string} from
 * @property {string} to
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @property {string} [reasonCode]
 * @property {Evidence[]} evidence
 * @property {SourceRange} [site]
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} ControlConstruct
 * @property {string} constructId
 * @property {string} kind
 * @property {string} [parentId]
 * @property {string[]} children
 * @property {string} [symbolId]
 * @property {SourceRange} [condition]
 * @property {SourceRange} sourceRange
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} DataFact
 * @property {string} factId
 * @property {string} kind
 * @property {string} symbolId
 * @property {SourceRange} at
 * @property {string} [relatedSymbolId]
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @property {string} [reasonCode]
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @typedef {Object} Diagnostic
 * @property {'info'|'warning'|'error'} severity
 * @property {string} code
 * @property {string} message
 * @property {SourceRange} [sourceRange]
 * @property {string[]} affects
 */

/**
 * @typedef {Object} AnalysisScope
 * @property {'file'|'workspace'} kind
 * @property {string} [path]
 */

/**
 * @typedef {Object} AnalysisRun
 * @property {string} runId
 * @property {string} adapterId
 * @property {string} adapterVersion
 * @property {string} language
 * @property {string} csrVersion
 * @property {string} [startedAt]
 * @property {number} [durationMs]
 * @property {AnalysisScope} scope
 * @property {'full'|'partial'|'syntactic_only'} completeness
 * @property {FileRecord[]} files
 * @property {SymbolRecord[]} symbols
 * @property {Relationship[]} relationships
 * @property {ControlConstruct[]} controlConstructs
 * @property {DataFact[]} dataFacts
 * @property {Diagnostic[]} diagnostics
 * @property {Record<string, unknown>} [extensions]
 */

/**
 * @param {Partial<SourceRange>} [input]
 * @returns {SourceRange}
 */
export function createSourceRange(input = {}) {
  /** @type {SourceRange} */
  const range = {
    fileId: String(input.fileId ?? ''),
    startLine: Number(input.startLine ?? 0),
    startColumn: Number(input.startColumn ?? 0),
    endLine: Number(input.endLine ?? 0),
    endColumn: Number(input.endColumn ?? 0),
  };
  if (Number.isInteger(input.startOffset)) {
    range.startOffset = Number(input.startOffset);
  }
  if (Number.isInteger(input.endOffset)) {
    range.endOffset = Number(input.endOffset);
  }
  return range;
}

/**
 * @param {Partial<FileRecord>} [input]
 * @returns {FileRecord}
 */
export function createFileRecord(input = {}) {
  /** @type {FileRecord} */
  const file = {
    fileId: String(input.fileId ?? ''),
    path: String(input.path ?? ''),
    language: String(input.language ?? ''),
    contentHash: String(input.contentHash ?? ''),
    sizeBytes: Number(input.sizeBytes ?? 0),
    lineCount: Number(input.lineCount ?? 1),
    generated: input.generated === true,
  };
  if (isPlainObject(input.extensions)) {
    file.extensions = cloneJson(input.extensions);
  }
  return file;
}

/**
 * @param {Partial<SymbolRecord> & {declaration?: SourceRange}} [input]
 * @returns {SymbolRecord}
 */
export function createSymbol(input = {}) {
  /** @type {SymbolRecord} */
  const symbol = {
    symbolId: String(input.symbolId ?? ''),
    kind: String(input.kind ?? 'unknown'),
    name: String(input.name ?? ''),
    qualifiedName: String(input.qualifiedName ?? input.name ?? ''),
    language: String(input.language ?? ''),
    declaration: createSourceRange(input.declaration),
  };
  if (typeof input.signature === 'string' && input.signature.length > 0) {
    symbol.signature = input.signature;
  }
  if (typeof input.parentId === 'string' && input.parentId.length > 0) {
    symbol.parentId = input.parentId;
  }
  if (typeof input.visibility === 'string' && input.visibility.length > 0) {
    symbol.visibility = /** @type {SymbolRecord['visibility']} */ (input.visibility);
  }
  if (typeof input.disambiguator === 'string') {
    symbol.disambiguator = input.disambiguator;
  }
  if (isPlainObject(input.extensions)) {
    symbol.extensions = cloneJson(input.extensions);
  }
  return symbol;
}

/**
 * @param {Partial<Evidence>} [input]
 * @returns {Evidence}
 */
export function createEvidence(input = {}) {
  /** @type {Evidence} */
  const evidence = { kind: /** @type {Evidence['kind']} */ (input.kind ?? 'source_range') };
  if (input.range) {
    evidence.range = createSourceRange(input.range);
  }
  for (const field of ['symbolId', 'relationshipId', 'diagnosticCode', 'note']) {
    if (typeof input[field] === 'string' && input[field].length > 0) {
      evidence[field] = input[field];
    }
  }
  return evidence;
}

/**
 * @param {Partial<Relationship>} [input]
 * @returns {Relationship}
 */
export function createRelationship(input = {}) {
  /** @type {Relationship} */
  const relationship = {
    relationshipId: String(input.relationshipId ?? ''),
    type: String(input.type ?? 'references'),
    from: String(input.from ?? ''),
    to: String(input.to ?? ''),
    status: /** @type {Relationship['status']} */ (input.status ?? 'unresolved'),
    evidence: Array.isArray(input.evidence) ? input.evidence.map(createEvidence) : [],
  };
  if (typeof input.reasonCode === 'string' && input.reasonCode.length > 0) {
    relationship.reasonCode = input.reasonCode;
  }
  if (input.site) {
    relationship.site = createSourceRange(input.site);
  }
  if (isPlainObject(input.extensions)) {
    relationship.extensions = cloneJson(input.extensions);
  }
  return relationship;
}

/**
 * @param {Partial<ControlConstruct>} [input]
 * @returns {ControlConstruct}
 */
export function createControlConstruct(input = {}) {
  /** @type {ControlConstruct} */
  const construct = {
    constructId: String(input.constructId ?? ''),
    kind: String(input.kind ?? 'unknown'),
    children: Array.isArray(input.children) ? input.children.map(String) : [],
    sourceRange: createSourceRange(input.sourceRange),
  };
  if (typeof input.parentId === 'string' && input.parentId.length > 0) {
    construct.parentId = input.parentId;
  }
  if (typeof input.symbolId === 'string' && input.symbolId.length > 0) {
    construct.symbolId = input.symbolId;
  }
  if (input.condition) {
    construct.condition = createSourceRange(input.condition);
  }
  if (isPlainObject(input.extensions)) {
    construct.extensions = cloneJson(input.extensions);
  }
  return construct;
}

/**
 * @param {Partial<DataFact>} [input]
 * @returns {DataFact}
 */
export function createDataFact(input = {}) {
  /** @type {DataFact} */
  const fact = {
    factId: String(input.factId ?? ''),
    kind: String(input.kind ?? 'use'),
    symbolId: String(input.symbolId ?? ''),
    at: createSourceRange(input.at),
    status: /** @type {DataFact['status']} */ (input.status ?? 'resolved'),
  };
  if (typeof input.relatedSymbolId === 'string' && input.relatedSymbolId.length > 0) {
    fact.relatedSymbolId = input.relatedSymbolId;
  }
  if (typeof input.reasonCode === 'string' && input.reasonCode.length > 0) {
    fact.reasonCode = input.reasonCode;
  }
  if (isPlainObject(input.extensions)) {
    fact.extensions = cloneJson(input.extensions);
  }
  return fact;
}

/**
 * @param {Partial<Diagnostic>} [input]
 * @returns {Diagnostic}
 */
export function createDiagnostic(input = {}) {
  /** @type {Diagnostic} */
  const diagnostic = {
    severity: /** @type {Diagnostic['severity']} */ (input.severity ?? 'warning'),
    code: String(input.code ?? ''),
    message: String(input.message ?? ''),
    affects: Array.isArray(input.affects) ? input.affects.map(String) : [],
  };
  if (input.sourceRange) {
    diagnostic.sourceRange = createSourceRange(input.sourceRange);
  }
  return diagnostic;
}

/**
 * @param {Partial<AnalysisRun>} [input]
 * @returns {AnalysisRun}
 */
export function createAnalysisRun(input = {}) {
  /** @type {AnalysisRun} */
  const run = {
    runId: String(input.runId ?? ''),
    adapterId: String(input.adapterId ?? ''),
    adapterVersion: String(input.adapterVersion ?? 'unknown'),
    language: String(input.language ?? ''),
    csrVersion: String(input.csrVersion ?? CSR_VERSION),
    scope: {
      kind: input.scope?.kind === 'file' ? 'file' : 'workspace',
    },
    completeness: /** @type {AnalysisRun['completeness']} */ (input.completeness ?? 'partial'),
    files: Array.isArray(input.files) ? input.files.map(createFileRecord) : [],
    symbols: Array.isArray(input.symbols) ? input.symbols.map(createSymbol) : [],
    relationships: Array.isArray(input.relationships)
      ? input.relationships.map(createRelationship)
      : [],
    controlConstructs: Array.isArray(input.controlConstructs)
      ? input.controlConstructs.map(createControlConstruct)
      : [],
    dataFacts: Array.isArray(input.dataFacts) ? input.dataFacts.map(createDataFact) : [],
    diagnostics: Array.isArray(input.diagnostics) ? input.diagnostics.map(createDiagnostic) : [],
  };
  if (typeof input.scope?.path === 'string' && input.scope.path.length > 0) {
    run.scope.path = input.scope.path;
  }
  if (typeof input.startedAt === 'string' && input.startedAt.length > 0) {
    run.startedAt = input.startedAt;
  }
  if (Number.isFinite(input.durationMs)) {
    run.durationMs = Number(input.durationMs);
  }
  if (isPlainObject(input.extensions)) {
    run.extensions = cloneJson(input.extensions);
  }
  return run;
}

/**
 * Build a degraded run from an adapter failure. The run is valid CSR with
 * `completeness: 'partial'` and an error diagnostic, so consumers can render an
 * honest empty state instead of crashing.
 *
 * @param {{runId: string, adapterId: string, adapterVersion?: string, language?: string, scope?: AnalysisScope, code: string, message: string, reasonCode?: string}} input
 * @returns {AnalysisRun}
 */
export function createDegradedRun(input) {
  return createAnalysisRun({
    runId: input.runId,
    adapterId: input.adapterId,
    adapterVersion: input.adapterVersion ?? 'unknown',
    language: input.language ?? 'unknown',
    scope: input.scope,
    completeness: 'partial',
    diagnostics: [
      createDiagnostic({
        severity: 'error',
        code: input.code,
        message: input.message,
        affects: [],
      }),
    ],
  });
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
export function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * JSON-shaped deep clone that preserves `undefined`-free structure. Faster and
 * more predictable than `structuredClone` for plain CSR data.
 *
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function cloneJson(value) {
  if (Array.isArray(value)) {
    return /** @type {T} */ (value.map((entry) => cloneJson(entry)));
  }
  if (isPlainObject(value)) {
    /** @type {Record<string, unknown>} */
    const copy = {};
    for (const [key, entry] of Object.entries(value)) {
      if (entry !== undefined) {
        copy[key] = cloneJson(entry);
      }
    }
    return /** @type {T} */ (copy);
  }
  return value;
}

export { validateAnalysisRun } from './validate.js';
