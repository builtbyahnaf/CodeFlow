# Phase 6 completion report — Deterministic explanation engine

**Phase:** 6 (Roadmap Part VI) · **Report template:** Roadmap §27\
**Date:** 2026-11-24 · **Status:** complete with documented environment gaps\
**Baseline:** Phase 5 completed at `d91bfe2`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Phase 6 is a headless engine: CSR query facts in, deterministic text out. No
model, no network, no randomness, no clock. The webview is a thin consumer over
three protocol kinds. All 21 milestone tasks (`P6-01`…`P6-21`) have a shipped
implementation; `P6-19` (blind-reader review) could not be performed in this
environment and is recorded as an unverified gap.

### M1 — Core model, facts, phrasing, evidence, cache

| ID    | Status      | Evidence                                                                                                                                  |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P6-01 | Implemented | `src/core/explanation/model.js`: `EvidenceRef`, `ExplanationItem`, `assembleFragments`, `validateExplanationItem`, stable `explanationId`. `tests/unit/explanationModel.test.js` rejects missing evidence, bad depth, HTML, duplicate ids. |
| P6-02 | Implemented | `facts.js`: statement, condition, branch, loop, call, return, variable, dependency, pattern facts from CFG + `createQueryLayer()` only. `tests/unit/explanationFacts.test.js` covers JS and C++ fixture parity. |
| P6-03 | Implemented | `phrasing.js`: `qualifyStatus`, `formatCallSummary`, `formatLimitations`, `lintExplanationText`, `ensureStatusQualification`. `tests/unit/explanationPhrasing.test.js` covers each status phrase and each banned pattern. |
| P6-04 | Implemented | `assembleFragments` drops evidence-less and HTML fragments before item construction; drops are counted in diagnostics. Validator re-checks. No item can render without evidence. |
| P6-05 | Implemented | `cache.js`: bounded cache keyed by `(runId, rulesetVersion, depth, stale, subjectKey)`; `invalidateRun` on analysis load. `tests/unit/explanationModel.test.js` proves cross-run, cross-ruleset, depth, and staleness isolation. |

### M2 — Depth 1–2 rules and function summary

| ID    | Status      | Evidence                                                                                                                                  |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P6-06 | Implemented | `rules/statements.js`, `rules/calls.js`: synthetic/unreachable/unmodeled, await, throw, return value/void, assignment, multi-assignment, increment, call used/unused, resolved/possible/unresolved calls, single/multiple return. |
| P6-07 | Implemented | `rules/conditions.js`: nullish, optional chain, conjunction, comparison, negated, multiway, early return, throw arm, missing else, two-arm, branch interaction. |
| P6-08 | Implemented | `rules/loops.js`: C-style counter, foreach, do-while, while-with-bound, empty body, early exit, nesting. Exact iteration counts require literal bound, literal non-zero step, no early exit, and no bound mutation (`explanationRules.test.js`). |
| P6-09 | Implemented | `rules/variables.js`: declaration, reassignment, capture, shadowing, TDZ risk, unused, overwrite-before-read, def-use, dependency chain. |
| P6-10 | Implemented | `rules/summary.js`: function shape summary and mandatory limitation paragraph; partial completeness is disclosed. |

### M3 — Depth 3–4, patterns, complexity, limitations

| ID    | Status      | Evidence                                                                                                                                  |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P6-11 | Implemented | Branch interaction, early returns, and call-status effects are emitted at depth 3 (`rules/conditions.js`, `rules/summary.js`). |
| P6-12 | Implemented | `dep.chain` refuses to cross an unresolved call (`explanationPatterns.test.js`). |
| P6-13 | Implemented (proof-limited) | `rules/patterns.js` names accumulation, linear search, nested pairwise, recursion, divide-and-conquer, memoization, and higher-order collection only with proof flags. Binary search is never named. Positive fixtures pass; negative fixtures decline. Real adapters do not yet emit all proof flags (see §4). |
| P6-14 | Implemented | Complexity claims require literal bound/step/no early exit or structural nesting ≤ 2 with no body calls. Otherwise the engine states that no claim can be made. `explanationPatterns.test.js` covers forbidden inputs. |
| P6-15 | Implemented | Depth 4 always emits a limitation sentence for `partial`, stale, unresolved, or unmodeled subjects (`fn.limitations`). |

### M4 — UI, settings, linter, docs, performance

| ID    | Status      | Evidence                                                                                                                                  |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| P6-16 | Implemented (author-only) | Function summary above the graph, node explanation below details, depth selector, grounded/qualified styling, evidence links reusing `navigate.to`, collapsible limitations, preview one-liner. DOM ids are asserted in `panelTemplate.test.js`; no live host run was possible. |
| P6-17 | Implemented | `codeflow.explanation.defaultDepth`, `showEvidence`, `includeLimitations` in `package.json` and `settings.js`; parity and clamping tested. |
| P6-18 | Implemented | `BANNED_PHRASING_RULES` plus a corpus test over 30+ node explanations: no advice, no unqualified certainty, no algorithm names without proof. |
| P6-19 | **Unverified** | Blind-reader quality check (3 readers × 5 functions) was not performed. Only the author is available in this environment. Recorded as an open quality gate. |
| P6-20 | Implemented | `docs/EXPLANATION_ENGINE.md` is normative for rules, obligations, phrasing, protocol, settings, verification, performance, and limits. `docs/adr/0011-deterministic-explanations.md` records the no-model decision. |
| P6-21 | Implemented | Performance measured below on a 724-node CFG at depth 4. |

