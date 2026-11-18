# CSR specification (v1.1.0)

> **Status: normative.** This document and `src/core/csr/` define the contract
> between language analysis and every consumer above it. Phase 1 owns this
> contract; later phases may add fields under a minor bump, but they may not
> change the meaning of an existing field without a major bump.
>
> Executable half of the contract: `src/core/csr/types.js` (enums and version),
> `src/core/csr/entities.js` (factories), `src/core/csr/validate.js` (rules),
> `src/core/csr/identity.js` (ids), `src/core/csr/serialize.js` (determinism),
> `src/core/csr/migrate.js` (version steps), `src/core/csr/query.js` (queries).

## Purpose

The CodeFlow Semantic Representation (CSR) is the only thing an adapter produces
and the only thing consumers read. If a fact is not in the CSR, the graph cannot
show it. If a fact is in the CSR, no consumer needs to know which language
produced it.

CSR is deliberately boring: plain JSON-shaped objects, closed enums, explicit
ranges, and a single stored direction per relationship. No functions, no class
instances, and no language-specific types outside `extensions`.

## Versioning

- `csrVersion` is a semantic version string. This build emits `1.1.0`.
- A consumer accepts any version with the same **major** number.
- A newer **minor** is accepted and the consumer adds an `info` diagnostic with
  code `csr_newer_minor`, because additive fields must not break older readers.
- A different major is rejected with `E_VALIDATION`.
- Migrations are explicit single steps (`src/core/csr/migrate.js`). A missing
  step is `E_MIGRATION_MISSING`; a downgrade or cross-major migration is
  `E_VERSION`. **Nothing is silently skipped.**
- `1.0.0 → 1.1.0` is a real migration: `symbols[].range` becomes
  `symbols[].declaration`, `relationships[].reason` becomes `.reasonCode`,
  `status: 'unknown'` becomes `unresolved` + `parse_error`, and newly required
  fields are filled with honest defaults.

## Coordinate contract

- Lines are **0-based**.
- Columns are **0-based UTF-16 code units** (JavaScript string indexing and
  VS Code `Position` agree with this).
- `startLine`/`startColumn` are inclusive; `endLine`/`endColumn` are exclusive.
- A BOM is not part of column 0. `createLineIndex()` strips it and reports
  `bomLength`; offsets are relative to the stripped text.
- CRLF, LF, and lone CR are all line breaks. A position inside a CRLF pair is
  clamped to the end of the preceding line, because there is no cursor between
  `\r` and `\n`.
- Helpers: `createLineIndex`, `positionAt`, `offsetAt`, `rangeFromOffsets`,
  `rangeToOffsets`, `sliceRange`, `rangeContains`, `rangesIntersect`.

Adapters convert parser coordinates at their own boundary. Consumers never
re-parse source to discover a coordinate system.

## Entities

### `SourceRange`

| Field         | Type   | Meaning                                       |
| ------------- | ------ | --------------------------------------------- |
| `fileId`      | string | Must reference a `FileRecord` in the same run |
| `startLine`   | int    | 0-based, inclusive                            |
| `startColumn` | int    | 0-based UTF-16 units, inclusive               |
| `endLine`     | int    | 0-based, exclusive                            |
| `endColumn`   | int    | 0-based UTF-16 units, exclusive               |
| `startOffset` | int    | Optional UTF-16 offset, BOM-stripped text     |
| `endOffset`   | int    | Optional UTF-16 offset, BOM-stripped text     |

Rules: non-negative integers; `endLine >= startLine`; on one line
`endColumn >= startColumn`; `startLine` and `endLine` are both `< lineCount`.
Offsets, when present, are non-negative integers.

### `FileRecord`

| Field         | Type    | Meaning                                        |
| ------------- | ------- | ---------------------------------------------- |
| `fileId`      | string  | Unique within the run; starts with `file:`     |
| `path`        | string  | Workspace-relative, forward slashes, no `..`   |
| `language`    | string  | Adapter language id                            |
| `contentHash` | string  | Host-provided or adapter-provided change token |
| `sizeBytes`   | int     | Non-negative                                   |
| `lineCount`   | int     | Positive; upper bound for ranges               |
| `generated`   | boolean | True for generated output (may be excluded)    |
| `extensions`  | object  | Optional, adapter-specific                     |

Path rules are enforced: no backslashes, no absolute paths, no drive letters,
no empty or `..` segments, no control characters, at most 1,024 code units.

### `SymbolRecord`

