/**
 * Unified cross-level search, automatic ancestor breadcrumb expansion, visible
 * filter chips, and incoming/outgoing highlight emphasis (Phase 10 §9,
 * P10-12, P10-14, P10-15, AC-10.9).
 */

import { ZOOM_LEVELS } from './levels.js';
import { applyZoomFilters } from './filters.js';
import { computeDirectionalHighlight } from './highlight.js';

export { applyZoomFilters, computeDirectionalHighlight };

/**
 * Search files, modules, and symbols across zoom levels with cursor pagination.
 *
 * @param {{
 *   queryText: string,
 *   index?: {
 *     filesUnder?: (prefix?: string) => {items: Array<Record<string, any>>},
 *     symbolsByName?: (prefix: string, filter?: Record<string, any>) => {items: Array<Record<string, any>>, total: number},
 *   }|null,
 *   query?: {
 *     allFiles?: () => {ok: boolean, value: Array<Record<string, any>>},
 *     allSymbols?: () => {ok: boolean, value: Array<Record<string, any>>},
 *   }|null,
 *   kinds?: string[],
 *   limit?: number,
 *   cursor?: number|string,
 * }} input
 */
export function searchAcrossZoomLevels(input = {}) {
  const needle = String(input.queryText ?? '')
    .trim()
    .toLowerCase();
  const limit = Math.min(100, Math.max(1, Math.trunc(Number(input.limit) || 25)));
  const offset = Math.max(0, Math.trunc(Number(input.cursor) || 0));
  const kindFilter =
    Array.isArray(input.kinds) && input.kinds.length > 0 ? new Set(input.kinds) : null;

  const files =
    input.index?.filesUnder?.('')?.items ??
    (input.query?.allFiles?.()?.ok ? input.query.allFiles().value : []);

  const symbols =
    input.index?.symbolsByName?.(needle, {
      kinds: input.kinds,
      limit: 200,
    })?.items ??
    (input.query?.allSymbols?.()?.ok
      ? input.query
          .allSymbols()
          .value.filter(
            (s) =>
              (!kindFilter || kindFilter.has(s.kind)) &&
              (!needle ||
                s.name?.toLowerCase().includes(needle) ||
                s.qualifiedName?.toLowerCase().includes(needle)),
          )
      : []);

  const fileById = new Map(files.map((f) => [f.fileId ?? f.file_id, f]));

  /** @type {Array<Record<string, any>>} */
  const matches = [];

  if (!kindFilter || kindFilter.has('file')) {
    for (const file of files) {
      if (
        !needle ||
        String(file.path ?? '')
          .toLowerCase()
          .includes(needle)
      ) {
        const fId = file.fileId ?? file.file_id;
        matches.push({
          id: fId,
          label: file.path,
          kind: 'file',
          level: ZOOM_LEVELS.L2_FILE,
          scopeId: fId,
          filePath: file.path,
        });
      }
    }
  }

  for (const sym of symbols) {
    if (sym.kind === 'file') {
      continue;
    }
    const fId = sym.fileId ?? sym.declaration?.fileId;
    const fileRecord = fileById.get(fId);
    const targetLevel =
      sym.kind === 'function' || sym.kind === 'method'
        ? ZOOM_LEVELS.L4_FUNCTION
        : ZOOM_LEVELS.L3_SYMBOL;
    matches.push({
      id: sym.symbolId,
      label: sym.qualifiedName || sym.name,
      kind: sym.kind,
      level: targetLevel,
      scopeId: sym.symbolId,
      fileId: fId,
      filePath: fileRecord?.path ?? '',
      range: sym.declaration,
    });
  }

  const pageItems = matches.slice(offset, offset + limit);
  const nextOffset = offset + pageItems.length;

  return {
    ok: true,
    items: pageItems,
    total: matches.length,
    ...(nextOffset < matches.length ? { nextCursor: String(nextOffset) } : {}),
  };
}

/**
 * Compute the complete ancestor breadcrumb stack for a selected search result
 * so jumping to any nested symbol automatically populates L0 -> L1 -> L2 -> L3/L4
 * breadcrumbs (P10-14).
 *
 * @param {{
 *   id: string,
 *   label: string,
 *   kind: string,
 *   level: string,
 *   scopeId: string,
 *   fileId?: string,
 *   filePath?: string,
 * }} searchItem
 */
export function resolveSearchTargetBreadcrumbs(searchItem) {
  const stack = [
    {
      level: ZOOM_LEVELS.L0_WORKSPACE,
      scopeId: 'workspace',
      label: 'workspace',
      focusId: null,
    },
  ];

  const filePath = String(searchItem?.filePath ?? '').replace(/\\/g, '/');
  if (filePath) {
    const slash = filePath.indexOf('/');
    const topModule = slash > 0 ? filePath.slice(0, slash) : '.';
    stack.push({
      level: ZOOM_LEVELS.L1_MODULE,
      scopeId: topModule,
      label: topModule,
      focusId: searchItem.fileId ?? null,
    });

    const fileScopeId = searchItem.fileId || `file:${filePath}`;
    stack.push({
      level: ZOOM_LEVELS.L2_FILE,
      scopeId: fileScopeId,
      label: filePath.split('/').pop() || filePath,
      focusId: searchItem.level === ZOOM_LEVELS.L2_FILE ? fileScopeId : searchItem.id,
    });
  }

  if (
    searchItem.level === ZOOM_LEVELS.L3_SYMBOL ||
    searchItem.level === ZOOM_LEVELS.L4_FUNCTION ||
    searchItem.level === ZOOM_LEVELS.L5_STATEMENT
  ) {
    stack.push({
      level: searchItem.level,
      scopeId: searchItem.scopeId,
      label: searchItem.label,
      focusId: searchItem.id,
    });
  }

  return stack;
}
