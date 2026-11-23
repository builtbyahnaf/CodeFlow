# Phase 5 completion report — Source synchronization and hover preview

**Phase:** 5 (Roadmap Part VI) · **Report template:** Roadmap §27  
**Date:** 2026-11-23 · **Status:** complete with documented environment gaps  
**Baseline:** Phase 4 completed at `05b51c8`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Every Phase 5 milestone task (`P5-01`…`P5-23`) has a shipped implementation.
Live VS Code UI/editor integration runs, Clang execution, and browser frame
traces remain unverified in this environment.

### M1 — Source access service

| ID    | Status      | Evidence                                                                                                                                            |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5-01 | Implemented | `src/core/source/ranges.js` + `src/extension/sourceAccess.js`; unit tests cover out-of-bounds, reversed, zero-length, CRLF, BOM, UTF-16 surrogates  |
| P5-02 | Implemented | `source.slice`, `source.validation`, `source.data`, `source.integrity`, `source.stale` in `envelope.js` and `panelWire.js`; batch validation tested |
| P5-03 | Implemented | `src/core/source/cache.js` bounded LRU (30 entries / 5 MB) + `onDidChange/Close/Delete/Rename` invalidation in `sourceAccess.js`                    |
| P5-04 | Implemented | `src/extension/sourcePaths.js` lexical workspace containment tested on Windows and POSIX traversal/NUL/root cases                                   |
| P5-05 | Implemented | `truncateSource` trims from end, strips trailing line ending for exact line counts, and sets `truncated: true`                                      |

### M2 — Preview UI and highlighting

| ID    | Status      | Evidence                                                                                                                                              |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5-06 | Implemented | `src/webview/previewController.js` pure injected-timer hover-intent (300 ms dwell, >12 px reset, 150 ms grace, `Esc` dismiss); fake-clock unit tests  |
| P5-07 | Partial     | `panelTemplate.js`, `main.js`, and `styles.css` render title, meta, line numbers, highlight tokens, and truncation note; visual review is author-only |
| P5-08 | Implemented | ADR 0010 records `highlight.js@11.11.1` decision gate with bundle (+13.4 KB gzip) and latency (0.093 ms C++ / 0.157 ms JS) measurements               |
| P5-09 | Implemented | `highlightLines` in `src/webview/highlight.js` degrades to `plainLines` on unknown/empty language ids or thrown errors                                |
| P5-10 | Implemented | Pin toggle + `pinByDefault` setting tested in `previewController.test.js` and wired in `main.js`                                                      |
| P5-11 | Implemented | `buildPreviewModel` in `src/core/source/presentation.js` handles synthetic/rangeless nodes without showing misleading slices                          |
| P5-12 | Implemented | `buildPreviewModel` + `main.js` render stale banner, dimmed card state, and `source.stale` push handling                                              |

### M3 — Navigation and sync

| ID    | Status      | Evidence                                                                                                                                                  |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5-13 | Partial     | `navigate.to` + `navigateToRange` validate range and call `showTextDocument` + `revealRange`; VS Code host path unexecuted in offline Node tests          |
| P5-14 | Implemented | `navigateToRange` checks `sourceAccess.validate` and blocks stale/missing files with `E_SOURCE_STALE`/`E_SOURCE_MISSING` (tested in `panelWire.test.js`)  |
| P5-15 | Partial     | `notifyEditorSelection` maps cursor/selection ranges in `panelWire.test.js`; `onDidChangeTextEditorSelection` 100 ms debounce in `panel.js` unrun in host |
| P5-16 | Partial     | `svgRenderer.highlight()` / `select()` and `node.select` protocol wiring implemented; live editor decoration feedback not run in VS Code host             |
| P5-17 | Partial     | `codeflow.backToGraph` command (`commands.js`) calls `panelManager.focusGraph()` → `graph.focus` → `renderer.select` + focus; manual host run unrun       |
| P5-18 | Implemented | All 7 settings in `src/core/source/settings.js` match `package.json` 1:1 (`sourceSettings.test.js`) and drive runtime behavior in `main.js` / `panel.js`  |
| P5-19 | Partial     | `Tab`/arrows, `H`/`Shift+Space`, `Enter`, and `Esc` wired in `svgRenderer.js` and `main.js`; live keyboard-only host recording not performed here         |

### M4 — Robustness, perf, docs

| ID    | Status      | Evidence                                                                                                                                                               |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P5-20 | Implemented | Measurements recorded in §3 and ADR 0010                                                                                                                               |
| P5-21 | Implemented | Missing/out-of-bounds/empty/whitespace/UTF-16/CRLF+BOM/oversized byte cap cases covered in `sourceRanges.test.js`, `sourcePresentation.test.js`, `sourcePaths.test.js` |
| P5-22 | Implemented | `docs/GRAPH_SPECIFICATION.md` §11, `docs/ARCHITECTURE.md`, `docs/DEPENDENCIES.md`, and `README.md` updated                                                             |
| P5-23 | Implemented | This report                                                                                                                                                            |

