# Contributing to CodeFlow

Thank you for your interest in contributing to CodeFlow! CodeFlow is an open-source (GPL-3.0-only) VS Code extension for static code comprehension and graph visualization.

---

## 1. Development Prerequisites

- **Node.js:** v20.x or v22.x LTS (ESM native)
- **npm:** v10.x or higher
- **VS Code:** v1.93.0 or higher
- **Clang / Clang++ (Optional):** Version 14+ recommended for C++ AST parsing tests.

---

## 2. Core Architectural Principles

When writing code for CodeFlow, all contributors must strictly adhere to the following architecture rules (enforced by automated tests):

1. **JavaScript-Only ESM (Strict):** No TypeScript source files (`.ts`, `.tsx`) or `tsconfig.json` are permitted. All codebase files use modern JavaScript modules (`.js`, `.cjs`).
2. **Layer Isolation:**
   - `src/core/` must **never** import `vscode`, `fs`, `child_process`, or platform-specific storage APIs. It is purely computational and host-independent.
   - `src/visualization/` must only import core modules and presentation tokens; it must never import the extension host or adapters.
   - `src/adapters/` produce Canonical Semantic Representation (CSR) runs and must not import the visualization layer.
3. **Honest Uncertainty:** Never invent facts or guess unproven relationships. If a static relationship is ambiguous, record it as `possible` or `unresolved` with an explicit reason code.
4. **Zero Dynamic Code Execution:** Never use `eval()`, `new Function()`, or dynamic `require()`.

---

## 3. Development Workflow & Commands

```bash
# Install dependencies
npm install

# Run all unit and conformance tests
npm test

# Run code style linter
npm run lint

# Verify no TypeScript files exist in the repository
npm run check:no-typescript

# Verify third-party licenses
npm run check:licenses

# Build extension and webview bundles
npm run build

# Run the full CI verification suite
npm run verify
```

---

## 4. Git Commit Discipline

- CodeFlow uses **Conventional Commits** (`feat(...)`, `fix(...)`, `test(...)`, `docs(...)`, `chore(...)`).
- Keep commits atomic: one feature, test, or documentation change per commit.
- **Privacy Rule:** Do not include personal email addresses in git configurations or commit messages.
