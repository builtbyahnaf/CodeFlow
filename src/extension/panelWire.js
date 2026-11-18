/**
 * Panel bridge wiring.
 *
 * Kept free of the `vscode` module so the subscription contract — subscribe on
 * `panel.webview`, never on the panel itself — can be unit-tested in plain Node.
 * Getting this wrong is silent: messages simply never reach the bridge and every
 * request times out.
 *
 * The host owns the current validated run and its query layer. The webview asks
 * for graph data, CSR, or individual queries; it never receives adapter objects
 * and never imports one.
 */

import { createBridge } from '../core/protocol/bridge.js';
import { DIRECTIONS, PROTOCOL_VERSION, createErrorPayload } from '../core/protocol/envelope.js';
import { buildGraph } from '../core/graph/model.js';
import { toDto } from '../core/graph/dto.js';
import { hashRun } from '../core/csr/serialize.js';

/** @typedef {ReturnType<typeof import('../core/csr/query.js').createQueryLayer>} QueryLayer */

/**
 * @typedef {Object} WireOptions
 * @property {{debug: Function, warn: Function, error: Function}} logger
 * @property {{capabilityMatrix: () => unknown[], query: (run: object) => QueryLayer}} registry
 * @property {string} extensionVersion
 * @property {(path: string) => Promise<
 *   {ok: true, run: import('../core/csr/entities.js').AnalysisRun} |
 *   {ok: false, code: string, message: string, issues?: unknown}
 * >} loadRun
 */

/**
 * @param {WireOptions} options
 */
export function createPanelWire({ logger, registry, extensionVersion, loadRun }) {
  return function wire(target) {
    if (!target?.webview || typeof target.webview.onDidReceiveMessage !== 'function') {
      throw new TypeError('Panel target must expose webview.onDidReceiveMessage.');
    }

    const loggerProxy = {
      debug: /** @param {string} message @param {Record<string, unknown>} [fields] */ (
        message,
        fields,
      ) => logger.debug(message, fields),
      warn: (message, fields) => logger.warn(message, fields),
      error: (message, fields) => logger.error(message, fields),
    };

    const bridge = createBridge({
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

    /** @type {{path: string, run: import('../core/csr/entities.js').AnalysisRun, query: QueryLayer, hash: string} | null} */
    let current = null;

    /**
     * @param {string} [path]
     * @returns {Promise<
     *   {ok: true, run: import('../core/csr/entities.js').AnalysisRun, query: QueryLayer} |
     *   {ok: false, code: string, message: string, issues?: unknown}
     * >}
     */
    async function ensureRun(path = 'sample.mock') {
      if (current && current.path === path) {
        return { ok: true, run: current.run, query: current.query };
      }
      const loaded = await loadRun(path);
      if (!loaded.ok) {
        return loaded;
      }
      const query = registry.query(loaded.run);
      current = {
        path,
        run: loaded.run,
        query,
        hash: hashRun(loaded.run),
      };
      return { ok: true, run: current.run, query };
    }

    bridge.on('webview.ready', async (_payload, { requestId }) => {
      bridge.respond(
        'capabilities.data',
        {
          protocolVersion: PROTOCOL_VERSION,
          extensionVersion,
          adapters: registry.capabilityMatrix(),
          capabilities: {
            cfp: false,
            callGraph: true,
            dataFlow: false,
            hoverPreview: false,
            projectIndex: false,
          },
          demoMode: true,
        },
        requestId,
      );
    });

    bridge.on('graph.load', async (_payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      bridge.respond('graph.data', { dto: toDto(buildGraph(loaded.run)) }, requestId);
    });

    bridge.on('csr.load', async (payload, { requestId }) => {
      const loaded = await ensureRun(typeof payload.path === 'string' ? payload.path : undefined);
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      bridge.respond(
        'csr.data',
        {
          run: loaded.run,
          hash: current?.hash ?? hashRun(loaded.run),
        },
        requestId,
      );
    });

    /**
     * Run a typed query against the current run. Query-level degradation is
     * carried in `query.data`, not as a transport error.
     *
     * @param {string} kind
     * @param {(payload: Record<string, unknown>, query: QueryLayer) => {ok: true, value: unknown} | {ok: false, code: string, message: string}} run
     */
    function queryHandler(kind, run) {
      bridge.on(kind, async (payload, { requestId }) => {
        const loaded = await ensureRun();
        if (!loaded.ok) {
          bridge.respond(
            'protocol.error',
            createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
            requestId,
          );
          return;
        }
        const result = run(payload, loaded.query);
        bridge.respond('query.data', result, requestId);
      });
    }

    queryHandler('query.symbol', (payload, query) =>
      query.symbolById(typeof payload.symbolId === 'string' ? payload.symbolId : ''),
    );
    queryHandler('query.symbols', (payload, query) =>
      query.symbolsInFile(typeof payload.fileId === 'string' ? payload.fileId : ''),
    );
    queryHandler('query.callers', (payload, query) =>
      query.callers(typeof payload.symbolId === 'string' ? payload.symbolId : '', {
        statuses: Array.isArray(payload.statuses) ? payload.statuses : undefined,
      }),
    );
    queryHandler('query.callees', (payload, query) =>
      query.callees(typeof payload.symbolId === 'string' ? payload.symbolId : '', {
        statuses: Array.isArray(payload.statuses) ? payload.statuses : undefined,
      }),
    );
    queryHandler('query.constructs', (payload, query) =>
      query.constructsOf(typeof payload.symbolId === 'string' ? payload.symbolId : ''),
    );
    queryHandler('query.capabilities', (_payload, query) => query.capabilities());

    bridge.on('node.select', async (payload) => {
      logger.debug('panel.node_selected', { nodeId: payload.nodeId ?? null });
    });

    bridge.on('panel.ping', async (_payload, { requestId }) => {
      bridge.respond('panel.pong', { at: Date.now() }, requestId);
    });

    target.webview.onDidReceiveMessage((message) => {
      void bridge.handleMessage(message);
    });

    target.onDidDispose(() => {
      current = null;
      bridge.dispose('panel_disposed');
    });

    /**
     * Push progress without a request. Reserved for Phase 2 long-running
     * analyses; the kind and direction are part of the protocol now.
     *
     * @param {{phase: string, fraction?: number}} progress
     */
    bridge.emitProgress = (progress) => {
      if (!bridge.isDisposed()) {
        bridge.respond('analysis.progress', progress);
      }
    };

    return bridge;
  };
}
