/**
 * First-open indexing workflow decision matrix and status-bar formatting
 * (Phase 8 §9, §10).
 *
 * Pure and headless so all eight workspace-open cases can be unit-tested
 * without a live VS Code window.
 */

export const FIRST_OPEN_ACTIONS = Object.freeze({
  SILENT_UNTRUSTED: 'silent_untrusted',
  SILENT_NO_FILES: 'silent_no_files',
  SILENT_READY: 'silent_ready',
  SILENT_READ_ONLY: 'silent_read_only',
  SILENT_DISMISSED: 'silent_dismissed',
  OFFER_INDEX: 'offer_index',
  PROMPT_REBUILD: 'prompt_rebuild',
  PROMPT_RECOVER: 'prompt_recover',
});

export const FIRST_OPEN_CHOICES = Object.freeze([
  'Index',
  'Choose exclusions',
  'Not now',
  "Don't ask again",
]);

/**
 * Decide what the host should do when a workspace opens (Phase 8 §9).
 *
 * Rules:
 * 1. Restricted Mode (`trusted === false`): completely silent; never read files
 *    or create `.codeflow/`.
 * 2. No supported `.cpp`/`.cc`/`.cxx`/`.hpp`/`.h`/`.js`/`.mjs`/`.cjs` files:
 *    silent.
 * 3. Lock held by another live process: open existing index in read-only mode,
 *    no prompt.
 * 4. Existing corrupt or schema-incompatible index: prompt to rebuild.
 * 5. Interrupted prior run (`state === 'indexing'` or `'partial'` with stale
 *    recoverable lock): prompt to resume/rebuild.
 * 6. Existing valid index (`state === 'complete'` and `health.ok === true`):
 *    load silently and update status bar.
 * 7. User previously chose "Don't ask again" in this workspace: silent.
 * 8. Otherwise: show one non-modal notification offering
 *    `['Index', 'Choose exclusions', 'Not now', "Don't ask again"]`.
 *
 * @param {{
 *   trusted?: boolean,
 *   hasSupportedFiles?: boolean,
 *   indexExists?: boolean,
 *   state?: string,
 *   health?: {ok?: boolean, rebuildRequired?: boolean, code?: string},
 *   lockStatus?: 'free'|'owned_by_self'|'held_by_live_process'|'stale_recoverable',
 *   dismissedInWorkspace?: boolean,
 * }} context
 * @returns {{
 *   action: string,
 *   shouldTouchDisk: boolean,
 *   readOnly: boolean,
 *   message?: string,
 *   choices?: readonly string[],
 * }}
 */
export function decideFirstOpenAction(context = {}) {
  if (context.trusted !== true) {
    return {
      action: FIRST_OPEN_ACTIONS.SILENT_UNTRUSTED,
      shouldTouchDisk: false,
      readOnly: true,
    };
  }

  if (context.hasSupportedFiles !== true) {
    return {
      action: FIRST_OPEN_ACTIONS.SILENT_NO_FILES,
      shouldTouchDisk: false,
      readOnly: false,
    };
  }

  if (context.lockStatus === 'held_by_live_process' && context.indexExists) {
    return {
      action: FIRST_OPEN_ACTIONS.SILENT_READ_ONLY,
      shouldTouchDisk: false,
      readOnly: true,
    };
  }

  if (
    context.indexExists &&
    (context.state === 'corrupt' ||
      context.health?.ok === false ||
      context.health?.rebuildRequired === true)
  ) {
    return {
      action: FIRST_OPEN_ACTIONS.PROMPT_REBUILD,
      shouldTouchDisk: false,
      readOnly: false,
      message:
        'CodeFlow detected a corrupt or incompatible project index. Rebuild the index to restore project-wide graphs?',
      choices: Object.freeze(['Rebuild index', 'Not now']),
    };
  }

  if (
    context.indexExists &&
    (context.lockStatus === 'stale_recoverable' || context.state === 'indexing')
  ) {
    return {
      action: FIRST_OPEN_ACTIONS.PROMPT_RECOVER,
      shouldTouchDisk: false,
      readOnly: false,
      message:
        'A previous CodeFlow indexing run was interrupted. Resume indexing to complete project-wide analysis?',
      choices: Object.freeze(['Resume indexing', 'Rebuild index', 'Not now']),
    };
  }

  if (context.indexExists && context.state === 'complete' && context.health?.ok !== false) {
    return {
      action: FIRST_OPEN_ACTIONS.SILENT_READY,
      shouldTouchDisk: false,
      readOnly: false,
    };
  }

  if (context.dismissedInWorkspace === true) {
    return {
      action: FIRST_OPEN_ACTIONS.SILENT_DISMISSED,
      shouldTouchDisk: false,
      readOnly: false,
    };
  }

  return {
    action: FIRST_OPEN_ACTIONS.OFFER_INDEX,
    shouldTouchDisk: false,
    readOnly: false,
    message:
      'Index this workspace to enable project-wide call graphs and faster cross-file navigation?',
    choices: FIRST_OPEN_CHOICES,
  };
}

/**
 * Format the status-bar text and tooltip for the current index state
 * (Phase 8 §10).
 *
 * @param {{
 *   trusted?: boolean,
 *   state?: string,
 *   fileCount?: number,
 *   indexedFiles?: number,
 *   totalFiles?: number,
 *   staleFileCount?: number,
 *   readOnly?: boolean,
 * }} status
 * @returns {{text: string, tooltip: string, command: string}}
 */
export function formatIndexStatusBar(status = {}) {
  if (status.trusted === false) {
    return {
      text: '$(shield) CodeFlow: Restricted',
      tooltip: 'Workspace is in Restricted Mode. Indexing is disabled.',
      command: 'codeflow.showIndexStatus',
    };
  }

  const state = status.state ?? 'unindexed';
  if (state === 'indexing') {
    const done = Math.max(0, Number(status.indexedFiles ?? status.fileCount ?? 0));
    const total = Math.max(done, Number(status.totalFiles ?? done));
    return {
      text: `$(sync~spin) CodeFlow: Indexing (${done}/${total})`,
      tooltip: `Indexing workspace (${done} of ${total} files). Click to view status or cancel.`,
      command: 'codeflow.showIndexStatus',
    };
  }

  if (state === 'corrupt' || state === 'failed') {
    return {
      text: `$(warning) CodeFlow: Index ${state}`,
      tooltip: `Project index is ${state}. Click to repair or rebuild.`,
      command: 'codeflow.showIndexStatus',
    };
  }

  if (state === 'unindexed') {
    return {
      text: '$(database) CodeFlow: Unindexed',
      tooltip: 'Workspace is not indexed. Single-file analysis remains available.',
      command: 'codeflow.showIndexStatus',
    };
  }

  const files = Math.max(0, Number(status.fileCount ?? 0));
  const stale = Math.max(0, Number(status.staleFileCount ?? 0));
  const roSuffix = status.readOnly ? ' (read-only)' : '';
  const staleSuffix = stale > 0 ? `, ${stale} stale` : '';

  if (state === 'complete' && stale === 0) {
    return {
      text: `$(check) CodeFlow: Indexed (${files} files)${roSuffix}`,
      tooltip: `Project index is complete (${files} files)${roSuffix}.`,
      command: 'codeflow.showIndexStatus',
    };
  }

  return {
    text: `$(database) CodeFlow: ${state} (${files} files${staleSuffix})${roSuffix}`,
    tooltip: `Project index state: ${state} (${files} files${staleSuffix})${roSuffix}.`,
    command: 'codeflow.showIndexStatus',
  };
}
