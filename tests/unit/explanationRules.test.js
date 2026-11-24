import test from 'node:test';
import assert from 'node:assert/strict';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { createAnalysisRun, createControlConstruct, createFileRecord, createRelationship, createSymbol, createDataFact } from '../../src/core/csr/entities.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { createExplanationEngine } from '../../src/core/explanation/engine.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
  generateDFG: true,
});

const r = (line, startColumn = 0, endColumn = 20) => ({
  fileId: 'file:a',
  startLine: line,
  startColumn,
  endLine: line,
  endColumn,
});

function buildFixtureRun({
  completeness = 'full',
  callStatus = 'resolved',
  literalBound = 10,
  literalStep = 1,
  earlyExit = false,
  constructExtensions = {},
  dataFacts = [],
  includeVariable = false,
} = {}) {
  const fnId = 'symbol:fn:demo';
  const calleeId = callStatus === 'resolved' ? 'symbol:fn:helper' : 'external:dyn';
  const constructs = [
    createControlConstruct({
      constructId: 'c:entry',
      kind: 'entry',
      symbolId: fnId,
      sourceRange: r(0),
      children: ['c:for', 'c:ret'],
    }),
    createControlConstruct({
      constructId: 'c:for',
      kind: 'for',
      symbolId: fnId,
      parentId: 'c:entry',
      sourceRange: r(2),
      condition: r(2, 14, 22),
      children: earlyExit ? ['c:if_break', 'c:call'] : ['c:call'],
      extensions: {
        hasInit: true,
        hasCondition: true,
        hasUpdate: true,
        initRange: r(2, 5, 12),
        updateRange: r(2, 24, 29),
        initializerText: 'i = 0',
        boundText: `i < ${literalBound ?? 'n'}`,
        stepText: 'i += 1',
        ...(literalBound !== null ? { literalBound } : {}),
        ...(literalStep !== null ? { literalStep } : {}),
        ...constructExtensions,
      },
    }),
    ...(earlyExit
      ? [
          createControlConstruct({
            constructId: 'c:if_break',
            kind: 'if',
            symbolId: fnId,
            parentId: 'c:for',
            sourceRange: r(3),
            condition: r(3, 4, 10),
            children: ['c:break'],
          }),
          createControlConstruct({
            constructId: 'c:break',
            kind: 'break',
            symbolId: fnId,
            parentId: 'c:if_break',
            sourceRange: r(4),
          }),
        ]
      : []),
    createControlConstruct({
      constructId: 'c:call',
      kind: 'call',
      symbolId: fnId,
      parentId: 'c:for',
      sourceRange: r(5),
      extensions: { calleeName: 'helper', callSite: r(5, 4, 10) },
    }),
    createControlConstruct({
      constructId: 'c:ret',
      kind: 'return',
      symbolId: fnId,
      parentId: 'c:entry',
      sourceRange: r(7),
      extensions: { valueRange: r(7, 9, 14), valueText: 'total' },
    }),
  ];

  const symbols = [
    createSymbol({
      symbolId: fnId,
      kind: 'function',
      name: 'demo',
      qualifiedName: 'demo',
      language: 'javascript',
      declaration: r(0),
    }),
    createSymbol({
      symbolId: 'symbol:param:n',
      kind: 'parameter',
      name: 'n',
      qualifiedName: 'demo.n',
      language: 'javascript',
      parentId: fnId,
      declaration: r(0, 14, 15),
    }),
    createSymbol({
      symbolId: 'symbol:fn:helper',
      kind: 'function',
      name: 'helper',
      qualifiedName: 'helper',
      language: 'javascript',
      declaration: r(12),
    }),
    ...(includeVariable
      ? [
          createSymbol({
            symbolId: 'symbol:var:total',
            kind: 'variable',
            name: 'total',
            qualifiedName: 'demo.total',
            language: 'javascript',
            parentId: fnId,
            declaration: r(5),
            extensions: { declarationKind: 'let', hasInitializer: true, shadowed: true },
          }),
        ]
      : []),
  ];

  const run = createAnalysisRun({
    // The variant is part of the run id so a reused engine cannot serve facts
    // from a different fixture shape under the same run identity.
    runId: `run:rules:${completeness}:${callStatus}:${String(literalBound)}:${String(literalStep)}:${earlyExit}`,
    adapterId: 'mock',
    adapterVersion: '1.0.0',
    language: 'javascript',
    completeness,
    files: [createFileRecord({ fileId: 'file:a', path: 'src/demo.js', language: 'javascript', lineCount: 20 })],
    symbols,
    relationships: [
      createRelationship({
        relationshipId: 'rel:call:1',
        type: 'calls',
        from: fnId,
        to: calleeId,
        status: callStatus,
        ...(callStatus !== 'resolved' ? { reasonCode: 'unknown_receiver' } : {}),
        site: r(5, 4, 10),
        evidence: [{ kind: 'source_range', range: r(5, 4, 10) }],
      }),
    ],
    controlConstructs: constructs,
    dataFacts,
  });

  const query = createQueryLayer(run, { capabilities: CAPS });
  const cfg = buildCfg(query, fnId).cfg;
  return { query, cfg };
}

