# ADR 0010 — Preview syntax highlighting

**Status:** Accepted  
**Date:** 2026-11-23  
**Phase:** 5  
**Author:** Muhammad Tahmid Ahnaf

## Context

Phase 5 introduces hover previews that display slices of the real source
document inside the graph webview. VS Code does not expose its internal
TextMate tokenizer to webviews as a public API, so the webview either renders
plain monospace text or bundles a client-side highlighter.

The Phase 5 decision gate evaluates candidate highlighting options against two
constraints:

- **Package weight:** keep the packaged extension well within the Phase 0
  baseline + 3 MB budget and avoid bloating the webview IIFE bundle.
- **First-preview latency:** keep highlighting under 150 ms on a 12-line C++
  slice.
- **Resilience:** highlighting must run in the sandboxed Chromium 110 webview
  with no network access, no inline script evaluation, and a guaranteed
  plain-text fallback if a language is unsupported or tokenization fails.

The candidates were:

1. **Plain monospace only** — zero dependency cost, lower readability in dense
   C++ and JavaScript slices.
2. **`highlight.js` (core + `cpp` + `javascript` only)** — pure JavaScript,
   synchronous, regex/state-machine tokenization, bundled in the webview only.
3. **`shiki` (TextMate grammars + WASM)** — editor-grade accuracy, heavier
   grammar and WASM assets, asynchronous initialization.
4. **VS Code command-based tokenization** — unavailable as a public API for
   arbitrary webview slices.

## Decision

Adopt **`highlight.js@11.11.1`** (BSD-3-Clause), bundled strictly inside the
webview (`src/webview/highlight.js`) with only `highlight.js/lib/core` and the
two V1 language modules (`cpp` and `javascript`) registered. The extension host
never performs syntax highlighting.

Tokenization outputs are parsed into structured `{text, className}` line arrays
and mounted via `textContent` on `<span>` elements (no `innerHTML`), mapped onto
VS Code theme CSS custom properties in `src/webview/styles.css`. Any unknown
language, disabled setting (`codeflow.preview.syntaxHighlighting: false`), or
thrown exception degrades to `plainLines(text)` with `degraded: true`.

## Measurements

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, Node v24.22.1. Bundle
measurements taken from `npm run vscode:prepublish` (esbuild `--production`,
minified, no source maps) and gzip level 9.

### Bundle contribution

| Artifact                       |  Minified |      Gzip |
| ------------------------------ | --------: | --------: |
| `highlight.js` (core+cpp+js)   |  34,648 B |  13,391 B |
| `dist/webview/main.js` (total) |  67,932 B |  24,974 B |
| `dist/webview/styles.css`      |  13,420 B |   3,091 B |
| `dist/extension.cjs` (total)   | 380,937 B | 110,368 B |

### Highlight latency

| Slice                    | Median time |
| ------------------------ | ----------: |
| 12-line C++ source slice |    0.093 ms |
| 9-line JavaScript slice  |    0.157 ms |

Both bundle weight (+13.4 KB gzip) and highlight latency (< 0.2 ms) are orders
of magnitude inside the Phase 5 decision gate budgets (+3 MB / 150 ms).

## Why the alternatives lose

- **`shiki`** gives higher TextMate fidelity on complex C++ templates and JS
  regexes, but ships WASM and TextMate grammar bundles plus async loader
  machinery that are unnecessary for 4–40 line preview cards.
- **VS Code internal tokenization** is not exposed as a public extension API.
- **Plain monospace only** stays shipped as the unconditional fallback path, but
  using `highlight.js` for V1 languages makes previews significantly easier to
  scan at negligible cost.

## Consequences

- `highlight.js` is listed in `package.json` `dependencies` (BSD-3-Clause,
  verified by `npm run check:licenses`) and inlined by esbuild into
  `dist/webview/main.js`; no `node_modules` directory is shipped.
- Adding V2/V3 languages later requires explicitly registering those language
  modules in `src/webview/highlight.js` (never importing the full language
  pack) or revisiting `shiki` if fidelity requirements change.
- Highlighting never alters the source characters: entity decoding and line
  splitting preserve exact source text, enforced by `tests/unit/highlight.test.js`.
