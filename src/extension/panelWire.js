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
import { buildCfg } from '../core/graph/cfg/builder.js';
import { toCfgDto } from '../core/graph/cfg/dto.js';
import { hashRun } from '../core/csr/serialize.js';
import { normalizeRangeRef, containsPosition, rangesOverlap } from '../core/source/ranges.js';

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
 * @property {() => string} [defaultPath]
 * @property {{
 *   captureBaseline?: (files: Array<{fileId: string, path: string}>) => Promise<unknown>,
 *   slice?: (payload: Record<string, unknown>) => Promise<{ok: true, slice: Record<string, unknown>} | {ok: false, code: string, message: string}>,
 *   validate?: (ranges: Array<Record<string, unknown>>) => Promise<{ok: true, results: Array<Record<string, unknown>>} | {ok: false, code: string, message: string}>,
 *   onDidInvalidate?: (handler: (event: {fileIds: string[], reason: string}) => void) => {dispose: () => void},
 *   relativePathFor?: (fileId: string) => string|null,
 * }} [sourceAccess]
 * @property {(request: {fileId: string, range: Record<string, any>, nodeId?: string}) => Promise<{ok: true} | {ok: false, code: string, message: string}>} [navigate]
 * @property {() => Record<string, unknown>} [getSettings]
 */

/**
 * @param {WireOptions} options
 */
