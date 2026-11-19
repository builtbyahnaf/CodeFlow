/**
 * Host-side C++ analysis pipeline.
 *
 * This module is the only place that decides how a C++ file is analysed. It
 * discovers a toolchain, reads configuration that already exists, runs Clang
 * through `runTool`, and hands the resulting AST to the pure adapter.
 *
 * It never invokes a build system, never interpolates a shell command, and
 * downgrades every failure into either a typed error before analysis or a
 * partial, diagnosed run afterwards.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { focusRunOnPath } from '../../core/csr/focus.js';
import { isPathInside, toWorkspaceRelative } from '../security/paths.js';
import { CPP_ADAPTER_ID } from '../../adapters/cpp/index.js';
import { buildClangArgs, decideAnalysisConfig } from './analysisConfig.js';
import { discoverClang } from './clang.js';
import { discoverCompileDb } from './compileDb.js';
import { buildHeaderMap, extractIncludes, isHeaderPath } from './headers.js';

export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;
export const DEFAULT_MAX_TU_BYTES = 4 * 1024 * 1024;
export const DEFAULT_MAX_HEADER_CANDIDATES = 200;
export const DISCOVERY_TTL_MS = 30_000;

/**
 * @typedef {import('../../core/adapterRegistry.js').AnalyzeSuccess} AnalyzeSuccess
 * @typedef {import('../../core/adapterRegistry.js').AnalyzeFailure} AnalyzeFailure
 * @typedef {import('../../core/csr/entities.js').AnalysisRun} AnalysisRun
 */

/**
 * @typedef {Object} CppSettings
 * @property {string} [clangPath]
 * @property {string} [compileCommandsPath]
 * @property {string[]} [fallbackIncludePaths]
 * @property {string[]} [fallbackDefines]
 * @property {string} [fallbackStandard]
 * @property {number} [timeoutMs]
 * @property {number} [maxOutputBytes]
 * @property {number} [maxTuBytes]
 */

/**
 * @typedef {Object} PreparedCpp
 * @property {string} targetPath
 * @property {string} focusPath
 * @property {boolean} focused
 * @property {Record<string, unknown>} input
 */

/**
 * @param {{
 *   registry: ReturnType<typeof import('../../core/adapterRegistry.js').createAdapterRegistry>,
 *   runTool: typeof import('../tooling/runTool.js').runTool,
 *   readFile?: typeof fs.readFile,
 *   readDir?: typeof fs.readdir,
 *   settings?: CppSettings | (() => CppSettings),
 *   logger?: {debug?: Function, warn?: Function, error?: Function},
 *   discoverClangFn?: typeof discoverClang,
 *   discoverCompileDbFn?: typeof discoverCompileDb,
 *   now?: () => number,
 *   platform?: NodeJS.Platform,
 * }} options
 */
