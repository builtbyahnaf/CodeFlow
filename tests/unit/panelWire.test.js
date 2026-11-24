import test from 'node:test';
import assert from 'node:assert/strict';

import { createPanelWire } from '../../src/extension/panelWire.js';
import { createEnvelope } from '../../src/core/protocol/envelope.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { createMockAnalysis } from '../../src/adapters/mock/index.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';

const flush = () => new Promise((resolve) => setImmediate(resolve));

/**
 * A panel stand-in that mimics the real webview panel: the message
 * subscription lives on `webview`, and the panel itself has no
 * `onDidReceiveMessage`.
 */
function createFakePanel() {
  /** @type {Array<Record<string, unknown>>} */
  const posted = [];
  /** @type {Array<(message: unknown) => void>} */
  const receiveHandlers = [];
  /** @type {Array<() => void>} */
  const disposeHandlers = [];

  const target = {
    webview: {
      onDidReceiveMessage(handler) {
        receiveHandlers.push(handler);
        return { dispose() {} };
      },
      postMessage(message) {
        posted.push(message);
        return Promise.resolve(true);
      },
    },
    onDidDispose(handler) {
      disposeHandlers.push(handler);
      return { dispose() {} };
    },
  };

  return {
    target,
    posted,
    dispose() {
      for (const handler of disposeHandlers) {
        handler();
      }
    },
    /** Deliver a host-bound message, as VS Code would. */
    async receive(message) {
      for (const handler of receiveHandlers) {
        handler(message);
      }
      await flush();
    },
    /** Deliver a request and wait for its response. */
    async request(kind, payload = {}, requestId) {
      const id = requestId ?? `req-${(this.sequence = (this.sequence ?? 0) + 1)}`;
      await this.receive(createEnvelope(kind, payload, id));
      return posted.find(
        (message) => message.requestId === id && message.kind !== 'protocol.error',
      );
    },
    /** Deliver a request and return the raw answer, including protocol.error. */
    async requestRaw(kind, payload = {}, requestId) {
      const id = requestId ?? `req-${(this.sequence = (this.sequence ?? 0) + 1)}`;
      await this.receive(createEnvelope(kind, payload, id));
      return posted.find((message) => message.requestId === id);
    },
  };
}

function createHarness(
  loadRun = async () => ({ ok: true, run: createMockAnalysis() }),
  capabilities = createCapabilities({
    parse: true,
    discoverDeclarations: true,
    resolveCalls: true,
    resolveImports: true,
    mapSourceLocations: true,
    reportDiagnostics: true,
    generateCFG: true,
    generateDFG: true,
  }),
  extra = {},
) {
  /** @type {string[]} */
  const debug = [];
  const wire = createPanelWire({
    logger: {
      debug: (message) => debug.push(message),
      warn() {},
      error() {},
    },
    registry: {
      capabilityMatrix: () => [
        { id: 'mock', languages: ['mock'], capabilities: { ...capabilities } },
      ],
      query: (run) => createQueryLayer(run, { capabilities }),
    },
    extensionVersion: '0.0.1',
    loadRun,
    ...extra,
  });
  return { wire, debug };
}

test('the bridge subscribes on panel.webview, not on the panel', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();

  // The panel deliberately has no onDidReceiveMessage. If the wiring uses the
  // panel, this throws — the exact Phase 0 regression.
  const bridge = wire(panel.target);
  assert.equal(bridge.pendingCount(), 0);

  const response = await panel.request('webview.ready', { client: 'webview' });
  assert.ok(response, 'webview.ready must receive capabilities.data');
  assert.equal(response.kind, 'capabilities.data');
  assert.equal(response.payload.protocolVersion, 1);
  assert.equal(response.payload.demoMode, true);
});

test('graph.load is answered with a graph payload', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('graph.load', { demo: true });
  assert.ok(response);
  assert.equal(response.kind, 'graph.data');
  assert.ok(Array.isArray(response.payload.dto.nodes));
  assert.ok(response.payload.dto.nodes.length > 0);
});

