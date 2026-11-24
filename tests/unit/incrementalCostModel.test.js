import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ESCALATION_LEVELS,
  estimateCascadeCost,
} from '../../src/core/indexing/incremental/costModel.js';

test('estimateCascadeCost computes work duration and selects none, direct_dependents, module_subtree, or full_project escalation', () => {
  const zero = estimateCascadeCost(0);
  assert.equal(zero.escalationLevel, ESCALATION_LEVELS.NONE);
  assert.equal(zero.estimatedWorkMs, 0);

  const direct = estimateCascadeCost(10, { maxFilesBudget: 30, avgFileAnalysisMs: 50 });
  assert.equal(direct.escalationLevel, ESCALATION_LEVELS.DIRECT_DEPENDENTS);
  assert.equal(direct.exceedsBudget, false);
  assert.equal(direct.estimatedWorkMs, 500);

  const moduleSubtree = estimateCascadeCost(45, {
    maxFilesBudget: 30,
    moduleEscalationCeiling: 120,
    avgFileAnalysisMs: 50,
  });
  assert.equal(moduleSubtree.escalationLevel, ESCALATION_LEVELS.MODULE_SUBTREE);
  assert.equal(moduleSubtree.exceedsBudget, true);

  const fullProject = estimateCascadeCost(200, {
    maxFilesBudget: 30,
    moduleEscalationCeiling: 120,
    avgFileAnalysisMs: 50,
  });
  assert.equal(fullProject.escalationLevel, ESCALATION_LEVELS.FULL_PROJECT);
  assert.equal(fullProject.exceedsBudget, true);
});
