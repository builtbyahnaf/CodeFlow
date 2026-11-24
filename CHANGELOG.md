# Changelog

**Author:** Muhammad Tahmid Ahnaf

All notable changes to CodeFlow are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

CodeFlow has not been published. Every entry below is unreleased.

## [0.1.988] - 2026-11-24

### Phase 9 — Incremental Indexing and Hybrid Execution

Keeping the `.codeflow/` project index accurate and cheap to maintain across
live edits, saves, file watchers, renames, deletions, and git branch switches
with a hybrid `P0..P3` execution coordinator, provisional dirty-buffer overlays,
and a 500-edit equivalence guarantee. See `docs/PHASE-09-REPORT.md` and
`docs/INDEXING_SPECIFICATION.md` (§7).

- **Incremental indexing & hybrid execution core**
  (`src/core/indexing/incremental/`):
  - `events.js`: `CHANGE_KINDS`, `normalizeChangeEvent`, and
    `coalesceEventSequence` across editor typing, saves, reverts, file watchers,
    creates, deletes, renames, IME composition gating, and global events.
  - `debounce.js`: `createIncrementalDebouncer` with `350 ms` per-document
    debounce (`100..2000 ms` clamped), `3,000 ms` trailing max-wait flush under
    continuous typing, IME composition hold, and `> 25` file burst / git-checkout
    coalescing into a single `bulk_burst` pass.
  - `signatures.js` & `classify.js`: line-independent `computeSymbolSignature`,
    $O(N)$ `diffFileRows`, and `classifyChange` covering every row of the Phase 9
    §5.1 matrix (`local` for comment/whitespace and function-body-only edits,
    `dependent` for symbol/signature/import/header changes, `global` for
    compile DB, toolchain, and exclusion config changes).
  - `cascade.js` & `guardrails.js`: `buildReverseDependencyGraph` (including
    conservative `possible`/`unresolved` edges), cycle-safe
    `planInvalidationCascade` with cost-modeled escalation (`direct_dependents`,
    `module_subtree`, `full_project`), and `evaluateUncertaintyGuardrails`
    (missing compile DB, excluded targets, stale-on-failure preservation, and
    `analysis_nondeterministic` diagnostics).
  - `provisional.js`: `createProvisionalOverlay` keeping dirty-buffer analysis in
    memory (`maxFiles: 4`), capping cross-file edges at `possible`, and
    reconciling on save or discarding on revert.
  - `priorityQueue.js`, `backpressure.js`, & `telemetry.js`: `P0..P3` priority
    queue with cooperative preemption, P3 aging, Phase 10 zoom-expansion P0
    lane, `(fileId, contentHash, generation)` supersession, continuous-typing
    pause/resume (`paused_while_typing`), `100 ms` event-loop lag guard
    (`lag_throttled`), and local-only content-free p50/p95 telemetry.
  - `coordinator.js` & `scenarios.js`: `createIncrementalCoordinator`,
    config-change exclusion reconciliation, and
    `generateDeterministicEditSequence` for the 500-edit equivalence test.

- **Host watchers, settings, and protocol** (`src/extension/indexing/`,
  `package.json`):
  - `watchers.js`: `registerIncrementalWatchers` bridging editor, save, close,
    file create/delete/rename, `.codeflow/config.json`, and
    `compile_commands.json` events into the coordinator.
  - Added `codeflow.index.debounceMs` setting and `npm run test:incremental`
    (13 unit test suites, 18 tests including the 500-edit equivalence test and
    1-hour simulated soak; 598 total unit + conformance tests passing).

## [0.1.902] - 2026-11-24

### Phase 8 — Optional Project Index

An optional, non-invasive `.codeflow/` project index that upgrades cross-file
call graphs (`scope: 'complete'` / `'partial'`) and provides workspace-wide
symbol, relationship, and dependency queries without ever blocking single-file
exploration or mutating workspace source files. See `docs/PHASE-08-REPORT.md`,
`docs/INDEXING_SPECIFICATION.md`, and `docs/adr/0013-index-storage-engine.md`.

