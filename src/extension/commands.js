/**
 * Command registration.
 *
 * Every command goes through `guard`, which means no command handler can take
 * down the extension host: failures become a log entry and one user-visible
 * message.
 */

import * as vscode from 'vscode';
import { buildDiagnosticsReport, openDiagnosticsDocument } from './diagnostics.js';
import {
  getCategoryQuickPickItems,
  getAllCategorizedSettingKeys,
} from './settings/index.js';

/**
 * @param {{
 *   context: vscode.ExtensionContext,
 *   logger: {info: Function, warn: Function, error: Function, show: Function, level: () => string},
 *   panelManager: {
 *     show: () => unknown,
 *     showFile: (path: string) => unknown,
 *     showCfg: (path: string, symbolId: string) => unknown,
 *     showCallGraph?: (path: string, symbolId: string) => unknown,
 *     listCfgFunctions: (path: string) => Promise<{ok: boolean, [key: string]: unknown}>,
 *     focusGraph: () => unknown,
 *     isOpen: () => boolean,
 *     pendingRequests: () => number,
 *   },
 *   registry: ReturnType<typeof import('../core/adapterRegistry.js').createAdapterRegistry>,
 *   extensionVersion: string,
 * }} options
 */
export function registerCommands({
  context,
  logger,
  panelManager,
  registry,
  extensionVersion,
  indexService = null,
}) {
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
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.uri.scheme === 'file') {
      const adapter = registry.resolve(editor.document.uri.fsPath);
      if (adapter && adapter.id !== 'mock') {
        panelManager.showFile(editor.document.uri.fsPath);
        return;
      }
    }
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

  register('codeflow.showCfg', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      void vscode.window.showWarningMessage(
        'CodeFlow: open a supported file before showing its control flow.',
      );
      return;
    }
    const filePath = editor.document.uri.fsPath;
    const listed =
      /** @type {{ok: true, functions: Array<{symbolId: string, name: string, qualifiedName: string, kind: string}>} | {ok: false, code: string, message: string}} */ (
        await panelManager.listCfgFunctions(filePath)
      );
    if (!listed.ok) {
      void vscode.window.showWarningMessage(`CodeFlow: ${listed.message}`);
      return;
    }
    if (listed.functions.length === 0) {
      void vscode.window.showInformationMessage(
        'CodeFlow: this file has no function with a control-flow graph to show.',
      );
      panelManager.showFile(filePath);
      return;
    }
    const picked = await vscode.window.showQuickPick(
      listed.functions.map((entry) => ({
        label: entry.qualifiedName,
        description: entry.kind,
        symbolId: entry.symbolId,
      })),
      { title: 'CodeFlow: show control-flow graph', placeHolder: 'Select a function' },
    );
    if (!picked) {
      return;
    }
    logger.info('command.showCfg', { file: filePath });
    panelManager.showCfg(filePath, picked.symbolId);
  });

  register('codeflow.showCallGraph', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.uri.scheme !== 'file') {
      void vscode.window.showWarningMessage(
        'CodeFlow: open a supported file before showing its call graph.',
      );
      return;
    }
    const filePath = editor.document.uri.fsPath;
    const listed =
      /** @type {{ok: true, functions: Array<{symbolId: string, name: string, qualifiedName: string, kind: string}>} | {ok: false, code: string, message: string}} */ (
        await panelManager.listCfgFunctions(filePath)
      );
    if (!listed.ok) {
      void vscode.window.showWarningMessage(`CodeFlow: ${listed.message}`);
      return;
    }
    if (listed.functions.length === 0) {
      void vscode.window.showInformationMessage(
        'CodeFlow: this file has no function with a call graph to show.',
      );
      panelManager.showFile(filePath);
      return;
    }
    const picked = await vscode.window.showQuickPick(
      listed.functions.map((entry) => ({
        label: entry.qualifiedName,
        description: entry.kind,
        symbolId: entry.symbolId,
      })),
      { title: 'CodeFlow: show call graph', placeHolder: 'Select a function' },
    );
    if (!picked) {
      return;
    }
    logger.info('command.showCallGraph', { file: filePath });
    if (typeof panelManager.showCallGraph === 'function') {
      panelManager.showCallGraph(filePath, picked.symbolId);
    } else {
      panelManager.showCfg(filePath, picked.symbolId);
    }
  });

  register('codeflow.backToGraph', () => {
    logger.info('command.backToGraph');
    panelManager.focusGraph();
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

  register('codeflow.indexWorkspace', async () => {
    logger.info('command.indexWorkspace');
    return indexService?.indexWorkspace?.();
  });

  register('codeflow.cancelIndexing', () => {
    logger.info('command.cancelIndexing');
    return indexService?.cancelIndexing?.();
  });

  register('codeflow.rebuildIndex', async () => {
    logger.info('command.rebuildIndex');
    return indexService?.rebuildIndex?.();
  });

  register('codeflow.repairIndex', async () => {
    logger.info('command.repairIndex');
    return indexService?.repairIndex?.();
  });

  register('codeflow.showIndexStatus', async () => {
    logger.info('command.showIndexStatus');
    return indexService?.showIndexStatus?.();
  });

  register('codeflow.clearIndex', async () => {
    logger.info('command.clearIndex');
    return indexService?.clearIndex?.();
  });

  register('codeflow.openIndexConfiguration', async () => {
    logger.info('command.openIndexConfiguration');
    return indexService?.openIndexConfiguration?.();
  });

  register('codeflow.showWorkspaceOverview', () => {
    logger.info('command.showWorkspaceOverview');
    if (typeof panelManager.showWorkspaceOverview === 'function') {
      panelManager.showWorkspaceOverview();
    } else {
      panelManager.show();
    }
  });

  register('codeflow.configure', async () => {
    const items = getCategoryQuickPickItems();
    const picked = await vscode.window.showQuickPick(
      items.map((item) => ({
        label: item.label,
        description: item.description,
        categoryId: item.id,
      })),
      {
        title: 'CodeFlow: Configure Settings',
        placeHolder: 'Select a settings category to configure',
      },
    );
    if (!picked) {
      return;
    }
    logger.info('command.configure', { categoryId: picked.categoryId });
    await vscode.commands.executeCommand('workbench.action.openSettings', 'codeflow');
  });

  register('codeflow.resetSettings', async () => {
    const choice = await vscode.window.showWarningMessage(
      'Are you sure you want to reset all CodeFlow settings to their default values?',
      { modal: true },
      'Reset All Settings',
    );
    if (choice !== 'Reset All Settings') {
      return;
    }
    logger.info('command.resetSettings');
    const config = vscode.workspace.getConfiguration('codeflow');
    const allKeys = getAllCategorizedSettingKeys();
    for (const key of allKeys) {
      const subKey = key.replace(/^codeflow\./, '');
      try {
        await config.update(subKey, undefined, vscode.ConfigurationTarget.Global);
        await config.update(subKey, undefined, vscode.ConfigurationTarget.Workspace);
      } catch {
        // Safe ignore
      }
    }
    void vscode.window.showInformationMessage('CodeFlow settings have been reset to defaults.');
  });
}
