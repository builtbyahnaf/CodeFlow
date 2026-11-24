/**
 * Background project indexing pipeline (Phase 8 §7, §8, §12).
 *
 * Coordinates candidate discovery, exclusion filtering, deterministic
 * shallow-first ordering, fingerprint diffing (unchanged files are skipped
 * with zero re-analysis), per-file size budget checks, CSR-to-index table
 * projection, atomic batch commits, progress notifications, and cooperative
 * cancellation.
 *
 * Invariant (AC-8.5): The pipeline NEVER modifies any workspace source file.
 * All writes go strictly through `store.writeBatch` / `store.setState` inside
 * `.codeflow/`.
 */

import { shouldIndexPath, parseGitignoreHints } from '../../core/indexing/exclusions.js';
import { orderCandidateFiles, planIndexBatches } from '../../core/indexing/ordering.js';
import {
  computeContentFingerprint,
  diffWorkspaceFingerprints,
} from '../../core/indexing/fingerprints.js';
import { createFileId } from '../../core/csr/identity.js';

/**
 * Project a validated CSR `AnalysisRun` for a single workspace file into Schema
 * v1 table rows (`fileRow`, `symbolRows`, `relationshipRows`, `dependencyRows`,
 * `analysisStateRow`).
 *
 * Raw source code is never copied into any table row.
 *
 * @param {{
 *   relativePath: string,
 *   contentHash: string,
 *   sizeBytes: number,
 *   lineCount: number,
 *   run: Record<string, any>,
 *   now: number,
 * }} params
 */
export function projectRunToIndexRows({
  relativePath,
  contentHash,
  sizeBytes,
  lineCount,
  run,
  now,
}) {
  const normalizedPath = String(relativePath).replace(/\\/g, '/').replace(/^\/+/, '');
  const primaryFile =
    run.files?.find((f) => f.path === normalizedPath || normalizedPath.endsWith(f.path)) ??
    run.files?.[0];
  const fileId = primaryFile?.fileId ?? createFileId(normalizedPath);
  const language = primaryFile?.language ?? run.language ?? 'javascript';
  const runId = run.runId ?? `run:index-${now}`;

  const fileRow = {
    file_id: fileId,
    path: normalizedPath,
    language,
    content_hash: contentHash,
    size_bytes: sizeBytes,
    line_count: lineCount,
    indexed_at: now,
    run_id: runId,
  };

  const symbolRows = (run.symbols ?? [])
    .filter((sym) => (sym.fileId ?? sym.declaration?.fileId) === fileId)
    .map((sym) => ({
      symbol_id: sym.symbolId,
      kind: sym.kind,
      name: sym.name,
      qualified_name: sym.qualifiedName ?? sym.name,
      language: sym.language ?? language,
      file_id: fileId,
      parent_id: sym.parentId ?? null,
      start_line: Number(sym.declaration?.startLine ?? 0),
      start_col: Number(sym.declaration?.startColumn ?? 0),
      end_line: Number(sym.declaration?.endLine ?? 0),
      end_col: Number(sym.declaration?.endColumn ?? 0),
      visibility: sym.visibility ?? null,
      extensions_json: sym.extensions ? JSON.stringify(sym.extensions) : null,
      run_id: runId,
    }));

  const validSymbolIds = new Set(symbolRows.map((s) => s.symbol_id));

  const relationshipRows = (run.relationships ?? [])
    .filter((rel) => validSymbolIds.has(rel.from))
    .map((rel) => ({
      rel_id: rel.relationshipId,
      type: rel.type,
      from_id: rel.from,
      to_id: rel.to,
      status: rel.status,
      reason: rel.reasonCode ?? null,
      site_file: fileId,
      site_start_line: Number(rel.site?.startLine ?? 0),
      site_end_line: Number(rel.site?.endLine ?? rel.site?.startLine ?? 0),
      run_id: runId,
    }));

  /** @type {Array<Record<string, any>>} */
  const dependencyRows = [];
  for (const fileEntry of run.files ?? []) {
    if (fileEntry.fileId && fileEntry.fileId !== fileId) {
      dependencyRows.push({
        from_file: fileId,
        to_file: fileEntry.fileId,
        type: language === 'cpp' ? 'includes' : 'imports',
        status: 'resolved',
        run_id: runId,
      });
    }
  }

  const analysisStateRow = {
    file_id: fileId,
    completeness: run.completeness === 'full' ? 'full' : 'partial',
    diagnostics_json: JSON.stringify(
      (run.diagnostics ?? []).map((diag) => ({
        code: diag.code,
        severity: diag.severity,
        message: diag.message,
      })),
    ),
    updated_at: now,
  };

  return {
    fileRow,
    symbolRows,
    relationshipRows,
    dependencyRows,
    analysisStateRow,
  };
}

