# Graph Specification

**Author:** Muhammad Tahmid Ahnaf

This document is normative for the graph layer. It defines the vocabulary, the
invariants, the lowering rules and the degradation catalog that every adapter
and every renderer must agree on. Phase 4 freezes the control-flow graph (CFG)
section; later phases extend this document rather than forking the vocabulary.

The CSR remains the only model adapters produce. Graph code reads the CSR
through the query layer and never imports an adapter, parser, process or the
webview.

---

## 1. Terms

| Term           | Meaning                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Construct      | A language-neutral `ControlConstruct` record in the CSR. It describes source structure but not graph edges. |
| CFG            | A directed graph of basic control-flow points for one function.                                             |
| Node           | A control-flow point with a kind, a status, a label and an optional source range.                           |
| Edge           | A permitted control transfer between two nodes.                                                             |
| Synthetic node | A node with no source text of its own (`entry`, `exit`, `merge`).                                           |
| Degradation    | A typed record that says something could not be modeled. It is data, not a log line.                        |
| DTO            | The JSON view-model that crosses the extension-host/webview boundary.                                       |

Coordinates are 0-based lines and UTF-16 columns, exactly as in the CSR.
Identity never contains a line number; whitespace, comments and line shifts do
not change a node or symbol identity.

---

## 2. Invariants

Every CFG that leaves the builder satisfies these invariants. `validateCfgDto`
re-checks the serializable subset at the protocol boundary.

1. Exactly one `entry` node and exactly one `exit` node exist.
2. Every non-synthetic source node has a range with a valid file, a start before
   its end, and non-negative positions.
3. Every edge references two existing nodes. There are no dangling edges.
4. There are no duplicate edges (same `from`, `to`, `kind` and case label).
5. Every node is reachable from `entry`, or is explicitly marked
   `unreachable: true` and carries an explanation.
6. Every node kind and edge kind belongs to the frozen vocabulary in
   `src/core/graph/cfg/kinds.js`.
7. Every status belongs to `resolved`, `inferred`, `possible`, `unresolved` or
   `stale`.
8. Structural edges (`seq`, `true`, `false`, `case`, `default`, `loop_back`,
   abrupt jumps) are `resolved` by construction. `exception` edges are at most
   `inferred`. `goto` and computed-goto edges are `unresolved`.
9. An unmodeled construct produces an `unmodeled` node and a degradation entry.
   It is never silently dropped.
10. Provably dead code produces an `unreachable` node. It is never silently
    dropped.
11. The DTO never contains raw source text. It carries ranges and short derived
    labels only; Phase 5 fetches source on demand.
12. Building a CFG never mutates the CSR run.

The builder is pure with respect to the query layer. `buildCfg` wraps any
unexpected exception as `{ok: false, code: 'E_CFG_INTERNAL'}`; it does not throw
across the boundary.

---

## 3. Node vocabulary

| Kind              | Meaning                                  | Provenance                                               | Synthetic |
| ----------------- | ---------------------------------------- | -------------------------------------------------------- | --------- |
| `entry`           | Function entry.                          | Function declaration start.                              | yes       |
| `exit`            | The single normal exit.                  | Function declaration.                                    | yes       |
| `statement`       | Simple statement or expression.          | Exact statement range.                                   | no        |
| `condition`       | Boolean test with `true`/`false` edges.  | Condition range.                                         | no        |
| `multiway`        | `switch` dispatch.                       | Switch range.                                            | no        |
| `merge`           | Join of alternative paths.               | Anchored to the following construct or the function end. | yes       |
| `loop_header`     | Pre-test loop check.                     | Loop condition or loop range.                            | no        |
| `loop_latch`      | Post-body increment / back-edge.         | Increment or loop end.                                   | no        |
| `loop_body_entry` | Post-test (`do`) body entry.             | Body start.                                              | no        |
| `break`           | Explicit `break` jump.                   | Statement range.                                         | no        |
| `continue`        | Explicit `continue` jump.                | Statement range.                                         | no        |
| `return`          | Return statement.                        | Statement range; value range retained in the label.      | no        |
| `throw`           | Throw site.                              | Statement range.                                         | no        |
| `call`            | Call site with a resolution summary.     | Call expression.                                         | no        |
| `await`           | `await` suspension point (JavaScript).   | Await expression.                                        | no        |
| `catch_entry`     | Exception-handler entry.                 | Clause range.                                            | no        |
| `finally_entry`   | `finally` clause entry.                  | Clause range.                                            | no        |
| `unreachable`     | Provably unreachable region.             | Region range.                                            | no        |
| `unmodeled`       | Construct that could not be represented. | Construct range.                                         | no        |

