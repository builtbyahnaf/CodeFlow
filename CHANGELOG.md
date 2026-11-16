# Changelog

**Author:** Muhammad Tahmid Ahnaf (<this.is.ahnaf101@gmail.com>)

All notable changes to CodeFlow are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

CodeFlow has not been published. Every entry below is unreleased.

## [0.1.001] - 2026-11-16

### Project Initialization & Core Architecture

Project initialized with foundational Phase 0 and Phase 1 architecture:

- **CSR (CodeFlow Semantic Representation) 1.1 Normative Specification**:
  - Closed normative vocabulary for symbol kinds, relationship types, resolution statuses, reason codes, evidence kinds, and language-neutral control constructs.
  - Semantic and schema validator supporting strict and defensive modes (`validateAnalysisRun`).
  - Total entity factories with safe defaults and JSON-shaped object cloning.
  - FNV-1a non-cryptographic content hashing and stable canonical serialization (`canonicalRun`, `hashRun`).
  - Line indexing and coordinate mapping with UTF-16 code unit resolution and multi-line CRLF tolerance.
  - Multi-version migration pipeline with non-mutating transforms (`migrateRun`).
  - Stable symbol identity generation, hierarchical scope disambiguation, and relationship ID allocators.
  - In-memory query engine supporting typed lookups (`query.symbol`, `query.callers`, `query.callees`, `query.constructs`, `query.capabilities`) and derived inverse relationships.
  - Cooperative cancellation source and token propagation.
  - Payloads and collection budget thresholds enforcing configurable memory and size limits (`E_LIMIT`).

- **Adapter Registry & Engine**:
  - Unified adapter registry with capability normalization and file extension dispatch precedence.
  - Boundary isolation transforming adapter runtime exceptions into degraded partial runs with diagnostic reports.
  - Dry-run capability (`dryRun`) mapping target files without invocation overhead.
  - Mock adapter fixture upgraded to emit normative CSR 1.1 data.
  - Conformance test harness (`runAdapterConformanceSuite`) for adapter implementations.

- **Extension Host & Webview Protocol**:
  - Type-safe, bidirectional messaging envelope (`WEBVIEW_TO_HOST` and `HOST_TO_WEBVIEW`).
  - Decoupled webview wiring bridge (`createPanelWire`) handling asynchronous requests, load failures, progress notifications, and typed query routing.
  - Nonce-based Content Security Policy (CSP), sub-panel lifecycle management, and disposal cleanup.

- **Quality Assurance & Tooling**:
  - Over 160 unit tests covering protocol, CSR validation, serialization, queries, migrations, identity, and panel wire messaging.
  - Architectural constraints enforcement tests (no-TypeScript, host-independent layers, restricted mode declarations).
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
