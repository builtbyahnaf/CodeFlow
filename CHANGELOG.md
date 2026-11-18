# Changelog

**Author:** Muhammad Tahmid Ahnaf (<this.is.ahnaf101@gmail.com>)

All notable changes to CodeFlow are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

CodeFlow has not been published. Every entry below is unreleased.

## [0.1.001] - 2026-11-16

### Project Initialization & Core Architecture

Project initialized with foundational Phase 0 and Phase 1 architecture:

- **CSR (CodeFlow Semantic Representation) 1.1 Normative Specification**
  (`docs/CSR_SPECIFICATION.md`):
  - Closed vocabulary for symbol kinds, relationship types, resolution statuses, reason codes, evidence kinds, control constructs, and data facts.
  - Semantic and schema validator supporting strict and defensive modes (`validateAnalysisRun`), with JSON-path issues, duplicate-identity detection, parent/child cycle checks, and defensive per-record dropping that lowers completeness and emits diagnostics.
  - Total entity factories with safe defaults and JSON-shaped cloning.
  - Deterministic FNV-1a hashing and canonical serialization (`canonicalRun`, `serializeRun`, `hashRun`) that is byte-identical across processes and excludes timing metadata.
  - Line indexing and coordinate mapping with 0-based UTF-16 columns, BOM handling, and LF/CRLF/CR tolerance (`createLineIndex`, `rangeFromOffsets`, `sliceRange`).
  - Explicit, non-mutating version migration (`migrateRun`); the `1.0.0 → 1.1.0` step is implemented and a missing step is `E_MIGRATION_MISSING`.
  - Stable symbol identity that excludes line numbers, disambiguates overloads by arity and anonymous constructs by ordinal, and allocates deterministic relationship ids.
  - In-memory query layer with capability gating and derived inverse relationships (`query.symbol`, `query.symbols`, `query.callers`, `query.callees`, `query.constructs`, `query.capabilities`).
  - Cooperative cancellation tokens (`CancellationSource`, `AbortSignal` bridge) that degrade to a partial run instead of rejecting.
  - Hard per-run size ceilings (`E_LIMIT`); oversized data is rejected, never truncated.

- **Adapter Registry & Engine** (`docs/LANGUAGE_ADAPTERS.md`):
  - Registry with capability normalisation (`true`/`false`/`'partial'`) and longest-extension dispatch.
  - Fault isolation: thrown errors and cancellations become validated partial runs with `E_ADAPTER`/`E_CANCELLED` diagnostics.
  - Boundary checks for input, `runId` echo, `adapterId`, version compatibility, and migration.
  - Dry-run mapping (`dryRun`) that resolves files to adapters without invoking them.
  - Mock adapter upgraded to normative CSR 1.1: overloads, an anonymous lambda, non-ASCII identifiers, every resolution status, external targets, evidence, control constructs, data facts, and diagnostics.
  - Reusable conformance harness implementing C-01…C-12 (`tests/conformance/harness.js`), plus a hostile-fixture test proving failures cite specific rules.

- **Extension Host & Webview Protocol**:
  - Versioned, allowlisted messaging envelope with additive Phase 1 kinds (`csr.load`, `csr.data`, `query.*`, `query.data`, `analysis.progress`).
  - Decoupled webview wiring bridge (`createPanelWire`) with asynchronous request handling, load-failure correlation, progress pushes, and typed query routing. The host owns the validated run and its query layer.
  - Nonce-based Content Security Policy (CSP), single-panel lifecycle, and disposal cleanup.
  - Regression test proving the bridge subscribes on `panel.webview`, not on the panel itself.

- **Quality Assurance & Tooling**:
  - 173 unit and conformance tests covering protocol, CSR validation, identity, provenance, serialization, migration, queries, the registry, the conformance suite, and panel wiring.
  - Architectural constraint tests (no-TypeScript, host-independent layers, restricted-mode declarations).
  - ESLint global environment updates for Node.js timers (`setImmediate`).

## [Unreleased]

### Added

- Phase 0 engineering foundation (roadmap Part VI):
  - VS Code extension manifest, activation, logger, three commands, and a single
    reusable graph panel with a nonce-based CSP.
  - Versioned, allowlisted webview protocol with a symmetric request/response
    bridge, timeouts, in-flight limits, size limits, and prototype-pollution
    guards.
  - Draft CSR vocabulary and validator, an adapter registry with fault
    isolation, and a mock `.mock` adapter.
  - Language-independent graph model, deterministic layered layout, and a
    validated JSON view model (DTO).
  - SVG renderer with pan, zoom, selection, keyboard navigation, and status
    styling; status legend and selection details.
  - Path-containment helpers, log redaction, and diagnostics report.
  - 88 unit tests, an integration suite for the real extension host, ESLint
    layer rules, a no-TypeScript guard, and a dependency license audit.
  - CI on Ubuntu and Windows: lint, unit tests, build, license audit, VSIX
    packaging, artifact upload, plus an `xvfb` integration job.
  - Documentation: architecture, security baseline, dependency review,
    development guide, draft CSR and adapter specifications, and ADRs 0001-0006.
  - `dist/` build pipeline with esbuild producing a CommonJS host bundle and an
    IIFE webview bundle; production packaging via `vsce`.

### Known limitations

- No real C++ or JavaScript analysis. The graph is synthetic and labeled as
  mock data.
- No control-flow, data-flow, source preview, indexing, or explanations.
- Integration tests require a VS Code download and could not be executed in the
  initial development environment (network failure); CI is the first full run.
- Symlink-aware path validation, worker-isolated adapters, and fuzzing are
  deferred to later phases (Phase 1/2 and Phase 8).