A call is a control-flow point first. `call` nodes also carry a `calls[]`
summary (`to`, `label`, `status`, optional `reasonCode`) so the detail panel and
the later call-graph phase do not need a second traversal.

Short-circuit operands (`&&`, `||`, `??`) are explicit `condition` nodes, never
a single boolean operand. A ternary is a `condition` with `true`/`false` edges.

---

## 4. Edge vocabulary

| Kind          | Meaning                                                                     |
| ------------- | --------------------------------------------------------------------------- |
| `seq`         | Fall-through permitted by the language.                                     |
| `true`        | Taken when a condition is true.                                             |
| `false`       | Taken when a condition is false.                                            |
| `case`        | Switch arm selected by a constant; carries `caseValue`.                     |
| `default`     | Switch default arm.                                                         |
| `loop_back`   | Back edge from a latch to its header.                                       |
| `break`       | Jump to the innermost matching loop/switch exit.                            |
| `continue`    | Jump to the innermost matching loop header/latch.                           |
| `return`      | Jump to the function exit.                                                  |
| `throw`       | Jump to a handler or out of the function.                                   |
| `exception`   | Modeled exceptional transfer to a `catch_entry`. Always at most `inferred`. |
| `finally`     | Transfer into a `finally` clause.                                           |
| `unreachable` | Edge into an explicitly unreachable region.                                 |

Every edge carries a status. Structural edges are `resolved`. Exception edges
are `inferred`, because static analysis cannot generally prove that a given
throw reaches a given handler. `goto` edges are `unresolved` and carry
`reasonCode: 'goto_flow'` or `'indirect_goto_flow'`.

The DTO also carries non-colour cues: `dash` (SVG dash pattern) and `glyphHint`
for status, plus a `label` for non-`seq` edges. Phase 12 will extend these into
a full accessibility pass; the fields exist now.

---

## 5. Lowering rules

Lowering is deterministic. Given the same construct tree and options, the
builder yields the same node and edge sets in the same order.

### 5.1 Sequence and branches

| Construct         | Lowering                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| Empty block       | Entry connects directly to the successor.                                                                             |
| `c1; c2; …`       | Each construct links `seq` to the next.                                                                               |
| `if (c) A`        | `condition(c)` → `true`: A; `false`: merge. A links `seq` to merge.                                                   |
| `if (c) A else B` | `condition(c)` → `true`: A, `false`: B; both link `seq` to merge. The incoming edge kind is preserved into the merge. |
| `c ? a : b`       | `condition(test)` with `true`/`false` edges to the two expression constructs, both to a merge.                        |
| `a && b`          | `condition(a)` → `false`: merge (short circuit); `true`: `condition(b)`; then merge.                                  |
| `a \|\| b`        | `condition(a)` → `true`: merge; `false`: `condition(b)`; then merge.                                                  |
| `a ?? b`          | `condition(a)` with `nullish` reasoning: non-nullish → merge; nullish → `condition(b)`; then merge.                   |
| `!e`              | Negated condition; the `true`/`false` edges are swapped at the leaf.                                                  |

A condition that cannot be decomposed still becomes a `condition` node with a
`condition_shape_unmodeled` degradation. A call nested inside a comparison
attaches its `callSite` to the condition node, so `if (ok(x) > 0)` keeps call
correlation without inventing a separate call node.

### 5.2 Loops

| Construct              | Lowering                                                                                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `while (c) B`          | `loop_header(c)` → `true`: body; `false`: after. Body → `loop_latch` → `loop_back` → header.                                                         |
| `do B while (c)`       | `loop_body_entry` → body → `loop_latch(c)` → `true`: body; `false`: after.                                                                           |
| `for (init; c; inc) B` | `statement(init)` → `loop_header(c)` → body → `loop_latch(inc)` → `loop_back` → header.                                                              |
| `for (x of xs) B`      | Binding `statement` → `loop_header` (iteration availability) → body → `loop_latch` → back. If the iterable is opaque, add `iteration_source_opaque`. |
| `for (a in o) B`       | Same as `for-of`; the header represents the next key.                                                                                                |
| Nested loops           | `break` and `continue` target the innermost enclosing loop. Labeled forms target the labeled construct.                                              |
| `break` / `continue`   | `break`/`continue` node with an edge to the matching merge/header. A jump with no matching target is `unmodeled` + `orphan_jump`.                    |

