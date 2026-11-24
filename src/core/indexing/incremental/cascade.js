/**
 * Reverse dependency index and cost-modeled cascade planner (Phase 9 §5.2, §5.3, P9-06).
 *
 * Explicit rule (§5.3): a dependency or cross-file relationship edge that is
 * `possible` or `unresolved` also creates a conservative invalidation
 * dependency, even though it does not create a confirmed call relationship.
 *
 * Escalation levels when `estimated_work` exceeds the incremental budget
 * (default 30 files or 10,000 ms):
 * - Level 1: `direct_dependents` (default)
 * - Level 2: `module_subtree`
 * - Level 3: `full_project` (records `invalidation_escalated` diagnostic)
 */

import { INVALIDATION_CLASSES } from './classify.js';
import { CASCADE_DEFAULTS, ESCALATION_LEVELS, estimateCascadeCost } from './costModel.js';

export { CASCADE_DEFAULTS, ESCALATION_LEVELS, estimateCascadeCost };

/**
 * Extract the parent directory prefix (`src/core/graph/a.js` -> `src/core/graph`).
 *
 * @param {string} filePath
 * @returns {string}
 */
function modulePrefixOf(filePath) {
  const norm = String(filePath ?? '').replace(/\\/g, '/');
  const slash = norm.lastIndexOf('/');
  return slash > 0 ? norm.slice(0, slash) : '';
}

/**
 * Build a reverse dependency map `targetFileId -> Set<dependentFileId>` from
 * index `dependencies` and cross-file `relationships` (including `possible`
 * and `unresolved` edges per §5.3).
 *
 * @param {{
 *   dependencies?: Record<string, any> | Array<Record<string, any>>,
 *   relationships?: Record<string, any> | Array<Record<string, any>>,
 *   symbols?: Record<string, any>,
 * }} snapshot
 * @returns {Map<string, Set<string>>}
 */
export function buildReverseDependencyGraph(snapshot = {}) {
  /** @type {Map<string, Set<string>>} */
  const reverse = new Map();

  function addEdge(targetFileId, dependentFileId) {
    if (!targetFileId || !dependentFileId || targetFileId === dependentFileId) {
      return;
    }
    let set = reverse.get(targetFileId);
    if (!set) {
      set = new Set();
      reverse.set(targetFileId, set);
    }
    set.add(dependentFileId);
  }

  const depList = Array.isArray(snapshot.dependencies)
    ? snapshot.dependencies
    : Object.values(snapshot.dependencies ?? {});
  for (const dep of depList) {
    const fromFile = dep.from_file ?? dep.fromFile;
    const toFile = dep.to_file ?? dep.toFile;
    // Both resolved and unresolved dependency edges create conservative invalidation links.
    addEdge(toFile, fromFile);
  }

  const symbols = snapshot.symbols ?? {};
  const relList = Array.isArray(snapshot.relationships)
    ? snapshot.relationships
    : Object.values(snapshot.relationships ?? {});
  for (const rel of relList) {
    const fromSym = symbols[rel.from_id ?? rel.from];
    const toSym = symbols[rel.to_id ?? rel.to];
    const fromFile = rel.site_file ?? fromSym?.file_id ?? fromSym?.fileId;
    const toFile = toSym?.file_id ?? toSym?.fileId;
    if (fromFile && toFile) {
      addEdge(toFile, fromFile);
    }
  }

  return reverse;
}

/**
 * Plan the set of dependent files to re-analyze and apply the Phase 9 §5.2
 * cost model and escalation policy.
 *
 * Cycle-safe: circular dependencies (`A -> B -> A`) terminate cleanly via a
 * visited set.
 *
 * @param {{
 *   changedFileIds: string[],
 *   classification: {
 *     scopeClass: 'local'|'dependent'|'global',
 *     transitiveDependents?: boolean,
 *     affectedDependencyTargets?: string[],
 *   },
 *   reverseGraph: Map<string, Set<string>>,
 *   allFiles?: Record<string, {file_id: string, path: string}>,
 *   budget?: {
 *     maxFilesBudget?: number,
 *     maxDurationMsBudget?: number,
 *     avgFileAnalysisMs?: number,
 *     moduleEscalationCeiling?: number,
 *   },
 * }} params
 */
