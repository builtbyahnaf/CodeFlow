# 0001 — Implement in JavaScript, not TypeScript

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

The roadmap requires the V1 implementation to be JavaScript. TypeScript is the
default choice for VS Code extensions: it provides editor intelligence, catches
interface drift at build time, and has first-class VS Code API typings.

The project is a greenfield extension with a large, growing internal model (CSR,
protocol, graph DTO) where type mistakes are plausible.

## Decision

Write all source in JavaScript (ESM), with JSDoc annotations for public
interfaces and non-obvious internal shapes. Do not add TypeScript sources,
`tsconfig.json`, or a type-generation step.

Enforcement:

- `scripts/checkNoTypeScript.js` fails on `.ts`/`.tsx`/`.mts`/`.cts` files and on
  a `tsconfig.json`. It runs in `npm run verify` and CI.
- ESLint + `@eslint/js` handle correctness rules (unused variables, equality,
  no-eval, restricted imports).
- Unit tests exercise the boundaries that types would otherwise protect:
  protocol validation, CSR validation, DTO validation, adapter fault isolation.

## Consequences

Positive:

- The implementation matches the binding roadmap constraint.
- No build-time type checker, no declaration files, no `dist` type artifacts.
- Contributors only need Node and npm; editor intelligence comes from JSDoc.
- Runtime validation is mandatory, which is stronger than compile-time types for
  untrusted input (webview messages, adapter output, workspace paths).

Negative:

- Interface drift is caught by tests and review, not by the compiler.
- JSDoc is verbose and can silently rot; nothing verifies it.
- Large refactors are riskier: renaming a field does not produce compile errors.
- Some VS Code APIs are easy to misuse without typings.

Mitigations and triggers to revisit:

- Every JSON boundary has a validator with tests.
- `tests/unit/architecture.test.js` checks module boundaries and manifest/code
  consistency.
- If JSDoc rot causes repeated defects, propose a Phase 1+ ADR. Reversing this
  decision requires changing the roadmap, not just adding a dev dependency.

## Alternatives rejected

1. **TypeScript source compiled to JavaScript.** Rejected: violates the roadmap,
   adds a type-generation step, and adds `typescript` to the toolchain.
2. **JavaScript with `// @ts-check` and `tsc --noEmit`.** Rejected: still requires
   TypeScript as a dependency and a type-check step, which the roadmap forbids.
3. **No types at all.** Rejected: the protocol and CSR shapes are too important to
   leave undocumented; JSDoc keeps them reviewable.
