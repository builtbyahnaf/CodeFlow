/**
 * Compilation-database discovery and parsing.
 *
 * CodeFlow reads `compile_commands.json`; it never invokes CMake, Make, Ninja,
 * or a build script. A missing or malformed database degrades to heuristic mode
 * rather than guessing that a project is configured.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

export const COMPILE_COMMANDS_FILENAME = 'compile_commands.json';
export const MAX_SEARCH_DEPTH = 3;

/**
 * @typedef {Object} CompileEntry
 * @property {string} directory      Absolute working directory
 * @property {string} absoluteFile   Absolute source path
 * @property {string} path           Workspace-relative, forward slashes when inside
 * @property {string[]} arguments    Full argument vector from the database
 * @property {string[]} flags        Arguments minus compiler/source/output
 */

/**
 * @typedef {Object} CompileDbChoice
 * @property {string} path
 * @property {CompileEntry[]} entries
 */

/**
 * Parse a compile database. Invalid entries are skipped with an issue; a
 * non-array document is rejected.
 *
 * @param {unknown} json
 * @param {string} workspaceRoot
 * @returns {{ok: true, entries: CompileEntry[], issues: string[]} | {ok: false, code: 'E_COMPILE_DB', message: string, issues?: string[]}}
 */
export function parseCompileCommands(json, workspaceRoot) {
  if (!Array.isArray(json)) {
    return {
      ok: false,
      code: 'E_COMPILE_DB',
      message: 'compile_commands.json must contain an array.',
    };
  }

  /** @type {CompileEntry[]} */
  const entries = [];
  /** @type {string[]} */
  const issues = [];

  for (let index = 0; index < json.length; index += 1) {
    const raw = json[index];
    if (!raw || typeof raw !== 'object') {
      issues.push(`entries[${index}] is not an object`);
      continue;
    }
    const record = /** @type {Record<string, unknown>} */ (raw);
    const directory = typeof record.directory === 'string' ? record.directory : '';
    const file = typeof record.file === 'string' ? record.file : '';
    if (directory.length === 0 || file.length === 0) {
      issues.push(`entries[${index}] is missing directory or file`);
      continue;
    }

    /** @type {string[]} */
    let args = [];
    if (
      Array.isArray(record.arguments) &&
      record.arguments.every((arg) => typeof arg === 'string')
    ) {
      args = [...record.arguments];
    } else if (typeof record.command === 'string') {
      args = splitCommandLine(record.command);
    }
    if (args.length === 0) {
      issues.push(`entries[${index}] has neither arguments nor a usable command`);
      continue;
    }

    const absoluteFile = path.isAbsolute(file)
      ? path.normalize(file)
      : path.resolve(directory, file);
    const relative = path.relative(workspaceRoot, absoluteFile);
    entries.push({
      directory,
      absoluteFile,
      path: toPosix(relative),
      arguments: args,
      flags: flagsFromArguments(args, absoluteFile, file),
    });
  }

  return { ok: true, entries, issues };
}

/**
 * Tokenize a compile command without invoking a shell. Quotes group tokens;
 * backslashes are preserved except before a quote, which keeps Windows paths
 * such as `C:\work\src` intact.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function splitCommandLine(text) {
  /** @type {string[]} */
  const tokens = [];
  let current = '';
  let quote = '';
  let started = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quote) {
      if (character === quote) {
        quote = '';
      } else if (character === '\\' && index + 1 < text.length && text[index + 1] === quote) {
        current += quote;
        index += 1;
      } else {
        current += character;
      }
      continue;
    }
    if (character === '"' || character === "'") {
      quote = character;
      started = true;
      continue;
    }
    if (character === ' ' || character === '\t' || character === '\r' || character === '\n') {
      if (started) {
        tokens.push(current);
        current = '';
        started = false;
      }
      continue;
    }
    current += character;
    started = true;
  }
  if (started) {
    tokens.push(current);
  }
  return tokens;
}

