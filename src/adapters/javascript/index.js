/**
 * JavaScript language adapter.
 *
 * Parsing and scope analysis happen inside the adapter because they are pure
 * JavaScript. The host decides the module kind and resolves relative module
 * requests; it passes already-read text so the adapter never touches the file
 * system or executes workspace code.
 */

import { createCapabilities } from '../../core/adapterRegistry.js';
import { createAnalysisRun, createDiagnostic } from '../../core/csr/entities.js';
import { isJsxPath, isTypeScriptPath } from './moduleKind.js';
import { mapJavaScript } from './mapper.js';

export const JS_ADAPTER_ID = 'js-acorn';
export const JS_ADAPTER_VERSION = '0.1.0';

/** TypeScript/TSX are listed only to return an explicit rejection. */
export const JS_EXTENSIONS = Object.freeze([
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.ts',
  '.mts',
  '.cts',
  '.tsx',
]);

/**
 * @param {{runId: string, path: string, code: string, message: string, language?: string}} input
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
function rejectedRun(input) {
  return createAnalysisRun({
    runId: input.runId,
    adapterId: JS_ADAPTER_ID,
    adapterVersion: JS_ADAPTER_VERSION,
    language: input.language ?? 'javascript',
    scope: { kind: 'file', path: input.path },
    completeness: 'partial',
    diagnostics: [
      createDiagnostic({
        severity: 'error',
        code: input.code,
        message: input.message,
        affects: [],
      }),
    ],
    extensions: { rejected: true },
  });
}

/**
 * @typedef {Object} JavaScriptAnalyzeInput
 * @property {string} runId
 * @property {string} path
 * @property {string} [text]
 * @property {'module'|'script'} [jsModuleKind]
 * @property {Array<{path: string, text: string, moduleKind: 'module'|'script', json?: boolean}>} [jsModules]
 * @property {Array<{from: string, specifier: string, status: string, path?: string, reasonCode?: string, message?: string}>} [jsResolutions]
 * @property {boolean} [jsSyntaxOnly]
 * @property {Array<{severity?: string, code?: string, message: string}>} [jsDiagnostics]
 */

export const javascriptAdapter = {
  id: JS_ADAPTER_ID,
  displayName: 'JavaScript (acorn + eslint-scope)',
  version: JS_ADAPTER_VERSION,
  languages: ['javascript'],
  extensions: [...JS_EXTENSIONS],
  capabilities: createCapabilities({
    parse: 'partial',
    discoverDeclarations: true,
    resolveSymbols: 'partial',
    resolveTypes: false,
    resolveCalls: 'partial',
    generateCFG: true,
    generateDFG: false,
    resolveImports: 'partial',
    mapSourceLocations: true,
    reportDiagnostics: true,
  }),

  /**
   * @param {JavaScriptAnalyzeInput} input
   * @returns {import('../../core/csr/entities.js').AnalysisRun}
   */
  analyze(input) {
    const path = String(input?.path ?? '');
    if (isTypeScriptPath(path)) {
      return rejectedRun({
        runId: input.runId,
        path,
        language: 'typescript',
        code: 'unsupported_language',
        message:
          'TypeScript is not analysed in V1. Use a JavaScript build output or wait for the TypeScript adapter.',
      });
    }
    if (isJsxPath(path)) {
      return rejectedRun({
        runId: input.runId,
        path,
        code: 'unsupported_syntax',
        message: 'JSX and TSX are not supported in V1. The file was not partially analysed.',
      });
    }
    return mapJavaScript({
      runId: input.runId,
      path,
      text: typeof input.text === 'string' ? input.text : undefined,
      adapterId: JS_ADAPTER_ID,
      adapterVersion: JS_ADAPTER_VERSION,
      moduleKind: input.jsModuleKind ?? 'module',
      modules: Array.isArray(input.jsModules) ? input.jsModules : [],
      resolutions: Array.isArray(input.jsResolutions) ? input.jsResolutions : [],
      syntaxOnly: input.jsSyntaxOnly === true,
      diagnostics: Array.isArray(input.jsDiagnostics) ? input.jsDiagnostics : [],
    });
  },
};
