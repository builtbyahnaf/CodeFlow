/**
 * Workspace path safety.
 *
 * Workspace contents are untrusted input (Roadmap section 21). Every path that
 * originates from configuration, the index, or the webview passes through this
 * module before any file is read.
 *
 * Platform is a parameter so the Windows rules can be tested on any machine.
 */

import path from 'node:path';

export class PathSafetyError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   */
  constructor(code, message) {
    super(message);
    this.name = 'PathSafetyError';
    this.code = code;
  }
}

const WINDOWS_DRIVE_PATTERN = /^[A-Za-z]:/;

/**
 * @param {string} platform
 * @returns {typeof path.posix | typeof path.win32}
 */
function pathApi(platform) {
  return platform === 'win32' ? path.win32 : path.posix;
}

/**
 * @param {string} value
 * @param {string} platform
 * @returns {string}
 */
export function normalizeForCompare(value, platform = process.platform) {
  const api = pathApi(platform);
  const normalized = api.normalize(value);
  return platform === 'win32' ? normalized.toLowerCase() : normalized;
}

/**
 * True for POSIX absolute paths, Windows drive paths, and UNC paths, regardless
 * of the host platform.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isAbsoluteAnywhere(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return false;
  }
  return (
    WINDOWS_DRIVE_PATTERN.test(value) ||
    value.startsWith('\\\\') ||
    value.startsWith('//') ||
    value.startsWith('/')
  );
}

/**
 * True when `candidate` resolves to the root itself or something beneath it.
 *
 * @param {string} root
 * @param {string} candidate
 * @param {string} [platform]
 * @returns {boolean}
 */
export function isPathInside(root, candidate, platform = process.platform) {
  if (typeof root !== 'string' || typeof candidate !== 'string') {
    return false;
  }
  if (candidate.includes('\u0000')) {
    return false;
  }
  const api = pathApi(platform);
  const normalizedRoot = normalizeForCompare(api.resolve(root), platform);
  const normalizedCandidate = normalizeForCompare(api.resolve(candidate), platform);
  if (normalizedRoot === normalizedCandidate) {
    return true;
  }
  const rootWithSeparator = normalizedRoot.endsWith(api.sep)
    ? normalizedRoot
    : `${normalizedRoot}${api.sep}`;
  return normalizedCandidate.startsWith(rootWithSeparator);
}

/**
 * Convert an absolute path to a workspace-relative, forward-slash path.
 *
 * @param {string} root
 * @param {string} absolutePath
 * @param {string} [platform]
 * @returns {string}
 * @throws {PathSafetyError} when the path escapes the workspace
 */
export function toWorkspaceRelative(root, absolutePath, platform = process.platform) {
  if (!isPathInside(root, absolutePath, platform)) {
    throw new PathSafetyError('E_PATH', 'Path is outside the workspace.');
  }
  const api = pathApi(platform);
  const relative = api.relative(api.resolve(root), api.resolve(absolutePath));
  return relative.split(api.sep).join('/');
}

/**
 * Reject relative paths that are absolute, traversing, or unprintable.
 *
 * Used for index keys, `fileId` lookups from the webview, and configuration
 * patterns. Rejects rather than repairs.
 *
 * @param {string} value
 * @returns {boolean}
 */
export function isSafeRelativePath(value) {
  if (typeof value !== 'string' || value.length === 0 || value.length > 1024) {
    return false;
  }
  if (value.includes('\u0000') || value.includes('\\')) {
    return false;
  }
  if (isAbsoluteAnywhere(value)) {
    return false;
  }
  const segments = value.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}
