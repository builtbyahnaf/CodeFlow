/**
 * Graph view-model (DTO).
 *
 * The DTO is the only graph shape the webview understands. It is plain JSON:
 * no functions, no ids that require a lookup, no source text.
 *
 * Source text is fetched on demand in Phase 5 through a separate, validated
 * request. Keeping the DTO free of source prevents accidental leakage into
 * caches and keeps message sizes predictable.
 */

import { computeLayout } from './layout.js';
import { CFG_EDGE_KINDS, CFG_NODE_KINDS, CFG_STATUSES } from './cfg/kinds.js';
import { CALL_NODE_KINDS, CALL_RELATIONSHIP_TYPES, CALL_SCOPES } from './calls/kinds.js';
import { LEVEL_ORDER } from './zoom/levels.js';

export const GRAPH_DTO_VERSION = 1;

/**
 * @typedef {import('./model.js').Graph} Graph
 */

/**
 * @typedef {Object} DtoNode
 * @property {string} id
 * @property {string} label
 * @property {string} kind
 * @property {string} status
 * @property {string} badge
 * @property {boolean} external
 * @property {{fileId: string, startLine: number, endLine: number} | null} range
 * @property {{x: number, y: number, width: number, height: number, layer: number}} position
 */

/**
 * @typedef {Object} GraphDto
 * @property {number} dtoVersion
 * @property {string} graphId
 * @property {string} runId
 * @property {string} language
 * @property {string} adapterId
 * @property {string} completeness
 * @property {DtoNode[]} nodes
 * @property {Array<{id: string, from: string, to: string, type: string, status: string, label: string, reasonCode?: string}>} edges
 * @property {Array<{code: string, message: string, severity: string}>} diagnostics
 * @property {string[]} degradations
 * @property {{width: number, height: number}} extent
 * @property {{statuses: string[], kinds: string[]}} legend
 */

const STRUCTURAL_KINDS = new Set([
  'file',
  'module',
  'namespace',
  'class',
  'struct',
  'interface',
  'enum',
  'function',
  'method',
]);

/**
 * Rank nodes when capping an oversized overview graph so the scoped file and
 * high-level structural symbols are kept ahead of leaf locals/parameters.
 *
 * @param {Graph['nodes'][number]} node
 * @param {string|null|undefined} priorityFileId
 * @returns {number}
 */
function nodePriority(node, priorityFileId) {
  let score = 0;
  if (priorityFileId && node.fileId === priorityFileId) {
    score -= 100;
  }
  if (STRUCTURAL_KINDS.has(node.kind)) {
    score -= 20;
  }
  if (!node.external) {
    score -= 5;
  }
  return score;
}

/**
 * @param {Graph} graph
 * @param {{maxNodes?: number, priorityFileId?: string|null}} [options]
 * @returns {GraphDto}
 */
