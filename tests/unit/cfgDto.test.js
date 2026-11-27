import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { toCfgDto, CFG_RENDER_NODE_LIMIT } from '../../src/core/graph/cfg/dto.js';
import { layoutCfg } from '../../src/core/graph/cfg/layout.js';
import { validateDto, serializeDto, parseDto } from '../../src/core/graph/dto.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { buildProgram } from '../fixtures/cfg/harness.js';

const entry = (children) => ({ kind: 'entry', children });
const stmt = () => ({ kind: 'statement' });

function sampleCfg() {
  const { query, symbolId } = buildProgram({
    id: 'dto-sample',
    root: entry([
      {
        kind: 'if',
        condition: { type: 'leaf', label: 'comparison' },
        children: [
          { kind: 'block', children: [{ kind: 'return' }] },
          {
            kind: 'else',
            children: [{ kind: 'block', children: [{ kind: 'statement' }] }],
          },
        ],
      },
      { kind: 'return' },
    ]),
  });
  const result = buildCfg(query, symbolId);
  assert.equal(result.ok, true);
  return result.cfg;
}

test('the CFG DTO declares its kind, function and entry/exit contract', () => {
  const dto = toCfgDto(sampleCfg());
  assert.equal(dto.dtoVersion, 1);
  assert.equal(dto.dtoKind, 'cfg');
  assert.equal(dto.graphKind, 'cfg');
  assert.equal(dto.function.symbolId, dto.function.symbolId);
  assert.equal(typeof dto.function.qualifiedName, 'string');
  assert.ok(dto.nodes.some((node) => node.id === dto.entryId));
  assert.ok(dto.nodes.some((node) => node.id === dto.exitId));
  assert.equal(dto.truncated, false);
  assert.equal(dto.truncationReason, null);
  assert.ok(Array.isArray(dto.degradations));
  assert.ok(dto.legend.statuses.includes('resolved'));
  assert.ok(dto.legend.edgeKinds.length > 0);
  assert.ok(dto.stats.renderedNodeCount <= dto.stats.nodeCount);
});

test('every DTO node carries a finite position and label lines', () => {
  const dto = toCfgDto(sampleCfg());
  for (const node of dto.nodes) {
    assert.ok(Number.isFinite(node.position.x));
    assert.ok(Number.isFinite(node.position.y));
    assert.ok(node.position.width > 0);
    assert.ok(node.position.height > 0);
    assert.ok(Number.isInteger(node.position.layer));
    assert.ok(node.labelLines.length >= 1);
    assert.equal(Array.isArray(node.badges), true);
  }
});

test('CFG labels keep the whole statement and wrap instead of truncating', () => {
  const statement =
    'const result = await remoteService.loadEverythingFromTheRemoteEndpoint(configuration, options)';
  const { query, symbolId } = buildProgram({
    id: 'long-label',
    root: entry([{ kind: 'statement', extensions: { label: statement } }]),
  });
  const built = buildCfg(query, symbolId);
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg);
  const node = dto.nodes.find((entry) => entry.label === statement);
  assert.ok(node, 'the full statement should survive into the DTO');
  assert.ok(node.labelLines.length > 1, 'a long statement should wrap across lines');
  assert.equal(node.labelLines.join(' '), statement);
  assert.ok(!node.label.includes('…'));
});

test('node boxes grow to contain every wrapped label line instead of clamping', () => {
  const statement = Array.from({ length: 100 }, (_, index) => `segment${index}`).join(' ');
  const { query, symbolId } = buildProgram({
    id: 'very-long-label',
    root: entry([{ kind: 'statement', extensions: { label: statement } }]),
  });
  const built = buildCfg(query, symbolId);
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg);
  const node = dto.nodes.find((entry) => entry.label === statement);
  assert.ok(node);
  assert.ok(node.labelLines.length > 16, 'expected enough lines to exceed the old 240px clamp');

  const longestLine = Math.max(...node.labelLines.map((line) => line.length));
  assert.ok(
    node.position.width >= longestLine * 7,
    'node width must fit its longest wrapped line',
  );
  assert.ok(
    node.position.height >= node.labelLines.length * 15,
    'node height must fit every wrapped line',
  );
});

