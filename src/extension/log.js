/**
 * Output-channel logger.
 *
 * The only place in the extension that knows how to write to VS Code. Formatting
 * and redaction live in `src/core/log/redact.js` so they can be tested without a
 * host.
 */

import * as vscode from 'vscode';
import { formatLogLine } from '../core/log/redact.js';

/** @typedef {'off'|'error'|'warn'|'info'|'debug'} LogLevel */

/** @type {Record<LogLevel, number>} */
const LEVEL_RANK = { off: 0, error: 1, warn: 2, info: 3, debug: 4 };

/**
 * @param {unknown} value
 * @returns {LogLevel}
 */
function coerceLevel(value) {
  return typeof value === 'string' && value in LEVEL_RANK
    ? /** @type {LogLevel} */ (value)
    : 'warn';
}

/**
 * @param {vscode.ExtensionContext} context
 * @returns {{
 *   debug: (message: string, fields?: Record<string, unknown>) => void,
 *   info: (message: string, fields?: Record<string, unknown>) => void,
 *   warn: (message: string, fields?: Record<string, unknown>) => void,
 *   error: (message: string, fields?: Record<string, unknown>) => void,
 *   show: () => void,
 *   level: () => LogLevel,
 *   dispose: () => void,
 * }}
 */
export function createLogger(context) {
  const channel = vscode.window.createOutputChannel('CodeFlow');
  let level = coerceLevel(vscode.workspace.getConfiguration('codeflow').get('logLevel', 'warn'));

  const configListener = vscode.workspace.onDidChangeConfiguration((event) => {
    if (event.affectsConfiguration('codeflow.logLevel')) {
      level = coerceLevel(vscode.workspace.getConfiguration('codeflow').get('logLevel', 'warn'));
    }
  });
  context.subscriptions.push(channel, configListener);

  /**
   * @param {LogLevel} entryLevel
   * @param {string} message
   * @param {Record<string, unknown>} [fields]
   */
  function write(entryLevel, message, fields) {
    if (LEVEL_RANK[entryLevel] > LEVEL_RANK[level] || level === 'off') {
      return;
    }
    channel.appendLine(formatLogLine({ level: entryLevel, message, fields }));
  }

  return {
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
    show: () => channel.show(true),
    level: () => level,
    dispose: () => {
      configListener.dispose();
      channel.dispose();
    },
  };
}
