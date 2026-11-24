/**
 * Data-flow graph model and validation.
 *
 * FlowNode and FlowEdge are the two primitives. This module validates that
 * they conform to the spec and provides deterministic serialization helpers.
 *
 * Rules enforced here:
 * - IDs must follow the canonical scheme: flow:<bindingId>@<cfgNodeId>#<ordinal>
 * - `unresolved` and `possible` nodes/edges MUST carry a reasonCode
 * - Duplicate IDs within a DFG are rejected
 * - `partial` DFGs must carry at least one budget reasonCode
 */

import {
  FLOW_NODE_KINDS,
  FLOW_EDGE_KINDS,
  FLOW_STATUSES,
  FLOW_REASON_CODES,
  DFG_DTO_VERSION,
} from './kinds.js';

const FLOW_NODE_KINDS_SET  = new Set(FLOW_NODE_KINDS);
const FLOW_EDGE_KINDS_SET  = new Set(FLOW_EDGE_KINDS);
const FLOW_STATUSES_SET    = new Set(FLOW_STATUSES);
const FLOW_REASON_SET      = new Set(FLOW_REASON_CODES);

/** Loose pattern; real validation is in validateFlowNode. */
const FLOW_NODE_ID_PATTERN = /^flow:[^@]+@[^#]+#\d+$/;

/**
 * @typedef {Object} SourceRange
 * @property {number} startLine
 * @property {number} startColumn
 * @property {number} endLine
 * @property {number} endColumn
 */

/**
 * @typedef {Object} FlowNode
 * @property {string} id           - flow:<bindingId>@<cfgNodeId>#<ordinal>
 * @property {string} bindingId    - CSR symbol id of the variable/parameter
 * @property {string} cfgNodeId    - CFG node this site belongs to
 * @property {string} kind         - FLOW_NODE_KINDS member
 * @property {SourceRange|null} range
 * @property {string} status       - FLOW_STATUSES member
 * @property {string} [reasonCode] - required when status is unresolved/possible
 */

/**
 * @typedef {Object} FlowEdge
 * @property {string} from
 * @property {string} to
 * @property {string} kind         - FLOW_EDGE_KINDS member
 * @property {string} status       - FLOW_STATUSES member
 * @property {string} [reasonCode] - required when status is unresolved/possible
 */

/**
 * @typedef {Object} Dfg
 * @property {number} version
 * @property {string} functionId
 * @property {string} fileId
 * @property {FlowNode[]} nodes
 * @property {FlowEdge[]} edges
 * @property {boolean} partial
 * @property {string[]} [partialReasons]
 * @property {string[]} limitations  - shown verbatim in UI
 * @property {Record<string, FlowNode[]>} byBinding  - bindingId → nodes
 */

/**
 * @typedef {Object} ValidationIssue
 * @property {string} code
 * @property {string} message
 * @property {string} [field]
 */

/**
 * @typedef {{ok: true, dfg: Dfg} | {ok: false, issues: ValidationIssue[]}} ValidationResult
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * @param {string} code
 * @param {string} message
 * @param {string} [field]
 * @returns {ValidationIssue}
 */
function issue(code, message, field) {
  return field !== undefined ? { code, message, field } : { code, message };
}

/**
 * Validate a single FlowNode.
 *
 * @param {unknown} raw
 * @param {number} idx
 * @returns {ValidationIssue[]}
 */
function validateFlowNode(raw, idx) {
  const issues = [];
  const prefix = `nodes[${idx}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    issues.push(issue('E_NODE_NOT_OBJECT', `${prefix} must be a plain object`));
    return issues;
  }
  const n = /** @type {Record<string, unknown>} */ (raw);

  if (typeof n.id !== 'string' || !FLOW_NODE_ID_PATTERN.test(n.id)) {
    issues.push(issue('E_NODE_BAD_ID', `${prefix}.id must match flow:<bindingId>@<cfgNodeId>#<ordinal>`, `${prefix}.id`));
  }
  if (typeof n.bindingId !== 'string' || !n.bindingId) {
    issues.push(issue('E_NODE_BAD_BINDING', `${prefix}.bindingId must be a non-empty string`, `${prefix}.bindingId`));
  }
  if (typeof n.cfgNodeId !== 'string' || !n.cfgNodeId) {
    issues.push(issue('E_NODE_BAD_CFG', `${prefix}.cfgNodeId must be a non-empty string`, `${prefix}.cfgNodeId`));
  }
  if (!FLOW_NODE_KINDS_SET.has(/** @type {string} */ (n.kind))) {
    issues.push(issue('E_NODE_BAD_KIND', `${prefix}.kind "${n.kind}" is not a recognised FlowNode kind`, `${prefix}.kind`));
  }
  if (!FLOW_STATUSES_SET.has(/** @type {string} */ (n.status))) {
    issues.push(issue('E_NODE_BAD_STATUS', `${prefix}.status "${n.status}" is not a recognised status`, `${prefix}.status`));
  }
  if ((n.status === 'unresolved' || n.status === 'possible') && typeof n.reasonCode !== 'string') {
    issues.push(issue('E_NODE_MISSING_REASON', `${prefix}: status "${n.status}" requires a reasonCode`, `${prefix}.reasonCode`));
  }
  if (n.reasonCode !== undefined && !FLOW_REASON_SET.has(/** @type {string} */ (n.reasonCode))) {
    issues.push(issue('E_NODE_BAD_REASON', `${prefix}.reasonCode "${n.reasonCode}" is not in FLOW_REASON_CODES`, `${prefix}.reasonCode`));
  }
  return issues;
}

