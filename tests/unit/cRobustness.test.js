import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { cAdapter } from '../../src/adapters/c/index.js';

describe('C Adapter Robustness & Safe Fallbacks (AC-13.6)', () => {
  it('returns valid partial run when AST is missing or null', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-empty',
      path: 'src/empty.c',
      cAst: null,
    });

    assert.ok(run);
    assert.equal(run.language, 'c');
    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_ast'));
  });

  it('handles malformed AST JSON safely without throwing', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-malformed',
      path: 'src/broken.c',
      cAst: '{ invalid json ]',
    });

    assert.ok(run);
    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_ast'));
  });

  it('surfaces compile-db missing warnings as diagnostics', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-heuristic',
      path: 'src/test.c',
      cAst: { kind: 'TranslationUnitDecl', inner: [] },
      cMode: 'heuristic',
      cWarnings: [{ code: 'missing_compile_db', message: 'No compilation database found' }],
    });

    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_compile_db'));
  });
});
