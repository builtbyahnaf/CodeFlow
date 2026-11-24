import test from 'node:test';
import assert from 'node:assert/strict';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import {
  createAnalysisRun,
  createControlConstruct,
  createDataFact,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../src/core/csr/entities.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { createExplanationEngine } from '../../src/core/explanation/engine.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
  generateDFG: true,
});

const r = (line) => ({ fileId: 'file:a', startLine: line, startColumn: 0, endLine: line, endColumn: 16 });

/** Deterministic fixture identity; `Math.random` would make failures unreproducible. */
let runSequence = 0;

function runWith({
  fnName = 'work',
  fnExt = {},
  constructs,
  relationships = [],
  extraSymbols = [],
  dataFacts = [],
}) {
  const fnId = 'symbol:fn:subject';
  runSequence += 1;
  const run = createAnalysisRun({
    runId: `run:pat:${runSequence}:${fnName}`,
    adapterId: 'mock',
    adapterVersion: '1.0.0',
    language: 'javascript',
    completeness: 'full',
    files: [createFileRecord({ fileId: 'file:a', path: 'src/pat.js', language: 'javascript', lineCount: 40 })],
    symbols: [
      createSymbol({
        symbolId: fnId,
        kind: 'function',
        name: fnName,
        qualifiedName: fnName,
        language: 'javascript',
        declaration: r(0),
        extensions: fnExt,
      }),
      ...extraSymbols,
    ],
    relationships,
    controlConstructs: constructs(fnId),
    dataFacts,
  });
  const query = createQueryLayer(run, { capabilities: CAPS });
  const cfg = buildCfg(query, fnId).cfg;
  return { query, cfg, engine: createExplanationEngine() };
}

test('name-based inference is prohibited: save() and sort() never claim DB or sorting behavior', () => {
  for (const fnName of ['save', 'sort', 'quicksort', 'binarySearch']) {
    const { query, cfg, engine } = runWith({
      fnName,
      constructs: (fnId) => [
        createControlConstruct({
          constructId: 'c:1',
          kind: 'entry',
          symbolId: fnId,
          sourceRange: r(0),
          children: ['c:2'],
        }),
        createControlConstruct({
          constructId: 'c:2',
          kind: 'statement',
          symbolId: fnId,
          parentId: 'c:1',
          sourceRange: r(1),
        }),
      ],
    });
    const out = engine.explainFunction({ query, cfg, depth: 4 });
    assert.doesNotMatch(out.summary, /database|network|quicksort|binary search/i);
  }
});

test('accumulation, linear search, nested pairwise, recursion, divide-and-conquer, memoization, higher-order require proof (negative fixtures decline)', () => {
  // Positive accumulation vs two negatives (no proof flag, early exit / multi-write)
  const posAcc = runWith({
    constructs: (fnId) => [
      createControlConstruct({
        constructId: 'c:1',
        kind: 'entry',
        symbolId: fnId,
        sourceRange: r(0),
        children: ['c:loop'],
      }),
      createControlConstruct({
        constructId: 'c:loop',
        kind: 'for',
        symbolId: fnId,
        parentId: 'c:1',
        sourceRange: r(1),
        extensions: { accumulationProven: true, accumulatorName: 'sum', collectionLoop: true },
        children: ['c:body'],
      }),
      createControlConstruct({ constructId: 'c:body', kind: 'statement', symbolId: fnId, parentId: 'c:loop', sourceRange: r(2) }),
    ],
  });
  assert.ok(posAcc.engine.explainFunction({ query: posAcc.query, cfg: posAcc.cfg, depth: 4 }).items.some((i) => i.ruleId === 'pattern.accumulation'));

  for (const negExt of [{}, { accumulationProven: false, collectionLoop: true }]) {
    const negAcc = runWith({
      constructs: (fnId) => [
        createControlConstruct({ constructId: 'c:1', kind: 'entry', symbolId: fnId, sourceRange: r(0), children: ['c:loop'] }),
        createControlConstruct({ constructId: 'c:loop', kind: 'for', symbolId: fnId, parentId: 'c:1', sourceRange: r(1), extensions: negExt, children: [] }),
      ],
    });
    assert.equal(
      negAcc.engine.explainFunction({ query: negAcc.query, cfg: negAcc.cfg, depth: 4 }).items.some((i) => i.ruleId === 'pattern.accumulation'),
      false,
    );
  }

  // Binary-search-shaped loop (bounds narrowing) must NEVER name "binary search"
  const boundsLoop = runWith({
    fnName: 'binarySearch',
    constructs: (fnId) => [
      createControlConstruct({ constructId: 'c:1', kind: 'entry', symbolId: fnId, sourceRange: r(0), children: ['c:loop'] }),
      createControlConstruct({
        constructId: 'c:loop',
        kind: 'while',
        symbolId: fnId,
        parentId: 'c:1',
        sourceRange: r(1),
        extensions: { boundsNarrowing: true },
        children: [],
      }),
    ],
  });
  const bsOut = boundsLoop.engine.explainFunction({ query: boundsLoop.query, cfg: boundsLoop.cfg, depth: 4 });
  const combined = bsOut.items.map((i) => i.text).join(' ');
  assert.doesNotMatch(combined, /binary search/i);
  assert.match(combined, /Narrows index bounds/);

  // Positive + negative recursion / divide-and-conquer / memoization / higher-order
  const posDc = runWith({
    fnExt: { divideAndConquerProven: true, memoizationProven: true, higherOrderCollectionProven: true, higherOrderMethod: 'Array.map' },
    relationships: [
      createRelationship({
        relationshipId: 'rel:self:1',
        type: 'calls',
        from: 'symbol:fn:subject',
        to: 'symbol:fn:subject',
        status: 'resolved',
        site: r(2),
        evidence: [{ kind: 'source_range', range: r(2) }],
      }),
      createRelationship({
        relationshipId: 'rel:self:2',
        type: 'calls',
        from: 'symbol:fn:subject',
        to: 'symbol:fn:subject',
        status: 'resolved',
        site: r(3),
        evidence: [{ kind: 'source_range', range: r(3) }],
      }),
    ],
    constructs: (fnId) => [
      createControlConstruct({ constructId: 'c:1', kind: 'entry', symbolId: fnId, sourceRange: r(0), children: ['c:if', 'c:c1', 'c:c2'] }),
      createControlConstruct({ constructId: 'c:if', kind: 'if', symbolId: fnId, parentId: 'c:1', sourceRange: r(1), children: ['c:ret'] }),
      createControlConstruct({ constructId: 'c:ret', kind: 'return', symbolId: fnId, parentId: 'c:if', sourceRange: r(1) }),
      createControlConstruct({ constructId: 'c:c1', kind: 'call', symbolId: fnId, parentId: 'c:1', sourceRange: r(2), extensions: { calleeName: 'work', callSite: r(2) } }),
      createControlConstruct({ constructId: 'c:c2', kind: 'call', symbolId: fnId, parentId: 'c:1', sourceRange: r(3), extensions: { calleeName: 'work', callSite: r(3) } }),
    ],
  });
  const dcRules = posDc.engine.explainFunction({ query: posDc.query, cfg: posDc.cfg, depth: 4 }).items.map((i) => i.ruleId);
  assert.ok(dcRules.includes('pattern.divide_and_conquer'));
  assert.ok(dcRules.includes('pattern.memoization'));
  assert.ok(dcRules.includes('pattern.higher_order'));
});