Back edges (`loop_back`, `continue`) are excluded from rank assignment. That
keeps loop bodies from pushing the graph downward one rank per iteration.

### 5.3 Switch

| Construct         | Lowering                                                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| `switch (e)`      | `multiway(e)` with one `case` edge per labeled arm (carrying `caseValue`) and one `default` edge. |
| Fallthrough       | Consecutive arms link `seq` where the language permits fallthrough.                               |
| `break` in a case | Edge to the switch merge, not to the enclosing loop.                                              |
| No default        | An implicit `default` edge goes directly to the switch merge.                                     |

### 5.4 Abrupt transfers and exceptions

| Construct                 | Lowering                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `return e`                | `return` node → `return` edge → `exit`. Later constructs in the block become `unreachable`.                         |
| `throw e`                 | `throw` node → nearest `catch_entry` in the same function, else `exit` with a `throw` edge. The edge is `inferred`. |
| `try { … } catch { … }`   | Try body → `finally`/after. Exceptional transfer: try body → `catch_entry` (`exception`, `inferred`) → after.       |
| `try { … } finally { … }` | Normal path → `finally_entry` → after. Exceptional path → `finally_entry` → rethrow/exit.                           |
| `try/catch/finally`       | Both the normal and the handler path pass through the `finally` entry. The duplication is explicit in the graph.    |
| Multiple returns          | All link to the single synthetic `exit`.                                                                            |

`finally` duplication is deliberate: the CFG shows the code that runs, not a
compressed abstraction that hides it. The DTO records
`modeled_exception_path` so the UI can say that the exception path is modeled,
not proven.

### 5.5 Unreachable and unmodeled code

| Construct                                      | Lowering                                                                         |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Code after `return`/`throw`/`break`/`continue` | An `unreachable` node with an `unreachable` edge and an explanation.             |
| C++ `goto`                                     | `unmodeled` node, `unresolved` edge, `reasonCode: 'goto_flow'`, labels recorded. |
| C++ computed `goto`                            | Same with `reasonCode: 'indirect_goto_flow'`.                                    |
| Unknown construct kind                         | `unmodeled` node + `unmodeled_construct` degradation.                            |
| Unsupported language feature                   | `unmodeled` node + typed degradation; the panel stays alive.                     |

### 5.6 Calls, awaits and partial analysis

| Construct               | Lowering                                                                       |
| ----------------------- | ------------------------------------------------------------------------------ |
| Call statement          | `call` node in sequence, with `calls[]` from the CSR relationships.            |
| Call inside a condition | `callSite` on the condition leaf; no extra call node.                          |
| `await e`               | `await` node in sequence. No interleaving model is claimed.                    |
| Partial run             | `analysis_partial` degradation; completeness is `partial` or `syntactic_only`. |

`resolved` call targets come only from adapter-declared resolution. The builder
never invents a `resolved` edge. Unknown receivers stay `unresolved` with the
adapter's reason code.

---

## 6. Determinism and identity

- Node IDs are structural ordinals: `cfg:<symbolId>:n0001`.
- Edge IDs are structural ordinals: `cfg:<symbolId>:e0001`.
- IDs depend on construct order, not on line numbers. Whitespace, comments and
  pure line shifts do not change identity.
- Labels are short and derived. They may contain a callee name, a `case` label
  or a truncated source expression, never a file body.
- Layout is deterministic and runs in the extension host before the DTO crosses
  the boundary. The webview only draws the positions it receives.

---

## 7. DTO shape

The CFG DTO keeps `dtoVersion: 1` and adds:

