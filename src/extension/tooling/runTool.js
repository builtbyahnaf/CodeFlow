/**
 * Safe process execution.
 *
 * This is the only module allowed to spawn a child process for analysis. Every
 * call uses an argument array (never a shell string), a fixed working
 * directory, an explicit environment allowlist, a hard timeout, an output cap,
 * and cooperative cancellation. A killed child is killed as a tree so a
 * compiler's subprocesses cannot outlive the request.
 *
 * The function returns a result object; it never rejects. Callers decide
 * whether a non-zero exit is fatal (clang exits non-zero on parse errors but
 * may still emit a usable AST).
 */

import { spawn } from 'node:child_process';

export const DEFAULT_TIMEOUT_MS = 60_000;
export const DEFAULT_MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

/**
 * Environment variables a tool may inherit. Everything else is dropped so a
 * workspace cannot influence analysis through unrelated environment state.
 */
const ENV_ALLOWLIST = Object.freeze([
  'PATH',
  'Path',
  'PATHEXT',
  'SystemRoot',
  'SYSTEMROOT',
  'WINDIR',
  'TEMP',
  'TMP',
  'HOME',
  'USERPROFILE',
  'LOCALAPPDATA',
  'PROGRAMDATA',
  'PROGRAMFILES',
  'PROGRAMFILES(X86)',
  'INCLUDE',
  'LIB',
  'LIBPATH',
  'LANG',
  'LC_ALL',
]);

/**
 * @typedef {Object} RunToolOptions
 * @property {string} command
 * @property {string[]} [args]
 * @property {string} [cwd]
 * @property {number} [timeoutMs]
 * @property {number} [maxOutputBytes]
 * @property {AbortSignal} [signal]
 * @property {Record<string, string>} [env] Extra allowlisted values for tests
 */

/**
 * @typedef {Object} RunToolSuccess
 * @property {true} ok
 * @property {string} stdout
 * @property {string} stderr
 * @property {number|null} exitCode
 * @property {string|null} signal
 * @property {number} durationMs
 */

/**
 * @typedef {Object} RunToolFailure
 * @property {false} ok
 * @property {'E_TOOL_NOT_FOUND'|'E_TOOL_TIMEOUT'|'E_TOOL_LIMIT'|'E_TOOL_ERROR'|'E_CANCELLED'} code
 * @property {string} message
 * @property {string} [stdout]
 * @property {string} [stderr]
 * @property {number} [durationMs]
 */

/**
 * @param {RunToolOptions} options
 * @returns {Promise<RunToolSuccess | RunToolFailure>}
 */