test('JavaScript statements after comments keep their own labels and conditionals', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-comments',
    path: 'src/comments.js',
    text: [
      'function demo(x) {',
      '  // branch on the sign',
      '  if (x > 0) { // positive',
      '    return 1;',
      '  }',
      '  /* next',
      '     statement */',
      '  const z = x * 2;',
      '  return z;',
      '}',
    ].join('\n'),
  });
  const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
  const fn = run.symbols.find((symbol) => symbol.name === 'demo' && symbol.kind === 'function');
  assert.ok(fn);
  const built = buildCfg(query, fn.symbolId);
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg);

  const condition = dto.nodes.find((node) => node.kind === 'condition');
  assert.ok(condition);
  assert.equal(condition.label, 'x > 0');
  assert.ok(dto.edges.some((edge) => edge.kind === 'true'));
  assert.ok(dto.edges.some((edge) => edge.kind === 'false'));

  const statement = dto.nodes.find((node) => node.label === 'const z = x * 2;');
  assert.ok(statement, 'the statement after the block comment must keep its own label');
  for (const node of dto.nodes) {
    assert.ok(!node.label.includes('//'), `comment text leaked into ${node.label}`);
    assert.ok(!node.label.includes('/*'), `comment text leaked into ${node.label}`);
  }
});

test('JavaScript multi-line labels drop inline comments instead of gluing arguments', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-inline-comments',
    path: 'src/inline.js',
    text: [
      'function demo(a, b) {',
      '  const total = compute(',
      '    a, // first',
      '    b, // second',
      '  );',
      '  return total;',
      '}',
    ].join('\n'),
  });
  const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
  const fn = run.symbols.find((symbol) => symbol.name === 'demo' && symbol.kind === 'function');
  const built = buildCfg(query, fn.symbolId);
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg);
  const statement = dto.nodes.find((node) => node.label.includes('compute('));
  assert.ok(statement);
  assert.ok(!statement.label.includes('//'));
  assert.ok(statement.label.includes('a,'));
  assert.ok(statement.label.includes('b,'));
});

test('JavaScript CFG nodes show real source, named functions and parameter metadata', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:js-cfg-labels',
    path: 'src/app.js',
    text: [
      'function app_() {',
      '  function helper(x) { return x * 2; }',
      '  return helper(3);',
      '}',
      'function compute(value) {',
      '  const doubled = value * 2;',
      '  if (doubled > 10) {',
      '    return math.add(doubled, helper(value));',
      '  }',
      '  return doubled;',
      '}',
    ].join('\n'),
  });
  const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
  const appSymbol = run.symbols.find((symbol) => symbol.name === 'app_');
  const computeSymbol = run.symbols.find((symbol) => symbol.name === 'compute');
  assert.ok(appSymbol && computeSymbol);

  const appBuilt = buildCfg(query, appSymbol.symbolId);
  assert.equal(appBuilt.ok, true);
  const appDto = toCfgDto(appBuilt.cfg);
  assert.ok(
    appDto.nodes.some((node) => node.label.includes('function helper(x)')),
    'nested function declarations should carry their names, not a generic "function"',
  );

  const computeBuilt = buildCfg(query, computeSymbol.symbolId);
  assert.equal(computeBuilt.ok, true);
  const computeDto = toCfgDto(computeBuilt.cfg);
  assert.equal(computeDto.function.signature, 'compute(value)');
  assert.ok(
    computeDto.function.parameters.some((parameter) => parameter.name === 'value'),
    'the function signature should expose parameter metadata',
  );
  assert.ok(computeDto.nodes.some((node) => node.label.includes('doubled = value * 2')));
  assert.ok(computeDto.nodes.some((node) => node.label.includes('math.add')));
});

test('synthetic, unreachable and call facts survive the DTO', () => {
  const dto = toCfgDto(sampleCfg());
  const merge = dto.nodes.find((node) => node.kind === 'merge');
  if (merge) {
    assert.equal(merge.isSynthetic, true);
  }
  const exit = dto.nodes.find((node) => node.kind === 'exit');
  assert.equal(exit.isSynthetic, true);
  assert.equal(exit.range, null);
});

