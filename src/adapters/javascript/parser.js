/**
 * JavaScript parser boundary.
 *
 * The adapter uses acorn for syntax and eslint-scope for lexical scope
 * analysis. Both are pure JavaScript libraries: nothing here reads a file,
 * executes workspace code, or touches the network.
 *
 * A parser failure is data, not an exception. Callers receive a typed result
 * with a diagnostic so the adapter can emit a valid, honest CSR run.
 */

import { parse } from 'acorn';
import { analyze } from 'eslint-scope';

const ECMA_VERSION = 'latest';
const SCOPE_ECMA_VERSION = 2024;

/**
 * @typedef {Object} ParseDiagnostic
 * @property {'parse_error'|'unsupported_syntax'} code
 * @property {string} message
 * @property {number} [line]
 * @property {number} [column]
 */

/**
 * @typedef {Object} ParseSuccess
 * @property {true} ok
 * @property {import('acorn').Program} ast
 * @property {ReturnType<typeof analyze>} scopeManager
 * @property {string} text
 * @property {number} bomLength
 */

/**
 * @typedef {Object} ParseFailure
 * @property {false} ok
 * @property {ParseDiagnostic} diagnostic
 * @property {string} text
 * @property {number} bomLength
 */

/**
 * Strip a UTF-8 BOM for parsing. Offsets and locations are relative to the
 * returned text, and the caller must use the same text for line indexing.
 *
 * @param {unknown} value
 * @returns {{text: string, bomLength: number}}
 */