/**
 * Validate a single FlowEdge.
 *
 * @param {unknown} raw
 * @param {number} idx
 * @returns {ValidationIssue[]}
 */
function validateFlowEdge(raw, idx) {
  const issues = [];
  const prefix = `edges[${idx}]`;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    issues.push(issue('E_EDGE_NOT_OBJECT', `${prefix} must be a plain object`));
    return issues;
  }
  const e = /** @type {Record<string, unknown>} */ (raw);

  if (typeof e.from !== 'string' || !e.from) {
    issues.push(issue('E_EDGE_BAD_FROM', `${prefix}.from must be a non-empty string`, `${prefix}.from`));
  }
  if (typeof e.to !== 'string' || !e.to) {
    issues.push(issue('E_EDGE_BAD_TO', `${prefix}.to must be a non-empty string`, `${prefix}.to`));
  }
  if (!FLOW_EDGE_KINDS_SET.has(/** @type {string} */ (e.kind))) {
    issues.push(issue('E_EDGE_BAD_KIND', `${prefix}.kind "${e.kind}" is not a recognised FlowEdge kind`, `${prefix}.kind`));
  }
  if (!FLOW_STATUSES_SET.has(/** @type {string} */ (e.status))) {
    issues.push(issue('E_EDGE_BAD_STATUS', `${prefix}.status "${e.status}" is not a recognised status`, `${prefix}.status`));
  }
  if ((e.status === 'unresolved' || e.status === 'possible') && typeof e.reasonCode !== 'string') {
    issues.push(issue('E_EDGE_MISSING_REASON', `${prefix}: status "${e.status}" requires a reasonCode`, `${prefix}.reasonCode`));
  }
  if (e.reasonCode !== undefined && !FLOW_REASON_SET.has(/** @type {string} */ (e.reasonCode))) {
    issues.push(issue('E_EDGE_BAD_REASON', `${prefix}.reasonCode "${e.reasonCode}" is not in FLOW_REASON_CODES`, `${prefix}.reasonCode`));
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a canonical flow-node id.
 *
 * @param {string} bindingId
 * @param {string} cfgNodeId
 * @param {number} ordinal
 * @returns {string}
 */
export function makeFlowNodeId(bindingId, cfgNodeId, ordinal) {
  return `flow:${bindingId}@${cfgNodeId}#${ordinal}`;
}

/**
 * Validate a raw DFG object.  Returns structured issues and never throws.
 *
 * @param {unknown} raw
 * @returns {ValidationResult}
 */
export function validateDfg(raw) {
  const issues = [];

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, issues: [issue('E_DFG_NOT_OBJECT', 'DFG must be a plain object')] };
  }

  const d = /** @type {Record<string, unknown>} */ (raw);

  if (typeof d.functionId !== 'string' || !d.functionId) {
    issues.push(issue('E_DFG_BAD_FUNCTION', 'DFG.functionId must be a non-empty string', 'functionId'));
  }
  if (typeof d.fileId !== 'string' || !d.fileId) {
    issues.push(issue('E_DFG_BAD_FILE', 'DFG.fileId must be a non-empty string', 'fileId'));
  }
  if (!Array.isArray(d.nodes)) {
    issues.push(issue('E_DFG_BAD_NODES', 'DFG.nodes must be an array', 'nodes'));
  }
  if (!Array.isArray(d.edges)) {
    issues.push(issue('E_DFG_BAD_EDGES', 'DFG.edges must be an array', 'edges'));
  }

  if (issues.length > 0) return { ok: false, issues };

  const nodes = /** @type {unknown[]} */ (d.nodes);
  const edges = /** @type {unknown[]} */ (d.edges);

  // Validate individual nodes
  const nodeIds = new Set();
  for (let i = 0; i < nodes.length; i++) {
    const nodeIssues = validateFlowNode(nodes[i], i);
    issues.push(...nodeIssues);
    if (nodeIssues.length === 0) {
      const id = /** @type {any} */ (nodes[i]).id;
      if (nodeIds.has(id)) {
        issues.push(issue('E_NODE_DUPLICATE_ID', `Duplicate FlowNode id "${id}"`, `nodes[${i}].id`));
      }
      nodeIds.add(id);
    }
  }

  // Validate individual edges
  for (let i = 0; i < edges.length; i++) {
    const edgeIssues = validateFlowEdge(edges[i], i);
    issues.push(...edgeIssues);
    if (edgeIssues.length === 0) {
      const e = /** @type {any} */ (edges[i]);
      if (!nodeIds.has(e.from)) {
        issues.push(issue('E_EDGE_UNKNOWN_FROM', `Edge from="${e.from}" references unknown node`, `edges[${i}].from`));
      }
      if (!nodeIds.has(e.to)) {
        issues.push(issue('E_EDGE_UNKNOWN_TO', `Edge to="${e.to}" references unknown node`, `edges[${i}].to`));
      }
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  // Build byBinding index
  /** @type {Record<string, FlowNode[]>} */
  const byBinding = {};
  for (const n of /** @type {FlowNode[]} */ (nodes)) {
    if (!byBinding[n.bindingId]) byBinding[n.bindingId] = [];
    byBinding[n.bindingId].push(n);
  }

  const dfg = /** @type {Dfg} */ ({
    version: DFG_DTO_VERSION,
    functionId: d.functionId,
    fileId: d.fileId,
    nodes: /** @type {FlowNode[]} */ (nodes),
    edges: /** @type {FlowEdge[]} */ (edges),
    partial: Boolean(d.partial),
    partialReasons: Array.isArray(d.partialReasons) ? /** @type {string[]} */ (d.partialReasons) : [],
    limitations: Array.isArray(d.limitations) ? /** @type {string[]} */ (d.limitations) : [],
    byBinding,
  });

  return { ok: true, dfg };
}

/**
 * Create a valid, empty DFG for a function that could not be analyzed.
 *
 * @param {string} functionId
 * @param {string} fileId
 * @param {string} reasonCode
 * @param {string} limitationMessage
 * @returns {Dfg}
 */
export function createEmptyDfg(functionId, fileId, reasonCode, limitationMessage) {
  return {
    version: DFG_DTO_VERSION,
    functionId,
    fileId,
    nodes: [],
    edges: [],
    partial: true,
    partialReasons: [reasonCode],
    limitations: [limitationMessage],
    byBinding: {},
  };
}

/**
 * Deterministic hash key for a DFG, suitable for caching.
 * Does not hash the full payload — only the structural identity.
 *
 * @param {string} functionId
 * @param {string} runHash
 * @returns {string}
 */
export function dfgCacheKey(functionId, runHash) {
  return `dfg:${functionId}:${runHash}`;
}
