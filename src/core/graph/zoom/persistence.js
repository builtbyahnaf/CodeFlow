/**
 * Navigation-state serialization, validation, and safe-ancestor recovery
 * (Phase 10 §8, P10-17, AC-10.8).
 *
 * Stored in `workspaceState` (never `.codeflow/`).
 * Forbidden in persisted payload: `sourceText`, `rawSource`, `expansionPages`,
 * or stale layout coordinates for deleted nodes.
 *
 * If `runId` changed or the focused symbol/file no longer exists, walks up
 * `breadcrumbPath` to restore the deepest ancestor that still exists, returning
 * an explicit recovery notice.
 */

import { ZOOM_LEVELS, LEVEL_ORDER } from './levels.js';

const FORBIDDEN_PERSIST_KEYS = Object.freeze([
  'sourceText',
  'rawSource',
  'source',
  'expansionPages',
]);

/**
 * Serialize a navigation state object for `workspaceState` storage.
 *
 * @param {{
 *   graphId?: string,
 *   runId: string,
 *   level: string,
 *   scopeId: string,
 *   focusId?: string|null,
 *   breadcrumbPath?: Array<{level: string, scopeId: string, label: string, focusId?: string|null, viewport?: {x: number, y: number, zoom: number}, selection?: string|null}>,
 *   viewport?: {x: number, y: number, zoom: number},
 *   filters?: Record<string, any>,
 *   pinnedPreviewId?: string|null,
 * }} state
 */
export function serializeZoomNavigationState(state) {
  const level = LEVEL_ORDER.includes(state?.level) ? state.level : ZOOM_LEVELS.L0_WORKSPACE;
  const breadcrumbs =
    Array.isArray(state?.breadcrumbPath) && state.breadcrumbPath.length > 0
      ? state.breadcrumbPath.map((b) => ({
          level: LEVEL_ORDER.includes(b.level) ? b.level : ZOOM_LEVELS.L0_WORKSPACE,
          scopeId: String(b.scopeId ?? 'workspace'),
          label: String(b.label ?? b.scopeId ?? 'workspace'),
          focusId: b.focusId ?? null,
          viewport: {
            x: Number(b.viewport?.x ?? 0),
            y: Number(b.viewport?.y ?? 0),
            zoom: Number(b.viewport?.zoom ?? 1),
          },
          selection: b.selection ?? null,
        }))
      : [
          {
            level,
            scopeId: String(state?.scopeId ?? 'workspace'),
            label: String(state?.scopeId ?? 'workspace'),
            focusId: state?.focusId ?? null,
            viewport: {
              x: Number(state?.viewport?.x ?? 0),
              y: Number(state?.viewport?.y ?? 0),
              zoom: Number(state?.viewport?.zoom ?? 1),
            },
            selection: state?.focusId ?? null,
          },
        ];

  return {
    version: 1,
    graphId: String(state?.graphId ?? 'graph:zoom'),
    runId: String(state?.runId ?? ''),
    level,
    scopeId: String(state?.scopeId ?? 'workspace'),
    focusId: state?.focusId ?? null,
    breadcrumbPath: breadcrumbs,
    viewport: {
      x: Number(state?.viewport?.x ?? 0),
      y: Number(state?.viewport?.y ?? 0),
      zoom: Number(state?.viewport?.zoom ?? 1),
    },
    filters: {
      kinds: Array.isArray(state?.filters?.kinds) ? [...state.filters.kinds] : [],
      relationshipTypes: Array.isArray(state?.filters?.relationshipTypes)
        ? [...state.filters.relationshipTypes]
        : [],
      statuses: Array.isArray(state?.filters?.statuses) ? [...state.filters.statuses] : [],
    },
    pinnedPreviewId: typeof state?.pinnedPreviewId === 'string' ? state.pinnedPreviewId : null,
  };
}

/**
 * Restore a serialized navigation state against the current analysis run and
 * entity-existence predicate.
 *
 * @param {unknown} raw
 * @param {{
 *   currentRunId?: string,
 *   scopeExists?: (level: string, scopeId: string) => boolean,
 * }} [context]
 */
export function restoreZoomNavigationState(raw, context = {}) {
  const fallbackRoot = {
    ok: true,
    restoredExact: false,
    fellBackToAncestor: true,
    notice: 'Previous navigation state was invalid or expired; restored workspace overview.',
    state: serializeZoomNavigationState({
      runId: context.currentRunId ?? '',
      level: ZOOM_LEVELS.L0_WORKSPACE,
      scopeId: 'workspace',
    }),
  };

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return fallbackRoot;
  }
  const candidate = /** @type {Record<string, any>} */ (raw);
  for (const forbidden of FORBIDDEN_PERSIST_KEYS) {
    if (forbidden in candidate) {
      return fallbackRoot;
    }
  }
  if (!LEVEL_ORDER.includes(candidate.level) || typeof candidate.scopeId !== 'string') {
    return fallbackRoot;
  }

  const scopeExists =
    context.scopeExists ??
    ((level, scopeId) => level === ZOOM_LEVELS.L0_WORKSPACE || Boolean(scopeId));
  const runMatches = !context.currentRunId || candidate.runId === context.currentRunId;

  if (runMatches && scopeExists(candidate.level, candidate.scopeId)) {
    return {
      ok: true,
      restoredExact: true,
      fellBackToAncestor: false,
      notice: null,
      state: serializeZoomNavigationState(candidate),
    };
  }

  // Walk backwards through breadcrumbPath to find the deepest surviving ancestor
  const crumbs = Array.isArray(candidate.breadcrumbPath) ? candidate.breadcrumbPath : [];
  for (let idx = crumbs.length - 1; idx >= 0; idx -= 1) {
    const crumb = crumbs[idx];
    if (
      crumb &&
      LEVEL_ORDER.includes(crumb.level) &&
      typeof crumb.scopeId === 'string' &&
      scopeExists(crumb.level, crumb.scopeId)
    ) {
      const slicedCrumbs = crumbs.slice(0, idx + 1);
      return {
        ok: true,
        restoredExact: false,
        fellBackToAncestor: true,
        notice: `Target "${candidate.scopeId}" changed since the last analysis; restored ancestor "${crumb.label || crumb.scopeId}".`,
        state: serializeZoomNavigationState({
          ...candidate,
          runId: context.currentRunId ?? candidate.runId,
          level: crumb.level,
          scopeId: crumb.scopeId,
          focusId: crumb.focusId ?? null,
          viewport: crumb.viewport,
          breadcrumbPath: slicedCrumbs,
        }),
      };
    }
  }

  return fallbackRoot;
}
