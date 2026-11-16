# Security baseline

Status: Phase 0. This is a threat-model stub plus the controls that actually
exist in the code today. It is deliberately narrower than a full security
review.

## Assets

1. The user's source code and workspace contents.
2. The VS Code extension host process and its privileges.
3. The user's credentials and environment (never read by CodeFlow).
4. The integrity of the graph the user is asked to trust.

## Adversaries and trust boundaries

| Adversary                            | Boundary crossed                      |
| ------------------------------------ | ------------------------------------- |
| A malicious workspace (files, names) | host file access and path handling    |
| A compromised or buggy webview       | `postMessage` into the extension host |
| A compromised or buggy adapter       | CSR into the graph model              |
| A malicious dependency               | build and development environment     |
| Remote content                       | webview network access                |

Workspace contents are untrusted input. So are webview messages and adapter
output, even though both are "ours": a bug in one must not become arbitrary
code execution in the other.

## Controls in place

### Webview isolation

- `default-src 'none'` with a per-load nonce for the single script tag.
- `connect-src 'none'`, `base-uri 'none'`, `form-action 'none'`.
- Styles and images restricted to the webview source (`img-src` also allows
  `data:`).
- No inline `<script>`, no inline event handlers, no remote origins.
- `enableScripts: true` with `localResourceRoots` narrowed to `dist/webview`.
- The webview cannot import Node built-ins; the bundle targets `chrome110`.

The template is a string module (`src/extension/panelTemplate.js`) so the CSP is
unit-tested rather than buried in a file read.

### Message validation

Every inbound message passes `validateEnvelope` before a handler sees it:

- exact protocol version match;
- `kind` must match `domain.action` and be on the allowlist **for its
  direction**;
- `requestId` limited to 128 characters of `A-Za-z0-9_-`;
- payload must be a plain object;
- payload keys `__proto__`, `constructor`, and `prototype` are rejected at any
  depth (prototype-pollution guard);
- serialized size capped at 1,000,000 characters; oversized messages are
  rejected, never truncated.

The bridge adds: 32 in-flight request cap, per-request timeout (5 s host, 8 s
webview), typed error propagation, handler fault isolation, and rejection of all
pending work on disposal.

### Path handling

`src/extension/security/paths.js` provides:

- `isPathInside(root, candidate)` — resolves both paths, normalizes separators,
  compares case-insensitively on Windows, and rejects NUL bytes.
- `toWorkspaceRelative(root, absolute)` — throws `E_PATH` if the path escapes.
- `isSafeRelativePath(value)` — rejects absolute paths (POSIX, drive-letter,
  UNC), `..` segments, backslashes, NUL bytes, empty segments, and values over
  1024 characters.

Tests cover POSIX and Windows containment, case-insensitivity, `..` traversal,
UNC paths, drive changes, NUL bytes, and non-string input.

### Logging and redaction

`src/core/log/redact.js` is the only formatter for log lines:

- values whose key matches password/token/secret/credential/cookie/private-key
  patterns are replaced with `***`;
- token-shaped values (GitHub, OpenAI-style `sk-`, AWS `AKIA`, Slack) are masked
  even under innocent keys;
- strings are capped at 500 characters with an explicit truncation marker;
- objects are depth-capped at 3 and field-capped at 20.

CodeFlow does not log source text. Protocol tracing logs kind, request id, and
approximate size only.

### Workspace trust

`package.json` declares:

```json
"capabilities": {
  "untrustedWorkspaces": {
    "supported": "limited",
    "description": "CodeFlow activates in Restricted Mode and can render its built-in demonstration graph. It does not read workspace files or start processes in this phase."
  }
}
```

The activation path (`extension.js`, `log.js`, `commands.js`, `panel.js`,
`panelTemplate.js`, `diagnostics.js`) imports neither `fs` nor
`child_process`. This is enforced by `tests/unit/architecture.test.js`, not just
by convention.

### Supply chain

- No runtime dependencies; the VSIX contains bundles only.
- Development dependencies are audited against a license allowlist in CI.
- `npm ci` in CI installs exactly the lockfile.
- Packaging uses `--no-dependencies` and a `.vscodeignore` that excludes source,
  tests, CI, and configuration from the VSIX.

## Gaps and accepted risks (Phase 0)

- **No live Restricted Mode run.** The launcher disables the trust prompt
  (`--disable-workspace-trust`), so the integration suite runs in a trusted
  workspace. Restricted Mode is covered by the declaration and the static
  activation-path test. A live untrusted run is a CI follow-up.
- **Lexical path checks only.** Symlinks and Windows junctions can point outside
  the workspace; `isPathInside` does not call `fs.realpath`. No file is read in
  Phase 0, so there is nothing to exploit yet. The first feature that reads files
  must resolve real paths before use.
- **No fuzzing.** Validation is table-tested, not fuzzed. Add property/fuzz tests
  when the protocol grows.
- **No per-adapter resource limits.** A slow adapter blocks its own request until
  the bridge timeout, but there is no CPU/memory budget or worker isolation.
  Phase 1/2 introduces worker-based adapters with time and memory limits.
- **No audit of the VS Code API surface** beyond what the extension calls.
- **Webview `data:` images** are allowed. Phase 0 renders no images; revisit if
  that changes.

## Rules for contributors

1. Do not add `eval`, `new Function`, or dynamic script injection.
2. Do not add remote origins to the CSP. If a feature needs network access,
   propose it in an ADR first.
3. Do not log payloads, file contents, or absolute paths; log counts and kinds.
4. Do not read files from `src/core`, `src/adapters`, `src/visualization`, or
   `src/webview`.
5. Validate before use: configuration, webview messages, adapter output, index
   records, and paths.
6. Prefer returning typed failures over throwing at boundaries.
7. Add a test for every new rejection path.

## Reporting

Security issues should be reported privately to the maintainer rather than in a
public issue. Until a dedicated address exists, use the repository's private
vulnerability reporting channel on GitHub.