- **Indexing core** (`src/core/indexing/`):
  - `schema.js`: Schema v1 logical tables (`meta`, `files`, `symbols`,
    `relationships`, `dependencies`, `analysis_state`), `SCHEMA_V1_DDL`,
    `createEmptyIndexSnapshot`, and `validateIndexSnapshot` enforcing
    referential integrity and rejecting raw source text or AST blobs.
  - `migrate.js`: `migrateIndexSchema` supporting deterministic sequential
    migration (`1 -> 1`, `1 -> 2`) and rejecting incompatible major versions
    with `E_SCHEMA_INCOMPATIBLE` and `rebuildRequired: true`.
  - `config.js`: fail-soft `.codeflow/config.json` normalization
    (`normalizeIndexConfig`) and `isSafeGlobPattern` rejecting traversal (`..`),
    absolute paths, and NUL bytes with `unsafe_index_pattern` diagnostics.
  - `exclusions.js`: `shouldIndexPath` and `parseGitignoreHints` enforcing
    unconditional `.codeflow`/`.git` self-exclusion and strict precedence
    (`user exclude > user include > default excludes & .gitignore hints`).
  - `ordering.js`: `orderCandidateFiles` (shallow-first, then byte size
    ascending, then lexicographical path) and `planIndexBatches`.
  - `fingerprints.js`: SHA-256 `computeContentFingerprint` and
    `diffWorkspaceFingerprints` (`unchanged`, `added`, `modified`, `deleted`,
    and `renamed` delete+add pairs).
  - `locks.js`: `createLockPayload` and `evaluateLockState` (`free`,
    `owned_by_self`, `held_by_live_process` read-only fallback, and
    `stale_recoverable` interrupted-run recovery).
  - `queries.js`: `createIndexQuerySurface` (`symbolById`, `symbolsByName`,
    `symbolsInFile`, `neighbors`, `callsByFrom`, `callsByTo`, `batchNeighbors`,
    `fileDependencies`, `filesUnder`, `stats`, `health`, `logicalHash`).
  - `workflow.js`: `decideFirstOpenAction` covering all eight Phase 8 §9
    workspace-open states and `formatIndexStatusBar`.

- **Storage, host pipeline, commands, and protocol** (`src/storage/`,
  `src/extension/indexing/`, `src/core/protocol/`):
  - `indexStore.js`: swappable `.codeflow/` transactional store with `.wal`
    write-ahead journal commits, `ENOSPC` rollback, `.corrupt-<timestamp>`
    quarantine, `repair`, `reset`, `clear`, and multi-window lock handling.
  - `pipeline.js`, `gitignore.js`, `service.js`: cancellable batched indexing
    pipeline, consent-guarded `.gitignore` helper, status bar item, and 7
    commands (`codeflow.indexWorkspace`, `codeflow.cancelIndexing`,
    `codeflow.rebuildIndex`, `codeflow.repairIndex`, `codeflow.showIndexStatus`,
    `codeflow.clearIndex`, `codeflow.openIndexConfiguration`).
  - Added `index.status` and `index.data` protocol kinds and wired
    `indexProvider` into `panelWire.js` to upgrade cross-file call graphs.

- **Tests and documentation**:
  - Added `npm run test:index` (11 unit test suites, 32 tests) plus architecture,
    protocol, and panelWire tests (578 total unit + conformance tests passing).
  - Added `docs/adr/0013-index-storage-engine.md`,
    `docs/INDEXING_SPECIFICATION.md`, and `docs/PHASE-08-REPORT.md`.

## [0.1.815] - 2026-11-24

### Phase 7 — Call Graph and Cross-File Relationships

Answering "who calls this, and what does it call?" with a deterministic
multi-source merge policy, honest scope banners (`same_file_only`, `partial`,
`complete`), cycle marking, unresolved buckets, and an interactive call-graph
perspective. See `docs/PHASE-07-REPORT.md` and `docs/GRAPH_SPECIFICATION.md`
(§12).

- **Call-graph core and merge policy** (`src/core/graph/calls/`):
  - `kinds.js`: frozen scopes, relationship types (`calls`, `instantiates`,
    `overrides`, `references`), node kinds (including `unresolved_bucket` and
    `candidate_bucket`), limits (`100` default / `200` max page, depth `3`
    default / `6` max, `500` max nodes), `formatScopeBanner`, and non-color
    `callEdgeDash` / `callEdgeGlyph` (`●`, `◐`, `○`, `✕`, `⋯`, `↻`).
  - `merge.js`: `mergeStatusPair` and `mergeEvidenceSources` implementing the
    Phase 7 §6 precedence truth table (`resolved > inferred > possible >
unresolved`, plus `stale` provenance), candidate set unioning without false
    `resolved` upgrades, cross-type isolation, site-keyed unresolved bucket
    preservation, order-independent canonical sorting, and `source_disagreement`
    diagnostics.
  - `cycles.js`: linear $O(V + E)$ Tarjan strongly-connected-components and
    self-loop detector (`detectCallCycles`).
  - `sources.js`: `createAdapterEvidenceSource(query)` (`same_file_only`) and
    `createIndexEvidenceSource(index)` (`callsByFrom`, `callsByTo`,
    `symbolById`, `batchNeighbors`) ready for Phase 8 indexing.
  - `query.js`: `createCallGraphQueryService` with cursor-paginated `outgoing`
    and `incoming` queries, stale-cursor `runId` reset, cancellable `depth`
    expansion returning both nodes and edges, and candidate bucket aggregation.
  - `ego.js`: `createCallGraphSession` supporting `open`, 1-hop `expand`,
    descendant-evicting `collapse`, status/kind/file `filter`, and neighborhood
    `focus` dimming, producing validated `dtoKind: 'call_graph'` DTOs.

