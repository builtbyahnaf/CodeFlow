# 0008 — Parse JavaScript with acorn and analyse scope with eslint-scope

- Status: Accepted
- Date: 2026-11-19
- Phase: 3
- Supersedes: none
- Superseded by: none

## Context

Phase 3 must produce scopes, declarations, imports/exports, references, and call
relationships for JavaScript without executing workspace code. The choices that
matter are:

- the parser must emit standard ESTree with locations and ranges;
- lexical bindings must be recoverable, including shadowing, block scopes,
  imports, catch parameters, and function expressions;
- nothing may depend on TypeScript tooling in V1;
- a file that cannot be parsed must become a diagnosed partial run, not an
  exception;
- runtime dependencies must be pure JavaScript and safe to bundle.

Candidates considered:

| Option                  | Scope data                       | TypeScript in V1          | Bundle cost          | Risk      |
| ----------------------- | -------------------------------- | ------------------------- | -------------------- | --------- |
| acorn + eslint-scope    | Yes, ESLint's own scope model    | Not needed                | Small (two packages) | Low       |
| espree                  | Yes (wraps acorn + eslint-scope) | Not needed                | Same plus wrapper    | Low       |
| Babel parser            | Yes, via plugins                 | Pulls a large toolchain   | Large                | Medium    |
| TypeScript compiler API | Yes for TS, not ESTree-shaped    | Tempts TS support into V1 | Large                | High      |
| tree-sitter             | Grammar-specific traversal       | Separate grammar build    | Native binary        | High      |
| hand-written parser     | No honest resolution             | Not applicable            | None                 | Very high |

## Decision

Use **acorn 8.19.0** for parsing and **eslint-scope 8.4.0** for lexical scope
analysis.

1. `src/adapters/javascript/parser.js` parses with
   `ecmaVersion: "latest"`, `locations: true`, `ranges: true`, and
   `allowHashBang: true`. It runs `eslint-scope` with `optimistic: true` and
   `ignoreEval: false` so unresolved names and dynamic scopes are visible rather
   than silently patched.
2. The adapter stays pure. It receives text from the host and never reads files,
   spawns processes, or executes analysed code. C-11 enforces the execution ban.
3. Scope analysis, not heuristics, decides whether a call is lexically bound.
   A direct call to a resolved binding is `resolved`; member calls, computed
   members, `eval`, `with`, prototype mutation, and unknown receivers degrade.
4. TypeScript, TSX, and JSX are rejected before parsing with typed diagnostics.
   They are listed only so the rejection is explicit, not because partial
   parsing is attempted.
5. Module resolution belongs to the host (`src/extension/javascript/pipeline.js`),
   which reads files and applies the workspace trust and path rules. The adapter
   only maps host-supplied resolution records.
6. Both packages are declared as production `dependencies` so the lockfile and
   license audit see them, but esbuild inlines them and the VSIX still ships no
   `node_modules`.

## Consequences

**Accepted costs**

- Acorn is a syntax parser, not a type checker. `obj.save()` cannot be resolved
  when the receiver's shape is unknown; this phase reports that honestly instead
  of pretending.
- `eslint-scope` reports lexical references, not runtime values. Aliasing,
  re-assignment, and dynamic property names remain uncertain and are downgraded
  with reason codes.
- JSX requires a plugin in acorn. V1 rejects it instead of adding a second
  grammar and a JSX-specific mapper.
- Unsupported proposal syntax fails with `parse_error`. The file gets a valid,
  partial run and the UI says why.
- Scope objects are annotated with two non-enumerable-by-convention flags
  (`__hasEval`, `__hasDynamic`) for the dynamic-scope pass. They are internal to
  the mapper and never serialized.

**Rejected alternatives**

- `espree`: functionally equivalent but adds a wrapper without adding scope
  information. acorn + eslint-scope is the smaller dependency edge.
- Babel: heavier, plugin-driven, and its scope model is not needed for the CSR
  contract.
- TypeScript compiler: would smuggle TypeScript analysis into a phase that
  explicitly excludes it, and its AST is not ESTree.
- tree-sitter: native build and a separate grammar lifecycle for no resolution
  gain in V1.

## Verification

- `tests/unit/javascriptParser.test.js` covers BOM handling, module/script
  parsing, parse diagnostics, JSX classification, generic AST walking, module
  specifier collection, exclusions, generated-source detection, and module-kind
  detection.
- `tests/unit/javascriptMapper.test.js` covers scopes and shadowing, classes and
  fields, inheritance, instantiation, recursion, eval/with degradation, dynamic
  receivers, CommonJS, unresolved imports, parse errors, unicode, BOM/CRLF/CR,
  and deterministic serialization.
- `tests/unit/javascriptPipeline.test.js` covers trust, path safety, size and
  line caps, exclusions, relative and package resolution, exports maps, aliases,
  circular graphs, module caps, JSON modules, and end-to-end CSR.
- `tests/conformance/javascript.conformance.test.js` runs C-01…C-12 through the
  registry on a committed unicode fixture.
