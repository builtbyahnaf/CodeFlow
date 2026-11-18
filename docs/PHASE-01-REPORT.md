# Phase 1 completion report — CSR and adapter foundation

**Phase:** 1 (Roadmap Part VI) · **Report template:** Roadmap §27
**Date:** 2026-11-19 · **Status:** complete, pending commit
**Baseline:** Phase 0 merged at `1ea7c0d`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

All four Phase 1 milestones (M1–M4) and all 18 task IDs (P1-01…P1-18) are
implemented. Nothing in the phase definition of done is stubbed.

### M1 — Spec and entities

| ID    | Status      | Evidence                                                                                                                           |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| P1-01 | Implemented | `docs/CSR_SPECIFICATION.md` rewritten as normative v1.1.0: entities, closed enums, invariants, limits, encoding, identity, queries |
| P1-02 | Implemented | `src/core/csr/entities.js`: total factories for every entity, `createDegradedRun`, JSON-shaped cloning                             |
| P1-03 | Implemented | `src/core/csr/identity.js`: line-free ids, overload disambiguators, `#anon.<n>`, deterministic collision fallback                  |
| P1-04 | Implemented | `src/core/csr/reasons.js`: closed reason enum, categories, descriptions; unknown codes rejected                                    |
| P1-05 | Implemented | `src/core/csr/provenance.js`: 0-based lines, UTF-16 columns, BOM handling, LF/CRLF/CR, range helpers                               |

### M2 — Validation and versioning

| ID    | Status      | Evidence                                                                                                                                   |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| P1-06 | Implemented | `src/core/csr/validate.js`: strict + defensive modes, JSON-path issues, duplicate identity detection, cycle checks, path safety, `E_LIMIT` |
| P1-07 | Implemented | `src/core/csr/migrate.js`: explicit `1.0.0 → 1.1.0` step; missing steps are `E_MIGRATION_MISSING`                                          |
| P1-08 | Implemented | `src/core/csr/serialize.js`: canonical ordering at every depth, `hashRun`, `parseRun`; timing metadata excluded                            |
| P1-09 | Implemented | `src/core/csr/limits.js` + validator enforcement; oversized input is rejected, never truncated                                             |

### M3 — Registry and queries

| ID    | Status      | Evidence                                                                                                                                        |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-10 | Implemented | `src/core/adapterRegistry.js`: registration, frozen descriptors, capability normalisation (`'partial'` preserved), longest-extension precedence |
| P1-11 | Implemented | Throws and rejections become `partial` runs with `E_ADAPTER` diagnostics; the host never sees an unhandled adapter error                        |
| P1-12 | Implemented | `src/core/csr/cancellation.js` + registry polling; cancellation becomes `E_CANCELLED`, never a rejection                                        |
| P1-13 | Implemented | `src/core/csr/query.js`: derived inverses with per-run cache and explicit invalidation                                                          |
| P1-14 | Implemented | Capability-gated queries return typed `E_UNSUPPORTED`, never `[]` or an empty graph                                                             |

The M3 checkpoint is now enforced structurally: `src/core/graph/model.js`
obtains symbols, relationships, diagnostics, and run metadata through
`createQueryLayer()`; `tests/unit/architecture.test.js` fails if the graph layer
reads `run.symbols`, `run.relationships`, `run.diagnostics`, and so on directly.

### M4 — Conformance and mock migration

| ID    | Status      | Evidence                                                                                                                                                               |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1-15 | Implemented | `tests/conformance/harness.js` implements C-01…C-12 with hostile-input guards                                                                                          |
| P1-16 | Implemented | `src/adapters/mock/index.js` emits normative CSR 1.1: overloads, lambda, `naïve`, all five statuses, external targets, evidence, constructs, data facts, diagnostics   |
| P1-17 | Implemented | Protocol v1 gains `csr.load`, `csr.data`, `query.symbol/symbols/callers/callees/constructs/capabilities`, `query.data`, `analysis.progress`; direction + handler tests |
| P1-18 | Implemented | `docs/LANGUAGE_ADAPTERS.md` rewritten as normative; `docs/ARCHITECTURE.md` cross-links both contracts and documents the Phase 1 data flow                              |

### Cross-cutting behaviour

- **Host/webview split.** `createPanelWire` owns `csr.load`, query routing, and
  progress pushes; the webview can request CSR data but never imports an
  adapter. The Phase 0 `onDidReceiveMessage` crash is fixed and has a
  regression test.
- **Fault isolation.** Invalid adapter output is dropped defensively per record
  (`csr_record_dropped`), with `issues`/`dropped` metadata; strict mode rejects
  the whole run. The boundary never throws.
