/**
 * C Language Adapter (Phase 13 §3, P13-01, AC-13.1).
 *
 * Implements the standard adapter contract for C source files (.c) and headers (.h)
 * using Clang C-mode AST translation into CSR.
 */

import { createCapabilities } from '../../core/adapterRegistry.js';
import { mapClangCAst } from './mapper.js';

export const C_ADAPTER_ID = 'c-clang';
export const C_ADAPTER_VERSION = '0.1.0';

export const C_EXTENSIONS = Object.freeze(['.c', '.h']);

/**
 * @typedef {Object} CAnalyzeInput
 * @property {string} runId
 * @property {string} path
 * @property {string} [text]
 * @property {string} [workspaceRoot]
 * @property {string|Record<string, unknown>|null} [cAst]
 * @property {'compile-db'|'heuristic'} [cMode]
 * @property {Array<{code: string, message: string}>} [cWarnings]
 * @property {Record<string, unknown>} [cHeaderMap]
 * @property {string} [cToolchain]
 * @property {string} [cStderr]
 */

export const cAdapter = {
  id: C_ADAPTER_ID,
  displayName: 'C (Clang AST)',
  version: C_ADAPTER_VERSION,
  languages: ['c'],
  extensions: [...C_EXTENSIONS],
  capabilities: createCapabilities({
    parse: 'partial',
    discoverDeclarations: true,
    resolveSymbols: 'partial',
    resolveTypes: 'partial',
    resolveCalls: 'partial',
    generateCFG: true,
    generateDFG: false,
    resolveImports: 'partial',
    mapSourceLocations: true,
    reportDiagnostics: true,
  }),

  /**
   * @param {CAnalyzeInput} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    return mapClangCAst({
      runId: input.runId,
      path: input.path,
      text: input.text ?? '',
      workspaceRoot: input.workspaceRoot,
      ast: input.cAst ?? null,
      mode: input.cMode ?? 'heuristic',
      warnings: Array.isArray(input.cWarnings) ? input.cWarnings : [],
      headerMap: input.cHeaderMap ?? {},
      toolchain: input.cToolchain ?? 'clang',
      adapterId: C_ADAPTER_ID,
      adapterVersion: C_ADAPTER_VERSION,
    });
  },
};

export * from './functionPointers.js';
export * from './headers.js';
export * from './mapper.js';
