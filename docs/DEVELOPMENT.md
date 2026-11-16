# Development guide

## Prerequisites

- Node.js 20 or newer (developed on Node 24; CI uses 22).
- npm 10 or newer.
- VS Code 1.95 or newer for running the extension (the manifest enforces this).
- Git.
- Network access on first run of the integration tests (VS Code download).

The extension host runs VS Code's own Node, which is 20.x at the 1.95 floor. Do
not assume the Node version on your PATH matches the host. The host bundle is
built with `target: ['node20']`.

## Setup

```bash
npm ci
npm run build
```

`npm ci` installs exactly the lockfile. If you changed `package.json`
intentionally, use `npm install` and commit the updated lockfile.

## Everyday commands

| Command                       | What it does                                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `npm run build`               | Bundle host + webview, copy assets, write build report                                        |
| `npm run watch`               | Rebuild on change                                                                             |
| `npm run lint`                | ESLint, including layer-boundary rules                                                        |
| `npm test`                    | Unit tests (Node test runner)                                                                 |
| `npm run test:unit`           | Same as `npm test`                                                                            |
| `npm run test:integration`    | Real VS Code host; build first; needs network on first run                                    |
| `npm run check:no-typescript` | Fails if `.ts` files or `tsconfig.json` appear                                                |
| `npm run check:licenses`      | License allowlist audit over `package-lock.json`                                              |
| `npm run check:vsix`          | Install the built VSIX into a clean extensions directory (needs `CODEFLOW_VSCODE_EXECUTABLE`) |
| `npm run package`             | Build production bundle and write `codeflow.vsix`                                             |
| `npm run verify`              | lint, no-TypeScript, unit tests, build, licenses                                              |
| `npm run format`              | Prettier over JS/CJS/JSON/MD/YAML/CSS/HTML                                                    |
| `npm run format:check`        | Prettier in check mode                                                                        |
| `npm run clean`               | Remove `dist/`, `codeflow.vsix`, `.vscode-test/`                                              |

## Debugging the extension

1. `npm run build`
2. Open the repository in VS Code.
3. Use the "Run Extension" launch configuration (F5). It runs the build first
   and launches an Extension Development Host.
4. Run `CodeFlow: Open Explorer` from the Command Palette.

Useful checks inside the dev host:

- `CodeFlow: Show Diagnostics` — versions, trust state, adapter capabilities,
  settings, and known Phase 0 limits.
- `CodeFlow: Show Log` — the CodeFlow output channel. Set
  `codeflow.logLevel` to `debug` for timings and protocol kinds (never payloads).
- Command Palette → "Developer: Open Webview Developer Tools" to inspect the
  webview. The CSP forbids remote and inline script, so console errors usually
  mean a bundling or nonce problem.

## Tests

### Unit tests

```
npm test
```

Plain Node, no VS Code. They cover:

- protocol envelope validation (allowlists, versions, ids, size, unsafe keys);
- bridge request/response, timeouts, cancellation, handler failure, in-flight cap;
- log redaction and formatting;
- path containment for POSIX and Windows;
- CSR factories and run validation;
- adapter registration, resolution, and fault isolation;
- graph construction, layout determinism, DTO validation and round-trip;
- panel HTML, CSP, nonce, and escaping;
- architecture rules (imports, layering, manifest consistency, no TypeScript).

Tests must not read the network or mutate the repository.

### Integration tests

```
npm run build
npm run test:integration
```

The launcher (`tests/integration/runTest.js`) stages the built extension into a
space-free directory under the OS temp folder, downloads VS Code into
`.vscode-test/` (unless an installed copy is provided), opens a fixture
workspace, and runs `tests/integration/suite/index.cjs` inside the real extension
host. The suite checks activation, adapter capabilities, all three commands,
panel reuse, diagnostics content, and disposal.

Notes:

- First run downloads ~380 MB. Later runs reuse the cache.
- Set `CODEFLOW_VSCODE_EXECUTABLE` to a local `Code.exe` to skip the download.
  The build must satisfy `engines.vscode` (1.95 or newer).
- The extension is staged rather than loaded from the repository because VS Code
  injects the test module path without quoting; a repository path containing
  spaces otherwise fails with a truncated module name.
- `CODEFLOW_KEEP_STAGE=1` keeps the staged directory for inspection.
- Linux needs a display; CI uses `xvfb-run -a`. Windows runs directly.
- The launcher passes `--disable-workspace-trust` so the run is not blocked by a
  trust prompt. Restricted Mode is covered by the static activation-path test and
  the `untrustedWorkspaces` declaration.

