/**
 * C++ language adapter.
 *
 * The adapter is pure: it maps a Clang AST that the host produced into CSR. It
 * never spawns a compiler, reads workspace files, or runs a build system. When
 * the host could not produce an AST, the adapter returns an empty but valid and
 * diagnosed run so the UI can explain the gap instead of showing a false success.
 */

import { createCapabilities } from '../../core/adapterRegistry.js';
import { mapClangAst } from './mapper.js';

export const CPP_ADAPTER_ID = 'cpp-clang';
export const CPP_ADAPTER_VERSION = '0.1.0';

/** Headers are listed because V1 analyses them through a representative TU. */
export const CPP_EXTENSIONS = Object.freeze([
  '.cpp',
  '.cc',
  '.cxx',
  '.c++',
  '.hpp',
  '.hh',
  '.hxx',
  '.ipp',
  '.h',
]);

/**
 * @typedef {Object} CppAnalyzeInput
 * @property {string} runId
 * @property {string} path
 * @property {string} [text]
 * @property {string} [workspaceRoot]
 * @property {string|Record<string, unknown>|null} [cppAst]
 * @property {'compile-db'|'heuristic'} [cppMode]
 * @property {Array<{code: string, message: string}>} [cppWarnings]
 * @property {Record<string, unknown>} [cppHeaderMap]
 * @property {string} [cppToolchain]
 * @property {string} [cppStderr]
 */

export const cppAdapter = {
  id: CPP_ADAPTER_ID,
  displayName: 'C++ (Clang AST)',
  version: CPP_ADAPTER_VERSION,
  languages: ['cpp'],
  extensions: [...CPP_EXTENSIONS],
  capabilities: createCapabilities({
    // Parsing is real (Clang), but configuration and templates can make it
    // incomplete; declarations and calls are therefore honestly partial.
    parse: 'partial',
    discoverDeclarations: true,
    resolveSymbols: 'partial',
    resolveTypes: 'partial',
    resolveCalls: 'partial',
    generateCFG: false,
    generateDFG: false,
    resolveImports: 'partial',
    mapSourceLocations: true,
    reportDiagnostics: true,
  }),

  /**
   * @param {CppAnalyzeInput} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    return mapClangAst({
      runId: input.runId,
      path: input.path,
      text: input.text ?? '',
      workspaceRoot: input.workspaceRoot,
      ast: input.cppAst ?? null,
      mode: input.cppMode ?? 'heuristic',
      warnings: Array.isArray(input.cppWarnings) ? input.cppWarnings : [],
      headerMap: input.cppHeaderMap ?? {},
      toolchain: input.cppToolchain ?? 'clang',
      stderr: input.cppStderr ?? '',
      adapterId: CPP_ADAPTER_ID,
      adapterVersion: CPP_ADAPTER_VERSION,
    });
  },
};
