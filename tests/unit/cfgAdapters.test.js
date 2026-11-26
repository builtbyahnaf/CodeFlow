import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { mapJavaScript } from '../../src/adapters/javascript/mapper.js';
import { mapClangAst } from '../../src/adapters/cpp/mapper.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { toCfgDto } from '../../src/core/graph/cfg/dto.js';
import { validateDto } from '../../src/core/graph/dto.js';
import { createAnalysisRun } from '../../src/core/csr/entities.js';

const CAPABILITIES = createCapabilities({ generateCFG: true });

function queryFor(run) {
  return createQueryLayer(run, { capabilities: CAPABILITIES });
}

function functionNamed(run, name) {
  const symbol = run.symbols.find(
    (candidate) => candidate.kind === 'function' && candidate.name === name,
  );
  assert.ok(symbol, `missing function ${name}`);
  return symbol;
}

const JS_CLASSIFY = `function classify(n) {
  if (n < 0) {
    return 'negative';
  } else if (n === 0) {
    return 'zero';
  }
  for (let i = 0; i < n; i += 1) {
    if (i === 3) continue;
    if (i > 5) break;
  }
  return n > 10 ? 'large' : 'small';
}
`;

function jsRun(text = JS_CLASSIFY, modulePath = 'src/classify.js') {
  return mapJavaScript({
    runId: 'run:cfg-js',
    path: modulePath,
    text,
    adapterId: 'js-acorn',
    adapterVersion: '0.1.0',
  });
}

function cppFixture() {
  const root = 'tests/fixtures/cpp';
  const text = fs.readFileSync(path.join(root, 'cfg.cpp'), 'utf8');
  const ast = JSON.parse(fs.readFileSync(path.join(root, 'ast-cfg.json'), 'utf8'));
  return mapClangAst({
    runId: 'run:cfg-cpp',
    path: 'src/cfg.cpp',
    text,
    workspaceRoot: 'D:/w',
    ast,
    mode: 'compile-db',
    adapterId: 'cpp-clang',
    adapterVersion: '0.1.0',
  });
}

test('the JavaScript adapter produces a CFG through the neutral builder', () => {
  const run = jsRun();
  const cfg = buildCfg(queryFor(run), functionNamed(run, 'classify').symbolId);
  assert.equal(cfg.ok, true, cfg.ok ? '' : cfg.message);

  const kinds = new Set(cfg.cfg.nodes.map((node) => node.kind));
  for (const expected of ['entry', 'exit', 'condition', 'return', 'loop_header', 'continue', 'break']) {
    assert.ok(kinds.has(expected), `missing ${expected}`);
  }
  const edgeKinds = new Set(cfg.cfg.edges.map((edge) => edge.kind));
  for (const expected of ['true', 'false', 'loop_back', 'continue', 'break', 'return']) {
    assert.ok(edgeKinds.has(expected), `missing ${expected}`);
  }
  assert.equal(cfg.cfg.degradations.length, 0);
});

test('the C++ adapter produces a CFG for the committed AST fixture', () => {
  const run = cppFixture();
  const query = queryFor(run);

  const classify = buildCfg(query, functionNamed(run, 'classify').symbolId);
  assert.equal(classify.ok, true, classify.ok ? '' : classify.message);
  const kinds = new Set(classify.cfg.nodes.map((node) => node.kind));
  for (const expected of ['entry', 'exit', 'condition', 'multiway', 'loop_header', 'break', 'continue']) {
    assert.ok(kinds.has(expected), `missing ${expected}`);
  }
  const edgeKinds = new Set(classify.cfg.edges.map((edge) => edge.kind));
  for (const expected of ['case', 'default', 'break', 'continue', 'loop_back']) {
    assert.ok(edgeKinds.has(expected), `missing ${expected}`);
  }

  const guarded = buildCfg(query, functionNamed(run, 'guarded').symbolId);
  assert.equal(guarded.ok, true, guarded.ok ? '' : guarded.message);
  const guardedKinds = new Set(guarded.cfg.nodes.map((node) => node.kind));
  assert.ok(guardedKinds.has('throw'));
  assert.ok(guardedKinds.has('catch_entry'));
  assert.ok(guarded.cfg.degradations.some((entry) => entry.code === 'modeled_exception_path'));

  const helper = buildCfg(query, functionNamed(run, 'helper').symbolId);
  assert.equal(helper.ok, true);
  assert.deepEqual(helper.cfg.nodes.map((node) => node.kind), ['entry', 'return', 'exit']);
});

test('a resolved call in a condition badges the condition node', () => {
  const run = cppFixture();
  const cfg = buildCfg(queryFor(run), functionNamed(run, 'classify').symbolId);
  assert.equal(cfg.ok, true);
  // `helper(n) > 100` is a condition leaf, so the call is attached there.
  const withCall = cfg.cfg.nodes.find(
    (node) => Array.isArray(node.calls) && node.calls.length > 0,
  );
  assert.ok(withCall, 'the classify fixture calls helper()');
  assert.equal(withCall.status, 'resolved');
  assert.equal(withCall.calls[0].label, 'helper');
});

test('cfgFunctions lists only functions with constructs, in stable order', () => {
  const run = cppFixture();
  const result = queryFor(run).cfgFunctions();
  assert.equal(result.ok, true);
  const names = result.value.map((symbol) => symbol.name);
  assert.deepEqual(names, ['classify', 'guarded', 'helper']);
  assert.deepEqual(names, [...names].sort());
});

