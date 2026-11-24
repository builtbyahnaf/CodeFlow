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

import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
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
