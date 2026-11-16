# 0002 — Bundle with esbuild into two artifacts

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

CodeFlow has two runtime targets:

1. The extension host: CommonJS, VS Code's Node (20.x at the 1.95 floor), with
   `vscode` provided by the host and never bundled.
2. The webview: a Chromium page with no Node built-ins, loaded through
   `asWebviewUri`, subject to a strict CSP.

The source is ESM (ADR 0001 keeps JavaScript, and ESM is the module system the
project uses). VS Code's loader has historically been unreliable with ESM
extension entry points, especially across the Node versions shipped in different
VS Code releases. A single ESM `main` would trade a simpler build for a fragile
runtime.

## Decision

Use esbuild as a development-only dependency to produce two bundles:

- `dist/extension.cjs` — platform `node`, format `cjs`, target `node20`,
  `external: ['vscode']`, inlined dev source map.
- `dist/webview/main.js` — platform `browser`, format `iife`,
  target `chrome110`.

Assets (`styles.css`) are copied to `dist/webview/` so
`localResourceRoots` can stay narrowed to that directory. A production mode
(`--production`) minifies and disables source maps; `vscode:prepublish` runs it
before packaging.

Why esbuild:

- one dependency, no plugin ecosystem required;
- fast enough for watch mode;
- handles ESM to CJS and ESM to IIFE with the same config;
- emits a metafile, so bundle size regressions are visible;
- has no runtime footprint in the VSIX.

## Consequences

Positive:

- The host entry point is CommonJS, which every supported VS Code version loads.
- The webview bundle cannot accidentally reference Node built-ins; esbuild errors
  instead of producing a broken page.
- Build output is small: 30.6 KB host, 14.5 KB webview, 6 KB CSS in production.
- No runtime dependencies are shipped; `vsce package --no-dependencies` is safe.

Negative:

- The build has no type checking (see ADR 0001); tests carry that weight.
- Two targets mean two failure modes; the CI build step covers both.
- Source maps are inlined in development bundles, which inflates them until a
  production build runs.
- esbuild is a native binary; install-script policies can block it.

## Alternatives rejected

1. **No bundler; ship ESM + `node_modules`.** Rejected: unreliable entry point,
   larger VSIX, and more files to audit.
2. **webpack.** Rejected: heavier configuration and more transitive dependencies
   for no capability this project needs.
3. **Rollup.** Rejected: good output, but esbuild already covers both targets with
   fewer moving parts and faster watch builds.
4. **`tsc` as the bundler.** Rejected with TypeScript itself (ADR 0001).
