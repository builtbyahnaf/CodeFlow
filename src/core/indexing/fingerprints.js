/**
 * Content fingerprinting and workspace diff reconciliation (Phase 8 §7, §10).
 *
 * Compares enumerated workspace files and their content hashes against stored
 * `files` rows to classify each file as `unchanged`, `added`, `modified`, or
 * `deleted` (with Phase 8 delete+add rename correlation).
 */

import crypto from 'node:crypto';
import { createFileId } from '../csr/identity.js';

/**
 * Compute a deterministic SHA-256 content fingerprint, byte size, and line
 * count for a source document.
 *
 * @param {string} text
 * @returns {{contentHash: string, sizeBytes: number, lineCount: number}}
 */
export function computeContentFingerprint(text) {
  const source = String(text ?? '');
  const hash = crypto.createHash('sha256').update(source, 'utf8').digest('hex');
  const sizeBytes = Buffer.byteLength(source, 'utf8');
  const lineCount = source.length === 0 ? 0 : source.split(/\r?\n/).length;
  return {
    contentHash: `sha256:${hash}`,
    sizeBytes,
    lineCount,
  };
}

/**
 * Reconcile existing indexed file rows (`Record<fileId, {file_id, path, content_hash}>`)
 * against current disk candidate files (`Array<{fileId?, path, contentHash, sizeBytes?, lineCount?, language?}>`).
 *
 * @param {Record<string, {file_id: string, path: string, content_hash: string}>} indexedFiles
 * @param {Array<{fileId?: string, path: string, contentHash: string, sizeBytes?: number, lineCount?: number, language?: string}>} diskCandidates
 * @returns {{
 *   unchanged: string[],
 *   added: Array<{fileId: string, path: string, contentHash: string}>,
 *   modified: Array<{fileId: string, path: string, contentHash: string, previousHash: string}>,
 *   deleted: string[],
 *   renamed: Array<{fromFileId: string, toFileId: string, fromPath: string, toPath: string, contentHash: string}>,
 * }}
 */
export function diffWorkspaceFingerprints(indexedFiles = {}, diskCandidates = []) {
  /** @type {Map<string, {file_id: string, path: string, content_hash: string}>} */
  const indexedById = new Map();
  /** @type {Map<string, {file_id: string, path: string, content_hash: string}>} */
  const indexedByPath = new Map();

  for (const [key, row] of Object.entries(indexedFiles ?? {})) {
    if (!row || typeof row !== 'object') {
      continue;
    }
    const fileId = row.file_id ?? key;
    const normPath = String(row.path ?? '').replace(/\\/g, '/');
    const normalizedRow = { ...row, file_id: fileId, path: normPath };
    indexedById.set(fileId, normalizedRow);
    if (normPath) {
      indexedByPath.set(normPath, normalizedRow);
    }
  }

  /** @type {string[]} */
  const unchanged = [];
  /** @type {Array<{fileId: string, path: string, contentHash: string}>} */
  const rawAdded = [];
  /** @type {Array<{fileId: string, path: string, contentHash: string, previousHash: string}>} */
  const modified = [];
  /** @type {Set<string>} */
  const seenFileIds = new Set();

  for (const entry of Array.isArray(diskCandidates) ? diskCandidates : []) {
    if (!entry || typeof entry.path !== 'string') {
      continue;
    }
    const normPath = entry.path.replace(/\\/g, '/');
    const candidateId = entry.fileId ?? createFileId(normPath);
    const existing = indexedById.get(candidateId) ?? indexedByPath.get(normPath);

    if (!existing) {
      rawAdded.push({
        fileId: candidateId,
        path: normPath,
        contentHash: entry.contentHash,
      });
    } else {
      seenFileIds.add(existing.file_id);
      if (existing.content_hash === entry.contentHash) {
        unchanged.push(existing.file_id);
      } else {
        modified.push({
          fileId: existing.file_id,
          path: normPath,
          contentHash: entry.contentHash,
          previousHash: existing.content_hash,
        });
      }
    }
  }

  /** @type {Array<{fileId: string, path: string, contentHash: string}>} */
  const rawDeleted = [];
  for (const [fileId, row] of indexedById.entries()) {
    if (!seenFileIds.has(fileId)) {
      rawDeleted.push({
        fileId,
        path: row.path,
        contentHash: row.content_hash,
      });
    }
  }

  // Correlate renames: a deleted file and an added file sharing the exact
  // contentHash are paired in `renamed` and omitted from standalone `added`/`deleted`.
  /** @type {Array<{fromFileId: string, toFileId: string, fromPath: string, toPath: string, contentHash: string}>} */
  const renamed = [];
  const consumedDeleted = new Set();
  const consumedAdded = new Set();

  for (let dIdx = 0; dIdx < rawDeleted.length; dIdx += 1) {
    const del = rawDeleted[dIdx];
    const aIdx = rawAdded.findIndex(
      (add, idx) => !consumedAdded.has(idx) && add.contentHash === del.contentHash,
    );
    if (aIdx >= 0) {
      consumedDeleted.add(dIdx);
      consumedAdded.add(aIdx);
      const add = rawAdded[aIdx];
      renamed.push({
        fromFileId: del.fileId,
        toFileId: add.fileId,
        fromPath: del.path,
        toPath: add.path,
        contentHash: del.contentHash,
      });
    }
  }

  const added = rawAdded.filter((_, idx) => !consumedAdded.has(idx));
  const deleted = rawDeleted.filter((_, idx) => !consumedDeleted.has(idx)).map((d) => d.fileId);

  return {
    unchanged,
    added,
    modified,
    deleted,
    renamed,
  };
}