| Field           | Type          | Meaning                                      |
| --------------- | ------------- | -------------------------------------------- |
| `symbolId`      | string        | Stable identity; see below, starts `symbol:` |
| `kind`          | enum          | See symbol kinds                             |
| `name`          | string        | Display name (may be non-ASCII)              |
| `qualifiedName` | string        | Producer-native qualified name               |
| `language`      | string        | Language id                                  |
| `declaration`   | `SourceRange` | Mandatory provenance                         |
| `signature`     | string        | Optional; may be empty                       |
| `parentId`      | string        | Optional, must reference a declared symbol   |
| `visibility`    | enum          | Optional; see visibilities                   |
| `disambiguator` | string        | Optional stable token separating overloads   |
| `extensions`    | object        | Optional                                     |

Parent chains are validated for existence and acyclicity. A missing parent or a
cycle is a validation error (or a dropped symbol in defensive mode, together
with its orphaned descendants).

### `Evidence`

Evidence attaches facts to their justification.

| Field            | Type          | Meaning                                                                                          |
| ---------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| `kind`           | enum          | `source_range`, `symbol`, `relationship`, `diagnostic`, `macro_expansion`, `import`, `heuristic` |
| `range`          | `SourceRange` | Optional; validated like any range                                                               |
| `symbolId`       | string        | Optional reference                                                                               |
| `relationshipId` | string        | Optional reference                                                                               |
| `diagnosticCode` | string        | Optional diagnostic code                                                                         |
| `note`           | string        | Optional short note; never source text                                                           |

### `Relationship`

| Field            | Type          | Meaning                                                   |
| ---------------- | ------------- | --------------------------------------------------------- |
| `relationshipId` | string        | Unique within the run                                     |
| `type`           | enum          | Stored relationship type                                  |
| `from`           | string        | Must be a declared `symbolId`                             |
| `to`             | string        | Declared symbol id, or an `external:` target              |
| `status`         | enum          | `resolved`, `inferred`, `possible`, `unresolved`, `stale` |
| `reasonCode`     | string        | Required unless `resolved`; closed enum                   |
| `evidence`       | `Evidence[]`  | Optional; at most 32 entries                              |
| `site`           | `SourceRange` | Optional; where the relationship occurs                   |
| `extensions`     | object        | Optional                                                  |

Only one direction is stored. `called_by`, `defined_in`, `referenced_by`,
`declared_by`, `read_by`, `written_by`, and `captured_by` are derived by the
query layer and must never appear in `relationships`.

A `resolved` relationship must target a declared symbol. `inferred`, `possible`,
`unresolved`, and `stale` may target a declared symbol or an external target
(`external:<name>`). Hiding either case is forbidden: the graph creates an
external placeholder node instead.

### `ControlConstruct`

| Field         | Type          | Meaning                              |
| ------------- | ------------- | ------------------------------------ |
| `constructId` | string        | Unique within the run                |
| `kind`        | enum          | See control construct kinds          |
| `parentId`    | string        | Optional; must reference a construct |
| `children`    | string[]      | Must reference declared constructs   |
| `symbolId`    | string        | Optional owning symbol               |
| `condition`   | `SourceRange` | Optional; used by branches and loops |
| `sourceRange` | `SourceRange` | Required                             |
| `extensions`  | object        | Optional                             |

Child and parent links are validated for existence and acyclicity. A construct
is language-neutral: `if`/`loop`/`try` mean the same thing in every language.
CFG edges are deliberately not part of CSR 1.1.0; Phase 4 adds them additively.

### `DataFact`

| Field             | Type          | Meaning                           |
| ----------------- | ------------- | --------------------------------- |
| `factId`          | string        | Unique within the run             |
| `kind`            | enum          | See data fact kinds               |
| `symbolId`        | string        | Declared symbol the fact is about |
| `at`              | `SourceRange` | Required location                 |
| `relatedSymbolId` | string        | Optional second symbol            |
| `status`          | enum          | Resolution status                 |
| `reasonCode`      | string        | Required unless `resolved`        |
| `extensions`      | object        | Optional                          |

DFG edges beyond these facts are Phase 11; the facts are the stable base.

### `Diagnostic`

| Field         | Type          | Meaning                               |
| ------------- | ------------- | ------------------------------------- |
| `severity`    | enum          | `info`, `warning`, `error`            |
| `code`        | string        | Stable machine-readable code          |
| `message`     | string        | Human-readable; must not embed source |
| `sourceRange` | `SourceRange` | Optional                              |
| `affects`     | string[]      | Optional file/symbol/relationship ids |

`affects` entries that look like ids (`file:`, `symbol:`, `rel:`) must resolve.
Unknown ids are a validation error.

### `AnalysisRun`

