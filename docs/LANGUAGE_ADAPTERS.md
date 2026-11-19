# Language adapters (contract)

> **Status: normative.** This is the adapter contract every language backend must
> satisfy. It describes `src/core/adapterRegistry.js`, the CSR it validates
> (`docs/CSR_SPECIFICATION.md`), and the conformance suite in
> `tests/conformance/harness.js`.
>
> Phase 2 adds the C++ adapter described below. Phase 3 adds JavaScript. Neither
> changes the core/adapter boundary, the CSR, or the conformance suite.

## The contract

An adapter is the only component that understands a language. It receives an
input object and returns an `AnalysisRun`. It must not import `vscode`, read
files, spawn processes, render, or know about graph layout or the webview
protocol.

```js
/**
 * @typedef {Object} AnalyzeInput
 * @property {string} runId            Caller-supplied; the run must echo it
 * @property {string} path             Workspace-relative path
 * @property {string} [text]           Pre-read contents; adapters must not read files
 * @property {string} [language]       Hint when an extension is ambiguous
 * @property {string} [workspaceRoot]  Absolute root, for compile-command lookup later
 * @property {CancellationToken} [cancellation]
 * @property {(progress: {phase: string, fraction?: number}) => void} [progress]
 */

/**
 * @typedef {Object} AdapterDescriptor
 * @property {string} id
 * @property {string} displayName
 * @property {string} version
 * @property {string[]} languages
 * @property {string[]} extensions     Lower case, leading dot
 * @property {CapabilitySet} capabilities
 * @property {(input: AnalyzeInput) => AnalysisRun | Promise<AnalysisRun>} analyze
 */
```

The adapter echoes `runId` exactly. Returning a different one is rejected: it
would make caching, cancellation, and logs disagree about which run they refer
to.

## Capabilities

Every capability is `true`, `false`, or `'partial'`. Absent means `false`.
`createCapabilities()` normalises a partial object so consumers never see
`undefined`, and preserves `'partial'` instead of flattening it to `true`.

| Capability             | Meaning                                      |
| ---------------------- | -------------------------------------------- |
| `parse`                | Produces syntax-level structure for the file |
| `discoverDeclarations` | Emits symbols with declaration ranges        |
| `resolveSymbols`       | Resolves references to declarations          |
| `resolveTypes`         | Resolves types and signatures                |
| `resolveCalls`         | Resolves call targets, including uncertainty |
| `generateCFG`          | Produces control-flow constructs             |
| `generateDFG`          | Produces data-flow facts                     |
| `resolveImports`       | Resolves module/import targets               |
| `mapSourceLocations`   | Emits ranges that map back to source         |
| `reportDiagnostics`    | Reports analysis problems as diagnostics     |

`'partial'` means "supported with documented gaps". The query layer treats it as
available; the adapter must explain the gaps through statuses and diagnostics.

Capabilities describe what an adapter can attempt, not what it guarantees for a
file. A call can still be `unresolved` when `resolveCalls` is `true`.

## Registration

```js
const registry = createAdapterRegistry();
registry.register(mockAdapter);
```

Rules enforced at registration:

- `id`, `displayName`, and `version` are non-empty strings; `id` is unique;
- at least one language and at least one extension;
- extensions are lower case, start with `.`, and contain no spaces;
- `analyze` is a function;
- the descriptor is frozen; the registry never mutates it.

Resolution uses the **longest matching extension** on the lower-cased path, so a
future `.d.ts` adapter can coexist with `.ts`. Resolution is a suffix check, not
a full path parse; it accepts any string and returns `null` when nothing matches.

## The analyze boundary

`registry.analyze(input, options)` is total: it never throws.

| Situation                     | Result                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| Invalid input                 | `{ok: false, code: 'E_INPUT', issues}`                      |
| No adapter matches            | `{ok: false, code: 'E_UNSUPPORTED', message}`               |
| Adapter throws                | `{ok: true, run, degraded: {code: 'E_ADAPTER'}, …}`         |
| Cancelled                     | `{ok: true, run, degraded: {code: 'E_CANCELLED'}, …}`       |
| Output rejected by validation | `{ok: false, code: 'E_VALIDATION', issues}`                 |
| Oversized output              | `{ok: false, code: 'E_LIMIT', issues}`                      |
| Unmigratable version          | `{ok: false, code: 'E_VERSION', issues?}`                   |
| Success                       | `{ok: true, run, adapterId, durationMs, issues?, dropped?}` |

