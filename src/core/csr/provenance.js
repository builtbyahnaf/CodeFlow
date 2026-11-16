/**
 * Source provenance helpers.
 *
 * Coordinate contract (normative):
 * - lines are 0-based;
 * - columns are 0-based UTF-16 code units, matching JavaScript string indexing
 *   and VS Code's `Position`;
 * - `endLine`/`endColumn` are exclusive;
 * - a BOM is not part of column 0. `lineIndex.bomLength` reports how many
 *   UTF-16 units were skipped, and offsets are relative to the BOM-stripped
 *   text. Convert at the file boundary, never inside CSR.
 *
 * CRLF, LF, and lone CR are all line breaks. A position that falls inside a
 * line break is clamped to the end of the preceding line, because there is no
 * cursor position between `\r` and `\n`.
 */

/**
 * @typedef {{line: number, column: number}} Position
 * @typedef {{fileId: string, startLine: number, startColumn: number, endLine: number, endColumn: number}} SourceRange
 * @typedef {ReturnType<typeof createLineIndex>} LineIndex
 */

/**
 * @param {unknown} text
 */
export function createLineIndex(text) {
  const source = String(text ?? '');
  const bomLength = source.charCodeAt(0) === 0xfeff ? 1 : 0;
  const body = bomLength === 1 ? source.slice(1) : source;

  /** @type {number[]} */
  const lineStarts = [0];
  /** @type {number[]} */
  const lineEnds = [];
  /** @type {number[]} */
  const breakLengths = [];

  for (let index = 0; index < body.length; index += 1) {
    const code = body.charCodeAt(index);
    if (code !== 10 && code !== 13) {
      continue;
    }
    lineEnds.push(index);
    if (code === 13 && body.charCodeAt(index + 1) === 10) {
      breakLengths.push(2);
      index += 1;
    } else {
      breakLengths.push(1);
    }
    lineStarts.push(index + 1);
  }
  lineEnds.push(body.length);
  breakLengths.push(0);

  const lastLine = lineStarts.length - 1;

  /**
   * @param {number} line
   * @returns {{start: number, contentEnd: number, end: number}}
   */
  function lineBounds(line) {
    const safeLine = clampInteger(line, 0, lastLine);
    const start = lineStarts[safeLine];
    const contentEnd = lineEnds[safeLine];
    const end = start + (contentEnd - start) + breakLengths[safeLine];
    return { start, contentEnd, end };
  }

  /**
   * @param {number} offset
   * @returns {Position}
   */
  function positionAt(offset) {
    const safeOffset = clampInteger(offset, 0, body.length);
    // Binary search the line whose start is <= offset.
    let low = 0;
    let high = lastLine;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      if (lineStarts[middle] <= safeOffset) {
        low = middle;
      } else {
        high = middle - 1;
      }
    }
    const line = low;
    const bounds = lineBounds(line);
    const clamped = Math.min(safeOffset, bounds.contentEnd);
    return { line, column: clamped - bounds.start };
  }

  /**
   * @param {unknown} position
   * @returns {number}
   */
  function offsetAt(position) {
    const candidate = /** @type {Partial<Position>} */ (position ?? {});
    const line = clampInteger(candidate.line ?? 0, 0, lastLine);
    const bounds = lineBounds(line);
    const column = clampInteger(candidate.column ?? 0, 0, bounds.contentEnd - bounds.start);
    return bounds.start + column;
  }

  return {
    text: body,
    bomLength,
    lineStarts: Object.freeze([...lineStarts]),
    lineCount: lineStarts.length,
    lineBounds,
    positionAt,
    offsetAt,
    length: body.length,
  };
}

/**
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInteger(value, min, max) {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

/**
 * @param {SourceRange} range
 * @returns {{line: number, column: number}}
 */
export function startPosition(range) {
  return { line: range.startLine, column: range.startColumn };
}

/**
 * @param {SourceRange} range
 * @returns {{line: number, column: number}}
 */
