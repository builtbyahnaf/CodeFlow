# CodeFlow Security Policy & Threat Model

> Specification & Review: Roadmap §21, Phase 12 §9, AC-12.11, AC-12.12.
> Release Target: CodeFlow V1.0.0.

CodeFlow is an offline, read-only code comprehension and visualization engine. It is designed under the core principle that **analyzing code must never compromise the host system, leak user source code, or execute untrusted instructions**.

---

## 1. Security Architecture & Threat Boundaries

```
+-------------------------------------------------------------------+
|                        VS Code Desktop Host                       |
|                                                                   |
|   +--------------------+               +----------------------+   |
|   |   Extension Host   | <--- RPC ---> | Isolated Webview DOM |   |
|   | (Read-Only Parser) |               |  (CSP: 'none', Nonce)|   |
|   +--------------------+               +----------------------+   |
|             |                                                     |
|             v                                                     |
|   +--------------------+                                          |
|   | Clang Read-Only    |  (Spawned with argument arrays, no shell)|
|   | AST Dump Process   |                                          |
|   +--------------------+                                          |
|             X                                                     |
|   [ NO NETWORK CALLS ] (100% Offline, Zero-Upload)                |
+-------------------------------------------------------------------+
```

---

## 2. Roadmap §21 Controls & Verification Evidence

| Control | Design Implementation | Automated Verification Evidence | Status |
|---|---|---|---|
| **Never execute analyzed source** | All analysis runs purely on parsed AST structures (Babel for JS, Clang AST dump for C++). Code is never loaded into `eval()`, `new Function()`, `vm.runInContext()`, or executed in child processes. | `tests/unit/securitySourceExec.test.js` audits the entire repository for dynamic execution calls. | **PASS** |
| **Never run build scripts** | CodeFlow never invokes `cmake`, `make`, `npm`, or build steps. C++ compilation arguments are read passively from `compile_commands.json` or fallback heuristics. | Codebase architectural audit and absence of build system invocations in `cppAdapter.js`. | **PASS** |
| **Validate workspace-provided config** | Settings and configuration keys are validated against strict JSON schema definitions and clamped to safe finite bounds. | `tests/unit/settingsValidator.test.js` and `tests/unit/settingsCategories.test.js`. | **PASS** |
| **Path containment** | Paths are validated and normalized against the authorized workspace root. UNC paths (`\\host\share`), `..` parent navigation escapes, and null byte injections are rejected. | `tests/unit/securityPaths.test.js` verifying `validatePathContainment()`. | **PASS** |
| **Safe process invocation** | Clang subprocesses are spawned using fixed argument arrays (`execFile` / `spawn`), `shell: false`, a clean environment allowlist, and hard execution timeouts. | `src/core/adapters/cppAdapter.js` process launcher implementation. | **PASS** |
| **Webview Content Security Policy** | Webview HTML specifies `default-src 'none'; connect-src 'none'; script-src 'nonce-...'; base-uri 'none'; form-action 'none'`. Inline scripts and styles are prohibited. | `tests/unit/securityCsp.test.js` and `src/extension/panelTemplate.js`. | **PASS** |
| **Message validation** | Every protocol message crossing the webview/extension boundary is validated against schema discriminators; unknown payloads are rejected safely. | `tests/unit/envelope.test.js` and `tests/unit/errorInjection.test.js`. | **PASS** |
| **Dependency & license audit** | Direct dependencies are restricted to zero runtime dependencies (bundled with esbuild). All development tools undergo license and vulnerability scanning. | `scripts/checkLicenses.js` and CI `npm audit` / `npm run check:licenses`. | **PASS** |
| **Zero source upload (Network Guard)** | CodeFlow is strictly offline. No telemetry, no cloud analytics, and no remote endpoints are contacted. | `tests/unit/securityNetwork.test.js` instruments `http`, `https`, `net`, `dgram`, `tls`, and `fetch` during full analysis, asserting 0 network calls. | **PASS** |
| **Credentials & secret storage** | CodeFlow does not store, request, or handle credentials, tokens, or API keys. Future AI extensions will strictly use VS Code's `SecretStorage`. | Audit of extension state and configuration schemas. | **PASS** |
| **Workspace trust / Restricted Mode** | When opened in Restricted Mode, CodeFlow activates in inert demonstration mode. It does not read workspace files or spawn any toolchain subprocesses. | Manifest `untrustedWorkspaces.supported: "limited"` and `tests/unit/architecture.test.js`. | **PASS** |
| **Safe file permissions** | Index databases and cache directories in `.codeflow/` are created with user-only permissions (`0o700` / `0o600`) where supported by the OS. | `src/core/index/storage.js` file creation modes. | **PASS** |

---

## 3. Reporting a Vulnerability

If you discover a potential security vulnerability in CodeFlow, please do not file a public issue. Contact the maintainer directly via GitHub Security Advisories or private security communication channels.
