/**
 * Host editor and file-system watcher subscriptions for incremental indexing
 * (Phase 9 §4, P9-01, P9-04).
 *
 * Bridges VS Code workspace/editor events into normalized Phase 9 change
 * events for `createIncrementalCoordinator`. Never runs or registers file
 * watchers in Restricted Mode (`trusted === false`).
 */

import path from 'node:path';
import { CHANGE_KINDS } from '../../core/indexing/incremental/events.js';
import { EXECUTION_PRIORITIES } from '../../core/indexing/incremental/priorityQueue.js';

/**
 * Convert an absolute file path into a workspace-relative POSIX path, or return
 * `null` if the path lies outside `workspaceRoot`.
 *
 * @param {string} workspaceRoot
 * @param {string} absolutePath
 * @returns {string|null}
 */
export function toWorkspaceRelativePath(workspaceRoot, absolutePath) {
  if (!workspaceRoot || !absolutePath) {
    return null;
  }
  const root = path.resolve(workspaceRoot);
  const target = path.resolve(absolutePath);
  const rel = path.relative(root, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) {
    return null;
  }
  return rel.replace(/\\/g, '/');
}

/**
 * Attach editor, save, file-creation/deletion/rename, and configuration
 * listeners to a Phase 9 `coordinator`.
 *
 * Accepts an injectable `hostEvents` surface so all subscription wiring can be
 * unit-tested without a live VS Code Electron instance.
 *
 * @param {{
 *   workspaceRoot: () => string|null,
 *   isTrusted: () => boolean,
 *   coordinator: ReturnType<typeof import('../../core/indexing/incremental/coordinator.js').createIncrementalCoordinator>,
 *   hostEvents: {
 *     onDidChangeTextDocument?: (cb: (event: any) => void) => {dispose: () => void},
 *     onDidSaveTextDocument?: (cb: (doc: any) => void) => {dispose: () => void},
 *     onDidCloseTextDocument?: (cb: (doc: any) => void) => {dispose: () => void},
 *     onDidCreateFiles?: (cb: (event: any) => void) => {dispose: () => void},
 *     onDidDeleteFiles?: (cb: (event: any) => void) => {dispose: () => void},
 *     onDidRenameFiles?: (cb: (event: any) => void) => {dispose: () => void},
 *     onDidChangeConfiguration?: (cb: (event: any) => void) => {dispose: () => void},
 *   },
 * }} options
 */
