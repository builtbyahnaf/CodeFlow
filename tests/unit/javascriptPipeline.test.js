import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import {
  DEFAULT_MAX_DEPTH,
  DEFAULT_MAX_FILE_BYTES,
  DEFAULT_MAX_LINES,
  DEFAULT_MAX_MODULES,
  createJavaScriptAnalysisService,
} from '../../src/extension/javascript/pipeline.js';

const ROOT = 'D:/w';
const PLATFORM = 'win32';

/**
 * @param {Record<string, string|{dir: true}>} entries
 */
function createFileSystem(entries) {
  const files = new Map();
  for (const [key, value] of Object.entries(entries)) {
    files.set(normalize(key), value);
  }
  // Real file systems imply parent directories; the resolver stats them.
  for (const key of [...files.keys()]) {
    let current = path.posix.dirname(key);
    while (current !== '.' && current !== '/' && !files.has(current)) {
      files.set(current, { dir: true });
      current = path.posix.dirname(current);
    }
  }
  const reads = [];
  return {
    files,
    reads,
    /** @type {typeof import('node:fs/promises').readFile} */
    async readFile(candidate) {
      const key = normalize(candidate);
      reads.push(key);
      const value = files.get(key);
      if (value === undefined) {
        const error = new Error(`ENOENT: ${candidate}`);
        // @ts-expect-error test double
        error.code = 'ENOENT';
        throw error;
      }
      if (typeof value !== 'string') {
        throw new Error(`EISDIR: ${candidate}`);
      }
      return value;
    },
    /** @type {typeof import('node:fs/promises').stat} */
    async stat(candidate) {
      const key = normalize(candidate);
      if (!files.has(key)) {
        const error = new Error(`ENOENT: ${candidate}`);
        // @ts-expect-error test double
        error.code = 'ENOENT';
        throw error;
      }
      const value = files.get(key);
      const isFile = typeof value === 'string';
      return {
        isFile: () => isFile,
        isDirectory: () => !isFile,
        size: isFile ? Buffer.byteLength(/** @type {string} */ (value), 'utf8') : 0,
      };
    },
  };
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return path.resolve(value).replace(/\\/g, '/').toLowerCase();
}

/**
 * @param {ReturnType<typeof createFileSystem>} fileSystem
 * @param {Record<string, unknown>} [settings]
 */
function createService(fileSystem, settings = {}) {
  const registry = createAdapterRegistry();
  registry.register(javascriptAdapter);
  return createJavaScriptAnalysisService({
    registry,
    readFile: fileSystem.readFile,
    stat: fileSystem.stat,
    settings,
    platform: PLATFORM,
    logger: {},
  });
}

/**
 * @param {string} pathValue
 * @param {Record<string, unknown>} [overrides]
 */
function baseInput(pathValue, overrides = {}) {
  return {
    runId: 'run:js-pipeline',
    path: pathValue,
    workspaceRoot: ROOT,
    trusted: true,
    ...overrides,
  };
}

test('default limits are documented constants', () => {
  assert.equal(DEFAULT_MAX_FILE_BYTES, 2 * 1024 * 1024);
  assert.equal(DEFAULT_MAX_LINES, 20_000);
  assert.equal(DEFAULT_MAX_MODULES, 64);
  assert.equal(DEFAULT_MAX_DEPTH, 8);
});

test('Restricted Mode is rejected before any file is read', async () => {
  const fs = createFileSystem({ 'D:/w/src/app.js': 'export const a = 1;' });
  const service = createService(fs);
  const result = await service.analyze(baseInput('src/app.js', { trusted: false }));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNTRUSTED');
  assert.equal(fs.reads.length, 0);
});

test('outside-workspace, NUL, non-JavaScript, excluded and minified paths are input errors', async () => {
  const fs = createFileSystem({
    'D:/elsewhere/app.js': 'const a = 1;',
    'D:/w/src/app.min.js': 'const a=1;',
    'D:/w/node_modules/pkg/index.js': 'const a = 1;',
  });
  const service = createService(fs);

  const outside = await service.analyze(baseInput('D:/elsewhere/app.js'));
  assert.equal(outside.code, 'E_INPUT');

  const nul = await service.analyze(baseInput('src/\u0000app.js'));
  assert.equal(nul.code, 'E_INPUT');

  const notJs = await service.analyze(baseInput('src/app.css'));
  assert.equal(notJs.code, 'E_UNSUPPORTED');

  const excluded = await service.analyze(baseInput('node_modules/pkg/index.js'));
  assert.equal(excluded.code, 'E_INPUT');
  assert.match(excluded.message, /excluded directory/);

  const minified = await service.analyze(baseInput('src/app.min.js'));
  assert.equal(minified.code, 'E_INPUT');
  assert.match(minified.message, /minified/);
});