Fault-isolation rules:

1. A throw or rejection is caught at the boundary and becomes a **degraded run**:
   valid CSR, `completeness: 'partial'`, and an `E_ADAPTER` error diagnostic. The
   host keeps running and the UI can render an honest empty state.
2. Cancellation is also a degraded run (`E_CANCELLED`). Cancellation is never an
   unhandled rejection.
3. Output is validated **defensively** by default: invalid records are dropped
   one at a time, each drop becomes a `csr_record_dropped` warning, the run is
   marked `partial`, and the result carries `issues` and `dropped`. Pass
   `{mode: 'strict'}` in tests or CI to reject the whole run instead.
4. Adapter output claiming a compatible but older `csrVersion` is migrated
   through explicit steps before validation. A missing step is `E_VERSION`; it is
   never skipped.
5. `run.adapterId` must equal the registered adapter id, and `run.runId` must
   equal `input.runId`. Both are enforced.
6. A failing adapter never affects another adapter's registration or results.

`registry.dryRun(paths)` maps files to adapter ids without analysing anything. It
is the cheap way to preview which adapters a workspace would invoke.

## Cancellation and progress

Adapters receive a `CancellationToken`:

```js
input.cancellation?.throwIfCancelled(); // throws CancellationError (E_CANCELLED)
input.cancellation?.isCancelled(); // subscribe/poll without throwing
```

The token is also created from an `AbortSignal` when the host supplies one. The
registry polls before and after the adapter call, so a token cancelled during
synchronous work still produces a partial run.

`input.progress({phase, fraction})` is optional. The protocol kind
`analysis.progress` exists; Phase 2 wires it to long-running analyses. Adapters
must not emit unbounded progress floods.

## Conformance suite (C-01 … C-12)

Every adapter must pass the reusable suite in `tests/conformance/harness.js`.
The mock adapter passes today; C++ and JavaScript must pass the same rules
without language-specific branches in the harness.

| Rule | Requirement                                                                |
| ---- | -------------------------------------------------------------------------- |
| C-01 | Output validates against the CSR schema in strict mode                     |
| C-02 | Every symbol and relationship site has in-bounds provenance                |
| C-03 | Symbol ids and identity tuples are unique                                  |
| C-04 | Every non-resolved relationship and data fact carries a known reason code  |
| C-05 | Derived `called_by` matches stored `calls` exactly; no derived type stored |
| C-06 | Two runs on identical input serialize identically                          |
| C-07 | Cancellation yields a partial run, not a rejection                         |
| C-08 | A throwing adapter becomes a partial run plus an `E_ADAPTER` diagnostic    |
| C-09 | Oversized output is rejected with `E_LIMIT`, never truncated               |
| C-10 | Unknown `extensions` are ignored by validation and survive serialization   |
| C-11 | The adapter never imports `child_process`, `eval`, `new Function`, etc.    |
| C-12 | Non-ASCII identifiers preserve ranges and names                            |

Run one adapter through the suite:

```js
import { runConformanceSuite } from '../tests/conformance/harness.js';

const suite = await runConformanceSuite({
  name: 'mock',
  adapter: mockAdapter,
  sourceFile: 'src/adapters/mock/index.js',
  fixturePath: 'sample.mock',
});
```

`sourceFile` is required for C-11; without it the rule is skipped and reported as
such. A hostile fixture test proves the suite can fail: it must report specific
rule citations, not a generic "failed".

## Writing an adapter

1. Choose an `id` that names the implementation, not the language (for example
   `cpp-clang`, `js-tree-sitter`). Two adapters can serve one language.
2. Declare only capabilities that are real. An over-claim is a correctness bug:
   the UI, queries, and diagnostics trust this list.
3. Emit a `SourceRange` for every symbol. A symbol without provenance is
   rejected. Convert parser coordinates to 0-based lines and UTF-16 columns.
4. Emit a `disambiguator` for overloads, and `#anon.<n>` for anonymous
   constructs. Do not use line numbers in identity.
5. Emit relationships with an honest status. If a call target cannot be
   determined, emit `unresolved` with a reason code — never invent a `resolved`
   edge. Use `external:<name>` for targets outside the analysed run.
6. Report parse failures as diagnostics and lower `completeness` when partial
   output is still meaningful. Throw only when nothing meaningful can be
   returned; the registry converts the throw into a degraded run.
7. Never store inverse relationship types (`called_by`, `defined_in`, …). The
   query layer derives them.
