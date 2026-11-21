import test from 'node:test';
import assert from 'node:assert/strict';

import {
  childNodes,
  collectModuleSpecifiers,
  parseJavaScript,
  stripBom,
} from '../../src/adapters/javascript/parser.js';
import {
  DEFAULT_EXCLUDED_SEGMENTS,
  detectModuleKind,
  exclusionFor,
  extensionOf,
  isGeneratedSource,
  isJavaScriptPath,
  isJsxPath,
  isMinifiedPath,
  isTypeScriptPath,
} from '../../src/adapters/javascript/moduleKind.js';

test('stripBom removes exactly one leading BOM and reports its length', () => {
  assert.deepEqual(stripBom('\ufeffconst a = 1;'), { text: 'const a = 1;', bomLength: 1 });
  assert.deepEqual(stripBom('const a = 1;'), { text: 'const a = 1;', bomLength: 0 });
  assert.deepEqual(stripBom(null), { text: '', bomLength: 0 });
});

test('a module parses with declarations and a module scope', () => {
  const parsed = parseJavaScript('import { x } from "./x.js";\nexport const y = x;', {
    sourceType: 'module',
  });
  assert.equal(parsed.ok, true);
  assert.equal(parsed.ast.sourceType, 'module');
  assert.ok(parsed.scopeManager.scopes.some((scope) => scope.type === 'module'));
});

test('a script rejects module syntax instead of guessing', () => {
  const parsed = parseJavaScript('import { x } from "./x.js";', { sourceType: 'script' });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.diagnostic.code, 'parse_error');
  assert.equal(typeof parsed.diagnostic.line, 'number');
});

test('parser diagnostics sanitise absolute paths and cap their length', () => {
  const parsed = parseJavaScript('const a = ;', { sourceType: 'module' });
  assert.equal(parsed.ok, false);
  assert.doesNotMatch(parsed.diagnostic.message, /[A-Za-z]:\\/);
  assert.ok(parsed.diagnostic.message.length <= 520);
});

test('JSX is classified as unsupported syntax, not a generic parse error', () => {
  const parsed = parseJavaScript('const view = <div />;', { sourceType: 'module' });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.diagnostic.code, 'unsupported_syntax');
  assert.match(parsed.diagnostic.message, /JSX/);
});

test('a redeclaration is a parse error, not a silently merged binding', () => {
  const parsed = parseJavaScript('let value = 1;\nlet value = 2;', { sourceType: 'module' });
  assert.equal(parsed.ok, false);
  assert.equal(parsed.diagnostic.code, 'parse_error');
  assert.equal(parsed.diagnostic.line, 2);
});

test('childNodes walks nested ESTree values without a key table', () => {
  const parsed = parseJavaScript('function outer() { return () => 1; }', {
    sourceType: 'module',
  });
  assert.equal(parsed.ok, true);
  const types = [];
  const visit = (node) => {
    types.push(node.type);
    for (const child of childNodes(node)) {
      visit(child);
    }
  };
  visit(parsed.ast);
  assert.ok(types.includes('FunctionDeclaration'));
  assert.ok(types.includes('ArrowFunctionExpression'));
  assert.ok(types.includes('ReturnStatement'));
});

test('collectModuleSpecifiers finds static, re-exported, dynamic and require requests', () => {
  const source = [
    'import a from "./a.js";',
    'export * from "./b.js";',
    'export { c } from "./c.js";',
    'const d = await import("./d.js");',
    'const e = require("./e.cjs");',
  ].join('\n');
  const collected = collectModuleSpecifiers(source, { sourceType: 'module' });
  assert.equal(collected.ok, true);
  const bySpecifier = new Map(collected.specifiers.map((entry) => [entry.specifier, entry]));
  assert.deepEqual([...bySpecifier.keys()], ['./a.js', './b.js', './c.js', './d.js', './e.cjs']);
  assert.equal(bySpecifier.get('./a.js').kind, 'import');
  assert.equal(bySpecifier.get('./b.js').kind, 'export');
  assert.equal(bySpecifier.get('./d.js').dynamic, true);
  assert.equal(bySpecifier.get('./e.cjs').kind, 'require');
});

test('collectModuleSpecifiers returns a diagnostic instead of throwing on bad syntax', () => {
  const collected = collectModuleSpecifiers('export function (', { sourceType: 'module' });
  assert.equal(collected.ok, false);
  assert.equal(collected.specifiers.length, 0);
  assert.equal(collected.diagnostic.code, 'parse_error');
});

test('extension helpers classify JavaScript, TypeScript and JSX', () => {
  assert.equal(extensionOf('src\\app.JS'), '.js');
  assert.equal(isJavaScriptPath('src/app.mjs'), true);
  assert.equal(isJavaScriptPath('src/app.ts'), false);
  assert.equal(isTypeScriptPath('src/app.mts'), true);
  assert.equal(isJsxPath('src/app.jsx'), true);
  assert.equal(isJsxPath('src/app.js'), false);
});

test('exclusions cover dependency, output and minified locations', () => {
  assert.deepEqual(exclusionFor('src/app.js'), { excluded: false });
  assert.equal(exclusionFor('node_modules/pkg/index.js').reason, 'excluded_directory');
  assert.equal(exclusionFor('dist/app.js').reason, 'excluded_directory');
  assert.equal(exclusionFor('src/app.min.js').reason, 'minified');
  assert.equal(isMinifiedPath('lib/app.bundle.mjs'), true);
  assert.ok(DEFAULT_EXCLUDED_SEGMENTS.includes('node_modules'));
});

test('generated-source detection is based on a bounded header read', () => {
  assert.equal(isGeneratedSource('// @generated\nconst a = 1;'), true);
  assert.equal(isGeneratedSource('// Code generated by tool. DO NOT EDIT.'), true);
  assert.equal(isGeneratedSource('const a = 1;'), false);
});

test('module kind follows extension first and package type second', () => {
  assert.equal(detectModuleKind({ path: 'a.mjs', packageType: 'commonjs' }), 'module');
  assert.equal(detectModuleKind({ path: 'a.cjs', packageType: 'module' }), 'script');
  assert.equal(detectModuleKind({ path: 'a.js', packageType: 'module' }), 'module');
  assert.equal(detectModuleKind({ path: 'a.js', packageType: 'commonjs' }), 'script');
  assert.equal(detectModuleKind({ path: 'a.js' }), 'script');
});
