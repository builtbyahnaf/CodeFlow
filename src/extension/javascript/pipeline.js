/**
 * Host-side JavaScript analysis pipeline.
 *
 * This module owns every workspace decision: trust, path safety, file reads,
 * module-kind detection, and the deliberately small relative-module resolver.
 * The adapter receives already-read text and never touches the file system.
 *
 * Node resolution is conservative on purpose. Bare specifiers are external
 * unless the user opts in; bundler aliases and `exports` maps that are not a
 * single string are reported, never guessed.
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import { JS_ADAPTER_ID } from '../../adapters/javascript/index.js';
import {
  detectModuleKind,
  exclusionFor,
  isGeneratedSource,
  isJavaScriptPath,
  isJsxPath,
  isTypeScriptPath,
} from '../../adapters/javascript/moduleKind.js';
import { collectModuleSpecifiers } from '../../adapters/javascript/parser.js';
import { isPathInside, toWorkspaceRelative } from '../security/paths.js';

export const DEFAULT_MAX_FILE_BYTES = 2 * 1024 * 1024;
export const DEFAULT_MAX_LINES = 20_000;
export const DEFAULT_MAX_MODULES = 64;
export const DEFAULT_MAX_DEPTH = 8;
export const DEFAULT_INCLUDE_WORKSPACE_GLOBALS = true;

/**
 * @typedef {Object} JavaScriptSettings
 * @property {boolean} [resolveNodeModules]
 * @property {boolean} [includeWorkspaceGlobals]
 * @property {number} [maxFileBytes]
 * @property {number} [maxLines]
 * @property {number} [maxModules]
 * @property {number} [maxDepth]
 */

/**
 * @typedef {Object} JavaScriptResolution
 * @property {string} from
 * @property {string} specifier
 * @property {'resolved'|'unresolved'} status
 * @property {string} [path]
 * @property {string} [reasonCode]
 * @property {string} [message]
 */

/**
 * @param {{
 *   registry: ReturnType<typeof import('../../core/adapterRegistry.js').createAdapterRegistry>,
 *   readFile?: typeof fs.readFile,
 *   readDir?: typeof fs.readdir,
 *   stat?: typeof fs.stat,
 *   settings?: JavaScriptSettings | (() => JavaScriptSettings),
 *   logger?: {debug?: Function, warn?: Function, error?: Function},
 *   platform?: NodeJS.Platform,
 * }} options
 */
