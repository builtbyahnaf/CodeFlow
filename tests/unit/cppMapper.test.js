import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { mapClangAst } from '../../src/adapters/cpp/mapper.js';
import { utf16Column, splitLines } from '../../src/adapters/cpp/locator.js';
import { validateAnalysisRun } from '../../src/core/csr/entities.js';

const astText = await fs.readFile(
  new URL('../fixtures/cpp/ast-basic.json', import.meta.url),
  'utf8',
);
const sourceText = await fs.readFile(new URL('../fixtures/cpp/basic.cpp', import.meta.url), 'utf8');

function makeRun(overrides = {}) {
  return mapClangAst({
    runId: 'run:cpp-map-1',
    path: 'src/main.cpp',
    text: sourceText,
    ast: astText,
    workspaceRoot: 'D:/w',
    ...overrides,
  });
}

function symbolByQualifiedName(run, name) {
  return run.symbols.find((symbol) => symbol.qualifiedName === name);
}

test('a Clang AST produces valid CSR', () => {
  const run = makeRun();
  const validated = validateAnalysisRun(run);
  assert.equal(validated.ok, true, JSON.stringify(validated.issues));
  assert.equal(run.csrVersion, '1.1.0');
  assert.equal(run.language, 'cpp');
  assert.equal(run.completeness, 'full');
  assert.equal(run.scope.path, 'src/main.cpp');
  assert.ok(run.files.some((file) => file.path === 'src/main.cpp'));
  const file = run.files.find((entry) => entry.path === 'src/main.cpp');
  assert.equal(file.lineCount, 29);
  assert.equal(file.language, 'cpp');
  assert.ok(file.sizeBytes > 0);
});

test('declarations are typed and ranged with zero-based coordinates', () => {
  const run = makeRun();
  const add = symbolByQualifiedName(run, 'math::add');
  assert.equal(add.kind, 'function');
  assert.equal(add.declaration.startLine, 4);
  assert.equal(add.declaration.startColumn, 2);
  assert.equal(add.signature, 'int (int, int)');
  assert.equal(add.parentId, symbolByQualifiedName(run, 'math').symbolId);

  const square = symbolByQualifiedName(run, 'math::square');
  assert.equal(square.kind, 'function');
  assert.equal(square.declaration.startLine, 5);

  const widget = symbolByQualifiedName(run, 'Widget');
  assert.equal(widget.kind, 'class');
  assert.equal(widget.declaration.endLine, 13);

  const save = symbolByQualifiedName(run, 'Widget::save');
  assert.equal(save.kind, 'method');
  assert.equal(save.visibility, 'public');
  assert.equal(save.extensions.cpp.virtual, true);

  const count = symbolByQualifiedName(run, 'Widget::count');
  assert.equal(count.kind, 'field');
  assert.equal(count.visibility, 'public');

  const parameter = symbolByQualifiedName(run, 'math::add::a');
  assert.equal(parameter.kind, 'parameter');
  assert.equal(parameter.parentId, add.symbolId);
});

test('resolved calls use Clang declaration ids rather than name guesses', () => {
  const run = makeRun();
  const main = symbolByQualifiedName(run, 'main');
  const square = symbolByQualifiedName(run, 'math::square');
  const add = symbolByQualifiedName(run, 'math::add');
  const plain = symbolByQualifiedName(run, 'Widget::plain');

  const squareCall = run.relationships.find(
    (relationship) =>
      relationship.type === 'calls' &&
      relationship.from === main.symbolId &&
      relationship.to === square.symbolId,
  );
  assert.ok(squareCall);
  assert.equal(squareCall.status, 'resolved');
  assert.equal(squareCall.site.startLine, 23);
  assert.equal(squareCall.site.startColumn, 2);

  const addCall = run.relationships.find(
    (relationship) => relationship.type === 'calls' && relationship.to === add.symbolId,
  );
  assert.ok(addCall);
  assert.equal(addCall.status, 'resolved');
  assert.equal(addCall.from, symbolByQualifiedName(run, 'math::square').symbolId);

  const plainCall = run.relationships.find(
    (relationship) => relationship.type === 'calls' && relationship.to === plain.symbolId,
  );
  assert.ok(plainCall);
  assert.equal(plainCall.status, 'resolved');
});

