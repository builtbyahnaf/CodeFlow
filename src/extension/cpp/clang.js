/**
 * Clang discovery and version policy.
 *
 * Discovery never guesses that a compiler exists: it executes `--version` and
 * parses the answer. An installed but too-old Clang is reported as a warning,
 * not a hard failure — the caller attempts analysis and marks the run partial.
 */

export const MIN_CLANG_MAJOR = 15;

/**
 * @typedef {Object} ClangInfo
 * @property {string} path
 * @property {string} version
 * @property {number|null} major
 * @property {boolean} compatible
 */

/**
 * @param {string} text
 * @returns {{version: string, major: number|null}|null}
 */
export function parseClangVersion(text) {
  if (typeof text !== 'string') {
    return null;
  }
  const match = text.match(/(?:Apple\s+)?clang(?:-cl)?\s+version\s+(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (!match) {
    return null;
  }
  return {
    version: `${match[1]}.${match[2]}${match[3] ? `.${match[3]}` : ''}`,
    major: Number(match[1]),
  };
}

/**
 * Platform-specific default candidates, in probing order.
 *
 * @param {NodeJS.Platform} [platform]
 * @returns {string[]}
 */
export function defaultClangCandidates(platform = process.platform) {
  if (platform === 'win32') {
    return ['clang++.exe', 'clang.exe', 'clang-cl.exe'];
  }
  return ['clang++', 'clang'];
}

/**
 * Probe a list of candidates and return the first executable that answers.
 *
 * @param {{
 *   runTool: typeof import('../tooling/runTool.js').runTool,
 *   configuredPath?: string,
 *   candidates?: string[],
 * }} options
 * @returns {Promise<
 *   {ok: true, clang: ClangInfo, warning?: {code: string, message: string}} |
 *   {ok: false, code: 'E_UNSUPPORTED', message: string}
 * >}
 */
export async function discoverClang({ runTool, configuredPath, candidates }) {
  const list = [];
  if (typeof configuredPath === 'string' && configuredPath.trim().length > 0) {
    list.push(configuredPath.trim());
  }
  for (const candidate of candidates ?? defaultClangCandidates()) {
    if (typeof candidate === 'string' && candidate.length > 0 && !list.includes(candidate)) {
      list.push(candidate);
    }
  }

  for (const command of list) {
    const probe = await runTool({
      command,
      args: ['--version'],
      timeoutMs: 5_000,
      maxOutputBytes: 64 * 1024,
    });
    if (!probe.ok || probe.exitCode !== 0) {
      continue;
    }
    const parsed = parseClangVersion(probe.stdout) ?? parseClangVersion(probe.stderr);
    if (!parsed) {
      continue;
    }
    const compatible = parsed.major !== null && parsed.major >= MIN_CLANG_MAJOR;
    /** @type {{ok: true, clang: ClangInfo, warning?: {code: string, message: string}}} */
    const result = {
      ok: true,
      clang: {
        path: command,
        version: parsed.version,
        major: parsed.major,
        compatible,
      },
    };
    if (!compatible) {
      result.warning = {
        code: 'toolchain_version_mismatch',
        message: `Clang ${parsed.version} is older than the supported minimum ${MIN_CLANG_MAJOR}. Analysis will be partial.`,
      };
    }
    return result;
  }

  return {
    ok: false,
    code: 'E_UNSUPPORTED',
    message:
      'No Clang toolchain was found. Set "codeflow.cpp.clangPath" or add clang++ to PATH. ' +
      'CodeFlow never runs your build system; see docs/LANGUAGE_ADAPTERS.md for setup.',
  };
}
