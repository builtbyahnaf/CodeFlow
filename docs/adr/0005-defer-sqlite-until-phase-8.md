# 0005 — Defer all persistence, including SQLite, until Phase 8

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

Phase 8 introduces an optional project index with caching. The obvious storage
choices are SQLite (via a native module or Node's built-in `node:sqlite`) or a
file-based cache.

Two facts constrain the decision now:

1. The extension host runs VS Code's Node, not the developer's Node. At
   `engines.vscode: ^1.95.0` that is Node 20.x, where `node:sqlite` does not
   exist (it arrived experimentally in Node 22.5). The local Node 24 is
   irrelevant to what ships.
2. Phase 0 has nothing to persist. The mock adapter is deterministic and
   instantaneous; the graph is rebuilt on demand.

Adding a database now would mean choosing a schema before the CSR is normative,
adding a native dependency before packaging constraints are understood, and
maintaining migrations for data that will be discarded in Phase 1.

## Decision

Ship no persistence in Phase 0. No database, no index, no cache, no
`.codeflow/` directory, no schema, no migrations. The only on-disk artifacts are
the build output (`dist/`) and the packaged VSIX.

Phase 8 evaluates, in order:

1. **File-based cache** (JSON or a compact binary format) keyed by content hash —
   no native code, trivially inspectable, acceptable for small/medium projects.
2. **Bundled SQLite with prebuilt binaries** (for example `better-sqlite3`) — a
   native dependency with Electron ABI and per-platform packaging requirements.
3. **`node:sqlite`** — only if the VS Code floor has risen to a Node version that
   includes it. This is the lowest-risk option if and when it becomes available.

The choice must be recorded in a new ADR with measured index sizes, query
patterns, and startup costs from a prototype.

## Consequences

Positive:

- No native module to rebuild against Electron, no per-platform binaries, no
  install failures.
- No schema to migrate before the CSR stabilizes in Phase 1.
- The VSIX stays 9 files and 37 KB; there is nothing to corrupt or lock.
- Restricted Mode and startup remain trivially safe.

Negative:

- Re-analysis repeats work; Phase 0 is cheap enough that this is invisible.
- Phase 8 inherits an unexplored design space, including performance targets that
  are not yet measured.
- If SQLite turns out to be necessary, packaging work will arrive late.

## Alternatives rejected

1. **SQLite now, via `node:sqlite`.** Rejected: not present in the Node version
   the extension host actually runs at the supported VS Code floor.
2. **SQLite now, via `better-sqlite3`.** Rejected for Phase 0: native dependency,
   Electron ABI rebuilds, and prebuilt binaries per platform, for zero Phase 0
   benefit.
3. **`vscode.workspace.fs` + JSON cache now.** Rejected: still a schema and a
   cache-invalidation design, both premature before the CSR is normative.
4. **`globalStorage` blobs.** Rejected for the same reason; also harder to
   inspect and migrate than a project-local cache.
