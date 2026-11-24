import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import { createIndexStore, createMemoryFsAdapter } from '../../src/storage/indexStore.js';
import { createIndexingPipeline } from '../../src/extension/indexing/pipeline.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { createCallGraphQueryService } from '../../src/core/graph/calls/query.js';
import { createIndexEvidenceSource } from '../../src/core/graph/calls/sources.js';

function createWorkspaceHarness(fileMap, configOverrides = {}) {
  const memFs = createMemoryFsAdapter();
  const root = '/workspace/bench';
  if (Object.keys(configOverrides).length > 0) {
    memFs.writeFileSync(
      `${root}/.codeflow/config.json`,
      JSON.stringify({ version: 1, ...configOverrides }),
    );
  }

  // Snapshot original file map to verify source immutability (AC-8.5)
  const originalFiles = new Map(Object.entries(fileMap));
  let analyzeCalls = 0;

  const store = createIndexStore({
    workspaceRoot: root,
    fsAdapter: memFs,
    clock: () => 50_000,
    pid: 777,
    hostname: 'test-host',
  });

  const pipeline = createIndexingPipeline({
    store,
    listWorkspaceFiles: async () =>
      Object.entries(fileMap).map(([relPath, content]) => ({
        path: relPath,
        sizeBytes: Buffer.byteLength(content, 'utf8'),
      })),
    readWorkspaceFile: async (relPath) => fileMap[relPath],
    analyzeFile: async ({ path: relPath, source, runId }) => {
      analyzeCalls += 1;
      const run = javascriptAdapter.analyze({
        runId,
        path: relPath,
        text: source,
      });
      return { ok: true, run };
    },
    clock: () => 50_000 + analyzeCalls,
  });

  return {
    memFs,
    root,
    store,
    pipeline,
    originalFiles,
    getAnalyzeCalls: () => analyzeCalls,
    resetAnalyzeCalls: () => {
      analyzeCalls = 0;
    },
  };
}

test('indexing pipeline indexes a multi-file workspace, upgrades cross-file call graphs to complete, is idempotent on re-run, and never modifies workspace source files (AC-8.2, AC-8.3, AC-8.5)', async () => {
  const fileMap = {
    'src/math.js': 'export function add(a, b) {\n  return a + b;\n}\n',
    'src/calc.js':
      "import { add } from './math.js';\nexport function compute(x) {\n  return add(x, 10);\n}\n",
    'node_modules/ignored/index.js': 'export function nope() {}\n',
  };

  const harness = createWorkspaceHarness(fileMap);
  const firstRun = await harness.pipeline.runIndexing();

  assert.equal(firstRun.ok, true);
  assert.equal(firstRun.state, 'complete');
  assert.equal(firstRun.analyzedFiles, 2);
  assert.equal(firstRun.excludedFiles, 1);
  assert.equal(harness.getAnalyzeCalls(), 2);

  const hashAfterFirst = harness.store.logicalHash();
  const stats = harness.store.stats();
  assert.equal(stats.fileCount, 2);
  assert.ok(stats.symbolCount >= 2);
  assert.equal(stats.scope, 'complete');

  // Re-run without changes: zero files re-analyzed, identical logicalHash (AC-8.3, P8-09)
  harness.resetAnalyzeCalls();
  const secondRun = await harness.pipeline.runIndexing();
  assert.equal(secondRun.ok, true);
  assert.equal(secondRun.analyzedFiles, 0);
  assert.equal(secondRun.skippedUnchanged, 2);
  assert.equal(harness.getAnalyzeCalls(), 0);
  assert.equal(harness.store.logicalHash(), hashAfterFirst);

  // Verify source-file immutability: no workspace source file was touched or created outside .codeflow/ (AC-8.5)
  for (const [relPath, originalContent] of harness.originalFiles.entries()) {
    assert.equal(fileMap[relPath], originalContent);
  }
  for (const writtenPath of harness.memFs.files.keys()) {
    assert.ok(
      writtenPath.includes('/.codeflow/'),
      `unexpected write outside .codeflow/: ${writtenPath}`,
    );
  }

  // Verify Phase 7 cross-file call graph integration upgrades scope to complete
  const calcRun = javascriptAdapter.analyze({
    runId: 'run:calc-active',
    path: 'src/calc.js',
    text: fileMap['src/calc.js'],
    jsModules: [{ path: 'src/math.js', text: fileMap['src/math.js'], moduleKind: 'module' }],
    jsResolutions: [
      { from: 'src/calc.js', specifier: './math.js', status: 'resolved', path: 'src/math.js' },
    ],
  });
  const query = createQueryLayer(calcRun, { capabilities: javascriptAdapter.capabilities });
  const callService = createCallGraphQueryService({
    query,
    indexSource: createIndexEvidenceSource({
      ...harness.store,
      scope: harness.store.stats().scope,
    }),
  });
  const computeSym = calcRun.symbols.find((s) => s.name === 'compute');
  const outgoing = callService.outgoing(computeSym.symbolId);
  assert.equal(outgoing.ok, true);
  assert.equal(outgoing.scope, 'complete');
});

