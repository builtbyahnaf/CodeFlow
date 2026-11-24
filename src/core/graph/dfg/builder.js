/**
 * DFG builder.
 *
 * Assembles FlowNodes and FlowEdges for a single function by:
 *   1. Extracting def/use/kill sites from DataFacts on each CFG node.
 *   2. Running the reaching-definitions fixpoint.
 *   3. Emitting reaching/assign/loop_carried edges.
 *   4. Adding interprocedural param→arg and return→use edges for resolved calls.
 *   5. Detecting alias/limitation conditions and adding banners.
 *
 * The builder NEVER claims a resolved flow it cannot prove. Conservative kill
 * rules degrade status when mutation cannot be ruled out.
 *
 * Performance contract (§6):
 *   ≤ 200 CFG nodes → < 100 ms p95
 *   ≤ 1 000 nodes   → < 400 ms p95, then partial
 */

import { makeFlowNodeId, createEmptyDfg } from './model.js';
import {
  extractSites,
  extractParamSites,
  extractConservativeKill,
  extractUnmodeledKills,
} from './defuse.js';
import {
  computeGenKill,
  reachingDefinitions,
  findBackEdges,
  decodeDefKey,
} from './reaching.js';
import { DFG_DTO_VERSION } from './kinds.js';

/**
 * @typedef {import('./model.js').FlowNode} FlowNode
 * @typedef {import('./model.js').FlowEdge} FlowEdge
 * @typedef {import('./model.js').Dfg} Dfg
 * @typedef {import('./defuse.js').DefUseSite} DefUseSite
 * @typedef {import('./reaching.js').CfgNodeShim} CfgNodeShim
 */

// ---------------------------------------------------------------------------
// Limitation messages (shown verbatim in the UI)
// ---------------------------------------------------------------------------

