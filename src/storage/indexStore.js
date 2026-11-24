/**
 * Swappable `.codeflow/` project index storage engine (Phase 8 §5, §6, §7, §14).
 *
 * Implements the Phase 8 storage interface with zero native addon dependencies
 * so it runs across the declared VS Code Node 20+ runtime floor without
 * native-module ABI breakage (ADR 0013).
 *
 * On-disk layout under `<workspaceRoot>/.codeflow/`:
 * - `config.json`                 — User-editable indexing configuration
 * - `index/codeflow.sqlite`       — Logical Schema v1 database store
 * - `index/codeflow.sqlite.wal`   — Atomic write-ahead journal during transactions
 * - `cache/`                      — Per-file analysis cache
 * - `graphs/`                     — Reserved for Phase 11 saved views
 * - `metadata/index.lock`         — Process writer lock
 * - `metadata/last-run.json`      — Diagnostic summary of the last indexing run
 *
 * Every path written by this module is validated to remain strictly inside
 * `<workspaceRoot>/.codeflow/`.
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  INDEX_SCHEMA_VERSION,
  SCHEMA_V1_DDL,
  createEmptyIndexSnapshot,
  validateIndexSnapshot,
} from '../core/indexing/schema.js';
import { migrateIndexSchema } from '../core/indexing/migrate.js';
import { DEFAULT_INDEX_CONFIG, normalizeIndexConfig } from '../core/indexing/config.js';
import { createLockPayload, evaluateLockState } from '../core/indexing/locks.js';
import { createIndexQuerySurface } from '../core/indexing/queries.js';
import { resolveCodeflowArtifactPath } from './paths.js';

export { resolveCodeflowArtifactPath };

const STORAGE_MAGIC = 'CODEFLOW_SQLITE_V1';

/**
 * Create a default Node `fs` adapter. Tests can pass an in-memory adapter with
 * the same synchronous methods (`existsSync`, `mkdirSync`, `readFileSync`,
 * `writeFileSync`, `renameSync`, `unlinkSync`, `rmSync`, `statSync`).
 */
export function createNodeFsAdapter() {
  return {
    existsSync: (target) => fs.existsSync(target),
    mkdirSync: (target, options) => fs.mkdirSync(target, options),
    readFileSync: (target, encoding = 'utf8') => fs.readFileSync(target, encoding),
    writeFileSync: (target, content, encoding = 'utf8') =>
      fs.writeFileSync(target, content, encoding),
    renameSync: (from, to) => fs.renameSync(from, to),
    unlinkSync: (target) => fs.unlinkSync(target),
    rmSync: (target, options) => fs.rmSync(target, options),
    statSync: (target) => fs.statSync(target),
  };
}

/**
 * Create an in-memory file system adapter for deterministic unit testing of
 * crash recovery, simulated disk-full failures, corrupt files, and multi-window
 * lock contention without touching the host disk.
 */
export function createMemoryFsAdapter() {
  /** @type {Map<string, string>} */
  const files = new Map();
  /** @type {Set<string>} */
  const dirs = new Set();
  let failNextWrite = false;

  function norm(target) {
    return path.resolve(String(target ?? '')).replace(/\\/g, '/');
  }

  return {
    files,
    dirs,
    setFailNextWrite(flag) {
      failNextWrite = Boolean(flag);
    },
    existsSync(target) {
      const key = norm(target);
      return files.has(key) || dirs.has(key);
    },
    mkdirSync(target) {
      dirs.add(norm(target));
    },
    readFileSync(target) {
      const key = norm(target);
      if (!files.has(key)) {
        const error = new Error(`ENOENT: no such file or directory, open '${target}'`);
        /** @type {any} */ (error).code = 'ENOENT';
        throw error;
      }
      return files.get(key);
    },
    writeFileSync(target, content) {
      if (failNextWrite) {
        failNextWrite = false;
        const error = new Error('ENOSPC: no space left on device');
        /** @type {any} */ (error).code = 'ENOSPC';
        throw error;
      }
      const key = norm(target);
      dirs.add(path.posix.dirname(key));
      files.set(key, String(content));
    },
    renameSync(from, to) {
      const fromKey = norm(from);
      const toKey = norm(to);
      if (!files.has(fromKey)) {
        const error = new Error(`ENOENT: no such file '${from}'`);
        /** @type {any} */ (error).code = 'ENOENT';
        throw error;
      }
      files.set(toKey, files.get(fromKey));
      files.delete(fromKey);
    },
    unlinkSync(target) {
      files.delete(norm(target));
    },
    rmSync(target) {
      const prefix = norm(target);
      files.delete(prefix);
      dirs.delete(prefix);
      for (const key of [...files.keys()]) {
        if (key.startsWith(`${prefix}/`)) {
          files.delete(key);
        }
      }
      for (const dir of [...dirs.values()]) {
        if (dir.startsWith(`${prefix}/`)) {
          dirs.delete(dir);
        }
      }
    },
    statSync(target) {
      const key = norm(target);
      const content = files.get(key) ?? '';
      return {
        size: Buffer.byteLength(content, 'utf8'),
      };
    },
  };
}