/**
 * Keep the flags that affect parsing and drop the compiler, the source file,
 * and output/dependency-producing options.
 *
 * @param {string[]} args
 * @param {string} absoluteFile
 * @param {string} [sourceToken]
 * @returns {string[]}
 */
export function flagsFromArguments(args, absoluteFile, sourceToken) {
  /** @type {string[]} */
  const flags = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (index === 0) {
      continue; // compiler executable
    }
    if (arg === absoluteFile || arg === sourceToken || arg === path.basename(absoluteFile)) {
      continue;
    }
    if (arg === '-o' || arg === '/Fo' || arg === '/Fe') {
      index += 1;
      continue;
    }
    if (arg.startsWith('-o') && arg.length > 2) {
      continue;
    }
    if (arg === '-c' || arg === '/c') {
      continue;
    }
    // Dependency-file and response-file flags depend on the build system and
    // add no syntax information.
    if (arg === '-MD' || arg === '-MMD' || arg === '-MP' || arg === '-MF') {
      if (arg === '-MF') {
        index += 1;
      }
      continue;
    }
    flags.push(arg);
  }
  return flags;
}

/**
 * @param {string[]} flags
 * @returns {string[]}
 */
export function extractIncludePaths(flags) {
  /** @type {string[]} */
  const paths = [];
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === '-I' || flag === '-isystem' || flag === '/I') {
      if (typeof flags[index + 1] === 'string') {
        paths.push(flags[index + 1]);
        index += 1;
      }
      continue;
    }
    if (flag.startsWith('-I') && flag.length > 2) {
      paths.push(flag.slice(2));
    }
  }
  return paths;
}

/**
 * @param {string[]} flags
 * @returns {string[]}
 */
export function extractDefines(flags) {
  /** @type {string[]} */
  const defines = [];
  for (let index = 0; index < flags.length; index += 1) {
    const flag = flags[index];
    if (flag === '-D' || flag === '/D') {
      if (typeof flags[index + 1] === 'string') {
        defines.push(flags[index + 1]);
        index += 1;
      }
      continue;
    }
    if (flag.startsWith('-D') && flag.length > 2) {
      defines.push(flag.slice(2));
    }
  }
  return defines;
}

/**
 * @param {string[]} flags
 * @returns {string|null}
 */
export function extractStandard(flags) {
  for (const flag of flags) {
    if (flag.startsWith('-std=')) {
      return flag.slice('-std='.length);
    }
  }
  return null;
}

/**
 * Heuristic flags for a file with no compile database. The caller must mark the
 * resulting run partial; system headers are likely unresolved.
 *
 * @param {{includePaths?: string[], defines?: string[], standard?: string}} [options]
 * @returns {string[]}
 */
export function heuristicFlags(options = {}) {
  /** @type {string[]} */
  const flags = [];
  const standard = options.standard ?? 'c++17';
  flags.push(`-std=${standard}`);
  for (const define of options.defines ?? []) {
    flags.push(`-D${define}`);
  }
  for (const includePath of options.includePaths ?? []) {
    flags.push(`-I${includePath}`);
  }
  return flags;
}

/**
 * Discover compile databases in the documented order. The search is bounded to
 * depth three and never leaves the workspace.
 *
 * @param {{
 *   workspaceRoot: string,
 *   configuredPath?: string,
 *   readFile?: typeof fs.readFile,
 *   readDir?: typeof fs.readdir,
 * }} options
 * @returns {Promise<
 *   {ok: true, choice: CompileDbChoice, candidates: string[], issues: string[]} |
 *   {ok: false, code: 'E_COMPILE_DB', message: string, candidates: string[], issues: string[]}
 * >}
 */
