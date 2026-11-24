import {
  createAnalysisRun,
  createDiagnostic,
  createFileRecord,
  createRelationship,
  createSymbol,
  createControlConstruct,
} from '../../core/csr/entities.js';
import {
  createFileId,
  createIdentityAllocator,
  createRelationshipAllocator,
  normalizePath,
} from '../../core/csr/identity.js';
import { shortHash } from '../../core/csr/hash.js';

/**
 * Built-in pure JavaScript C/C++ syntactic analyzer.
 *
 * Provides a self-contained, frictionless fallback engine when Clang is absent.
 * It extracts functions, control-flow constructs (if/for/while/switch/return),
 * and call relationships with exact source-range fidelity directly from source text.
 *
 * No external dependencies, no compilers, no process spawning.
 */

export const BUILTIN_ENGINE_VERSION = '1.2.0';

/**
 * Convert character offset to 0-based { line, column }.
 *
 * @param {number[]} lineStarts
 * @param {number} offset
 * @returns {{ line: number, column: number }}
 */
export function offsetToPos(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  let line = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset) {
      line = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return { line, column: Math.max(0, offset - lineStarts[line]) };
}

/**
 * Mask comments and strings to spaces, preserving exact character positions and newlines.
 *
 * @param {string} text
 * @returns {string}
 */
export function maskCommentsAndStrings(text) {
  const chars = text.split('');
  const len = chars.length;
  let i = 0;

  while (i < len) {
    const c = chars[i];
    const next = i + 1 < len ? chars[i + 1] : '';

    if (c === '#' && (i === 0 || chars[i - 1] === '\n')) {
      while (i < len && chars[i] !== '\n') {
        chars[i] = ' ';
        i += 1;
      }
    } else if (c === '/' && next === '/') {
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i += 2;
      while (i < len && chars[i] !== '\n') {
        chars[i] = ' ';
        i += 1;
      }
    } else if (c === '/' && next === '*') {
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i += 2;
      while (i < len && !(chars[i] === '*' && i + 1 < len && chars[i + 1] === '/')) {
        if (chars[i] !== '\n') {
          chars[i] = ' ';
        }
        i += 1;
      }
      if (i < len) {
        chars[i] = ' ';
        if (i + 1 < len) chars[i + 1] = ' ';
        i += 2;
      }
    } else if (c === '"' || c === "'") {
      const quote = c;
      chars[i] = ' ';
      i += 1;
      while (i < len && chars[i] !== quote && chars[i] !== '\n') {
        if (chars[i] === '\\' && i + 1 < len) {
          chars[i] = ' ';
          i += 1;
        }
        chars[i] = ' ';
        i += 1;
      }
      if (i < len && chars[i] === quote) {
        chars[i] = ' ';
        i += 1;
      }
    } else {
      i += 1;
    }
  }

  return chars.join('');
}

/**
 * Find matching closing parenthesis from an opening '('.
 *
 * @param {string} text
 * @param {number} openParenIndex
 * @returns {number} index of matching ')' or -1
 */
export function findMatchingParen(text, openParenIndex) {
  let depth = 0;
  for (let i = openParenIndex; i < text.length; i += 1) {
    if (text[i] === '(') depth += 1;
    else if (text[i] === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Find matching closing brace from an opening '{'.
 *
 * @param {string} text
 * @param {number} openBraceIndex
 * @returns {number} index of matching '}' or -1
 */
export function findMatchingBrace(text, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < text.length; i += 1) {
    if (text[i] === '{') depth += 1;
    else if (text[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

export const CPP_KEYWORDS = new Set([
  'if',
  'else',
  'for',
  'while',
  'do',
  'switch',
  'case',
  'default',
  'return',
  'break',
  'continue',
  'goto',
  'try',
  'catch',
  'throw',
  'sizeof',
  'typeof',
  'alignof',
  'decltype',
  'template',
  'class',
  'struct',
  'union',
  'enum',
  'namespace',
  'public',
  'protected',
  'private',
  'typedef',
  'using',
  'static_assert',
]);
