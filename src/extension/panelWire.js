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
import {
  DIRECTIONS,
  MAX_PAYLOAD_BYTES,
  PROTOCOL_VERSION,
  createEnvelope,
  createErrorPayload,
  messageSize,
} from '../core/protocol/envelope.js';
import { buildGraph } from '../core/graph/model.js';
import { toDto } from '../core/graph/dto.js';
import { buildCfg } from '../core/graph/cfg/builder.js';
import { toCfgDto } from '../core/graph/cfg/dto.js';
import { hashRun } from '../core/csr/serialize.js';
import { normalizeRangeRef, containsPosition, rangesOverlap } from '../core/source/ranges.js';
import { createExplanationEngine } from '../core/explanation/engine.js';
import { createCallGraphQueryService } from '../core/graph/calls/query.js';
import { createCallGraphSession } from '../core/graph/calls/ego.js';
import { createIndexEvidenceSource } from '../core/graph/calls/sources.js';
import { createSemanticZoomSession } from '../core/graph/zoom/session.js';
import { GRAPH_DTO_VERSION } from '../core/graph/dto.js';
import {
  buildDfg,
  toDfgDto,
  buildDfgOverlay,
  backwardSlice,
  forwardSlice,
  createDfgCache,
} from '../core/graph/dfg/index.js';

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
  indexProvider = null,
  indexActions = null,
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
    /** @type {import('../core/graph/cfg/builder.js').Cfg | null} */
    let lastCfg = null;
    /** @type {Record<string, any>|null} */
    let lastDto = null;
    /** @type {string|null} */
    let selectedNodeId = null;
    /** @type {Set<string>} */
    const staleFileIds = new Set();
    const explanationEngine = createExplanationEngine();
    /** @type {ReturnType<typeof createCallGraphQueryService>|null} */
    let callQueryService = null;
    /** @type {ReturnType<typeof createCallGraphSession>|null} */
    let callSession = null;
    /** @type {ReturnType<typeof createSemanticZoomSession>|null} */
    let zoomSession = null;
    const dfgCache = createDfgCache(buildDfg);
    /** @type {import('../core/graph/dfg/model.js').Dfg | null} */
    let lastDfg = null;
    let lastIndexedState = null;

    function activeIndexSource() {
      if (!indexProvider) {
        return null;
      }
      if (typeof indexProvider.isIndexed === 'function' && !indexProvider.isIndexed()) {
        return null;
      }
      return createIndexEvidenceSource(indexProvider);
    }

    function isIndexActive() {
      return Boolean(indexProvider && (typeof indexProvider.isIndexed !== 'function' || indexProvider.isIndexed()));
    }

    function rebuildCallService() {
      if (!current) {
        callQueryService = null;
        callSession = null;
        zoomSession = null;
        lastDfg = null;
        lastIndexedState = null;
        dfgCache.clear();
        return;
      }
      lastIndexedState = isIndexActive();
      callQueryService = createCallGraphQueryService({
        query: current.query,
        indexSource: activeIndexSource(),
        staleFiles: staleFileIds,
        logger: loggerProxy,
      });
      callSession = createCallGraphSession({ queryService: callQueryService });
      zoomSession = createSemanticZoomSession({
        runId: current.run.runId,
        index: indexProvider,
        query: current.query,
        files: current.run.files,
        callSession,
      });
    }

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
      lastCfg = null;
      lastDto = null;
      selectedNodeId = null;
      staleFileIds.clear();
      explanationEngine.invalidateRun(loaded.run.runId);
      rebuildCallService();
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

    function indexSnapshot() {
      const stats =
        typeof indexProvider?.stats === 'function'
          ? indexProvider.stats()
          : {
              state: 'unindexed',
              schemaVersion: 1,
              fileCount: 0,
              symbolCount: 0,
              relationshipCount: 0,
              dependencyCount: 0,
              staleFileCount: 0,
              scope: 'partial',
            };
      const health =
        typeof indexProvider?.health === 'function'
          ? indexProvider.health()
          : {
              ok: true,
              integrity: 'ok',
              schemaVersion: 1,
              state: stats.state,
              staleFileCount: 0,
              scope: stats.scope,
              issues: [],
            };
      const telemetry =
        typeof indexProvider?.telemetry === 'function' ? indexProvider.telemetry() : null;
      return { stats, health, telemetry };
    }

    bridge.on('webview.ready', async (_payload, { requestId }) => {
      const { stats } = indexSnapshot();
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
            explanation: true,
            projectIndex: Boolean(indexProvider),
            workspaceAnalysis: Boolean(indexActions),
          },
          indexStats: stats,
          settings: getSettings ? getSettings() : {},
          demoMode: true,
        },
        requestId,
      );
    });

    /**
     * @param {string} kind
     * @param {Record<string, unknown>} payload
     * @param {string} [requestId]
     * @returns {boolean}
     */
    function fitsPayloadBudget(kind, payload, requestId) {
      return messageSize(createEnvelope(kind, payload, requestId)) <= MAX_PAYLOAD_BYTES;
    }

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
      const primaryFileId = loaded.run.scope?.path
        ? fileIdForPath(loaded.run.scope.path)
        : null;
      const graph = buildGraph(loaded.run);
      const caps = [400, 200, 100, 40, 10];
      let dto = toDto(graph, { maxNodes: caps[0], priorityFileId: primaryFileId });
      for (let i = 1; i < caps.length && !fitsPayloadBudget('graph.data', { dto }, requestId); i += 1) {
        dto = toDto(graph, { maxNodes: caps[i], priorityFileId: primaryFileId });
      }
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
      const primaryFileId = loaded.run.scope?.path
        ? fileIdForPath(loaded.run.scope.path)
        : null;
      const mapped = result.value.map((symbol) => ({
        symbolId: symbol.symbolId,
        name: symbol.name,
        qualifiedName: symbol.qualifiedName,
        kind: symbol.kind,
        range: symbol.declaration,
      }));
      if (primaryFileId) {
        mapped.sort((left, right) => {
          const leftPrimary = left.range?.fileId === primaryFileId ? 0 : 1;
          const rightPrimary = right.range?.fileId === primaryFileId ? 0 : 1;
          return leftPrimary - rightPrimary;
        });
      }
      let functions = mapped;
      while (
        functions.length > 10 &&
        !fitsPayloadBudget('cfg.functions', { ok: true, functions }, requestId)
      ) {
        functions = functions.slice(0, Math.max(10, Math.floor(functions.length / 2)));
      }
      bridge.respond('cfg.functions', { ok: true, functions }, requestId);
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
      const indexed =
        indexProvider && typeof indexProvider.isIndexed === 'function' && indexProvider.isIndexed();
      const resolveExternalCall =
        indexed && typeof indexProvider.symbolsByName === 'function'
          ? ({ to, calleeName }) => {
              const rawName = String(calleeName || to || '')
                .replace(/^external:(global\.|module:|require:)?/, '')
                .split('.')
                .pop()
                ?.trim();
              if (!rawName) {
                return null;
              }
              const res = indexProvider.symbolsByName(rawName, { limit: 12 });
              const items = Array.isArray(res?.items) ? res.items : [];
              const matches = items.filter(
                (item) =>
                  item.name === rawName &&
                  ['function', 'method', 'constructor', 'class'].includes(item.kind),
              );
              if (matches.length === 0) {
                return null;
              }
              const best = matches[0];
              return {
                to: best.symbolId,
                label: best.qualifiedName || best.name,
                status: matches.length === 1 ? 'resolved' : 'inferred',
                reasonCode: 'workspace_index',
              };
            }
          : null;
      const result = buildCfg(loaded.query, symbolId, {
        allowLarge: payload.allowLarge === true,
        ...(resolveExternalCall ? { resolveExternalCall } : {}),
      });
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message, result.detail),
          requestId,
        );
        return;
      }
      let dto = toCfgDto(result.cfg);
      for (const limit of [1000, 500, 250, 100, 40]) {
        if (fitsPayloadBudget('cfg.data', { ok: true, dto }, requestId)) {
          break;
        }
        dto = toCfgDto(result.cfg, { maxNodes: limit });
      }
      lastCfg = result.cfg;
      lastDto = dto;
      bridge.respond('cfg.data', { ok: true, dto }, requestId);
    });

    bridge.on('explain.node', async (payload, { requestId }) => {
      if (!current || !lastCfg) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a CFG before requesting explanations.'),
          requestId,
        );
        return;
      }
      const nodeId = typeof payload.nodeId === 'string' ? payload.nodeId : '';
      const node = lastCfg.nodes.find((entry) => entry.id === nodeId);
      const stale = Boolean(
        node?.range?.fileId ? staleFileIds.has(node.range.fileId) : staleFileIds.size > 0,
      );
      const result = explanationEngine.explainNode({
        query: current.query,
        cfg: lastCfg,
        nodeId,
        depth: typeof payload.depth === 'number' ? payload.depth : undefined,
        stale,
        settings: getSettings ? getSettings()?.explanation : undefined,
      });
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond('explain.data', result, requestId);
    });

    bridge.on('explain.function', async (payload, { requestId }) => {
      if (!current || !lastCfg) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a CFG before requesting explanations.'),
          requestId,
        );
        return;
      }
      const fnFileId = lastCfg.function?.range?.fileId;
      const stale = Boolean(fnFileId ? staleFileIds.has(fnFileId) : staleFileIds.size > 0);
      const result = explanationEngine.explainFunction({
        query: current.query,
        cfg: lastCfg,
        depth: typeof payload.depth === 'number' ? payload.depth : undefined,
        stale,
        settings: getSettings ? getSettings()?.explanation : undefined,
      });
      bridge.respond('explain.data', result, requestId);
    });

    bridge.on('calls.load', async (payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      if (!callSession || isIndexActive() !== lastIndexedState) {
        rebuildCallService();
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const built = callSession.open(symbolId, {
        depth: typeof payload.depth === 'number' ? payload.depth : undefined,
      });
      if (!built.ok) {
        bridge.respond('protocol.error', createErrorPayload(built.code, built.message), requestId);
        return;
      }
      lastDto = built.dto;
      bridge.respond('calls.data', { ok: true, dto: built.dto }, requestId);
    });

    bridge.on('calls.outgoing', async (payload, { requestId }) => {
      if (!current || !callQueryService) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a graph before querying call relationships.'),
          requestId,
        );
        return;
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const result = callQueryService.outgoing(symbolId, payload);
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond('calls.neighbors', result, requestId);
    });

    bridge.on('calls.incoming', async (payload, { requestId }) => {
      if (!current || !callQueryService) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a graph before querying call relationships.'),
          requestId,
        );
        return;
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const result = callQueryService.incoming(symbolId, payload);
      if (!result.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(result.code, result.message),
          requestId,
        );
        return;
      }
      bridge.respond('calls.neighbors', result, requestId);
    });

    bridge.on('calls.expand', async (payload, { requestId }) => {
      if (!current || !callSession) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Open a call graph before expanding neighbors.'),
          requestId,
        );
        return;
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const built = callSession.expand(symbolId);
      if (!built.ok) {
        bridge.respond('protocol.error', createErrorPayload(built.code, built.message), requestId);
        return;
      }
      lastDto = built.dto;
      bridge.respond('calls.data', { ok: true, dto: built.dto }, requestId);
    });

    bridge.on('calls.collapse', async (payload, { requestId }) => {
      if (!current || !callSession) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Open a call graph before collapsing neighbors.'),
          requestId,
        );
        return;
      }
      const symbolId = typeof payload.symbolId === 'string' ? payload.symbolId : '';
      const built = callSession.collapse(symbolId);
      if (!built.ok) {
        bridge.respond('protocol.error', createErrorPayload(built.code, built.message), requestId);
        return;
      }
      lastDto = built.dto;
      bridge.respond('calls.data', { ok: true, dto: built.dto }, requestId);
    });

    bridge.on('calls.filter', async (payload, { requestId }) => {
      if (!current || !callSession) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Open a call graph before filtering.'),
          requestId,
        );
        return;
      }
      const built = callSession.filter(payload);
      if (!built.ok) {
        bridge.respond('protocol.error', createErrorPayload(built.code, built.message), requestId);
        return;
      }
      lastDto = built.dto;
      bridge.respond('calls.data', { ok: true, dto: built.dto }, requestId);
    });

    bridge.on('calls.focus', async (payload, { requestId }) => {
      if (!current || !callSession) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Open a call graph before focusing a node.'),
          requestId,
        );
        return;
      }
      const built = callSession.focus(
        typeof payload.symbolId === 'string' ? payload.symbolId : null,
      );
      if (!built.ok) {
        bridge.respond('protocol.error', createErrorPayload(built.code, built.message), requestId);
        return;
      }
      lastDto = built.dto;
      bridge.respond('calls.data', { ok: true, dto: built.dto }, requestId);
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
        result.ok ? { ok: true } : { ok: false, code: result.code, message: result.message },
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

    bridge.on('index.status', async (_payload, { requestId }) => {
      const { stats, health, telemetry } = indexSnapshot();
      bridge.respond(
        'index.data',
        { ok: true, stats, health, ...(telemetry ? { telemetry } : {}) },
        requestId,
      );
    });

    bridge.on('index.run', async (payload, { requestId }) => {
      if (!indexActions?.indexWorkspace) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_UNSUPPORTED', 'Workspace indexing is not available.'),
          requestId,
        );
        return;
      }
      const res = await indexActions.indexWorkspace({ rebuild: payload?.rebuild === true });
      rebuildCallService();
      const { stats, health, telemetry } = indexSnapshot();
      bridge.respond(
        'index.data',
        {
          ok: res?.ok !== false,
          ...(res?.message ? { message: res.message } : {}),
          stats,
          health,
          ...(telemetry ? { telemetry } : {}),
        },
        requestId,
      );
    });

    bridge.on('workspace.analyze', async (payload, { requestId }) => {
      if (!indexActions?.indexWorkspace) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_UNSUPPORTED', 'Repository-wide analysis is not available.'),
          requestId,
        );
        return;
      }
      const res = await indexActions.indexWorkspace({ rebuild: payload?.rebuild === true });
      rebuildCallService();
      const { stats, health, telemetry } = indexSnapshot();
      bridge.respond(
        'index.data',
        {
          ok: res?.ok !== false,
          ...(res?.message ? { message: res.message } : {}),
          stats,
          health,
          ...(telemetry ? { telemetry } : {}),
        },
        requestId,
      );
    });

    bridge.on('index.configure', async (_payload, { requestId }) => {
      if (!indexActions?.showIndexOptions) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_UNSUPPORTED', 'Indexing configuration is not available.'),
          requestId,
        );
        return;
      }
      await indexActions.showIndexOptions();
      const { stats, health, telemetry } = indexSnapshot();
      bridge.respond(
        'index.data',
        { ok: true, stats, health, ...(telemetry ? { telemetry } : {}) },
        requestId,
      );
    });

    async function ensureZoomSession() {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        return loaded;
      }
      if (!zoomSession || isIndexActive() !== lastIndexedState) {
        rebuildCallService();
      }
      return { ok: true, session: zoomSession };
    }

    /**
     * Wrap a semantic-zoom label without truncating it. Zoom labels are short
     * (directory and symbol names), but file paths and cluster captions can
     * still exceed one line.
     *
     * @param {string} label
     * @returns {string[]}
     */
    function wrapZoomLabel(label) {
      const text = String(label ?? '')
        .replace(/\s+/g, ' ')
        .trim();
      if (text.length === 0) {
        return [''];
      }
      const maxChars = 34;
      if (text.length <= maxChars) {
        return [text];
      }
      /** @type {string[]} */
      const lines = [];
      let rest = text;
      while (rest.length > maxChars) {
        let split = rest.lastIndexOf(' ', maxChars);
        if (split <= 0) {
          const next = rest.indexOf(' ', maxChars);
          split = next > 0 && next <= Math.floor(maxChars * 1.6) ? next : maxChars;
        }
        lines.push(rest.slice(0, split).trimEnd());
        rest = rest.slice(split).trimStart();
      }
      if (rest.length > 0) {
        lines.push(rest);
      }
      return lines;
    }

    function stampZoomDto(dto) {
      const run = current?.run;
      const rawNodes = Array.isArray(dto?.nodes) ? dto.nodes : [];
      const rawEdges = Array.isArray(dto?.edges) ? dto.edges : [];

      // The zoom layout emits flat x/y/width/height. The renderer consumes a
      // nested `position`, so normalize here, at the host/webview boundary.
      const nodes = rawNodes.map((node) => {
        const label = String(node.label ?? node.id ?? '');
        const labelLines =
          Array.isArray(node.labelLines) && node.labelLines.length > 0
            ? node.labelLines
            : wrapZoomLabel(label);
        const badges = Array.isArray(node.badges) ? node.badges : [];
        const longest = labelLines.reduce((m, l) => Math.max(m, String(l).length), 0);
        const computedW = Math.min(440, Math.max(180, Math.round(longest * 8.2 + 44)));
        const computedH = Math.min(
          320,
          Math.max(64, Math.max(1, labelLines.length) * 17 + (badges.length > 0 ? 16 : 0) + 30),
        );
        const width = Number(node.position?.width ?? node.width ?? computedW);
        const height = Number(node.position?.height ?? node.height ?? computedH);
        const x = Number(node.position?.x ?? node.x ?? 0);
        const y = Number(node.position?.y ?? node.y ?? 0);
        return {
          ...node,
          label,
          labelLines,
          status: String(node.status ?? node.displayStatus ?? 'resolved'),
          badge: String(node.badge ?? (badges.length > 0 ? badges.join(' · ') : '')),
          badges,
          external: Boolean(node.external),
          range: node.range ?? null,
          position: {
            x,
            y,
            width,
            height,
            layer: Number.isInteger(node.layer) ? node.layer : 0,
          },
        };
      });

      const edges = rawEdges.map((edge) => ({
        ...edge,
        type: String(edge.type ?? edge.kind ?? 'dependency'),
        kind: String(edge.kind ?? edge.type ?? 'dependency'),
        status: String(edge.status ?? edge.displayStatus ?? 'resolved'),
        label: String(edge.label ?? ''),
        dash: String(edge.dash ?? ''),
        glyphHint: String(edge.glyphHint ?? ''),
      }));

      let maxX = 0;
      let maxY = 0;
      for (const node of nodes) {
        const nx = node.position.x + node.position.width;
        const ny = node.position.y + node.position.height;
        if (nx > maxX) maxX = nx;
        if (ny > maxY) maxY = ny;
      }

      return {
        ...dto,
        dtoVersion: GRAPH_DTO_VERSION,
        graphId: `zoom:${dto?.level ?? 'workspace'}`,
        runId: dto?.runId ?? run?.runId ?? 'run:zoom',
        language: run?.language ?? run?.files?.[0]?.language ?? 'workspace',
        adapterId: run?.adapterId ?? 'semantic_zoom',
        completeness: run?.completeness ?? 'complete',
        extent: {
          width: Math.max(800, maxX + 64),
          height: Math.max(600, maxY + 64),
        },
        legend: {
          statuses: [...new Set(nodes.map((n) => n.status))].sort(),
          kinds: [...new Set(nodes.map((n) => n.kind))].sort(),
          edgeKinds: [...new Set(edges.map((e) => e.type))].sort(),
        },
        nodes,
        edges,
      };
    }

    bridge.on('zoom.open', async (_payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const opened = ensured.session.open();
      const dto = stampZoomDto(opened.dto);
      lastDto = dto;
      bridge.respond('zoom.data', { ok: true, dto }, requestId);
    });

    bridge.on('zoom.descend', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const res = ensured.session.descend({
        level: typeof payload.level === 'string' ? payload.level : '',
        scopeId: typeof payload.scopeId === 'string' ? payload.scopeId : '',
        focusId: typeof payload.focusId === 'string' ? payload.focusId : null,
        label: typeof payload.label === 'string' ? payload.label : undefined,
      });
      if (!res.ok) {
        bridge.respond('protocol.error', createErrorPayload(res.code, res.message), requestId);
        return;
      }
      const dto = stampZoomDto(res.dto);
      lastDto = dto;
      bridge.respond('zoom.data', { ok: true, dto }, requestId);
    });

    bridge.on('zoom.breadcrumb', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const res = ensured.session.ascendToBreadcrumb(Number(payload.index ?? 0));
      if (!res.ok) {
        bridge.respond('protocol.error', createErrorPayload(res.code, res.message), requestId);
        return;
      }
      const dto = stampZoomDto(res.dto);
      lastDto = dto;
      bridge.respond('zoom.data', { ok: true, dto }, requestId);
    });

    bridge.on('zoom.expand', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const res = ensured.session.expandCluster({
        clusterId: typeof payload.clusterId === 'string' ? payload.clusterId : '',
        what: payload.what === 'edges' ? 'edges' : 'members',
        limit: typeof payload.limit === 'number' ? payload.limit : undefined,
        cursor: payload.cursor,
      });
      if (!res.ok) {
        bridge.respond('protocol.error', createErrorPayload(res.code, res.message), requestId);
        return;
      }
      bridge.respond('zoom.members', res, requestId);
    });

    bridge.on('zoom.search', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      if (payload.jumpItem && typeof payload.jumpItem === 'object') {
        const jumped = ensured.session.jumpToSearchResult(payload.jumpItem);
        const dto = stampZoomDto(jumped.dto);
        lastDto = dto;
        bridge.respond('zoom.data', { ok: true, dto }, requestId);
        return;
      }
      const res = ensured.session.search({
        queryText: typeof payload.queryText === 'string' ? payload.queryText : '',
        kinds: Array.isArray(payload.kinds) ? payload.kinds : undefined,
        limit: typeof payload.limit === 'number' ? payload.limit : undefined,
        cursor: payload.cursor,
      });
      bridge.respond('zoom.results', res, requestId);
    });

    bridge.on('zoom.filter', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const res = ensured.session.setFilters(payload);
      const dto = stampZoomDto(res.dto);
      lastDto = dto;
      bridge.respond('zoom.data', { ok: true, dto }, requestId);
    });

    bridge.on('zoom.focus', async (payload, { requestId }) => {
      const ensured = await ensureZoomSession();
      if (!ensured.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(ensured.code, ensured.message, { issues: ensured.issues }),
          requestId,
        );
        return;
      }
      const res = ensured.session.focusNode(
        typeof payload.nodeId === 'string' ? payload.nodeId : null,
      );
      const dto = stampZoomDto(res.dto);
      lastDto = dto;
      bridge.respond('zoom.data', { ok: true, dto }, requestId);
    });

    bridge.on('dfg.load', async (payload, { requestId }) => {
      const loaded = await ensureRun();
      if (!loaded.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(loaded.code, loaded.message, { issues: loaded.issues }),
          requestId,
        );
        return;
      }
      const symbolId =
        typeof payload.symbolId === 'string'
          ? payload.symbolId
          : typeof payload.functionId === 'string'
            ? payload.functionId
            : '';
      if (!symbolId) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_BAD_REQUEST', 'symbolId or functionId is required.'),
          requestId,
        );
        return;
      }
      const allSyms = loaded.query.allSymbols().value ?? [];
      const sym = allSyms.find((s) => s.symbolId === symbolId);
      if (!sym) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NOT_FOUND', `No symbol "${symbolId}".`),
          requestId,
        );
        return;
      }
      const cfgRes = buildCfg(loaded.query, symbolId, {
        allowLarge: payload.allowLarge === true,
      });
      if (!cfgRes.ok) {
        bridge.respond(
          'protocol.error',
          createErrorPayload(cfgRes.code, cfgRes.message, cfgRes.detail),
          requestId,
        );
        return;
      }
      const factsRes =
        typeof loaded.query.dataFactsOf === 'function'
          ? loaded.query.dataFactsOf(symbolId)
          : { ok: true, value: [] };
      const facts = factsRes.ok ? factsRes.value : [];
      const dataFactsMap = new Map();
      for (const fact of facts) {
        const matchedNode = cfgRes.cfg.nodes.find(
          (n) =>
            (n.constructId && fact.extensions?.constructId === n.constructId) ||
            (n.range && fact.at && n.range.startLine === fact.at.startLine),
        );
        const targetId = matchedNode?.id ?? cfgRes.cfg.entryNodeId ?? cfgRes.cfg.nodes[0]?.id;
        if (targetId) {
          let arr = dataFactsMap.get(targetId);
          if (!arr) {
            arr = [];
            dataFactsMap.set(targetId, arr);
          }
          arr.push({
            bindingId: fact.symbolId || fact.relatedSymbolId,
            op: fact.kind,
            status: fact.status,
            reasonCode: fact.reasonCode,
            range: fact.at,
          });
        }
      }
      const bindings = allSyms
        .filter((s) => s.parentId === symbolId || s.symbolId === symbolId)
        .map((s) => ({
          id: s.symbolId,
          name: s.name,
          kind: s.kind === 'param' ? 'param' : 'local',
          isMutable: true,
          isReference: Boolean(
            s.extensions?.isReference || s.signature?.includes('&') || s.signature?.includes('*'),
          ),
          isClosure: Boolean(s.extensions?.isClosure),
        }));
      const params = bindings.filter((b) => b.kind === 'param');
      const calls = cfgRes.cfg.nodes
        .filter((n) => n.kind === 'call')
        .map((n) => ({
          callNodeId: n.id,
          status: n.calls?.[0]?.status ?? 'resolved',
          calleeId: n.calls?.[0]?.to,
        }));

      const runHashVal = hashRun(loaded.run);
      const cacheKey = `dfg:${symbolId}:${runHashVal}`;
      const dfg = dfgCache.build(cacheKey, {
        functionId: symbolId,
        fileId: sym.declaration?.fileId ?? '',
        cfgNodes: cfgRes.cfg.nodes.map((n) => ({
          id: n.id,
          kind: n.kind,
          successors: (cfgRes.cfg.edges ?? []).filter((e) => e.from === n.id).map((e) => e.to),
          predecessors: (cfgRes.cfg.edges ?? []).filter((e) => e.to === n.id).map((e) => e.from),
        })),
        entryNodeId: cfgRes.cfg.entryNodeId ?? 'entry',
        dataFactsMap,
        bindings,
        params,
        calls,
      });
      lastDfg = dfg;
      bridge.respond('dfg.data', { ok: true, dto: toDfgDto(dfg) }, requestId);
    });

    bridge.on('dfg.trace', async (payload, { requestId }) => {
      if (!lastDfg) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a DFG before requesting a variable trace.'),
          requestId,
        );
        return;
      }
      const bindingId = typeof payload.bindingId === 'string' ? payload.bindingId : null;
      const overlay = buildDfgOverlay(lastDfg, bindingId);
      bridge.respond('dfg.overlay', { ok: true, overlay }, requestId);
    });

    bridge.on('dfg.slice', async (payload, { requestId }) => {
      if (!lastDfg) {
        bridge.respond(
          'protocol.error',
          createErrorPayload('E_NO_ANALYSIS', 'Load a DFG before requesting a slice.'),
          requestId,
        );
        return;
      }
      const nodeId = typeof payload.nodeId === 'string' ? payload.nodeId : '';
      const direction = payload.direction === 'forward' ? 'forward' : 'backward';
      const slice =
        direction === 'forward'
          ? forwardSlice(lastDfg, nodeId)
          : backwardSlice(lastDfg, nodeId);
      bridge.respond('dfg.data', { ok: true, slice }, requestId);
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
      const hasSelection = start.line !== end.line || start.column !== end.column;
      const matches = lastDto.nodes
        .filter((node) => node.range && node.range.fileId === fileId)
        .filter((node) =>
          hasSelection
            ? rangesOverlap(node.range, selectionRange) || containsPosition(node.range, start)
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
        for (const id of Array.isArray(event.fileIds) ? event.fileIds : []) {
          staleFileIds.add(id);
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
