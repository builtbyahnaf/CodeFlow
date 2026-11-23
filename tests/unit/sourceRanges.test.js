import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SOURCE_LIMITS,
  containsPosition,
  containsRange,
  createDocumentView,
  integrityFor,
  lineStarts,
  normalizeMaxLines,
  normalizeRangeRef,
  rangeKey,
  rangeWithinDocument,
  rangesOverlap,
  sliceText,
  truncateSource,
} from '../../src/core/source/ranges.js';

const range = (startLine, startColumn, endLine, endColumn, fileId = 'file:a') => ({
  fileId,
  startLine,
  startColumn,
  endLine,
  endColumn,
});

test('normalizeRangeRef accepts a valid range and rejects malformed shapes', () => {
  const accepted = normalizeRangeRef(range(1, 2, 3, 4));
  assert.equal(accepted.ok, true);
  assert.deepEqual(accepted.value, range(1, 2, 3, 4));

  for (const bad of [
    null,
    [],
    { fileId: '', startLine: 0, startColumn: 0, endLine: 0, endColumn: 0 },
    { fileId: 'f', startLine: -1, startColumn: 0, endLine: 0, endColumn: 0 },
    { fileId: 'f', startLine: 2, startColumn: 0, endLine: 1, endColumn: 0 },
    { fileId: 'f', startLine: 0, startColumn: 5, endLine: 0, endColumn: 2 },
    { fileId: 'f', startLine: 0.5, startColumn: 0, endLine: 1, endColumn: 0 },
  ]) {
    const result = normalizeRangeRef(bad);
    assert.equal(result.ok, false, JSON.stringify(bad));
    assert.equal(result.code, 'E_RANGE');
  }
});

test('lineStarts handles LF, CRLF and CR without off-by-one drift', () => {
  assert.deepEqual(lineStarts('a\nb\nc'), [0, 2, 4]);
  assert.deepEqual(lineStarts('a\r\nb\r\nc'), [0, 3, 6]);
  assert.deepEqual(lineStarts('a\rb\rc'), [0, 2, 4]);
  assert.deepEqual(lineStarts(''), [0]);
});

test('createDocumentView reports line count and line length without endings', () => {
  const view = createDocumentView('abc\r\nde\nf');
  assert.equal(view.lineCount, 3);
  assert.equal(view.lineLength(0), 3);
  assert.equal(view.lineLength(1), 2);
  assert.equal(view.lineLength(2), 1);
  assert.equal(view.lineLength(9), -1);
});

test('rangeWithinDocument rejects ranges past the end instead of clamping', () => {
  const view = createDocumentView('alpha\nbeta');
  assert.equal(rangeWithinDocument(range(0, 0, 1, 4), view).ok, true);
  assert.equal(rangeWithinDocument(range(0, 0, 2, 0), view).ok, false);
  assert.equal(rangeWithinDocument(range(0, 0, 0, 6), view).ok, false);
  assert.equal(rangeWithinDocument(range(0, 6, 0, 6), view).ok, false);
});

test('sliceText returns the exact substring including indentation and endings', () => {
  const text = 'function f() {\n  return 1;\n}\n';
  assert.equal(sliceText(text, range(1, 2, 1, 11)), 'return 1;');
  assert.equal(sliceText(text, range(0, 0, 0, 8)), 'function');
  // Line endings inside a multi-line slice are preserved byte for byte.
  assert.equal(sliceText('a\nb', range(0, 0, 1, 1)), 'a\nb');
});

test('truncateSource never exceeds the requested line count and reports the trim', () => {
  const text = Array.from({ length: 30 }, (_, index) => `line ${index}`).join('\n');
  const trimmed = truncateSource(text, 5);
  assert.equal(trimmed.truncated, true);
  assert.equal(trimmed.lineCount, 5);
  assert.equal(trimmed.text.split('\n').length, 5);

  const untouched = truncateSource('one\ntwo', 5);
  assert.equal(untouched.truncated, false);
  assert.equal(untouched.text, 'one\ntwo');
});

test('normalizeMaxLines clamps into the frozen 4–40 window', () => {
  assert.equal(normalizeMaxLines(0), SOURCE_LIMITS.minLines);
  assert.equal(normalizeMaxLines(40), 40);
  assert.equal(normalizeMaxLines(401), SOURCE_LIMITS.maxLinesLimit);
  assert.equal(normalizeMaxLines('nope'), SOURCE_LIMITS.maxLines);
});

test('containsPosition and containsRange include their endpoints', () => {
  const outer = range(2, 4, 5, 6);
  assert.equal(containsPosition(outer, { line: 2, column: 4 }), true);
  assert.equal(containsPosition(outer, { line: 5, column: 6 }), true);
  assert.equal(containsPosition(outer, { line: 2, column: 3 }), false);
  assert.equal(containsPosition(outer, { line: 5, column: 7 }), false);
  assert.equal(containsPosition(outer, { line: 3, column: 0 }), true);

  assert.equal(containsRange(outer, range(3, 0, 4, 1)), true);
  assert.equal(containsRange(outer, range(1, 0, 4, 1)), false);
  assert.equal(containsRange(outer, range(3, 0, 4, 1, 'file:b')), false);
});

test('rangesOverlap is symmetric and file-scoped', () => {
  const left = range(2, 0, 4, 0);
  const right = range(3, 0, 6, 0);
  assert.equal(rangesOverlap(left, right), true);
  assert.equal(rangesOverlap(right, left), true);
  assert.equal(rangesOverlap(left, range(5, 0, 6, 0)), false);
  assert.equal(rangesOverlap(left, range(3, 0, 6, 0, 'file:b')), false);
});

test('rangeKey is deterministic and distinguishes files', () => {
  assert.equal(rangeKey(range(1, 2, 3, 4)), 'file:a:1:2-3:4');
  assert.notEqual(rangeKey(range(1, 2, 3, 4)), rangeKey(range(1, 2, 3, 5)));
  assert.notEqual(rangeKey(range(1, 2, 3, 4)), rangeKey(range(1, 2, 3, 4, 'file:b')));
});

test('integrityFor is conservative: only an identical full hash is exact', () => {
  assert.equal(integrityFor('sha256:a', 'sha256:a'), 'exact');
  assert.equal(integrityFor('sha256:a', 'sha256:b'), 'stale');
  assert.equal(integrityFor(undefined, 'sha256:b'), 'missing');
  assert.equal(integrityFor('sha256:a', undefined), 'missing');
});

test('BOM and UTF-16 surrogate pairs preserve exact UTF-16 columns and slices', () => {
  const text = '\uFEFFconst s = "😀";\r\nreturn s;';
  const view = createDocumentView(text);
  assert.equal(view.lineCount, 2);
  // Line 0: BOM (1) + 'const s = "' (11) + '😀' (2 UTF-16 code units) + '";' (2) = 16
  assert.equal(view.lineLength(0), 16);
  const target = range(0, 11, 0, 15);
  assert.equal(rangeWithinDocument(target, view).ok, true);
  assert.equal(sliceText(text, target), '"😀"');
  assert.equal(rangeWithinDocument(range(0, 11, 0, 17), view).ok, false);
});
