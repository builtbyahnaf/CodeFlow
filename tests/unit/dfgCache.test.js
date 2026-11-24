import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { createLruCache, createDfgCache } from '../../src/core/graph/dfg/cache.js';

// ---------------------------------------------------------------------------
// createLruCache
// ---------------------------------------------------------------------------

describe('createLruCache – basic operations', () => {
  it('get returns undefined for missing key', () => {
    const c = createLruCache(3);
    assert.equal(c.get('x'), undefined);
  });

  it('set and get round-trip', () => {
    const c = createLruCache(3);
    c.set('a', 42);
    assert.equal(c.get('a'), 42);
  });

  it('overwrites existing key', () => {
    const c = createLruCache(3);
    c.set('a', 1);
    c.set('a', 2);
    assert.equal(c.get('a'), 2);
    assert.equal(c.size(), 1);
  });

  it('delete removes the key', () => {
    const c = createLruCache(3);
    c.set('a', 1);
    c.delete('a');
    assert.equal(c.get('a'), undefined);
  });

  it('clear empties the cache', () => {
    const c = createLruCache(3);
    c.set('a', 1);
    c.set('b', 2);
    c.clear();
    assert.equal(c.size(), 0);
  });
});

describe('createLruCache – eviction', () => {
  it('evicts LRU entry when capacity exceeded', () => {
    const c = createLruCache(2);
    c.set('a', 1);
    c.set('b', 2);
    c.set('c', 3); // 'a' should be evicted
    assert.equal(c.get('a'), undefined);
    assert.equal(c.get('b'), 2);
    assert.equal(c.get('c'), 3);
  });

  it('touching a key prevents its eviction', () => {
    const c = createLruCache(2);
    c.set('a', 1);
    c.set('b', 2);
    c.get('a');    // touch 'a' → now 'b' is LRU
    c.set('c', 3); // 'b' should be evicted
    assert.equal(c.get('a'), 1);
    assert.equal(c.get('b'), undefined);
    assert.equal(c.get('c'), 3);
  });
});

// ---------------------------------------------------------------------------
// createDfgCache
// ---------------------------------------------------------------------------

describe('createDfgCache', () => {
  function makeDfg(id) {
    return {
      version: 1,
      functionId: id,
      fileId: 'file:a.js',
      nodes: [],
      edges: [],
      partial: false,
      partialReasons: [],
      limitations: [],
      byBinding: {},
    };
  }

  it('calls builder on cache miss', () => {
    let calls = 0;
    const builder = (opts) => { calls++; return makeDfg(opts.functionId); };
    const cache = createDfgCache(builder);
    cache.build('key1', { functionId: 'fn1', fileId: 'f', cfgNodes: [], entryNodeId: 'e', dataFactsMap: new Map(), bindings: [], params: [], calls: [] });
    assert.equal(calls, 1);
  });

  it('returns cached DFG on second call', () => {
    let calls = 0;
    const builder = (opts) => { calls++; return makeDfg(opts.functionId); };
    const cache = createDfgCache(builder);
    const opts = { functionId: 'fn1', fileId: 'f', cfgNodes: [], entryNodeId: 'e', dataFactsMap: new Map(), bindings: [], params: [], calls: [] };
    const a = cache.build('key1', opts);
    const b = cache.build('key1', opts);
    assert.equal(calls, 1);
    assert.equal(a, b); // same reference
  });

  it('invalidate removes the entry', () => {
    let calls = 0;
    const builder = (opts) => { calls++; return makeDfg(opts.functionId); };
    const cache = createDfgCache(builder);
    const opts = { functionId: 'fn1', fileId: 'f', cfgNodes: [], entryNodeId: 'e', dataFactsMap: new Map(), bindings: [], params: [], calls: [] };
    cache.build('fn1', opts);
    cache.invalidate('fn1');
    cache.build('fn1', opts);
    assert.equal(calls, 2);
  });
});
