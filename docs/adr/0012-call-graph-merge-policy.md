# ADR 0012 — Call-graph multi-source merge policy and scope honesty

**Status:** Accepted  
**Date:** 2026-11-24  
**Phase:** 7  
**Author:** Muhammad Tahmid Ahnaf

## Context

Phase 7 introduces the call-graph perspective and relationship query layer. Call
relationships can arrive from multiple evidence sources with different scopes
and certainties:

1. **Adapter-local evidence** (Phases 2 and 3) — exact within one translation
   unit or bounded module graph, but incomplete across an unindexed workspace
   (`same_file_only`).
2. **Project index evidence** (Phase 8) — workspace-wide (`complete` when fresh,
   `partial` when mid-build or stale).
3. **Optional language-server evidence** — may disagree with adapter or index
   snapshots when files move or edits are in flight.

Without a strict merge policy and scope contract, two failure modes arise:

- Combining two weak (`possible`) edges could falsely present an uncertain call
  as `resolved`, or source ordering could flip statuses between runs.
- Showing a single-file caller list with a bare count (`"3 callers"`) misleads
  users into believing no other files in the workspace call that function.

## Decision

1. **Order-independent precedence truth table per `(from, to, type)` triple** in
   `src/core/graph/calls/merge.js`:
   - `resolved > inferred > possible > unresolved`.
   - `possible + possible` unions candidate sets and stays `possible`; it never
     upgrades to `resolved`.
   - Relationships never merge across distinct `type` values (`calls`,
     `instantiates`, `overrides`, `references`).
   - Inputs are sorted canonically before merging so any permutation of sources
     or relationships produces byte-identical output.
2. **Site-keyed unresolved bucket preservation:** when one call site in a
   function resolves to a target, other unresolved call sites in the same
   function remain in `unresolvedSites` and render inside the aggregate
   `unresolved_bucket` node with their reason codes.
3. **Explicit `source_disagreement` diagnostics:** when a `resolved` edge is
   present in source A but absent in source B that covers the same origin
   symbol, the edge remains `resolved` and a `source_disagreement` diagnostic is
   emitted rather than silently downgrading or hiding the mismatch.
4. **Mandatory scope banners (`same_file_only`, `partial`, `complete`):** every
   neighbor query response and call-graph DTO must carry `scope` and
   `scopeBanner`. Unindexed queries report
   `"N callers in this file · Project-wide callers require indexing"`.

## Consequences

- Phase 8 plugs into `createIndexEvidenceSource` (`callsByFrom`, `callsByTo`,
  `symbolById`, `batchNeighbors`) without changing the merge engine, DTO
  validator, or webview UI.
- All merge rules are verified by deterministic truth-table, permutation, and
  idempotence unit tests (`tests/unit/callGraphMerge.test.js`).
