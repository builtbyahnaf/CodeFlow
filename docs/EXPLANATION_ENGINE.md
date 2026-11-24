# Deterministic Explanation Engine specification

**Status:** Phase 6 (implemented). Normative for `src/core/explanation/`.
**Ruleset version:** `1.0.0` (`RULESET_VERSION` in `src/core/explanation/model.js`).

This document defines what an explanation is allowed to say, what evidence every
sentence must carry, and how the implementation enforces both. It is a contract,
not a style guide: a rule that cannot satisfy it must not exist.

CodeFlow explains code with **no model in the loop**. There is no network call,
no model SDK, no prompt, and no generated prose beyond deterministic templates.

---

## 1. The correctness contract

Every emitted statement satisfies exactly one of:

1. **Grounded** — traceable to a source range and a semantic fact in CSR/CFG.
2. **Qualified** — explicitly marked as inference or possibility, with the basis
   named.
3. **Omitted** — nothing is said.

There is no fourth option. The engine enforces this at three points:

| Enforcement | Location | Behaviour |
| --- | --- | --- |
| Non-empty evidence | `assembleFragments` + `validateExplanationItem` | A sentence fragment without a valid `EvidenceRef` is dropped, and the drop is counted. |
| No HTML | `assembleFragments` + validator | Any text containing an HTML tag is dropped. Explanations are plain text. |
| Status phrasing | `lintExplanationText` | A `stale`, `possible`, `unresolved`, or `inferred` item without its mandated phrase is rejected. |

A rejected item is never silently replaced with safer wording. It is removed and
counted in `diagnostics.lintViolations` so a rule bug is visible in tests.

### Prohibited behaviours

Each is covered by a test or a banned-pattern rule:

