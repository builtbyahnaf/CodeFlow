# 0004 — Validate every host/webview message with a versioned envelope

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

The webview is a separate JavaScript context with its own untrusted input path.
`postMessage` accepts anything structured-cloneable. A bug in the webview, or a
future feature that renders workspace-derived strings, must not become arbitrary
behavior in the extension host (which has file and process access). Conversely,
the webview must be able to reject malformed host data instead of rendering it.

VS Code's webview API provides no request/response correlation, no schema, no
size limit, and no directionality.

## Decision

All host/webview communication goes through a versioned JSON envelope validated
by one shared, dependency-free module (`src/core/protocol/envelope.js`) and a
symmetric request/response bridge (`src/core/protocol/bridge.js`).

Envelope: `{protocolVersion, kind, requestId?, payload}`.

Rules:

- exact version match (`1` today); mismatch is rejected;
- `kind` matches `domain.action` and appears in the allowlist **for that
  direction**;
- `requestId` is optional but, when present, limited to 128 chars of
  `A-Za-z0-9_-`;
- payload is a plain object;
- `__proto__`, `constructor`, and `prototype` keys are rejected at any depth;
- serialized size is capped at 1,000,000 characters; oversized means rejected,
  never truncated.

Bridge behavior: correlated responses, per-request timeout, 32 in-flight cap,
typed errors (`E_PROTOCOL`, `E_LIMIT`, `E_TIMEOUT`, `E_CANCELLED`), handler fault
isolation, and cancellation of all pending work on disposal.

The CSP is part of the same decision: nonce-based script allowlisting,
`default-src 'none'`, no network, no inline script.

## Consequences

Positive:

- One place to add or change a message kind; both sides share the code.
- Malformed, unknown, oversized, or direction-confused messages are rejected
  before a handler runs, and the sender gets a typed error.
- The bridge is testable in plain Node with an injected transport, so the
  contract is covered without launching VS Code.
- Adding a message kind is a small, reviewable change with a test pattern.

Negative:

- Every message pays a JSON serialization and a shallow key scan.
- The allowlists must be maintained in two directions; forgetting one is a
  runtime rejection, not a compile error.
- Version bumps require both sides in one commit.
- A 1 MB cap is arbitrary; large graphs will need pagination or filtering.

## Alternatives rejected

1. **Raw `postMessage` with ad-hoc handlers.** Rejected: no correlation, no
   validation, no consistent failure behavior.
2. **An RPC library (e.g. Comlink, JSON-RPC).** Rejected: adds a runtime
   dependency for a small, well-understood contract; most libraries do not
   enforce direction allowlists or size limits.
3. **Schema validation library (zod/ajv).** Rejected for Phase 0: another
   dependency, and the envelope is small enough to validate by hand with better
   error messages. Revisit if the schema grows substantially.
4. **Trusting the webview because it is our code.** Rejected: the webview renders
   workspace-derived data and is the most exposed context.
