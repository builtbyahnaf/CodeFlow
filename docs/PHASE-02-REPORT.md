# Phase 2 completion report — C++ analysis foundation

**Phase:** 2 (Roadmap Part VI) · **Report template:** Roadmap §27
**Date:** 2026-11-19 · **Status:** complete with documented environment gaps
**Baseline:** Phase 1 completed at `995ec50`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Every Phase 2 task (P2-01…P2-25) except the two live-tool spikes has a shipped
implementation and automated coverage.

### M1 — Toolchain and configuration

| ID    | Status      | Evidence                                                                                                                                                                |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-01 | Implemented | `src/extension/tooling/runTool.js`: argument arrays, no shell, timeout, cancellation, kill-tree, stdout/stderr caps; 9 tests (hang, huge output, cancel, non-zero exit) |
| P2-02 | Implemented | `src/extension/cpp/clang.js`: setting → compile-DB compiler → `PATH` → `clang-cl`/`xcrun`; version floor with `toolchain_version_mismatch`; 7 tests                     |
| P2-03 | Implemented | `src/extension/cpp/compileDb.js`: discovery order, multi-DB scoring, override setting, malformed JSON; 11 tests                                                         |
| P2-04 | Implemented | `src/extension/cpp/analysisConfig.js`: heuristic include/define/standard flags, flag sanitisation, `missing_compile_db`; 7 tests                                        |
| P2-05 | Implemented | `src/extension/cpp/headers.js`: header→representative-TU mapping; 6 tests                                                                                               |

### M2 — Route decision

| ID    | Status      | Evidence                                                                                                                                                                                       |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-06 | Partial     | Route A implemented end-to-end in code and exercised with committed AST fixtures; the timed live-Clang spike could not run (no Clang installed), so no wall-clock/RSS/wrong-case numbers exist |
| P2-07 | Deferred    | Route C (`clangd`) spike not run; the route is documented as the Phase 7 addition in ADR 0007                                                                                                  |
| P2-08 | Implemented | `docs/adr/0007-cpp-integration-route.md` records the structural decision, rejected alternatives, costs, and the spike gap                                                                      |

### M3 — Declarations and types

| ID    | Status      | Evidence                                                                                                                      |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------- |
| P2-09 | Implemented | File, namespace, class/struct, enum, enum member, type alias mapping in `mapper.js`; C-01…C-04 via real AST fixture           |
| P2-10 | Implemented | Functions, methods, constructors, destructors, lambdas, visibility and parentage; overload and unicode fixtures               |
| P2-11 | Implemented | Variables, fields, parameters; file symbols extend to real line counts                                                        |
| P2-12 | Implemented | Type strings recorded in `extensions`; no pretence of full type resolution; capability is `partial`                           |
| P2-13 | Partial     | Macro-expanded nodes keep expansion-site provenance; macro bodies are not inlined and the boundary is diagnostic + documented |
| P2-14 | Implemented | UTF-8 byte → UTF-16 columns, CRLF/CR/LF equivalence, unicode identifiers; 16 mapper tests                                     |

### M4 — Calls and uncertainty

| ID    | Status      | Evidence                                                                                                                                                                            |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P2-15 | Implemented | Direct calls resolve through `referencedDecl`; `calls` edges carry the call site                                                                                                    |
| P2-16 | Implemented | Overload identity includes kind + qualified name + disambiguator; calls resolve to the correct overload; 2-overload fixture                                                         |
| P2-17 | Implemented | Function pointers → `unresolved`/`function_pointer`; dependent/template calls → `unresolved` or `possible`/`template_dependent`                                                     |
| P2-18 | Implemented | Virtual calls → `possible`/`dynamic_dispatch`; never `resolved` without evidence                                                                                                    |
| P2-19 | Implemented | `includes` file→file edges for workspace files; system headers excluded                                                                                                             |
| P2-20 | Unverified  | The live anti-false-positive cross-check against Clang requires Clang; the mapper only emits `resolved` from `referencedDecl` by construction, but this is not an independent check |

### M5 — Robustness and report

