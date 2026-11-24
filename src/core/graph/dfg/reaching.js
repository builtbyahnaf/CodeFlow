/**
 * Reaching-definition analysis over a CFG.
 *
 * Implements the classic forward monotone dataflow algorithm:
 *   OUT[n] = GEN[n] ∪ (IN[n] − KILL[n])
 *   IN[n]  = ∪ { OUT[p] | p ∈ predecessors(n) }
 *
 * The algorithm is worklist-based with two hard limits (iteration count and
 * wall-clock time) so it cannot block the extension. When either limit fires
 * the result is `partial` with reason `flow_budget_exceeded`.
 *
 * "Definitions" in this module are (bindingId, flowNodeId) pairs. A def
 * reaches a use when the def is in IN[use-node] and no intervening kill
 * destroys it.
 */

import { REACHING_DEF_BUDGET_ITERATIONS, REACHING_DEF_BUDGET_MS } from './kinds.js';

/**
 * @typedef {Object} CfgNodeShim
 * @property {string} id
 * @property {string} kind
 * @property {string[]} successors   - ids of successor CFG nodes
 * @property {string[]} predecessors - ids of predecessor CFG nodes
 */

/**
 * @typedef {Object} DefRecord
 * @property {string} bindingId
 * @property {string} flowNodeId    - the FlowNode that creates this def
 * @property {string} cfgNodeId     - which CFG node it lives in
 * @property {string} status
 * @property {string} [reasonCode]
 */

/**
 * @typedef {Object} ReachingResult
 * @property {boolean} partial
 * @property {string} [partialReason]
 * @property {Map<string, Set<string>>} inSets    - cfgNodeId → Set<"bindingId:flowNodeId">
 * @property {Map<string, Set<string>>} outSets
 */

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

/**
 * Encode a (bindingId, flowNodeId) pair as a single string key for Set
 * membership.
 *
 * @param {string} bindingId
 * @param {string} flowNodeId
 * @returns {string}
 */
export function encodeDefKey(bindingId, flowNodeId) {
  return `${bindingId}\x00${flowNodeId}`;
}

/**
 * Decode a def key back to its parts.
 *
 * @param {string} key
 * @returns {{ bindingId: string, flowNodeId: string }}
 */
export function decodeDefKey(key) {
  const sep = key.indexOf('\x00');
  return { bindingId: key.slice(0, sep), flowNodeId: key.slice(sep + 1) };
}

// ---------------------------------------------------------------------------
// GEN/KILL computation
// ---------------------------------------------------------------------------

/**
 * Compute GEN and KILL sets for every CFG node.
 *
 * GEN[n]  = defs created by n (last def per binding wins within node)
 * KILL[n] = all defs from other nodes for any binding that n defines
 *
 * @param {CfgNodeShim[]} nodes
 * @param {Map<string, DefRecord[]>} defsPerNode  - cfgNodeId → defs at that node
 * @returns {{ gen: Map<string, Set<string>>, kill: Map<string, Set<string>> }}
 */
export function computeGenKill(nodes, defsPerNode) {
  // Collect all defs per binding across the whole function
  /** @type {Map<string, string[]>} bindingId → all flowNodeIds that def it */
  const allDefsByBinding = new Map();
  for (const [, defs] of defsPerNode) {
    for (const d of defs) {
      let arr = allDefsByBinding.get(d.bindingId);
      if (!arr) { arr = []; allDefsByBinding.set(d.bindingId, arr); }
      arr.push(d.flowNodeId);
    }
  }

  /** @type {Map<string, Set<string>>} */
  const gen  = new Map();
  /** @type {Map<string, Set<string>>} */
  const kill = new Map();

  for (const node of nodes) {
    const defs = defsPerNode.get(node.id) ?? [];
    const genSet  = new Set();
    const killSet = new Set();

    // Bindings defined at this node: last def wins → gen set gets only the last
    /** @type {Map<string, DefRecord>} */
    const lastDef = new Map();
    for (const d of defs) {
      lastDef.set(d.bindingId, d);
    }

    for (const [bindingId, d] of lastDef) {
      genSet.add(encodeDefKey(bindingId, d.flowNodeId));
      // kill: all other defs for this binding
      const all = allDefsByBinding.get(bindingId) ?? [];
      for (const fid of all) {
        if (fid !== d.flowNodeId) {
          killSet.add(encodeDefKey(bindingId, fid));
        }
      }
    }

    gen.set(node.id, genSet);
    kill.set(node.id, killSet);
  }

  return { gen, kill };
}

// ---------------------------------------------------------------------------
// Fixpoint
// ---------------------------------------------------------------------------

/**
 * Run the reaching-definitions fixpoint.
 *
 * @param {CfgNodeShim[]} nodes         - all nodes in topological-ish order (entry first)
 * @param {Map<string, Set<string>>} gen
 * @param {Map<string, Set<string>>} kill
 * @param {number} [budgetIterations]
 * @param {number} [budgetMs]
 * @returns {ReachingResult}
 */