export function createJavaScriptAnalysisService(options) {
  const {
    registry,
    readFile = fs.readFile,
    readDir = fs.readdir,
    stat = fs.stat,
    logger = {},
    platform = process.platform,
  } = options;

  /** @type {Map<string, {'module'|'commonjs'|undefined}>} */
  const packageTypeCache = new Map();

  function currentSettings() {
    const value = typeof options.settings === 'function' ? options.settings() : options.settings;
    return normalizeSettings(value ?? {});
  }

  /**
   * @param {{path: string, runId: string, workspaceRoot: string, trusted?: boolean}} input
   * @returns {Promise<any>}
   */
  async function analyze(input) {
    const adapter = registry.resolve(input?.path ?? '');
    if (!adapter || adapter.id !== JS_ADAPTER_ID) {
      return registry.analyze(input);
    }
    // TypeScript and JSX are rejected by the adapter with a typed diagnostic.
    // Do not read or parse them here.
    if (isTypeScriptPath(input.path) || isJsxPath(input.path)) {
      return registry.analyze(input);
    }
    let prepared;
    try {
      prepared = await prepare(input);
    } catch (error) {
      logger.error?.('javascript.prepare_failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return {
        ok: false,
        code: 'E_INTERNAL',
        message: `JavaScript analysis could not be prepared: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
    if (!prepared.ok) {
      return prepared;
    }
    return registry.analyze(prepared.value);
  }

  /**
   * @param {{path: string, runId: string, workspaceRoot: string, trusted?: boolean}} input
   * @returns {Promise<{ok: true, value: Record<string, any>} | {ok: false, code: string, message: string}>}
   */
  async function prepare(input) {
    const settings = currentSettings();
    if (!input || typeof input !== 'object') {
      return failure('E_INPUT', 'Analysis input must be an object.');
    }
    if (typeof input.workspaceRoot !== 'string' || input.workspaceRoot.length === 0) {
      return failure('E_INPUT', 'Open a workspace folder before analysing JavaScript files.');
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

    const workspaceRoot = path.resolve(input.workspaceRoot);
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
    if (!isJavaScriptPath(relativePath)) {
      return failure('E_INPUT', 'This file is not a JavaScript file.');
    }

    const exclusion = exclusionFor(relativePath);
    if (exclusion.excluded) {
      return failure(
        'E_INPUT',
        exclusion.reason === 'minified'
          ? 'CodeFlow does not analyse minified bundles. Open the source file instead.'
          : 'This file is in an excluded directory (node_modules, build output, or vendor).',
      );
    }

    const mainSource = await readSource(absolutePath, settings.maxFileBytes);
    if (!mainSource.ok) {
      return failure('E_INPUT', mainSource.message);
    }
    if (isGeneratedSource(mainSource.text)) {
      return failure(
        'E_INPUT',
        'This file looks generated. CodeFlow does not analyse generated output.',
      );
    }

    /** @type {Array<{severity: string, code: string, message: string}>} */
    const diagnostics = [];
    const lineCount = countLines(mainSource.text);
    const syntaxOnly = lineCount > settings.maxLines;
    if (syntaxOnly) {
      diagnostics.push({
        severity: 'warning',
        code: 'budget_exceeded',
        message: `The file has ${lineCount} lines; only syntax and declarations are analysed.`,
      });
    }

    const mainModuleKind = await moduleKindFor(absolutePath, workspaceRoot);
    /** @type {Map<string, {path: string, absolutePath: string, text: string, moduleKind: 'module'|'script', json: boolean, depth: number}>} */
    const modules = new Map();
    modules.set(relativePath, {
      path: relativePath,
      absolutePath,
      text: mainSource.text,
      moduleKind: mainModuleKind,
      json: false,
      depth: 0,
    });
    /** @type {JavaScriptResolution[]} */
    const resolutions = [];
    /** @type {Array<{path: string, depth: number}>} */
    const queue = [{ path: relativePath, depth: 0 }];
    let truncated = false;

    while (queue.length > 0) {
      const current = queue.shift();
      const moduleInfo = current ? modules.get(current.path) : null;
      if (!moduleInfo || current.depth >= settings.maxDepth) {
        continue;
      }
      const collected = collectModuleSpecifiers(moduleInfo.text, {
        sourceType: moduleInfo.moduleKind,
      });
      if (!collected.ok) {
        continue;
      }
      for (const request of collected.specifiers) {
        const key = `${moduleInfo.path}\u0000${request.specifier}`;
        if (resolutions.some((entry) => `${entry.from}\u0000${entry.specifier}` === key)) {
          continue;
        }
        const resolution = await resolveSpecifier({
          fromPath: moduleInfo.path,
          fromAbsolute: moduleInfo.absolutePath,
          specifier: request.specifier,
          workspaceRoot,
          settings,
        });
        /** @type {JavaScriptResolution} */
        const entry = {
          from: moduleInfo.path,
          specifier: request.specifier,
          status: resolution.status,
          ...(resolution.path ? { path: resolution.path } : {}),
          ...(resolution.reasonCode ? { reasonCode: resolution.reasonCode } : {}),
          ...(resolution.message ? { message: resolution.message } : {}),
        };
        if (resolution.status === 'resolved' && resolution.absolutePath) {
          if (modules.size >= settings.maxModules) {
            entry.status = 'unresolved';
            entry.reasonCode = 'budget_exceeded';
            entry.message = `The workspace module graph exceeded ${settings.maxModules} files.`;
            delete entry.path;
            truncated = true;
          } else if (!modules.has(resolution.path)) {
            const targetExclusion = exclusionFor(resolution.path);
            const insideNodeModules = resolution.path.split('/').includes('node_modules');
            if (targetExclusion.excluded && !insideNodeModules) {
              entry.status = 'unresolved';
              entry.reasonCode = 'generated_source';
              entry.message = `Imported file ${resolution.path} is excluded by policy.`;
              delete entry.path;
            } else {
              const source = await readSource(resolution.absolutePath, settings.maxFileBytes);
              if (!source.ok) {
                entry.status = 'unresolved';
                entry.reasonCode = 'unknown_import_target';
                entry.message = source.message;
                delete entry.path;
              } else if (isGeneratedSource(source.text)) {
                entry.status = 'unresolved';
                entry.reasonCode = 'generated_source';
                entry.message = `Imported file ${resolution.path} is generated.`;
                delete entry.path;
              } else {
                const kind = await moduleKindFor(resolution.absolutePath, workspaceRoot);
                modules.set(resolution.path, {
                  path: resolution.path,
                  absolutePath: resolution.absolutePath,
                  text: source.text,
                  moduleKind: kind,
                  json: resolution.path.endsWith('.json'),
                  depth: current.depth + 1,
                });
                queue.push({ path: resolution.path, depth: current.depth + 1 });
              }
            }
          }
        }
        resolutions.push(entry);
      }
    }

    if (truncated) {
      diagnostics.push({
        severity: 'warning',
        code: 'budget_exceeded',
        message: `The module graph stopped at ${settings.maxModules} files; further imports are unresolved.`,
      });
    }

    if (
      settings.includeWorkspaceGlobals &&
      !syntaxOnly &&
      modules.size < Math.min(settings.maxModules, 32)
    ) {
      await collectSiblingScripts({
        dir: path.dirname(absolutePath),
        workspaceRoot,
        modules,
        maxModules: Math.min(settings.maxModules, 32),
        maxFileBytes: settings.maxFileBytes,
      });
    }

    return {
      ok: true,
      value: {
        ...input,
        path: relativePath,
        text: mainSource.text,
        jsModuleKind: mainModuleKind,
        jsModules: [...modules.values()]
          .filter((entry) => entry.path !== relativePath)
          .map((entry) => ({
            path: entry.path,
            text: entry.text,
            moduleKind: entry.moduleKind,
            json: entry.json,
          })),
        jsResolutions: resolutions,
        jsSyntaxOnly: syntaxOnly,
        jsDiagnostics: diagnostics,
      },
    };
  }

  /**
   * @param {string} absolutePath
   * @param {number} maxBytes
   * @returns {Promise<{ok: true, text: string} | {ok: false, message: string}>}
   */
  async function readSource(absolutePath, maxBytes) {
    let info;
    try {
      info = await stat(absolutePath);
    } catch {
      return { ok: false, message: 'The file could not be read.' };
    }
    if (!info.isFile()) {
      return { ok: false, message: 'The path is not a file.' };
    }
    if (Number(info.size) > maxBytes) {
      return {
        ok: false,
        message: `The file is larger than the ${Math.round(maxBytes / 1024 / 1024)} MB analysis limit.`,
      };
    }
    try {
      return { ok: true, text: String(await readFile(absolutePath, 'utf8')) };
    } catch {
      return { ok: false, message: 'The file could not be read.' };
    }
  }

  /**
   * @param {string} absolutePath
   * @param {string} workspaceRoot
   * @returns {Promise<'module'|'script'>}
   */
  async function moduleKindFor(absolutePath, workspaceRoot) {
    const packageType = await packageTypeFor(path.dirname(absolutePath), workspaceRoot);
    return detectModuleKind({ path: absolutePath, packageType });
  }

  /**
   * @param {string} directory
   * @param {string} workspaceRoot
   * @returns {Promise<'module'|'commonjs'|undefined>}
   */
  async function packageTypeFor(directory, workspaceRoot) {
    const root = path.resolve(workspaceRoot);
    let current = path.resolve(directory);
    const visited = [];
    while (isPathInside(root, current, platform)) {
      if (packageTypeCache.has(current)) {
        const cached = packageTypeCache.get(current);
        for (const entry of visited) {
          packageTypeCache.set(entry, cached);
        }
        return cached;
      }
      visited.push(current);
      try {
        const raw = await readFile(path.join(current, 'package.json'), 'utf8');
        const parsed = JSON.parse(String(raw));
        const type =
          parsed?.type === 'module'
            ? 'module'
            : parsed?.type === 'commonjs'
              ? 'commonjs'
              : undefined;
        for (const entry of visited) {
          packageTypeCache.set(entry, type);
        }
        return type;
      } catch {
        // No readable package.json at this level; keep walking.
      }
      const parent = path.dirname(current);
      if (parent === current) {
        break;
      }
      current = parent;
    }
    for (const entry of visited) {
      packageTypeCache.set(entry, undefined);
    }
    return undefined;
  }

  /**
   * @param {{
   *   fromPath: string,
   *   fromAbsolute: string,
   *   specifier: string,
   *   workspaceRoot: string,
   *   settings: Required<JavaScriptSettings>,
   * }} input
   * @returns {Promise<{status: 'resolved'|'unresolved', path?: string, absolutePath?: string, reasonCode?: string, message?: string}>}
   */
  async function resolveSpecifier(input) {
    const { specifier } = input;
    if (specifier.startsWith('@/') || specifier.startsWith('~/')) {
      return unresolved(
        'path_alias_unresolved',
        `The alias "${specifier}" needs a bundler configuration, which Phase 3 does not read.`,
      );
    }
    if (path.isAbsolute(specifier) || /^[A-Za-z]:/.test(specifier)) {
      return unresolved(
        'unknown_import_target',
        'Absolute import specifiers are not resolved because they are not portable.',
      );
    }
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const base = path.resolve(path.dirname(input.fromAbsolute), specifier);
      if (!isPathInside(input.workspaceRoot, base, platform)) {
        return unresolved('unknown_import_target', 'The relative import leaves the workspace.');
      }
      const found = await resolveFile(base);
      return found
        ? {
            status: 'resolved',
            absolutePath: found.absolutePath,
            path: toWorkspaceRelative(input.workspaceRoot, found.absolutePath, platform),
          }
        : unresolved('unknown_import_target', `No file matches "${specifier}".`);
    }
    if (!input.settings.resolveNodeModules) {
      return unresolved(
        'external_package',
        `"${specifier}" is a package import. Enable codeflow.javascript.resolveNodeModules to read workspace node_modules.`,
      );
    }
    const packageName = specifier.startsWith('@')
      ? specifier.split('/').slice(0, 2).join('/')
      : specifier.split('/')[0];
    const subpath = specifier.slice(packageName.length).replace(/^\//, '');
    let directory = path.dirname(input.fromAbsolute);
    /** @type {string|null} */
    let packageRoot = null;
    while (isPathInside(input.workspaceRoot, directory, platform)) {
      const candidate = path.join(directory, 'node_modules', packageName);
      if (await exists(candidate)) {
        packageRoot = candidate;
        break;
      }
      const parent = path.dirname(directory);
      if (parent === directory) {
        break;
      }
      directory = parent;
    }
    if (!packageRoot) {
      return unresolved(
        'external_package',
        `Package "${packageName}" is not in workspace node_modules.`,
      );
    }
    if (subpath) {
      const found = await resolveFile(path.join(packageRoot, subpath));
      if (found) {
        return {
          status: 'resolved',
          absolutePath: found.absolutePath,
          path: toWorkspaceRelative(input.workspaceRoot, found.absolutePath, platform),
        };
      }
      return unresolved('unknown_import_target', `No file matches "${specifier}".`);
    }
    let mainEntry = 'index.js';
    try {
      const raw = await readFile(path.join(packageRoot, 'package.json'), 'utf8');
      const parsed = JSON.parse(String(raw));
      if (typeof parsed.exports === 'string') {
        mainEntry = parsed.exports;
      } else if (parsed.exports && typeof parsed.exports === 'object') {
        const root = parsed.exports['.'];
        if (typeof root === 'string') {
          mainEntry = root;
        } else if (root && typeof root === 'object' && typeof root.import === 'string') {
          mainEntry = root.import;
        } else {
          return unresolved(
            'exports_map_unsupported',
            `"${packageName}" uses an exports map that Phase 3 does not interpret.`,
          );
        }
      } else if (typeof parsed.main === 'string') {
        mainEntry = parsed.main;
      }
    } catch {
      return unresolved(
        'unknown_import_target',
        `Could not read the package metadata for "${packageName}".`,
      );
    }
    const found = await resolveFile(path.join(packageRoot, mainEntry));
    if (!found) {
      return unresolved(
        'unknown_import_target',
        `Package "${packageName}" has no resolvable entry.`,
      );
    }
    return {
      status: 'resolved',
      absolutePath: found.absolutePath,
      path: toWorkspaceRelative(input.workspaceRoot, found.absolutePath, platform),
    };
  }

  /**
   * @param {string} base
   * @returns {Promise<{absolutePath: string}|null>}
   */
  async function resolveFile(base) {
    const candidates = [];
    const extension = path.extname(base).toLowerCase();
    if (['.js', '.mjs', '.cjs', '.json'].includes(extension)) {
      candidates.push(base);
    }
    candidates.push(`${base}.js`, `${base}.mjs`, `${base}.cjs`, `${base}.json`);
    candidates.push(
      path.join(base, 'index.js'),
      path.join(base, 'index.mjs'),
      path.join(base, 'index.cjs'),
    );
    const seen = new Set();
    for (const candidate of candidates) {
      if (seen.has(candidate)) {
        continue;
      }
      seen.add(candidate);
      if (await isFile(candidate)) {
        return { absolutePath: candidate };
      }
    }
    return null;
  }

  /**
   * @param {string} candidate
   * @returns {Promise<boolean>}
   */
  async function isFile(candidate) {
    try {
      const info = await stat(candidate);
      return info.isFile();
    } catch {
      return false;
    }
  }

  /**
   * @param {string} candidate
   * @returns {Promise<boolean>}
   */
  async function exists(candidate) {
    try {
      await stat(candidate);
      return true;
    } catch {
      return false;
    }
  }

  async function collectSiblingScripts({ dir, workspaceRoot, modules, maxModules, maxFileBytes }) {
    let names;
    try {
      const entries = await readDir(dir, { withFileTypes: true });
      names = entries
        .filter((entry) => (typeof entry === 'string' ? true : entry.isFile?.()))
        .map((entry) => (typeof entry === 'string' ? entry : entry.name))
        .sort();
    } catch {
      return;
    }
    for (const name of names) {
      if (modules.size >= maxModules) {
        break;
      }
      if (!/\.(js|mjs|cjs)$/i.test(name)) {
        continue;
      }
      const candidateAbs = path.join(dir, name);
      if (!isPathInside(workspaceRoot, candidateAbs, platform)) {
        continue;
      }
      let candidateRel;
      try {
        candidateRel = toWorkspaceRelative(workspaceRoot, candidateAbs, platform);
      } catch {
        continue;
      }
      if (modules.has(candidateRel) || exclusionFor(candidateRel).excluded) {
        continue;
      }
      const source = await readSource(candidateAbs, maxFileBytes);
      if (!source.ok || isGeneratedSource(source.text)) {
        continue;
      }
      const kind = await moduleKindFor(candidateAbs, workspaceRoot);
      modules.set(candidateRel, {
        path: candidateRel,
        absolutePath: candidateAbs,
        text: source.text,
        moduleKind: kind,
        json: false,
        depth: 1,
      });
    }
  }

  return { analyze, prepare };
}

/**
 * @param {string} code
 * @param {string} message
 * @returns {{ok: false, code: string, message: string}}
 */
function failure(code, message) {
  return { ok: false, code, message };
}

/**
 * @param {string} reasonCode
 * @param {string} message
 * @returns {{status: 'unresolved', reasonCode: string, message: string}}
 */
function unresolved(reasonCode, message) {
  return { status: 'unresolved', reasonCode, message };
}

/**
 * @param {string} text
 * @returns {number}
 */
function countLines(text) {
  let count = 1;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      count += 1;
    }
  }
  return count;
}

/**
 * @param {JavaScriptSettings} value
 * @returns {Required<JavaScriptSettings>}
 */
function normalizeSettings(value) {
  return {
    resolveNodeModules: value.resolveNodeModules === true,
    includeWorkspaceGlobals: value.includeWorkspaceGlobals !== false,
    maxFileBytes:
      Number.isFinite(value.maxFileBytes) && Number(value.maxFileBytes) > 0
        ? Number(value.maxFileBytes)
        : DEFAULT_MAX_FILE_BYTES,
    maxLines:
      Number.isFinite(value.maxLines) && Number(value.maxLines) > 0
        ? Number(value.maxLines)
        : DEFAULT_MAX_LINES,
    maxModules:
      Number.isFinite(value.maxModules) && Number(value.maxModules) > 0
        ? Number(value.maxModules)
        : DEFAULT_MAX_MODULES,
    maxDepth:
      Number.isFinite(value.maxDepth) && Number(value.maxDepth) > 0
        ? Number(value.maxDepth)
        : DEFAULT_MAX_DEPTH,
  };
}
