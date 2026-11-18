/**
 * Source-location conversion for Clang AST JSON.
 *
 * Clang reports byte-based columns and 1-based lines. CSR requires 0-based
 * lines and UTF-16 columns. When the source text is available (the translation
 * unit), columns are converted exactly; for files whose text was not supplied,
 * ASCII columns are assumed and the limitation is documented.
 */

import { createFileId } from '../../core/csr/identity.js';

/**
 * @typedef {import('../../core/csr/entities.js').SourceRange} SourceRange
 * @typedef {import('../../core/csr/entities.js').FileRecord} FileRecord
 */

/**
 * @param {{
 *   workspaceRoot?: string,
 *   tuPath: string,
 *   text?: string,
 *   language?: string,
 * }} options
 */
export function createSourceLocator({ workspaceRoot, tuPath, text, language = 'cpp' }) {
  const root = typeof workspaceRoot === 'string' ? toPosix(workspaceRoot).replace(/\/$/, '') : '';
  const normalizedTu = toPosix(tuPath);
  const tuLines = splitLines(stripBom(typeof text === 'string' ? text : ''));
  /** @type {Map<string, {maxLine: number, language: string}>} */
  const files = new Map();

  /**
   * @param {string} raw
   * @param {string} [fallback]
   * @returns {string|null}
   */
  function toWorkspacePath(raw, fallback) {
    const value =
      typeof raw === 'string' && raw.length > 0 ? toPosix(raw) : toPosix(fallback ?? '');
    if (value.length === 0) {
      return null;
    }
    if (root.length > 0) {
      const lowerRoot = root.toLowerCase();
      const lowerValue = value.toLowerCase();
      if (lowerValue === lowerRoot) {
        return '';
      }
      if (lowerValue.startsWith(`${lowerRoot}/`)) {
        return normalizeRelative(value.slice(root.length + 1));
      }
    }
    if (/^[A-Za-z]:\//.test(value) || value.startsWith('/')) {
      return null;
    }
    return normalizeRelative(value);
  }

  /**
   * @param {string|null} filePath
   * @param {number} [lineHint] 1-based Clang line
   * @returns {string|null}
   */
  function ensureFile(filePath, lineHint) {
    if (!filePath) {
      return null;
    }
    const existing = files.get(filePath);
    const maxLine = Math.max(
      0,
      Number.isInteger(lineHint) ? lineHint - 1 : 0,
      filePath === normalizedTu ? Math.max(0, countLines(text ?? '') - 1) : 0,
    );
    if (existing) {
      existing.maxLine = Math.max(existing.maxLine, maxLine);
      return createFileId(filePath);
    }
    files.set(filePath, {
      maxLine,
      language: extensionLanguage(filePath, language),
    });
    return createFileId(filePath);
  }

  /**
   * @param {Record<string, unknown> | undefined} loc
   * @param {string} [inheritedFile]
   * @returns {{file: string|null, line: number, column: number}}
   */
  function position(loc, inheritedFile) {
    const record = isObject(loc) ? loc : {};
    const file = toWorkspacePath(
      typeof record.file === 'string' ? record.file : undefined,
      inheritedFile,
    );
    const line = Math.max(0, Number(record.line ?? 1) - 1);
    const byteColumn = Math.max(0, Number(record.col ?? 1) - 1);
    const column =
      file === normalizedTu && tuLines.length > 0
        ? utf16Column(tuLines[Math.min(line, tuLines.length - 1)] ?? '', byteColumn)
        : byteColumn;
    return { file, line, column };
  }

  /**
   * @param {Record<string, unknown> | undefined} node
   * @param {string} [inheritedFile]
   * @returns {SourceRange|null}
   */
  function rangeFor(node, inheritedFile) {
    if (!isObject(node)) {
      return null;
    }
    const range = isObject(node.range) ? node.range : null;
    if (range) {
      const begin = position(isObject(range.begin) ? range.begin : undefined, inheritedFile);
      const end = position(
        isObject(range.end) ? range.end : undefined,
        begin.file ?? inheritedFile,
      );
      const file = begin.file ?? end.file ?? toWorkspacePath(undefined, inheritedFile);
      if (!file) {
        return null;
      }
      const fileId = ensureFile(file, begin.line + 1);
      ensureFile(file, end.line + 1);
      const endLine = Math.max(begin.line, end.line);
      let endColumn = end.column;
      if (endLine === begin.line && endColumn <= begin.column) {
        endColumn = begin.column + 1;
      }
      return {
        fileId: fileId ?? createFileId(file),
        startLine: begin.line,
        startColumn: begin.column,
        endLine,
        endColumn,
      };
    }

    const only = position(isObject(node.loc) ? node.loc : undefined, inheritedFile);
    if (!only.file) {
      return null;
    }
    const fileId = ensureFile(only.file, only.line + 1);
    return {
      fileId: fileId ?? createFileId(only.file),
      startLine: only.line,
      startColumn: only.column,
      endLine: only.line,
      endColumn: only.column + 1,
    };
  }

  /**
   * @returns {FileRecord[]}
   */
  function fileRecords() {
    return [...files.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([filePath, meta]) => ({
        fileId: createFileId(filePath),
        path: filePath,
        language: meta.language,
        contentHash: `clang:${filePath}`,
        sizeBytes: filePath === normalizedTu ? byteLength(text ?? '') : 0,
        lineCount: Math.max(1, meta.maxLine + 1),
        generated: false,
      }));
  }

  return {
    tuPath: normalizedTu,
    toWorkspacePath,
    ensureFile,
    position,
    rangeFor,
    fileIdFor: (filePath) => createFileId(filePath),
    fileRecords,
    files: () => new Map(files),
  };
}

