/**
 * Host workspace index service (Phase 8 §9, §10, §11).
 *
 * Lazily manages the `.codeflow/` store, indexing pipeline, status bar item,
 * non-modal first-open workflow, `.gitignore` consent check, and the 7 Phase 8
 * user commands.
 *
 * Activation invariant: instantiating `createWorkspaceIndexService` performs
 * ZERO file system reads or writes and spawns no processes.
 */

import * as vscode from 'vscode';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createIndexStore } from '../../storage/indexStore.js';
import { createIndexingPipeline } from './pipeline.js';
import { checkGitignoreStatus, addCodeflowToGitignore } from './gitignore.js';
import { registerIncrementalWatchers } from './watchers.js';
import {
  DEFAULT_INDEX_CONFIG,
  decideFirstOpenAction,
  formatIndexStatusBar,
  FIRST_OPEN_ACTIONS,
  createIncrementalCoordinator,
} from '../../core/indexing/index.js';

const DONT_ASK_KEY = 'codeflow.index.dontAskAgain';
const GITIGNORE_ASKED_KEY = 'codeflow.index.gitignoreAsked';

/**
 * @param {{
 *   context: vscode.ExtensionContext,
 *   logger: {info: Function, warn: Function, error: Function, debug: Function, show?: Function},
 *   analysis: {analyze: (input: Record<string, any>) => Promise<any>},
 *   extensionVersion: string,
 * }} options
 */
