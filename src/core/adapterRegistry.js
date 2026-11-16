/**
 * Language adapter registry.
 *
 * The registry is the only place that knows which adapters exist. Everything
 * above it (queries, graph construction, rendering, protocol) works from CSR
 * alone.
 *
 * Responsibilities:
 * - registration with capability declaration and extension precedence;
 * - input validation and cancellation plumbing;
 * - fault isolation: a throwing adapter becomes a partial run plus diagnostic;
 * - migration and defensive validation at the boundary;
 * - a dry-run mode that maps files to adapters without analysing anything.
 */

import { createDegradedRun } from './csr/entities.js';
import {
  CancellationError,
  isCancellationRequested,
  tokenFromAbortSignal,
} from './csr/cancellation.js';
import { migrateRun } from './csr/migrate.js';
import { createQueryLayer } from './csr/query.js';
import { CSR_VERSION, CAPABILITY_KEYS, isCompatibleCsrVersion } from './csr/types.js';
import { validateAnalysisRun } from './csr/validate.js';

/** @typedef {import('./csr/entities.js').AnalysisRun} AnalysisRun */

/**
 * @typedef {Object} CapabilitySet
 * @property {boolean|'partial'} parse
 * @property {boolean|'partial'} discoverDeclarations
 * @property {boolean|'partial'} resolveSymbols
 * @property {boolean|'partial'} resolveTypes
 * @property {boolean|'partial'} resolveCalls
 * @property {boolean|'partial'} generateCFG
 * @property {boolean|'partial'} generateDFG
 * @property {boolean|'partial'} resolveImports
 * @property {boolean|'partial'} mapSourceLocations
 * @property {boolean|'partial'} reportDiagnostics
 */

/**
 * @typedef {Object} AdapterDescriptor
 * @property {string} id
 * @property {string} displayName
 * @property {string} version
 * @property {string[]} languages
 * @property {string[]} extensions
 * @property {CapabilitySet} capabilities
 * @property {(input: AnalyzeInput) => AnalysisRun | Promise<AnalysisRun>} analyze
 */

/**
 * @typedef {Object} AnalyzeInput
 * @property {string} runId
 * @property {string} path
 * @property {string} [text]
 * @property {string} [language]
 * @property {string} [workspaceRoot]
 * @property {{readFile: (path: string) => Promise<string>}} [source]
 * @property {import('./csr/cancellation.js').CancellationToken | AbortSignal} [cancellation]
 * @property {(progress: {phase: string, fraction?: number}) => void} [progress]
 */

const CAPABILITY_VALUES = new Set([true, false, 'partial']);

/**
 * @param {Record<string, unknown>} [input]
 * @returns {CapabilitySet}
 */
export function createCapabilities(input = {}) {
  /** @type {Record<string, boolean|'partial'>} */
  const capabilities = {};
  for (const key of CAPABILITY_KEYS) {
    const value = input[key];
    capabilities[key] = CAPABILITY_VALUES.has(value) ? /** @type {boolean|'partial'} */ (value) : false;
  }
  return /** @type {CapabilitySet} */ (capabilities);
}

/**
 * @typedef {Object} AnalyzeSuccess
 * @property {true} ok
 * @property {AnalysisRun} run
 * @property {string} adapterId
 * @property {number} durationMs
 * @property {{code: string, message: string}} [degraded]
 * @property {Array<{path: string, message: string}>} [issues]
 * @property {Array<{collection: string, path: string, id?: string}>} [dropped]
 */

/**
 * @typedef {Object} AnalyzeFailure
 * @property {false} ok
 * @property {'E_UNSUPPORTED'|'E_INPUT'|'E_ADAPTER'|'E_VALIDATION'|'E_VERSION'|'E_LIMIT'} code
 * @property {string} message
 * @property {Array<{path: string, message: string}>} [issues]
 */

