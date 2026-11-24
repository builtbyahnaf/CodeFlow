import test from 'node:test';
import assert from 'node:assert/strict';

import { INVALIDATION_CLASSES } from '../../src/core/indexing/incremental/classify.js';
import {
  ESCALATION_LEVELS,
  buildReverseDependencyGraph,
  planInvalidationCascade,
} from '../../src/core/indexing/incremental/cascade.js';

test('buildReverseDependencyGraph and planInvalidationCascade handle 3-level chains, cycles, and cost escalation (P9-06)', () => {
  // 3-level chain with a cycle: file:a <- file:b <- file:c and file:c <- file:a
  const snapshot = {
    files: {
      'file:a': { file_id: 'file:a', path: 'src/core/a.hpp' },
      'file:b': { file_id: 'file:b', path: 'src/core/b.hpp' },
      'file:c': { file_id: 'file:c', path: 'src/core/c.cpp' },
      'file:unconnected': { file_id: 'file:unconnected', path: 'src/other/u.cpp' },
    },
    dependencies: [
      { from_file: 'file:b', to_file: 'file:a', type: 'includes', status: 'resolved' },
      { from_file: 'file:c', to_file: 'file:b', type: 'includes', status: 'unresolved' }, // unresolved still creates invalidation edge!
      { from_file: 'file:a', to_file: 'file:c', type: 'includes', status: 'possible' },
    ],
  };

  const reverseGraph = buildReverseDependencyGraph(snapshot);

  // Direct dependent only (1 hop from file:a -> file:b)
  const direct = planInvalidationCascade({
    changedFileIds: ['file:a'],
    classification: {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      transitiveDependents: false,
    },
    reverseGraph,
    allFiles: snapshot.files,
  });
  assert.deepEqual(direct.dependentFileIds, ['file:b']);
  assert.equal(direct.escalationLevel, ESCALATION_LEVELS.DIRECT_DEPENDENTS);

  // Transitive header change (terminates despite cycle file:a <-> file:b <-> file:c)
  const transitive = planInvalidationCascade({
    changedFileIds: ['file:a'],
    classification: {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      transitiveDependents: true,
    },
    reverseGraph,
    allFiles: snapshot.files,
  });
  assert.deepEqual(transitive.dependentFileIds, ['file:b', 'file:c']);

  // Cost escalation to module subtree when maxFilesBudget is exceeded
  const escalatedModule = planInvalidationCascade({
    changedFileIds: ['file:a'],
    classification: {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      transitiveDependents: true,
    },
    reverseGraph,
    allFiles: snapshot.files,
    budget: { maxFilesBudget: 1, moduleEscalationCeiling: 10 },
  });
  assert.equal(escalatedModule.escalationLevel, ESCALATION_LEVELS.MODULE_SUBTREE);
  assert.equal(escalatedModule.diagnostics[0].code, 'invalidation_escalated');
  assert.equal(escalatedModule.diagnostics[0].level, 'module');

  // Cost escalation to full project when module ceiling is also exceeded
  const escalatedFull = planInvalidationCascade({
    changedFileIds: ['file:a'],
    classification: {
      scopeClass: INVALIDATION_CLASSES.DEPENDENT,
      transitiveDependents: true,
    },
    reverseGraph,
    allFiles: snapshot.files,
    budget: { maxFilesBudget: 1, moduleEscalationCeiling: 1 },
  });
  assert.equal(escalatedFull.escalationLevel, ESCALATION_LEVELS.FULL_PROJECT);
  assert.equal(escalatedFull.diagnostics[0].level, 'full_project');
});
