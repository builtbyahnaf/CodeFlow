# Architecture

Status: Phase 0 (engineering foundation). This document describes what the code
does today, not what later phases plan to add. Anything not implemented is
listed under "Deferred".

## Two runtimes, two bundles

CodeFlow is one extension that runs in two JavaScript contexts:

| Context        | Runtime                | Bundle                 | Module format |
| -------------- | ---------------------- | ---------------------- | ------------- |
| Extension host | VS Code's Node (20.x+) | `dist/extension.cjs`   | CommonJS      |
| Webview        | Chromium sandbox       | `dist/webview/main.js` | Classic IIFE  |

The source tree is ESM. esbuild rewrites it for each target. The host bundle
marks `vscode` external and targets `node20`; the webview bundle targets
`chrome110` and cannot resolve Node built-ins.

The webview is sandboxed: no Node API, no network (`connect-src 'none'`), no
remote script, and no inline script. Its only channel to the extension is
`postMessage` through the validated bridge.

## Module map

```
src/
  core/                      no vscode, no fs, no child_process
    protocol/
      envelope.js            protocol version, kind allowlists, validation
      bridge.js              request/response, timeouts, fault isolation (shared)
    log/
      redact.js              log formatting and secret redaction
    csr/
      types.js               draft CSR vocabulary (closed enums)
      entities.js            entity factories and run validation
    adapterRegistry.js       adapter registration, extension resolution, analyze boundary
    graph/
      model.js               CSR -> nodes/edges with provenance
      layout.js              deterministic layered layout (Phase 0 placeholder)
      dto.js                 JSON view model, validation, serialization

  adapters/
    mock/index.js            deterministic synthetic analysis of `.mock`

  extension/                 the only layer allowed to import `vscode`
    extension.js             activation and composition root
    log.js                   output channel
    commands.js              three commands, all guarded
    panel.js                 single webview panel, bridge wiring
    panelTemplate.js         CSP + HTML as a string module
    diagnostics.js           "why isn't this working" report
    security/paths.js        lexical workspace containment helpers

  visualization/
    renderer/svgRenderer.js  render()/select()/destroy() over an SVG element

  webview/
    main.js                  protocol client, DTO validation, DOM updates
    styles.css               themable styles, status styling
```

`src/extension/security/paths.js` is the only source file outside the host that
imports a Node built-in (`node:path`). It is a pure helper; the architecture
test restricts `fs` and `child_process`, which are the capabilities that matter.

## Data flow

```
webview                         host
  |  webview.ready  ---------->  panel bridge
  |  <---------- capabilities.data   (adapters, protocol version, demo flag)
  |  graph.load  ------------->  panel bridge
  |                               adapterRegistry.analyze(path, runId)
  |                                 -> adapter.analyze()
  |                                 -> validateAnalysisRun()
  |                               buildGraph(run)  (CSR -> graph)
  |                               toDto(graph)     (graph -> layout -> JSON)
  |  <---------- graph.data
  |  validateDto(payload)
  |  svgRenderer.render(dto)
  |  node.select  ------------>  host logs the selection
```

Every arrow above is one validated envelope. A malformed, oversized, or
out-of-allowlist message never reaches a handler.

### Messages (protocol v1)

| Kind                | Direction       | Purpose                                 |
| ------------------- | --------------- | --------------------------------------- |
| `webview.ready`     | webview -> host | handshake; asks for capabilities        |
| `graph.load`        | webview -> host | request the demo graph                  |
| `node.select`       | webview -> host | report selection (no response expected) |
| `panel.ping`        | webview -> host | liveness check                          |
| `graph.data`        | host -> webview | graph DTO payload                       |
| `capabilities.data` | host -> webview | adapter matrix, version, demo flag      |
| `protocol.error`    | both            | typed error, correlated when possible   |
| `protocol.ack`      | host -> webview | reserved; not currently sent            |
| `panel.pong`        | host -> webview | response to `panel.ping`                |

Envelope fields: `protocolVersion` (currently `1`), `kind`, optional
`requestId`, object `payload`. Unknown fields are ignored; unknown kinds are
rejected.

### Requests, responses, and pushes

