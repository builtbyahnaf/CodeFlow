/**
 * Query surface over the project index (Phase 8 §11, Phase 7 §15).
 *
 * Every query returns a typed result carrying `scope` (`complete`, `partial`,
 * or `stale`) so consumers cannot present incomplete or outdated index results
 * as complete. Also implements the Phase 7 `createIndexEvidenceSource`
 * interface (`callsByFrom`, `callsByTo`, `symbolById`, `batchNeighbors`) and
 * `logicalHash()` for idempotence verification (P8-09).
 */

import { hashHex } from '../csr/hash.js';
import { INDEX_SCHEMA_VERSION } from './schema.js';
import { evaluateIndexHealth, evaluateIndexScope } from './health.js';

/**
 * Convert a stored symbol table row into a CSR-shaped `SymbolRecord`.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
export function rowToSymbol(row) {
  let extensions;
  if (typeof row.extensions_json === 'string' && row.extensions_json.length > 0) {
    try {
      extensions = JSON.parse(row.extensions_json);
    } catch {
      extensions = undefined;
    }
  }
  return {
    symbolId: row.symbol_id,
    kind: row.kind,
    name: row.name,
    qualifiedName: row.qualified_name,
    language: row.language,
    fileId: row.file_id,
    ...(row.parent_id ? { parentId: row.parent_id } : {}),
    declaration: {
      fileId: row.file_id,
      startLine: Number(row.start_line ?? 0),
      startColumn: Number(row.start_col ?? 0),
      endLine: Number(row.end_line ?? 0),
      endColumn: Number(row.end_col ?? 0),
    },
    ...(row.visibility ? { visibility: row.visibility } : {}),
    ...(extensions ? { extensions } : {}),
  };
}

/**
 * Convert a stored relationship table row into a CSR-shaped `Relationship`.
 *
 * @param {Record<string, any>} row
 * @returns {Record<string, any>}
 */
export function rowToRelationship(row) {
  const hasSite = typeof row.site_file === 'string' && row.site_file.length > 0;
  return {
    relationshipId: row.rel_id,
    type: row.type,
    from: row.from_id,
    to: row.to_id,
    status: row.status,
    ...(row.reason ? { reasonCode: row.reason } : {}),
    ...(hasSite
      ? {
          site: {
            fileId: row.site_file,
            startLine: Number(row.site_start_line ?? 0),
            startColumn: 0,
            endLine: Number(row.site_end_line ?? row.site_start_line ?? 0),
            endColumn: 0,
          },
        }
      : {}),
    evidence: [],
    runId: row.run_id,
  };
}

/**
 * Compute a deterministic content hash of the index's logical records,
 * excluding wall-clock timestamps (`indexed_at`, `updated_at`) and volatile
 * `run_id` strings so two indexing runs over an unchanged workspace yield an
 * identical hash (P8-09).
 *
 * @param {Record<string, any>} snapshot
 * @returns {string}
 */
