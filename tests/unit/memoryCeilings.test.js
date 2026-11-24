import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SUBSYSTEM_CAPS,
  BoundedLruCache,
} from '../../src/core/perf/index.js';

describe('Memory Ceilings & Bounded Cache Eviction (Phase 12 §10.3, P12-22)', () => {
  it('enforces hard capacity ceiling and evicts oldest items', () => {
    const cache = new BoundedLruCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    assert.equal(cache.size, 3);
    assert.equal(cache.evictionCount, 0);

    // Insert 4th item -> should evict 'a'
    cache.set('d', 4);
    assert.equal(cache.size, 3);
    assert.equal(cache.evictionCount, 1);
    assert.equal(cache.has('a'), false);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
    assert.equal(cache.get('d'), 4);
  });

  it('reading an item updates its LRU recency to prevent premature eviction', () => {
    const cache = new BoundedLruCache(3);
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);

    // Access 'a' to make it most recently used
    assert.equal(cache.get('a'), 1);

    // Insert 'd' -> 'b' should now be the oldest and evicted, not 'a'
    cache.set('d', 4);
    assert.equal(cache.has('b'), false);
    assert.equal(cache.has('a'), true);
  });

  it('survives 300 repeated insert and query cycles without unbounded growth', () => {
    for (const [subsystem, cap] of Object.entries(SUBSYSTEM_CAPS)) {
      const cache = new BoundedLruCache(cap);
      for (let i = 0; i < 300; i++) {
        cache.set(`key_${i}`, { data: new Array(10).fill(i) });
        if (i % 5 === 0) {
          cache.get(`key_${Math.max(0, i - 2)}`);
        }
      }
      assert.equal(cache.size, cap, `Subsystem ${subsystem} exceeded its ceiling`);
      assert.equal(cache.evictionCount, 300 - cap);
    }
  });

  it('rejects invalid capacity inputs with an error', () => {
    assert.throws(() => new BoundedLruCache(0), /positive integer/);
    assert.throws(() => new BoundedLruCache(-5), /positive integer/);
    assert.throws(() => new BoundedLruCache(3.14), /positive integer/);
  });
});
