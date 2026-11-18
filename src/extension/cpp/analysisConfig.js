/**
 * Decide how a translation unit is configured and build the Clang argv.
 *
 * The argv is assembled as an array and never passed through a shell. Flags
 * that can load a compiler plugin or a response file are dropped: analysis must
 * not be a code-execution vector for a workspace.
 */

import path from 'node:path';

import {
  extractDefines,
  extractIncludePaths,
  heuristicFlags,
  matchCompileEntry,
} from './compileDb.js';

/**
 * @typedef {import('./compileDb.js').CompileEntry} CompileEntry
 * @typedef {import('./compileDb.js').CompileDbChoice} CompileDbChoice
 */

/**
 * @typedef {Object} AnalysisConfig
 * @property {'compile-db'|'heuristic'} mode
 * @property {string[]} flags
 * @property {CompileEntry | null} entry
 * @property {Array<{code: string, message: string}>} warnings
 */

/**
 * @param {{
 *   absoluteFile: string,
 *   compileDb?: CompileDbChoice | null,
 *   settings?: {
 *     includePaths?: string[],
 *     defines?: string[],
 *     standard?: string,
 *   },
 *   platform?: NodeJS.Platform,
 * }} options
 * @returns {AnalysisConfig}
 */
export function decideAnalysisConfig({ absoluteFile, compileDb, settings = {}, platform }) {
  const entry = compileDb ? matchCompileEntry(compileDb.entries, absoluteFile, platform) : null;
  if (entry) {
    return {
      mode: 'compile-db',
      flags: [...entry.flags],
      entry,
      warnings: [],
    };
  }

  return {
    mode: 'heuristic',
    flags: heuristicFlags({
      includePaths: settings.includePaths ?? [],
      defines: settings.defines ?? [],
      standard: settings.standard ?? standardForFile(absoluteFile),
    }),
    entry: null,
    warnings: [
      {
        code: 'missing_compile_db',
        message:
          'No compilation database entry covers this file. Flags are inferred, so system headers and macros may be unresolved.',
      },
    ],
  };
}

/**
 * @param {string} absoluteFile
 * @returns {string}
 */
export function standardForFile(absoluteFile) {
  return /\.(c|h)$/i.test(absoluteFile) ? 'c11' : 'c++17';
}

/**
 * Build the Clang argument array for one translation unit.
 *
 * @param {{
 *   absoluteFile: string,
 *   config: AnalysisConfig,
 *   extraArgs?: string[],
 * }} options
 * @returns {string[]}
 */
export function buildClangArgs({ absoluteFile, config, extraArgs = [] }) {
  /** @type {string[]} */
  const args = [];
  const sanitized = sanitizeFlags(config.flags);

  if (!sanitized.some((flag) => flag.startsWith('-std='))) {
    const standard = standardForFile(absoluteFile);
    args.push(`-std=${standard}`);
  }
  args.push('-fsyntax-only');
  args.push(...extraArgs);
  args.push('-Xclang', '-ast-dump=json');
  args.push(...sanitized);
  args.push(absoluteFile);
  return args;
}

/**
 * Drop flags that can execute code or read arbitrary response files. This is a
 * conservative denylist, not a claim that every remaining flag is harmless.
 *
 * @param {string[]} flags
 * @returns {string[]}
 */
export function sanitizeFlags(flags) {
  /** @type {string[]} */
  const output = [];
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (typeof flag !== 'string' || flag.length === 0) {
      continue;
    }
    if (flag.startsWith('@')) {
      continue; // response file: contents are not validated by the compile DB
    }
    if (flag === '-Xclang') {
      const next = flags[index + 1];
      if (next === '-load' || next === '-plugin' || next === '-add-plugin') {
        // Consume the option and its path. Clang accepts either
        // `-Xclang -load -Xclang PATH` or `-Xclang -load PATH`.
        index += flags[index + 2] === '-Xclang' ? 4 : 2;
        continue;
      }
      // Ordinary -Xclang pairs are used for AST options ourselves.
      output.push(flag);
      continue;
    }
    if (flag.startsWith('-fplugin=') || flag.startsWith('-load')) {
      continue;
    }
    if (flag === '-fplugin') {
      index += 1;
      continue;
    }
    if (flag === '-o' || flag === '/o' || flag === '/Fo') {
      index += 1;
      continue;
    }
    if (flag === '-MJ' || flag === '--serialize-diagnostics') {
      index += 1;
      continue;
    }
    if (flag.startsWith('-MJ')) {
      continue;
    }
    output.push(flag);
  }
  return output;
}

/**
 * Convenience for callers that need the include roots and defines of the
 * chosen configuration (header mapping and diagnostics).
 *
 * @param {AnalysisConfig} config
 * @param {string} workspaceRoot
 * @returns {{includePaths: string[], defines: string[], standard: string|null}}
 */
export function describeConfig(config, workspaceRoot) {
  const includePaths = extractIncludePaths(config.flags).map((entry) =>
    path.isAbsolute(entry) ? path.normalize(entry) : path.resolve(workspaceRoot, entry),
  );
  return {
    includePaths,
    defines: extractDefines(config.flags),
    standard: config.flags.find((flag) => flag.startsWith('-std='))?.slice(5) ?? null,
  };
}