test('cfg.functions lists functions without exposing raw CSR', async () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:cfg',
    path: 'src/classify.js',
    text: 'function classify(n) { if (n) { return 1; } return 0; }\n',
  });
  const { wire } = createHarness(async () => ({ ok: true, run }));
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('cfg.functions', {});
  assert.ok(response);
  assert.equal(response.kind, 'cfg.functions');
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.functions.length, 1);
  const entry = response.payload.functions[0];
  assert.equal(entry.name, 'classify');
  assert.equal(typeof entry.symbolId, 'string');
  assert.ok(entry.range);
});

test('cfg.load answers with a validated CFG DTO', async () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:cfg',
    path: 'src/classify.js',
    text: 'function classify(n) { if (n) { return 1; } return 0; }\n',
  });
  const { wire } = createHarness(async () => ({ ok: true, run }));
  const panel = createFakePanel();
  wire(panel.target);

  const functions = await panel.request('cfg.functions', {});
  const target = functions.payload.functions[0];
  const response = await panel.request('cfg.load', { symbolId: target.symbolId });
  assert.ok(response);
  assert.equal(response.kind, 'cfg.data');
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.dto.dtoKind, 'cfg');
  assert.equal(response.payload.dto.graphKind, 'cfg');
  assert.ok(response.payload.dto.nodes.length > 0);
});

test('cfg.load on a run without constructs is a typed protocol.error', async () => {
  const run = { ...createMockAnalysis(), controlConstructs: [] };
  const { wire } = createHarness(async () => ({ ok: true, run }));
  const panel = createFakePanel();
  wire(panel.target);

  const target = run.symbols.find((symbol) => symbol.name === 'main');
  await panel.receive(createEnvelope('cfg.load', { symbolId: target.symbolId }, 'req-cfg'));
  const error = panel.posted.find((message) => message.requestId === 'req-cfg');
  assert.ok(error);
  assert.equal(error.kind, 'protocol.error');
  assert.equal(error.payload.code, 'E_CFG_UNAVAILABLE');
});

test('csr.load returns the validated run and its deterministic hash', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('csr.load', {});
  assert.ok(response);
  assert.equal(response.kind, 'csr.data');
  assert.equal(response.payload.run.csrVersion, '1.1.0');
  assert.match(response.payload.hash, /^[a-f0-9]{16}$/);
});

test('a failed load becomes a correlated protocol.error', async () => {
  const { wire } = createHarness(async () => ({
    ok: false,
    code: 'E_VALIDATION',
    message: 'bad csr',
    issues: [{ path: 'symbols[0]', message: 'boom' }],
  }));
  const panel = createFakePanel();
  wire(panel.target);

  await panel.receive(createEnvelope('graph.load', {}, 'req-err'));
  const error = panel.posted.find((message) => message.requestId === 'req-err');
  assert.ok(error);
  assert.equal(error.kind, 'protocol.error');
  assert.equal(error.payload.code, 'E_VALIDATION');
  assert.equal(error.payload.detail.issues[0].message, 'boom');
});

test('typed queries answer through query.data', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);

  const graph = await panel.request('graph.load', {}, 'warm');
  const mainNode = graph.payload.dto.nodes.find((node) => node.label === 'main');
  assert.ok(mainNode);

  const symbol = await panel.request('query.symbol', { symbolId: mainNode.id });
  assert.equal(symbol.kind, 'query.data');
  assert.equal(symbol.payload.ok, true);
  assert.equal(symbol.payload.value.symbolId, mainNode.id);

  const callees = await panel.request('query.callees', { symbolId: mainNode.id });
  assert.equal(callees.payload.ok, true);
  assert.ok(callees.payload.value.length > 0);

  const constructs = await panel.request('query.constructs', { symbolId: mainNode.id });
  assert.equal(constructs.payload.ok, true);
  assert.ok(constructs.payload.value.roots.length > 0);
});

test('a missing symbol is a typed query failure, not a transport error', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('query.symbol', { symbolId: 'symbol:nope' });
  assert.equal(response.kind, 'query.data');
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.code, 'E_NOT_FOUND');
});

test('a missing capability degrades with E_UNSUPPORTED', async () => {
  const { wire } = createHarness(undefined, createCapabilities({ parse: true }));
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('query.callers', { symbolId: 'symbol:anything' });
  assert.equal(response.kind, 'query.data');
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.code, 'E_UNSUPPORTED');
});

