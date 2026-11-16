# 0006 — Keep activation minimal and side-effect free

- Status: Accepted
- Date: 2026-11-16
- Phase: 0

## Context

VS Code extension activation delays the first interaction in a window. Extensions
that scan workspaces, start servers, or spawn compilers on activation are a
common source of slow startup and a real problem in Restricted Mode, where
workspace access is not granted.

CodeFlow's long-term features include parsing, indexing, and process-based
analysis tools. It would be easy for activation to grow into "start everything,"
and difficult to shrink later.

## Decision

Activation does the minimum needed to make commands exist:

1. create one output channel and a logger;
2. build the adapter registry and register the mock adapter;
3. construct the panel manager (no panel yet);
4. register three commands;
5. log one activation line with duration, version, and trust state.

No file reads, no directory walks, no process spawns, no webview, no analysis, no
network, no settings writes, no state persistence.

Other rules:

- No explicit `activationEvents`; VS Code 1.74+ derives activation from
  `contributes.commands`.
- The webview panel is created lazily on `codeflow.openExplorer`, and only one
  panel exists per window.
- Analysis is requested by the webview after it loads; activation never runs it.
- `untrustedWorkspaces.supported` is `limited`, with an explicit description: the
  extension activates in Restricted Mode and the demo graph remains available;
  no workspace content is read.
- Disposal is registered through `context.subscriptions`; no timers or listeners
  are created outside owned disposables.

Enforcement:

- `tests/unit/architecture.test.js` scans the activation path for `fs`,
  `child_process`, `os`, and `process` imports.
- The integration suite asserts that activation returns a working registry and
  panel manager without a panel being open or analysis having run.

## Consequences

Positive:

- Startup cost is one output channel and three command registrations.
- Restricted Mode is safe by construction, not by a runtime check.
- Most failures are deferred to the command that causes them, where they can be
  reported with context.
- Adding a parser or index later cannot silently run at startup without changing
  this file and its test.

Negative:

- The first `Open Explorer` pays the cost of panel creation and graph loading.
- Adapters cannot pre-warm caches at activation. Phase 8 may need an explicit,
  opt-in warm-up command instead.
- Users see no indication that CodeFlow exists until they run a command, since
  there is no status bar item or view contribution yet.

## Alternatives rejected

1. **Activate on startup (`activationEvents: ["*"]`) and pre-analyze.** Rejected:
   slow, unsafe in Restricted Mode, and unnecessary for a demo graph.
2. **A status bar item created at activation.** Rejected for Phase 0: extra UI
   surface without a useful action beyond opening the same panel.
3. **A tree view contribution for project symbols.** Rejected: there is no index
   yet; a permanently empty view is worse than no view.
4. **Lazy-load the adapter registry.** Rejected: registration is pure and cheap;
   laziness would add indirection without measurable benefit.