## Packaging

```
npm run package
```

`vscode:prepublish` runs a production build (minified, no inline source maps),
then `vsce` writes `codeflow.vsix`. The `.vscodeignore` excludes source, tests,
scripts, docs, CI, and configuration; only `dist/`, `package.json`, `README.md`,
and the license are packaged. There are no runtime dependencies, so
`--no-dependencies` is safe.

Before publishing a real release, bump `version` in both `package.json` and
`EXTENSION_VERSION` in `src/extension/extension.js`; a unit test fails if they
disagree.

To prove the artifact installs, point at a VS Code executable and run the
installation check. It installs into a temporary extensions directory and asserts
the manifest version and bundle files are present:

```bash
CODEFLOW_VSCODE_EXECUTABLE=/path/to/Code.exe npm run check:vsix   # Windows: Code.exe path
```

On Windows, `$env:CODEFLOW_VSCODE_EXECUTABLE = 'C:\...\Code.exe'` sets the same
variable for the session.

## CI

`.github/workflows/ci.yml` has two jobs:

1. **Verify** on `ubuntu-latest` and `windows-latest`: install, lint, reject
   TypeScript, unit tests, build, license audit, package, upload the VSIX.
2. **Integration** on Linux with `xvfb-run`: build and run the integration suite;
   upload `.vscode-test` logs on failure.

CI is the authoritative environment for integration tests. If it passes locally
but fails in CI, check the Node version, the display server, and whether a
trust prompt could block activation.

## Conventions

- **JavaScript only.** Use JSDoc for types; do not add `.ts` files,
  `tsconfig.json`, or a type-generation step. `npm run check:no-typescript`
  enforces this.
- **ESM source, explicit extensions.** Import with `.js` suffixes. Named exports
  only; no default exports.
- **Layer boundaries.** `src/core`, `src/adapters`, `src/visualization`, and
  `src/webview` must not import `vscode`, `fs`, or `child_process`. The host is
  the only place that touches VS Code.
- **Validation over trust.** Validate configuration, messages, adapter output,
  and paths. Return typed failures at boundaries; throw only for programmer
  error, and catch even those in commands and the bridge.
- **No source in logs or DTOs.** Log kinds, counts, and durations. The graph DTO
  carries ids and ranges, never text.
- **Determinism.** Sort by stable ids. Tests assert byte-identical output where
  possible.
- **Honest capabilities.** An adapter declares only what it can demonstrate.
  Unresolved results are shown, not hidden.
- **Formatting.** Prettier owns whitespace: 2 spaces, single quotes, 100 columns,
  trailing commas, semicolons.

## Adding a feature

1. Decide which layer owns it. Analysis goes in an adapter; language-neutral
   logic in `src/core`; VS Code API usage in `src/extension`; drawing in
   `src/webview`/`src/visualization`.
2. If it crosses the host/webview boundary, add protocol kinds and tests first.
3. If it changes the graph shape, update the DTO, its validator, the renderer,
   and the DTO round-trip test together.
4. Add unit tests. Add an integration assertion if the feature depends on the
   VS Code API.
5. Update the docs that would otherwise become false, especially
   `docs/ARCHITECTURE.md` and any draft spec you touched.

## Troubleshooting

**`dist/extension.cjs` not found.** Run `npm run build`. Packaging and
integration tests both require it.

**esbuild binary errors on install.** The platform package
(`@esbuild/<platform>`) may have been skipped by an install-script policy. Run
`npm rebuild esbuild` or `npm install` again; verify with
`npx esbuild --version`.

**Integration tests fail before running.** Usually the VS Code download
(`ECONNRESET`, DNS failure, proxy). Retry, or pre-download by running the same
command once with network access. The downloaded build stays in `.vscode-test/`.

**Webview is blank.** Check the webview dev tools console. A CSP violation means
the nonce and the script tag disagree; a 404 means `dist/webview/main.js` was not
built or `localResourceRoots` is wrong.

**Graph loads but no response arrives.** Check `codeflow.logLevel` = `debug` and
the output channel for `protocol.rejected` or `E_TIMEOUT`. Malformed messages are
rejected before handlers run by design.

**Command does nothing.** Commands catch their own errors and show a message with
a "Show log" action. `CodeFlow: Show Diagnostics` reports panel and adapter
state.
