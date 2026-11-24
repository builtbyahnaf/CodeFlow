/**
 * Stored row extraction and CSR-to-Schema-v1 projection for incremental updates
 * (Phase 9 §8, P9-05).
 */

import { createFileId } from '../../csr/identity.js';

/**
 * Extract previous stored rows for `fileId` from an index snapshot so
 * `diffFileRows` can compare old vs new rows in $O(N)$.
 *
 * @param {Record<string, any>} snapshot
 * @param {string} fileId
 */
export function extractStoredFileRows(snapshot, fileId) {
  const fileRow = snapshot?.files?.[fileId] ?? null;
  const symbolRows = Object.values(snapshot?.symbols ?? {}).filter((s) => s.file_id === fileId);
  const symIds = new Set(symbolRows.map((s) => s.symbol_id));
  const relationshipRows = Object.values(snapshot?.relationships ?? {}).filter(
    (r) => r.site_file === fileId || symIds.has(r.from_id),
  );
  const dependencyRows = Object.values(snapshot?.dependencies ?? {}).filter(
    (d) => d.from_file === fileId,
  );
  return {
    fileRow,
    symbolRows,
    relationshipRows,
    dependencyRows,
  };
}

/**
 * Project an adapter `AnalysisRun` into Schema v1 rows for incremental commit.
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
export function projectIncrementalRun({
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
  const runId = run.runId ?? `run:inc-${now}`;

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
