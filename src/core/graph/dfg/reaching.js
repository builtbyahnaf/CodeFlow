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
export function reachingDefinitions(
  nodes,
  gen,
  kill,
  budgetIterations = REACHING_DEF_BUDGET_ITERATIONS,
  budgetMs = REACHING_DEF_BUDGET_MS,
  backEdges = [],
) {
  /** @type {Map<string, Set<string>>} */
  const inSets  = new Map();
  /** @type {Map<string, Set<string>>} */
  const outSets = new Map();
  /** @type {Map<string, Set<string>>} */
  const loopCarriedIn = new Map();
  /** @type {Map<string, Set<string>>} */
  const loopCarriedOut = new Map();

  const backEdgeSet = new Set(backEdges.map((e) => `${e.from}→${e.to}`));

  for (const n of nodes) {
    inSets.set(n.id, new Set());
    outSets.set(n.id, new Set());
    loopCarriedIn.set(n.id, new Set());
    loopCarriedOut.set(n.id, new Set());
  }

  // Build predecessor map for fast lookup
  /** @type {Map<string, string[]>} */
  const predMap = new Map();
  for (const n of nodes) {
    for (const succ of n.successors) {
      let arr = predMap.get(succ);
      if (!arr) { arr = []; predMap.set(succ, arr); }
      arr.push(n.id);
    }
  }

  const worklist = new Set(nodes.map((n) => n.id));
  const startMs = Date.now();
  let iterations = 0;

  while (worklist.size > 0) {
    if (++iterations > budgetIterations || Date.now() - startMs > budgetMs) {
      return { partial: true, partialReason: 'flow_budget_exceeded', inSets, outSets, loopCarriedIn };
    }

    const nodeId = worklist.values().next().value;
    worklist.delete(nodeId);

    // IN[n] = union of OUT[predecessors]
    const preds = predMap.get(nodeId) ?? [];
    const newIn = new Set();
    const newLcIn = new Set();
    for (const predId of preds) {
      const predOut = outSets.get(predId);
      const isBackEdge = backEdgeSet.has(`${predId}→${nodeId}`);
      if (predOut) {
        for (const k of predOut) {
          newIn.add(k);
          if (isBackEdge) {
            newLcIn.add(k);
          }
        }
      }
      const predLcOut = loopCarriedOut.get(predId);
      if (predLcOut) {
        for (const k of predLcOut) {
          newLcIn.add(k);
        }
      }
    }

    // OUT[n] = GEN[n] ∪ (IN[n] − KILL[n])
    const genSet  = gen.get(nodeId)  ?? new Set();
    const killSet = kill.get(nodeId) ?? new Set();
    const newOut  = new Set(genSet);
    const newLcOut = new Set();
    for (const k of newIn) {
      if (!killSet.has(k)) newOut.add(k);
    }
    for (const k of newLcIn) {
      if (!killSet.has(k)) newLcOut.add(k);
    }

    const oldIn  = inSets.get(nodeId)  ?? new Set();
    const oldOut = outSets.get(nodeId) ?? new Set();
    const oldLcIn = loopCarriedIn.get(nodeId) ?? new Set();

    // Check if changed
    let changed = false;
    if (newIn.size !== oldIn.size || newOut.size !== oldOut.size || newLcIn.size !== oldLcIn.size) {
      changed = true;
    } else {
      for (const k of newIn) if (!oldIn.has(k)) { changed = true; break; }
      if (!changed) for (const k of newOut) if (!oldOut.has(k)) { changed = true; break; }
      if (!changed) for (const k of newLcIn) if (!oldLcIn.has(k)) { changed = true; break; }
    }

    if (changed) {
      inSets.set(nodeId, newIn);
      outSets.set(nodeId, newOut);
      loopCarriedIn.set(nodeId, newLcIn);
      loopCarriedOut.set(nodeId, newLcOut);
      // Re-enqueue successors
      const node = nodes.find((n) => n.id === nodeId);
      if (node) for (const s of node.successors) worklist.add(s);
    }
  }

  return { partial: false, inSets, outSets, loopCarriedIn };
}

// ---------------------------------------------------------------------------
// Loop-carried edge detection
// ---------------------------------------------------------------------------

