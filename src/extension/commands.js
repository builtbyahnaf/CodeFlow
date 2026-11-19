/**
 * Command registration.
 *
 * Every command goes through `guard`, which means no command handler can take
 * down the extension host: failures become a log entry and one user-visible
 * message.
 */

import * as vscode from 'vscode';
import { buildDiagnosticsReport, openDiagnosticsDocument } from './diagnostics.js';

/**
 * @param {{
 *   context: vscode.ExtensionContext,
 *   logger: {info: Function, warn: Function, error: Function, show: Function, level: () => string},
 *   panelManager: {show: () => unknown, showFile: (path: string) => unknown, isOpen: () => boolean, pendingRequests: () => number},
 *   registry: ReturnType<typeof import('../core/adapterRegistry.js').createAdapterRegistry>,
 *   extensionVersion: string,
 * }} options
 */
export function registerCommands({ context, logger, panelManager, registry, extensionVersion }) {
  /**
   * @param {string} commandId
   * @param {() => unknown | Promise<unknown>} handler
   */
  function register(commandId, handler) {
    const disposable = vscode.commands.registerCommand(commandId, async () => {
      try {
        return await handler();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = /** @type {{code?: string}} */ (error)?.code ?? 'E_INTERNAL';
        logger.error('command.failed', { commandId, code, error: message });
        const choice = await vscode.window.showErrorMessage(`CodeFlow: ${message}`, 'Show log');
        if (choice === 'Show log') {
          logger.show();
        }
        return undefined;
      }
    });
    context.subscriptions.push(disposable);
  }

  register('codeflow.openExplorer', () => {
    logger.info('command.openExplorer');
    panelManager.show();
  });

  register('codeflow.analyzeActiveFile', () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      void vscode.window.showWarningMessage(
        'CodeFlow: open a file in the workspace before analysing it.',
      );
      return;
    }
    logger.info('command.analyzeActiveFile', {
      extension: editor.document.uri.path.split('.').pop(),
    });
    panelManager.showFile(editor.document.uri.fsPath);
  });

  register('codeflow.showDiagnostics', async () => {
    const report = buildDiagnosticsReport({
      registry,
      panelManager,
      logger,
      extensionVersion,
    });
    await openDiagnosticsDocument(report);
  });

  register('codeflow.showLog', () => {
    logger.show();
  });
}