export function toDto(graph, options = {}) {
  const maxNodes =
    typeof options.maxNodes === 'number' && Number.isFinite(options.maxNodes) && options.maxNodes > 0
      ? Math.floor(options.maxNodes)
      : null;

  let workingGraph = graph;
  const extraDegradations = [];

  if (maxNodes !== null && graph.nodes.length > maxNodes) {
    const ranked = [...graph.nodes].sort((left, right) => {
      const diff =
        nodePriority(left, options.priorityFileId) - nodePriority(right, options.priorityFileId);
      return diff !== 0 ? diff : left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
    });
    const keptNodes = ranked.slice(0, maxNodes).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const keptIds = new Set(keptNodes.map((node) => node.id));
    const keptEdges = graph.edges.filter((edge) => keptIds.has(edge.from) && keptIds.has(edge.to));
    workingGraph = {
      ...graph,
      nodes: keptNodes,
      edges: keptEdges,
    };
    extraDegradations.push(
      `Overview graph capped to ${keptNodes.length} of ${graph.nodes.length} nodes for display.`,
    );
  }

  const layout = computeLayout(workingGraph);

  const nodes = workingGraph.nodes.map((node) => ({
    id: node.id,
    label: node.label,
    kind: node.kind,
    status: node.status,
    badge: node.badge ?? '',
    external: node.external,
    range: node.range
      ? {
          fileId: node.range.fileId,
          startLine: node.range.startLine,
          endLine: node.range.endLine,
        }
      : null,
    position: layout.positions[node.id] ?? { x: 0, y: 0, width: 190, height: 54, layer: 0 },
  }));

  const statuses = [...new Set(nodes.map((node) => node.status))].sort();
  const kinds = [...new Set(nodes.map((node) => node.kind))].sort();

  return {
    dtoVersion: GRAPH_DTO_VERSION,
    graphId: workingGraph.graphId,
    runId: workingGraph.runId,
    language: workingGraph.language,
    adapterId: workingGraph.adapterId,
    completeness: workingGraph.completeness,
    nodes,
    edges: workingGraph.edges.map((edge) => {
      /** @type {{id: string, from: string, to: string, type: string, status: string, label: string, reasonCode?: string}} */
      const dtoEdge = {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        status: edge.status,
        label: edge.label,
      };
      // Omit the key entirely when absent so the DTO survives a JSON round-trip
      // unchanged (JSON cannot represent `undefined`).
      if (edge.reasonCode) {
        dtoEdge.reasonCode = edge.reasonCode;
      }
      return dtoEdge;
    }),
    diagnostics: workingGraph.diagnostics,
    degradations: [...workingGraph.degradations, ...extraDegradations],
    extent: { width: layout.width, height: layout.height },
    legend: { statuses, kinds },
  };
}

/**
 * @param {unknown} dto
 * @returns {{ok: true, dto: GraphDto} | {ok: false, issues: string[]}}
 */
export function validateDto(dto) {
  /** @type {string[]} */
  const issues = [];
  if (typeof dto !== 'object' || dto === null || Array.isArray(dto)) {
    return { ok: false, issues: ['DTO must be an object.'] };
  }
  const candidate = /** @type {Record<string, unknown>} */ (dto);
  if (candidate.dtoVersion !== GRAPH_DTO_VERSION) {
    issues.push(`Unsupported dtoVersion: ${String(candidate.dtoVersion)}.`);
  }
  if (candidate.dtoKind === 'cfg') {
    validateCfgDto(candidate, issues);
    return issues.length > 0
      ? { ok: false, issues }
      : { ok: true, dto: /** @type {GraphDto} */ (dto) };
  }
  if (candidate.dtoKind === 'call_graph') {
    validateCallGraphDto(candidate, issues);
    return issues.length > 0
      ? { ok: false, issues }
      : { ok: true, dto: /** @type {GraphDto} */ (dto) };
  }
  if (candidate.dtoKind === 'semantic_zoom') {
    validateSemanticZoomDto(candidate, issues);
    return issues.length > 0
      ? { ok: false, issues }
      : { ok: true, dto: /** @type {GraphDto} */ (dto) };
  }
  const nodes = candidate.nodes;
  const edges = candidate.edges;
  if (!Array.isArray(nodes)) {
    issues.push('nodes must be an array.');
  }
  if (!Array.isArray(edges)) {
    issues.push('edges must be an array.');
  }
  if (Array.isArray(nodes) && Array.isArray(edges)) {
    const ids = new Set();
    for (const node of nodes) {
      const id = /** @type {Record<string, unknown>} */ (node).id;
      if (typeof id !== 'string') {
        issues.push('Every node needs a string id.');
        continue;
      }
      if (ids.has(id)) {
        issues.push(`Duplicate node id "${id}".`);
      }
      ids.add(id);
    }
    for (const edge of edges) {
      const record = /** @type {Record<string, unknown>} */ (edge);
      if (typeof record.from !== 'string' || !ids.has(record.from)) {
        issues.push(`Edge "${String(record.id)}" has an unknown source node.`);
      }
      if (typeof record.to !== 'string' || !ids.has(record.to)) {
        issues.push(`Edge "${String(record.id)}" has an unknown target node.`);
      }
    }
  }
  if (issues.length > 0) {
    return { ok: false, issues };
  }
  return { ok: true, dto: /** @type {GraphDto} */ (dto) };
}

