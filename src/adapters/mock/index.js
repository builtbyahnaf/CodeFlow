/**
 * Mock language adapter.
 *
 * Phase 0 proved the pipeline with five hand-written symbols. Phase 1 upgrades
 * the fixture to the normative CSR so the conformance suite has something real
 * to exercise: overloads, anonymous constructs, every resolution status, an
 * external target, evidence, control constructs, data facts, and diagnostics.
 *
 * It is registered for `.mock` files only. It must never claim to analyze real
 * `.js` or `.cpp` sources — that would make the extension look more capable than
 * it is.
 */

import {
  createAnalysisRun,
  createControlConstruct,
  createDataFact,
  createDiagnostic,
  createEvidence,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../core/csr/entities.js';
import {
  createAnonymousDisambiguator,
  createFileId,
  createIdentityAllocator,
  createOverloadDisambiguator,
  createRelationshipAllocator,
} from '../../core/csr/identity.js';
import { createCapabilities } from '../../core/adapterRegistry.js';

export const MOCK_RUN_ID = 'run:mock-1';
export const MOCK_LANGUAGE = 'mock';

const DB_PATH = 'src/DBHandler.js';
const SQLITE_PATH = 'src/SQLiteHelper.js';

const DB_FILE_ID = createFileId(DB_PATH);
const SQLITE_FILE_ID = createFileId(SQLITE_PATH);

const identity = createIdentityAllocator({ language: MOCK_LANGUAGE });
const relationships = createRelationshipAllocator();

/**
 * @param {{path: string, kind: string, name?: string, qualifiedName: string, startLine: number, startColumn?: number, endLine: number, endColumn?: number, parentId?: string, disambiguator?: string, signature?: string, visibility?: 'public'|'private'|'protected'|'local', extensions?: Record<string, unknown>}} input
 */
function symbol(input) {
  const fileId = input.path === DB_PATH ? DB_FILE_ID : SQLITE_FILE_ID;
  const identityValue = identity.symbol({
    path: input.path,
    kind: input.kind,
    qualifiedName: input.qualifiedName,
    disambiguator: input.disambiguator,
  });
  return createSymbol({
    symbolId: identityValue.symbolId,
    kind: input.kind,
    name: input.name ?? input.qualifiedName.split('.').pop() ?? input.qualifiedName,
    qualifiedName: input.qualifiedName,
    language: MOCK_LANGUAGE,
    declaration: {
      fileId,
      startLine: input.startLine,
      startColumn: input.startColumn ?? 0,
      endLine: input.endLine,
      endColumn: input.endColumn ?? 0,
    },
    signature: input.signature,
    parentId: input.parentId,
    visibility: input.visibility,
    disambiguator: identityValue.disambiguator,
    extensions: input.extensions,
  });
}

const DBHANDLER = symbol({
  path: DB_PATH,
  kind: 'class',
  qualifiedName: 'DBHandler',
  startLine: 3,
  startColumn: 0,
  endLine: 30,
  endColumn: 1,
  visibility: 'public',
  extensions: { exported: true },
});

const CHECK_DB = symbol({
  path: DB_PATH,
  kind: 'method',
  qualifiedName: 'DBHandler.check_db_exists',
  startLine: 9,
  startColumn: 2,
  endLine: 22,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: 'public',
  signature: 'check_db_exists(path: string): Promise<boolean>',
  extensions: { async: true },
});

const OPEN_ONE = symbol({
  path: DB_PATH,
  kind: 'method',
  qualifiedName: 'DBHandler.open',
  startLine: 24,
  startColumn: 2,
  endLine: 26,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: 'public',
  disambiguator: createOverloadDisambiguator(['path']),
  signature: 'open(path: string): void',
});

const OPEN_TWO = symbol({
  path: DB_PATH,
  kind: 'method',
  qualifiedName: 'DBHandler.open',
  startLine: 27,
  startColumn: 2,
  endLine: 29,
  endColumn: 3,
  parentId: DBHANDLER.symbolId,
  visibility: 'public',
  disambiguator: createOverloadDisambiguator(['path', 'encoding']),
  signature: 'open(path: string, encoding: string): void',
});

const CHECK_I = symbol({
  path: DB_PATH,
  kind: 'variable',
  qualifiedName: 'DBHandler.check_db_exists.i',
  startLine: 12,
  startColumn: 4,
  endLine: 12,
  endColumn: 5,
  parentId: CHECK_DB.symbolId,
  visibility: 'local',
});

const MAIN = symbol({
  path: DB_PATH,
  kind: 'function',
  qualifiedName: 'main',
  startLine: 33,
  startColumn: 0,
  endLine: 40,
  endColumn: 1,
  visibility: 'public',
  signature: 'main(): void',
});

const MAIN_I = symbol({
  path: DB_PATH,
  kind: 'variable',
  qualifiedName: 'main.i',
  startLine: 35,
  startColumn: 4,
  endLine: 35,
  endColumn: 5,
  parentId: MAIN.symbolId,
  visibility: 'local',
});

const MAIN_LAMBDA = symbol({
  path: DB_PATH,
  kind: 'lambda',
  name: '<anonymous>',
  qualifiedName: 'main.<anonymous>',
  startLine: 36,
  startColumn: 4,
  endLine: 38,
  endColumn: 5,
  parentId: MAIN.symbolId,
  visibility: 'local',
  disambiguator: createAnonymousDisambiguator(1),
});

const SQLITE = symbol({
  path: SQLITE_PATH,
  kind: 'class',
  qualifiedName: 'SQLiteHelper',
  startLine: 2,
  startColumn: 0,
  endLine: 24,
  endColumn: 1,
  visibility: 'public',
});

const CHECK_DATA = symbol({
  path: SQLITE_PATH,
  kind: 'method',
  qualifiedName: 'SQLiteHelper.checkData',
  startLine: 6,
  startColumn: 2,
  endLine: 20,
  endColumn: 3,
  parentId: SQLITE.symbolId,
  visibility: 'public',
  signature: 'checkData(data: unknown): boolean',
});

// Non-ASCII identifier: ranges and ids must survive without normalisation.
const NAIVE = symbol({
  path: SQLITE_PATH,
  kind: 'function',
  qualifiedName: 'naïve',
  startLine: 1,
  startColumn: 0,
  endLine: 3,
  endColumn: 1,
  visibility: 'public',
});

/** @type {import('../../core/csr/entities.js').SymbolRecord[]} */
const SYMBOLS = [
  SQLITE,
  CHECK_DATA,
  NAIVE,
  DBHANDLER,
  CHECK_DB,
  OPEN_ONE,
  OPEN_TWO,
  CHECK_I,
  MAIN,
  MAIN_I,
  MAIN_LAMBDA,
];

/**
 * @param {{id?: string, type: string, from: string, to: string, status: 'resolved'|'inferred'|'possible'|'unresolved'|'stale', reasonCode?: string, site?: {fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number}, evidence?: Array<{kind: 'source_range'|'symbol', range?: object, symbolId?: string}>}} input
 */
function relationship(input) {
  return createRelationship({
    relationshipId: input.id ?? relationships.relationship(input),
    type: input.type,
    from: input.from,
    to: input.to,
    status: input.status,
    reasonCode: input.reasonCode,
    site: input.site,
    evidence: input.evidence ?? [],
  });
}

const site = (fileId, startLine, startColumn, endLine, endColumn) => ({
  fileId,
  startLine,
  startColumn,
  endLine,
  endColumn,
});

/** @type {import('../../core/csr/entities.js').Relationship[]} */
const RELATIONSHIPS = [
  relationship({
    type: 'calls',
    from: MAIN.symbolId,
    to: CHECK_DB.symbolId,
    status: 'resolved',
    site: site(DB_FILE_ID, 37, 2, 37, 37),
    evidence: [
      createEvidence({ kind: 'source_range', range: site(DB_FILE_ID, 37, 2, 37, 37) }),
      createEvidence({ kind: 'symbol', symbolId: MAIN.symbolId }),
    ],
  }),
  relationship({
    type: 'calls',
    from: CHECK_DB.symbolId,
    to: CHECK_DATA.symbolId,
    status: 'resolved',
    site: site(DB_FILE_ID, 15, 4, 15, 27),
  }),
  relationship({
    type: 'calls',
    from: CHECK_DB.symbolId,
    to: 'external:logger.info',
    status: 'unresolved',
    reasonCode: 'unknown_import_target',
    site: site(DB_FILE_ID, 19, 4, 19, 18),
  }),
  relationship({
    type: 'calls',
    from: CHECK_DB.symbolId,
    to: 'external:fs.readFile',
    status: 'unresolved',
    reasonCode: 'out_of_scope',
    site: site(DB_FILE_ID, 20, 4, 20, 22),
  }),
  relationship({
    type: 'defines',
    from: DBHANDLER.symbolId,
    to: CHECK_DB.symbolId,
    status: 'resolved',
  }),
  relationship({
    type: 'defines',
    from: DBHANDLER.symbolId,
    to: OPEN_ONE.symbolId,
    status: 'resolved',
  }),
  relationship({
    type: 'defines',
    from: DBHANDLER.symbolId,
    to: OPEN_TWO.symbolId,
    status: 'resolved',
  }),
  relationship({
    type: 'calls',
    from: MAIN.symbolId,
    to: OPEN_ONE.symbolId,
    status: 'possible',
    reasonCode: 'overload_ambiguous',
    site: site(DB_FILE_ID, 36, 2, 36, 20),
  }),
  relationship({
    type: 'references',
    from: MAIN.symbolId,
    to: NAIVE.symbolId,
    status: 'inferred',
    reasonCode: 'function_pointer',
    site: site(DB_FILE_ID, 38, 4, 38, 12),
  }),
  relationship({
    type: 'captures',
    from: MAIN_LAMBDA.symbolId,
    to: MAIN_I.symbolId,
    status: 'stale',
    reasonCode: 'index_stale',
    site: site(DB_FILE_ID, 36, 4, 38, 5),
  }),
];

/** @type {import('../../core/csr/entities.js').ControlConstruct[]} */
const CONSTRUCTS = [
  createControlConstruct({
    constructId: 'construct:mock:main:entry',
    kind: 'entry',
    symbolId: MAIN.symbolId,
    children: ['construct:mock:main:if'],
    sourceRange: site(DB_FILE_ID, 33, 0, 40, 1),
  }),
  createControlConstruct({
    constructId: 'construct:mock:main:if',
    kind: 'if',
    parentId: 'construct:mock:main:entry',
    symbolId: MAIN.symbolId,
    children: ['construct:mock:main:return'],
    condition: site(DB_FILE_ID, 35, 6, 35, 20),
    sourceRange: site(DB_FILE_ID, 35, 2, 38, 3),
  }),
  createControlConstruct({
    constructId: 'construct:mock:main:return',
    kind: 'return',
    parentId: 'construct:mock:main:if',
    symbolId: MAIN.symbolId,
    sourceRange: site(DB_FILE_ID, 39, 2, 39, 3),
  }),
  createControlConstruct({
    constructId: 'construct:mock:check:entry',
    kind: 'entry',
    symbolId: CHECK_DB.symbolId,
    children: ['construct:mock:check:try'],
    sourceRange: site(DB_FILE_ID, 9, 2, 22, 3),
  }),
  createControlConstruct({
    constructId: 'construct:mock:check:try',
    kind: 'try',
    parentId: 'construct:mock:check:entry',
    symbolId: CHECK_DB.symbolId,
    sourceRange: site(DB_FILE_ID, 11, 4, 21, 5),
  }),
];

/** @type {import('../../core/csr/entities.js').DataFact[]} */
const DATA_FACTS = [
  createDataFact({
    factId: 'fact:mock:i1:definition',
    kind: 'definition',
    symbolId: CHECK_I.symbolId,
    at: site(DB_FILE_ID, 12, 8, 12, 9),
    status: 'resolved',
  }),
  createDataFact({
    factId: 'fact:mock:i1:use',
    kind: 'use',
    symbolId: CHECK_I.symbolId,
    at: site(DB_FILE_ID, 13, 8, 13, 9),
    status: 'resolved',
  }),
  createDataFact({
    factId: 'fact:mock:i2:assignment',
    kind: 'assignment',
    symbolId: MAIN_I.symbolId,
    at: site(DB_FILE_ID, 35, 4, 35, 9),
    relatedSymbolId: CHECK_I.symbolId,
    status: 'inferred',
    reasonCode: 'dynamic_dispatch',
  }),
];

const DIAGNOSTICS = [
  createDiagnostic({
    severity: 'warning',
    code: 'mock_data',
    message:
      'This graph comes from the mock adapter. It demonstrates the CSR contract; it is not analysis of your code.',
    affects: [MAIN.symbolId],
  }),
  createDiagnostic({
    severity: 'info',
    code: 'partial_coverage',
    message: 'Mock analysis intentionally covers only the sample fixtures.',
    affects: [],
  }),
];

/**
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function createMockAnalysis() {
  return createAnalysisRun({
    runId: MOCK_RUN_ID,
    adapterId: 'mock',
    adapterVersion: '0.1.0',
    language: MOCK_LANGUAGE,
    scope: { kind: 'workspace' },
    completeness: 'partial',
    files: [
      createFileRecord({
        fileId: DB_FILE_ID,
        path: DB_PATH,
        language: MOCK_LANGUAGE,
        contentHash: 'fnv1a:mock-dbhandler',
        sizeBytes: 812,
        lineCount: 41,
      }),
      createFileRecord({
        fileId: SQLITE_FILE_ID,
        path: SQLITE_PATH,
        language: MOCK_LANGUAGE,
        contentHash: 'fnv1a:mock-sqlitehelper',
        sizeBytes: 504,
        lineCount: 27,
      }),
    ],
    symbols: SYMBOLS.map((entry) => ({ ...entry, declaration: { ...entry.declaration } })),
    relationships: RELATIONSHIPS.map((entry) => ({
      ...entry,
      evidence: entry.evidence.map((item) => ({ ...item })),
    })),
    controlConstructs: CONSTRUCTS.map((entry) => ({ ...entry })),
    dataFacts: DATA_FACTS.map((entry) => ({ ...entry })),
    diagnostics: DIAGNOSTICS.map((entry) => ({ ...entry })),
  });
}

export const MOCK_FILE_TEXT = [
  '// Phase 1 mock fixture — not real project source.',
  'function naïve(value) {',
  '  return value;',
  '}',
  'class DBHandler {',
  '  open(path) {}',
  '  open(path, encoding) {}',
  '  async check_db_exists(path) {',
  '    let i = 0;',
  '    i += 1;',
  '    return this.open(path);',
  '  }',
  '}',
  '',
  'function main() {',
  '  let i = 0;',
  '  const callback = () => i;',
  '  new DBHandler().check_db_exists("./data.db");',
  '  naïve(callback);',
  '}',
].join('\n');

/** @type {import('../../core/adapterRegistry.js').AdapterDescriptor} */
export const mockAdapter = {
  id: 'mock',
  displayName: 'Mock adapter (Phase 1)',
  version: '0.1.0',
  languages: [MOCK_LANGUAGE],
  extensions: ['.mock'],
  capabilities: createCapabilities({
    parse: true,
    discoverDeclarations: true,
    resolveSymbols: true,
    resolveCalls: true,
    resolveImports: true,
    mapSourceLocations: true,
    reportDiagnostics: true,
  }),
  /**
   * @param {{path: string, text?: string, runId: string}} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    const analysis = createMockAnalysis();
    return { ...analysis, runId: input.runId };
  },
};
