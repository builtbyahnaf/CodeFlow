/**
 * Interactive semantic zoom session orchestrator (Phase 10 §5..§9,
 * P10-05, P10-13, P10-21, AC-10.1).
 *
 * Unifies:
 * - L0 Workspace -> L1 Module -> L2 File -> L3 Symbol -> L4 Function -> L5 Statement descent
 * - Addressable breadcrumb navigation restoring ancestor viewport & selection
 * - Paginated cluster and edge-bundle expansion (`expandCluster`)
 * - Cross-level search with automatic ancestor breadcrumb stack construction
 * - Visible filter chips (`kinds`, `relationshipTypes`, `statuses`)
 * - Anchored incremental layout and minimap calculation
 */

import { ZOOM_LEVELS } from './levels.js';
import { createNavigationStack } from './breadcrumbs.js';
import {
  buildWorkspaceOverview,
  buildModuleView,
  buildFileView,
  buildFunctionView,
  buildStatementView,
} from './aggregator.js';
import { createClusterExpansionService } from './expansion.js';
import {
  searchAcrossZoomLevels,
  resolveSearchTargetBreadcrumbs,
  applyZoomFilters,
  computeDirectionalHighlight,
} from './search.js';
import { computeAnchoredIncrementalLayout } from './layout.js';
import { toCfgDto } from '../cfg/dto.js';
import { buildMinimapModel } from './minimap.js';
import { serializeZoomNavigationState, restoreZoomNavigationState } from './persistence.js';
import { buildCfg } from '../cfg/builder.js';

/**
 * Create a semantic zoom session over the active index and/or CSR query layer.
 *
 * @param {{
 *   runId?: string,
 *   index?: Record<string, any>|null,
 *   query?: Record<string, any>|null,
 *   files?: Array<Record<string, any>>,
 *   callSession?: {open: (symbolId: string) => {ok: boolean, dto?: Record<string, any>}}|null,
 *   reducedMotion?: boolean,
 * }} [options]
 */
