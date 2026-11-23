import test from 'node:test';
import assert from 'node:assert/strict';

import { highlightLines, plainLines, resolveLanguage } from '../../src/webview/highlight.js';

const joined = (lines) => lines.map((tokens) => tokens.map((token) => token.text).join(''));

test('resolveLanguage maps the V1 language ids and reports gaps', () => {
  assert.deepEqual(resolveLanguage('cpp'), { language: 'cpp', degraded: false });
  assert.deepEqual(resolveLanguage('c++'), { language: 'cpp', degraded: false });
  assert.deepEqual(resolveLanguage('c'), { language: 'cpp', degraded: false });
  assert.deepEqual(resolveLanguage('javascript'), { language: 'javascript', degraded: false });
  assert.deepEqual(resolveLanguage('js'), { language: 'javascript', degraded: false });
  assert.equal(resolveLanguage('rust').language, null);
  assert.equal(resolveLanguage('rust').degraded, true);
  assert.equal(resolveLanguage(undefined).degraded, true);
});

test('plainLines splits every line ending and keeps empty lines', () => {
  assert.deepEqual(joined(plainLines('a\nb\r\nc\rd')), ['a', 'b', 'c', 'd']);
  assert.deepEqual(plainLines(''), [[]]);
  assert.equal(plainLines('a\n\nb').length, 3);
});

test('highlighting preserves the exact source text on every line', () => {
  const source = 'function f(n) {\n  if (n > 0) return "yes";\n  return null;\n}';
  const result = highlightLines(source, 'javascript');
  assert.equal(result.degraded, false);
  assert.deepEqual(joined(result.lines), source.split('\n'));
});

test('C++ highlighting preserves text and produces classed tokens', () => {
  const source = 'int main() {\n  return 0;\n}';
  const result = highlightLines(source, 'cpp');
  assert.equal(result.degraded, false);
  assert.deepEqual(joined(result.lines), source.split('\n'));
  const classes = result.lines.flat().map((token) => token.className);
  assert.ok(classes.some((value) => value.startsWith('hljs-')));
});

test('an unknown language degrades to plain text instead of throwing', () => {
  const source = 'let x = 1;';
  const result = highlightLines(source, 'made-up');
  assert.equal(result.degraded, true);
  assert.deepEqual(joined(result.lines), [source]);
});

test('entity decoding restores characters highlight.js escaped', () => {
  const source = 'const x = a < b && c > d ? "x" : \'y\';';
  const result = highlightLines(source, 'javascript');
  const text = joined(result.lines).join('\n');
  assert.ok(text.includes('<'));
  assert.ok(text.includes('&'));
  assert.ok(!text.includes('&lt;'));
  assert.ok(!text.includes('&amp;'));
});

test('highlighting never returns markup as text', () => {
  const result = highlightLines('int x = 1;', 'cpp');
  const text = joined(result.lines).join('\n');
  assert.ok(!text.includes('<span'));
  assert.ok(!text.includes('</span>'));
});

test('non-string or empty language ids degrade cleanly to plain text without throwing', () => {
  for (const lang of ['', null, undefined, 123, {}]) {
    const result = highlightLines('const a = 1;', /** @type {any} */ (lang));
    assert.equal(result.degraded, true);
    assert.deepEqual(joined(result.lines), ['const a = 1;']);
  }
  const nullText = highlightLines(/** @type {any} */ (null), 'javascript');
  assert.equal(nullText.degraded, false);
  assert.deepEqual(nullText.lines, [[]]);
});
