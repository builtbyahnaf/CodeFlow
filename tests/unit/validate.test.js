import test from 'node:test';
import assert from 'node:assert/strict';

import { createMockAnalysis } from '../../src/adapters/mock/index.js';
import { createAnalysisRun, createDiagnostic } from '../../src/core/csr/entities.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';

function messages(result) {
  return result.issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n');
}

test('the mock run is valid in strict mode', () => {
  const result = validateAnalysisRun(createMockAnalysis(), { mode: 'strict' });
  assert.equal(result.ok, true, messages(result));
});

test('a non-resolved relationship requires a reason code from the closed enum', () => {
  const missing = createMockAnalysis();
  const unresolved = missing.relationships.find((item) => item.status === 'unresolved');
  delete unresolved.reasonCode;
  const missingResult = validateAnalysisRun(missing);
  assert.equal(missingResult.ok, false);
  assert.ok(missingResult.issues.some((issue) => /must carry a reasonCode/.test(issue.message)));

  const unknown = createMockAnalysis();
  const relationship = unknown.relationships.find((item) => item.status === 'unresolved');
  relationship.reasonCode = 'because_i_said_so';
  const unknownResult = validateAnalysisRun(unknown);
  assert.equal(unknownResult.ok, false);
  assert.ok(unknownResult.issues.some((issue) => /Unknown reasonCode/.test(issue.message)));
});

test('a resolved relationship must target a declared symbol', () => {
  const run = createMockAnalysis();
  const resolved = run.relationships.find((item) => item.status === 'resolved');
  resolved.to = 'symbol:nowhere';
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /must target a declared symbol/.test(issue.message)));
});

test('a non-resolved relationship may target an external id', () => {
  const run = createMockAnalysis();
  const unresolved = run.relationships.find((item) => item.status === 'unresolved');
  assert.match(unresolved.to, /^external:/);
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('duplicate identity tuples are rejected even with different ids', () => {
  const run = createMockAnalysis();
  const source = run.symbols.find((symbol) => symbol.kind === 'class');
  run.symbols.push({ ...structuredClone(source), symbolId: `${source.symbolId}#copy` });
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Duplicate symbol identity/.test(issue.message)));
});

test('duplicate relationship ids are rejected', () => {
  const run = createMockAnalysis();
  run.relationships.push({ ...run.relationships[0] });
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Duplicate relationshipId/.test(issue.message)));
});

test('cyclic parentId chains are rejected', () => {
  const run = createMockAnalysis();
  const parent = run.symbols.find((symbol) => symbol.qualifiedName === 'SQLiteHelper');
  const child = run.symbols.find((symbol) => symbol.qualifiedName === 'SQLiteHelper.checkData');
  parent.parentId = child.symbolId;
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Cyclic parentId/.test(issue.message)));
});

test('construct children and data facts must reference declared entities', () => {
  const badConstruct = createMockAnalysis();
  badConstruct.controlConstructs[0].children.push('construct:missing');
  const constructResult = validateAnalysisRun(badConstruct);
  assert.equal(constructResult.ok, false);
  assert.ok(constructResult.issues.some((issue) => /child "construct:missing"/.test(issue.message)));

  const badFact = createMockAnalysis();
  badFact.dataFacts[0].symbolId = 'symbol:missing';
  const factResult = validateAnalysisRun(badFact);
  assert.equal(factResult.ok, false);
  assert.ok(factResult.issues.some((issue) => /not a declared symbol/.test(issue.message)));
});

test('diagnostics may not point at unknown ids', () => {
  const run = createMockAnalysis();
  run.diagnostics.push(
    createDiagnostic({
      severity: 'info',
      code: 'test',
      message: 'points nowhere',
      affects: ['symbol:missing'],
    }),
  );
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /affects references unknown id/.test(issue.message)));
});

test('evidence kinds and ranges are validated', () => {
  const run = createMockAnalysis();
  run.relationships[0].evidence.push({ kind: 'telepathy' });
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => /Unknown evidence kind/.test(issue.message)));
});

