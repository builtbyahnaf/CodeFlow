import test from 'node:test';
import assert from 'node:assert/strict';

import { createRelationship, createSymbol } from '../../src/core/csr/entities.js';
import { mergeEvidenceSources, mergeStatusPair } from '../../src/core/graph/calls/merge.js';

const r = (line, fileId = 'file:a') => ({
  fileId,
  startLine: line,
  startColumn: 0,
  endLine: line,
  endColumn: 12,
});

const sym = (id, name, fileId = 'file:a') =>
  createSymbol({
    symbolId: id,
    kind: 'function',
    name,
    qualifiedName: name,
    language: 'javascript',
    declaration: r(0, fileId),
  });

test('mergeStatusPair enforces the Phase 7 §6 precedence truth table', () => {
  // resolved + resolved -> resolved
  assert.deepEqual(mergeStatusPair('resolved', 'resolved'), {
    status: 'resolved',
    stale: false,
    upgraded: false,
  });

  // resolved + anything weaker -> resolved
  for (const weaker of ['inferred', 'possible', 'unresolved']) {
    const left = mergeStatusPair('resolved', weaker);
    const right = mergeStatusPair(weaker, 'resolved');
    assert.equal(left.status, 'resolved', `resolved + ${weaker}`);
    assert.equal(right.status, 'resolved', `${weaker} + resolved`);
    assert.equal(left.upgraded, true);
  }

  // inferred + inferred -> inferred
  assert.equal(mergeStatusPair('inferred', 'inferred').status, 'inferred');

  // inferred + possible -> inferred
  assert.equal(mergeStatusPair('inferred', 'possible').status, 'inferred');
  assert.equal(mergeStatusPair('possible', 'inferred').status, 'inferred');

  // possible + possible -> possible (NEVER upgrades to resolved!)
  assert.equal(mergeStatusPair('possible', 'possible').status, 'possible');

  // anything + stale -> strongest of the two + stale provenance flag
  const withStale = mergeStatusPair('inferred', 'stale');
  assert.equal(withStale.status, 'inferred');
  assert.equal(withStale.stale, true);
});

test('two possible targets never upgrade to resolved and candidates are unioned', () => {
  const s1 = {
    sourceId: 'adapter:local',
    symbols: [sym('sym:caller', 'caller'), sym('sym:target', 'target')],
    relationships: [
      createRelationship({
        relationshipId: 'r:1',
        type: 'calls',
        from: 'sym:caller',
        to: 'sym:target',
        status: 'possible',
        reasonCode: 'dynamic_dispatch',
        site: r(3),
        extensions: { candidates: ['sym:c1', 'sym:c2'] },
      }),
    ],
  };
  const s2 = {
    sourceId: 'index:workspace',
    symbols: [sym('sym:caller', 'caller'), sym('sym:target', 'target')],
    relationships: [
      createRelationship({
        relationshipId: 'r:2',
        type: 'calls',
        from: 'sym:caller',
        to: 'sym:target',
        status: 'possible',
        reasonCode: 'dynamic_dispatch',
        site: r(4),
        extensions: { candidates: ['sym:c2', 'sym:c3'] },
      }),
    ],
  };

  const merged = mergeEvidenceSources([s1, s2]);
  assert.equal(merged.relationships.length, 1);
  assert.equal(merged.relationships[0].status, 'possible');
  assert.deepEqual(merged.relationships[0].candidates, ['sym:c1', 'sym:c2', 'sym:c3']);
  assert.equal(merged.relationships[0].callSiteCount, 2);
});

test('different relationship types (calls vs references) never merge together', () => {
  const src = {
    sourceId: 'adapter:local',
    symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
    relationships: [
      createRelationship({
        relationshipId: 'r:call',
        type: 'calls',
        from: 'sym:a',
        to: 'sym:b',
        status: 'resolved',
        site: r(2),
      }),
      createRelationship({
        relationshipId: 'r:ref',
        type: 'references',
        from: 'sym:a',
        to: 'sym:b',
        status: 'possible',
        reasonCode: 'callback_parameter',
        site: r(3),
      }),
    ],
  };

  const merged = mergeEvidenceSources([src]);
  assert.equal(merged.relationships.length, 2);
  const types = merged.relationships.map((rel) => rel.type).sort();
  assert.deepEqual(types, ['calls', 'references']);
});

test('unresolved sites at other locations stay in the unresolved bucket when a resolved call exists', () => {
  const s1 = {
    sourceId: 'adapter:local',
    symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
    relationships: [
      createRelationship({
        relationshipId: 'r:u1',
        type: 'calls',
        from: 'sym:a',
        to: 'sym:b',
        status: 'unresolved',
        reasonCode: 'unknown_receiver',
        site: r(5),
      }),
      createRelationship({
        relationshipId: 'r:u2',
        type: 'calls',
        from: 'sym:a',
        to: 'external:mystery',
        status: 'unresolved',
        reasonCode: 'computed_member',
        site: r(8),
      }),
    ],
  };
  const s2 = {
    sourceId: 'index:workspace',
    symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
    relationships: [
      createRelationship({
        relationshipId: 'r:res',
        type: 'calls',
        from: 'sym:a',
        to: 'sym:b',
        status: 'resolved',
        site: r(5),
      }),
    ],
  };

  const merged = mergeEvidenceSources([s1, s2]);
  const ab = merged.relationships.find((rel) => rel.to === 'sym:b');
  assert.equal(ab.status, 'resolved');
  // The other site at line 8 remains in the unresolved bucket!
  assert.equal(merged.unresolvedSites.length, 1);
  assert.equal(merged.unresolvedSites[0].to, 'external:mystery');
  assert.equal(merged.unresolvedSites[0].reasonCode, 'computed_member');
});

