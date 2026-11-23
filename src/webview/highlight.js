/**
 * Webview syntax highlighting.
 *
 * highlight.js is bundled into the webview only. The host never highlights, and
 * a failure always degrades to plain text: the preview is still readable.
 */

import hljs from 'highlight.js/lib/core';
import cpp from 'highlight.js/lib/languages/cpp';
import javascript from 'highlight.js/lib/languages/javascript';

hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('javascript', javascript);

/**
 * @typedef {{text: string, className: string}} PreviewToken
 */

/**
 * @param {string} languageId
 * @returns {{language: string|null, degraded: boolean}}
 */
export function resolveLanguage(languageId) {
  const id = String(languageId ?? '').toLowerCase();
  if (id === 'cpp' || id === 'c++' || id === 'c' || id === 'objective-c++') {
    return { language: 'cpp', degraded: false };
  }
  if (id === 'javascript' || id === 'js' || id === 'mjs' || id === 'cjs') {
    return { language: 'javascript', degraded: false };
  }
  return { language: null, degraded: true };
}

/**
 * Split highlight.js HTML into lines of classed tokens. Only the small subset
 * of markup that highlight.js emits is understood; anything else becomes text.
 *
 * @param {string} html
 * @returns {PreviewToken[][]}
 */
function htmlToLines(html) {
  /** @type {PreviewToken[][]} */
  const lines = [[]];
  const stack = [];
  const pattern = /<span class="([^"]+)">|<\/span>|([^<]+)/g;
  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (match[1]) {
      stack.push(match[1]);
      continue;
    }
    if (match[0] === '</span>') {
      stack.pop();
      continue;
    }
    const text = decodeEntities(match[2] ?? '');
    const parts = text.split('\n');
    for (const [index, part] of parts.entries()) {
      if (index > 0) {
        lines.push([]);
      }
      if (part.length > 0) {
        lines[lines.length - 1].push({
          text: part,
          className: stack.length > 0 ? stack[stack.length - 1] : '',
        });
      }
    }
  }
  return lines;
}

/**
 * @param {string} value
 * @returns {string}
 */
function decodeEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

/**
 * @param {string} text
 * @returns {PreviewToken[][]}
 */
export function plainLines(text) {
  return String(text ?? '')
    .split(/\r\n|\r|\n/)
    .map((line) => (line.length > 0 ? [{ text: line, className: '' }] : []));
}

/**
 * Highlight a source slice. Never throws.
 *
 * @param {string} text
 * @param {string} languageId
 * @returns {{lines: PreviewToken[][], degraded: boolean}}
 */
export function highlightLines(text, languageId) {
  const resolved = resolveLanguage(languageId);
  if (!resolved.language) {
    return { lines: plainLines(text), degraded: true };
  }
  try {
    const html = hljs.highlight(String(text ?? ''), { language: resolved.language }).value;
    return { lines: htmlToLines(html), degraded: false };
  } catch {
    return { lines: plainLines(text), degraded: true };
  }
}
