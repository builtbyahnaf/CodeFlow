/**
 * Def/use/kill extraction from CFG nodes.
 *
 * This module answers one narrow question: given a CFG node and the bindings
 * visible in its function, which bindings does the node define, use, or kill?
 *
 * It is INTENTIONALLY language-neutral. Language-specific nuances (reference
 * parameters, closures, eval, templates) are handled by degrading status/reason
 * rather than by branching on a language tag inside the algorithm.
 *
 * The extraction is conservative: when mutation cannot be ruled out, we emit a
 * kill/possible marker rather than keeping the previous definition live.
 */

import { makeFlowNodeId } from './model.js';

/**
 * @typedef {Object} BindingRecord
 * @property {string} id          - CSR symbol id
 * @property {string} name
 * @property {string} kind        - 'local'|'param'|'global'|'field'|'closure_capture'
 * @property {boolean} isMutable
 * @property {boolean} isReference  - C++ reference or pointer indirection
 * @property {boolean} isClosure    - captured by an inner closure
 * @property {string} [language]
 */

/**
 * @typedef {Object} DefUseSite
 * @property {string} nodeId       - FlowNode id
 * @property {string} bindingId
 * @property {'def'|'use'|'defuse'|'kill'|'param'|'return'} kind
 * @property {string} status
 * @property {string} [reasonCode]
 * @property {object|null} range
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Map a construct kind string to a FlowNode kind.
 *
 * @param {string} constructOp  - operation from the CSR DataFact
 * @returns {'def'|'use'|'defuse'|'kill'|'param'|'return'}
 */
function constructOpToNodeKind(constructOp) {
  switch (constructOp) {
    case 'assign':
    case 'declare_init':
    case 'compound_assign':
    case 'destruct_assign':
    case 'increment':
    case 'decrement':
      return 'def';
    case 'read':
    case 'load':
      return 'use';
    case 'read_write':
    case 'increment_use':
    case 'decrement_use':
      return 'defuse';
    case 'param_entry':
      return 'param';
    case 'return_value':
      return 'return';
    case 'kill':
    case 'capture_kill':
      return 'kill';
    default:
      return 'use';  // conservative: treat unknown as use, never invent a def
  }
}

// ---------------------------------------------------------------------------
// Ordinal counter per (cfgNodeId, bindingId) to make IDs deterministic
// ---------------------------------------------------------------------------

/**
 * Assign ordinals deterministically.
 *
 * @param {Map<string, number>} ordinals  - mutated in place
 * @param {string} key
 * @returns {number}
 */
function nextOrdinal(ordinals, key) {
  const n = (ordinals.get(key) ?? -1) + 1;
  ordinals.set(key, n);
  return n;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Extract def/use/kill sites from a list of DataFacts attached to a CFG node.
 *
 * DataFacts are the language-adapter's output; each one carries:
 *   - bindingId   : CSR symbol id
 *   - op          : operation kind (see constructOpToNodeKind)
 *   - status      : resolution status
 *   - reasonCode? : degradation reason
 *   - range?      : source location
 *
 * @param {string} cfgNodeId
 * @param {Array<Record<string, unknown>>} dataFacts
 * @param {Map<string, number>} ordinalMap  - shared across all CFG nodes in fn
 * @returns {DefUseSite[]}
 */
export function extractSites(cfgNodeId, dataFacts, ordinalMap) {
  /** @type {DefUseSite[]} */
  const sites = [];

  for (const fact of dataFacts) {
    const bindingId = String(fact.bindingId ?? '');
    if (!bindingId) continue;

    const op = String(fact.op ?? 'read');
    const kind = constructOpToNodeKind(op);
    const status = String(fact.status ?? 'resolved');
    const reasonCode = fact.reasonCode !== undefined ? String(fact.reasonCode) : undefined;
    const range = fact.range ?? null;

    const ordKey = `${cfgNodeId}:${bindingId}`;
    const ordinal = nextOrdinal(ordinalMap, ordKey);
    const nodeId = makeFlowNodeId(bindingId, cfgNodeId, ordinal);

    /** @type {DefUseSite} */
    const site = {
      nodeId,
      bindingId,
      kind,
      status,
      range: range !== null && typeof range === 'object' ? range : null,
    };
    if (reasonCode !== undefined) site.reasonCode = reasonCode;

    sites.push(site);
  }

  return sites;
}

/**
 * Synthesize a parameter entry site for each function parameter binding.
 * Called once for the function's CFG entry node.
 *
 * @param {string} entryNodeId
 * @param {BindingRecord[]} params
 * @param {Map<string, number>} ordinalMap
 * @returns {DefUseSite[]}
 */
export function extractParamSites(entryNodeId, params, ordinalMap) {
  return params.map((p) => {
    const ordKey = `${entryNodeId}:${p.id}`;
    const ordinal = nextOrdinal(ordinalMap, ordKey);
    const nodeId = makeFlowNodeId(p.id, entryNodeId, ordinal);

    // Reference/pointer params: the param itself is resolved but
    // subsequent mutation through the binding is `possible`.
    const status = p.isReference ? 'possible' : 'resolved';
    /** @type {DefUseSite} */
    const site = {
      nodeId,
      bindingId: p.id,
      kind: 'param',
      status,
      range: null,
    };
    if (p.isReference) site.reasonCode = 'reference_parameter';
    return site;
  });
}

/**
 * Synthesize a kill site when a binding is passed to an unresolved or possible
 * call and the binding is mutable + reference-like.
 *
 * @param {string} cfgNodeId
 * @param {BindingRecord} binding
 * @param {string} callStatus  - 'unresolved'|'possible'
 * @param {Map<string, number>} ordinalMap
 * @returns {DefUseSite}
 */