/**
 * Create the workspace indexing pipeline.
 *
 * @param {{
 *   store: ReturnType<typeof import('../../storage/indexStore.js').createIndexStore>,
 *   listWorkspaceFiles: () => Promise<Array<{path: string, sizeBytes?: number}>>,
 *   readWorkspaceFile: (relativePath: string) => Promise<string>,
 *   readGitignore?: () => Promise<string|null>,
 *   analyzeFile: (input: {path: string, source: string, runId: string}) => Promise<
 *     {ok: true, run: Record<string, any>} | {ok: false, code: string, message: string}
 *   >,
 *   clock?: () => number,
 *   logger?: {info?: Function, warn?: Function, error?: Function, debug?: Function},
 * }} options
 */
export function createIndexingPipeline({
  store,
  listWorkspaceFiles,
  readWorkspaceFile,
  readGitignore = async () => null,
  analyzeFile,
  clock = () => Date.now(),
  logger = {},
}) {
  let runCounter = 0;

  /**
   * Execute an indexing pass (initial build, incremental resume, or full rebuild).
   *
   * @param {{
   *   rebuild?: boolean,
   *   token?: {isCancelled?: boolean},
   *   onProgress?: (progress: {
   *     phase: string,
   *     indexedFiles: number,
   *     totalFiles: number,
   *     skippedUnchanged: number,
   *     batchIndex: number,
   *     totalBatches: number,
   *     state: string,
   *   }) => void,
   * }} [runOptions]
   */
  async function runIndexing(runOptions = {}) {
    const startedAt = clock();
    runCounter += 1;
    const runId = `run:index-${startedAt.toString(36)}-${runCounter}`;

    const opened = store.open({ createIfMissing: true });
    if (store.isReadOnly()) {
      return {
        ok: false,
        code: 'E_READ_ONLY',
        message: 'Index is open in read-only mode because another process holds the writer lock.',
      };
    }

    if (runOptions.rebuild) {
      const resetResult = store.reset();
      if (!resetResult.ok) {
        return resetResult;
      }
    }

    const config = store.getConfig();
    const maxFileBytes = config.maxFileSizeKb * 1024;
    const gitignoreText = await readGitignore();
    const gitignorePatterns = gitignoreText ? parseGitignoreHints(gitignoreText) : [];

    const rawCandidates = await listWorkspaceFiles();
    if (rawCandidates.length > config.stressCeilingFiles) {
      logger.warn?.('index.stress_ceiling_exceeded', {
        candidateCount: rawCandidates.length,
        ceiling: config.stressCeilingFiles,
      });
      return {
        ok: false,
        code: 'E_LIMIT',
        message: `Workspace contains ${rawCandidates.length} candidate files, exceeding the ${config.stressCeilingFiles} file safety ceiling. Narrow .codeflow/config.json include/exclude patterns.`,
        candidateCount: rawCandidates.length,
        ceiling: config.stressCeilingFiles,
      };
    }

    /** @type {Array<{path: string, sizeBytes: number, language: 'cpp'|'javascript'}>} */
    const eligible = [];
    /** @type {Array<{path: string, reason: string}>} */
    const excluded = [];

    for (const entry of rawCandidates) {
      const check = shouldIndexPath(entry.path, {
        include: config.include,
        exclude: config.exclude,
        gitignorePatterns,
      });
      if (!check.allowed) {
        excluded.push({ path: check.normalizedPath, reason: check.reason });
        continue;
      }
      eligible.push({
        path: check.normalizedPath,
        sizeBytes: Math.max(0, Number(entry.sizeBytes ?? 0)),
        language: check.language,
      });
    }

    const ordered = orderCandidateFiles(eligible);

    /** @type {Array<{fileId: string, path: string, contentHash: string, sizeBytes: number, lineCount: number, language: 'cpp'|'javascript', source: string, oversized: boolean}>} */
    const scanned = [];
    for (const candidate of ordered) {
      const fileId = createFileId(candidate.path);
      if (candidate.sizeBytes > maxFileBytes) {
        scanned.push({
          fileId,
          path: candidate.path,
          contentHash: `oversized:${candidate.sizeBytes}`,
          sizeBytes: candidate.sizeBytes,
          lineCount: 0,
          language: candidate.language,
          source: '',
          oversized: true,
        });
        continue;
      }
      const source = await readWorkspaceFile(candidate.path);
      const fingerprint = computeContentFingerprint(source);
      if (fingerprint.sizeBytes > maxFileBytes) {
        scanned.push({
          fileId,
          path: candidate.path,
          contentHash: fingerprint.contentHash,
          sizeBytes: fingerprint.sizeBytes,
          lineCount: fingerprint.lineCount,
          language: candidate.language,
          source: '',
          oversized: true,
        });
        continue;
      }
      scanned.push({
        fileId,
        path: candidate.path,
        contentHash: fingerprint.contentHash,
        sizeBytes: fingerprint.sizeBytes,
        lineCount: fingerprint.lineCount,
        language: candidate.language,
        source,
        oversized: false,
      });
    }

    const existingFiles = store.getFileRecords();
    const diff = diffWorkspaceFingerprints(
      existingFiles,
      scanned.map((s) => ({
        fileId: s.fileId,
        path: s.path,
        contentHash: s.contentHash,
        sizeBytes: s.sizeBytes,
        lineCount: s.lineCount,
        language: s.language,
      })),
    );

    const toAnalyzeIds = new Set([
      ...diff.added.map((a) => a.fileId),
      ...diff.modified.map((m) => m.fileId),
      ...diff.renamed.map((r) => r.toFileId),
    ]);
    const deletedFileIds = [...diff.deleted, ...diff.renamed.map((r) => r.fromFileId)];

    const workItems = scanned.filter((item) => toAnalyzeIds.has(item.fileId));
    const batches = planIndexBatches(workItems, config.batchSize);

    // If nothing changed and nothing was deleted, commit state without re-analyzing a single file.
    if (workItems.length === 0 && deletedFileIds.length === 0) {
      const finalState = Object.values(store.getSnapshot().analysis_state).some(
        (s) =>
          s.completeness === 'failed' ||
          (typeof s.diagnostics_json === 'string' &&
            s.diagnostics_json.includes('budget_exceeded')),
      )
        ? 'partial'
        : 'complete';
      const setRes = store.setState(finalState, {
        runId,
        startedAt,
        completedAt: clock(),
        indexedFiles: 0,
        skippedUnchanged: diff.unchanged.length,
        deletedFiles: 0,
        state: finalState,
      });
      if (!setRes.ok) {
        return setRes;
      }
      return {
        ok: true,
        runId,
        state: finalState,
        analyzedFiles: 0,
        skippedUnchanged: diff.unchanged.length,
        deletedFiles: 0,
        renamedFiles: 0,
        excludedFiles: excluded.length,
        totalEligibleFiles: scanned.length,
        stats: store.stats(),
        openedDiagnostics: opened.diagnostics ?? [],
      };
    }

    const startStateResult = store.writeBatch({
      deletedFileIds,
      state: 'indexing',
      runId,
    });
    if (!startStateResult.ok) {
      return startStateResult;
    }

    let analyzedCount = 0;
    let hasPartialOrFailedFile = false;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex += 1) {
      if (runOptions.token?.isCancelled) {
        store.setState('cancelled', {
          runId,
          startedAt,
          completedAt: clock(),
          indexedFiles: analyzedCount,
          skippedUnchanged: diff.unchanged.length,
          state: 'cancelled',
        });
        return {
          ok: true,
          cancelled: true,
          runId,
          state: 'cancelled',
          analyzedFiles: analyzedCount,
          skippedUnchanged: diff.unchanged.length,
          deletedFiles: deletedFileIds.length,
          renamedFiles: diff.renamed.length,
          excludedFiles: excluded.length,
          totalEligibleFiles: scanned.length,
          stats: store.stats(),
        };
      }

      const batchItems = batches[batchIndex];
      /** @type {Array<Record<string, any>>} */
      const files = [];
      /** @type {Array<Record<string, any>>} */
      const symbols = [];
      /** @type {Array<Record<string, any>>} */
      const relationships = [];
      /** @type {Array<Record<string, any>>} */
      const dependencies = [];
      /** @type {Array<Record<string, any>>} */
      const analysisStates = [];

      for (const item of batchItems) {
        if (runOptions.token?.isCancelled) {
          break;
        }
        const now = clock();
        if (item.oversized) {
          hasPartialOrFailedFile = true;
          files.push({
            file_id: item.fileId,
            path: item.path,
            language: item.language,
            content_hash: item.contentHash,
            size_bytes: item.sizeBytes,
            line_count: item.lineCount,
            indexed_at: now,
            run_id: runId,
          });
          analysisStates.push({
            file_id: item.fileId,
            completeness: 'partial',
            diagnostics: [
              {
                code: 'budget_exceeded',
                severity: 'warning',
                message: `File exceeds maxFileSizeKb (${config.maxFileSizeKb} KB) and was skipped.`,
              },
            ],
            updated_at: now,
          });
          analyzedCount += 1;
          continue;
        }

        const analyzed = await analyzeFile({
          path: item.path,
          source: item.source,
          runId,
        });

        if (!analyzed.ok) {
          hasPartialOrFailedFile = true;
          files.push({
            file_id: item.fileId,
            path: item.path,
            language: item.language,
            content_hash: item.contentHash,
            size_bytes: item.sizeBytes,
            line_count: item.lineCount,
            indexed_at: now,
            run_id: runId,
          });
          analysisStates.push({
            file_id: item.fileId,
            completeness: 'failed',
            diagnostics: [
              {
                code: analyzed.code ?? 'analysis_failed',
                severity: 'error',
                message: analyzed.message ?? 'Analysis failed for file.',
              },
            ],
            updated_at: now,
          });
          analyzedCount += 1;
          continue;
        }

        const projected = projectRunToIndexRows({
          relativePath: item.path,
          contentHash: item.contentHash,
          sizeBytes: item.sizeBytes,
          lineCount: item.lineCount,
          run: analyzed.run,
          now,
        });

        files.push(projected.fileRow);
        symbols.push(...projected.symbolRows);
        relationships.push(...projected.relationshipRows);
        dependencies.push(...projected.dependencyRows);
        analysisStates.push(projected.analysisStateRow);
        analyzedCount += 1;
      }

      if (files.length > 0) {
        const batchCommit = store.writeBatch({
          files,
          symbols,
          relationships,
          dependencies,
          analysisStates,
          runId,
          state: 'indexing',
        });
        if (!batchCommit.ok) {
          return batchCommit;
        }
      }

      runOptions.onProgress?.({
        phase: 'indexing',
        indexedFiles: diff.unchanged.length + analyzedCount,
        totalFiles: scanned.length,
        skippedUnchanged: diff.unchanged.length,
        batchIndex: batchIndex + 1,
        totalBatches: batches.length,
        state: 'indexing',
      });

      if (runOptions.token?.isCancelled) {
        store.setState('cancelled', {
          runId,
          startedAt,
          completedAt: clock(),
          indexedFiles: analyzedCount,
          skippedUnchanged: diff.unchanged.length,
          state: 'cancelled',
        });
        return {
          ok: true,
          cancelled: true,
          runId,
          state: 'cancelled',
          analyzedFiles: analyzedCount,
          skippedUnchanged: diff.unchanged.length,
          deletedFiles: deletedFileIds.length,
          renamedFiles: diff.renamed.length,
          excludedFiles: excluded.length,
          totalEligibleFiles: scanned.length,
          stats: store.stats(),
        };
      }
    }

    const anyPriorPartial = Object.values(store.getSnapshot().analysis_state).some(
      (s) =>
        s.completeness === 'failed' ||
        (typeof s.diagnostics_json === 'string' && s.diagnostics_json.includes('budget_exceeded')),
    );
    const finalState = hasPartialOrFailedFile || anyPriorPartial ? 'partial' : 'complete';
    const finalized = store.setState(finalState, {
      runId,
      startedAt,
      completedAt: clock(),
      indexedFiles: analyzedCount,
      skippedUnchanged: diff.unchanged.length,
      deletedFiles: diff.deleted.length,
      renamedFiles: diff.renamed.length,
      state: finalState,
    });
    if (!finalized.ok) {
      return finalized;
    }

    runOptions.onProgress?.({
      phase: 'complete',
      indexedFiles: scanned.length,
      totalFiles: scanned.length,
      skippedUnchanged: diff.unchanged.length,
      batchIndex: batches.length,
      totalBatches: batches.length,
      state: finalState,
    });

    return {
      ok: true,
      cancelled: false,
      runId,
      state: finalState,
      analyzedFiles: analyzedCount,
      skippedUnchanged: diff.unchanged.length,
      deletedFiles: diff.deleted.length,
      renamedFiles: diff.renamed.length,
      excludedFiles: excluded.length,
      totalEligibleFiles: scanned.length,
      stats: store.stats(),
    };
  }

  return {
    runIndexing,
  };
}
