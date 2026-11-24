import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import {
  createAnalysisRun,
  createControlConstruct,
  createFileRecord,
  createSymbol,
} from '../../src/core/csr/entities.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { createExplanationEngine } from '../../src/core/explanation/engine.js';
import { lintExplanationText } from '../../src/core/explanation/phrasing.js';
import { RULE_GROUPS } from '../../src/core/explanation/rules/catalog.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
  generateDFG: true,
});

const CORPUS = `
function classify(n) {
  if (n < 0) {
    return -1;
  } else if (n === 0) {
    return 0;
  }
  let sum = 0;
  for (let i = 0; i < n; i += 1) {
    if (i === 5) break;
    sum += i;
  }
  return sum;
}
function loopWhile(items) {
  let i = 0;
  while (i < items.length) {
    i += 1;
  }
  switch (i) {
    case 0: return 'none';
    default: return 'some';
  }
}
async function fetchFlow(fn) {
  try {
    const v = await fn();
    return v ?? 'fallback';
  } catch (err) {
    throw err;
  }
}
`;

test('every node across 30+ fixture nodes produces non-empty evidence and passes prohibited-language linting', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:corpus',
    path: 'src/corpus.js',
    text: CORPUS,
  });
  const query = createQueryLayer(run, { capabilities: CAPS });
  const engine = createExplanationEngine();

  let totalNodes = 0;
  for (const fn of query.cfgFunctions().value) {
    const cfg = buildCfg(query, fn.symbolId).cfg;
    for (const depth of [1, 2, 3, 4]) {
      const fnOut = engine.explainFunction({ query, cfg, depth });
      assert.equal(fnOut.ok, true);
      for (const item of fnOut.items) {
        assert.ok(item.evidence.length >= 1, `${item.id} missing evidence`);
        assert.equal(lintExplanationText(item.text, { status: item.status }).ok, true, item.text);
      }
    }
    for (const node of cfg.nodes) {
      totalNodes += 1;
      const nodeOut = engine.explainNode({ query, cfg, nodeId: node.id, depth: 4 });
      assert.equal(nodeOut.ok, true);
      assert.ok(nodeOut.items.length >= 1, `node ${node.kind} ${node.id} produced zero items`);
      for (const item of nodeOut.items) {
        assert.ok(item.evidence.length >= 1);
        assert.equal(lintExplanationText(item.text, { status: item.status }).ok, true, item.text);
      }
    }
  }
  assert.ok(totalNodes >= 30, `expected >= 30 fixture nodes, checked ${totalNodes}`);
});

test('engine is deterministic across invocations and isolates throwing rules', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:det',
    path: 'src/det.js',
    text: 'function f(a) { if (a > 0) return a; return 0; }\n',
  });
  const query = createQueryLayer(run, { capabilities: CAPS });
  const cfg = buildCfg(query, query.cfgFunctions().value[0].symbolId).cfg;

  const first = createExplanationEngine().explainFunction({ query, cfg, depth: 4 });
  const second = createExplanationEngine().explainFunction({ query, cfg, depth: 4 });
  assert.deepEqual(first.items, second.items);

  const faultyEngine = createExplanationEngine({
    ruleGroups: [
      {
        id: 'group.exploding',
        subject: 'both',
        minDepth: 1,
        proofObligation: 'test fault',
        run() {
          throw new Error('boom');
        },
      },
      ...RULE_GROUPS,
    ],
  });
  const survived = faultyEngine.explainFunction({ query, cfg, depth: 2 });
  assert.equal(survived.ok, true);
  assert.equal(survived.diagnostics.ruleErrors.length, 1);
  assert.ok(survived.items.length >= 1);
});

test('depth-4 explanation stays well under 50 ms on a 500-node CFG', () => {
  const fnId = 'symbol:fn:big';
  const r = (line) => ({ fileId: 'file:big', startLine: line, startColumn: 0, endLine: line, endColumn: 10 });
  const stmtIds = Array.from({ length: 498 }, (_, i) => `c:s${i}`);
  const constructs = [
    createControlConstruct({
      constructId: 'c:entry',
      kind: 'entry',
      symbolId: fnId,
      sourceRange: r(0),
      children: stmtIds,
    }),
    ...stmtIds.map((id, i) =>
      createControlConstruct({
        constructId: id,
        kind: 'statement',
        symbolId: fnId,
        parentId: 'c:entry',
        sourceRange: r(i + 1),
      }),
    ),
  ];
  const run = createAnalysisRun({
    runId: 'run:500',
    adapterId: 'mock',
    adapterVersion: '1.0.0',
    language: 'javascript',
    completeness: 'full',
    files: [createFileRecord({ fileId: 'file:big', path: 'src/big.js', language: 'javascript', lineCount: 600 })],
    symbols: [
      createSymbol({
        symbolId: fnId,
        kind: 'function',
        name: 'big',
        qualifiedName: 'big',
        language: 'javascript',
        declaration: r(0),
      }),
    ],
    controlConstructs: constructs,
  });
  const query = createQueryLayer(run, { capabilities: CAPS });
  const cfg = buildCfg(query, fnId).cfg;
  assert.equal(cfg.nodes.length, 500);

  const engine = createExplanationEngine();
  const targetNode = cfg.nodes[250];
  const t0 = performance.now();
  const fnRes = engine.explainFunction({ query, cfg, depth: 4 });
  const nodeRes = engine.explainNode({ query, cfg, nodeId: targetNode.id, depth: 4 });
  const elapsedMs = performance.now() - t0;

  assert.equal(fnRes.ok, true);
  assert.equal(nodeRes.ok, true);
  assert.ok(elapsedMs < 50, `expected < 50 ms on 500-node CFG, got ${elapsedMs.toFixed(2)} ms`);
});
