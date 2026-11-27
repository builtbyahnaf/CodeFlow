/**
 * Call-graph relationship query layer (Phase 7 §5).
 *
 * Provides cursor-paginated `outgoing` and `incoming` neighbor queries,
 * cancellable `depth` expansion returning both nodes and edges, and `cycles`
 * detection over merged evidence sources.
 */

import { CALL_LIMITS, CALL_RELATIONSHIP_TYPES, CALL_STATUSES, formatScopeBanner } from './kinds.js';
import {
  clampCallDepth,
  clampCallMaxNodes,
  clampCallPageSize,
  decodeCallCursor,
  encodeCallCursor,
} from './cursor.js';
import { buildCandidateBuckets, buildUnresolvedBucket } from './buckets.js';
import { mergeEvidenceSources } from './merge.js';
import { createAdapterEvidenceSource } from './sources.js';
import { detectCallCycles } from './cycles.js';
import { normalizeBuiltinCalls, resolveExternalCallsWithSymbols } from '../builtins.js';

export { encodeCallCursor, decodeCallCursor };

/**
 * @param {string} targetId
 * @returns {string}
 */
function placeholderName(targetId) {
  const parts = String(targetId)
    .split(/[.:/#]/)
    .filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(targetId);
}

/**
 * Create a call-graph query service over an adapter query layer and optional
 * index / additional evidence sources.
 *
 * @param {{
 *   query?: ReturnType<typeof import('../../csr/query.js').createQueryLayer>,
 *   sources?: Array<Record<string, any>>,
 *   indexSource?: {snapshot: (seedIds?: string[]) => Record<string, any>}|null,
 *   staleFiles?: Iterable<string>,
 *   diskHashes?: Record<string, string>,
 *   logger?: {debug?: Function},
 * }} options
 */
export function createCallGraphQueryService(options = {}) {
  const infoRes = options.query?.runInfo?.();
  const meta = infoRes?.ok
    ? infoRes.value
    : {
        runId: 'run:calls',
        language: 'javascript',
        adapterId: 'local',
        completeness: 'full',
      };

  /**
   * Build the merged relationship model for the active sources.
   *
   * @param {string[]} [seedSymbolIds]
   */
  function getMerged(seedSymbolIds = []) {
    /** @type {Array<Record<string, any>>} */
    const activeSources = [];
    if (Array.isArray(options.sources) && options.sources.length > 0) {
      activeSources.push(...options.sources);
    } else if (options.query) {
      activeSources.push(
        createAdapterEvidenceSource(options.query, {
          staleFiles: options.staleFiles,
        }),
      );
    }
    if (options.indexSource && typeof options.indexSource.snapshot === 'function') {
      const snap = options.indexSource.snapshot(seedSymbolIds);
      if (snap) {
        activeSources.push(snap);
      }
    }
    // Collect all known symbols across active sources so cross-file external
    // calls from single-file adapters resolve against indexed workspace symbols.
    const allKnownSymbols = activeSources.flatMap((source) =>
      Array.isArray(source.symbols) ? source.symbols : [],
    );

    // Adapters honestly report calls they cannot resolve inside the file as
    // `unresolved`/`out_of_scope`. Known builtin/STL targets and workspace
    // indexed targets are normalized before merging so they never inflate the
    // unresolved bucket.
    const normalizedSources = activeSources.map((source) => ({
      ...source,
      relationships: resolveExternalCallsWithSymbols(
        normalizeBuiltinCalls(source.relationships),
        allKnownSymbols,
      ),
    }));
    return mergeEvidenceSources(normalizedSources, {
      staleFiles: options.staleFiles,
      diskHashes: options.diskHashes,
      logger: options.logger,
    });
  }

  /**
   * Convert a merged relationship + target symbol into a `CallNeighbor` record.
   *
   * @param {Record<string, any>} rel
   * @param {string} neighborId
   * @param {Map<string, Record<string, any>>} symbolById
   * @returns {Record<string, any>}
   */
  function toNeighbor(rel, neighborId, symbolById) {
    const sym = symbolById.get(neighborId);
    const range = sym?.declaration ??
      rel.callSites?.[0] ?? {
        fileId: '',
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 0,
      };
    return {
      symbolId: neighborId,
      displayName: sym?.qualifiedName || sym?.name || placeholderName(neighborId),
      name: sym?.name || placeholderName(neighborId),
      kind: sym?.kind ?? 'unknown',
      fileId: range.fileId ?? '',
      range: {
        fileId: range.fileId ?? '',
        startLine: range.startLine ?? 0,
        startColumn: range.startColumn ?? 0,
        endLine: range.endLine ?? 0,
        endColumn: range.endColumn ?? 0,
      },
      type: rel.type,
      status: rel.status,
      strongestStatus: rel.strongestStatus ?? rel.status,
      stale: Boolean(rel.stale || sym?.stale),
      ...(rel.reasonCode ? { reasonCode: rel.reasonCode } : {}),
      candidates: rel.candidates ?? [neighborId],
      callSiteCount: rel.callSiteCount ?? 1,
      callSites: (rel.callSites ?? []).map((site) => ({
        fileId: site.fileId ?? '',
        range: site,
      })),
      external: !sym,
      sourceIds: rel.sourceIds ?? [],
    };
  }

  /**
   * Filter relationships and symbols by caller-supplied filters.
   *
   * @param {Record<string, any>} neighbor
   * @param {Record<string, any>} rel
   * @param {{statuses?: string[], kinds?: string[], types?: string[], fileId?: string}} [filter]
   */
  function matchesFilter(neighbor, rel, filter = {}) {
    if (Array.isArray(filter.statuses) && filter.statuses.length > 0) {
      if (!filter.statuses.includes(rel.status) && !filter.statuses.includes(rel.strongestStatus)) {
        return false;
      }
    }
    if (Array.isArray(filter.types) && filter.types.length > 0) {
      if (!filter.types.includes(rel.type)) {
        return false;
      }
    }
    if (Array.isArray(filter.kinds) && filter.kinds.length > 0) {
      if (!filter.kinds.includes(neighbor.kind)) {
        return false;
      }
    }
    if (typeof filter.fileId === 'string' && filter.fileId.length > 0) {
      if (neighbor.fileId !== filter.fileId) {
        return false;
      }
    }
    return true;
  }

  /**
   * Paginated outgoing or incoming neighbor query.
   *
   * @param {'outgoing'|'incoming'} direction
   * @param {string} symbolId
   * @param {{
   *   statuses?: string[],
   *   kinds?: string[],
   *   types?: string[],
   *   fileId?: string,
   *   limit?: number,
   *   cursor?: string,
   * }} [filter]
   */
  function queryNeighbors(direction, symbolId, filter = {}) {
    if (typeof symbolId !== 'string' || symbolId.length === 0) {
      return {
        ok: false,
        code: 'E_QUERY',
        message: 'symbolId must be a non-empty string.',
      };
    }
    const merged = getMerged([symbolId]);
    const symbolById = new Map(merged.symbols.map((sym) => [sym.symbolId, sym]));
    const pageSize = clampCallPageSize(filter.limit);
    const decoded = decodeCallCursor(filter.cursor, meta.runId);

    const matchingRels = merged.relationships.filter((rel) =>
      direction === 'outgoing' ? rel.from === symbolId : rel.to === symbolId,
    );

    const allNeighbors = matchingRels
      .map((rel) => {
        const neighborId = direction === 'outgoing' ? rel.to : rel.from;
        const neighbor = toNeighbor(rel, neighborId, symbolById);
        return { neighbor, rel };
      })
      .filter(({ neighbor, rel }) => matchesFilter(neighbor, rel, filter))
      .map(({ neighbor }) => neighbor)
      .sort((a, b) => (a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0));

    const total = allNeighbors.length;
    const offset = decoded.offset < total ? decoded.offset : 0;
    const items = allNeighbors.slice(offset, offset + pageSize);
    const nextOffset = offset + items.length;
    const nextCursor =
      nextOffset < total ? encodeCallCursor({ runId: meta.runId, offset: nextOffset }) : undefined;

    const scopeReasons = [...merged.scopeReasons];
    if (decoded.reset && !scopeReasons.includes('stale_cursor_reset')) {
      scopeReasons.push('stale_cursor_reset');
    }
    const noun = direction === 'incoming' ? 'callers' : 'callees';

    return {
      ok: true,
      direction,
      symbolId,
      items,
      ...(nextCursor ? { nextCursor } : {}),
      total,
      exactTotal: true,
      cursorReset: decoded.reset,
      scope: merged.scope,
      scopeReasons,
      scopeBanner: formatScopeBanner(merged.scope, total, noun),
      unresolvedBucket:
        direction === 'outgoing'
          ? buildUnresolvedBucket(symbolId, merged.unresolvedSites)
          : { id: `bucket:unresolved:${symbolId}`, symbolId, count: 0, reasons: [], items: [] },
      diagnostics: merged.diagnostics,
    };
  }

  /**
   * Cancellable multi-hop call-graph expansion returning both nodes and edges.
   * If cancelled via `token.isCancelled`, returns nothing (`cancelled: true`,
   * empty arrays) rather than an unlabeled partial graph.
   *
   * @param {string} symbolId
   * @param {{
   *   depth?: number,
   *   maxNodes?: number,
   *   direction?: 'both'|'outgoing'|'incoming',
   *   statuses?: string[],
   *   kinds?: string[],
   *   types?: string[],
   *   fileId?: string,
   *   token?: {isCancelled?: boolean},
   * }} [options]
   */
  function depth(symbolId, options = {}) {
    if (typeof symbolId !== 'string' || symbolId.length === 0) {
      return { ok: false, code: 'E_QUERY', message: 'symbolId must be a non-empty string.' };
    }
    if (options.token?.isCancelled) {
      return {
        ok: true,
        cancelled: true,
        nodes: [],
        edges: [],
        unresolvedBucket: {
          id: `bucket:unresolved:${symbolId}`,
          symbolId,
          count: 0,
          reasons: [],
          items: [],
        },
        candidateBuckets: [],
        cycles: [],
        scope: 'same_file_only',
        scopeReasons: ['cancelled'],
      };
    }

    const maxDepth = clampCallDepth(options.depth);
    const maxNodes = clampCallMaxNodes(options.maxNodes);
    const dir = options.direction ?? 'both';
    const merged = getMerged([symbolId]);
    const symbolById = new Map(merged.symbols.map((sym) => [sym.symbolId, sym]));

    /** @type {Map<string, Record<string, any>>} */
    const visitedNodes = new Map();
    /** @type {Map<string, Record<string, any>>} */
    const collectedEdges = new Map();
    /** @type {Map<string, number>} */
    const distanceById = new Map([[symbolId, 0]]);
    /** @type {Set<string>} */
    const depthLimitedIds = new Set();
    let expansionCapped = false;

    const rootSym = symbolById.get(symbolId);
    visitedNodes.set(symbolId, {
      id: symbolId,
      symbolId,
      displayName: rootSym?.qualifiedName || rootSym?.name || placeholderName(symbolId),
      name: rootSym?.name || placeholderName(symbolId),
      kind: rootSym?.kind ?? 'function',
      fileId: rootSym?.declaration?.fileId ?? '',
      range: rootSym?.declaration ?? null,
      status: rootSym?.stale ? 'stale' : 'resolved',
      external: !rootSym,
      hopDistance: 0,
      isCenter: true,
      depthLimitReached: false,
    });

    /** @type {Array<{id: string, hop: number}>} */
    const queue = [{ id: symbolId, hop: 0 }];

    while (queue.length > 0) {
      if (options.token?.isCancelled) {
        return {
          ok: true,
          cancelled: true,
          nodes: [],
          edges: [],
          unresolvedBucket: {
            id: `bucket:unresolved:${symbolId}`,
            symbolId,
            count: 0,
            reasons: [],
            items: [],
          },
          candidateBuckets: [],
          cycles: [],
          scope: merged.scope,
          scopeReasons: ['cancelled'],
        };
      }

      const current = /** @type {{id: string, hop: number}} */ (queue.shift());
      const incident = merged.relationships.filter((rel) => {
        if (dir === 'outgoing') {
          return rel.from === current.id;
        }
        if (dir === 'incoming') {
          return rel.to === current.id;
        }
        return rel.from === current.id || rel.to === current.id;
      });

      for (const rel of incident) {
        const otherId = rel.from === current.id ? rel.to : rel.from;
        const neighbor = toNeighbor(rel, otherId, symbolById);
        if (!matchesFilter(neighbor, rel, options)) {
          continue;
        }

        if (current.hop >= maxDepth && !visitedNodes.has(otherId)) {
          depthLimitedIds.add(current.id);
          continue;
        }

        if (!visitedNodes.has(otherId)) {
          if (visitedNodes.size >= maxNodes) {
            expansionCapped = true;
            depthLimitedIds.add(current.id);
            continue;
          }
          const nextHop = current.hop + 1;
          distanceById.set(otherId, nextHop);
          visitedNodes.set(otherId, {
            id: otherId,
            symbolId: otherId,
            displayName: neighbor.displayName,
            name: neighbor.name,
            kind: neighbor.kind,
            fileId: neighbor.fileId,
            range: neighbor.external ? null : neighbor.range,
            status: neighbor.status,
            ...(neighbor.reasonCode ? { reasonCode: neighbor.reasonCode } : {}),
            external: neighbor.external,
            hopDistance: nextHop,
            isCenter: false,
            depthLimitReached: false,
          });
          queue.push({ id: otherId, hop: nextHop });
        }

        if (visitedNodes.has(rel.from) && visitedNodes.has(rel.to)) {
          collectedEdges.set(rel.relationshipId, {
            id: rel.relationshipId,
            from: rel.from,
            to: rel.to,
            type: rel.type,
            status: rel.status,
            strongestStatus: rel.strongestStatus,
            stale: rel.stale,
            ...(rel.reasonCode ? { reasonCode: rel.reasonCode } : {}),
            candidates: rel.candidates,
            callSiteCount: rel.callSiteCount,
            callSites: rel.callSites,
            sourceIds: rel.sourceIds,
          });
        }
      }
    }

    for (const limitedId of depthLimitedIds) {
      const node = visitedNodes.get(limitedId);
      if (node) {
        node.depthLimitReached = true;
      }
    }

    const candidateBuckets = buildCandidateBuckets(collectedEdges.values());

    const nodeList = [...visitedNodes.values()].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    const edgeList = [...collectedEdges.values()].sort((a, b) =>
      a.id < b.id ? -1 : a.id > b.id ? 1 : 0,
    );
    const cycleResult = detectCallCycles(nodeList, edgeList);

    for (const node of nodeList) {
      node.isCyclic = cycleResult.cyclicSymbolIds.has(node.id);
    }
    for (const edge of edgeList) {
      edge.isCycle = cycleResult.cycleEdgeIds.has(edge.id);
    }

    return {
      ok: true,
      cancelled: false,
      symbolId,
      depth: maxDepth,
      maxNodes,
      expansionCapped,
      nodes: nodeList,
      edges: edgeList,
      unresolvedBucket: buildUnresolvedBucket(symbolId, merged.unresolvedSites),
      candidateBuckets,
      cycles: cycleResult.cycles,
      cycleEdgeIds: [...cycleResult.cycleEdgeIds].sort(),
      cyclicSymbolIds: [...cycleResult.cyclicSymbolIds].sort(),
      scope: merged.scope,
      scopeReasons: merged.scopeReasons,
      diagnostics: merged.diagnostics,
    };
  }

  /**
   * Detect direct and mutual recursion cycles in the merged call graph.
   *
   * @param {string} [symbolId]
   */
  function cycles(symbolId) {
    const merged = getMerged(symbolId ? [symbolId] : []);
    const result = detectCallCycles(merged.symbols, merged.relationships);
    const relevantCycles = symbolId
      ? result.cycles.filter((cycle) => cycle.members.includes(symbolId))
      : result.cycles;
    return {
      ok: true,
      cycles: relevantCycles,
      allCycles: result.cycles,
      cycleEdgeIds: [...result.cycleEdgeIds].sort(),
      cyclicSymbolIds: [...result.cyclicSymbolIds].sort(),
    };
  }

  return {
    runInfo: () => ({ ...meta }),
    outgoing: (symbolId, filter) => queryNeighbors('outgoing', symbolId, filter),
    incoming: (symbolId, filter) => queryNeighbors('incoming', symbolId, filter),
    depth,
    cycles,
    merged: getMerged,
  };
}

export { CALL_LIMITS, CALL_RELATIONSHIP_TYPES, CALL_STATUSES };
