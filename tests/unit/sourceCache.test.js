import test from 'node:test';
import assert from 'node:assert/strict';

import { createLru } from '../../src/core/source/cache.js';

test('an LRU keeps the most recently used entries', () => {
  const cache = createLru({ maxEntries: 3 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.equal(cache.get('a'), 1);
  cache.set('d', 4);

  assert.equal(cache.get('b'), undefined);
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.get('d'), 4);
  assert.equal(cache.size(), 3);
});

test('a byte budget evicts until the total fits', () => {
  const cache = createLru({ maxEntries: 100, maxBytes: 10 });
  cache.set('a', 'x', 6);
  cache.set('b', 'y', 6);
  assert.equal(cache.get('a'), undefined);
  assert.equal(cache.get('b'), 'y');
  assert.equal(cache.bytes(), 6);
});

test('replacing a key updates the byte total exactly once', () => {
  const cache = createLru({ maxEntries: 10 });
  cache.set('a', 'first', 5);
  cache.set('a', 'second', 8);
  assert.equal(cache.bytes(), 8);
  assert.equal(cache.size(), 1);
  assert.equal(cache.get('a'), 'second');
});

test('deleteByPrefix removes every entry under a file id', () => {
  const cache = createLru({ maxEntries: 10 });
  cache.set('file:a|1', 'one');
  cache.set('file:a|2', 'two');
  cache.set('file:b|1', 'three');
  assert.equal(cache.deleteByPrefix('file:a|'), 2);
  assert.equal(cache.get('file:b|1'), 'three');
  assert.deepEqual(cache.keys(), ['file:b|1']);
});

test('invalid keys are rejected and clear resets the byte total', () => {
  const cache = createLru();
  assert.throws(() => cache.set('', 1), /non-empty strings/);
  cache.set('a', 'x', 4);
  cache.clear();
  assert.equal(cache.size(), 0);
  assert.equal(cache.bytes(), 0);
});
