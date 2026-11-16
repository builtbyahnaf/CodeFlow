import test from 'node:test';
import assert from 'node:assert/strict';

import { createPanelWire } from '../../src/extension/panelWire.js';
import { createEnvelope } from '../../src/core/protocol/envelope.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { createMockAnalysis } from '../../src/adapters/mock/index.js';

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
      return posted.find((message) => message.requestId === id && message.kind !== 'protocol.error');
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
      capabilityMatrix: () => [{ id: 'mock', languages: ['mock'], capabilities: { ...capabilities } }],
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

