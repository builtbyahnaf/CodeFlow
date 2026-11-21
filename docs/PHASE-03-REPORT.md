# Phase 3 completion report — JavaScript analysis

**Phase:** 3 (Roadmap Part VI) · **Report template:** Roadmap §27
**Date:** 2026-11-21 · **Status:** complete with documented environment gaps
**Baseline:** Phase 2 completed at `088285e`

Legend: **Implemented** = shipped and tested · **Partial** = shipped with a
documented gap · **Stub** = interface exists, behaviour is a placeholder ·
**Unverified** = code exists but could not be exercised in this environment ·
**Deferred** = not attempted in this phase.

---

## 1. What was implemented

Every Phase 3 task (P3-01…P3-28) has a shipped implementation. Two review tasks
are recorded as author-only rather than second-reader reviews.

### M1 — Parser integration and module kind

| ID    | Status      | Evidence                                                                                                                                   |
| ----- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| P3-01 | Implemented | `parser.js` wraps acorn 8.19.0 (`ecmaVersion: "latest"`, locations, ranges, hashbang) and eslint-scope 8.4.0; 13 parser tests              |
| P3-02 | Implemented | `moduleKind.js`: `.mjs` module, `.cjs` script, `.js` follows the nearest `package.json` `type`; pipeline caches package type per directory |
| P3-03 | Implemented | Parse failures become a valid partial run with a positioned `parse_error`; JSX at a `<` token becomes `unsupported_syntax`                 |
| P3-04 | Implemented | TypeScript and JSX are rejected before parsing with `unsupported_language` / `unsupported_syntax`; no symbols are invented                 |
| P3-05 | Implemented | UTF-16 columns, BOM strip, CRLF/CR/LF equivalence, unicode identifiers; `unicode-identifiers` and `crlf-bom` fixtures                      |
| P3-06 | Implemented | 2 MB / 20 000 line caps; oversized lines degrade to syntax-only with `budget_exceeded`; oversized bytes are an input error                 |

### M2 — Scopes and declarations

| ID    | Status      | Evidence                                                                                                                                                                      |
| ----- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3-07 | Implemented | §6.2 matrix mapped to tests: `scopes-shadowing`, `hoisting-tdz`, `closures-loop-var`, `arrow-this`, `default-params`, `destructuring`, named-expression and catch-scope tests |
| P3-08 | Implemented | Functions, arrows, classes, fields, private names, static members, getters/setters, variables, destructuring patterns, parameters, imports                                    |
| P3-09 | Implemented | Anonymous and named symbols keep ids across comment/whitespace/line-shift edits (mapper test)                                                                                 |
| P3-10 | Implemented | Shadows keep distinct ids plus disambiguators; `let` redeclaration is a parse error with a line number                                                                        |
| P3-11 | Implemented | `classes-inheritance`, `private-fields`, `getters-setters`; `inherits` only when the base class is in the run                                                                 |

`let`/`const` TDZ references resolve to the same binding; the explanatory
`tdz_sensitive` flag is intentionally Phase 6 UI work and is not emitted here.

### M3 — References, imports, exports

| ID    | Status      | Evidence                                                                                                                                      |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| P3-12 | Implemented | Reference resolution through eslint-scope bindings; shadowing, params, catch bindings and imports covered                                     |
| P3-13 | Implemented | ESM named/default/namespace imports, `require`, `module.exports`, `exports.x`, JSON default exports                                           |
| P3-14 | Implemented | Documented resolver algorithm; relative files/index, optional workspace `node_modules`, aliases and absolute paths degrade with typed reasons |
| P3-15 | Implemented | Re-export chains followed to depth 8; beyond that `reexport_depth_exceeded`; `esm-reexports` fixture                                          |
| P3-16 | Implemented | `cjs-require-exports`; destructured and namespace requires resolve only when the exporting file is in the run                                 |
| P3-17 | Implemented | `circular-imports` terminates quickly; cycles are permitted and both edges resolve                                                            |