test('layout is deterministic and pushes unreachable nodes below live ones', () => {
  const nodes = [
    { id: 'a', kind: 'entry', unreachable: false },
    { id: 'b', kind: 'statement', unreachable: false },
    { id: 'c', kind: 'exit', unreachable: false },
    { id: 'd', kind: 'statement', unreachable: true },
  ];
  const edges = [
    { from: 'a', to: 'b', kind: 'seq' },
    { from: 'b', to: 'c', kind: 'seq' },
  ];
  const first = layoutCfg({ nodes, edges });
  const second = layoutCfg({ nodes, edges });
  assert.deepEqual(first, second);
  assert.ok(first.positions.d.y > first.positions.b.y);
  assert.ok(first.width > 0);
  assert.ok(first.height > 0);
});

test('layout tolerates cycles without growing without bound', () => {
  const nodes = [
    { id: 'a', kind: 'entry' },
    { id: 'b', kind: 'loop_header' },
    { id: 'c', kind: 'statement' },
    { id: 'd', kind: 'loop_latch' },
    { id: 'e', kind: 'exit' },
  ];
  const edges = [
    { from: 'a', to: 'b', kind: 'seq' },
    { from: 'b', to: 'c', kind: 'true' },
    { from: 'c', to: 'd', kind: 'seq' },
    { from: 'd', to: 'b', kind: 'loop_back' },
    { from: 'b', to: 'e', kind: 'false' },
  ];
  const layout = layoutCfg({ nodes, edges });
  assert.ok(layout.height < 5000);
  assert.ok(layout.positions.e.y > layout.positions.a.y);
});

test('truncation keeps the entry and exit and records an explicit notice', () => {
  const statements = Array.from({ length: CFG_RENDER_NODE_LIMIT + 120 }, () => stmt());
  const { query, symbolId } = buildProgram({ id: 'huge', root: entry(statements) });
  const built = buildCfg(query, symbolId, { allowLarge: true });
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg);
  assert.equal(dto.truncated, true);
  assert.equal(dto.truncationReason, `node-limit:${CFG_RENDER_NODE_LIMIT}`);
  // The retained slice plus the mandatory entry and exit.
  assert.ok(dto.nodes.length <= CFG_RENDER_NODE_LIMIT + 2);
  assert.ok(dto.degradations.some((entry) => entry.code === 'truncated'));
  assert.ok(dto.nodes.some((node) => node.id === dto.entryId));
  assert.ok(dto.nodes.some((node) => node.id === dto.exitId));
  const ids = new Set(dto.nodes.map((node) => node.id));
  for (const edge of dto.edges) {
    assert.ok(ids.has(edge.from) && ids.has(edge.to), 'truncation left a dangling edge');
  }
});

test('DTO validation rejects structural corruption', () => {
  const dto = toCfgDto(sampleCfg());
  assert.equal(validateDto(dto).ok, true);

  const unknownKind = structuredClone(dto);
  unknownKind.nodes[0].kind = 'interpretive_dance';
  assert.equal(validateDto(unknownKind).ok, false);

  const dangling = structuredClone(dto);
  dangling.edges[0].to = 'cfg:nowhere';
  assert.equal(validateDto(dangling).ok, false);

  const noEntry = structuredClone(dto);
  noEntry.nodes = noEntry.nodes.filter((node) => node.kind !== 'entry');
  assert.equal(validateDto(noEntry).ok, false);

  const badPosition = structuredClone(dto);
  badPosition.nodes[0].position.x = 'left';
  assert.equal(validateDto(badPosition).ok, false);

  const badDegradation = structuredClone(dto);
  badDegradation.degradations = ['a string is not a degradation'];
  assert.equal(validateDto(badDegradation).ok, false);
});

test('CFG DTOs serialize, parse and validate byte-identically', () => {
  const dto = toCfgDto(sampleCfg());
  const json = serializeDto(dto);
  const parsed = parseDto(json);
  assert.equal(serializeDto(parsed), json);
  assert.equal(validateDto(parsed).ok, true);
});

test('the truncation notice is stable across a JSON round trip', () => {
  const statements = Array.from({ length: CFG_RENDER_NODE_LIMIT + 5 }, () => stmt());
  const { query, symbolId } = buildProgram({ id: 'huge-roundtrip', root: entry(statements) });
  const built = buildCfg(query, symbolId, { allowLarge: true });
  const dto = toCfgDto(built.cfg);
  const roundTrip = parseDto(serializeDto(dto));
  assert.equal(roundTrip.truncated, true);
  assert.ok(roundTrip.degradations.some((entry) => entry.code === 'truncated'));
});
