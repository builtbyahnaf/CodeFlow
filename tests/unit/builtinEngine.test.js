import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCppSource } from '../../src/adapters/cpp/builtinEngine.js';

test('parseCppSource extracts functions from basic source text', () => {
  const code = 'int add(int a, int b) { return a + b; }';
  const run = parseCppSource({ runId: 'run:1', path: 'src/calc.cpp', text: code });
  const fn = run.symbols.find((s) => s.name === 'add');
  assert.ok(fn);
  assert.equal(fn.kind, 'function');
  assert.equal(fn.qualifiedName, 'add');
});

test('parseCppSource handles multiple functions and preserves order', () => {
  const code = `
int square(int x) { return x * x; }
int cube(int x) { return x * square(x); }
`;
  const run = parseCppSource({ runId: 'run:2', path: 'src/math.cpp', text: code });
  const names = run.symbols.filter((s) => s.kind === 'function').map((s) => s.name);
  assert.deepEqual(names, ['square', 'cube']);
});

test('parseCppSource extracts if and if-else control constructs', () => {
  const code = `
int clamp(int v, int lo, int hi) {
  if (v < lo) {
    return lo;
  }
  return hi;
}
`;
  const run = parseCppSource({ runId: 'run:3', path: 'src/clamp.cpp', text: code });
  const ifConstruct = run.controlConstructs.find((cc) => cc.kind === 'if');
  assert.ok(ifConstruct);
  assert.ok(ifConstruct.condition);
});

test('parseCppSource extracts while loop constructs with condition ranges', () => {
  const code = `
void countdown(int n) {
  while (n > 0) {
    n = n - 1;
  }
}
`;
  const run = parseCppSource({ runId: 'run:4', path: 'src/loop.cpp', text: code });
  const whileCc = run.controlConstructs.find((cc) => cc.kind === 'while');
  assert.ok(whileCc);
  assert.ok(whileCc.condition);
});

test('parseCppSource extracts for loop constructs with iteration metadata', () => {
  const code = `
int sum(int n) {
  int total = 0;
  for (int i = 0; i < n; ++i) {
    total += i;
  }
  return total;
}
`;
  const run = parseCppSource({ runId: 'run:5', path: 'src/for.cpp', text: code });
  const forCc = run.controlConstructs.find((cc) => cc.kind === 'for');
  assert.ok(forCc);
  assert.equal(forCc.extensions?.hasInit, true);
  assert.equal(forCc.extensions?.hasCondition, true);
});

test('parseCppSource extracts switch, case, and default branches', () => {
  const code = `
int eval(int op) {
  switch (op) {
    case 1: return 10;
    case 2: return 20;
    default: return -1;
  }
}
`;
  const run = parseCppSource({ runId: 'run:6', path: 'src/switch.cpp', text: code });
  const kinds = run.controlConstructs.map((cc) => cc.kind);
  assert.ok(kinds.includes('switch'));
  assert.ok(kinds.includes('case'));
  assert.ok(kinds.includes('default'));
});

test('parseCppSource extracts return, break, and continue jump statements', () => {
  const code = `
void search() {
  while (true) {
    if (false) continue;
    break;
  }
  return;
}
`;
  const run = parseCppSource({ runId: 'run:7', path: 'src/jumps.cpp', text: code });
  const kinds = run.controlConstructs.map((cc) => cc.kind);
  assert.ok(kinds.includes('break'));
  assert.ok(kinds.includes('continue'));
  assert.ok(kinds.includes('return'));
});

test('parseCppSource resolves intra-file function call relationships', () => {
  const code = `
int helper() { return 42; }
int caller() { return helper(); }
`;
  const run = parseCppSource({ runId: 'run:8', path: 'src/calls.cpp', text: code });
  const helperFn = run.symbols.find((s) => s.name === 'helper');
  const rel = run.relationships.find((r) => r.type === 'calls');
  assert.ok(rel);
  assert.equal(rel.to, helperFn.symbolId);
  assert.equal(rel.status, 'resolved');
});

