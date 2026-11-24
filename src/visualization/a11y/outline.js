/**
 * Accessible Outline Mode (Phase 12 §5.2, P12-07, AC-12.9).
 *
 * Generates an accessible, structured, hierarchical text alternative to the SVG canvas graph.
 * Allows screen-reader users to traverse workspaces, modules, files, functions, and statements
 * with full parity of kind, status, uncertainty badges, and source locations.
 */

/**
 * @typedef {Object} OutlineItem
 * @property {string} id
 * @property {string} label
 * @property {string} role           - 'treeitem' | 'listitem'
 * @property {string} kind
 * @property {string} status
 * @property {string} [statusGlyph]
 * @property {string[]} badges
 * @property {string} [rangeDescription]
 * @property {number} level
 * @property {boolean} [expanded]
 * @property {number} [memberCount]
 * @property {OutlineItem[]} [children]
 */

/**
 * Map status string to an accessible screen-reader announcement label.
 *
 * @param {string} status
 * @returns {string}
 */
export function formatAriaStatus(status) {
  switch (status) {
    case 'resolved':
      return 'Proven resolved';
    case 'inferred':
      return 'Inferred by heuristic';
    case 'possible':
      return 'Possible but unconfirmed';
    case 'unresolved':
      return 'Unresolved capability gap';
    case 'stale':
      return 'Stale due to source edits';
    case 'mixed':
      return 'Mixed statuses present';
    default:
      return status;
  }
}

/**
 * Build an accessible hierarchical tree descriptor from a Semantic Zoom DTO.
 *
 * @param {{
 *   dtoKind?: string,
 *   level?: string,
 *   scopeId?: string,
 *   nodes?: Array<Record<string, any>>,
 *   edges?: Array<Record<string, any>>,
 *   membersByClusterId?: Map<string, Array<Record<string, any>>>,
 * }} zoomDto
 * @returns {{
 *   title: string,
 *   ariaLabel: string,
 *   level: string,
 *   itemCount: number,
 *   items: OutlineItem[],
 * }}
 */
export function buildAccessibleOutline(zoomDto) {
  const levelName = zoomDto?.level ?? 'overview';
  const nodes = Array.isArray(zoomDto?.nodes) ? zoomDto.nodes : [];

  const items = nodes.map((node, index) => {
    const isCluster = Boolean(node.isCluster || node.memberCount);
    const range = node.range;
    let rangeDesc = '';
    if (range && typeof range.startLine === 'number') {
      rangeDesc = `Line ${range.startLine + 1}`;
      if (range.endLine && range.endLine > range.startLine) {
        rangeDesc += ` to ${range.endLine + 1}`;
      }
    }

    const badges = Array.isArray(node.badges) ? [...node.badges] : [];
    if (node.unmodeledCount && node.unmodeledCount > 0) {
      badges.push(`${node.unmodeledCount} unmodeled`);
    }

    /** @type {OutlineItem} */
    const item = {
      id: node.id ?? `item-${index}`,
      label: node.label ?? node.id ?? 'Unknown',
      role: 'treeitem',
      kind: node.kind ?? 'symbol',
      status: node.displayStatus ?? node.status ?? 'resolved',
      statusGlyph: node.glyph ?? (node.status === 'resolved' ? '✓' : '?'),
      badges,
      level: 1,
    };

    if (rangeDesc) {
      item.rangeDescription = rangeDesc;
    }

    if (isCluster) {
      item.expanded = Boolean(node.expanded);
      item.memberCount = node.memberCount ?? 0;
    }

    return item;
  });

  return {
    title: `CodeFlow Outline — ${levelName}`,
    ariaLabel: `Accessible code graph outline at level ${levelName}, containing ${items.length} items.`,
    level: levelName,
    itemCount: items.length,
    items,
  };
}

/**
 * Render outline items into an accessible HTML string snippet for screen readers.
 *
 * @param {ReturnType<typeof buildAccessibleOutline>} outline
 * @returns {string}
 */
export function renderOutlineHtml(outline) {
  const lines = [
    `<nav aria-label="${outline.ariaLabel}" class="cf-a11y-outline" role="navigation">`,
    `  <h2 class="cf-a11y-heading">${outline.title}</h2>`,
    `  <ul role="tree" aria-label="Graph hierarchy" tabindex="0">`,
  ];

  for (const item of outline.items) {
    const statusText = formatAriaStatus(item.status);
    const badgeText = item.badges.length > 0 ? ` [${item.badges.join(', ')}]` : '';
    const locText = item.rangeDescription ? ` (${item.rangeDescription})` : '';
    const clusterText = item.memberCount ? ` (Cluster: ${item.memberCount} members)` : '';

    lines.push(
      `    <li role="treeitem" id="a11y-${item.id}" aria-selected="false" tabindex="-1">`,
      `      <span class="cf-a11y-label">${item.label}</span>`,
      `      <span class="cf-a11y-kind">${item.kind}</span>`,
      `      <span class="cf-a11y-status" aria-label="Status: ${statusText}">${item.statusGlyph ?? ''} ${statusText}</span>${badgeText}${locText}${clusterText}`,
      `    </li>`,
    );
  }

  lines.push('  </ul>', '</nav>');
  return lines.join('\n');
}
