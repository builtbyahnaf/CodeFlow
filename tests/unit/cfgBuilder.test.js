import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCfg, checkInvariants } from '../../src/core/graph/cfg/builder.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { mapJavaScript } from '../../src/adapters/javascript/mapper.js';
import {
  FIXTURE_CALLEE_ID,
  FIXTURE_SYMBOL_ID,
  buildProgram,
  range,
} from '../fixtures/cfg/harness.js';

const entry = (children) => ({ kind: 'entry', children });
const stmt = () => ({ kind: 'statement' });
const block = (children) => ({ kind: 'block', children });
const ret = () => ({ kind: 'return', line: 3 });

function cfgOf(program) {
  const { query, symbolId } = buildProgram(program);
  const result = buildCfg(query, symbolId);
  assert.equal(result.ok, true, result.ok ? '' : `${result.code}: ${result.message}`);
  return result.cfg;
}

test('a missing symbol is a typed not-found result', () => {
  const { query } = buildProgram({ id: 'sequence', root: entry([]) });
  const result = buildCfg(query, 'symbol:missing');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_NOT_FOUND');
});

test('invalid builder input is rejected before any graph work', () => {
  assert.equal(buildCfg(null, FIXTURE_SYMBOL_ID).code, 'E_CFG_INPUT');
  assert.equal(buildCfg({}, '').code, 'E_CFG_INPUT');
});

test('a missing CFG capability degrades with E_UNSUPPORTED', () => {
  const { run } = buildProgram({ id: 'sequence', root: entry([]) });
  const query = createQueryLayer(run, {
    capabilities: createCapabilities({ generateCFG: false }),
  });
  const result = buildCfg(query, FIXTURE_SYMBOL_ID);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
});

test('a node-cap overflow is a typed result, never a partial graph', () => {
  const children = Array.from({ length: 40 }, () => stmt());
  const { query } = buildProgram({ id: 'big', root: entry(children) });
  const result = buildCfg(query, FIXTURE_SYMBOL_ID, { maxNodes: 10 });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CFG_TOO_LARGE');
  assert.equal(result.detail.limit, 10);
});

test('an unexpected builder exception becomes E_CFG_INTERNAL', () => {
  const { query } = buildProgram({ id: 'sequence', root: entry([]) });
  const hostile = {
    ...query,
    constructsOf() {
      throw new Error('adapter produced garbage');
    },
  };
  const result = buildCfg(hostile, FIXTURE_SYMBOL_ID);
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CFG_INTERNAL');
  assert.match(result.message, /adapter produced garbage/);
});

test('invariants reject duplicate entries, dangling edges and duplicate edges', () => {
  const base = {
    nodes: [
      { id: 'a', kind: 'entry', synthetic: true, range: null },
      { id: 'b', kind: 'exit', synthetic: true, range: null },
    ],
    edges: [{ id: 'e1', from: 'a', to: 'b', kind: 'seq', label: '' }],
  };
  assert.equal(checkInvariants(base).ok, true);

  const duplicateEntry = {
    ...base,
    nodes: [...base.nodes, { id: 'c', kind: 'entry', synthetic: true, range: null }],
  };
  assert.equal(checkInvariants(duplicateEntry).ok, false);

  const dangling = {
    ...base,
    edges: [{ id: 'e1', from: 'a', to: 'nowhere', kind: 'seq', label: '' }],
  };
  const danglingResult = checkInvariants(dangling);
  assert.equal(danglingResult.ok, false);
  assert.ok(danglingResult.issues.some((issue) => issue.includes('unknown target')));

  const duplicateEdge = {
    ...base,
    edges: [...base.edges, { id: 'e2', from: 'a', to: 'b', kind: 'seq', label: '' }],
  };
  assert.equal(checkInvariants(duplicateEdge).ok, false);
});