export async function discoverCompileDb(options) {
  const { workspaceRoot, configuredPath } = options;
  const readFile = options.readFile ?? fs.readFile;
  const readDir = options.readDir ?? fs.readdir;

  /** @type {string[]} */
  const candidates = [];
  if (typeof configuredPath === 'string' && configuredPath.trim().length > 0) {
    candidates.push(path.resolve(workspaceRoot, configuredPath.trim()));
  }
  candidates.push(path.join(workspaceRoot, COMPILE_COMMANDS_FILENAME));

  for (const child of await safeReadDir(workspaceRoot, readDir)) {
    if (child.isDirectory() && /^cmake-build-/.test(child.name)) {
      candidates.push(path.join(workspaceRoot, child.name, COMPILE_COMMANDS_FILENAME));
    }
  }
  for (const directory of ['build', 'out']) {
    candidates.push(path.join(workspaceRoot, directory, COMPILE_COMMANDS_FILENAME));
  }
  for (const found of await findCompileCommands(workspaceRoot, 3, readDir)) {
    candidates.push(found);
  }

  const unique = [...new Set(candidates)];
  /** @type {Array<{path: string, entries: CompileEntry[]}>} */
  const databases = [];
  /** @type {string[]} */
  const issues = [];

  for (const candidate of unique) {
    let text;
    try {
      text = await readFile(candidate, 'utf8');
    } catch {
      continue;
    }
    let parsedJson;
    try {
      parsedJson = JSON.parse(String(text));
    } catch (error) {
      issues.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
      continue;
    }
    const parsed = parseCompileCommands(parsedJson, workspaceRoot);
    if (!parsed.ok) {
      issues.push(`${candidate}: ${parsed.message}`);
      continue;
    }
    issues.push(...parsed.issues.map((issue) => `${candidate}: ${issue}`));
    databases.push({ path: candidate, entries: parsed.entries });
  }

  if (databases.length === 0) {
    return {
      ok: false,
      code: 'E_COMPILE_DB',
      message: 'No readable compile_commands.json was found; heuristic mode is required.',
      candidates: unique,
      issues,
    };
  }

  databases.sort(
    (left, right) =>
      right.entries.length - left.entries.length || left.path.localeCompare(right.path),
  );
  return {
    ok: true,
    choice: databases[0],
    candidates: unique,
    issues,
  };
}

/**
 * Match a file to its compile-database entry. Exact absolute match first, then
 * a case-insensitive match on Windows (flagged by the caller if it matters).
 *
 * @param {CompileEntry[]} entries
 * @param {string} absoluteFile
 * @param {NodeJS.Platform} [platform]
 * @returns {CompileEntry | null}
 */
export function matchCompileEntry(entries, absoluteFile, platform = process.platform) {
  const normalized = path.normalize(absoluteFile);
  for (const entry of entries) {
    if (path.normalize(entry.absoluteFile) === normalized) {
      return entry;
    }
  }
  if (platform === 'win32') {
    const lower = normalized.toLowerCase();
    for (const entry of entries) {
      if (path.normalize(entry.absoluteFile).toLowerCase() === lower) {
        return entry;
      }
    }
  }
  return null;
}

/**
 * @param {string} root
 * @param {number} maxDepth
 * @param {typeof fs.readdir} readDir
 * @returns {Promise<string[]>}
 */
async function findCompileCommands(root, maxDepth, readDir) {
  /** @type {string[]} */
  const found = [];
  /** @type {Array<{directory: string, depth: number}>} */
  const queue = [{ directory: root, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }
    const entries = await safeReadDir(current.directory, readDir);
    for (const entry of entries) {
      if (entry.isFile() && entry.name === COMPILE_COMMANDS_FILENAME) {
        found.push(path.join(current.directory, entry.name));
      }
      if (
        entry.isDirectory() &&
        current.depth < maxDepth &&
        !['node_modules', '.git', 'dist', '.codeflow'].includes(entry.name)
      ) {
        queue.push({
          directory: path.join(current.directory, entry.name),
          depth: current.depth + 1,
        });
      }
    }
  }
  return found;
}

/**
 * @param {string} directory
 * @param {typeof fs.readdir} readDir
 */
async function safeReadDir(directory, readDir) {
  try {
    return await readDir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * @param {string} value
 * @returns {string}
 */
function toPosix(value) {
  return value.split(path.sep).join('/');
}