/**
 * @param {Record<string, unknown>} candidate
 * @param {string[]} issues
 */
function validateCfgDto(candidate, issues) {
  if (candidate.graphKind !== 'cfg') {
    issues.push('A CFG DTO must declare graphKind "cfg".');
  }
  const fn = candidate.function;
  if (typeof fn !== 'object' || fn === null || Array.isArray(fn)) {
    issues.push('function must be an object.');
  } else {
    const record = /** @type {Record<string, unknown>} */ (fn);
    for (const key of ['symbolId', 'name', 'qualifiedName', 'kind']) {
      if (typeof record[key] !== 'string') {
        issues.push(`function.${key} must be a string.`);
      }
    }
    if (record.range !== null && !isRangeRef(record.range)) {
      issues.push('function.range must be a range reference or null.');
    }
  }

  const nodes = candidate.nodes;
  const edges = candidate.edges;
  if (!Array.isArray(nodes)) {
    issues.push('nodes must be an array.');
    return;
  }
  if (!Array.isArray(edges)) {
    issues.push('edges must be an array.');
    return;
  }

  const ids = new Set();
  /** @type {string[]} */
  const entryIds = [];
  /** @type {string[]} */
  const exitIds = [];
  for (const entry of nodes) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      issues.push('Every node must be an object.');
      continue;
    }
    const node = /** @type {Record<string, unknown>} */ (entry);
    const id = node.id;
    if (typeof id !== 'string') {
      issues.push('Every node needs a string id.');
      continue;
    }
    if (ids.has(id)) {
      issues.push(`Duplicate node id "${id}".`);
    }
    ids.add(id);
    if (!CFG_NODE_KINDS.includes(String(node.kind))) {
      issues.push(`Node "${id}" has unknown kind "${String(node.kind)}".`);
    }
    if (!CFG_STATUSES.includes(String(node.status))) {
      issues.push(`Node "${id}" has unknown status "${String(node.status)}".`);
    }
    if (typeof node.label !== 'string') {
      issues.push(`Node "${id}" needs a string label.`);
    }
    if (
      !Array.isArray(node.labelLines) ||
      node.labelLines.some((line) => typeof line !== 'string')
    ) {
      issues.push(`Node "${id}" needs string labelLines.`);
    }
    if (node.range !== null && !isRangeRef(node.range)) {
      issues.push(`Node "${id}" has an invalid range reference.`);
    }
    if (!isPosition(node.position)) {
      issues.push(`Node "${id}" has an invalid position.`);
    }
    if (node.kind === 'entry') {
      entryIds.push(id);
    }
    if (node.kind === 'exit') {
      exitIds.push(id);
    }
    if (node.calls !== undefined) {
      if (!Array.isArray(node.calls)) {
        issues.push(`Node "${id}" calls must be an array when present.`);
      } else {
        for (const call of node.calls) {
          if (
            typeof call !== 'object' ||
            call === null ||
            typeof call.to !== 'string' ||
            typeof call.label !== 'string' ||
            !CFG_STATUSES.includes(String(call.status))
          ) {
            issues.push(`Node "${id}" has an invalid call target.`);
          }
        }
      }
    }
  }
  if (entryIds.length !== 1) {
    issues.push(`A CFG needs exactly one entry node; found ${entryIds.length}.`);
  }
  if (exitIds.length !== 1) {
    issues.push(`A CFG needs exactly one exit node; found ${exitIds.length}.`);
  }
  if (candidate.entryId !== entryIds[0]) {
    issues.push('entryId must reference the entry node.');
  }
  if (candidate.exitId !== exitIds[0]) {
    issues.push('exitId must reference the exit node.');
  }

  const edgeIds = new Set();
  for (const entry of edges) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      issues.push('Every edge must be an object.');
      continue;
    }
    const edge = /** @type {Record<string, unknown>} */ (entry);
    const id = edge.id;
    if (typeof id !== 'string') {
      issues.push('Every edge needs a string id.');
      continue;
    }
    if (edgeIds.has(id)) {
      issues.push(`Duplicate edge id "${id}".`);
    }
    edgeIds.add(id);
    if (typeof edge.from !== 'string' || !ids.has(edge.from)) {
      issues.push(`Edge "${id}" has an unknown source node.`);
    }
    if (typeof edge.to !== 'string' || !ids.has(edge.to)) {
      issues.push(`Edge "${id}" has an unknown target node.`);
    }
    if (!CFG_EDGE_KINDS.includes(String(edge.kind))) {
      issues.push(`Edge "${id}" has unknown kind "${String(edge.kind)}".`);
    }
    if (!CFG_STATUSES.includes(String(edge.status))) {
      issues.push(`Edge "${id}" has unknown status "${String(edge.status)}".`);
    }
    if (typeof edge.label !== 'string') {
      issues.push(`Edge "${id}" needs a string label.`);
    }
    if (typeof edge.dash !== 'string' || typeof edge.glyphHint !== 'string') {
      issues.push(`Edge "${id}" needs string dash and glyphHint fields.`);
    }
  }

  const degradations = candidate.degradations;
  if (!Array.isArray(degradations)) {
    issues.push('degradations must be an array.');
  } else {
    for (const entry of degradations) {
      if (
        typeof entry !== 'object' ||
        entry === null ||
        typeof entry.code !== 'string' ||
        typeof entry.message !== 'string' ||
        !['info', 'warning', 'error'].includes(String(entry.severity))
      ) {
        issues.push('Every degradation needs a code, message and severity.');
      }
    }
  }

  const extent = candidate.extent;
  if (
    typeof extent !== 'object' ||
    extent === null ||
    !Number.isFinite(extent.width) ||
    !Number.isFinite(extent.height)
  ) {
    issues.push('extent must carry finite width and height.');
  }
}

