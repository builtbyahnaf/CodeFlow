/**
 * Language-agnostic CSR queries.
 *
 * Consumers never walk CSR arrays directly. They ask this layer, which:
 * - checks capabilities before answering (a missing capability is a typed
 *   degradation, never an empty array that looks like "no results");
 * - derives inverse relationships from the single stored direction;
 * - caches derived results until the run changes.
 *
 * Every query returns `{ok: true, value}` or `{ok: false, code, message}`. No
 * query throws across the boundary.
 */

/**
 * @typedef {import('./entities.js').AnalysisRun} AnalysisRun
 * @typedef {import('./entities.js').Relationship} Relationship
 * @typedef {import('./entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('./entities.js').ControlConstruct} ControlConstruct
 * @typedef {import('./entities.js').DataFact} DataFact
 * @typedef {{ok: true, value: T} | {ok: false, code: string, message: string}} QueryResult
 * @template T
 */

const INVERSE_OF = Object.freeze({
  calls: 'called_by',
  defines: 'defined_in',
  references: 'referenced_by',
  declares: 'declared_by',
  reads: 'read_by',
  writes: 'written_by',
  captures: 'captured_by',
});

/**
 * @param {AnalysisRun} run
 * @param {{capabilities?: Record<string, boolean|'partial'>}} [options]
 */
