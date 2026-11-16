# Repository audit (Phase 0)

Date: 2026-11-16
Commit audited: `69e05c6 Add GNU GPL v3 License`

This is the Phase 0 (P0-01) repository audit. It records what existed before
implementation began, what was missing, and which constraints were treated as
binding. It is a snapshot, not a living document.

## What existed

| Path         | Status                                           |
| ------------ | ------------------------------------------------ |
| `README.md`  | Product vision and non-goals. No build or usage. |
| `LICENSE`    | GNU GPL v3 text.                                 |
| `.gitignore` | Only `context/*`.                                |
| `context/*`  | Local planning notes, intentionally untracked.   |

Git history contained five commits, the latest adding the license. There was no
`package.json`, no source tree, no tests, no CI configuration, and no build
output. `git remote` points at `https://github.com/builtbyahnaf/CodeFlow`.

## What was missing

- Extension manifest, entry point, and activation code.
- Any bundling or build step.
- Tests at any level, and any test runner configuration.
- CI (lint, test, build, package, artifacts).
- Documentation beyond the product README.
- License auditing for dependencies.
- A language-independent analysis model, adapter boundary, or graph/view model.

## Binding constraints taken from the roadmap

1. Implementation language is JavaScript. No TypeScript sources, configuration,
   or type-generation step. Types are JSDoc comments checked by review and tests.
2. V1 languages are C++ and JavaScript. Phase 0 ships neither parser.
3. No AI in the core. No network calls from the webview.
4. No Nirqoba component.
5. The graph layer must not know about parsing; the CSR is the only interface
   between language analysis and visualization.
6. Analysis results must carry provenance, resolution status, and honest gaps.
7. Workspace contents are untrusted input.

## License position

The repository is GPL-3.0-only (`LICENSE`, `package.json`). Every shipped
dependency must be GPL-compatible; development-only dependencies are reviewed
but are not distributed. The VSIX contains no `node_modules`, only bundles.

## State after Phase 0

- 20 source files: 9 under `src/core`, 1 adapter, 7 in the extension host,
  1 renderer, 2 webview assets.
- 9 unit test files, 88 tests.
- 4 build/maintenance scripts.
- 1 integration suite (launcher, suite, fixture workspace).
- 7 documents, 6 ADRs, 1 changelog entry.
- One packaged artifact (`codeflow.vsix`, 10 files, 38.8 KB) produced locally.

## Known gaps and risks

- Real C++/JavaScript analysis does not exist. The demo graph is synthetic and
  says so in its diagnostics.
- Integration tests require downloading VS Code. The local environment could not
  complete the download (connection reset, then DNS failure), so CI is the first
  place they will run.
- Restricted Mode is covered by a static guarantee (no file/process APIs in the
  activation path) and an `untrustedWorkspaces: limited` declaration, not by a
  live untrusted-workspace run.
- The path helper validates lexical containment only. Symlink resolution
  (`fs.realpath`) is deferred to the first phase that actually reads files.
- Node version in the extension host is whatever VS Code ships (Node 20.x at the
  `^1.95.0` floor), not the Node 24 used for development. See ADR 0005.
