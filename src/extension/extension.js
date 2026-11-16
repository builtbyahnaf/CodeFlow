/**
 * Extension entry point.
 *
 * Activation is deliberately cheap: create a logger, build the adapter registry,
 * register three commands. Nothing touches the file system, spawns a process, or
 * reads workspace contents until the user invokes a command. That keeps startup
 * fast and keeps Restricted Mode inert.
 */

import * as vscode from 'vscode';
import { createLogger } from './log.js';
import { createAdapterRegistry } from '../core/adapterRegistry.js';
import { mockAdapter } from '../adapters/mock/index.js';
import { createPanelManager } from './panel.js';
import { registerCommands } from './commands.js';
import { PROTOCOL_VERSION } from '../core/protocol/envelope.js';

const EXTENSION_VERSION = '0.0.1';

/**
 * @param {vscode.ExtensionContext} context
 */
export async function activate(context) {
  const startedAt = Date.now();
  const logger = createLogger(context);

  const registry = createAdapterRegistry();
  registry.register(mockAdapter);

  const panelManager = createPanelManager({
    context,
    logger,
    registry,
    extensionVersion: EXTENSION_VERSION,
  });

  registerCommands({
    context,
    logger,
    panelManager,
    registry,
    extensionVersion: EXTENSION_VERSION,
  });

  context.subscriptions.push({
    dispose() {
      panelManager.dispose();
    },
  });

  logger.info('extension.activated', {
    ms: Date.now() - startedAt,
    version: EXTENSION_VERSION,
    vscode: vscode.version,
    trusted: vscode.workspace.isTrusted,
  });

  // Returned for integration tests and future commands; not a public API.
  return {
    version: EXTENSION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    registry,
    panelManager,
    logger,
  };
}

export function deactivate() {
  // Disposables registered in `context.subscriptions` handle teardown.
}