8. Do not read files, spawn compilers, or access the network inside the adapter
   module. Accept text and options from the host. Phase 2 introduces a
   worker/process facility for compilers; the adapter contract stays the same.
9. Keep output deterministic: sort entities by a stable key and avoid timestamps
   in fields that participate in identity or the run hash.
10. Pass C-01 … C-12 before declaring the adapter usable.

## C++ adapter (`cpp-clang`)

The C++ implementation is split so that the adapter stays pure:

| Layer            | Location                                                        | Responsibility                                                                                                          |
| ---------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Host pipeline    | `src/extension/cpp/pipeline.js`                                 | Trust/path/size checks, toolchain discovery, compile-DB selection, header→TU mapping, Clang invocation, header focusing |
| Toolchain/config | `src/extension/cpp/{clang,compileDb,analysisConfig,headers}.js` | Discovery order, version policy, compile-DB parsing, heuristic flags, include scanning                                  |
| Process facility | `src/extension/tooling/runTool.js`                              | Argument arrays, no shell, timeout, cancellation, kill-tree, output caps                                                |
| Pure adapter     | `src/adapters/cpp/index.js`                                     | Declares capabilities and forwards injected `text` + `cppAst` to the mapper                                             |
| Mapper           | `src/adapters/cpp/mapper.js`                                    | Clang AST JSON → validated CSR records                                                                                  |
| Locator          | `src/adapters/cpp/locator.js`                                   | UTF-8 byte → UTF-16 columns, CRLF/CR line counting, file records                                                        |

The adapter never spawns a compiler and never reads a workspace file. Conformance
rule C-11 fails it if it imports `child_process`, `eval`, or `new Function`.

### Configuration and degradation

Discovery order for the compiler is `codeflow.cpp.clangPath`, then the compiler
named in a compile-database entry when it is Clang-compatible, then `clang` /
`clang++` on `PATH`, then `clang-cl` on Windows or `xcrun --find clang` on macOS.
If nothing is found the host returns typed `E_UNSUPPORTED` with an actionable
message; nothing is downloaded or shipped.

A major version below the documented floor still attempts analysis and marks the
run `partial` with `toolchain_version_mismatch`; a toolchain nuance never
hard-fails the extension.

The compile database is discovered from `codeflow.cpp.compileCommandsPath`, then
the workspace root, `build/`, `cmake-build-*/`, `out/`, and finally a shallow
single-match search. When several databases exist, the one covering the largest
file set wins and the choice is recorded. **No build system is ever executed.**
Without a database, heuristic mode uses:

- `codeflow.cpp.fallbackIncludePaths`
- `codeflow.cpp.fallbackDefines`
- `codeflow.cpp.fallbackStandard`

Every run produced in heuristic mode is `partial` with `missing_compile_db`, and
the UI must show that completeness. System headers will usually be unresolved.

Headers are not analysed standalone. The host finds a representative translation
unit that includes the header, analyses that TU, then filters the run with
`focusRunOnPath`. The result is marked `partial` with an `out_of_scope` info
diagnostic naming the TU. Symbols keep their header file attribution. A header
with no including TU is analysed syntactically only with `header_without_tu`.

### Support boundaries

These boundaries are normative for V1. Where a construct is not modelled, the
CSR must say so with a reason code or a diagnostic; silence is a defect.

| Construct                                           | V1 boundary                                                                                                                                                                                                                              |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Templates                                           | Declarations modelled (`extensions.template = true`); instantiations not expanded. Calls on dependent types are `unresolved` or `possible` with `template_dependent`                                                                     |
| Overloads                                           | Distinct identities via kind + qualified name + disambiguator (arity and parameter kinds). A call to one overload is `resolved`; an unresolved set is `possible` or `unresolved` with candidates in evidence, never a guessed `resolved` |
| Macros                                              | Expansion-site provenance only; macro bodies are not inlined into the graph. Object-like macros producing declarations may make identity ambiguous and are reported as `unsupported_construct`                                           |
| Function pointers, member pointers, `std::function` | `unresolved` with `function_pointer`; never `resolved`                                                                                                                                                                                   |
| Virtual dispatch                                    | Calls through a known static type are `possible` with `dynamic_dispatch`; a single known override may be `inferred`. No `resolved` edge is invented                                                                                      |
| Constructors / destructors                          | `CXXConstructExpr` emits `instantiates` to the class. V1 does not emit a separate constructor `calls` edge                                                                                                                               |
| `goto` / computed `goto`                            | Recorded as a construct; full control flow is Phase 4. Computed jumps remain `unresolved`                                                                                                                                                |
| Exceptions                                          | `throw`/`catch` sites recorded as constructs with an `unsupported_construct` info diagnostic; exception-path modelling is Phase 4                                                                                                        |
| Preprocessor conditionals                           | Only the compile database's active configuration is visible; alternate branches are invisible and documented in the UI                                                                                                                   |
| `extern "C"` / mangling                             | Linkage recorded in `extensions`; identity is unaffected                                                                                                                                                                                 |
| Multiple inheritance                                | All bases recorded; override disambiguation may be `possible`                                                                                                                                                                            |
| C++20 modules                                       | Not supported in V1; `unsupported_construct`                                                                                                                                                                                             |
| Includes                                            | `includes` file→file edges for workspace-owned files; system headers are excluded from the run and reported honestly                                                                                                                     |