```jsonc
{
  "dtoKind": "cfg",
  "graphKind": "cfg",
  "function": { "symbolId": "…", "name": "…", "range": {/* rangeRef */} },
  "entryId": "cfg:…:n0001",
  "exitId": "cfg:…:n0002",
  "nodes": [
    {
      "id": "cfg:…:n0003",
      "kind": "condition",
      "label": "if (n > 0)",
      "labelLines": ["if (n > 0)"],
      "status": "resolved",
      "badge": "",
      "badges": [],
      "isSynthetic": false,
      "unreachable": false,
      "range": { "fileId": "…", "startLine": 3, "startColumn": 2, "endLine": 3, "endColumn": 9 },
      "rangeRef": {/* same */},
      "calls": [{ "to": "symbol:…", "label": "helper", "status": "resolved" }],
      "position": { "x": 32, "y": 84, "width": 160, "height": 52, "layer": 1 },
    },
  ],
  "edges": [
    {
      "id": "cfg:…:e0001",
      "from": "…",
      "to": "…",
      "kind": "true",
      "type": "true",
      "status": "resolved",
      "label": "true",
      "dash": "",
      "glyphHint": "●",
    },
  ],
  "degradations": [
    {
      "code": "unmodeled_construct",
      "message": "…",
      "severity": "warning",
      "range": {/* optional */},
    },
  ],
  "truncated": false,
  "truncationReason": null,
  "analysisCompleteness": "full",
  "extent": { "width": 640, "height": 840 },
  "legend": { "statuses": ["resolved"], "kinds": ["condition"], "edgeKinds": ["true"] },
  "stats": { "nodeCount": 9, "edgeCount": 10, "renderedNodeCount": 9, "renderedEdgeCount": 10 },
}
```

`validateCfgDto` enforces exactly one entry and exit, known kinds and statuses,
valid ranges and positions, object degradations, finite extent and no dangling
edges.

### 7.1 Size caps

- The builder accepts `maxNodes` and `allowLarge`.
- The DTO default render cap is 2000 nodes (`CFG_RENDER_NODE_LIMIT`).
- Over the cap, the DTO keeps the first `limit` nodes plus the mandatory entry
  and exit, filters edges to the retained set, sets `truncated: true`,
  `truncationReason: 'node-limit:<limit>'`, and appends a `truncated`
  degradation.
- A function over 1500 nodes requires an explicit opt-in (`allowLarge`) before
  the host builds it. The UI offers "render anyway" rather than freezing.

---

## 8. Degradation catalog

| Code                        | Severity | Meaning                                                                                |
| --------------------------- | -------- | -------------------------------------------------------------------------------------- |
| `unmodeled_construct`       | warning  | A construct kind has no lowering. An `unmodeled` node is present.                      |
| `goto_flow`                 | warning  | A `goto` edge cannot be resolved statically.                                           |
| `indirect_goto_flow`        | warning  | A computed `goto` cannot be resolved statically.                                       |
| `iteration_source_opaque`   | info     | The iterable of a `for-of`/`for-in` is unresolved; the loop is modeled conservatively. |
| `call_site_unrecorded`      | info     | The adapter recorded a call but not its site; the call is not attached to a node.      |
| `condition_shape_unmodeled` | info     | A condition expression could not be decomposed; it is shown as one test.               |
| `orphan_jump`               | warning  | A `break`/`continue` has no matching target in the function.                           |
| `modeled_exception_path`    | info     | An exception edge is modeled, not proven.                                              |
| `analysis_partial`          | info     | The adapter marked the run partial; the CFG inherits that completeness.                |
| `truncated`                 | warning  | The rendered graph hit the node cap.                                                   |

Degradations are part of the DTO, not a log line. The panel shows a banner
("N constructs could not be modeled") and the detail panel shows the code and
the message for the selected node.

---

## 9. Rendering contract

- The renderer consumes only the DTO. It never imports an adapter, the CSR or
  the layout engine.
- Layout positions arrive in the DTO. The webview does no graph computation on
  its main thread.
- Status is encoded with a glyph and a dash pattern as well as colour.
- Zoom is clamped; fit-to-view is deterministic; selection is a DTO-id lookup.
- A renderer exception is contained: the panel shows a typed error and stays
  alive.

The stack decision and its measurements are recorded in
[`adr/0009-graph-rendering-stack.md`](adr/0009-graph-rendering-stack.md).

---

## 10. Phase 4 fixture corpus

`tests/fixtures/cfg/programs.js` contains 36 neutral programs across both
languages. They cover sequence, `if`/`else`, `else if`, ternary, short-circuit,
`while`, `do`, `for`, `for-of`, `switch` with fallthrough, nested loops,
`break`/`continue`, early return, `throw`, `try`/`catch`/`finally`, `await`,
unreachable code, `goto`, computed `goto`, an unknown construct, an empty
function, an expression-bodied arrow and the shared parity program.

