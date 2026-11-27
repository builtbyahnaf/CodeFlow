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
      labelLines: node.labelLines,
      badges: node.badges,
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
    labelLines: labelLines(node.label, node.kind),
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
    ...(node.details ? { details: { ...node.details } } : {}),
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
 * Wrap a single paragraph without losing any characters. Prefers spaces first;
 * when an expression has long unbroken call chains (like repeated
 * `document.getElementById(...)` calls separated by commas or dots), breaks
 * cleanly after punctuation delimiters inside `maxChars` instead of letting a
 * single line grow oversized.
 *
 * @param {string} paragraph
 * @param {number} maxChars
 * @returns {string[]}
 */
function wrapParagraph(paragraph, maxChars) {
  const text = paragraph.replace(/[ \t]+/g, ' ').trim();
  if (text.length === 0) {
    return [];
  }
  if (text.length <= maxChars) {
    return [text];
  }

  /** @type {string[]} */
  const lines = [];
  let rest = text;
  while (rest.length > maxChars) {
    let split = rest.lastIndexOf(' ', maxChars);
    if (split <= 0) {
      const nextSpace = rest.indexOf(' ', maxChars);
      if (nextSpace > 0 && nextSpace <= Math.floor(maxChars * 1.75)) {
        split = nextSpace;
      } else {
        // Long unbroken expression (e.g. chained DOM calls with no spaces):
        // break cleanly right after a delimiter so text still wraps inside box.
        const windowLimit = Math.min(rest.length - 1, Math.floor(maxChars * 1.4));
        let punctSplit = -1;
        for (let i = windowLimit; i >= Math.floor(maxChars * 0.35); i -= 1) {
          const ch = rest[i];
          if (ch === ',' || ch === ';' || ch === '(' || ch === '.' || ch === '&' || ch === '|') {
            punctSplit = i + 1;
            break;
          }
        }
        split = punctSplit > 0 ? punctSplit : Math.max(maxChars, Math.floor(maxChars * 1.3));
      }
    }
    const head = rest.slice(0, split).trimEnd();
    if (head.length > 0) {
      lines.push(head);
    }
    rest = rest.slice(split).trimStart();
  }
  if (rest.length > 0) {
    lines.push(rest);
  }
  return lines;
}

/**
 * Wrap a label without dropping any of it. Shapes that are not rectangles
 * (diamonds, hexagons, parallelograms) get a narrower wrap width so the text
 * stays inside the outline. Explicit newlines separate paragraphs cleanly.
 *
 * @param {string} label
 * @param {string} [kind]
 * @returns {string[]}
 */
export function labelLines(label, kind = 'statement') {
  const raw = String(label ?? '').trim();
  if (raw.length === 0) {
    return [''];
  }
  const maxChars =
    kind === 'condition'
      ? 28
      : kind === 'multiway' || kind === 'loop_header'
        ? 34
        : kind === 'entry' || kind === 'exit' || kind === 'return' || kind === 'throw'
          ? 36
          : 40;

  const paragraphs = raw.split(/\r?\n/);
  /** @type {string[]} */
  const lines = [];
  for (const para of paragraphs) {
    lines.push(...wrapParagraph(para, maxChars));
  }
  return lines.length > 0 ? lines : [''];
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