/**
 * Validate a Phase 7 Call Graph DTO.
 *
 * @param {Record<string, unknown>} candidate
 * @param {string[]} issues
 */
function validateCallGraphDto(candidate, issues) {
  if (candidate.graphKind !== 'call_graph') {
    issues.push('A Call Graph DTO must declare graphKind "call_graph".');
  }
  if (typeof candidate.centerSymbolId !== 'string' || candidate.centerSymbolId.length === 0) {
    issues.push('centerSymbolId must be a non-empty string.');
  }
  if (!CALL_SCOPES.includes(String(candidate.scope))) {
    issues.push(`scope must be one of ${CALL_SCOPES.join(', ')}.`);
  }
  if (typeof candidate.scopeBanner !== 'string' || candidate.scopeBanner.length === 0) {
    issues.push('scopeBanner must be a non-empty string.');
  }

  const nodes = candidate.nodes;
  const edges = candidate.edges;
  if (!Array.isArray(nodes)) {
    issues.push('nodes must be an array.');
    return;
  }
  if (!Array.isArray(edges)) {
    issues.push('edges must be an array.');
    return;
  }

  const ids = new Set();
  for (const entry of nodes) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      issues.push('Every node must be an object.');
      continue;
    }
    const node = /** @type {Record<string, unknown>} */ (entry);
    const id = node.id;
    if (typeof id !== 'string') {
      issues.push('Every node needs a string id.');
      continue;
    }
    if (ids.has(id)) {
      issues.push(`Duplicate node id "${id}".`);
    }
    ids.add(id);
    if (!CALL_NODE_KINDS.includes(String(node.kind))) {
      issues.push(`Node "${id}" has unknown call-graph kind "${String(node.kind)}".`);
    }
    if (!CFG_STATUSES.includes(String(node.status))) {
      issues.push(`Node "${id}" has unknown status "${String(node.status)}".`);
    }
    if (!isPosition(node.position)) {
      issues.push(`Node "${id}" has an invalid position.`);
    }
  }

  const edgeIds = new Set();
  for (const entry of edges) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      issues.push('Every edge must be an object.');
      continue;
    }
    const edge = /** @type {Record<string, unknown>} */ (entry);
    const id = edge.id;
    if (typeof id !== 'string') {
      issues.push('Every edge needs a string id.');
      continue;
    }
    if (edgeIds.has(id)) {
      issues.push(`Duplicate edge id "${id}".`);
    }
    edgeIds.add(id);
    if (typeof edge.from !== 'string' || !ids.has(edge.from)) {
      issues.push(`Edge "${id}" has an unknown source node.`);
    }
    if (typeof edge.to !== 'string' || !ids.has(edge.to)) {
      issues.push(`Edge "${id}" has an unknown target node.`);
    }
    if (!CALL_RELATIONSHIP_TYPES.includes(String(edge.type))) {
      issues.push(`Edge "${id}" has unknown type "${String(edge.type)}".`);
    }
    if (!CFG_STATUSES.includes(String(edge.status))) {
      issues.push(`Edge "${id}" has unknown status "${String(edge.status)}".`);
    }
    if (typeof edge.dash !== 'string' || typeof edge.glyphHint !== 'string') {
      issues.push(`Edge "${id}" needs string dash and glyphHint fields.`);
    }
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isRangeRef(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const range = /** @type {Record<string, unknown>} */ (value);
  return (
    typeof range.fileId === 'string' &&
    Number.isInteger(range.startLine) &&
    Number.isInteger(range.startColumn) &&
    Number.isInteger(range.endLine) &&
    Number.isInteger(range.endColumn) &&
    range.startLine >= 0 &&
    range.startColumn >= 0 &&
    range.endLine >= 0 &&
    range.endColumn >= 0
  );
}

