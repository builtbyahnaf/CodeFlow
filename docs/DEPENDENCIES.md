# Dependencies

CodeFlow is licensed under GPL-3.0-only. This document records every direct
dependency, its license, and why it is acceptable. It is enforced by
`npm run check:licenses` in CI.

## Policy

1. **No runtime dependencies.** The extension ships bundles, not `node_modules`.
   Anything imported at runtime is either project source or inlined by esbuild.
2. **Development dependencies must be GPL-compatible.** Copyleft and permissive
   licenses are fine; proprietary or non-commercial-only licenses are not.
3. **Native modules are a last resort.** They complicate packaging, CI, and the
   extension host. Phase 0 has none in the shipped artifact.
4. **Every direct dependency needs a reason.** "Convenient" is not one.
5. **Licenses are checked mechanically**, not by memory. The allowlist lives in
   `scripts/checkLicenses.js`; the audit reads `package-lock.json` only.

## Direct dependencies (all development-only)

Measured on 2026-11-16. Sizes are the unpacked directory size in `node_modules`.

| Package                 | Version | License | Purpose                          | Size                           | Verdict           |
| ----------------------- | ------- | ------- | -------------------------------- | ------------------------------ | ----------------- |
| `esbuild`               | 0.25.12 | MIT     | Bundles host and webview sources | 10.1 MB (with platform binary) | Accept            |
| `eslint`                | 9.39.5  | MIT     | Static checks, layer boundaries  | 3.9 MB                         | Accept (see note) |
| `@eslint/js`            | 9.39.5  | MIT     | ESLint recommended config        | <0.1 MB                        | Accept            |
| `prettier`              | 3.10.1  | MIT     | Deterministic formatting         | 10.9 MB                        | Accept            |
| `@vscode/test-electron` | 2.5.2   | MIT     | Integration test harness         | 0.1 MB                         | Accept            |
| `@vscode/vsce`          | 3.9.2   | MIT     | VSIX packaging and validation    | 0.2 MB                         | Accept            |

Notes:

- `esbuild` is a native binary distributed through platform packages
  (`@esbuild/win32-x64` here). It is used only at build time; nothing native is
  packaged into the VSIX.
- `eslint@9.39.5` prints a deprecation notice on install ("this version is no
  longer supported") because a newer major line exists. It is a development-only
  tool with no runtime risk. Upgrade is tracked as routine maintenance, not a
  Phase 0 blocker.
- `@vscode/vsce` pulls platform-specific signing binaries
  (`@vscode/vsce-sign-*`) as optional dependencies. They are development-only
  and not shipped.

## Transitive footprint

| Metric                                  | Value    |
| --------------------------------------- | -------- |
| Lockfile package entries                | 437      |
| Production (shipped) entries            | 0        |
| Development entries                     | 437      |
| `node_modules` size                     | 111.2 MB |
| Top-level directories in `node_modules` | 313      |
| Shipped `node_modules` in the VSIX      | none     |

License histogram across the lockfile (all development-only):

| License                               | Count |
| ------------------------------------- | ----- |
| MIT                                   | 335   |
| ISC                                   | 26    |
| BSD-2-Clause                          | 19    |
| Apache-2.0                            | 17    |
| `SEE LICENSE IN LICENSE.txt`          | 10    |
| BSD-3-Clause                          | 7     |
| BlueOak-1.0.0                         | 7     |
| Artistic-2.0                          | 5     |
| `(MIT OR WTFPL)`                      | 1     |
| `(MIT OR GPL-3.0-or-later)`           | 1     |
| `(MIT AND Zlib)`                      | 1     |
| `(BSD-2-Clause OR MIT OR Apache-2.0)` | 1     |
| `(MIT OR CC0-1.0)`                    | 1     |
| 0BSD                                  | 1     |
| CC0-1.0                               | 1     |
| CC-BY-3.0                             | 1     |
| PSF-2.0                               | 1     |
| Python-2.0                            | 1     |
| WTFPL                                 | 1     |

Packages that need a human look but are not shipped:

- `@vscode/vsce-sign*` — `SEE LICENSE IN LICENSE.txt` (Microsoft signing
  binaries, development-only).
- `binaryextensions`, `editions`, `istextorbinary`, `version-range` —
  Artistic-2.0 (permissive, GPL-compatible; development-only).
- `argparse` — PSF-2.0 (permissive; development-only).
- `spdx-exceptions` — CC-BY-3.0 (data, not code; development-only).

The audit script reports these explicitly instead of silently ignoring them.

## Shipped artifact

`npm run package` produces `codeflow.vsix` (10 files, 38.8 KB) containing:

```
LICENSE.txt              34.33 KB
changelog.md              2.08 KB
package.json              3.32 KB
readme.md                11.67 KB
dist/extension.cjs       30.56 KB  (minified, production)
dist/webview/main.js     14.51 KB  (minified, production)
dist/webview/styles.css   6.00 KB
dist/build-report.json     0.1 KB
```

No `node_modules`, no source maps, no tests.

## Auditing

```
npm run check:licenses
```

- Reads `package-lock.json`; no network, no extra dependency.
- Fails if any non-development package has a license outside the allowlist.
- Reports development-only packages needing review.
- Handles SPDX `OR` (any acceptable branch) and `AND` (all branches required).

To add a dependency:

1. Confirm the license is compatible with GPL-3.0-only.
2. Prefer a package with no native code if it may be bundled at runtime.
3. Add it with an exact-enough range, run `npm install`, and commit the lockfile.
4. Run `npm run check:licenses` and update this document if the risk profile
   changes.

## Risks

- A transitive dependency can change license between versions. The lockfile and
  CI audit are the guard.
- `npm audit` is not part of `verify`: advisories are useful but noisy for
  development-only tooling. Run it manually when updating dependencies.
- The integration test harness downloads a full VS Code build (~380 MB). That is
  a CI/network cost, not a shipped dependency.