export function runTool(options) {
  const {
    command,
    args = [],
    cwd,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxOutputBytes = DEFAULT_MAX_OUTPUT_BYTES,
    signal,
    env,
  } = options ?? {};

  if (typeof command !== 'string' || command.length === 0) {
    return Promise.resolve({
      ok: false,
      code: 'E_TOOL_ERROR',
      message: 'runTool requires a non-empty command.',
    });
  }
  if (!Array.isArray(args) || args.some((arg) => typeof arg !== 'string')) {
    return Promise.resolve({
      ok: false,
      code: 'E_TOOL_ERROR',
      message: 'runTool args must be an array of strings.',
    });
  }
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return Promise.resolve({
      ok: false,
      code: 'E_TOOL_ERROR',
      message: 'runTool timeoutMs must be a positive number.',
    });
  }
  if (!Number.isFinite(maxOutputBytes) || maxOutputBytes <= 0) {
    return Promise.resolve({
      ok: false,
      code: 'E_TOOL_ERROR',
      message: 'runTool maxOutputBytes must be a positive number.',
    });
  }
  if (signal?.aborted) {
    return Promise.resolve({
      ok: false,
      code: 'E_CANCELLED',
      message: 'Tool execution was cancelled before it started.',
    });
  }

  return new Promise((resolve) => {
    const startedAt = Date.now();
    /** @type {Buffer[]} */
    const stdoutChunks = [];
    /** @type {Buffer[]} */
    const stderrChunks = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let settled = false;
    /** @type {{handle?: NodeJS.Timeout}} */
    const timers = {};

    /** @param {RunToolSuccess | RunToolFailure} result */
    const finish = (result) => {
      if (settled) {
        return;
      }
      settled = true;
      if (timers.handle) {
        clearTimeout(timers.handle);
      }
      if (signal) {
        signal.removeEventListener('abort', onAbort);
      }
      resolve({ ...result, durationMs: result.durationMs ?? Date.now() - startedAt });
    };

    /** @type {import('node:child_process').ChildProcess} */
    let child;
    try {
      child = spawn(command, args, {
        cwd,
        shell: false,
        windowsHide: true,
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: buildEnvironment(env),
      });
    } catch (error) {
      finish({
        ok: false,
        code: 'E_TOOL_ERROR',
        message: `Could not start "${command}": ${error instanceof Error ? error.message : String(error)}`,
      });
      return;
    }

    const onAbort = () => {
      killTree(child);
      finish({
        ok: false,
        code: 'E_CANCELLED',
        message: 'Tool execution was cancelled.',
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    };
    signal?.addEventListener('abort', onAbort, { once: true });

    timers.handle = setTimeout(() => {
      killTree(child);
      finish({
        ok: false,
        code: 'E_TOOL_TIMEOUT',
        message: `Tool "${command}" exceeded the ${timeoutMs} ms budget.`,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
      });
    }, timeoutMs);
    // Timers must not keep the extension host alive on their own.
    timers.handle.unref?.();

    child.stdout?.on('data', (chunk) => {
      if (settled) {
        return;
      }
      stdoutBytes += chunk.length;
      if (stdoutBytes > maxOutputBytes) {
        killTree(child);
        finish({
          ok: false,
          code: 'E_TOOL_LIMIT',
          message: `Tool "${command}" exceeded the ${maxOutputBytes}-byte output cap.`,
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),
          stderr: Buffer.concat(stderrChunks).toString('utf8'),
        });
        return;
      }
      stdoutChunks.push(chunk);
    });

    child.stderr?.on('data', (chunk) => {
      if (settled) {
        return;
      }
      stderrBytes += chunk.length;
      // stderr is diagnostic text, not the payload; cap it separately so a
      // noisy compiler cannot exhaust memory through warnings alone.
      if (stderrBytes > maxOutputBytes) {
        killTree(child);
        finish({
          ok: false,
          code: 'E_TOOL_LIMIT',
          message: `Tool "${command}" exceeded the ${maxOutputBytes}-byte stderr cap.`,
          stdout: Buffer.concat(stdoutChunks).toString('utf8'),
          stderr: Buffer.concat(stderrChunks).toString('utf8'),
        });
        return;
      }
      stderrChunks.push(chunk);
    });

    child.on('error', (error) => {
      const notFound =
        /** @type {{code?: string}} */ (error).code === 'ENOENT'
          ? 'E_TOOL_NOT_FOUND'
          : 'E_TOOL_ERROR';
      finish({
        ok: false,
        code: notFound,
        message:
          notFound === 'E_TOOL_NOT_FOUND'
            ? `Tool "${command}" was not found.`
            : `Tool "${command}" failed to start: ${error.message}`,
      });
    });

    child.on('close', (exitCode, exitSignal) => {
      finish({
        ok: true,
        stdout: Buffer.concat(stdoutChunks).toString('utf8'),
        stderr: Buffer.concat(stderrChunks).toString('utf8'),
        exitCode,
        signal: exitSignal,
      });
    });
  });
}

/**
 * @param {Record<string, string>} [extra]
 * @returns {Record<string, string>}
 */
function buildEnvironment(extra) {
  /** @type {Record<string, string>} */
  const env = {};
  for (const key of ENV_ALLOWLIST) {
    if (typeof process.env[key] === 'string') {
      env[key] = process.env[key];
    }
  }
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (typeof value === 'string') {
        env[key] = value;
      }
    }
  }
  return env;
}

/**
 * Kill a child and its descendants. On Windows, `taskkill /T` is the only
 * reliable way to reach grandchildren. On POSIX the child is a process-group
 * leader, so a negative pid reaches the group.
 *
 * @param {import('node:child_process').ChildProcess} child
 */
function killTree(child) {
  if (!child || child.killed || typeof child.pid !== 'number') {
    return;
  }
  if (process.platform === 'win32') {
    try {
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
        windowsHide: true,
        stdio: 'ignore',
        shell: false,
      });
    } catch {
      child.kill();
    }
    return;
  }
  try {
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    child.kill('SIGKILL');
  }
}