test('analysis.progress can be pushed without a request', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  const bridge = wire(panel.target);

  bridge.emitProgress({ phase: 'parse', fraction: 0.5 });
  await flush();
  const progress = panel.posted.find((message) => message.kind === 'analysis.progress');
  assert.ok(progress);
  assert.equal(progress.payload.phase, 'parse');
});

test('panel.ping is answered with panel.pong', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);

  const response = await panel.request('panel.ping', {});
  assert.ok(response);
  assert.equal(response.kind, 'panel.pong');
});

test('disposal stops handling further messages', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  const bridge = wire(panel.target);

  panel.dispose();
  assert.equal(bridge.isDisposed(), true);
  assert.equal(bridge.pendingCount(), 0);

  await panel.receive(createEnvelope('webview.ready', {}, 'late'));
  assert.equal(
    panel.posted.some((message) => message.requestId === 'late'),
    false,
    'a disposed bridge must not respond',
  );
});

test('wiring rejects a target without a webview subscription', () => {
  const { wire } = createHarness();
  assert.throws(() => wire({ onDidDispose() {} }), /webview\.onDidReceiveMessage/);
});

// ---------------------------------------------------------------------------
// Phase 5 — source slices, validation, navigation and editor selection
// ---------------------------------------------------------------------------

function createSourceHarness({ integrity = 'exact', navigateResult = { ok: true } } = {}) {
  const calls = { baseline: 0, slice: 0, validate: 0, navigate: 0 };
  let invalidate = null;
  const slices = [];
  const navigations = [];

  const sourceAccess = {
    async captureBaseline(files) {
      calls.baseline += 1;
      return files.map((file) => ({ fileId: file.fileId, relativePath: file.path }));
    },
    async slice(payload) {
      calls.slice += 1;
      slices.push(payload);
      return {
        ok: true,
        slice: {
          fileId: payload.fileId,
          relativePath: 'src/classify.js',
          languageId: 'javascript',
          text: 'function classify(n) {',
          lines: { startLine: payload.range.startLine, endLine: payload.range.endLine },
          documentVersion: 3,
          integrity,
          truncated: false,
        },
      };
    },
    async validate(ranges) {
      calls.validate += 1;
      return {
        ok: true,
        results: ranges.map((range) => ({
          fileId: range.fileId,
          integrity,
          documentVersion: 3,
        })),
      };
    },
    onDidInvalidate(handler) {
      invalidate = handler;
      return {
        dispose() {
          invalidate = null;
        },
      };
    },
    relativePathFor: () => 'src/classify.js',
  };

  const navigate = async (request) => {
    calls.navigate += 1;
    navigations.push(request);
    return navigateResult;
  };

  return {
    sourceAccess,
    navigate,
    calls,
    slices,
    navigations,
    emitInvalidate(event) {
      invalidate?.(event);
    },
  };
}

function analyzeClassify() {
  return javascriptAdapter.analyze({
    runId: 'run:source',
    path: 'src/classify.js',
    text: 'function classify(n) { if (n) { return 1; } return 0; }\n',
  });
}

test('source.slice never triggers analysis, even before a graph is loaded', async () => {
  const run = analyzeClassify();
  const source = createSourceHarness();
  let loads = 0;
  const { wire } = createHarness(
    async () => {
      loads += 1;
      return { ok: true, run };
    },
    undefined,
    { sourceAccess: source.sourceAccess, navigate: source.navigate },
  );
  const panel = createFakePanel();
  wire(panel.target);

  const fileId = run.files[0].fileId;
  const range = { fileId, startLine: 0, startColumn: 0, endLine: 0, endColumn: 8 };

  await panel.receive(createEnvelope('source.slice', { fileId, range }, 'req-before'));
  const before = panel.posted.find((message) => message.requestId === 'req-before');
  assert.equal(before.kind, 'protocol.error');
  assert.equal(before.payload.code, 'E_NO_ANALYSIS');
  assert.equal(loads, 0, 'a hover must not start analysis');

  await panel.request('graph.load', {});
  assert.equal(loads, 1);

  const response = await panel.request('source.slice', { fileId, range });
  assert.equal(response.kind, 'source.data');
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.slice.integrity, 'exact');
  assert.equal(loads, 1, 'a slice after load must not re-analyze either');
});

