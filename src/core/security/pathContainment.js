/**
 * Security Path Containment & Sanitization (Phase 12 §9, P12-18, AC-12.11).
 *
 * Enforces strict filesystem boundary containment, preventing path traversal
 * attacks (..), UNC escapes (\\server\share), null-byte injections, and Windows
 * drive/case-sensitivity bypasses.
 */

import path from 'node:path';

/**
 * Check whether a candidate file path is safely contained within an authorized root directory.
 *
 * @param {string} candidatePath
 * @param {string} rootPath
 * @returns {{ safe: boolean, normalizedPath: string, reason?: string }}
 */
export function validatePathContainment(candidatePath, rootPath) {
  if (typeof candidatePath !== 'string' || !candidatePath.trim()) {
    return { safe: false, normalizedPath: '', reason: 'Candidate path is empty or non-string' };
  }
  if (typeof rootPath !== 'string' || !rootPath.trim()) {
    return { safe: false, normalizedPath: '', reason: 'Root path is empty or non-string' };
  }

  // Reject null-byte injection
  if (candidatePath.includes('\0') || rootPath.includes('\0')) {
    return { safe: false, normalizedPath: '', reason: 'Null byte injection detected in path' };
  }

  // Reject UNC paths (\\host\share or //host/share)
  if (/^[\\/]{2}/.test(candidatePath)) {
    return { safe: false, normalizedPath: '', reason: 'UNC network paths are forbidden' };
  }

  // Resolve absolute paths
  const resolvedRoot = path.resolve(rootPath);
  const resolvedCandidate = path.isAbsolute(candidatePath)
    ? path.resolve(candidatePath)
    : path.resolve(resolvedRoot, candidatePath);

  // Normalize case for Windows case-insensitive comparisons
  const isWindows = process.platform === 'win32';
  const cmpRoot = isWindows ? resolvedRoot.toLowerCase() : resolvedRoot;
  const cmpCandidate = isWindows ? resolvedCandidate.toLowerCase() : resolvedCandidate;

  // Root must match prefix exactly
  const rel = path.relative(resolvedRoot, resolvedCandidate);
  if (rel.startsWith('..') || path.isAbsolute(rel) || (!cmpCandidate.startsWith(cmpRoot))) {
    return {
      safe: false,
      normalizedPath: resolvedCandidate,
      reason: `Path "${candidatePath}" escapes root boundary "${rootPath}"`,
    };
  }

  return { safe: true, normalizedPath: resolvedCandidate };
}
