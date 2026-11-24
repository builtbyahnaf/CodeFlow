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

/**
 * @param {{
 *   runId: string,
 *   path: string,
 *   text: string,
 *   workspaceRoot?: string,
 *   language?: 'cpp' | 'c',
 * }} input
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function parseCppSource(input) {
  const { runId, path: rawPath, text = '', language = 'cpp' } = input;
  const filePath = normalizePath(rawPath);
  const fileId = createFileId(filePath);

  const lines = text.split('\n');
  const lineStarts = [0];
  for (let i = 0; i < lines.length - 1; i += 1) {
    lineStarts.push(lineStarts[i] + lines[i].length + 1);
  }
  const rangeOf = (startOffset, endOffset) => {
    const start = offsetToPos(lineStarts, Math.max(0, startOffset));
    const end = offsetToPos(lineStarts, Math.max(0, endOffset));
    return {
      fileId,
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column,
      startOffset,
      endOffset,
    };
  };
  const allocator = createIdentityAllocator({ language });
  const relAllocator = createRelationshipAllocator();

  const fileSymbolId = allocator.symbol({
    path: filePath,
    kind: 'file',
    qualifiedName: filePath,
  }).symbolId;

  const fileSymbol = createSymbol({
    symbolId: fileSymbolId,
    kind: 'file',
    name: filePath.split('/').pop() || filePath,
    qualifiedName: filePath,
    language,
    declaration: rangeOf(0, Math.min(10, text.length)),
    visibility: 'public',
  });

  const symbols = [fileSymbol];
  const controlConstructs = [];
  const relationships = [];
  const functionSymbolsByName = new Map();
  const masked = maskCommentsAndStrings(text);
  const fnRegex = /(?:^|[;}{\n])\s*([a-zA-Z_~][a-zA-Z0-9_:<>&*,\s]*?)\s+([a-zA-Z_~][a-zA-Z0-9_]*)\s*\(/g;
  let match;
  while ((match = fnRegex.exec(masked)) !== null) {
    const fnName = match[2];
    if (CPP_KEYWORDS.has(fnName)) {
      continue;
    }

    const parenOpen = fnRegex.lastIndex - 1;
    const parenClose = findMatchingParen(masked, parenOpen);
    if (parenClose === -1) {
      continue;
    }

    let braceIndex = parenClose + 1;
    while (braceIndex < masked.length && /\s/.test(masked[braceIndex])) {
      braceIndex += 1;
    }

    const afterParen = masked.slice(parenClose + 1, Math.min(masked.length, parenClose + 120));
    const braceMatch = afterParen.match(/^[^{;]*\{/);
    if (!braceMatch) {
      continue;
    }

    const openBrace = parenClose + 1 + braceMatch[0].length - 1;
    const closeBrace = findMatchingBrace(masked, openBrace);
    if (closeBrace === -1) {
      continue;
    }
    const declStart = match.index + (match[0].indexOf(match[1]) || 0);
    const declRange = rangeOf(declStart, closeBrace + 1);

    const symId = allocator.symbol({
      path: filePath,
      kind: 'function',
      qualifiedName: fnName,
    }).symbolId;

    const fnSymbol = createSymbol({
      symbolId: symId,
      kind: 'function',
      name: fnName,
      qualifiedName: fnName,
      language,
      declaration: declRange,
      visibility: 'public',
    });

    symbols.push(fnSymbol);
    functionSymbolsByName.set(fnName, fnSymbol);

    const bodyText = masked.slice(openBrace + 1, closeBrace);
    const bodyOffset = openBrace + 1;
    parseBodyConstructs(bodyText, bodyOffset, symId, rangeOf, controlConstructs, relationships);
    fnRegex.lastIndex = closeBrace + 1;
  }
  // functions loop done
}

/**
 * Parse statements and control constructs inside a function body.
 *
 * @param {string} body
 * @param {number} baseOffset
 * @param {string} fnSymbolId
 * @param {Function} rangeOf
 * @param {Array<any>} constructs
 * @param {Array<any>} relationships
 */
function parseBodyConstructs(
  body,
  baseOffset,
  fnSymbolId,
  rangeOf,
  constructs,
  relationships,
) {
  let counter = 0;
  const nextId = (kind) => `${fnSymbolId}:cc:${kind}:${(counter += 1)}`;
  const keywordRegex = /\b(if|for|while|do|switch|case|default|return|break|continue|goto)\b|([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
  let m;
  while ((m = keywordRegex.exec(body)) !== null) {
    const kw = m[1];
    const offset = baseOffset + m.index;
    if (kw === 'return') {
      const semi = body.indexOf(';', m.index);
      const endOff = semi !== -1 ? baseOffset + semi + 1 : offset + 6;
      constructs.push(
        createControlConstruct({
          constructId: nextId('return'),
          kind: 'return',
          symbolId: fnSymbolId,
          sourceRange: rangeOf(offset, endOff),
        }),
      );
    } else if (kw === 'break' || kw === 'continue') {
      const semi = body.indexOf(';', m.index);
      const endOff = semi !== -1 ? baseOffset + semi + 1 : offset + kw.length;
      constructs.push(
        createControlConstruct({
          constructId: nextId(kw),
          kind: kw,
          symbolId: fnSymbolId,
          sourceRange: rangeOf(offset, endOff),
        }),
      );
    }
else if (kw === 'if') {
      const parenOpen = body.indexOf('(', m.index);
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(body, parenOpen);
        if (parenClose !== -1) {
          const condRange = rangeOf(baseOffset + parenOpen, baseOffset + parenClose + 1);
          constructs.push(
            createControlConstruct({
              constructId: nextId('if'),
              kind: 'if',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(offset, baseOffset + parenClose + 1),
            }),
          );
        }
      }
    }
else if (kw === 'while') {
      const parenOpen = body.indexOf('(', m.index);
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(body, parenOpen);
        if (parenClose !== -1) {
          const condRange = rangeOf(baseOffset + parenOpen, baseOffset + parenClose + 1);
          constructs.push(
            createControlConstruct({
              constructId: nextId('while'),
              kind: 'while',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(offset, baseOffset + parenClose + 1),
            }),
          );
        }
      }
    } else if (kw === 'for') {
      const parenOpen = body.indexOf('(', m.index);
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(body, parenOpen);
        if (parenClose !== -1) {
          const condRange = rangeOf(baseOffset + parenOpen, baseOffset + parenClose + 1);
          constructs.push(
            createControlConstruct({
              constructId: nextId('for'),
              kind: 'for',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(offset, baseOffset + parenClose + 1),
              extensions: { hasInit: true, hasCondition: true, hasUpdate: true },
            }),
          );
        }
      }
    }
else if (kw === 'switch') {
      const parenOpen = body.indexOf('(', m.index);
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(body, parenOpen);
        if (parenClose !== -1) {
          const condRange = rangeOf(baseOffset + parenOpen, baseOffset + parenClose + 1);
          constructs.push(
            createControlConstruct({
              constructId: nextId('switch'),
              kind: 'switch',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(offset, baseOffset + parenClose + 1),
            }),
          );
        }
      }
    } else if (kw === 'case' || kw === 'default') {
      const colon = body.indexOf(':', m.index);
      const endOff = colon !== -1 ? baseOffset + colon + 1 : offset + kw.length;
      constructs.push(
        createControlConstruct({
          constructId: nextId(kw),
          kind: kw,
          symbolId: fnSymbolId,
          sourceRange: rangeOf(offset, endOff),
        }),
      );
    }
    // calls check
  }
}
