/**
 * Java Language Source Locator (Phase 14 §3, P14-02, AC-14.1, AC-14.2).
 *
 * Normalizes Java AST 1-based byte/character positions into CSR 0-based lines and UTF-16 columns
 * for Java source files (.java).
 */

import { createFileId } from '../../core/csr/identity.js';

/**
 * @param {{
 *   workspaceRoot?: string,
 *   cuPath: string,
 *   text?: string,
 *   language?: string,
 * }} options
 */
export function createSourceLocator({ workspaceRoot, cuPath, text, language = 'java' }) {
  const root = typeof workspaceRoot === 'string' ? toPosix(workspaceRoot).replace(/\/$/, '') : '';
  const normalizedCu = toPosix(cuPath);
  const cuLines = splitLines(stripBom(typeof text === 'string' ? text : ''));
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
      filePath === normalizedCu ? Math.max(0, countLines(text ?? '') - 1) : 0,
    );
    if (existing) {
      existing.maxLine = Math.max(existing.maxLine, maxLine);
      return createFileId(filePath);
    }
    files.set(filePath, {
      maxLine,
      language,
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
    const byteColumn = Math.max(0, Number(record.col ?? record.column ?? 1) - 1);
    const column =
      file === normalizedCu && cuLines.length > 0
        ? utf16Column(cuLines[Math.min(line, cuLines.length - 1)] ?? '', byteColumn)
        : byteColumn;
    return { file, line, column };
  }

  return {
    cuFile: normalizedCu,
    cuFileId: createFileId(normalizedCu),
    ensureFile,

    rangeFor(node, inheritedFile) {
      if (!isObject(node)) return null;
      const range = isObject(node.range) ? node.range : {};
      const begin = isObject(range.begin) ? range.begin : (node.loc ?? {});
      const end = isObject(range.end) ? range.end : begin;

      const pBegin = position(begin, inheritedFile);
      const pEnd = position(end, pBegin.file ?? inheritedFile);
      const targetFile = pBegin.file ?? pEnd.file ?? inheritedFile ?? normalizedCu;
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
      if (!files.has(normalizedCu)) {
        files.set(normalizedCu, {
          maxLine: Math.max(0, countLines(text ?? '') - 1),
          language,
        });
      }
      return Array.from(files.entries()).map(([filePath, info]) => ({
        fileId: createFileId(filePath),
        path: filePath,
        language: info.language,
        contentHash: `java:${filePath}`,
        sizeBytes: filePath === normalizedCu ? byteLength(text ?? '') : 0,
        lineCount: Math.max(1, info.maxLine + 1),
        generated: false,
      }));
    },
  };
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

function byteLength(value) {
  let bytes = 0;
  for (const ch of String(value ?? '')) {
    const code = ch.charCodeAt(0);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : 3;
  }
  return bytes;
}

function isObject(val) {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}
