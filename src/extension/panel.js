/**
 * Webview panel host.
 *
 * Owns exactly one graph panel per window. Creating a second panel would
 * duplicate analysis work and split navigation state, so `show()` reveals the
 * existing panel instead.
 *
 * All message handling goes through the validated bridge; nothing in this file
 * parses raw webview messages.
 */

import * as vscode from 'vscode';
import crypto from 'node:crypto';
import { renderPanelHtml } from './panelTemplate.js';
import { createPanelWire } from './panelWire.js';

/**
 * @param {{
 *   context: vscode.ExtensionContext,
 *   logger: {debug: Function, warn: Function, error: Function},
 *   registry: ReturnType<typeof import('../core/adapterRegistry.js').createAdapterRegistry>,
 *   analysis?: {analyze: (input: object) => Promise<any>},
 *   extensionVersion: string,
 * }} options
 */
export function createPanelManager({ context, logger, registry, analysis, extensionVersion }) {
  /** @type {vscode.WebviewPanel | null} */
  let panel = null;
  /** @type {{dispose: Function, respond: Function, pendingCount: Function} | null} */
  let bridge = null;
  let runCounter = 0;
  /** @type {string | null} */
  let preferredPath = null;
  /** @type {string | null} */
  let preferredSymbolId = null;
  const analyzer = analysis ?? registry;

  const wire = createPanelWire({
    logger,
    registry,
    extensionVersion,
    loadRun: (path) => analyzeRun(path),
    defaultPath: () => preferredPath ?? 'sample.mock',
  });

  function webviewRoot() {
    return vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview');
  }

  /**
   * @param {string} path
   * @returns {Promise<
   *   {ok: true, run: import('../core/csr/entities.js').AnalysisRun} |
   *   {ok: false, code: string, message: string, issues?: unknown}
   * >}
   */
  async function analyzeRun(path) {
    runCounter += 1;
    const runId = `run:${Date.now().toString(36)}-${runCounter}`;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const result = await analyzer.analyze({
      path,
      runId,
      ...(workspaceRoot ? { workspaceRoot } : {}),
      trusted: vscode.workspace.isTrusted,
    });
    if (!result.ok) {
      return {
        ok: false,
        code: result.code,
        message: result.message,
        issues: result.issues,
      };
    }
    return { ok: true, run: result.run };
  }

  function applyHtml(target) {
    const nonce = crypto.randomBytes(16).toString('base64');
    const webview = target.webview;
    const root = webviewRoot();
    webview.options = {
      enableScripts: true,
      retainContextWhenHidden: Boolean(
        vscode.workspace.getConfiguration('codeflow').get('explorer.retainContext', false),
      ),
      localResourceRoots: [root],
    };
    webview.html = renderPanelHtml({
      nonce,
      cspSource: webview.cspSource,
      scriptUri: webview.asWebviewUri(vscode.Uri.joinPath(root, 'main.js')).toString(),
      styleUri: webview.asWebviewUri(vscode.Uri.joinPath(root, 'styles.css')).toString(),
      title: 'CodeFlow',
      preferredSymbolId,
    });
  }

  function show() {
    if (panel) {
      panel.reveal(undefined, false);
      return panel;
    }

    const created = vscode.window.createWebviewPanel(
      'codeflow.graph',
      'CodeFlow',
      { viewColumn: vscode.ViewColumn.Beside, preserveFocus: false },
      {
        enableScripts: true,
        localResourceRoots: [webviewRoot()],
      },
    );
    panel = created;
    applyHtml(created);
    bridge = wire(created);
    created.onDidDispose(() => {
      if (panel === created) {
        panel = null;
        bridge = null;
      }
    });
    return created;
  }

  return {
    show,
    /**
     * Show the panel and analyze a specific file. Re-applying the HTML makes
     * the webview request its graph again, now with the preferred path.
     *
     * @param {string} filePath
     */
    showFile(filePath) {
      preferredPath = filePath;
      preferredSymbolId = null;
      if (panel) {
        applyHtml(panel);
        panel.reveal(undefined, false);
        return panel;
      }
      return show();
    },
    /**
     * Show the panel for a file with a specific function preselected. Symbol
     * ids are content-derived, so re-analysis in the webview resolves the same
     * function.
     *
     * @param {string} filePath
     * @param {string} symbolId
     */
    showCfg(filePath, symbolId) {
      preferredPath = filePath;
      preferredSymbolId = symbolId;
      if (panel) {
        applyHtml(panel);
        panel.reveal(undefined, false);
        return panel;
      }
      return show();
    },
    /**
     * List functions that have control constructs, for the command quick pick.
     * Runs through the same host analysis pipeline as the panel.
     *
     * @param {string} filePath
     * @returns {Promise<
     *   {ok: true, functions: Array<{symbolId: string, name: string, qualifiedName: string, kind: string}>} |
     *   {ok: false, code: string, message: string, issues?: unknown}
     * >}
     */
    async listCfgFunctions(filePath) {
      const loaded = await analyzeRun(filePath);
      if (!loaded.ok) {
        return loaded;
      }
      const query = registry.query(loaded.run);
      const result = query.cfgFunctions();
      if (!result.ok) {
        return { ok: false, code: result.code, message: result.message };
      }
      return { ok: true, functions: result.value };
    },
    dispose() {
      if (bridge) {
        bridge.dispose('extension_disposed');
        bridge = null;
      }
      if (panel) {
        panel.dispose();
        panel = null;
      }
    },
    isOpen: () => panel !== null,
    pendingRequests: () => (bridge ? bridge.pendingCount() : 0),
    /** Test hook: rebuild the HTML for the open panel. */
    reload() {
      if (panel) {
        applyHtml(panel);
      }
    },
  };
}
