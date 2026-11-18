import test from 'node:test';
import assert from 'node:assert/strict';

import {
  comparePositions,
  createLineIndex,
  rangeContains,
  rangeFromOffsets,
  rangeToOffsets,
  rangesIntersect,
  sliceRange,
} from '../../src/core/csr/provenance.js';

test('LF, CRLF, and lone CR index lines identically', () => {
  const cases = [
    { text: 'one\ntwo\nthree', second: 4, third: 8 },
    { text: 'one\r\ntwo\r\nthree', second: 5, third: 10 },
    { text: 'one\rtwo\rthree', second: 4, third: 8 },
  ];
  for (const { text, second, third } of cases) {
    const index = createLineIndex(text);
    assert.equal(index.lineCount, 3, JSON.stringify(text));
    assert.deepEqual(index.positionAt(0), { line: 0, column: 0 });
    assert.deepEqual(index.positionAt(second), { line: 1, column: 0 }, JSON.stringify(text));
    assert.deepEqual(index.positionAt(third), { line: 2, column: 0 }, JSON.stringify(text));
    assert.deepEqual(index.positionAt(index.length), { line: 2, column: 5 });
    assert.equal(index.offsetAt({ line: 1, column: 0 }), second);
  }
});

test('a trailing newline starts an empty final line', () => {
  const index = createLineIndex('a\n');
  assert.equal(index.lineCount, 2);
  assert.deepEqual(index.positionAt(2), { line: 1, column: 0 });
  assert.equal(sliceRange(index, rangeFromOffsets('f', index, 0, 1)), 'a');
});

test('empty text is one empty line', () => {
  const index = createLineIndex('');
  assert.equal(index.lineCount, 1);
  assert.deepEqual(index.positionAt(0), { line: 0, column: 0 });
});

test('a BOM is not part of column zero', () => {
  const index = createLineIndex('\uFEFFconst x = 1;');
  assert.equal(index.bomLength, 1);
  assert.equal(index.text, 'const x = 1;');
  assert.deepEqual(index.positionAt(0), { line: 0, column: 0 });
  assert.deepEqual(index.positionAt(6), { line: 0, column: 6 });
  assert.equal(sliceRange(index, rangeFromOffsets('f', index, 6, 7)), 'x');
});

test('columns count UTF-16 code units, including astral characters', () => {
  const text = 'const emoji = "😀"; x';
  const index = createLineIndex(text);
  const xOffset = text.indexOf('x');
  const position = index.positionAt(xOffset);
  assert.equal(position.line, 0);
  assert.equal(position.column, xOffset, 'a surrogate pair is two UTF-16 units');
  assert.equal(
    sliceRange(index, rangeFromOffsets('f', index, position.column, position.column + 1)),
    'x',
  );
});

test('non-ASCII identifiers preserve their ranges', () => {
  const text = 'function naïve() {}\nfunction 函数() {}';
  const index = createLineIndex(text);
  const naiveStart = text.indexOf('naïve');
  const cjkStart = text.indexOf('函数');
  assert.deepEqual(index.positionAt(naiveStart), { line: 0, column: 9 });
  assert.deepEqual(index.positionAt(cjkStart), { line: 1, column: 9 });
  assert.equal(sliceRange(index, rangeFromOffsets('f', index, cjkStart, cjkStart + 2)), '函数');
});

test('a position inside CRLF is clamped to the end of the preceding line', () => {
  const index = createLineIndex('ab\r\ncd');
  assert.deepEqual(index.positionAt(2), { line: 0, column: 2 });
  assert.deepEqual(index.positionAt(3), { line: 0, column: 2 });
  assert.equal(index.offsetAt({ line: 0, column: 99 }), 2);
  assert.deepEqual(index.positionAt(4), { line: 1, column: 0 });
});

test('range offsets round-trip through CRLF text', () => {
  const text = 'one\r\ntwo\r\nthree';
  const index = createLineIndex(text);
  const range = rangeFromOffsets('f', index, 5, 8);
  assert.deepEqual(range, {
    fileId: 'f',
    startLine: 1,
    startColumn: 0,
    endLine: 1,
    endColumn: 3,
  });
  assert.equal(sliceRange(index, range), 'two');
  assert.deepEqual(rangeToOffsets(index, range), { startOffset: 5, endOffset: 8 });
});

test('range containment and intersection use half-open ends', () => {
  const outer = {
    fileId: 'f',
    startLine: 1,
    startColumn: 0,
    endLine: 3,
    endColumn: 0,
  };
  const inner = {
    fileId: 'f',
    startLine: 2,
    startColumn: 1,
    endLine: 2,
    endColumn: 4,
  };
  assert.equal(rangeContains(outer, inner), true);
  assert.equal(rangesIntersect(outer, inner), true);
  assert.equal(
    rangesIntersect(outer, { ...inner, fileId: 'g' }),
    false,
    'different files never intersect',
  );
  assert.equal(
    rangeContains(outer, { ...inner, endLine: 4, endColumn: 0 }),
    false,
    'the end is exclusive',
  );
  assert.equal(comparePositions({ line: 1, column: 2 }, { line: 1, column: 3 }), -1);
});
