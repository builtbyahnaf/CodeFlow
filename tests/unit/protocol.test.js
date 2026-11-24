import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DIRECTIONS,
  MAX_PAYLOAD_BYTES,
  PROTOCOL_VERSION,
  createEnvelope,
  createErrorPayload,
  messageSize,
  validateEnvelope,
} from '../../src/core/protocol/envelope.js';

const WEBVIEW_TO_HOST = { direction: DIRECTIONS.WEBVIEW_TO_HOST };
const HOST_TO_WEBVIEW = { direction: DIRECTIONS.HOST_TO_WEBVIEW };

test('createEnvelope stamps the protocol version', () => {
  const envelope = createEnvelope('graph.load', { demo: true }, 'req-1');
  assert.equal(envelope.protocolVersion, PROTOCOL_VERSION);
  assert.equal(envelope.kind, 'graph.load');
  assert.equal(envelope.requestId, 'req-1');
  assert.deepEqual(envelope.payload, { demo: true });
});

test('createEnvelope defaults the payload to an object', () => {
  const envelope = createEnvelope('webview.ready');
  assert.deepEqual(envelope.payload, {});
});

test('createErrorPayload only includes detail when supplied', () => {
  assert.deepEqual(createErrorPayload('E_PROTOCOL', 'bad'), {
    code: 'E_PROTOCOL',
    message: 'bad',
  });
  assert.deepEqual(createErrorPayload('E_PROTOCOL', 'bad', { reason: 'x' }), {
    code: 'E_PROTOCOL',
    message: 'bad',
    detail: { reason: 'x' },
  });
});

test('accepts a well-formed message in each direction', () => {
  const webviewMessage = createEnvelope('graph.load', { demo: true }, 'a1');
  const hostMessage = createEnvelope('graph.data', { dto: {} }, 'a1');

  const inbound = validateEnvelope(webviewMessage, WEBVIEW_TO_HOST);
  assert.equal(inbound.ok, true);
  assert.equal(inbound.envelope.kind, 'graph.load');

  const outbound = validateEnvelope(hostMessage, HOST_TO_WEBVIEW);
  assert.equal(outbound.ok, true);
  assert.equal(outbound.envelope.kind, 'graph.data');
});

test('rejects a protocol version mismatch', () => {
  const result = validateEnvelope(
    { protocolVersion: 99, kind: 'graph.load', payload: {} },
    WEBVIEW_TO_HOST,
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_PROTOCOL');
  assert.equal(result.reason, 'version_mismatch');
  assert.match(result.message, /expected 1/);
});

test('rejects a kind that is not in the allowlist for the direction', () => {
  const result = validateEnvelope(createEnvelope('graph.data', {}), WEBVIEW_TO_HOST);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unknown_kind');
});

test('rejects malformed kinds', () => {
  for (const kind of ['Graph.Load', 'graphload', 'graph..load', '', 'graph.load.']) {
    const result = validateEnvelope({ protocolVersion: 1, kind, payload: {} }, WEBVIEW_TO_HOST);
    assert.equal(result.ok, false, `expected "${kind}" to be rejected`);
    assert.equal(result.reason, 'invalid_kind');
  }
});

test('rejects unsafe request ids', () => {
  for (const requestId of ['', 'has space', 'x'.repeat(200), 'a/b', 42]) {
    const result = validateEnvelope(
      { protocolVersion: 1, kind: 'graph.load', requestId, payload: {} },
      WEBVIEW_TO_HOST,
    );
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'invalid_request_id');
  }
});

test('rejects non-object messages and array payloads', () => {
  for (const raw of [null, undefined, 42, 'text', [], [1, 2]]) {
    const result = validateEnvelope(raw, WEBVIEW_TO_HOST);
    assert.equal(result.ok, false);
    assert.equal(result.reason, 'not_an_object');
  }

  const arrayPayload = validateEnvelope(
    { protocolVersion: 1, kind: 'graph.load', payload: [] },
    WEBVIEW_TO_HOST,
  );
  assert.equal(arrayPayload.ok, false);
  assert.equal(arrayPayload.reason, 'invalid_payload');
});

