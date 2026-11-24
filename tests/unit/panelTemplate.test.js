import test from 'node:test';
import assert from 'node:assert/strict';

import { renderPanelHtml } from '../../src/extension/panelTemplate.js';

const base = {
  nonce: 'nonce-abc123',
  cspSource: 'vscode-webview://abc',
  scriptUri: 'vscode-webview://abc/main.js',
  styleUri: 'vscode-webview://abc/styles.css',
  title: 'CodeFlow',
};

test('embeds the nonce in both the CSP and the script tag', () => {
  const html = renderPanelHtml(base);
  assert.match(html, /script-src 'nonce-nonce-abc123'/);
  assert.match(
    html,
    /<script nonce="nonce-abc123" src="vscode-webview:\/\/abc\/main.js"><\/script>/,
  );
});

test('locks the CSP down to the webview source and the nonce', () => {
  const html = renderPanelHtml(base);
  assert.match(html, /default-src 'none'/);
  assert.match(html, /style-src vscode-webview:\/\/abc/);
  assert.match(html, /connect-src 'none'/);
  assert.match(html, /base-uri 'none'/);
  assert.match(html, /form-action 'none'/);
  assert.ok(!html.includes('unsafe-inline'));
  assert.ok(!html.includes('unsafe-eval'));
  assert.ok(!/https?:\/\//.test(html));
});

test('has no inline script or inline event handlers', () => {
  const html = renderPanelHtml(base);
  assert.equal((html.match(/<script/g) ?? []).length, 1);
  assert.ok(!/\son[a-z]+=/i.test(html));
});

test('a new nonce changes the document, the same nonce is deterministic', () => {
  const first = renderPanelHtml(base);
  const again = renderPanelHtml(base);
  const other = renderPanelHtml({ ...base, nonce: 'nonce-different' });

  assert.equal(first, again);
  assert.notEqual(first, other);
  assert.ok(other.includes('nonce-different'));
  assert.ok(!other.includes('nonce-abc123'));
});

test('escapes the document title', () => {
  const html = renderPanelHtml({ ...base, title: '<script>alert(1)</script>' });
  assert.ok(!html.includes('<script>alert(1)</script>'));
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
});

test('declares the document structure the webview expects', () => {
  const html = renderPanelHtml(base);
  for (const id of [
    'cf-graph',
    'cf-meta',
    'cf-status',
    'cf-banner',
    'cf-empty',
    'cf-detail-body',
    'cf-legend',
    'cf-refresh',
    'cf-preview',
    'cf-preview-title',
    'cf-preview-meta',
    'cf-preview-body',
    'cf-preview-pin',
    'cf-preview-close',
    'cf-preview-open',
    'cf-preview-explain',
    'cf-fn-summary',
    'cf-explain',
    'cf-explain-depth',
    'cf-explain-items',
    'cf-explain-evidence',
    'cf-explain-limits',
    'cf-perspective',
    'cf-switch-perspective',
    'cf-scope-banner',
    'cf-calls-panel',
    'cf-calls-filter-status',
    'cf-calls-expand',
    'cf-calls-collapse',
    'cf-calls-focus',
    'cf-callers-list',
    'cf-callees-list',
    'cf-unresolved-bucket',
  ]) {
    assert.ok(html.includes(`id="${id}"`), `missing #${id}`);
  }
  assert.match(html, /lang="en"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-pressed="false"/);
});
