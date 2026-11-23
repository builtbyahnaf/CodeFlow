/**
 * Source range validation and slicing.
 *
 * These helpers are pure and host-independent. The extension host supplies the
 * real document text and version; the webview and the tests use the same range
 * rules. Nothing here reads a file or assembles source from an AST.
 */

/** Default slice limits from the Phase 5 contract. */
export const SOURCE_LIMITS = Object.freeze({
  maxLines: 12,
  minLines: 4,
  maxLinesLimit: 40,
  maxBytes: 65_536,
  maxRanges: 2_000,
});

const INTEGER_FIELDS = ['startLine', 'startColumn', 'endLine', 'endColumn'];

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Validate the wire shape of a range reference. This does not know the
 * document; `rangeWithinDocument` does that.
 *
 * @param {unknown} raw
 * @returns {{ok: true, value: Record<string, any>} | {ok: false, code: 'E_RANGE', issues: string[]}}
 */
export function normalizeRangeRef(raw) {
  if (!isRecord(raw)) {
    return { ok: false, code: 'E_RANGE', issues: ['range must be an object.'] };
  }
  /** @type {string[]} */
  const issues = [];
  if (typeof raw.fileId !== 'string' || raw.fileId.length === 0 || raw.fileId.length > 512) {
    issues.push('fileId must be a non-empty string.');
  }
  for (const key of INTEGER_FIELDS) {
    const value = raw[key];
    if (!Number.isInteger(value) || Number(value) < 0) {
      issues.push(`${key} must be a non-negative integer.`);
    }
  }
  if (issues.length === 0) {
    const startLine = Number(raw.startLine);
    const startColumn = Number(raw.startColumn);
    const endLine = Number(raw.endLine);
    const endColumn = Number(raw.endColumn);
    if (startLine > endLine || (startLine === endLine && startColumn > endColumn)) {
      issues.push('range start must not come after range end.');
    }
  }
  for (const key of ['startOffset', 'endOffset']) {
    if (raw[key] !== undefined && (!Number.isInteger(raw[key]) || Number(raw[key]) < 0)) {
      issues.push(`${key} must be a non-negative integer when present.`);
    }
  }
  if (issues.length > 0) {
    return { ok: false, code: 'E_RANGE', issues };
  }
  return {
    ok: true,
    value: {
      fileId: String(raw.fileId),
      startLine: Number(raw.startLine),
      startColumn: Number(raw.startColumn),
      endLine: Number(raw.endLine),
      endColumn: Number(raw.endColumn),
      ...(Number.isInteger(raw.startOffset) ? { startOffset: Number(raw.startOffset) } : {}),
      ...(Number.isInteger(raw.endOffset) ? { endOffset: Number(raw.endOffset) } : {}),
    },
  };
}

/**
 * Offsets of the first character of every line. Handles CRLF, CR and LF.
 *
 * @param {string} text
 * @returns {number[]}
 */
export function lineStarts(text) {
  const starts = [0];
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    if (code === 10) {
      starts.push(index + 1);
    } else if (code === 13) {
      if (text.charCodeAt(index + 1) === 10) {
        index += 1;
      }
      starts.push(index + 1);
    }
  }
  return starts;
}

/**
 * Document facts the validator needs. `lineLength` excludes the line ending.
 *
 * @param {string} text
 * @returns {{lineCount: number, lineLength: (line: number) => number, starts: number[]}}
 */
export function createDocumentView(text) {
  const starts = lineStarts(text);
  return {
    lineCount: starts.length,
    starts,
    /**
     * @param {number} line
     * @returns {number}
     */
    lineLength(line) {
      if (line < 0 || line >= starts.length) {
        return -1;
      }
      const start = starts[line];
      let end = line + 1 < starts.length ? starts[line + 1] : text.length;
      if (end > start && text.charCodeAt(end - 1) === 10) {
        end -= 1;
      }
      if (end > start && text.charCodeAt(end - 1) === 13) {
        end -= 1;
      }
      return end - start;
    },
  };
}

/**
 * Validate a normalized range against a document. Nothing is clamped: an
 * out-of-bounds range is rejected so a preview can never silently show the
 * wrong text.
 *
 * @param {Record<string, any>} range
 * @param {{lineCount: number, lineLength: (line: number) => number}} document
 * @returns {{ok: true} | {ok: false, code: 'E_RANGE', issues: string[]}}
 */
