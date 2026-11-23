# Phase 4 completion report — CFG and first visualization

**Phase:** 4 (Roadmap Part VI) · **Report template:** Roadmap §27  
**Date:** 2026-11-23 · **Status:** complete with documented environment gaps  
**Baseline:** Phase 3 completed at `6351283`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Every Phase 4 task (P4-01…P4-28) has a shipped implementation. Two items are
honest gaps: browser frame traces and a second-reader spec review.

### M1 — CFG core and spec

| ID    | Status      | Evidence                                                                                                                                  |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P4-01 | Implemented | `docs/GRAPH_SPECIFICATION.md` defines vocabulary, invariants, lowering rules and the degradation catalog                                  |
| P4-02 | Implemented | `src/core/graph/cfg/builder.js` builds from `ControlConstruct`; one entry/exit; every other node is reachable or explicitly `unreachable` |
| P4-03 | Implemented | Sequence, `if`, `if/else`, ternary, `&&`, `\|\|`, `??` and `!` lower to explicit branches; shared fixtures assert node/edge sets          |
| P4-04 | Implemented | `while`, `do`, `for`, `for-of/in`, nested loops, labelled and unlabelled `break`/`continue`                                               |
| P4-05 | Implemented | `switch` with `case` values, `default`, deliberate fallthrough and switch-local `break`                                                   |
| P4-06 | Implemented | `return`, `throw`, `try`/`catch`/`finally`; `finally` duplication is explicit and documented                                              |
| P4-07 | Implemented | Unknown constructs become `unmodeled` plus a degradation; C++ `goto`/computed `goto` stay `unresolved` with a reason code                 |
| P4-08 | Implemented | Dead code after an abrupt transfer becomes an `unreachable` node, never disappears                                                        |

### M2 — Real-adapter integration

| ID    | Status      | Evidence                                                                                                                                                 |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P4-09 | Implemented | Both adapters emit construct trees and set `generateCFG: true`; the query layer supplies `cfgFunctions()` and `constructsOf`                             |
| P4-10 | Implemented | Call constructs carry `callSite`; the builder attaches resolved/inferred/possible/unresolved summaries and never invents a resolved target               |
| P4-11 | Implemented | JavaScript `await` nodes and C++ exception edges use the same neutral vocabulary                                                                         |
| P4-12 | Implemented | `parity` fixture is the same abstract loop/branch/early-return program in C++ and JavaScript; normalized node-kind and edge-kind multisets match exactly |

### M3 — Renderer and interaction

| ID    | Status      | Evidence                                                                                                         |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| P4-13 | Implemented | ADR 0009 records the stack decision, measured candidates, bundle sizes and the unmeasured browser traces         |
| P4-14 | Implemented | DTO → SVG with pan, zoom, fit, select and deterministic positions; no graph work in the webview                  |
| P4-15 | Implemented | Status uses a glyph and dash pattern as well as colour; badges repeat the status text                            |
| P4-16 | Implemented | Detail panel shows kind, range, status, call targets and degradation reason                                      |
| P4-17 | Implemented | Legend and a degradation banner ("N constructs could not be modeled")                                            |
| P4-18 | Implemented | 2 000-node render cap keeps the first slice plus entry/exit and appends a `truncated` degradation                |
| P4-19 | Implemented | Layout runs in the extension host before transport; the webview only draws. 1 500-node layout measured at 3.3 ms |

### M4 — Entry points and robustness

| ID    | Status      | Evidence                                                                                                         |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| P4-20 | Implemented | `codeflow.showCfg` quick pick plus an in-panel function `<select>`; both list functions from the CSR query layer |
| P4-21 | Implemented | Unsupported languages and missing constructs answer with typed `E_UNSUPPORTED` / `E_CFG_UNAVAILABLE`             |
| P4-22 | Implemented | Empty function, expression-bodied arrow, constructor initializer list and trivial bodies have golden tests       |
| P4-23 | Implemented | Over 1 500 nodes requires `allowLarge`; the UI offers an explicit opt-in                                         |
| P4-24 | Implemented | `buildCfg` wraps unexpected failures as `E_CFG_INTERNAL`; a fault-injection test proves the panel survives       |

### M5 — Tests, perf, docs, report

