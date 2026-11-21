import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { mapJavaScript } from '../../src/adapters/javascript/mapper.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';
import { serializeRun } from '../../src/core/csr/serialize.js';

const read = (relative) =>
  fs.readFile(new URL(`../fixtures/javascript/${relative}`, import.meta.url), 'utf8');

/**
 * @param {Record<string, any>} options
 */
function analyze(options) {
  return mapJavaScript({
    runId: 'run:js-mapper',
    adapterId: 'js-acorn',
    adapterVersion: '0.1.0',
    ...options,
  });
}

/**
 * @param {import('../../src/core/csr/entities.js').AnalysisRun} run
 * @param {string} type
 */
function relationshipsOfType(run, type) {
  return run.relationships.filter((relationship) => relationship.type === type);
}

/**
 * @param {import('../../src/core/csr/entities.js').AnalysisRun} run
 * @param {string} name
 */
function symbolsNamed(run, name) {
  return run.symbols.filter((symbol) => symbol.name === name);
}

test('a module graph produces validated CSR with imports, exports and resolved calls', async () => {
  const run = analyze({
    path: 'src/app.js',
    text: await read('basic/app.js'),
    moduleKind: 'module',
    modules: [
      { path: 'src/util.js', text: await read('basic/util.js'), moduleKind: 'module' },
      { path: 'src/math.js', text: await read('basic/math.js'), moduleKind: 'module' },
    ],
    resolutions: [
      { from: 'src/app.js', specifier: './util.js', status: 'resolved', path: 'src/util.js' },
      { from: 'src/app.js', specifier: './math.js', status: 'resolved', path: 'src/math.js' },
    ],
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  assert.equal(run.completeness, 'full');
  assert.equal(run.files.length, 3);

  const imports = relationshipsOfType(run, 'imports');
  assert.equal(imports.length, 2);
  assert.ok(imports.every((entry) => entry.status === 'resolved'));
  assert.deepEqual(imports.map((entry) => entry.extensions.specifier).sort(), [
    './math.js',
    './util.js',
  ]);

  const exportNames = new Set(
    relationshipsOfType(run, 'exports').map((entry) => entry.extensions.exportName),
  );
  for (const name of ['doubled', 'compute', 'default', 'VERSION', 'helper', 'fromDefault', 'add']) {
    assert.ok(exportNames.has(name), name);
  }

  // `helper` is imported, so a call through it is genuinely resolved.
  const compute = symbolsNamed(run, 'compute')[0];
  const helperCalls = relationshipsOfType(run, 'calls').filter(
    (entry) => entry.from === compute.symbolId,
  );
  assert.ok(helperCalls.length >= 2);
  assert.ok(
    helperCalls.some((entry) => entry.status === 'resolved' && entry.to.includes(':util.helper')),
  );
  assert.ok(
    helperCalls.some((entry) => entry.status === 'resolved' && entry.to.includes(':math.add')),
  );

  const importBinding = symbolsNamed(run, 'helper').find((symbol) => symbol.extensions?.import);
  assert.deepEqual(importBinding.extensions.import, {
    source: './util.js',
    imported: 'helper',
    kind: 'named',
    binding: 'helper',
  });
});

test('lexical scoping keeps shadowed declarations distinct and resolves reads', async () => {
  const run = analyze({
    path: 'src/scopes.js',
    text: await read('scopes.js'),
    moduleKind: 'module',
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const values = symbolsNamed(run, 'value');
  assert.equal(values.length, 2);
  assert.notEqual(values[0].symbolId, values[1].symbolId);
  assert.notEqual(values[0].disambiguator, values[1].disambiguator);

  const top = symbolsNamed(run, 'top');
  // The exported `top` and the parameter named `top` are different symbols.
  assert.equal(top.length, 2);
  assert.ok(top.some((symbol) => symbol.kind === 'variable'));
  assert.ok(top.some((symbol) => symbol.kind === 'parameter'));

  const later = symbolsNamed(run, 'later')[0];
  const laterReads = relationshipsOfType(run, 'reads').filter(
    (entry) => entry.to === later.symbolId,
  );
  assert.equal(laterReads.length, 1);
  assert.equal(laterReads[0].status, 'resolved');
});

test('classes, fields, inheritance and instantiation are modelled honestly', async () => {
  const run = analyze({
    path: 'src/classes.js',
    text: await read('classes.js'),
    moduleKind: 'module',
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const child = symbolsNamed(run, 'Child')[0];
  const base = symbolsNamed(run, 'Base')[0];
  const secret = symbolsNamed(run, '#secret')[0];
  assert.equal(secret.kind, 'field');
  assert.equal(secret.visibility, 'private');

  const inherits = relationshipsOfType(run, 'inherits');
  assert.equal(inherits.length, 1);
  assert.equal(inherits[0].from, child.symbolId);
  assert.equal(inherits[0].to, base.symbolId);
  assert.equal(inherits[0].status, 'resolved');

  const instantiates = relationshipsOfType(run, 'instantiates');
  assert.equal(instantiates.length, 2);
  assert.ok(instantiates.every((entry) => entry.to === child.symbolId));

  const getter = symbolsNamed(run, 'secret').find((symbol) => symbol.disambiguator === 'get');
  assert.ok(getter);

  const save = symbolsNamed(run, 'save');
  assert.equal(save.length, 2);
  assert.ok(save.every((symbol) => symbol.kind === 'method'));

  // `Child.create()` is a direct call to a static method; `new Child()` is an
  // instantiation, not a call.
  const createCalls = relationshipsOfType(run, 'calls').filter((entry) =>
    entry.to.includes(':classes.Child.create'),
  );
  assert.ok(createCalls.length >= 1);
});

test('recursion is marked on the call rather than emitted as a special edge', () => {
  const run = analyze({
    path: 'src/recursion.js',
    text: 'function fact(n) { return n <= 1 ? 1 : n * fact(n - 1); }\nexport { fact };',
    moduleKind: 'module',
  });
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const fact = symbolsNamed(run, 'fact')[0];
  const recursive = relationshipsOfType(run, 'calls').filter(
    (entry) => entry.from === fact.symbolId && entry.to === fact.symbolId,
  );
  assert.equal(recursive.length, 1);
  assert.equal(recursive[0].extensions.recursive, true);
});

test('eval and with degrade static calls to possible with the right reason code', () => {
  const evalRun = analyze({
    path: 'src/eval.js',
    text: [
      'function target() { return 1; }',
      'function caller() {',
      '  eval("var injected = 1;");',
      '  return target();',
      '}',
      'export { target, caller };',
    ].join('\n'),
    moduleKind: 'module',
  });
  const evalCall = relationshipsOfType(evalRun, 'calls').find((entry) =>
    entry.to.includes(':eval.target'),
  );
  assert.equal(evalCall.status, 'possible');
  assert.equal(evalCall.reasonCode, 'eval_scope');
  assert.ok(evalRun.diagnostics.some((entry) => entry.code === 'eval_scope'));

  const withRun = analyze({
    path: 'src/with.cjs',
    text: [
      'var target = function () { return 1; };',
      'function caller(obj) { with (obj) { return target(); } }',
    ].join('\n'),
    moduleKind: 'script',
  });
  const withCall = relationshipsOfType(withRun, 'calls').find((entry) =>
    entry.to.includes(':with.target'),
  );
  assert.equal(withCall.status, 'possible');
  assert.equal(withCall.reasonCode, 'dynamic_scope');
  assert.ok(withRun.diagnostics.some((entry) => entry.code === 'dynamic_scope'));
});

test('dynamic receivers, computed members and unbound globals are never resolved', async () => {
  const run = analyze({
    path: 'src/dynamic.cjs',
    text: await read('dynamic.cjs'),
    moduleKind: 'script',
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const calls = relationshipsOfType(run, 'calls');

  const computed = calls.find((entry) => entry.reasonCode === 'computed_member');
  assert.equal(computed.status, 'unresolved');

  const indirect = calls.find((entry) => entry.extensions?.note === 'Function.prototype.call');
  assert.equal(indirect.status, 'inferred');
  assert.equal(indirect.reasonCode, 'dynamic_dispatch');

  const timer = calls.find((entry) => entry.to === 'external:global.setTimeout');
  assert.equal(timer.status, 'unresolved');
  assert.equal(timer.reasonCode, 'out_of_scope');

  const deferred = calls.find((entry) => entry.reasonCode === 'deferred_invocation');
  assert.equal(deferred.status, 'possible');
  assert.ok(deferred.to.includes('parameter:dynamic.deferred.fn'));

  // A bare function value is a read, not a call.
  const target = symbolsNamed(run, 'target')[0];
  assert.ok(!calls.some((entry) => entry.to === target.symbolId && entry.status === 'resolved'));
});

test('CommonJS require and module.exports become imports and exports', async () => {
  const run = analyze({
    path: 'src/main.cjs',
    text: await read('cjs/main.cjs'),
    moduleKind: 'script',
    modules: [{ path: 'src/util.cjs', text: await read('cjs/util.cjs'), moduleKind: 'script' }],
    resolutions: [
      { from: 'src/main.cjs', specifier: './util.cjs', status: 'resolved', path: 'src/util.cjs' },
    ],
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const imports = relationshipsOfType(run, 'imports');
  assert.equal(imports.length, 2);
  assert.ok(imports.every((entry) => entry.status === 'resolved'));
  assert.ok(imports.every((entry) => entry.extensions.moduleSystem === 'cjs'));

  const exported = new Set(
    relationshipsOfType(run, 'exports').map((entry) => entry.extensions.exportName),
  );
  assert.ok(exported.has('add'));
  assert.ok(exported.has('local'));

  const helperCalls = relationshipsOfType(run, 'calls').filter((entry) =>
    entry.to.includes(':util.helper'),
  );
  assert.equal(helperCalls.length, 2);
  assert.ok(helperCalls.every((entry) => entry.status === 'resolved'));
});

test('an unresolvable import is unresolved with a reason code, never a guessed edge', () => {
  const run = analyze({
    path: 'src/app.js',
    text: 'import { thing } from "some-package";\nexport const value = thing();',
    moduleKind: 'module',
    resolutions: [
      {
        from: 'src/app.js',
        specifier: 'some-package',
        status: 'unresolved',
        reasonCode: 'external_package',
      },
    ],
  });
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const imports = relationshipsOfType(run, 'imports');
  assert.equal(imports[0].status, 'unresolved');
  assert.equal(imports[0].reasonCode, 'external_package');
  assert.equal(run.completeness, 'partial');
  assert.ok(run.diagnostics.some((entry) => entry.code === 'unknown_import_target'));
});

test('a parse error yields a valid partial run with a positioned diagnostic', () => {
  const run = analyze({
    path: 'src/broken.js',
    text: 'export function broken( {\n  return 1;\n}\n',
    moduleKind: 'module',
  });
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  assert.equal(run.completeness, 'partial');
  const diagnostic = run.diagnostics.find((entry) => entry.code === 'parse_error');
  assert.ok(diagnostic);
  assert.equal(diagnostic.severity, 'error');
  assert.ok(diagnostic.sourceRange);
});

test('unicode identifiers keep UTF-16 ranges and names', async () => {
  const text = await read('unicode.js');
  const run = analyze({ path: 'src/unicode.js', text, moduleKind: 'module' });
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);

  const parameter = symbolsNamed(run, '函数')[0];
  assert.equal(parameter.kind, 'parameter');
  const index = text.split('\n')[0].indexOf('函数');
  assert.equal(parameter.declaration.startLine, 0);
  assert.equal(parameter.declaration.startColumn, index);

  const café = symbolsNamed(run, 'café')[0];
  assert.ok(café);
  const classCafé = symbolsNamed(run, 'Café')[0];
  assert.equal(classCafé.kind, 'class');
});

test('this field and accessor access is inferred from the class shape, never resolved', () => {
  const run = analyze({
    path: 'src/temperature.js',
    text: [
      'export class Temperature {',
      '  #celsius = 0;',
      '  get celsius() { return this.#celsius; }',
      '  set celsius(next) { this.#celsius = next; }',
      '  bump() { this.celsius = this.celsius + 1; }',
      '}',
    ].join('\n'),
    moduleKind: 'module',
  });

  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const celsius = symbolsNamed(run, 'celsius');
  assert.equal(celsius.length, 2);
  assert.ok(celsius.some((symbol) => symbol.disambiguator === 'get'));
  assert.ok(celsius.some((symbol) => symbol.disambiguator === 'set'));

  const propertyEdges = relationshipsOfType(run, 'reads')
    .concat(relationshipsOfType(run, 'writes'))
    .filter((entry) => entry.extensions?.propertyAccess === true);
  assert.ok(propertyEdges.length > 0);
  assert.ok(propertyEdges.every((entry) => entry.status === 'inferred'));
  assert.ok(propertyEdges.every((entry) => entry.reasonCode === 'dynamic_dispatch'));

  const setterWrite = propertyEdges.find(
    (entry) => entry.type === 'writes' && entry.extensions.accessor === 'setter',
  );
  assert.ok(setterWrite, 'assignment to an accessor targets the setter');
  const getterRead = propertyEdges.find(
    (entry) => entry.type === 'reads' && entry.extensions.accessor === 'getter',
  );
  assert.ok(getterRead, 'property read targets the getter');

  // A name-only match on a different receiver must not produce an edge.
  const unknown = analyze({
    path: 'src/other.js',
    text: [
      'export class Holder { value = 1; read() { return this.value; } }',
      'export function read(other) { return other.value; }',
    ].join('\n'),
    moduleKind: 'module',
  });
  assert.equal(validateAnalysisRun(unknown, { mode: 'strict' }).ok, true);
  const leaked = relationshipsOfType(unknown, 'reads').filter(
    (entry) => entry.extensions?.propertyAccess === true,
  );
  assert.equal(leaked.length, 1);
  const target = unknown.symbols.find((symbol) => symbol.symbolId === leaked[0].to);
  assert.equal(target.name, 'value');
  assert.equal(target.kind, 'field');
});

test('named function expressions and catch parameters stay in their own scope', () => {
  const run = analyze({
    path: 'src/narrow.js',
    text: [
      'export const named = function inner() {',
      '  return inner;',
      '};',
      '',
      'export function guarded() {',
      '  try {',
      '    return 1;',
      '  } catch (error) {',
      '    return error;',
      '  }',
      '}',
    ].join('\n'),
    moduleKind: 'module',
  });
  assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
  const inner = symbolsNamed(run, 'inner');
  assert.equal(inner.length, 1);
  assert.equal(inner[0].kind, 'closure');
  const selfRead = relationshipsOfType(run, 'reads').find(
    (entry) => entry.to === inner[0].symbolId,
  );
  assert.ok(selfRead);
  assert.equal(selfRead.status, 'resolved');

  const error = symbolsNamed(run, 'error');
  assert.equal(error.length, 1);
  assert.equal(error[0].kind, 'variable');
  // The catch binding is not visible at module scope.
  const escape = analyze({
    path: 'src/escaped.js',
    text: 'try { throw 1; } catch (error) {}\nexport const leaked = error;',
    moduleKind: 'module',
  });
  const leaked = relationshipsOfType(escape, 'reads').find((entry) => entry.to.includes('error'));
  assert.equal(leaked, undefined);
});

test('symbol ids survive comments, whitespace and line shifts', () => {
  const original = analyze({
    path: 'src/stable.js',
    text: [
      'function named() { return 1; }',
      'setTimeout(function () { return named(); }, 0);',
      'const arrow = () => named();',
    ].join('\n'),
    moduleKind: 'module',
  });
  const shifted = analyze({
    path: 'src/stable.js',
    text: [
      '// a comment that did not exist before',
      '',
      'function named() {',
      '  return 1;',
      '}',
      '',
      'setTimeout(function () { return named(); }, 0);',
      '',
      '',
      'const arrow = () => named();',
    ].join('\n'),
    moduleKind: 'module',
  });
  const ids = (run) =>
    run.symbols
      .filter((symbol) => symbol.kind !== 'file' && symbol.kind !== 'module')
      .map((symbol) => `${symbol.kind}:${symbol.name}`)
      .sort();
  assert.deepEqual(ids(shifted), ids(original));
  for (const name of ['named', 'arrow']) {
    assert.equal(
      symbolsNamed(shifted, name)[0].symbolId,
      symbolsNamed(original, name)[0].symbolId,
      name,
    );
  }
});

test('analysis never executes the analysed source', () => {
  globalThis.__codeflowExecuted = false;
  try {
    const run = analyze({
      path: 'src/side-effect.js',
      text: [
        'globalThis.__codeflowExecuted = true;',
        'throw new Error("this must not run");',
        'function after() { return 1; }',
      ].join('\n'),
      moduleKind: 'script',
    });
    assert.equal(globalThis.__codeflowExecuted, false);
    assert.ok(symbolsNamed(run, 'after').length === 1);
  } finally {
    delete globalThis.__codeflowExecuted;
  }
});

test('BOM, CRLF and CR-only files share the same coordinates', () => {
  const variants = [
    'function first() {}\nfunction second() {}',
    '\ufefffunction first() {}\nfunction second() {}',
    'function first() {}\r\nfunction second() {}',
    'function first() {}\rfunction second() {}',
  ];
  const positions = variants.map((text) => {
    const run = analyze({ path: 'src/lines.js', text, moduleKind: 'module' });
    assert.equal(validateAnalysisRun(run, { mode: 'strict' }).ok, true);
    const second = symbolsNamed(run, 'second')[0];
    return [second.declaration.startLine, second.declaration.startColumn];
  });
  assert.deepEqual(positions, [
    [1, 0],
    [1, 0],
    [1, 0],
    [1, 0],
  ]);
});

test('two runs on identical input serialize byte-identically', () => {
  const input = {
    path: 'src/deterministic.js',
    text: 'export function a() { return 1; }\nexport function b() { return a(); }',
    moduleKind: 'module',
  };
  assert.equal(serializeRun(analyze(input)), serializeRun(analyze(input)));
});
