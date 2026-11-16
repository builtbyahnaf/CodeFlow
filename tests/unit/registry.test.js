import test from 'node:test';
import assert from 'node:assert/strict';

import { createAdapterRegistry, createCapabilities } from '../../src/core/adapterRegistry.js';
import { mockAdapter } from '../../src/adapters/mock/index.js';
import { createAnalysisRun } from '../../src/core/csr/entities.js';

test('registers and resolves an adapter by extension', () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);

  assert.equal(registry.list().length, 1);
  assert.equal(registry.resolve('sample.mock')?.id, 'mock');
  assert.equal(registry.resolve('src/a.js'), null);
  assert.equal(registry.resolve(''), null);
  assert.equal(registry.resolve(undefined), null);
});

test('the longest matching extension wins', () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'short',
    extensions: ['.js'],
  });
  registry.register({
    ...mockAdapter,
    id: 'long',
    extensions: ['.d.ts.js'],
  });

  assert.equal(registry.resolve('types/a.d.ts.js')?.id, 'long');
  assert.equal(registry.resolve('src/a.js')?.id, 'short');
});

test('rejects duplicate ids and malformed descriptors', () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  assert.throws(() => registry.register(mockAdapter), /already registered/);

  const fresh = createAdapterRegistry();
  assert.throws(() => fresh.register({ ...mockAdapter, id: '' }), /non-empty id/);
  assert.throws(() => fresh.register({ ...mockAdapter, extensions: [] }), /at least one file extension/);
  assert.throws(() => fresh.register({ ...mockAdapter, extensions: ['.JS'] }), /lower case/);
  assert.throws(() => fresh.register({ ...mockAdapter, extensions: ['js'] }), /leading dot/);
  assert.throws(() => fresh.register({ ...mockAdapter, analyze: undefined }), /analyze function/);
});

test('analyze returns a validated run with timing', async () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);

  const result = await registry.analyze({ path: 'sample.mock', runId: 'run:test' });
  assert.equal(result.ok, true);
  assert.equal(result.adapterId, 'mock');
  assert.equal(result.run.runId, 'run:test');
  assert.ok(result.durationMs >= 0);
});

test('analyze reports unsupported files instead of throwing', async () => {
  const registry = createAdapterRegistry();
  const result = await registry.analyze({ path: 'src/a.cpp', runId: 'run:test' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
});

test('a throwing adapter is contained as E_ADAPTER', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'explodes',
    extensions: ['.boom'],
    analyze() {
      throw new Error('kaboom');
    },
  });

  const result = await registry.analyze({ path: 'x.boom', runId: 'run:test' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_ADAPTER');
  assert.match(result.message, /kaboom/);
});

test('invalid adapter output is rejected as E_VALIDATION with issues', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'sloppy',
    extensions: ['.sloppy'],
    analyze() {
      const run = createAnalysisRun({ runId: 'run:x', adapterId: 'sloppy', language: 'mock' });
      run.symbols.push({
        symbolId: 's',
        kind: 'hologram',
        name: 's',
        qualifiedName: 's',
        declaration: { fileId: 'missing', startLine: 0, startColumn: 0, endLine: 1, endColumn: 0 },
      });
      return run;
    },
  });

  const result = await registry.analyze({ path: 'x.sloppy', runId: 'run:test' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_VALIDATION');
  assert.ok(Array.isArray(result.issues));
  assert.ok(result.issues.length >= 2);
});

test('capabilities are normalised to booleans', () => {
  const capabilities = createCapabilities({ parse: true, generateCFG: 'yes' });
  assert.equal(capabilities.parse, true);
  assert.equal(capabilities.generateCFG, false);
  assert.equal(capabilities.generateDFG, false);

  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const matrix = registry.capabilityMatrix();
  assert.equal(matrix.length, 1);
  assert.deepEqual(matrix[0].languages, ['mock']);
  assert.equal(matrix[0].capabilities.parse, true);
  assert.equal(matrix[0].capabilities.generateCFG, false);
});
