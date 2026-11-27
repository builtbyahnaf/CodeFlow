/**
 * Call-graph ego perspective session and DTO builder (Phase 7 §4, §8, M3).
 *
 * Manages progressive expand/collapse (evicting nodes and edges no longer
 * reachable via expanded roots so repeated expand/collapse never leaks),
 * status/kind/file filtering, focus mode dimming, unresolved bucket nodes,
 * depth-limit markers, and cycle badges.
 */

import { computeLayout } from '../layout.js';
import { GRAPH_DTO_VERSION } from '../dto.js';
import { labelLines as wrapCfgLabelLines } from '../cfg/dto.js';
import { CALL_LIMITS, callEdgeDash, callEdgeGlyph, formatScopeBanner } from './kinds.js';
import { detectCallCycles } from './cycles.js';
import { isKnownBuiltinCall } from '../builtins.js';

/**
 * Create an interactive call-graph session backed by a `CallGraphQueryService`.
 *
 * @param {{
 *   queryService: ReturnType<typeof import('./query.js').createCallGraphQueryService>,
 * }} options
 */
export function createCallGraphSession({ queryService }) {
  const meta = queryService.runInfo();
  /** @type {string|null} */
  let centerSymbolId = null;
  /** @type {Set<string>} */
  const expandedSymbolIds = new Set();
  /** @type {{statuses: string[]|null, kinds: string[]|null, types: string[]|null, fileId: string|null}} */
  let activeFilter = {
    statuses: null,
    kinds: null,
    types: null,
    fileId: null,
  };
  /** @type {string|null} */
  let focusedNodeId = null;
  let maxDepth = CALL_LIMITS.defaultDepth;

  /**
   * Build the active ego-graph DTO from `centerSymbolId` and `expandedSymbolIds`.
   */
  function buildDto() {
    if (!centerSymbolId) {
      return {
        ok: false,
        code: 'E_NO_CENTER',
        message: 'Open a function in the call graph first.',
      };
    }

    const merged = queryService.merged([centerSymbolId, ...expandedSymbolIds]);
    const symbolById = new Map(merged.symbols.map((sym) => [sym.symbolId, sym]));

    // Determine reachable subgraph via BFS from center through expanded nodes only.
    // Collapsing a node removes it from `expandedSymbolIds`, so any descendant not
    // reachable through another expanded node is automatically evicted.
    /** @type {Map<string, number>} */
    const hopById = new Map([[centerSymbolId, 0]]);
    /** @type {Set<string>} */
    const activeNodeIds = new Set([centerSymbolId]);
    /** @type {Map<string, Record<string, any>>} */
    const activeEdges = new Map();
    /** @type {Set<string>} */
    const depthLimitedIds = new Set();
    let expansionCapped = false;

    const queue = [centerSymbolId];
    while (queue.length > 0) {
      const currentId = /** @type {string} */ (queue.shift());
      const currentHop = hopById.get(currentId) ?? 0;
      if (!expandedSymbolIds.has(currentId)) {
        continue;
      }

      const incident = merged.relationships.filter(
        (rel) => rel.from === currentId || rel.to === currentId,
      );

      for (const rel of incident) {
        if (
          activeFilter.statuses &&
          !activeFilter.statuses.includes(rel.status) &&
          !activeFilter.statuses.includes(rel.strongestStatus)
        ) {
          continue;
        }
        if (activeFilter.types && !activeFilter.types.includes(rel.type)) {
          continue;
        }
        const otherId = rel.from === currentId ? rel.to : rel.from;
        const otherSym = symbolById.get(otherId);
        const otherKind = otherSym?.kind ?? 'unknown';
        const otherFileId = otherSym?.declaration?.fileId ?? '';
        if (activeFilter.kinds && !activeFilter.kinds.includes(otherKind)) {
          continue;
        }
        if (activeFilter.fileId && otherFileId !== activeFilter.fileId) {
          continue;
        }

        if (!activeNodeIds.has(otherId)) {
          const nextHop = currentHop + 1;
          if (nextHop > maxDepth) {
            depthLimitedIds.add(currentId);
            continue;
          }
          if (activeNodeIds.size >= CALL_LIMITS.maxNodes) {
            expansionCapped = true;
            depthLimitedIds.add(currentId);
            continue;
          }
          activeNodeIds.add(otherId);
          hopById.set(otherId, nextHop);
          if (expandedSymbolIds.has(otherId)) {
            queue.push(otherId);
          }
        }

        if (activeNodeIds.has(rel.from) && activeNodeIds.has(rel.to)) {
          activeEdges.set(rel.relationshipId, rel);
        }
      }
    }

    // Prune any expandedSymbolId that became unreachable after a parent collapse
    // so `expandedSymbolIds` itself never leaks across collapse cycles.
    for (const id of [...expandedSymbolIds]) {
      if (!activeNodeIds.has(id)) {
        expandedSymbolIds.delete(id);
      }
    }

    // Check which unexpanded leaves have further neighbors in `merged.relationships`.
    /** @type {Set<string>} */
    const expandableIds = new Set();
    for (const nodeId of activeNodeIds) {
      if (expandedSymbolIds.has(nodeId)) {
        continue;
      }
      const hasMore = merged.relationships.some(
        (rel) =>
          (rel.from === nodeId && !activeNodeIds.has(rel.to)) ||
          (rel.to === nodeId && !activeNodeIds.has(rel.from)),
      );
      if (hasMore) {
        expandableIds.add(nodeId);
        if ((hopById.get(nodeId) ?? 0) >= maxDepth) {
          depthLimitedIds.add(nodeId);
        }
      }
    }

    /** @type {Array<Record<string, any>>} */
    const rawNodes = [];
    for (const nodeId of [...activeNodeIds].sort()) {
      const sym = symbolById.get(nodeId);
      const rawExternalName = String(nodeId).startsWith('external:')
        ? String(nodeId)
            .slice('external:'.length)
            .replace(/^(?:global\.|member\.|module:|require:)/, '')
        : '';
      const label =
        sym?.name ||
        sym?.qualifiedName ||
        (rawExternalName && rawExternalName.includes('::')
          ? rawExternalName
          : String(nodeId)
              .split(/[.:/#]/)
              .filter(Boolean)
              .pop()) ||
        nodeId;
      const incomingEdges = [...activeEdges.values()].filter(
        (e) => e.to === nodeId || e.from === nodeId,
      );
      const incomingEdgeStatuses = incomingEdges.map((e) => e.status);
      const isBuiltin = !sym && isKnownBuiltinCall(nodeId, label);
      const hasWorkspaceMatch = incomingEdges.some((e) => e.reasonCode === 'workspace_index');
      const status =
        nodeId === centerSymbolId
          ? sym?.stale
            ? 'stale'
            : 'resolved'
          : sym?.stale
            ? 'stale'
            : incomingEdgeStatuses.includes('resolved') || isBuiltin
              ? 'resolved'
              : (incomingEdgeStatuses[0] ?? (sym ? 'resolved' : 'unresolved'));
      const nodeBadge = isBuiltin
        ? 'stdlib'
        : !sym && hasWorkspaceMatch
          ? 'indexed'
          : '';

      rawNodes.push({
        id: nodeId,
        label,
        labelLines: wrapCfgLabelLines(label, 'statement'),
        qualifiedName: sym?.qualifiedName || (rawExternalName || label),
        kind: sym?.kind ?? (isBuiltin ? 'function' : 'unknown'),
        status,
        badge: nodeBadge,
        range: sym?.declaration ?? null,
        fileId: sym?.declaration?.fileId ?? null,
        external: !sym,
        isCenter: nodeId === centerSymbolId,
        expanded: expandedSymbolIds.has(nodeId),
        expandable: expandableIds.has(nodeId),
        depthLimitReached: depthLimitedIds.has(nodeId),
        hopDistance: hopById.get(nodeId) ?? 0,
      });
    }

    /** @type {Array<Record<string, any>>} */
    const rawEdges = [...activeEdges.values()].map((rel) => ({
      id: rel.relationshipId,
      from: rel.from,
      to: rel.to,
      type: rel.type,
      kind: rel.type,
      status: rel.status,
      strongestStatus: rel.strongestStatus,
      ...(rel.reasonCode ? { reasonCode: rel.reasonCode } : {}),
      callSiteCount: rel.callSiteCount ?? 1,
      label:
        (rel.callSiteCount ?? 1) > 1
          ? `${rel.type} (×${rel.callSiteCount})`
          : rel.reasonCode
            ? `${rel.type} · ${rel.reasonCode}`
            : rel.type,
    }));

    // Unresolved bucket aggregate node for centerSymbolId when unresolved sites exist.
    const centerUnresolved = merged.unresolvedSites.filter((site) => site.from === centerSymbolId);
    const byReason = new Map();
    for (const site of centerUnresolved) {
      const code = site.reasonCode || 'unresolved_target';
      byReason.set(code, (byReason.get(code) ?? 0) + 1);
    }
    const unresolvedReasons = [...byReason.entries()]
      .map(([reasonCode, count]) => ({ reasonCode, count }))
      .sort((a, b) => (a.reasonCode < b.reasonCode ? -1 : a.reasonCode > b.reasonCode ? 1 : 0));

    const unresolvedAllowed =
      !activeFilter.statuses || activeFilter.statuses.includes('unresolved');
    const bucketId = `bucket:unresolved:${centerSymbolId}`;
    if (centerUnresolved.length > 0 && unresolvedAllowed) {
      const bucketLabel = `${centerUnresolved.length} unresolved target${centerUnresolved.length === 1 ? '' : 's'}`;
      rawNodes.push({
        id: bucketId,
        label: bucketLabel,
        qualifiedName: bucketLabel,
        kind: 'unresolved_bucket',
        status: 'unresolved',
        range: null,
        fileId: null,
        external: true,
        isCenter: false,
        expanded: false,
        expandable: false,
        depthLimitReached: false,
        hopDistance: 1,
        badge: unresolvedReasons.map((r) => `${r.reasonCode} (${r.count})`).join(', '),
      });
      rawEdges.push({
        id: `edge:${bucketId}`,
        from: centerSymbolId,
        to: bucketId,
        type: 'calls',
        kind: 'calls',
        status: 'unresolved',
        strongestStatus: 'unresolved',
        reasonCode: unresolvedReasons[0]?.reasonCode ?? 'unresolved_target',
        callSiteCount: centerUnresolved.length,
        label: `unresolved (×${centerUnresolved.length})`,
      });
    }

    const cycleInfo = detectCallCycles(rawNodes, rawEdges);

    // Focus neighborhood calculation: if focusedNodeId is set, keep focusedNodeId
    // and its immediate 1-hop neighbors undimmed; dim all other nodes/edges.
    const focusNeighborhood = new Set();
    if (focusedNodeId && rawNodes.some((n) => n.id === focusedNodeId)) {
      focusNeighborhood.add(focusedNodeId);
      for (const edge of rawEdges) {
        if (edge.from === focusedNodeId) {
          focusNeighborhood.add(edge.to);
        }
        if (edge.to === focusedNodeId) {
          focusNeighborhood.add(edge.from);
        }
      }
    }

    const layout = computeLayout({
      graphId: `calls:${meta.runId}:${centerSymbolId}`,
      runId: meta.runId,
      language: meta.language,
      adapterId: meta.adapterId,
      completeness: meta.completeness,
      nodes: rawNodes,
      edges: rawEdges,
      diagnostics: [],
      degradations: [],
    });

    const dtoNodes = rawNodes.map((node) => {
      const isCyclic = cycleInfo.cyclicSymbolIds.has(node.id);
      const badges = [];
      if (node.status !== 'resolved') {
        badges.push(node.status);
      }
      if (isCyclic) {
        badges.push('cycle ↻');
      }
      if (node.depthLimitReached) {
        badges.push('depth limit');
      }
      if (node.badge && !badges.includes(node.badge)) {
        badges.push(node.badge);
      }
      const dimmed = focusNeighborhood.size > 0 && !focusNeighborhood.has(node.id);

      return {
        id: node.id,
        label: node.label,
        labelLines: [node.label],
        qualifiedName: node.qualifiedName,
        kind: node.kind,
        status: node.status,
        badge: badges.join(' · '),
        badges,
        external: node.external,
        isCenter: node.isCenter,
        isCyclic,
        expanded: node.expanded,
        expandable: node.expandable,
        depthLimitReached: node.depthLimitReached,
        dimmed,
        hopDistance: node.hopDistance,
        range: node.range
          ? {
              fileId: node.range.fileId,
              startLine: node.range.startLine,
              startColumn: node.range.startColumn ?? 0,
              endLine: node.range.endLine,
              endColumn: node.range.endColumn ?? 0,
            }
          : null,
        position: layout.positions[node.id] ?? { x: 0, y: 0, width: 190, height: 54, layer: 0 },
      };
    });

    const dtoEdges = rawEdges.map((edge) => {
      const isCycle = cycleInfo.cycleEdgeIds.has(edge.id);
      const dimmed =
        focusNeighborhood.size > 0 &&
        !(focusNeighborhood.has(edge.from) && focusNeighborhood.has(edge.to));
      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        type: edge.type,
        kind: edge.kind,
        status: edge.status,
        label: isCycle ? `${edge.label} ↻` : edge.label,
        dash: callEdgeDash(edge.status, isCycle),
        glyphHint: callEdgeGlyph(edge.status, isCycle),
        isCycle,
        dimmed,
        callSiteCount: edge.callSiteCount,
        ...(edge.reasonCode ? { reasonCode: edge.reasonCode } : {}),
      };
    });

    const callerCount = merged.relationships.filter((r) => r.to === centerSymbolId).length;
    const calleeCount = merged.relationships.filter((r) => r.from === centerSymbolId).length;
    const byStatus = { resolved: 0, inferred: 0, possible: 0, unresolved: 0, stale: 0 };
    for (const edge of dtoEdges) {
      if (Object.hasOwn(byStatus, edge.status)) {
        byStatus[edge.status] += 1;
      }
    }

    const degradations = [];
    if (merged.scope === 'same_file_only') {
      degradations.push({
        code: 'same_file_only',
        severity: 'info',
        message: formatScopeBanner('same_file_only', callerCount, 'callers'),
      });
    } else if (merged.scope === 'partial') {
      degradations.push({
        code: 'index_partial',
        severity: 'warning',
        message: formatScopeBanner('partial', callerCount, 'callers'),
      });
    }
    if (expansionCapped) {
      degradations.push({
        code: 'expansion_capped',
        severity: 'warning',
        message: `Call-graph expansion reached the ${CALL_LIMITS.maxNodes}-node cap.`,
      });
    }
    for (const diag of merged.diagnostics) {
      degradations.push({
        code: diag.code,
        severity: diag.severity,
        message: diag.message,
      });
    }

    const statuses = [...new Set(dtoNodes.map((n) => n.status))].sort();
    const kinds = [...new Set(dtoNodes.map((n) => n.kind))].sort();
    const edgeKinds = [...new Set(dtoEdges.map((e) => e.type))].sort();

    return {
      ok: true,
      dto: {
        dtoVersion: GRAPH_DTO_VERSION,
        dtoKind: 'call_graph',
        graphKind: 'call_graph',
        graphId: `calls:${meta.runId}:${centerSymbolId}`,
        runId: meta.runId,
        language: meta.language,
        adapterId: meta.adapterId,
        completeness: meta.completeness,
        centerSymbolId,
        focusedNodeId,
        scope: merged.scope,
        scopeReasons: merged.scopeReasons,
        scopeBanner: `${formatScopeBanner(merged.scope, callerCount, 'callers')} · ${calleeCount} callee${calleeCount === 1 ? '' : 's'}`,
        nodes: dtoNodes,
        edges: dtoEdges,
        unresolvedBucket: {
          id: bucketId,
          count: centerUnresolved.length,
          reasons: unresolvedReasons,
          items: centerUnresolved,
        },
        counts: {
          callers: callerCount,
          callees: calleeCount,
          unresolved: centerUnresolved.length,
          cycles: cycleInfo.cycles.length,
          renderedNodes: dtoNodes.length,
          renderedEdges: dtoEdges.length,
          byStatus,
        },
        cycles: cycleInfo.cycles,
        diagnostics: merged.diagnostics,
        degradations,
        extent: { width: layout.width, height: layout.height },
        legend: { statuses, kinds, edgeKinds },
      },
    };
  }

  return {
    /**
     * @param {string} symbolId
     * @param {{depth?: number}} [options]
     */
    open(symbolId, options = {}) {
      if (typeof symbolId !== 'string' || symbolId.length === 0) {
        return { ok: false, code: 'E_QUERY', message: 'symbolId must be a non-empty string.' };
      }
      centerSymbolId = symbolId;
      expandedSymbolIds.clear();
      expandedSymbolIds.add(symbolId);
      focusedNodeId = null;
      if (options.depth !== undefined) {
        maxDepth = Math.min(
          CALL_LIMITS.maxDepth,
          Math.max(1, Math.trunc(Number(options.depth) || CALL_LIMITS.defaultDepth)),
        );
      }
      return buildDto();
    },

    /**
     * @param {string} symbolId
     */
    expand(symbolId) {
      if (!centerSymbolId) {
        return this.open(symbolId);
      }
      if (typeof symbolId === 'string' && symbolId.length > 0) {
        expandedSymbolIds.add(symbolId);
      }
      return buildDto();
    },

    /**
     * Collapse a neighbor and evict descendants not reachable through other expanded paths.
     *
     * @param {string} symbolId
     */
    collapse(symbolId) {
      if (!centerSymbolId) {
        return { ok: false, code: 'E_NO_CENTER', message: 'No call graph is open.' };
      }
      if (symbolId !== centerSymbolId) {
        expandedSymbolIds.delete(symbolId);
      }
      return buildDto();
    },

    /**
     * @param {{statuses?: string[]|null, kinds?: string[]|null, types?: string[]|null, fileId?: string|null}} [filter]
     */
    filter(filter = {}) {
      activeFilter = {
        statuses:
          Array.isArray(filter.statuses) && filter.statuses.length > 0
            ? [...filter.statuses]
            : null,
        kinds: Array.isArray(filter.kinds) && filter.kinds.length > 0 ? [...filter.kinds] : null,
        types: Array.isArray(filter.types) && filter.types.length > 0 ? [...filter.types] : null,
        fileId:
          typeof filter.fileId === 'string' && filter.fileId.length > 0 ? filter.fileId : null,
      };
      return buildDto();
    },

    /**
     * @param {string|null} symbolId
     */
    focus(symbolId = null) {
      focusedNodeId = typeof symbolId === 'string' && symbolId.length > 0 ? symbolId : null;
      return buildDto();
    },

    centerSymbolId: () => centerSymbolId,
    expandedCount: () => expandedSymbolIds.size,
    toDto: buildDto,
  };
}