test('loading a run captures a source baseline for its files', async () => {
  const source = createSourceHarness();
  const { wire } = createHarness(async () => ({ ok: true, run: analyzeClassify() }), undefined, {
    sourceAccess: source.sourceAccess,
  });
  const panel = createFakePanel();
  wire(panel.target);

  await panel.request('graph.load', {});
  assert.equal(source.calls.baseline, 1);
});

test('batch validation answers with source.integrity and one read per file', async () => {
  const source = createSourceHarness({ integrity: 'stale' });
  const run = analyzeClassify();
  const { wire } = createHarness(async () => ({ ok: true, run }), undefined, {
    sourceAccess: source.sourceAccess,
  });
  const panel = createFakePanel();
  wire(panel.target);
  await panel.request('graph.load', {});

  const fileId = run.files[0].fileId;
  const response = await panel.request('source.validation', {
    ranges: [
      { fileId, startLine: 0, startColumn: 0, endLine: 0, endColumn: 8 },
      { fileId, startLine: 0, startColumn: 9, endLine: 0, endColumn: 18 },
    ],
  });
  assert.equal(response.kind, 'source.integrity');
  assert.equal(response.payload.ok, true);
  assert.equal(response.payload.results.length, 2);
  assert.equal(response.payload.results[0].integrity, 'stale');
  assert.equal(source.calls.validate, 1);
});

test('navigate.to validates the range before revealing source', async () => {
  const source = createSourceHarness();
  const run = analyzeClassify();
  const { wire } = createHarness(async () => ({ ok: true, run }), undefined, {
    sourceAccess: source.sourceAccess,
    navigate: source.navigate,
  });
  const panel = createFakePanel();
  wire(panel.target);
  await panel.request('graph.load', {});

  const fileId = run.files[0].fileId;
  const good = { fileId, startLine: 0, startColumn: 0, endLine: 0, endColumn: 8 };
  const response = await panel.request('navigate.to', { fileId, range: good, nodeId: 'cfg:n1' });
  assert.equal(response.kind, 'navigate.done');
  assert.equal(response.payload.ok, true);
  assert.equal(source.calls.navigate, 1);
  assert.equal(source.navigations[0].nodeId, 'cfg:n1');

  const inverted = await panel.requestRaw('navigate.to', {
    fileId,
    range: { fileId, startLine: 2, startColumn: 0, endLine: 1, endColumn: 0 },
  });
  assert.equal(inverted.kind, 'protocol.error');
  assert.equal(inverted.payload.code, 'E_RANGE');
  assert.equal(source.calls.navigate, 1, 'invalid ranges never reach the editor');

  const mismatch = await panel.requestRaw('navigate.to', {
    fileId,
    range: { ...good, fileId: 'file:other' },
  });
  assert.equal(mismatch.kind, 'protocol.error');
  assert.equal(mismatch.payload.code, 'E_RANGE');

  const unknown = await panel.requestRaw('navigate.to', {
    fileId: 'file:not-in-run',
    range: { ...good, fileId: 'file:not-in-run' },
  });
  assert.equal(unknown.kind, 'protocol.error');
  assert.equal(unknown.payload.code, 'E_SOURCE_MISSING');
  assert.equal(source.calls.navigate, 1);
});

test('a refused navigation is reported as navigate.done, not a transport error', async () => {
  const source = createSourceHarness({
    navigateResult: {
      ok: false,
      code: 'E_SOURCE_STALE',
      message: 'The document changed since this analysis.',
    },
  });
  const run = analyzeClassify();
  const { wire } = createHarness(async () => ({ ok: true, run }), undefined, {
    sourceAccess: source.sourceAccess,
    navigate: source.navigate,
  });
  const panel = createFakePanel();
  wire(panel.target);
  await panel.request('graph.load', {});

  const fileId = run.files[0].fileId;
  const response = await panel.request('navigate.to', {
    fileId,
    range: { fileId, startLine: 0, startColumn: 0, endLine: 0, endColumn: 8 },
  });
  assert.equal(response.kind, 'navigate.done');
  assert.equal(response.payload.ok, false);
  assert.equal(response.payload.code, 'E_SOURCE_STALE');
});

