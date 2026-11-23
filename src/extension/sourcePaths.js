/**
 * Turn a declared analysis path into a workspace-contained absolute path.
 *
 * Kept free of `vscode` so traversal and platform rules are unit-testable. This
 * is the single lexical gate before `workspace.openTextDocument`.
 */

import path from 'node:path';
import {
  isAbsoluteAnywhere,
  isPathInside,
  isSafeRelativePath,
  toWorkspaceRelative,
} from './security/paths.js';

/**
 * @param {string} root
 * @param {string} declaredPath
 * @param {string} [platform]
 * @returns {{ok: true, absolutePath: string, relativePath: string} | {ok: false, code: 'E_PATH'|'E_WORKSPACE', message: string}}
 */
export function resolveWorkspacePath(root, declaredPath, platform = process.platform) {
  const api = platform === 'win32' ? path.win32 : path.posix;
  if (typeof root !== 'string' || root.length === 0 || root.includes('\u0000')) {
    return { ok: false, code: 'E_WORKSPACE', message: 'No workspace folder is open.' };
  }
  if (typeof declaredPath !== 'string' || declaredPath.length === 0 || declaredPath.length > 2_048) {
    return { ok: false, code: 'E_PATH', message: 'The analysis path is missing or too long.' };
  }
  if (declaredPath.includes('\u0000')) {
    return { ok: false, code: 'E_PATH', message: 'The analysis path contains a NUL byte.' };
  }

  if (isAbsoluteAnywhere(declaredPath)) {
    const absolute = api.normalize(declaredPath);
    if (!isPathInside(root, absolute, platform)) {
      return { ok: false, code: 'E_PATH', message: 'The path is outside the workspace.' };
    }
    return {
      ok: true,
      absolutePath: absolute,
      relativePath: toWorkspaceRelative(root, absolute, platform),
    };
  }

  const unixish = declaredPath.split('\\').join('/');
  if (!isSafeRelativePath(unixish)) {
    return { ok: false, code: 'E_PATH', message: 'The path is not a safe workspace-relative path.' };
  }
  const absolute = api.resolve(root, unixish);
  if (!isPathInside(root, absolute, platform)) {
    return { ok: false, code: 'E_PATH', message: 'The path is outside the workspace.' };
  }
  return {
    ok: true,
    absolutePath: api.normalize(absolute),
    relativePath: toWorkspaceRelative(root, absolute, platform),
  };
}