| Field               | Type                 | Meaning                                    |
| ------------------- | -------------------- | ------------------------------------------ |
| `runId`             | string               | Caller-supplied; metadata                  |
| `adapterId`         | string               | Must match the registered adapter          |
| `adapterVersion`    | string               | Non-empty; defaults to `unknown`           |
| `language`          | string               | Primary language id                        |
| `csrVersion`        | string               | `1.1.0` for this build                     |
| `startedAt`         | string               | Optional ISO timestamp (not deterministic) |
| `durationMs`        | number               | Optional timing (not deterministic)        |
| `scope`             | `{kind, path?}`      | `file` or `workspace`                      |
| `completeness`      | enum                 | `full`, `partial`, `syntactic_only`        |
| `files`             | `FileRecord[]`       |                                            |
| `symbols`           | `SymbolRecord[]`     |                                            |
| `relationships`     | `Relationship[]`     |                                            |
| `controlConstructs` | `ControlConstruct[]` |                                            |
| `dataFacts`         | `DataFact[]`         |                                            |
| `diagnostics`       | `Diagnostic[]`       |                                            |
| `extensions`        | object               | Optional run-level bag                     |

`startedAt` and `durationMs` are metadata. They are excluded from the
deterministic serialization and the run hash.

## Enumerations (closed)

**Symbol kinds:** `file`, `namespace`, `module`, `class`, `struct`, `interface`,
`function`, `method`, `constructor`, `destructor`, `lambda`, `closure`,
`variable`, `parameter`, `field`, `property`, `enum`, `enum_member`,
`type_alias`, `macro`, `unknown`.

**Stored relationship types:** `calls`, `references`, `defines`, `declares`,
`imports`, `exports`, `includes`, `inherits`, `implements`, `overrides`,
`instantiates`, `reads`, `writes`, `assigns`, `parameter_of`, `captures`.

**Derived relationship types (never stored):** `called_by`, `defined_in`,
`referenced_by`, `declared_by`, `read_by`, `written_by`, `captured_by`.

**Resolution statuses:** `resolved`, `inferred`, `possible`, `unresolved`,
`stale`. Only `resolved` implies certainty.

**Reason codes:** `dynamic_dispatch`, `function_pointer`, `missing_compile_db`,
`macro_expansion`, `unknown_import_target`, `overload_ambiguous`, `out_of_scope`,
`parse_error`, `index_stale`, `too_deep`, `generated_source`,
`unsupported_language`, `budget_exceeded`, `cancelled`, `adapter_error`,
`internal_error`, `mock_data`. Human descriptions live in
`REASON_CODE_DESCRIPTIONS`; free text belongs in diagnostics.

**Completeness:** `full`, `partial`, `syntactic_only`.

**Visibilities:** `public`, `protected`, `private`, `internal`, `package`,
`local`, `unknown`.

**Control construct kinds:** `entry`, `exit`, `sequence`, `block`, `if`, `else`,
`switch`, `case`, `loop`, `for`, `while`, `do_while`, `try`, `catch`, `finally`,
`return`, `throw`, `break`, `continue`, `await`, `yield`, `jump`, `unknown`.

**Data fact kinds:** `definition`, `use`, `assignment`, `read`, `write`,
`parameter`, `return`, `capture`.

Enums are closed. Adding a value requires updating the spec, the validator, the
graph legend/labels, and the tests in one change.

## Identity

Scheme (normative):

```
symbol:<language>:<workspace-path>:<kind>:<qualified-name>[#<disambiguator>]
file:<workspace-relative-path>
rel:<type>:<16-hex-hash>[#<ordinal>]
```

Rules:

1. **Line numbers never appear in an id.** Whitespace, comment, and line-shift
   edits must leave identity untouched.
2. `qualifiedName` keeps the producer's separator in the record (`::` or `.`);
   ids normalise it to `.`.
3. Overloads use `arity<n>.<normalised-parameter-kinds>`, for example
   `#arity2.path+encoding`.
4. Anonymous constructs use `#anon.<ordinal-within-parent>`, for example
   `#anon.1`.
5. Same-named locals are distinguished by their qualified name
   (`main.i` vs `DBHandler.check_db_exists.i`), not by range.
6. If a collision survives the explicit disambiguator, the allocator falls back
   to declaration order (`#1`, `#2`). That is stable under whitespace edits but
   not under reordering, and is documented as the last resort.
7. Renames change identity: remove the old id, add the new one. Ids are never
   silently reused.
8. Ids are human-readable for debugging but opaque to consumers. Nothing may
   parse an id to discover a range or a file.

The C-03 identity tuple is `(fileId, kind, qualifiedName, disambiguator)`. Two
symbols with the same tuple are rejected even if their `symbolId`s differ.

## Validation

`validateAnalysisRun(run, options)` is total: it returns typed issues and never
throws. Options:

