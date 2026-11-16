# CSR specification

> **DRAFT — superseded by Phase 1.**
> This document and the code it describes (`src/core/csr/`) exist to prove the
> Phase 0 pipeline. Phase 1 replaces both with the normative model, a complete
> validator, an identity strategy, and a migration mechanism. Do not build
> long-lived features against this draft.

## Purpose

The CodeFlow Semantic Representation (CSR) is the contract between language
analysis and everything above it: graph construction, layout, the webview DTO,
and rendering. If a fact is not in the CSR, the graph cannot show it. If a fact
is in the CSR, no consumer needs to know which language produced it.

The CSR is deliberately boring: plain JSON-shaped objects, closed enums, and
explicit ranges. No functions, no class instances, no language-specific types
outside an `extensions` bag.

## Scope

In scope:

- files, symbols, and declarations;
- relationships between symbols, with resolution status and reason codes;
- diagnostics and completeness;
- source ranges for provenance.

Out of scope for the draft (Phase 1+):

- control-flow and data-flow graphs;
- types and signatures;
- scopes and bindings;
- incremental identity across edits;
- cross-project references;
- binary serialization.

## Entities

### `SourceRange`

| Field         | Type   | Meaning                                       |
| ------------- | ------ | --------------------------------------------- |
| `fileId`      | string | Must reference a `FileRecord` in the same run |
| `startLine`   | int    | 0-based, inclusive                            |
| `startColumn` | int    | 0-based UTF-16 code units, inclusive          |
| `endLine`     | int    | 0-based, inclusive                            |
| `endColumn`   | int    | 0-based UTF-16 code units, exclusive          |

Rules: non-negative integers; `endLine >= startLine`; on a single line,
`endColumn >= startColumn`; `endLine < FileRecord.lineCount`.

### `FileRecord`

| Field         | Type   | Meaning                                   |
| ------------- | ------ | ----------------------------------------- |
| `fileId`      | string | Unique within the run                     |
| `path`        | string | Workspace-relative, forward slashes       |
| `language`    | string | Adapter-reported language id              |
| `contentHash` | string | Adapter-defined, used for staleness later |
| `lineCount`   | int    | Positive; upper bound for ranges          |

### `SymbolRecord`

| Field           | Type          | Meaning                               |
| --------------- | ------------- | ------------------------------------- |
| `symbolId`      | string        | Unique, opaque, adapter-owned         |
| `kind`          | enum          | See symbol kinds                      |
| `name`          | string        | Display name                          |
| `qualifiedName` | string        | Stable qualified name where available |
| `declaration`   | `SourceRange` | Mandatory provenance                  |
| `extensions`    | object        | Optional adapter-specific data        |

### `Relationship`

| Field            | Type          | Meaning                                   |
| ---------------- | ------------- | ----------------------------------------- |
| `relationshipId` | string        | Unique within the run                     |
| `type`           | enum          | See relationship types                    |
| `from`           | string        | Must be a declared `symbolId`             |
| `to`             | string        | Declared symbol id, or an external target |
| `status`         | enum          | See resolution statuses                   |
| `reasonCode`     | string        | Required when `status !== 'resolved'`     |
| `site`           | `SourceRange` | Optional: where the relationship occurs   |

Only one direction is stored. Inverse relationships (`called_by`, `defined_in`,
etc.) are derived by consumers when needed; storing both invites drift.

### `Diagnostic`

| Field      | Type     | Meaning                                 |
| ---------- | -------- | --------------------------------------- |
| `severity` | enum     | `info`, `warning`, `error`              |
| `code`     | string   | Stable machine-readable code            |
| `message`  | string   | Human-readable, must not contain source |
| `affects`  | string[] | Optional symbol/file ids                |

### `AnalysisRun`

| Field           | Type             | Meaning                                   |
| --------------- | ---------------- | ----------------------------------------- |
| `runId`         | string           | Caller-supplied; identifies this analysis |
| `adapterId`     | string           | Must match the registered adapter         |
| `language`      | string           | Primary language of the run               |
| `csrVersion`    | string           | Currently `0.1.0-draft`                   |
| `completeness`  | enum             | `full`, `partial`, `syntactic_only`       |
| `files`         | `FileRecord[]`   |                                           |
| `symbols`       | `SymbolRecord[]` |                                           |
| `relationships` | `Relationship[]` |                                           |
| `diagnostics`   | `Diagnostic[]`   |                                           |