export function stripBom(value) {
  const source = String(value ?? '');
  return source.charCodeAt(0) === 0xfeff
    ? { text: source.slice(1), bomLength: 1 }
    : { text: source, bomLength: 0 };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function sanitizeMessage(value) {
  return String(value ?? '')
    .replace(/[A-Za-z]:[\\/][^\s"']+/g, '<path>')
    .replace(/\/[^\s"']+\.[cm]?js\b/g, '<path>')
    .slice(0, 500);
}

/**
 * @param {unknown} error
 * @param {string} sourceType
 * @param {string} text
 * @returns {ParseDiagnostic}
 */
function diagnosticFor(error, text = '') {
  const candidate =
    /** @type {{message?: unknown, pos?: number, loc?: {line?: number, column?: number}}} */ (
      error
    );
  const message = sanitizeMessage(candidate.message ?? 'JavaScript could not be parsed.');
  // Acorn reports a bare "Unexpected token"; inspect the offending character so
  // JSX/TSX can be named as unsupported syntax instead of a generic parse error.
  const offset = typeof candidate.pos === 'number' ? candidate.pos : -1;
  const offending = offset >= 0 ? text.slice(offset, offset + 1) : '';
  const jsx = /JSX/i.test(message) || offending === '<';
  const hint = jsx ? ' JSX is not supported in V1.' : '';
  return {
    code: jsx ? 'unsupported_syntax' : 'parse_error',
    message: `${message}${hint}`,
    ...(candidate.loc?.line ? { line: Number(candidate.loc.line) } : {}),
    ...(candidate.loc?.column !== undefined ? { column: Number(candidate.loc.column) } : {}),
  };
}

/**
 * @param {string} text
 * @param {'module'|'script'} sourceType
 * @returns {import('acorn').Program}
 */
export function parseOnly(text, sourceType) {
  return parse(text, {
    ecmaVersion: ECMA_VERSION,
    sourceType,
    locations: true,
    ranges: true,
    allowHashBang: true,
  });
}

/**
 * Parse a JavaScript module or script and run lexical scope analysis.
 *
 * @param {unknown} source
 * @param {{sourceType?: 'module'|'script', withScope?: boolean}} [options]
 * @returns {ParseSuccess|ParseFailure}
 */
export function parseJavaScript(source, options = {}) {
  const { text, bomLength } = stripBom(source);
  const sourceType = options.sourceType === 'script' ? 'script' : 'module';
  let ast;
  try {
    ast = parseOnly(text, sourceType);
  } catch (error) {
    return { ok: false, diagnostic: diagnosticFor(error, text), text, bomLength };
  }

  if (options.withScope === false) {
    return {
      ok: true,
      ast,
      scopeManager: /** @type {ReturnType<typeof analyze>} */ (null),
      text,
      bomLength,
    };
  }

  try {
    const scopeManager = analyze(ast, {
      ecmaVersion: SCOPE_ECMA_VERSION,
      sourceType,
      optimistic: true,
      ignoreEval: false,
      impliedStrict: sourceType === 'module',
      fallback: 'iteration',
    });
    return { ok: true, ast, scopeManager, text, bomLength };
  } catch (error) {
    return {
      ok: false,
      diagnostic: {
        code: 'parse_error',
        message: `Scope analysis failed for this file: ${sanitizeMessage(
          /** @type {{message?: unknown}} */ (error).message,
        )}`,
        .../** @type {{loc?: {line?: number, column?: number}} } */ (
          error.loc?.line
            ? {
                line: Number(/** @type {{loc?: {line?: number}} } */ (error).loc?.line),
              }
            : {}
        ),
      },
      text,
      bomLength,
    };
  }
}

/**
 * @param {unknown} node
 * @returns {node is Record<string, any>}
 */
function isNode(node) {
  return typeof node === 'object' && node !== null && typeof node.type === 'string';
}

/**
 * Yield child AST nodes without a hard-coded visitor-key table. Acorn emits
 * standard ESTree objects, so walking own enumerable properties is complete and
 * stays correct when a new node kind appears.
 *
 * @param {Record<string, any>} node
 * @returns {Generator<Record<string, any>>}
 */
export function* childNodes(node) {
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'range' || key === 'start' || key === 'end') {
      continue;
    }
    if (Array.isArray(value)) {
      for (const entry of value) {
        if (isNode(entry)) {
          yield entry;
        }
      }
    } else if (isNode(value)) {
      yield value;
    }
  }
}

/**
 * Collect module requests without building a graph. The host uses this to read
 * relative dependencies; the adapter re-parses with scope analysis.
 *
 * @param {unknown} source
 * @param {{sourceType?: 'module'|'script'}} [options]
 * @returns {{ok: true, specifiers: Array<{specifier: string, kind: string, dynamic: boolean}>} | {ok: false, diagnostic: ParseDiagnostic, specifiers: []}}
 */
export function collectModuleSpecifiers(source, options = {}) {
  const { text } = stripBom(source);
  const sourceType = options.sourceType === 'script' ? 'script' : 'module';
  let ast;
  try {
    ast = parseOnly(text, sourceType);
  } catch (error) {
    return { ok: false, diagnostic: diagnosticFor(error, text), specifiers: [] };
  }

  /** @type {Map<string, {specifier: string, kind: string, dynamic: boolean}>} */
  const found = new Map();
  /** @param {string} specifier @param {string} kind @param {boolean} dynamic */
  function add(specifier, kind, dynamic) {
    if (typeof specifier === 'string' && specifier.length > 0 && !found.has(specifier)) {
      found.set(specifier, { specifier, kind, dynamic });
    }
  }

  /** @param {Record<string, any>} node */
  function visit(node) {
    if (node.type === 'ImportDeclaration') {
      add(node.source?.value, 'import', false);
    } else if (node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') {
      if (node.source) {
        add(node.source.value, 'export', false);
      }
    } else if (node.type === 'ImportExpression') {
      if (node.source?.type === 'Literal' && typeof node.source.value === 'string') {
        add(node.source.value, 'dynamic-import', true);
      }
    } else if (
      node.type === 'CallExpression' &&
      node.callee?.type === 'Identifier' &&
      node.callee.name === 'require' &&
      node.arguments?.length === 1 &&
      node.arguments[0]?.type === 'Literal' &&
      typeof node.arguments[0].value === 'string'
    ) {
      add(node.arguments[0].value, 'require', true);
    }
    for (const child of childNodes(node)) {
      visit(child);
    }
  }

  visit(ast);
  return { ok: true, specifiers: [...found.values()] };
}
