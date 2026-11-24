import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { javaAdapter } from '../../src/adapters/java/index.js';

describe('Java Adapter Robustness & Safe Fallbacks (AC-14.7)', () => {
  it('returns valid partial run when AST is missing or null', () => {
    const run = javaAdapter.analyze({
      runId: 'run:java-empty',
      path: 'src/Empty.java',
      javaAst: null,
    });

    assert.ok(run);
    assert.equal(run.language, 'java');
    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_ast'));
  });

  it('handles malformed AST JSON safely without throwing', () => {
    const run = javaAdapter.analyze({
      runId: 'run:java-malformed',
      path: 'src/Broken.java',
      javaAst: '{ invalid json }',
    });

    assert.ok(run);
    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_ast'));
  });

  it('surfaces compilation warnings as diagnostics', () => {
    const run = javaAdapter.analyze({
      runId: 'run:java-warnings',
      path: 'src/Test.java',
      javaAst: { kind: 'CompilationUnit', types: [] },
      javaMode: 'heuristic',
      javaWarnings: [{ code: 'missing_classpath', message: 'No classpath configured' }],
    });

    assert.equal(run.completeness, 'partial');
    assert.ok(run.diagnostics.some((d) => d.code === 'missing_classpath'));
  });
});