- **Protocol, host, and webview perspective** (`src/core/protocol/`,
  `src/extension/`, `src/webview/`, `src/visualization/renderer/`):
  - Added `calls.load`, `calls.outgoing`, `calls.incoming`, `calls.expand`,
    `calls.collapse`, `calls.filter`, `calls.focus` (webview → host) and
    `calls.data`, `calls.neighbors` (host → webview).
  - Registered `codeflow.showCallGraph` (`Show Call Graph for Function`) in
    `package.json` and `commands.js`, wired through `panel.js` and
    `panelWire.js`.
  - Added perspective picker (`#cf-perspective`), cross-perspective `"Show in
CFG"` / `"Show in Call Graph"` button (`#cf-switch-perspective`), scope
    banner (`#cf-scope-banner`), expand/collapse/focus/filter toolbar,
    paginated caller/callee side lists, and unresolved target bucket disclosure.

- **Tests and documentation**:
  - Added `npm run test:calls` (`callGraphMerge`, `callGraphCycles`,
    `callGraphQuery`, `callGraphLanguages`, `callGraphEgo` — 19 tests) plus
    protocol, panelWire, and panelTemplate tests.
  - Updated `docs/GRAPH_SPECIFICATION.md` (§12), `docs/ARCHITECTURE.md`,
    `README.md`, and added `docs/PHASE-07-REPORT.md`.

## [0.1.731] - 2026-11-24

### Phase 6 — Deterministic Explanation Engine

The "understand" half of the product: every statement, condition, branch, loop,
call, return, variable, mutation, function summary, dependency, pattern, and
complexity claim is produced from CSR/CFG evidence by deterministic rules, with
no model, no network, and no randomness. See `docs/PHASE-06-REPORT.md`,
`docs/EXPLANATION_ENGINE.md`, and
`docs/adr/0011-deterministic-explanations.md`.

- **Core explanation modules** (`src/core/explanation/`):
  - `model.js`: ruleset `1.0.0`, `EvidenceRef`/`ExplanationItem`, fragment
    assembly that drops evidence-less or HTML fragments, stable ids
    (`exp:<subject>:<rule>:d<depth>:v<ruleset>`), and a validator.
  - `facts.js`: language-neutral fact extraction from the CFG and the CSR query
    layer only — statements, conditions, branches, loops, calls, returns,
    variables, dependencies, and pattern proof flags.
  - `phrasing.js`: status-mandated qualification for `resolved`, `inferred`,
    `possible`, `unresolved`, and `stale`, limitation formatting, a
    prohibited-language linter (advice, certainty overclaims, name-based
    speculation, unproven algorithm names), and central stale qualification.
  - `settings.js`: defaults and clamping for depth, evidence, and limitations.
  - `cache.js`: bounded cache keyed by run, ruleset, depth, staleness, subject.
  - `engine.js`: rule selection, throw isolation, assembly, validation, linting,
    and caching; facts cached per run and graph.
  - `rules/`: statement, condition/branch, loop, call/return, variable/dependency,
    function-summary, and pattern/complexity groups with explicit proof
    obligations in `catalog.js`.

- **Protocol and host** (`src/core/protocol/`, `src/extension/`):
  - Added `explain.node` and `explain.function` (webview → host) and
    `explain.data` (host → webview) to the directional allowlists.
  - `panelWire.js` handlers require a loaded CFG, never call `ensureRun`, return
    `E_NO_ANALYSIS` before analysis and `E_NOT_FOUND` for unknown nodes, and
    derive the stale flag from tracked files.
  - `panel.js` passes nested explanation settings beside preview settings and
    pushes live changes.