export function createWorkspaceIndexService({ context, logger, analysis, extensionVersion }) {
  /** @type {ReturnType<typeof createIndexStore>|null} */
  let store = null;
  /** @type {ReturnType<typeof createIndexingPipeline>|null} */
  let pipeline = null;
  /** @type {ReturnType<typeof createIncrementalCoordinator>|null} */
  let coordinator = null;
  /** @type {{dispose: () => void}|null} */
  let watcherSubscription = null;
  /** @type {{isCancelled: boolean}|null} */
  let activeToken = null;
  /** @type {vscode.StatusBarItem|null} */
  let statusBarItem = null;

  function workspaceRoot() {
    return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? null;
  }

  function ensureStatusBar() {
    if (!statusBarItem && typeof vscode.window?.createStatusBarItem === 'function') {
      statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 50);
      context.subscriptions.push(statusBarItem);
    }
    return statusBarItem;
  }

  function updateStatusBar(progressOverride = {}) {
    const item = ensureStatusBar();
    if (!item) {
      return;
    }
    const stats = store ? store.stats() : { state: 'unindexed', fileCount: 0, staleFileCount: 0 };
    const formatted = formatIndexStatusBar({
      trusted: vscode.workspace.isTrusted,
      state: progressOverride.state ?? stats.state,
      fileCount: stats.fileCount,
      indexedFiles: progressOverride.indexedFiles,
      totalFiles: progressOverride.totalFiles,
      staleFileCount: stats.staleFileCount,
      readOnly: store?.isReadOnly() ?? false,
    });
    item.text = formatted.text;
    item.tooltip = formatted.tooltip;
    item.command = formatted.command;
    item.show();
  }

  /**
   * Walk the workspace directory without following symlinks outside the root.
   *
   * @param {string} rootDir
   * @returns {Promise<Array<{path: string, sizeBytes: number}>>}
   */
  async function walkWorkspaceFiles(rootDir) {
    /** @type {Array<{path: string, sizeBytes: number}>} */
    const results = [];

    /** @param {string} currentRel */
    async function walk(currentRel) {
      const absDir = currentRel ? path.join(rootDir, currentRel) : rootDir;
      let entries;
      try {
        entries = await fs.readdir(absDir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === '.codeflow' || entry.name === 'node_modules') {
          continue;
        }
        const rel = currentRel ? `${currentRel}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await walk(rel);
        } else if (entry.isFile()) {
          try {
            const stat = await fs.stat(path.join(rootDir, rel));
            results.push({ path: rel, sizeBytes: stat.size });
          } catch {
            // Skip unreadable file.
          }
        }
      }
    }

    await walk('');
    return results;
  }

  function ensureStore() {
    const root = workspaceRoot();
    if (!root || !vscode.workspace.isTrusted) {
      return null;
    }
    if (!store) {
      store = createIndexStore({
        workspaceRoot: root,
        createdBy: `codeflow@${extensionVersion}`,
      });
      pipeline = createIndexingPipeline({
        store,
        listWorkspaceFiles: () => walkWorkspaceFiles(root),
        readWorkspaceFile: (relPath) => fs.readFile(path.join(root, relPath), 'utf8'),
        readGitignore: async () => {
          try {
            return await fs.readFile(path.join(root, '.gitignore'), 'utf8');
          } catch {
            return null;
          }
        },
        analyzeFile: ({ path: relPath, source, runId }) =>
          analysis.analyze({
            path: path.join(root, relPath),
            source,
            runId,
            workspaceRoot: root,
            trusted: vscode.workspace.isTrusted,
          }),
        logger,
      });
      const config = vscode.workspace.getConfiguration('codeflow');
      const debounceMs = config.get('index.debounceMs', 350);
      const autoUpdate = config.get('index.autoUpdate', true);
      const maxFileBytes = config.get('index.maxFileBytes', DEFAULT_INDEX_CONFIG.maxFileBytes);
      store.open();
      if (Number.isFinite(maxFileBytes) && maxFileBytes >= 65536) {
        try {
          store.updateConfig({ maxFileBytes });
        } catch {
          // Optional config update if store supports it
        }
      }
      coordinator = createIncrementalCoordinator({
        store,
        listWorkspaceFiles: () => walkWorkspaceFiles(root),
        readWorkspaceFile: (relPath) => fs.readFile(path.join(root, relPath), 'utf8'),
        analyzeFile: ({ path: relPath, source, runId }) =>
          analysis.analyze({
            path: path.join(root, relPath),
            source,
            runId,
            workspaceRoot: root,
            trusted: vscode.workspace.isTrusted,
          }),
        debounceMs,
      });
      if (autoUpdate) {
        watcherSubscription = registerIncrementalWatchers({
          workspaceRoot: () => workspaceRoot(),
          isTrusted: () => Boolean(vscode.workspace.isTrusted),
          coordinator,
          hostEvents: {
            onDidChangeTextDocument: vscode.workspace.onDidChangeTextDocument,
            onDidSaveTextDocument: vscode.workspace.onDidSaveTextDocument,
            onDidCloseTextDocument: vscode.workspace.onDidCloseTextDocument,
            onDidCreateFiles: vscode.workspace.onDidCreateFiles,
            onDidDeleteFiles: vscode.workspace.onDidDeleteFiles,
            onDidRenameFiles: vscode.workspace.onDidRenameFiles,
            onDidChangeConfiguration: vscode.workspace.onDidChangeConfiguration,
          },
        });
      }
    }
    return store;
  }

  async function maybeOfferGitignore(root) {
    const alreadyAsked = context.workspaceState?.get(GITIGNORE_ASKED_KEY, false);
    if (alreadyAsked) {
      return;
    }
    const status = checkGitignoreStatus(root);
    if (!status.hasGitignore || status.coversCodeflow) {
      return;
    }
    await context.workspaceState?.update(GITIGNORE_ASKED_KEY, true);
    const choice = await vscode.window.showInformationMessage(
      'CodeFlow created a local .codeflow/ index directory. Add .codeflow/ to .gitignore?',
      'Add to .gitignore',
      'No thanks',
    );
    if (choice === 'Add to .gitignore') {
      addCodeflowToGitignore(root, { consent: true });
    }
  }

  async function indexWorkspace({ rebuild = false } = {}) {
    if (!vscode.workspace.isTrusted) {
      void vscode.window.showWarningMessage(
        'CodeFlow: Workspace indexing is disabled in Restricted Mode.',
      );
      return { ok: false, code: 'E_UNTRUSTED', message: 'Workspace is untrusted.' };
    }
    const root = workspaceRoot();
    if (!root) {
      void vscode.window.showWarningMessage('CodeFlow: Open a workspace folder before indexing.');
      return { ok: false, code: 'E_NO_WORKSPACE', message: 'No workspace folder is open.' };
    }
    if (activeToken) {
      void vscode.window.showInformationMessage('CodeFlow: Indexing is already running.');
      return { ok: false, code: 'E_BUSY', message: 'Indexing is already running.' };
    }

    ensureStore();
    const token = { isCancelled: false };
    activeToken = token;
    updateStatusBar({ state: 'indexing', indexedFiles: 0, totalFiles: 0 });

    try {
      const result = await pipeline.runIndexing({
        rebuild,
        token,
        onProgress: (progress) => {
          updateStatusBar(progress);
        },
      });
      updateStatusBar();
      if (result.ok && !result.cancelled) {
        await maybeOfferGitignore(root);
      } else if (!result.ok) {
        void vscode.window.showWarningMessage(`CodeFlow: ${result.message}`);
      }
      return result;
    } finally {
      activeToken = null;
      updateStatusBar();
    }
  }

  function cancelIndexing() {
    if (!activeToken) {
      void vscode.window.showInformationMessage('CodeFlow: No indexing run is currently active.');
      return { ok: false, code: 'E_NOT_RUNNING', message: 'No indexing run is active.' };
    }
    activeToken.isCancelled = true;
    logger.info('index.cancel_requested');
    return { ok: true };
  }

  async function rebuildIndex() {
    return indexWorkspace({ rebuild: true });
  }

  async function repairIndex() {
    const activeStore = ensureStore();
    if (!activeStore) {
      void vscode.window.showWarningMessage(
        'CodeFlow: Open a trusted workspace folder before repairing the index.',
      );
      return { ok: false, code: 'E_NO_WORKSPACE', message: 'No trusted workspace is open.' };
    }
    activeStore.open();
    const repaired = activeStore.repair();
    updateStatusBar();
    if (!repaired.ok && repaired.rebuildRequired) {
      const choice = await vscode.window.showWarningMessage(
        'CodeFlow: The project index cannot be repaired in place and requires a full rebuild.',
        'Rebuild index',
        'Cancel',
      );
      if (choice === 'Rebuild index') {
        return rebuildIndex();
      }
      return repaired;
    }
    void vscode.window.showInformationMessage(
      repaired.repaired
        ? `CodeFlow: Index repaired (pruned ${repaired.prunedCount} orphaned records).`
        : 'CodeFlow: Project index passed integrity verification.',
    );
    return repaired;
  }

  async function clearIndex() {
    const activeStore = ensureStore();
    if (!activeStore) {
      return { ok: true };
    }
    if (activeToken) {
      activeToken.isCancelled = true;
      activeToken = null;
    }
    const cleared = activeStore.clear();
    updateStatusBar();
    if (cleared.ok) {
      void vscode.window.showInformationMessage('CodeFlow: Cleared .codeflow/ project index.');
    } else {
      void vscode.window.showWarningMessage(`CodeFlow: ${cleared.message}`);
    }
    return cleared;
  }

  async function openIndexConfiguration() {
    const activeStore = ensureStore();
    if (!activeStore) {
      void vscode.window.showWarningMessage(
        'CodeFlow: Open a trusted workspace folder before configuring the index.',
      );
      return { ok: false, code: 'E_NO_WORKSPACE', message: 'No trusted workspace is open.' };
    }
    const configPath = activeStore.paths.configPath;
    try {
      await fs.mkdir(path.dirname(configPath), { recursive: true });
      try {
        await fs.access(configPath);
      } catch {
        await fs.writeFile(configPath, JSON.stringify(DEFAULT_INDEX_CONFIG, null, 2), 'utf8');
      }
      const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(configPath));
      await vscode.window.showTextDocument(doc, { preview: false });
      return { ok: true, path: configPath };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      void vscode.window.showWarningMessage(`CodeFlow: Could not open config.json (${message}).`);
      return { ok: false, code: 'E_IO', message };
    }
  }

  async function showIndexStatus() {
    const activeStore = ensureStore();
    if (!activeStore) {
      void vscode.window.showInformationMessage(
        vscode.workspace.isTrusted
          ? 'CodeFlow: No workspace folder is open.'
          : 'CodeFlow: Project indexing is disabled in Restricted Mode.',
      );
      return { ok: true, state: 'unindexed' };
    }
    activeStore.open();
    const stats = activeStore.stats();
    const health = activeStore.health();
    const summary = `CodeFlow Index: ${stats.state} (${stats.fileCount} files, ${stats.symbolCount} symbols, ${stats.relationshipCount} relationships, integrity: ${health.integrity})`;
    const actions =
      stats.state === 'indexing'
        ? ['Cancel Indexing', 'Configure Exclusions']
        : stats.state === 'unindexed'
          ? ['Index Workspace', 'Configure Exclusions']
          : [
              'Re-index Workspace',
              'Rebuild Index',
              'Repair Index',
              'Clear Index',
              'Configure Exclusions',
            ];

    const choice = await vscode.window.showInformationMessage(summary, ...actions);
    if (choice === 'Index Workspace' || choice === 'Re-index Workspace') {
      return indexWorkspace({ rebuild: false });
    }
    if (choice === 'Cancel Indexing') {
      return cancelIndexing();
    }
    if (choice === 'Rebuild Index') {
      return rebuildIndex();
    }
    if (choice === 'Repair Index') {
      return repairIndex();
    }
    if (choice === 'Clear Index') {
      return clearIndex();
    }
    if (choice === 'Configure Exclusions') {
      return openIndexConfiguration();
    }
    return { ok: true, stats, health };
  }

  let promptEvaluatedThisSession = false;

  /**
   * Evaluate the first-open workflow lazily when requested. Never touches disk
   * in Restricted Mode.
   */
  async function evaluateFirstOpen() {
    if (promptEvaluatedThisSession) {
      return { action: FIRST_OPEN_ACTIONS.NONE };
    }
    promptEvaluatedThisSession = true;
    if (!vscode.workspace.isTrusted) {
      return decideFirstOpenAction({ trusted: false });
    }
    if (vscode.workspace.getConfiguration('codeflow').get('index.promptOnOpen', true) === false) {
      return { action: FIRST_OPEN_ACTIONS.NONE };
    }
    const root = workspaceRoot();
    if (!root) {
      return decideFirstOpenAction({ trusted: true, hasSupportedFiles: false });
    }
    const activeStore = ensureStore();
    const opened = activeStore.open();
    updateStatusBar();
    const candidates = await walkWorkspaceFiles(root);
    const hasSupportedFiles = candidates.some((c) =>
      /\.(cpp|cc|cxx|hpp|hh|hxx|h|js|mjs|cjs)$/i.test(c.path),
    );
    const decision = decideFirstOpenAction({
      trusted: true,
      hasSupportedFiles,
      indexExists: opened.exists,
      state: opened.state,
      health: {
        ok: opened.ok,
        rebuildRequired: opened.rebuildRequired,
      },
      lockStatus: opened.lockStatus,
      dismissedInWorkspace: Boolean(context.workspaceState?.get(DONT_ASK_KEY, false)),
    });

    if (decision.action === FIRST_OPEN_ACTIONS.OFFER_INDEX && decision.message) {
      const picked = await vscode.window.showInformationMessage(
        decision.message,
        ...(decision.choices ?? []),
      );
      if (picked === 'Index') {
        await indexWorkspace({ rebuild: false });
      } else if (picked === 'Choose exclusions') {
        await openIndexConfiguration();
      } else if (picked === "Don't ask again") {
        await context.workspaceState?.update(DONT_ASK_KEY, true);
      }
    } else if (decision.action === FIRST_OPEN_ACTIONS.PROMPT_REBUILD && decision.message) {
      const picked = await vscode.window.showWarningMessage(
        decision.message,
        ...(decision.choices ?? []),
      );
      if (picked === 'Rebuild index') {
        await rebuildIndex();
      }
    } else if (decision.action === FIRST_OPEN_ACTIONS.PROMPT_RECOVER && decision.message) {
      const picked = await vscode.window.showInformationMessage(
        decision.message,
        ...(decision.choices ?? []),
      );
      if (picked === 'Resume indexing') {
        await indexWorkspace({ rebuild: false });
      } else if (picked === 'Rebuild index') {
        await rebuildIndex();
      }
    }

    return decision;
  }

  /**
   * Query provider compatible with Phase 7 `createIndexEvidenceSource` and
   * `panelWire.js`. Returns empty results when unindexed so single-file
   * analysis continues without error (AC-8.1).
   */
  const indexProvider = {
    get scope() {
      if (!store) {
        return 'partial';
      }
      const stats = store.stats();
      return stats.state === 'complete' && stats.scope === 'complete' ? 'complete' : 'partial';
    },
    isIndexed() {
      if (!store) {
        return false;
      }
      const state = store.stats().state;
      return state === 'complete' || state === 'partial';
    },
    callsByFrom(symbolId) {
      return store ? store.callsByFrom(symbolId) : [];
    },
    callsByTo(symbolId) {
      return store ? store.callsByTo(symbolId) : [];
    },
    symbolById(symbolId) {
      return store ? store.symbolById(symbolId) : null;
    },
    batchNeighbors(symbolIds) {
      return store ? store.batchNeighbors(symbolIds) : { symbols: [], relationships: [] };
    },
    allSymbols() {
      return store ? store.allSymbols() : [];
    },
    allRelationships() {
      return store ? store.allRelationships() : [];
    },
    symbolsByName(prefix, filter) {
      return store
        ? store.symbolsByName(prefix, filter)
        : { ok: true, items: [], total: 0, scope: 'partial' };
    },
    symbolsInFile(fileId) {
      return store
        ? store.symbolsInFile(fileId)
        : { ok: true, items: [], total: 0, scope: 'partial' };
    },
    neighbors(symbolId, filter) {
      return store
        ? store.neighbors(symbolId, filter)
        : { ok: true, items: [], total: 0, scope: 'partial' };
    },
    fileDependencies(fileId, direction) {
      return store
        ? store.fileDependencies(fileId, direction)
        : { ok: true, items: [], total: 0, scope: 'partial' };
    },
    filesUnder(prefix) {
      return store ? store.filesUnder(prefix) : { ok: true, items: [], total: 0, scope: 'partial' };
    },
    stats() {
      return store
        ? store.stats()
        : {
            state: 'unindexed',
            schemaVersion: 1,
            lastRunId: '',
            fileCount: 0,
            symbolCount: 0,
            relationshipCount: 0,
            dependencyCount: 0,
            staleFileCount: 0,
            indexedAt: null,
            byteSize: 0,
            scope: 'partial',
          };
    },
    health() {
      return store
        ? store.health()
        : {
            ok: true,
            integrity: 'ok',
            schemaVersion: 1,
            state: 'unindexed',
            staleFileCount: 0,
            staleFileIds: [],
            scope: 'partial',
            issues: [],
          };
    },
    telemetry() {
      return coordinator ? coordinator.telemetry.snapshot() : null;
    },
  };

  function dispose() {
    if (activeToken) {
      activeToken.isCancelled = true;
      activeToken = null;
    }
    watcherSubscription?.dispose();
    watcherSubscription = null;
    coordinator?.dispose();
    coordinator = null;
    store?.close();
    statusBarItem?.dispose();
  }

  async function showIndexOptions() {
    const stats = store ? store.stats() : { state: 'unindexed', fileCount: 0, symbolCount: 0 };
    const picked = await vscode.window.showQuickPick(
      [
        {
          id: 'index',
          label: '$(sync) Index / Update Repository',
          description: `Current state: ${stats.state} (${stats.fileCount} files, ${stats.symbolCount} symbols)`,
        },
        {
          id: 'rebuild',
          label: '$(refresh) Rebuild Repository Index',
          description: 'Discard cached .codeflow/ index and re-analyze all workspace files',
        },
        {
          id: 'repair',
          label: '$(wrench) Repair Index Integrity',
          description: 'Prune orphaned records and verify stored CSR shards',
        },
        {
          id: 'exclusions',
          label: '$(exclude) Configure Index Exclusions (.codeflow/config.json)',
          description: 'Edit excludeGlobs, file limits, and .gitignore handling',
        },
        {
          id: 'settings',
          label: '$(gear) Open Indexing Settings',
          description: 'Configure auto-update, promptOnOpen, debounce, and file size caps',
        },
        {
          id: 'clear',
          label: '$(trash) Clear Index',
          description: 'Remove local .codeflow/ index data',
        },
      ],
      {
        title: 'CodeFlow: Repository Indexing Options',
        placeHolder: 'Choose an indexing action or configuration option',
      },
    );
    if (!picked) {
      return { ok: false, cancelled: true };
    }
    if (picked.id === 'index') return indexWorkspace({ rebuild: false });
    if (picked.id === 'rebuild') return rebuildIndex();
    if (picked.id === 'repair') return repairIndex();
    if (picked.id === 'exclusions') return openIndexConfiguration();
    if (picked.id === 'settings') {
      await vscode.commands.executeCommand('workbench.action.openSettings', 'codeflow.index');
      return { ok: true };
    }
    if (picked.id === 'clear') return clearIndex();
    return { ok: true };
  }

  return {
    indexWorkspace,
    cancelIndexing,
    rebuildIndex,
    repairIndex,
    showIndexStatus,
    showIndexOptions,
    clearIndex,
    openIndexConfiguration,
    evaluateFirstOpen,
    indexProvider,
    dispose,
  };
}