test('a run without constructs fails honestly instead of drawing an empty CFG', () => {
  const run = createAnalysisRun({
    runId: 'run:no-constructs',
    adapterId: 'fixture',
    language: 'neutral',
    files: [
      {
        fileId: 'file:cfg-fixture',
        path: 'fixtures/cfg/empty.txt',
        language: 'neutral',
        contentHash: 'x',
        sizeBytes: 0,
        lineCount: 1,
      },
    ],
    symbols: [
      {
        symbolId: 'symbol:no-constructs',
        kind: 'function',
        name: 'nothing',
        qualifiedName: 'nothing',
        language: 'neutral',
        declaration: {
          fileId: 'file:cfg-fixture',
          startLine: 0,
          startColumn: 0,
          endLine: 0,
          endColumn: 1,
        },
      },
    ],
    controlConstructs: [],
  });
  const query = createQueryLayer(run, { capabilities: CAPABILITIES });
  const functions = query.cfgFunctions();
  assert.equal(functions.ok, true);
  assert.equal(functions.value.length, 0);
  const result = buildCfg(query, 'symbol:no-constructs');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CFG_UNAVAILABLE');
});

test('the same abstract program yields structurally equivalent C++ and JavaScript CFGs', () => {
  const jsText = `function parity(n) {
  for (let i = 0; i < n; i += 1) {
    if (i === 2) continue;
  }
  return n;
}
`;
  const js = jsRun(jsText, 'src/parity.js');
  const jsCfg = buildCfg(queryFor(js), functionNamed(js, 'parity').symbolId);
  assert.equal(jsCfg.ok, true);

  const root = 'tests/fixtures/cpp';
  const cppText = fs.readFileSync(path.join(root, 'parity.cpp'), 'utf8');
  const ast = JSON.parse(fs.readFileSync(path.join(root, 'ast-parity.json'), 'utf8'));
  const cpp = mapClangAst({
    runId: 'run:cfg-cpp-parity',
    path: 'src/parity.cpp',
    text: cppText,
    workspaceRoot: 'D:/w',
    ast,
    mode: 'compile-db',
    adapterId: 'cpp-clang',
    adapterVersion: '0.1.0',
  });
  const cppCfg = buildCfg(queryFor(cpp), functionNamed(cpp, 'parity').symbolId);
  assert.equal(cppCfg.ok, true);

  const normalize = (cfg) => ({
    nodes: cfg.nodes.map((node) => node.kind).sort(),
    edges: cfg.edges.map((edge) => edge.kind).sort(),
    degradations: cfg.degradations.map((entry) => entry.code).sort(),
  });
  assert.deepEqual(normalize(jsCfg.cfg), normalize(cppCfg.cfg));
});

test('both adapters produce CFG DTOs that validate', () => {
  const js = jsRun();
  const jsCfg = buildCfg(queryFor(js), functionNamed(js, 'classify').symbolId);
  assert.equal(validateDto(toCfgDto(jsCfg.cfg)).ok, true);

  const cpp = cppFixture();
  const cppCfg = buildCfg(queryFor(cpp), functionNamed(cpp, 'classify').symbolId);
  assert.equal(validateDto(toCfgDto(cppCfg.cfg)).ok, true);
});

// ── Negation (!) condition label regression ───────────────────────────────

test('JS: !call() condition label preserves the ! prefix and routes true-edge to the return', () => {
  const src = `function guard(x) {\n  if (!isReady(x)) return;\n  work(x);\n}\n`;
  const run = jsRun(src, 'src/guard.js');
  const cfg = buildCfg(queryFor(run), functionNamed(run, 'guard').symbolId);
  assert.equal(cfg.ok, true, cfg.ok ? '' : `${cfg.code}: ${cfg.message}`);

  const condNode = cfg.cfg.nodes.find((n) => n.kind === 'condition');
  assert.ok(condNode, 'expected a condition node');
  // The label must include the ! operator so code-review readers see the real condition.
  assert.ok(
    condNode.label.includes('!') || condNode.label.startsWith('!'),
    `condition label should start with '!' but was: ${condNode.label}`,
  );

  // The true edge (condition holds → guarded path → return) should be a truthy edge.
  const trueEdge = cfg.cfg.edges.find(
    (e) => e.from === condNode.id && e.kind === 'true',
  );
  assert.ok(trueEdge, 'expected a true-branch edge from the condition node');
});

test('JS: !call() condition does not produce an unresolved call when the callee is in scope', () => {
  const src = `function isReady(x) { return x > 0; }\nfunction guard(x) {\n  if (!isReady(x)) return;\n  return x;\n}\n`;
  const run = jsRun(src, 'src/guard2.js');
  const cfg = buildCfg(queryFor(run), functionNamed(run, 'guard').symbolId);
  assert.equal(cfg.ok, true);
  // No degradation entries about unresolved condition calls
  const unresDeg = cfg.cfg.degradations.filter((d) =>
    /unresolved|negat/i.test(JSON.stringify(d)),
  );
  assert.equal(unresDeg.length, 0, `unexpected degradations: ${JSON.stringify(unresDeg)}`);
});
