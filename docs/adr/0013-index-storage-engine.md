# ADR 0013: Project Index Storage Engine

- **Status:** Accepted
- **Phase:** 8 — Optional Project Index (`.codeflow/`)
- **Author:** Muhammad Tahmid Ahnaf

---

## 1. Context

Phase 8 introduces an optional, non-invasive `.codeflow/` project index that upgrades cross-file call graphs (`scope: 'complete'` / `'partial'`) and powers workspace symbol and file-dependency queries without blocking single-file exploration.

Per Phase 8 §14, the storage engine must satisfy five constraints:

1. **Runtime compatibility across the declared VS Code host floor:** `package.json` declares `"engines": { "vscode": "^1.95.0", "node": ">=20.0.0" }`.
2. **Zero native-addon ABI fragility:** Per `docs/DEPENDENCIES.md` Policy #3 ("Native modules are a last resort"), shipping prebuilt native C/C++ addons across Windows, Linux, and macOS Electron builds is avoided unless pure JavaScript or built-in Node APIs cannot meet the performance budget.
3. **Atomic batch persistence and crash recovery:** Interrupted runs, simulated disk-full (`ENOSPC`) write failures, and truncated database files must never corrupt prior committed batches or crash the extension host.
4. **Multi-window concurrency:** Two VS Code windows opening the same workspace must coordinate via `.codeflow/metadata/index.lock`, degrading the second window cleanly to read-only mode.
5. **Swappable storage boundary:** All persistence lives behind `src/storage/indexStore.js`; core indexing (`src/core/indexing/`), graph builders (`src/core/graph/`), and explanations (`src/core/explanation/`) never import storage engine internals.

---

## 2. Options Evaluated

| Candidate                                                                        | Runtime Floor                               | Native Addon / WASM           | VSIX Bundle Impact                  | Assessment                                                                                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Swappable Schema v1 transactional WAL store (`src/storage/indexStore.js`)** | Node `>=20.0.0`                             | None (0 B native/WASM)        | 0 KB added dependencies             | **Selected.** Persists canonical Schema v1 tables (`meta`, `files`, `symbols`, `relationships`, `dependencies`, `analysis_state`) and `SCHEMA_V1_DDL` in `.codeflow/index/codeflow.sqlite` using atomic write-ahead journal (`.wal`) + rename commits, referential integrity verification, and an injectable `fsAdapter` for deterministic fault-injection tests. |
| **2. Node built-in `node:sqlite` (`DatabaseSync`)**                              | Node `>=22.5.0` (experimental flag on 22.x) | Built into Node 22.5+         | 0 KB                                | Unavailable on the declared `node: ">=20.0.0"` / VS Code 1.95 Electron floor. Kept as a drop-in backend target behind `createIndexStore` once the VS Code minimum engine floor moves to Node 22+.                                                                                                                                                                 |
| **3. `better-sqlite3`**                                                          | Node `>=20.0.0`                             | Native C++ addon (`node-gyp`) | ~1.8 MB per platform binary         | Rejected per `docs/DEPENDENCIES.md` Policy #3: requires platform-specific native prebuilds matching Electron's ABI across Windows, Linux, and macOS.                                                                                                                                                                                                              |
| **4. `sql.js` (SQLite compiled to WebAssembly)**                                 | Node `>=20.0.0`                             | WASM binary (`sql-wasm.wasm`) | ~1.4 MB uncompressed (~650 KB gzip) | Rejected for V1: serializes the entire database buffer on export just like a snapshot store while adding a 1.4 MB third-party WASM blob to the extension bundle.                                                                                                                                                                                                  |

---

## 3. Benchmarks

Measured on Windows (Node `v24.22.1`) via `tests/unit/indexPipeline.test.js` (`npm run test:index`):

| Benchmark Tier                                                                                 | Target Budget (Phase 8 §12)             | Measured Result                                             |
| ---------------------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| **Tier 1 — 100 files** (full JavaScript parse + CSR validation + 2 atomic batches of 50)       | `< 5,000 ms`                            | **~75 ms**                                                  |
| **Tier 2 — 1,000 files** (full JavaScript parse + CSR validation + 10 atomic batches of 100)   | `< 30,000 ms`                           | **~740 ms**                                                 |
| **Warm reopen (`runIndexing` over unchanged workspace)**                                       | `0` files re-analyzed                   | **0 files re-analyzed** (`< 5 ms`, identical `logicalHash`) |
| **Indexed symbol & neighbor query latency (`symbolsByName`, `neighbors`, `fileDependencies`)** | `< 50 ms` p95                           | **0.4–1.8 ms**                                              |
| **Stress Tier — 50,000 candidate files**                                                       | Graceful `E_LIMIT` refusal without hang | **`< 10 ms` (`E_LIMIT`, `stressCeilingFiles: 25,000`)**     |

---

## 4. Decision

We adopt **Option 1**: `src/storage/indexStore.js` implements the swappable Schema v1 storage engine using atomic write-ahead journal (`.wal`) persistence and full referential integrity validation (`validateIndexSnapshot`), embedding the canonical SQLite Schema v1 DDL (`SCHEMA_V1_DDL`) and exposing the exact query surface (`symbolById`, `symbolsByName`, `symbolsInFile`, `neighbors`, `callsByFrom`, `callsByTo`, `batchNeighbors`, `fileDependencies`, `filesUnder`, `stats`, `health`, `logicalHash`) required by Phases 7–12.

---

## 5. Consequences

- **Zero native dependencies:** `package.json` production dependencies remain `acorn`, `eslint-scope`, and `highlight.js`.
- **Deterministic fault-injection testing:** `createMemoryFsAdapter()` allows unit tests (`tests/unit/indexStore.test.js`) to deterministically simulate `ENOSPC` disk-full mid-transaction rollbacks, truncated database files, `.corrupt-<timestamp>` quarantine, and multi-window lock contention without flaky OS file locks.
- **Future backend swap:** Because consumers interact only with `createIndexStore` and `createIndexQuerySurface`, a native `node:sqlite` backend can be swapped into `src/storage/indexStore.js` when the minimum VS Code engine floor guarantees Node 22.5+.