| ID    | Status      | Evidence                                                                                                                 |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------ |
| P2-21 | Implemented | Missing/invalid AST → valid empty run + `parse_error`; stderr sanitised and capped; other analyses unaffected            |
| P2-22 | Implemented | Timeout, output cap, and cancellation become partial runs with `budget_exceeded`/`cancelled`; fake-tool tests            |
| P2-23 | Partial     | No `perf-medium` measurement was possible without Clang; fixture-driven timings only                                     |
| P2-24 | Implemented | `docs/LANGUAGE_ADAPTERS.md` C++ section contains the normative boundaries table                                          |
| P2-25 | Partial     | Diagnostics are sanitised and capped, but the required manual review of 10 messages by a second reader was not performed |

### Cross-cutting behaviour

- **Pure adapter, host-driven tooling.** `src/adapters/cpp/` imports no `fs`,
  `child_process`, or `vscode`; C-11 enforces it. Only
  `src/extension/tooling/runTool.js` spawns processes.
- **Trust gating.** Restricted Mode returns `E_UNTRUSTED` before any file read
  or process spawn.
- **Header honesty.** Header runs are filtered and marked `partial`, with an
  `out_of_scope` diagnostic naming the representative TU.
- **Bounded cost.** Per-TU timeout 60 s, output cap 64 MB, source cap 4 MB, all
  configurable; exceeding a cap degrades rather than truncates silently.
- **No build-system execution.** Only `clang --version` and analysis invocations
  are run; compile-database discovery reads JSON and never invokes cmake/make.
- **Panel integration.** The panel analyses through
  `createCppAnalysisService`; `codeflow.analyzeActiveFile` analyses the active
  C++ file.

---

## 2. What was intentionally deferred

| Deferred                                       | Target  | Why                                                         |
| ---------------------------------------------- | ------- | ----------------------------------------------------------- |
| Cross-TU call graph and `clangd` evidence      | 7       | Route A is TU-local; Phase 7 merges external evidence       |
| CFG/DFG generation from C++ constructs         | 4, 11   | Constructs are recorded; edge generation is later           |
| Full template instantiation                    | Post-V1 | Documented boundary; dependent calls degrade                |
| Preprocessor multi-configuration analysis      | Post-V1 | Only the compile database's active configuration is visible |
| Persistent project index                       | 8       | No storage layer yet                                        |
| Live-Clang spike numbers and P2-20 cross-check | —       | Not possible without an installed toolchain                 |
| `clangd` spike                                 | 7       | Route C deliberately not started                            |

---

## 3. Files and subsystems changed

**Pure adapter** — `src/adapters/cpp/`:

- `index.js` — descriptor, extensions, honest capabilities.
- `mapper.js` — Clang AST JSON → CSR (declarations, calls, includes,
  diagnostics, overload identity, uncertainty).
- `locator.js` — byte/UTF-16 conversion, line counting, file records.

**Host pipeline** — `src/extension/cpp/`:

- `pipeline.js` — orchestration, caches, trust/path/size checks, header focus.
- `analysisConfig.js`, `clang.js`, `compileDb.js`, `headers.js` — toolchain and
  configuration.

**Core and host surfaces**:

- `src/core/csr/focus.js` — file-focused run filtering without dangling edges.
- `src/core/csr/reasons.js` — C++/JavaScript reason codes.
- `src/extension/tooling/runTool.js` — the only process-spawn module.
- `src/extension/panel.js`, `panelWire.js`, `extension.js`, `commands.js` —
  routing and the analyze-active-file command.
- `package.json` — C++ settings and the `test:cpp` script.

**Tests and fixtures**:

- `tests/unit/{runTool,clangDiscovery,compileDb,headers,analysisConfig,csrFocus,cppMapper,cppAdapter,cppPipeline}.test.js`.
- `tests/conformance/cpp.conformance.test.js`.
- `tests/fixtures/cpp/`: basic, overloads, unicode, multi-TU, templates,
  virtual, function pointers, macros, parse error.

**Docs**: ADR 0007, `docs/LANGUAGE_ADAPTERS.md` C++ section, this report,
`CHANGELOG.md`.

No TypeScript source, configuration, or generated types were added.

---

## 4. Tests added and executed

