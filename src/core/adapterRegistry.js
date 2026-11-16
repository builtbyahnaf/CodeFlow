/**
 * Language adapter registry.
 *
 * The registry is the only place that knows which adapters exist. Everything
 * above it (graph building, rendering, protocol) must work from CSR alone.
 *
 * Phase 0 registers a mock adapter. Phases 2 and 3 register real ones without
 * changing this file or any consumer.
 */

import { validateAnalysisRun } from './csr/entities.js';

/** @typedef {import('./csr/entities.js').AnalysisRun} AnalysisRun */

/**
 * @typedef {Object} CapabilitySet
 * @property {boolean} parse
 * @property {boolean} discoverDeclarations
 * @property {boolean} resolveSymbols
 * @property {boolean} resolveTypes
 * @property {boolean} resolveCalls
 * @property {boolean} generateCFG
 * @property {boolean} generateDFG
 * @property {boolean} resolveImports
 * @property {boolean} mapSourceLocations
 * @property {boolean} reportDiagnostics
 */

/**
 * @typedef {Object} AdapterDescriptor
 * @property {string} id
 * @property {string} displayName
 * @property {string} version
 * @property {string[]} languages
 * @property {string[]} extensions      lower case, including the leading dot
 * @property {CapabilitySet} capabilities
 * @property {(input: {path: string, text?: string, runId: string, workspaceRoot?: string}) => AnalysisRun | Promise<AnalysisRun>} analyze
 */

const CAPABILITY_KEYS = [
  'parse',
  'discoverDeclarations',
  'resolveSymbols',
  'resolveTypes',
  'resolveCalls',
  'generateCFG',
  'generateDFG',
  'resolveImports',
  'mapSourceLocations',
  'reportDiagnostics',
];

/**
 * @param {Partial<CapabilitySet>} [input]
 * @returns {CapabilitySet}
 */
export function createCapabilities(input = {}) {
  /** @type {Record<string, boolean>} */
  const capabilities = {};
  for (const key of CAPABILITY_KEYS) {
    capabilities[key] = input[key] === true;
  }
  return /** @type {CapabilitySet} */ (capabilities);
}

/**
 * @typedef {Object} AnalyzeSuccess
 * @property {true} ok
 * @property {AnalysisRun} run
 * @property {string} adapterId
 * @property {string} durationMs
 */

/**
 * @typedef {Object} AnalyzeFailure
 * @property {false} ok
 * @property {'E_UNSUPPORTED'|'E_ADAPTER'|'E_VALIDATION'} code
 * @property {string} message
 * @property {Array<{path: string, message: string}>} [issues]
 */

/**
 * @returns {{
 *   register: (descriptor: AdapterDescriptor) => void,
 *   list: () => AdapterDescriptor[],
 *   resolve: (filePath: string) => AdapterDescriptor | null,
 *   analyze: (input: {path: string, text?: string, runId: string, workspaceRoot?: string}) => Promise<AnalyzeSuccess | AnalyzeFailure>,
 *   capabilityMatrix: () => Array<{id: string, languages: string[], capabilities: CapabilitySet}>,
 * }}
 */
export function createAdapterRegistry() {
  /** @type {Map<string, AdapterDescriptor>} */
  const adapters = new Map();

  /**
   * @param {AdapterDescriptor} descriptor
   */
  function register(descriptor) {
    if (!descriptor || typeof descriptor !== 'object') {
      throw new TypeError('Adapter descriptor must be an object.');
    }
    if (typeof descriptor.id !== 'string' || descriptor.id.length === 0) {
      throw new TypeError('Adapter descriptor requires a non-empty id.');
    }
    if (adapters.has(descriptor.id)) {
      throw new Error(`Adapter "${descriptor.id}" is already registered.`);
    }
    if (!Array.isArray(descriptor.extensions) || descriptor.extensions.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one file extension.`);
    }
    for (const extension of descriptor.extensions) {
      if (typeof extension !== 'string' || !extension.startsWith('.') || extension !== extension.toLowerCase()) {
        throw new TypeError(
          `Adapter "${descriptor.id}" has an invalid extension "${String(extension)}"; use lower case with a leading dot.`,
        );
      }
    }
    if (typeof descriptor.analyze !== 'function') {
      throw new TypeError(`Adapter "${descriptor.id}" must provide an analyze function.`);
    }
    const capabilities = createCapabilities(descriptor.capabilities);
    adapters.set(descriptor.id, Object.freeze({ ...descriptor, capabilities }));
  }

  /**
   * Longest extension wins so that a future `.d.ts` adapter can coexist with `.ts`.
   *
   * @param {string} filePath
   * @returns {AdapterDescriptor | null}
   */
  function resolve(filePath) {
    if (typeof filePath !== 'string' || filePath.length === 0) {
      return null;
    }
    const lower = filePath.toLowerCase();
    let best = null;
    let bestLength = 0;
    for (const adapter of adapters.values()) {
      for (const extension of adapter.extensions) {
        if (lower.endsWith(extension) && extension.length > bestLength) {
          best = adapter;
          bestLength = extension.length;
        }
      }
    }
    return best;
  }

  /**
   * Run an adapter and validate its output. Never throws: a misbehaving
   * adapter becomes a typed failure with a diagnostic, not a crashed host.
   *
   * @param {{path: string, text?: string, runId: string, workspaceRoot?: string}} input
   * @returns {Promise<AnalyzeSuccess | AnalyzeFailure>}
   */
  async function analyze(input) {
    const adapter = resolve(input.path);
    if (!adapter) {
      return {
        ok: false,
        code: 'E_UNSUPPORTED',
        message: `No adapter is registered for "${input.path}".`,
      };
    }

    const startedAt = Date.now();
    let output;
    try {
      output = await adapter.analyze(input);
    } catch (error) {
      return {
        ok: false,
        code: 'E_ADAPTER',
        message: `Adapter "${adapter.id}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }

    const validation = validateAnalysisRun(output);
    if (!validation.ok) {
      return {
        ok: false,
        code: 'E_VALIDATION',
        message: `Adapter "${adapter.id}" produced invalid CSR.`,
        issues: validation.issues,
      };
    }

    return {
      ok: true,
      run: validation.run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt,
    };
  }

  return {
    register,
    list: () => [...adapters.values()],
    resolve,
    analyze,
    capabilityMatrix: () =>
      [...adapters.values()].map((adapter) => ({
        id: adapter.id,
        languages: [...adapter.languages],
        capabilities: { ...adapter.capabilities },
      })),
  };
}
