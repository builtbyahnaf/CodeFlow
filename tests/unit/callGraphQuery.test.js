import test from 'node:test';
import assert from 'node:assert/strict';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import {
  createAnalysisRun,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../src/core/csr/entities.js';
import { createCallGraphQueryService } from '../../src/core/graph/calls/query.js';
import { createIndexEvidenceSource } from '../../src/core/graph/calls/sources.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
});

const r = (line, fileId = 'file:a') => ({
  fileId,
  startLine: line,
  startColumn: 0,
  endLine: line,
  endColumn: 10,
});

function build250CallerFixture() {
  const targetId = 'sym:target';
  const symbols = [
    createSymbol({
      symbolId: targetId,
      kind: 'function',
      name: 'hotTarget',
      qualifiedName: 'hotTarget',
      language: 'javascript',
      declaration: r(0),
    }),
  ];
  const relationships = [];
  for (let i = 0; i < 250; i += 1) {
    const callerId = `sym:caller:${String(i).padStart(4, '0')}`;
    symbols.push(
      createSymbol({
        symbolId: callerId,
        kind: 'function',
        name: `caller_${i}`,
        qualifiedName: `caller_${i}`,
        language: 'javascript',
        declaration: r(i + 1),
      }),
    );
    relationships.push(
      createRelationship({
        relationshipId: `rel:call:${i}`,
        type: 'calls',
        from: callerId,
        to: targetId,
        status: i % 5 === 0 ? 'possible' : 'resolved',
        ...(i % 5 === 0 ? { reasonCode: 'callback_parameter' } : {}),
        site: r(i + 1),
      }),
    );
  }

  const run = createAnalysisRun({
    runId: 'run:250',
    adapterId: 'javascript',
    adapterVersion: '1.0.0',
    language: 'javascript',
    completeness: 'full',
    files: [
      createFileRecord({
        fileId: 'file:a',
        path: 'src/hot.js',
        language: 'javascript',
        lineCount: 300,
      }),
    ],
    symbols,
    relationships,
  });

  const query = createQueryLayer(run, { capabilities: CAPS });
  return { query, targetId };
}

test('250-caller fixture paginates with exact totals, page-size clamping, and same_file_only scope banner', () => {
  const { query, targetId } = build250CallerFixture();
  const service = createCallGraphQueryService({ query });

  const page1 = service.incoming(targetId, { limit: 100 });
  assert.equal(page1.ok, true);
  assert.equal(page1.total, 250);
  assert.equal(page1.exactTotal, true);
  assert.equal(page1.items.length, 100);
  assert.equal(page1.scope, 'same_file_only');
  assert.match(
    page1.scopeBanner,
    /250 callers in this file · Project-wide callers require indexing/,
  );
  assert.ok(page1.nextCursor);

  const page2 = service.incoming(targetId, { limit: 100, cursor: page1.nextCursor });
  assert.equal(page2.items.length, 100);
  assert.ok(page2.nextCursor);

  const page3 = service.incoming(targetId, { limit: 100, cursor: page2.nextCursor });
  assert.equal(page3.items.length, 50);
  assert.equal(page3.nextCursor, undefined);

  // Page size above 200 is clamped to maxPageSize (200).
  const clamped = service.incoming(targetId, { limit: 999 });
  assert.equal(clamped.items.length, 200);
});

test('a stale cursor from an older runId resets cleanly to the first page with notice', () => {
  const { query, targetId } = build250CallerFixture();
  const service = createCallGraphQueryService({ query });

  const res = service.incoming(targetId, { limit: 50, cursor: 'run:older::150' });
  assert.equal(res.ok, true);
  assert.equal(res.cursorReset, true);
  assert.ok(res.scopeReasons.includes('stale_cursor_reset'));
  assert.equal(res.items[0].symbolId, 'sym:caller:0000');
});

test('depth expansion is cancellable, bounds depth and node count, and returns both nodes and edges', () => {
  const { query, targetId } = build250CallerFixture();
  const service = createCallGraphQueryService({ query });

  const cancelled = service.depth(targetId, { depth: 3, token: { isCancelled: true } });
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.cancelled, true);
  assert.equal(cancelled.nodes.length, 0);
  assert.equal(cancelled.edges.length, 0);

  const capped = service.depth(targetId, { depth: 3, maxNodes: 25 });
  assert.equal(capped.ok, true);
  assert.equal(capped.cancelled, false);
  assert.equal(capped.nodes.length, 25);
  assert.equal(capped.expansionCapped, true);
  assert.ok(capped.edges.length >= 24);
});

test('index evidence source contract upgrades scope to complete or partial and merges cross-file callers', () => {
  const { query, targetId } = build250CallerFixture();
  const crossCaller = createSymbol({
    symbolId: 'sym:cross:caller',
    kind: 'function',
    name: 'crossFileCaller',
    qualifiedName: 'other.crossFileCaller',
    language: 'javascript',
    declaration: r(4, 'file:b'),
  });
  const crossRel = createRelationship({
    relationshipId: 'rel:cross:1',
    type: 'calls',
    from: 'sym:cross:caller',
    to: targetId,
    status: 'resolved',
    site: r(6, 'file:b'),
  });

  const fakeIndex = createIndexEvidenceSource({
    sourceId: 'index:workspace',
    scope: 'complete',
    symbolById: (id) => (id === 'sym:cross:caller' ? crossCaller : null),
    callsByTo: (id) => (id === targetId ? [crossRel] : []),
    callsByFrom: () => [],
    batchNeighbors: () => ({ symbols: [crossCaller], relationships: [crossRel] }),
  });

  const service = createCallGraphQueryService({ query, indexSource: fakeIndex });
  const incoming = service.incoming(targetId, { limit: 10 });
  assert.equal(incoming.scope, 'complete');
  assert.equal(incoming.total, 251);
  assert.equal(incoming.scopeBanner, '251 callers');
});
