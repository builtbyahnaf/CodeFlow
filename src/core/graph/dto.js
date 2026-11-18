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

/**
 * @param {Graph} graph
 * @returns {GraphDto}
 */
export function toDto(graph) {
  const layout = computeLayout(graph);

  const nodes = graph.nodes.map((node) => ({
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
    graphId: graph.graphId,
    runId: graph.runId,
    language: graph.language,
    adapterId: graph.adapterId,
    completeness: graph.completeness,
    nodes,
    edges: graph.edges.map((edge) => {
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
    diagnostics: graph.diagnostics,
    degradations: graph.degradations,
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