/**
 * @param {Record<string, unknown>} candidate
 * @param {string[]} issues
 */
function validateSemanticZoomDto(candidate, issues) {
  if (typeof candidate.level !== 'string' || !LEVEL_ORDER.includes(candidate.level)) {
    issues.push(`Invalid semantic zoom level: ${String(candidate.level)}.`);
  }
  if (typeof candidate.scopeId !== 'string' || candidate.scopeId.length === 0) {
    issues.push('Semantic zoom DTO requires a non-empty scopeId.');
  }
  if (!Array.isArray(candidate.breadcrumbs) || candidate.breadcrumbs.length === 0) {
    issues.push('Semantic zoom DTO requires a non-empty breadcrumbs array.');
  }
  if (!Array.isArray(candidate.nodes)) {
    issues.push('Semantic zoom DTO requires a nodes array.');
  }
  if (!Array.isArray(candidate.edges)) {
    issues.push('Semantic zoom DTO requires an edges array.');
  }
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPosition(value) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const position = /** @type {Record<string, unknown>} */ (value);
  return (
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.width) &&
    Number.isFinite(position.height) &&
    Number.isInteger(position.layer)
  );
}

/**
 * @param {GraphDto} dto
 * @returns {string}
 */
export function serializeDto(dto) {
  return JSON.stringify(dto);
}

/**
 * @param {string} json
 * @returns {GraphDto}
 */
export function parseDto(json) {
  const parsed = JSON.parse(json);
  const validation = validateDto(parsed);
  if (!validation.ok) {
    throw new Error(`Invalid graph DTO: ${validation.issues.join('; ')}`);
  }
  return validation.dto;
}