test('depths 1..4 produce materially richer explanations and depth 4 discloses partial limits', () => {
  const engine = createExplanationEngine();
  const { query, cfg } = buildFixtureRun({ completeness: 'partial', callStatus: 'unresolved' });

  const d1 = engine.explainFunction({ query, cfg, depth: 1 });
  const d2 = engine.explainFunction({ query, cfg, depth: 2 });
  const d3 = engine.explainFunction({ query, cfg, depth: 3 });
  const d4 = engine.explainFunction({ query, cfg, depth: 4 });

  assert.equal(d1.ok, true);
  assert.match(d1.summary, /takes 1 parameter/);
  assert.ok(d2.summary.length > d1.summary.length);
  assert.match(d2.summary, /unresolved/);
  assert.ok(d3.summary.length >= d2.summary.length);
  assert.ok(d4.limitations.length >= 1, 'depth 4 must disclose limitations on partial/unresolved runs');
  assert.match(d4.limitations[0], /What this analysis cannot establish/);
});

test('"iterates N times" only appears with literal bound, literal step, and no early exit', () => {
  const engine = createExplanationEngine();
  const exact = buildFixtureRun({ literalBound: 10, literalStep: 1, earlyExit: false });
  const exactHeader = exact.cfg.nodes.find((n) => n.kind === 'loop_header');
  const exactOut = engine.explainNode({ query: exact.query, cfg: exact.cfg, nodeId: exactHeader.id, depth: 2 });
  assert.match(exactOut.summary, /iterates 10 times/);

  const withBreak = buildFixtureRun({ literalBound: 10, literalStep: 1, earlyExit: true });
  const breakHeader = withBreak.cfg.nodes.find((n) => n.kind === 'loop_header');
  const breakOut = engine.explainNode({ query: withBreak.query, cfg: withBreak.cfg, nodeId: breakHeader.id, depth: 2 });
  assert.doesNotMatch(breakOut.summary, /iterates 10 times/);
  assert.match(breakOut.summary, /explicit `break`, `return`, or `throw`/);

  const nonLiteral = buildFixtureRun({ literalBound: null, literalStep: 1, earlyExit: false });
  const nonLitHeader = nonLiteral.cfg.nodes.find((n) => n.kind === 'loop_header');
  const nonLitOut = engine.explainNode({ query: nonLiteral.query, cfg: nonLiteral.cfg, nodeId: nonLitHeader.id, depth: 2 });
  assert.doesNotMatch(nonLitOut.summary, /iterates \d+ times/);
});

test('variable, shadowing, reassignment, and def-use rules fire cleanly with evidence', () => {
  const engine = createExplanationEngine();
  const { query, cfg } = buildFixtureRun({
    includeVariable: true,
    dataFacts: [
      createDataFact({
        factId: 'df:1',
        kind: 'read',
        symbolId: 'symbol:fn:demo',
        relatedSymbolId: 'symbol:var:total',
        at: r(7),
        status: 'resolved',
      }),
      createDataFact({
        factId: 'df:2',
        kind: 'write',
        symbolId: 'symbol:fn:demo',
        relatedSymbolId: 'symbol:var:total',
        at: r(6),
        status: 'resolved',
      }),
    ],
  });
  const callNode = cfg.nodes.find((n) => n.kind === 'call');
  const out = engine.explainNode({ query, cfg, nodeId: callNode.id, depth: 3 });
  const ruleIds = out.items.map((item) => item.ruleId);
  assert.ok(ruleIds.includes('var.declare'));
  assert.ok(ruleIds.includes('var.reassign'));
  assert.ok(ruleIds.includes('var.shadowed'));
  assert.ok(ruleIds.includes('dep.def_use'));
  for (const item of out.items) {
    assert.ok(item.evidence.length >= 1);
  }
});

test('stale explanations qualify all statements as based on source before the last edit', () => {
  const engine = createExplanationEngine();
  const { query, cfg } = buildFixtureRun();
  const out = engine.explainFunction({ query, cfg, depth: 4, stale: true });
  assert.ok(out.items.every((item) => item.status === 'stale'));
  assert.ok(out.items.every((item) => item.claim === 'qualified'));
  assert.match(out.summary, /before the last edit/);
});

test('stale status never silently drops a rule that fired on fresh source', () => {
  const engine = createExplanationEngine();
  const dataFacts = [
    createDataFact({
      factId: 'df:1',
      kind: 'read',
      symbolId: 'symbol:fn:demo',
      relatedSymbolId: 'symbol:var:total',
      at: r(7),
      status: 'resolved',
    }),
    createDataFact({
      factId: 'df:2',
      kind: 'write',
      symbolId: 'symbol:fn:demo',
      relatedSymbolId: 'symbol:var:total',
      at: r(5),
      status: 'resolved',
    }),
  ];
  const { query, cfg } = buildFixtureRun({ includeVariable: true, dataFacts });
  const fresh = engine.explainFunction({ query, cfg, depth: 4 });
  const stale = engine.explainFunction({ query, cfg, depth: 4, stale: true });

  assert.equal(stale.diagnostics.lintViolations.length, 0);
  const freshRules = new Set(fresh.items.map((item) => item.ruleId));
  const staleRules = new Set(stale.items.map((item) => item.ruleId));
  for (const ruleId of freshRules) {
    assert.ok(staleRules.has(ruleId), `stale output lost ${ruleId}`);
  }
  for (const item of stale.items) {
    assert.match(item.text, /before the last edit/);
  }
});