export function createPanelWire({
  logger,
  registry,
  extensionVersion,
  loadRun,
  defaultPath = () => 'sample.mock',
  sourceAccess = null,
  navigate = null,
  getSettings = null,
}) {
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
    /** @type {Record<string, any>|null} */
    let lastDto = null;
    /** @type {string|null} */
    let selectedNodeId = null;

    /**
     * @param {string} value
     * @returns {string}
     */
    function normalizePath(value) {
      return String(value ?? '')
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/')
        .toLowerCase();
    }

    /**
     * @param {string} filePath
     * @returns {string|null}
     */
    function fileIdForPath(filePath) {
      if (!current) {
        return null;
      }
      const wanted = normalizePath(filePath);
      const file = current.run.files.find((entry) => {
        const declared = normalizePath(entry.path);
        return declared === wanted || wanted.endsWith(`/${declared}`);
      });
      return file?.fileId ?? null;
    }

    /**
     * @param {string} [path]
     * @returns {Promise<
     *   {ok: true, run: import('../core/csr/entities.js').AnalysisRun, query: QueryLayer} |
     *   {ok: false, code: string, message: string, issues?: unknown}
     * >}
     */
    async function ensureRun(path = defaultPath()) {
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
      lastDto = null;
      selectedNodeId = null;
      if (sourceAccess?.captureBaseline) {
        try {
          await sourceAccess.captureBaseline(loaded.run.files);
        } catch (error) {
          logger.warn('source.baseline_failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
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
            hoverPreview: true,
            projectIndex: false,
          },
          settings: getSettings ? getSettings() : {},
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
      const dto = toDto(buildGraph(loaded.run));
      lastDto = dto;
      bridge.respond('graph.data', { dto }, requestId);
    });

    bridge.on('cfg.functions', async (_payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      const result = loaded.query.cfgFunctions();
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond(
        'cfg.functions',
        {
          ok: true,
          functions: result.value.map((symbol) => ({
            symbolId: symbol.symbolId,
            name: symbol.name,
            qualifiedName: symbol.qualifiedName,
            kind: symbol.kind,
            range: symbol.declaration,
          })),
        },
        requestId,
      );
    });

    bridge.on('cfg.load', async (payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const result = buildCfg(loaded.query, symbolId, {
        allowLarge: payload.allowLarge === true,
      });
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message, result.detail),
          requestId,
        );
        return;
      }
      const dto = toCfgDto(result.cfg);
      lastDto = dto;
      bridge.respond('cfg.data', { ok: true, dto }, requestId);
    });

    bridge.on('source.slice', async (payload, { requestId }) => {
      if (!sourceAccess?.slice) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_SOURCE_UNAVAILABLE', 'Source preview is not available.'),
          requestId,
        );
        return;
      }
      if (!current) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a graph before previewing source.'),
          requestId,
        );
        return;
      }
      // Deliberately no ensureRun(): a hover must never trigger analysis.
      const result = await sourceAccess.slice(payload);
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond('source.data', { ok: true, slice: result.slice }, requestId);
    });

    bridge.on('source.validation', async (payload, { requestId }) => {
      if (!sourceAccess?.validate) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_SOURCE_UNAVAILABLE', 'Source validation is not available.'),
          requestId,
        );
        return;
      }
      if (!current) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a graph before validating source.'),
          requestId,
        );
        return;
      }
      const result = await sourceAccess.validate(
        Array.isArray(payload.ranges) ? payload.ranges : [],
      );
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond('source.integrity', { ok: true, results: result.results }, requestId);
    });

    bridge.on('navigate.to', async (payload, { requestId }) => {
      if (!navigate) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NAVIGATION_UNAVAILABLE', 'Navigation is not available.'),
          requestId,
        );
        return;
      }
      if (!current) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a graph before navigating.'),
          requestId,
        );
        return;
      }
      const range = normalizeRangeRef(payload.range);
      if (!range.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(range.code, range.issues.join(' ')),
          requestId,
        );
        return;
      }
      if (range.value.fileId !== payload.fileId) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_RANGE', 'fileId does not match the range fileId.'),
          requestId,
        );
        return;
      }
      if (!current.run.files.some((file) => file.fileId === payload.fileId)) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_SOURCE_MISSING', 'This file is not part of the current analysis.'),
          requestId,
        );
        return;
      }
      selectedNodeId = typeof payload.nodeId === 'string' ? payload.nodeId : null;
      const result = await navigate({
        fileId: payload.fileId,
        range: range.value,
        ...(selectedNodeId ? { nodeId: selectedNodeId } : {}),
      });
      bridge.respond(
        'navigate.done',
        result.ok
          ? { ok: true }
          : { ok: false, code: result.code, message: result.message },
        requestId,
      );
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
      selectedNodeId = typeof payload.nodeId === 'string' ? payload.nodeId : null;
      logger.debug('panel.node_selected', { nodeId: selectedNodeId });
    });

    bridge.on('panel.ping', async (_payload, { requestId }) => {
      bridge.respond('panel.pong', { at: Date.now() }, requestId);
    });

    /**
     * Push an editor selection into the graph. No analysis is performed; this
     * is a pure lookup over the last DTO and the current run's file ids.
     *
     * @param {{path: string, range: {startLine: number, startColumn: number, endLine: number, endColumn: number}}} selection
     */
    bridge.notifyEditorSelection = (selection) => {
      if (bridge.isDisposed() || !current || !lastDto) {
        return;
      }
      const fileId = fileIdForPath(selection?.path ?? '');
      if (!fileId) {
        bridge.respond('selection.changed', { fileId: null, nodeIds: [], activeNodeId: null });
        return;
      }
      const start = {
        line: Number(selection.range?.startLine ?? 0),
        column: Number(selection.range?.startColumn ?? 0),
      };
      const end = {
        line: Number(selection.range?.endLine ?? start.line),
        column: Number(selection.range?.endColumn ?? start.column),
      };
      const selectionRange = {
        fileId,
        startLine: start.line,
        startColumn: start.column,
        endLine: end.line,
        endColumn: end.column,
      };
      const hasSelection =
        start.line !== end.line || start.column !== end.column;
      const matches = lastDto.nodes
        .filter((node) => node.range && node.range.fileId === fileId)
        .filter((node) =>
          hasSelection
            ? rangesOverlap(node.range, selectionRange) ||
              containsPosition(node.range, start)
            : containsPosition(node.range, start),
        )
        .sort((left, right) => {
          const leftSize =
            (left.range.endLine - left.range.startLine) * 1_000 +
            (left.range.endColumn - left.range.startColumn);
          const rightSize =
            (right.range.endLine - right.range.startLine) * 1_000 +
            (right.range.endColumn - right.range.startColumn);
          return leftSize - rightSize;
        });
      bridge.respond('selection.changed', {
        fileId,
        nodeIds: matches.map((node) => node.id),
        activeNodeId: matches[0]?.id ?? null,
      });
    };

    /**
     * @param {Record<string, unknown>} settings
     */
    bridge.pushSettings = (settings) => {
      if (!bridge.isDisposed()) {
        bridge.respond('settings.data', { settings });
      }
    };

    bridge.focusGraph = () => {
      if (!bridge.isDisposed()) {
        bridge.respond('graph.focus', selectedNodeId ? { nodeId: selectedNodeId } : {});
      }
    };

    if (sourceAccess?.onDidInvalidate) {
      const subscription = sourceAccess.onDidInvalidate((event) => {
        if (bridge.isDisposed() || event.reason === 'closed') {
          return;
        }
        bridge.respond('source.stale', {
          fileIds: Array.isArray(event.fileIds) ? event.fileIds : [],
          reason: event.reason,
        });
      });
      target.onDidDispose(() => subscription.dispose());
    }

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
