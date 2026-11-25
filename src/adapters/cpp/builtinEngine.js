import {
  createAnalysisRun,
  createDiagnostic,
  createFileRecord,
  createRelationship,
  createSymbol,
  createControlConstruct,
  createDataFact,
} from '../../core/csr/entities.js';
import {
  createFileId,
  createIdentityAllocator,
  normalizePath,
} from '../../core/csr/identity.js';
import { shortHash } from '../../core/csr/hash.js';

/**
 * Built-in pure JavaScript C/C++ syntactic analyzer.
 *
 * Provides a self-contained, frictionless fallback engine when Clang is absent.
 * It extracts functions, control-flow constructs (if/for/while/switch/return),
 * call relationships, parameter declarations, return types, and data-flow facts
 * directly from source text.
 *
 * No external dependencies, no compilers, no process spawning.
 */

export const BUILTIN_ENGINE_VERSION = '1.3.0';

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
      while (i < len && chars[i] !== quote) {
        if (chars[i] === '\\' && i + 1 < len) {
          chars[i] = ' ';
          i += 1;
        }
        if (chars[i] !== '\n') {
          chars[i] = ' ';
        }
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
 * Parse function parameters from parameter string.
 *
 * @param {string} paramStr
 * @param {Function} rangeOf
 * @param {number} startOffset
 * @returns {Array<{name: string, type: string, defaultValue: string|null, range: any}>}
 */
export function parseParameters(paramStr, rangeOf, startOffset) {
  if (!paramStr || !paramStr.trim()) {
    return [];
  }
  const parts = [];
  let current = '';
  let angleDepth = 0;
  let partStart = 0;

  for (let i = 0; i < paramStr.length; i += 1) {
    const c = paramStr[i];
    if (c === '<') angleDepth += 1;
    else if (c === '>') angleDepth = Math.max(0, angleDepth - 1);
    else if (c === ',' && angleDepth === 0) {
      parts.push({ text: current.trim(), start: partStart, end: i });
      current = '';
      partStart = i + 1;
      continue;
    }
    current += c;
  }
  if (current.trim()) {
    parts.push({ text: current.trim(), start: partStart, end: paramStr.length });
  }

  return parts.map(({ text: part, start, end }) => {
    let defVal = null;
    let main = part;
    if (part.includes('=')) {
      const idx = part.indexOf('=');
      defVal = part.slice(idx + 1).trim();
      main = part.slice(0, idx).trim();
    }
    const match = main.match(/(.*[\s*&])([a-zA-Z_][a-zA-Z0-9_]*)$/);
    const range = rangeOf(startOffset + start, startOffset + end);
    if (match) {
      return {
        name: match[2].trim(),
        type: match[1].trim(),
        defaultValue: defVal,
        range,
      };
    }
    return {
      name: '',
      type: main.trim(),
      defaultValue: defVal,
      range,
    };
  });
}

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
/**
 * Convert an input path into a clean workspace-relative POSIX path so CSR
 * validation never sees an absolute filesystem path.
 *
 * @param {string} rawPath
 * @param {string} [workspaceRoot]
 * @returns {string}
 */
function toRelativeEnginePath(rawPath, workspaceRoot) {
  let clean = normalizePath(rawPath);
  if (typeof workspaceRoot === 'string' && workspaceRoot.length > 0) {
    const cleanRoot = normalizePath(workspaceRoot).replace(/\/+$/, '');
    const isWin = /^[A-Za-z]:/.test(cleanRoot);
    const left = isWin ? clean.toLowerCase() : clean;
    const right = isWin ? cleanRoot.toLowerCase() : cleanRoot;
    if (left.startsWith(`${right}/`)) {
      clean = clean.slice(cleanRoot.length + 1);
    }
  }
  if (/^[A-Za-z]:\//.test(clean) || clean.startsWith('/')) {
    clean = clean.split('/').pop() || 'unknown.cpp';
  }
  return clean || 'unknown.cpp';
}

export function parseCppSource(input) {
  const { runId, path: rawPath, text = '', workspaceRoot, language = 'cpp' } = input;
  const filePath = toRelativeEnginePath(rawPath, workspaceRoot);
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
  const dataFacts = [];
  const functionSymbolsByName = new Map();
  const masked = maskCommentsAndStrings(text);

  // Match function definitions including class members, operators, templates
  const fnRegex =
    /(?:^|[;}{\n])\s*(?:template\s*<[^>]*>\s*)?(?:(?:static|inline|virtual|explicit|constexpr|const|volatile|friend)\s+)*([a-zA-Z_~][a-zA-Z0-9_:<>&*,\s]*?)\s+((?:operator\s*(?:[+\-*/%^&|~!=<>]+|\[\]|\(\)|->)+|[a-zA-Z_~][a-zA-Z0-9_:]*))\s*\(/g;
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

    const returnType = match[1].trim();
    const rawParams = text.slice(parenOpen + 1, parenClose);
    const parsedParams = parseParameters(rawParams, rangeOf, parenOpen + 1);

    const fnSignature = `${returnType ? returnType + ' ' : ''}${fnName}(${rawParams.trim()})`;

    const fnSymbol = createSymbol({
      symbolId: symId,
      kind: 'function',
      name: fnName,
      qualifiedName: fnName,
      language,
      signature: fnSignature,
      declaration: declRange,
      visibility: 'public',
      extensions: {
        returnType,
        parameters: parsedParams,
        parameterNames: parsedParams.map((p) => p.name).filter(Boolean),
      },
    });

    symbols.push(fnSymbol);
    functionSymbolsByName.set(fnName, fnSymbol);

    // Register parameter symbols and data facts
    for (const p of parsedParams) {
      if (p.name) {
        symbols.push(
          createSymbol({
            symbolId: `${symId}:param:${p.name}`,
            kind: 'parameter',
            name: p.name,
            qualifiedName: `${fnName}.${p.name}`,
            language,
            parentId: symId,
            declaration: p.range || declRange,
            extensions: { type: p.type },
          }),
        );
        dataFacts.push(
          createDataFact({
            factId: `df:${symId}:param:${p.name}`,
            kind: 'definition',
            symbolId: symId,
            at: p.range || declRange,
            extensions: {
              variableName: p.name,
              variableType: p.type,
              role: 'parameter',
            },
          }),
        );
      }
    }

    const bodyText = text.slice(openBrace + 1, closeBrace);
    const maskedBody = masked.slice(openBrace + 1, closeBrace);
    const bodyOffset = openBrace + 1;

    let counter = 0;
    const nextId = (kind) => `${symId}:cc:${kind}:${(counter += 1)}`;
    let relCounter = 0;
    let factCounter = 0;

    const fnConstructs = parseBodyStatements({
      body: bodyText,
      maskedBody,
      baseOffset: bodyOffset,
      fnSymbolId: symId,
      parentConstructId: null,
      rangeOf,
      nextId,
      constructs: controlConstructs,
      relationships,
      dataFacts,
      getRelId: (target) => `rel:call:${symId}:${target}:${(relCounter += 1)}`,
      getFactId: () => `df:${symId}:fact:${(factCounter += 1)}`,
    });

    // Guarantee: Every function has at least one construct so CFG builds and appears in picker
    if (fnConstructs.length === 0) {
      controlConstructs.push(
        createControlConstruct({
          constructId: nextId('statement'),
          kind: 'statement',
          symbolId: symId,
          sourceRange: declRange,
          extensions: { label: `${fnName}()` },
        }),
      );
    }

    fnRegex.lastIndex = closeBrace + 1;
  }

  // Fallback if no functions were found in non-empty source
  if (symbols.length === 1 && text.trim().length > 0) {
    const mainSymId = allocator.symbol({
      path: filePath,
      kind: 'function',
      qualifiedName: 'main',
    }).symbolId;
    const fallbackFn = createSymbol({
      symbolId: mainSymId,
      kind: 'function',
      name: 'main',
      qualifiedName: 'main',
      language,
      signature: 'int main()',
      declaration: rangeOf(0, Math.min(100, text.length)),
      visibility: 'public',
      extensions: { returnType: 'int', parameters: [], parameterNames: [] },
    });
    symbols.push(fallbackFn);
    functionSymbolsByName.set('main', fallbackFn);

    let counter = 0;
    const nextId = (kind) => `${mainSymId}:cc:${kind}:${(counter += 1)}`;
    let relCounter = 0;
    let factCounter = 0;

    parseBodyStatements({
      body: text,
      maskedBody: masked,
      baseOffset: 0,
      fnSymbolId: mainSymId,
      parentConstructId: null,
      rangeOf,
      nextId,
      constructs: controlConstructs,
      relationships,
      dataFacts,
      getRelId: (target) => `rel:call:${mainSymId}:${target}:${(relCounter += 1)}`,
      getFactId: () => `df:${mainSymId}:fact:${(factCounter += 1)}`,
    });
  }

  // Resolve internal call relationships
  for (const rel of relationships) {
    if (functionSymbolsByName.has(rel.to)) {
      rel.to = functionSymbolsByName.get(rel.to).symbolId;
      rel.status = 'resolved';
    } else {
      rel.to = `external:${rel.to}`;
      rel.status = 'unresolved';
      rel.reasonCode = 'out_of_scope';
    }
  }

  const fileRecord = createFileRecord({
    fileId,
    path: filePath,
    language,
    contentHash: shortHash(text),
    sizeBytes: Buffer.byteLength(text, 'utf8'),
    lineCount: lines.length,
    generated: false,
  });

  const diagnostic = createDiagnostic({
    severity: 'info',
    code: 'builtin_engine',
    message: 'Analysed with CodeFlow built-in engine. Rich control & data flow ready.',
  });

  return createAnalysisRun({
    runId,
    adapterId: language === 'c' ? 'c-clang' : 'cpp-clang',
    adapterVersion: BUILTIN_ENGINE_VERSION,
    language,
    completeness: 'partial',
    scope: { kind: 'file', path: filePath },
    files: [fileRecord],
    symbols,
    controlConstructs,
    relationships,
    dataFacts,
    diagnostics: [diagnostic],
  });
}

/**
 * Extract embedded function calls within an expression slice.
 *
 * @param {string} exprText
 * @param {string} maskedExpr
 * @param {number} exprBaseOffset
 * @param {{
 *   fnSymbolId: string,
 *   parentConstructId: string|null,
 *   rangeOf: Function,
 *   nextId: Function,
 *   constructs: any[],
 *   relationships: any[],
 *   getRelId: Function,
 * }} ctx
 * @param {boolean} [emitConstructs]
 * @returns {any[]} created call constructs if emitConstructs is true
 */
function extractEmbeddedCalls(exprText, maskedExpr, exprBaseOffset, ctx, emitConstructs = false) {
  const created = [];
  const callRegex = /([a-zA-Z_~][a-zA-Z0-9_:]*)\s*\(/g;
  let m;
  while ((m = callRegex.exec(maskedExpr)) !== null) {
    const calleeName = m[1];
    if (CPP_KEYWORDS.has(calleeName)) {
      continue;
    }
    const parenOpen = m.index + m[0].length - 1;
    const parenClose = findMatchingParen(maskedExpr, parenOpen);
    const endOff = parenClose !== -1 ? parenClose + 1 : m.index + m[0].length;
    const siteRange = ctx.rangeOf(exprBaseOffset + m.index, exprBaseOffset + endOff);
    const argsText = parenClose !== -1 ? exprText.slice(parenOpen + 1, parenClose).trim() : '';

    ctx.relationships.push(
      createRelationship({
        relationshipId: ctx.getRelId(calleeName),
        type: 'calls',
        from: ctx.fnSymbolId,
        to: calleeName,
        status: 'inferred',
        site: siteRange,
      }),
    );

    if (emitConstructs) {
      const cc = createControlConstruct({
        constructId: ctx.nextId('call'),
        kind: 'call',
        symbolId: ctx.fnSymbolId,
        sourceRange: siteRange,
        extensions: {
          calleeName,
          label: `${calleeName}(${argsText})`,
        },
        ...(ctx.parentConstructId ? { parentId: ctx.parentConstructId } : {}),
      });
      ctx.constructs.push(cc);
      created.push(cc);
    }
  }
  return created;
}

/**
 * Recursively parse control constructs, calls, statements, and data facts within a code block.
 *
 * @param {any} ctx
 * @returns {any[]} list of constructs created at this hierarchical level
 */
export function parseBodyStatements(ctx) {
  return parseBodyStatementsInternal(ctx).list;
}

/**
 * @param {any} ctx
 * @returns {{list: any[], consumed: number}}
 */
function parseBodyStatementsInternal(ctx) {
  const {
    body,
    maskedBody,
    baseOffset,
    fnSymbolId,
    parentConstructId,
    rangeOf,
    nextId,
    constructs,
    relationships,
    dataFacts,
    getRelId,
    getFactId,
    maxStatements = Infinity,
  } = ctx;

  const levelConstructs = [];
  let cursor = 0;
  const len = body.length;

  while (cursor < len && levelConstructs.length < maxStatements) {
    // Skip whitespace
    while (cursor < len && /\s/.test(body[cursor])) {
      cursor += 1;
    }
    if (cursor >= len) break;

    const remaining = maskedBody.slice(cursor);
    const origRemaining = body.slice(cursor);

    // 1. IF CONSTRUCT: if (...) { ... } else { ... }
    const ifMatch = remaining.match(/^if\b/);
    if (ifMatch) {
      const parenOpen = remaining.indexOf('(');
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const condText = origRemaining.slice(parenOpen + 1, parenClose).trim();
          const condStart = baseOffset + cursor + parenOpen + 1;
          const condEnd = baseOffset + cursor + parenClose;
          const condRange = rangeOf(condStart, condEnd);
          const condMasked = remaining.slice(parenOpen + 1, parenClose);

          extractEmbeddedCalls(
            origRemaining.slice(parenOpen + 1, parenClose),
            condMasked,
            condStart,
            ctx,
            false,
          );

          // Find then body
          let afterParen = parenClose + 1;
          while (afterParen < remaining.length && /\s/.test(remaining[afterParen])) {
            afterParen += 1;
          }

          let thenBody = '';
          let thenOffset = 0;
          let thenRange = null;
          let nextCursor = 0;

          if (remaining[afterParen] === '{') {
            const openBrace = afterParen;
            const closeBrace = findMatchingBrace(remaining, openBrace);
            if (closeBrace !== -1) {
              thenBody = origRemaining.slice(openBrace + 1, closeBrace);
              thenOffset = baseOffset + cursor + openBrace + 1;
              thenRange = rangeOf(
                baseOffset + cursor + openBrace,
                baseOffset + cursor + closeBrace + 1,
              );
              nextCursor = cursor + closeBrace + 1;
            } else {
              nextCursor = cursor + afterParen + 1;
            }
          } else {
            const innerRes = parseBodyStatementsInternal({
              ...ctx,
              body: origRemaining.slice(afterParen),
              maskedBody: remaining.slice(afterParen),
              baseOffset: baseOffset + cursor + afterParen,
              parentConstructId: null,
              maxStatements: 1,
            });
            const semi = remaining.indexOf(';', afterParen);
            const fallbackEnd = semi !== -1 ? semi + 1 : afterParen + 1;
            const singleEnd = innerRes.consumed > 0 ? afterParen + innerRes.consumed : fallbackEnd;
            thenBody = origRemaining.slice(afterParen, singleEnd);
            thenOffset = baseOffset + cursor + afterParen;
            thenRange = rangeOf(thenOffset, baseOffset + cursor + singleEnd);
            nextCursor = cursor + singleEnd;
            // Discard temporary constructs from innerRes pass so we re-parent properly below
            for (const tmp of innerRes.list) {
              const idx = constructs.indexOf(tmp);
              if (idx !== -1) constructs.splice(idx, 1);
            }
          }

          const ifConstruct = createControlConstruct({
            constructId: nextId('if'),
            kind: 'if',
            symbolId: fnSymbolId,
            condition: condRange,
            sourceRange: rangeOf(baseOffset + cursor, baseOffset + nextCursor),
            extensions: {
              expression: { type: 'leaf', range: condRange, label: condText },
              conditionText: condText,
              label: condText,
            },
            ...(parentConstructId ? { parentId: parentConstructId } : {}),
          });
          constructs.push(ifConstruct);
          levelConstructs.push(ifConstruct);

          const thenConstruct = createControlConstruct({
            constructId: nextId('block'),
            kind: 'block',
            symbolId: fnSymbolId,
            sourceRange: thenRange || condRange,
            parentId: ifConstruct.constructId,
          });
          constructs.push(thenConstruct);

          const thenChildren = parseBodyStatements({
            ...ctx,
            body: thenBody,
            maskedBody: maskedBody.slice(thenOffset - baseOffset, thenOffset - baseOffset + thenBody.length),
            baseOffset: thenOffset,
            parentConstructId: thenConstruct.constructId,
          });
          thenConstruct.children = thenChildren.map((c) => c.constructId);

          // Check for ELSE
          let elseConstruct = null;
          let checkElseIdx = nextCursor;
          while (checkElseIdx < len && /\s/.test(body[checkElseIdx])) {
            checkElseIdx += 1;
          }

          if (maskedBody.slice(checkElseIdx).match(/^else\b/)) {
            let afterElse = checkElseIdx + 4;
            while (afterElse < len && /\s/.test(body[afterElse])) {
              afterElse += 1;
            }

            if (maskedBody.slice(afterElse).match(/^if\b/)) {
              elseConstruct = createControlConstruct({
                constructId: nextId('else'),
                kind: 'else',
                symbolId: fnSymbolId,
                sourceRange: rangeOf(baseOffset + afterElse, baseOffset + afterElse + 2),
                parentId: ifConstruct.constructId,
              });
              constructs.push(elseConstruct);

              const elseIfRes = parseBodyStatementsInternal({
                ...ctx,
                body: body.slice(afterElse),
                maskedBody: maskedBody.slice(afterElse),
                baseOffset: baseOffset + afterElse,
                parentConstructId: elseConstruct.constructId,
                maxStatements: 1,
              });
              elseConstruct.children = elseIfRes.list.map((c) => c.constructId);
              nextCursor = afterElse + elseIfRes.consumed;
              if (elseIfRes.list.length > 0) {
                elseConstruct.sourceRange = elseIfRes.list[0].sourceRange;
              }
            } else {
              let elseBody = '';
              let elseOffset = 0;
              let elseRange = null;

              if (body[afterElse] === '{') {
                const openBrace = afterElse;
                const closeBrace = findMatchingBrace(maskedBody, openBrace);
                if (closeBrace !== -1) {
                  elseBody = body.slice(openBrace + 1, closeBrace);
                  elseOffset = baseOffset + openBrace + 1;
                  elseRange = rangeOf(baseOffset + openBrace, baseOffset + closeBrace + 1);
                  nextCursor = closeBrace + 1;
                }
              } else {
                const semi = maskedBody.indexOf(';', afterElse);
                if (semi !== -1) {
                  elseBody = body.slice(afterElse, semi + 1);
                  elseOffset = baseOffset + afterElse;
                  elseRange = rangeOf(baseOffset + afterElse, baseOffset + semi + 1);
                  nextCursor = semi + 1;
                }
              }

              if (elseRange) {
                elseConstruct = createControlConstruct({
                  constructId: nextId('else'),
                  kind: 'else',
                  symbolId: fnSymbolId,
                  sourceRange: elseRange,
                  parentId: ifConstruct.constructId,
                });
                constructs.push(elseConstruct);

                const elseChildren = parseBodyStatements({
                  ...ctx,
                  body: elseBody,
                  maskedBody: maskedBody.slice(elseOffset - baseOffset, elseOffset - baseOffset + elseBody.length),
                  baseOffset: elseOffset,
                  parentConstructId: elseConstruct.constructId,
                });
                elseConstruct.children = elseChildren.map((c) => c.constructId);
              }
            }
          }

          ifConstruct.children = elseConstruct
            ? [thenConstruct.constructId, elseConstruct.constructId]
            : [thenConstruct.constructId];

          cursor = nextCursor;
          continue;
        }
      }
    }

    // 2. WHILE LOOP: while (...) { ... }
    const whileMatch = remaining.match(/^while\b/);
    if (whileMatch) {
      const parenOpen = remaining.indexOf('(');
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const condText = origRemaining.slice(parenOpen + 1, parenClose).trim();
          const condRange = rangeOf(
            baseOffset + cursor + parenOpen + 1,
            baseOffset + cursor + parenClose,
          );

          let afterParen = parenClose + 1;
          while (afterParen < remaining.length && /\s/.test(remaining[afterParen])) {
            afterParen += 1;
          }

          let bodyText = '';
          let bodyOffset = 0;
          let bodyRange = null;
          let nextCursor = 0;

          if (remaining[afterParen] === '{') {
            const openBrace = afterParen;
            const closeBrace = findMatchingBrace(remaining, openBrace);
            if (closeBrace !== -1) {
              bodyText = origRemaining.slice(openBrace + 1, closeBrace);
              bodyOffset = baseOffset + cursor + openBrace + 1;
              bodyRange = rangeOf(
                baseOffset + cursor + openBrace,
                baseOffset + cursor + closeBrace + 1,
              );
              nextCursor = cursor + closeBrace + 1;
            }
          } else {
            const semi = remaining.indexOf(';', afterParen);
            if (semi !== -1) {
              bodyText = origRemaining.slice(afterParen, semi + 1);
              bodyOffset = baseOffset + cursor + afterParen;
              bodyRange = rangeOf(
                baseOffset + cursor + afterParen,
                baseOffset + cursor + semi + 1,
              );
              nextCursor = cursor + semi + 1;
            }
          }

          if (bodyRange) {
            const whileConstruct = createControlConstruct({
              constructId: nextId('while'),
              kind: 'while',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(baseOffset + cursor, baseOffset + nextCursor),
              extensions: {
                expression: { type: 'leaf', range: condRange, label: condText },
                conditionText: condText,
                label: condText,
              },
              ...(parentConstructId ? { parentId: parentConstructId } : {}),
            });
            constructs.push(whileConstruct);
            levelConstructs.push(whileConstruct);

            const bodyBlock = createControlConstruct({
              constructId: nextId('block'),
              kind: 'block',
              symbolId: fnSymbolId,
              sourceRange: bodyRange,
              parentId: whileConstruct.constructId,
            });
            constructs.push(bodyBlock);

            const whileChildren = parseBodyStatements({
              ...ctx,
              body: bodyText,
              maskedBody: maskedBody.slice(bodyOffset - baseOffset, bodyOffset - baseOffset + bodyText.length),
              baseOffset: bodyOffset,
              parentConstructId: bodyBlock.constructId,
            });
            bodyBlock.children = whileChildren.map((c) => c.constructId);
            whileConstruct.children = [bodyBlock.constructId];

            cursor = nextCursor;
            continue;
          }
        }
      }
    }

    // 3. FOR LOOP: for (init; cond; update) { ... }
    const forMatch = remaining.match(/^for\b/);
    if (forMatch) {
      const parenOpen = remaining.indexOf('(');
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const headerText = origRemaining.slice(parenOpen + 1, parenClose);
          const parts = headerText.split(';');
          const initText = (parts[0] || '').trim();
          const condText = (parts[1] || '').trim();
          const updateText = (parts[2] || '').trim();
          const condRange = rangeOf(
            baseOffset + cursor + parenOpen + 1,
            baseOffset + cursor + parenClose,
          );

          let afterParen = parenClose + 1;
          while (afterParen < remaining.length && /\s/.test(remaining[afterParen])) {
            afterParen += 1;
          }

          let bodyText = '';
          let bodyOffset = 0;
          let bodyRange = null;
          let nextCursor = 0;

          if (remaining[afterParen] === '{') {
            const openBrace = afterParen;
            const closeBrace = findMatchingBrace(remaining, openBrace);
            if (closeBrace !== -1) {
              bodyText = origRemaining.slice(openBrace + 1, closeBrace);
              bodyOffset = baseOffset + cursor + openBrace + 1;
              bodyRange = rangeOf(
                baseOffset + cursor + openBrace,
                baseOffset + cursor + closeBrace + 1,
              );
              nextCursor = cursor + closeBrace + 1;
            }
          } else {
            const semi = remaining.indexOf(';', afterParen);
            if (semi !== -1) {
              bodyText = origRemaining.slice(afterParen, semi + 1);
              bodyOffset = baseOffset + cursor + afterParen;
              bodyRange = rangeOf(
                baseOffset + cursor + afterParen,
                baseOffset + cursor + semi + 1,
              );
              nextCursor = cursor + semi + 1;
            }
          }

          if (bodyRange) {
            const forConstruct = createControlConstruct({
              constructId: nextId('for'),
              kind: 'for',
              symbolId: fnSymbolId,
              condition: condRange,
              sourceRange: rangeOf(baseOffset + cursor, baseOffset + nextCursor),
              extensions: {
                hasInit: Boolean(initText),
                hasCondition: Boolean(condText),
                hasUpdate: Boolean(updateText),
                expression: {
                  type: 'leaf',
                  range: condRange,
                  label: condText || 'for condition',
                },
                label: condText || 'for loop',
                conditionText: condText,
                initText,
                updateText,
              },
              ...(parentConstructId ? { parentId: parentConstructId } : {}),
            });
            constructs.push(forConstruct);
            levelConstructs.push(forConstruct);

            const bodyBlock = createControlConstruct({
              constructId: nextId('block'),
              kind: 'block',
              symbolId: fnSymbolId,
              sourceRange: bodyRange,
              parentId: forConstruct.constructId,
            });
            constructs.push(bodyBlock);

            const forChildren = parseBodyStatements({
              ...ctx,
              body: bodyText,
              maskedBody: maskedBody.slice(bodyOffset - baseOffset, bodyOffset - baseOffset + bodyText.length),
              baseOffset: bodyOffset,
              parentConstructId: bodyBlock.constructId,
            });
            bodyBlock.children = forChildren.map((c) => c.constructId);
            forConstruct.children = [bodyBlock.constructId];

            cursor = nextCursor;
            continue;
          }
        }
      }
    }

    // 4. SWITCH STATEMENT: switch (expr) { case ... }
    const switchMatch = remaining.match(/^switch\b/);
    if (switchMatch) {
      const parenOpen = remaining.indexOf('(');
      if (parenOpen !== -1) {
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const exprText = origRemaining.slice(parenOpen + 1, parenClose).trim();
          const condRange = rangeOf(
            baseOffset + cursor + parenOpen + 1,
            baseOffset + cursor + parenClose,
          );

          let afterParen = parenClose + 1;
          while (afterParen < remaining.length && /\s/.test(remaining[afterParen])) {
            afterParen += 1;
          }

          if (remaining[afterParen] === '{') {
            const openBrace = afterParen;
            const closeBrace = findMatchingBrace(remaining, openBrace);
            if (closeBrace !== -1) {
              const switchConstruct = createControlConstruct({
                constructId: nextId('switch'),
                kind: 'switch',
                symbolId: fnSymbolId,
                condition: condRange,
                sourceRange: rangeOf(
                  baseOffset + cursor,
                  baseOffset + cursor + closeBrace + 1,
                ),
                extensions: {
                  label: `switch (${exprText})`,
                  conditionText: exprText,
                },
                ...(parentConstructId ? { parentId: parentConstructId } : {}),
              });
              constructs.push(switchConstruct);
              levelConstructs.push(switchConstruct);

              const switchBody = origRemaining.slice(openBrace + 1, closeBrace);
              const switchMasked = remaining.slice(openBrace + 1, closeBrace);
              const switchOffset = baseOffset + cursor + openBrace + 1;

              // Parse cases inside switch
              const caseRegex = /\b(case\s+([^:]+)|default)\s*:/g;
              const caseIndices = [];
              let cm;
              while ((cm = caseRegex.exec(switchMasked)) !== null) {
                caseIndices.push({
                  index: cm.index,
                  test: cm[2] ? cm[2].trim() : 'default',
                  headerEnd: caseRegex.lastIndex,
                });
              }

              const caseConstructIds = [];
              for (let ci = 0; ci < caseIndices.length; ci += 1) {
                const currentCase = caseIndices[ci];
                const nextCaseStart =
                  ci + 1 < caseIndices.length ? caseIndices[ci + 1].index : switchBody.length;
                const caseCode = switchBody.slice(currentCase.headerEnd, nextCaseStart);
                const caseCodeOffset = switchOffset + currentCase.headerEnd;

                const caseKind = currentCase.test === 'default' ? 'default' : 'case';
                const caseConstruct = createControlConstruct({
                  constructId: nextId(caseKind),
                  kind: caseKind,
                  symbolId: fnSymbolId,
                  sourceRange: rangeOf(
                    switchOffset + currentCase.index,
                    switchOffset + nextCaseStart,
                  ),
                  extensions: { test: currentCase.test },
                  parentId: switchConstruct.constructId,
                });
                constructs.push(caseConstruct);
                caseConstructIds.push(caseConstruct.constructId);

                const caseChildren = parseBodyStatements({
                  ...ctx,
                  body: caseCode,
                  maskedBody: switchMasked.slice(currentCase.headerEnd, nextCaseStart),
                  baseOffset: caseCodeOffset,
                  parentConstructId: caseConstruct.constructId,
                });
                caseConstruct.children = caseChildren.map((c) => c.constructId);
              }

              switchConstruct.children = caseConstructIds;
              cursor += closeBrace + 1;
              continue;
            }
          }
        }
      }
    }

    // 5. RETURN STATEMENT: return expr;
    const returnMatch = remaining.match(/^return\b/);
    if (returnMatch) {
      const semi = remaining.indexOf(';');
      const retExpr = semi !== -1 ? origRemaining.slice(6, semi).trim() : '';
      const endOff = semi !== -1 ? semi + 1 : 6;
      const retLabel = retExpr ? `return ${retExpr}` : 'return';
      const stmtRange = rangeOf(baseOffset + cursor, baseOffset + cursor + endOff);

      const retConstruct = createControlConstruct({
        constructId: nextId('return'),
        kind: 'return',
        symbolId: fnSymbolId,
        sourceRange: stmtRange,
        extensions: {
          label: retLabel,
          returnExpression: retExpr,
          valueRange: retExpr
            ? rangeOf(baseOffset + cursor + 6, baseOffset + cursor + endOff - 1)
            : null,
        },
        ...(parentConstructId ? { parentId: parentConstructId } : {}),
      });
      constructs.push(retConstruct);
      levelConstructs.push(retConstruct);

      if (retExpr) {
        const retExprRaw = origRemaining.slice(6, semi);
        const retExprMasked = remaining.slice(6, semi);
        const embeddedCalls = extractEmbeddedCalls(
          retExprRaw,
          retExprMasked,
          baseOffset + cursor + 6,
          { ...ctx, parentConstructId: retConstruct.constructId },
          true,
        );
        if (embeddedCalls.length > 0) {
          retConstruct.children = embeddedCalls.map((c) => c.constructId);
        }
        dataFacts.push(
          createDataFact({
            factId: getFactId(),
            kind: 'use',
            symbolId: fnSymbolId,
            at: stmtRange,
            extensions: { expression: retExpr, role: 'return' },
          }),
        );
      }

      cursor += endOff;
      continue;
    }

    // 6. BREAK & CONTINUE
    const jumpMatch = remaining.match(/^(break|continue)\b/);
    if (jumpMatch) {
      const kw = jumpMatch[1];
      const semi = remaining.indexOf(';');
      const endOff = semi !== -1 ? semi + 1 : kw.length;

      const cc = createControlConstruct({
        constructId: nextId(kw),
        kind: kw,
        symbolId: fnSymbolId,
        sourceRange: rangeOf(baseOffset + cursor, baseOffset + cursor + endOff),
        ...(parentConstructId ? { parentId: parentConstructId } : {}),
      });
      constructs.push(cc);
      levelConstructs.push(cc);

      cursor += endOff;
      continue;
    }

    // 7. CALL WITH ASSIGNMENT: let a = getData(); / int a = getData(); / a = getData();
    const callAssignMatch = remaining.match(
      /^(?:(?:const|let|var|auto|int|float|double|char|string|std::string|bool|size_t|uint32_t|int32_t)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([a-zA-Z_~][a-zA-Z0-9_:]*)\s*\(/,
    );
    if (callAssignMatch) {
      const varName = callAssignMatch[1];
      const calleeName = callAssignMatch[2];
      if (!CPP_KEYWORDS.has(calleeName)) {
        const parenOpen = remaining.indexOf('(');
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const semi = remaining.indexOf(';', parenClose);
          const endOff = semi !== -1 ? semi + 1 : parenClose + 1;
          const callArgs = origRemaining.slice(parenOpen + 1, parenClose).trim();
          const fullLabel = `${varName} = ${calleeName}(${callArgs})`;
          const stmtRange = rangeOf(baseOffset + cursor, baseOffset + cursor + endOff);

          const callConstruct = createControlConstruct({
            constructId: nextId('call'),
            kind: 'call',
            symbolId: fnSymbolId,
            sourceRange: stmtRange,
            extensions: {
              calleeName,
              assignmentTarget: varName,
              expression: fullLabel,
              label: fullLabel,
            },
            ...(parentConstructId ? { parentId: parentConstructId } : {}),
          });
          constructs.push(callConstruct);
          levelConstructs.push(callConstruct);

          relationships.push(
            createRelationship({
              relationshipId: getRelId(calleeName),
              type: 'calls',
              from: fnSymbolId,
              to: calleeName,
              status: 'inferred',
              site: stmtRange,
            }),
          );

          dataFacts.push(
            createDataFact({
              factId: getFactId(),
              kind: 'definition',
              symbolId: fnSymbolId,
              at: stmtRange,
              extensions: {
                variableName: varName,
                sourceCall: calleeName,
                label: fullLabel,
              },
            }),
          );

          cursor += endOff;
          continue;
        }
      }
    }

    // 8. DIRECT CALL: callee(args);
    const directCallMatch = remaining.match(/^([a-zA-Z_~][a-zA-Z0-9_:]*)\s*\(/);
    if (directCallMatch) {
      const calleeName = directCallMatch[1];
      if (!CPP_KEYWORDS.has(calleeName)) {
        const parenOpen = remaining.indexOf('(');
        const parenClose = findMatchingParen(remaining, parenOpen);
        if (parenClose !== -1) {
          const semi = remaining.indexOf(';', parenClose);
          const endOff = semi !== -1 ? semi + 1 : parenClose + 1;
          const callArgs = origRemaining.slice(parenOpen + 1, parenClose).trim();
          const fullLabel = `${calleeName}(${callArgs})`;
          const stmtRange = rangeOf(baseOffset + cursor, baseOffset + cursor + endOff);

          const callConstruct = createControlConstruct({
            constructId: nextId('call'),
            kind: 'call',
            symbolId: fnSymbolId,
            sourceRange: stmtRange,
            extensions: {
              calleeName,
              label: fullLabel,
            },
            ...(parentConstructId ? { parentId: parentConstructId } : {}),
          });
          constructs.push(callConstruct);
          levelConstructs.push(callConstruct);

          relationships.push(
            createRelationship({
              relationshipId: getRelId(calleeName),
              type: 'calls',
              from: fnSymbolId,
              to: calleeName,
              status: 'inferred',
              site: stmtRange,
            }),
          );

          cursor += endOff;
          continue;
        }
      }
    }

    // 9. GENERAL STATEMENT ENDING WITH SEMICOLON
    const semi = remaining.indexOf(';');
    if (semi !== -1) {
      const stmtText = origRemaining.slice(0, semi + 1).trim();
      if (stmtText.length > 0) {
        const stmtRange = rangeOf(baseOffset + cursor, baseOffset + cursor + semi + 1);
        const stmtConstruct = createControlConstruct({
          constructId: nextId('statement'),
          kind: 'statement',
          symbolId: fnSymbolId,
          sourceRange: stmtRange,
          extensions: { label: stmtText },
          ...(parentConstructId ? { parentId: parentConstructId } : {}),
        });
        constructs.push(stmtConstruct);
        levelConstructs.push(stmtConstruct);

        const stmtMasked = remaining.slice(0, semi + 1);
        extractEmbeddedCalls(
          origRemaining.slice(0, semi + 1),
          stmtMasked,
          baseOffset + cursor,
          ctx,
          false,
        );
        // Check if variable assignment / modification
        const assignMatch = stmtText.match(
          /^(?:(?:const|let|var|auto|int|float|double|char|string|std::string|bool|size_t)\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=|\+=|-=|\*=|\/=|%=)\s*([^;]+);/,
        );
        if (assignMatch) {
          dataFacts.push(
            createDataFact({
              factId: getFactId(),
              kind: 'definition',
              symbolId: fnSymbolId,
              at: stmtRange,
              extensions: {
                variableName: assignMatch[1],
                expression: stmtText,
              },
            }),
          );
        }
      }
      cursor += semi + 1;
      continue;
    }

    cursor += 1;
  }

  return { list: levelConstructs, consumed: cursor };
}