| Area            | What is proven                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Process runner  | fake tools: normal exit, non-zero exit, hang + timeout, output cap, cancellation, kill-tree, argument array (no shell)                     |
| Clang discovery | setting precedence, PATH lookup, platform fallbacks, missing tool, version floor/mismatch                                                  |
| Compile DB      | search order, override, multiple DB scoring, malformed JSON, missing DB                                                                    |
| Heuristic mode  | inferred flags, sanitisation of unsafe flags, `missing_compile_db`                                                                         |
| Header mapping  | include scanning, representative TU choice, no-TU fallback                                                                                 |
| Mapper          | declarations, parentage, visibility, overload identity, direct/call statuses, virtual, function pointers, templates, includes, diagnostics |
| Provenance      | UTF-16 columns, unicode identifiers, CRLF/LF equality, file ranges                                                                         |
| Pipeline        | discovery caches, TU vs header path, header focus, timeout/cap/cancel, stderr sanitisation, Restricted Mode                                |
| Conformance     | C-01…C-12 pass for C++ on a real AST fixture through the registry                                                                          |

Commands: `npm run test:cpp` (C++ only) and `npm run test:unit` (all).

---

## 5. Test results

| Check                         | Result                                                     |
| ----------------------------- | ---------------------------------------------------------- |
| Full unit + conformance suite | **252 passed, 0 failed** (≈1.2 s)                          |
| C++ unit + conformance        | **63 passed, 0 failed**                                    |
| Conformance C-01…C-12         | C++: 12/12 pass on committed AST fixture                   |
| ESLint                        | Clean                                                      |
| Prettier `format:check`       | Clean                                                      |
| No-TypeScript check           | Pass                                                       |
| Build                         | Pass                                                       |
| License audit                 | Pass                                                       |
| Live Clang analysis           | **Not run** — no Clang/clangd/libclang installed           |
| Perf smoke (`perf-medium`)    | **Not run** — depends on live Clang                        |
| VSIX install check            | **Not completed** — same environment limitation as Phase 1 |

---

## 6. Performance measurements

No performance claims are made. The phase brief asks for per-TU wall clock, peak
RSS, AST size, symbol/edge counts, and three concrete wrong cases from each
route. None can be produced without a compiler installed. The test suite
measures only in-memory mapping of small fixtures (sub-millisecond per fixture),
which says nothing about a 5,000-line TU.

This gap is a release gate, not a footnote: before Phase 2 can be called
production-verified, a machine with Clang must produce the §8 table and the P2-20
cross-check.

---

## 7. Known limitations

1. **No live toolchain verification.** AST fixtures are hand-built to match the
   schema consumed by the mapper. They prove the mapping contract, not that a
   real Clang emits exactly these shapes.
2. **No anti-false-positive cross-check.** P2-20 requires an independent Clang
   query. By construction the mapper only creates `resolved` calls from
   `referencedDecl`, but construction is not independent verification.
3. **Templates are shallow.** Declarations only; instantiations are not
   expanded.
4. **Macros are diagnostic.** Expansion-site ranges are kept, but macro bodies
   are not represented as graph nodes.
5. **V1 does not emit constructor `calls`.** `CXXConstructExpr` produces
   `instantiates` to the class only. This is documented rather than silently
   missing.
6. **Headers require a representative TU.** Without a compile database, header
   analysis is syntactic only.
7. **Diagnostic UX review not performed.** Messages are plain-language and
   path-sanitised, but the P2-25 second-reader review did not happen.
8. **Cancellation process-count assertion not run.** Kill-tree is unit-tested
   with fake children; no OS-level orphan assertion was executed.
9. **No cross-platform CI run.** Windows local only; Linux/macOS conformance is
   unverified.

---

## 8. Security and reliability concerns

- **Single process surface.** `src/extension/tooling/runTool.js` is the only
  module allowed to spawn. Architecture tests reject `child_process` imports
  elsewhere; C-11 rejects them in adapters.
- **No shell interpolation.** Arguments are arrays; the command is resolved
  separately; working directory is fixed to the workspace root.
- **Bounded execution.** Timeout, output cap, and source cap are enforced before
  or during analysis. Exceeding them yields a partial run, not OOM or a hang.
