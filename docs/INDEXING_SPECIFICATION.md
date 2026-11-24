# CodeFlow Project Indexing Specification

- **Phase:** 8 — Optional Project Index (`.codeflow/`)
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
