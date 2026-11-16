/**
 * Mock language adapter.
 *
 * Phase 0 exists to prove the pipeline, not to analyze anything. This adapter
 * emits a small, hand-written analysis run so that the graph model, DTO,
 * renderer, and protocol can be built and tested before real parsers exist.
 *
 * It is registered for `.mock` files only. It must never claim to analyze real
 * `.js` or `.cpp` sources — that would make the extension look more capable than
 * it is.
 */

import { CSR_VERSION } from '../../core/csr/types.js';
import { createCapabilities } from '../../core/adapterRegistry.js';

export const MOCK_RUN_ID = 'run:mock-1';

const FILES = [
  {
    fileId: 'file:src/DBHandler.js',
    path: 'src/DBHandler.js',
    language: 'mock',
    contentHash: 'sha256:mock-dbhandler',
    lineCount: 41,
  },
  {
    fileId: 'file:src/SQLiteHelper.js',
    path: 'src/SQLiteHelper.js',
    language: 'mock',
    contentHash: 'sha256:mock-sqlitehelper',
    lineCount: 27,
  },
];

const SYMBOLS = [
  {
    symbolId: 'symbol:js:src/DBHandler.js:class:DBHandler',
    kind: 'class',
    name: 'DBHandler',
    qualifiedName: 'DBHandler',
    declaration: {
      fileId: 'file:src/DBHandler.js',
      startLine: 3,
      startColumn: 0,
      endLine: 30,
      endColumn: 1,
    },
  },
  {
    symbolId: 'symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists',
    kind: 'method',
    name: 'check_db_exists',
    qualifiedName: 'DBHandler.check_db_exists',
    declaration: {
      fileId: 'file:src/DBHandler.js',
      startLine: 9,
      startColumn: 2,
      endLine: 22,
      endColumn: 3,
    },
    extensions: { async: true, parameters: 1 },
  },
  {
    symbolId: 'symbol:js:src/DBHandler.js:function:main',
    kind: 'function',
    name: 'main',
    qualifiedName: 'main',
    declaration: {
      fileId: 'file:src/DBHandler.js',
      startLine: 33,
      startColumn: 0,
      endLine: 40,
      endColumn: 1,
    },
  },
  {
    symbolId: 'symbol:js:src/SQLiteHelper.js:method:SQLiteHelper.checkData',
    kind: 'method',
    name: 'checkData',
    qualifiedName: 'SQLiteHelper.checkData',
    declaration: {
      fileId: 'file:src/SQLiteHelper.js',
      startLine: 6,
      startColumn: 2,
      endLine: 20,
      endColumn: 3,
    },
  },
  {
    symbolId: 'symbol:js:src/SQLiteHelper.js:class:SQLiteHelper',
    kind: 'class',
    name: 'SQLiteHelper',
    qualifiedName: 'SQLiteHelper',
    declaration: {
      fileId: 'file:src/SQLiteHelper.js',
      startLine: 2,
      startColumn: 0,
      endLine: 24,
      endColumn: 1,
    },
  },
];

const RELATIONSHIPS = [
  {
    relationshipId: 'rel:main-calls-check',
    type: 'calls',
    from: 'symbol:js:src/DBHandler.js:function:main',
    to: 'symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists',
    status: 'resolved',
    site: {
      fileId: 'file:src/DBHandler.js',
      startLine: 36,
      startColumn: 2,
      endLine: 36,
      endColumn: 20,
    },
  },
  {
    relationshipId: 'rel:check-calls-checkdata',
    type: 'calls',
    from: 'symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists',
    to: 'symbol:js:src/SQLiteHelper.js:method:SQLiteHelper.checkData',
    status: 'resolved',
    site: {
      fileId: 'file:src/DBHandler.js',
      startLine: 15,
      startColumn: 4,
      endLine: 15,
      endColumn: 27,
    },
  },
  {
    relationshipId: 'rel:check-calls-logger',
    type: 'calls',
    from: 'symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists',
    to: 'external:logger.info',
    status: 'unresolved',
    reasonCode: 'unknown_import_target',
    site: {
      fileId: 'file:src/DBHandler.js',
      startLine: 19,
      startColumn: 4,
      endLine: 19,
      endColumn: 18,
    },
  },
  {
    relationshipId: 'rel:dbhandler-defines-method',
    type: 'defines',
    from: 'symbol:js:src/DBHandler.js:class:DBHandler',
    to: 'symbol:js:src/DBHandler.js:method:DBHandler.check_db_exists',
    status: 'resolved',
  },
];

const DIAGNOSTICS = [
  {
    severity: 'warning',
    code: 'mock_data',
    message:
      'This graph comes from the Phase 0 mock adapter. It demonstrates the pipeline; it is not analysis of your code.',
    affects: ['symbol:js:src/DBHandler.js:function:main'],
  },
  {
    severity: 'info',
    code: 'partial_coverage',
    message: 'Mock analysis intentionally covers only the sample fixtures.',
  },
];

/**
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function createMockAnalysis() {
  // Deep copies keep callers from mutating the shared fixture.
  return {
    runId: MOCK_RUN_ID,
    adapterId: 'mock',
    language: 'mock',
    csrVersion: CSR_VERSION,
    completeness: 'partial',
    files: FILES.map((file) => ({ ...file })),
    symbols: SYMBOLS.map((symbol) => ({ ...symbol, declaration: { ...symbol.declaration } })),
    relationships: RELATIONSHIPS.map((relationship) => ({
      ...relationship,
      site: relationship.site ? { ...relationship.site } : undefined,
    })),
    diagnostics: DIAGNOSTICS.map((diagnostic) => ({ ...diagnostic })),
  };
}

export const MOCK_FILE_TEXT = [
  '// Phase 0 mock fixture — not real project source.',
  'class DBHandler {',
  '  async check_db_exists(path) {',
  '    // ...',
  '  }',
  '}',
  '',
  'function main() {',
  '  new DBHandler().check_db_exists("./data.db");',
  '}',
].join('\n');

/** @type {import('../../core/adapterRegistry.js').AdapterDescriptor} */
export const mockAdapter = {
  id: 'mock',
  displayName: 'Mock adapter (Phase 0)',
  version: '0.0.1',
  languages: ['mock'],
  extensions: ['.mock'],
  capabilities: createCapabilities({
    parse: true,
    discoverDeclarations: true,
    resolveCalls: true,
    mapSourceLocations: true,
    reportDiagnostics: true,
  }),
  /**
   * @param {{path: string, text?: string, runId: string}} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    const analysis = createMockAnalysis();
    // The run id is the only input-derived field. Everything else is a fixture,
    // which makes determinism trivial to test and impossible to fake.
    return { ...analysis, runId: input.runId };
  },
};