test('a resolved call node carries the target and a clean status', () => {
  const cfg = cfgOf({
    id: 'call-resolved',
    root: entry([
      { kind: 'call', line: 4, extensions: { calleeName: 'callee', callSite: range(4) } },
      ret(),
    ]),
    symbols: [{ symbolId: FIXTURE_CALLEE_ID, name: 'callee' }],
    calls: [{ to: FIXTURE_CALLEE_ID, line: 4, status: 'resolved' }],
  });
  const call = cfg.nodes.find((node) => node.kind === 'call');
  assert.ok(call);
  assert.equal(call.status, 'resolved');
  assert.ok(!call.badge, 'a clean resolved call needs no badge');
  assert.equal(call.calls.length, 1);
  assert.equal(call.calls[0].status, 'resolved');
  assert.equal(call.calls[0].label, 'callee');
});

test('a possible call is badged possible, not resolved', () => {
  const cfg = cfgOf({
    id: 'call-possible',
    root: entry([
      {
        kind: 'call',
        line: 4,
        extensions: { calleeName: 'maybe', callSite: range(4) },
      },
      ret(),
    ]),
    symbols: [{ symbolId: 'symbol:cfg:fixture:callee#function', name: 'maybe' }],
    calls: [{ line: 4, status: 'possible', reasonCode: 'overload_ambiguous' }],
  });
  const call = cfg.nodes.find((node) => node.kind === 'call');
  assert.equal(call.status, 'possible');
  assert.equal(call.badge, 'possible');
  assert.equal(call.calls[0].reasonCode, 'overload_ambiguous');
});

test('a call used as a condition badges the condition node', () => {
  const cfg = cfgOf({
    id: 'condition-call',
    root: entry([
      {
        kind: 'if',
        condition: { type: 'leaf', label: 'call', callSite: range(2) },
        children: [block([ret()])],
      },
    ]),
    calls: [{ line: 2, status: 'resolved' }],
  });
  const condition = cfg.nodes.find((node) => node.kind === 'condition');
  assert.ok(condition);
  assert.equal(condition.status, 'resolved');
  assert.equal(condition.calls.length, 1);
});

test('abrupt edges bypass later constructs instead of being rewired into them', () => {
  const cfg = cfgOf({
    id: 'dead-code',
    root: entry([ret(), stmt(), stmt()]),
  });
  const unreachable = cfg.nodes.find((node) => node.kind === 'unreachable');
  assert.ok(unreachable);
  assert.equal(unreachable.unreachable, true);
  assert.ok(unreachable.label.includes('2 constructs'));
  // The two dead statements are represented once, not lost.
  assert.equal(cfg.nodes.filter((node) => node.kind === 'statement').length, 0);
});

test('multiple returns converge on the single exit', () => {
  const cfg = cfgOf({
    id: 'multiple-returns',
    root: entry([
      {
        kind: 'if',
        condition: { type: 'leaf', label: 'comparison' },
        children: [block([ret()])],
      },
      ret(),
    ]),
  });
  const exits = cfg.nodes.filter((node) => node.kind === 'exit');
  assert.equal(exits.length, 1);
  const incoming = cfg.edges.filter((edge) => edge.to === exits[0].id);
  assert.equal(incoming.filter((edge) => edge.kind === 'return').length, 2);
});

test('an uncaught throw reaches exit with an inferred throw edge', () => {
  const cfg = cfgOf({
    id: 'throw',
    root: entry([{ kind: 'throw', line: 4 }]),
  });
  const edge = cfg.edges.find((candidate) => candidate.kind === 'throw');
  assert.ok(edge);
  assert.equal(edge.status, 'inferred');
  assert.equal(edge.reasonCode, 'uncaught_exception');
});

test('the same constructs always produce byte-identical graphs', () => {
  const program = {
    id: 'deterministic',
    root: entry([
      {
        kind: 'if',
        condition: {
          type: 'and',
          left: { type: 'leaf', label: 'comparison' },
          right: { type: 'leaf', label: 'comparison' },
        },
        children: [block([ret()])],
      },
      stmt(),
    ]),
  };
  const a = cfgOf(program);
  const b = cfgOf(program);
  assert.deepEqual(
    { nodes: a.nodes, edges: a.edges },
    { nodes: b.nodes, edges: b.edges },
  );
});

