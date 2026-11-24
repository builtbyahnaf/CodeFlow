/**
 * CodeFlow webview protocol.
 *
 * The extension host and the webview are separate JavaScript contexts. Every
 * message that crosses that boundary must pass through this module so that a
 * single, versioned contract decides what is legal.
 *
 * This module is intentionally dependency-free: it is bundled into both the
 * extension host and the webview.
 */

export const PROTOCOL_VERSION = 1;

/** Hard ceiling on a serialized message. Larger messages are rejected, never truncated. */
export const MAX_PAYLOAD_BYTES = 1_000_000;

/** `domain.action` in lower case, at least two segments. */
export const KIND_PATTERN = /^[a-z]+(\.[a-z]+)+$/;

export const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** Kinds a webview may send to the host. */
export const WEBVIEW_TO_HOST = Object.freeze([
  'webview.ready',
  'graph.load',
  'csr.load',
  'node.select',
  'panel.ping',
  'query.symbol',
  'query.symbols',
  'query.callers',
  'query.callees',
  'query.constructs',
  'query.capabilities',
  'cfg.functions',
  'cfg.load',
  'source.slice',
  'source.validation',
  'navigate.to',
  'explain.node',
  'explain.function',
  'calls.load',
  'calls.outgoing',
  'calls.incoming',
  'calls.expand',
  'calls.collapse',
  'calls.filter',
  'calls.focus',
  'index.status',
]);

/** Kinds the host may send to the webview. */
export const HOST_TO_WEBVIEW = Object.freeze([
  'graph.data',
  'capabilities.data',
  'csr.data',
  'query.data',
  'analysis.progress',
  'protocol.error',
  'protocol.ack',
  'panel.pong',
  'cfg.functions',
  'cfg.data',
  'source.data',
  'source.integrity',
  'source.stale',
  'navigate.done',
  'selection.changed',
  'graph.focus',
  'settings.data',
  'explain.data',
  'calls.data',
  'calls.neighbors',
  'index.data',
]);

export const DIRECTIONS = Object.freeze({
  WEBVIEW_TO_HOST: 'webview_to_host',
  HOST_TO_WEBVIEW: 'host_to_webview',
});

const KIND_ALLOWLIST = Object.freeze({
  [DIRECTIONS.WEBVIEW_TO_HOST]: new Set(WEBVIEW_TO_HOST),
  [DIRECTIONS.HOST_TO_WEBVIEW]: new Set(HOST_TO_WEBVIEW),
});

const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const MAX_KEY_SCAN_DEPTH = 8;

/**
 * @typedef {Object} Envelope
 * @property {number} protocolVersion
 * @property {string} kind
 * @property {string} [requestId]
 * @property {Record<string, unknown>} payload
 */

/**
 * @typedef {Object} ValidationSuccess
 * @property {true} ok
 * @property {Envelope} envelope
 */

/**
 * @typedef {Object} ValidationFailure
 * @property {false} ok
 * @property {'E_PROTOCOL'|'E_LIMIT'} code
 * @property {string} reason
 * @property {string} message
 * @property {string} [path]
 * @property {string} [requestId]
 */

/**
 * Build a well-formed envelope. Producers should use this instead of writing
 * object literals so that the version field can never be forgotten.
 *
 * @param {string} kind
 * @param {Record<string, unknown>} [payload]
 * @param {string} [requestId]
 * @returns {Envelope}
 */
export function createEnvelope(kind, payload, requestId) {
  /** @type {Envelope} */
  const envelope = {
    protocolVersion: PROTOCOL_VERSION,
    kind,
    payload: payload ?? {},
  };
  if (requestId) {
    envelope.requestId = requestId;
  }
  return envelope;
}

/**
 * Build a typed error payload. `detail` must never contain source text.
 *
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [detail]
 * @returns {Record<string, unknown>}
 */
export function createErrorPayload(code, message, detail) {
  /** @type {Record<string, unknown>} */
  const payload = { code, message };
  if (detail) {
    payload.detail = detail;
  }
  return payload;
}