export function registerIncrementalWatchers({ workspaceRoot, isTrusted, coordinator, hostEvents }) {
  /** @type {Array<{dispose: () => void}>} */
  const subscriptions = [];

  if (typeof hostEvents.onDidChangeTextDocument === 'function') {
    subscriptions.push(
      hostEvents.onDidChangeTextDocument((event) => {
        if (!isTrusted()) {
          return;
        }
        const doc = event?.document;
        if (!doc || doc.uri?.scheme !== 'file') {
          return;
        }
        const rel = toWorkspaceRelativePath(workspaceRoot() ?? '', doc.uri.fsPath);
        if (!rel || rel.startsWith('.codeflow/')) {
          return;
        }
        coordinator.ingest({
          kind: CHANGE_KINDS.EDITOR_DIRTY,
          path: rel,
          text: typeof doc.getText === 'function' ? doc.getText() : undefined,
          dirty: true,
          priority: EXECUTION_PRIORITIES.P0_ACTIVE,
        });
      }),
    );
  }

  if (typeof hostEvents.onDidSaveTextDocument === 'function') {
    subscriptions.push(
      hostEvents.onDidSaveTextDocument((doc) => {
        if (!isTrusted() || !doc || doc.uri?.scheme !== 'file') {
          return;
        }
        const rel = toWorkspaceRelativePath(workspaceRoot() ?? '', doc.uri.fsPath);
        if (!rel) {
          return;
        }
        if (rel === '.codeflow/config.json') {
          void coordinator.processSingleFileNow({
            kind: CHANGE_KINDS.CONFIG_CHANGE,
            path: rel,
          });
          return;
        }
        if (rel.endsWith('compile_commands.json')) {
          void coordinator.processSingleFileNow({
            kind: CHANGE_KINDS.COMPILE_DB_CHANGE,
            path: rel,
          });
          return;
        }
        void coordinator.processSingleFileNow({
          kind: CHANGE_KINDS.EDITOR_SAVE,
          path: rel,
          text: typeof doc.getText === 'function' ? doc.getText() : undefined,
          dirty: false,
          priority: EXECUTION_PRIORITIES.P0_ACTIVE,
        });
      }),
    );
  }

  if (typeof hostEvents.onDidCloseTextDocument === 'function') {
    subscriptions.push(
      hostEvents.onDidCloseTextDocument((doc) => {
        if (!isTrusted() || !doc || doc.uri?.scheme !== 'file') {
          return;
        }
        const rel = toWorkspaceRelativePath(workspaceRoot() ?? '', doc.uri.fsPath);
        if (!rel) {
          return;
        }
        if (doc.isDirty === false) {
          void coordinator.processSingleFileNow({
            kind: CHANGE_KINDS.EDITOR_REVERT,
            path: rel,
          });
        }
      }),
    );
  }

  if (typeof hostEvents.onDidCreateFiles === 'function') {
    subscriptions.push(
      hostEvents.onDidCreateFiles((event) => {
        if (!isTrusted()) {
          return;
        }
        for (const uri of event?.files ?? []) {
          const rel = toWorkspaceRelativePath(workspaceRoot() ?? '', uri.fsPath);
          if (rel && !rel.startsWith('.codeflow/')) {
            coordinator.ingest({
              kind: CHANGE_KINDS.FILE_CREATE,
              path: rel,
              priority: EXECUTION_PRIORITIES.P2_RECENT,
            });
          }
        }
      }),
    );
  }

  if (typeof hostEvents.onDidDeleteFiles === 'function') {
    subscriptions.push(
      hostEvents.onDidDeleteFiles((event) => {
        if (!isTrusted()) {
          return;
        }
        for (const uri of event?.files ?? []) {
          const rel = toWorkspaceRelativePath(workspaceRoot() ?? '', uri.fsPath);
          if (rel && !rel.startsWith('.codeflow/')) {
            void coordinator.processSingleFileNow({
              kind: CHANGE_KINDS.FILE_DELETE,
              path: rel,
              priority: EXECUTION_PRIORITIES.P2_RECENT,
            });
          }
        }
      }),
    );
  }

  if (typeof hostEvents.onDidRenameFiles === 'function') {
    subscriptions.push(
      hostEvents.onDidRenameFiles((event) => {
        if (!isTrusted()) {
          return;
        }
        for (const entry of event?.files ?? []) {
          const fromRel = toWorkspaceRelativePath(workspaceRoot() ?? '', entry.oldUri?.fsPath);
          const toRel = toWorkspaceRelativePath(workspaceRoot() ?? '', entry.newUri?.fsPath);
          if (fromRel && toRel) {
            void coordinator.processSingleFileNow({
              kind: CHANGE_KINDS.FILE_RENAME,
              fromPath: fromRel,
              toPath: toRel,
              priority: EXECUTION_PRIORITIES.P2_RECENT,
            });
          }
        }
      }),
    );
  }

  if (typeof hostEvents.onDidChangeConfiguration === 'function') {
    subscriptions.push(
      hostEvents.onDidChangeConfiguration((event) => {
        if (!isTrusted()) {
          return;
        }
        if (
          typeof event?.affectsConfiguration === 'function' &&
          event.affectsConfiguration('codeflow.index')
        ) {
          void coordinator.processSingleFileNow({
            kind: CHANGE_KINDS.CONFIG_CHANGE,
          });
        }
      }),
    );
  }

  return {
    dispose() {
      while (subscriptions.length > 0) {
        const sub = subscriptions.pop();
        sub?.dispose?.();
      }
    },
  };
}