export function createCppAnalysisService(options) {
  const {
    registry,
    runTool,
    readFile = fs.readFile,
    readDir = fs.readdir,
    logger = {},
    discoverClangFn = discoverClang,
    discoverCompileDbFn = discoverCompileDb,
    now = () => Date.now(),
    platform = process.platform,
  } = options;

  /** @type {Map<string, {at: number, value: any}>} */
  const compileCache = new Map();
  /** @type {Map<string, {at: number, value: any}>} */
  const clangCache = new Map();

  function currentSettings() {
    const value = typeof options.settings === 'function' ? options.settings() : options.settings;
    return normalizeSettings(value ?? {});
  }

  /**
   * @param {{path: string, runId: string, workspaceRoot: string, trusted?: boolean, cancellation?: unknown}} input
   * @returns {Promise<AnalyzeSuccess | AnalyzeFailure>}
   */
  async function analyze(input) {
    const adapter = registry.resolve(input?.path ?? '');
    if (!adapter || adapter.id !== CPP_ADAPTER_ID) {
      return registry.analyze(input);
    }
    let prepared;
    try {
      prepared = await prepare(input);
    } catch (error) {
      logger.error?.('cpp.prepare_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        ok: false,
        code: 'E_INTERNAL',
        message: `C++ analysis could not be prepared: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
    if (!prepared.ok) {
      return prepared;
    }

    const result = await registry.analyze(prepared.value.input);
    if (!result.ok || !prepared.value.focused) {
      return result;
    }

    const focused = focusRunOnPath(result.run, prepared.value.focusPath);
    focused.run.completeness = 'partial';
    focused.run.diagnostics = [
      ...focused.run.diagnostics,
      {
        severity: 'info',
        code: 'out_of_scope',
        message: `The header was analysed through the representative translation unit "${prepared.value.targetPath}". Declarations from other files are excluded.`,
        affects: [],
      },
    ];
    return { ...result, run: focused.run };
  }

  /**
   * @param {{path: string, runId: string, workspaceRoot: string, trusted?: boolean, cancellation?: unknown}} input
   * @returns {Promise<{ok: true, value: PreparedCpp} | AnalyzeFailure>}
   */
  async function prepare(input) {
    const settings = currentSettings();
    if (!input || typeof input !== 'object') {
      return failure('E_INPUT', 'Analysis input must be an object.');
    }
    const workspaceRoot = input.workspaceRoot;
    if (typeof workspaceRoot !== 'string' || workspaceRoot.length === 0) {
      return failure('E_INPUT', 'Open a workspace folder before analysing C++ files.');
    }
    if (input.trusted === false) {
      return failure(
        'E_UNTRUSTED',
        'CodeFlow does not read workspace files in Restricted Mode. Trust the workspace first.',
      );
    }
    if (typeof input.path !== 'string' || input.path.length === 0) {
      return failure('E_INPUT', 'A file path is required.');
    }
    if (input.path.includes('\u0000')) {
      return failure('E_INPUT', 'The file path contains an invalid character.');
    }

    const absolutePath = path.isAbsolute(input.path)
      ? path.normalize(input.path)
      : path.resolve(workspaceRoot, input.path);
    if (!isPathInside(workspaceRoot, absolutePath, platform)) {
      return failure('E_INPUT', 'The file is outside the workspace.');
    }
    let relativePath;
    try {
      relativePath = toWorkspaceRelative(workspaceRoot, absolutePath, platform);
    } catch {
      return failure('E_INPUT', 'The file is outside the workspace.');
    }

    const source = await readSource(absolutePath, settings.maxTuBytes);
    if (!source.ok) {
      return failure('E_INPUT', source.message);
    }

    const [compileDb, clang] = await Promise.all([
      getCompileDb(workspaceRoot, settings),
      getClang(settings),
    ]);
    if (!clang.ok) {
      return failure(clang.code, clang.message);
    }

    /** @type {string} */
    let targetAbsolute = absolutePath;
    /** @type {string} */
    let targetPath = relativePath;
    /** @type {string} */
    let targetText = source.text;
    /** @type {Record<string, unknown>} */
    let headerMap = {};
    const warnings = [];
    const header = isHeaderPath(relativePath);

    if (header && compileDb.ok && compileDb.choice.entries.length > 0) {
      const includesByTu = await readIncludesForEntries(
        workspaceRoot,
        compileDb.choice.entries,
        settings,
      );
      const mapped = buildHeaderMap({
        headerPaths: [relativePath],
        entries: compileDb.choice.entries,
        includesByTu,
      });
      const choice = mapped.map[relativePath];
      if (choice) {
        const entry = compileDb.choice.entries.find(
          (candidate) => candidate.path === choice.tuPath,
        );
        if (entry) {
          targetAbsolute = entry.absoluteFile;
          targetPath = entry.path;
          const tuSource = await readSource(targetAbsolute, settings.maxTuBytes);
          if (!tuSource.ok) {
            return failure('E_INPUT', tuSource.message);
          }
          targetText = tuSource.text;
          headerMap = { [relativePath]: choice };
        }
      } else {
        pushWarning(
          warnings,
          'header_without_tu',
          `No translation unit in the compilation database includes "${relativePath}". The header is analysed syntactically and may be incomplete.`,
        );
      }
    } else if (header) {
      pushWarning(
        warnings,
        'header_without_tu',
        `No translation unit was available for "${relativePath}". The header is analysed syntactically and may be incomplete.`,
      );
    }

    const config = decideAnalysisConfig({
      absoluteFile: targetAbsolute,
      compileDb: compileDb.ok ? compileDb.choice : null,
      settings: {
        includePaths: settings.fallbackIncludePaths,
        defines: settings.fallbackDefines,
        standard: settings.fallbackStandard || undefined,
      },
      platform,
    });
    for (const warning of config.warnings) {
      pushWarning(warnings, warning.code, warning.message);
    }
    if (!clang.clang.compatible) {
      pushWarning(
        warnings,
        'toolchain_version_mismatch',
        `Clang ${clang.clang.version} is outside the supported range. Results may be incomplete.`,
      );
    }

    const args = buildClangArgs({
      absoluteFile: targetAbsolute,
      config,
    });

    const tool = await runTool({
      command: clang.clang.path,
      args,
      cwd: workspaceRoot,
      timeoutMs: settings.timeoutMs,
      maxOutputBytes: settings.maxOutputBytes,
      ...(isAbortSignal(input.cancellation) ? { signal: input.cancellation } : {}),
    });

    let ast = null;
    let stderr = '';
    if (tool.ok) {
      stderr = sanitizeDiagnostics(tool.stderr ?? '', workspaceRoot, targetAbsolute, targetPath);
      if (typeof tool.stdout === 'string' && tool.stdout.trim().length > 0) {
        try {
          ast = JSON.parse(tool.stdout);
        } catch {
          pushWarning(
            warnings,
            'parse_error',
            'Clang produced output that was not a complete JSON AST; the run is limited to diagnostics.',
          );
        }
      }
      if (/file not found/i.test(tool.stderr ?? '')) {
        pushWarning(
          warnings,
          'missing_system_headers',
          'Clang could not find one or more headers. Add the include paths your build uses, or generate a compilation database.',
        );
      }
    } else if (tool.code === 'E_TOOL_NOT_FOUND') {
      return failure('E_UNSUPPORTED', tool.message);
    } else if (tool.code === 'E_TOOL_TIMEOUT') {
      pushWarning(
        warnings,
        'budget_exceeded',
        tool.message || 'Clang exceeded the analysis time budget.',
      );
      stderr = sanitizeDiagnostics(tool.stderr ?? '', workspaceRoot, targetAbsolute, targetPath);
    } else if (tool.code === 'E_TOOL_LIMIT') {
      pushWarning(
        warnings,
        'budget_exceeded',
        tool.message || 'The AST exceeded the output size budget.',
      );
      stderr = sanitizeDiagnostics(tool.stderr ?? '', workspaceRoot, targetAbsolute, targetPath);
    } else if (tool.code === 'E_CANCELLED') {
      pushWarning(warnings, 'cancelled', 'The analysis was cancelled.');
    } else {
      pushWarning(warnings, 'adapter_error', tool.message || 'Clang could not be executed.');
    }

    const focused = header && targetPath !== relativePath;
    return {
      ok: true,
      value: {
        targetPath,
        focusPath: focused ? relativePath : relativePath,
        focused,
        input: {
          ...input,
          path: relativePath,
          workspaceRoot,
          text: targetText,
          cppAst: ast,
          cppMode: config.mode,
          cppWarnings: warnings,
          cppHeaderMap: headerMap,
          cppToolchain: `clang ${clang.clang.version}`,
          cppStderr: stderr.slice(0, 16 * 1024),
        },
      },
    };
  }

  /**
   * @param {string} workspaceRoot
   * @param {CppSettings} settings
   */
  async function getCompileDb(workspaceRoot, settings) {
    const key = `${workspaceRoot}|${settings.compileCommandsPath}`;
    const cached = compileCache.get(key);
    if (cached && now() - cached.at < DISCOVERY_TTL_MS) {
      return cached.value;
    }
    const value = await discoverCompileDbFn({
      workspaceRoot,
      configuredPath: settings.compileCommandsPath,
      readFile,
      readDir,
    });
    compileCache.set(key, { at: now(), value });
    return value;
  }

  /**
   * @param {CppSettings} settings
   */
  async function getClang(settings) {
    const key = settings.clangPath;
    const cached = clangCache.get(key);
    if (cached && now() - cached.at < DISCOVERY_TTL_MS) {
      return cached.value;
    }
    const value = await discoverClangFn({ runTool, configuredPath: key });
    clangCache.set(key, { at: now(), value });
    return value;
  }

  /**
   * Read the TUs in the compilation database so headers can be mapped to one
   * representative unit. The number of candidates is bounded; a large project
   * degrades to a syntactic header analysis rather than reading everything.
   *
   * @param {string} workspaceRoot
   * @param {import('./compileDb.js').CompileEntry[]} entries
   * @param {CppSettings} settings
   */
  async function readIncludesForEntries(workspaceRoot, entries, settings) {
    /** @type {Record<string, import('./headers.js').IncludeDirective[]>} */
    const includesByTu = {};
    const candidates = [...entries]
      .filter((entry) => isPathInside(workspaceRoot, entry.absoluteFile, platform))
      .sort((left, right) => left.path.localeCompare(right.path))
      .slice(0, DEFAULT_MAX_HEADER_CANDIDATES);
    for (const entry of candidates) {
      const text = await readSource(entry.absoluteFile, settings.maxTuBytes);
      if (text.ok) {
        includesByTu[entry.path] = extractIncludes(text.text);
      }
    }
    return includesByTu;
  }

  /**
   * @param {string} absolutePath
   * @param {number} maxBytes
   * @returns {Promise<{ok: true, text: string} | {ok: false, message: string}>}
   */
  async function readSource(absolutePath, maxBytes) {
    let text;
    try {
      text = await readFile(absolutePath, 'utf8');
    } catch {
      return { ok: false, message: `Could not read "${path.basename(absolutePath)}".` };
    }
    if (typeof text !== 'string') {
      return { ok: false, message: `Could not read "${path.basename(absolutePath)}" as text.` };
    }
    if (Buffer.byteLength(text, 'utf8') > maxBytes) {
      return {
        ok: false,
        message: `"${path.basename(absolutePath)}" is larger than the ${Math.round(
          maxBytes / (1024 * 1024),
        )} MiB analysis budget.`,
      };
    }
    return { ok: true, text };
  }

  return {
    analyze,
    prepare,
    reset() {
      compileCache.clear();
      clangCache.clear();
    },
    /** Test/telemetry hook. */
    cacheSizes: () => ({ compile: compileCache.size, clang: clangCache.size }),
  };
}

/**
 * @param {unknown} value
 * @returns {value is AbortSignal}
 */
function isAbortSignal(value) {
  return Boolean(value) && typeof value === 'object' && 'aborted' in value;
}

/**
 * @param {string} code
 * @param {string} message
 * @returns {AnalyzeFailure}
 */
function failure(code, message) {
  return { ok: false, code, message };
}

/**
 * @param {CppSettings} input
 */
function normalizeSettings(input) {
  return {
    clangPath: typeof input.clangPath === 'string' ? input.clangPath.trim() : '',
    compileCommandsPath:
      typeof input.compileCommandsPath === 'string' ? input.compileCommandsPath.trim() : '',
    fallbackIncludePaths: stringArray(input.fallbackIncludePaths),
    fallbackDefines: stringArray(input.fallbackDefines),
    fallbackStandard: typeof input.fallbackStandard === 'string' ? input.fallbackStandard : '',
    timeoutMs:
      Number.isFinite(input.timeoutMs) && input.timeoutMs > 0
        ? input.timeoutMs
        : DEFAULT_TIMEOUT_MS,
    maxOutputBytes:
      Number.isFinite(input.maxOutputBytes) && input.maxOutputBytes > 0
        ? input.maxOutputBytes
        : DEFAULT_MAX_OUTPUT_BYTES,
    maxTuBytes:
      Number.isFinite(input.maxTuBytes) && input.maxTuBytes > 0
        ? input.maxTuBytes
        : DEFAULT_MAX_TU_BYTES,
  };
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
function stringArray(value) {
  return Array.isArray(value)
    ? value.filter((entry) => typeof entry === 'string' && entry.length > 0)
    : [];
}

/**
 * @param {Array<{code: string, message: string}>} warnings
 * @param {string} code
 * @param {string} message
 */
function pushWarning(warnings, code, message) {
  if (!warnings.some((warning) => warning.code === code && warning.message === message)) {
    warnings.push({ code, message });
  }
}

/**
 * Keep diagnostics actionable: no absolute workspace paths, no giant dumps.
 *
 * @param {string} text
 * @param {string} workspaceRoot
 * @param {string} absoluteFile
 * @param {string} relativeFile
 * @returns {string}
 */
function sanitizeDiagnostics(text, workspaceRoot, absoluteFile, relativeFile) {
  if (typeof text !== 'string' || text.length === 0) {
    return '';
  }
  const forms = (value) => [String(value), String(value).replace(/\\/g, '/')];
  let output = text;
  for (const form of forms(absoluteFile)) {
    output = output.split(form).join(relativeFile);
  }
  for (const form of forms(workspaceRoot)) {
    output = output.split(form).join('<workspace>');
  }
  return output.slice(0, 32 * 1024);
}