- **Trust respected.** Restricted Mode fails before reading files or spawning.
- **Path safety.** NUL, outside-workspace, and unreadable paths return
  `E_INPUT`; the host uses the shared path guards.
- **stderr treated as untrusted.** Clang output is stripped of absolute paths,
  truncated, and converted to diagnostics; it is never rendered raw.
- **Residual risk.** A malicious compile database can supply arbitrary compiler
  paths and flags. The host validates that the compiler is Clang-compatible and
  sanitises heuristic flags, but a trusted workspace can still ask Clang to read
  arbitrary files. This matches the trust model (workspace trust is the gate).
- **Residual risk.** Large ASTs are held in memory before mapping. The 64 MB cap
  bounds this, but peak memory is unmeasured.

---

## 9. Documentation updated

- `docs/adr/0007-cpp-integration-route.md` — Route A decision, costs, rejected
  alternatives, verification gap.
- `docs/LANGUAGE_ADAPTERS.md` — normative C++ section: layer split,
  configuration/degradation, boundaries table, partial rules, fixtures.
- `CHANGELOG.md` — Phase 2 entry.
- `docs/PHASE-02-REPORT.md` — this report.

---

## 10. Commit list

Phase 2 changes were committed in small units:

```text
907b4ad feat(tooling): add a bounded, cancellable process runner
e8247ca feat(cpp): discover Clang and enforce a version policy
75fb255 feat(cpp): discover and parse compilation databases
6e68153 feat(cpp): map headers to representative translation units
2cb4025 feat(cpp): add heuristic fallback and sanitize compiler flags
7f7dbc9 feat(csr): add reason codes for real C++ and JavaScript adapters
ce8188c feat(cpp): map Clang AST JSON to validated CSR
05b4cfa feat(cpp): register a pure C++ adapter over injected ASTs
aa35b87 feat(csr): focus a run on one file without dangling edges
842ab1f feat(cpp): orchestrate discovery, Clang execution and AST injection
6ac7e13 feat(cpp): route panel analyses through the C++ service
0685cc7 feat(cpp): add an analyze-active-file command and settings
69690e1 fix(cpp): keep overloads distinct during declaration merging
0205414 test(cpp): run C-01..C-12 conformance on real AST fixtures
653f98a fix(cpp): reject analysis in Restricted Mode before reading files
```

---

## 11. Acceptance criteria

| Criterion                                            | Status                              | Evidence                                                                            |
| ---------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------- |
| AC-2.1 Representative fixtures produce validated CSR | Pass (fixtures) / Unverified (live) | `npm run test:cpp`: C-01…C-12 on committed AST fixtures                             |
| AC-2.2 Missing configuration reported clearly        | Pass                                | Heuristic run is `partial` + `missing_compile_db`; missing Clang is `E_UNSUPPORTED` |
| AC-2.3 Boundaries documented                         | Pass                                | `LANGUAGE_ADAPTERS.md` C++ table; each row maps to a fixture or an explicit gap     |
| AC-2.4 Parser failures do not crash                  | Pass                                | Missing/invalid AST, stderr, timeout, cap, cancellation tests                       |
| AC-2.5 No workspace source executed or written       | Pass (code audit)                   | Only `clang --version` and analysis runs; no writes; no build system                |
| AC-2.6 No unsupported `resolved` edge                | Partial                             | `resolved` only from `referencedDecl`; independent Clang cross-check not run        |
| AC-2.7 Header symbols attributed to the header       | Pass                                | Multi-TU fixture + `focusRunOnPath`                                                 |
| AC-2.8 Cancellation leaves no orphan processes       | Unverified                          | Kill-tree unit-tested; no live process-count assertion                              |

**Definition-of-done exceptions:** live-Clang numbers, the P2-20 cross-check,
cross-platform CI, and the P2-25 manual review remain open. They are
environment/process gaps, not known product defects.

---

## 12. Recommended next phase

**Phase 3 — JavaScript analysis.** It reuses the same host/adapter split with a
pure parser layer, adds a second language to prove the harness has no
language-specific branches, and completes the V1 language matrix. Phase 4 can
then consume constructs from both adapters.
