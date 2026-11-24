# Phase 7 completion report — Call graph and cross-file relationships

**Phase:** 7 (Roadmap Part VI) · **Report template:** Roadmap §27  
**Date:** 2026-11-24 · **Status:** complete with documented environment gaps  
**Baseline:** Phase 6 completed at `f2b56e3`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Every Phase 7 task (`P7-01`…`P7-19`) has a shipped implementation under
`src/core/graph/calls/` plus protocol, host, and webview perspective wiring.
Full workspace-wide persistence lands in Phase 8 behind the `createIndexEvidenceSource`
contract shipped and tested here.

### M1 — Query layer, unindexed

| ID    | Status      | Evidence                                                                                                                                              |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7-01 | Implemented | `src/core/graph/calls/query.js`: `outgoing`, `incoming`, cursor pagination (100 default / 200 max), stale-cursor reset, cancellable `depth` expansion |
| P7-02 | Implemented | `src/core/graph/calls/sources.js`: `createAdapterEvidenceSource(query)` reads CSR via `createQueryLayer()`; tested on JS and C++ fixtures             |
| P7-03 | Implemented | `formatScopeBanner` in `kinds.js` + `#cf-scope-banner` in webview; `same_file_only` never renders a bare count (`callGraphQuery.test.js`)             |
| P7-04 | Implemented | `src/core/graph/calls/cycles.js`: Tarjan SCC + self-loop detection; marks `isCycle: true` and `↻` glyph (`callGraphCycles.test.js`)                   |

### M2 — Merge policy and cross-file

| ID    | Status      | Evidence                                                                                                                                                          |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7-05 | Implemented | `src/core/graph/calls/merge.js`: `mergeStatusPair` and `mergeEvidenceSources` implement every row of the §6 precedence truth table (`callGraphMerge.test.js`)     |
| P7-06 | Implemented | Canonical sorting before merge guarantees order-independence across shuffled permutations and double-merge idempotence (`callGraphMerge.test.js`)                 |
| P7-07 | Implemented | `resolved` in source A but absent in source B covering `from` (or file location mismatch) emits `source_disagreement` diagnostic (`callGraphMerge.test.js`)       |
| P7-08 | Implemented | `createIndexEvidenceSource` in `sources.js` adapts `callsByFrom`, `callsByTo`, `symbolById`, `batchNeighbors`; tested with fake index in `callGraphQuery.test.js` |
| P7-09 | Implemented | File staleness and `contentHash` mismatch propagate `stale` status and lower complete index scope to `partial`                                                    |

### M3 — UI perspective

| ID    | Status      | Evidence                                                                                                                                                               |
| ----- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7-10 | Implemented | `dtoKind: 'call_graph'` validated in `src/core/graph/dto.js` and rendered by `svgRenderer.js`; `codeflow.showCallGraph` command registered                             |
| P7-11 | Partial     | `createCallGraphSession` (`ego.js`) + `#cf-calls-panel` wire expand, collapse, status filter, focus dimming, and `depth limit` badges; live host UI run is author-only |
| P7-12 | Implemented | `unresolved_bucket` aggregate node (`"N unresolved targets"`) with per-reason counts in DTO and `#cf-unresolved-bucket` disclosure                                     |
| P7-13 | Partial     | `#cf-callers-list` and `#cf-callees-list` with call-site counts (`×N`) and `"More callers/callees"` cursor pagination; 250-caller pagination unit-tested               |
| P7-14 | Implemented | `#cf-switch-perspective` (`"Show in CFG"` / `"Show in Call Graph"`) and `#cf-perspective` switch views while preserving `selectedSymbolId`                             |
| P7-15 | Implemented | `callEdgeDash` and `callEdgeGlyph` (`●`, `◐`, `○`, `✕`, `⋯`, `↻`) encode every status and cycle without relying on color alone                                         |

### M4 — Scale, docs, report

| ID    | Status      | Evidence                                                                                                                                                |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P7-16 | Implemented | Measurements recorded in §3                                                                                                                             |
| P7-17 | Implemented | 50-cycle expand/collapse eviction test in `tests/unit/callGraphEgo.test.js` verifies node/edge counts return to exact baseline with zero leaked entries |
| P7-18 | Implemented | `docs/GRAPH_SPECIFICATION.md` §12, `docs/ARCHITECTURE.md`, and `README.md` updated                                                                      |
| P7-19 | Implemented | This report                                                                                                                                             |