`npm run test:cfg` runs the corpus with no VS Code host, webview, adapter
process or network. `tests/fixtures/cfg/harness.js` builds a real CSR run and
query layer in memory, so the assertions exercise the same path as production.

---

## 11. Source synchronization, hover preview, and staleness

Phase 5 grounds every source-backed graph node in the real workspace document.
**Previews are always slices of the real document, never reconstructions from
CSR or an AST.**

### 11.1 Single host read path and slice contract

- All document reads go through `src/extension/sourceAccess.js` via
  `vscode.workspace.openTextDocument` → `document.getText(range)`. The webview
  never receives filesystem access and never reads files directly.
- Every declared file path passes lexical workspace containment
  (`resolveWorkspacePath` in `src/extension/sourcePaths.js`) and must belong to
  the current analysis run's `files[]`. Traversal, NUL bytes, and unknown
  `fileId` values fail with `E_PATH`, `E_WORKSPACE`, or `E_SOURCE_MISSING`.
- Ranges are validated against the current document (`normalizeRangeRef` and
  `rangeWithinDocument` in `src/core/source/ranges.js`). Nothing is clamped:
  reversed, negative, or out-of-bounds ranges return `E_RANGE`.
- Slices larger than 64 KB (`SOURCE_LIMITS.maxBytes = 65_536`) are refused with
  `E_LIMIT`.
- Slices are capped from the end to `maxLines` (clamped `4–40`, default `12`)
  with `truncateSource`. When clipped, a trailing line ending is stripped so a
  `N`-line limit renders `N` lines, and `truncated: true` is returned explicitly.
- Slices are cached in a bounded LRU (`createLru`, default 30 entries / 5 MB)
  keyed by `(fileId, documentVersion, maxLines, range)`.
- `source.slice`, `source.validation`, and `navigate.to` never trigger analysis
  (`ensureRun`); if no graph has been analyzed/loaded yet, they return
  `E_NO_ANALYSIS`.

### 11.2 Preview presentation and highlighting

`buildPreviewModel` (`src/core/source/presentation.js`) decides preview card state
purely from the DTO node and optional slice:

| Node / slice state                     | Presentation behavior                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Synthetic (`isSynthetic` / no range)   | Empty code body, explicit note (`Synthetic <kind> — ...`, anchored line if available), navigation disabled |
| Missing slice (`integrity: 'missing'`) | Explicit unavailability note, navigation disabled                                                          |
| Empty or whitespace-only slice         | Explicit `"This range has no source content."` note, navigation disabled                                   |
| Stale slice (`integrity: 'stale'`)     | Current document text shown dimmed with stale border/banner; navigation blocked                            |
| Exact slice (`integrity: 'exact'`)     | Original indentation/line endings rendered line-numbered; navigation enabled                               |

Syntax highlighting (`src/webview/highlight.js`) uses `highlight.js@11.11.1`
(webview-only, `cpp` + `javascript` registered; see ADR 0010) and renders via
`textContent` spans. Unrecognized languages, disabled highlighting, or errors
degrade cleanly to plain text.

Hover intent (`src/webview/previewController.js`) requires dwell time (default
300 ms, `0–2000` ms) and pointer stability (moving > 12 px resets dwell). Leaving
a node arms a 150 ms grace timer so the pointer can enter the card. Pinning
(`pinByDefault` or Pin button) keeps the card open until dismissed; `Esc`
always dismisses.

### 11.3 Conservative staleness model

- Immediately after an analysis run loads, the host captures a per-file
  full-document SHA-256 baseline (`captureBaseline`), rather than relying on
  adapter `contentHash` values (which may be synthetic).
- `integrityFor(analysisHash, currentHash)` is conservative: any full-file hash
  mismatch marks nodes in that file `stale` (`'missing'` if no baseline/hash).
- On graph load, the webview issues one `source.validation` batch request for all
  source-backed nodes (`SOURCE_LIMITS.maxRanges = 2_000`) and marks stale nodes
  with non-colour cues (`.is-stale` dashed border, dimmed opacity, banner).
- Document changes (`onDidChangeTextDocument`, `onDidDeleteFiles`,
  `onDidRenameFiles`) invalidate the slice cache and push `source.stale` to the
  webview. Closing a document (`onDidCloseTextDocument`) clears cached slices
  without marking the graph stale.
