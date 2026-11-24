/**
 * Workspace containment validation for `.codeflow/` artifacts (Phase 8 §5, §8).
 *
 * Ensures every file read or written by the storage layer resolves strictly
 * inside `<workspaceRoot>/.codeflow/`.
 */

import path from 'node:path';

/**
 * Verify that `candidatePath` is inside `<workspaceRoot>/.codeflow`.
 *
 * @param {string} workspaceRoot
 * @param {string} candidatePath
 * @returns {{ok: true, resolved: string} | {ok: false, code: 'E_PATH_UNSAFE', message: string}}
 */
export function resolveCodeflowArtifactPath(workspaceRoot, candidatePath) {
  if (typeof workspaceRoot !== 'string' || workspaceRoot.trim().length === 0) {
    return {
      ok: false,
      code: 'E_PATH_UNSAFE',
      message: 'workspaceRoot must be a non-empty path.',
    };
  }
  const codeflowRoot = path.resolve(workspaceRoot, '.codeflow');
  const resolved = path.resolve(codeflowRoot, candidatePath);
  const rel = path.relative(codeflowRoot, resolved);
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    return {
      ok: false,
      code: 'E_PATH_UNSAFE',
      message: `Refusing to access path outside .codeflow/: ${candidatePath}`,
    };
  }
  return { ok: true, resolved };
}
