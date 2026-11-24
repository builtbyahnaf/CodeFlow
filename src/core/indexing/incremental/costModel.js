/**
 * Incremental cascade cost estimator and escalation level selector
 * (Phase 9 §5.2, P9-06).
 *
 * Computes `estimatedWorkMs = dependentCount * avgFileAnalysisMs` and decides
 * whether to run direct/transitive dependents (`direct_dependents`), escalate
 * to the affected module subtrees (`module_subtree`), or escalate to a full
 * project re-analysis (`full_project`).
 */

export const CASCADE_DEFAULTS = Object.freeze({
  maxFilesBudget: 30,
  maxDurationMsBudget: 10_000,
  avgFileAnalysisMs: 50,
  moduleEscalationCeiling: 120,
});

export const ESCALATION_LEVELS = Object.freeze({
  NONE: 'none',
  DIRECT_DEPENDENTS: 'direct_dependents',
  MODULE_SUBTREE: 'module_subtree',
  FULL_PROJECT: 'full_project',
});

/**
 * Estimate the work cost and escalation level for a set of invalidated
 * dependent files.
 *
 * @param {number} dependentCount
 * @param {{
 *   maxFilesBudget?: number,
 *   maxDurationMsBudget?: number,
 *   avgFileAnalysisMs?: number,
 *   moduleEscalationCeiling?: number,
 * }} [budget]
 * @returns {{
 *   dependentCount: number,
 *   estimatedWorkMs: number,
 *   exceedsBudget: boolean,
 *   escalationLevel: 'none'|'direct_dependents'|'module_subtree'|'full_project',
 * }}
 */
export function estimateCascadeCost(dependentCount, budget = {}) {
  const count = Math.max(0, Math.trunc(Number(dependentCount) || 0));
  const maxFilesBudget = budget.maxFilesBudget ?? CASCADE_DEFAULTS.maxFilesBudget;
  const maxDurationMsBudget = budget.maxDurationMsBudget ?? CASCADE_DEFAULTS.maxDurationMsBudget;
  const avgFileAnalysisMs = Math.max(
    1,
    budget.avgFileAnalysisMs ?? CASCADE_DEFAULTS.avgFileAnalysisMs,
  );
  const moduleCeiling = budget.moduleEscalationCeiling ?? CASCADE_DEFAULTS.moduleEscalationCeiling;

  const estimatedWorkMs = count * avgFileAnalysisMs;
  if (count === 0) {
    return {
      dependentCount: 0,
      estimatedWorkMs: 0,
      exceedsBudget: false,
      escalationLevel: ESCALATION_LEVELS.NONE,
    };
  }

  const exceedsBudget = count > maxFilesBudget || estimatedWorkMs > maxDurationMsBudget;
  if (!exceedsBudget) {
    return {
      dependentCount: count,
      estimatedWorkMs,
      exceedsBudget: false,
      escalationLevel: ESCALATION_LEVELS.DIRECT_DEPENDENTS,
    };
  }

  if (count <= moduleCeiling) {
    return {
      dependentCount: count,
      estimatedWorkMs,
      exceedsBudget: true,
      escalationLevel: ESCALATION_LEVELS.MODULE_SUBTREE,
    };
  }

  return {
    dependentCount: count,
    estimatedWorkMs,
    exceedsBudget: true,
    escalationLevel: ESCALATION_LEVELS.FULL_PROJECT,
  };
}
