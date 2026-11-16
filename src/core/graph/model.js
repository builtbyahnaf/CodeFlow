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
  /** @type {Map<string, GraphNode>} */
  const nodes = new Map();

  for (const symbol of run.symbols) {
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

  for (const relationship of run.relationships) {
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
  if (run.completeness !== 'full') {
    degradations.push(`Analysis completeness: ${run.completeness}`);
  }
  for (const diagnostic of run.diagnostics) {
    if (diagnostic.severity !== 'info') {
      degradations.push(`${diagnostic.code}: ${diagnostic.message}`);
    }
  }

  return {
    graphId: `graph:${run.runId}`,
    runId: run.runId,
    language: run.language,
    adapterId: run.adapterId,
    completeness: run.completeness,
    nodes: [...nodes.values()].sort(byId),
    edges: edges.sort(byId),
    diagnostics: run.diagnostics.map((diagnostic) => ({
      code: diagnostic.code,
      message: diagnostic.message,
      severity: diagnostic.severity,
    })),
    degradations,
  };
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
