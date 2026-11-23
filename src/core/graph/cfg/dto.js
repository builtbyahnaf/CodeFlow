/**
 * CFG view-model.
 *
 * The DTO carries ranges, short derived labels, status and degradation codes.
 * It never carries source text: Phase 5 fetches the selected range through a
 * separate, validated request.
 */

import { layoutCfg } from './layout.js';

export const CFG_DTO_VERSION = 1;
export const CFG_RENDER_NODE_LIMIT = 2000;

/**
 * @typedef {import('./builder.js').Cfg} Cfg
 * @typedef {import('./builder.js').CfgNode} CfgNode
 * @typedef {import('./builder.js').CfgEdge} CfgEdge
 */

/**
 * @param {Cfg} cfg
 * @param {{maxNodes?: number}} [options]
 * @returns {Record<string, any>}
 */
export function toCfgDto(cfg, options = {}) {
  const limit = Math.max(10, options.maxNodes ?? CFG_RENDER_NODE_LIMIT);
  const truncated = cfg.nodes.length > limit;
  const keep = new Set();
  if (truncated) {
    for (const node of cfg.nodes.slice(0, limit)) {
      keep.add(node.id);
    }
    keep.add(cfg.entryId);
    keep.add(cfg.exitId);
  }
  const nodes = cfg.nodes
    .filter((node) => !truncated || keep.has(node.id))
    .map((node) => toNode(node));
  const edges = cfg.edges
    .filter((edge) => keep.size === 0 || (keep.has(edge.from) && keep.has(edge.to)))
    .map((edge) => toEdge(edge));

  const layout = layoutCfg({
    nodes: nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      unreachable: node.unreachable,
    })),
    edges,
  });

  const positioned = nodes.map((node) => ({
    ...node,
    position: layout.positions[node.id] ?? {
      x: 0,
      y: 0,
      width: 160,
      height: 52,
      layer: 0,
    },
  }));

  const degradations = cfg.degradations.map((entry) => ({ ...entry }));
  if (truncated) {
    degradations.push({
      code: 'truncated',
      message: `The graph was truncated to ${limit} nodes for rendering. ${cfg.nodes.length - limit} node(s) are not shown.`,
      severity: 'warning',
    });
  }

  const statuses = [...new Set(positioned.map((node) => node.status))].sort();
  const kinds = [...new Set(positioned.map((node) => node.kind))].sort();
  const edgeKinds = [...new Set(edges.map((edge) => edge.kind))].sort();

  return {
    dtoVersion: 1,
    dtoKind: 'cfg',
    graphId: cfg.graphId,
    runId: cfg.runId,
    language: cfg.language,
    adapterId: cfg.adapterId,
    completeness: cfg.completeness,
    analysisCompleteness: cfg.completeness,
    graphKind: 'cfg',
    function: {
      ...cfg.function,
      range: rangeRef(cfg.function.range),
    },
    nodes: positioned,
    edges,
    entryId: cfg.entryId,
    exitId: cfg.exitId,
    diagnostics: [],
    degradations,
    truncated,
    truncationReason: truncated ? `node-limit:${limit}` : null,
    extent: { width: layout.width, height: layout.height },
    legend: { statuses, kinds, edgeKinds },
    stats: { ...cfg.stats, renderedNodeCount: positioned.length, renderedEdgeCount: edges.length },
  };
}

/**
 * @param {CfgNode} node
 * @returns {Record<string, any>}
 */
function toNode(node) {
  const badges = [];
  if (node.status !== 'resolved') {
    badges.push(node.status);
  }
  if (node.unreachable) {
    badges.push('unreachable');
  }
  if (node.badge && !badges.includes(node.badge)) {
    badges.push(node.badge);
  }
  return {
    id: node.id,
    label: node.label,
    labelLines: labelLines(node.label),
    kind: node.kind,
    status: node.status,
    badge: node.badge ?? '',
    badges,
    external: false,
    isSynthetic: node.synthetic,
    unreachable: node.unreachable,
    range: node.range ? rangeRef(node.range) : null,
    rangeRef: node.range ? rangeRef(node.range) : null,
    ...(node.reasonCode ? { reasonCode: node.reasonCode } : {}),
    ...(node.constructId ? { constructId: node.constructId } : {}),
    ...(node.calls && node.calls.length > 0 ? { calls: node.calls.map((call) => ({ ...call })) } : {}),
  };
}

/**
 * @param {CfgEdge} edge
 * @returns {Record<string, any>}
 */
function toEdge(edge) {
  return {
    id: edge.id,
    from: edge.from,
    to: edge.to,
    type: edge.kind,
    kind: edge.kind,
    status: edge.status,
    label: edge.label,
    dash: edge.dash,
    glyphHint: edge.glyph,
    ...(edge.reasonCode ? { reasonCode: edge.reasonCode } : {}),
    ...(edge.caseValue !== undefined ? { caseValue: edge.caseValue } : {}),
  };
}

/**
 * @param {string} label
 * @returns {string[]}
 */
function labelLines(label) {
  const text = String(label ?? '');
  if (text.length <= 24) {
    return [text];
  }
  const lines = [];
  let rest = text;
  while (rest.length > 0 && lines.length < 3) {
    if (lines.length === 2 && rest.length > 24) {
      lines.push(`${rest.slice(0, 23)}…`);
      break;
    }
    lines.push(rest.slice(0, 24));
    rest = rest.slice(24);
  }
  return lines;
}

/**
 * @param {import('../../csr/entities.js').SourceRange|null|undefined} range
 * @returns {Record<string, number|string>|null}
 */
function rangeRef(range) {
  if (!range) {
    return null;
  }
  return {
    fileId: range.fileId,
    startLine: range.startLine,
    startColumn: range.startColumn,
    endLine: range.endLine,
    endColumn: range.endColumn,
    ...(Number.isInteger(range.startOffset) ? { startOffset: range.startOffset } : {}),
    ...(Number.isInteger(range.endOffset) ? { endOffset: range.endOffset } : {}),
  };
}