test('editor selection maps to the smallest containing node without analysis', async () => {
  const run = analyzeClassify();
  let loads = 0;
  const { wire } = createHarness(
    async () => {
      loads += 1;
      return { ok: true, run };
    },
    undefined,
    { sourceAccess: createSourceHarness().sourceAccess },
  );
  const panel = createFakePanel();
  const bridge = wire(panel.target);

  const graph = await panel.request('graph.load', {});
  assert.equal(loads, 1);
  const nodes = graph.payload.dto.nodes.filter((node) => node.range);
  assert.ok(nodes.length > 0, 'the fixture must have source-backed nodes');
  const target = nodes[0];
  const file = run.files.find((entry) => entry.fileId === target.range.fileId);
  assert.ok(file);

  bridge.notifyEditorSelection({
    path: file.path,
    range: {
      startLine: target.range.startLine,
      startColumn: target.range.startColumn,
      endLine: target.range.startLine,
      endColumn: target.range.startColumn,
    },
  });
  await flush();

  const message = panel.posted.find((entry) => entry.kind === 'selection.changed');
  assert.ok(message);
  assert.equal(message.payload.fileId, target.range.fileId);
  assert.ok(message.payload.nodeIds.includes(target.id));
  assert.ok(message.payload.activeNodeId);

  const active = nodes.find((node) => node.id === message.payload.activeNodeId);
  assert.ok(active, 'activeNodeId must reference a real node');
  assert.ok(
    active.range.startLine <= target.range.startLine &&
      active.range.endLine >= target.range.startLine,
    'the active node must contain the selection',
  );
  assert.equal(loads, 1, 'selection sync must never trigger analysis');
});

test('editor selection outside every node reports an empty highlight', async () => {
  const run = analyzeClassify();
  const { wire } = createHarness(async () => ({ ok: true, run }), undefined, {
    sourceAccess: createSourceHarness().sourceAccess,
  });
  const panel = createFakePanel();
  const bridge = wire(panel.target);
  await panel.request('graph.load', {});

  const file = run.files[0];
  bridge.notifyEditorSelection({
    path: file.path,
    range: { startLine: 999, startColumn: 0, endLine: 999, endColumn: 1 },
  });
  await flush();

  const message = panel.posted.find((entry) => entry.kind === 'selection.changed');
  assert.ok(message);
  assert.deepEqual(message.payload.nodeIds, []);
  assert.equal(message.payload.activeNodeId, null);
});

test('settings and graph focus can be pushed without a request', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  const bridge = wire(panel.target);

  bridge.pushSettings({ enabled: false, maxLines: 8 });
  bridge.focusGraph();
  await flush();

  const settings = panel.posted.find((entry) => entry.kind === 'settings.data');
  assert.ok(settings);
  assert.equal(settings.payload.settings.enabled, false);
  const focus = panel.posted.find((entry) => entry.kind === 'graph.focus');
  assert.ok(focus);
});

test('invalidating an analyzed file pushes source.stale to the graph', async () => {
  const source = createSourceHarness();
  const { wire } = createHarness(async () => ({ ok: true, run: analyzeClassify() }), undefined, {
    sourceAccess: source.sourceAccess,
  });
  const panel = createFakePanel();
  wire(panel.target);
  await panel.request('graph.load', {});

  source.emitInvalidate({ fileIds: ['file:one'], reason: 'changed' });
  await flush();

  const message = panel.posted.find((entry) => entry.kind === 'source.stale');
  assert.ok(message);
  assert.deepEqual(message.payload.fileIds, ['file:one']);
  assert.equal(message.payload.reason, 'changed');
});