- **Webview** (`src/webview/`, `src/extension/panelTemplate.js`):
  - Function summary above the graph, node explanation card below details with a
    1–4 depth selector, grounded/qualified styling, evidence links that reuse
    `navigate.to`, and a collapsible limitations disclosure that remains
    accessible when collapsed.
  - One-line depth-1 explanation in the hover preview card; skeleton only after
    100 ms so fast responses never flicker.

- **Settings (`package.json`)**:
  - Added `codeflow.explanation.defaultDepth` (1–4, default 2),
    `codeflow.explanation.showEvidence` (default true), and
    `codeflow.explanation.includeLimitations` (default true), with 1:1 manifest
    parity tests.

- **Tests and documentation**:
  - Added suites for the explanation model, facts, phrasing, settings, rules,
    patterns, and engine, plus protocol, panel-wire, template, and architecture
    assertions (explanation layer isolation and no raw `run.*` access).
  - Added `docs/EXPLANATION_ENGINE.md`, ADR 0011, and
    `docs/PHASE-06-REPORT.md`; updated `docs/ARCHITECTURE.md` and `README.md`.
  - Depth-4 function explanation on a 724-node CFG: 11.9 ms cold, 0.03 ms warm;
    node median 0.057 ms, P95 0.128 ms.

- **Known gaps (recorded, not hidden)**:
  - Real C++/JavaScript adapters do not yet emit every pattern-proof extension
    flag, so pattern naming is fixture-verified while recursion and bounds
    narrowing fire from real CFG/relationship evidence.
  - Blind-reader review (3 readers) was not performed; only the author is
    available in this environment.
  - No live VS Code host integration run or webview frame trace executed here.

## [0.1.589] - 2026-11-23

### Phase 5 — Source Synchronization and Hover Preview

The trust foundation: hovering any node shows an exact slice of the real
source document, double-clicking or pressing `Enter` navigates to that range,
editor cursor movement highlights matching nodes, and edits conservatively mark
affected nodes stale. See `docs/PHASE-05-REPORT.md`,
`docs/GRAPH_SPECIFICATION.md` (§11), and `docs/adr/0010-preview-highlighting.md`.

- **Core source modules** (`src/core/source/`):
  - `ranges.js`: `normalizeRangeRef`, `createDocumentView`, `rangeWithinDocument`
    (no clamping; rejects out-of-bounds with `E_RANGE`), `sliceText`,
    `truncateSource` (strips trailing line ending so `N`-line caps render `N`
    lines), containment/overlap helpers, and conservative `integrityFor`.
  - `cache.js`: bounded LRU cache (30 entries / 5 MB) with prefix invalidation.
  - `settings.js`: `PREVIEW_DEFAULTS`, clamping (`delayMs` `0–2000`, `maxLines`
    `4–40`), and `settingsChanged`.
  - `presentation.js`: pure `buildPreviewModel` handling exact, truncated,
    empty/whitespace, missing, stale, and synthetic nodes.

- **Host source access and navigation** (`src/extension/`):
  - `sourcePaths.js` + `sourceAccess.js`: single host read path via
    `workspace.openTextDocument` → `document.getText(range)` with lexical
    workspace containment, 64 KB slice cap (`E_LIMIT`), batch range validation,
    and post-analysis full-file SHA-256 baseline capture.
  - Cache invalidation and `source.stale` push on document change, deletion,
    and rename; `panel.js` blocks navigation to stale or missing files with
    `E_SOURCE_STALE` / `E_SOURCE_MISSING`.
  - `panelWire.js`: `source.slice`, `source.validation`, `navigate.to` (all
    asserted never to call `ensureRun`), debounced editor-to-graph selection
    sync (`selection.changed`), live settings push (`settings.data`), and
    `focusGraph`.
  - `commands.js`: registered `codeflow.backToGraph` to reveal the panel and
    restore node focus.

- **Webview preview, highlighting, and accessibility** (`src/webview/`,
  `src/visualization/renderer/`):
  - `previewController.js`: pure injected-timer hover-intent state machine
    (300 ms dwell, >12 px pointer reset, 150 ms grace, pinning, `pinByDefault`,
    `Esc` dismiss).
  - `highlight.js`: `highlight.js@11.11.1` (BSD-3-Clause, webview-only, core +
    `cpp` + `javascript` only) with `textContent` span rendering and automatic
    plain-text fallback (`plainLines`).
  - `panelTemplate.js`, `svgRenderer.js`, `main.js`, and `styles.css`: preview
    card DOM, click-to-navigate (with explicit "Open" button retained when
    disabled), keyboard loop (`Tab`/arrows, `H`/`Shift+Space`, `Enter`, `Esc`),
    and `.is-synced` / `.is-stale` non-colour cues.

