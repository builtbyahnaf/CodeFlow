# Language adapters

> **DRAFT — Phase 0.** This describes the minimal adapter boundary that exists
> today. Phase 1 finalizes the CSR this boundary produces, Phase 2 adds C++, and
> Phase 3 adds JavaScript. Expect breaking changes.

## The contract

An adapter is the only component that understands a language. It receives a
file path and optional text, and returns an `AnalysisRun` (see
`docs/CSR_SPECIFICATION.md`). It must not import `vscode`, must not render, and
must not know about graph layout or the webview protocol.

```js
/**
 * @typedef {Object} AnalyzeInput
 * @property {string} path            Workspace-relative whenever possible
 * @property {string} [text]          Pre-read contents; adapters must not read files themselves
 * @property {string} runId           Caller-supplied run identifier
 * @property {string} [workspaceRoot] Absolute root, for compile-command lookup later
 */

/**
 * @typedef {Object} Adapter
 * @property {string} id
 * @property {string} displayName
 * @property {string} version
 * @property {string[]} languages
 * @property {string[]} extensions     Lower case, leading dot
 * @property {CapabilitySet} capabilities
 * @property {(input: AnalyzeInput) => AnalysisRun | Promise<AnalysisRun>} analyze
 */
```

Current reality: the registry passes the input object straight through and the
mock adapter ignores `text`, `workspaceRoot`, and `path`. Real adapters will use
all four.

## Capabilities

Every capability is a boolean; absent means `false`. `createCapabilities()`
normalizes a partial object so consumers never see `undefined`.

| Capability             | Meaning                                      |
| ---------------------- | -------------------------------------------- |
| `parse`                | Produces syntax-level structure for the file |
| `discoverDeclarations` | Emits symbols with declaration ranges        |
| `resolveSymbols`       | Resolves references to declarations          |
| `resolveTypes`         | Resolves types and signatures                |
| `resolveCalls`         | Resolves call targets, including uncertainty |
| `generateCFG`          | Produces control-flow graphs                 |
| `generateDFG`          | Produces data-flow graphs                    |
| `resolveImports`       | Resolves module/import targets               |
| `mapSourceLocations`   | Emits ranges that map back to source         |
| `reportDiagnostics`    | Reports analysis problems as diagnostics     |

Capabilities describe what an adapter can attempt, not what it guarantees for a
given file. A capability being `true` does not mean every result is resolved;
status and reason codes carry that information.

The Phase 0 mock adapter declares exactly:

```
parse, discoverDeclarations, resolveCalls, mapSourceLocations, reportDiagnostics
```

All others are `false`, which is why the diagnostics report and the capability
payload show no CFG/DFG support.

## Registration

```js
const registry = createAdapterRegistry();
registry.register(mockAdapter);
```

Rules enforced at registration:

- `id` is a non-empty string and unique;
- at least one extension;
- extensions are lower case and start with `.`;
- `analyze` is a function.

Resolution uses the **longest matching extension**, so `.d.ts` can beat `.ts`
when a dedicated adapter appears. Resolution is a suffix check on the lower-cased
path; it is not a full path parse.

## Analyze boundary and fault isolation

`registry.analyze(input)` returns a typed result. It never throws.

| Situation                   | Result                                        |
| --------------------------- | --------------------------------------------- |
| No adapter matches          | `{ok: false, code: 'E_UNSUPPORTED', message}` |
| Adapter throws or rejects   | `{ok: false, code: 'E_ADAPTER', message}`     |
| Adapter returns invalid CSR | `{ok: false, code: 'E_VALIDATION', issues}`   |
| Success                     | `{ok: true, run, adapterId, durationMs}`      |

Fault-isolation rules:

1. A thrown error is caught at the boundary and converted. The host keeps running.
2. Invalid output is rejected, not repaired. The adapter must be fixed.
3. Validation issues include a JSON path so the failure is actionable.
4. `run.adapterId` should equal the descriptor id. **Not enforced yet** — Phase 1
   adds this check.
5. A failing adapter must not affect another adapter's registration or results.
6. The registry does not mutate adapter objects; descriptors are frozen.

Not implemented yet, and required before real languages ship:

- execution in a worker with a time and memory budget;
- cancellation via `AbortSignal`;
- progress reporting;
- caching keyed by content hash;
- compile-command discovery and validation of workspace paths;
- crash recovery after a worker dies.

## Writing an adapter

1. Choose an `id` that names the implementation, not the language (for example
   `cpp-clang`, `js-tree-sitter`). Two adapters can serve one language.
2. Declare only capabilities that are real. An over-claim is a correctness bug:
   the UI and diagnostics trust this list.
3. Emit a `SourceRange` for every symbol. A symbol without provenance is
   rejected.
4. Emit relationships with an honest status. If a call target cannot be
   determined, emit `unresolved` with a reason code — never invent a `resolved`
   edge.
5. Report parse failures as diagnostics and lower `completeness`, rather than
   throwing, when partial output is still meaningful.
6. Do not read files, spawn compilers, or access the network inside the adapter
   module. Accept text and options from the host; Phase 2 introduces a
   process/worker facility for compilers.
7. Keep output deterministic: sort entities by a stable key before returning.

## Reference implementation: the mock adapter

`src/adapters/mock/index.js` returns a fixed graph:

- 2 files, 5 symbols (2 classes, 3 methods/functions), 4 relationships;
- 3 resolved relationships, 1 unresolved call to `external:logger.info` with
  `unknown_import_target`;
- 1 warning diagnostic stating that the data is synthetic, plus 1 info entry;
- `completeness: 'partial'`.

It registers `.mock` only. It deliberately does not claim `.js` or `.cpp`, so the
extension cannot appear to analyze real code.

The only input-derived field is `runId`, which makes determinism testable.

## Contract tests for a new adapter

At minimum:

1. Output passes `validateAnalysisRun`.
2. Every symbol range is inside a declared file.
3. Every non-resolved relationship has a known reason code.
4. No resolved relationship points at an undeclared symbol.
5. Running twice on the same input yields identical output (modulo `runId`).
6. A syntactically broken file produces diagnostics and `partial` or
   `syntactic_only` completeness, not a throw.
7. The adapter declares no capability it cannot demonstrate in a test.

## Planned adapters

| Phase | Adapter    | Notes                                                                                       |
| ----- | ---------- | ------------------------------------------------------------------------------------------- |
| 2     | C++        | Requires a compile database for good resolution; macros and templates must degrade honestly |
| 3     | JavaScript | Module resolution and dynamic dispatch are the main uncertainty sources                     |

Both phases must satisfy the same CSR and contract tests. No adapter may add a
field to the graph DTO directly; additions go through the CSR and the DTO in
`src/core`.

## Non-goals

- AI-generated explanations inside an adapter.
- Network access of any kind.
- Silently guessing a call target to make a graph look complete.
- Language-specific types leaking into `src/core/graph` or the webview.