test('source handlers degrade with typed errors when no source service is injected', async () => {
  const { wire } = createHarness();
  const panel = createFakePanel();
  wire(panel.target);
  await panel.request('graph.load', {});

  const slice = await panel.requestRaw('source.slice', {
    fileId: 'file:a',
    range: { fileId: 'file:a', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
  });
  assert.ok(slice);
  assert.equal(slice.kind, 'protocol.error');
  assert.equal(slice.payload.code, 'E_SOURCE_UNAVAILABLE');
  assert.equal(slice.payload.message, 'Source preview is not available.');

  const navigation = await panel.requestRaw('navigate.to', {
    fileId: 'file:a',
    range: { fileId: 'file:a', startLine: 0, startColumn: 0, endLine: 0, endColumn: 1 },
  });
  assert.equal(navigation.kind, 'protocol.error');
  assert.equal(navigation.payload.code, 'E_NAVIGATION_UNAVAILABLE');
});

test('explain.node and explain.function return grounded explanations without triggering analysis', async () => {
  const run = analyzeClassify();
  let loads = 0;
  const { wire } = createHarness(async () => {
    loads += 1;
    return { ok: true, run };
  });
  const panel = createFakePanel();
  wire(panel.target);

  const before = await panel.requestRaw('explain.function', { depth: 2 });
  assert.equal(before.kind, 'protocol.error');
  assert.equal(before.payload.code, 'E_NO_ANALYSIS');
  assert.equal(loads, 0, 'explain request must never trigger analysis');

  const fns = await panel.request('cfg.functions', {});
  const cfgRes = await panel.request('cfg.load', { symbolId: fns.payload.functions[0].symbolId });
  assert.equal(loads, 1);

  const fnExplain = await panel.request('explain.function', { depth: 2 });
  assert.equal(fnExplain.kind, 'explain.data');
  assert.equal(fnExplain.payload.ok, true);
  assert.match(fnExplain.payload.summary, /classify/);

  const nodeId = cfgRes.payload.dto.nodes[0].id;
  const nodeExplain = await panel.request('explain.node', { nodeId, depth: 2 });
  assert.equal(nodeExplain.kind, 'explain.data');
  assert.equal(nodeExplain.payload.ok, true);
  assert.ok(nodeExplain.payload.items.length >= 1);
  assert.equal(loads, 1);
});

test('calls.load, calls.outgoing, calls.incoming, expand, collapse, filter, and focus work across perspectives', async () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:calls-wire',
    path: 'src/calls.js',
    text: 'function helper(x) { return x; }\nfunction main(n) { return helper(n); }\n',
  });
  let loads = 0;
  const { wire } = createHarness(async () => {
    loads += 1;
    return { ok: true, run };
  });
  const panel = createFakePanel();
  wire(panel.target);

  const before = await panel.requestRaw('calls.outgoing', { symbolId: 'sym:none' });
  assert.equal(before.kind, 'protocol.error');
  assert.equal(before.payload.code, 'E_NO_ANALYSIS');
  assert.equal(loads, 0);

  const mainSym = run.symbols.find((s) => s.name === 'main');
  const helperSym = run.symbols.find((s) => s.name === 'helper');
  assert.ok(mainSym && helperSym);

  const loaded = await panel.request('calls.load', { symbolId: mainSym.symbolId });
  assert.equal(loaded.kind, 'calls.data');
  assert.equal(loaded.payload.dto.dtoKind, 'call_graph');
  assert.equal(loaded.payload.dto.centerSymbolId, mainSym.symbolId);
  assert.equal(loaded.payload.dto.scope, 'same_file_only');
  assert.equal(loads, 1);

  const out = await panel.request('calls.outgoing', { symbolId: mainSym.symbolId });
  assert.equal(out.kind, 'calls.neighbors');
  assert.equal(out.payload.total, 1);
  assert.equal(out.payload.items[0].symbolId, helperSym.symbolId);

  const inc = await panel.request('calls.incoming', { symbolId: helperSym.symbolId });
  assert.equal(inc.kind, 'calls.neighbors');
  assert.equal(inc.payload.total, 1);
  assert.equal(inc.payload.items[0].symbolId, mainSym.symbolId);

  const expanded = await panel.request('calls.expand', { symbolId: helperSym.symbolId });
  assert.equal(expanded.kind, 'calls.data');
  const collapsed = await panel.request('calls.collapse', { symbolId: helperSym.symbolId });
  assert.equal(collapsed.kind, 'calls.data');
  const focused = await panel.request('calls.focus', { symbolId: mainSym.symbolId });
  assert.equal(focused.payload.dto.focusedNodeId, mainSym.symbolId);
  const filtered = await panel.request('calls.filter', { statuses: ['resolved'] });
  assert.equal(filtered.kind, 'calls.data');
  assert.equal(loads, 1);
});

