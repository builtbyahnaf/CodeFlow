import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { renderPanelHtml } from '../../src/extension/panelTemplate.js';

describe('Webview Content Security Policy & XSS Guard (Phase 12 §9, P12-18, AC-12.11)', () => {
  it('enforces default-src none and connect-src none in CSP meta tag', () => {
    const html = renderPanelHtml({
      nonce: 'test-nonce-12345',
      cspSource: 'vscode-webview:',
      scriptUri: 'vscode-webview://bundle.js',
      styleUri: 'vscode-webview://bundle.css',
    });

    assert.ok(html.includes("default-src 'none'"));
    assert.ok(html.includes("connect-src 'none'"));
    assert.ok(html.includes("base-uri 'none'"));
    assert.ok(html.includes("form-action 'none'"));
    assert.ok(html.includes("script-src 'nonce-test-nonce-12345'"));
  });

  it('strictly forbids unsafe-inline and unsafe-eval in scripts', () => {
    const html = renderPanelHtml({
      nonce: 'safe-nonce-abc',
      cspSource: 'vscode-webview:',
      scriptUri: 'vscode-webview://bundle.js',
      styleUri: 'vscode-webview://bundle.css',
    });

    assert.ok(!html.includes("'unsafe-inline'"));
    assert.ok(!html.includes("'unsafe-eval'"));
  });

  it('contains exactly one script tag and matches the generated nonce', () => {
    const nonce = 'unique-session-nonce-789';
    const html = renderPanelHtml({
      nonce,
      cspSource: 'vscode-webview:',
      scriptUri: 'vscode-webview://bundle.js',
      styleUri: 'vscode-webview://bundle.css',
    });

    const scriptTags = [...html.matchAll(/<script\b[^>]*>/gi)];
    assert.equal(scriptTags.length, 1);
    assert.ok(scriptTags[0][0].includes(`nonce="${nonce}"`));
  });
});