- No automatic re-analysis runs in Phase 5; re-analysis remains explicit.

### 11.4 Navigation, bidirectional sync, and keyboard loop

- **Graph → editor (`navigate.to`):** re-validates the range and baseline hash
  first. Refuses stale or missing files with `E_SOURCE_STALE` /
  `E_SOURCE_MISSING` in `navigate.done` rather than revealing a guessed range.
  Valid targets open via `showTextDocument` (non-preview tab by default via
  `codeflow.navigation.openInPreviewTab: false`), select the exact range, and
  reveal with `InCenterIfOutsideViewport`. `codeflow.backToGraph` reveals the
  panel and pushes `graph.focus` to restore focus to the selected node.
- **Editor → graph (`selection.changed`):** `onDidChangeTextEditorSelection`
  debounces 100 ms and maps the active selection over `lastDto.nodes` using
  `containsPosition` / `rangesOverlap` (sorted smallest range first). Clears
  highlights when the cursor is outside all nodes (no nearest-node guessing)
  and never steals focus or rewrites the detail panel.
- **Keyboard access:** `Tab`/arrows focus graph nodes, `H` or `Shift+Space`
  opens a pinned preview, `Enter` navigates to source, and `Esc` dismisses the
  preview and returns focus to the selected node.

---

## 12. Call graph, cross-file merge policy, and scope states

Phase 7 adds the call-graph perspective (`src/core/graph/calls/`) over the same
CSR query boundary, host layout engine, and SVG renderer.

### 12.1 Query model and cursor pagination

- `createCallGraphQueryService` exposes `outgoing(symbolId, filter)`,
  `incoming(symbolId, filter)`, `depth(symbolId, options)`, and
  `cycles(symbolId)`.
- Neighbor queries use cursor pagination (`encodeCallCursor` /
  `decodeCallCursor`, default page size `100`, maximum `200`). Cursors carry
  `runId`; if a cursor references a previous analysis run or is malformed,
  pagination resets cleanly to offset `0` with `cursorReset: true` and
  `scopeReasons: ['stale_cursor_reset']`.
- `depth(symbolId, { depth, maxNodes, token })` performs bounded BFS expansion
  (default depth `3`, max `6`, max nodes `500`), returning both `nodes` and the
  `edges` that produced them. Frontier nodes with unexpanded neighbors receive
  `depthLimitReached: true`. If `token.isCancelled` is true, `depth` returns
  `cancelled: true` with empty arrays rather than an unlabeled partial graph.

### 12.2 Multi-source merge policy

`mergeEvidenceSources` combines adapter-local evidence with project-index or
language-server evidence using a deterministic, order-independent precedence
truth table per `(from, to, type)` triple:

| Combination                                                | Result status                                 | Rule                                                                                      |
| ---------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `resolved` + `resolved`                                    | `resolved`                                    | Agreement strengthens                                                                     |
| `resolved` + anything weaker                               | `resolved`                                    | Direct evidence wins over heuristic                                                       |
| `inferred` + `inferred`                                    | `inferred`                                    | Deduplicated                                                                              |
| `inferred` + `possible`                                    | `inferred`                                    | Evidence beats speculation                                                                |
| `possible` + `possible`                                    | `possible`                                    | Union of candidate targets; never upgrades to `resolved`                                  |
| `unresolved` + `resolved`                                  | `resolved`                                    | Concrete target wins at that site; other unresolved sites remain in the unresolved bucket |
| anything + `stale`                                         | strongest status + `stale` provenance         | Staleness is a provenance flag; backing file edits mark the resulting edge `stale`        |
| `resolved` in source A, absent in source B covering `from` | `resolved` + `source_disagreement` diagnostic | Never downgrades silently; discrepancy is surfaced in diagnostics                         |

Additional invariants:

1. Two `possible` edges never merge into `resolved`.
2. Distinct relationship types (`calls`, `instantiates`, `overrides`,
   `references`) never merge across types.
3. Inputs are sorted canonically before merging so any source or relationship
   permutation produces byte-identical output, and double-merging is idempotent.
4. When sources disagree on a symbol's file location, the source whose
   `contentHash` matches current disk wins; otherwise the symbol is marked
   `stale` and a `source_disagreement` diagnostic is recorded.

