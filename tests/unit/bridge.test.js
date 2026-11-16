import test from 'node:test';
import assert from 'node:assert/strict';

import { createBridge, ProtocolError } from '../../src/core/protocol/bridge.js';
import { DIRECTIONS, createEnvelope } from '../../src/core/protocol/envelope.js';

/**
 * Two bridges connected by an in-memory link. Messages are queued and delivered
 * by `flush()`, which makes ordering explicit in tests instead of relying on
 * microtask luck.
 */
function createLink(bridgeOptions = {}) {
  /** @type {Array<[('host'|'webview'), Record<string, unknown>]>} */
  const queue = [];

  const host = createBridge({
    post: (message) => queue.push(['webview', message]),
    inboundDirection: DIRECTIONS.WEBVIEW_TO_HOST,
    timeoutMs: 200,
    ...bridgeOptions.host,
  });

  const webview = createBridge({
    post: (message) => queue.push(['host', message]),
    inboundDirection: DIRECTIONS.HOST_TO_WEBVIEW,
    timeoutMs: 200,
    ...bridgeOptions.webview,
  });

  async function flush() {
    // Handlers may post more messages; drain until quiet.
    let guard = 0;
    while (queue.length > 0 && guard < 200) {
      guard += 1;
      const [target, message] = /** @type {[string, Record<string, unknown>]} */ (queue.shift());
      await (target === 'host' ? host : webview).handleMessage(message);
    }
  }

  return { host, webview, queue, flush };
}

test('a request is answered by a correlated response', async () => {
  const { host, webview, flush } = createLink();

  host.on('webview.ready', (payload, { requestId }) => {
    assert.equal(payload.client, 'webview');
    host.respond('capabilities.data', { adapters: ['mock'] }, requestId);
  });

  const pending = webview.request('webview.ready', { client: 'webview' });
  await flush();
  const response = await pending;

  assert.equal(response.kind, 'capabilities.data');
  assert.deepEqual(response.payload, { adapters: ['mock'] });
  assert.equal(webview.pendingCount(), 0);
  assert.equal(host.pendingCount(), 0);
});

test('a missing response rejects with E_TIMEOUT', async () => {
  const { webview } = createLink({ webview: { timeoutMs: 25 } });

  await assert.rejects(
    () => webview.request('graph.load', { demo: true }),
    (error) => {
      assert.ok(error instanceof ProtocolError);
      assert.equal(error.code, 'E_TIMEOUT');
      return true;
    },
  );
  assert.equal(webview.pendingCount(), 0);
});

test('a handler failure becomes a typed protocol error for the requester', async () => {
  const { host, webview, flush } = createLink();

  host.on('graph.load', () => {
    const error = new Error('analyzer exploded');
    error.code = 'E_ADAPTER';
    throw error;
  });

  const pending = webview.request('graph.load');
  await flush();

  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof ProtocolError);
    assert.equal(error.code, 'E_ADAPTER');
    assert.match(error.message, /analyzer exploded/);
    return true;
  });

  assert.equal(host.pendingCount(), 0);
});

test('a late response after a timeout is ignored without crashing', async () => {
  const { host, webview, flush } = createLink({
    webview: { timeoutMs: 25, createRequestId: () => 'fixed-id' },
  });

  await assert.rejects(() => webview.request('graph.load'));

  // The host was never asked to respond, so simulate a response that arrives late.
  const result = await webview.handleMessage(
    createEnvelope('graph.data', { dto: { stale: true } }, 'fixed-id'),
  );
  assert.equal(result.ok, true);

  // The bridge still works afterwards.
  host.on('graph.load', (_payload, { requestId }) => {
    host.respond('graph.data', { fresh: true }, requestId);
  });
  const pending = webview.request('graph.load');
  await flush();
  const response = await pending;
  assert.equal(response.payload.fresh, true);
});

test('invalid inbound messages are rejected and reported to the sender', async () => {
  const { host, queue } = createLink();

  const result = await host.handleMessage({ protocolVersion: 999, kind: 'graph.load' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'version_mismatch');

  const errorMessage = queue.find(([, message]) => message.kind === 'protocol.error');
  assert.ok(errorMessage, 'expected a protocol.error to be posted');
  assert.equal(errorMessage[1].payload.code, 'E_PROTOCOL');
});

test('disposing rejects in-flight requests with E_CANCELLED', async () => {
  const { webview } = createLink();

  const pending = webview.request('graph.load');
  webview.dispose('test');

  await assert.rejects(pending, (error) => {
    assert.ok(error instanceof ProtocolError);
    assert.equal(error.code, 'E_CANCELLED');
    return true;
  });
  assert.equal(webview.pendingCount(), 0);
  assert.equal(webview.isDisposed(), true);
});

test('the in-flight cap is enforced', async () => {
  const { webview } = createLink({ webview: { maxInFlight: 1, timeoutMs: 50 } });

  const first = webview.request('graph.load');
  await assert.rejects(() => webview.request('graph.load'), /Too many in-flight requests/);
  await assert.rejects(first, /No response/);
});

test('handlers cannot respond with a kind from the wrong direction', async () => {
  const { host } = createLink();

  assert.throws(() => host.respond('graph.load', {}), (error) => {
    assert.equal(error.code, 'E_PROTOCOL');
    return true;
  });
});