test('parseCppSource marks external and library calls as out_of_scope', () => {
  const code = `
void doPrint() { printf("hello\n"); }
`;
  const run = parseCppSource({ runId: 'run:9', path: 'src/ext.cpp', text: code });
  const rel = run.relationships.find((r) => r.type === 'calls');
  assert.ok(rel);
  assert.equal(rel.status, 'unresolved');
  assert.equal(rel.reasonCode, 'out_of_scope');
});

test('parseCppSource ignores keywords inside comments and strings', () => {
  const code = `
// if (x) while (y) for (z)
/* switch (a) case 1: break; */
void run() {
  const char* str = "if (true) return 0;";
  int x = 1;
}
`;
  const run = parseCppSource({ runId: 'run:10', path: 'src/comments.cpp', text: code });
  const ccs = run.controlConstructs.filter((cc) => cc.kind === 'if' || cc.kind === 'while');
  assert.equal(ccs.length, 0);
});

test('comments never merge following statements or hide a conditional', () => {
  const code = `
int classify(int x) {
  int y = 1; // trailing ; if (fake) { } else { }
  // branch on the sign
  if (x > 0) { // positive
    y = 2;
  }
  /* block
     comment between branches */
  else {
    y = 3;
  }
  // done
  int z = y * 2;
  return z;
}
`;
  const run = parseCppSource({ runId: 'run:comments-flow', path: 'src/comments.cpp', text: code });
  const fn = run.symbols.find((symbol) => symbol.name === 'classify' && symbol.kind === 'function');
  assert.ok(fn);
  const constructs = run.controlConstructs.filter((cc) => cc.symbolId === fn.symbolId);
  const kinds = constructs.map((cc) => cc.kind);
  assert.ok(kinds.includes('if'), 'the if after a comment must stay a conditional');
  assert.ok(kinds.includes('else'), 'the else after a block comment must stay attached');

  const ifConstruct = constructs.find((cc) => cc.kind === 'if');
  assert.equal(ifConstruct.extensions?.label, 'x > 0');

  const labels = constructs.map((cc) => cc.extensions?.label).filter(Boolean);
  assert.ok(labels.includes('int y = 1;'));
  assert.ok(labels.includes('int z = y * 2;'));
  for (const label of labels) {
    assert.ok(!label.includes('//'), `line comment leaked into "${label}"`);
    assert.ok(!label.includes('/*'), `block comment leaked into "${label}"`);
  }
});

test('comments between a condition and its block do not merge the branch body', () => {
  const code = `
int pick(int x) {
  if (/* positive */ x > 0) // then
  {
    return 1;
  }
  // otherwise
  return 0;
}
`;
  const run = parseCppSource({ runId: 'run:comments-branch', path: 'src/branch.cpp', text: code });
  const fn = run.symbols.find((symbol) => symbol.name === 'pick' && symbol.kind === 'function');
  assert.ok(fn);
  const constructs = run.controlConstructs.filter((cc) => cc.symbolId === fn.symbolId);
  const ifConstruct = constructs.find((cc) => cc.kind === 'if');
  assert.ok(ifConstruct);
  assert.equal(ifConstruct.extensions?.label, 'x > 0');
  assert.ok(constructs.some((cc) => cc.kind === 'return' && cc.extensions?.label === 'return 1'));
  assert.ok(constructs.some((cc) => cc.kind === 'return' && cc.extensions?.label === 'return 0'));
});

import { validateAnalysisRun } from '../../src/core/csr/entities.js';

test('built-in engine run passes strict CSR validation', () => {
  const code = `
#include <iostream>
int factorial(int n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}
`;
  const run = parseCppSource({ runId: 'run:11', path: 'src/fact.cpp', text: code });
  const validation = validateAnalysisRun(run, { mode: 'strict' });
  assert.equal(validation.issues.length, 0);
});

import { cppAdapter } from '../../src/adapters/cpp/index.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { toCfgDto } from '../../src/core/graph/cfg/dto.js';
import { createQueryLayer } from '../../src/core/csr/query.js';

test('built-in engine run integrates with CFG query layer and toCfgDto', () => {
  const code = `
int compute(int x) {
  if (x > 0) return x;
  return -x;
}
`;
  const run = parseCppSource({ runId: 'run:12', path: 'src/comp.cpp', text: code });
  const query = createQueryLayer(run, { capabilities: cppAdapter.capabilities });
  const fn = run.symbols.find((s) => s.name === 'compute');
  assert.ok(fn);
  const cfgRes = buildCfg(query, fn.symbolId);
  assert.ok(cfgRes.cfg);
  assert.ok(cfgRes.cfg.nodes.length >= 2);
  const dto = toCfgDto(cfgRes.cfg);
  assert.ok(dto.nodes.length >= 2);
});