---

## 2. Acceptance criteria

| #      | Criterion                                                                  | Result | Evidence                                                                                                     |
| ------ | -------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------ |
| AC-7.1 | A function's known callers and callees can be inspected                    | Pass   | `calls.load`, `calls.incoming`, `calls.outgoing` tested in `panelWire.test.js` and `callGraphQuery.test.js`  |
| AC-7.2 | Dynamic or indirect relationships are not falsely asserted                 | Pass   | `callGraphLanguages.test.js` and `callGraphMerge.test.js` assert zero false `resolved` upgrades              |
| AC-7.3 | Large relationship sets can be paginated, aggregated, or expanded          | Pass   | 250-caller pagination, `unresolved_bucket`, `candidateBuckets` (>5), and 500-node cap tested                 |
| AC-7.4 | Scope state is always communicated (`complete`/`partial`/`same_file_only`) | Pass   | `scope` and `scopeBanner` required by `validateDto` for `call_graph` DTOs and rendered in `#cf-scope-banner` |
| AC-7.5 | Merge is deterministic and order-independent                               | Pass   | Shuffled permutation hash equality and double-merge idempotence in `callGraphMerge.test.js`                  |
| AC-7.6 | Cycles never cause unbounded traversal                                     | Pass   | Tarjan SCC + visited-set BFS in `cycles.js` / `query.js`; 500-node cycle test in `callGraphCycles.test.js`   |
| AC-7.7 | Repeated expansion does not leak memory                                    | Pass   | 50 expand/collapse cycles in `callGraphEgo.test.js` evict unreachable descendants to exact baseline          |
| AC-7.8 | Source disagreement is surfaced, never hidden                              | Pass   | `source_disagreement` diagnostic emitted and propagated into DTO `diagnostics` and `degradations`            |

---

## 3. Measured performance

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, Node v24.22.1. Median of
5 runs on a 300-function, 598-edge call graph (and 500-node / 1,000-edge graph
for cycle detection).

| Operation                                    | Target     | Measured             |
| -------------------------------------------- | ---------- | -------------------- |
| One-hop incoming/outgoing, page 100          | < 50 ms    | 4.94 ms              |
| Depth-3 expansion (300 nodes, 598 edges)     | < 400 ms   | 11.85 ms             |
| Cycle detection (300 nodes / 500 nodes)      | < 100 ms   | 0.66 ms / 6.17 ms    |
| Build + layout 300-node call ego DTO         | < 1,000 ms | 10.93 ms             |
| 50 expand/collapse cycles (state leak check) | 0 leaked   | 0 leaked nodes/edges |

---

## 4. Honest gaps

- **No Phase 8 persistent index yet:** unindexed mode operates at
  `same_file_only` scope (with cross-module imports resolved by the Phase 3 JS
  pipeline when within budget) and explicitly banners `"in this file ·
Project-wide callers require indexing"`. The index evidence source adapter
  (`createIndexEvidenceSource`) is shipped and contract-tested with a fake
  index, ready for Phase 8 storage.
- **No live `clangd` or Clang compiler in this environment:** C++ call-graph
  tests run against CSR/AST fixtures rather than a live `clangd` process.
- **No live VS Code host window or monochrome screenshot capture:** UI controls
  (`#cf-perspective`, `#cf-switch-perspective`, `#cf-scope-banner`,
  `#cf-calls-panel`) and non-color edge encodings (`dash` + `glyphHint`) are
  verified structurally and via unit/wire tests.

---

## 5. What Phase 8 can rely on

- `createIndexEvidenceSource` (`src/core/graph/calls/sources.js`) consumes
  `callsByFrom`, `callsByTo`, `symbolById`, and `batchNeighbors` and feeds
  `mergeEvidenceSources` directly.
- Once Phase 8 provides an index provider to `createPanelWire({ indexProvider })`,
  call-graph queries automatically upgrade `scope` from `same_file_only` to
  `complete` (or `partial` when indexing is incomplete/stale) with no UI rewrite.