/**
 * @returns {{
 *   register: (descriptor: AdapterDescriptor) => void,
 *   list: () => AdapterDescriptor[],
 *   resolve: (filePath: string) => AdapterDescriptor | null,
 *   analyze: (input: AnalyzeInput, options?: {mode?: 'strict'|'defensive'}) => Promise<AnalyzeSuccess | AnalyzeFailure>,
 *   dryRun: (paths: string[]) => {ok: true, value: Array<{path: string, adapterId: string|null}>},
 *   query: (run: AnalysisRun) => ReturnType<typeof createQueryLayer>,
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
    if (typeof descriptor.displayName !== 'string' || descriptor.displayName.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" requires a displayName.`);
    }
    if (typeof descriptor.version !== 'string' || descriptor.version.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" requires a version.`);
    }
    if (!Array.isArray(descriptor.languages) || descriptor.languages.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one language.`);
    }
    const extensions = descriptor.extensions;
    if (!Array.isArray(extensions) || extensions.length === 0) {
      throw new TypeError(`Adapter "${descriptor.id}" must declare at least one file extension.`);
    }
    for (const extension of extensions) {
      if (
        typeof extension !== 'string' ||
        !extension.startsWith('.') ||
        extension !== extension.toLowerCase()
      ) {
        throw new TypeError(
          `Adapter "${descriptor.id}" has an invalid extension "${String(
            extension,
          )}"; use lower case with a leading dot.`,
        );
      }
    }
    if (typeof descriptor.analyze !== 'function') {
      throw new TypeError(`Adapter "${descriptor.id}" must provide an analyze function.`);
    }
    const capabilities = createCapabilities(descriptor.capabilities);
    adapters.set(
      descriptor.id,
      Object.freeze({
        ...descriptor,
        extensions: [...extensions],
        languages: [...descriptor.languages],
        capabilities,
      }),
    );
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
   * Run an adapter and validate its output. Never throws.
   *
   * @param {AnalyzeInput} input
   * @param {{mode?: 'strict'|'defensive'}} [options]
   * @returns {Promise<AnalyzeSuccess | AnalyzeFailure>}
   */
  async function analyze(input, options = {}) {
    const inputIssues = validateInput(input);
    if (inputIssues.length > 0) {
      return {
        ok: false,
        code: 'E_INPUT',
        message: 'Invalid analysis input.',
        issues: inputIssues,
      };
    }

    const adapter = resolve(input.path);
    if (!adapter) {
      return {
        ok: false,
        code: 'E_UNSUPPORTED',
        message: `No adapter is registered for "${input.path}".`,
      };
    }

    const token =
      input.cancellation && typeof input.cancellation === 'object'
        ? 'isCancelled' in input.cancellation
          ? /** @type {import('./csr/cancellation.js').CancellationToken} */ (input.cancellation)
          : tokenFromAbortSignal(/** @type {AbortSignal} */ (input.cancellation))
        : undefined;

    const startedAt = Date.now();
    if (isCancellationRequested(token)) {
      return degraded(adapter, input, startedAt, 'E_CANCELLED', 'Analysis was cancelled.');
    }

    let output;
    try {
      output = await adapter.analyze({ ...input, cancellation: token });
    } catch (error) {
      if (error instanceof CancellationError || isCancellationRequested(token)) {
        return degraded(adapter, input, startedAt, 'E_CANCELLED', 'Analysis was cancelled.');
      }
      return degraded(
        adapter,
        input,
        startedAt,
        'E_ADAPTER',
        `Adapter "${adapter.id}" failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }

    if (isCancellationRequested(token)) {
      return degraded(adapter, input, startedAt, 'E_CANCELLED', 'Analysis was cancelled.');
    }

    if (typeof output !== 'object' || output === null || Array.isArray(output)) {
      return {
        ok: false,
        code: 'E_VALIDATION',
        message: `Adapter "${adapter.id}" did not return an AnalysisRun object.`,
        issues: [{ path: '$', message: 'Adapter output must be an object.' }],
      };
    }

    const candidate = /** @type {Record<string, unknown>} */ (output);
    if (typeof candidate.adapterId !== 'string' || candidate.adapterId.length === 0) {
      candidate.adapterId = adapter.id;
    }
    if (typeof candidate.adapterVersion !== 'string' || candidate.adapterVersion.length === 0) {
      candidate.adapterVersion = adapter.version;
    }

    if (
      typeof candidate.csrVersion === 'string' &&
      isCompatibleCsrVersion(candidate.csrVersion) &&
      candidate.csrVersion !== CSR_VERSION
    ) {
      const migration = migrateRun(candidate, CSR_VERSION);
      if (!migration.ok) {
        return {
          ok: false,
          code: 'E_VERSION',
          message: migration.message,
          issues: migration.issues,
        };
      }
      output = migration.run;
    }

    if (/** @type {Record<string, unknown>} */ (output).runId !== input.runId) {
      return {
        ok: false,
        code: 'E_VALIDATION',
        message: `Adapter "${adapter.id}" returned runId "${String(
          /** @type {Record<string, unknown>} */ (output).runId,
        )}" but the caller requested "${input.runId}".`,
        issues: [{ path: 'runId', message: 'runId must match the caller-supplied value.' }],
      };
    }

    const validation = validateAnalysisRun(output, {
      mode: options.mode ?? 'defensive',
      expectedAdapterId: adapter.id,
    });
    if (!validation.ok) {
      const limitIssue = validation.issues.some((issue) => issue.code === 'E_LIMIT');
      return {
        ok: false,
        code: limitIssue ? 'E_LIMIT' : 'E_VALIDATION',
        message: `Adapter "${adapter.id}" produced invalid CSR.`,
        issues: validation.issues,
      };
    }

    const run = validation.run;
    run.adapterVersion = adapter.version;
    run.language = run.language || input.language || adapter.languages[0];

    /** @type {AnalyzeSuccess} */
    const result = {
      ok: true,
      run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt,
    };
    if (validation.issues.length > 0) {
      result.issues = validation.issues.map((issue) => ({
        path: issue.path,
        message: issue.message,
      }));
    }
    if (validation.dropped.length > 0) {
      result.dropped = validation.dropped.map((entry) => ({
        collection: entry.collection,
        path: entry.path,
        id: entry.id,
      }));
      result.degraded = {
        code: 'E_VALIDATION',
        message: `Dropped ${validation.dropped.length} invalid record(s) from adapter "${adapter.id}".`,
      };
    }
    return result;
  }

  /**
   * @param {AdapterDescriptor} adapter
   * @param {AnalyzeInput} input
   * @param {number} startedAt
   * @param {string} code
   * @param {string} message
   * @returns {AnalyzeSuccess}
   */
  function degraded(adapter, input, startedAt, code, message) {
    const run = createDegradedRun({
      runId: input.runId,
      adapterId: adapter.id,
      adapterVersion: adapter.version,
      language: input.language ?? adapter.languages[0],
      scope: { kind: 'file', path: input.path },
      code,
      message,
    });
    return {
      ok: true,
      run,
      adapterId: adapter.id,
      durationMs: Date.now() - startedAt,
      degraded: { code, message },
    };
  }

  /**
   * @param {string[]} paths
   * @returns {{ok: true, value: Array<{path: string, adapterId: string|null}>}}
   */
  function dryRun(paths) {
    const values = Array.isArray(paths) ? paths : [];
    return {
      ok: true,
      value: values
        .filter((path) => typeof path === 'string')
        .map((path) => ({ path, adapterId: resolve(path)?.id ?? null })),
    };
  }

  /**
   * @param {AnalysisRun} run
   * @returns {ReturnType<typeof createQueryLayer>}
   */
  function query(run) {
    const adapter = adapters.get(run.adapterId);
    return createQueryLayer(run, {
      capabilities: adapter?.capabilities ?? createCapabilities({}),
    });
  }

  return {
    register,
    list: () => [...adapters.values()],
    resolve,
    analyze,
    dryRun,
    query,
    capabilityMatrix: () =>
      [...adapters.values()].map((adapter) => ({
        id: adapter.id,
        languages: [...adapter.languages],
        capabilities: { ...adapter.capabilities },
      })),
  };
}

/**
 * @param {AnalyzeInput} input
 * @returns {Array<{path: string, message: string}>}
 */
function validateInput(input) {
  /** @type {Array<{path: string, message: string}>} */
  const issues = [];
  if (!input || typeof input !== 'object') {
    return [{ path: '$', message: 'Analyze input must be an object.' }];
  }
  if (typeof input.runId !== 'string' || input.runId.length === 0) {
    issues.push({ path: 'runId', message: 'runId must be a non-empty string.' });
  }
  if (typeof input.path !== 'string' || input.path.length === 0) {
    issues.push({ path: 'path', message: 'path must be a non-empty string.' });
  }
  if (input.text !== undefined && typeof input.text !== 'string') {
    issues.push({ path: 'text', message: 'text must be a string when present.' });
  }
  if (typeof input.progress === 'function') {
    // Progress is optional; no validation needed beyond being callable.
  }
  return issues;
}