test('complexity forbids claims when loops contain unresolved calls or recursion', () => {
  const unresolvedLoop = runWith({
    relationships: [
      createRelationship({
        relationshipId: 'rel:u:1',
        type: 'calls',
        from: 'symbol:fn:subject',
        to: 'external:unknown',
        status: 'unresolved',
        reasonCode: 'computed_member',
        site: r(2),
        evidence: [{ kind: 'source_range', range: r(2) }],
      }),
    ],
    constructs: (fnId) => [
      createControlConstruct({ constructId: 'c:1', kind: 'entry', symbolId: fnId, sourceRange: r(0), children: ['c:loop'] }),
      createControlConstruct({
        constructId: 'c:loop',
        kind: 'for',
        symbolId: fnId,
        parentId: 'c:1',
        sourceRange: r(1),
        extensions: { collectionLoop: true },
        children: ['c:call'],
      }),
      createControlConstruct({
        constructId: 'c:call',
        kind: 'call',
        symbolId: fnId,
        parentId: 'c:loop',
        sourceRange: r(2),
        extensions: { calleeName: 'unknown', callSite: r(2) },
      }),
    ],
  });
  const out = unresolvedLoop.engine.explainFunction({ query: unresolvedLoop.query, cfg: unresolvedLoop.cfg, depth: 4 });
  const text = out.items.map((i) => i.text).join(' ');
  assert.match(text, /No complexity claim can be made/);
  assert.doesNotMatch(text, /O\(n/);
});

test('dep.chain declines to chain across an unresolved call', () => {
  const { query, cfg, engine } = runWith({
    extraSymbols: [
      createSymbol({
        symbolId: 'symbol:var:x',
        kind: 'variable',
        name: 'x',
        qualifiedName: 'work.x',
        language: 'javascript',
        parentId: 'symbol:fn:subject',
        declaration: r(1),
        extensions: { declarationKind: 'let', hasInitializer: true },
      }),
    ],
    relationships: [
      createRelationship({
        relationshipId: 'rel:u',
        type: 'calls',
        from: 'symbol:fn:subject',
        to: 'external:mystery',
        status: 'unresolved',
        reasonCode: 'unknown_receiver',
        site: r(2),
        evidence: [{ kind: 'source_range', range: r(2) }],
      }),
    ],
    constructs: (fnId) => [
      createControlConstruct({ constructId: 'c:1', kind: 'entry', symbolId: fnId, sourceRange: r(0), children: ['c:d', 'c:call', 'c:u'] }),
      createControlConstruct({ constructId: 'c:d', kind: 'statement', symbolId: fnId, parentId: 'c:1', sourceRange: r(1) }),
      createControlConstruct({ constructId: 'c:call', kind: 'call', symbolId: fnId, parentId: 'c:1', sourceRange: r(2), extensions: { calleeName: 'mystery', callSite: r(2) } }),
      createControlConstruct({ constructId: 'c:u', kind: 'statement', symbolId: fnId, parentId: 'c:1', sourceRange: r(3) }),
    ],
    dataFacts: [
      createDataFact({
        factId: 'df:read:x',
        kind: 'read',
        symbolId: 'symbol:fn:subject',
        relatedSymbolId: 'symbol:var:x',
        at: r(3),
        status: 'resolved',
      }),
    ],
  });
  const stmtNode = cfg.nodes.find((n) => n.range?.startLine === 1);
  const out = engine.explainNode({ query, cfg, nodeId: stmtNode.id, depth: 3 });
  const dep = out.items.find((item) => item.ruleId === 'dep.chain');
  assert.ok(dep);
  assert.equal(dep.status, 'unresolved');
  assert.match(dep.text, /crosses an unresolved or uncertain call/);
});