/**
 * Find all back edges in the CFG (edges from a node to a dominator / ancestor
 * in a DFS tree). These indicate potential loop-carried dependencies.
 *
 * Uses DFS coloring: white (0), grey (1 = on stack), black (2 = done).
 *
 * @param {CfgNodeShim[]} nodes
 * @param {string} entryId
 * @returns {Array<{from: string, to: string}>}
 */
export function findBackEdges(nodes, entryId) {
  const color = new Map(nodes.map((n) => [n.id, 0]));
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  /** @type {Array<{from: string, to: string}>} */
  const backEdges = [];

  /**
   * @param {string} id
   */
  function dfs(id) {
    color.set(id, 1);
    const node = nodeMap.get(id);
    if (!node) return;
    for (const succ of node.successors) {
      const c = color.get(succ) ?? 0;
      if (c === 1) {
        backEdges.push({ from: id, to: succ });
      } else if (c === 0) {
        dfs(succ);
      }
    }
    color.set(id, 2);
  }

  if (color.has(entryId)) dfs(entryId);
  // Handle disconnected nodes (unreachable)
  for (const n of nodes) {
    if ((color.get(n.id) ?? 0) === 0) dfs(n.id);
  }

  return backEdges;
}

// ---------------------------------------------------------------------------
// Liveness (backward) — optional, used for "used before assigned" detection
// ---------------------------------------------------------------------------

/**
 * Backward liveness: a binding is live at a point if there is a path from that
 * point to a use that is not intercepted by a kill/def.
 *
 * @param {CfgNodeShim[]} nodes
 * @param {Map<string, Set<string>>} usePerNode   - cfgNodeId → Set<bindingId>
 * @param {Map<string, Set<string>>} defPerNode   - cfgNodeId → Set<bindingId> (kills liveness)
 * @param {number} [budgetMs]
 * @returns {{ partial: boolean, liveIn: Map<string, Set<string>>, liveOut: Map<string, Set<string>> }}
 */
export function livenessAnalysis(nodes, usePerNode, defPerNode, budgetMs = REACHING_DEF_BUDGET_MS) {
  /** @type {Map<string, Set<string>>} */
  const liveIn  = new Map();
  /** @type {Map<string, Set<string>>} */
  const liveOut = new Map();

  for (const n of nodes) {
    liveIn.set(n.id, new Set());
    liveOut.set(n.id, new Set());
  }

  // Build successor map
  /** @type {Map<string, string[]>} */
  const succMap = new Map();
  for (const n of nodes) {
    succMap.set(n.id, n.successors);
  }

  const worklist = new Set(nodes.map((n) => n.id));
  const startMs = Date.now();

  while (worklist.size > 0) {
    if (Date.now() - startMs > budgetMs) {
      return { partial: true, liveIn, liveOut };
    }

    const nodeId = worklist.values().next().value;
    worklist.delete(nodeId);

    // liveOut[n] = ∪ liveIn[successors]
    const succs = succMap.get(nodeId) ?? [];
    const newOut = new Set();
    for (const s of succs) {
      const sIn = liveIn.get(s);
      if (sIn) for (const b of sIn) newOut.add(b);
    }

    // liveIn[n] = USE[n] ∪ (liveOut[n] − DEF[n])
    const useSet = usePerNode.get(nodeId) ?? new Set();
    const defSet = defPerNode.get(nodeId) ?? new Set();
    const newIn  = new Set(useSet);
    for (const b of newOut) {
      if (!defSet.has(b)) newIn.add(b);
    }

    const oldOut = liveOut.get(nodeId) ?? new Set();
    const oldIn  = liveIn.get(nodeId)  ?? new Set();

    let changed = newIn.size !== oldIn.size || newOut.size !== oldOut.size;
    if (!changed) {
      for (const b of newIn) if (!oldIn.has(b)) { changed = true; break; }
    }

    if (changed) {
      liveIn.set(nodeId, newIn);
      liveOut.set(nodeId, newOut);
      // Re-enqueue predecessors (backward pass)
      for (const n of nodes) {
        if (n.successors.includes(nodeId)) worklist.add(n.id);
      }
    }
  }

  return { partial: false, liveIn, liveOut };
}
