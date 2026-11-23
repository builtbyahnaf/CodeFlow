import test from 'node:test';
import assert from 'node:assert/strict';

import { buildPreviewModel } from '../../src/core/source/presentation.js';

const node = (overrides = {}) => ({
  id: 'cfg:n1',
  kind: 'statement',
  label: 'return 1;',
  range: {
    fileId: 'file:a',
    startLine: 1,
    startColumn: 2,
    endLine: 1,
    endColumn: 11,
  },
  ...overrides,
});

const slice = (overrides = {}) => ({
  text: '  return 1;',
  relativePath: 'src/app.js',
  languageId: 'javascript',
  lines: { startLine: 1, endLine: 1 },
  documentVersion: 7,
  integrity: 'exact',
  truncated: false,
  ...overrides,
});

test('an exact slice is presented as the real document text', () => {
  const model = buildPreviewModel({ node: node(), slice: slice() });
  assert.equal(model.text, '  return 1;');
  assert.equal(model.file, 'src/app.js');
  assert.equal(model.lineLabel, '2–2');
  assert.equal(model.synthetic, false);
  assert.equal(model.stale, false);
  assert.equal(model.empty, false);
  assert.equal(model.integrity, 'exact');
  assert.equal(model.documentVersion, 7);
  assert.equal(model.message, '');
});

test('synthetic nodes explain themselves and never claim source text', () => {
  const model = buildPreviewModel({
    node: node({ kind: 'entry', isSynthetic: true }),
    slice: slice(),
  });
  assert.equal(model.text, '');
  assert.equal(model.synthetic, true);
  assert.match(model.message, /Synthetic entry/);
  assert.match(model.message, /line 2/);
});

test('a node without a range is synthetic even when not flagged', () => {
  const model = buildPreviewModel({ node: node({ range: null }), slice: null });
  assert.equal(model.synthetic, true);
  assert.equal(model.text, '');
  assert.match(model.message, /no source range/);
});

test('a missing slice is reported as missing, not as empty source', () => {
  const model = buildPreviewModel({ node: node(), slice: null });
  assert.equal(model.synthetic, false);
  assert.equal(model.empty, true);
  assert.equal(model.integrity, 'missing');
  assert.equal(model.text, '');
  assert.match(model.message, /not available/);
});

test('stale slices keep the current text but warn that the graph may not match', () => {
  const model = buildPreviewModel({ node: node(), slice: slice({ integrity: 'stale' }) });
  assert.equal(model.stale, true);
  assert.equal(model.text, '  return 1;');
  assert.match(model.message, /changed since this analysis/);
});

test('an empty range is described instead of showing a blank card', () => {
  const model = buildPreviewModel({ node: node(), slice: slice({ text: '' }) });
  assert.equal(model.empty, true);
  assert.match(model.message, /no source content/);
});

test('a whitespace-only slice is treated as empty source content', () => {
  const model = buildPreviewModel({ node: node(), slice: slice({ text: '   \n\t  ' }) });
  assert.equal(model.empty, true);
  assert.match(model.message, /no source content/);
});

test('long slices are truncated to maxLines and say so', () => {
  const text = Array.from({ length: 40 }, (_, index) => `line ${index}`).join('\n');
  const model = buildPreviewModel({ node: node(), slice: slice({ text }), maxLines: 6 });
  assert.equal(model.truncated, true);
  assert.equal(model.text.split('\n').length, 6);
});

test('a slice-level truncation flag is preserved', () => {
  const model = buildPreviewModel({
    node: node(),
    slice: slice({ text: 'one\ntwo', truncated: true }),
    maxLines: 12,
  });
  assert.equal(model.truncated, true);
});
