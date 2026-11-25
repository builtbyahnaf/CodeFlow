/**
 * Webview message bridge.
 *
 * Symmetric implementation used by both the extension host and the webview.
 * Responsibilities:
 * - Validate every inbound message before any handler sees it.
 * - Correlate requests with responses, with a timeout per request.
 * - Contain handler failures and report them as typed protocol errors.
 * - Reject work after disposal so a closed panel cannot leak timers.
 *
 * The bridge has no dependency on the `vscode` module: the transport (`post`)
 * is injected. That makes the whole request/response contract unit-testable in
 * plain Node.
 */

import {
  DIRECTIONS,
  HOST_TO_WEBVIEW,
  MAX_PAYLOAD_BYTES,
  WEBVIEW_TO_HOST,
  createEnvelope,
  createErrorPayload,
  messageSize,
  validateEnvelope,
} from './envelope.js';

export class ProtocolError extends Error {
  /**
   * @param {string} code
   * @param {string} message
   * @param {Record<string, unknown>} [detail]
   */
  constructor(code, message, detail) {
    super(message);
    this.name = 'ProtocolError';
    this.code = code;
    if (detail) {
      this.detail = detail;
    }
  }
}

/** @type {{debug: Function, warn: Function, error: Function}} */
const NOOP_LOGGER = {
  debug() {},
  warn() {},
  error() {},
};

/**
 * @typedef {Object} BridgeOptions
 * @property {(message: Record<string, unknown>) => void} post  Transport to the other side.
 * @property {'webview_to_host' | 'host_to_webview'} inboundDirection
 * @property {number} [timeoutMs]
 * @property {number} [maxInFlight]
 * @property {() => string} [createRequestId]
 * @property {typeof NOOP_LOGGER} [logger]
 */

/**
 * @param {BridgeOptions} options
 */
