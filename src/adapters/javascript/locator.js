/**
 * Source locations for JavaScript.
 *
 * Acorn already reports 1-based lines and 0-based UTF-16 columns, which is
 * exactly the CSR coordinate system after subtracting one from the line. That
 * keeps this module small and avoids a byte/UTF-16 conversion step.
 */

import { createFileId } from '../../core/csr/identity.js';
import { hashHex } from '../../core/csr/hash.js';
import { createLineIndex } from '../../core/csr/provenance.js';

/**
 * @typedef {import('../../core/csr/entities.js').SourceRange} SourceRange
 * @typedef {import('../../core/csr/entities.js').FileRecord} FileRecord
 */

/**
 * @param {unknown} path
 * @param {unknown} text
 * @returns {{
 *   path: string,
 *   fileId: string,
 *   text: string,
 *   lineIndex: ReturnType<typeof createLineIndex>,
 *   lineCount: number,
 *   range: (node: {loc?: {start?: {line?: number, column?: number}, end?: {line?: number, column?: number}}, start?: number, end?: number}) => SourceRange,
 *   rangeAt: (start: {line?: number, column?: number}, end: {line?: number, column?: number}) => SourceRange,
 *   fileRecord: () => FileRecord,
 *   fileRange: () => SourceRange,
 * }}
 */
export function createJavaScriptLocator(path, text) {
  const normalizedPath = String(path ?? '');
  const source = String(text ?? '');
  const fileId = createFileId(normalizedPath);
  const lineIndex = createLineIndex(source);

  /**
   * @param {{line?: number, column?: number}} position
   * @returns {{line: number, column: number}}
   */
  function clamp(position) {
    const line = Number.isFinite(position?.line) ? Math.max(0, Number(position.line)) : 0;
    const column = Number.isFinite(position?.column) ? Math.max(0, Number(position.column)) : 0;
    const safeLine = Math.min(line, Math.max(0, lineIndex.lineCount - 1));
    const bounds = lineIndex.lineBounds(safeLine);
    return {
      line: safeLine,
      column: Math.min(column, Math.max(0, bounds.contentEnd - bounds.start)),
    };
  }

  /**
   * @param {unknown} node
   * @returns {SourceRange}
   */
  function range(node) {
    const candidate =
      /** @type {{loc?: {start?: {line?: number, column?: number}, end?: {line?: number, column?: number}}, start?: number, end?: number}} */ (
        node ?? {}
      );
    const start = clamp({
      line: Number(candidate.loc?.start?.line ?? 1) - 1,
      column: Number(candidate.loc?.start?.column ?? 0),
    });
    const end = clamp({
      line: Number(candidate.loc?.end?.line ?? start.line + 1) - 1,
      column: Number(candidate.loc?.end?.column ?? start.column),
    });
    /** @type {SourceRange} */
    const result = {
      fileId,
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column,
    };
    if (Number.isInteger(candidate.start)) {
      result.startOffset = Number(candidate.start);
    }
    if (Number.isInteger(candidate.end)) {
      result.endOffset = Number(candidate.end);
    }
    return result;
  }

  /**
   * @param {{line?: number, column?: number}} start
   * @param {{line?: number, column?: number}} end
   * @returns {SourceRange}
   */
  function rangeAt(start, end) {
    return range({ loc: { start, end } });
  }

  /**
   * @returns {SourceRange}
   */
  function fileRange() {
    const lastLine = Math.max(0, lineIndex.lineCount - 1);
    const bounds = lineIndex.lineBounds(lastLine);
    return {
      fileId,
      startLine: 0,
      startColumn: 0,
      endLine: lastLine,
      endColumn: Math.max(0, bounds.contentEnd - bounds.start),
    };
  }

  /**
   * @returns {FileRecord}
   */
  function fileRecord() {
    return {
      fileId,
      path: normalizedPath,
      language: 'javascript',
      contentHash: hashHex(source),
      sizeBytes: new TextEncoder().encode(source).length,
      lineCount: lineIndex.lineCount,
      generated: false,
    };
  }

  return {
    path: normalizedPath,
    fileId,
    text: source,
    lineIndex,
    lineCount: lineIndex.lineCount,
    range,
    rangeAt,
    fileRecord,
    fileRange,
  };
}
