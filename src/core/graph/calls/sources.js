/**
 * Call-graph evidence source adapters (Phase 7 §5, §6, §15).
 *
 * 1. `createAdapterEvidenceSource(query)` reads CSR exclusively through
 *    `createQueryLayer()` and reports `scope: 'same_file_only'` with
 *    `scopeReasons: ['no_index']`.
 * 2. `createIndexEvidenceSource(index)` adapts the Phase 8 index contract
 *    (`callsByFrom`, `callsByTo`, `symbolById`, `batchNeighbors`) into the
 *    exact same evidence source shape so Phase 8 drops in without UI or merge
 *    changes.
 */

/**
 * @typedef {ReturnType<typeof import('../../csr/query.js').createQueryLayer>} QueryLayer
 */

/**
 * Create an evidence source backed by a single-file/adapter CSR query layer.
 *
 * @param {QueryLayer} query
 * @param {{
 *   sourceId?: string,
 *   staleFiles?: Iterable<string>,
 *   contentHashes?: Record<string, string>,
 * }} [options]
 */
export function createAdapterEvidenceSource(query, options = {}) {
  const infoRes = query?.runInfo?.();
  const info = infoRes?.ok
    ? infoRes.value
    : { runId: 'run:unknown', adapterId: 'adapter', completeness: 'partial' };
  const symbolsRes = query?.allSymbols?.();
  const symbols = symbolsRes?.ok ? symbolsRes.value : [];
  const relsRes = query?.allRelationships?.();
  const relationships = relsRes?.ok ? relsRes.value : [];

  const reasons = ['no_index'];
  if (info.completeness !== 'full') {
    reasons.push('analysis_partial');
  }

  return {
    sourceId: options.sourceId ?? `adapter:${info.adapterId || 'local'}`,
    kind: /** @type {'adapter'} */ ('adapter'),
    runId: info.runId,
    scope: /** @type {'same_file_only'} */ ('same_file_only'),
    scopeReasons: reasons,
    contentHashes: options.contentHashes ?? {},
    staleFiles: [...(options.staleFiles ?? [])],
    coveredSymbols: symbols.filter((sym) => sym.kind !== 'file').map((sym) => sym.symbolId),
    symbols,
    relationships,
  };
}

/**
 * Adapt a project index (Phase 8 contract: `callsByFrom`, `callsByTo`,
 * `symbolById`, `batchNeighbors`, optional `allSymbols`, `allRelationships`,
 * `state`) into a merge-ready evidence source.
 *
 * @param {{
 *   sourceId?: string,
 *   scope?: 'complete'|'partial',
 *   staleFiles?: Iterable<string>,
 *   contentHashes?: Record<string, string>,
 *   callsByFrom?: (symbolId: string) => Array<Record<string, any>>,
 *   callsByTo?: (symbolId: string) => Array<Record<string, any>>,
 *   symbolById?: (symbolId: string) => Record<string, any>|null|undefined,
 *   batchNeighbors?: (symbolIds: string[]) => {symbols?: Array<Record<string, any>>, relationships?: Array<Record<string, any>>},
 *   allSymbols?: () => Array<Record<string, any>>,
 *   allRelationships?: () => Array<Record<string, any>>,
 * }} index
 */
export function createIndexEvidenceSource(index) {
  if (!index || typeof index !== 'object') {
    return null;
  }

  /**
   * Materialize a snapshot of the index around a seed set of symbol ids (or
   * the whole index when `allSymbols`/`allRelationships` are exposed).
   *
   * @param {string[]} [seedSymbolIds]
   */
  function snapshot(seedSymbolIds = []) {
    /** @type {Map<string, Record<string, any>>} */
    const symbolMap = new Map();
    /** @type {Map<string, Record<string, any>>} */
    const relMap = new Map();

    if (typeof index.allSymbols === 'function') {
      for (const sym of index.allSymbols() ?? []) {
        if (sym?.symbolId) {
          symbolMap.set(sym.symbolId, sym);
        }
      }
    }
    if (typeof index.allRelationships === 'function') {
      for (const rel of index.allRelationships() ?? []) {
        if (rel?.relationshipId) {
          relMap.set(rel.relationshipId, rel);
        }
      }
    }

    if (typeof index.batchNeighbors === 'function' && seedSymbolIds.length > 0) {
      const batch = index.batchNeighbors(seedSymbolIds) ?? {};
      for (const sym of batch.symbols ?? []) {
        if (sym?.symbolId) {
          symbolMap.set(sym.symbolId, sym);
        }
      }
      for (const rel of batch.relationships ?? []) {
        if (rel?.relationshipId) {
          relMap.set(rel.relationshipId, rel);
        }
      }
    }

    for (const seedId of seedSymbolIds) {
      if (typeof index.symbolById === 'function') {
        const sym = index.symbolById(seedId);
        if (sym?.symbolId) {
          symbolMap.set(sym.symbolId, sym);
        }
      }
      if (typeof index.callsByFrom === 'function') {
        for (const rel of index.callsByFrom(seedId) ?? []) {
          if (rel?.relationshipId) {
            relMap.set(rel.relationshipId, rel);
          }
          if (rel?.to && typeof index.symbolById === 'function') {
            const target = index.symbolById(rel.to);
            if (target?.symbolId) {
              symbolMap.set(target.symbolId, target);
            }
          }
        }
      }
      if (typeof index.callsByTo === 'function') {
        for (const rel of index.callsByTo(seedId) ?? []) {
          if (rel?.relationshipId) {
            relMap.set(rel.relationshipId, rel);
          }
          if (rel?.from && typeof index.symbolById === 'function') {
            const caller = index.symbolById(rel.from);
            if (caller?.symbolId) {
              symbolMap.set(caller.symbolId, caller);
            }
          }
        }
      }
    }

    const scope = index.scope === 'partial' ? 'partial' : 'complete';
    const scopeReasons = scope === 'partial' ? ['index_partial'] : [];

    return {
      sourceId: index.sourceId ?? 'index:workspace',
      kind: /** @type {'index'} */ ('index'),
      scope: /** @type {'complete'|'partial'} */ (scope),
      scopeReasons,
      contentHashes: index.contentHashes ?? {},
      staleFiles: [...(index.staleFiles ?? [])],
      coveredSymbols: [...symbolMap.keys()],
      symbols: [...symbolMap.values()],
      relationships: [...relMap.values()],
    };
  }

  return {
    snapshot,
    callsByFrom: (symbolId) => index.callsByFrom?.(symbolId) ?? [],
    callsByTo: (symbolId) => index.callsByTo?.(symbolId) ?? [],
    symbolById: (symbolId) => index.symbolById?.(symbolId) ?? null,
    batchNeighbors: (symbolIds) =>
      index.batchNeighbors?.(symbolIds) ?? { symbols: [], relationships: [] },
  };
}
