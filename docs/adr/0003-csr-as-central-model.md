# 0003 — CSR is the central model between analysis and visualization

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

CodeFlow's V1 languages are C++ and JavaScript. Their parsers produce wildly
different data: Clang's AST and compile database versus a JavaScript parser's
module graph. The graph, layout, renderer, protocol, and diagnostics must work
for both without knowing either language.

The tempting alternative is to let each adapter hand the renderer a graph
directly. That is fast to build for one language and becomes unmaintainable for
two: every consumer learns every parser's quirks, and the webview becomes the
integration point.

## Decision

Define a CodeFlow Semantic Representation (CSR) as the only output of a language
adapter and the only input to the graph layer. Everything above the adapter
boundary (graph model, layout, DTO, protocol, renderer) is language-independent.

Enforcement:

- `src/core/graph` imports nothing from `src/adapters`, `src/extension`,
  `src/webview`, or `src/visualization`; `src/core/csr` imports neither the graph
  nor adapters.
- `tests/unit/architecture.test.js` walks the import graph and fails on
  violations.
- Graph tests build from CSR records with no parser present.
- Adapter output is validated at the boundary; invalid CSR never reaches the
  graph.

The Phase 0 CSR is explicitly a draft (`0.1.0-draft`, documented in
`docs/CSR_SPECIFICATION.md`). Phase 1 replaces it with the normative model. The
boundary is the durable decision; the entity list is not.

## Consequences

Positive:

- Adding C++ or JavaScript does not change graph, layout, DTO, or renderer code.
- The graph can be tested without parsers, files, or compilers.
- Resolution uncertainty is represented uniformly: status + reason code.
- The webview receives a small JSON DTO, not a parser's object graph.

Negative:

- The CSR must anticipate needs (CFG/DFG, types, scopes) before real adapters
  exist; Phase 1 will rework it, and Phase 2/3 will find gaps.
- Some adapter detail is lost at the boundary; adapters need an `extensions` bag
  for language-specific data.
- An extra mapping step (CSR to graph to DTO) costs time and code.

## Alternatives rejected

1. **Adapters emit graph DTOs directly.** Rejected: couples every adapter to
   layout and rendering and duplicates graph logic per language.
2. **Adapters emit the renderer's internal model.** Rejected: the renderer is
   expected to change in Phase 4; adapters must not depend on it.
3. **One universal AST.** Rejected: an AST is syntax, not semantics, and every
   language loses information in a shared AST. The CSR models facts and
   provenance, not text.