test('resolved in source A but absent in source B emits source_disagreement without downgrading', () => {
  const sourceA = {
    sourceId: 'adapter:local',
    coveredSymbols: ['sym:a'],
    symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
    relationships: [
      createRelationship({
        relationshipId: 'r:1',
        type: 'calls',
        from: 'sym:a',
        to: 'sym:b',
        status: 'resolved',
        site: r(2),
      }),
    ],
  };
  const sourceB = {
    sourceId: 'index:workspace',
    coveredSymbols: ['sym:a'],
    symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
    relationships: [],
  };

  const merged = mergeEvidenceSources([sourceA, sourceB]);
  assert.equal(merged.relationships.length, 1);
  assert.equal(merged.relationships[0].status, 'resolved');
  assert.equal(merged.diagnostics.length, 1);
  assert.equal(merged.diagnostics[0].code, 'source_disagreement');
});

test('merge is order-independent across shuffled permutations and idempotent on double merge', () => {
  const sources = [
    {
      sourceId: 'src:1',
      symbols: [sym('sym:a', 'a'), sym('sym:b', 'b'), sym('sym:c', 'c')],
      relationships: [
        createRelationship({
          relationshipId: 'r:1',
          type: 'calls',
          from: 'sym:a',
          to: 'sym:b',
          status: 'possible',
          reasonCode: 'dynamic_dispatch',
          site: r(1),
        }),
        createRelationship({
          relationshipId: 'r:2',
          type: 'calls',
          from: 'sym:b',
          to: 'sym:c',
          status: 'inferred',
          reasonCode: 'dynamic_dispatch',
          site: r(2),
        }),
      ],
    },
    {
      sourceId: 'src:2',
      symbols: [sym('sym:a', 'a'), sym('sym:b', 'b'), sym('sym:c', 'c')],
      relationships: [
        createRelationship({
          relationshipId: 'r:3',
          type: 'calls',
          from: 'sym:a',
          to: 'sym:b',
          status: 'resolved',
          site: r(1),
        }),
        createRelationship({
          relationshipId: 'r:4',
          type: 'calls',
          from: 'sym:b',
          to: 'sym:c',
          status: 'possible',
          reasonCode: 'dynamic_dispatch',
          site: r(2),
        }),
      ],
    },
    {
      sourceId: 'src:3',
      symbols: [sym('sym:a', 'a'), sym('sym:b', 'b')],
      relationships: [
        createRelationship({
          relationshipId: 'r:5',
          type: 'calls',
          from: 'sym:a',
          to: 'sym:b',
          status: 'inferred',
          reasonCode: 'dynamic_dispatch',
          site: r(1),
        }),
      ],
    },
  ];

  const baseline = JSON.stringify(mergeEvidenceSources(sources));
  for (const perm of [
    [sources[2], sources[0], sources[1]],
    [sources[1], sources[2], sources[0]],
    [sources[2], sources[1], sources[0]],
  ]) {
    assert.equal(JSON.stringify(mergeEvidenceSources(perm)), baseline);
  }

  // Double-merge idempotence
  const once = mergeEvidenceSources(sources);
  const twice = mergeEvidenceSources([
    {
      sourceId: 'merged',
      scope: once.scope,
      scopeReasons: once.scopeReasons,
      symbols: once.symbols,
      relationships: once.relationships,
    },
  ]);
  assert.deepEqual(
    twice.relationships.map((r) => ({ from: r.from, to: r.to, type: r.type, status: r.status })),
    once.relationships.map((r) => ({ from: r.from, to: r.to, type: r.type, status: r.status })),
  );
});

test('file location disagreement prefers the source matching disk contentHash and marks stale otherwise', () => {
  const sOld = {
    sourceId: 'index:old',
    contentHashes: { 'file:old': 'sha256:old' },
    symbols: [sym('sym:moved', 'moved', 'file:old')],
    relationships: [],
  };
  const sCurrent = {
    sourceId: 'adapter:current',
    contentHashes: { 'file:new': 'sha256:current' },
    symbols: [sym('sym:moved', 'moved', 'file:new')],
    relationships: [],
  };

  const merged = mergeEvidenceSources([sOld, sCurrent], {
    diskHashes: { 'file:old': 'sha256:gone', 'file:new': 'sha256:current' },
  });
  assert.equal(merged.symbols[0].declaration.fileId, 'file:new');
  assert.equal(merged.symbols[0].stale, false);
  assert.ok(merged.diagnostics.some((d) => d.code === 'source_disagreement'));
});
