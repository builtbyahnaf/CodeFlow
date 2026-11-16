import test from 'node:test';
import assert from 'node:assert/strict';

import { createMockAnalysis } from '../../src/adapters/mock/index.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';

const fullCapabilities = createCapabilities({
  resolveCalls: true,
  generateCFG: true,
  generateDFG: true,
});

function fixture(capabilities = fullCapabilities) {
  const run = createMockAnalysis();
  const main = run.symbols.find((symbol) => symbol.name === 'main');
  const check = run.symbols.find((symbol) => symbol.name === 'check_db_exists');
  return { run, query: createQueryLayer(run, { capabilities }), main, check };
}

test('symbols can be fetched by id and by file', () => {
  const { run, query, main } = fixture();
  const byId = query.symbolById(main.symbolId);
  assert.equal(byId.ok, true);
  assert.equal(byId.value.qualifiedName, 'main');

  const fileId = run.files[0].fileId;
  const inFile = query.symbolsInFile(fileId);
  assert.equal(inFile.ok, true);
  assert.ok(inFile.value.length > 0);
  const ids = inFile.value.map((symbol) => symbol.symbolId);
  assert.deepEqual(ids, [...ids].sort());

  assert.equal(query.symbolById('symbol:missing').code, 'E_NOT_FOUND');
});

test('outgoing returns stored relationships with typed filters', () => {
  const { query, main } = fixture();
  const all = query.outgoing(main.symbolId);
  assert.equal(all.ok, true);
  assert.ok(all.value.length > 0);

  const calls = query.outgoing(main.symbolId, { types: ['calls'] });
  assert.ok(calls.value.every((relationship) => relationship.type === 'calls'));

  const possible = query.outgoing(main.symbolId, { types: ['calls'], statuses: ['possible'] });
  assert.equal(possible.value.length, 1);
  assert.equal(possible.value[0].reasonCode, 'overload_ambiguous');

  assert.equal(query.outgoing(main.symbolId, { types: 'calls' }).code, 'E_QUERY');
});

test('incoming derives called_by and defined_in without storing them', () => {
  const { run, query, check } = fixture();
  const incoming = query.incoming(check.symbolId);
  assert.equal(incoming.ok, true);
  const calledBy = incoming.value.find((relationship) => relationship.type === 'called_by');
  assert.ok(calledBy);
  assert.equal(calledBy.from, check.symbolId);
  assert.match(calledBy.relationshipId, /^inverse:rel:/);
  assert.ok(!run.relationships.some((relationship) => relationship.type === 'called_by'));

  const definedIn = incoming.value.find((relationship) => relationship.type === 'defined_in');
  assert.ok(definedIn);
});

test('callers and callees agree with the stored calls exactly (C-05)', () => {
  const { run, query, main, check } = fixture();
  const declared = new Set(run.symbols.map((symbol) => symbol.symbolId));
  // External targets have no symbol to query, so only declared targets can
  // exercise the derived-inverse path.
  const storedCalls = run.relationships.filter(
    (relationship) => relationship.type === 'calls' && declared.has(relationship.to),
  );
  let derivedCount = 0;
  for (const relationship of storedCalls) {
    const incoming = query.incoming(relationship.to, { types: ['calls'] });
    assert.equal(incoming.ok, true);
    const match = incoming.value.find(
      (candidate) =>
        candidate.type === 'called_by' &&
        candidate.from === relationship.to &&
        candidate.to === relationship.from,
    );
    assert.ok(match, `missing inverse for ${relationship.relationshipId}`);
    derivedCount += 1;
  }
  assert.equal(derivedCount, storedCalls.length);

  const callers = query.callers(check.symbolId);
  assert.equal(callers.ok, true);
  assert.ok(callers.value.some((entry) => entry.symbol.symbolId === main.symbolId));

  const callees = query.callees(main.symbolId);
  assert.equal(callees.ok, true);
  assert.ok(callees.value.some((entry) => entry.symbol.symbolId === check.symbolId));
  assert.ok(callees.value.every((entry) => entry.external === false));
});

test('derived queries are cached until invalidation', () => {
  const { query, check } = fixture();
  const before = query.stats();
  query.incoming(check.symbolId);
  query.incoming(check.symbolId);
  const after = query.stats();
  assert.equal(after.cacheHits, before.cacheHits + 1);
  assert.ok(after.inverseEntries >= 1);

  query.invalidate();
  assert.equal(query.stats().inverseEntries, 0);
  assert.equal(query.stats().cacheVersion, after.cacheVersion + 1);
});

test('capability gaps return E_UNSUPPORTED instead of an empty array', () => {
  const { query, main } = fixture(createCapabilities({ parse: true }));
  for (const result of [
    query.callers(main.symbolId),
    query.callees(main.symbolId),
    query.constructsOf(main.symbolId),
    query.dataFactsOf(main.symbolId),
  ]) {
    assert.equal(result.ok, false);
    assert.equal(result.code, 'E_UNSUPPORTED');
    assert.match(result.message, /does not declare/);
  }
});

test('control constructs expose a tree keyed by symbol', () => {
  const { query, main } = fixture();
  const result = query.constructsOf(main.symbolId);
  assert.equal(result.ok, true);
  assert.equal(result.value.roots.length, 1);
  assert.equal(result.value.roots[0].kind, 'entry');
  assert.equal(result.value.byId['construct:mock:main:if'].kind, 'if');
});

test('data facts are gated by generateDFG', () => {
  const { run, query } = fixture();
  const variable = run.symbols.find((symbol) => symbol.name === 'i');
  const result = query.dataFactsOf(variable.symbolId);
  assert.equal(result.ok, true);
  assert.ok(result.value.length > 0);
});

test('queries never mutate the run', () => {
  const { run, query, main, check } = fixture();
  const before = JSON.stringify(run);
  query.symbolById(main.symbolId);
  query.symbolsInFile(run.files[0].fileId);
  query.outgoing(main.symbolId);
  query.incoming(check.symbolId);
  query.callers(check.symbolId);
  query.callees(main.symbolId);
  query.constructsOf(main.symbolId);
  query.dataFactsOf(main.symbolId);
  assert.equal(JSON.stringify(run), before);
});