test('index.status returns index stats and health, and indexed indexProvider upgrades call graph scope', async () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:index-wire',
    path: 'src/a.js',
    text: 'export function a(x) { return x + 1; }\n',
  });
  const symA = run.symbols.find((s) => s.name === 'a');
  const fakeIndexProvider = {
    scope: 'complete',
    isIndexed: () => true,
    callsByFrom: () => [],
    callsByTo: () => [],
    symbolById: (id) => (id === symA.symbolId ? symA : null),
    batchNeighbors: () => ({ symbols: [symA], relationships: [] }),
    allSymbols: () => [symA],
    allRelationships: () => [],
    stats: () => ({
      state: 'complete',
      schemaVersion: 1,
      fileCount: 1,
      symbolCount: 1,
      relationshipCount: 0,
      dependencyCount: 0,
      staleFileCount: 0,
      scope: 'complete',
    }),
    health: () => ({
      ok: true,
      integrity: 'ok',
      schemaVersion: 1,
      state: 'complete',
      staleFileCount: 0,
      scope: 'complete',
      issues: [],
    }),
  };

  const { wire } = createHarness(async () => ({ ok: true, run }), undefined, {
    indexProvider: fakeIndexProvider,
  });
  const panel = createFakePanel();
  wire(panel.target);

  const ready = await panel.request('webview.ready', {});
  assert.equal(ready.payload.capabilities.projectIndex, true);

  const status = await panel.request('index.status', {});
  assert.equal(status.kind, 'index.data');
  assert.equal(status.payload.ok, true);
  assert.equal(status.payload.stats.state, 'complete');
  assert.equal(status.payload.health.integrity, 'ok');

  const callLoaded = await panel.request('calls.load', { symbolId: symA.symbolId });
  assert.equal(callLoaded.kind, 'calls.data');
  assert.equal(callLoaded.payload.dto.scope, 'complete');

  const zoomOpened = await panel.request('zoom.open', {});
  assert.equal(zoomOpened.kind, 'zoom.data');
  assert.equal(zoomOpened.payload.dto.dtoKind, 'semantic_zoom');
  assert.equal(zoomOpened.payload.dto.level, 'workspace');

  const zoomDescended = await panel.request('zoom.descend', {
    level: 'module',
    scopeId: 'src',
    label: 'src',
  });
  assert.equal(zoomDescended.kind, 'zoom.data');
  assert.equal(zoomDescended.payload.dto.level, 'module');

  const zoomBack = await panel.request('zoom.breadcrumb', { index: 0 });
  assert.equal(zoomBack.kind, 'zoom.data');
  assert.equal(zoomBack.payload.dto.level, 'workspace');

  const zoomSearched = await panel.request('zoom.search', { queryText: 'a' });
  assert.equal(zoomSearched.kind, 'zoom.results');
  assert.equal(zoomSearched.payload.ok, true);
});

test('dfg.load, dfg.trace, and dfg.slice respond via the protocol', async () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:dfg_wire',
    path: 'src/calc.js',
    text: 'function calc(x) { let y = x + 1; return y; }\n',
  });
  const sym = run.symbols.find((s) => s.kind === 'function');
  assert.ok(sym);

  const { wire } = createHarness(async () => ({ ok: true, run }));
  const panel = createFakePanel();
  wire(panel.target);

  // dfg.load
  const loaded = await panel.requestRaw('dfg.load', { symbolId: sym.symbolId });
  if (loaded.kind === 'protocol.error') {
    assert.fail(`dfg.load returned protocol.error: ${JSON.stringify(loaded.payload)}`);
  }
  assert.equal(loaded.kind, 'dfg.data');
  assert.equal(loaded.payload.ok, true);
  assert.equal(loaded.payload.dto.functionId, sym.symbolId);

  // dfg.trace without binding
  const traceEmpty = await panel.request('dfg.trace', { bindingId: null });
  assert.equal(traceEmpty.kind, 'dfg.overlay');
  assert.equal(traceEmpty.payload.ok, true);
  assert.equal(traceEmpty.payload.overlay.slot, 'dfg');

  // dfg.slice
  const sliceRes = await panel.request('dfg.slice', { nodeId: 'unknown', direction: 'backward' });
  assert.equal(sliceRes.kind, 'dfg.data');
  assert.equal(sliceRes.payload.ok, true);
});