- **Settings (`package.json`)**:
  - Added `codeflow.preview.enabled`, `delayMs`, `maxLines`,
    `syntaxHighlighting`, `clickToNavigate`, `pinByDefault`, and
    `codeflow.navigation.openInPreviewTab`.

- **Tests and documentation**:
  - Added unit suites for `sourceRanges`, `sourceCache`, `sourceSettings`,
    `sourcePresentation`, `previewController`, `highlight`, `sourcePaths`, and
    all-node `sourceFidelity`, plus 10 `panelWire` tests and updated protocol and
    template tests.
  - Added ADR 0010, `docs/GRAPH_SPECIFICATION.md` §11, `docs/PHASE-05-REPORT.md`,
    and updated `docs/ARCHITECTURE.md`, `docs/DEPENDENCIES.md`, and `README.md`.

- **Known gaps (recorded, not hidden)**:
  - `tests/fixtures/cpp/ast-cfg.json` retains one pre-existing ternary node
    whose range extends past end-of-line (rejected by `rangeWithinDocument`);
    C++ fidelity tests use `parity.cpp`/`ast-parity.json`.
  - No local Clang/clangd, live VS Code host integration run, or webview frame
    trace executed in this environment; `npm run check:vsix` previously hung.

## [0.1.445] - 2026-11-23

### Phase 4 — CFG and first visualization

The first useful product moment: a C++ or JavaScript function opens as an
accurate, inspectable control-flow graph. See `docs/PHASE-04-REPORT.md`,
`docs/GRAPH_SPECIFICATION.md` and `docs/adr/0009-graph-rendering-stack.md`.

- **CFG vocabulary and builder** (`src/core/graph/cfg/`):
  - Frozen node kinds (`entry`, `exit`, `statement`, `condition`, `multiway`,
    `merge`, `loop_header`, `loop_latch`, `loop_body_entry`, `break`,
    `continue`, `return`, `throw`, `call`, `await`, `catch_entry`,
    `finally_entry`, `unreachable`, `unmodeled`) and edge kinds (`seq`, `true`,
    `false`, `case`, `default`, `loop_back`, `break`, `continue`, `return`,
    `throw`, `exception`, `finally`, `unreachable`).
  - Lowering from language-neutral `ControlConstruct` trees only; the builder
    reads the CSR through the query layer and never imports an adapter.
  - Sequence, `if`/`else`, ternary, `&&`/`||`/`??`, all loop forms, `switch`
    with fallthrough, labelled jumps, `return`/`throw`/`try`/`catch`/`finally`,
    `await`, and explicit dead-code regions.
  - One entry and one exit; every other node is reachable or explicitly
    `unreachable`. Unexpected failures become `E_CFG_INTERNAL`, never throws.

- **Adapter integration**:
  - Both adapters emit the same construct vocabulary and set
    `generateCFG: true`; C++ and JavaScript produce structurally equivalent
    CFGs for the shared parity program.
  - Call constructs carry `callSite`; the graph shows resolved, inferred,
    possible and unresolved targets without inventing a resolved edge.
  - `goto` and computed `goto` become `unmodeled` plus an `unresolved` edge and
    a typed reason; unsupported shapes are reported, never flattened.

- **DTO and protocol**:
  - CFG DTO keeps `dtoVersion: 1`; adds `dtoKind`/`graphKind: 'cfg'`,
    `entryId`/`exitId`, function metadata, `labelLines`, `badges`,
    `isSynthetic`, `unreachable`, `rangeRef`, per-node call summaries, edge
    `kind`/`dash`/`glyphHint`, `degradations`, `truncated`/`truncationReason`,
    `analysisCompleteness`, `extent` and `legend`.
  - `validateCfgDto` enforces invariants at the boundary; no source text
    crosses the boundary.
  - Protocol kinds `cfg.load` (webview → host), `cfg.data` (host → webview) and
    bidirectional `cfg.functions`.

- **Visualization**:
  - Host-side deterministic layered layout; the webview only draws. Back edges
    do not push ranks; unreachable nodes sit in a separate band.
  - Pan, zoom, fit, selection, legend, degradation banner and a node detail
    panel with kind, range, status, call targets and degradation reason.
  - Status is encoded with a glyph and dash pattern as well as colour.
  - `codeflow.showCfg` quick pick and an in-panel function picker.
  - 2 000-node render cap with an explicit truncation notice; 1 500-node
    build gate with an opt-in.