- `mode: 'strict'` (default in tests/CI): every issue is returned, nothing is
  dropped; any issue means `ok: false`.
- `mode: 'defensive'` (default at the production registry boundary): invalid
  records are dropped individually, every drop becomes a `csr_record_dropped`
  warning diagnostic, `completeness` is lowered to `partial`, and the surviving
  run is returned with `dropped` metadata.
- `expectedAdapterId`: rejects a run whose `adapterId` does not match the
  registered adapter.

Enforced (non-exhaustive):

- required non-empty strings: `runId`, `adapterId`, `adapterVersion`,
  `language`; compatible `csrVersion`;
- known `completeness`, `scope.kind`, `visibility`, evidence kind;
- collection shape (`files`, `symbols`, … are arrays), unique ids, unique
  identity tuples;
- symbol kinds, parent existence and acyclicity;
- relationship type/status/reason-code rules, `from` declared, resolved `to`
  declared, optional site/evidence ranges valid;
- construct kinds, child/parent existence and acyclicity, owning symbol exists;
- data fact kind/status/reason and symbol references;
- diagnostic severity/code/message and resolvable `affects`;
- numeric ranges, file bounds, workspace-relative path syntax;
- size limits (below).

Every issue has a JSON path (`symbols[0].declaration.endLine`) and, for limits,
code `E_LIMIT`. Oversized input is **rejected, never truncated**.

## Limits

`src/core/csr/limits.js` defines hard ceilings per run:

| Collection / field           | Limit       |
| ---------------------------- | ----------- |
| `files`                      | 5,000       |
| `symbols`                    | 200,000     |
| `relationships`              | 500,000     |
| `controlConstructs`          | 200,000     |
| `dataFacts`                  | 500,000     |
| `diagnostics`                | 10,000      |
| evidence per relationship    | 32          |
| `affects` per diagnostic     | 64          |
| name / qualified name        | 512 units   |
| path                         | 1,024 units |
| signature / id string        | 4,096 units |
| diagnostic message           | 2,000 units |
| serialized payload (planned) | 8,000,000 B |

Limits are correctness limits: an unbounded array must fail at the boundary
instead of exhausting host memory.

## Serialization and hashing

`serializeRun(run)` is deterministic:

- collections are sorted by documented keys (`fileId`, `symbolId`,
  `type|from|to|relationshipId`, `constructId`, `factId`, severity+code+message);
- object keys are emitted in sorted order at every depth, including
  `extensions`;
- `startedAt` and `durationMs` are excluded;
- two runs over identical input produce identical bytes, including across
  processes and platforms.

`hashRun(run)` is a 64-bit-ish FNV-1a hash rendered as 16 lower-case hex
characters. It is used for change detection, not security. `parseRun(json)`
round-trips through the validator and rejects invalid or truncated payloads with
a typed result.

## Queries

`createQueryLayer(run, {capabilities})` is the only supported way for consumers
to ask questions:

| Query              | Capability     | Notes                                 |
| ------------------ | -------------- | ------------------------------------- |
| `allSymbols`       | —              | Every symbol, deterministic id order  |
| `allRelationships` | —              | Every stored relationship, stable key |
| `diagnostics`      | —              | Copy of run diagnostics               |
| `runInfo`          | —              | Identity, language, scope, status     |
| `symbolById`       | —              | `E_NOT_FOUND` for unknown ids         |
| `symbolsInFile`    | —              | Deterministic id order                |
| `outgoing`         | —              | Stored relationships, typed filters   |
| `incoming`         | —              | Derived inverses, cached              |
| `callers`          | `resolveCalls` | Derived `called_by`                   |
| `callees`          | `resolveCalls` | Declared targets and external targets |
| `constructsOf`     | `generateCFG`  | Flat list, roots, and `byId`          |
| `dataFactsOf`      | `generateDFG`  |                                       |
| `capabilities`     | —              | Copy of the declared set              |

Every query returns `{ok: true, value}` or `{ok: false, code, message}`. It never
throws. A missing capability returns `E_UNSUPPORTED` instead of an empty array,
because an empty array would look like "no results" rather than "not supported".

## Transport

CSR is validated in the host. Consumers above the host boundary receive:

- `graph.data` — the renderable DTO (no source text);
- `csr.data` — the validated run plus its deterministic hash, for inspectors and
  tests;
- `query.data` — one typed query result.

The webview never imports an adapter and never receives an adapter object. A
serialized protocol message is capped at 1,000,000 bytes; oversized messages are
rejected rather than truncated.

## What CSR deliberately does not contain

- source text (only ranges);
- language-specific types outside `extensions`;
- CFG/DFG edges (Phase 4/11 add them);
- compile commands or include paths;
- AI-generated explanations;
- line-number-based identity.
