# CodeFlow Project Indexing Specification

- **Phase:** 8 & 9 — Optional Project Index (`.codeflow/`) and Incremental Hybrid Execution
- **Schema Version:** `1` (`INDEX_SCHEMA_VERSION = 1`)
- **Author:** Muhammad Tahmid Ahnaf

---

## 1. Non-Invasive Contract

The `.codeflow/` project index is strictly optional:

1. **Unindexed parity (AC-8.1):** When `.codeflow/` is absent, single-file analysis, control-flow graphs (Phase 4), hover previews and navigation (Phase 5), deterministic explanations (Phase 6), and single-file call graphs (`scope: 'same_file_only'`, Phase 7) work without error.
2. **Restricted Mode safety:** When `vscode.workspace.isTrusted === false`, CodeFlow never prompts to index, never scans the workspace, and never creates `.codeflow/`.
3. **Source immutability (AC-8.5):** Indexing never modifies any workspace source file and never modifies `.gitignore` without explicit user consent (`consent === true`).
4. **No raw source text in the index:** `validateIndexSnapshot` rejects any record containing `source`, `rawSource`, `sourceText`, `text`, `body`, or `ast`.

---

## 2. `.codeflow/` Directory Layout

All index artifacts live strictly inside `<workspaceRoot>/.codeflow/` and are validated by `resolveCodeflowArtifactPath`:

```text
.codeflow/
  config.json                  # User-editable exclusion/inclusion & budget config
  index/
    codeflow.sqlite            # Schema v1 logical database store
    codeflow.sqlite.wal        # Atomic write-ahead journal during batch transactions
  cache/                       # Reserved for per-file incremental cache (Phase 9)
  graphs/                      # Reserved for saved views (Phase 11)
  metadata/
    index.lock                 # Active writer process lock ({pid, hostname, startedAt, runId, version})
    last-run.json              # Diagnostic summary of the last indexing run
```

---

## 3. Logical Schema v1 (`src/core/indexing/schema.js`)

Schema v1 comprises six logical tables matching `SCHEMA_V1_DDL`:

1. **`meta`**: `schema_version` (`1`), `created_by`, `last_run_id`, `state` (`unindexed` | `indexing` | `complete` | `partial` | `cancelled` | `failed` | `corrupt`), `updated_at`.
2. **`files`**: `file_id` (PK), `path` (UNIQUE workspace-relative POSIX path), `language` (`cpp` | `javascript`), `content_hash` (`sha256:<hex>`), `size_bytes`, `line_count`, `indexed_at`, `run_id`.
3. **`symbols`**: `symbol_id` (PK), `kind`, `name`, `qualified_name`, `language`, `file_id` (`REFERENCES files(file_id) ON DELETE CASCADE`), `parent_id`, `start_line`, `start_col`, `end_line`, `end_col`, `visibility`, `extensions_json`, `run_id`.
4. **`relationships`**: `rel_id` (PK), `type`, `from_id`, `to_id`, `status`, `reason`, `site_file`, `site_start_line`, `site_end_line`, `run_id`.
5. **`dependencies`**: `(from_file, to_file, type)` (composite PK), `status` (`resolved` | `unresolved`), `run_id`.
6. **`analysis_state`**: `file_id` (PK), `completeness` (`full` | `partial` | `failed`), `diagnostics_json`, `updated_at`.

### Schema Migration (`src/core/indexing/migrate.js`)

- Sequential registered migrations (`1 -> 2`) run deterministically via `migrateIndexSchema`.
- Unknown or incompatible major schema versions return `{ ok: false, code: 'E_SCHEMA_INCOMPATIBLE', rebuildRequired: true }` and never silently drop user configuration.

---

## 4. Configuration & Exclusion Precedence (`config.js`, `exclusions.js`)

`.codeflow/config.json` is normalized fail-soft by `normalizeIndexConfig`:

```json
{
  "version": 1,
  "schemaVersion": 1,
  "exclude": [],
  "include": [],
  "maxFileSizeKb": 2048,
  "batchSize": 50,
  "maxConcurrency": 4,
  "stressCeilingFiles": 25000
}
```

- **Path safety:** Any `include` or `exclude` pattern containing `..`, a leading `/`, a Windows drive prefix (`C:`), or a NUL byte is rejected with diagnostic code `unsafe_index_pattern`.
- **Precedence (`shouldIndexPath`):**
  1. `.codeflow/**` and `.git/**` are **always excluded** (`always_excluded`), even if matched by user `include`.
  2. Binary extensions, `.min.js`/`.bundle.js`, and unsupported extensions are excluded.
  3. User `exclude` patterns win over user `include` and defaults (`user_excluded`).
  4. User `include` patterns override default directory exclusions (`user_included`).
  5. Default excluded directories (`node_modules`, `dist`, `build`, `out`, `coverage`, `vendor`, `third_party`, `cmake-build-*`) and root `.gitignore` hints apply last.

---

## 5. First-Open Workflow Decision Matrix (`src/core/indexing/workflow.js`)

