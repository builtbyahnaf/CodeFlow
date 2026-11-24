/**
 * Paginated cluster and edge-bundle expansion service with `(graphId, clusterId, runId)`
 * cache and failure recovery (Phase 10 §6, P10-05..P10-08, AC-10.3).
 *
 * Rules:
 * - Default first page size is 50; maximum page size is 100.
 * - Never truncates members without returning `nextCursor`, `remainingCount`,
 *   and an explicit `"N more"` label (`moreLabel`).
 * - Caches expansion pages per `(graphId, clusterId, runId)` and invalidates
 *   automatically when `runId` changes.
 * - Never triggers analysis.
 * - On provider failure, keeps the cluster collapsed and returns a structured,
 *   retryable inline error (`{ ok: false, retryable: true, clusterId, ... }`).
 */

export const EXPANSION_DEFAULTS = Object.freeze({
  defaultPageSize: 50,
  maxPageSize: 100,
  maxCacheEntries: 128,
});

/**
 * @param {unknown} rawLimit
 * @returns {number}
 */
export function clampExpansionPageSize(rawLimit) {
  const num = Number(rawLimit);
  if (!Number.isFinite(num) || num <= 0) {
    return EXPANSION_DEFAULTS.defaultPageSize;
  }
  return Math.min(EXPANSION_DEFAULTS.maxPageSize, Math.max(1, Math.trunc(num)));
}

/**
 * Create a cluster/bundle expansion service.
 *
 * @param {{
 *   maxCacheEntries?: number,
 * }} [options]
 */
export function createClusterExpansionService(options = {}) {
  const maxCacheEntries = Math.max(
    8,
    Math.trunc(Number(options.maxCacheEntries) || EXPANSION_DEFAULTS.maxCacheEntries),
  );
  /** @type {Map<string, Record<string, any>>} */
  const pageCache = new Map();
  let currentRunId = '';

  function ensureRun(runId) {
    const norm = String(runId ?? '');
    if (norm && norm !== currentRunId) {
      pageCache.clear();
      currentRunId = norm;
    }
  }

  /**
   * Expand a cluster's members or a bundle's edges with cursor pagination.
   *
   * @param {{
   *   graphId: string,
   *   runId: string,
   *   clusterId: string,
   *   what?: 'members'|'edges',
   *   page?: {limit?: number, cursor?: string|number},
   *   scope?: 'complete'|'partial'|'stale',
   *   loadItems: () => Array<Record<string, any>>,
   * }} request
   */
  function expand(request) {
    const graphId = String(request?.graphId ?? 'graph:default');
    const runId = String(request?.runId ?? 'run:default');
    const clusterId = String(request?.clusterId ?? '');
    const what = request?.what === 'edges' ? 'edges' : 'members';
    const limit = clampExpansionPageSize(request?.page?.limit);
    const offset = Math.max(0, Math.trunc(Number(request?.page?.cursor) || 0));

    if (!clusterId) {
      return {
        ok: false,
        code: 'E_EXPAND_INVALID',
        retryable: false,
        clusterId: '',
        message: 'clusterId is required to expand an aggregate.',
      };
    }

    ensureRun(runId);
    const cacheKey = `${runId}|${graphId}|${clusterId}|${what}|${offset}|${limit}`;
    if (pageCache.has(cacheKey)) {
      return {
        ...pageCache.get(cacheKey),
        fromCache: true,
      };
    }

    let allItems;
    try {
      allItems = request.loadItems();
      if (!Array.isArray(allItems)) {
        throw new Error('Cluster provider did not return an item array.');
      }
    } catch (error) {
      return {
        ok: false,
        code: 'E_EXPAND_FAILED',
        retryable: true,
        keepCollapsed: true,
        clusterId,
        what,
        message: error instanceof Error ? error.message : String(error),
      };
    }

    const total = allItems.length;
    const slice = allItems.slice(offset, offset + limit);
    const nextOffset = offset + slice.length;
    const remainingCount = Math.max(0, total - nextOffset);

    const response = {
      ok: true,
      graphId,
      runId,
      clusterId,
      what,
      items: slice,
      total,
      remainingCount,
      ...(remainingCount > 0
        ? {
            nextCursor: String(nextOffset),
            moreLabel: `${remainingCount} more`,
          }
        : {}),
      scope: request.scope ?? 'complete',
      fromCache: false,
    };

    if (pageCache.size >= maxCacheEntries) {
      const oldestKey = pageCache.keys().next().value;
      if (oldestKey !== undefined) {
        pageCache.delete(oldestKey);
      }
    }
    pageCache.set(cacheKey, response);
    return response;
  }

  function invalidateRun(runId) {
    if (!runId || runId === currentRunId) {
      pageCache.clear();
    }
  }

  return {
    expand,
    invalidateRun,
    cacheSize: () => pageCache.size,
  };
}