export const LIMITATIONS = Object.freeze({
  POINTER_ALIAS:    'Alias analysis is not performed for pointer and reference types (C++). Flows through pointers may be incomplete.',
  EVAL_SCOPE:       'eval() detected in this function. All local variable flows are conservatively marked unresolved.',
  DEFERRED:         'Bindings passed to callbacks or closures may be mutated asynchronously. Subsequent flows are marked possible.',
  TEMPLATE_DEP:     'Template-dependent expressions cannot be statically resolved. Affected flows are marked unresolved.',
  PARTIAL_BUDGET:   'The reaching-definitions budget was exhausted. The displayed flow graph is incomplete.',
  MISSING_CFG:      'No control-flow graph is available for this function. Data-flow analysis cannot proceed.',
  GLOBAL_CALL_MUT:  'Globals may be mutated through unresolved calls. Flows after such calls are marked possible.',
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether the function has any reference/pointer bindings.
 *
 * @param {import('./defuse.js').BindingRecord[]} bindings
 * @returns {boolean}
 */
function hasPointerOrReference(bindings) {
  return bindings.some((b) => b.isReference);
}

/**
 * Check whether the CFG contains an unmodeled node representing eval().
 *
 * @param {CfgNodeShim[]} cfgNodes
 * @param {Map<string, Record<string, unknown>[]>} dataFactsMap
 * @returns {boolean}
 */
function hasEvalScope(cfgNodes, dataFactsMap) {
  for (const n of cfgNodes) {
    const facts = dataFactsMap.get(n.id) ?? [];
    if (facts.some((f) => f.reasonCode === 'eval_scope')) return true;
  }
  return false;
}

/**
 * Degrade all 'resolved' edges whose binding passed through an eval scope.
 *
 * @param {FlowEdge[]} edges
 * @returns {FlowEdge[]}
 */
function degradeEvalEdges(edges) {
  return edges.map((e) =>
    e.status === 'resolved'
      ? { ...e, status: 'unresolved', reasonCode: 'eval_scope' }
      : e,
  );
}

// ---------------------------------------------------------------------------
// Core builder
// ---------------------------------------------------------------------------

/**
 * Build a DFG for a single function.
 *
 * @param {Object} opts
 * @param {string} opts.functionId
 * @param {string} opts.fileId
 * @param {CfgNodeShim[]} opts.cfgNodes        - all CFG nodes in the function
 * @param {string} opts.entryNodeId
 * @param {Map<string, Record<string, unknown>[]>} opts.dataFactsMap
 *   cfgNodeId → DataFact[] emitted by the language adapter
 * @param {import('./defuse.js').BindingRecord[]} opts.bindings
 *   all bindings in scope (locals + params + captures)
 * @param {import('./defuse.js').BindingRecord[]} opts.params
 *   parameter bindings in declaration order
 * @param {Array<{callNodeId: string, status: string, calleeId?: string}>} opts.calls
 *   call sites in this function
 * @param {Array<{callerCallNodeId: string, paramBinding: import('./defuse.js').BindingRecord, argFlowNodeId: string}>} opts.interproceduralArgs
 *   resolved param→arg mappings from the call-graph layer
 * @param {Array<{returnFlowNodeId: string, useFlowNodeId: string}>} opts.interproceduralReturns
 *   resolved return→use mappings
 * @param {number} [opts.budgetIterations]
 * @param {number} [opts.budgetMs]
 * @returns {Dfg}
 */
export function buildDfg({
  functionId,
  fileId,
  cfgNodes,
  entryNodeId,
  dataFactsMap,
  bindings,
  params,
  calls,
  interproceduralArgs = [],
  interproceduralReturns = [],
  budgetIterations,
  budgetMs,
}) {
  if (!cfgNodes || cfgNodes.length === 0) {
    return createEmptyDfg(functionId, fileId, 'missing_cfg', LIMITATIONS.MISSING_CFG);
  }

  /** @type {FlowNode[]} */
  const flowNodes = [];
  /** @type {FlowEdge[]} */
  const flowEdges = [];
  const limitations = [];
  const partialReasons = [];

  /** @type {Map<string, number>} */
  const ordinalMap = new Map();

  // --- Step 1: param entry sites ---
  const entryNode = cfgNodes.find((n) => n.id === entryNodeId);
  if (entryNode) {
    const paramSites = extractParamSites(entryNodeId, params, ordinalMap);
    for (const s of paramSites) {
      flowNodes.push({
        id: s.nodeId,
        bindingId: s.bindingId,
        cfgNodeId: entryNodeId,
        kind: s.kind,
        range: /** @type {any} */ (s.range),
        status: s.status,
        ...(s.reasonCode ? { reasonCode: s.reasonCode } : {}),
      });
    }
  }

  // --- Step 2: extract sites from DataFacts on each CFG node ---
  /** @type {Map<string, import('./defuse.js').DefRecord[]>} */
  const defsPerNode = new Map();

  for (const cfgNode of cfgNodes) {
    const facts = dataFactsMap.get(cfgNode.id) ?? [];
    let sites = extractSites(cfgNode.id, facts, ordinalMap);

    // Unmodeled node: conservatively kill all mutable bindings
    if (cfgNode.kind === 'unmodeled') {
      const kills = extractUnmodeledKills(cfgNode.id, bindings, ordinalMap);
      sites = [...sites, ...kills];
    }

    // Conservative kill for mutable reference-like bindings at unresolved calls
    if (cfgNode.kind === 'call') {
      const callInfo = calls.find((c) => c.callNodeId === cfgNode.id);
      if (callInfo && (callInfo.status === 'unresolved' || callInfo.status === 'possible')) {
        const refBindings = bindings.filter(
          (b) => b.isMutable && b.isReference && b.kind !== 'param',
        );
        for (const b of refBindings) {
          sites.push(extractConservativeKill(cfgNode.id, b, callInfo.status, ordinalMap));
        }
      }
    }

    // Closure capture kills
    for (const site of sites) {
      if (site.kind === 'kill' && site.reasonCode === 'capture_mutation') {
        limitations.push(LIMITATIONS.DEFERRED);
      }
    }

    for (const s of sites) {
      flowNodes.push({
        id: s.nodeId,
        bindingId: s.bindingId,
        cfgNodeId: cfgNode.id,
        kind: s.kind,
        range: /** @type {any} */ (s.range),
        status: s.status,
        ...(s.reasonCode ? { reasonCode: s.reasonCode } : {}),
      });
    }

    // Build defsPerNode for reaching-defs
    const defs = sites
      .filter((s) => s.kind === 'def' || s.kind === 'defuse' || s.kind === 'param' || s.kind === 'kill')
      .map((s) => ({
        bindingId: s.bindingId,
        flowNodeId: s.nodeId,
        cfgNodeId: cfgNode.id,
        status: s.status,
        ...(s.reasonCode ? { reasonCode: s.reasonCode } : {}),
      }));
    defsPerNode.set(cfgNode.id, defs);
  }

  // --- Step 3: reaching definitions ---
  const backEdges = findBackEdges(cfgNodes, entryNodeId);
  const { gen, kill } = computeGenKill(cfgNodes, defsPerNode);
  const rdResult = reachingDefinitions(cfgNodes, gen, kill, budgetIterations, budgetMs, backEdges);

  if (rdResult.partial) {
    partialReasons.push('flow_budget_exceeded');
    limitations.push(LIMITATIONS.PARTIAL_BUDGET);
  }

  // Build a lookup: flowNodeId → FlowNode
  /** @type {Map<string, FlowNode>} */
  const nodeById = new Map(flowNodes.map((n) => [n.id, n]));

  // --- Step 4: emit reaching/assign edges from reaching-defs ---
  // Build use-site lookup: cfgNodeId → use-kind FlowNodes
  /** @type {Map<string, FlowNode[]>} */
  const usesAtNode = new Map();
  for (const fn of flowNodes) {
    if (fn.kind === 'use' || fn.kind === 'defuse' || fn.kind === 'return') {
      let arr = usesAtNode.get(fn.cfgNodeId);
      if (!arr) { arr = []; usesAtNode.set(fn.cfgNodeId, arr); }
      arr.push(fn);
    }
  }

  for (const cfgNode of cfgNodes) {
    const inSet = rdResult.inSets.get(cfgNode.id) ?? new Set();
    const uses  = usesAtNode.get(cfgNode.id) ?? [];

    for (const useNode of uses) {
      for (const defKey of inSet) {
        const { bindingId, flowNodeId } = decodeDefKey(defKey);
        if (bindingId !== useNode.bindingId) continue;

        const defNode = nodeById.get(flowNodeId);
        if (!defNode) continue;

        // Determine edge kind
        const isAssign = defNode.kind === 'def' || defNode.kind === 'param';
        const isLoopCarried = Boolean(rdResult.loopCarriedIn?.get(cfgNode.id)?.has(defKey));

        const edgeKind = isLoopCarried ? 'loop_carried' : (isAssign ? 'assign' : 'reaching');

        // Edge status is the minimum of def and use status
        let status = defNode.status === 'resolved' && useNode.status === 'resolved'
          ? 'resolved' : 'possible';
        if (defNode.status === 'unresolved' || useNode.status === 'unresolved') {
          status = 'unresolved';
        }

        /** @type {FlowEdge} */
        const edge = {
          from: defNode.id,
          to:   useNode.id,
          kind: /** @type {any} */ (edgeKind),
          status: /** @type {any} */ (status),
        };
        if (status !== 'resolved' && defNode.reasonCode) {
          edge.reasonCode = defNode.reasonCode;
        } else if (isLoopCarried) {
          edge.reasonCode = 'loop_carried';
        }
        flowEdges.push(edge);
      }
    }
  }

  // --- Step 5: interprocedural param→arg edges (resolved calls only) ---
  for (const mapping of interproceduralArgs) {
    const argNode = nodeById.get(mapping.argFlowNodeId);
    if (!argNode) continue;
    // Find param node in the callee's DFG (passed in by caller)
    flowEdges.push({
      from: argNode.id,
      to:   makeFlowNodeId(mapping.paramBinding.id, `entry:${mapping.callerCallNodeId}`, 0),
      kind: 'param_to_arg',
      status: 'resolved',
    });
  }

  // --- Step 6: interprocedural return→use edges ---
  for (const mapping of interproceduralReturns) {
    if (!nodeById.has(mapping.returnFlowNodeId) || !nodeById.has(mapping.useFlowNodeId)) continue;
    flowEdges.push({
      from: mapping.returnFlowNodeId,
      to:   mapping.useFlowNodeId,
      kind: 'return_to_use',
      status: 'resolved',
    });
  }

  