export function createSemanticZoomSession(options = {}) {
  let runId = String(options.runId ?? 'run:zoom');
  const navStack = createNavigationStack({
    level: ZOOM_LEVELS.L0_WORKSPACE,
    scopeId: 'workspace',
    label: 'workspace',
  });
  const expansionService = createClusterExpansionService();

  /** @type {Array<{id: string, x: number, y: number, width: number, height: number}>} */
  let lastPositionedNodes = [];
  /** @type {Map<string, Array<Record<string, any>>>} */
  let activeClusterMembers = new Map();
  /** @type {Map<string, Array<Record<string, any>>>} */
  let activeBundleEdges = new Map();
  /** @type {{kinds: string[], relationshipTypes: string[], statuses: string[]}} */
  let activeFilters = { kinds: [], relationshipTypes: [], statuses: [] };

  function buildRawViewForState(state) {
    if (state.level === ZOOM_LEVELS.L0_WORKSPACE) {
      return buildWorkspaceOverview({
        index: options.index,
        query: options.query,
        files: options.files,
      });
    }
    if (state.level === ZOOM_LEVELS.L1_MODULE) {
      return buildModuleView({
        modulePrefix: state.scopeId,
        index: options.index,
        query: options.query,
        files: options.files,
      });
    }
    if (state.level === ZOOM_LEVELS.L2_FILE) {
      return buildFileView({
        fileId: state.scopeId,
        index: options.index,
        query: options.query,
      });
    }
    if (state.level === ZOOM_LEVELS.L3_SYMBOL) {
      const opened = options.callSession?.open?.(state.scopeId);
      if (opened?.ok && opened.dto) {
        return {
          dtoKind: 'semantic_zoom',
          level: ZOOM_LEVELS.L3_SYMBOL,
          scopeId: state.scopeId,
          nodes: opened.dto.nodes.map((n) => {
            const isCallable =
              n.isCenter === true ||
              ['function', 'method', 'constructor', 'closure'].includes(n.kind);
            const isDescendable =
              !n.external &&
              n.kind !== 'unresolved_bucket' &&
              !String(n.id).startsWith('bucket:') &&
              isCallable;
            return {
              ...n,
              level: ZOOM_LEVELS.L3_SYMBOL,
              scopeId: n.id,
              targetLevel: isDescendable ? ZOOM_LEVELS.L4_FUNCTION : null,
              expandable: isDescendable,
            };
          }),
          edges: opened.dto.edges,
          membersByClusterId: new Map(),
        };
      }
      return buildFileView({
        fileId: state.scopeId,
        index: options.index,
        query: options.query,
      });
    }
    if (state.level === ZOOM_LEVELS.L4_FUNCTION) {
      const cfgRes = options.query
        ? buildCfg(options.query, state.scopeId, { allowLarge: true })
        : null;
      const cfg = cfgRes?.ok ? cfgRes.cfg : { symbolId: state.scopeId, nodes: [], edges: [] };
      const view = buildFunctionView({ cfg });
      if (!view.clusteredConstructs && cfgRes?.ok) {
        const laidOut = toCfgDto(cfg);
        const byId = new Map((laidOut.nodes ?? []).map((n) => [n.id, n]));
        view.nodes = view.nodes.map((n) => {
          const laid = byId.get(n.id);
          if (!laid?.position) {
            return n;
          }
          return {
            ...n,
            label: laid.label ?? n.label,
            labelLines: laid.labelLines ?? n.labelLines,
            badges: laid.badges ?? n.badges,
            badge: laid.badge ?? n.badge,
            position: laid.position,
            x: laid.position.x,
            y: laid.position.y,
            width: laid.position.width,
            height: laid.position.height,
            layer: laid.position.layer,
            targetLevel: n.constructId ? ZOOM_LEVELS.L5_STATEMENT : null,
          };
        });
        view.edges = laidOut.edges ?? view.edges;
      }
      return view;
    }
    if (state.level === ZOOM_LEVELS.L5_STATEMENT) {
      const fnCrumb = [...navStack.breadcrumbs()]
        .reverse()
        .find((c) => c.level === ZOOM_LEVELS.L4_FUNCTION);
      const fnSymbolId = fnCrumb?.scopeId ?? state.focusId ?? '';
      const cfgRes =
        options.query && fnSymbolId
          ? buildCfg(options.query, fnSymbolId, { allowLarge: true })
          : null;
      const cfg = cfgRes?.ok ? cfgRes.cfg : { symbolId: fnSymbolId, nodes: [], edges: [] };
      return buildStatementView({
        symbolId: fnSymbolId,
        constructId: state.scopeId,
        cfg,
        activeOverlays: state.overlays,
      });
    }
    return buildWorkspaceOverview({
      index: options.index,
      query: options.query,
      files: options.files,
    });
  }

  function renderCurrentView({ anchorNodeId = null } = {}) {
    const state = navStack.current();
    const rawView = buildRawViewForState(state);

    activeClusterMembers =
      rawView.membersByClusterId instanceof Map ? rawView.membersByClusterId : new Map();
    activeBundleEdges = new Map();
    for (const edge of rawView.edges ?? []) {
      if (Array.isArray(edge.memberEdges)) {
        activeBundleEdges.set(edge.id, edge.memberEdges);
      }
    }

    const filtered = applyZoomFilters(rawView, activeFilters);
    const layout = computeAnchoredIncrementalLayout({
      previousNodes: lastPositionedNodes,
      nextNodes: filtered.nodes,
      anchorNodeId,
      reducedMotion: options.reducedMotion === true,
    });
    lastPositionedNodes = layout.nodes;

    const minimap = buildMinimapModel({
      nodes: layout.nodes,
      viewport: {
        x: state.viewport.x,
        y: state.viewport.y,
        width: 1000,
        height: 700,
        zoom: state.viewport.zoom,
      },
    });

    const highlight = state.focusId
      ? computeDirectionalHighlight({
          focusNodeId: state.focusId,
          nodes: layout.nodes,
          edges: filtered.edges,
        })
      : null;

    return {
      ok: true,
      dto: {
        dtoKind: 'semantic_zoom',
        runId,
        level: state.level,
        scopeId: state.scopeId,
        focusId: state.focusId,
        selection: state.selection,
        viewport: state.viewport,
        breadcrumbs: navStack.breadcrumbs(),
        nodes: layout.nodes,
        edges: filtered.edges,
        filterChips: filtered.chips,
        hiddenNodeCount: filtered.hiddenNodeCount,
        hiddenEdgeCount: filtered.hiddenEdgeCount,
        transitionMs: layout.transitionMs,
        minimap,
        highlight,
        overlays: rawView.overlays ?? { active: state.overlays ?? [], dfg: [] },
      },
    };
  }

  /**
   * Descend explicitly to a child level (`module`, `file`, `symbol`,
   * `function`, `statement`).
   *
   * @param {{
   *   level: string,
   *   scopeId: string,
   *   focusId?: string|null,
   *   label?: string,
   *   currentViewport?: {x: number, y: number, zoom: number},
   *   currentSelection?: string|null,
   * }} target
   */
  function descend(target) {
    if (target.currentViewport || target.currentSelection !== undefined) {
      navStack.updateCurrent({
        viewport: target.currentViewport,
        selection: target.currentSelection,
      });
    }
    lastPositionedNodes = [];
    const res = navStack.descend(target);
    if (!res.ok) {
      return res;
    }
    return renderCurrentView();
  }

  /**
   * Return to an ancestor breadcrumb by index and restore its saved viewport
   * and selection (P10-13).
   *
   * @param {number} index
   */
  function ascendToBreadcrumb(index) {
    lastPositionedNodes = [];
    const res = navStack.ascendTo(index);
    if (!res.ok) {
      return res;
    }
    return renderCurrentView();
  }

  /**
   * Paginate members of a cluster or edges of a bundle without re-analyzing
   * (P10-06, AC-10.3).
   *
   * @param {{
   *   clusterId: string,
   *   what?: 'members'|'edges',
   *   limit?: number,
   *   cursor?: string|number,
   * }} request
   */
  function expandCluster(request) {
    const state = navStack.current();
    const what = request?.what === 'edges' ? 'edges' : 'members';
    return expansionService.expand({
      graphId: `${state.level}:${state.scopeId}`,
      runId,
      clusterId: request?.clusterId,
      what,
      page: { limit: request?.limit, cursor: request?.cursor },
      loadItems: () => {
        if (what === 'edges') {
          if (!activeBundleEdges.has(request.clusterId)) {
            throw new Error(`Unknown edge bundle "${request.clusterId}".`);
          }
          return activeBundleEdges.get(request.clusterId);
        }
        if (!activeClusterMembers.has(request.clusterId)) {
          throw new Error(`Unknown cluster "${request.clusterId}".`);
        }
        return activeClusterMembers.get(request.clusterId);
      },
    });
  }

  function setFilters(nextFilters = {}) {
    activeFilters = {
      kinds: Array.isArray(nextFilters.kinds) ? nextFilters.kinds : [],
      relationshipTypes: Array.isArray(nextFilters.relationshipTypes)
        ? nextFilters.relationshipTypes
        : [],
      statuses: Array.isArray(nextFilters.statuses) ? nextFilters.statuses : [],
    };
    return renderCurrentView();
  }

  function focusNode(nodeId) {
    navStack.updateCurrent({ focusId: nodeId, selection: nodeId });
    return renderCurrentView({ anchorNodeId: nodeId });
  }

  function search(queryParams = {}) {
    return searchAcrossZoomLevels({
      ...queryParams,
      index: options.index,
      query: options.query,
    });
  }

  function jumpToSearchResult(searchItem) {
    const crumbs = resolveSearchTargetBreadcrumbs(searchItem);
    lastPositionedNodes = [];
    navStack.replaceStack(crumbs);
    return renderCurrentView({ anchorNodeId: searchItem.id });
  }

  function persistState() {
    const state = navStack.current();
    return serializeZoomNavigationState({
      graphId: `zoom:${state.level}:${state.scopeId}`,
      runId,
      level: state.level,
      scopeId: state.scopeId,
      focusId: state.focusId,
      breadcrumbPath: navStack.snapshotStack(),
      viewport: state.viewport,
      filters: activeFilters,
    });
  }

  function restoreState(rawPersisted, scopeExists) {
    const restored = restoreZoomNavigationState(rawPersisted, {
      currentRunId: runId,
      scopeExists,
    });
    activeFilters = restored.state.filters;
    navStack.replaceStack(restored.state.breadcrumbPath);
    const view = renderCurrentView();
    return {
      ...view,
      restoredExact: restored.restoredExact,
      fellBackToAncestor: restored.fellBackToAncestor,
      notice: restored.notice,
    };
  }

  function updateRunId(nextRunId) {
    runId = String(nextRunId ?? runId);
    expansionService.invalidateRun(runId);
  }

  return {
    open: () => renderCurrentView(),
    descend,
    ascendToBreadcrumb,
    expandCluster,
    setFilters,
    focusNode,
    search,
    jumpToSearchResult,
    persistState,
    restoreState,
    updateRunId,
    navigationStack: navStack,
    expansionService,
  };
}