/**
 * Create a project index store bound to `<workspaceRoot>/.codeflow/`.
 *
 * @param {{
 *   workspaceRoot: string,
 *   fsAdapter?: ReturnType<typeof createNodeFsAdapter>,
 *   clock?: () => number,
 *   pid?: number,
 *   hostname?: string,
 *   createdBy?: string,
 *   isProcessAlive?: (pid: number) => boolean,
 *   getDiskHashes?: () => Record<string, string>,
 * }} options
 */
export function createIndexStore({
  workspaceRoot,
  fsAdapter = createNodeFsAdapter(),
  clock = () => Date.now(),
  pid = process.pid,
  hostname = os.hostname(),
  createdBy = 'codeflow@0.0.1',
  isProcessAlive,
  getDiskHashes,
}) {
  const rootCheck = resolveCodeflowArtifactPath(workspaceRoot, '.');
  if (!rootCheck.ok) {
    throw new Error(rootCheck.message);
  }
  const codeflowDir = rootCheck.resolved;
  const configPath = resolveCodeflowArtifactPath(workspaceRoot, 'config.json').resolved;
  const indexDir = resolveCodeflowArtifactPath(workspaceRoot, 'index').resolved;
  const dbPath = resolveCodeflowArtifactPath(workspaceRoot, 'index/codeflow.sqlite').resolved;
  const walPath = resolveCodeflowArtifactPath(workspaceRoot, 'index/codeflow.sqlite.wal').resolved;
  const cacheDir = resolveCodeflowArtifactPath(workspaceRoot, 'cache').resolved;
  const graphsDir = resolveCodeflowArtifactPath(workspaceRoot, 'graphs').resolved;
  const metadataDir = resolveCodeflowArtifactPath(workspaceRoot, 'metadata').resolved;
  const lockPath = resolveCodeflowArtifactPath(workspaceRoot, 'metadata/index.lock').resolved;
  const lastRunPath = resolveCodeflowArtifactPath(workspaceRoot, 'metadata/last-run.json').resolved;

  let snapshot = createEmptyIndexSnapshot({
    createdBy,
    now: clock(),
    state: 'unindexed',
  });
  let config = { ...DEFAULT_INDEX_CONFIG };
  /** @type {Array<{code: string, message: string, field?: string, value?: string}>} */
  let diagnostics = [];
  let readOnly = false;
  let lockOwned = false;
  let opened = false;

  function ensureDirectories() {
    for (const dir of [codeflowDir, indexDir, cacheDir, graphsDir, metadataDir]) {
      if (!fsAdapter.existsSync(dir)) {
        fsAdapter.mkdirSync(dir, { recursive: true });
      }
    }
  }

  function serializeDatabase(snap) {
    return JSON.stringify({
      magic: STORAGE_MAGIC,
      ddlVersion: INDEX_SCHEMA_VERSION,
      ddl: SCHEMA_V1_DDL,
      snapshot: snap,
    });
  }

  function deserializeDatabase(rawText) {
    const parsed = JSON.parse(rawText);
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid database envelope.');
    }
    if (parsed.magic && parsed.magic !== STORAGE_MAGIC) {
      throw new Error(`Unsupported storage magic: ${String(parsed.magic)}`);
    }
    return parsed.snapshot ?? parsed;
  }

  function readExistingLock() {
    if (!fsAdapter.existsSync(lockPath)) {
      return null;
    }
    try {
      return JSON.parse(fsAdapter.readFileSync(lockPath, 'utf8'));
    } catch {
      return { pid: -1, startedAt: 0 };
    }
  }

  function acquireLock() {
    const existing = readExistingLock();
    const lockEval = evaluateLockState(existing, {
      currentPid: pid,
      currentHostname: hostname,
      now: clock(),
      isProcessAlive,
    });

    if (!lockEval.canWrite) {
      readOnly = true;
      lockOwned = false;
      return { ok: false, status: lockEval.status, readOnly: true, holder: lockEval.holder };
    }

    ensureDirectories();
    const payload = createLockPayload({
      pid,
      hostname,
      now: clock(),
      version: createdBy,
    });
    fsAdapter.writeFileSync(lockPath, JSON.stringify(payload, null, 2), 'utf8');
    readOnly = false;
    lockOwned = true;
    return {
      ok: true,
      status: lockEval.status,
      recoveredStaleLock: lockEval.status === 'stale_recoverable',
      readOnly: false,
    };
  }

  function releaseLock() {
    if (!lockOwned) {
      return;
    }
    try {
      if (fsAdapter.existsSync(lockPath)) {
        const existing = readExistingLock();
        if (!existing || existing.pid === pid) {
          fsAdapter.unlinkSync(lockPath);
        }
      }
    } catch {
      // Ignore cleanup errors on close.
    }
    lockOwned = false;
  }

  function loadConfigFromDisk() {
    if (!fsAdapter.existsSync(configPath)) {
      config = { ...DEFAULT_INDEX_CONFIG };
      return { config, diagnostics: [] };
    }
    const raw = fsAdapter.readFileSync(configPath, 'utf8');
    const normalized = normalizeIndexConfig(raw);
    config = normalized.config;
    diagnostics.push(...normalized.diagnostics);
    return normalized;
  }

  /**
   * Open the store from disk without writing if no index exists yet.
   *
   * @param {{createIfMissing?: boolean}} [openOptions]
   */
  function open(openOptions = {}) {
    diagnostics = [];
    loadConfigFromDisk();

    const existingLock = readExistingLock();
    const lockEval = evaluateLockState(existingLock, {
      currentPid: pid,
      currentHostname: hostname,
      now: clock(),
      isProcessAlive,
    });

    if (lockEval.status === 'held_by_live_process') {
      readOnly = true;
      lockOwned = false;
    }

    const dbExists = fsAdapter.existsSync(dbPath);
    if (!dbExists) {
      snapshot = createEmptyIndexSnapshot({
        createdBy,
        now: clock(),
        state: 'unindexed',
      });
      opened = true;
      if (openOptions.createIfMissing && !readOnly) {
        ensureDirectories();
        if (!fsAdapter.existsSync(configPath)) {
          fsAdapter.writeFileSync(
            configPath,
            JSON.stringify(DEFAULT_INDEX_CONFIG, null, 2),
            'utf8',
          );
        }
      }
      return {
        ok: true,
        exists: false,
        readOnly,
        lockStatus: lockEval.status,
        state: snapshot.meta.state,
        config,
        diagnostics,
      };
    }

    let rawSnapshot;
    try {
      const rawText = fsAdapter.readFileSync(dbPath, 'utf8');
      rawSnapshot = deserializeDatabase(rawText);
    } catch (error) {
      const corruptBackupPath = `${dbPath}.corrupt-${clock()}`;
      try {
        if (!readOnly) {
          fsAdapter.renameSync(dbPath, corruptBackupPath);
        }
      } catch {
        // Keep read-only safe.
      }
      snapshot = createEmptyIndexSnapshot({
        createdBy,
        now: clock(),
        state: 'corrupt',
      });
      opened = true;
      return {
        ok: false,
        exists: true,
        code: 'E_CORRUPT',
        message: `Project index database is corrupt: ${error instanceof Error ? error.message : String(error)}`,
        backupPath: corruptBackupPath,
        rebuildRequired: true,
        readOnly,
        lockStatus: lockEval.status,
        state: 'corrupt',
        config,
        diagnostics,
      };
    }

    const migrated = migrateIndexSchema(rawSnapshot, INDEX_SCHEMA_VERSION, { now: clock() });
    if (!migrated.ok) {
      snapshot = createEmptyIndexSnapshot({
        createdBy,
        now: clock(),
        state: 'corrupt',
      });
      opened = true;
      return {
        ok: false,
        exists: true,
        code: migrated.code,
        message: migrated.message,
        rebuildRequired: migrated.rebuildRequired,
        readOnly,
        lockStatus: lockEval.status,
        state: 'corrupt',
        config,
        diagnostics,
      };
    }

    const validated = validateIndexSnapshot(migrated.snapshot);
    if (!validated.ok) {
      const corruptBackupPath = `${dbPath}.corrupt-${clock()}`;
      try {
        if (!readOnly) {
          fsAdapter.renameSync(dbPath, corruptBackupPath);
        }
      } catch {
        // Ignore rename failure in read-only mode.
      }
      snapshot = createEmptyIndexSnapshot({
        createdBy,
        now: clock(),
        state: 'corrupt',
      });
      opened = true;
      return {
        ok: false,
        exists: true,
        code: 'E_CORRUPT',
        message: `Project index failed integrity check: ${validated.issues.join(' ')}`,
        issues: validated.issues,
        backupPath: corruptBackupPath,
        rebuildRequired: true,
        readOnly,
        lockStatus: lockEval.status,
        state: 'corrupt',
        config,
        diagnostics,
      };
    }

    snapshot = migrated.snapshot;
    let interruptedRun = false;
    if (
      snapshot.meta.state === 'indexing' &&
      (lockEval.status === 'stale_recoverable' || lockEval.status === 'free')
    ) {
      snapshot.meta.state = 'partial';
      snapshot.meta.updated_at = clock();
      interruptedRun = true;
      diagnostics.push({
        code: 'interrupted_run',
        message: 'Previous indexing run was interrupted; committed batches were preserved.',
      });
    }

    opened = true;
    return {
      ok: true,
      exists: true,
      readOnly,
      lockStatus: lockEval.status,
      interruptedRun,
      state: snapshot.meta.state,
      config,
      diagnostics,
    };
  }

  /**
   * Persist a snapshot atomically via the write-ahead journal (`codeflow.sqlite.wal`)
   * and atomic rename over `codeflow.sqlite`.
   *
   * @param {Record<string, any>} nextSnapshot
   * @returns {{ok: true} | {ok: false, code: string, message: string}}
   */
  function commitSnapshotToDisk(nextSnapshot) {
    if (readOnly) {
      return {
        ok: false,
        code: 'E_READ_ONLY',
        message: 'Index is open in read-only mode because another process holds the writer lock.',
      };
    }
    const check = validateIndexSnapshot(nextSnapshot);
    if (!check.ok) {
      return {
        ok: false,
        code: 'E_SCHEMA_INVALID',
        message: check.issues.join(' '),
      };
    }
    try {
      ensureDirectories();
      if (!fsAdapter.existsSync(configPath)) {
        fsAdapter.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
      }
      const payload = serializeDatabase(nextSnapshot);
      fsAdapter.writeFileSync(walPath, payload, 'utf8');
      fsAdapter.renameSync(walPath, dbPath);
      return { ok: true };
    } catch (error) {
      try {
        if (fsAdapter.existsSync(walPath)) {
          fsAdapter.unlinkSync(walPath);
        }
      } catch {
        // Ignore cleanup errors after write failure.
      }
      return {
        ok: false,
        code: 'E_IO',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Remove all records emitted by `fileId` (`files`, `symbols`,
   * `relationships`, `dependencies`, `analysis_state`) from `targetSnapshot`.
   * When `removeIncoming === true` (file deleted from workspace), also removes
   * incoming `dependencies` targeting `fileId`.
   *
   * @param {Record<string, any>} targetSnapshot
   * @param {string} fileId
   * @param {{removeIncoming?: boolean}} [options]
   */
  function cascadeDeleteFile(targetSnapshot, fileId, options = {}) {
    delete targetSnapshot.files[fileId];
    delete targetSnapshot.analysis_state[fileId];

    const removedSymbols = new Set();
    for (const [symId, symRow] of Object.entries(targetSnapshot.symbols)) {
      if (symRow.file_id === fileId) {
        removedSymbols.add(symId);
        delete targetSnapshot.symbols[symId];
      }
    }

    for (const [relId, relRow] of Object.entries(targetSnapshot.relationships)) {
      if (relRow.site_file === fileId || removedSymbols.has(relRow.from_id)) {
        delete targetSnapshot.relationships[relId];
      }
    }

    for (const [depKey, depRow] of Object.entries(targetSnapshot.dependencies)) {
      if (
        depRow.from_file === fileId ||
        (options.removeIncoming === true && depRow.to_file === fileId)
      ) {
        delete targetSnapshot.dependencies[depKey];
      }
    }
  }

  /**
   * Execute an atomic batch write transaction. If validation or disk write
   * fails, the previous snapshot remains untouched and the batch is rolled back.
   *
   * @param {{
   *   deletedFileIds?: string[],
   *   files?: Array<Record<string, any>>,
   *   symbols?: Array<Record<string, any>>,
   *   relationships?: Array<Record<string, any>>,
   *   dependencies?: Array<Record<string, any>>,
   *   analysisStates?: Array<Record<string, any>>,
   *   runId?: string,
   *   state?: string,
   * }} batch
   */
  function writeBatch(batch = {}) {
    if (!opened) {
      open();
    }
    if (!lockOwned) {
      const acquired = acquireLock();
      if (!acquired.ok) {
        return {
          ok: false,
          code: 'E_READ_ONLY',
          message: 'Another window holds the index writer lock.',
        };
      }
    }

    const working = structuredClone(snapshot);
    const now = clock();

    for (const deletedId of batch.deletedFileIds ?? []) {
      cascadeDeleteFile(working, deletedId, { removeIncoming: true });
    }

    for (const fileRow of batch.files ?? []) {
      cascadeDeleteFile(working, fileRow.file_id);
      working.files[fileRow.file_id] = {
        file_id: fileRow.file_id,
        path: fileRow.path,
        language: fileRow.language,
        content_hash: fileRow.content_hash,
        size_bytes: Number(fileRow.size_bytes ?? 0),
        line_count: Number(fileRow.line_count ?? 0),
        indexed_at: Number(fileRow.indexed_at ?? now),
        run_id: String(fileRow.run_id ?? batch.runId ?? working.meta.last_run_id),
      };
    }

    for (const symRow of batch.symbols ?? []) {
      working.symbols[symRow.symbol_id] = {
        symbol_id: symRow.symbol_id,
        kind: symRow.kind,
        name: symRow.name,
        qualified_name: symRow.qualified_name,
        language: symRow.language,
        file_id: symRow.file_id,
        parent_id: symRow.parent_id ?? null,
        start_line: Number(symRow.start_line ?? 0),
        start_col: Number(symRow.start_col ?? 0),
        end_line: Number(symRow.end_line ?? 0),
        end_col: Number(symRow.end_col ?? 0),
        visibility: symRow.visibility ?? null,
        extensions_json: symRow.extensions_json ?? null,
        run_id: String(symRow.run_id ?? batch.runId ?? working.meta.last_run_id),
      };
    }

    for (const relRow of batch.relationships ?? []) {
      working.relationships[relRow.rel_id] = {
        rel_id: relRow.rel_id,
        type: relRow.type,
        from_id: relRow.from_id,
        to_id: relRow.to_id,
        status: relRow.status,
        reason: relRow.reason ?? null,
        site_file: relRow.site_file ?? null,
        site_start_line: relRow.site_start_line ?? null,
        site_end_line: relRow.site_end_line ?? null,
        run_id: String(relRow.run_id ?? batch.runId ?? working.meta.last_run_id),
      };
    }

    for (const depRow of batch.dependencies ?? []) {
      const key = `${depRow.from_file}|${depRow.to_file}|${depRow.type}`;
      working.dependencies[key] = {
        from_file: depRow.from_file,
        to_file: depRow.to_file,
        type: depRow.type,
        status: depRow.status,
        run_id: String(depRow.run_id ?? batch.runId ?? working.meta.last_run_id),
      };
    }

    for (const stateRow of batch.analysisStates ?? []) {
      working.analysis_state[stateRow.file_id] = {
        file_id: stateRow.file_id,
        completeness: stateRow.completeness ?? 'full',
        diagnostics_json:
          typeof stateRow.diagnostics_json === 'string'
            ? stateRow.diagnostics_json
            : JSON.stringify(stateRow.diagnostics ?? []),
        updated_at: Number(stateRow.updated_at ?? now),
      };
    }

    if (typeof batch.runId === 'string' && batch.runId.length > 0) {
      working.meta.last_run_id = batch.runId;
    }
    if (typeof batch.state === 'string') {
      working.meta.state = batch.state;
    }
    working.meta.updated_at = now;

    const committed = commitSnapshotToDisk(working);
    if (!committed.ok) {
      snapshot.meta.state = 'failed';
      return committed;
    }

    snapshot = working;
    return { ok: true };
  }

  /**
   * Update the index lifecycle state (`indexing`, `complete`, `partial`,
   * `cancelled`, `failed`) and optionally record `metadata/last-run.json`.
   *
   * @param {string} nextState
   * @param {Record<string, any>} [lastRunSummary]
   */
  function setState(nextState, lastRunSummary) {
    const result = writeBatch({
      state: nextState,
      runId: lastRunSummary?.runId,
    });
    if (result.ok && lastRunSummary && !readOnly) {
      try {
        ensureDirectories();
        fsAdapter.writeFileSync(lastRunPath, JSON.stringify(lastRunSummary, null, 2), 'utf8');
      } catch {
        // Non-fatal diagnostic summary write failure.
      }
    }
    return result;
  }

  /**
   * Reset the store to an empty Schema v1 snapshot on disk.
   */
  function reset() {
    if (!lockOwned) {
      const acquired = acquireLock();
      if (!acquired.ok) {
        return {
          ok: false,
          code: 'E_READ_ONLY',
          message: 'Cannot rebuild index while another process holds the writer lock.',
        };
      }
    }
    const fresh = createEmptyIndexSnapshot({
      createdBy,
      now: clock(),
      state: 'unindexed',
    });
    const committed = commitSnapshotToDisk(fresh);
    if (!committed.ok) {
      return committed;
    }
    snapshot = fresh;
    return { ok: true };
  }

  /**
   * Verify integrity and attempt repair by pruning any orphaned rows or
   * flagging `rebuildRequired: true` if unrecoverable.
   */
  function repair() {
    const checked = validateIndexSnapshot(snapshot);
    if (checked.ok) {
      if (snapshot.meta.state === 'corrupt' || snapshot.meta.state === 'failed') {
        setState(Object.keys(snapshot.files).length > 0 ? 'partial' : 'unindexed');
      }
      return { ok: true, repaired: false, issues: [] };
    }

    const working = structuredClone(snapshot);
    const validFiles = new Set(Object.keys(working.files));
    let pruned = 0;

    for (const [symId, symRow] of Object.entries(working.symbols)) {
      if (!validFiles.has(symRow.file_id)) {
        delete working.symbols[symId];
        pruned += 1;
      }
    }
    const validSymbols = new Set(Object.keys(working.symbols));
    for (const [relId, relRow] of Object.entries(working.relationships)) {
      if (
        !validSymbols.has(relRow.from_id) ||
        (relRow.site_file && !validFiles.has(relRow.site_file))
      ) {
        delete working.relationships[relId];
        pruned += 1;
      }
    }
    for (const [depKey, depRow] of Object.entries(working.dependencies)) {
      if (!validFiles.has(depRow.from_file)) {
        delete working.dependencies[depKey];
        pruned += 1;
      }
    }
    for (const fileId of Object.keys(working.analysis_state)) {
      if (!validFiles.has(fileId)) {
        delete working.analysis_state[fileId];
        pruned += 1;
      }
    }

    working.meta.state = validFiles.size > 0 ? 'partial' : 'unindexed';
    working.meta.updated_at = clock();

    const recheck = validateIndexSnapshot(working);
    if (!recheck.ok) {
      return {
        ok: false,
        code: 'E_REBUILD_REQUIRED',
        rebuildRequired: true,
        issues: recheck.issues,
      };
    }

    const committed = commitSnapshotToDisk(working);
    if (!committed.ok) {
      return committed;
    }
    snapshot = working;
    return { ok: true, repaired: true, prunedCount: pruned, issues: checked.issues };
  }

  /**
   * Delete the entire `.codeflow/` directory cleanly (`CodeFlow: Clear Index`).
   */
  function clear() {
    releaseLock();
    try {
      if (fsAdapter.existsSync(codeflowDir)) {
        fsAdapter.rmSync(codeflowDir, { recursive: true, force: true });
      }
      snapshot = createEmptyIndexSnapshot({
        createdBy,
        now: clock(),
        state: 'unindexed',
      });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        code: 'E_IO',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  function close() {
    releaseLock();
  }

  function getByteSize() {
    if (!fsAdapter.existsSync(dbPath)) {
      return 0;
    }
    try {
      return fsAdapter.statSync(dbPath).size;
    } catch {
      return 0;
    }
  }

  const queries = createIndexQuerySurface(() => snapshot, {
    getDiskHashes,
    getByteSize,
  });

  return {
    paths: Object.freeze({
      codeflowDir,
      configPath,
      indexDir,
      dbPath,
      walPath,
      cacheDir,
      graphsDir,
      metadataDir,
      lockPath,
      lastRunPath,
    }),
    open,
    acquireLock,
    releaseLock,
    writeBatch,
    setState,
    reset,
    repair,
    clear,
    close,
    isReadOnly: () => readOnly,
    getConfig: () => ({ ...config }),
    getDiagnostics: () => [...diagnostics],
    getSnapshot: () => snapshot,
    getFileRecords: () => ({ ...snapshot.files }),
    ...queries,
  };
}
