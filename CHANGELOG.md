# Changelog

All notable changes to CodeFlow are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and versions follow
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

CodeFlow has not been published. Every entry below is unreleased.

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
