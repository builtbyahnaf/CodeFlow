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
 *   extensionVersion: string,
 * }} options
 */
export function createPanelManager({ context, logger, registry, extensionVersion }) {
  /** @type {vscode.WebviewPanel | null} */
  let panel = null;
  /** @type {{dispose: Function, respond: Function, pendingCount: Function} | null} */
  let bridge = null;
  let runCounter = 0;

  const wire = createPanelWire({
    logger,
    registry,
    extensionVersion,
    loadRun: (path) => analyzeRun(path),
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
    const analysis = await registry.analyze({ path, runId });
    if (!analysis.ok) {
      return {
        ok: false,
        code: analysis.code,
        message: analysis.message,
        issues: analysis.issues,
      };
    }
    return { ok: true, run: analysis.run };
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
