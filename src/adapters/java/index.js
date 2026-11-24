/**
 * Java Language Adapter (Phase 14 §3, P14-01, AC-14.1).
 *
 * Implements the standard adapter contract for Java source files (.java)
 * mapping object-oriented class hierarchies, polymorphic virtual dispatch,
 * exception flows, and control-flow graphs into CSR.
 */

import { createCapabilities } from '../../core/adapterRegistry.js';
import { mapJavaAst } from './mapper.js';

export const JAVA_ADAPTER_ID = 'java-ast';
export const JAVA_ADAPTER_VERSION = '0.1.0';

export const JAVA_EXTENSIONS = Object.freeze(['.java']);

/**
 * @typedef {Object} JavaAnalyzeInput
 * @property {string} runId
 * @property {string} path
 * @property {string} [text]
 * @property {string} [workspaceRoot]
 * @property {string|Record<string, unknown>|null} [javaAst]
 * @property {'compile-db'|'heuristic'} [javaMode]
 * @property {Array<{code: string, message: string}>} [javaWarnings]
 */

export const javaAdapter = {
  id: JAVA_ADAPTER_ID,
  displayName: 'Java (AST)',
  version: JAVA_ADAPTER_VERSION,
  languages: ['java'],
  extensions: [...JAVA_EXTENSIONS],
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
   * @param {JavaAnalyzeInput} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    return mapJavaAst({
      runId: input.runId,
      path: input.path,
      text: input.text ?? '',
      workspaceRoot: input.workspaceRoot,
      ast: input.javaAst ?? null,
      mode: input.javaMode ?? 'heuristic',
      warnings: Array.isArray(input.javaWarnings) ? input.javaWarnings : [],
      adapterId: JAVA_ADAPTER_ID,
      adapterVersion: JAVA_ADAPTER_VERSION,
    });
  },
};

export * from './packages.js';
export * from './hierarchy.js';
export * from './dispatch.js';
export * from './constructs.js';
export * from './mapper.js';
