import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyIndexSnapshot } from '../../src/core/indexing/schema.js';
import {
  computeLogicalIndexHash,
  createIndexQuerySurface,
} from '../../src/core/indexing/queries.js';
import { createIndexEvidenceSource } from '../../src/core/graph/calls/sources.js';

function createPopulatedSnapshot() {
  const snap = createEmptyIndexSnapshot({ now: 1000, state: 'complete' });
  snap.files['file:a'] = {
    file_id: 'file:a',
    path: 'src/core/a.js',
    language: 'javascript',
    content_hash: 'sha256:aaa',
    size_bytes: 100,
    line_count: 10,
    indexed_at: 1000,
    run_id: 'run:1',
  };
  snap.files['file:b'] = {
    file_id: 'file:b',
    path: 'src/core/b.js',
    language: 'javascript',
    content_hash: 'sha256:bbb',
    size_bytes: 140,
    line_count: 14,
    indexed_at: 1000,
    run_id: 'run:1',
  };
  snap.symbols['sym:alpha'] = {
    symbol_id: 'sym:alpha',
    kind: 'function',
    name: 'alpha',
    qualified_name: 'core.alpha',
    language: 'javascript',
    file_id: 'file:a',
    parent_id: null,
    start_line: 0,
    start_col: 0,
    end_line: 4,
    end_col: 1,
    visibility: 'public',
    extensions_json: null,
    run_id: 'run:1',
  };
  snap.symbols['sym:beta'] = {
    symbol_id: 'sym:beta',
    kind: 'function',
    name: 'beta',
    qualified_name: 'core.beta',
    language: 'javascript',
    file_id: 'file:b',
    parent_id: null,
    start_line: 0,
    start_col: 0,
    end_line: 5,
    end_col: 1,
    visibility: 'public',
    extensions_json: null,
    run_id: 'run:1',
  };
  snap.relationships['rel:ab'] = {
    rel_id: 'rel:ab',
    type: 'calls',
    from_id: 'sym:alpha',
    to_id: 'sym:beta',
    status: 'resolved',
    reason: null,
    site_file: 'file:a',
    site_start_line: 2,
    site_end_line: 2,
    run_id: 'run:1',
  };
  snap.dependencies['file:a|file:b|imports'] = {
    from_file: 'file:a',
    to_file: 'file:b',
    type: 'imports',
    status: 'resolved',
    run_id: 'run:1',
  };
  snap.analysis_state['file:a'] = {
    file_id: 'file:a',
    completeness: 'full',
    diagnostics_json: '[]',
    updated_at: 1000,
  };
  snap.analysis_state['file:b'] = {
    file_id: 'file:b',
    completeness: 'full',
    diagnostics_json: '[]',
    updated_at: 1000,
  };
  return snap;
}

test('createIndexQuerySurface executes symbolById, symbolsByName, symbolsInFile, neighbors, fileDependencies, and filesUnder', () => {
  const snap = createPopulatedSnapshot();
  const query = createIndexQuerySurface(() => snap, { getByteSize: () => 4096 });

  const alpha = query.symbolById('sym:alpha');
  assert.equal(alpha.name, 'alpha');
  assert.equal(alpha.fileId, 'file:a');

  const prefixSearch = query.symbolsByName('alp', { kinds: ['function'], limit: 10 });
  assert.equal(prefixSearch.ok, true);
  assert.equal(prefixSearch.total, 1);
  assert.equal(prefixSearch.items[0].symbolId, 'sym:alpha');
  assert.equal(prefixSearch.scope, 'complete');

  const inFileA = query.symbolsInFile('file:a');
  assert.equal(inFileA.total, 1);
  assert.equal(inFileA.items[0].symbolId, 'sym:alpha');

  const outgoing = query.neighbors('sym:alpha', { direction: 'outgoing', types: ['calls'] });
  assert.equal(outgoing.total, 1);
  assert.equal(outgoing.items[0].to, 'sym:beta');

  const incoming = query.neighbors('sym:beta', { direction: 'incoming', statuses: ['resolved'] });
  assert.equal(incoming.total, 1);
  assert.equal(incoming.items[0].from, 'sym:alpha');

  const deps = query.fileDependencies('file:a', 'outgoing');
  assert.equal(deps.total, 1);
  assert.equal(deps.items[0].toFile, 'file:b');

  const under = query.filesUnder('src/core');
  assert.equal(under.total, 2);

  const stats = query.stats();
  assert.equal(stats.fileCount, 2);
  assert.equal(stats.symbolCount, 2);
  assert.equal(stats.relationshipCount, 1);
  assert.equal(stats.byteSize, 4096);
  assert.equal(stats.scope, 'complete');

  const health = query.health();
  assert.equal(health.ok, true);
  assert.equal(health.integrity, 'ok');
});

test('createIndexQuerySurface degrades scope to stale when disk hash differs from indexed content_hash', () => {
  const snap = createPopulatedSnapshot();
  const query = createIndexQuerySurface(() => snap, {
    getDiskHashes: () => ({ 'file:a': 'sha256:modified-on-disk' }),
  });

  const search = query.symbolsByName('a');
  assert.equal(search.scope, 'stale');
  const health = query.health();
  assert.equal(health.staleFileCount, 1);
  assert.deepEqual(health.staleFileIds, ['file:a']);
});

test('computeLogicalIndexHash ignores volatile timestamps and run_id, and integrates with Phase 7 createIndexEvidenceSource', () => {
  const snap1 = createPopulatedSnapshot();
  const snap2 = createPopulatedSnapshot();
  snap2.meta.updated_at = 999999;
  snap2.files['file:a'].indexed_at = 999999;
  snap2.files['file:a'].run_id = 'run:different';

  assert.equal(computeLogicalIndexHash(snap1), computeLogicalIndexHash(snap2));

  const query = createIndexQuerySurface(() => snap1);
  const evidenceSource = createIndexEvidenceSource({
    ...query,
    scope: query.stats().scope,
  });
  assert.equal(evidenceSource.snapshot(['sym:alpha']).scope, 'complete');
  assert.equal(evidenceSource.callsByFrom('sym:alpha').length, 1);
  assert.equal(evidenceSource.callsByTo('sym:beta').length, 1);
});