### Partial-analysis rules

A run is `partial` when any of the following occurs, and each adds a diagnostic:
missing compile database (`missing_compile_db`), missing system headers, Clang
parse errors (`parse_error`), timeout or cancellation (`budget_exceeded` /
`cancelled`), output cap reached (`budget_exceeded`), unsupported construct in a
user file (`unsupported_construct`), toolchain version mismatch
(`toolchain_version_mismatch`), or a focused header run (`out_of_scope`).

Timeouts, output-cap breaches, and cancellation are **partial runs**, not
rejections: the host keeps whatever validated records were produced and labels
the result. Missing toolchain, missing workspace, outside-workspace paths, and
Restricted Mode are typed failures before analysis (`E_UNSUPPORTED`, `E_INPUT`,
`E_UNTRUSTED`).

### Fixtures and verification

Committed under `tests/fixtures/cpp/`: `basic.cpp`, `overloads.cpp`,
`unicode.cpp`, `multi-tu` AST/source pairs, and AST fixtures for templates,
virtual dispatch, function pointers, macros, and parse errors. Unit coverage
lives in `tests/unit/cpp*.test.js`; conformance lives in
`tests/conformance/cpp.conformance.test.js`; run both with `npm run test:cpp`.

No Clang installation is assumed by the test suite: AST fixtures exercise the
mapper, and a fake `runTool` exercises discovery, execution, timeout, cap,
cancellation, and trust behaviour. The anti-false-positive cross-check against a
live Clang (P2-20) is recorded as unverified in the Phase 2 report rather than
silently skipped.

## Reference implementation: the mock adapter

`src/adapters/mock/index.js` is the fixture that exercises the whole contract:

- 2 files, 11 declared symbols, 10 relationships, 5 control constructs, 3 data
  facts, 2 diagnostics;
- overloads (`DBHandler.open#arity1.path`, `#arity2.path+encoding`), an anonymous
  lambda (`#anon.1`), a non-ASCII identifier (`naïve`), and same-named locals in
  different scopes;
- every resolution status (`resolved`, `inferred`, `possible`, `unresolved`,
  `stale`) and external targets (`external:logger.info`, `external:fs.readFile`);
- evidence on at least one relationship, plus a synthetic-data warning.

It registers `.mock` only and declares no `generateCFG`/`generateDFG`, so
`registry.query(run).constructsOf(...)` deliberately returns `E_UNSUPPORTED`.
That is the honest behaviour the capability system exists to produce. Phase 4
adds the constructs capability to real adapters.

## Adapter status

| Phase | Adapter                 | Status  | Notes                                                                   |
| ----- | ----------------------- | ------- | ----------------------------------------------------------------------- |
| 1     | Mock                    | Shipped | Contract fixture on `.mock` only                                        |
| 2     | C++ (`cpp-clang`)       | Shipped | Route A; host-driven Clang AST JSON; compile-DB and heuristic modes     |
| 3     | JavaScript              | Next    | Module resolution and dynamic dispatch are the main uncertainty sources |
| 7     | C++ cross-file evidence | Planned | May add `clangd` evidence without redefining resolution statuses        |

Every adapter must satisfy the same CSR and the same conformance suite. No
adapter may add a field to the graph DTO directly; additions go through the CSR
and the DTO in `src/core`.

## Non-goals

- AI-generated explanations inside an adapter.
- Network access of any kind.
- Silently guessing a call target to make a graph look complete.
- Language-specific types leaking into `src/core/graph` or the webview.
- Declaring support for an extension before a real parser ships.