## Enumerations

**Symbol kinds** (closed in the draft): `file`, `namespace`, `module`, `class`,
`struct`, `function`, `method`, `constructor`, `destructor`, `closure`,
`variable`, `parameter`, `field`, `property`, `enum`, `enum_member`, `type_alias`,
`unknown`.

**Relationship types** (closed in the draft): `calls`, `references`, `defines`,
`declares`, `imports`, `exports`, `includes`, `inherits`, `implements`,
`overrides`, `instantiates`, `reads`, `writes`, `assigns`, `parameter_of`,
`captures`.

**Resolution statuses**: `resolved`, `inferred`, `possible`, `unresolved`,
`stale`.

**Reason codes** (draft): `dynamic_dispatch`, `function_pointer`,
`missing_compile_db`, `macro_expansion`, `unknown_import_target`,
`overload_ambiguous`, `out_of_scope`, `parse_error`, `index_stale`, `too_deep`,
`mock_data`.

**Completeness**: `full`, `partial`, `syntactic_only`.

Enums are closed. Adding a value is a schema change that requires updating the
validator, the graph, the legend, and the tests in one commit.

## Provenance rules

1. Every symbol has a declaration range inside a declared file.
2. A relationship's `site` is optional but, when present, must be valid.
3. A `resolved` relationship must target a declared symbol. If the target is not
   declared, the relationship is not `resolved`.
4. A non-`resolved` relationship carries a reason code. Free text belongs in
   diagnostics, not in the reason field.
5. Diagnostics must not embed source text.
6. Graph consumers must show unresolved and external targets rather than hiding
   them. The current graph creates a placeholder node for an undeclared target
   and labels it `external`.

## Identity (draft)

- `fileId` is a string unique within a run. The mock adapter uses
  `file:<workspace-relative-path>`, but this is not enforced yet.
- `symbolId` is opaque and adapter-owned. Consumers must not parse it. The mock
  uses a readable composite (`symbol:js:<path>:<kind>:<name>`), but Phase 1 owns
  the real scheme.
- `relationshipId` is unique within a run. It must be stable enough to
  deduplicate repeated analysis of the same code.

Phase 1 must define identity that survives edits without colliding with a
different symbol. Until then, ids are only guaranteed within one run.

## Validation

`validateAnalysisRun(run)` returns `{ok: true, run}` or
`{ok: false, issues: [{path, message}]}`. It never throws and never repairs
input. Enforced today:

- required non-empty strings: `runId`, `adapterId`, `language`, `csrVersion`;
- `completeness` is a known level;
- `files`, `symbols`, `relationships`, `diagnostics` are arrays;
- file ids are unique; `path` is non-empty; `lineCount` is a positive integer;
- symbol ids are unique; `kind` is known; `declaration` exists and is valid;
- relationship ids are unique; `type` is known; `status` is known;
- non-resolved relationships have a known reason code;
- `from` is a declared symbol; a resolved `to` is a declared symbol;
- optional `site` ranges are valid;
- diagnostic severity, code, and message are present and well-formed.

Not enforced yet (Phase 1): path syntax, content-hash format, `extensions`
contents, `affects` targets, duplicate relationships between the same pair,
max entity counts, and cross-file range consistency for imported files.

## Size and transport

CSR is passed in memory from the adapter to the graph. It is not sent to the
webview; only the graph DTO is. A serialized protocol message is capped at
1,000,000 characters, so a graph DTO for a very large run must be paginated or
filtered in a later phase.

## Versioning and migration

- `csrVersion` is a string (`0.1.0-draft`), not a number, because Phase 1 will
  rewrite the model.
- Adapters declare the version they emit. The registry currently validates shape,
  not version compatibility.
- Phase 1 adds: a normative version, a compatibility check at the adapter
  boundary, and a migration function for cached runs.

## Open questions for Phase 1

1. Stable symbol identity across edits and renames.
2. Whether ranges should be UTF-16 code units (current), UTF-8 bytes, or
   line/column pairs from the underlying parser.
3. How to represent overload sets, templates/generics, and macros without
   pretending to resolve them.
4. Whether `external:` targets are first-class symbols or a separate entity.
5. Canonical path rules for case-insensitive file systems and symlinks.
6. Size budgets per run and per file.
7. How much of the `extensions` bag consumers may rely on.
8. Whether control-flow graphs attach to symbols or to relationships.