test('indexing pipeline supports mid-run cancellation, preserves committed batches, and resumes remaining files (AC-8.4)', async () => {
  /** @type {Record<string, string>} */
  const fileMap = {};
  for (let i = 0; i < 15; i += 1) {
    fileMap[`src/mod_${String(i).padStart(2, '0')}.js`] =
      `export function fn_${i}(v) { return v + ${i}; }\n`;
  }

  const harness = createWorkspaceHarness(fileMap, { batchSize: 5 });
  const token = { isCancelled: false };

  const cancelledRun = await harness.pipeline.runIndexing({
    token,
    onProgress: (progress) => {
      if (progress.batchIndex === 1) {
        token.isCancelled = true;
      }
    },
  });

  assert.equal(cancelledRun.ok, true);
  assert.equal(cancelledRun.cancelled, true);
  assert.equal(cancelledRun.state, 'cancelled');
  assert.equal(cancelledRun.analyzedFiles, 5);
  assert.equal(harness.store.stats().fileCount, 5);

  // Resume run: skips the 5 already-committed files and indexes the remaining 10
  harness.resetAnalyzeCalls();
  const resumedRun = await harness.pipeline.runIndexing();
  assert.equal(resumedRun.ok, true);
  assert.equal(resumedRun.cancelled, false);
  assert.equal(resumedRun.state, 'complete');
  assert.equal(resumedRun.skippedUnchanged, 5);
  assert.equal(resumedRun.analyzedFiles, 10);
  assert.equal(harness.getAnalyzeCalls(), 10);
  assert.equal(harness.store.stats().fileCount, 15);
});

test('indexing pipeline handles file deletion cascade, file rename, maxFileSizeKb budget cap, and stressCeilingFiles limit', async () => {
  const fileMap = {
    'src/keep.js': 'export function keep() { return 1; }\n',
    'src/remove.js': 'export function removeMe() { return 2; }\n',
    'src/huge.js': `export function huge() { return "${'x'.repeat(2048)}"; }\n`,
  };

  const harness = createWorkspaceHarness(fileMap, { maxFileSizeKb: 1 });
  const initial = await harness.pipeline.runIndexing();
  assert.equal(initial.ok, true);
  assert.equal(initial.state, 'partial', 'oversized file marks index state partial');
  assert.ok(harness.store.symbolsByName('removeMe').total === 1);

  // Delete src/remove.js and rename src/keep.js -> src/renamed.js
  delete fileMap['src/remove.js'];
  fileMap['src/renamed.js'] = fileMap['src/keep.js'];
  delete fileMap['src/keep.js'];

  const updated = await harness.pipeline.runIndexing();
  assert.equal(updated.ok, true);
  assert.equal(updated.deletedFiles, 1);
  assert.equal(updated.renamedFiles, 1);
  assert.equal(harness.store.symbolsByName('removeMe').total, 0);
  assert.equal(harness.store.symbolsByName('keep').total, 1);
});