- **Determinism.** Serialization is byte-stable across processes; relationship
  order is `(type, from, to, id)` and symbol order is `symbolId`.

---

## 2. What was intentionally deferred

| Deferred                                       | Target | Why it is not in Phase 1                                              |
| ---------------------------------------------- | ------ | --------------------------------------------------------------------- |
| Real C++ and JavaScript parsers/adapters       | 2, 3   | Phase 1 proves the contract; the mock is the only producer            |
| Adapter `source` reader and `runTool` facility | 2      | Needs workspace IO and compiler sandboxing decisions from Phase 2     |
| CFG/DFG edge generation                        | 4, 11  | Vocabulary and entities exist; generation and rendering do not        |
| Persistent CSR storage and schema migrations   | 8      | The migration _mechanism_ is proven; there is no database yet         |
| Incremental re-analysis and invalidation       | 9      | Depends on persistence                                                |
| Source previews, hover, navigation             | 5      | DTO deliberately carries ranges, not source text                      |
| Explanations (non-AI and otherwise)            | 6, 7   | Out of scope for the semantic contract                                |
| Performance tuning for 10k-file workspaces     | 8–10   | No real adapter or index exists to tune                               |
| `analysis.progress` emission by real adapters  | 2+     | The protocol kind and bridge hook exist; no long-running analysis yet |
| VS Code integration run in this environment    | —      | Requires a display/session; packaged VSIX was verified structurally   |

---

## 3. Files and subsystems changed

**Core CSR** — `src/core/csr/`:

- `types.js`, `reasons.js`, `entities.js`, `validate.js`, `identity.js`,
  `provenance.js`, `limits.js`, `serialize.js`, `migrate.js`, `query.js`,
  `cancellation.js`, `hash.js`.

**Registry and adapters**:

- `src/core/adapterRegistry.js` — capabilities, resolution, analyze boundary,
  degradation, cancellation, migration, dry-run, query factory.
- `src/adapters/mock/index.js` — normative fixture on `.mock` only.

**Graph and transport**:

- `src/core/graph/model.js` — now consumes CSR through the query layer.
- `src/core/graph/dto.js` — omits `reasonCode` when absent so JSON round-trips
  match the declared shape.
- `src/extension/panelWire.js` — `csr.load`, `query.*`, `analysis.progress`,
  correct `webview.onDidReceiveMessage` subscription.
- `src/extension/panel.js` — injects `loadRun: analyzeRun`.

**Tests**:

- New: `tests/conformance/harness.js`, `tests/conformance/mock.conformance.test.js`,
  `tests/conformance/hostile.conformance.test.js`.
- Expanded: `tests/unit/{architecture,csr,graph,identity,migrate,panelWire,provenance,query,registry,serialize,validate}.test.js`.

**Docs and metadata**:

- `docs/CSR_SPECIFICATION.md` (normative v1.1.0),
  `docs/LANGUAGE_ADAPTERS.md` (normative contract + C-01…C-12),
  `docs/ARCHITECTURE.md` (Phase 1 module map, protocol, failure table),
  `CHANGELOG.md` (`[0.1.001]`), `package.json` (conformance test glob),
  `docs/PHASE-01-REPORT.md` (this report), `dist/**`, `codeflow.vsix`.

No TypeScript source, configuration, or generated types were added.

---

## 4. Tests added and executed

| Area           | What is proven                                                                                                 |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Conformance    | C-01…C-12 pass for the mock adapter; a hostile fixture fails with rule-specific citations                      |
| Validation     | required fields, enums, uniqueness, identity tuples, cycles, references, ranges, paths, limits, version policy |
| Defensive mode | invalid records dropped individually, completeness lowered, surviving run still valid                          |
| Identity       | whitespace/comment/line shifts preserve ids; overloads, locals, shadowing, lambdas stay distinct               |
| Provenance     | BOM, LF/CRLF/CR, offsets ↔ positions, containment/intersection                                                 |
| Serialization  | stable key order, deterministic hash, fresh-process equality, JSON round-trip, invalid payload rejection       |
| Migration      | `1.0.0 → 1.1.0` field renames and defaults; missing/downgrade/cross-major failures                             |
| Queries        | aggregate copies, symbol/file lookups, stored/derived directions, cache hits/invalidation, `E_UNSUPPORTED`     |
| Registry       | duplicate ids, extension precedence, input validation, throw/cancel degradation, strict vs defensive, dry-run  |
| Protocol/panel | new kinds and directions, request handlers, progress pushes, `webview.onDidReceiveMessage` regression          |
| Architecture   | no adapters in core/visualization/webview, no `vscode`/`fs`/`child_process` in host-independent layers, CSP    |