/**
 * @param {string} value
 * @returns {string[]}
 */
export function splitLines(value) {
  return value.split(/\r\n|\r|\n/);
}

/**
 * Count logical lines. A trailing newline terminates the previous line rather
 * than starting an extra empty one, which keeps `lineCount` aligned with what
 * an editor shows.
 *
 * @param {string} value
 * @returns {number}
 */
export function countLines(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return 1;
  }
  const lines = splitLines(value);
  if (lines.length > 1 && lines[lines.length - 1] === '' && /(?:\r\n|\r|\n)$/.test(value)) {
    return lines.length - 1;
  }
  return lines.length;
}

/**
 * @param {string} value
 * @returns {string}
 */
function stripBom(value) {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

/**
 * @param {string} line
 * @param {number} byteColumn
 * @returns {number}
 */
export function utf16Column(line, byteColumn) {
  if (byteColumn <= 0) {
    return 0;
  }
  let bytes = 0;
  let index = 0;
  for (const character of line) {
    if (bytes >= byteColumn) {
      break;
    }
    const codePoint = character.codePointAt(0) ?? 0;
    const width = utf8Width(codePoint);
    if (bytes + width > byteColumn) {
      break;
    }
    bytes += width;
    index += character.length;
  }
  return index;
}

/**
 * @param {number} codePoint
 * @returns {number}
 */
function utf8Width(codePoint) {
  if (codePoint <= 0x7f) {
    return 1;
  }
  if (codePoint <= 0x7ff) {
    return 2;
  }
  if (codePoint <= 0xffff) {
    return 3;
  }
  return 4;
}

/**
 * @param {string} value
 * @returns {string}
 */
function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalizeRelative(value) {
  /** @type {string[]} */
  const segments = [];
  for (const segment of value.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments.join('/');
}

/**
 * @param {string} filePath
 * @param {string} fallback
 * @returns {string}
 */
function extensionLanguage(filePath, fallback) {
  if (/\.(c|h)$/i.test(filePath)) {
    return 'c';
  }
  return /\.(cpp|cc|cxx|c\+\+|hpp|hh|hxx|ipp)$/i.test(filePath) ? 'cpp' : fallback;
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {string} value
 * @returns {number}
 */
function byteLength(value) {
  let bytes = 0;
  for (const character of value) {
    bytes += utf8Width(character.codePointAt(0) ?? 0);
  }
  return bytes;
}