### 12.3 Scope honesty and visual encodings

Every neighbor page and call-graph DTO carries a mandatory `scope` and
`scopeBanner` (`formatScopeBanner`):

| Scope            | Presentation                                                       |
| ---------------- | ------------------------------------------------------------------ |
| `complete`       | `"N callers"`                                                      |
| `partial`        | `"N callers (index partial — may be incomplete)"`                  |
| `same_file_only` | `"N callers in this file · Project-wide callers require indexing"` |

- **Unresolved bucket:** unresolved outgoing call sites from the center function
  are aggregated into a single `unresolved_bucket` node (`"N unresolved targets"`)
  with a reason-code breakdown (`function_pointer`, `template_dependent`,
  `unknown_receiver`, `computed_member`, etc.).
- **Candidate buckets:** when virtual dispatch or ambiguous overload candidates
  for a `(from, reasonCode)` group exceed `5` (`CALL_LIMITS.candidateBucketThreshold`),
  they are grouped into a `candidate_bucket` summary.
- **Cycles:** `detectCallCycles` runs Tarjan's strongly-connected-components
  algorithm plus self-loop detection in $O(V + E)$ time. Cycle edges carry
  `isCycle: true`, `↻` in `label` and `glyphHint`, and a distinct dash pattern.
- **Expand/collapse eviction:** `createCallGraphSession` computes reachability
  from `centerSymbolId` solely through `expandedSymbolIds`, evicting unreachable
  descendants on collapse so repeated expand/collapse cycles cannot leak state.

---

## 13. Progressive Semantic Zoom (Phase 10)

### 13.1 Six-Level Hierarchy (`src/core/graph/zoom/levels.js`)

| Level            | Identifier    | Granularity                                                              | Node Cap      |
| ---------------- | ------------- | ------------------------------------------------------------------------ | ------------- |
| **L0 Workspace** | `'workspace'` | Top-level directory clusters + bundled directory dependency edges        | `60` clusters |
| **L1 Module**    | `'module'`    | Files and immediate subdirectories within a chosen module prefix         | `120` nodes   |
| **L2 File**      | `'file'`      | Symbols declared in the file, grouped into kind clusters when `> 120`    | `120` nodes   |
| **L3 Symbol**    | `'symbol'`    | 1-hop caller/callee ego neighborhood                                     | `150` nodes   |
| **L4 Function**  | `'function'`  | CFG nodes, clustering construct regions when node count `> 150`          | `150` nodes   |
| **L5 Statement** | `'statement'` | Statement-level detail inside a construct + Phase 11 `overlays.dfg` slot | `100` nodes   |

### 13.2 Non-Negotiable Aggregation & Semantic Preservation Invariants

1. **Status distribution (`distributions.js`, AC-10.5):** An aggregate node or edge bundle carries a `statusMix` distribution (`{ resolved, inferred, possible, unresolved, stale }`, `total`, `displayStatus`, `completeness`, `unmodeledCount`, `degradationCount`, `badges`). Whenever an aggregate contains any non-resolved member alongside resolved members, `displayStatus` is `'mixed'` — never `'resolved'`.
2. **Above-the-fold uncertainty badges:** Unresolved, possible, stale, unmodeled, and degraded counts are surfaced directly in `badges` (e.g. `"3 unresolved"`, `"1 unmodeled"`).
3. **Per-type edge bundling (`edgeBundles.js`):** `bundleClusterEdges` groups edges strictly by `(fromCluster, toCluster, relationshipType)` and never merges `calls` with `references` or `imports`.
4. **Paginated member reveal (`expansion.js`, AC-10.3):** Every cluster and edge bundle expands via `createClusterExpansionService` (`defaultPageSize: 50`, `maxPageSize: 100`) returning `nextCursor`, `remainingCount`, and `moreLabel` (`"N more"`), cached per `(graphId, clusterId, runId)`.
5. **Bounded zoom gestures (`evaluateZoomGesture`, AC-10.6):** Wheel/pinch zoom scales visually by default and never transitions semantic levels more than once per gesture or while mid-pan.
6. **Anchored incremental layout (`layout.js`, AC-10.7):** `computeAnchoredIncrementalLayout` anchors expansion at the expanded cluster's coordinates and reuses existing node positions by ID, honoring `prefers-reduced-motion` (`transitionMs: 0`).