Executed with `npm run verify` (lint → no-TypeScript → tests → build → license
audit) and `npm run format:check`. Packaging was executed with `npm run package`.

---

## 5. Test results

| Check                    | Result                                                                      |
| ------------------------ | --------------------------------------------------------------------------- |
| Unit + conformance tests | **173 passed, 0 failed** (≈0.9 s)                                           |
| Conformance C-01…C-12    | Mock: 12/12 pass · Hostile: fails with cited rules                          |
| ESLint                   | Clean                                                                       |
| Prettier `format:check`  | Clean across `js/cjs/json/md/yml/css/html`                                  |
| No-TypeScript check      | Pass                                                                        |
| Build                    | Pass — dev: extension 552,163 B / webview 122,222 B / CSS 6,669 B           |
| Production build         | Pass — extension 74,801 B / webview 14,989 B / CSS 6,669 B                  |
| License audit            | Pass — all shipped dependencies allowlisted                                 |
| VSIX                     | Packaged, 10 files, 52.05 KB; archive contents inspected                    |
| VSIX install check       | **Not completed** — the VS Code CLI invocation hung and was stopped; see §7 |

The hostile fixture is important evidence: it proves the conformance suite has
teeth by failing C-01 (unknown kind), C-02 (unknown file), C-03 (duplicate id),
and C-04 (missing reason code) with specific messages, while registry-level
fault isolation (C-07/C-08) still passes.

---

## 6. Performance measurements

No performance claims are made for Phase 1. The work is in-memory and operates
on a synthetic 2-file fixture; measuring it would not predict real-workspace
behaviour. The only measured numbers are artifact sizes above and the test-suite
duration (≈0.9 s). The Phase 1 risk register targets validation at <2% of
analysis time; that target must be measured against a real adapter in Phase 2,
not against the mock.

---

## 7. Known limitations

1. **Only `.mock` is supported.** The mock adapter deliberately declares no
   `.js` or `.cpp` extension and no `generateCFG`/`generateDFG`. Requesting
   constructs returns `E_UNSUPPORTED`, which is the honest result.
2. **Adapters do not receive a source reader.** The Phase 1 sketch mentions a
   host-provided `source` reader and `runTool`; the implemented contract passes
   already-read `text` and forbids file/process access. This is a deliberate
   reduction until Phase 2 defines workspace IO and compiler isolation.
3. **Progress is transport-only.** `analysis.progress` and
   `bridge.emitProgress` exist, but no adapter emits progress yet.
4. **No persistence or invalidation.** Migrations are proven in memory only.
5. **VSIX install check not completed.** `npm run check:vsix` launched the VS
   Code CLI with the installed executable, hung past the 5-minute timeout, and
   the processes it spawned were stopped. The archive itself was extracted and
   verified: manifest, `package.json`, `dist/extension.cjs`,
   `dist/webview/main.js`, `styles.css`, changelog, README, and license are all
   present and correctly sized. CI can run the install check in a clean runner.
6. **Integration tests were not run here.** They require
   `CODEFLOW_VSCODE_EXECUTABLE` and a session capable of launching VS Code.
7. **Usability of validator messages was not independently tested.** Messages
   carry JSON paths and expected/actual values, but the M2 checkpoint’s
   “another contributor understands them” review was not performed by a second
   person.
8. **`npm install` skipped three install scripts** (`esbuild`,
   `@vscode/vsce-sign`, `keytar`) due to local policy. Build and packaging still
   succeeded because the esbuild binary was available through npx resolution;
   a clean CI install should approve the scripts.

---

## 8. Security and reliability concerns

- **Adapter isolation is structural, not just conventional.**
  `tests/unit/architecture.test.js` rejects `vscode`, `fs`, `child_process`,
  `worker_threads`, and similar imports in core, adapters, visualization, and
  webview layers. C-11 additionally scans the adapter source for
  `child_process`, `eval`, and `new Function`.
- **Webview lockdown.** CSP is `default-src 'none'`, `connect-src 'none'`, no
  inline script, no `unsafe-inline`/`unsafe-eval`; the webview receives no
  adapter objects and fetches CSR only through validated messages.
- **Bounded input.** Per-collection limits and the 1,000,000-byte message cap
  reject oversized data rather than truncating it. Path validation rejects
  traversal, absolute paths, drive letters, control characters, and overlong
  paths.
- **Total boundaries.** Validation, queries, registry analysis, and message
  handling return typed results; adapter throws and cancellations become
  partial runs, not crashes or unhandled rejections.