- **Renderer decision**: custom SVG plus custom CFG layout. Measured at
  1 500 nodes: layout 1.35 ms and 2.4 KB gzip for the renderer, against
  1 555–3 698 ms and 155–440 KB gzip for ELK/Cytoscape. ADR 0009 records the
  losing options and the unmeasured browser traces.

- **Tests and fixtures**:
  - 36 shared neutral fixtures across both languages, a CSR-backed harness and
    `npm run test:cfg` (76 tests).
  - C++ AST fixtures for `cfg.cpp` and `parity.cpp`; no compiler or process is
    required by the CFG tests.
  - Fault injection, immutability, truncation, performance and protocol tests.

- **Known gaps (recorded, not hidden)**:
  - No Clang/clangd in this environment; C++ CFG verification uses committed
    AST fixtures, not live compiler runs.
  - Browser frame traces for sustained pan/zoom were not measured; layout is
    off the webview path by construction.
  - The CFG spec review was author-only.
  - VSIX install and Linux/macOS CI remain unrun here.

## [0.1.346] - 2026-11-21

### Phase 3 — JavaScript Analysis Foundation

Real JavaScript analysis through acorn and eslint-scope, with the same
host/pure-adapter split as C++ and typed uncertainty. See
`docs/PHASE-03-REPORT.md` and `docs/adr/0008-javascript-parser-choice.md`.

- **Parser boundary** (`src/adapters/javascript/`):
  - acorn 8.19.0 for ESTree with locations/ranges, eslint-scope 8.4.0 for lexical scopes; both pure JavaScript and bundled by esbuild.
  - BOM, hashbang, CRLF/CR/LF, unicode identifiers and UTF-16 columns.
  - Generic AST walking without `acorn-walk`; module-specifier collection for static, re-exported, dynamic and CommonJS requests.

- **Declarations and scopes**:
  - Functions, arrows, classes, fields, private `#names`, static members, getters/setters, variables, destructuring patterns, parameters and import bindings.
  - Shadowing, hoisting, TDZ references and catch scopes; named function expressions use their inner name.
  - `var`/`let`/`const`, default parameters, object-literal methods and anonymous identities that survive whitespace/comment/line shifts.

- **Module graph**:
  - ESM named/default/namespace, re-export chains to depth 8, CommonJS `require`/`module.exports`/`exports.x`, JSON modules.
  - Conservative resolver: relative files and `index.*`, optional workspace `node_modules`, typed gaps for aliases, absolute paths, escaping paths and complex `exports` maps.
  - Circular imports terminate; caps produce `budget_exceeded` diagnostics instead of silent truncation; mixed ESM/CJS files are partial with `mixed_module_system`.

- **Calls and uncertainty**:
  - `resolved` only for lexically known functions and imports with a known export.
  - Same-file receiver shapes → `inferred`/`dynamic_dispatch`; unknown receivers, computed members and unknown variables → `unresolved` with typed reasons.
  - `this.field` and accessor property access → `inferred` `reads`/`writes`.
  - Callbacks → `possible`/`callback_parameter`; timers → `possible`/`deferred_invocation`; `eval`/`with`, prototype mutation and recursion are flagged.

- **Host pipeline** (`src/extension/javascript/pipeline.js`):
  - Restricted Mode returns `E_UNTRUSTED` before any read; workspace/path/NUL/exclusion/minified checks; 2 MB and 20 000-line caps.
  - Package-type cache, bounded module BFS, JSON modules, diagnostics.
  - Panel analyses route by adapter id; settings: `codeflow.javascript.resolveNodeModules`, `maxFileBytes`, `maxLines`, `maxModules`, `maxDepth`.

- **Tests and fixtures**:
  - 28 concern folders with machine-checked `expected.json`, a generic runner, focused unit tests, and C-01…C-12 conformance.
  - `npm run test:js`; 80 JavaScript tests; 332 total tests passing.
  - `perf-large` (5 100 lines) measured at ≈350 ms end to end on one Windows machine; no RSS/Linux/macOS numbers.

- **Documentation**: ADR 0008, JavaScript section in `docs/LANGUAGE_ADAPTERS.md`, production-dependency table, and the Phase 3 report.

- **Known gaps (recorded, not hidden)**:
  - TypeScript and JSX are rejected by design, not partially parsed; bundler aliases and complex `exports` maps are deferred to Phase 8.
  - The anti-false-positive audit (P3-23) and diagnostics wording review (P3-27) were author-only; the report lists all 15 resolved call edges.
  - No real-world OSS files were added to the corpus; performance is synthetic and single-machine.
  - VSIX install and Linux/macOS CI remain unrun in this environment.

