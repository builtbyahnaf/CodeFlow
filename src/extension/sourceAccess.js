/**
 * Host source access.
 *
 * The only module that reads document text for the webview. It validates every
 * range against the current document, returns exact slices with a version and a
 * full-document hash, and never assembles text from the CSR or an AST.
 *
 * Reads go through `workspace.openTextDocument`; the webview never receives
 * filesystem access.
 */

import * as vscode from 'vscode';
import crypto from 'node:crypto';
import { normalizeForCompare } from './security/paths.js';
import { resolveWorkspacePath } from './sourcePaths.js';
import { createLru } from '../core/source/cache.js';
import {
  SOURCE_LIMITS,
  createDocumentView,
  integrityFor,
  normalizeMaxLines,
  normalizeRangeRef,
  rangeWithinDocument,
  truncateSource,
} from '../core/source/ranges.js';

/**
 * @param {{
 *   workspaceRoot: () => string|undefined,
 *   logger: {debug: Function, warn: Function, error: Function},
 *   settings?: () => {maxLines?: number, maxBytes?: number},
 * }} options
 */
export function createSourceAccess({ workspaceRoot, logger, settings = () => ({}) }) {
  const cache = createLru({ maxEntries: 30, maxBytes: 5 * 1024 * 1024 });
  /** @type {Map<string, {fileId: string, relativePath: string, absolutePath: string|null, hash: string|null, version: number|null, reason?: string}>} */
  const baseline = new Map();
  /** @type {Set<(event: {fileIds: string[], reason: string}) => void>} */
  const invalidateHandlers = new Set();

  /**
   * @param {string} text
   * @returns {string}
   */
  function hashText(text) {
    return `sha256:${crypto.createHash('sha256').update(text, 'utf8').digest('hex')}`;
  }

  /**
   * @param {string} absolutePath
   * @returns {Promise<vscode.TextDocument>}
   */
  function open(absolutePath) {
    return vscode.workspace.openTextDocument(vscode.Uri.file(absolutePath));
  }

  /**
   * @param {Array<{fileId: string, path: string}>} files
   * @returns {Promise<Array<{fileId: string, relativePath: string}>>}
   */
  async function captureBaseline(files) {
    baseline.clear();
    cache.clear();
    /** @type {Array<{fileId: string, relativePath: string}>} */
    const captured = [];
    const root = workspaceRoot();
    for (const file of Array.isArray(files) ? files : []) {
      if (typeof file?.fileId !== 'string' || typeof file?.path !== 'string') {
        continue;
      }
      const resolved = resolveWorkspacePath(root ?? '', file.path);
      if (!resolved.ok) {
        baseline.set(file.fileId, {
          fileId: file.fileId,
          relativePath: file.path,
          absolutePath: null,
          hash: null,
          version: null,
          reason: resolved.message,
        });
        continue;
      }
      try {
        const document = await open(resolved.absolutePath);
        baseline.set(file.fileId, {
          fileId: file.fileId,
          relativePath: resolved.relativePath,
          absolutePath: resolved.absolutePath,
          hash: hashText(document.getText()),
          version: document.version,
        });
        captured.push({ fileId: file.fileId, relativePath: resolved.relativePath });
      } catch (error) {
        baseline.set(file.fileId, {
          fileId: file.fileId,
          relativePath: resolved.relativePath,
          absolutePath: resolved.absolutePath,
          hash: null,
          version: null,
          reason: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return captured;
  }

  /**
   * @param {string} fileId
   * @returns {Promise<{ok: true, entry: any, document: vscode.TextDocument} | {ok: false, code: string, message: string}>}
   */
  async function documentFor(fileId) {
    const entry = baseline.get(fileId);
    if (!entry) {
      return {
        ok: false,
        code: 'E_SOURCE_MISSING',
        message: 'This file is not part of the current analysis.',
      };
    }
    if (!entry.absolutePath || !entry.hash) {
      return {
        ok: false,
        code: 'E_SOURCE_MISSING',
        message: entry.reason || 'The analyzed document is not available.',
      };
    }
    try {
      const document = await open(entry.absolutePath);
      return { ok: true, entry, document };
    } catch (error) {
      return {
        ok: false,
        code: 'E_SOURCE_MISSING',
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * @param {Record<string, unknown>} payload
   * @returns {Promise<{ok: true, slice: Record<string, unknown>} | {ok: false, code: string, message: string}>}
   */
  async function slice(payload) {
    const settingsNow = settings() ?? {};
    const maxLines = normalizeMaxLines(
      payload?.maxLines ?? settingsNow.maxLines ?? SOURCE_LIMITS.maxLines,
    );
    const maxBytes = Math.max(1_024, Number(settingsNow.maxBytes ?? SOURCE_LIMITS.maxBytes));
    if (typeof payload?.fileId !== 'string') {
      return { ok: false, code: 'E_RANGE', message: 'A source slice requires a fileId.' };
    }
    const range = normalizeRangeRef(payload.range);
    if (!range.ok) {
      return { ok: false, code: range.code, message: range.issues.join(' ') };
    }
    if (range.value.fileId !== payload.fileId) {
      return { ok: false, code: 'E_RANGE', message: 'fileId does not match the range fileId.' };
    }

    const found = await documentFor(payload.fileId);
    if (!found.ok) {
      return found;
    }
    const document = found.document;
    const view = createDocumentView(document.getText());
    const bounds = rangeWithinDocument(range.value, view);
    if (!bounds.ok) {
      return { ok: false, code: bounds.code, message: bounds.issues.join(' ') };
    }

    const key = `${payload.fileId}|${document.version}|${maxLines}|${range.value.startLine}:${range.value.startColumn}-${range.value.endLine}:${range.value.endColumn}`;
    const cached = cache.get(key);
    if (cached) {
      return { ok: true, slice: /** @type {Record<string, unknown>} */ (cached) };
    }

    const exact = document.getText(
      new vscode.Range(
        range.value.startLine,
        range.value.startColumn,
        range.value.endLine,
        range.value.endColumn,
      ),
    );
    if (Buffer.byteLength(exact, 'utf8') > maxBytes) {
      return {
        ok: false,
        code: 'E_LIMIT',
        message: `The source slice exceeds ${maxBytes} bytes.`,
      };
    }
    const trimmed = truncateSource(exact, maxLines);
    const currentHash = hashText(document.getText());
    const integrity = integrityFor(found.entry.hash ?? undefined, currentHash);
    const result = {
      fileId: payload.fileId,
      relativePath: found.entry.relativePath,
      languageId: document.languageId,
      text: trimmed.text,
      lines: {
        startLine: range.value.startLine,
        endLine: range.value.endLine,
      },
      documentVersion: document.version,
      contentHash: currentHash,
      analysisHash: found.entry.hash,
      integrity,
      truncated: trimmed.truncated,
      ...(integrity !== 'exact'
        ? { reason: 'The document changed since this analysis. Re-analyze before trusting it.' }
        : {}),
    };
    cache.set(key, result, Buffer.byteLength(trimmed.text, 'utf8'));
    return { ok: true, slice: result };
  }

  /**
   * Batch range validation. One document read per file, not per range.
   *
   * @param {Array<Record<string, unknown>>} ranges
   * @returns {Promise<{ok: true, results: Array<Record<string, unknown>>} | {ok: false, code: string, message: string}>}
   */
  async function validate(ranges) {
    if (!Array.isArray(ranges)) {
      return { ok: false, code: 'E_RANGE', message: 'ranges must be an array.' };
    }
    if (ranges.length > SOURCE_LIMITS.maxRanges) {
      return {
        ok: false,
        code: 'E_LIMIT',
        message: `At most ${SOURCE_LIMITS.maxRanges} ranges can be validated at once.`,
      };
    }
    /** @type {Map<string, {ok: boolean, view?: ReturnType<typeof createDocumentView>, document?: vscode.TextDocument, hash?: string, currentHash?: string}>} */
    const documents = new Map();
    /** @type {Array<Record<string, unknown>>} */
    const results = [];

    for (const raw of ranges) {
      const normalized = normalizeRangeRef(raw);
      if (!normalized.ok) {
        results.push({
          fileId: typeof raw?.fileId === 'string' ? raw.fileId : '',
          integrity: 'missing',
          code: normalized.code,
          reason: normalized.issues.join(' '),
        });
        continue;
      }
      const fileId = normalized.value.fileId;
      if (!documents.has(fileId)) {
        const found = await documentFor(fileId);
        if (!found.ok) {
          documents.set(fileId, { ok: false });
        } else {
          const text = found.document.getText();
          documents.set(fileId, {
            ok: true,
            document: found.document,
            view: createDocumentView(text),
            hash: found.entry.hash ?? '',
            currentHash: hashText(text),
          });
        }
      }
      const entry = documents.get(fileId);
      if (!entry?.ok || !entry.view) {
        const baselineEntry = baseline.get(fileId);
        results.push({
          fileId,
          integrity: 'missing',
          code: 'E_SOURCE_MISSING',
          reason: baselineEntry?.reason || 'The analyzed document is not available.',
        });
        continue;
      }
      const bounds = rangeWithinDocument(normalized.value, entry.view);
      if (!bounds.ok) {
        results.push({
          fileId,
          integrity: 'missing',
          code: bounds.code,
          reason: bounds.issues.join(' '),
        });
        continue;
      }
      if (entry.hash !== entry.currentHash) {
        results.push({
          fileId,
          integrity: 'stale',
          code: 'E_SOURCE_STALE',
          reason: 'The document changed since this analysis.',
          documentVersion: entry.document?.version ?? null,
        });
        continue;
      }
      results.push({
        fileId,
        integrity: 'exact',
        documentVersion: entry.document?.version ?? null,
      });
    }
    return { ok: true, results };
  }

  /**
   * @param {(event: {fileIds: string[], reason: string}) => void} handler
   * @returns {{dispose: () => void}}
   */
  function onDidInvalidate(handler) {
    invalidateHandlers.add(handler);
    return {
      dispose() {
        invalidateHandlers.delete(handler);
      },
    };
  }

  /**
   * @param {string} absolutePath
   * @param {string} reason
   * @param {boolean} emit
   */
  function invalidatePath(absolutePath, reason, emit) {
    if (typeof absolutePath !== 'string' || absolutePath.length === 0) {
      return;
    }
    const normalized = normalizeForCompare(absolutePath);
    /** @type {string[]} */
    const fileIds = [];
    for (const entry of baseline.values()) {
      if (entry.absolutePath && normalizeForCompare(entry.absolutePath) === normalized) {
        fileIds.push(entry.fileId);
      }
    }
    if (fileIds.length === 0) {
      return;
    }
    for (const fileId of fileIds) {
      cache.deleteByPrefix(`${fileId}|`);
    }
    if (emit) {
      for (const handler of invalidateHandlers) {
        try {
          handler({ fileIds, reason });
        } catch (error) {
          logger.warn('source.invalidate_failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
  }

  const subscriptions = [
    vscode.workspace.onDidChangeTextDocument((event) => {
      invalidatePath(event.document.uri.fsPath, 'changed', true);
    }),
    vscode.workspace.onDidCloseTextDocument((document) => {
      invalidatePath(document.uri.fsPath, 'closed', false);
    }),
    vscode.workspace.onDidDeleteFiles((event) => {
      for (const uri of event.files) {
        invalidatePath(uri.fsPath, 'deleted', true);
      }
    }),
    vscode.workspace.onDidRenameFiles((event) => {
      for (const file of event.files) {
        invalidatePath(file.oldUri.fsPath, 'renamed', true);
        invalidatePath(file.newUri.fsPath, 'renamed', true);
      }
    }),
  ];

  return {
    captureBaseline,
    slice,
    validate,
    onDidInvalidate,
    /** @param {string} fileId */
    relativePathFor(fileId) {
      return baseline.get(fileId)?.relativePath ?? null;
    },
    dispose() {
      for (const subscription of subscriptions) {
        subscription.dispose();
      }
      invalidateHandlers.clear();
      cache.clear();
      baseline.clear();
    },
  };
}