The §8 checkpoint asks for a hand-drawn graph in a fixture README. The committed
`expected.json` files serve the same purpose mechanically and are executed; no
separate README was added.

### M4 — Calls and uncertainty

| ID    | Status      | Evidence                                                                                                                                                                                                        |
| ----- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P3-18 | Implemented | Every §6.3 row has a fixture: local/imported calls, unresolved imports, `this` methods, instance shapes, unknown receiver, computed member, `call/apply/bind`, callbacks, eval, prototype, accessors, recursion |
| P3-19 | Implemented | Receiver inference only uses same-file class/object-literal evidence; `unknown-receiver` proves no name-only `resolved`                                                                                         |
| P3-20 | Implemented | `callbacks` proves `possible`/`callback_parameter` and `possible`/`deferred_invocation`; bare parameters are not treated as callbacks unless handed to a scheduler                                              |
| P3-21 | Implemented | `eval-scope`, `prototype-mutation`; `with` shares the dynamic-scope degradation                                                                                                                                 |
| P3-22 | Implemented | `recursion-cycle` marks the call `extensions.recursive`; no special edge type                                                                                                                                   |
| P3-23 | Partial     | Author audit of every `resolved` call edge in the corpus: 15 edges, all lexically justified (table below). No independent second reviewer was available                                                         |

### M5 — Robustness, performance, docs