| Workspace State                              | `decideFirstOpenAction` Result                                                 | Disk Write?     |
| -------------------------------------------- | ------------------------------------------------------------------------------ | --------------- |
| 1. Restricted Mode (`trusted: false`)        | `silent_untrusted` (`readOnly: true`)                                          | Never           |
| 2. No supported C++/JS files                 | `silent_no_files`                                                              | Never           |
| 3. Writer lock held by another live process  | `silent_read_only` (`readOnly: true`)                                          | Never           |
| 4. Corrupt or incompatible existing index    | `prompt_rebuild` (`['Rebuild index', 'Not now']`)                              | Only on consent |
| 5. Interrupted prior run / stale lock        | `prompt_recover` (`['Resume indexing', 'Rebuild index', 'Not now']`)           | Only on consent |
| 6. Existing complete & healthy index         | `silent_ready`                                                                 | Never           |
| 7. User previously chose `"Don't ask again"` | `silent_dismissed`                                                             | Never           |
| 8. Unindexed workspace with C++/JS files     | `offer_index` (`['Index', 'Choose exclusions', 'Not now', "Don't ask again"]`) | Only on consent |

---

## 6. Query Surface & Phase 7 Integration (`src/core/indexing/queries.js`)

`createIndexQuerySurface` exposes:

- `symbolById(symbolId)`
- `symbolsByName(prefix, { kinds, limit, cursor })`
- `symbolsInFile(fileId)`
- `neighbors(symbolId, { direction, types, statuses, limit, cursor })`
- `callsByFrom(symbolId)`, `callsByTo(symbolId)`, `batchNeighbors(symbolIds)` (Phase 7 `createIndexEvidenceSource` contract)
- `fileDependencies(fileId, direction)`
- `filesUnder(modulePrefix)` (Phase 10 semantic zoom contract)
- `stats()`, `health()`, `logicalHash()`

Every query stamps `scope` (`complete`, `partial`, or `stale`) so the UI never presents partial or stale index data as complete.

---

## 7. Incremental Indexing & Hybrid Execution Tiers (Phase 9)

Governing rule: **incorrect reuse is worse than redundant work.** Whenever dependency completeness is uncertain, CodeFlow widens invalidation scope and marks dependent results `partial`.

### 7.1 Event Ingestion & Debouncing (`events.js`, `debounce.js`)

- **Per-document debounce:** `350 ms` default (`codeflow.index.debounceMs`, clamped `100..2000 ms`), reset on each keystroke.
- **Trailing max-wait flush:** `3,000 ms` under continuous typing so an actively edited file still refreshes periodically.
- **IME composition guard:** Events arriving during an active IME composition session are held until composition ends.
- **Burst / git-checkout coalescing:** If `> 25` distinct files change within a `1,000 ms` window, the debouncer coalesces pending watcher events into a single `bulk_burst` invalidation pass.

### 7.2 Change Classification & Reverse-Dependency Cascade (`signatures.js`, `classify.js`, `cascade.js`)

Symbol signatures (`computeSymbolSignature`) normalize `(kind, name, qualifiedName, visibility, parentId, parameters, returnType, exported, isTemplate)` while deliberately excluding line numbers and body hashes:

| Detected Change                                                        | Class       | Invalidation Action                                          |
| ---------------------------------------------------------------------- | ----------- | ------------------------------------------------------------ |
| Comments or whitespace only (`isSemanticNoOp`)                         | `local`     | Replace file rows only (`0` dependents re-analyzed)          |
| Function body changed, symbol signatures & imports unchanged           | `local`     | Replace file rows only (`0` dependents re-analyzed)          |
| Symbol added, removed, renamed, or signature/visibility changed        | `dependent` | Re-analyze direct dependents via reverse dependency graph    |
| Include or import set changed                                          | `dependent` | Re-analyze dependents of old and new targets                 |
| C++ header file (`.h`, `.hpp`, `.hh`, `.hxx`) declarations changed     | `dependent` | Transitive dependents across all including translation units |
| `compile_commands.json`, `.codeflow/config.json`, or toolchain changed | `global`    | Reconcile affected subtrees or full project rebuild          |

When dependent count exceeds the incremental budget (`30` files or `10,000 ms`), `planInvalidationCascade` escalates (`direct_dependents` -> `module_subtree` -> `full_project`) and records an `invalidation_escalated` diagnostic.

### 7.3 Provisional Dirty-Buffer Overlay (`provisional.js`)

- Unsaved editor buffers (`editor_dirty`) are analyzed in memory and stored in `createProvisionalOverlay` (`maxFiles: 4`), never written to `codeflow.sqlite`.
- Provisional records carry `provisional: true`, and cross-file call edges originating from a dirty buffer are capped at `status: 'possible'`.
- Saving (`editor_save`) drops the overlay entry and commits authoritative rows; reverting or closing without saving (`editor_revert`) discards the overlay entry.

### 7.4 Priority Coordinator, Supersession, Backpressure & Local Telemetry (`priorityQueue.js`, `backpressure.js`, `telemetry.js`)

- **Priority lanes:** `P0_ACTIVE` (active editor & Phase 10 zoom expansion) > `P1_VISIBLE` (visible editors) > `P2_RECENT` (recently navigated files) > `P3_BACKGROUND` (cascade & maintenance, with deterministic aging so P3 never starves).
- **Supersession:** Tasks are keyed by `(fileId, contentHash, generation)`. Any newer edit for `fileId` cancels in-flight work and prevents stale completions from committing.
- **Backpressure & lag guard:** Continuous typing `> 10 s` or queue depth `> 500` pauses `P2`/`P3` (`paused_while_typing`), halves concurrency while typing, and resumes after `2 s` idle. Event-loop lag samples `> 100 ms` trigger `lag_throttled` and increment `responsiveness_throttle`.
- **Local-only telemetry:** `createIncrementalTelemetry` tracks event, task, classification, escalation, cache, DB, and per-language p50/p95 duration counters in memory with zero source code or file paths.