import { resolveLanguage } from '../../src/webview/highlight.js';

test('parseCppSource extracts parameters, return type, call data flow, and branched CFG', () => {
  const code = `
int getData() {
  return 42;
}

int MyClass::process(int limit, const char* tag) {
  int a = getData();
  if (a < limit) {
    return a;
  } else if (a > 100) {
    return 100;
  } else {
    return limit;
  }
}
`;
  const run = parseCppSource({ runId: 'run:13', path: 'src/review.cpp', text: code });
  const proc = run.symbols.find((s) => s.qualifiedName === 'MyClass::process');
  assert.ok(proc, 'qualified class method should be extracted');
  assert.equal(proc.extensions?.returnType, 'int');
  assert.equal(proc.extensions?.parameters?.length, 2);
  assert.equal(proc.extensions?.parameters?.[0]?.name, 'limit');

  const query = createQueryLayer(run, { capabilities: cppAdapter.capabilities });
  const cfgRes = buildCfg(query, proc.symbolId);
  assert.equal(cfgRes.ok, true);
  const cfg = cfgRes.cfg;

  // Verify condition labels and branching edges (true + false)
  const condNodes = cfg.nodes.filter((n) => n.kind === 'condition');
  assert.ok(condNodes.some((n) => n.label === 'a < limit'));
  assert.ok(condNodes.some((n) => n.label === 'a > 100'));
  assert.ok(cfg.edges.some((e) => e.kind === 'true'));
  assert.ok(cfg.edges.some((e) => e.kind === 'false'));

  // Verify call assignment tracking (a = getData())
  assert.equal(cfg.function.dataFlows.length, 1);
  assert.equal(cfg.function.dataFlows[0].target, 'a');
  assert.equal(cfg.function.dataFlows[0].sourceCall, 'getData');
  assert.deepEqual(cfg.function.returns, ['a', '100', 'limit']);

  const dto = toCfgDto(cfg);
  assert.ok(dto.function.signature.includes('MyClass::process'));
  assert.equal(dto.function.parameters.length, 2);

  // Verify true branch is positioned to the left of false branch at split layers
  const firstCond = condNodes.find((n) => n.label === 'a < limit');
  const firstTrueEdge = cfg.edges.find((e) => e.from === firstCond.id && e.kind === 'true');
  const firstFalseEdge = cfg.edges.find((e) => e.from === firstCond.id && e.kind === 'false');
  const trueNode = dto.nodes.find((n) => n.id === firstTrueEdge.to);
  const falseNode = dto.nodes.find((n) => n.id === firstFalseEdge.to);
  assert.ok(trueNode && falseNode);
  if (trueNode.position.layer === falseNode.position.layer) {
    assert.ok(trueNode.position.x < falseNode.position.x, 'true branch should be left of false branch');
  }
});

test('resolveLanguage identifies language from fileId paths and extensions', () => {
  assert.equal(resolveLanguage('file:src/test.cpp').language, 'cpp');
  assert.equal(resolveLanguage('src/header.hpp').language, 'cpp');
  assert.equal(resolveLanguage('file:///d:/app/index.js').language, 'javascript');
  assert.equal(resolveLanguage('Main.java').language, 'java');
  assert.equal(resolveLanguage('script.py').language, 'python');
  assert.equal(resolveLanguage('cpp').language, 'cpp');
});

test('parseCppSource converts absolute Windows paths to workspace-relative CSR paths', () => {
  const run = parseCppSource({
    runId: 'run:relpath',
    path: 'd:\\project\\src\\sample.cpp',
    workspaceRoot: 'D:\\project',
    text: 'int add(int a, int b) { return a + b; }',
  });
  assert.equal(run.files[0].path, 'src/sample.cpp');
  const validation = validateAnalysisRun(run, { mode: 'strict' });
  assert.equal(validation.issues.length, 0);
});