export function rangeWithinDocument(range, document) {
  const normalized = normalizeRangeRef(range);
  if (!normalized.ok) {
    return normalized;
  }
  const value = normalized.value;
  /** @type {string[]} */
  const issues = [];
  const lineCount = Number(document?.lineCount);
  if (!Number.isInteger(lineCount) || lineCount < 1) {
    return { ok: false, code: 'E_RANGE', issues: ['document line count is unknown.'] };
  }
  if (value.endLine >= lineCount) {
    issues.push(`endLine ${value.endLine} is beyond the document (${lineCount} lines).`);
  }
  if (issues.length === 0 && typeof document.lineLength === 'function') {
    const startLength = document.lineLength(value.startLine);
    const endLength = document.lineLength(value.endLine);
    if (startLength < 0 || value.startColumn > startLength) {
      issues.push(
        `startColumn ${value.startColumn} is beyond line ${value.startLine} (${startLength} columns).`,
      );
    }
    if (endLength < 0 || value.endColumn > endLength) {
      issues.push(
        `endColumn ${value.endColumn} is beyond line ${value.endLine} (${endLength} columns).`,
      );
    }
  }
  return issues.length > 0 ? { ok: false, code: 'E_RANGE', issues } : { ok: true };
}

/**
 * Exact substring for a range. Keeps the original line endings and indentation.
 *
 * @param {string} text
 * @param {Record<string, any>} range
 * @returns {string}
 */
export function sliceText(text, range) {
  const starts = lineStarts(text);
  const startLine = Number(range?.startLine);
  const endLine = Number(range?.endLine);
  const start = (starts[startLine] ?? 0) + Number(range?.startColumn ?? 0);
  const end = (starts[endLine] ?? starts[starts.length - 1]) + Number(range?.endColumn ?? 0);
  return text.slice(start, Math.max(start, end));
}

/**
 * Trim a slice from the end to `maxLines`. Never returns more lines than asked
 * for and reports the trim.
 *
 * @param {string} text
 * @param {number} maxLines
 * @returns {{text: string, truncated: boolean, lineCount: number}}
 */
export function truncateSource(text, maxLines) {
  const limit = Math.min(
    SOURCE_LIMITS.maxLinesLimit,
    Math.max(SOURCE_LIMITS.minLines, Number.isInteger(maxLines) ? maxLines : SOURCE_LIMITS.maxLines),
  );
  const starts = lineStarts(text);
  const lineCount = starts.length;
  if (lineCount <= limit) {
    return { text, truncated: false, lineCount };
  }
  // Keep exactly `limit` lines by dropping the trailing line ending; otherwise a
  // consumer that splits on newlines would render one empty extra line.
  let clipped = text.slice(0, starts[limit]);
  if (clipped.endsWith('\r\n')) {
    clipped = clipped.slice(0, -2);
  } else if (clipped.endsWith('\n') || clipped.endsWith('\r')) {
    clipped = clipped.slice(0, -1);
  }
  return {
    text: clipped,
    truncated: true,
    lineCount: limit,
  };
}

/**
 * True when the position is inside the range, including its end.
 *
 * @param {Record<string, any>} range
 * @param {{line: number, column: number}} position
 * @returns {boolean}
 */
export function containsPosition(range, position) {
  const line = Number(position?.line);
  const column = Number(position?.column);
  if (!Number.isInteger(line) || !Number.isInteger(column)) {
    return false;
  }
  if (line < range.startLine || line > range.endLine) {
    return false;
  }
  if (line === range.startLine && column < range.startColumn) {
    return false;
  }
  if (line === range.endLine && column > range.endColumn) {
    return false;
  }
  return true;
}

/**
 * @param {Record<string, any>} outer
 * @param {Record<string, any>} inner
 * @returns {boolean}
 */
export function containsRange(outer, inner) {
  if (!outer || !inner || outer.fileId !== inner.fileId) {
    return false;
  }
  return (
    containsPosition(outer, { line: inner.startLine, column: inner.startColumn }) &&
    containsPosition(outer, { line: inner.endLine, column: inner.endColumn })
  );
}

/**
 * @param {Record<string, any>} left
 * @param {Record<string, any>} right
 * @returns {boolean}
 */
export function rangesOverlap(left, right) {
  if (!left || !right || left.fileId !== right.fileId) {
    return false;
  }
  return (
    containsPosition(left, { line: right.startLine, column: right.startColumn }) ||
    containsPosition(left, { line: right.endLine, column: right.endColumn }) ||
    containsPosition(right, { line: left.startLine, column: left.startColumn })
  );
}

/**
 * @param {Record<string, any>} range
 * @returns {string}
 */
export function rangeKey(range) {
  return `${range.fileId}:${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}`;
}

/**
 * Integrity is a comparison of two full-document hashes. Conservative: a
 * mismatch marks the whole file stale, because an external rewrite gives us no
 * trustworthy edit delta.
 *
 * @param {string|undefined} analysisHash
 * @param {string|undefined} currentHash
 * @returns {'exact'|'stale'|'missing'}
 */
export function integrityFor(analysisHash, currentHash) {
  if (!analysisHash || !currentHash) {
    return 'missing';
  }
  return analysisHash === currentHash ? 'exact' : 'stale';
}

/**
 * @param {unknown} value
 * @returns {number}
 */
export function normalizeMaxLines(value) {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) {
    return SOURCE_LIMITS.maxLines;
  }
  return Math.min(
    SOURCE_LIMITS.maxLinesLimit,
    Math.max(SOURCE_LIMITS.minLines, Math.trunc(candidate)),
  );
}
