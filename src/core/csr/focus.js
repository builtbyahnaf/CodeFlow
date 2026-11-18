/**
 * Focus a run on one file.
 *
 * A header is analysed through a translation unit that includes it, so the raw
 * run contains declarations and calls from both files. Consumers that asked for
 * the header must not be shown the TU's symbols as if they lived in the header.
 * This module produces the honest subset: symbols declared in the requested
 * file, relationships whose endpoints survive, and every file record (ranges
 * still need to resolve).
 *
 * It is a pure transformation and does not re-validate; callers that need the
 * defensive guarantee run `validateAnalysisRun` again at the boundary.
 */

/**
 * @typedef {import('./entities.js').AnalysisRun} AnalysisRun
 * @typedef {import('./entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('./entities.js').Relationship} Relationship
 */

/**
 * @param {AnalysisRun} run
 * @param {string} path Workspace-relative, forward-slash path
 * @returns {{run: AnalysisRun, keptSymbols: number, droppedSymbols: number, droppedRelationships: number}}
 */
export function focusRunOnPath(run, path) {
  const file = run.files.find((entry) => entry.path === path);
  const source = /** @type {AnalysisRun} */ (run);

  if (!file) {
    return {
      run: {
        ...source,
        scope: { kind: 'file', path },
        symbols: [],
        relationships: [],
        controlConstructs: [],
        dataFacts: [],
      },
      keptSymbols: 0,
      droppedSymbols: source.symbols.length,
      droppedRelationships: source.relationships.length,
    };
  }

  const kept = source.symbols.filter((symbol) => symbol.declaration.fileId === file.fileId);
  const keptIds = new Set(kept.map((symbol) => symbol.symbolId));

  const symbols = kept.map((symbol) => {
    if (symbol.parentId && !keptIds.has(symbol.parentId)) {
      const copy = { ...symbol };
      delete copy.parentId;
      return copy;
    }
    return symbol;
  });

  const relationships = source.relationships.filter((relationship) => {
    if (!keptIds.has(relationship.from)) {
      return false;
    }
    if (relationship.to.startsWith('external:')) {
      return true;
    }
    return keptIds.has(relationship.to);
  });

  return {
    run: {
      ...source,
      scope: { kind: 'file', path },
      symbols,
      relationships,
      controlConstructs: source.controlConstructs.filter((construct) =>
        keptIds.has(construct.symbolId ?? ''),
      ),
      dataFacts: source.dataFacts.filter((fact) => keptIds.has(fact.symbolId)),
    },
    keptSymbols: symbols.length,
    droppedSymbols: source.symbols.length - symbols.length,
    droppedRelationships: source.relationships.length - relationships.length,
  };
}