test('every edge connects declared nodes and no edge is duplicated', () => {
  const cfg = cfgOf({
    id: 'all-edges',
    root: entry([
      {
        kind: 'while',
        condition: { type: 'leaf', label: 'comparison' },
        children: [
          block([
            {
              kind: 'if',
              condition: { type: 'leaf', label: 'comparison' },
              children: [block([{ kind: 'break' }])],
            },
          ]),
        ],
      },
      ret(),
    ]),
  });
  const ids = new Set(cfg.nodes.map((node) => node.id));
  const seen = new Set();
  for (const edge of cfg.edges) {
    assert.ok(ids.has(edge.from), `unknown source ${edge.from}`);
    assert.ok(ids.has(edge.to), `unknown target ${edge.to}`);
    const key = `${edge.from}|${edge.to}|${edge.kind}|${edge.label}`;
    assert.equal(seen.has(key), false, `duplicate edge ${key}`);
    seen.add(key);
  }
});

test('non-synthetic nodes keep a real source range', () => {
  const cfg = cfgOf({
    id: 'ranges',
    root: entry([
      ...Array.from({ length: 5 }, () => stmt()),
      ret(),
    ]),
  });
  for (const node of cfg.nodes) {
    if (node.synthetic || node.kind === 'exit') {
      continue;
    }
    assert.ok(node.range, `node ${node.kind} lost its range`);
    assert.equal(node.range.fileId, 'file:cfg-fixture');
    assert.ok(node.range.startLine >= 0);
  }
});

// ── isKnownBuiltinCall behavioral regression ─────────────────────────────
// isKnownBuiltinCall is an internal helper tested via observable CFG behavior:
// well-known global/stdlib calls must NOT produce unresolved call nodes.

const CFG_CAPS = createCapabilities({ generateCFG: true });

function jsQueryFor(run) {
  return createQueryLayer(run, { capabilities: CFG_CAPS });
}

function jsRun2(text, modulePath = 'src/builtins.js') {
  return mapJavaScript({
    runId: 'run:cfg-builtin',
    path: modulePath,
    text,
    adapterId: 'js-acorn',
    adapterVersion: '0.1.0',
  });
}

function functionNamed2(run, name) {
  const sym = run.symbols.find((s) => s.kind === 'function' && s.name === name);
  assert.ok(sym, `missing function ${name}`);
  return sym;
}

test('calls to well-known builtins do not produce unresolved call nodes', () => {
  const src = `function demo(arr) {
  console.log(arr.length);
  const x = Math.max(arr[0], 0);
  arr.forEach((item) => {
    if (typeof item === 'string') {
      JSON.stringify(item);
    }
  });
  return x;
}\n`;
  const run = jsRun2(src);
  const sym = functionNamed2(run, 'demo');
  const cfg = buildCfg(jsQueryFor(run), sym.symbolId);
  assert.equal(cfg.ok, true, cfg.ok ? '' : `${cfg.code}: ${cfg.message}`);

  // Degradations should not contain unresolved entries for console/Math/JSON/Array.forEach
  const builtinUnresolved = cfg.cfg.degradations.filter((d) => {
    const text = JSON.stringify(d).toLowerCase();
    return (
      text.includes('unresolved') &&
      (text.includes('console') ||
        text.includes('math') ||
        text.includes('json') ||
        text.includes('foreach'))
    );
  });
  assert.equal(
    builtinUnresolved.length,
    0,
    `builtins should not be unresolved: ${JSON.stringify(builtinUnresolved)}`,
  );
});

test('resolveExternalCall option is accepted and called for external callees', () => {
  const src = `function main() { unknownExternal(); }\n`;
  const run = jsRun2(src, 'src/ext.js');
  const sym = functionNamed2(run, 'main');

  let resolverCalled = false;
  const cfg = buildCfg(jsQueryFor(run), sym.symbolId, {
    resolveExternalCall: (calleeName) => {
      resolverCalled = true;
      return calleeName === 'unknownExternal'
        ? { symbolId: 'symbol:external:unknownExternal', displayName: 'unknownExternal' }
        : null;
    },
  });
  assert.equal(cfg.ok, true);
  // Resolver should have been consulted for the external call
  assert.equal(resolverCalled, true, 'resolveExternalCall was not invoked');
});
