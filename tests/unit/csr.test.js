import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAnalysisRun,
  createRelationship,
  createSourceRange,
  createSymbol,
  validateAnalysisRun,
} from '../../src/core/csr/entities.js';
import { createMockAnalysis } from '../../src/adapters/mock/index.js';

/**
 * @returns {import('../../src/core/csr/entities.js').AnalysisRun}
 */
function fixture() {
  return createMockAnalysis();
}

test('the mock analysis is valid CSR', () => {
  const result = validateAnalysisRun(fixture());
  assert.equal(result.ok, true, JSON.stringify(result.issues));
});

test('factories apply documented defaults', () => {
  assert.deepEqual(createSourceRange({ fileId: 'f' }), {
    fileId: 'f',
    startLine: 0,
    startColumn: 0,
    endLine: 0,
    endColumn: 0,
  });

  const symbol = createSymbol({ symbolId: 's', declaration: createSourceRange({ fileId: 'f' }) });
  assert.equal(symbol.kind, 'unknown');
  assert.equal(symbol.qualifiedName, '');

  const relationship = createRelationship({});
  assert.equal(relationship.type, 'references');
  assert.equal(relationship.status, 'unresolved');

  const run = createAnalysisRun({});
  assert.deepEqual(run.files, []);
  assert.equal(run.completeness, 'partial');
});

test('rejects duplicate symbol ids', () => {
  const run = fixture();
  run.symbols.push({ ...run.symbols[0] });
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Duplicate symbolId/.test(issue.message)));
});

test('rejects unknown symbol kinds', () => {
  const run = fixture();
  run.symbols[0].kind = 'hologram';
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.path.endsWith('.kind')));
});

test('rejects a non-resolved relationship without a known reason code', () => {
  const missing = fixture();
  const unresolved = missing.relationships.find((item) => item.status === 'unresolved');
  delete unresolved.reasonCode;
  const missingResult = validateAnalysisRun(missing);
  assert.equal(missingResult.ok, false);
  assert.ok(missingResult.issues.some((issue) => /must carry a reasonCode/.test(issue.message)));

  const unknown = fixture();
  const unknownRelationship = unknown.relationships.find((item) => item.status === 'unresolved');
  unknownRelationship.reasonCode = 'because_i_said_so';
  const unknownResult = validateAnalysisRun(unknown);
  assert.equal(unknownResult.ok, false);
  assert.ok(unknownResult.issues.some((issue) => /Unknown reasonCode/.test(issue.message)));
});

test('rejects a resolved relationship that points at an undeclared symbol', () => {
  const run = fixture();
  const resolved = run.relationships.find((item) => item.status === 'resolved');
  resolved.to = 'symbol:nowhere';
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /must target a declared symbol/.test(issue.message)));
});

test('allows an unresolved relationship to point outside the analysis', () => {
  const run = fixture();
  const unresolved = run.relationships.find((item) => item.status === 'unresolved');
  assert.match(unresolved.to, /^external:/);
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('rejects ranges outside the declared file bounds', () => {
  const run = fixture();
  run.symbols[0].declaration.endLine = 9999;
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /exceeds lineCount/.test(issue.message)));
});

test('rejects negative positions and inverted ranges', () => {
  const run = fixture();
  run.symbols[0].declaration.startLine = -1;
  const negative = validateAnalysisRun(run);
  assert.equal(negative.ok, false);

  const inverted = fixture();
  inverted.symbols[0].declaration.startLine = 10;
  inverted.symbols[0].declaration.endLine = 5;
  const invertedResult = validateAnalysisRun(inverted);
  assert.equal(invertedResult.ok, false);
  assert.ok(invertedResult.issues.some((issue) => /endLine must be >= startLine/.test(issue.message)));
});

test('rejects a range that references a file not in the run', () => {
  const run = fixture();
  run.symbols[0].declaration.fileId = 'file:missing';
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Unknown fileId/.test(issue.message)));
});

test('rejects malformed top-level input', () => {
  for (const value of [null, 42, 'run', []]) {
    const result = validateAnalysisRun(value);
    assert.equal(result.ok, false);
    assert.equal(result.issues[0].path, '$');
  }
});

test('rejects an unknown completeness level', () => {
  const run = fixture();
  run.completeness = 'mostly';
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.path === 'completeness'));
});