- Inferring runtime behaviour from an identifier name (`save()` "saves to the
  database", a function named `sort` "sorts").
- Naming an algorithm from syntax shape alone ("quicksort", "binary search").
- Stating a runtime outcome ("this returns 42").
- Claiming complexity when the iteration count depends on unknown behaviour.
- Presenting `possible`/`unresolved` targets as if one were chosen.
- Advice ("you should refactor this").
- Unqualified certainty ("always", "never", "will execute").

`src/core/explanation/phrasing.js` holds the banned-pattern linter. Algorithm
names and advice are banned unconditionally; certainty words are banned unless a
caller explicitly declares a proven single path.

---

## 2. Module map

```
src/core/explanation/
  model.js        RULESET_VERSION, EvidenceRef/ExplanationItem, fragment assembly,
                  id derivation, validator
  facts.js        language-neutral fact extraction from CFG + CSR query only
  phrasing.js     status qualification, call summaries, limitation assembly,
                  prohibited-language linter, central stale qualification
  settings.js     defaults/clamping for the three explanation settings
  cache.js        bounded cache keyed by run, ruleset, depth, staleness, subject
  engine.js       rule selection, safe execution, assembly, validation, caching
  rules/
    catalog.js    deterministic rule-group order and proof obligations
    statements.js statement/return/throw/await/assignment/call-node rules
    conditions.js condition and branch rules
    loops.js      loop rules (counter, foreach, do-while, while, nesting, exits)
    calls.js      resolved/possible/unresolved call and return-path rules
    variables.js  declaration, reassignment, shadowing, TDZ, unused, def-use
    summary.js    function summary and mandatory depth-4 limitations
    patterns.js   pattern naming and complexity claims with proof obligations
  index.js        public surface
```

The engine imports only the CSR query layer and the CFG. It never imports
adapters, `vscode`, the webview, the renderer, or any network module.
`tests/unit/architecture.test.js` enforces this, including a ban on reading
`run.symbols`, `run.relationships`, `run.controlConstructs`, or `run.dataFacts`
directly: facts must come through `createQueryLayer()`.

---

## 3. Data model

```js
/**
 * @typedef {Object} EvidenceRef
 * @property {'source'|'semantic'|'construct'|'relationship'} kind
 * @property {string} id
 * @property {string} [label]
 * @property {SourceRange} [range]   // present for source refs
 */

/**
 * @typedef {Object} ExplanationItem
 * @property {string} id             // `exp:<subject>:<rule>:d<depth>:v<ruleset>`
 * @property {string} subjectId      // CFG node id or symbol id
 * @property {string} topic          // one of EXPLANATION_TOPICS
 * @property {1|2|3|4} depth
 * @property {string} text           // plain text, no HTML, no newlines required
 * @property {EvidenceRef[]} evidence // non-empty, deduplicated
 * @property {'grounded'|'qualified'} claim
 * @property {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} [status]
 * @property {string} ruleId
 * @property {string} rulesetVersion
 */
```

Rules:

- **Evidence is mandatory and enforced by code.** A fragment without evidence is
  dropped before an item can be constructed.
- **Text is plain.** It never contains HTML or layout hacks. Phase 12 can render
  it in an accessible reading pane unchanged.
- **Depth is a request parameter.** Four depths do not store four truths; they
  select more rules and more detail from the same facts.
- **IDs are stable.** They exclude line numbers so a line shift does not change
  an item's identity. The id includes the ruleset version, so a ruleset bump
  invalidates caches and snapshots.
- **Evidence refs resolve.** Source refs carry the exact range; semantic refs
  carry the CSR symbol/fact id; construct refs carry the construct id.

---

## 4. Fact layer

`extractFunctionFacts(query, cfg)` normalizes language differences before any
template runs. Templates never see ASTs, adapter JSON, or raw CSR arrays.

| Fact | Source |
| --- | --- |
| `FunctionShape` | parameters, returns, node/branch/loop/call counts, completeness |
| `LoopFact` | loop kind, bound/initializer/step text, literal values, body nodes, nesting, early exits, bound mutation |
| `ConditionFact` | predicate text, operator, nullish/optional-chain/short-circuit shape, calls in the predicate |
| `BranchFact` | arm counts, labels, early return, throw arm, missing else, switch cases/default |
| `CallFact` | targets with status and reason codes, target count, self-recursion, result use |
| `VariableFact` | declaration kind, initializer, read/write lines, reassignment count, capture, shadowing, TDZ ordering, unused |
| `ReturnFact` | count, value presence, expression text |
| `DataFact` | definition/use lines, overwrite-before-read, unresolved-call crossing |
| `PatternFact` | only when the adapter/fixture supplies proof extension flags |

Facts are cached per `(runId, graphId)`. They are recomputed on run invalidation.

---

## 5. Depth levels

| Depth | Rules that fire | Typical output |
| --- | --- | --- |
| 1 Basic | statement/return/throw/await, condition, call, variable declaration | One sentence per node, usually under 20 words |
| 2 Intermediate | plus block role, loop details, reassignment, shadowing, extra return paths | 1–3 sentences |
| 3 Advanced | plus branch interaction, dependency chains, call-status effects | Paragraph with counts and targets |
| 4 Deep | plus pattern naming, complexity claims, limitations | Paragraph plus explicit limitations |

Depth 4 always includes a limitation sentence when the analysis is `partial`,
has unresolved edges, has unmodeled constructs, or is stale. Limitations cannot
be fully disabled in the engine; the UI setting only collapses them.

---

## 6. Rule catalog (implemented)

Every group declares a proof obligation in `rules/catalog.js`. Groups run in
declaration order; a throwing group is isolated and reported in
`diagnostics.ruleErrors`.

| Group | Rules | Proof obligation |
| --- | --- | --- |
| `group.statements` | `stmt.synthetic`, `stmt.unreachable`, `stmt.unmodeled`, `stmt.await`, `stmt.throw`, `stmt.return.value`, `stmt.return.void`, `stmt.assign`, `stmt.assign.multi`, `stmt.increment`, `stmt.call.used`, `stmt.call.unused`, `stmt.generic` | A CFG node with a range or construct id; assignment/return details come from construct extensions only |
| `group.conditions` | `cond.nullish`, `cond.optional_chain`, `cond.conjunction`, `cond.comparison`, `cond.negated`, `branch.multiway`, `branch.early_return`, `branch.throw_arm`, `branch.else_missing`, `branch.two_arm`, `branch.interaction` | A condition/multiway node and its outgoing CFG edges; branch interaction requires a call on the predicate |
| `group.loops` | `loop.for.counter`, `loop.foreach`, `loop.do_while`, `loop.while.bound`, `loop.body.empty`, `loop.early_exit`, `loop.nested` | A loop header; an exact count additionally requires literal bound, literal non-zero step, no early exit, and no bound mutation |
| `group.calls` | `call.resolved`, `call.possible`, `call.unresolved`, `call.self_recursive`, `return.single`, `return.multiple` | A call relationship attached to the node, or a return node in the CFG |
| `group.variables` | `var.declare`, `var.reassign`, `var.captured`, `var.shadowed`, `var.tdz_risk`, `var.unused`, `dep.overwritten`, `dep.def_use`, `dep.chain` | A CSR variable symbol or DataFact anchored at the node; dependency chains cannot cross an unresolved call |
| `group.function_summary` | `fn.summary`, `fn.limitations` | Function shape and completeness; limitations require a partial/stale/unresolved subject |
| `group.patterns_complexity` | `pattern.*`, `complexity.*` | Depth 4 only, plus the specific proof obligations in §8 |

A rule that cannot meet its obligation emits nothing. The UI therefore shows
less, not something weaker.

---

## 7. Qualification language

`phrasing.js` centralizes status wording so uncertainty reads consistently:

| Status | Required pattern |
| --- | --- |
| `resolved` | Plain declarative; must not contain "may call", "possible target", or "could not be resolved" |
| `inferred` | "…, inferred from `<basis>`" |
| `possible` | "one of N possible targets" or "may call" |
| `unresolved` | "could not be resolved (`<reason>`)" |
| `stale` | "based on source before the last edit" |

Stale is special: `ensureStatusQualification` appends the required phrase at
assembly time when a rule attached `stale` without repeating it. This prevents a
stale explanation from being silently dropped by the linter. A parity test
asserts that every rule that fired on fresh source still appears on stale source.

The linter also rejects advice, certainty overclaims, algorithm names without
proof, and name-based intent speculation.

---

## 8. Patterns and complexity

### Patterns

| Pattern | Proof obligation | Implemented behaviour |
| --- | --- | --- |
| Accumulation | Loop with a single accumulator write derived from the loop value (`accumulationProven`) | Named only with proof; otherwise omitted |
| Linear search | Loop plus element comparison with an early exit (`linearSearchProven`) | Named only with proof |
| Nested pairwise | Two nested loops over the same collection with index-offset inner loop (`nestedPairwiseProven`) | Named only with proof |
| Recursion | Direct self-call relationship plus a base-case branch | Named when proven; otherwise described as "direct recursion" with inference phrase |
| Divide and conquer | Recursive calls on derived halves plus a combine step (`divideAndConquerProven`) | Named only with proof |
| Memoization | Cache read before compute and write after compute by the same key (`memoizationProven`) | Named only with proof |
| Higher-order collection | Resolved method identity plus callback shape (`higherOrderCollectionProven`) | Named only with proof |
| Binary search | Requires ordering evidence static analysis cannot establish | **Never named.** Bounds narrowing is described structurally |

When proof is absent the item is omitted. The negative fixtures assert that a
`binarySearch`-named function and a bounds-narrowing loop never produce the
string "binary search".

### Complexity

| Claim | Preconditions |
| --- | --- |
| Literal loop bound | Literal bound, literal non-zero step, no early exit, no bound mutation |
| Nested depth `k` | Structural nesting only; no asymptotic notation |
| Input-dependent iteration | Collection/range iteration without a static size |
| Structural upper bound | Collection loop, nesting depth ≤ 2, no early exit, no calls in the body; phrased as a structural upper bound, not a measurement |

Anything else emits "No complexity claim can be made from the available
analysis." Complexity involving library calls, recursion depth, amortized
behaviour, hash maps, string operations, or runtime measurement is never claimed.

---

## 9. Engine execution and determinism

```
subject + depth
  -> resolve facts (cached per run + graph)
  -> select rule groups by subject kind and depth
  -> run groups in catalog order, isolating throws
  -> assemble fragments (drop evidence-less or HTML fragments)
  -> apply stale qualification
  -> validate item (evidence, topics, depth, claim, plain text)
  -> lint phrasing against the item status
  -> cache by (runId, rulesetVersion, depth, stale, subjectKey)
```

The engine is pure: no clock, no randomness, no I/O, no settings reads. Settings
arrive as an argument. Two fresh engines produce byte-identical items for the
same run, subject, and depth (`explanationEngine.test.js`).

Cache rules:

- Invalidate on a new run (`invalidateRun`).
- Include `rulesetVersion` so a ruleset bump cannot serve old text.
- Include `depth` and `stale`.
- Bound to 256 items (default) with insertion-order eviction.
- Fact cache is bounded to 64 function graphs.

---

## 10. Protocol and UI integration

Phase 6 adds two request kinds and one response kind:

| Kind | Direction | Purpose |
| --- | --- | --- |
| `explain.node` | webview → host | Explain a CFG node at a depth |
| `explain.function` | webview → host | Explain the whole CFG function |
| `explain.data` | host → webview | Explanation payload (`items`, `summary`, `limitations`, `diagnostics`) |

Both handlers require a CFG loaded in the current panel. They never call
`ensureRun`; a test asserts that an explanation request cannot start analysis.
Typed failures are `E_NO_ANALYSIS` (no CFG) and `E_NOT_FOUND` (unknown node id).

The webview renders:

- **Function summary** in `#cf-fn-summary` above the graph.
- **Node explanation** in `#cf-explain` below the node details, with a depth
  selector (1–4), grounded/qualified styling, evidence links that reuse
  `navigate.to`, and a collapsible limitations disclosure.
- **One-line depth-1 explanation** in the preview card (`#cf-preview-explain`).
- A skeleton only after 100 ms, so fast explanations never flicker.

Evidence links call the existing `navigate.to` path. There is no second
navigation implementation.

Settings:

| Key | Default | Behaviour |
| --- | --- | --- |
| `codeflow.explanation.defaultDepth` | 2 | Initial depth for new subjects |
| `codeflow.explanation.showEvidence` | true | Show "Why this?" evidence links |
| `codeflow.explanation.includeLimitations` | true | Expand limitations; when false they remain in the DOM and accessible |

`tests/unit/explanationSettings.test.js` checks manifest/core parity 1:1.

---

## 11. Verification

| Test file | Coverage |
| --- | --- |
| `explanationModel.test.js` | evidence enforcement, fragment dropping, HTML rejection, stable ids, cache keys |
| `explanationFacts.test.js` | JS and C++ fact extraction through the same model |
| `explanationPhrasing.test.js` | status phrases, banned language, limitations, central stale qualification |
| `explanationSettings.test.js` | defaults, clamping, manifest parity, config event matching |
| `explanationRules.test.js` | depth monotonicity, literal-count precondition, variables/def-use, stale parity, manifest-backed settings |
| `explanationPatterns.test.js` | negative fixtures for every pattern, binary-search prohibition, complexity preconditions, unresolved-call dependency refusal |
| `explanationEngine.test.js` | 30+ node evidence corpus, determinism, throwing-rule isolation, 724-node depth-4 latency |
| `panelWire.test.js` | `explain.node`/`explain.function` protocol round trip and no-analysis guarantee |
| `protocol.test.js` | directional allowlists |
| `panelTemplate.test.js` | explanation DOM ids |
| `architecture.test.js` | explanation layer isolation from adapters/host/webview/network and raw run arrays |

---

## 12. Measured performance

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, Node v24.22.1.

| Metric | Budget | Measured |
| --- | --- | --- |
| Function explanation, 724-node CFG, depth 4, cold | < 50 ms | 11.9 ms |
| Same, warm cache | — | 0.03 ms |
| Node explanation, depth 4, median (724 nodes) | < 50 ms | 0.057 ms |
| Node explanation, depth 4, P95 | < 50 ms | 0.128 ms |
| Node explanation, depth 4, max | < 50 ms | 2.9 ms |
| Items per node, average | — | 5.15 (range 1–8) |
| Evidence refs per item, average | ≥ 1 | 1.48 |
| Production extension bundle | — | 431,201 B / 124,617 B gzip |
| Production webview bundle | — | 71,957 B / 26,099 B gzip |
| Production CSS | — | 15,015 B / 3,390 B gzip |

The engine adds about 50 KB minified to the extension bundle and about 4 KB to
the webview bundle. No new runtime dependency was added.

---

## 13. Documented limits

- **Facts depend on existing analysis.** If the adapter did not record a
  construct extension (for example a literal bound), the corresponding claim is
  omitted. This is intentional and better than guessing.
- **Pattern proofs are conservative.** The real C++ and JavaScript adapters do
  not yet set the pattern-proof extension flags, so pattern naming currently
  fires mainly on fixtures. Recursion and bounds narrowing are derived from the
  CFG/relationships and do fire on real code.
- **Dependency facts are foundational.** Phase 11 expands them. The engine
  deliberately refuses chains that cross unresolved calls.
- **No snapshots were added.** Rule output is asserted structurally (rule ids,
  statuses, phrases, evidence) rather than stored as golden files, so a wording
  improvement does not require mass snapshot churn. Snapshot review remains a
  future quality gate if wording stabilizes.
- **Blind-reader review was not performed.** The Phase 6 acceptance criteria ask
  for three readers; this environment has only the author. The Phase 6 report
  records this as an unverified gap rather than claiming it passed.