---

## 2. Acceptance criteria

| #      | Criterion                                                     | Evidence                                                                                                                                                             |
| ------ | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-5.1 | Every source-backed graph node navigates to the correct range | `tests/unit/sourceFidelity.test.js` validates and slices every source-backed node in JS (`classify`) and C++ (`parity.cpp`); `panelWire.test.js` tests `navigate.to` |
| AC-5.2 | Preview content comes from original source                    | `sliceText` / `document.getText(range)` only; DTO carries no source body (`sourceFidelity.test.js`); `buildPreviewModel` tests                                       |
| AC-5.3 | Edits cannot silently leave misleading snapshots              | Full-file SHA-256 baseline + `integrityFor` + `source.stale` push + `navigateToRange` `E_SOURCE_STALE` guard                                                         |
| AC-5.4 | Hover never triggers analysis                                 | `panelWire.test.js` asserts `loads === 0` before graph load and `loads === 1` after `source.slice`                                                                   |
| AC-5.5 | All §8 settings have observable effect                        | `sourceSettings.test.js` + `previewController.test.js` + `main.js` / `panel.js` wiring for all 7 keys                                                                |
| AC-5.6 | Keyboard-only path works                                      | `H` / `Shift+Space` / `Enter` / `Esc` / `codeflow.backToGraph` implemented; live VS Code host keyboard run remains author-only                                       |
| AC-5.7 | Preview degrades to plain text on highlighting failure        | `tests/unit/highlight.test.js` covers unknown, empty, and non-string language ids                                                                                    |
| AC-5.8 | Out-of-workspace reads are impossible                         | `tests/unit/sourcePaths.test.js` covers traversal, absolute external paths, and NUL bytes; single read gate in `sourceAccess.js`                                     |

---

## 3. Performance and bundle measurements

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, Node v24.22.1.

| Metric                                            | Budget      | Measured                       |
| ------------------------------------------------- | ----------- | ------------------------------ |
| 12-line C++ syntax highlight (median)             | < 150 ms    | 0.093 ms                       |
| 9-line JavaScript syntax highlight (median)       | < 150 ms    | 0.157 ms                       |
| Batch range validation, 500 ranges (median, Node) | < 250 ms    | 1.439 ms                       |
| Preview request analysis work                     | 0 calls     | 0 (`ensureRun` absent)         |
| Slice cache bounds                                | ≤ 30 / 5 MB | 30 entries / 5 MB LRU          |
| `highlight.js` webview bundle contribution        | +3 MB max   | 34,648 B min / 13,391 B gzip   |
| Production `dist/webview/main.js`                 | —           | 67,932 B min / 24,974 B gzip   |
| Production `dist/extension.cjs`                   | —           | 380,937 B min / 110,368 B gzip |
| Production `dist/webview/styles.css`              | —           | 13,420 B min / 3,091 B gzip    |

---

## 4. Honest gaps

- **Pre-existing C++ fixture drift (`cfg.cpp` / `ast-cfg.json`):** one ternary
  node in `tests/fixtures/cpp/ast-cfg.json` has a range extending past end-of-line
  and is intentionally rejected by `rangeWithinDocument` (no silent clamping).
  The C++ fidelity suite runs against `tests/fixtures/cpp/parity.cpp` and
  `ast-parity.json` instead.
- **No local Clang/clangd:** C++ verification uses committed AST fixtures rather
  than live compiler execution.
- **No live VS Code host integration run or browser frame trace:**
  `sourceAccess.js` (`vscode` API calls), `panel.js` editor selection events,
  keyboard focus movement in Chromium, and sustained webview frame timings were
  not executed against a live VS Code window here.
- **VSIX runtime install check:** `npm run check:vsix` previously hung in this
  environment; package contents and manifest consistency were checked via build
  output and unit/architecture tests instead.
- **Author-only review:** preview card layout and keyboard ergonomics were
  reviewed by the author only.

---

## 5. What Phase 6 can rely on

- Every non-synthetic node has validated source provenance, staleness status,
  and a live preview card surface (`#cf-preview`) plus detail panel
  (`#cf-detail-body`) ready for deterministic explanations.
- Preview and navigation settings flow live from host configuration to webview
  via `capabilities.data` and `settings.data`.
- `source.slice`, `source.validation`, and `navigate.to` never invoke analysis,
  preserving the host's single analysis lifecycle.
