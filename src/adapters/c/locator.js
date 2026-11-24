/**
 * C Language Source Locator (Phase 13 §3, P13-02, AC-13.1, AC-13.2).
 *
 * Normalizes Clang AST 1-based byte positions into CSR 0-based lines and UTF-16 columns
 * for C source files (.c) and headers (.h).
 */

import { createFileId } from '../../core/csr/identity.js';

/**
 * @param {{
 *   workspaceRoot?: string,
 *   tuPath: string,
 *   text?: string,
 *   language?: string,
 * }} options
 */
export function createSourceLocator({ workspaceRoot, tuPath, text, language = 'c' }) {
  const root = typeof workspaceRoot === 'string' ? toPosix(workspaceRoot).replace(/\/$/, '') : '';
  const normalizedTu = toPosix(tuPath);
  const tuLines = splitLines(stripBom(typeof text === 'string' ? text : ''));
  /** @type {Map<string, {maxLine: number, language: string}>} */
  const files = new Map();

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

  return {
    tuFile: normalizedTu,
    tuFileId: createFileId(normalizedTu),
    ensureFile,

    rangeFor(node, inheritedFile) {
      if (!isObject(node)) return null;
      const range = isObject(node.range) ? node.range : {};
      const begin = isObject(range.begin) ? range.begin : (node.loc ?? {});
      const end = isObject(range.end) ? range.end : begin;

      const pBegin = position(begin, inheritedFile);
      const pEnd = position(end, pBegin.file ?? inheritedFile);
      const targetFile = pBegin.file ?? pEnd.file ?? inheritedFile ?? normalizedTu;
      const fileId = ensureFile(targetFile, Math.max(pBegin.line, pEnd.line) + 1);

      return {
        fileId: fileId ?? createFileId(targetFile),
        startLine: pBegin.line,
        startColumn: pBegin.column,
        endLine: Math.max(pBegin.line, pEnd.line),
        endColumn: Math.max(pBegin.column, pEnd.column),
      };
    },

    fileRecords() {
      if (!files.has(normalizedTu)) {
        files.set(normalizedTu, {
          maxLine: Math.max(0, countLines(text ?? '') - 1),
          language,
        });
      }
      return Array.from(files.entries()).map(([filePath, info]) => ({
        fileId: createFileId(filePath),
        path: filePath,
        language: info.language,
        contentHash: `clang:${filePath}`,
        sizeBytes: filePath === normalizedTu ? byteLength(text ?? '') : 0,
        lineCount: Math.max(1, info.maxLine + 1),
        generated: false,
      }));
    },
  };
}

function byteLength(value) {
  let bytes = 0;
  for (const ch of String(value ?? '')) {
    const code = ch.charCodeAt(0);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
  return bytes;
}

function toPosix(val) {
  return String(val ?? '').replace(/\\/g, '/');
}

function normalizeRelative(val) {
  return toPosix(val).replace(/^\.\//, '').replace(/\/+/g, '/');
}

function splitLines(str) {
  return str.split(/\r\n|\r|\n/);
}

function countLines(str) {
  return splitLines(str).length;
}

function stripBom(str) {
  return str.charCodeAt(0) === 0xfeff ? str.slice(1) : str;
}

function utf16Column(line, byteCol) {
  let b = 0;
  let u = 0;
  for (const ch of line) {
    if (b >= byteCol) break;
    const code = ch.charCodeAt(0);
    b += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
    u += ch.length;
  }
  return u;
}

function extensionLanguage(filePath, fallback) {
  const norm = filePath.toLowerCase();
  if (norm.endsWith('.c') || norm.endsWith('.h')) return 'c';
  if (norm.endsWith('.cpp') || norm.endsWith('.cc') || norm.endsWith('.cxx')) return 'cpp';
  return fallback;
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