export function createQueryLayer(run, options = {}) {
  const capabilities = Object.freeze({ ...(options.capabilities ?? {}) });
  const symbols = new Map(run.symbols.map((symbol) => [symbol.symbolId, symbol]));
  const symbolsByFile = new Map();
  for (const symbol of run.symbols) {
    const list = symbolsByFile.get(symbol.declaration.fileId) ?? [];
    list.push(symbol);
    symbolsByFile.set(symbol.declaration.fileId, list);
  }
  for (const list of symbolsByFile.values()) {
    list.sort(bySymbolId);
  }

  const outgoingBySymbol = new Map();
  const incomingBySymbol = new Map();
  for (const relationship of run.relationships) {
    const outgoing = outgoingBySymbol.get(relationship.from) ?? [];
    outgoing.push(relationship);
    outgoingBySymbol.set(relationship.from, outgoing);
    const incoming = incomingBySymbol.get(relationship.to) ?? [];
    incoming.push(relationship);
    incomingBySymbol.set(relationship.to, incoming);
  }

  const factsBySymbol = new Map();
  for (const fact of run.dataFacts) {
    const list = factsBySymbol.get(fact.symbolId) ?? [];
    list.push(fact);
    factsBySymbol.set(fact.symbolId, list);
  }

  const constructsBySymbol = new Map();
  const constructById = new Map(run.controlConstructs.map((item) => [item.constructId, item]));
  for (const construct of run.controlConstructs) {
    if (!construct.symbolId) {
      continue;
    }
    const list = constructsBySymbol.get(construct.symbolId) ?? [];
    list.push(construct);
    constructsBySymbol.set(construct.symbolId, list);
  }

  /** @type {Map<string, Relationship[]>} */
  let inverseCache = new Map();
  let cacheVersion = 0;
  let cacheHits = 0;

  /**
   * @param {string} code
   * @param {string} message
   * @returns {{ok: false, code: string, message: string}}
   */
  function fail(code, message) {
    return { ok: false, code, message };
  }

  /**
   * @param {string} capability
   * @param {string} feature
   * @returns {{ok: true} | {ok: false, code: string, message: string}}
   */
  function requireCapability(capability, feature) {
    const value = capabilities[capability];
    if (value === true || value === 'partial') {
      return { ok: true };
    }
    return fail(
      'E_UNSUPPORTED',
      `${feature} is not available: adapter "${run.adapterId}" does not declare ${capability}.`,
    );
  }

  /**
   * Every declared symbol in deterministic id order. Consumers that need the
   * whole set (the graph builder) use this instead of walking `run.symbols`,
   * so core layers never acquire a second, unvalidated view of CSR.
   *
   * @returns {QueryResult<SymbolRecord[]>}
   */
  function allSymbols() {
    return { ok: true, value: [...run.symbols].sort(bySymbolId) };
  }

  /**
   * Every stored relationship in deterministic `(type, from, to, id)` order.
   *
   * @returns {QueryResult<Relationship[]>}
   */
  function allRelationships() {
    return { ok: true, value: [...run.relationships].sort(byRelationshipKey) };
  }

  /**
   * @returns {QueryResult<AnalysisRun['diagnostics']>}
   */
  function diagnostics() {
    return { ok: true, value: [...run.diagnostics] };
  }

  /**
   * Run metadata that is not a query result: identity, language, scope, and
   * completeness. Copying it prevents a consumer from mutating the run.
   *
   * @returns {QueryResult<{runId: string, language: string, adapterId: string, adapterVersion: string, csrVersion: string, completeness: string, scope: {kind: string, path?: string}}>}
   */
  function runInfo() {
    return {
      ok: true,
      value: {
        runId: run.runId,
        language: run.language,
        adapterId: run.adapterId,
        adapterVersion: run.adapterVersion,
        csrVersion: run.csrVersion,
        completeness: run.completeness,
        scope: { ...run.scope },
      },
    };
  }

  /**
   * @param {string} symbolId
   * @returns {QueryResult<SymbolRecord>}
   */
  function symbolById(symbolId) {
    if (typeof symbolId !== 'string' || symbolId.length === 0) {
      return fail('E_QUERY', 'symbolId must be a non-empty string.');
    }
    const symbol = symbols.get(symbolId);
    return symbol ? { ok: true, value: symbol } : fail('E_NOT_FOUND', `No symbol "${symbolId}".`);
  }

  /**
   * @param {string} fileId
   * @returns {QueryResult<SymbolRecord[]>}
   */
  function symbolsInFile(fileId) {
    if (typeof fileId !== 'string' || fileId.length === 0) {
      return fail('E_QUERY', 'fileId must be a non-empty string.');
    }
    return { ok: true, value: [...(symbolsByFile.get(fileId) ?? [])] };
  }

  /**
   * @param {{types?: string[], statuses?: string[]}} [filter]
   * @returns {QueryResult<{types: string[]|null, statuses: string[]|null}>}
   */
  function normalizeFilter(filter = {}) {
    const types = filter.types === undefined ? null : filter.types;
    const statuses = filter.statuses === undefined ? null : filter.statuses;
    if (
      types !== null &&
      (!Array.isArray(types) || types.some((type) => typeof type !== 'string'))
    ) {
      return fail('E_QUERY', 'types must be an array of relationship types.');
    }
    if (
      statuses !== null &&
      (!Array.isArray(statuses) || statuses.some((status) => typeof status !== 'string'))
    ) {
      return fail('E_QUERY', 'statuses must be an array of resolution statuses.');
    }
    return { ok: true, value: { types, statuses } };
  }

  /**
   * @param {Relationship} relationship
   * @param {{types: string[]|null, statuses: string[]|null}} filter
   * @returns {boolean}
   */
  function matches(relationship, filter) {
    if (filter.types && !filter.types.includes(relationship.type)) {
      return false;
    }
    if (filter.statuses && !filter.statuses.includes(relationship.status)) {
      return false;
    }
    return true;
  }

  /**
   * Stored relationships that leave a symbol.
   *
   * @param {string} symbolId
   * @param {{types?: string[], statuses?: string[]}} [filter]
   * @returns {QueryResult<Relationship[]>}
   */
  function outgoing(symbolId, filter) {
    if (typeof symbolId !== 'string' || !symbols.has(symbolId)) {
      return fail('E_NOT_FOUND', `No symbol "${String(symbolId)}".`);
    }
    const normalized = normalizeFilter(filter);
    if (!normalized.ok) {
      return normalized;
    }
    return {
      ok: true,
      value: (outgoingBySymbol.get(symbolId) ?? []).filter((relationship) =>
        matches(relationship, normalized.value),
      ),
    };
  }

  /**
   * Reverse view of stored relationships. The result is derived, never stored.
   *
   * @param {string} symbolId
   * @param {{types?: string[], statuses?: string[]}} [filter]
   * @returns {QueryResult<Relationship[]>}
   */
  function incoming(symbolId, filter) {
    if (typeof symbolId !== 'string' || !symbols.has(symbolId)) {
      return fail('E_NOT_FOUND', `No symbol "${String(symbolId)}".`);
    }
    const normalized = normalizeFilter(filter);
    if (!normalized.ok) {
      return normalized;
    }
    const key = `${cacheVersion}|${symbolId}|${JSON.stringify(normalized.value)}`;
    const cached = inverseCache.get(key);
    if (cached) {
      cacheHits += 1;
      return { ok: true, value: cached };
    }
    const derived = (incomingBySymbol.get(symbolId) ?? [])
      .filter(
        (relationship) =>
          normalized.value.statuses === null ||
          normalized.value.statuses.includes(relationship.status),
      )
      .filter(
        (relationship) =>
          normalized.value.types === null ||
          normalized.value.types.includes(relationship.type) ||
          normalized.value.types.includes(INVERSE_OF[relationship.type]),
      )
      .map((relationship) => invertRelationship(relationship));
    inverseCache.set(key, derived);
    return { ok: true, value: derived };
  }

  /**
   * @param {string} symbolId
   * @param {{statuses?: string[]}} [filter]
   * @returns {QueryResult<Array<{symbol: SymbolRecord, relationship: Relationship}>>}
   */
  function callers(symbolId, filter) {
    const capability = requireCapability('resolveCalls', 'Caller queries');
    if (!capability.ok) {
      return capability;
    }
    const derived = incoming(symbolId, {
      types: ['calls', 'called_by'],
      statuses: filter?.statuses,
    });
    if (!derived.ok) {
      return derived;
    }
    /** @type {Array<{symbol: SymbolRecord, relationship: Relationship}>} */
    const result = [];
    for (const relationship of derived.value) {
      // `called_by` is sourced at the callee and targets the caller, so the
      // caller is the inverse relationship's `to`.
      const caller = symbols.get(relationship.to);
      if (caller) {
        result.push({ symbol: caller, relationship });
      }
    }
    return { ok: true, value: result };
  }

  /**
   * @param {string} symbolId
   * @param {{statuses?: string[]}} [filter]
   * @returns {QueryResult<Array<{symbol: SymbolRecord, relationship: Relationship, external: boolean}>>}
   */
  function callees(symbolId, filter) {
    const capability = requireCapability('resolveCalls', 'Callee queries');
    if (!capability.ok) {
      return capability;
    }
    const stored = outgoing(symbolId, { types: ['calls'], statuses: filter?.statuses });
    if (!stored.ok) {
      return stored;
    }
    /** @type {Array<{symbol: SymbolRecord, relationship: Relationship, external: boolean}>} */
    const result = [];
    for (const relationship of stored.value) {
      const target = symbols.get(relationship.to);
      if (target) {
        result.push({ symbol: target, relationship, external: false });
      } else {
        result.push({
          symbol: {
            symbolId: relationship.to,
            kind: 'unknown',
            name: relationship.to,
            qualifiedName: relationship.to,
            language: run.language,
            declaration: { fileId: '', startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 },
            visibility: 'unknown',
          },
          relationship,
          external: true,
        });
      }
    }
    return { ok: true, value: result };
  }

  /**
   * A flat construct list plus a resolved tree. Phase 4 renders the tree.
   *
   * @param {string} symbolId
   * @returns {QueryResult<{constructs: ControlConstruct[], roots: ControlConstruct[], byId: Record<string, ControlConstruct>}>}
   */
  function constructsOf(symbolId) {
    const capability = requireCapability('generateCFG', 'Control-flow queries');
    if (!capability.ok) {
      return capability;
    }
    if (typeof symbolId !== 'string' || !symbols.has(symbolId)) {
      return fail('E_NOT_FOUND', `No symbol "${String(symbolId)}".`);
    }
    const constructs = constructsBySymbol.get(symbolId) ?? [];
    const roots = constructs.filter(
      (construct) => !construct.parentId || !constructById.has(construct.parentId),
    );
    /** @type {Record<string, ControlConstruct>} */
    const byId = {};
    for (const construct of constructs) {
      byId[construct.constructId] = construct;
    }
    return { ok: true, value: { constructs, roots, byId } };
  }

  /**
   * @param {string} symbolId
   * @returns {QueryResult<DataFact[]>}
   */
  function dataFactsOf(symbolId) {
    const capability = requireCapability('generateDFG', 'Data-flow queries');
    if (!capability.ok) {
      return capability;
    }
    if (typeof symbolId !== 'string' || !symbols.has(symbolId)) {
      return fail('E_NOT_FOUND', `No symbol "${String(symbolId)}".`);
    }
    return { ok: true, value: [...(factsBySymbol.get(symbolId) ?? [])] };
  }

  /**
   * @returns {QueryResult<Record<string, boolean|'partial'>>}
   */
  function capabilitiesOf() {
    return { ok: true, value: { ...capabilities } };
  }

  return {
    allSymbols,
    allRelationships,
    diagnostics,
    runInfo,
    symbolById,
    symbolsInFile,
    outgoing,
    incoming,
    callers,
    callees,
    constructsOf,
    dataFactsOf,
    capabilities: capabilitiesOf,
    invalidate() {
      inverseCache = new Map();
      cacheVersion += 1;
    },
    stats: () => ({ cacheHits, cacheVersion, inverseEntries: inverseCache.size }),
  };
}

/**
 * @param {Relationship} relationship
 * @returns {Relationship}
 */
function invertRelationship(relationship) {
  /** @type {Relationship} */
  const inverse = {
    relationshipId: `inverse:${relationship.relationshipId}`,
    type: INVERSE_OF[relationship.type] ?? relationship.type,
    from: relationship.to,
    to: relationship.from,
    status: relationship.status,
    evidence: relationship.evidence ?? [],
  };
  if (relationship.reasonCode) {
    inverse.reasonCode = relationship.reasonCode;
  }
  if (relationship.site) {
    inverse.site = relationship.site;
  }
  return inverse;
}

/**
 * @param {SymbolRecord} a
 * @param {SymbolRecord} b
 * @returns {number}
 */
function bySymbolId(a, b) {
  return a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0;
}

/**
 * @param {Relationship} a
 * @param {Relationship} b
 * @returns {number}
 */
function byRelationshipKey(a, b) {
  for (const [left, right] of [
    [a.type, b.type],
    [a.from, b.from],
    [a.to, b.to],
    [a.relationshipId, b.relationshipId],
  ]) {
    if (left < right) {
      return -1;
    }
    if (left > right) {
      return 1;
    }
  }
  return 0;
}