test('an oversized or generated file is rejected with a clear message', async () => {
  const fs = createFileSystem({
    'D:/w/src/big.js': 'x'.repeat(64),
    'D:/w/src/generated.js': '// @generated\nconst a = 1;',
  });
  const service = createService(fs, { maxFileBytes: 16 });

  const big = await service.analyze(baseInput('src/big.js'));
  assert.equal(big.code, 'E_INPUT');
  assert.match(big.message, /analysis limit/);

  const generatedService = createService(fs);
  const generated = await generatedService.analyze(baseInput('src/generated.js'));
  assert.equal(generated.code, 'E_INPUT');
  assert.match(generated.message, /generated/);
});

test('prepare resolves relative modules and detects package type', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': 'import { util } from "./util.js";\nexport const value = util();',
    'D:/w/src/util.js': 'export function util() { return 1; }',
  });
  const service = createService(fs);
  const prepared = await service.prepare(baseInput('src/app.js'));
  assert.equal(prepared.ok, true);
  assert.equal(prepared.value.jsModuleKind, 'module');
  assert.equal(prepared.value.jsModules.length, 1);
  assert.equal(prepared.value.jsModules[0].path, 'src/util.js');
  assert.equal(prepared.value.jsModules[0].moduleKind, 'module');
  assert.deepEqual(
    prepared.value.jsResolutions.map((entry) => [entry.specifier, entry.status, entry.path]),
    [['./util.js', 'resolved', 'src/util.js']],
  );
});

test('a package import is external unless node_modules resolution is enabled', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': 'import pkg from "pkg";\nexport const value = pkg();',
    'D:/w/node_modules/pkg/package.json': JSON.stringify({ main: 'lib.js' }),
    'D:/w/node_modules/pkg/lib.js': 'module.exports = function pkg() { return 1; };',
  });

  const off = createService(fs);
  const preparedOff = await off.prepare(baseInput('src/app.js'));
  assert.equal(preparedOff.ok, true);
  assert.deepEqual(preparedOff.value.jsResolutions, [
    {
      from: 'src/app.js',
      specifier: 'pkg',
      status: 'unresolved',
      reasonCode: 'external_package',
      message:
        '"pkg" is a package import. Enable codeflow.javascript.resolveNodeModules to read workspace node_modules.',
    },
  ]);

  const on = createService(fs, { resolveNodeModules: true });
  const preparedOn = await on.prepare(baseInput('src/app.js'));
  assert.equal(preparedOn.ok, true);
  assert.equal(preparedOn.value.jsResolutions[0].status, 'resolved');
  assert.equal(preparedOn.value.jsResolutions[0].path, 'node_modules/pkg/lib.js');
});

test('package exports maps resolve a single string or import condition, otherwise report a gap', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js':
      'import a from "a";\nimport b from "b";\nimport c from "c";\nexport const value = a() + b() + c();',
    'D:/w/node_modules/a/package.json': JSON.stringify({ exports: './entry.js' }),
    'D:/w/node_modules/a/entry.js': 'export default function a() { return 1; }',
    'D:/w/node_modules/b/package.json': JSON.stringify({
      exports: { '.': { import: './esm.js', require: './cjs.js' } },
    }),
    'D:/w/node_modules/b/esm.js': 'export default function b() { return 1; }',
    'D:/w/node_modules/b/cjs.js': 'module.exports = function b() { return 1; };',
    'D:/w/node_modules/c/package.json': JSON.stringify({
      exports: { '.': ['./c.js', './fallback.js'] },
    }),
    'D:/w/node_modules/c/c.js': 'export default function c() { return 1; }',
  });
  const service = createService(fs, { resolveNodeModules: true });
  const prepared = await service.prepare(baseInput('src/app.js'));
  assert.equal(prepared.ok, true);
  const bySpecifier = new Map(
    prepared.value.jsResolutions.map((entry) => [entry.specifier, entry]),
  );
  assert.equal(bySpecifier.get('a').status, 'resolved');
  assert.equal(bySpecifier.get('a').path, 'node_modules/a/entry.js');
  assert.equal(bySpecifier.get('b').status, 'resolved');
  assert.equal(bySpecifier.get('b').path, 'node_modules/b/esm.js');
  assert.equal(bySpecifier.get('c').status, 'unresolved');
  assert.equal(bySpecifier.get('c').reasonCode, 'exports_map_unsupported');
});

test('aliases, absolute specifiers and escaping relative imports are never guessed', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': [
      'import a from "@/a.js";',
      'import b from "D:/w/abs.js";',
      'const c = require("../../outside.js");',
      'export const value = a();',
    ].join('\n'),
  });
  const service = createService(fs);
  const prepared = await service.prepare(baseInput('src/app.js'));
  assert.equal(prepared.ok, true);
  const bySpecifier = new Map(
    prepared.value.jsResolutions.map((entry) => [entry.specifier, entry]),
  );
  assert.equal(bySpecifier.get('@/a.js').reasonCode, 'path_alias_unresolved');
  assert.equal(bySpecifier.get('D:/w/abs.js').reasonCode, 'unknown_import_target');
  assert.equal(bySpecifier.get('../../outside.js').reasonCode, 'unknown_import_target');
  assert.ok([...bySpecifier.values()].every((entry) => entry.status === 'unresolved'));
});

