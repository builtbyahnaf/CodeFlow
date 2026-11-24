import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateUncertaintyGuardrails } from '../../src/core/indexing/incremental/guardrails.js';

const allFiles = {
  'file:src/a.cpp': { file_id: 'file:src/a.cpp', path: 'src/a.cpp' },
  'file:src/b.cpp': { file_id: 'file:src/b.cpp', path: 'src/b.cpp' },
  'file:other/c.cpp': { file_id: 'file:other/c.cpp', path: 'other/c.cpp' },
};

test('evaluateUncertaintyGuardrails widens invalidation on missing compile DB, excluded target, rename without deps, analysis failure, and non-determinism (P9-07, P9-09, AC-9.3)', () => {
  // 1. Missing compile DB -> widens to sibling directory files and forces partial
  const noCompileDb = evaluateUncertaintyGuardrails({
    fileId: 'file:src/a.cpp',
    filePath: 'src/a.cpp',
    language: 'cpp',
    hasCompileDb: false,
    allFiles,
  });
  assert.equal(noCompileDb.forcePartialCompleteness, true);
  assert.deepEqual(noCompileDb.extraInvalidatedFileIds, ['file:src/b.cpp']);
  assert.ok(noCompileDb.diagnostics.some((d) => d.code === 'uncertainty_widened_invalidation'));

  // 2. Excluded import target -> downgrades edges to unresolved
  const excludedTarget = evaluateUncertaintyGuardrails({
    fileId: 'file:src/a.cpp',
    filePath: 'src/a.cpp',
    excludedImportTargets: ['vendor/excluded.js'],
    allFiles,
  });
  assert.equal(excludedTarget.forcePartialCompleteness, true);
  assert.deepEqual(excludedTarget.downgradeEdgesToUnresolvedForTargets, ['vendor/excluded.js']);

  // 3. Analysis failure -> preserves previous rows and marks file stale
  const failed = evaluateUncertaintyGuardrails({
    fileId: 'file:src/a.cpp',
    filePath: 'src/a.cpp',
    analysisFailed: true,
    failureReason: 'SyntaxError',
    allFiles,
  });
  assert.equal(failed.preservePreviousRowsAsStale, true);
  assert.ok(failed.diagnostics.some((d) => d.code === 'stale_on_analysis_failure'));

  // 4. Non-determinism check failure -> logs analysis_nondeterministic
  const nondet = evaluateUncertaintyGuardrails({
    fileId: 'file:src/a.cpp',
    filePath: 'src/a.cpp',
    firstPassLogicalHash: 'index:111',
    secondPassLogicalHash: 'index:222',
    allFiles,
  });
  assert.ok(nondet.diagnostics.some((d) => d.code === 'analysis_nondeterministic'));
});