- **Residual risk.** Phase 2’s compiler invocation is the first real
  process-execution surface. `runTool` must centralise argument/path handling
  and must not be bypassable by an adapter; the current contract has no such
  facility, so no sandbox exists yet.
- **Residual risk.** Real adapters will emit far larger runs. Validation cost
  and memory ceilings must be measured before Phase 8 persists them.

---

## 9. Documentation updated

- `docs/CSR_SPECIFICATION.md` — normative v1.1.0 contract (entities, enums,
  identity, validation, limits, serialization, queries, transport, non-goals).
- `docs/LANGUAGE_ADAPTERS.md` — normative adapter contract, capabilities,
  failure semantics, C-01…C-12, authoring checklist, mock reference.
- `docs/ARCHITECTURE.md` — Phase 1 status, expanded module map, new protocol
  kinds/data flow, failure table, deferred table.
- `CHANGELOG.md` — `[0.1.001]` accurately describes Phase 0 + Phase 1.
- `docs/PHASE-01-REPORT.md` — this report.
- No draft/`0.1.0-draft` language remains in the normative documents.

---

## 10. Commit list

No commit was created during this reporting step; the working tree is left
uncommitted at the user’s request. `HEAD` is the Phase 0 merge:

```text
1ea7c0d fix: merge confflict
```

Phase 1 changes are present as modified/untracked files (see §3). Before
committing, the intended split is:

1. `feat(csr): normative 1.1.0 model, validation, identity, serialization, migration, queries`
2. `feat(adapters): capability registry, fault isolation, cancellation, mock 1.1 fixture`
3. `test(conformance): C-01…C-12 harness plus hostile fixture`
4. `feat(protocol): csr.load, query.*, analysis.progress and panel wire handlers`
5. `docs: normative CSR/adapter contracts and Phase 1 architecture`
6. `chore(build): rebuild dist and codeflow.vsix`

---

## 11. Acceptance criteria

| Criterion | Status | Evidence                                                                                                                                                                                   |
| --------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-1.1    | Pass   | Graph/query code consumes mock data without language knowledge: architecture tests forbid adapter imports and raw `run.*` reads in `src/core/graph`; graph model uses `createQueryLayer()` |
| AC-1.2    | Pass   | Hostile conformance fixture, defensive-drop tests, malformed/oversized/cycle/duplicate validation tests                                                                                    |
| AC-1.3    | Pass   | Serialize/parse round-trip preserves ranges and evidence; graph DTO round-trips without `reasonCode` drift                                                                                 |
| AC-1.4    | Pass   | Identity matrix: whitespace/comment/line-shift edits keep ids; overload/local/shadow/lambda cases distinct                                                                                 |
| AC-1.5    | Pass   | Double-run hash equality, including a fresh Node process                                                                                                                                   |
| AC-1.6    | Pass   | Missing `resolveCalls`/`generateCFG`/`generateDFG` yields typed `E_UNSUPPORTED`, never an empty success                                                                                    |
| AC-1.7    | Pass   | Real `1.0.0 → 1.1.0` migration; missing/downgrade/cross-major cases fail explicitly                                                                                                        |
| AC-1.8    | Pass   | Validator rejects every non-`resolved` relationship/data fact without a closed-enum `reasonCode`                                                                                           |

Milestone checkpoints M1–M4 pass. The only unverified pieces are the
environment-bound VSIX install/integration runs and the independent readability
review noted in §7.

**Not passed / not run:** VSIX installation into a clean extensions directory,
VS Code integration suite, and the second-person validator-message review. None
of these indicate a known product defect; they are environment or process gaps.

---

## 12. Recommended next phase

**Phase 2 — C++ analysis.** It is the natural next dependency: it exercises the
contract with a real parser, forces the `source`/`runTool` decisions to be made
concretely, and must pass C-01…C-12 without harness changes.

Phase 2 must:

1. add the host-provided source reader and compiler-tool facility (no adapter
   file or process access);
2. keep `src/core`, `src/visualization`, and `src/webview` free of C++/JS
   conditionals and adapter imports;
3. emit honest `missing_compile_db`, `macro_expansion`, and `out_of_scope`
   statuses instead of guessing;
4. reuse `tests/conformance/harness.js` unchanged; if it needs a language
   branch, the contract is wrong;
5. record real validation and analysis timings so the <2% validation target can
   be assessed.

Phase 3 (JavaScript) can begin only after Phase 2 proves the harness is
language-neutral. Phase 4 may start consuming `ControlConstruct` trees, but
control-flow **generation** remains a Phase 4 adapter capability.