test('ranges must be integers inside declared file bounds', () => {
  const negative = createMockAnalysis();
  negative.symbols[0].declaration.startLine = -1;
  assert.equal(validateAnalysisRun(negative).ok, false);

  const inverted = createMockAnalysis();
  inverted.symbols[0].declaration.startLine = 10;
  inverted.symbols[0].declaration.endLine = 5;
  const invertedResult = validateAnalysisRun(inverted);
  assert.equal(invertedResult.ok, false);
  assert.ok(invertedResult.issues.some((issue) => /endLine must be >= startLine/.test(issue.message)));

  const outside = createMockAnalysis();
  outside.symbols[0].declaration.endLine = 9999;
  const outsideResult = validateAnalysisRun(outside);
  assert.equal(outsideResult.ok, false);
  assert.ok(outsideResult.issues.some((issue) => /exceeds lineCount/.test(issue.message)));

  const nan = createMockAnalysis();
  nan.symbols[0].declaration.startColumn = Number.NaN;
  assert.equal(validateAnalysisRun(nan).ok, false);
});

test('file paths must be safe workspace-relative paths', () => {
  for (const path of ['../escape.js', '/absolute.js', 'C:/drive.js', 'src\\win.js', 'src//a.js']) {
    const run = createMockAnalysis();
    run.files[0].path = path;
    const result = validateAnalysisRun(run);
    assert.equal(result.ok, false, `expected "${path}" to be rejected`);
  }
});

test('an unknown major version is rejected; a newer minor is accepted with a note', () => {
  const major = createMockAnalysis();
  major.csrVersion = '2.0.0';
  assert.equal(validateAnalysisRun(major).ok, false);

  const minor = createMockAnalysis();
  minor.csrVersion = '1.2.0';
  const result = validateAnalysisRun(minor);
  assert.equal(result.ok, true);
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'csr_newer_minor'));
});

test('adapterId must match the registered adapter when expected', () => {
  const result = validateAnalysisRun(createMockAnalysis(), { expectedAdapterId: 'cpp' });
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((issue) => issue.path === 'adapterId'));
});

test('malformed top-level input is rejected with path $', () => {
  for (const value of [null, 42, 'run', []]) {
    const result = validateAnalysisRun(value);
    assert.equal(result.ok, false);
    assert.equal(result.issues[0].path, '$');
  }
});

test('oversized collections are rejected with E_LIMIT, never truncated', () => {
  const run = createAnalysisRun({ runId: 'run:big', adapterId: 'mock', language: 'mock' });
  for (let index = 0; index < 5_001; index += 1) {
    run.files.push({
      fileId: `file:f${index}`,
      path: `f${index}.mock`,
      language: 'mock',
      contentHash: 'x',
      sizeBytes: 0,
      lineCount: 1,
      generated: false,
    });
  }
  const result = validateAnalysisRun(run);
  assert.equal(result.ok, false);
  assert.equal(result.issues[0].code, 'E_LIMIT');
  assert.match(result.issues[0].message, /limit is 5000/);
});

test('defensive mode drops only invalid records and marks the run partial', () => {
  const run = createMockAnalysis();
  const goodSymbols = run.symbols.length;
  run.symbols.push({
    symbolId: 'symbol:mock:bad',
    kind: 'hologram',
    name: 'bad',
    qualifiedName: 'bad',
    language: 'mock',
    declaration: { fileId: run.files[0].fileId, startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
  });
  run.completeness = 'full';

  const result = validateAnalysisRun(run, { mode: 'defensive' });
  assert.equal(result.ok, true, messages(result));
  assert.equal(result.run.symbols.length, goodSymbols);
  assert.equal(result.dropped.length, 1);
  assert.equal(result.run.completeness, 'partial');
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'csr_record_dropped'));
  assert.ok(result.issues.some((issue) => issue.dropped === true));
});

test('defensive mode drops relationships that lose their source symbol', () => {
  const run = createMockAnalysis();
  const badSymbol = run.symbols.find((symbol) => symbol.name === 'main');
  assert.ok(badSymbol);
  badSymbol.kind = 'hologram';
  const result = validateAnalysisRun(run, { mode: 'defensive' });
  assert.equal(result.ok, true, messages(result));
  assert.ok(result.dropped.some((entry) => entry.collection === 'symbols'));
  assert.ok(result.dropped.some((entry) => entry.collection === 'relationships'));
  for (const relationship of result.run.relationships) {
    assert.ok(
      result.run.symbols.some((symbol) => symbol.symbolId === relationship.from),
      `relationship ${relationship.relationshipId} lost its source`,
    );
  }
});
