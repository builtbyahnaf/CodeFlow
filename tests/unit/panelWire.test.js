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