---

## 2. Acceptance criteria

| #      | Criterion                                                     | Result | Evidence                                                                 |
| ------ | ------------------------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| AC-6.1 | Explanations are grounded in source and analysis              | Pass   | Every item carries ≥1 evidence ref; validator and assembly drop the rest. |
| AC-6.2 | Unsupported conclusions are qualified                         | Pass   | Status-mandated phrases plus linter; stale phrase applied centrally.      |
| AC-6.3 | No AI dependency exists                                       | Pass   | No network/model imports; architecture test restricts the layer.          |
| AC-6.4 | Explanations testable independently of UI rendering           | Pass   | Pure Node suites; no `vscode` import in review/engine modules.            |
| AC-6.5 | Four depth levels produce materially different output         | Pass   | `explanationRules.test.js` asserts monotonic richness and richer depth 4. |
| AC-6.6 | Pattern naming requires proof                                 | Pass   | Positive/negative fixtures; binary search never named.                    |
| AC-6.7 | Complexity claims forbidden outside preconditions             | Pass   | Forbidden-input fixtures return "no claim can be made".                   |
| AC-6.8 | Determinism across processes                                  | Pass   | Two fresh engines produce identical items; cache isolated per run.        |
| AC-6.9 | Depth 4 always discloses limitations for `partial` analysis   | Pass   | `fn.limitations` emitted for partial/stale/unresolved/unmodeled.          |

---

## 3. Measured performance

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, Node v24.22.1.
Fixture: 60 `if`/`for` blocks, 724 CFG nodes, depth 4.

| Metric                                           | Budget  | Measured  |
| ------------------------------------------------ | ------- | --------- |
| Function explanation, cold                       | < 50 ms | 11.9 ms   |
| Function explanation, warm cache                 | —       | 0.03 ms   |
| Node explanation, median                         | < 50 ms | 0.057 ms  |
| Node explanation, P95                            | < 50 ms | 0.128 ms  |
| Node explanation, max                            | < 50 ms | 2.90 ms   |
| Items per node                                   | —       | 5.15 (1–8)|
| Evidence refs per item                           | ≥ 1     | 1.48      |
| Production extension bundle                      | —       | 431,201 B |
| Production webview bundle                        | —       | 71,957 B  |
| Production CSS                                   | —       | 15,015 B  |

The engine adds roughly 50 KB minified to the extension bundle and 4 KB to the
webview bundle. No dependency was added.

---

## 4. Gaps and honest limitations

| Gap | Impact | Disposition |
| --- | --- | --- |
| Blind-reader check not performed | Readability is asserted by the author and by structural tests, not by independent readers. | Open quality gate; tracked here rather than claimed as passed. |
| Real adapters do not emit all pattern-proof flags | Pattern naming fires mainly on fixtures. Recursion and bounds narrowing do fire from real CFG/relationships. | Intentional conservatism. Omitted beats unproven. Future adapter work can set flags without engine changes. |
| No live VS Code host run | UI layout, focus behaviour, and editor navigation are covered by DOM/id tests and manual code review only. | Environmental; recorded in every phase report. |
| No golden snapshots | Wording drift is not snapshot-reviewed. | Structural assertions plus the linter catch correctness regressions; wording changes are allowed to improve without mass churn. |
| Dependency explanations are foundational | Whole-program chains are Phase 11. | Documented in `EXPLANATION_ENGINE.md` §13. |

---

## 5. Changes to existing surfaces

- **Protocol:** `explain.node`, `explain.function` (webview → host) and
  `explain.data` (host → webview). No protocol version bump: the kinds are
  additive and both sides are updated together.
- **Panel wire:** explanation handlers require a loaded CFG and never call
  `ensureRun()`; stale file ids gate the `stale` flag.
- **Panel settings:** `getSettings()` now includes a nested `explanation` object.
- **Webview:** new summary region, explanation card, depth selector, evidence
  links, limitations disclosure, and preview one-liner.
- **Manifest:** three `codeflow.explanation.*` settings and a
  `test:explanation` script.

---

## 6. Definition of done

- [x] AC-6.1 … AC-6.9 pass with automated evidence.
- [x] Rule catalog has an explicit proof obligation per group.
- [x] Every generated sentence is grounded or qualified; no item exists without
      evidence.
- [x] No model, network, or non-determinism in the explanation path.
- [x] Normative documentation and ADR written.
- [x] Performance measured and within budget.
- [x] Phase report written.
- [ ] Blind-reader review — deferred and recorded as an unverified gap.
