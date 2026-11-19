# 0007 — Integrate C++ through host-driven Clang AST JSON

- Status: Accepted
- Date: 2026-11-19
- Phase: 2
- Supersedes: none
- Superseded by: none

## Context

Phase 2 had to choose how CodeFlow obtains C++ declarations, ranges, and call
relationships. Three routes were on the table:

- **Route A** — `clang -fsyntax-only -Xclang -ast-dump=json`, parsed by the
  adapter.
- **Route B** — `libclang` through a native addon or FFI.
- **Route C** — a `clangd` LSP client using `documentSymbol`, `references`, and
  `callHierarchy`.

The phase brief asked for a time-boxed spike per route before choosing. That
spike could not be run in the development environment: no `clang`, `clangd`, or
`libclang` is installed, so there are no honest wall-clock, RSS, symbol-count, or
wrong-case numbers to report. Claiming otherwise would violate the project rule
against invented evidence.

What _was_ possible is a structural evaluation against the constraints that
matter beyond raw speed:

| Constraint                                    | Route A | Route B                    | Route C |
| --------------------------------------------- | ------- | -------------------------- | ------- |
| No native build / Electron ABI risk           | Yes     | **No**                     | Yes     |
| Same integration path on Windows/macOS/Linux  | Yes     | Platform binaries required | Yes     |
| Declaration + statement detail for Phase 4    | Yes     | Yes                        | **No**  |
| Works with a compile database                 | Yes     | Yes                        | Yes     |
| Requires a long-lived server                  | No      | No                         | Yes     |
| Cross-TU references                           | No      | Partial                    | **Yes** |
| Process can be bounded, timed out, and killed | Yes     | In-process                 | Yes     |

Route B was rejected for V1 because shipping or discovering a matching
`libclang` binary and rebuilding against the VS Code Electron ABI is a release
risk larger than the identity benefit, and Phase 1 already defines a line-free
identity scheme that does not need USRs.

Route C was rejected as the _primary_ route because it does not expose control
constructs, which Phase 4 needs, and because a persistent language server adds
lifecycle and latency complexity before there is a product to justify it. It
remains the intended Phase 7 addition for cross-file callers.

## Decision

Use **Route A** for V1 C++ analysis, with a strict host/adapter split:

1. `src/extension/cpp/pipeline.js` owns every decision that touches the
   workspace or a process: toolchain discovery, compile-database selection,
   header→TU mapping, source reading, argument construction, and execution
   through `runTool`.
2. `src/adapters/cpp/` is pure. It receives already-read `text` and an already
   produced `cppAst` and returns CSR. It imports no `fs`, `child_process`, or
   `vscode`, and C-11 enforces this.
3. The compiler is invoked with an argument array, `cwd = workspace root`, a
   hard per-TU timeout, and a hard output cap. Cancellation kills the process
   tree. No shell is involved.
4. A missing toolchain is a typed `E_UNSUPPORTED` failure before any analysis.
   A missing compile database degrades to heuristic mode: the run is `partial`
   with `missing_compile_db`.
5. AST JSON is the only compiler output consumed. Clang diagnostics on stderr
   are sanitised, truncated, and turned into `parse_error` diagnostics rather
   than surfaced raw.
6. Headers are analysed through a representative translation unit and then
   filtered with `focusRunOnPath`, with an `out_of_scope` diagnostic explaining
   the limitation.

Route A is not claimed to be faster or more accurate than B or C. It is the
route whose failure modes are bounded and whose integration survives an editor
upgrade without a native rebuild.

## Consequences

**Accepted costs**

- AST JSON is large. The default cap is 64 MB per TU; exceeding it produces a
  `budget_exceeded` partial run, never truncation into a false success.
- There are no USRs. Identity comes from Phase 1's qualified-name + kind +
  disambiguator scheme, which is stable across whitespace, comments, and line
  shifts but cannot distinguish two same-signature declarations in different
  anonymous namespaces beyond the qualified name.
- There is no cross-TU resolution. A call whose declaration is not in the same
  AST is `unresolved` with a reason code. Phase 7 may merge `clangd` evidence
  without redefining statuses.
- Templates are modelled, not instantiated. Dependent calls are `unresolved`
  or `possible`, never `resolved`.
- Preprocessor conditionals are whatever the compile database configured. The
  inactive branches are invisible and this is documented in the adapter
  boundaries table.

**Rejected alternatives**

- Native `libclang` (Route B): deferred indefinitely; revisit only if AST JSON
  fidelity is measured to be insufficient for a user-visible feature.
- `clangd` as primary (Route C): deferred to Phase 7 for cross-file queries.
- Tree-sitter or a hand-written parser: would avoid the compiler dependency but
  could not honestly resolve calls or types.

## Verification

Because no Clang is installed locally, verification is fixture-driven and
process-driven rather than end-to-end:

- `tests/unit/cppMapper.test.js` maps committed AST JSON fixtures covering
  basics, overloads, unicode, CRLF/LF, templates, virtual dispatch, function
  pointers, macros, and parse errors.
- `tests/unit/cppPipeline.test.js` injects a fake `runTool` to exercise
  discovery, compile-database selection, header mapping, timeouts, output caps,
  cancellation, and Restricted Mode.
- `tests/conformance/cpp.conformance.test.js` runs C-01…C-12 against a real AST
  fixture through the public registry boundary.
- `npm run test:cpp` runs the C++-specific unit and conformance suites.

The phase report records this gap explicitly: real Clang timing and the
anti-false-positive cross-check (P2-20) require a machine with Clang and remain
unverified here.