test('rejects prototype-poisoning keys at any depth', () => {
  const topLevel = validateEnvelope(
    { protocolVersion: 1, kind: 'graph.load', payload: { __proto__: { polluted: true } } },
    WEBVIEW_TO_HOST,
  );
  // A literal `__proto__` key sets the prototype rather than creating a key, so
  // the payload still validates as a plain object; the nested form is the real test.
  assert.equal(topLevel.ok, true);

  const nested = validateEnvelope(
    {
      protocolVersion: 1,
      kind: 'graph.load',
      payload: JSON.parse('{"a":{"__proto__":{"polluted":true}}}'),
    },
    WEBVIEW_TO_HOST,
  );
  assert.equal(nested.ok, false);
  assert.equal(nested.reason, 'unsafe_key');
  assert.match(nested.path, /payload\.a\.__proto__/);
});

test('rejects oversized messages instead of truncating', () => {
  const result = validateEnvelope(
    {
      protocolVersion: 1,
      kind: 'graph.load',
      payload: { blob: 'x'.repeat(MAX_PAYLOAD_BYTES + 10) },
    },
    WEBVIEW_TO_HOST,
  );
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_LIMIT');
  assert.equal(result.reason, 'payload_too_large');
});

test('rejects an unknown direction', () => {
  const result = validateEnvelope(createEnvelope('graph.load', {}), { direction: 'sideways' });
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'unknown_direction');
});

test('messageSize is stable and total for unserializable values', () => {
  assert.equal(messageSize({ a: 1 }), JSON.stringify({ a: 1 }).length);
  const cyclic = {};
  cyclic.self = cyclic;
  assert.equal(messageSize(cyclic), Number.POSITIVE_INFINITY);
});

test('Phase 1 CSR and query kinds are sendable in their own direction only', () => {
  const webviewKinds = [
    'csr.load',
    'query.symbol',
    'query.symbols',
    'query.callers',
    'query.callees',
    'query.constructs',
    'query.capabilities',
    'cfg.load',
  ];
  const hostKinds = ['csr.data', 'query.data', 'analysis.progress', 'cfg.data'];

  for (const kind of webviewKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).reason,
      'unknown_kind',
      kind,
    );
  }
  for (const kind of hostKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).reason,
      'unknown_kind',
      kind,
    );
  }

  // The function list is request and response, so it travels both ways.
  for (const direction of [WEBVIEW_TO_HOST, HOST_TO_WEBVIEW]) {
    assert.equal(validateEnvelope(createEnvelope('cfg.functions', {}), direction).ok, true);
  }
});

test('Phase 5 source and navigation kinds are directional and validated', () => {
  const webviewKinds = ['source.slice', 'source.validation', 'navigate.to'];
  const hostKinds = [
    'source.data',
    'source.integrity',
    'source.stale',
    'navigate.done',
    'selection.changed',
    'graph.focus',
    'settings.data',
  ];

  for (const kind of webviewKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).reason,
      'unknown_kind',
      kind,
    );
  }
  for (const kind of hostKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).reason,
      'unknown_kind',
      kind,
    );
  }
});

test('Phase 6 explanation kinds are directional and validated', () => {
  for (const kind of ['explain.node', 'explain.function']) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).reason,
      'unknown_kind',
      kind,
    );
  }
  assert.equal(validateEnvelope(createEnvelope('explain.data', {}), HOST_TO_WEBVIEW).ok, true);
  assert.equal(
    validateEnvelope(createEnvelope('explain.data', {}), WEBVIEW_TO_HOST).reason,
    'unknown_kind',
  );
});

test('Phase 7 call-graph kinds are directional and validated', () => {
  const webviewKinds = [
    'calls.load',
    'calls.outgoing',
    'calls.incoming',
    'calls.expand',
    'calls.collapse',
    'calls.filter',
    'calls.focus',
  ];
  const hostKinds = ['calls.data', 'calls.neighbors'];

  for (const kind of webviewKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).reason,
      'unknown_kind',
      kind,
    );
  }
  for (const kind of hostKinds) {
    assert.equal(validateEnvelope(createEnvelope(kind, {}), HOST_TO_WEBVIEW).ok, true, kind);
    assert.equal(
      validateEnvelope(createEnvelope(kind, {}), WEBVIEW_TO_HOST).reason,
      'unknown_kind',
      kind,
    );
  }
});