test('unindexed mode parity: single-file CFG and call graph work without .codeflow/ present (AC-8.1)', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:unindexed-parity',
    path: 'src/standalone.js',
    text: 'function helper(x) { return x > 0 ? x : -x; }\nfunction entry(n) { return helper(n); }\n',
  });
  const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
  const helperSym = run.symbols.find((s) => s.name === 'helper');
  const entrySym = run.symbols.find((s) => s.name === 'entry');

  const cfgRes = buildCfg(query, helperSym.symbolId);
  assert.equal(cfgRes.ok, true);
  assert.ok(cfgRes.cfg.nodes.length >= 3);

  const callService = createCallGraphQueryService({ query, indexSource: null });
  const outgoing = callService.outgoing(entrySym.symbolId);
  assert.equal(outgoing.ok, true);
  assert.equal(outgoing.scope, 'same_file_only');
  assert.equal(outgoing.total, 1);
});

test('repository tier benchmark: 100-file and 1,000-file indexing, query latency (<50ms), and 50,000-file stress-ceiling refusal', async () => {
  // Tier 1: 100 files
  /** @type {Record<string, string>} */
  const tier1Files = {};
  for (let i = 0; i < 100; i += 1) {
    tier1Files[`src/pkg_${i % 10}/mod_${i}.js`] =
      `export function work_${i}(x) {\n  return x + ${i};\n}\n`;
  }
  const t1Start = performance.now();
  const h1 = createWorkspaceHarness(tier1Files, { batchSize: 50 });
  const r1 = await h1.pipeline.runIndexing();
  const t1Ms = performance.now() - t1Start;
  assert.equal(r1.ok, true);
  assert.equal(r1.analyzedFiles, 100);
  assert.ok(t1Ms < 5_000, `expected 100-file index < 5000ms, got ${t1Ms.toFixed(2)}ms`);

  // Tier 2: 1,000 files
  /** @type {Record<string, string>} */
  const tier2Files = {};
  for (let i = 0; i < 1000; i += 1) {
    tier2Files[`src/pkg_${i % 20}/mod_${i}.js`] =
      `export function fn_${i}(a) { return a * ${i}; }\n`;
  }
  const t2Start = performance.now();
  const h2 = createWorkspaceHarness(tier2Files, { batchSize: 100 });
  const r2 = await h2.pipeline.runIndexing();
  const t2Ms = performance.now() - t2Start;
  assert.equal(r2.ok, true);
  assert.equal(r2.analyzedFiles, 1000);
  assert.ok(t2Ms < 30_000, `expected 1000-file index < 30000ms, got ${t2Ms.toFixed(2)}ms`);

  // Query latency over 1,000-file index (< 50 ms p95 budget)
  const qStart = performance.now();
  const searchRes = h2.store.symbolsByName('fn_50', { limit: 25 });
  const qMs = performance.now() - qStart;
  assert.equal(searchRes.ok, true);
  assert.ok(searchRes.total >= 11);
  assert.ok(qMs < 50, `expected query latency < 50ms, got ${qMs.toFixed(2)}ms`);

  // Stress tier: 50,000 candidates gracefully refused with E_LIMIT
  const stressStore = createIndexStore({
    workspaceRoot: '/workspace/stress',
    fsAdapter: createMemoryFsAdapter(),
  });
  const stressPipeline = createIndexingPipeline({
    store: stressStore,
    listWorkspaceFiles: async () =>
      Array.from({ length: 50_000 }, (_, idx) => ({ path: `src/f_${idx}.js`, sizeBytes: 64 })),
    readWorkspaceFile: async () => '',
    analyzeFile: async () => ({ ok: false, code: 'E_SKIP', message: 'unused' }),
  });
  const stressRes = await stressPipeline.runIndexing();
  assert.equal(stressRes.ok, false);
  assert.equal(stressRes.code, 'E_LIMIT');
});
