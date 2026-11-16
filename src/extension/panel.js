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
import { createBridge } from '../core/protocol/bridge.js';
import { renderPanelHtml } from './panelTemplate.js';
import { buildGraph } from '../core/graph/model.js';
import { toDto } from '../core/graph/dto.js';
import { DIRECTIONS, PROTOCOL_VERSION, createErrorPayload } from '../core/protocol/envelope.js';

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

  function webviewRoot() {
    return vscode.Uri.joinPath(context.extensionUri, 'dist', 'webview');
  }

  /**
   * @param {string} path
   * @returns {{ok: true, dto: object} | {ok: false, code: string, message: string, issues?: unknown}}
   */
  async function buildGraphDto(path) {
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
    return { ok: true, dto: toDto(buildGraph(analysis.run)) };
  }

  function applyHtml(target) {
    const nonce = crypto.randomBytes(16).toString('base64');
    const webview = target.webview;
    const root = webviewRoot();
    webview.options = {
      enableScripts: true,
      retainContextWhenHidden: Boolean(
        vscode.workspace
          .getConfiguration('codeflow')
          .get('explorer.retainContext', false),
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

  function wire(target) {
    const loggerProxy = {
      debug: /** @param {string} message @param {Record<string, unknown>} [fields] */ (
        message,
        fields,
      ) => logger.debug(message, fields),
      warn: (message, fields) => logger.warn(message, fields),
      error: (message, fields) => logger.error(message, fields),
    };

    const nextBridge = createBridge({
      post: (message) => {
        void Promise.resolve(target.webview.postMessage(message)).then(
          (delivered) => {
            if (!delivered) {
              logger.debug('panel.post_undelivered', { kind: message.kind });
            }
          },
          (error) => {
            logger.debug('panel.post_failed', {
              kind: message.kind,
              error: error instanceof Error ? error.message : String(error),
            });
          },
        );
      },
      inboundDirection: DIRECTIONS.WEBVIEW_TO_HOST,
      logger: loggerProxy,
    });

    nextBridge.on('webview.ready', async (_payload, { requestId }) => {
      nextBridge.respond(
        'capabilities.data',
        {
          protocolVersion: PROTOCOL_VERSION,
          extensionVersion,
          adapters: registry.capabilityMatrix(),
          capabilities: {
            cfp: false,
            callGraph: false,
            dataFlow: false,
            hoverPreview: false,
            projectIndex: false,
          },
          demoMode: true,
        },
        requestId,
      );
    });

    nextBridge.on('graph.load', async (_payload, { requestId }) => {
      const result = await buildGraphDto('sample.mock');
      if (!result.ok) {
        nextBridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message, { issues: result.issues }),
          requestId,
        );
        return;
      }
      nextBridge.respond('graph.data', { dto: result.dto }, requestId);
    });

    nextBridge.on('node.select', async (payload) => {
      logger.debug('panel.node_selected', { nodeId: payload.nodeId ?? null });
    });

    nextBridge.on('panel.ping', async (_payload, { requestId }) => {
      nextBridge.respond('panel.pong', { at: Date.now() }, requestId);
    });

    target.onDidReceiveMessage((message) => {
      void nextBridge.handleMessage(message);
    });

    target.onDidDispose(() => {
      nextBridge.dispose('panel_disposed');
      if (panel === target) {
        panel = null;
        bridge = null;
      }
    });

    return nextBridge;
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