A message carrying a `requestId` that matches a pending request resolves that
request's promise and is **not** delivered to a handler. Handlers only receive
unsolicited messages (for example `node.select` in the host) and uncorrelated
errors. Callers must consume the resolved `{kind, payload}` value; registering a
handler for a kind that is only ever used as a response will never run.

This distinction is enforced by `tests/unit/bridge.test.js` for request/response
and error propagation.

## Boundaries that are enforced, not just documented

`tests/unit/architecture.test.js` fails the build if:

- any file under `src/core`, `src/adapters`, `src/visualization`, or `src/webview`
  imports `vscode`, `fs`, `child_process`, or `worker_threads`;
- `src/core/graph` imports adapters, the host, the webview, or the renderer;
- `src/core/csr` imports the graph layer or adapters;
- the webview bundle imports the host or an adapter;
- a source file uses `require()` or `module.exports`;
- a TypeScript file or `tsconfig.json` exists;
- the manifest and the code disagree on command ids, version, or entry point;
- the activation path imports file-system or process APIs;
- the CSP permits inline or remote execution.

ESLint independently forbids `vscode` and Node I/O imports in the same layers,
so the rule is visible in the editor, not only in CI.

## Failure behaviour

| Failure                               | Result                                             |
| ------------------------------------- | -------------------------------------------------- |
| Message fails validation              | `protocol.error` posted; handler never runs        |
| Adapter has no matching extension     | `E_UNSUPPORTED`, rendered as a banner              |
| Adapter throws                        | `E_ADAPTER` with the message, no host crash        |
| Adapter returns invalid CSR           | `E_VALIDATION` with structured issues              |
| Handler throws                        | `protocol.error`, requester rejects with the code  |
| Request gets no response              | `E_TIMEOUT` after 5 s (host) / 8 s (webview)       |
| Panel closes with requests in flight  | `E_CANCELLED` for each pending request             |
| Graph DTO is malformed in the webview | validation fails; banner shown; graph not rendered |

Validation never throws. Adapter and protocol paths return typed results;
exceptions are reserved for programmer error, and even those are caught at the
command and bridge boundaries.

## Deliberate Phase 0 simplifications

- **Layout lives in `core/graph/layout.js`, not the renderer.** It is a
  deterministic layered layout with cycle handling, sized for testability. Phase
  4 benchmarks Cytoscape/ELK/dagre and will replace it behind the renderer
  interface.
- **The mock adapter registers `.mock` only.** It never claims to analyze `.js`
  or `.cpp`; doing so would misrepresent capability.
- **One panel per window.** A second `codeflow.openExplorer` reveals the existing
  panel rather than duplicating analysis state.
- **No persistence.** No index, no cache, no database. See ADR 0005.
- **No telemetry, no network.** The webview policy blocks outbound connections
  and the host performs no HTTP.

## Deferred to later phases

| Capability                    | Phase |
| ----------------------------- | ----- |
| Full CSR specification        | 1     |
| C++ analysis adapters         | 2     |
| JavaScript analysis adapters  | 3     |
| Real graph engine/layout      | 4     |
| Source preview and navigation | 5     |
| Explanations (non-AI core)    | 6-7   |
| Project index and caching     | 8     |

## Version floor consequences

`engines.vscode` is `^1.95.0`. That floor implies the extension host runs Node
20.x, regardless of the Node version used for development. Therefore:

- `node:sqlite` (Node 22.5+) is unavailable to the host at the floor. Any SQLite
  decision in Phase 8 must bundle a native module with prebuilt binaries or use a
  non-native cache.
- Language features must target Node 20 syntax. esbuild enforces this for the
  host bundle via `target: ['node20']`.
- The webview targets Chromium 110, which is older than a current browser.
  Avoid newer DOM/CSS features unless there is a fallback.

## Changing the protocol

1. Add the kind to the correct allowlist in `src/core/protocol/envelope.js`.
2. Handle it in `src/extension/panel.js` and/or `src/webview/main.js`.
3. Add a unit test for acceptance and rejection in `tests/unit/protocol.test.js`.
4. If the envelope shape changes, bump `PROTOCOL_VERSION` and update both sides
   in the same commit. The webview and host reject unknown versions by design.
