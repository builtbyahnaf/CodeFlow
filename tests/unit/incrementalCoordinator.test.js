import test from 'node:test';
import assert from 'node:assert/strict';

import { createIndexStore, createMemoryFsAdapter } from '../../src/storage/indexStore.js';
import { createIndexingPipeline } from '../../src/extension/indexing/pipeline.js';
import {
  CHANGE_KINDS,
  INVALIDATION_CLASSES,
  createIncrementalCoordinator,
} from '../../src/core/indexing/index.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';

function createCoordinatorHarness(initialFiles) {
  const memFs = createMemoryFsAdapter();
  const root = '/workspace/inc';
  const files = { ...initialFiles };
  /** @type {string[]} */
  const analyzedLog = [];
  let failPath = null;

  const store = createIndexStore({
    workspaceRoot: root,
    fsAdapter: memFs,
    clock: () => 10_000,
    pid: 900,
    hostname: 'inc-host',
  });

  function analyzeWithImports({ path: relPath, source, runId }) {
    if (failPath === relPath) {
      return { ok: false, code: 'E_SYNTAX', message: 'Injected failure' };
    }
    analyzedLog.push(relPath);
    // Provide only actually imported modules in jsModules/jsResolutions
    const jsResolutions = [];
    const jsModules = [];
    for (const match of source.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) {
      const spec = match[1];
      const resolvedPath = `src/${spec.slice(2)}`;
      if (files[resolvedPath]) {
        jsResolutions.push({
          from: relPath,
          specifier: spec,
          status: 'resolved',
          path: resolvedPath,
        });
        jsModules.push({
          path: resolvedPath,
          text: files[resolvedPath],
          moduleKind: 'module',
        });
      }
    }
    const run = javascriptAdapter.analyze({
      runId,
      path: relPath,
      text: source,
      jsModules,
      jsResolutions,
    });
    return { ok: true, run };
  }

  const pipeline = createIndexingPipeline({
    store,
    listWorkspaceFiles: async () =>
      Object.entries(files).map(([p, text]) => ({
        path: p,
        sizeBytes: Buffer.byteLength(text, 'utf8'),
      })),
    readWorkspaceFile: async (p) => files[p],
    analyzeFile: async (input) => analyzeWithImports(input),
  });

  const coordinator = createIncrementalCoordinator({
    store,
    listWorkspaceFiles: async () =>
      Object.entries(files).map(([p, text]) => ({
        path: p,
        sizeBytes: Buffer.byteLength(text, 'utf8'),
      })),
    readWorkspaceFile: async (p) => files[p],
    analyzeFile: async (input) => analyzeWithImports(input),
  });

  return {
    memFs,
    root,
    files,
    store,
    pipeline,
    coordinator,
    analyzedLog,
    setFailPath(target) {
      failPath = target;
    },
  };
}

test('incremental coordinator retains unaffected dependents on local comment/body edits and cascades on dependent signature edits (AC-9.1, AC-9.2)', async () => {
  const harness = createCoordinatorHarness({
    'src/math.js': 'export function add(a, b) {\n  return a + b;\n}\n',
    'src/consumer.js':
      "import { add } from './math.js';\nexport function calc(x) {\n  return add(x, 1);\n}\n",
    'src/unrelated.js': 'export function solo() {\n  return 42;\n}\n',
  });

  await harness.pipeline.runIndexing();
  harness.analyzedLog.length = 0;

  // 1. Comment-only edit in src/math.js -> local classification, 0 dependents re-analyzed (AC-9.2)
  harness.files['src/math.js'] =
    '// leading comment\nexport function add(a, b) {\n  return a + b;\n}\n';
  const commentRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/math.js',
  });
  assert.equal(commentRes.ok, true);
  assert.equal(commentRes.classification.scopeClass, INVALIDATION_CLASSES.LOCAL);
  assert.deepEqual(harness.analyzedLog, ['src/math.js']);

  // 2. Function body edit in src/math.js (signature unchanged) -> local classification, 0 dependents re-analyzed
  harness.analyzedLog.length = 0;
  harness.files['src/math.js'] =
    'export function add(a, b) {\n  const sum = a + b;\n  return sum;\n}\n';
  const bodyRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/math.js',
  });
  assert.equal(bodyRes.ok, true);
  assert.equal(bodyRes.classification.scopeClass, INVALIDATION_CLASSES.LOCAL);
  assert.deepEqual(harness.analyzedLog, ['src/math.js']);

  // 3. Exported symbol added in src/math.js -> dependent classification, src/consumer.js re-analyzed, src/unrelated.js untouched!
  harness.analyzedLog.length = 0;
  harness.files['src/math.js'] =
    'export function add(a, b) {\n  return a + b;\n}\nexport function mul(a, b) {\n  return a * b;\n}\n';
  const sigRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/math.js',
  });
  assert.equal(sigRes.ok, true);
  assert.equal(sigRes.classification.scopeClass, INVALIDATION_CLASSES.DEPENDENT);
  assert.deepEqual(harness.analyzedLog, ['src/math.js', 'src/consumer.js']);
  assert.ok(!harness.analyzedLog.includes('src/unrelated.js'));
});