export function planInvalidationCascade({
  changedFileIds = [],
  classification,
  reverseGraph,
  allFiles = {},
  budget = {},
}) {
  const avgFileAnalysisMs = Math.max(
    1,
    budget.avgFileAnalysisMs ?? CASCADE_DEFAULTS.avgFileAnalysisMs,
  );

  const allFileIds = Object.keys(allFiles).sort();

  if (classification.scopeClass === INVALIDATION_CLASSES.GLOBAL) {
    return {
      filesToReanalyze: allFileIds,
      dependentFileIds: allFileIds.filter((id) => !changedFileIds.includes(id)),
      escalationLevel: ESCALATION_LEVELS.FULL_PROJECT,
      estimatedWorkMs: allFileIds.length * avgFileAnalysisMs,
      diagnostics: [
        {
          code: 'invalidation_escalated',
          level: ESCALATION_LEVELS.FULL_PROJECT,
          message: 'Global change classification triggered full project re-analysis.',
        },
      ],
    };
  }

  if (classification.scopeClass === INVALIDATION_CLASSES.LOCAL) {
    return {
      filesToReanalyze: [...new Set(changedFileIds)].sort(),
      dependentFileIds: [],
      escalationLevel: ESCALATION_LEVELS.NONE,
      estimatedWorkMs: changedFileIds.length * avgFileAnalysisMs,
      diagnostics: [],
    };
  }

  // Dependent scope: walk reverse dependency graph (1-hop or transitive for headers).
  const seeds = [...changedFileIds, ...(classification.affectedDependencyTargets ?? [])];
  const visited = new Set(changedFileIds);
  /** @type {Set<string>} */
  const dependents = new Set();
  let frontier = [...new Set(seeds)];
  const maxHops = classification.transitiveDependents ? 64 : 1;

  for (let hop = 0; hop < maxHops && frontier.length > 0; hop += 1) {
    /** @type {string[]} */
    const nextFrontier = [];
    for (const targetId of frontier) {
      const incoming = reverseGraph.get(targetId);
      if (!incoming) {
        continue;
      }
      for (const depFileId of incoming) {
        if (!dependents.has(depFileId) && !changedFileIds.includes(depFileId)) {
          dependents.add(depFileId);
        }
        if (!visited.has(depFileId)) {
          visited.add(depFileId);
          nextFrontier.push(depFileId);
        }
      }
    }
    frontier = nextFrontier;
  }

  const dependentList = [...dependents].sort();
  const cost = estimateCascadeCost(dependentList.length, budget);
  const estimatedWorkMs = cost.estimatedWorkMs;

  if (!cost.exceedsBudget) {
    return {
      filesToReanalyze: [...new Set([...changedFileIds, ...dependentList])].sort(),
      dependentFileIds: dependentList,
      escalationLevel: ESCALATION_LEVELS.DIRECT_DEPENDENTS,
      estimatedWorkMs,
      diagnostics: [],
    };
  }

  // Escalation Level 2 vs Level 3: if dependent count <= moduleCeiling, scope
  // to affected module subtrees (`invalidation_escalated: module`); otherwise
  // escalate to full project rebuild (`invalidation_escalated: full_project`).
  if (cost.escalationLevel === ESCALATION_LEVELS.MODULE_SUBTREE) {
    const affectedPrefixes = new Set(
      [...changedFileIds, ...dependentList]
        .map((id) => modulePrefixOf(allFiles[id]?.path ?? ''))
        .filter(Boolean),
    );
    const moduleFiles = allFileIds.filter((id) => {
      const p = allFiles[id]?.path ?? '';
      return [...affectedPrefixes].some((prefix) => p.startsWith(`${prefix}/`) || p === prefix);
    });
    const combined = [...new Set([...changedFileIds, ...dependentList, ...moduleFiles])].sort();
    return {
      filesToReanalyze: combined,
      dependentFileIds: combined.filter((id) => !changedFileIds.includes(id)),
      escalationLevel: ESCALATION_LEVELS.MODULE_SUBTREE,
      estimatedWorkMs: combined.length * avgFileAnalysisMs,
      diagnostics: [
        {
          code: 'invalidation_escalated',
          level: 'module',
          message: `Dependent count (${dependentList.length} files, est. ${estimatedWorkMs} ms) exceeded incremental budget; escalated to module subtree.`,
        },
      ],
    };
  }

  return {
    filesToReanalyze: allFileIds,
    dependentFileIds: allFileIds.filter((id) => !changedFileIds.includes(id)),
    escalationLevel: ESCALATION_LEVELS.FULL_PROJECT,
    estimatedWorkMs: allFileIds.length * avgFileAnalysisMs,
    diagnostics: [
      {
        code: 'invalidation_escalated',
        level: 'full_project',
        message: `Dependent cascade (${dependentList.length} files, est. ${estimatedWorkMs} ms) exceeded module ceiling; escalated to full project re-analysis.`,
      },
    ],
  };
}
