/**
 * Cancellation plumbing shared by the registry and adapters.
 *
 * Adapters receive a token, not a global. They may poll `isCancelled()` or call
 * `throwIfCancelled()` at safe points. The registry converts a cancellation into
 * a partial run, so cancellation is never an unhandled rejection.
 */

export class CancellationError extends Error {
  /** @param {string} [message] */
  constructor(message = 'Analysis was cancelled.') {
    super(message);
    this.name = 'CancellationError';
    this.code = 'E_CANCELLED';
  }
}

/**
 * @typedef {Object} CancellationToken
 * @property {() => boolean} isCancelled
 * @property {(listener: () => void) => () => void} onCancel
 * @property {() => void} throwIfCancelled
 */

/**
 * @param {AbortSignal | {aborted?: boolean, isCancelled?: () => boolean} | null | undefined} source
 * @returns {boolean}
 */
export function isCancellationRequested(source) {
  if (!source) {
    return false;
  }
  if (typeof source.isCancelled === 'function') {
    return source.isCancelled() === true;
  }
  return source.aborted === true;
}

/**
 * @param {AbortSignal | {aborted?: boolean, isCancelled?: () => boolean} | null | undefined} source
 */
export function throwIfCancelled(source) {
  if (isCancellationRequested(source)) {
    throw new CancellationError();
  }
}

/**
 * Create a token plus a `cancel()` function for tests and host commands.
 *
 * @returns {{token: CancellationToken, cancel: (reason?: string) => void, dispose: () => void}}
 */
export function createCancellationSource() {
  /** @type {Set<() => void>} */
  const listeners = new Set();
  let cancelled = false;
  let reason = '';

  /** @type {CancellationToken} */
  const token = {
    isCancelled: () => cancelled,
    onCancel(listener) {
      if (cancelled) {
        listener();
        return () => {};
      }
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    throwIfCancelled() {
      throwIfCancelled(token);
    },
  };

  return {
    token,
    cancel(nextReason = 'cancelled') {
      if (cancelled) {
        return;
      }
      cancelled = true;
      reason = nextReason;
      for (const listener of [...listeners]) {
        try {
          listener();
        } catch {
          // Listeners are adapter code; one failing listener must not stop others.
        }
      }
      listeners.clear();
    },
    dispose() {
      listeners.clear();
      cancelled = true;
    },
    get reason() {
      return reason;
    },
  };
}

/**
 * Bridge an `AbortSignal` to a token.
 *
 * @param {AbortSignal | undefined} signal
 * @returns {CancellationToken | undefined}
 */
export function tokenFromAbortSignal(signal) {
  if (!signal) {
    return undefined;
  }
  return {
    isCancelled: () => signal.aborted === true,
    onCancel(listener) {
      if (signal.aborted) {
        listener();
        return () => {};
      }
      signal.addEventListener('abort', listener, { once: true });
      return () => signal.removeEventListener('abort', listener);
    },
    throwIfCancelled() {
      if (signal.aborted) {
        throw new CancellationError();
      }
    },
  };
}
