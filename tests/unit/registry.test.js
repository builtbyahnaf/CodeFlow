import test from 'node:test';
import assert from 'node:assert/strict';

import { createAdapterRegistry, createCapabilities } from '../../src/core/adapterRegistry.js';
import { createCancellationSource } from '../../src/core/csr/cancellation.js';
import { createMockAnalysis, mockAdapter } from '../../src/adapters/mock/index.js';
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
  assert.throws(
    () => fresh.register({ ...mockAdapter, extensions: [] }),
    /at least one file extension/,
  );
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

test('a throwing adapter is contained as a partial run', async () => {
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
  assert.equal(result.ok, true);
  assert.equal(result.run.completeness, 'partial');
  assert.equal(result.degraded.code, 'E_ADAPTER');
  assert.match(result.degraded.message, /kaboom/);
  assert.equal(result.run.diagnostics[0].code, 'E_ADAPTER');
});

test('defensive validation drops invalid records and reports them', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'sloppy',
    extensions: ['.sloppy'],
    analyze(input) {
      const run = createAnalysisRun({
        runId: input.runId,
        adapterId: 'sloppy',
        language: 'mock',
      });
      run.symbols.push({
        symbolId: 's',
        kind: 'hologram',
        name: 's',
        qualifiedName: 's',
        language: 'mock',
        declaration: { fileId: 'missing', startLine: 0, startColumn: 0, endLine: 1, endColumn: 0 },
      });
      return run;
    },
  });

  const result = await registry.analyze({ path: 'x.sloppy', runId: 'run:test' });
  assert.equal(result.ok, true);
  assert.equal(result.degraded.code, 'E_VALIDATION');
  assert.ok(Array.isArray(result.issues));
  assert.ok(result.issues.length >= 2);
  assert.equal(result.dropped.length, 1);
  assert.equal(result.run.symbols.length, 0);
  assert.equal(result.run.completeness, 'partial');
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'csr_record_dropped'));
});

test('strict validation rejects the same output', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'sloppy-strict',
    extensions: ['.sloppystrict'],
    analyze(input) {
      const run = createAnalysisRun({
        runId: input.runId,
        adapterId: 'sloppy-strict',
        language: 'mock',
      });
      run.symbols.push({
        symbolId: 's',
        kind: 'hologram',
        name: 's',
        qualifiedName: 's',
        language: 'mock',
        declaration: { fileId: 'missing', startLine: 0, startColumn: 0, endLine: 1, endColumn: 0 },
      });
      return run;
    },
  });

  const result = await registry.analyze(
    { path: 'x.sloppystrict', runId: 'run:test' },
    { mode: 'strict' },
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_VALIDATION');
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

test("the 'partial' capability value is preserved, not flattened to true", () => {
  const capabilities = createCapabilities({ resolveCalls: 'partial', parse: true });
  assert.equal(capabilities.resolveCalls, 'partial');
  assert.equal(capabilities.parse, true);
  assert.equal(capabilities.generateCFG, false);
});

test('invalid analyze input fails before an adapter is chosen', async () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const result = await registry.analyze({ path: '', runId: '' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_INPUT');
  assert.equal(result.issues.length, 2);
});

test('a pre-cancelled analysis returns a partial run, not a rejection', async () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const source = createCancellationSource();
  source.cancel('user');
  const result = await registry.analyze({
    path: 'sample.mock',
    runId: 'run:cancel',
    cancellation: source.token,
  });
  assert.equal(result.ok, true);
  assert.equal(result.degraded.code, 'E_CANCELLED');
  assert.equal(result.run.completeness, 'partial');
  assert.equal(result.run.diagnostics[0].code, 'E_CANCELLED');
});

test('cancellation is passed to the adapter and observed mid-flight', async () => {
  const registry = createAdapterRegistry();
  const source = createCancellationSource();
  /** @type {unknown} */
  let received;
  registry.register({
    ...mockAdapter,
    id: 'observes-cancel',
    extensions: ['.observe'],
    analyze(input) {
      received = input.cancellation;
      source.cancel('mid-flight');
      return createMockAnalysis();
    },
  });

  const result = await registry.analyze({
    path: 'x.observe',
    runId: 'run:test',
    cancellation: source.token,
  });
  assert.equal(received, source.token);
  assert.equal(result.ok, true);
  assert.equal(result.degraded.code, 'E_CANCELLED');
});

test('a 1.0.0 adapter result is migrated before validation', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'legacy',
    extensions: ['.legacy'],
    analyze() {
      const run = structuredClone(createMockAnalysis());
      run.csrVersion = '1.0.0';
      run.adapterId = 'legacy';
      run.runId = 'run:test';
      for (const symbol of run.symbols) {
        symbol.range = symbol.declaration;
        delete symbol.declaration;
      }
      return run;
    },
  });

  const result = await registry.analyze({ path: 'x.legacy', runId: 'run:test' });
  assert.equal(result.ok, true, result.ok ? '' : JSON.stringify(result));
  assert.equal(result.run.csrVersion, '1.1.0');
});

test('an adapter that returns a different runId is rejected', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'wrong-run-id',
    extensions: ['.wrongrun'],
    analyze() {
      return { ...createMockAnalysis(), adapterId: 'wrong-run-id' };
    },
  });
  const result = await registry.analyze({ path: 'x.wrongrun', runId: 'run:expected' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_VALIDATION');
  assert.match(result.message, /runId/);
});

test('oversized adapter output is refused with E_LIMIT', async () => {
  const registry = createAdapterRegistry();
  registry.register({
    ...mockAdapter,
    id: 'huge',
    extensions: ['.huge'],
    analyze(input) {
      const run = createAnalysisRun({
        runId: input.runId,
        adapterId: 'huge',
        language: 'mock',
      });
      for (let index = 0; index < 5_001; index += 1) {
        run.files.push({
          fileId: `file:f${index}`,
          path: `f${index}.huge`,
          language: 'mock',
          contentHash: 'x',
          sizeBytes: 0,
          lineCount: 1,
          generated: false,
        });
      }
      return run;
    },
  });
  const result = await registry.analyze({ path: 'x.huge', runId: 'run:test' });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_LIMIT');
  assert.equal(result.issues[0].code, 'E_LIMIT');
});

test('dryRun maps files to adapters without analysing', () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const result = registry.dryRun(['sample.mock', 'src/a.cpp', '']);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, [
    { path: 'sample.mock', adapterId: 'mock' },
    { path: 'src/a.cpp', adapterId: null },
    { path: '', adapterId: null },
  ]);
});

test('registry.query exposes the adapter capabilities to the query layer', () => {
  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  const run = createMockAnalysis();
  const query = registry.query(run);
  const main = run.symbols.find((symbol) => symbol.name === 'main');
  assert.equal(query.callees(main.symbolId).ok, true);
  // The mock does not declare generateCFG, so constructs degrade honestly.
  const constructs = query.constructsOf(main.symbolId);
  assert.equal(constructs.ok, false);
  assert.equal(constructs.code, 'E_UNSUPPORTED');
});