export function endPosition(range) {
  return { line: range.endLine, column: range.endColumn };
}

/**
 * @param {Position} a
 * @param {Position} b
 * @returns {number} negative when a is before b
 */
export function comparePositions(a, b) {
  if (a.line !== b.line) {
    return a.line - b.line;
  }
  return a.column - b.column;
}

/**
 * @param {SourceRange} outer
 * @param {SourceRange} inner
 * @returns {boolean}
 */
export function rangeContains(outer, inner) {
  if (outer.fileId !== inner.fileId) {
    return false;
  }
  return (
    comparePositions(startPosition(outer), startPosition(inner)) <= 0 &&
    comparePositions(endPosition(inner), endPosition(outer)) <= 0
  );
}

/**
 * @param {SourceRange} a
 * @param {SourceRange} b
 * @returns {boolean}
 */
export function rangesIntersect(a, b) {
  if (a.fileId !== b.fileId) {
    return false;
  }
  return (
    comparePositions(startPosition(a), endPosition(b)) < 0 &&
    comparePositions(startPosition(b), endPosition(a)) < 0
  );
}

/**
 * @param {LineIndex} index
 * @param {SourceRange} range
 * @returns {{startOffset: number, endOffset: number}}
 */
export function rangeToOffsets(index, range) {
  const startOffset = index.offsetAt(startPosition(range));
  const endOffset = index.offsetAt(endPosition(range));
  return { startOffset, endOffset: Math.max(startOffset, endOffset) };
}

/**
 * Build a range from half-open UTF-16 offsets.
 *
 * @param {string} fileId
 * @param {LineIndex} index
 * @param {number} startOffset
 * @param {number} endOffset
 * @returns {SourceRange}
 */
export function rangeFromOffsets(fileId, index, startOffset, endOffset) {
  const start = index.positionAt(startOffset);
  const end = index.positionAt(Math.max(startOffset, endOffset));
  return {
    fileId,
    startLine: start.line,
    startColumn: start.column,
    endLine: end.line,
    endColumn: end.column,
  };
}

/**
 * Literal source slice for a range. Phase 5 renders this; it must therefore
 * come from the same line index the adapter used.
 *
 * @param {LineIndex} index
 * @param {SourceRange} range
 * @returns {string}
 */
export function sliceRange(index, range) {
  const { startOffset, endOffset } = rangeToOffsets(index, range);
  return index.text.slice(startOffset, endOffset);
}

/**
 * Structural checks that do not need file contents.
 *
 * @param {unknown} range
 * @returns {string[]} precise issue messages, empty when valid
 */
export function rangeShapeIssues(range) {
  if (typeof range !== 'object' || range === null || Array.isArray(range)) {
    return ['must be an object.'];
  }
  const record = /** @type {Record<string, unknown>} */ (range);
  /** @type {string[]} */
  const issues = [];
  if (typeof record.fileId !== 'string' || record.fileId.length === 0) {
    issues.push('fileId must be a non-empty string.');
  }
  for (const field of ['startLine', 'startColumn', 'endLine', 'endColumn']) {
    if (!Number.isInteger(record[field]) || Number(record[field]) < 0) {
      issues.push(`${field} must be a non-negative integer.`);
    }
  }
  if (
    Number.isInteger(record.startLine) &&
    Number.isInteger(record.endLine) &&
    Number(record.endLine) < Number(record.startLine)
  ) {
    issues.push('endLine must be >= startLine.');
  }
  if (
    Number.isInteger(record.startLine) &&
    Number.isInteger(record.endLine) &&
    Number(record.startLine) === Number(record.endLine) &&
    Number.isInteger(record.startColumn) &&
    Number.isInteger(record.endColumn) &&
    Number(record.endColumn) < Number(record.startColumn)
  ) {
    issues.push('endColumn must be >= startColumn on a single line.');
  }
  return issues;
}
