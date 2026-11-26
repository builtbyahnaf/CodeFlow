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
import path from 'node:path';
import { renderPanelHtml } from './panelTemplate.js';
import { createPanelWire } from './panelWire.js';
import { createSourceAccess } from './sourceAccess.js';
import { resolveWorkspacePath } from './sourcePaths.js';
import { resolvePreviewSettings, settingsChanged } from '../core/source/settings.js';
import {
  explanationSettingsChanged,
  resolveExplanationSettings,
} from '../core/explanation/settings.js';

/**
 * @param {{
 *   context: vscode.ExtensionContext,
 *   logger: {debug: Function, warn: Function, error: Function},
 *   registry: ReturnType<typeof import('../core/adapterRegistry.js').createAdapterRegistry>,
 *   analysis?: {analyze: (input: object) => Promise<any>},
 *   extensionVersion: string,
 * }} options
 */
export function createPanelManager({
  context,
  logger,
  registry,
  analysis,
  extensionVersion,
  indexProvider = null,
  indexActions = null,
  onPanelOpen = null,
}) {
  /** @type {vscode.WebviewPanel | null} */
  let panel = null;
  /** @type {{dispose: Function, respond: Function, pendingCount: Function} | null} */
  let bridge = null;
  let runCounter = 0;
  /** @type {string | null} */
  let preferredPath = null;
  /** @type {string | null} */
  let preferredSymbolId = null;
  /** @type {'cfg'|'call_graph'|'semantic_zoom'} */
  let preferredPerspective = 'cfg';
  const analyzer = analysis ?? registry;

  /** @type {string | null} */
  let activeWorkspaceRoot = null;

  /**
   * @param {string|null|undefined} targetPath
   * @returns {string|undefined}
   */
  function workspaceRootFor(targetPath) {
    if (typeof targetPath === 'string' && targetPath.length > 0 && path.isAbsolute(targetPath)) {
      const folder = vscode.workspace.getWorkspaceFolder(vscode.Uri.file(targetPath));
      if (folder) {
        return folder.uri.fsPath;
      }
      return path.dirname(targetPath);
    }
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  }

  function workspaceRoot() {
    return (
      activeWorkspaceRoot ??
      workspaceRootFor(preferredPath) ??
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    );
  }

  function previewSettings() {
    const config = vscode.workspace.getConfiguration('codeflow');
    return {
      ...resolvePreviewSettings({
        enabled: config.get('preview.enabled', true),
        delayMs: config.get('preview.delayMs', 300),
        maxLines: config.get('preview.maxLines', 12),
        syntaxHighlighting: config.get('preview.syntaxHighlighting', true),
        clickToNavigate: config.get('preview.clickToNavigate', true),
        pinByDefault: config.get('preview.pinByDefault', false),
        openInPreviewTab: config.get('navigation.openInPreviewTab', false),
      }),
      explanation: resolveExplanationSettings({
        defaultDepth: config.get('explanation.defaultDepth', 2),
        showEvidence: config.get('explanation.showEvidence', true),
        includeLimitations: config.get('explanation.includeLimitations', true),
      }),
    };
  }

  const sourceAccess = createSourceAccess({
    workspaceRoot,
    logger,
    settings: () => {
      const current = previewSettings();
      return { maxLines: current.maxLines };
    },
  });

  /**
   * Navigate only when the document still matches the analysis. A guessed
   * reveal is worse than a warning.
   *
   * @param {{fileId: string, range: Record<string, any>}} request
   * @returns {Promise<{ok: true} | {ok: false, code: string, message: string}>}
   */
  async function navigateToRange({ fileId, range }) {
    const checked = await sourceAccess.validate([range]);
    if (!checked.ok) {
      return { ok: false, code: checked.code, message: checked.message };
    }
    const integrity = checked.results?.[0]?.integrity;
    if (integrity === 'stale') {
      return {
        ok: false,
        code: 'E_SOURCE_STALE',
        message: 'The document changed since this analysis. Re-analyze before navigating.',
      };
    }
    if (integrity !== 'exact') {
      return {
        ok: false,
        code: 'E_SOURCE_MISSING',
        message: String(checked.results?.[0]?.reason ?? 'The source document is not available.'),
      };
    }
    const relativePath = sourceAccess.relativePathFor(fileId);
    const root = workspaceRoot();
    const resolved = resolveWorkspacePath(root ?? '', relativePath ?? '');
    if (!resolved.ok) {
      return resolved;
    }
    const document = await vscode.workspace.openTextDocument(
      vscode.Uri.file(resolved.absolutePath),
    );
    const selection = new vscode.Range(
      range.startLine,
      range.startColumn,
      range.endLine,
      range.endColumn,
    );
    const settings = previewSettings();
    const editor = await vscode.window.showTextDocument(document, {
      preview: settings.openInPreviewTab,
      preserveFocus: false,
    });
    editor.selection = new vscode.Selection(
      range.startLine,
      range.startColumn,
      range.endLine,
      range.endColumn,
    );
    editor.revealRange(selection, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    return { ok: true };
  }

  const wire = createPanelWire({
    logger,
    registry,
    extensionVersion,
    loadRun: (path) => analyzeRun(path),
    defaultPath: () => {
      if (preferredPath) {
        return preferredPath;
      }
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        const filePath = activeEditor.document.uri.fsPath;
        const adapter = registry.resolve(filePath);
        if (adapter && adapter.id !== 'mock') {
          return filePath;
        }
      }
      return 'sample.mock';
    },
    sourceAccess,
    navigate: navigateToRange,
    getSettings: previewSettings,
    indexProvider,
    indexActions,
  });

  /** @type {ReturnType<typeof setTimeout>|null} */
  let selectionTimer = null;
  context.subscriptions.push(
    vscode.window.onDidChangeTextEditorSelection((event) => {
      if (!bridge || event.textEditor.document.uri.scheme !== 'file') {
        return;
      }
      if (selectionTimer) {
        clearTimeout(selectionTimer);
      }
      selectionTimer = setTimeout(() => {
        selectionTimer = null;
        if (!bridge) {
          return;
        }
        const selection = event.selections[0];
        bridge.notifyEditorSelection?.({
          path: event.textEditor.document.uri.fsPath,
          range: {
            startLine: selection.start.line,
            startColumn: selection.start.character,
            endLine: selection.end.line,
            endColumn: selection.end.character,
          },
        });
      }, 100);
    }),
  );
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (settingsChanged(event) || explanationSettingsChanged(event)) {
        bridge?.pushSettings?.(previewSettings());
      }
    }),
  );

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
  async function analyzeRun(targetPath) {
    runCounter += 1;
    const runId = `run:${Date.now().toString(36)}-${runCounter}`;
    const root = workspaceRootFor(targetPath) ?? workspaceRoot();
    if (root) {
      activeWorkspaceRoot = root;
    }
    const result = await analyzer.analyze({
      path: targetPath,
      runId,
      ...(root ? { workspaceRoot: root } : {}),
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
      preferredPerspective,
    });
  }

  function show() {
    if (!preferredPath) {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.uri.scheme === 'file') {
        const filePath = activeEditor.document.uri.fsPath;
        const adapter = registry.resolve(filePath);
        if (adapter && adapter.id !== 'mock') {
          preferredPath = filePath;
        }
      }
    }
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
    if (typeof onPanelOpen === 'function') {
      void Promise.resolve(onPanelOpen()).catch(() => {});
    }
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
      preferredPerspective = 'cfg';
      if (panel) {
        applyHtml(panel);
        panel.reveal(undefined, false);
        return panel;
      }
      return show();
    },
    /**
     * Show the panel for a file in the call-graph perspective for a specific function.
     *
     * @param {string} filePath
     * @param {string} symbolId
     */
    showCallGraph(filePath, symbolId) {
      preferredPath = filePath;
      preferredSymbolId = symbolId;
      preferredPerspective = 'call_graph';
      if (panel) {
        applyHtml(panel);
        panel.reveal(undefined, false);
        return panel;
      }
      return show();
    },
    /**
     * Show the panel in the L0–L5 progressive semantic zoom overview perspective.
     */
    showWorkspaceOverview() {
      preferredSymbolId = null;
      preferredPerspective = 'semantic_zoom';
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
    /**
     * Reveal the panel and restore focus to the last selected graph node.
     */
    focusGraph() {
      if (!panel) {
        return undefined;
      }
      panel.reveal(undefined, false);
      bridge?.focusGraph?.();
      return panel;
    },
    dispose() {
      if (selectionTimer) {
        clearTimeout(selectionTimer);
        selectionTimer = null;
      }
      if (bridge) {
        bridge.dispose('extension_disposed');
        bridge = null;
      }
      sourceAccess.dispose();
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
