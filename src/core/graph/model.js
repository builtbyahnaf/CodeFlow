/**
 * Graph model.
 *
 * Turns a validated analysis run into a renderable graph. This module knows
 * about symbols, relationships, and provenance — and nothing about C++, JavaScript,
 * parsers, or the webview.
 *
 * Placeholder nodes are created for targets that were not resolved to a declared
 * symbol. That is deliberate: hiding an unresolved call would present a graph
 * that looks more complete than the analysis is.
 */

import { createQueryLayer } from '../csr/query.js';

/**
 * @typedef {import('../csr/entities.js').AnalysisRun} AnalysisRun
 * @typedef {import('../csr/entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('../csr/entities.js').Relationship} Relationship
 * @typedef {import('../csr/entities.js').SourceRange} SourceRange
 */

/**
 * @typedef {Object} GraphNode
 * @property {string} id
 * @property {string} label
 * @property {string} kind
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @property {SourceRange | null} range
 * @property {string | null} fileId
 * @property {boolean} external
 * @property {string} [badge]
 */

/**
 * @typedef {Object} GraphEdge
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {string} type
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @property {string} [reasonCode]
 * @property {string} label
 */

/**
 * @typedef {Object} Graph
 * @property {string} graphId
 * @property {string} runId
 * @property {string} language
 * @property {string} adapterId
 * @property {'full'|'partial'|'syntactic_only'} completeness
 * @property {GraphNode[]} nodes
 * @property {GraphEdge[]} edges
 * @property {Array<{code: string, message: string, severity: string}>} diagnostics
 * @property {string[]} degradations
 */

/**
 * @param {AnalysisRun} run
 * @returns {Graph}
 */
export function buildGraph(run) {
  // Core-to-core reads go through the query layer. The graph never walks CSR
  // arrays itself, so a validated run remains the single source of truth.
  const query = createQueryLayer(run);
  const info = valueOf(query.runInfo(), {
    runId: '',
    language: '',
    adapterId: '',
    completeness: 'partial',
  });
  const diagnostics = valueOf(query.diagnostics(), []);
  const symbols = valueOf(query.allSymbols(), []);
  const relationships = valueOf(query.allRelationships(), []);

  /** @type {Map<string, GraphNode>} */
  const nodes = new Map();

  for (const symbol of symbols) {
    nodes.set(symbol.symbolId, {
      id: symbol.symbolId,
      label: displayName(symbol),
      kind: symbol.kind,
      status: 'resolved',
      range: symbol.declaration,
      fileId: symbol.declaration.fileId,
      external: false,
    });
  }

  /** @type {GraphEdge[]} */
  const edges = [];
  const edgeIds = new Set();
  /** @type {string[]} */
  const skippedRelationships = [];

  for (const relationship of relationships) {
    if (!nodes.has(relationship.to)) {
      nodes.set(relationship.to, {
        id: relationship.to,
        label: placeholderLabel(relationship.to),
        kind: 'unknown',
        status: relationship.status === 'resolved' ? 'unresolved' : relationship.status,
        range: null,
        fileId: null,
        external: true,
        badge: relationship.reasonCode,
      });
    }

    if (!nodes.has(relationship.from)) {
      // An edge with no source symbol cannot be shown truthfully. Skip it and
      // record it as a degradation instead of inventing a node.
      skippedRelationships.push(relationship.relationshipId);
      continue;
    }

    if (edgeIds.has(relationship.relationshipId)) {
      continue;
    }
    edgeIds.add(relationship.relationshipId);

    edges.push({
      id: relationship.relationshipId,
      from: relationship.from,
      to: relationship.to,
      type: relationship.type,
      status: relationship.status,
      reasonCode: relationship.reasonCode,
      label: relationship.reasonCode
        ? `${relationship.type} · ${relationship.reasonCode}`
        : relationship.type,
    });
  }

  const degradations = [];
  if (info.completeness !== 'full') {
    degradations.push(`Analysis completeness: ${info.completeness}`);
  }
  for (const relationshipId of skippedRelationships) {
    degradations.push(
      `Skipped relationship ${relationshipId}: its source symbol was not declared.`,
    );
  }
  for (const diagnostic of diagnostics) {
    if (diagnostic.severity !== 'info') {
      degradations.push(`${diagnostic.code}: ${diagnostic.message}`);
    }
  }

  return {
    graphId: `graph:${info.runId}`,
    runId: info.runId,
    language: info.language,
    adapterId: info.adapterId,
    completeness: info.completeness,
    nodes: [...nodes.values()].sort(byId),
    edges: edges.sort(byId),
    diagnostics: diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity,
    })),
    degradations,
  };
}

/**
 * Aggregate queries cannot fail for a validated run. This guard keeps the graph
 * total if that invariant ever changes.
 *
 * @template T
 * @param {{ok: true, value: T} | {ok: false, code: string, message: string}} result
 * @param {T} fallback
 * @returns {T}
 */
function valueOf(result, fallback) {
  return result.ok ? result.value : fallback;
}

/**
 * @param {string} a
 * @param {string} b
 */
function byId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * @param {SymbolRecord} symbol
 * @returns {string}
 */
function displayName(symbol) {
  if (symbol.kind === 'file') {
    return symbol.name || symbol.qualifiedName;
  }
  return symbol.name || symbol.qualifiedName || symbol.symbolId;
}

/**
 * Derive a readable label from an unresolved target id without pretending to
 * know what it is.
 *
 * @param {string} targetId
 * @returns {string}
 */
function placeholderLabel(targetId) {
  const segments = String(targetId).split(/[.:/]/).filter(Boolean);
  return segments.length > 0 ? segments[segments.length - 1] : String(targetId);
}