test('virtual dispatch is possible, never resolved', () => {
  const run = makeRun();
  const save = symbolByQualifiedName(run, 'Widget::save');
  const saveCall = run.relationships.find(
    (relationship) => relationship.type === 'calls' && relationship.to === save.symbolId,
  );
  assert.ok(saveCall);
  assert.equal(saveCall.status, 'possible');
  assert.equal(saveCall.reasonCode, 'dynamic_dispatch');
  assert.deepEqual(saveCall.extensions.cpp.candidates, [save.symbolId]);
});

test('function-pointer calls stay unresolved with a reason code', () => {
  const run = makeRun();
  const fn = symbolByQualifiedName(run, 'callThroughPointer::fn');
  const fnCall = run.relationships.find(
    (relationship) => relationship.type === 'calls' && relationship.to === fn.symbolId,
  );
  assert.ok(fnCall);
  assert.equal(fnCall.status, 'unresolved');
  assert.equal(fnCall.reasonCode, 'function_pointer');
});

test('constructor expressions instantiate the class', () => {
  const run = makeRun();
  const widget = symbolByQualifiedName(run, 'Widget');
  const instantiation = run.relationships.find(
    (relationship) => relationship.type === 'instantiates',
  );
  assert.ok(instantiation);
  assert.equal(instantiation.status, 'resolved');
  assert.equal(instantiation.to, widget.symbolId);
});

test('quoted includes are unresolved when the header is outside the AST', () => {
  const run = makeRun();
  const includes = run.relationships.filter((relationship) => relationship.type === 'includes');
  assert.equal(includes.length, 1);
  assert.equal(includes[0].status, 'unresolved');
  assert.equal(includes[0].to, 'external:widget.h');
  assert.equal(includes[0].reasonCode, 'out_of_scope');
  assert.equal(includes[0].site.startLine, 0);
  assert.equal(includes[0].site.endColumn, 19);
});

test('template declarations are reported as a modelling limitation', () => {
  const run = makeRun();
  const identity = symbolByQualifiedName(run, 'identity');
  assert.ok(identity);
  assert.equal(identity.extensions.cpp.template, true);
  const diagnostic = run.diagnostics.find((entry) => entry.code === 'unsupported_construct');
  assert.ok(diagnostic);
  assert.match(diagnostic.message, /template/i);
});

test('heuristic mode degrades completeness with a typed warning', () => {
  const run = makeRun({
    mode: 'heuristic',
    warnings: [
      {
        code: 'missing_compile_db',
        message: 'No compilation database entry covers this file.',
      },
    ],
  });
  assert.equal(run.completeness, 'partial');
  assert.ok(run.diagnostics.some((entry) => entry.code === 'missing_compile_db'));
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('unmapped headers are reported, not silently ignored', () => {
  const run = makeRun({ headerMap: { 'include/orphan.h': null } });
  const diagnostic = run.diagnostics.find((entry) => entry.code === 'header_without_tu');
  assert.ok(diagnostic);
  assert.match(diagnostic.message, /orphan\.h/);
});

test('mapping is deterministic for the same input', () => {
  const first = makeRun();
  const second = makeRun();
  assert.deepEqual(
    first.symbols.map((symbol) => symbol.symbolId),
    second.symbols.map((symbol) => symbol.symbolId),
  );
  assert.deepEqual(
    first.relationships.map((relationship) => relationship.relationshipId),
    second.relationships.map((relationship) => relationship.relationshipId),
  );
});

test('a malformed AST becomes an empty, diagnosed run rather than a throw', () => {
  const run = makeRun({ ast: '{ not json' });
  assert.equal(run.completeness, 'partial');
  assert.ok(run.diagnostics.some((entry) => entry.code === 'parse_error'));
  assert.equal(validateAnalysisRun(run).ok, true);
});

test('byte columns are converted to UTF-16 columns', () => {
  const line = 'a😀b';
  // Clang reports UTF-8 byte offsets: after 'a' = 1, after the emoji = 5, after 'b' = 6.
  assert.equal(utf16Column(line, 1), 1);
  assert.equal(utf16Column(line, 5), 3);
  assert.equal(utf16Column(line, 6), 4);
  assert.deepEqual(splitLines('a\r\nb\rc\nd'), ['a', 'b', 'c', 'd']);
});