## [0.1.213] - 2026-11-19

### Phase 2 — C++ Analysis Foundation

Real C++ analysis through Clang AST JSON, with a strict host/pure-adapter split
and honest degradation. See `docs/PHASE-02-REPORT.md` and
`docs/adr/0007-cpp-integration-route.md`.

- **Bounded process tooling** (`src/extension/tooling/runTool.js`):
  - Argument arrays only (no shell), fixed working directory, timeout, cancellation, kill-tree, and stdout/stderr caps.
  - The only module in the codebase allowed to spawn a process.

- **Toolchain and configuration** (`src/extension/cpp/`):
  - Clang discovery: setting → compile-database compiler → `PATH` → `clang-cl`/`xcrun`, with a version policy that warns and degrades instead of hard-failing.
  - Compilation-database discovery and parsing with an explicit override, multi-database scoring, and malformed-JSON handling. Build systems are never executed.
  - Heuristic fallback (include paths, defines, standard) for projects without a database; every such run is `partial` with `missing_compile_db`.
  - Header→representative-TU mapping; header analyses are filtered with `focusRunOnPath` and marked `partial` with an `out_of_scope` diagnostic.
  - Unicode/CRLF-safe source locator (UTF-8 byte → UTF-16 column) and a 4 MB source cap.

- **Pure C++ adapter** (`src/adapters/cpp/`):
  - Clang AST JSON → validated CSR: files, namespaces, classes/structs, enums, aliases, functions, methods, constructors/destructors, lambdas, variables, fields, parameters.
  - Calls with honest statuses: `resolved` only from `referencedDecl`; virtual dispatch `possible`/`dynamic_dispatch`; function pointers `unresolved`/`function_pointer`; dependent templates degrade.
  - Overload identity includes a disambiguator, so same-name overloads stay distinct and calls resolve to the right declaration.
  - `includes` edges for workspace-owned files; system headers excluded; `instantiates` for constructor expressions.
  - Diagnostics for parse errors, unsupported constructs, missing configuration, timeouts, caps, and focused headers; sanitised, bounded stderr.

- **Host integration**:
  - `createCppAnalysisService` orchestrates discovery, analysis, and header focusing; discovery results are cached with a TTL.
  - Restricted Mode returns `E_UNTRUSTED` before any read or spawn.
  - Panel analyses route through the service; new `codeflow.analyzeActiveFile` command.
  - Settings: `codeflow.cpp.clangPath`, `compileCommandsPath`, `fallbackIncludePaths`, `fallbackDefines`, `fallbackStandard`, `timeoutMs`, `maxOutputBytes`, `maxFileBytes`.

- **Tests and fixtures**:
  - `npm run test:cpp` and C-01…C-12 conformance on a real AST fixture.
  - `tests/fixtures/cpp/` covers basic declarations, overloads, unicode, CRLF/LF, multi-TU headers, templates, virtual dispatch, function pointers, macros, and parse errors.
  - 79 new tests over Phase 1 (252 total), all passing.

- **Documentation**: ADR 0007, normative C++ section in `docs/LANGUAGE_ADAPTERS.md`, and the Phase 2 report.

- **Known gaps (recorded, not hidden)**:
  - No Clang/clangd/libclang is installed in the development environment, so live-Clang timings, the P2-20 anti-false-positive cross-check, and the `perf-medium` smoke test are unverified.
  - Templates are modelled but not instantiated; macros keep expansion-site provenance only; constructors emit `instantiates` but not constructor `calls`.
  - Cancellation kill-tree is unit-tested with fake children; no OS-level orphan assertion was run.
  - No Linux/macOS CI run in this environment.

## [0.1.001] - 2026-11-16

### Project Initialization & Core Architecture

Project initialized with foundational Phase 0 and Phase 1 architecture:

