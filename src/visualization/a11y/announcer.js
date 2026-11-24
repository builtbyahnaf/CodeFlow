/**
 * Accessibility Live Region Announcer (Phase 12 §5.2, P12-08, AC-12.9).
 *
 * Generates clear, concise, informative aria-live announcement strings
 * for screen readers during graph navigation, expansion, selection, and errors.
 */

/**
 * Build an announcement for semantic zoom level descent or navigation.
 *
 * @param {string} level
 * @param {string} scopeLabel
 * @param {number} nodeCount
 * @returns {string}
 */
export function announceLevelChange(level, scopeLabel, nodeCount) {
  const nodePlural = nodeCount === 1 ? '1 item' : `${nodeCount} items`;
  return `Navigated to ${level}: ${scopeLabel}. ${nodePlural} displayed.`;
}

/**
 * Build an announcement for cluster expansion.
 *
 * @param {string} clusterLabel
 * @param {number} revealedCount
 * @param {number} remainingCount
 * @returns {string}
 */
export function announceClusterExpansion(clusterLabel, revealedCount, remainingCount) {
  if (remainingCount <= 0) {
    return `Expanded cluster ${clusterLabel}. Showing all ${revealedCount} members.`;
  }
  return `Expanded cluster ${clusterLabel}. Showing ${revealedCount} members, ${remainingCount} remaining.`;
}

/**
 * Build an announcement for node selection.
 *
 * @param {{
 *   label: string,
 *   kind?: string,
 *   status?: string,
 *   range?: {startLine: number, endLine?: number}
 * }} node
 * @returns {string}
 */
export function announceSelection(node) {
  const kind = node.kind ? ` ${node.kind}` : '';
  const status = node.status ? `, status: ${node.status}` : '';
  let loc = '';
  if (node.range && typeof node.range.startLine === 'number') {
    loc = `, line ${node.range.startLine + 1}`;
  }
  return `Selected${kind} ${node.label}${status}${loc}.`;
}

/**
 * Build an announcement for stale source files.
 *
 * @param {string[]} filePaths
 * @returns {string}
 */
export function announceStaleSources(filePaths) {
  const count = filePaths.length;
  if (count === 1) {
    return `Notice: Source file ${filePaths[0]} was modified. Graph nodes for this file are stale.`;
  }
  return `Notice: ${count} source files were modified. Affected graph nodes are stale.`;
}

/**
 * Build an announcement for user-facing errors or limitation notices.
 *
 * @param {string} message
 * @param {'error'|'warning'|'info'} [severity]
 * @returns {string}
 */
export function announceNotice(message, severity = 'info') {
  const prefix = severity === 'error' ? 'Error: ' : severity === 'warning' ? 'Warning: ' : '';
  return `${prefix}${message}`;
}
