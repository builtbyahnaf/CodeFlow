/**
 * Webview & Extension Host Error Containment (Phase 12 §8, P12-16).
 *
 * Ensures any thrown error in a request handler, adapter, or graph query
 * is safely contained into a typed protocol response envelope without
 * taking down the extension host.
 */

import { describeError } from '../core/errors/taxonomy.js';

/**
 * Contain an error and produce a typed protocol envelope response.
 *
 * @param {unknown} error
 * @param {string} [fallbackCode='E_INTERNAL']
 * @returns {{
 *   ok: false,
 *   code: string,
 *   message: string,
 *   severity: string,
 *   recoveryAction: string,
 * }}
 */
export function containError(error, fallbackCode = 'E_INTERNAL') {
  const code =
    /** @type {{code?: string}} */ (error)?.code || fallbackCode;
  const taxonomy = describeError(code);
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? taxonomy.userMessage);

  return {
    ok: false,
    code: taxonomy.code,
    message: rawMessage || taxonomy.userMessage,
    severity: taxonomy.severity,
    recoveryAction: taxonomy.recoveryAction,
  };
}
