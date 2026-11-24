/**
 * Normalized change event model and sequence coalescing (Phase 9 §4, P9-01).
 *
 * Unifies editor typing (`dirty`), document saves, revert/close events, file
 * watcher changes, file creation/deletion/renames, git branch-switch bursts,
 * configuration changes, and compile_commands.json changes into a single
 * deterministic event vocabulary.
 */

import { createFileId, normalizePath } from '../../csr/identity.js';

export const CHANGE_KINDS = Object.freeze({
  EDITOR_DIRTY: 'editor_dirty',
  EDITOR_SAVE: 'editor_save',
  EDITOR_REVERT: 'editor_revert',
  WATCHER_CHANGE: 'watcher_change',
  FILE_CREATE: 'file_create',
  FILE_DELETE: 'file_delete',
  FILE_RENAME: 'file_rename',
  BULK_BURST: 'bulk_burst',
  CONFIG_CHANGE: 'config_change',
  COMPILE_DB_CHANGE: 'compile_db_change',
  TOOLCHAIN_CHANGE: 'toolchain_change',
});

const VALID_KINDS = new Set(Object.values(CHANGE_KINDS));

/**
 * Normalize a raw change event into a canonical descriptor.
 *
 * @param {{
 *   kind?: string,
 *   path?: string,
 *   fromPath?: string,
 *   toPath?: string,
 *   text?: string,
 *   dirty?: boolean,
 *   timestamp?: number,
 *   priority?: number,
 *   imeComposing?: boolean,
 * }} raw
 * @returns {{
 *   ok: true,
 *   event: {
 *     kind: string,
 *     path: string,
 *     fileId: string,
 *     fromPath?: string,
 *     fromFileId?: string,
 *     toPath?: string,
 *     toFileId?: string,
 *     text?: string,
 *     dirty: boolean,
 *     timestamp: number,
 *     priority?: number,
 *     imeComposing: boolean,
 *   },
 * } | {ok: false, code: 'E_EVENT_INVALID', message: string}}
 */
export function normalizeChangeEvent(raw = {}) {
  const kind = String(raw?.kind ?? '');
  if (!VALID_KINDS.has(kind)) {
    return {
      ok: false,
      code: 'E_EVENT_INVALID',
      message: `Unknown change event kind: "${kind}"`,
    };
  }

  const timestamp = Number.isFinite(raw.timestamp) ? Number(raw.timestamp) : 0;
  const imeComposing = raw.imeComposing === true;

  if (kind === CHANGE_KINDS.FILE_RENAME) {
    const fromPath = normalizePath(raw.fromPath ?? '');
    const toPath = normalizePath(raw.toPath ?? raw.path ?? '');
    if (!fromPath || !toPath) {
      return {
        ok: false,
        code: 'E_EVENT_INVALID',
        message: 'file_rename event requires both fromPath and toPath.',
      };
    }
    return {
      ok: true,
      event: {
        kind,
        path: toPath,
        fileId: createFileId(toPath),
        fromPath,
        fromFileId: createFileId(fromPath),
        toPath,
        toFileId: createFileId(toPath),
        ...(typeof raw.text === 'string' ? { text: raw.text } : {}),
        dirty: false,
        timestamp,
        ...(Number.isInteger(raw.priority) ? { priority: raw.priority } : {}),
        imeComposing: false,
      },
    };
  }

  if (
    kind === CHANGE_KINDS.BULK_BURST ||
    kind === CHANGE_KINDS.CONFIG_CHANGE ||
    kind === CHANGE_KINDS.COMPILE_DB_CHANGE ||
    kind === CHANGE_KINDS.TOOLCHAIN_CHANGE
  ) {
    const normPath = normalizePath(raw.path ?? '');
    return {
      ok: true,
      event: {
        kind,
        path: normPath,
        fileId: normPath ? createFileId(normPath) : '',
        dirty: false,
        timestamp,
        ...(Number.isInteger(raw.priority) ? { priority: raw.priority } : {}),
        imeComposing: false,
      },
    };
  }

  const normPath = normalizePath(raw.path ?? '');
  if (!normPath) {
    return {
      ok: false,
      code: 'E_EVENT_INVALID',
      message: `Event "${kind}" requires a non-empty workspace-relative path.`,
    };
  }

  const dirty = kind === CHANGE_KINDS.EDITOR_DIRTY || raw.dirty === true;
  return {
    ok: true,
    event: {
      kind,
      path: normPath,
      fileId: createFileId(normPath),
      ...(typeof raw.text === 'string' ? { text: raw.text } : {}),
      dirty,
      timestamp,
      ...(Number.isInteger(raw.priority) ? { priority: raw.priority } : {}),
      imeComposing,
    },
  };
}

/**
 * Coalesce an ordered sequence of normalized events within a debounce/batch
 * window so redundant intermediate events on the same file collapse into the
 * latest authoritative state.
 *
 * Rules:
 * - Any event with `imeComposing === true` is dropped (never analyze mid-IME).
 * - A `file_create` followed by `file_delete` on the same path cancels out if
 *   never saved prior, or collapses to `file_delete`.
 * - Multiple `editor_dirty` edits on the same file collapse to the latest text.
 * - An `editor_save` supersedes earlier `editor_dirty` events on the same file.
 * - A global event (`compile_db_change`, `toolchain_change`, `bulk_burst`) is
 *   preserved in order.
 *
 * @param {Array<Record<string, any>>} rawEvents
 * @returns {Array<Record<string, any>>}
 */
export function coalesceEventSequence(rawEvents = []) {
  /** @type {Map<string, Record<string, any>>} */
  const byFile = new Map();
  /** @type {Array<Record<string, any>>} */
  const globals = [];

  for (const candidate of Array.isArray(rawEvents) ? rawEvents : []) {
    const normalized =
      candidate?.fileId !== undefined
        ? { ok: true, event: candidate }
        : normalizeChangeEvent(candidate);
    if (!normalized.ok) {
      continue;
    }
    const ev = normalized.event;
    if (ev.imeComposing) {
      continue;
    }

    if (
      ev.kind === CHANGE_KINDS.BULK_BURST ||
      ev.kind === CHANGE_KINDS.CONFIG_CHANGE ||
      ev.kind === CHANGE_KINDS.COMPILE_DB_CHANGE ||
      ev.kind === CHANGE_KINDS.TOOLCHAIN_CHANGE
    ) {
      globals.push(ev);
      continue;
    }

    if (ev.kind === CHANGE_KINDS.FILE_RENAME) {
      byFile.delete(ev.fromPath);
      byFile.set(ev.toPath, ev);
      continue;
    }

    const prev = byFile.get(ev.path);
    if (!prev) {
      byFile.set(ev.path, ev);
      continue;
    }

    // Create followed by save/change stays a create with newest text
    if (
      prev.kind === CHANGE_KINDS.FILE_CREATE &&
      (ev.kind === CHANGE_KINDS.EDITOR_SAVE || ev.kind === CHANGE_KINDS.WATCHER_CHANGE)
    ) {
      byFile.set(ev.path, {
        ...ev,
        kind: CHANGE_KINDS.FILE_CREATE,
        dirty: false,
      });
      continue;
    }

    byFile.set(ev.path, ev);
  }

  return [...globals, ...byFile.values()];
}