test('incremental coordinator handles dirty-buffer provisional overlay, stale-on-failure preservation, config exclusion reconciliation, and clean dispose (P9-04, P9-08, P9-09, AC-9.6, AC-9.9)', async () => {
  const harness = createCoordinatorHarness({
    'src/a.js': 'export function alpha() { return 1; }\n',
    'src/b.js': 'export function beta() { return 2; }\n',
  });
  await harness.pipeline.runIndexing();

  // Dirty edit writes to provisional overlay only, leaving store untouched
  const dirtyRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_DIRTY,
    path: 'src/a.js',
    text: 'export function alpha() { return 1; }\nexport function dirtyDraft() { return 99; }\n',
    dirty: true,
  });
  assert.equal(dirtyRes.ok, true);
  assert.equal(dirtyRes.provisional, true);
  assert.equal(harness.store.symbolsByName('dirtyDraft').total, 0);
  const effectiveSnap = harness.coordinator.getEffectiveSnapshot();
  assert.ok(
    Object.values(effectiveSnap.symbols).some((s) => s.name === 'dirtyDraft' && s.provisional),
  );

  // Save reconciles provisional overlay into authoritative store
  harness.files['src/a.js'] =
    'export function alpha() { return 1; }\nexport function savedFn() { return 100; }\n';
  const savedRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/a.js',
  });
  assert.equal(savedRes.ok, true);
  assert.equal(harness.coordinator.provisional.count(), 0);
  assert.equal(harness.store.symbolsByName('savedFn').total, 1);

  // Injected analysis failure preserves previous rows and marks file stale (P9-09)
  harness.setFailPath('src/a.js');
  harness.files['src/a.js'] = 'export function broken(';
  const failRes = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.EDITOR_SAVE,
    path: 'src/a.js',
  });
  assert.equal(failRes.ok, false);
  assert.equal(failRes.staleMarked, true);
  assert.equal(failRes.preservedPreviousRows, true);
  assert.equal(harness.coordinator.isFileStale('file:src/a.js'), true);
  assert.equal(
    harness.store.symbolsByName('savedFn').total,
    1,
    'previous authoritative rows must be retained on analysis failure',
  );
  harness.setFailPath(null);

  // Config-change reconciliation: excluding src/b.js removes its rows; removing exclusion re-indexes it (P9-04)
  harness.memFs.writeFileSync(
    `${harness.root}/.codeflow/config.json`,
    JSON.stringify({ version: 1, exclude: ['src/b.js'] }),
  );
  harness.store.open();
  const excludedRecon = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.CONFIG_CHANGE,
  });
  assert.equal(excludedRecon.removedExcludedCount, 1);
  assert.equal(harness.store.symbolsByName('beta').total, 0);

  harness.memFs.writeFileSync(
    `${harness.root}/.codeflow/config.json`,
    JSON.stringify({ version: 1, exclude: [] }),
  );
  harness.store.open();
  const includedRecon = await harness.coordinator.processSingleFileNow({
    kind: CHANGE_KINDS.CONFIG_CHANGE,
  });
  assert.equal(includedRecon.addedIncludedCount, 1);
  assert.equal(harness.store.symbolsByName('beta').total, 1);

  // Clean shutdown leaves 0 queued or in-flight tasks (AC-9.9)
  harness.coordinator.dispose();
  assert.equal(harness.coordinator.queue.stats().queuedCount, 0);
  assert.equal(harness.coordinator.queue.stats().inFlightCount, 0);
});
