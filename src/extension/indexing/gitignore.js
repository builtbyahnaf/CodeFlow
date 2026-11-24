/**
 * Non-intrusive `.gitignore` check and consent-guarded update for `.codeflow/`
 * (Phase 8 §10).
 *
 * CodeFlow must NEVER modify `.gitignore` without explicit user consent
 * (`consent === true`).
 */

import path from 'node:path';
import { createNodeFsAdapter } from '../../storage/indexStore.js';
import { parseGitignoreHints } from '../../core/indexing/exclusions.js';

/**
 * Inspect whether the workspace has a `.gitignore` and whether `.codeflow` is
 * already ignored.
 *
 * @param {string} workspaceRoot
 * @param {ReturnType<typeof createNodeFsAdapter>} [fsAdapter]
 * @returns {{hasGitignore: boolean, coversCodeflow: boolean, gitignorePath: string}}
 */
export function checkGitignoreStatus(workspaceRoot, fsAdapter = createNodeFsAdapter()) {
  const gitignorePath = path.resolve(workspaceRoot, '.gitignore');
  if (!fsAdapter.existsSync(gitignorePath)) {
    return {
      hasGitignore: false,
      coversCodeflow: false,
      gitignorePath,
    };
  }
  const raw = fsAdapter.readFileSync(gitignorePath, 'utf8');
  const patterns = parseGitignoreHints(raw);
  const coversCodeflow = patterns.some((pattern) => {
    const cleaned = pattern.replace(/\*+/g, '').replace(/^\/+|\/+$/g, '');
    return cleaned === '.codeflow';
  });
  return {
    hasGitignore: true,
    coversCodeflow,
    gitignorePath,
  };
}

/**
 * Append `.codeflow/` to `<workspaceRoot>/.gitignore` ONLY when `consent === true`.
 *
 * @param {string} workspaceRoot
 * @param {{consent: boolean, fsAdapter?: ReturnType<typeof createNodeFsAdapter>}} options
 * @returns {{ok: true, updated: boolean} | {ok: false, code: string, message: string}}
 */
export function addCodeflowToGitignore(
  workspaceRoot,
  { consent, fsAdapter = createNodeFsAdapter() },
) {
  if (consent !== true) {
    return {
      ok: false,
      code: 'E_CONSENT_REQUIRED',
      message: 'CodeFlow never modifies .gitignore without explicit user consent.',
    };
  }
  const status = checkGitignoreStatus(workspaceRoot, fsAdapter);
  if (status.coversCodeflow) {
    return { ok: true, updated: false };
  }
  const existing = status.hasGitignore ? fsAdapter.readFileSync(status.gitignorePath, 'utf8') : '';
  const separator = existing.length === 0 || existing.endsWith('\n') ? '' : '\n';
  const next = `${existing}${separator}# CodeFlow local index\n.codeflow/\n`;
  fsAdapter.writeFileSync(status.gitignorePath, next, 'utf8');
  return { ok: true, updated: true };
}