- **CSR (CodeFlow Semantic Representation) 1.1 Normative Specification**
  (`docs/CSR_SPECIFICATION.md`):
  - Closed vocabulary for symbol kinds, relationship types, resolution statuses, reason codes, evidence kinds, control constructs, and data facts.
  - Semantic and schema validator supporting strict and defensive modes (`validateAnalysisRun`), with JSON-path issues, duplicate-identity detection, parent/child cycle checks, and defensive per-record dropping that lowers completeness and emits diagnostics.
  - Total entity factories with safe defaults and JSON-shaped cloning.
  - Deterministic FNV-1a hashing and canonical serialization (`canonicalRun`, `serializeRun`, `hashRun`) that is byte-identical across processes and excludes timing metadata.
  - Line indexing and coordinate mapping with 0-based UTF-16 columns, BOM handling, and LF/CRLF/CR tolerance (`createLineIndex`, `rangeFromOffsets`, `sliceRange`).
  - Explicit, non-mutating version migration (`migrateRun`); the `1.0.0 → 1.1.0` step is implemented and a missing step is `E_MIGRATION_MISSING`.
  - Stable symbol identity that excludes line numbers, disambiguates overloads by arity and anonymous constructs by ordinal, and allocates deterministic relationship ids.
  - In-memory query layer with capability gating and derived inverse relationships (`query.symbol`, `query.symbols`, `query.callers`, `query.callees`, `query.constructs`, `query.capabilities`).
  - Cooperative cancellation tokens (`CancellationSource`, `AbortSignal` bridge) that degrade to a partial run instead of rejecting.
  - Hard per-run size ceilings (`E_LIMIT`); oversized data is rejected, never truncated.

- **Adapter Registry & Engine** (`docs/LANGUAGE_ADAPTERS.md`):
  - Registry with capability normalisation (`true`/`false`/`'partial'`) and longest-extension dispatch.
  - Fault isolation: thrown errors and cancellations become validated partial runs with `E_ADAPTER`/`E_CANCELLED` diagnostics.
  - Boundary checks for input, `runId` echo, `adapterId`, version compatibility, and migration.
  - Dry-run mapping (`dryRun`) that resolves files to adapters without invoking them.
  - Mock adapter upgraded to normative CSR 1.1: overloads, an anonymous lambda, non-ASCII identifiers, every resolution status, external targets, evidence, control constructs, data facts, and diagnostics.
  - Reusable conformance harness implementing C-01…C-12 (`tests/conformance/harness.js`), plus a hostile-fixture test proving failures cite specific rules.

- **Extension Host & Webview Protocol**:
  - Versioned, allowlisted messaging envelope with additive Phase 1 kinds (`csr.load`, `csr.data`, `query.*`, `query.data`, `analysis.progress`).
  - Decoupled webview wiring bridge (`createPanelWire`) with asynchronous request handling, load-failure correlation, progress pushes, and typed query routing. The host owns the validated run and its query layer.
  - Nonce-based Content Security Policy (CSP), single-panel lifecycle, and disposal cleanup.
  - Regression test proving the bridge subscribes on `panel.webview`, not on the panel itself.

- **Quality Assurance & Tooling**:
  - 173 unit and conformance tests covering protocol, CSR validation, identity, provenance, serialization, migration, queries, the registry, the conformance suite, and panel wiring.
  - Architectural constraint tests (no-TypeScript, host-independent layers, restricted-mode declarations).
  - ESLint global environment updates for Node.js timers (`setImmediate`).

## [Unreleased]

### Added

- Phase 0 engineering foundation (roadmap Part VI):
  - VS Code extension manifest, activation, logger, three commands, and a single
    reusable graph panel with a nonce-based CSP.
  - Versioned, allowlisted webview protocol with a symmetric request/response
    bridge, timeouts, in-flight limits, size limits, and prototype-pollution
    guards.
  - Draft CSR vocabulary and validator, an adapter registry with fault
    isolation, and a mock `.mock` adapter.
  - Language-independent graph model, deterministic layered layout, and a
    validated JSON view model (DTO).
  - SVG renderer with pan, zoom, selection, keyboard navigation, and status
    styling; status legend and selection details.
  - Path-containment helpers, log redaction, and diagnostics report.
  - 88 unit tests, an integration suite for the real extension host, ESLint
    layer rules, a no-TypeScript guard, and a dependency license audit.
  - CI on Ubuntu and Windows: lint, unit tests, build, license audit, VSIX
    packaging, artifact upload, plus an `xvfb` integration job.
  - Documentation: architecture, security baseline, dependency review,
    development guide, draft CSR and adapter specifications, and ADRs 0001-0006.
  - `dist/` build pipeline with esbuild producing a CommonJS host bundle and an
    IIFE webview bundle; production packaging via `vsce`.

### Known limitations

- No real C++ or JavaScript analysis. The graph is synthetic and labeled as
  mock data.
- No control-flow, data-flow, source preview, indexing, or explanations.
- Integration tests require a VS Code download and could not be executed in the
  initial development environment (network failure); CI is the first full run.
- Symlink-aware path validation, worker-isolated adapters, and fuzzing are
  deferred to later phases (Phase 1/2 and Phase 8).