/**
 * Approximate serialized size of a message. Used for limit enforcement; the
 * exact bytes do not matter, only that oversized messages are refused before
 * they are posted.
 *
 * @param {unknown} value
 * @returns {number}
 */
export function messageSize(value) {
  try {
    const json = JSON.stringify(value);
    return typeof json === 'string' ? json.length : 0;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Reject payloads that could poison prototypes when merged or spread.
 *
 * @param {unknown} value
 * @param {string} path
 * @param {number} depth
 * @returns {{ok: true} | {ok: false, path: string, key: string}}
 */
function scanUnsafeKeys(value, path, depth) {
  if (depth > MAX_KEY_SCAN_DEPTH || value === null || typeof value !== 'object') {
    return { ok: true };
  }
  const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
  for (const [key, child] of entries) {
    const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
    if (!Array.isArray(value) && UNSAFE_KEYS.has(String(key))) {
      return { ok: false, path: childPath, key: String(key) };
    }
    const nested = scanUnsafeKeys(child, childPath, depth + 1);
    if (!nested.ok) {
      return nested;
    }
  }
  return { ok: true };
}

/**
 * Validate an inbound message against the protocol contract.
 *
 * Validation is total: every rejection returns a typed failure with a stable
 * reason code, and never throws.
 *
 * @param {unknown} raw
 * @param {{direction: 'webview_to_host' | 'host_to_webview'}} options
 * @returns {ValidationSuccess | ValidationFailure}
 */
export function validateEnvelope(raw, options) {
  const direction = options?.direction;
  const allowlist = KIND_ALLOWLIST[direction];
  if (!allowlist) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'unknown_direction',
      message: `Unknown protocol direction: ${String(direction)}`,
    };
  }

  if (!isPlainObject(raw)) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'not_an_object',
      message: 'Message must be a plain object.',
    };
  }

  const candidate = /** @type {Record<string, unknown>} */ (raw);

  if (candidate.protocolVersion !== PROTOCOL_VERSION) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'version_mismatch',
      message: `Unsupported protocol version: expected ${PROTOCOL_VERSION}, received ${String(
        candidate.protocolVersion,
      )}.`,
    };
  }

  const kind = candidate.kind;
  if (typeof kind !== 'string' || !KIND_PATTERN.test(kind)) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'invalid_kind',
      message: 'Message kind must look like "domain.action" in lower case.',
      path: 'kind',
    };
  }

  if (!allowlist.has(kind)) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'unknown_kind',
      message: `Kind "${kind}" is not accepted in direction "${direction}".`,
      path: 'kind',
    };
  }

  const requestId = candidate.requestId;
  if (requestId !== undefined) {
    if (typeof requestId !== 'string' || !REQUEST_ID_PATTERN.test(requestId)) {
      return {
        ok: false,
        code: 'E_PROTOCOL',
        reason: 'invalid_request_id',
        message: 'requestId must be 1-128 characters of A-Z, a-z, 0-9, "_" or "-".',
        path: 'requestId',
      };
    }
  }

  const payload = candidate.payload ?? {};
  if (!isPlainObject(payload)) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'invalid_payload',
      message: 'payload must be a plain object.',
      path: 'payload',
      requestId: typeof requestId === 'string' ? requestId : undefined,
    };
  }

  const keyScan = scanUnsafeKeys(payload, 'payload', 0);
  if (!keyScan.ok) {
    return {
      ok: false,
      code: 'E_PROTOCOL',
      reason: 'unsafe_key',
      message: `Payload contains a forbidden key "${keyScan.key}".`,
      path: keyScan.path,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    };
  }

  if (messageSize(candidate) > MAX_PAYLOAD_BYTES) {
    return {
      ok: false,
      code: 'E_LIMIT',
      reason: 'payload_too_large',
      message: `Message exceeds the ${MAX_PAYLOAD_BYTES} byte limit.`,
      requestId: typeof requestId === 'string' ? requestId : undefined,
    };
  }

  /** @type {Envelope} */
  const envelope = {
    protocolVersion: PROTOCOL_VERSION,
    kind,
    payload,
  };
  if (typeof requestId === 'string') {
    envelope.requestId = requestId;
  }

  return { ok: true, envelope };
}