test('circular imports terminate and both edges resolve', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/a.js': 'import { b } from "./b.js";\nexport function a() { return b(); }',
    'D:/w/src/b.js': 'import { a } from "./a.js";\nexport function b() { return a(); }',
  });
  const service = createService(fs);
  const prepared = await service.prepare(baseInput('src/a.js'));
  assert.equal(prepared.ok, true);
  assert.equal(prepared.value.jsModules.length, 1);
  assert.deepEqual(
    prepared.value.jsResolutions.map((entry) => [entry.from, entry.specifier, entry.status]),
    [
      ['src/a.js', './b.js', 'resolved'],
      ['src/b.js', './a.js', 'resolved'],
    ],
  );
});

test('the module cap becomes an unresolved edge plus a diagnostic, never a silent drop', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': 'import a from "./a.js";\nimport b from "./b.js";\nexport const value = a;',
    'D:/w/src/a.js': 'export default 1;',
    'D:/w/src/b.js': 'export default 2;',
  });
  const service = createService(fs, { maxModules: 2 });
  const prepared = await service.prepare(baseInput('src/app.js'));
  assert.equal(prepared.ok, true);
  const capped = prepared.value.jsResolutions.find(
    (entry) => entry.reasonCode === 'budget_exceeded',
  );
  assert.ok(capped);
  assert.equal(capped.status, 'unresolved');
  assert.ok(prepared.value.jsDiagnostics.some((entry) => entry.code === 'budget_exceeded'));
});

test('a long file degrades to syntax and declarations with a budget diagnostic', async () => {
  const fs = createFileSystem({
    'D:/w/src/long.js': 'const a = 1;\nconst b = 2;\nconst c = 3;',
  });
  const service = createService(fs, { maxLines: 2 });
  const prepared = await service.prepare(baseInput('src/long.js'));
  assert.equal(prepared.ok, true);
  assert.equal(prepared.value.jsSyntaxOnly, true);
  assert.ok(prepared.value.jsDiagnostics.some((entry) => entry.code === 'budget_exceeded'));
});

test('JSON modules are included as modules with a default export', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': 'import data from "./data.json";\nexport const value = data;',
    'D:/w/src/data.json': '{"answer":42}',
  });
  const service = createService(fs);
  const prepared = await service.prepare(baseInput('src/app.js'));
  assert.equal(prepared.ok, true);
  const module = prepared.value.jsModules.find((entry) => entry.path === 'src/data.json');
  assert.ok(module);
  assert.equal(module.json, true);
  assert.equal(prepared.value.jsResolutions[0].status, 'resolved');
});

test('the service feeds the adapter and produces validated CSR end to end', async () => {
  const fs = createFileSystem({
    'D:/w/package.json': JSON.stringify({ type: 'module' }),
    'D:/w/src/app.js': 'import { util } from "./util.js";\nexport const value = util();',
    'D:/w/src/util.js': 'export function util() { return 1; }',
  });
  const service = createService(fs);
  const result = await service.analyze(baseInput('src/app.js'));
  assert.equal(result.ok, true);
  assert.equal(result.run.language, 'javascript');
  assert.ok(result.run.files.some((file) => file.path === 'src/util.js'));
  const call = result.run.relationships.find(
    (entry) => entry.type === 'calls' && entry.to.includes(':util.util'),
  );
  assert.ok(call);
  assert.equal(call.status, 'resolved');
});

test('TypeScript and JSX are rejected by the adapter without being read', async () => {
  const fs = createFileSystem({
    'D:/w/src/app.ts': 'export function typed(value: number) { return value; }',
    'D:/w/src/app.jsx': 'export const view = <div />;',
  });
  const service = createService(fs);
  const ts = await service.analyze(baseInput('src/app.ts'));
  assert.equal(ts.ok, true);
  assert.equal(ts.run.completeness, 'partial');
  assert.ok(ts.run.diagnostics.some((entry) => entry.code === 'unsupported_language'));

  const jsx = await service.analyze(baseInput('src/app.jsx'));
  assert.equal(jsx.ok, true);
  assert.equal(jsx.run.completeness, 'partial');
  assert.ok(jsx.run.diagnostics.some((entry) => entry.code === 'unsupported_syntax'));
  assert.equal(fs.reads.length, 0);
});

test('a non-JavaScript path falls through to the registry', async () => {
  const fs = createFileSystem({});
  const service = createService(fs);
  const result = await service.analyze(baseInput('src/app.cpp'));
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
});

test('an absolute Windows input path is normalized to workspace-relative CSR without drops', async () => {
  const fs = createFileSystem({
    'D:/w/js/app.js': '(function () { function helper(x) { return x * 2; } return helper(3); })();',
  });
  const service = createService(fs);
  const result = await service.analyze(baseInput('d:\\w\\js\\app.js'));
  assert.equal(result.ok, true);
  assert.equal(result.dropped, undefined);
  assert.equal(result.run.files[0].path, 'js/app.js');
  assert.ok(result.run.symbols.some((symbol) => symbol.kind === 'function' && symbol.name === 'helper'));
});
