import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_INDEX_CONFIG,
  isSafeGlobPattern,
  normalizeIndexConfig,
} from '../../src/core/indexing/config.js';

test('normalizeIndexConfig returns defaults when config is missing or malformed JSON (fail-soft)', () => {
  const empty = normalizeIndexConfig(undefined);
  assert.deepEqual(empty.config, DEFAULT_INDEX_CONFIG);
  assert.deepEqual(empty.diagnostics, []);

  const brokenJson = normalizeIndexConfig('{ "version": 1, bad json ');
  assert.deepEqual(brokenJson.config, DEFAULT_INDEX_CONFIG);
  assert.equal(brokenJson.diagnostics.length, 1);
  assert.equal(brokenJson.diagnostics[0].code, 'invalid_index_config');
});

test('isSafeGlobPattern and normalizeIndexConfig reject path traversal, absolute paths, and NUL bytes', () => {
  assert.equal(isSafeGlobPattern('src/**/*.js'), true);
  assert.equal(isSafeGlobPattern('../outside/**'), false);
  assert.equal(isSafeGlobPattern('/etc/passwd'), false);
  assert.equal(isSafeGlobPattern('C:\\Windows\\**'), false);
  assert.equal(isSafeGlobPattern('src/\0bad.js'), false);

  const normalized = normalizeIndexConfig({
    version: 1,
    include: ['src/**/*.js', '../escape/**', '/abs/path/**'],
    exclude: ['vendor/**', 'C:/outside/**'],
    maxFileSizeKb: 999999,
    batchSize: 1,
    maxConcurrency: 99,
  });

  assert.deepEqual(normalized.config.include, ['src/**/*.js']);
  assert.ok(normalized.config.exclude.includes('vendor/**'));
  assert.ok(!normalized.config.exclude.includes('C:/outside/**'));
  assert.equal(normalized.config.maxFileSizeKb, 16384);
  assert.equal(normalized.config.batchSize, 5);
  assert.equal(normalized.config.maxConcurrency, 8);
  assert.equal(normalized.diagnostics.filter((d) => d.code === 'unsafe_index_pattern').length, 3);
});