export function computeLogicalIndexHash(snapshot) {
  const files = Object.values(snapshot?.files ?? {})
    .map((f) => ({
      file_id: f.file_id,
      path: f.path,
      language: f.language,
      content_hash: f.content_hash,
      size_bytes: f.size_bytes,
      line_count: f.line_count,
    }))
    .sort((a, b) => (a.file_id < b.file_id ? -1 : a.file_id > b.file_id ? 1 : 0));

  const symbols = Object.values(snapshot?.symbols ?? {})
    .map((s) => ({
      symbol_id: s.symbol_id,
      kind: s.kind,
      name: s.name,
      qualified_name: s.qualified_name,
      language: s.language,
      file_id: s.file_id,
      parent_id: s.parent_id ?? null,
      start_line: s.start_line,
      start_col: s.start_col,
      end_line: s.end_line,
      end_col: s.end_col,
      visibility: s.visibility ?? null,
      extensions_json: s.extensions_json ?? null,
    }))
    .sort((a, b) => (a.symbol_id < b.symbol_id ? -1 : a.symbol_id > b.symbol_id ? 1 : 0));

  const relationships = Object.values(snapshot?.relationships ?? {})
    .map((r) => ({
      rel_id: r.rel_id,
      type: r.type,
      from_id: r.from_id,
      to_id: r.to_id,
      status: r.status,
      reason: r.reason ?? null,
      site_file: r.site_file ?? null,
      site_start_line: r.site_start_line ?? null,
      site_end_line: r.site_end_line ?? null,
    }))
    .sort((a, b) => (a.rel_id < b.rel_id ? -1 : a.rel_id > b.rel_id ? 1 : 0));

  const dependencies = Object.values(snapshot?.dependencies ?? {})
    .map((d) => ({
      from_file: d.from_file,
      to_file: d.to_file,
      type: d.type,
      status: d.status,
    }))
    .sort((a, b) => {
      const ka = `${a.from_file}|${a.to_file}|${a.type}`;
      const kb = `${b.from_file}|${b.to_file}|${b.type}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

  const analysisState = Object.values(snapshot?.analysis_state ?? {})
    .map((a) => ({
      file_id: a.file_id,
      completeness: a.completeness,
      diagnostics_json: a.diagnostics_json ?? '[]',
    }))
    .sort((a, b) => (a.file_id < b.file_id ? -1 : a.file_id > b.file_id ? 1 : 0));

  return `index:${hashHex(
    JSON.stringify({ files, symbols, relationships, dependencies, analysisState }),
  )}`;
}

/**
 * Create the Phase 8 §11 query surface over a snapshot provider.
 *
 * @param {() => Record<string, any>} getSnapshot
 * @param {{
 *   getDiskHashes?: () => Record<string, string>,
 *   getByteSize?: () => number,
 * }} [options]
 */
export function createIndexQuerySurface(getSnapshot, options = {}) {
  function currentScope() {
    return evaluateIndexScope(getSnapshot(), options.getDiskHashes?.() ?? {});
  }

  /**
   * @param {string} symbolId
   */
  function symbolById(symbolId) {
    const snap = getSnapshot();
    const row = snap?.symbols?.[symbolId];
    return row ? rowToSymbol(row) : null;
  }

  /**
   * Prefix search over `name` and `qualified_name` with optional kind filter
   * and cursor pagination.
   *
   * @param {string} prefix
   * @param {{kinds?: string[], limit?: number, cursor?: number|string}} [filter]
   */
  function symbolsByName(prefix = '', filter = {}) {
    const snap = getSnapshot();
    const { scope, rawScope } = currentScope();
    const needle = String(prefix ?? '')
      .trim()
      .toLowerCase();
    const kinds =
      Array.isArray(filter.kinds) && filter.kinds.length > 0 ? new Set(filter.kinds) : null;
    const limit = Math.min(200, Math.max(1, Math.trunc(Number(filter.limit) || 50)));
    const offset = Math.max(0, Math.trunc(Number(filter.cursor) || 0));

    const matches = Object.values(snap?.symbols ?? {})
      .filter((row) => {
        if (kinds && !kinds.has(row.kind)) {
          return false;
        }
        if (!needle) {
          return true;
        }
        return (
          String(row.name ?? '')
            .toLowerCase()
            .startsWith(needle) ||
          String(row.qualified_name ?? '')
            .toLowerCase()
            .includes(needle)
        );
      })
      .map(rowToSymbol)
      .sort((a, b) => (a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0));

    const items = matches.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    return {
      ok: true,
      items,
      total: matches.length,
      ...(nextOffset < matches.length ? { nextCursor: String(nextOffset) } : {}),
      scope: rawScope === 'stale' ? 'stale' : scope,
    };
  }

  /**
   * @param {string} fileId
   */
  function symbolsInFile(fileId) {
    const snap = getSnapshot();
    const { scope, rawScope } = currentScope();
    const items = Object.values(snap?.symbols ?? {})
      .filter((row) => row.file_id === fileId)
      .map(rowToSymbol)
      .sort((a, b) => (a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0));
    return {
      ok: true,
      items,
      total: items.length,
      scope: rawScope === 'stale' ? 'stale' : scope,
    };
  }

  /**
   * @param {string} symbolId
   */
  function callsByFrom(symbolId) {
    const snap = getSnapshot();
    return Object.values(snap?.relationships ?? {})
      .filter((row) => row.from_id === symbolId)
      .map(rowToRelationship)
      .sort((a, b) =>
        a.relationshipId < b.relationshipId ? -1 : a.relationshipId > b.relationshipId ? 1 : 0,
      );
  }

  /**
   * @param {string} symbolId
   */
  function callsByTo(symbolId) {
    const snap = getSnapshot();
    return Object.values(snap?.relationships ?? {})
      .filter((row) => row.to_id === symbolId)
      .map(rowToRelationship)
      .sort((a, b) =>
        a.relationshipId < b.relationshipId ? -1 : a.relationshipId > b.relationshipId ? 1 : 0,
      );
  }

  /**
   * @param {string[]} symbolIds
   */
  function batchNeighbors(symbolIds = []) {
    const snap = getSnapshot();
    const wanted = new Set(Array.isArray(symbolIds) ? symbolIds : []);
    /** @type {Map<string, Record<string, any>>} */
    const symbols = new Map();
    /** @type {Record<string, any>[]} */
    const relationships = [];

    for (const row of Object.values(snap?.relationships ?? {})) {
      if (wanted.has(row.from_id) || wanted.has(row.to_id)) {
        relationships.push(rowToRelationship(row));
        for (const id of [row.from_id, row.to_id]) {
          const symRow = snap?.symbols?.[id];
          if (symRow && !symbols.has(id)) {
            symbols.set(id, rowToSymbol(symRow));
          }
        }
      }
    }
    for (const id of wanted) {
      const symRow = snap?.symbols?.[id];
      if (symRow && !symbols.has(id)) {
        symbols.set(id, rowToSymbol(symRow));
      }
    }
    return {
      symbols: [...symbols.values()],
      relationships,
    };
  }

  /**
   * @param {string} symbolId
   * @param {{direction?: 'outgoing'|'incoming'|'both', types?: string[], statuses?: string[], limit?: number, cursor?: number|string}} [filter]
   */
  function neighbors(symbolId, filter = {}) {
    const snap = getSnapshot();
    const { scope, rawScope } = currentScope();
    const dir = filter.direction ?? 'both';
    const types =
      Array.isArray(filter.types) && filter.types.length > 0 ? new Set(filter.types) : null;
    const statuses =
      Array.isArray(filter.statuses) && filter.statuses.length > 0
        ? new Set(filter.statuses)
        : null;
    const limit = Math.min(200, Math.max(1, Math.trunc(Number(filter.limit) || 100)));
    const offset = Math.max(0, Math.trunc(Number(filter.cursor) || 0));

    const matching = Object.values(snap?.relationships ?? {})
      .filter((row) => {
        if (dir === 'outgoing' && row.from_id !== symbolId) {
          return false;
        }
        if (dir === 'incoming' && row.to_id !== symbolId) {
          return false;
        }
        if (dir === 'both' && row.from_id !== symbolId && row.to_id !== symbolId) {
          return false;
        }
        if (types && !types.has(row.type)) {
          return false;
        }
        if (statuses && !statuses.has(row.status)) {
          return false;
        }
        return true;
      })
      .map(rowToRelationship)
      .sort((a, b) =>
        a.relationshipId < b.relationshipId ? -1 : a.relationshipId > b.relationshipId ? 1 : 0,
      );

    const items = matching.slice(offset, offset + limit);
    const nextOffset = offset + items.length;
    return {
      ok: true,
      items,
      total: matching.length,
      ...(nextOffset < matching.length ? { nextCursor: String(nextOffset) } : {}),
      scope: rawScope === 'stale' ? 'stale' : scope,
    };
  }

  /**
   * @param {string} fileId
   * @param {'outgoing'|'incoming'|'both'} [direction]
   */
  function fileDependencies(fileId, direction = 'outgoing') {
    const snap = getSnapshot();
    const { scope, rawScope } = currentScope();
    const items = Object.values(snap?.dependencies ?? {})
      .filter((row) => {
        if (direction === 'outgoing') {
          return row.from_file === fileId;
        }
        if (direction === 'incoming') {
          return row.to_file === fileId;
        }
        return row.from_file === fileId || row.to_file === fileId;
      })
      .map((row) => ({
        fromFile: row.from_file,
        toFile: row.to_file,
        type: row.type,
        status: row.status,
      }))
      .sort((a, b) => {
        const ka = `${a.fromFile}|${a.toFile}|${a.type}`;
        const kb = `${b.fromFile}|${b.toFile}|${b.type}`;
        return ka < kb ? -1 : ka > kb ? 1 : 0;
      });
    return {
      ok: true,
      items,
      total: items.length,
      scope: rawScope === 'stale' ? 'stale' : scope,
    };
  }

  /**
   * Return indexed files whose workspace-relative path starts with `modulePrefix`.
   * Used by Phase 10 semantic zoom aggregation.
   *
   * @param {string} [modulePrefix]
   */
  function filesUnder(modulePrefix = '') {
    const snap = getSnapshot();
    const { scope, rawScope } = currentScope();
    const prefix = String(modulePrefix ?? '')
      .replace(/\\/g, '/')
      .replace(/^\/+/, '');
    const items = Object.values(snap?.files ?? {})
      .filter(
        (row) =>
          !prefix ||
          row.path === prefix ||
          row.path.startsWith(`${prefix}/`) ||
          row.path.startsWith(prefix),
      )
      .map((row) => ({
        fileId: row.file_id,
        path: row.path,
        language: row.language,
        contentHash: row.content_hash,
        sizeBytes: row.size_bytes,
        lineCount: row.line_count,
        indexedAt: row.indexed_at,
      }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
    return {
      ok: true,
      items,
      total: items.length,
      scope: rawScope === 'stale' ? 'stale' : scope,
    };
  }

  function stats() {
    const snap = getSnapshot();
    const fileRows = Object.values(snap?.files ?? {});
    const latestIndexedAt = fileRows.reduce(
      (max, row) => Math.max(max, Number(row.indexed_at) || 0),
      0,
    );
    const { scope, staleFiles } = currentScope();
    return {
      state: snap?.meta?.state ?? 'unindexed',
      schemaVersion: Number(snap?.meta?.schema_version ?? INDEX_SCHEMA_VERSION),
      lastRunId: snap?.meta?.last_run_id ?? '',
      fileCount: fileRows.length,
      symbolCount: Object.keys(snap?.symbols ?? {}).length,
      relationshipCount: Object.keys(snap?.relationships ?? {}).length,
      dependencyCount: Object.keys(snap?.dependencies ?? {}).length,
      staleFileCount: staleFiles.length,
      indexedAt: latestIndexedAt || null,
      byteSize: options.getByteSize?.() ?? 0,
      scope,
    };
  }

  function health() {
    return evaluateIndexHealth(getSnapshot(), options.getDiskHashes?.() ?? {});
  }

  return {
    symbolById,
    symbolsByName,
    symbolsInFile,
    neighbors,
    callsByFrom,
    callsByTo,
    batchNeighbors,
    allSymbols: () => Object.values(getSnapshot()?.symbols ?? {}).map(rowToSymbol),
    allRelationships: () =>
      Object.values(getSnapshot()?.relationships ?? {}).map(rowToRelationship),
    fileDependencies,
    filesUnder,
    stats,
    health,
    logicalHash: () => computeLogicalIndexHash(getSnapshot()),
  };
}