| ID    | Status      | Evidence                                                                                                                  |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| P4-25 | Implemented | 36 shared fixtures (target: 25) across 10+ shapes; `npm run test:cfg` runs them with no host, webview, adapter or network |
| P4-26 | Implemented | Perf table in §3. Build, layout and DTO conversion measured at 20/100/500/1 500 nodes                                     |
| P4-27 | Implemented | `GRAPH_SPECIFICATION.md` is complete for CFG and includes the degradation catalog                                         |
| P4-28 | Implemented | This report                                                                                                               |

---

## 2. Acceptance criteria

| #      | Criterion                                                         | Evidence                                                                                                              |
| ------ | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| AC-4.1 | A user can open a supported function and inspect its control flow | `codeflow.showCfg` and the in-panel picker drive `cfg.functions` → `cfg.load`; integration tests assert the wire path |
| AC-4.2 | The graph corresponds to the analyzed source                      | Every source node keeps its construct range; range references are asserted in DTO tests; structural goldens           |
| AC-4.3 | Unsupported constructs are represented or reported honestly       | `unmodeled` nodes plus degradation banner; `goto` and computed-goto goldens                                           |
| AC-4.4 | Graph construction is independently testable                      | `npm run test:cfg`: 76 tests, no VS Code host, webview, adapter process or network                                    |
| AC-4.5 | Short-circuit and ternary are modeled as branches                 | `short-circuit`, `ternary`, `nullish` fixtures assert explicit condition nodes                                        |
| AC-4.6 | No edge exists without a language-permitted control transfer      | Edge-kind allowlist plus per-fixture edge assertions; the builder only emits transfers listed in the spec             |
| AC-4.7 | Renderer decision recorded with benchmark data                    | ADR 0009 with measured layout times, bundle sizes and heap deltas                                                     |
| AC-4.8 | 500-node CFG renders within budget; no main-thread block > 200 ms | 500-node build 1.6 ms + layout 1.0 ms in the host; zero graph work in the webview                                     |
| AC-4.9 | Status is distinguishable without colour                          | Glyph (`● ◐ ○ ✕ ⋯`) and dash patterns in the DTO; badges carry the status word                                        |

### Manual scenarios

The command path is covered by tests. A recorded screencast for both languages
was not produced in this environment; the author-only checklist is:

1. Open `tests/fixtures/cpp/cfg.cpp`, run **CodeFlow: Show Control Flow for
   Function**, pick `classify`, pan/zoom, select the loop condition.
2. Open a JavaScript file with a loop and a `try`, repeat, select a `catch`
   node and check that the exception edge is dashed and labelled.

---

## 3. Performance

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, 15.7 GB RAM, Node
v24.22.1. Median of five runs. Synthetic sequence constructs built through the
function builder, then serialized with `toCfgDto`.

| Nodes | Build (ms) | Layout + DTO (ms) | Edges |
| ----: | ---------: | ----------------: | ----: |
|    20 |       0.21 |              0.16 |    21 |
|   100 |       0.46 |              0.37 |   101 |
|   500 |       1.56 |              0.99 |   501 |
| 1 500 |       4.16 |              3.26 | 1 501 |

Renderer stack comparison and bundle sizes are in ADR 0009.

---

## 4. Honest gaps

- **Compiler-backed C++ CFG:** no Clang/clangd is available in this
  environment. C++ CFG verification uses committed AST fixtures
  (`ast-cfg.json`, `ast-parity.json`); live compiler runs remain unverified.
- **Browser frame traces:** sustained pan/zoom frame rate and SVG DOM build time
  were not measured in a real webview. The architectural claim (no layout in the
  webview) is enforced by construction and tests, not by a frame trace.
- **Second-reader spec review:** P4-01 was reviewed by the author only.
- **VSIX install and Linux/macOS CI:** still unrun here.
- **Cross-file CFG and interprocedural edges:** deliberately out of scope.

---

## 5. What Phase 5 can rely on

- Every non-synthetic node has a `rangeRef`; synthetic entry/exit/merge are
  marked `isSynthetic`.
- Node IDs are stable structural ordinals, safe for Phase 6 explanations and
  Phase 10 aggregation.
- The DTO carries no source text, so Phase 5 can add an on-demand source
  request without breaking the graph contract.
- The renderer swap point remains `layoutCfg` + `svgRenderer`, unchanged by the
  CFG work.