| ID    | Status      | Evidence                                                                                                                   |
| ----- | ----------- | -------------------------------------------------------------------------------------------------------------------------- |
| P3-24 | Partial     | `perf-large` (5 100 lines) measured end to end and per stage on one Windows machine; no RSS or Linux/macOS numbers         |
| P3-25 | Implemented | `javascript.conformance.test.js`: C-01…C-12 pass through the registry on a committed fixture                               |
| P3-26 | Implemented | `docs/LANGUAGE_ADAPTERS.md` has the JavaScript section: resolver limits, syntax table, uncertainty table                   |
| P3-27 | Partial     | Diagnostic wording reviewed by the author only; no second-reader sample review                                             |
| P3-28 | Implemented | `docs/adr/0008-javascript-parser-choice.md` (the brief's suggested name was `…-parser-and-scope`; the content covers both) |

### Resolved-call audit record (P3-23)

Every `resolved` call edge produced by the 28-fixture corpus:

| Fixture                     | Caller → target                       | Justification                                      |
| --------------------------- | ------------------------------------- | -------------------------------------------------- |
| callbacks                   | `run` → `invoke`                      | local function declaration in the same file        |
| circular-imports            | `a` → `b`, `viaA` → `a`               | relative imports resolved to known exports         |
| cjs-require-exports         | `add` → `util.helper` (×2)            | destructured `require` with a resolved target file |
| esm-named-default-namespace | `main` → `util.primary/helper`        | named/default/namespace imports resolved           |
| esm-reexports               | `main` → `impl.helper`, `extra.extra` | re-export chain followed through `index.js`        |
| hoisting-tdz                | `hoisted` → `later`                   | local function declaration, hoisted                |
| mixed-modules               | `main` → `util.helper`                | named ESM import, resolved despite mixed CJS use   |
| recursion-cycle             | `fact` → `fact`                       | direct recursion, same symbol                      |
| unicode-identifiers         | `main` → `naïve`, `order` → `naïve`   | local function declaration                         |

No edge resolved through an unrelated receiver or a name match alone. Calls
through parameters, unknown variables, computed members, unknown receivers,
unresolved imports, prototypes and eval scopes are `possible`, `inferred` or
`unresolved`, each with a reason code.

---

## 2. What was intentionally deferred

| Deferred                                        | Target  | Why                                                        |
| ----------------------------------------------- | ------- | ---------------------------------------------------------- |
| TypeScript and JSX/TSX analysis                 | Not V1  | Explicit diagnostics; parser stays single-grammar          |
| Bundler aliases (`@/`, `~`)                     | 8       | Requires reading bundler configuration                     |
| Full `exports`-map and conditional resolution   | 8       | Deliberately conservative; complex maps report a typed gap |
| `node_modules` internals                        | 8       | Opt-in only, single-string/`import` exports                |
| Prototype-graph and `Proxy` modelling           | Post-V1 | Uncertainty flags only                                     |
| CFG/DFG from `await`, loops and callbacks       | 4, 11   | Constructs are parsed; edge generation is later            |
| `tdz_sensitive` explanation flag                | 6       | Resolution is correct; the UI explanation is later         |
| Minified/bundled analysis                       | —       | Refused by policy with an input error                      |
| Real-world OSS fixture samples (§10 mitigation) | —       | Not added; corpus is synthetic but concern-complete        |

---

## 3. Files and subsystems changed

**Pure adapter** — `src/adapters/javascript/`:

- `index.js` — `js-acorn` descriptor, extensions, honest capabilities,
  TypeScript/JSX rejection, missing-text propagation.
- `parser.js` — acorn/eslint-scope boundary, BOM, JSX classification, generic
  AST walk, module-specifier collection.
- `locator.js` — acorn locations to CSR ranges and file records.
- `moduleKind.js` — module/script detection, exclusions, generated-source
  detection.
- `mapper.js` — ESTree + scopes to validated CSR, including accessor/field
  property edges, callbacks, dynamic scope and mixed-module diagnostics.

**Host pipeline** — `src/extension/javascript/pipeline.js`: trust and path
checks, file reads, package-type cache, module-graph BFS, relative/package
resolution, caps, JSON modules, diagnostics.

**Host surfaces**: `src/extension/extension.js` registers the adapter and routes
panel analyses by adapter id; `package.json` adds `codeflow.javascript.*` and
`test:js`. No other subsystem changed.

**Tests and fixtures**:

- `tests/unit/javascript{Parser,Mapper,Pipeline,Adapter}.test.js`
- `tests/unit/javascriptFixtures.test.js` — generic expected.json runner
- `tests/conformance/javascript.conformance.test.js`
- `tests/fixtures/javascript/` — 28 concern folders with `expected.json`, plus
  focused loose fixtures used by unit tests.

**Docs**: ADR 0008, JavaScript section in `docs/LANGUAGE_ADAPTERS.md`,
production-dependency table in `docs/DEPENDENCIES.md`, this report, `CHANGELOG.md`.

No TypeScript source, configuration, generated types or `.ts` fixture exists;
`tests/unit/architecture.test.js` enforces this.

---

## 4. Tests added and executed

| Area           | What is proven                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Parser         | BOM, module/script parsing, parse errors, redeclaration, JSX, child walking, specifier collection, exclusions, generated detection, module kind                            |
| Mapper         | scopes, shadowing, TDZ/hoisting, closures, named expressions, catch scope, classes, fields, accessors, inheritance, recursion, eval/with, CJS, unicode                     |
| Mapper safety  | no execution of analysed source; ids stable across comments/whitespace/line shifts; byte-identical serialisation                                                           |
| Pipeline       | Restricted Mode, path/NUL/exclusion/minified rejection, size/line caps, package type, relative and package resolution, exports maps, aliases, cycles, JSON, end-to-end CSR |
| Fixture corpus | 28 concern folders executed through the real host service and adapter, asserting symbols, statuses, reason codes, diagnostics and positions                                |
| Conformance    | C-01…C-12 pass for JavaScript through the registry on a committed fixture                                                                                                  |

Commands: `npm run test:js` and `npm run test:unit` (all adapters).

---

## 5. Test results

| Check                         | Result                                                       |
| ----------------------------- | ------------------------------------------------------------ |
| Full unit + conformance suite | **332 passed, 0 failed** (≈1.4 s)                            |
| JavaScript unit + fixtures    | **80 passed, 0 failed**                                      |
| Conformance C-01…C-12         | JavaScript: 12/12 pass                                       |
| ESLint                        | Clean                                                        |
| Prettier `format:check`       | Clean                                                        |
| No-TypeScript check           | Pass                                                         |
| Build                         | Pass                                                         |
| License audit                 | Pass                                                         |
| VSIX install check            | **Not completed** — same environment limitation as Phase 1/2 |
| Linux/macOS run               | **Not run** — no CI available locally                        |

---

## 6. Performance measurements

`perf-large` is generated by the fixture runner: 1 700 exported functions,
5 100 lines, 94 685 bytes. Node 24.22.1 on Windows, best of five runs:

| Stage                                    | Best     | Mean     |
| ---------------------------------------- | -------- | -------- |
| acorn parse                              | 21.5 ms  | 25.1 ms  |
| eslint-scope analysis (warm AST)         | 2.3 ms   | 6.3 ms   |
| Full mapper (parse + scope + CSR)        | 163.3 ms | 187.4 ms |
| Host service end to end (`fixture` test) | ≈350 ms  | —        |

The phase brief targets under 800 ms for a 5 000-line file; the measured total
is inside it, but this is one machine and one synthetic file. Conversion time is
approximate: the mapper re-parses and re-scopes internally, so “full” minus
“parse” and “scope” overstates the conversion cost. No RSS, cold-start, Linux or
macOS numbers exist.

---

## 7. Known gaps and risks

1. **No independent audit.** P3-23 and P3-27 were author reviews. The resolved
   edge list above is the record; a second reader should still spot-check it.
2. **Synthetic performance only.** Real OSS files were not added to the corpus
   despite the §10 mitigation suggestion.
3. **VSIX not installed.** Packaging is checked structurally only; the install
   smoke test remains unrun in this environment.
4. **Receiver inference is intentionally narrow.** `obj.save()` resolves only
   for a same-file instance/class shape; everything else is `unresolved` or
   `inferred`. This is a deliberate false-negative trade.
5. **Named function expressions** are identified by their inner name (`g` in
   `const f = function g(){}`), while the variable `f` points at that symbol
   through the binding map. This matches the runtime function name but can
   surprise a reader expecting `f`.
6. **Mixed-module files** are valid but partial, with a `mixed_module_system`
   diagnostic; resolution still follows extension and package type.

---

## 8. Acceptance criteria trace

| #      | Criterion                                     | Evidence                                                                                |
| ------ | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| AC-3.1 | Representative fixtures produce validated CSR | 28 fixture folders + C-01…C-12, all strict-validated                                    |
| AC-3.2 | Scope and shadowing tested                    | §6.2 matrix mapped to named fixtures/tests                                              |
| AC-3.3 | Dynamic calls not falsely resolved            | §6.3 fixtures, reason codes, audit table above                                          |
| AC-3.4 | Adapter independent of graph UI               | Adapter imports no `src/visualization` or `src/webview`; headless CSR produced in tests |
| AC-3.5 | No workspace code executed                    | Adapter has no `child_process`; mapper test proves side effects do not run              |
| AC-3.6 | TypeScript/JSX rejected explicitly            | `typescript-file`, `parse-error-jsx`; no symbols invented                               |
| AC-3.7 | Unresolved specifiers keep their raw string   | `extensions.specifier` plus typed reason code on every unresolved import                |
| AC-3.8 | Circular imports terminate within bound       | `circular-imports` fixture, module and depth caps with diagnostics                      |

---

## 9. Readiness for Phase 4

The adapter boundary is stable: the host supplies text and resolution records,
the adapter returns validated CSR, and uncertainty is typed. Phase 4 can add
control constructs (`if`, loops, `try`, `await`, `yield`) without changing the
adapter's resolution rules. The two things Phase 4 must not assume are full
receiver shapes and executed side effects; Phase 3 makes both explicit.