export function createBridge(options) {
  const { post, inboundDirection, logger = NOOP_LOGGER } = options;
  const timeoutMs = options.timeoutMs ?? 5000;
  const maxInFlight = options.maxInFlight ?? 32;
  const outboundDirection =
    inboundDirection === DIRECTIONS.WEBVIEW_TO_HOST
      ? DIRECTIONS.HOST_TO_WEBVIEW
      : DIRECTIONS.WEBVIEW_TO_HOST;
  const outboundKinds = new Set(
    outboundDirection === DIRECTIONS.HOST_TO_WEBVIEW ? HOST_TO_WEBVIEW : WEBVIEW_TO_HOST,
  );

  let sequence = 0;
  const createRequestId =
    options.createRequestId ??
    (() => {
      sequence += 1;
      return `r${sequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    });

  /** @type {Map<string, {resolve: Function, reject: Function, timer: ReturnType<typeof setTimeout>}>} */
  const pending = new Map();
  /** @type {Map<string, (payload: Record<string, unknown>, meta: {requestId?: string}) => unknown>} */
  const handlers = new Map();
  const reportedKinds = new Set();
  let disposed = false;

  /**
   * @param {string} kind
   * @param {Record<string, unknown>} payload
   * @param {string} [requestId]
   */
  function send(kind, payload, requestId) {
    if (disposed) {
      throw new ProtocolError('E_CANCELLED', 'Bridge is disposed.');
    }
    if (!outboundKinds.has(kind)) {
      throw new ProtocolError('E_PROTOCOL', `Kind "${kind}" is not sendable in this direction.`);
    }
    const envelope = createEnvelope(kind, payload, requestId);
    const bytes = messageSize(envelope);
    if (bytes > MAX_PAYLOAD_BYTES) {
      throw new ProtocolError('E_LIMIT', 'Refusing to send an oversized message.', {
        kind,
        bytes,
        maxBytes: MAX_PAYLOAD_BYTES,
      });
    }
    post(envelope);
    logger.debug('protocol.send', {
      kind,
      requestId: requestId ?? null,
      bytes: messageSize(envelope),
    });
  }

  /**
   * @param {string} code
   * @param {string} message
   * @param {string} [requestId]
   * @param {Record<string, unknown>} [detail]
   */
  function sendError(code, message, requestId, detail) {
    try {
      send('protocol.error', createErrorPayload(code, message, detail), requestId);
    } catch {
      // The panel may already be gone. Nothing useful remains to do.
    }
  }

  /**
   * @param {string} kind
   * @param {(payload: Record<string, unknown>, meta: {requestId?: string}) => unknown} handler
   * @returns {() => void} unsubscribe
   */
  function on(kind, handler) {
    handlers.set(kind, handler);
    return () => {
      if (handlers.get(kind) === handler) {
        handlers.delete(kind);
      }
    };
  }

  /**
   * Send a request and await the correlated response.
   *
   * @param {string} kind
   * @param {Record<string, unknown>} [payload]
   * @param {{timeoutMs?: number}} [requestOptions]
   * @returns {Promise<{kind: string, payload: Record<string, unknown>}>}
   */
  function request(kind, payload = {}, requestOptions = {}) {
    if (disposed) {
      return Promise.reject(new ProtocolError('E_CANCELLED', 'Bridge is disposed.'));
    }
    if (pending.size >= maxInFlight) {
      return Promise.reject(
        new ProtocolError('E_LIMIT', `Too many in-flight requests (${maxInFlight}).`),
      );
    }
    const requestId = createRequestId();
    const effectiveTimeout = requestOptions.timeoutMs ?? timeoutMs;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(
          new ProtocolError(
            'E_TIMEOUT',
            `No response to "${kind}" within ${effectiveTimeout} ms.`,
            {
              kind,
              requestId,
            },
          ),
        );
      }, effectiveTimeout);
      pending.set(requestId, { resolve, reject, timer });
      try {
        send(kind, payload, requestId);
      } catch (error) {
        clearTimeout(timer);
        pending.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * @param {unknown} raw
   * @returns {Promise<{ok: boolean, code?: string, reason?: string}>}
   */
  async function handleMessage(raw) {
    if (disposed) {
      return { ok: false, code: 'E_CANCELLED', reason: 'disposed' };
    }

    const validation = validateEnvelope(raw, { direction: inboundDirection });
    if (!validation.ok) {
      if (!reportedKinds.has(validation.reason)) {
        reportedKinds.add(validation.reason);
        logger.warn('protocol.rejected', {
          reason: validation.reason,
          path: validation.path ?? null,
        });
      }
      sendError(validation.code, validation.message, validation.requestId, {
        reason: validation.reason,
      });
      return { ok: false, code: validation.code, reason: validation.reason };
    }

    const envelope = validation.envelope;
    const { kind, requestId, payload } = envelope;
    logger.debug('protocol.receive', {
      kind,
      requestId: requestId ?? null,
      bytes: messageSize(envelope),
    });

    if (kind === 'protocol.error') {
      if (requestId && pending.has(requestId)) {
        const entry = pending.get(requestId);
        if (entry) {
          clearTimeout(entry.timer);
          pending.delete(requestId);
          const code = typeof payload.code === 'string' ? payload.code : 'E_PROTOCOL';
          const message =
            typeof payload.message === 'string'
              ? payload.message
              : 'The other side reported an error.';
          entry.reject(new ProtocolError(code, message, { requestId }));
        }
      }
      return { ok: true };
    }

    if (requestId && pending.has(requestId)) {
      const entry = pending.get(requestId);
      if (entry) {
        clearTimeout(entry.timer);
        pending.delete(requestId);
        entry.resolve({ kind, payload });
      }
      return { ok: true };
    }

    const handler = handlers.get(kind);
    if (!handler) {
      // A response whose request already timed out is expected and harmless.
      logger.debug('protocol.unhandled', { kind, requestId: requestId ?? null });
      return { ok: true };
    }

    try {
      await handler(payload, { requestId });
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const code =
        error instanceof ProtocolError
          ? error.code
          : (/** @type {{code?: string}} */ (error)?.code ?? 'E_PROTOCOL');
      logger.error('protocol.handler_failed', { kind, error: message });
      sendError(code, message, requestId);
      return { ok: false, code };
    }
  }

  /**
   * @param {string} reason
   */
  function dispose(reason = 'disposed') {
    if (disposed) {
      return;
    }
    disposed = true;
    for (const [, entry] of pending) {
      clearTimeout(entry.timer);
      entry.reject(new ProtocolError('E_CANCELLED', `Bridge closed: ${reason}`));
    }
    pending.clear();
    handlers.clear();
  }

  return {
    on,
    request,
    respond: send,
    handleMessage,
    dispose,
    pendingCount: () => pending.size,
    isDisposed: () => disposed,
    direction: inboundDirection,
  };
}
