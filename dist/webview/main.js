(() => {
  // src/core/protocol/envelope.js
  var PROTOCOL_VERSION = 1;
  var MAX_PAYLOAD_BYTES = 1e6;
  var KIND_PATTERN = /^[a-z]+(\.[a-z]+)+$/;
  var REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
  var WEBVIEW_TO_HOST = Object.freeze([
    "webview.ready",
    "graph.load",
    "csr.load",
    "node.select",
    "panel.ping",
    "query.symbol",
    "query.symbols",
    "query.callers",
    "query.callees",
    "query.constructs",
    "query.capabilities",
    "cfg.functions",
    "cfg.load"
  ]);
  var HOST_TO_WEBVIEW = Object.freeze([
    "graph.data",
    "capabilities.data",
    "csr.data",
    "query.data",
    "analysis.progress",
    "protocol.error",
    "protocol.ack",
    "panel.pong",
    "cfg.functions",
    "cfg.data"
  ]);
  var DIRECTIONS = Object.freeze({
    WEBVIEW_TO_HOST: "webview_to_host",
    HOST_TO_WEBVIEW: "host_to_webview"
  });
  var KIND_ALLOWLIST = Object.freeze({
    [DIRECTIONS.WEBVIEW_TO_HOST]: new Set(WEBVIEW_TO_HOST),
    [DIRECTIONS.HOST_TO_WEBVIEW]: new Set(HOST_TO_WEBVIEW)
  });
  var UNSAFE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
  var MAX_KEY_SCAN_DEPTH = 8;
  function createEnvelope(kind, payload, requestId) {
    const envelope = {
      protocolVersion: PROTOCOL_VERSION,
      kind,
      payload: payload ?? {}
    };
    if (requestId) {
      envelope.requestId = requestId;
    }
    return envelope;
  }
  function createErrorPayload(code, message, detail) {
    const payload = { code, message };
    if (detail) {
      payload.detail = detail;
    }
    return payload;
  }
  function messageSize(value) {
    try {
      const json = JSON.stringify(value);
      return typeof json === "string" ? json.length : 0;
    } catch {
      return Number.POSITIVE_INFINITY;
    }
  }
  function isPlainObject(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  }
  function scanUnsafeKeys(value, path, depth) {
    if (depth > MAX_KEY_SCAN_DEPTH || value === null || typeof value !== "object") {
      return { ok: true };
    }
    const entries = Array.isArray(value) ? value.entries() : Object.entries(value);
    for (const [key, child] of entries) {
      const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
      if (!Array.isArray(value) && UNSAFE_KEYS.has(String(key))) {
        return { ok: false, path: childPath, key: String(key) };
      }
      const nested = scanUnsafeKeys(child, childPath, depth + 1);
      if (!nested.ok) {
        return nested;
      }
    }
    return { ok: true };
  }
  function validateEnvelope(raw, options) {
    const direction = options?.direction;
    const allowlist = KIND_ALLOWLIST[direction];
    if (!allowlist) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "unknown_direction",
        message: `Unknown protocol direction: ${String(direction)}`
      };
    }
    if (!isPlainObject(raw)) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "not_an_object",
        message: "Message must be a plain object."
      };
    }
    const candidate = (
      /** @type {Record<string, unknown>} */
      raw
    );
    if (candidate.protocolVersion !== PROTOCOL_VERSION) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "version_mismatch",
        message: `Unsupported protocol version: expected ${PROTOCOL_VERSION}, received ${String(
          candidate.protocolVersion
        )}.`
      };
    }
    const kind = candidate.kind;
    if (typeof kind !== "string" || !KIND_PATTERN.test(kind)) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "invalid_kind",
        message: 'Message kind must look like "domain.action" in lower case.',
        path: "kind"
      };
    }
    if (!allowlist.has(kind)) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "unknown_kind",
        message: `Kind "${kind}" is not accepted in direction "${direction}".`,
        path: "kind"
      };
    }
    const requestId = candidate.requestId;
    if (requestId !== void 0) {
      if (typeof requestId !== "string" || !REQUEST_ID_PATTERN.test(requestId)) {
        return {
          ok: false,
          code: "E_PROTOCOL",
          reason: "invalid_request_id",
          message: 'requestId must be 1-128 characters of A-Z, a-z, 0-9, "_" or "-".',
          path: "requestId"
        };
      }
    }
    const payload = candidate.payload ?? {};
    if (!isPlainObject(payload)) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "invalid_payload",
        message: "payload must be a plain object.",
        path: "payload",
        requestId: typeof requestId === "string" ? requestId : void 0
      };
    }
    const keyScan = scanUnsafeKeys(payload, "payload", 0);
    if (!keyScan.ok) {
      return {
        ok: false,
        code: "E_PROTOCOL",
        reason: "unsafe_key",
        message: `Payload contains a forbidden key "${keyScan.key}".`,
        path: keyScan.path,
        requestId: typeof requestId === "string" ? requestId : void 0
      };
    }
    if (messageSize(candidate) > MAX_PAYLOAD_BYTES) {
      return {
        ok: false,
        code: "E_LIMIT",
        reason: "payload_too_large",
        message: `Message exceeds the ${MAX_PAYLOAD_BYTES} byte limit.`,
        requestId: typeof requestId === "string" ? requestId : void 0
      };
    }
    const envelope = {
      protocolVersion: PROTOCOL_VERSION,
      kind,
      payload
    };
    if (typeof requestId === "string") {
      envelope.requestId = requestId;
    }
    return { ok: true, envelope };
  }

  // src/core/protocol/bridge.js
  var ProtocolError = class extends Error {
    /**
     * @param {string} code
     * @param {string} message
     * @param {Record<string, unknown>} [detail]
     */
    constructor(code, message, detail) {
      super(message);
      this.name = "ProtocolError";
      this.code = code;
      if (detail) {
        this.detail = detail;
      }
    }
  };
  var NOOP_LOGGER = {
    debug() {
    },
    warn() {
    },
    error() {
    }
  };
  function createBridge(options) {
    const { post, inboundDirection, logger = NOOP_LOGGER } = options;
    const timeoutMs = options.timeoutMs ?? 5e3;
    const maxInFlight = options.maxInFlight ?? 32;
    const outboundDirection = inboundDirection === DIRECTIONS.WEBVIEW_TO_HOST ? DIRECTIONS.HOST_TO_WEBVIEW : DIRECTIONS.WEBVIEW_TO_HOST;
    const outboundKinds = new Set(
      outboundDirection === DIRECTIONS.HOST_TO_WEBVIEW ? HOST_TO_WEBVIEW : WEBVIEW_TO_HOST
    );
    let sequence = 0;
    const createRequestId = options.createRequestId ?? (() => {
      sequence += 1;
      return `r${sequence.toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    });
    const pending = /* @__PURE__ */ new Map();
    const handlers = /* @__PURE__ */ new Map();
    const reportedKinds = /* @__PURE__ */ new Set();
    let disposed = false;
    function send(kind, payload, requestId) {
      if (disposed) {
        throw new ProtocolError("E_CANCELLED", "Bridge is disposed.");
      }
      if (!outboundKinds.has(kind)) {
        throw new ProtocolError("E_PROTOCOL", `Kind "${kind}" is not sendable in this direction.`);
      }
      const envelope = createEnvelope(kind, payload, requestId);
      if (messageSize(envelope) > 1e6) {
        throw new ProtocolError("E_LIMIT", "Refusing to send an oversized message.");
      }
      post(envelope);
      logger.debug("protocol.send", {
        kind,
        requestId: requestId ?? null,
        bytes: messageSize(envelope)
      });
    }
    function sendError(code, message, requestId, detail) {
      try {
        send("protocol.error", createErrorPayload(code, message, detail), requestId);
      } catch {
      }
    }
    function on(kind, handler) {
      handlers.set(kind, handler);
      return () => {
        if (handlers.get(kind) === handler) {
          handlers.delete(kind);
        }
      };
    }
    function request(kind, payload = {}, requestOptions = {}) {
      if (disposed) {
        return Promise.reject(new ProtocolError("E_CANCELLED", "Bridge is disposed."));
      }
      if (pending.size >= maxInFlight) {
        return Promise.reject(
          new ProtocolError("E_LIMIT", `Too many in-flight requests (${maxInFlight}).`)
        );
      }
      const requestId = createRequestId();
      const effectiveTimeout = requestOptions.timeoutMs ?? timeoutMs;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(requestId);
          reject(
            new ProtocolError(
              "E_TIMEOUT",
              `No response to "${kind}" within ${effectiveTimeout} ms.`,
              {
                kind,
                requestId
              }
            )
          );
        }, effectiveTimeout);
        pending.set(requestId, { resolve, reject, timer });
        try {
          send(kind, payload, requestId);
        } catch (error) {
          clearTimeout(timer);
          pending.delete(requestId);
          reject(error);
        }
      });
    }
    async function handleMessage(raw) {
      if (disposed) {
        return { ok: false, code: "E_CANCELLED", reason: "disposed" };
      }
      const validation = validateEnvelope(raw, { direction: inboundDirection });
      if (!validation.ok) {
        if (!reportedKinds.has(validation.reason)) {
          reportedKinds.add(validation.reason);
          logger.warn("protocol.rejected", {
            reason: validation.reason,
            path: validation.path ?? null
          });
        }
        sendError(validation.code, validation.message, validation.requestId, {
          reason: validation.reason
        });
        return { ok: false, code: validation.code, reason: validation.reason };
      }
      const envelope = validation.envelope;
      const { kind, requestId, payload } = envelope;
      logger.debug("protocol.receive", {
        kind,
        requestId: requestId ?? null,
        bytes: messageSize(envelope)
      });
      if (kind === "protocol.error") {
        if (requestId && pending.has(requestId)) {
          const entry = pending.get(requestId);
          if (entry) {
            clearTimeout(entry.timer);
            pending.delete(requestId);
            const code = typeof payload.code === "string" ? payload.code : "E_PROTOCOL";
            const message = typeof payload.message === "string" ? payload.message : "The other side reported an error.";
            entry.reject(new ProtocolError(code, message, { requestId }));
          }
        }
        return { ok: true };
      }
      if (requestId && pending.has(requestId)) {
        const entry = pending.get(requestId);
        if (entry) {
          clearTimeout(entry.timer);
          pending.delete(requestId);
          entry.resolve({ kind, payload });
        }
        return { ok: true };
      }
      const handler = handlers.get(kind);
      if (!handler) {
        logger.debug("protocol.unhandled", { kind, requestId: requestId ?? null });
        return { ok: true };
      }
      try {
        await handler(payload, { requestId });
        return { ok: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        const code = error instanceof ProtocolError ? error.code : (
          /** @type {{code?: string}} */
          error?.code ?? "E_PROTOCOL"
        );
        logger.error("protocol.handler_failed", { kind, error: message });
        sendError(code, message, requestId);
        return { ok: false, code };
      }
    }
    function dispose(reason = "disposed") {
      if (disposed) {
        return;
      }
      disposed = true;
      for (const [, entry] of pending) {
        clearTimeout(entry.timer);
        entry.reject(new ProtocolError("E_CANCELLED", `Bridge closed: ${reason}`));
      }
      pending.clear();
      handlers.clear();
    }
    return {
      on,
      request,
      respond: send,
      handleMessage,
      dispose,
      pendingCount: () => pending.size,
      isDisposed: () => disposed,
      direction: inboundDirection
    };
  }

  // src/core/graph/layout.js
  var LAYOUT_DEFAULTS = Object.freeze({
    nodeWidth: 190,
    nodeHeight: 54,
    horizontalGap: 90,
    verticalGap: 26,
    maxLayers: 40
  });

  // src/core/graph/cfg/kinds.js
  var CFG_NODE_KINDS = Object.freeze([
    "entry",
    "exit",
    "statement",
    "condition",
    "multiway",
    "merge",
    "loop_header",
    "loop_latch",
    "loop_body_entry",
    "break",
    "continue",
    "return",
    "throw",
    "call",
    "await",
    "catch_entry",
    "finally_entry",
    "unreachable",
    "unmodeled"
  ]);
  var CFG_EDGE_KINDS = Object.freeze([
    "seq",
    "true",
    "false",
    "case",
    "default",
    "loop_back",
    "break",
    "continue",
    "return",
    "throw",
    "exception",
    "finally",
    "unreachable"
  ]);
  var CFG_STATUSES = Object.freeze([
    "resolved",
    "inferred",
    "possible",
    "unresolved",
    "stale"
  ]);
  var CFG_DEGRADATION_CODES = Object.freeze([
    "unmodeled_construct",
    "goto_flow",
    "indirect_goto_flow",
    "iteration_source_opaque",
    "call_site_unrecorded",
    "condition_shape_unmodeled",
    "orphan_jump",
    "modeled_exception_path",
    "analysis_partial",
    "truncated"
  ]);
  var ABRUPT_EDGE_KINDS = Object.freeze(["break", "continue", "return", "throw"]);
  var BACK_EDGE_KINDS = Object.freeze(["loop_back", "continue"]);

  // src/core/graph/dto.js
  var GRAPH_DTO_VERSION = 1;
  function validateDto(dto) {
    const issues = [];
    if (typeof dto !== "object" || dto === null || Array.isArray(dto)) {
      return { ok: false, issues: ["DTO must be an object."] };
    }
    const candidate = (
      /** @type {Record<string, unknown>} */
      dto
    );
    if (candidate.dtoVersion !== GRAPH_DTO_VERSION) {
      issues.push(`Unsupported dtoVersion: ${String(candidate.dtoVersion)}.`);
    }
    if (candidate.dtoKind === "cfg") {
      validateCfgDto(candidate, issues);
      return issues.length > 0 ? { ok: false, issues } : { ok: true, dto: (
        /** @type {GraphDto} */
        dto
      ) };
    }
    const nodes = candidate.nodes;
    const edges = candidate.edges;
    if (!Array.isArray(nodes)) {
      issues.push("nodes must be an array.");
    }
    if (!Array.isArray(edges)) {
      issues.push("edges must be an array.");
    }
    if (Array.isArray(nodes) && Array.isArray(edges)) {
      const ids = /* @__PURE__ */ new Set();
      for (const node of nodes) {
        const id = (
          /** @type {Record<string, unknown>} */
          node.id
        );
        if (typeof id !== "string") {
          issues.push("Every node needs a string id.");
          continue;
        }
        if (ids.has(id)) {
          issues.push(`Duplicate node id "${id}".`);
        }
        ids.add(id);
      }
      for (const edge of edges) {
        const record = (
          /** @type {Record<string, unknown>} */
          edge
        );
        if (typeof record.from !== "string" || !ids.has(record.from)) {
          issues.push(`Edge "${String(record.id)}" has an unknown source node.`);
        }
        if (typeof record.to !== "string" || !ids.has(record.to)) {
          issues.push(`Edge "${String(record.id)}" has an unknown target node.`);
        }
      }
    }
    if (issues.length > 0) {
      return { ok: false, issues };
    }
    return { ok: true, dto: (
      /** @type {GraphDto} */
      dto
    ) };
  }
  function validateCfgDto(candidate, issues) {
    if (candidate.graphKind !== "cfg") {
      issues.push('A CFG DTO must declare graphKind "cfg".');
    }
    const fn = candidate.function;
    if (typeof fn !== "object" || fn === null || Array.isArray(fn)) {
      issues.push("function must be an object.");
    } else {
      const record = (
        /** @type {Record<string, unknown>} */
        fn
      );
      for (const key of ["symbolId", "name", "qualifiedName", "kind"]) {
        if (typeof record[key] !== "string") {
          issues.push(`function.${key} must be a string.`);
        }
      }
      if (record.range !== null && !isRangeRef(record.range)) {
        issues.push("function.range must be a range reference or null.");
      }
    }
    const nodes = candidate.nodes;
    const edges = candidate.edges;
    if (!Array.isArray(nodes)) {
      issues.push("nodes must be an array.");
      return;
    }
    if (!Array.isArray(edges)) {
      issues.push("edges must be an array.");
      return;
    }
    const ids = /* @__PURE__ */ new Set();
    const entryIds = [];
    const exitIds = [];
    for (const entry of nodes) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every node must be an object.");
        continue;
      }
      const node = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = node.id;
      if (typeof id !== "string") {
        issues.push("Every node needs a string id.");
        continue;
      }
      if (ids.has(id)) {
        issues.push(`Duplicate node id "${id}".`);
      }
      ids.add(id);
      if (!CFG_NODE_KINDS.includes(String(node.kind))) {
        issues.push(`Node "${id}" has unknown kind "${String(node.kind)}".`);
      }
      if (!CFG_STATUSES.includes(String(node.status))) {
        issues.push(`Node "${id}" has unknown status "${String(node.status)}".`);
      }
      if (typeof node.label !== "string") {
        issues.push(`Node "${id}" needs a string label.`);
      }
      if (!Array.isArray(node.labelLines) || node.labelLines.some((line) => typeof line !== "string")) {
        issues.push(`Node "${id}" needs string labelLines.`);
      }
      if (node.range !== null && !isRangeRef(node.range)) {
        issues.push(`Node "${id}" has an invalid range reference.`);
      }
      if (!isPosition(node.position)) {
        issues.push(`Node "${id}" has an invalid position.`);
      }
      if (node.kind === "entry") {
        entryIds.push(id);
      }
      if (node.kind === "exit") {
        exitIds.push(id);
      }
      if (node.calls !== void 0) {
        if (!Array.isArray(node.calls)) {
          issues.push(`Node "${id}" calls must be an array when present.`);
        } else {
          for (const call of node.calls) {
            if (typeof call !== "object" || call === null || typeof call.to !== "string" || typeof call.label !== "string" || !CFG_STATUSES.includes(String(call.status))) {
              issues.push(`Node "${id}" has an invalid call target.`);
            }
          }
        }
      }
    }
    if (entryIds.length !== 1) {
      issues.push(`A CFG needs exactly one entry node; found ${entryIds.length}.`);
    }
    if (exitIds.length !== 1) {
      issues.push(`A CFG needs exactly one exit node; found ${exitIds.length}.`);
    }
    if (candidate.entryId !== entryIds[0]) {
      issues.push("entryId must reference the entry node.");
    }
    if (candidate.exitId !== exitIds[0]) {
      issues.push("exitId must reference the exit node.");
    }
    const edgeIds = /* @__PURE__ */ new Set();
    for (const entry of edges) {
      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        issues.push("Every edge must be an object.");
        continue;
      }
      const edge = (
        /** @type {Record<string, unknown>} */
        entry
      );
      const id = edge.id;
      if (typeof id !== "string") {
        issues.push("Every edge needs a string id.");
        continue;
      }
      if (edgeIds.has(id)) {
        issues.push(`Duplicate edge id "${id}".`);
      }
      edgeIds.add(id);
      if (typeof edge.from !== "string" || !ids.has(edge.from)) {
        issues.push(`Edge "${id}" has an unknown source node.`);
      }
      if (typeof edge.to !== "string" || !ids.has(edge.to)) {
        issues.push(`Edge "${id}" has an unknown target node.`);
      }
      if (!CFG_EDGE_KINDS.includes(String(edge.kind))) {
        issues.push(`Edge "${id}" has unknown kind "${String(edge.kind)}".`);
      }
      if (!CFG_STATUSES.includes(String(edge.status))) {
        issues.push(`Edge "${id}" has unknown status "${String(edge.status)}".`);
      }
      if (typeof edge.label !== "string") {
        issues.push(`Edge "${id}" needs a string label.`);
      }
      if (typeof edge.dash !== "string" || typeof edge.glyphHint !== "string") {
        issues.push(`Edge "${id}" needs string dash and glyphHint fields.`);
      }
    }
    const degradations = candidate.degradations;
    if (!Array.isArray(degradations)) {
      issues.push("degradations must be an array.");
    } else {
      for (const entry of degradations) {
        if (typeof entry !== "object" || entry === null || typeof entry.code !== "string" || typeof entry.message !== "string" || !["info", "warning", "error"].includes(String(entry.severity))) {
          issues.push("Every degradation needs a code, message and severity.");
        }
      }
    }
    const extent = candidate.extent;
    if (typeof extent !== "object" || extent === null || !Number.isFinite(extent.width) || !Number.isFinite(extent.height)) {
      issues.push("extent must carry finite width and height.");
    }
  }
  function isRangeRef(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const range = (
      /** @type {Record<string, unknown>} */
      value
    );
    return typeof range.fileId === "string" && Number.isInteger(range.startLine) && Number.isInteger(range.startColumn) && Number.isInteger(range.endLine) && Number.isInteger(range.endColumn) && range.startLine >= 0 && range.startColumn >= 0 && range.endLine >= 0 && range.endColumn >= 0;
  }
  function isPosition(value) {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {
      return false;
    }
    const position = (
      /** @type {Record<string, unknown>} */
      value
    );
    return Number.isFinite(position.x) && Number.isFinite(position.y) && Number.isFinite(position.width) && Number.isFinite(position.height) && Number.isInteger(position.layer);
  }

  // src/visualization/renderer/svgRenderer.js
  var SVG_NS = "http://www.w3.org/2000/svg";
  function svgEl(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    for (const [key, value] of Object.entries(attributes)) {
      element.setAttribute(key, String(value));
    }
    return element;
  }
  function truncate(value, max) {
    const text = String(value ?? "");
    return text.length > max ? `${text.slice(0, max - 1)}\u2026` : text;
  }
  function createSvgRenderer({ svg: svg2, onSelect }) {
    let dto = null;
    let viewport = null;
    const nodeElements = /* @__PURE__ */ new Map();
    const edgeElements = /* @__PURE__ */ new Map();
    let selectedId = null;
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let dragging = false;
    let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };
    function applyTransform() {
      if (viewport) {
        viewport.setAttribute(
          "transform",
          `translate(${translateX.toFixed(2)} ${translateY.toFixed(2)}) scale(${scale.toFixed(3)})`
        );
      }
    }
    function nodePoint(node, side) {
      if (side === "out") {
        return {
          x: node.position.x + node.position.width,
          y: node.position.y + node.position.height / 2
        };
      }
      return { x: node.position.x, y: node.position.y + node.position.height / 2 };
    }
    function edgePath(source, target) {
      if (source.id === target.id) {
        const { x, y, width, height } = source.position;
        const cx = x + width / 2;
        const startY = y - 2;
        return `M ${cx} ${startY} C ${cx - 46} ${y - 60}, ${cx + 46} ${y - 60}, ${cx} ${y + height + 2}`;
      }
      const from = nodePoint(source, "out");
      const to = nodePoint(target, "in");
      const bend = Math.max(36, Math.abs(to.x - from.x) / 2);
      return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
    }
    function clear() {
      if (viewport) {
        svg2.removeChild(viewport);
      }
      viewport = svgEl("g", { class: "cf-viewport" });
      svg2.appendChild(viewport);
      nodeElements.clear();
      edgeElements.clear();
      selectedId = null;
    }
    function select(nodeId) {
      selectedId = nodeId;
      for (const [id, element] of nodeElements) {
        element.classList.toggle("is-selected", id === nodeId);
      }
      for (const [, element] of edgeElements) {
        const active = nodeId !== null && (element.dataset.from === nodeId || element.dataset.to === nodeId);
        element.classList.toggle("is-active", active);
      }
      if (selectedId && nodeElements.has(selectedId)) {
        const node = (
          /** @type {DtoNode} */
          dto?.nodes.find((item) => item.id === selectedId)
        );
        onSelect(selectedId, node);
      }
    }
    function zoomToFit() {
      if (!dto || !viewport) {
        return;
      }
      const bounds = svg2.getBoundingClientRect();
      const padding = 48;
      const width = Math.max(1, dto.extent.width);
      const height = Math.max(1, dto.extent.height);
      const availableWidth = Math.max(120, bounds.width - padding * 2);
      const availableHeight = Math.max(120, bounds.height - padding * 2);
      scale = Math.min(1.4, availableWidth / width, availableHeight / height);
      scale = Math.max(0.15, scale);
      translateX = (bounds.width - width * scale) / 2;
      translateY = (bounds.height - height * scale) / 2;
      applyTransform();
    }
    function render(nextDto) {
      dto = nextDto;
      clear();
      if (!viewport) {
        return;
      }
      const byId = new Map(dto.nodes.map((node) => [node.id, node]));
      for (const edge of dto.edges) {
        const source = byId.get(edge.from);
        const target = byId.get(edge.to);
        if (!source || !target) {
          continue;
        }
        const path = (
          /** @type {SVGPathElement} */
          svgEl("path", {
            class: `cf-edge cf-edge--${edge.status} cf-edge--kind-${edge.kind ?? edge.type}`,
            d: edgePath(source, target),
            "data-from": edge.from,
            "data-to": edge.to,
            ...edge.dash ? { "stroke-dasharray": edge.dash } : {}
          })
        );
        path.dataset.from = edge.from;
        path.dataset.to = edge.to;
        const title = svgEl("title");
        title.textContent = `${edge.kind ?? edge.type} (${edge.status})${edge.reasonCode ? `: ${edge.reasonCode}` : ""}${edge.glyphHint ? ` ${edge.glyphHint}` : ""}`;
        path.appendChild(title);
        viewport.appendChild(path);
        edgeElements.set(edge.id, path);
        if (edge.label && edge.label.length > 0) {
          const from = nodePoint(source, "out");
          const to = nodePoint(target, "in");
          const label = svgEl("text", {
            class: "cf-edge-label",
            x: (from.x + to.x) / 2,
            y: (from.y + to.y) / 2 - 4,
            "text-anchor": "middle"
          });
          label.textContent = truncate(edge.label, 22);
          viewport.appendChild(label);
        }
      }
      for (const node of dto.nodes) {
        const group = (
          /** @type {SVGGElement} */
          svgEl("g", {
            class: `cf-node cf-node--${node.status} cf-node--kind-${node.kind}${node.external ? " cf-node--external" : ""}${node.unreachable ? " cf-node--unreachable" : ""}`,
            transform: `translate(${node.position.x} ${node.position.y})`,
            tabindex: "0",
            role: "button",
            "aria-label": `${node.kind} ${node.label}, ${node.status}${node.unreachable ? ", unreachable" : ""}${node.external ? ", external target" : ""}`
          })
        );
        group.appendChild(
          svgEl("rect", {
            class: "cf-node-box",
            width: node.position.width,
            height: node.position.height,
            rx: 6,
            ry: 6
          })
        );
        const lines = Array.isArray(node.labelLines) && node.labelLines.length > 0 ? node.labelLines.slice(0, 3) : [truncate(node.label, 26)];
        const lineHeight = 13;
        const blockHeight = lines.length * lineHeight;
        const label = svgEl("text", {
          class: "cf-node-label",
          x: 10,
          y: node.position.height / 2 - blockHeight / 2 + lineHeight - 3
        });
        for (const [index, text] of lines.entries()) {
          const span = svgEl("tspan", {
            x: 10,
            ...index === 0 ? {} : { dy: lineHeight }
          });
          span.textContent = text;
          label.appendChild(span);
        }
        group.appendChild(label);
        const kind = svgEl("text", {
          class: "cf-node-kind",
          x: 10,
          y: node.position.height - 8
        });
        kind.textContent = node.external ? `${node.kind} \xB7 external` : node.kind;
        group.appendChild(kind);
        const badgeText = Array.isArray(node.badges) && node.badges.length > 0 ? node.badges.join(" \xB7 ") : node.badge || (node.status !== "resolved" ? node.status : "");
        if (badgeText) {
          const badge = svgEl("text", {
            class: "cf-node-badge",
            x: node.position.width - 8,
            y: 13,
            "text-anchor": "end"
          });
          badge.textContent = truncate(badgeText, 24);
          group.appendChild(badge);
        }
        const title = svgEl("title");
        const callText = Array.isArray(node.calls) && node.calls.length > 0 ? `
calls: ${node.calls.map((call) => `${call.label} (${call.status})`).join(", ")}` : "";
        title.textContent = `${node.kind} ${node.label}
status: ${node.status}${node.range ? `
lines ${node.range.startLine + 1}-${node.range.endLine + 1}` : ""}${node.reasonCode ? `
reason: ${node.reasonCode}` : ""}${callText}`;
        group.appendChild(title);
        group.addEventListener("click", (event) => {
          event.stopPropagation();
          select(node.id);
        });
        group.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            select(node.id);
          }
        });
        viewport.appendChild(group);
        nodeElements.set(node.id, group);
      }
      zoomToFit();
    }
    function moveSelection(direction) {
      if (!dto || dto.nodes.length === 0) {
        return;
      }
      const current = selectedId ? dto.nodes.find((node) => node.id === selectedId) : null;
      if (!current) {
        const first = dto.nodes[0];
        select(first.id);
        nodeElements.get(first.id)?.focus();
        return;
      }
      const origin = {
        x: current.position.x + current.position.width / 2,
        y: current.position.y + current.position.height / 2
      };
      let best = null;
      let bestScore = Number.POSITIVE_INFINITY;
      for (const candidate of dto.nodes) {
        if (candidate.id === current.id) {
          continue;
        }
        const point = {
          x: candidate.position.x + candidate.position.width / 2,
          y: candidate.position.y + candidate.position.height / 2
        };
        const dx = point.x - origin.x;
        const dy = point.y - origin.y;
        const forward = direction === "ArrowRight" && dx > 8 || direction === "ArrowLeft" && dx < -8 || direction === "ArrowDown" && dy > 8 || direction === "ArrowUp" && dy < -8;
        if (!forward) {
          continue;
        }
        const primary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dx) : Math.abs(dy);
        const secondary = direction === "ArrowRight" || direction === "ArrowLeft" ? Math.abs(dy) : Math.abs(dx);
        const score = primary + secondary * 2.2;
        if (score < bestScore) {
          bestScore = score;
          best = candidate;
        }
      }
      if (best) {
        select(best.id);
        nodeElements.get(best.id)?.focus();
      }
    }
    svg2.addEventListener(
      "wheel",
      (event) => {
        if (!dto) {
          return;
        }
        event.preventDefault();
        const bounds = svg2.getBoundingClientRect();
        const pointerX = event.clientX - bounds.left;
        const pointerY = event.clientY - bounds.top;
        const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
        const nextScale = Math.min(3.5, Math.max(0.12, scale * factor));
        const ratio = nextScale / scale;
        translateX = pointerX - (pointerX - translateX) * ratio;
        translateY = pointerY - (pointerY - translateY) * ratio;
        scale = nextScale;
        applyTransform();
      },
      { passive: false }
    );
    svg2.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }
      dragging = true;
      dragStart = { x: event.clientX, y: event.clientY, tx: translateX, ty: translateY };
      svg2.setPointerCapture(event.pointerId);
    });
    svg2.addEventListener("pointermove", (event) => {
      if (!dragging) {
        return;
      }
      translateX = dragStart.tx + (event.clientX - dragStart.x);
      translateY = dragStart.ty + (event.clientY - dragStart.y);
      applyTransform();
    });
    const endDrag = (event) => {
      dragging = false;
      if (svg2.hasPointerCapture(event.pointerId)) {
        svg2.releasePointerCapture(event.pointerId);
      }
    };
    svg2.addEventListener("pointerup", endDrag);
    svg2.addEventListener("pointercancel", endDrag);
    svg2.addEventListener("click", () => {
      if (selectedId) {
        select(null);
      }
    });
    svg2.addEventListener("keydown", (event) => {
      if (event.key.startsWith("Arrow")) {
        event.preventDefault();
        moveSelection(event.key);
        return;
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        scale = Math.min(3.5, scale * 1.15);
        applyTransform();
        return;
      }
      if (event.key === "-") {
        event.preventDefault();
        scale = Math.max(0.12, scale / 1.15);
        applyTransform();
        return;
      }
      if (event.key === "0") {
        event.preventDefault();
        zoomToFit();
      }
    });
    return {
      render,
      select,
      zoomToFit,
      destroy() {
        clear();
        dto = null;
      }
    };
  }

  // src/webview/main.js
  var vscodeApi = acquireVsCodeApi();
  var svg = (
    /** @type {SVGSVGElement} */
    document.getElementById("cf-graph")
  );
  var meta = (
    /** @type {HTMLElement} */
    document.getElementById("cf-meta")
  );
  var status = (
    /** @type {HTMLElement} */
    document.getElementById("cf-status")
  );
  var banner = (
    /** @type {HTMLElement} */
    document.getElementById("cf-banner")
  );
  var empty = (
    /** @type {HTMLElement} */
    document.getElementById("cf-empty")
  );
  var detailBody = (
    /** @type {HTMLElement} */
    document.getElementById("cf-detail-body")
  );
  var legend = (
    /** @type {HTMLElement} */
    document.getElementById("cf-legend")
  );
  var reloadButton = (
    /** @type {HTMLButtonElement} */
    document.getElementById("cf-refresh")
  );
  var functionPicker = (
    /** @type {HTMLSelectElement|null} */
    document.getElementById("cf-function")
  );
  var currentDto = null;
  var preferredSymbolId = document.body.dataset.preferredSymbol || null;
  var selectedSymbolId = preferredSymbolId;
  var renderer = createSvgRenderer({
    svg,
    onSelect: (nodeId, node) => {
      showNodeDetails(nodeId, node);
      bridge.respond("node.select", { nodeId });
    }
  });
  var bridge = createBridge({
    post: (message) => vscodeApi.postMessage(message),
    inboundDirection: DIRECTIONS.HOST_TO_WEBVIEW,
    timeoutMs: 8e3,
    logger: {
      debug: () => {
      },
      warn: (message, fields) => console.warn("[codeflow]", message, fields),
      error: (message, fields) => console.error("[codeflow]", message, fields)
    }
  });
  function setBanner(message, isError = false) {
    if (!message) {
      banner.hidden = true;
      banner.textContent = "";
      return;
    }
    banner.hidden = false;
    banner.classList.toggle("is-error", isError);
    banner.textContent = message;
  }
  function setStatus(text) {
    status.textContent = text;
  }
  function clearDetail() {
    detailBody.replaceChildren();
    const paragraph = document.createElement("p");
    paragraph.className = "cf-muted";
    paragraph.textContent = "Select a node to inspect it.";
    detailBody.appendChild(paragraph);
  }
  function detailPair(label, value) {
    const term = document.createElement("dt");
    term.textContent = label;
    const description = document.createElement("dd");
    description.textContent = value;
    return [term, description];
  }
  function showNodeDetails(nodeId, node) {
    if (!nodeId || !node) {
      clearDetail();
      return;
    }
    const list = document.createElement("dl");
    list.append(...detailPair("label", node.label));
    list.append(...detailPair("kind", node.kind));
    list.append(...detailPair("status", node.status));
    if (node.external) {
      list.append(...detailPair("origin", "external target (not declared in the analysis)"));
    }
    if (node.range) {
      list.append(...detailPair("lines", `${node.range.startLine + 1}\u2013${node.range.endLine + 1}`));
      list.append(...detailPair("file", node.range.fileId));
    }
    if (node.badge) {
      list.append(...detailPair("note", node.badge));
    }
    if (node.isSynthetic) {
      list.append(...detailPair("origin", "synthetic structural node"));
    }
    if (node.unreachable) {
      list.append(...detailPair("reachability", "not reachable from entry"));
    }
    if (node.reasonCode) {
      list.append(...detailPair("reason", node.reasonCode));
    }
    if (Array.isArray(node.calls) && node.calls.length > 0) {
      list.append(
        ...detailPair(
          "calls",
          node.calls.map((call) => `${call.label} (${call.status})`).join(", ")
        )
      );
    }
    const edges = (currentDto?.edges ?? []).filter(
      (edge) => edge.from === nodeId || edge.to === nodeId
    );
    if (edges.length > 0) {
      list.append(...detailPair("relationships", String(edges.length)));
    }
    detailBody.replaceChildren(list);
    if (edges.length > 0) {
      const heading = document.createElement("h3");
      heading.className = "cf-detail-title";
      heading.textContent = "Relationships";
      detailBody.appendChild(heading);
      const edgeList = document.createElement("ul");
      edgeList.className = "cf-legend";
      for (const edge of edges.slice(0, 12)) {
        const item = document.createElement("li");
        const direction = edge.from === nodeId ? "\u2192" : "\u2190";
        const other = edge.from === nodeId ? edge.to : edge.from;
        item.textContent = `${direction} ${edge.type} \xB7 ${other} (${edge.status})`;
        edgeList.appendChild(item);
      }
      detailBody.appendChild(edgeList);
    }
  }
  function renderLegend(dto) {
    legend.replaceChildren();
    for (const statusName of dto.legend.statuses) {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = `cf-swatch cf-edge--${statusName}`;
      const label = document.createElement("span");
      label.textContent = statusName;
      if (statusName !== "resolved") {
        label.textContent = `${statusName} (pattern + label)`;
      }
      item.append(swatch, label);
      legend.appendChild(item);
    }
    for (const edgeKind of dto.legend.edgeKinds ?? []) {
      const item = document.createElement("li");
      const swatch = document.createElement("span");
      swatch.className = `cf-swatch cf-edge--kind-${edgeKind}`;
      const label = document.createElement("span");
      label.textContent = `edge: ${edgeKind}`;
      item.append(swatch, label);
      legend.appendChild(item);
    }
  }
  function renderFunctionPicker(list) {
    if (!functionPicker) {
      return;
    }
    functionPicker.replaceChildren();
    for (const entry of list) {
      const option = document.createElement("option");
      option.value = entry.symbolId;
      option.textContent = `${entry.qualifiedName} (${entry.kind})`;
      functionPicker.appendChild(option);
    }
    functionPicker.hidden = list.length <= 1;
    if (selectedSymbolId) {
      functionPicker.value = selectedSymbolId;
    }
  }
  function showCapabilities(payload) {
    const adapters = Array.isArray(payload.adapters) ? payload.adapters : [];
    const names = adapters.map((adapter) => adapter.id).join(", ") || "none";
    meta.textContent = `Mock data \xB7 adapters: ${names} \xB7 protocol v${payload.protocolVersion ?? "?"}`;
  }
  function handleGraph(payload) {
    const dtoCandidate = (
      /** @type {{dto?: unknown}} */
      payload.dto
    );
    const validation = validateDto(dtoCandidate);
    if (!validation.ok) {
      setBanner(`Invalid graph payload: ${validation.issues[0]}`, true);
      setStatus("Render failed");
      return;
    }
    const dto = validation.dto;
    currentDto = dto;
    empty.hidden = true;
    renderer.render(dto);
    renderLegend(dto);
    clearDetail();
    const subject = dto.dtoKind === "cfg" && dto.function ? `${dto.function.qualifiedName} \xB7 CFG` : "call graph";
    setStatus(
      `${subject} \xB7 ${dto.language} \xB7 ${dto.nodes.length} nodes \xB7 ${dto.edges.length} edges \xB7 ${dto.completeness}`
    );
    meta.textContent = `${dto.adapterId} \xB7 ${subject} \xB7 dto v${dto.dtoVersion}`;
    const degradations = dto.degradations ?? [];
    const messages = degradations.map(
      (entry) => typeof entry === "string" ? entry : `${entry.severity === "info" ? "" : `${entry.severity}: `}${entry.message}`
    );
    setBanner(messages.length > 0 ? messages.join(" \xB7 ") : "", false);
  }
  bridge.on("protocol.error", (payload) => {
    const code = typeof payload.code === "string" ? payload.code : "E_PROTOCOL";
    const message = typeof payload.message === "string" ? payload.message : "Unknown error.";
    setBanner(`${code}: ${message}`, true);
    setStatus("Error");
  });
  async function loadCfg(symbolId) {
    setStatus("Building control-flow graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("cfg.load", { symbolId });
      selectedSymbolId = symbolId;
      handleGraph(response.payload);
      return true;
    } catch (error) {
      setBanner(`Could not build CFG: ${error?.message ?? String(error)}`, true);
      setStatus("CFG unavailable");
      return false;
    }
  }
  async function loadGraph() {
    setStatus("Loading graph\u2026");
    setBanner("");
    try {
      const response = await bridge.request("cfg.functions", {});
      const list = Array.isArray(response.payload.functions) ? response.payload.functions : [];
      if (list.length > 0) {
        renderFunctionPicker(list);
        const retained = selectedSymbolId && list.some((entry) => entry.symbolId === selectedSymbolId) ? selectedSymbolId : list[0].symbolId;
        const loaded = await loadCfg(retained);
        if (loaded) {
          return;
        }
      }
    } catch {
    }
    try {
      const response = await bridge.request("graph.load", { demo: true });
      handleGraph(response.payload);
    } catch (error) {
      setBanner(`Could not load graph: ${error?.message ?? String(error)}`, true);
      setStatus("Load failed");
      empty.hidden = false;
    }
  }
  reloadButton.addEventListener("click", () => {
    void loadGraph();
  });
  functionPicker?.addEventListener("change", () => {
    const symbolId = functionPicker.value;
    if (symbolId) {
      void loadCfg(symbolId);
    }
  });
  window.addEventListener("error", (event) => {
    setBanner(`Webview error: ${event.message}`, true);
  });
  window.addEventListener("unhandledrejection", (event) => {
    setBanner(`Unhandled rejection: ${String(event.reason)}`, true);
  });
  async function boot() {
    try {
      const response = await bridge.request("webview.ready", {
        client: "webview",
        protocolVersion: PROTOCOL_VERSION
      });
      showCapabilities(response.payload);
    } catch {
    }
    await loadGraph();
  }
  void boot();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMiLCAiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2xheW91dC5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9jZmcva2luZHMuanMiLCAiLi4vLi4vc3JjL2NvcmUvZ3JhcGgvZHRvLmpzIiwgIi4uLy4uL3NyYy92aXN1YWxpemF0aW9uL3JlbmRlcmVyL3N2Z1JlbmRlcmVyLmpzIiwgIi4uLy4uL3NyYy93ZWJ2aWV3L21haW4uanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQ29kZUZsb3cgd2VidmlldyBwcm90b2NvbC5cbiAqXG4gKiBUaGUgZXh0ZW5zaW9uIGhvc3QgYW5kIHRoZSB3ZWJ2aWV3IGFyZSBzZXBhcmF0ZSBKYXZhU2NyaXB0IGNvbnRleHRzLiBFdmVyeVxuICogbWVzc2FnZSB0aGF0IGNyb3NzZXMgdGhhdCBib3VuZGFyeSBtdXN0IHBhc3MgdGhyb3VnaCB0aGlzIG1vZHVsZSBzbyB0aGF0IGFcbiAqIHNpbmdsZSwgdmVyc2lvbmVkIGNvbnRyYWN0IGRlY2lkZXMgd2hhdCBpcyBsZWdhbC5cbiAqXG4gKiBUaGlzIG1vZHVsZSBpcyBpbnRlbnRpb25hbGx5IGRlcGVuZGVuY3ktZnJlZTogaXQgaXMgYnVuZGxlZCBpbnRvIGJvdGggdGhlXG4gKiBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKi9cblxuZXhwb3J0IGNvbnN0IFBST1RPQ09MX1ZFUlNJT04gPSAxO1xuXG4vKiogSGFyZCBjZWlsaW5nIG9uIGEgc2VyaWFsaXplZCBtZXNzYWdlLiBMYXJnZXIgbWVzc2FnZXMgYXJlIHJlamVjdGVkLCBuZXZlciB0cnVuY2F0ZWQuICovXG5leHBvcnQgY29uc3QgTUFYX1BBWUxPQURfQllURVMgPSAxXzAwMF8wMDA7XG5cbi8qKiBgZG9tYWluLmFjdGlvbmAgaW4gbG93ZXIgY2FzZSwgYXQgbGVhc3QgdHdvIHNlZ21lbnRzLiAqL1xuZXhwb3J0IGNvbnN0IEtJTkRfUEFUVEVSTiA9IC9eW2Etel0rKFxcLlthLXpdKykrJC87XG5cbmV4cG9ydCBjb25zdCBSRVFVRVNUX0lEX1BBVFRFUk4gPSAvXltBLVphLXowLTlfLV17MSwxMjh9JC87XG5cbi8qKiBLaW5kcyBhIHdlYnZpZXcgbWF5IHNlbmQgdG8gdGhlIGhvc3QuICovXG5leHBvcnQgY29uc3QgV0VCVklFV19UT19IT1NUID0gT2JqZWN0LmZyZWV6ZShbXG4gICd3ZWJ2aWV3LnJlYWR5JyxcbiAgJ2dyYXBoLmxvYWQnLFxuICAnY3NyLmxvYWQnLFxuICAnbm9kZS5zZWxlY3QnLFxuICAncGFuZWwucGluZycsXG4gICdxdWVyeS5zeW1ib2wnLFxuICAncXVlcnkuc3ltYm9scycsXG4gICdxdWVyeS5jYWxsZXJzJyxcbiAgJ3F1ZXJ5LmNhbGxlZXMnLFxuICAncXVlcnkuY29uc3RydWN0cycsXG4gICdxdWVyeS5jYXBhYmlsaXRpZXMnLFxuICAnY2ZnLmZ1bmN0aW9ucycsXG4gICdjZmcubG9hZCcsXG5dKTtcblxuLyoqIEtpbmRzIHRoZSBob3N0IG1heSBzZW5kIHRvIHRoZSB3ZWJ2aWV3LiAqL1xuZXhwb3J0IGNvbnN0IEhPU1RfVE9fV0VCVklFVyA9IE9iamVjdC5mcmVlemUoW1xuICAnZ3JhcGguZGF0YScsXG4gICdjYXBhYmlsaXRpZXMuZGF0YScsXG4gICdjc3IuZGF0YScsXG4gICdxdWVyeS5kYXRhJyxcbiAgJ2FuYWx5c2lzLnByb2dyZXNzJyxcbiAgJ3Byb3RvY29sLmVycm9yJyxcbiAgJ3Byb3RvY29sLmFjaycsXG4gICdwYW5lbC5wb25nJyxcbiAgJ2NmZy5mdW5jdGlvbnMnLFxuICAnY2ZnLmRhdGEnLFxuXSk7XG5cbmV4cG9ydCBjb25zdCBESVJFQ1RJT05TID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFdFQlZJRVdfVE9fSE9TVDogJ3dlYnZpZXdfdG9faG9zdCcsXG4gIEhPU1RfVE9fV0VCVklFVzogJ2hvc3RfdG9fd2VidmlldycsXG59KTtcblxuY29uc3QgS0lORF9BTExPV0xJU1QgPSBPYmplY3QuZnJlZXplKHtcbiAgW0RJUkVDVElPTlMuV0VCVklFV19UT19IT1NUXTogbmV3IFNldChXRUJWSUVXX1RPX0hPU1QpLFxuICBbRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVddOiBuZXcgU2V0KEhPU1RfVE9fV0VCVklFVyksXG59KTtcblxuY29uc3QgVU5TQUZFX0tFWVMgPSBuZXcgU2V0KFsnX19wcm90b19fJywgJ2NvbnN0cnVjdG9yJywgJ3Byb3RvdHlwZSddKTtcblxuY29uc3QgTUFYX0tFWV9TQ0FOX0RFUFRIID0gODtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBFbnZlbG9wZVxuICogQHByb3BlcnR5IHtudW1iZXJ9IHByb3RvY29sVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHByb3BlcnR5IHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvblN1Y2Nlc3NcbiAqIEBwcm9wZXJ0eSB7dHJ1ZX0gb2tcbiAqIEBwcm9wZXJ0eSB7RW52ZWxvcGV9IGVudmVsb3BlXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBWYWxpZGF0aW9uRmFpbHVyZVxuICogQHByb3BlcnR5IHtmYWxzZX0gb2tcbiAqIEBwcm9wZXJ0eSB7J0VfUFJPVE9DT0wnfCdFX0xJTUlUJ30gY29kZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IHJlYXNvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcGF0aF1cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICovXG5cbi8qKlxuICogQnVpbGQgYSB3ZWxsLWZvcm1lZCBlbnZlbG9wZS4gUHJvZHVjZXJzIHNob3VsZCB1c2UgdGhpcyBpbnN0ZWFkIG9mIHdyaXRpbmdcbiAqIG9iamVjdCBsaXRlcmFscyBzbyB0aGF0IHRoZSB2ZXJzaW9uIGZpZWxkIGNhbiBuZXZlciBiZSBmb3Jnb3R0ZW4uXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtwYXlsb2FkXVxuICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0SWRdXG4gKiBAcmV0dXJucyB7RW52ZWxvcGV9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpIHtcbiAgLyoqIEB0eXBlIHtFbnZlbG9wZX0gKi9cbiAgY29uc3QgZW52ZWxvcGUgPSB7XG4gICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIGtpbmQsXG4gICAgcGF5bG9hZDogcGF5bG9hZCA/PyB7fSxcbiAgfTtcbiAgaWYgKHJlcXVlc3RJZCkge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuICByZXR1cm4gZW52ZWxvcGU7XG59XG5cbi8qKlxuICogQnVpbGQgYSB0eXBlZCBlcnJvciBwYXlsb2FkLiBgZGV0YWlsYCBtdXN0IG5ldmVyIGNvbnRhaW4gc291cmNlIHRleHQuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICogQHJldHVybnMge1JlY29yZDxzdHJpbmcsIHVua25vd24+fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRXJyb3JQYXlsb2FkKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqL1xuICBjb25zdCBwYXlsb2FkID0geyBjb2RlLCBtZXNzYWdlIH07XG4gIGlmIChkZXRhaWwpIHtcbiAgICBwYXlsb2FkLmRldGFpbCA9IGRldGFpbDtcbiAgfVxuICByZXR1cm4gcGF5bG9hZDtcbn1cblxuLyoqXG4gKiBBcHByb3hpbWF0ZSBzZXJpYWxpemVkIHNpemUgb2YgYSBtZXNzYWdlLiBVc2VkIGZvciBsaW1pdCBlbmZvcmNlbWVudDsgdGhlXG4gKiBleGFjdCBieXRlcyBkbyBub3QgbWF0dGVyLCBvbmx5IHRoYXQgb3ZlcnNpemVkIG1lc3NhZ2VzIGFyZSByZWZ1c2VkIGJlZm9yZVxuICogdGhleSBhcmUgcG9zdGVkLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtudW1iZXJ9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBtZXNzYWdlU2l6ZSh2YWx1ZSkge1xuICB0cnkge1xuICAgIGNvbnN0IGpzb24gPSBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgcmV0dXJuIHR5cGVvZiBqc29uID09PSAnc3RyaW5nJyA/IGpzb24ubGVuZ3RoIDogMDtcbiAgfSBjYXRjaCB7XG4gICAgcmV0dXJuIE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHt2YWx1ZSBpcyBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZnVuY3Rpb24gaXNQbGFpbk9iamVjdCh2YWx1ZSkge1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnb2JqZWN0JyAmJiB2YWx1ZSAhPT0gbnVsbCAmJiAhQXJyYXkuaXNBcnJheSh2YWx1ZSk7XG59XG5cbi8qKlxuICogUmVqZWN0IHBheWxvYWRzIHRoYXQgY291bGQgcG9pc29uIHByb3RvdHlwZXMgd2hlbiBtZXJnZWQgb3Igc3ByZWFkLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEBwYXJhbSB7c3RyaW5nfSBwYXRoXG4gKiBAcGFyYW0ge251bWJlcn0gZGVwdGhcbiAqIEByZXR1cm5zIHt7b2s6IHRydWV9IHwge29rOiBmYWxzZSwgcGF0aDogc3RyaW5nLCBrZXk6IHN0cmluZ319XG4gKi9cbmZ1bmN0aW9uIHNjYW5VbnNhZmVLZXlzKHZhbHVlLCBwYXRoLCBkZXB0aCkge1xuICBpZiAoZGVwdGggPiBNQVhfS0VZX1NDQU5fREVQVEggfHwgdmFsdWUgPT09IG51bGwgfHwgdHlwZW9mIHZhbHVlICE9PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gIH1cbiAgY29uc3QgZW50cmllcyA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gdmFsdWUuZW50cmllcygpIDogT2JqZWN0LmVudHJpZXModmFsdWUpO1xuICBmb3IgKGNvbnN0IFtrZXksIGNoaWxkXSBvZiBlbnRyaWVzKSB7XG4gICAgY29uc3QgY2hpbGRQYXRoID0gQXJyYXkuaXNBcnJheSh2YWx1ZSkgPyBgJHtwYXRofVske2tleX1dYCA6IGAke3BhdGh9LiR7a2V5fWA7XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHZhbHVlKSAmJiBVTlNBRkVfS0VZUy5oYXMoU3RyaW5nKGtleSkpKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIHBhdGg6IGNoaWxkUGF0aCwga2V5OiBTdHJpbmcoa2V5KSB9O1xuICAgIH1cbiAgICBjb25zdCBuZXN0ZWQgPSBzY2FuVW5zYWZlS2V5cyhjaGlsZCwgY2hpbGRQYXRoLCBkZXB0aCArIDEpO1xuICAgIGlmICghbmVzdGVkLm9rKSB7XG4gICAgICByZXR1cm4gbmVzdGVkO1xuICAgIH1cbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSB9O1xufVxuXG4vKipcbiAqIFZhbGlkYXRlIGFuIGluYm91bmQgbWVzc2FnZSBhZ2FpbnN0IHRoZSBwcm90b2NvbCBjb250cmFjdC5cbiAqXG4gKiBWYWxpZGF0aW9uIGlzIHRvdGFsOiBldmVyeSByZWplY3Rpb24gcmV0dXJucyBhIHR5cGVkIGZhaWx1cmUgd2l0aCBhIHN0YWJsZVxuICogcmVhc29uIGNvZGUsIGFuZCBuZXZlciB0aHJvd3MuXG4gKlxuICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAqIEBwYXJhbSB7e2RpcmVjdGlvbjogJ3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J319IG9wdGlvbnNcbiAqIEByZXR1cm5zIHtWYWxpZGF0aW9uU3VjY2VzcyB8IFZhbGlkYXRpb25GYWlsdXJlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVFbnZlbG9wZShyYXcsIG9wdGlvbnMpIHtcbiAgY29uc3QgZGlyZWN0aW9uID0gb3B0aW9ucz8uZGlyZWN0aW9uO1xuICBjb25zdCBhbGxvd2xpc3QgPSBLSU5EX0FMTE9XTElTVFtkaXJlY3Rpb25dO1xuICBpZiAoIWFsbG93bGlzdCkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bmtub3duX2RpcmVjdGlvbicsXG4gICAgICBtZXNzYWdlOiBgVW5rbm93biBwcm90b2NvbCBkaXJlY3Rpb246ICR7U3RyaW5nKGRpcmVjdGlvbil9YCxcbiAgICB9O1xuICB9XG5cbiAgaWYgKCFpc1BsYWluT2JqZWN0KHJhdykpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnbm90X2FuX29iamVjdCcsXG4gICAgICBtZXNzYWdlOiAnTWVzc2FnZSBtdXN0IGJlIGEgcGxhaW4gb2JqZWN0LicsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChyYXcpO1xuXG4gIGlmIChjYW5kaWRhdGUucHJvdG9jb2xWZXJzaW9uICE9PSBQUk9UT0NPTF9WRVJTSU9OKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ3ZlcnNpb25fbWlzbWF0Y2gnLFxuICAgICAgbWVzc2FnZTogYFVuc3VwcG9ydGVkIHByb3RvY29sIHZlcnNpb246IGV4cGVjdGVkICR7UFJPVE9DT0xfVkVSU0lPTn0sIHJlY2VpdmVkICR7U3RyaW5nKFxuICAgICAgICBjYW5kaWRhdGUucHJvdG9jb2xWZXJzaW9uLFxuICAgICAgKX0uYCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qga2luZCA9IGNhbmRpZGF0ZS5raW5kO1xuICBpZiAodHlwZW9mIGtpbmQgIT09ICdzdHJpbmcnIHx8ICFLSU5EX1BBVFRFUk4udGVzdChraW5kKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdpbnZhbGlkX2tpbmQnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2Uga2luZCBtdXN0IGxvb2sgbGlrZSBcImRvbWFpbi5hY3Rpb25cIiBpbiBsb3dlciBjYXNlLicsXG4gICAgICBwYXRoOiAna2luZCcsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghYWxsb3dsaXN0LmhhcyhraW5kKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bmtub3duX2tpbmQnLFxuICAgICAgbWVzc2FnZTogYEtpbmQgXCIke2tpbmR9XCIgaXMgbm90IGFjY2VwdGVkIGluIGRpcmVjdGlvbiBcIiR7ZGlyZWN0aW9ufVwiLmAsXG4gICAgICBwYXRoOiAna2luZCcsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IHJlcXVlc3RJZCA9IGNhbmRpZGF0ZS5yZXF1ZXN0SWQ7XG4gIGlmIChyZXF1ZXN0SWQgIT09IHVuZGVmaW5lZCkge1xuICAgIGlmICh0eXBlb2YgcmVxdWVzdElkICE9PSAnc3RyaW5nJyB8fCAhUkVRVUVTVF9JRF9QQVRURVJOLnRlc3QocmVxdWVzdElkKSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgb2s6IGZhbHNlLFxuICAgICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICAgIHJlYXNvbjogJ2ludmFsaWRfcmVxdWVzdF9pZCcsXG4gICAgICAgIG1lc3NhZ2U6ICdyZXF1ZXN0SWQgbXVzdCBiZSAxLTEyOCBjaGFyYWN0ZXJzIG9mIEEtWiwgYS16LCAwLTksIFwiX1wiIG9yIFwiLVwiLicsXG4gICAgICAgIHBhdGg6ICdyZXF1ZXN0SWQnLFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBwYXlsb2FkID0gY2FuZGlkYXRlLnBheWxvYWQgPz8ge307XG4gIGlmICghaXNQbGFpbk9iamVjdChwYXlsb2FkKSkge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICdpbnZhbGlkX3BheWxvYWQnLFxuICAgICAgbWVzc2FnZTogJ3BheWxvYWQgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgICAgcGF0aDogJ3BheWxvYWQnLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgY29uc3Qga2V5U2NhbiA9IHNjYW5VbnNhZmVLZXlzKHBheWxvYWQsICdwYXlsb2FkJywgMCk7XG4gIGlmICgha2V5U2Nhbi5vaykge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd1bnNhZmVfa2V5JyxcbiAgICAgIG1lc3NhZ2U6IGBQYXlsb2FkIGNvbnRhaW5zIGEgZm9yYmlkZGVuIGtleSBcIiR7a2V5U2Nhbi5rZXl9XCIuYCxcbiAgICAgIHBhdGg6IGtleVNjYW4ucGF0aCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGlmIChtZXNzYWdlU2l6ZShjYW5kaWRhdGUpID4gTUFYX1BBWUxPQURfQllURVMpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfTElNSVQnLFxuICAgICAgcmVhc29uOiAncGF5bG9hZF90b29fbGFyZ2UnLFxuICAgICAgbWVzc2FnZTogYE1lc3NhZ2UgZXhjZWVkcyB0aGUgJHtNQVhfUEFZTE9BRF9CWVRFU30gYnl0ZSBsaW1pdC5gLFxuICAgICAgcmVxdWVzdElkOiB0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJyA/IHJlcXVlc3RJZCA6IHVuZGVmaW5lZCxcbiAgICB9O1xuICB9XG5cbiAgLyoqIEB0eXBlIHtFbnZlbG9wZX0gKi9cbiAgY29uc3QgZW52ZWxvcGUgPSB7XG4gICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIGtpbmQsXG4gICAgcGF5bG9hZCxcbiAgfTtcbiAgaWYgKHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnKSB7XG4gICAgZW52ZWxvcGUucmVxdWVzdElkID0gcmVxdWVzdElkO1xuICB9XG5cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGVudmVsb3BlIH07XG59XG4iLCAiLyoqXG4gKiBXZWJ2aWV3IG1lc3NhZ2UgYnJpZGdlLlxuICpcbiAqIFN5bW1ldHJpYyBpbXBsZW1lbnRhdGlvbiB1c2VkIGJ5IGJvdGggdGhlIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2Vidmlldy5cbiAqIFJlc3BvbnNpYmlsaXRpZXM6XG4gKiAtIFZhbGlkYXRlIGV2ZXJ5IGluYm91bmQgbWVzc2FnZSBiZWZvcmUgYW55IGhhbmRsZXIgc2VlcyBpdC5cbiAqIC0gQ29ycmVsYXRlIHJlcXVlc3RzIHdpdGggcmVzcG9uc2VzLCB3aXRoIGEgdGltZW91dCBwZXIgcmVxdWVzdC5cbiAqIC0gQ29udGFpbiBoYW5kbGVyIGZhaWx1cmVzIGFuZCByZXBvcnQgdGhlbSBhcyB0eXBlZCBwcm90b2NvbCBlcnJvcnMuXG4gKiAtIFJlamVjdCB3b3JrIGFmdGVyIGRpc3Bvc2FsIHNvIGEgY2xvc2VkIHBhbmVsIGNhbm5vdCBsZWFrIHRpbWVycy5cbiAqXG4gKiBUaGUgYnJpZGdlIGhhcyBubyBkZXBlbmRlbmN5IG9uIHRoZSBgdnNjb2RlYCBtb2R1bGU6IHRoZSB0cmFuc3BvcnQgKGBwb3N0YClcbiAqIGlzIGluamVjdGVkLiBUaGF0IG1ha2VzIHRoZSB3aG9sZSByZXF1ZXN0L3Jlc3BvbnNlIGNvbnRyYWN0IHVuaXQtdGVzdGFibGUgaW5cbiAqIHBsYWluIE5vZGUuXG4gKi9cblxuaW1wb3J0IHtcbiAgRElSRUNUSU9OUyxcbiAgSE9TVF9UT19XRUJWSUVXLFxuICBXRUJWSUVXX1RPX0hPU1QsXG4gIGNyZWF0ZUVudmVsb3BlLFxuICBjcmVhdGVFcnJvclBheWxvYWQsXG4gIG1lc3NhZ2VTaXplLFxuICB2YWxpZGF0ZUVudmVsb3BlLFxufSBmcm9tICcuL2VudmVsb3BlLmpzJztcblxuZXhwb3J0IGNsYXNzIFByb3RvY29sRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICAgKi9cbiAgY29uc3RydWN0b3IoY29kZSwgbWVzc2FnZSwgZGV0YWlsKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gJ1Byb3RvY29sRXJyb3InO1xuICAgIHRoaXMuY29kZSA9IGNvZGU7XG4gICAgaWYgKGRldGFpbCkge1xuICAgICAgdGhpcy5kZXRhaWwgPSBkZXRhaWw7XG4gICAgfVxuICB9XG59XG5cbi8qKiBAdHlwZSB7e2RlYnVnOiBGdW5jdGlvbiwgd2FybjogRnVuY3Rpb24sIGVycm9yOiBGdW5jdGlvbn19ICovXG5jb25zdCBOT09QX0xPR0dFUiA9IHtcbiAgZGVidWcoKSB7fSxcbiAgd2FybigpIHt9LFxuICBlcnJvcigpIHt9LFxufTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBCcmlkZ2VPcHRpb25zXG4gKiBAcHJvcGVydHkgeyhtZXNzYWdlOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPikgPT4gdm9pZH0gcG9zdCAgVHJhbnNwb3J0IHRvIHRoZSBvdGhlciBzaWRlLlxuICogQHByb3BlcnR5IHsnd2Vidmlld190b19ob3N0JyB8ICdob3N0X3RvX3dlYnZpZXcnfSBpbmJvdW5kRGlyZWN0aW9uXG4gKiBAcHJvcGVydHkge251bWJlcn0gW3RpbWVvdXRNc11cbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBbbWF4SW5GbGlnaHRdXG4gKiBAcHJvcGVydHkgeygpID0+IHN0cmluZ30gW2NyZWF0ZVJlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7dHlwZW9mIE5PT1BfTE9HR0VSfSBbbG9nZ2VyXVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtCcmlkZ2VPcHRpb25zfSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVCcmlkZ2Uob3B0aW9ucykge1xuICBjb25zdCB7IHBvc3QsIGluYm91bmREaXJlY3Rpb24sIGxvZ2dlciA9IE5PT1BfTE9HR0VSIH0gPSBvcHRpb25zO1xuICBjb25zdCB0aW1lb3V0TXMgPSBvcHRpb25zLnRpbWVvdXRNcyA/PyA1MDAwO1xuICBjb25zdCBtYXhJbkZsaWdodCA9IG9wdGlvbnMubWF4SW5GbGlnaHQgPz8gMzI7XG4gIGNvbnN0IG91dGJvdW5kRGlyZWN0aW9uID1cbiAgICBpbmJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVFxuICAgICAgPyBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFV1xuICAgICAgOiBESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVDtcbiAgY29uc3Qgb3V0Ym91bmRLaW5kcyA9IG5ldyBTZXQoXG4gICAgb3V0Ym91bmREaXJlY3Rpb24gPT09IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXID8gSE9TVF9UT19XRUJWSUVXIDogV0VCVklFV19UT19IT1NULFxuICApO1xuXG4gIGxldCBzZXF1ZW5jZSA9IDA7XG4gIGNvbnN0IGNyZWF0ZVJlcXVlc3RJZCA9XG4gICAgb3B0aW9ucy5jcmVhdGVSZXF1ZXN0SWQgPz9cbiAgICAoKCkgPT4ge1xuICAgICAgc2VxdWVuY2UgKz0gMTtcbiAgICAgIHJldHVybiBgciR7c2VxdWVuY2UudG9TdHJpbmcoMzYpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMzYpLnNsaWNlKDIsIDEwKX1gO1xuICAgIH0pO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywge3Jlc29sdmU6IEZ1bmN0aW9uLCByZWplY3Q6IEZ1bmN0aW9uLCB0aW1lcjogUmV0dXJuVHlwZTx0eXBlb2Ygc2V0VGltZW91dD59Pn0gKi9cbiAgY29uc3QgcGVuZGluZyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCAocGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIG1ldGE6IHtyZXF1ZXN0SWQ/OiBzdHJpbmd9KSA9PiB1bmtub3duPn0gKi9cbiAgY29uc3QgaGFuZGxlcnMgPSBuZXcgTWFwKCk7XG4gIGNvbnN0IHJlcG9ydGVkS2luZHMgPSBuZXcgU2V0KCk7XG4gIGxldCBkaXNwb3NlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBwYXlsb2FkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICAgKi9cbiAgZnVuY3Rpb24gc2VuZChraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsICdCcmlkZ2UgaXMgZGlzcG9zZWQuJyk7XG4gICAgfVxuICAgIGlmICghb3V0Ym91bmRLaW5kcy5oYXMoa2luZCkpIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX1BST1RPQ09MJywgYEtpbmQgXCIke2tpbmR9XCIgaXMgbm90IHNlbmRhYmxlIGluIHRoaXMgZGlyZWN0aW9uLmApO1xuICAgIH1cbiAgICBjb25zdCBlbnZlbG9wZSA9IGNyZWF0ZUVudmVsb3BlKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCk7XG4gICAgaWYgKG1lc3NhZ2VTaXplKGVudmVsb3BlKSA+IDFfMDAwXzAwMCkge1xuICAgICAgdGhyb3cgbmV3IFByb3RvY29sRXJyb3IoJ0VfTElNSVQnLCAnUmVmdXNpbmcgdG8gc2VuZCBhbiBvdmVyc2l6ZWQgbWVzc2FnZS4nKTtcbiAgICB9XG4gICAgcG9zdChlbnZlbG9wZSk7XG4gICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC5zZW5kJywge1xuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwsXG4gICAgICBieXRlczogbWVzc2FnZVNpemUoZW52ZWxvcGUpLFxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbZGV0YWlsXVxuICAgKi9cbiAgZnVuY3Rpb24gc2VuZEVycm9yKGNvZGUsIG1lc3NhZ2UsIHJlcXVlc3RJZCwgZGV0YWlsKSB7XG4gICAgdHJ5IHtcbiAgICAgIHNlbmQoJ3Byb3RvY29sLmVycm9yJywgY3JlYXRlRXJyb3JQYXlsb2FkKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCksIHJlcXVlc3RJZCk7XG4gICAgfSBjYXRjaCB7XG4gICAgICAvLyBUaGUgcGFuZWwgbWF5IGFscmVhZHkgYmUgZ29uZS4gTm90aGluZyB1c2VmdWwgcmVtYWlucyB0byBkby5cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHsocGF5bG9hZDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sIG1ldGE6IHtyZXF1ZXN0SWQ/OiBzdHJpbmd9KSA9PiB1bmtub3dufSBoYW5kbGVyXG4gICAqIEByZXR1cm5zIHsoKSA9PiB2b2lkfSB1bnN1YnNjcmliZVxuICAgKi9cbiAgZnVuY3Rpb24gb24oa2luZCwgaGFuZGxlcikge1xuICAgIGhhbmRsZXJzLnNldChraW5kLCBoYW5kbGVyKTtcbiAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgaWYgKGhhbmRsZXJzLmdldChraW5kKSA9PT0gaGFuZGxlcikge1xuICAgICAgICBoYW5kbGVycy5kZWxldGUoa2luZCk7XG4gICAgICB9XG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZW5kIGEgcmVxdWVzdCBhbmQgYXdhaXQgdGhlIGNvcnJlbGF0ZWQgcmVzcG9uc2UuXG4gICAqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IFtwYXlsb2FkXVxuICAgKiBAcGFyYW0ge3t0aW1lb3V0TXM/OiBudW1iZXJ9fSBbcmVxdWVzdE9wdGlvbnNdXG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtraW5kOiBzdHJpbmcsIHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+fT59XG4gICAqL1xuICBmdW5jdGlvbiByZXF1ZXN0KGtpbmQsIHBheWxvYWQgPSB7fSwgcmVxdWVzdE9wdGlvbnMgPSB7fSkge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsICdCcmlkZ2UgaXMgZGlzcG9zZWQuJykpO1xuICAgIH1cbiAgICBpZiAocGVuZGluZy5zaXplID49IG1heEluRmxpZ2h0KSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoXG4gICAgICAgIG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgYFRvbyBtYW55IGluLWZsaWdodCByZXF1ZXN0cyAoJHttYXhJbkZsaWdodH0pLmApLFxuICAgICAgKTtcbiAgICB9XG4gICAgY29uc3QgcmVxdWVzdElkID0gY3JlYXRlUmVxdWVzdElkKCk7XG4gICAgY29uc3QgZWZmZWN0aXZlVGltZW91dCA9IHJlcXVlc3RPcHRpb25zLnRpbWVvdXRNcyA/PyB0aW1lb3V0TXM7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KFxuICAgICAgICAgIG5ldyBQcm90b2NvbEVycm9yKFxuICAgICAgICAgICAgJ0VfVElNRU9VVCcsXG4gICAgICAgICAgICBgTm8gcmVzcG9uc2UgdG8gXCIke2tpbmR9XCIgd2l0aGluICR7ZWZmZWN0aXZlVGltZW91dH0gbXMuYCxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAga2luZCxcbiAgICAgICAgICAgICAgcmVxdWVzdElkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICApLFxuICAgICAgICApO1xuICAgICAgfSwgZWZmZWN0aXZlVGltZW91dCk7XG4gICAgICBwZW5kaW5nLnNldChyZXF1ZXN0SWQsIHsgcmVzb2x2ZSwgcmVqZWN0LCB0aW1lciB9KTtcbiAgICAgIHRyeSB7XG4gICAgICAgIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKTtcbiAgICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICAgIGNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChlcnJvcik7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHt1bmtub3dufSByYXdcbiAgICogQHJldHVybnMge1Byb21pc2U8e29rOiBib29sZWFuLCBjb2RlPzogc3RyaW5nLCByZWFzb24/OiBzdHJpbmd9Pn1cbiAgICovXG4gIGFzeW5jIGZ1bmN0aW9uIGhhbmRsZU1lc3NhZ2UocmF3KSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6ICdFX0NBTkNFTExFRCcsIHJlYXNvbjogJ2Rpc3Bvc2VkJyB9O1xuICAgIH1cblxuICAgIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUVudmVsb3BlKHJhdywgeyBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24gfSk7XG4gICAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgICBpZiAoIXJlcG9ydGVkS2luZHMuaGFzKHZhbGlkYXRpb24ucmVhc29uKSkge1xuICAgICAgICByZXBvcnRlZEtpbmRzLmFkZCh2YWxpZGF0aW9uLnJlYXNvbik7XG4gICAgICAgIGxvZ2dlci53YXJuKCdwcm90b2NvbC5yZWplY3RlZCcsIHtcbiAgICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgICAgIHBhdGg6IHZhbGlkYXRpb24ucGF0aCA/PyBudWxsLFxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHNlbmRFcnJvcih2YWxpZGF0aW9uLmNvZGUsIHZhbGlkYXRpb24ubWVzc2FnZSwgdmFsaWRhdGlvbi5yZXF1ZXN0SWQsIHtcbiAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiB2YWxpZGF0aW9uLmNvZGUsIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24gfTtcbiAgICB9XG5cbiAgICBjb25zdCBlbnZlbG9wZSA9IHZhbGlkYXRpb24uZW52ZWxvcGU7XG4gICAgY29uc3QgeyBraW5kLCByZXF1ZXN0SWQsIHBheWxvYWQgfSA9IGVudmVsb3BlO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wucmVjZWl2ZScsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcblxuICAgIGlmIChraW5kID09PSAncHJvdG9jb2wuZXJyb3InKSB7XG4gICAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgICAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICAgICAgICAgIGNvbnN0IG1lc3NhZ2UgPVxuICAgICAgICAgICAgdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZydcbiAgICAgICAgICAgICAgPyBwYXlsb2FkLm1lc3NhZ2VcbiAgICAgICAgICAgICAgOiAnVGhlIG90aGVyIHNpZGUgcmVwb3J0ZWQgYW4gZXJyb3IuJztcbiAgICAgICAgICBlbnRyeS5yZWplY3QobmV3IFByb3RvY29sRXJyb3IoY29kZSwgbWVzc2FnZSwgeyByZXF1ZXN0SWQgfSkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgY29uc3QgZW50cnkgPSBwZW5kaW5nLmdldChyZXF1ZXN0SWQpO1xuICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIGVudHJ5LnJlc29sdmUoeyBraW5kLCBwYXlsb2FkIH0pO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBjb25zdCBoYW5kbGVyID0gaGFuZGxlcnMuZ2V0KGtpbmQpO1xuICAgIGlmICghaGFuZGxlcikge1xuICAgICAgLy8gQSByZXNwb25zZSB3aG9zZSByZXF1ZXN0IGFscmVhZHkgdGltZWQgb3V0IGlzIGV4cGVjdGVkIGFuZCBoYXJtbGVzcy5cbiAgICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wudW5oYW5kbGVkJywgeyBraW5kLCByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICB0cnkge1xuICAgICAgYXdhaXQgaGFuZGxlcihwYXlsb2FkLCB7IHJlcXVlc3RJZCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgIGNvbnN0IG1lc3NhZ2UgPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgICBjb25zdCBjb2RlID1cbiAgICAgICAgZXJyb3IgaW5zdGFuY2VvZiBQcm90b2NvbEVycm9yXG4gICAgICAgICAgPyBlcnJvci5jb2RlXG4gICAgICAgICAgOiAoLyoqIEB0eXBlIHt7Y29kZT86IHN0cmluZ319ICovIChlcnJvcik/LmNvZGUgPz8gJ0VfUFJPVE9DT0wnKTtcbiAgICAgIGxvZ2dlci5lcnJvcigncHJvdG9jb2wuaGFuZGxlcl9mYWlsZWQnLCB7IGtpbmQsIGVycm9yOiBtZXNzYWdlIH0pO1xuICAgICAgc2VuZEVycm9yKGNvZGUsIG1lc3NhZ2UsIHJlcXVlc3RJZCk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGUgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlYXNvblxuICAgKi9cbiAgZnVuY3Rpb24gZGlzcG9zZShyZWFzb24gPSAnZGlzcG9zZWQnKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRpc3Bvc2VkID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IFssIGVudHJ5XSBvZiBwZW5kaW5nKSB7XG4gICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsIGBCcmlkZ2UgY2xvc2VkOiAke3JlYXNvbn1gKSk7XG4gICAgfVxuICAgIHBlbmRpbmcuY2xlYXIoKTtcbiAgICBoYW5kbGVycy5jbGVhcigpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbixcbiAgICByZXF1ZXN0LFxuICAgIHJlc3BvbmQ6IHNlbmQsXG4gICAgaGFuZGxlTWVzc2FnZSxcbiAgICBkaXNwb3NlLFxuICAgIHBlbmRpbmdDb3VudDogKCkgPT4gcGVuZGluZy5zaXplLFxuICAgIGlzRGlzcG9zZWQ6ICgpID0+IGRpc3Bvc2VkLFxuICAgIGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbixcbiAgfTtcbn1cbiIsICIvKipcbiAqIERldGVybWluaXN0aWMgbGF5ZXJlZCBsYXlvdXQuXG4gKlxuICogUGhhc2UgMCBuZWVkcyBwb3NpdGlvbnMgc28gdGhlIHdlYnZpZXcgY2FuIGRyYXcgc29tZXRoaW5nIHdpdGhvdXQgb3duaW5nIGFcbiAqIGxheW91dCBhbGdvcml0aG0uIFBoYXNlIDQgYmVuY2htYXJrcyByZWFsIGVuZ2luZXMgKEN5dG9zY2FwZS9FTEsvZGFncmUpIGFuZFxuICogcmVwbGFjZXMgdGhpcyBiZWhpbmQgdGhlIHJlbmRlcmVyIGJvdW5kYXJ5OyB1bnRpbCB0aGVuLCBkZXRlcm1pbmlzdGljIG91dHB1dFxuICogaXMgbW9yZSB2YWx1YWJsZSB0aGFuIHByZXR0eSBvdXRwdXQgYmVjYXVzZSBpdCBtYWtlcyB0ZXN0cyBzdGFibGUuXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IFBvc2l0aW9uXG4gKi9cblxuZXhwb3J0IGNvbnN0IExBWU9VVF9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBub2RlV2lkdGg6IDE5MCxcbiAgbm9kZUhlaWdodDogNTQsXG4gIGhvcml6b250YWxHYXA6IDkwLFxuICB2ZXJ0aWNhbEdhcDogMjYsXG4gIG1heExheWVyczogNDAsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHBhcmFtIHtQYXJ0aWFsPHR5cGVvZiBMQVlPVVRfREVGQVVMVFM+fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7cG9zaXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBQb3NpdGlvbj4sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcnM6IHN0cmluZ1tdW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChncmFwaCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHsgLi4uTEFZT1VUX0RFRkFVTFRTLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IG5vZGVJZHMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGxheWVyT2YgPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgW11dKSk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBvdXRnb2luZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuXG4gIGZvciAoY29uc3QgZWRnZSBvZiBncmFwaC5lZGdlcykge1xuICAgIGlmICghaW5jb21pbmcuaGFzKGVkZ2UudG8pIHx8ICFpbmNvbWluZy5oYXMoZWRnZS5mcm9tKSB8fCBlZGdlLmZyb20gPT09IGVkZ2UudG8pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpbmNvbWluZy5nZXQoZWRnZS50byk/LnB1c2goZWRnZS5mcm9tKTtcbiAgICBvdXRnb2luZy5nZXQoZWRnZS5mcm9tKT8ucHVzaChlZGdlLnRvKTtcbiAgfVxuXG4gIC8vIEthaG4ncyBhbGdvcml0aG0gZ2l2ZXMgYSB0b3BvbG9naWNhbCBvcmRlcjsgY3ljbGVzIGFyZSBoYW5kbGVkIGFmdGVyd2FyZHMuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgbnVtYmVyPn0gKi9cbiAgY29uc3QgaW5kZWdyZWUgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBpbmNvbWluZy5nZXQoaWQpPy5sZW5ndGggPz8gMF0pKTtcbiAgY29uc3QgcmVhZHkgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+IChpbmRlZ3JlZS5nZXQoaWQpID8/IDApID09PSAwKS5zb3J0KCk7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IG9yZGVyID0gW107XG5cbiAgd2hpbGUgKHJlYWR5Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocmVhZHkuc2hpZnQoKSk7XG4gICAgb3JkZXIucHVzaChpZCk7XG4gICAgZm9yIChjb25zdCBuZXh0IG9mIChvdXRnb2luZy5nZXQoaWQpID8/IFtdKS5zbGljZSgpLnNvcnQoKSkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gKGluZGVncmVlLmdldChuZXh0KSA/PyAwKSAtIDE7XG4gICAgICBpbmRlZ3JlZS5zZXQobmV4dCwgcmVtYWluaW5nKTtcbiAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVhZHkucHVzaChuZXh0KTtcbiAgICAgICAgcmVhZHkuc29ydCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBtYXhMYXllciA9IDA7XG4gIGZvciAoY29uc3QgaWQgb2Ygb3JkZXIpIHtcbiAgICBjb25zdCBwcmVkZWNlc3NvcnMgPSBpbmNvbWluZy5nZXQoaWQpID8/IFtdO1xuICAgIGNvbnN0IGxheWVyID1cbiAgICAgIHByZWRlY2Vzc29ycy5sZW5ndGggPT09IDBcbiAgICAgICAgPyAwXG4gICAgICAgIDogTWF0aC5tYXgoLi4ucHJlZGVjZXNzb3JzLm1hcCgocHJlZCkgPT4gbGF5ZXJPZi5nZXQocHJlZCkgPz8gMCkpICsgMTtcbiAgICBsYXllck9mLnNldChpZCwgbGF5ZXIpO1xuICAgIG1heExheWVyID0gTWF0aC5tYXgobWF4TGF5ZXIsIGxheWVyKTtcbiAgfVxuXG4gIC8vIE5vZGVzIGluc2lkZSBhIGN5Y2xlIG5ldmVyIHJlYWNoIGluZGVncmVlIDAuIFBsYWNlIHRoZW0gYWZ0ZXIgZXZlcnl0aGluZ1xuICAvLyB0aGF0IGNvdWxkIGJlIG9yZGVyZWQsIHJhdGhlciB0aGFuIGRyb3BwaW5nIHRoZW0uXG4gIGNvbnN0IGN5Y2xpYyA9IG5vZGVJZHMuZmlsdGVyKChpZCkgPT4gIWxheWVyT2YuaGFzKGlkKSkuc29ydCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIGN5Y2xpYykge1xuICAgIGxheWVyT2Yuc2V0KGlkLCBNYXRoLm1pbihtYXhMYXllciArIDEsIGNvbmZpZy5tYXhMYXllcnMpKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7TWFwPG51bWJlciwgc3RyaW5nW10+fSAqL1xuICBjb25zdCBieUxheWVyID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIG5vZGVJZHMuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICBjb25zdCBsYXllciA9IE1hdGgubWluKGxheWVyT2YuZ2V0KGlkKSA/PyAwLCBjb25maWcubWF4TGF5ZXJzKTtcbiAgICBpZiAoIWJ5TGF5ZXIuaGFzKGxheWVyKSkge1xuICAgICAgYnlMYXllci5zZXQobGF5ZXIsIFtdKTtcbiAgICB9XG4gICAgYnlMYXllci5nZXQobGF5ZXIpPy5wdXNoKGlkKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgUG9zaXRpb24+fSAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXVtdfSAqL1xuICBjb25zdCBsYXllcnMgPSBbXTtcbiAgbGV0IHRhbGxlc3QgPSAwO1xuXG4gIGZvciAoY29uc3QgbGF5ZXIgb2YgWy4uLmJ5TGF5ZXIua2V5cygpXS5zb3J0KChhLCBiKSA9PiBhIC0gYikpIHtcbiAgICBjb25zdCBpZHMgPSBieUxheWVyLmdldChsYXllcikgPz8gW107XG4gICAgbGF5ZXJzLnB1c2goaWRzKTtcbiAgICBpZHMuZm9yRWFjaCgoaWQsIGluZGV4KSA9PiB7XG4gICAgICBwb3NpdGlvbnNbaWRdID0ge1xuICAgICAgICB4OiBsYXllciAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgICAgICB5OiBpbmRleCAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgICAgIHdpZHRoOiBjb25maWcubm9kZVdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNvbmZpZy5ub2RlSGVpZ2h0LFxuICAgICAgICBsYXllcixcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGFsbGVzdCA9IE1hdGgubWF4KHRhbGxlc3QsIGlkcy5sZW5ndGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbnMsXG4gICAgd2lkdGg6IE1hdGgubWF4KDEsIGxheWVycy5sZW5ndGgpICogKGNvbmZpZy5ub2RlV2lkdGggKyBjb25maWcuaG9yaXpvbnRhbEdhcCksXG4gICAgaGVpZ2h0OiBNYXRoLm1heCgxLCB0YWxsZXN0KSAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgbGF5ZXJzLFxuICB9O1xufVxuIiwgIi8qKlxuICogTGFuZ3VhZ2UtbmV1dHJhbCBDRkcgdm9jYWJ1bGFyeS5cbiAqXG4gKiBUaGVzZSBuYW1lcyBhcmUgZnJvemVuIGJ5IGBkb2NzL0dSQVBIX1NQRUNJRklDQVRJT04ubWRgLiBBZGFwdGVycyBkZXNjcmliZVxuICogc291cmNlIHN0cnVjdHVyZSB3aXRoIGBDb250cm9sQ29uc3RydWN0YCB0cmVlczsgdGhpcyBtb2R1bGUgb3ducyB0aGUgc21hbGxlclxuICogc2V0IG9mIG5vZGVzIGFuZCBlZGdlcyB0aGUgcmVuZGVyZXIgdW5kZXJzdGFuZHMuXG4gKi9cblxuLyoqIE5vZGUga2luZHMgYSBDRkcgbWF5IGNvbnRhaW4uICovXG5leHBvcnQgY29uc3QgQ0ZHX05PREVfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ2VudHJ5JyxcbiAgJ2V4aXQnLFxuICAnc3RhdGVtZW50JyxcbiAgJ2NvbmRpdGlvbicsXG4gICdtdWx0aXdheScsXG4gICdtZXJnZScsXG4gICdsb29wX2hlYWRlcicsXG4gICdsb29wX2xhdGNoJyxcbiAgJ2xvb3BfYm9keV9lbnRyeScsXG4gICdicmVhaycsXG4gICdjb250aW51ZScsXG4gICdyZXR1cm4nLFxuICAndGhyb3cnLFxuICAnY2FsbCcsXG4gICdhd2FpdCcsXG4gICdjYXRjaF9lbnRyeScsXG4gICdmaW5hbGx5X2VudHJ5JyxcbiAgJ3VucmVhY2hhYmxlJyxcbiAgJ3VubW9kZWxlZCcsXG5dKTtcblxuLyoqIEVkZ2Uga2luZHMgYSBDRkcgbWF5IGNvbnRhaW4uICovXG5leHBvcnQgY29uc3QgQ0ZHX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3NlcScsXG4gICd0cnVlJyxcbiAgJ2ZhbHNlJyxcbiAgJ2Nhc2UnLFxuICAnZGVmYXVsdCcsXG4gICdsb29wX2JhY2snLFxuICAnYnJlYWsnLFxuICAnY29udGludWUnLFxuICAncmV0dXJuJyxcbiAgJ3Rocm93JyxcbiAgJ2V4Y2VwdGlvbicsXG4gICdmaW5hbGx5JyxcbiAgJ3VucmVhY2hhYmxlJyxcbl0pO1xuXG4vKiogU3RhdHVzZXMgc2hhcmVkIHdpdGggQ1NSIHJlbGF0aW9uc2hpcHMuICovXG5leHBvcnQgY29uc3QgQ0ZHX1NUQVRVU0VTID0gT2JqZWN0LmZyZWV6ZShbXG4gICdyZXNvbHZlZCcsXG4gICdpbmZlcnJlZCcsXG4gICdwb3NzaWJsZScsXG4gICd1bnJlc29sdmVkJyxcbiAgJ3N0YWxlJyxcbl0pO1xuXG4vKiogRGVncmFkYXRpb24gY29kZXMgZW1pdHRlZCBieSB0aGUgYnVpbGRlci4gKi9cbmV4cG9ydCBjb25zdCBDRkdfREVHUkFEQVRJT05fQ09ERVMgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3VubW9kZWxlZF9jb25zdHJ1Y3QnLFxuICAnZ290b19mbG93JyxcbiAgJ2luZGlyZWN0X2dvdG9fZmxvdycsXG4gICdpdGVyYXRpb25fc291cmNlX29wYXF1ZScsXG4gICdjYWxsX3NpdGVfdW5yZWNvcmRlZCcsXG4gICdjb25kaXRpb25fc2hhcGVfdW5tb2RlbGVkJyxcbiAgJ29ycGhhbl9qdW1wJyxcbiAgJ21vZGVsZWRfZXhjZXB0aW9uX3BhdGgnLFxuICAnYW5hbHlzaXNfcGFydGlhbCcsXG4gICd0cnVuY2F0ZWQnLFxuXSk7XG5cbi8qKiBFZGdlIGtpbmRzIHRoYXQgZG8gbm90IGFkdmFuY2UgdGhlIG5vcm1hbCBzdWNjZXNzb3IgcGF0aC4gKi9cbmV4cG9ydCBjb25zdCBBQlJVUFRfRURHRV9LSU5EUyA9IE9iamVjdC5mcmVlemUoWydicmVhaycsICdjb250aW51ZScsICdyZXR1cm4nLCAndGhyb3cnXSk7XG5cbi8qKiBFZGdlcyBleGNsdWRlZCBmcm9tIHJhbmsgY29tcHV0YXRpb24gYmVjYXVzZSB0aGV5IHBvaW50IGJhY2t3YXJkcy4gKi9cbmV4cG9ydCBjb25zdCBCQUNLX0VER0VfS0lORFMgPSBPYmplY3QuZnJlZXplKFsnbG9vcF9iYWNrJywgJ2NvbnRpbnVlJ10pO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBkYXNoRm9yU3RhdHVzKHN0YXR1cykge1xuICBzd2l0Y2ggKHN0YXR1cykge1xuICAgIGNhc2UgJ2luZmVycmVkJzpcbiAgICAgIHJldHVybiAnOCA0JztcbiAgICBjYXNlICdwb3NzaWJsZSc6XG4gICAgICByZXR1cm4gJzMgMyc7XG4gICAgY2FzZSAndW5yZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJzIgNSc7XG4gICAgY2FzZSAnc3RhbGUnOlxuICAgICAgcmV0dXJuICcxIDQnO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gJyc7XG4gIH1cbn1cblxuLyoqXG4gKiBOb24tY29sb3VyIGN1ZSBmb3IgYSBzdGF0dXMuIFBoYXNlIDEyIHdpbGwgZXh0ZW5kIHRoaXMgaW50byBhIGZ1bGxcbiAqIGFjY2Vzc2liaWxpdHkgcGFzczsgdGhlIERUTyBhbHJlYWR5IGNhcnJpZXMgdGhlIGZpZWxkLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdGF0dXNcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnbHlwaEZvclN0YXR1cyhzdGF0dXMpIHtcbiAgc3dpdGNoIChzdGF0dXMpIHtcbiAgICBjYXNlICdyZXNvbHZlZCc6XG4gICAgICByZXR1cm4gJ1x1MjVDRic7XG4gICAgY2FzZSAnaW5mZXJyZWQnOlxuICAgICAgcmV0dXJuICdcdTI1RDAnO1xuICAgIGNhc2UgJ3Bvc3NpYmxlJzpcbiAgICAgIHJldHVybiAnXHUyNUNCJztcbiAgICBjYXNlICd1bnJlc29sdmVkJzpcbiAgICAgIHJldHVybiAnXHUyNzE1JztcbiAgICBjYXNlICdzdGFsZSc6XG4gICAgICByZXR1cm4gJ1x1MjJFRic7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiAnPyc7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVkZ2VMYWJlbChraW5kLCBleHRyYSA9ICcnKSB7XG4gIGlmIChleHRyYSkge1xuICAgIHJldHVybiBraW5kID09PSAnY2FzZScgPyBgY2FzZSAke2V4dHJhfWAgOiBleHRyYTtcbiAgfVxuICBzd2l0Y2ggKGtpbmQpIHtcbiAgICBjYXNlICdzZXEnOlxuICAgICAgcmV0dXJuICcnO1xuICAgIGNhc2UgJ2xvb3BfYmFjayc6XG4gICAgICByZXR1cm4gJ2xvb3AgYmFjayc7XG4gICAgY2FzZSAnZXhjZXB0aW9uJzpcbiAgICAgIHJldHVybiAnZXhjZXB0aW9uJztcbiAgICBjYXNlICdmaW5hbGx5JzpcbiAgICAgIHJldHVybiAnZmluYWxseSc7XG4gICAgY2FzZSAndW5yZWFjaGFibGUnOlxuICAgICAgcmV0dXJuICd1bnJlYWNoYWJsZSc7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBraW5kO1xuICB9XG59XG4iLCAiLyoqXG4gKiBHcmFwaCB2aWV3LW1vZGVsIChEVE8pLlxuICpcbiAqIFRoZSBEVE8gaXMgdGhlIG9ubHkgZ3JhcGggc2hhcGUgdGhlIHdlYnZpZXcgdW5kZXJzdGFuZHMuIEl0IGlzIHBsYWluIEpTT046XG4gKiBubyBmdW5jdGlvbnMsIG5vIGlkcyB0aGF0IHJlcXVpcmUgYSBsb29rdXAsIG5vIHNvdXJjZSB0ZXh0LlxuICpcbiAqIFNvdXJjZSB0ZXh0IGlzIGZldGNoZWQgb24gZGVtYW5kIGluIFBoYXNlIDUgdGhyb3VnaCBhIHNlcGFyYXRlLCB2YWxpZGF0ZWRcbiAqIHJlcXVlc3QuIEtlZXBpbmcgdGhlIERUTyBmcmVlIG9mIHNvdXJjZSBwcmV2ZW50cyBhY2NpZGVudGFsIGxlYWthZ2UgaW50b1xuICogY2FjaGVzIGFuZCBrZWVwcyBtZXNzYWdlIHNpemVzIHByZWRpY3RhYmxlLlxuICovXG5cbmltcG9ydCB7IGNvbXB1dGVMYXlvdXQgfSBmcm9tICcuL2xheW91dC5qcyc7XG5pbXBvcnQgeyBDRkdfRURHRV9LSU5EUywgQ0ZHX05PREVfS0lORFMsIENGR19TVEFUVVNFUyB9IGZyb20gJy4vY2ZnL2tpbmRzLmpzJztcblxuZXhwb3J0IGNvbnN0IEdSQVBIX0RUT19WRVJTSU9OID0gMTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEdG9Ob2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0dXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBiYWRnZVxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHt7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9IHwgbnVsbH0gcmFuZ2VcbiAqIEBwcm9wZXJ0eSB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IHBvc2l0aW9uXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmFwaER0b1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGR0b1ZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBncmFwaElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFkYXB0ZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtEdG9Ob2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0FycmF5PHtpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9Pn0gZWRnZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2NvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBzZXZlcml0eTogc3RyaW5nfT59IGRpYWdub3N0aWNzXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBkZWdyYWRhdGlvbnNcbiAqIEBwcm9wZXJ0eSB7e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gZXh0ZW50XG4gKiBAcHJvcGVydHkge3tzdGF0dXNlczogc3RyaW5nW10sIGtpbmRzOiBzdHJpbmdbXX19IGxlZ2VuZFxuICovXG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRHRvKGdyYXBoKSB7XG4gIGNvbnN0IGxheW91dCA9IGNvbXB1dGVMYXlvdXQoZ3JhcGgpO1xuXG4gIGNvbnN0IG5vZGVzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiAoe1xuICAgIGlkOiBub2RlLmlkLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsLFxuICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICBzdGF0dXM6IG5vZGUuc3RhdHVzLFxuICAgIGJhZGdlOiBub2RlLmJhZGdlID8/ICcnLFxuICAgIGV4dGVybmFsOiBub2RlLmV4dGVybmFsLFxuICAgIHJhbmdlOiBub2RlLnJhbmdlXG4gICAgICA/IHtcbiAgICAgICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgICAgIHN0YXJ0TGluZTogbm9kZS5yYW5nZS5zdGFydExpbmUsXG4gICAgICAgICAgZW5kTGluZTogbm9kZS5yYW5nZS5lbmRMaW5lLFxuICAgICAgICB9XG4gICAgICA6IG51bGwsXG4gICAgcG9zaXRpb246IGxheW91dC5wb3NpdGlvbnNbbm9kZS5pZF0gPz8geyB4OiAwLCB5OiAwLCB3aWR0aDogMTkwLCBoZWlnaHQ6IDU0LCBsYXllcjogMCB9LFxuICB9KSk7XG5cbiAgY29uc3Qgc3RhdHVzZXMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuc3RhdHVzKSldLnNvcnQoKTtcbiAgY29uc3Qga2luZHMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUua2luZCkpXS5zb3J0KCk7XG5cbiAgcmV0dXJuIHtcbiAgICBkdG9WZXJzaW9uOiBHUkFQSF9EVE9fVkVSU0lPTixcbiAgICBncmFwaElkOiBncmFwaC5ncmFwaElkLFxuICAgIHJ1bklkOiBncmFwaC5ydW5JZCxcbiAgICBsYW5ndWFnZTogZ3JhcGgubGFuZ3VhZ2UsXG4gICAgYWRhcHRlcklkOiBncmFwaC5hZGFwdGVySWQsXG4gICAgY29tcGxldGVuZXNzOiBncmFwaC5jb21wbGV0ZW5lc3MsXG4gICAgbm9kZXMsXG4gICAgZWRnZXM6IGdyYXBoLmVkZ2VzLm1hcCgoZWRnZSkgPT4ge1xuICAgICAgLyoqIEB0eXBlIHt7aWQ6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCByZWFzb25Db2RlPzogc3RyaW5nfX0gKi9cbiAgICAgIGNvbnN0IGR0b0VkZ2UgPSB7XG4gICAgICAgIGlkOiBlZGdlLmlkLFxuICAgICAgICBmcm9tOiBlZGdlLmZyb20sXG4gICAgICAgIHRvOiBlZGdlLnRvLFxuICAgICAgICB0eXBlOiBlZGdlLnR5cGUsXG4gICAgICAgIHN0YXR1czogZWRnZS5zdGF0dXMsXG4gICAgICAgIGxhYmVsOiBlZGdlLmxhYmVsLFxuICAgICAgfTtcbiAgICAgIC8vIE9taXQgdGhlIGtleSBlbnRpcmVseSB3aGVuIGFic2VudCBzbyB0aGUgRFRPIHN1cnZpdmVzIGEgSlNPTiByb3VuZC10cmlwXG4gICAgICAvLyB1bmNoYW5nZWQgKEpTT04gY2Fubm90IHJlcHJlc2VudCBgdW5kZWZpbmVkYCkuXG4gICAgICBpZiAoZWRnZS5yZWFzb25Db2RlKSB7XG4gICAgICAgIGR0b0VkZ2UucmVhc29uQ29kZSA9IGVkZ2UucmVhc29uQ29kZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkdG9FZGdlO1xuICAgIH0pLFxuICAgIGRpYWdub3N0aWNzOiBncmFwaC5kaWFnbm9zdGljcyxcbiAgICBkZWdyYWRhdGlvbnM6IGdyYXBoLmRlZ3JhZGF0aW9ucyxcbiAgICBleHRlbnQ6IHsgd2lkdGg6IGxheW91dC53aWR0aCwgaGVpZ2h0OiBsYXlvdXQuaGVpZ2h0IH0sXG4gICAgbGVnZW5kOiB7IHN0YXR1c2VzLCBraW5kcyB9LFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZHRvXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlLCBkdG86IEdyYXBoRHRvfSB8IHtvazogZmFsc2UsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVEdG8oZHRvKSB7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICBpZiAodHlwZW9mIGR0byAhPT0gJ29iamVjdCcgfHwgZHRvID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZHRvKSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzOiBbJ0RUTyBtdXN0IGJlIGFuIG9iamVjdC4nXSB9O1xuICB9XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChkdG8pO1xuICBpZiAoY2FuZGlkYXRlLmR0b1ZlcnNpb24gIT09IEdSQVBIX0RUT19WRVJTSU9OKSB7XG4gICAgaXNzdWVzLnB1c2goYFVuc3VwcG9ydGVkIGR0b1ZlcnNpb246ICR7U3RyaW5nKGNhbmRpZGF0ZS5kdG9WZXJzaW9uKX0uYCk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5kdG9LaW5kID09PSAnY2ZnJykge1xuICAgIHZhbGlkYXRlQ2ZnRHRvKGNhbmRpZGF0ZSwgaXNzdWVzKTtcbiAgICByZXR1cm4gaXNzdWVzLmxlbmd0aCA+IDBcbiAgICAgID8geyBvazogZmFsc2UsIGlzc3VlcyB9XG4gICAgICA6IHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbiAgfVxuICBjb25zdCBub2RlcyA9IGNhbmRpZGF0ZS5ub2RlcztcbiAgY29uc3QgZWRnZXMgPSBjYW5kaWRhdGUuZWRnZXM7XG4gIGlmICghQXJyYXkuaXNBcnJheShub2RlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnbm9kZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZXMpICYmIEFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBub2Rlcykge1xuICAgICAgY29uc3QgaWQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAobm9kZSkuaWQ7XG4gICAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBub2RlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICAgIH1cbiAgICAgIGlkcy5hZGQoaWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMpIHtcbiAgICAgIGNvbnN0IHJlY29yZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlZGdlKTtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLmZyb20gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC5mcm9tKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgICB9XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLnRvKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7U3RyaW5nKHJlY29yZC5pZCl9XCIgaGFzIGFuIHVua25vd24gdGFyZ2V0IG5vZGUuYCk7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChpc3N1ZXMubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzIH07XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUsIGR0bzogLyoqIEB0eXBlIHtHcmFwaER0b30gKi8gKGR0bykgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBjYW5kaWRhdGVcbiAqIEBwYXJhbSB7c3RyaW5nW119IGlzc3Vlc1xuICovXG5mdW5jdGlvbiB2YWxpZGF0ZUNmZ0R0byhjYW5kaWRhdGUsIGlzc3Vlcykge1xuICBpZiAoY2FuZGlkYXRlLmdyYXBoS2luZCAhPT0gJ2NmZycpIHtcbiAgICBpc3N1ZXMucHVzaCgnQSBDRkcgRFRPIG11c3QgZGVjbGFyZSBncmFwaEtpbmQgXCJjZmdcIi4nKTtcbiAgfVxuICBjb25zdCBmbiA9IGNhbmRpZGF0ZS5mdW5jdGlvbjtcbiAgaWYgKHR5cGVvZiBmbiAhPT0gJ29iamVjdCcgfHwgZm4gPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShmbikpIHtcbiAgICBpc3N1ZXMucHVzaCgnZnVuY3Rpb24gbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGZuKTtcbiAgICBmb3IgKGNvbnN0IGtleSBvZiBbJ3N5bWJvbElkJywgJ25hbWUnLCAncXVhbGlmaWVkTmFtZScsICdraW5kJ10pIHtcbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkW2tleV0gIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBmdW5jdGlvbi4ke2tleX0gbXVzdCBiZSBhIHN0cmluZy5gKTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlY29yZC5yYW5nZSAhPT0gbnVsbCAmJiAhaXNSYW5nZVJlZihyZWNvcmQucmFuZ2UpKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnZnVuY3Rpb24ucmFuZ2UgbXVzdCBiZSBhIHJhbmdlIHJlZmVyZW5jZSBvciBudWxsLicpO1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIUFycmF5LmlzQXJyYXkoZWRnZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VkZ2VzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgY29uc3QgaWRzID0gbmV3IFNldCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBlbnRyeUlkcyA9IFtdO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBleGl0SWRzID0gW107XG4gIGZvciAoY29uc3QgZW50cnkgb2Ygbm9kZXMpIHtcbiAgICBpZiAodHlwZW9mIGVudHJ5ICE9PSAnb2JqZWN0JyB8fCBlbnRyeSA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGVudHJ5KSkge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbXVzdCBiZSBhbiBvYmplY3QuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgY29uc3Qgbm9kZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChlbnRyeSk7XG4gICAgY29uc3QgaWQgPSBub2RlLmlkO1xuICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgbm9kZSBuZWVkcyBhIHN0cmluZyBpZC4nKTtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoaWRzLmhhcyhpZCkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgbm9kZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgfVxuICAgIGlkcy5hZGQoaWQpO1xuICAgIGlmICghQ0ZHX05PREVfS0lORFMuaW5jbHVkZXMoU3RyaW5nKG5vZGUua2luZCkpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIHVua25vd24ga2luZCBcIiR7U3RyaW5nKG5vZGUua2luZCl9XCIuYCk7XG4gICAgfVxuICAgIGlmICghQ0ZHX1NUQVRVU0VTLmluY2x1ZGVzKFN0cmluZyhub2RlLnN0YXR1cykpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIHVua25vd24gc3RhdHVzIFwiJHtTdHJpbmcobm9kZS5zdGF0dXMpfVwiLmApO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIG5vZGUubGFiZWwgIT09ICdzdHJpbmcnKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgbmVlZHMgYSBzdHJpbmcgbGFiZWwuYCk7XG4gICAgfVxuICAgIGlmICghQXJyYXkuaXNBcnJheShub2RlLmxhYmVsTGluZXMpIHx8IG5vZGUubGFiZWxMaW5lcy5zb21lKChsaW5lKSA9PiB0eXBlb2YgbGluZSAhPT0gJ3N0cmluZycpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgbmVlZHMgc3RyaW5nIGxhYmVsTGluZXMuYCk7XG4gICAgfVxuICAgIGlmIChub2RlLnJhbmdlICE9PSBudWxsICYmICFpc1JhbmdlUmVmKG5vZGUucmFuZ2UpKSB7XG4gICAgICBpc3N1ZXMucHVzaChgTm9kZSBcIiR7aWR9XCIgaGFzIGFuIGludmFsaWQgcmFuZ2UgcmVmZXJlbmNlLmApO1xuICAgIH1cbiAgICBpZiAoIWlzUG9zaXRpb24obm9kZS5wb3NpdGlvbikpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBoYXMgYW4gaW52YWxpZCBwb3NpdGlvbi5gKTtcbiAgICB9XG4gICAgaWYgKG5vZGUua2luZCA9PT0gJ2VudHJ5Jykge1xuICAgICAgZW50cnlJZHMucHVzaChpZCk7XG4gICAgfVxuICAgIGlmIChub2RlLmtpbmQgPT09ICdleGl0Jykge1xuICAgICAgZXhpdElkcy5wdXNoKGlkKTtcbiAgICB9XG4gICAgaWYgKG5vZGUuY2FsbHMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGUuY2FsbHMpKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBOb2RlIFwiJHtpZH1cIiBjYWxscyBtdXN0IGJlIGFuIGFycmF5IHdoZW4gcHJlc2VudC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGZvciAoY29uc3QgY2FsbCBvZiBub2RlLmNhbGxzKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgdHlwZW9mIGNhbGwgIT09ICdvYmplY3QnIHx8XG4gICAgICAgICAgICBjYWxsID09PSBudWxsIHx8XG4gICAgICAgICAgICB0eXBlb2YgY2FsbC50byAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgICAgIHR5cGVvZiBjYWxsLmxhYmVsICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICAgICAgIUNGR19TVEFUVVNFUy5pbmNsdWRlcyhTdHJpbmcoY2FsbC5zdGF0dXMpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgaXNzdWVzLnB1c2goYE5vZGUgXCIke2lkfVwiIGhhcyBhbiBpbnZhbGlkIGNhbGwgdGFyZ2V0LmApO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoZW50cnlJZHMubGVuZ3RoICE9PSAxKSB7XG4gICAgaXNzdWVzLnB1c2goYEEgQ0ZHIG5lZWRzIGV4YWN0bHkgb25lIGVudHJ5IG5vZGU7IGZvdW5kICR7ZW50cnlJZHMubGVuZ3RofS5gKTtcbiAgfVxuICBpZiAoZXhpdElkcy5sZW5ndGggIT09IDEpIHtcbiAgICBpc3N1ZXMucHVzaChgQSBDRkcgbmVlZHMgZXhhY3RseSBvbmUgZXhpdCBub2RlOyBmb3VuZCAke2V4aXRJZHMubGVuZ3RofS5gKTtcbiAgfVxuICBpZiAoY2FuZGlkYXRlLmVudHJ5SWQgIT09IGVudHJ5SWRzWzBdKSB7XG4gICAgaXNzdWVzLnB1c2goJ2VudHJ5SWQgbXVzdCByZWZlcmVuY2UgdGhlIGVudHJ5IG5vZGUuJyk7XG4gIH1cbiAgaWYgKGNhbmRpZGF0ZS5leGl0SWQgIT09IGV4aXRJZHNbMF0pIHtcbiAgICBpc3N1ZXMucHVzaCgnZXhpdElkIG11c3QgcmVmZXJlbmNlIHRoZSBleGl0IG5vZGUuJyk7XG4gIH1cblxuICBjb25zdCBlZGdlSWRzID0gbmV3IFNldCgpO1xuICBmb3IgKGNvbnN0IGVudHJ5IG9mIGVkZ2VzKSB7XG4gICAgaWYgKHR5cGVvZiBlbnRyeSAhPT0gJ29iamVjdCcgfHwgZW50cnkgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheShlbnRyeSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBlZGdlIG11c3QgYmUgYW4gb2JqZWN0LicpO1xuICAgICAgY29udGludWU7XG4gICAgfVxuICAgIGNvbnN0IGVkZ2UgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZW50cnkpO1xuICAgIGNvbnN0IGlkID0gZWRnZS5pZDtcbiAgICBpZiAodHlwZW9mIGlkICE9PSAnc3RyaW5nJykge1xuICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IGVkZ2UgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVkZ2VJZHMuaGFzKGlkKSkge1xuICAgICAgaXNzdWVzLnB1c2goYER1cGxpY2F0ZSBlZGdlIGlkIFwiJHtpZH1cIi5gKTtcbiAgICB9XG4gICAgZWRnZUlkcy5hZGQoaWQpO1xuICAgIGlmICh0eXBlb2YgZWRnZS5mcm9tICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhlZGdlLmZyb20pKSB7XG4gICAgICBpc3N1ZXMucHVzaChgRWRnZSBcIiR7aWR9XCIgaGFzIGFuIHVua25vd24gc291cmNlIG5vZGUuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS50byAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMoZWRnZS50bykpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgYW4gdW5rbm93biB0YXJnZXQgbm9kZS5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfRURHRV9LSU5EUy5pbmNsdWRlcyhTdHJpbmcoZWRnZS5raW5kKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBraW5kIFwiJHtTdHJpbmcoZWRnZS5raW5kKX1cIi5gKTtcbiAgICB9XG4gICAgaWYgKCFDRkdfU1RBVFVTRVMuaW5jbHVkZXMoU3RyaW5nKGVkZ2Uuc3RhdHVzKSkpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBoYXMgdW5rbm93biBzdGF0dXMgXCIke1N0cmluZyhlZGdlLnN0YXR1cyl9XCIuYCk7XG4gICAgfVxuICAgIGlmICh0eXBlb2YgZWRnZS5sYWJlbCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBuZWVkcyBhIHN0cmluZyBsYWJlbC5gKTtcbiAgICB9XG4gICAgaWYgKHR5cGVvZiBlZGdlLmRhc2ggIT09ICdzdHJpbmcnIHx8IHR5cGVvZiBlZGdlLmdseXBoSGludCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtpZH1cIiBuZWVkcyBzdHJpbmcgZGFzaCBhbmQgZ2x5cGhIaW50IGZpZWxkcy5gKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBjYW5kaWRhdGUuZGVncmFkYXRpb25zO1xuICBpZiAoIUFycmF5LmlzQXJyYXkoZGVncmFkYXRpb25zKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdkZWdyYWRhdGlvbnMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfSBlbHNlIHtcbiAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGRlZ3JhZGF0aW9ucykge1xuICAgICAgaWYgKFxuICAgICAgICB0eXBlb2YgZW50cnkgIT09ICdvYmplY3QnIHx8XG4gICAgICAgIGVudHJ5ID09PSBudWxsIHx8XG4gICAgICAgIHR5cGVvZiBlbnRyeS5jb2RlICE9PSAnc3RyaW5nJyB8fFxuICAgICAgICB0eXBlb2YgZW50cnkubWVzc2FnZSAhPT0gJ3N0cmluZycgfHxcbiAgICAgICAgIVsnaW5mbycsICd3YXJuaW5nJywgJ2Vycm9yJ10uaW5jbHVkZXMoU3RyaW5nKGVudHJ5LnNldmVyaXR5KSlcbiAgICAgICkge1xuICAgICAgICBpc3N1ZXMucHVzaCgnRXZlcnkgZGVncmFkYXRpb24gbmVlZHMgYSBjb2RlLCBtZXNzYWdlIGFuZCBzZXZlcml0eS4nKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBjb25zdCBleHRlbnQgPSBjYW5kaWRhdGUuZXh0ZW50O1xuICBpZiAoXG4gICAgdHlwZW9mIGV4dGVudCAhPT0gJ29iamVjdCcgfHxcbiAgICBleHRlbnQgPT09IG51bGwgfHxcbiAgICAhTnVtYmVyLmlzRmluaXRlKGV4dGVudC53aWR0aCkgfHxcbiAgICAhTnVtYmVyLmlzRmluaXRlKGV4dGVudC5oZWlnaHQpXG4gICkge1xuICAgIGlzc3Vlcy5wdXNoKCdleHRlbnQgbXVzdCBjYXJyeSBmaW5pdGUgd2lkdGggYW5kIGhlaWdodC4nKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gdmFsdWVcbiAqIEByZXR1cm5zIHtib29sZWFufVxuICovXG5mdW5jdGlvbiBpc1JhbmdlUmVmKHZhbHVlKSB7XG4gIGlmICh0eXBlb2YgdmFsdWUgIT09ICdvYmplY3QnIHx8IHZhbHVlID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkodmFsdWUpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG4gIGNvbnN0IHJhbmdlID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKHZhbHVlKTtcbiAgcmV0dXJuIChcbiAgICB0eXBlb2YgcmFuZ2UuZmlsZUlkID09PSAnc3RyaW5nJyAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2Uuc3RhcnRDb2x1bW4pICYmXG4gICAgTnVtYmVyLmlzSW50ZWdlcihyYW5nZS5lbmRMaW5lKSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocmFuZ2UuZW5kQ29sdW1uKSAmJlxuICAgIHJhbmdlLnN0YXJ0TGluZSA+PSAwICYmXG4gICAgcmFuZ2Uuc3RhcnRDb2x1bW4gPj0gMCAmJlxuICAgIHJhbmdlLmVuZExpbmUgPj0gMCAmJlxuICAgIHJhbmdlLmVuZENvbHVtbiA+PSAwXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSB2YWx1ZVxuICogQHJldHVybnMge2Jvb2xlYW59XG4gKi9cbmZ1bmN0aW9uIGlzUG9zaXRpb24odmFsdWUpIHtcbiAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcgfHwgdmFsdWUgPT09IG51bGwgfHwgQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbiAgY29uc3QgcG9zaXRpb24gPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAodmFsdWUpO1xuICByZXR1cm4gKFxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi54KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi55KSAmJlxuICAgIE51bWJlci5pc0Zpbml0ZShwb3NpdGlvbi53aWR0aCkgJiZcbiAgICBOdW1iZXIuaXNGaW5pdGUocG9zaXRpb24uaGVpZ2h0KSAmJlxuICAgIE51bWJlci5pc0ludGVnZXIocG9zaXRpb24ubGF5ZXIpXG4gICk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaER0b30gZHRvXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHRvKGR0bykge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZHRvKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdG8oanNvbikge1xuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8ocGFyc2VkKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGdyYXBoIERUTzogJHt2YWxpZGF0aW9uLmlzc3Vlcy5qb2luKCc7ICcpfWApO1xuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uLmR0bztcbn1cbiIsICIvKipcbiAqIFNWRyByZW5kZXJlci5cbiAqXG4gKiBQaGFzZSAwIHJlbmRlcmVyOiBkZXRlcm1pbmlzdGljIGxheWVyZWQgcG9zaXRpb25zIGNvbWUgZnJvbSB0aGUgRFRPLCBzbyB0aGlzXG4gKiBtb2R1bGUgb25seSBkcmF3cy4gSXQgaGFzIG5vIGtub3dsZWRnZSBvZiBhbmFseXNpcywgYWRhcHRlcnMsIG9yIHRoZSBwcm90b2NvbC5cbiAqXG4gKiBLZXB0IGJlaGluZCBhIHNtYWxsIGludGVyZmFjZSAoYHJlbmRlcmAsIGBzZWxlY3RgLCBgZGVzdHJveWApIGJlY2F1c2UgUGhhc2UgNFxuICogYmVuY2htYXJrcyBDeXRvc2NhcGUvRUxLIGFuZCBtYXkgcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb24uIENhbGxlcnMgbXVzdCBub3RcbiAqIGRlcGVuZCBvbiBTVkcgaW50ZXJuYWxzLlxuICovXG5cbmNvbnN0IFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gR3JhcGhEdG9cbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gRHRvTm9kZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPn0gW2F0dHJpYnV0ZXNdXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gc3ZnRWwobmFtZSwgYXR0cmlidXRlcyA9IHt9KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBuYW1lKTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcykpIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIFN0cmluZyh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGUodmFsdWUsIG1heCkge1xuICBjb25zdCB0ZXh0ID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tzdmc6IFNWR1NWR0VsZW1lbnQsIG9uU2VsZWN0OiAobm9kZUlkOiBzdHJpbmcsIG5vZGU6IER0b05vZGUpID0+IHZvaWR9fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdSZW5kZXJlcih7IHN2Zywgb25TZWxlY3QgfSkge1xuICAvKiogQHR5cGUge0dyYXBoRHRvIHwgbnVsbH0gKi9cbiAgbGV0IGR0byA9IG51bGw7XG4gIC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnQgfCBudWxsfSAqL1xuICBsZXQgdmlld3BvcnQgPSBudWxsO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR0dFbGVtZW50Pn0gKi9cbiAgY29uc3Qgbm9kZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR1BhdGhFbGVtZW50Pn0gKi9cbiAgY29uc3QgZWRnZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBzZWxlY3RlZElkID0gbnVsbDtcblxuICBsZXQgc2NhbGUgPSAxO1xuICBsZXQgdHJhbnNsYXRlWCA9IDA7XG4gIGxldCB0cmFuc2xhdGVZID0gMDtcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHR4OiAwLCB0eTogMCB9O1xuXG4gIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgdmlld3BvcnQuc2V0QXR0cmlidXRlKFxuICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgYHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVgudG9GaXhlZCgyKX0gJHt0cmFuc2xhdGVZLnRvRml4ZWQoMil9KSBzY2FsZSgke3NjYWxlLnRvRml4ZWQoMyl9KWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vZGVQb2ludChub2RlLCBzaWRlKSB7XG4gICAgaWYgKHNpZGUgPT09ICdvdXQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpIHtcbiAgICBpZiAoc291cmNlLmlkID09PSB0YXJnZXQuaWQpIHtcbiAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gc291cmNlLnBvc2l0aW9uO1xuICAgICAgY29uc3QgY3ggPSB4ICsgd2lkdGggLyAyO1xuICAgICAgY29uc3Qgc3RhcnRZID0geSAtIDI7XG4gICAgICByZXR1cm4gYE0gJHtjeH0gJHtzdGFydFl9IEMgJHtjeCAtIDQ2fSAke3kgLSA2MH0sICR7Y3ggKyA0Nn0gJHt5IC0gNjB9LCAke2N4fSAke3kgKyBoZWlnaHQgKyAyfWA7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICBjb25zdCBiZW5kID0gTWF0aC5tYXgoMzYsIE1hdGguYWJzKHRvLnggLSBmcm9tLngpIC8gMik7XG4gICAgcmV0dXJuIGBNICR7ZnJvbS54fSAke2Zyb20ueX0gQyAke2Zyb20ueCArIGJlbmR9ICR7ZnJvbS55fSwgJHt0by54IC0gYmVuZH0gJHt0by55fSwgJHt0by54fSAke3RvLnl9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgc3ZnLnJlbW92ZUNoaWxkKHZpZXdwb3J0KTtcbiAgICB9XG4gICAgdmlld3BvcnQgPSBzdmdFbCgnZycsIHsgY2xhc3M6ICdjZi12aWV3cG9ydCcgfSk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcbiAgICBub2RlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBlZGdlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBzZWxlY3RlZElkID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChub2RlSWQpIHtcbiAgICBzZWxlY3RlZElkID0gbm9kZUlkO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc2VsZWN0ZWQnLCBpZCA9PT0gbm9kZUlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIG5vZGVJZCAhPT0gbnVsbCAmJiAoZWxlbWVudC5kYXRhc2V0LmZyb20gPT09IG5vZGVJZCB8fCBlbGVtZW50LmRhdGFzZXQudG8gPT09IG5vZGVJZCk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScsIGFjdGl2ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZElkICYmIG5vZGVFbGVtZW50cy5oYXMoc2VsZWN0ZWRJZCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge0R0b05vZGV9ICovIChkdG8/Lm5vZGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQpKTtcbiAgICAgIG9uU2VsZWN0KHNlbGVjdGVkSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21Ub0ZpdCgpIHtcbiAgICBpZiAoIWR0byB8fCAhdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA0ODtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQud2lkdGgpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQuaGVpZ2h0KTtcbiAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLndpZHRoIC0gcGFkZGluZyAqIDIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLmhlaWdodCAtIHBhZGRpbmcgKiAyKTtcbiAgICBzY2FsZSA9IE1hdGgubWluKDEuNCwgYXZhaWxhYmxlV2lkdGggLyB3aWR0aCwgYXZhaWxhYmxlSGVpZ2h0IC8gaGVpZ2h0KTtcbiAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTUsIHNjYWxlKTtcbiAgICB0cmFuc2xhdGVYID0gKGJvdW5kcy53aWR0aCAtIHdpZHRoICogc2NhbGUpIC8gMjtcbiAgICB0cmFuc2xhdGVZID0gKGJvdW5kcy5oZWlnaHQgLSBoZWlnaHQgKiBzY2FsZSkgLyAyO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHcmFwaER0b30gbmV4dER0b1xuICAgKi9cbiAgZnVuY3Rpb24gcmVuZGVyKG5leHREdG8pIHtcbiAgICBkdG8gPSBuZXh0RHRvO1xuICAgIGNsZWFyKCk7XG4gICAgaWYgKCF2aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKGR0by5ub2Rlcy5tYXAoKG5vZGUpID0+IFtub2RlLmlkLCBub2RlXSkpO1xuXG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGR0by5lZGdlcykge1xuICAgICAgY29uc3Qgc291cmNlID0gYnlJZC5nZXQoZWRnZS5mcm9tKTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGJ5SWQuZ2V0KGVkZ2UudG8pO1xuICAgICAgaWYgKCFzb3VyY2UgfHwgIXRhcmdldCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdGggPSAvKiogQHR5cGUge1NWR1BhdGhFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdwYXRoJywge1xuICAgICAgICAgIGNsYXNzOiBgY2YtZWRnZSBjZi1lZGdlLS0ke2VkZ2Uuc3RhdHVzfSBjZi1lZGdlLS1raW5kLSR7ZWRnZS5raW5kID8/IGVkZ2UudHlwZX1gLFxuICAgICAgICAgIGQ6IGVkZ2VQYXRoKHNvdXJjZSwgdGFyZ2V0KSxcbiAgICAgICAgICAnZGF0YS1mcm9tJzogZWRnZS5mcm9tLFxuICAgICAgICAgICdkYXRhLXRvJzogZWRnZS50byxcbiAgICAgICAgICAuLi4oZWRnZS5kYXNoID8geyAnc3Ryb2tlLWRhc2hhcnJheSc6IGVkZ2UuZGFzaCB9IDoge30pLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHBhdGguZGF0YXNldC5mcm9tID0gZWRnZS5mcm9tO1xuICAgICAgcGF0aC5kYXRhc2V0LnRvID0gZWRnZS50bztcbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke2VkZ2Uua2luZCA/PyBlZGdlLnR5cGV9ICgke2VkZ2Uuc3RhdHVzfSkke1xuICAgICAgICBlZGdlLnJlYXNvbkNvZGUgPyBgOiAke2VkZ2UucmVhc29uQ29kZX1gIDogJydcbiAgICAgIH0ke2VkZ2UuZ2x5cGhIaW50ID8gYCAke2VkZ2UuZ2x5cGhIaW50fWAgOiAnJ31gO1xuICAgICAgcGF0aC5hcHBlbmRDaGlsZCh0aXRsZSk7XG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChwYXRoKTtcbiAgICAgIGVkZ2VFbGVtZW50cy5zZXQoZWRnZS5pZCwgcGF0aCk7XG5cbiAgICAgIGlmIChlZGdlLmxhYmVsICYmIGVkZ2UubGFiZWwubGVuZ3RoID4gMCkge1xuICAgICAgICBjb25zdCBmcm9tID0gbm9kZVBvaW50KHNvdXJjZSwgJ291dCcpO1xuICAgICAgICBjb25zdCB0byA9IG5vZGVQb2ludCh0YXJnZXQsICdpbicpO1xuICAgICAgICBjb25zdCBsYWJlbCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2YtZWRnZS1sYWJlbCcsXG4gICAgICAgICAgeDogKGZyb20ueCArIHRvLngpIC8gMixcbiAgICAgICAgICB5OiAoZnJvbS55ICsgdG8ueSkgLyAyIC0gNCxcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnbWlkZGxlJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gdHJ1bmNhdGUoZWRnZS5sYWJlbCwgMjIpO1xuICAgICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChsYWJlbCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgZm9yIChjb25zdCBub2RlIG9mIGR0by5ub2Rlcykge1xuICAgICAgY29uc3QgZ3JvdXAgPSAvKiogQHR5cGUge1NWR0dFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdnJywge1xuICAgICAgICAgIGNsYXNzOiBgY2Ytbm9kZSBjZi1ub2RlLS0ke25vZGUuc3RhdHVzfSBjZi1ub2RlLS1raW5kLSR7bm9kZS5raW5kfSR7XG4gICAgICAgICAgICBub2RlLmV4dGVybmFsID8gJyBjZi1ub2RlLS1leHRlcm5hbCcgOiAnJ1xuICAgICAgICAgIH0ke25vZGUudW5yZWFjaGFibGUgPyAnIGNmLW5vZGUtLXVucmVhY2hhYmxlJyA6ICcnfWAsXG4gICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7bm9kZS5wb3NpdGlvbi54fSAke25vZGUucG9zaXRpb24ueX0pYCxcbiAgICAgICAgICB0YWJpbmRleDogJzAnLFxuICAgICAgICAgIHJvbGU6ICdidXR0b24nLFxuICAgICAgICAgICdhcmlhLWxhYmVsJzogYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9LCAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgICAgICBub2RlLnVucmVhY2hhYmxlID8gJywgdW5yZWFjaGFibGUnIDogJydcbiAgICAgICAgICB9JHtub2RlLmV4dGVybmFsID8gJywgZXh0ZXJuYWwgdGFyZ2V0JyA6ICcnfWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBncm91cC5hcHBlbmRDaGlsZChcbiAgICAgICAgc3ZnRWwoJ3JlY3QnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJveCcsXG4gICAgICAgICAgd2lkdGg6IG5vZGUucG9zaXRpb24ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBub2RlLnBvc2l0aW9uLmhlaWdodCxcbiAgICAgICAgICByeDogNixcbiAgICAgICAgICByeTogNixcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBjb25zdCBsaW5lcyA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5sYWJlbExpbmVzKSAmJiBub2RlLmxhYmVsTGluZXMubGVuZ3RoID4gMFxuICAgICAgICAgID8gbm9kZS5sYWJlbExpbmVzLnNsaWNlKDAsIDMpXG4gICAgICAgICAgOiBbdHJ1bmNhdGUobm9kZS5sYWJlbCwgMjYpXTtcbiAgICAgIGNvbnN0IGxpbmVIZWlnaHQgPSAxMztcbiAgICAgIGNvbnN0IGJsb2NrSGVpZ2h0ID0gbGluZXMubGVuZ3RoICogbGluZUhlaWdodDtcbiAgICAgIGNvbnN0IGxhYmVsID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1sYWJlbCcsXG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIgLSBibG9ja0hlaWdodCAvIDIgKyBsaW5lSGVpZ2h0IC0gMyxcbiAgICAgIH0pO1xuICAgICAgZm9yIChjb25zdCBbaW5kZXgsIHRleHRdIG9mIGxpbmVzLmVudHJpZXMoKSkge1xuICAgICAgICBjb25zdCBzcGFuID0gc3ZnRWwoJ3RzcGFuJywge1xuICAgICAgICAgIHg6IDEwLFxuICAgICAgICAgIC4uLihpbmRleCA9PT0gMCA/IHt9IDogeyBkeTogbGluZUhlaWdodCB9KSxcbiAgICAgICAgfSk7XG4gICAgICAgIHNwYW4udGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgICAgICBsYWJlbC5hcHBlbmRDaGlsZChzcGFuKTtcbiAgICAgIH1cbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGxhYmVsKTtcblxuICAgICAgY29uc3Qga2luZCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICBjbGFzczogJ2NmLW5vZGUta2luZCcsXG4gICAgICAgIHg6IDEwLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLmhlaWdodCAtIDgsXG4gICAgICB9KTtcbiAgICAgIGtpbmQudGV4dENvbnRlbnQgPSBub2RlLmV4dGVybmFsID8gYCR7bm9kZS5raW5kfSBcdTAwQjcgZXh0ZXJuYWxgIDogbm9kZS5raW5kO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoa2luZCk7XG5cbiAgICAgIGNvbnN0IGJhZGdlVGV4dCA9XG4gICAgICAgIEFycmF5LmlzQXJyYXkobm9kZS5iYWRnZXMpICYmIG5vZGUuYmFkZ2VzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IG5vZGUuYmFkZ2VzLmpvaW4oJyBcdTAwQjcgJylcbiAgICAgICAgICA6IG5vZGUuYmFkZ2UgfHwgKG5vZGUuc3RhdHVzICE9PSAncmVzb2x2ZWQnID8gbm9kZS5zdGF0dXMgOiAnJyk7XG4gICAgICBpZiAoYmFkZ2VUZXh0KSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJhZGdlJyxcbiAgICAgICAgICB4OiBub2RlLnBvc2l0aW9uLndpZHRoIC0gOCxcbiAgICAgICAgICB5OiAxMyxcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnZW5kJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gdHJ1bmNhdGUoYmFkZ2VUZXh0LCAyNCk7XG4gICAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGJhZGdlKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdGl0bGUgPSBzdmdFbCgndGl0bGUnKTtcbiAgICAgIGNvbnN0IGNhbGxUZXh0ID1cbiAgICAgICAgQXJyYXkuaXNBcnJheShub2RlLmNhbGxzKSAmJiBub2RlLmNhbGxzLmxlbmd0aCA+IDBcbiAgICAgICAgICA/IGBcXG5jYWxsczogJHtub2RlLmNhbGxzLm1hcCgoY2FsbCkgPT4gYCR7Y2FsbC5sYWJlbH0gKCR7Y2FsbC5zdGF0dXN9KWApLmpvaW4oJywgJyl9YFxuICAgICAgICAgIDogJyc7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke25vZGUua2luZH0gJHtub2RlLmxhYmVsfVxcbnN0YXR1czogJHtub2RlLnN0YXR1c30ke1xuICAgICAgICBub2RlLnJhbmdlID8gYFxcbmxpbmVzICR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfS0ke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCA6ICcnXG4gICAgICB9JHtub2RlLnJlYXNvbkNvZGUgPyBgXFxucmVhc29uOiAke25vZGUucmVhc29uQ29kZX1gIDogJyd9JHtjYWxsVGV4dH1gO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQodGl0bGUpO1xuXG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIChldmVudCkgPT4ge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgfSk7XG4gICAgICBncm91cC5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGlmIChldmVudC5rZXkgPT09ICdFbnRlcicgfHwgZXZlbnQua2V5ID09PSAnICcpIHtcbiAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHZpZXdwb3J0LmFwcGVuZENoaWxkKGdyb3VwKTtcbiAgICAgIG5vZGVFbGVtZW50cy5zZXQobm9kZS5pZCwgZ3JvdXApO1xuICAgIH1cblxuICAgIHpvb21Ub0ZpdCgpO1xuICB9XG5cbiAgZnVuY3Rpb24gbW92ZVNlbGVjdGlvbihkaXJlY3Rpb24pIHtcbiAgICBpZiAoIWR0byB8fCBkdG8ubm9kZXMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IGN1cnJlbnQgPSBzZWxlY3RlZElkID8gZHRvLm5vZGVzLmZpbmQoKG5vZGUpID0+IG5vZGUuaWQgPT09IHNlbGVjdGVkSWQpIDogbnVsbDtcbiAgICBpZiAoIWN1cnJlbnQpIHtcbiAgICAgIGNvbnN0IGZpcnN0ID0gZHRvLm5vZGVzWzBdO1xuICAgICAgc2VsZWN0KGZpcnN0LmlkKTtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoZmlyc3QuaWQpPy5mb2N1cygpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBvcmlnaW4gPSB7XG4gICAgICB4OiBjdXJyZW50LnBvc2l0aW9uLnggKyBjdXJyZW50LnBvc2l0aW9uLndpZHRoIC8gMixcbiAgICAgIHk6IGN1cnJlbnQucG9zaXRpb24ueSArIGN1cnJlbnQucG9zaXRpb24uaGVpZ2h0IC8gMixcbiAgICB9O1xuXG4gICAgbGV0IGJlc3QgPSBudWxsO1xuICAgIGxldCBiZXN0U2NvcmUgPSBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gICAgZm9yIChjb25zdCBjYW5kaWRhdGUgb2YgZHRvLm5vZGVzKSB7XG4gICAgICBpZiAoY2FuZGlkYXRlLmlkID09PSBjdXJyZW50LmlkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcG9pbnQgPSB7XG4gICAgICAgIHg6IGNhbmRpZGF0ZS5wb3NpdGlvbi54ICsgY2FuZGlkYXRlLnBvc2l0aW9uLndpZHRoIC8gMixcbiAgICAgICAgeTogY2FuZGlkYXRlLnBvc2l0aW9uLnkgKyBjYW5kaWRhdGUucG9zaXRpb24uaGVpZ2h0IC8gMixcbiAgICAgIH07XG4gICAgICBjb25zdCBkeCA9IHBvaW50LnggLSBvcmlnaW4ueDtcbiAgICAgIGNvbnN0IGR5ID0gcG9pbnQueSAtIG9yaWdpbi55O1xuICAgICAgY29uc3QgZm9yd2FyZCA9XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyAmJiBkeCA+IDgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnICYmIGR4IDwgLTgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd0Rvd24nICYmIGR5ID4gOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93VXAnICYmIGR5IDwgLTgpO1xuICAgICAgaWYgKCFmb3J3YXJkKSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcHJpbWFyeSA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnIHx8IGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgPyBNYXRoLmFicyhkeCkgOiBNYXRoLmFicyhkeSk7XG4gICAgICBjb25zdCBzZWNvbmRhcnkgPVxuICAgICAgICBkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyB8fCBkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnID8gTWF0aC5hYnMoZHkpIDogTWF0aC5hYnMoZHgpO1xuICAgICAgY29uc3Qgc2NvcmUgPSBwcmltYXJ5ICsgc2Vjb25kYXJ5ICogMi4yO1xuICAgICAgaWYgKHNjb3JlIDwgYmVzdFNjb3JlKSB7XG4gICAgICAgIGJlc3RTY29yZSA9IHNjb3JlO1xuICAgICAgICBiZXN0ID0gY2FuZGlkYXRlO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoYmVzdCkge1xuICAgICAgc2VsZWN0KGJlc3QuaWQpO1xuICAgICAgbm9kZUVsZW1lbnRzLmdldChiZXN0LmlkKT8uZm9jdXMoKTtcbiAgICB9XG4gIH1cblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAnd2hlZWwnLFxuICAgIChldmVudCkgPT4ge1xuICAgICAgaWYgKCFkdG8pIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGNvbnN0IGJvdW5kcyA9IHN2Zy5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgIGNvbnN0IHBvaW50ZXJYID0gZXZlbnQuY2xpZW50WCAtIGJvdW5kcy5sZWZ0O1xuICAgICAgY29uc3QgcG9pbnRlclkgPSBldmVudC5jbGllbnRZIC0gYm91bmRzLnRvcDtcbiAgICAgIGNvbnN0IGZhY3RvciA9IGV2ZW50LmRlbHRhWSA8IDAgPyAxLjEyIDogMSAvIDEuMTI7XG4gICAgICBjb25zdCBuZXh0U2NhbGUgPSBNYXRoLm1pbigzLjUsIE1hdGgubWF4KDAuMTIsIHNjYWxlICogZmFjdG9yKSk7XG4gICAgICBjb25zdCByYXRpbyA9IG5leHRTY2FsZSAvIHNjYWxlO1xuICAgICAgdHJhbnNsYXRlWCA9IHBvaW50ZXJYIC0gKHBvaW50ZXJYIC0gdHJhbnNsYXRlWCkgKiByYXRpbztcbiAgICAgIHRyYW5zbGF0ZVkgPSBwb2ludGVyWSAtIChwb2ludGVyWSAtIHRyYW5zbGF0ZVkpICogcmF0aW87XG4gICAgICBzY2FsZSA9IG5leHRTY2FsZTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgfSxcbiAgICB7IHBhc3NpdmU6IGZhbHNlIH0sXG4gICk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmJ1dHRvbiAhPT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFnZ2luZyA9IHRydWU7XG4gICAgZHJhZ1N0YXJ0ID0geyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZLCB0eDogdHJhbnNsYXRlWCwgdHk6IHRyYW5zbGF0ZVkgfTtcbiAgICBzdmcuc2V0UG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgfSk7XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybW92ZScsIChldmVudCkgPT4ge1xuICAgIGlmICghZHJhZ2dpbmcpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdHJhbnNsYXRlWCA9IGRyYWdTdGFydC50eCArIChldmVudC5jbGllbnRYIC0gZHJhZ1N0YXJ0LngpO1xuICAgIHRyYW5zbGF0ZVkgPSBkcmFnU3RhcnQudHkgKyAoZXZlbnQuY2xpZW50WSAtIGRyYWdTdGFydC55KTtcbiAgICBhcHBseVRyYW5zZm9ybSgpO1xuICB9KTtcbiAgY29uc3QgZW5kRHJhZyA9IChldmVudCkgPT4ge1xuICAgIGRyYWdnaW5nID0gZmFsc2U7XG4gICAgaWYgKHN2Zy5oYXNQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpKSB7XG4gICAgICBzdmcucmVsZWFzZVBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gICAgfVxuICB9O1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcnVwJywgZW5kRHJhZyk7XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyY2FuY2VsJywgZW5kRHJhZyk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgIGlmIChzZWxlY3RlZElkKSB7XG4gICAgICBzZWxlY3QobnVsbCk7XG4gICAgfVxuICB9KTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5rZXkuc3RhcnRzV2l0aCgnQXJyb3cnKSkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIG1vdmVTZWxlY3Rpb24oZXZlbnQua2V5KTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJysnIHx8IGV2ZW50LmtleSA9PT0gJz0nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGUgPSBNYXRoLm1pbigzLjUsIHNjYWxlICogMS4xNSk7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnLScpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTIsIHNjYWxlIC8gMS4xNSk7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnMCcpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB6b29tVG9GaXQoKTtcbiAgICB9XG4gIH0pO1xuXG4gIHJldHVybiB7XG4gICAgcmVuZGVyLFxuICAgIHNlbGVjdCxcbiAgICB6b29tVG9GaXQsXG4gICAgZGVzdHJveSgpIHtcbiAgICAgIGNsZWFyKCk7XG4gICAgICBkdG8gPSBudWxsO1xuICAgIH0sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBXZWJ2aWV3IGVudHJ5IHBvaW50LlxuICpcbiAqIFJlc3BvbnNpYmlsaXRpZXMgYXJlIGRlbGliZXJhdGVseSBuYXJyb3c6IHRhbGsgcHJvdG9jb2wsIHJlbmRlciB0aGUgRFRPLCBzaG93XG4gKiBzZWxlY3Rpb24gZGV0YWlscy4gTm8gYW5hbHlzaXMsIG5vIGZpbGUgYWNjZXNzLCBubyBncmFwaCBjb25zdHJ1Y3Rpb24uXG4gKi9cblxuaW1wb3J0IHsgY3JlYXRlQnJpZGdlIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9icmlkZ2UuanMnO1xuaW1wb3J0IHsgRElSRUNUSU9OUywgUFJPVE9DT0xfVkVSU0lPTiB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMnO1xuaW1wb3J0IHsgdmFsaWRhdGVEdG8gfSBmcm9tICcuLi9jb3JlL2dyYXBoL2R0by5qcyc7XG5pbXBvcnQgeyBjcmVhdGVTdmdSZW5kZXJlciB9IGZyb20gJy4uL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMnO1xuXG5jb25zdCB2c2NvZGVBcGkgPSBhY3F1aXJlVnNDb2RlQXBpKCk7XG5cbmNvbnN0IHN2ZyA9IC8qKiBAdHlwZSB7U1ZHU1ZHRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1ncmFwaCcpKTtcbmNvbnN0IG1ldGEgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLW1ldGEnKSk7XG5jb25zdCBzdGF0dXMgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXN0YXR1cycpKTtcbmNvbnN0IGJhbm5lciA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtYmFubmVyJykpO1xuY29uc3QgZW1wdHkgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWVtcHR5JykpO1xuY29uc3QgZGV0YWlsQm9keSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZGV0YWlsLWJvZHknKSk7XG5jb25zdCBsZWdlbmQgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWxlZ2VuZCcpKTtcbmNvbnN0IHJlbG9hZEJ1dHRvbiA9IC8qKiBAdHlwZSB7SFRNTEJ1dHRvbkVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtcmVmcmVzaCcpKTtcbmNvbnN0IGZ1bmN0aW9uUGlja2VyID0gLyoqIEB0eXBlIHtIVE1MU2VsZWN0RWxlbWVudHxudWxsfSAqLyAoXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1mdW5jdGlvbicpXG4pO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0byB8IG51bGx9ICovXG5sZXQgY3VycmVudER0byA9IG51bGw7XG5jb25zdCBwcmVmZXJyZWRTeW1ib2xJZCA9IGRvY3VtZW50LmJvZHkuZGF0YXNldC5wcmVmZXJyZWRTeW1ib2wgfHwgbnVsbDtcblxuLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xubGV0IHNlbGVjdGVkU3ltYm9sSWQgPSBwcmVmZXJyZWRTeW1ib2xJZDtcblxuXG5jb25zdCByZW5kZXJlciA9IGNyZWF0ZVN2Z1JlbmRlcmVyKHtcbiAgc3ZnLFxuICBvblNlbGVjdDogKG5vZGVJZCwgbm9kZSkgPT4ge1xuICAgIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpO1xuICAgIGJyaWRnZS5yZXNwb25kKCdub2RlLnNlbGVjdCcsIHsgbm9kZUlkIH0pO1xuICB9LFxufSk7XG5cbmNvbnN0IGJyaWRnZSA9IGNyZWF0ZUJyaWRnZSh7XG4gIHBvc3Q6IChtZXNzYWdlKSA9PiB2c2NvZGVBcGkucG9zdE1lc3NhZ2UobWVzc2FnZSksXG4gIGluYm91bmREaXJlY3Rpb246IERJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXLFxuICB0aW1lb3V0TXM6IDgwMDAsXG4gIGxvZ2dlcjoge1xuICAgIGRlYnVnOiAoKSA9PiB7fSxcbiAgICB3YXJuOiAobWVzc2FnZSwgZmllbGRzKSA9PiBjb25zb2xlLndhcm4oJ1tjb2RlZmxvd10nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICAgIGVycm9yOiAobWVzc2FnZSwgZmllbGRzKSA9PiBjb25zb2xlLmVycm9yKCdbY29kZWZsb3ddJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgfSxcbn0pO1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcGFyYW0ge2Jvb2xlYW59IFtpc0Vycm9yXVxuICovXG5mdW5jdGlvbiBzZXRCYW5uZXIobWVzc2FnZSwgaXNFcnJvciA9IGZhbHNlKSB7XG4gIGlmICghbWVzc2FnZSkge1xuICAgIGJhbm5lci5oaWRkZW4gPSB0cnVlO1xuICAgIGJhbm5lci50ZXh0Q29udGVudCA9ICcnO1xuICAgIHJldHVybjtcbiAgfVxuICBiYW5uZXIuaGlkZGVuID0gZmFsc2U7XG4gIGJhbm5lci5jbGFzc0xpc3QudG9nZ2xlKCdpcy1lcnJvcicsIGlzRXJyb3IpO1xuICBiYW5uZXIudGV4dENvbnRlbnQgPSBtZXNzYWdlO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0XG4gKi9cbmZ1bmN0aW9uIHNldFN0YXR1cyh0ZXh0KSB7XG4gIHN0YXR1cy50ZXh0Q29udGVudCA9IHRleHQ7XG59XG5cbmZ1bmN0aW9uIGNsZWFyRGV0YWlsKCkge1xuICBkZXRhaWxCb2R5LnJlcGxhY2VDaGlsZHJlbigpO1xuICBjb25zdCBwYXJhZ3JhcGggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdwJyk7XG4gIHBhcmFncmFwaC5jbGFzc05hbWUgPSAnY2YtbXV0ZWQnO1xuICBwYXJhZ3JhcGgudGV4dENvbnRlbnQgPSAnU2VsZWN0IGEgbm9kZSB0byBpbnNwZWN0IGl0Lic7XG4gIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQocGFyYWdyYXBoKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbGFiZWxcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHJldHVybnMge1tIVE1MRWxlbWVudCwgSFRNTEVsZW1lbnRdfVxuICovXG5mdW5jdGlvbiBkZXRhaWxQYWlyKGxhYmVsLCB2YWx1ZSkge1xuICBjb25zdCB0ZXJtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZHQnKTtcbiAgdGVybS50ZXh0Q29udGVudCA9IGxhYmVsO1xuICBjb25zdCBkZXNjcmlwdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RkJyk7XG4gIGRlc2NyaXB0aW9uLnRleHRDb250ZW50ID0gdmFsdWU7XG4gIHJldHVybiBbdGVybSwgZGVzY3JpcHRpb25dO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBub2RlSWRcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkR0b05vZGV9IFtub2RlXVxuICovXG5mdW5jdGlvbiBzaG93Tm9kZURldGFpbHMobm9kZUlkLCBub2RlKSB7XG4gIGlmICghbm9kZUlkIHx8ICFub2RlKSB7XG4gICAgY2xlYXJEZXRhaWwoKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgbGlzdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RsJyk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2xhYmVsJywgbm9kZS5sYWJlbCkpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdraW5kJywgbm9kZS5raW5kKSk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3N0YXR1cycsIG5vZGUuc3RhdHVzKSk7XG4gIGlmIChub2RlLmV4dGVybmFsKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignb3JpZ2luJywgJ2V4dGVybmFsIHRhcmdldCAobm90IGRlY2xhcmVkIGluIHRoZSBhbmFseXNpcyknKSk7XG4gIH1cbiAgaWYgKG5vZGUucmFuZ2UpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdsaW5lcycsIGAke25vZGUucmFuZ2Uuc3RhcnRMaW5lICsgMX1cdTIwMTMke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCkpO1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2ZpbGUnLCBub2RlLnJhbmdlLmZpbGVJZCkpO1xuICB9XG4gIGlmIChub2RlLmJhZGdlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbm90ZScsIG5vZGUuYmFkZ2UpKTtcbiAgfVxuICBpZiAobm9kZS5pc1N5bnRoZXRpYykge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ29yaWdpbicsICdzeW50aGV0aWMgc3RydWN0dXJhbCBub2RlJykpO1xuICB9XG4gIGlmIChub2RlLnVucmVhY2hhYmxlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVhY2hhYmlsaXR5JywgJ25vdCByZWFjaGFibGUgZnJvbSBlbnRyeScpKTtcbiAgfVxuICBpZiAobm9kZS5yZWFzb25Db2RlKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVhc29uJywgbm9kZS5yZWFzb25Db2RlKSk7XG4gIH1cbiAgaWYgKEFycmF5LmlzQXJyYXkobm9kZS5jYWxscykgJiYgbm9kZS5jYWxscy5sZW5ndGggPiAwKSB7XG4gICAgbGlzdC5hcHBlbmQoXG4gICAgICAuLi5kZXRhaWxQYWlyKFxuICAgICAgICAnY2FsbHMnLFxuICAgICAgICBub2RlLmNhbGxzLm1hcCgoY2FsbCkgPT4gYCR7Y2FsbC5sYWJlbH0gKCR7Y2FsbC5zdGF0dXN9KWApLmpvaW4oJywgJyksXG4gICAgICApLFxuICAgICk7XG4gIH1cblxuICBjb25zdCBlZGdlcyA9IChjdXJyZW50RHRvPy5lZGdlcyA/PyBbXSkuZmlsdGVyKFxuICAgIChlZGdlKSA9PiBlZGdlLmZyb20gPT09IG5vZGVJZCB8fCBlZGdlLnRvID09PSBub2RlSWQsXG4gICk7XG4gIGlmIChlZGdlcy5sZW5ndGggPiAwKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVsYXRpb25zaGlwcycsIFN0cmluZyhlZGdlcy5sZW5ndGgpKSk7XG4gIH1cblxuICBkZXRhaWxCb2R5LnJlcGxhY2VDaGlsZHJlbihsaXN0KTtcblxuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGhlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRpbmcuY2xhc3NOYW1lID0gJ2NmLWRldGFpbC10aXRsZSc7XG4gICAgaGVhZGluZy50ZXh0Q29udGVudCA9ICdSZWxhdGlvbnNoaXBzJztcbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGhlYWRpbmcpO1xuXG4gICAgY29uc3QgZWRnZUxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIGVkZ2VMaXN0LmNsYXNzTmFtZSA9ICdjZi1sZWdlbmQnO1xuICAgIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcy5zbGljZSgwLCAxMikpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyAnXHUyMTkyJyA6ICdcdTIxOTAnO1xuICAgICAgY29uc3Qgb3RoZXIgPSBlZGdlLmZyb20gPT09IG5vZGVJZCA/IGVkZ2UudG8gOiBlZGdlLmZyb207XG4gICAgICBpdGVtLnRleHRDb250ZW50ID0gYCR7ZGlyZWN0aW9ufSAke2VkZ2UudHlwZX0gXHUwMEI3ICR7b3RoZXJ9ICgke2VkZ2Uuc3RhdHVzfSlgO1xuICAgICAgZWRnZUxpc3QuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQoZWRnZUxpc3QpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IGR0b1xuICovXG5mdW5jdGlvbiByZW5kZXJMZWdlbmQoZHRvKSB7XG4gIGxlZ2VuZC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgZm9yIChjb25zdCBzdGF0dXNOYW1lIG9mIGR0by5sZWdlbmQuc3RhdHVzZXMpIHtcbiAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBjb25zdCBzd2F0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgc3dhdGNoLmNsYXNzTmFtZSA9IGBjZi1zd2F0Y2ggY2YtZWRnZS0tJHtzdGF0dXNOYW1lfWA7XG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbGFiZWwudGV4dENvbnRlbnQgPSBzdGF0dXNOYW1lO1xuICAgIGlmIChzdGF0dXNOYW1lICE9PSAncmVzb2x2ZWQnKSB7XG4gICAgICBsYWJlbC50ZXh0Q29udGVudCA9IGAke3N0YXR1c05hbWV9IChwYXR0ZXJuICsgbGFiZWwpYDtcbiAgICB9XG4gICAgaXRlbS5hcHBlbmQoc3dhdGNoLCBsYWJlbCk7XG4gICAgbGVnZW5kLmFwcGVuZENoaWxkKGl0ZW0pO1xuICB9XG4gIGZvciAoY29uc3QgZWRnZUtpbmQgb2YgZHRvLmxlZ2VuZC5lZGdlS2luZHMgPz8gW10pIHtcbiAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBjb25zdCBzd2F0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgc3dhdGNoLmNsYXNzTmFtZSA9IGBjZi1zd2F0Y2ggY2YtZWRnZS0ta2luZC0ke2VkZ2VLaW5kfWA7XG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbGFiZWwudGV4dENvbnRlbnQgPSBgZWRnZTogJHtlZGdlS2luZH1gO1xuICAgIGl0ZW0uYXBwZW5kKHN3YXRjaCwgbGFiZWwpO1xuICAgIGxlZ2VuZC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7QXJyYXk8e3N5bWJvbElkOiBzdHJpbmcsIG5hbWU6IHN0cmluZywgcXVhbGlmaWVkTmFtZTogc3RyaW5nLCBraW5kOiBzdHJpbmd9Pn0gbGlzdFxuICovXG5mdW5jdGlvbiByZW5kZXJGdW5jdGlvblBpY2tlcihsaXN0KSB7XG4gIGlmICghZnVuY3Rpb25QaWNrZXIpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgZnVuY3Rpb25QaWNrZXIucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGZvciAoY29uc3QgZW50cnkgb2YgbGlzdCkge1xuICAgIGNvbnN0IG9wdGlvbiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ29wdGlvbicpO1xuICAgIG9wdGlvbi52YWx1ZSA9IGVudHJ5LnN5bWJvbElkO1xuICAgIG9wdGlvbi50ZXh0Q29udGVudCA9IGAke2VudHJ5LnF1YWxpZmllZE5hbWV9ICgke2VudHJ5LmtpbmR9KWA7XG4gICAgZnVuY3Rpb25QaWNrZXIuYXBwZW5kQ2hpbGQob3B0aW9uKTtcbiAgfVxuICBmdW5jdGlvblBpY2tlci5oaWRkZW4gPSBsaXN0Lmxlbmd0aCA8PSAxO1xuICBpZiAoc2VsZWN0ZWRTeW1ib2xJZCkge1xuICAgIGZ1bmN0aW9uUGlja2VyLnZhbHVlID0gc2VsZWN0ZWRTeW1ib2xJZDtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93Q2FwYWJpbGl0aWVzKHBheWxvYWQpIHtcbiAgY29uc3QgYWRhcHRlcnMgPSBBcnJheS5pc0FycmF5KHBheWxvYWQuYWRhcHRlcnMpID8gcGF5bG9hZC5hZGFwdGVycyA6IFtdO1xuICBjb25zdCBuYW1lcyA9IGFkYXB0ZXJzLm1hcCgoYWRhcHRlcikgPT4gYWRhcHRlci5pZCkuam9pbignLCAnKSB8fCAnbm9uZSc7XG4gIG1ldGEudGV4dENvbnRlbnQgPSBgTW9jayBkYXRhIFx1MDBCNyBhZGFwdGVyczogJHtuYW1lc30gXHUwMEI3IHByb3RvY29sIHYke3BheWxvYWQucHJvdG9jb2xWZXJzaW9uID8/ICc/J31gO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gcGF5bG9hZFxuICovXG5mdW5jdGlvbiBoYW5kbGVHcmFwaChwYXlsb2FkKSB7XG4gIGNvbnN0IGR0b0NhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7e2R0bz86IHVua25vd259fSAqLyAocGF5bG9hZCkuZHRvO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8oZHRvQ2FuZGlkYXRlKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgc2V0QmFubmVyKGBJbnZhbGlkIGdyYXBoIHBheWxvYWQ6ICR7dmFsaWRhdGlvbi5pc3N1ZXNbMF19YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdSZW5kZXIgZmFpbGVkJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGR0byA9IHZhbGlkYXRpb24uZHRvO1xuICBjdXJyZW50RHRvID0gZHRvO1xuICBlbXB0eS5oaWRkZW4gPSB0cnVlO1xuICByZW5kZXJlci5yZW5kZXIoZHRvKTtcbiAgcmVuZGVyTGVnZW5kKGR0byk7XG4gIGNsZWFyRGV0YWlsKCk7XG4gIGNvbnN0IHN1YmplY3QgPVxuICAgIGR0by5kdG9LaW5kID09PSAnY2ZnJyAmJiBkdG8uZnVuY3Rpb25cbiAgICAgID8gYCR7ZHRvLmZ1bmN0aW9uLnF1YWxpZmllZE5hbWV9IFx1MDBCNyBDRkdgXG4gICAgICA6ICdjYWxsIGdyYXBoJztcbiAgc2V0U3RhdHVzKFxuICAgIGAke3N1YmplY3R9IFx1MDBCNyAke2R0by5sYW5ndWFnZX0gXHUwMEI3ICR7ZHRvLm5vZGVzLmxlbmd0aH0gbm9kZXMgXHUwMEI3ICR7ZHRvLmVkZ2VzLmxlbmd0aH0gZWRnZXMgXHUwMEI3ICR7ZHRvLmNvbXBsZXRlbmVzc31gLFxuICApO1xuICBtZXRhLnRleHRDb250ZW50ID0gYCR7ZHRvLmFkYXB0ZXJJZH0gXHUwMEI3ICR7c3ViamVjdH0gXHUwMEI3IGR0byB2JHtkdG8uZHRvVmVyc2lvbn1gO1xuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBkdG8uZGVncmFkYXRpb25zID8/IFtdO1xuICBjb25zdCBtZXNzYWdlcyA9IGRlZ3JhZGF0aW9ucy5tYXAoKGVudHJ5KSA9PlxuICAgIHR5cGVvZiBlbnRyeSA9PT0gJ3N0cmluZydcbiAgICAgID8gZW50cnlcbiAgICAgIDogYCR7ZW50cnkuc2V2ZXJpdHkgPT09ICdpbmZvJyA/ICcnIDogYCR7ZW50cnkuc2V2ZXJpdHl9OiBgfSR7ZW50cnkubWVzc2FnZX1gLFxuICApO1xuICBzZXRCYW5uZXIobWVzc2FnZXMubGVuZ3RoID4gMCA/IG1lc3NhZ2VzLmpvaW4oJyBcdTAwQjcgJykgOiAnJywgZmFsc2UpO1xufVxuXG5icmlkZ2Uub24oJ3Byb3RvY29sLmVycm9yJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvci4nO1xuICBzZXRCYW5uZXIoYCR7Y29kZX06ICR7bWVzc2FnZX1gLCB0cnVlKTtcbiAgc2V0U3RhdHVzKCdFcnJvcicpO1xufSk7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHN5bWJvbElkXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIGxvYWRDZmcoc3ltYm9sSWQpIHtcbiAgc2V0U3RhdHVzKCdCdWlsZGluZyBjb250cm9sLWZsb3cgZ3JhcGhcdTIwMjYnKTtcbiAgc2V0QmFubmVyKCcnKTtcbiAgdHJ5IHtcbiAgICAvLyBBIHJlcXVlc3QgcmVzb2x2ZXMgd2l0aCBpdHMgY29ycmVsYXRlZCByZXNwb25zZS4gVGhlIHJlc3BvbnNlIGlzIG5vdFxuICAgIC8vIGRpc3BhdGNoZWQgdG8gYGJyaWRnZS5vbmAsIHNvIGhhbmRsZSBpdCBoZXJlLlxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ2NmZy5sb2FkJywgeyBzeW1ib2xJZCB9KTtcbiAgICBzZWxlY3RlZFN5bWJvbElkID0gc3ltYm9sSWQ7XG4gICAgaGFuZGxlR3JhcGgocmVzcG9uc2UucGF5bG9hZCk7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgc2V0QmFubmVyKGBDb3VsZCBub3QgYnVpbGQgQ0ZHOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdDRkcgdW5hdmFpbGFibGUnKTtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cbn1cblxuYXN5bmMgZnVuY3Rpb24gbG9hZEdyYXBoKCkge1xuICBzZXRTdGF0dXMoJ0xvYWRpbmcgZ3JhcGhcdTIwMjYnKTtcbiAgc2V0QmFubmVyKCcnKTtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdjZmcuZnVuY3Rpb25zJywge30pO1xuICAgIGNvbnN0IGxpc3QgPSBBcnJheS5pc0FycmF5KHJlc3BvbnNlLnBheWxvYWQuZnVuY3Rpb25zKSA/IHJlc3BvbnNlLnBheWxvYWQuZnVuY3Rpb25zIDogW107XG4gICAgaWYgKGxpc3QubGVuZ3RoID4gMCkge1xuICAgICAgcmVuZGVyRnVuY3Rpb25QaWNrZXIobGlzdCk7XG4gICAgICBjb25zdCByZXRhaW5lZCA9XG4gICAgICAgIHNlbGVjdGVkU3ltYm9sSWQgJiYgbGlzdC5zb21lKChlbnRyeSkgPT4gZW50cnkuc3ltYm9sSWQgPT09IHNlbGVjdGVkU3ltYm9sSWQpXG4gICAgICAgICAgPyBzZWxlY3RlZFN5bWJvbElkXG4gICAgICAgICAgOiBsaXN0WzBdLnN5bWJvbElkO1xuICAgICAgY29uc3QgbG9hZGVkID0gYXdhaXQgbG9hZENmZyhyZXRhaW5lZCk7XG4gICAgICBpZiAobG9hZGVkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG4gIH0gY2F0Y2gge1xuICAgIC8vIFRoZSBDRkcgY2FwYWJpbGl0eSBtYXkgYmUgYWJzZW50IChmb3IgZXhhbXBsZSB0aGUgYnVpbHQtaW4gZGVtbyBydW4pLlxuICAgIC8vIEZhbGxpbmcgYmFjayB0byB0aGUgY2FsbCBncmFwaCBrZWVwcyB0aGUgcGFuZWwgdXNlZnVsIGFuZCBob25lc3QuXG4gIH1cbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdncmFwaC5sb2FkJywgeyBkZW1vOiB0cnVlIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IGxvYWQgZ3JhcGg6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0xvYWQgZmFpbGVkJyk7XG4gICAgZW1wdHkuaGlkZGVuID0gZmFsc2U7XG4gIH1cbn1cblxucmVsb2FkQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICB2b2lkIGxvYWRHcmFwaCgpO1xufSk7XG5cbmZ1bmN0aW9uUGlja2VyPy5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCAoKSA9PiB7XG4gIGNvbnN0IHN5bWJvbElkID0gZnVuY3Rpb25QaWNrZXIudmFsdWU7XG4gIGlmIChzeW1ib2xJZCkge1xuICAgIHZvaWQgbG9hZENmZyhzeW1ib2xJZCk7XG4gIH1cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXZlbnQpID0+IHtcbiAgc2V0QmFubmVyKGBXZWJ2aWV3IGVycm9yOiAke2V2ZW50Lm1lc3NhZ2V9YCwgdHJ1ZSk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsIChldmVudCkgPT4ge1xuICBzZXRCYW5uZXIoYFVuaGFuZGxlZCByZWplY3Rpb246ICR7U3RyaW5nKGV2ZW50LnJlYXNvbil9YCwgdHJ1ZSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gYm9vdCgpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCd3ZWJ2aWV3LnJlYWR5Jywge1xuICAgICAgY2xpZW50OiAnd2VidmlldycsXG4gICAgICBwcm90b2NvbFZlcnNpb246IFBST1RPQ09MX1ZFUlNJT04sXG4gICAgfSk7XG4gICAgc2hvd0NhcGFiaWxpdGllcyhyZXNwb25zZS5wYXlsb2FkKTtcbiAgfSBjYXRjaCB7XG4gICAgLy8gQ2FwYWJpbGl0aWVzIGFyZSBpbmZvcm1hdGlvbmFsOyBncmFwaCBsb2FkIGNhbiBzdGlsbCBzdWNjZWVkLlxuICB9XG4gIGF3YWl0IGxvYWRHcmFwaCgpO1xufVxuXG52b2lkIGJvb3QoKTtcbiJdLAogICJtYXBwaW5ncyI6ICI7O0FBV08sTUFBTSxtQkFBbUI7QUFHekIsTUFBTSxvQkFBb0I7QUFHMUIsTUFBTSxlQUFlO0FBRXJCLE1BQU0scUJBQXFCO0FBRzNCLE1BQU0sa0JBQWtCLE9BQU8sT0FBTztBQUFBLElBQzNDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFFTSxNQUFNLGFBQWEsT0FBTyxPQUFPO0FBQUEsSUFDdEMsaUJBQWlCO0FBQUEsSUFDakIsaUJBQWlCO0FBQUEsRUFDbkIsQ0FBQztBQUVELE1BQU0saUJBQWlCLE9BQU8sT0FBTztBQUFBLElBQ25DLENBQUMsV0FBVyxlQUFlLEdBQUcsSUFBSSxJQUFJLGVBQWU7QUFBQSxJQUNyRCxDQUFDLFdBQVcsZUFBZSxHQUFHLElBQUksSUFBSSxlQUFlO0FBQUEsRUFDdkQsQ0FBQztBQUVELE1BQU0sY0FBYyxvQkFBSSxJQUFJLENBQUMsYUFBYSxlQUFlLFdBQVcsQ0FBQztBQUVyRSxNQUFNLHFCQUFxQjtBQW1DcEIsV0FBUyxlQUFlLE1BQU0sU0FBUyxXQUFXO0FBRXZELFVBQU0sV0FBVztBQUFBLE1BQ2YsaUJBQWlCO0FBQUEsTUFDakI7QUFBQSxNQUNBLFNBQVMsV0FBVyxDQUFDO0FBQUEsSUFDdkI7QUFDQSxRQUFJLFdBQVc7QUFDYixlQUFTLFlBQVk7QUFBQSxJQUN2QjtBQUNBLFdBQU87QUFBQSxFQUNUO0FBVU8sV0FBUyxtQkFBbUIsTUFBTSxTQUFTLFFBQVE7QUFFeEQsVUFBTSxVQUFVLEVBQUUsTUFBTSxRQUFRO0FBQ2hDLFFBQUksUUFBUTtBQUNWLGNBQVEsU0FBUztBQUFBLElBQ25CO0FBQ0EsV0FBTztBQUFBLEVBQ1Q7QUFVTyxXQUFTLFlBQVksT0FBTztBQUNqQyxRQUFJO0FBQ0YsWUFBTSxPQUFPLEtBQUssVUFBVSxLQUFLO0FBQ2pDLGFBQU8sT0FBTyxTQUFTLFdBQVcsS0FBSyxTQUFTO0FBQUEsSUFDbEQsUUFBUTtBQUNOLGFBQU8sT0FBTztBQUFBLElBQ2hCO0FBQUEsRUFDRjtBQU1BLFdBQVMsY0FBYyxPQUFPO0FBQzVCLFdBQU8sT0FBTyxVQUFVLFlBQVksVUFBVSxRQUFRLENBQUMsTUFBTSxRQUFRLEtBQUs7QUFBQSxFQUM1RTtBQVVBLFdBQVMsZUFBZSxPQUFPLE1BQU0sT0FBTztBQUMxQyxRQUFJLFFBQVEsc0JBQXNCLFVBQVUsUUFBUSxPQUFPLFVBQVUsVUFBVTtBQUM3RSxhQUFPLEVBQUUsSUFBSSxLQUFLO0FBQUEsSUFDcEI7QUFDQSxVQUFNLFVBQVUsTUFBTSxRQUFRLEtBQUssSUFBSSxNQUFNLFFBQVEsSUFBSSxPQUFPLFFBQVEsS0FBSztBQUM3RSxlQUFXLENBQUMsS0FBSyxLQUFLLEtBQUssU0FBUztBQUNsQyxZQUFNLFlBQVksTUFBTSxRQUFRLEtBQUssSUFBSSxHQUFHLElBQUksSUFBSSxHQUFHLE1BQU0sR0FBRyxJQUFJLElBQUksR0FBRztBQUMzRSxVQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssS0FBSyxZQUFZLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRztBQUN6RCxlQUFPLEVBQUUsSUFBSSxPQUFPLE1BQU0sV0FBVyxLQUFLLE9BQU8sR0FBRyxFQUFFO0FBQUEsTUFDeEQ7QUFDQSxZQUFNLFNBQVMsZUFBZSxPQUFPLFdBQVcsUUFBUSxDQUFDO0FBQ3pELFVBQUksQ0FBQyxPQUFPLElBQUk7QUFDZCxlQUFPO0FBQUEsTUFDVDtBQUFBLElBQ0Y7QUFDQSxXQUFPLEVBQUUsSUFBSSxLQUFLO0FBQUEsRUFDcEI7QUFZTyxXQUFTLGlCQUFpQixLQUFLLFNBQVM7QUFDN0MsVUFBTSxZQUFZLFNBQVM7QUFDM0IsVUFBTSxZQUFZLGVBQWUsU0FBUztBQUMxQyxRQUFJLENBQUMsV0FBVztBQUNkLGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVMsK0JBQStCLE9BQU8sU0FBUyxDQUFDO0FBQUEsTUFDM0Q7QUFBQSxJQUNGO0FBRUEsUUFBSSxDQUFDLGNBQWMsR0FBRyxHQUFHO0FBQ3ZCLGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVM7QUFBQSxNQUNYO0FBQUEsSUFDRjtBQUVBLFVBQU07QUFBQTtBQUFBLE1BQW9EO0FBQUE7QUFFMUQsUUFBSSxVQUFVLG9CQUFvQixrQkFBa0I7QUFDbEQsYUFBTztBQUFBLFFBQ0wsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsU0FBUywwQ0FBMEMsZ0JBQWdCLGNBQWM7QUFBQSxVQUMvRSxVQUFVO0FBQUEsUUFDWixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFFQSxVQUFNLE9BQU8sVUFBVTtBQUN2QixRQUFJLE9BQU8sU0FBUyxZQUFZLENBQUMsYUFBYSxLQUFLLElBQUksR0FBRztBQUN4RCxhQUFPO0FBQUEsUUFDTCxJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTO0FBQUEsUUFDVCxNQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFFQSxRQUFJLENBQUMsVUFBVSxJQUFJLElBQUksR0FBRztBQUN4QixhQUFPO0FBQUEsUUFDTCxJQUFJO0FBQUEsUUFDSixNQUFNO0FBQUEsUUFDTixRQUFRO0FBQUEsUUFDUixTQUFTLFNBQVMsSUFBSSxtQ0FBbUMsU0FBUztBQUFBLFFBQ2xFLE1BQU07QUFBQSxNQUNSO0FBQUEsSUFDRjtBQUVBLFVBQU0sWUFBWSxVQUFVO0FBQzVCLFFBQUksY0FBYyxRQUFXO0FBQzNCLFVBQUksT0FBTyxjQUFjLFlBQVksQ0FBQyxtQkFBbUIsS0FBSyxTQUFTLEdBQUc7QUFDeEUsZUFBTztBQUFBLFVBQ0wsSUFBSTtBQUFBLFVBQ0osTUFBTTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsU0FBUztBQUFBLFVBQ1QsTUFBTTtBQUFBLFFBQ1I7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFVBQU0sVUFBVSxVQUFVLFdBQVcsQ0FBQztBQUN0QyxRQUFJLENBQUMsY0FBYyxPQUFPLEdBQUc7QUFDM0IsYUFBTztBQUFBLFFBQ0wsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsU0FBUztBQUFBLFFBQ1QsTUFBTTtBQUFBLFFBQ04sV0FBVyxPQUFPLGNBQWMsV0FBVyxZQUFZO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBRUEsVUFBTSxVQUFVLGVBQWUsU0FBUyxXQUFXLENBQUM7QUFDcEQsUUFBSSxDQUFDLFFBQVEsSUFBSTtBQUNmLGFBQU87QUFBQSxRQUNMLElBQUk7QUFBQSxRQUNKLE1BQU07QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLFNBQVMscUNBQXFDLFFBQVEsR0FBRztBQUFBLFFBQ3pELE1BQU0sUUFBUTtBQUFBLFFBQ2QsV0FBVyxPQUFPLGNBQWMsV0FBVyxZQUFZO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBRUEsUUFBSSxZQUFZLFNBQVMsSUFBSSxtQkFBbUI7QUFDOUMsYUFBTztBQUFBLFFBQ0wsSUFBSTtBQUFBLFFBQ0osTUFBTTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsU0FBUyx1QkFBdUIsaUJBQWlCO0FBQUEsUUFDakQsV0FBVyxPQUFPLGNBQWMsV0FBVyxZQUFZO0FBQUEsTUFDekQ7QUFBQSxJQUNGO0FBR0EsVUFBTSxXQUFXO0FBQUEsTUFDZixpQkFBaUI7QUFBQSxNQUNqQjtBQUFBLE1BQ0E7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLGNBQWMsVUFBVTtBQUNqQyxlQUFTLFlBQVk7QUFBQSxJQUN2QjtBQUVBLFdBQU8sRUFBRSxJQUFJLE1BQU0sU0FBUztBQUFBLEVBQzlCOzs7QUN0Uk8sTUFBTSxnQkFBTixjQUE0QixNQUFNO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLElBTXZDLFlBQVksTUFBTSxTQUFTLFFBQVE7QUFDakMsWUFBTSxPQUFPO0FBQ2IsV0FBSyxPQUFPO0FBQ1osV0FBSyxPQUFPO0FBQ1osVUFBSSxRQUFRO0FBQ1YsYUFBSyxTQUFTO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUdBLE1BQU0sY0FBYztBQUFBLElBQ2xCLFFBQVE7QUFBQSxJQUFDO0FBQUEsSUFDVCxPQUFPO0FBQUEsSUFBQztBQUFBLElBQ1IsUUFBUTtBQUFBLElBQUM7QUFBQSxFQUNYO0FBZU8sV0FBUyxhQUFhLFNBQVM7QUFDcEMsVUFBTSxFQUFFLE1BQU0sa0JBQWtCLFNBQVMsWUFBWSxJQUFJO0FBQ3pELFVBQU0sWUFBWSxRQUFRLGFBQWE7QUFDdkMsVUFBTSxjQUFjLFFBQVEsZUFBZTtBQUMzQyxVQUFNLG9CQUNKLHFCQUFxQixXQUFXLGtCQUM1QixXQUFXLGtCQUNYLFdBQVc7QUFDakIsVUFBTSxnQkFBZ0IsSUFBSTtBQUFBLE1BQ3hCLHNCQUFzQixXQUFXLGtCQUFrQixrQkFBa0I7QUFBQSxJQUN2RTtBQUVBLFFBQUksV0FBVztBQUNmLFVBQU0sa0JBQ0osUUFBUSxvQkFDUCxNQUFNO0FBQ0wsa0JBQVk7QUFDWixhQUFPLElBQUksU0FBUyxTQUFTLEVBQUUsQ0FBQyxJQUFJLEtBQUssT0FBTyxFQUFFLFNBQVMsRUFBRSxFQUFFLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFBQSxJQUM3RTtBQUdGLFVBQU0sVUFBVSxvQkFBSSxJQUFJO0FBRXhCLFVBQU0sV0FBVyxvQkFBSSxJQUFJO0FBQ3pCLFVBQU0sZ0JBQWdCLG9CQUFJLElBQUk7QUFDOUIsUUFBSSxXQUFXO0FBT2YsYUFBUyxLQUFLLE1BQU0sU0FBUyxXQUFXO0FBQ3RDLFVBQUksVUFBVTtBQUNaLGNBQU0sSUFBSSxjQUFjLGVBQWUscUJBQXFCO0FBQUEsTUFDOUQ7QUFDQSxVQUFJLENBQUMsY0FBYyxJQUFJLElBQUksR0FBRztBQUM1QixjQUFNLElBQUksY0FBYyxjQUFjLFNBQVMsSUFBSSxzQ0FBc0M7QUFBQSxNQUMzRjtBQUNBLFlBQU0sV0FBVyxlQUFlLE1BQU0sU0FBUyxTQUFTO0FBQ3hELFVBQUksWUFBWSxRQUFRLElBQUksS0FBVztBQUNyQyxjQUFNLElBQUksY0FBYyxXQUFXLHdDQUF3QztBQUFBLE1BQzdFO0FBQ0EsV0FBSyxRQUFRO0FBQ2IsYUFBTyxNQUFNLGlCQUFpQjtBQUFBLFFBQzVCO0FBQUEsUUFDQSxXQUFXLGFBQWE7QUFBQSxRQUN4QixPQUFPLFlBQVksUUFBUTtBQUFBLE1BQzdCLENBQUM7QUFBQSxJQUNIO0FBUUEsYUFBUyxVQUFVLE1BQU0sU0FBUyxXQUFXLFFBQVE7QUFDbkQsVUFBSTtBQUNGLGFBQUssa0JBQWtCLG1CQUFtQixNQUFNLFNBQVMsTUFBTSxHQUFHLFNBQVM7QUFBQSxNQUM3RSxRQUFRO0FBQUEsTUFFUjtBQUFBLElBQ0Y7QUFPQSxhQUFTLEdBQUcsTUFBTSxTQUFTO0FBQ3pCLGVBQVMsSUFBSSxNQUFNLE9BQU87QUFDMUIsYUFBTyxNQUFNO0FBQ1gsWUFBSSxTQUFTLElBQUksSUFBSSxNQUFNLFNBQVM7QUFDbEMsbUJBQVMsT0FBTyxJQUFJO0FBQUEsUUFDdEI7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQVVBLGFBQVMsUUFBUSxNQUFNLFVBQVUsQ0FBQyxHQUFHLGlCQUFpQixDQUFDLEdBQUc7QUFDeEQsVUFBSSxVQUFVO0FBQ1osZUFBTyxRQUFRLE9BQU8sSUFBSSxjQUFjLGVBQWUscUJBQXFCLENBQUM7QUFBQSxNQUMvRTtBQUNBLFVBQUksUUFBUSxRQUFRLGFBQWE7QUFDL0IsZUFBTyxRQUFRO0FBQUEsVUFDYixJQUFJLGNBQWMsV0FBVyxnQ0FBZ0MsV0FBVyxJQUFJO0FBQUEsUUFDOUU7QUFBQSxNQUNGO0FBQ0EsWUFBTSxZQUFZLGdCQUFnQjtBQUNsQyxZQUFNLG1CQUFtQixlQUFlLGFBQWE7QUFFckQsYUFBTyxJQUFJLFFBQVEsQ0FBQyxTQUFTLFdBQVc7QUFDdEMsY0FBTSxRQUFRLFdBQVcsTUFBTTtBQUM3QixrQkFBUSxPQUFPLFNBQVM7QUFDeEI7QUFBQSxZQUNFLElBQUk7QUFBQSxjQUNGO0FBQUEsY0FDQSxtQkFBbUIsSUFBSSxZQUFZLGdCQUFnQjtBQUFBLGNBQ25EO0FBQUEsZ0JBQ0U7QUFBQSxnQkFDQTtBQUFBLGNBQ0Y7QUFBQSxZQUNGO0FBQUEsVUFDRjtBQUFBLFFBQ0YsR0FBRyxnQkFBZ0I7QUFDbkIsZ0JBQVEsSUFBSSxXQUFXLEVBQUUsU0FBUyxRQUFRLE1BQU0sQ0FBQztBQUNqRCxZQUFJO0FBQ0YsZUFBSyxNQUFNLFNBQVMsU0FBUztBQUFBLFFBQy9CLFNBQVMsT0FBTztBQUNkLHVCQUFhLEtBQUs7QUFDbEIsa0JBQVEsT0FBTyxTQUFTO0FBQ3hCLGlCQUFPLEtBQUs7QUFBQSxRQUNkO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQU1BLG1CQUFlLGNBQWMsS0FBSztBQUNoQyxVQUFJLFVBQVU7QUFDWixlQUFPLEVBQUUsSUFBSSxPQUFPLE1BQU0sZUFBZSxRQUFRLFdBQVc7QUFBQSxNQUM5RDtBQUVBLFlBQU0sYUFBYSxpQkFBaUIsS0FBSyxFQUFFLFdBQVcsaUJBQWlCLENBQUM7QUFDeEUsVUFBSSxDQUFDLFdBQVcsSUFBSTtBQUNsQixZQUFJLENBQUMsY0FBYyxJQUFJLFdBQVcsTUFBTSxHQUFHO0FBQ3pDLHdCQUFjLElBQUksV0FBVyxNQUFNO0FBQ25DLGlCQUFPLEtBQUsscUJBQXFCO0FBQUEsWUFDL0IsUUFBUSxXQUFXO0FBQUEsWUFDbkIsTUFBTSxXQUFXLFFBQVE7QUFBQSxVQUMzQixDQUFDO0FBQUEsUUFDSDtBQUNBLGtCQUFVLFdBQVcsTUFBTSxXQUFXLFNBQVMsV0FBVyxXQUFXO0FBQUEsVUFDbkUsUUFBUSxXQUFXO0FBQUEsUUFDckIsQ0FBQztBQUNELGVBQU8sRUFBRSxJQUFJLE9BQU8sTUFBTSxXQUFXLE1BQU0sUUFBUSxXQUFXLE9BQU87QUFBQSxNQUN2RTtBQUVBLFlBQU0sV0FBVyxXQUFXO0FBQzVCLFlBQU0sRUFBRSxNQUFNLFdBQVcsUUFBUSxJQUFJO0FBQ3JDLGFBQU8sTUFBTSxvQkFBb0I7QUFBQSxRQUMvQjtBQUFBLFFBQ0EsV0FBVyxhQUFhO0FBQUEsUUFDeEIsT0FBTyxZQUFZLFFBQVE7QUFBQSxNQUM3QixDQUFDO0FBRUQsVUFBSSxTQUFTLGtCQUFrQjtBQUM3QixZQUFJLGFBQWEsUUFBUSxJQUFJLFNBQVMsR0FBRztBQUN2QyxnQkFBTSxRQUFRLFFBQVEsSUFBSSxTQUFTO0FBQ25DLGNBQUksT0FBTztBQUNULHlCQUFhLE1BQU0sS0FBSztBQUN4QixvQkFBUSxPQUFPLFNBQVM7QUFDeEIsa0JBQU0sT0FBTyxPQUFPLFFBQVEsU0FBUyxXQUFXLFFBQVEsT0FBTztBQUMvRCxrQkFBTSxVQUNKLE9BQU8sUUFBUSxZQUFZLFdBQ3ZCLFFBQVEsVUFDUjtBQUNOLGtCQUFNLE9BQU8sSUFBSSxjQUFjLE1BQU0sU0FBUyxFQUFFLFVBQVUsQ0FBQyxDQUFDO0FBQUEsVUFDOUQ7QUFBQSxRQUNGO0FBQ0EsZUFBTyxFQUFFLElBQUksS0FBSztBQUFBLE1BQ3BCO0FBRUEsVUFBSSxhQUFhLFFBQVEsSUFBSSxTQUFTLEdBQUc7QUFDdkMsY0FBTSxRQUFRLFFBQVEsSUFBSSxTQUFTO0FBQ25DLFlBQUksT0FBTztBQUNULHVCQUFhLE1BQU0sS0FBSztBQUN4QixrQkFBUSxPQUFPLFNBQVM7QUFDeEIsZ0JBQU0sUUFBUSxFQUFFLE1BQU0sUUFBUSxDQUFDO0FBQUEsUUFDakM7QUFDQSxlQUFPLEVBQUUsSUFBSSxLQUFLO0FBQUEsTUFDcEI7QUFFQSxZQUFNLFVBQVUsU0FBUyxJQUFJLElBQUk7QUFDakMsVUFBSSxDQUFDLFNBQVM7QUFFWixlQUFPLE1BQU0sc0JBQXNCLEVBQUUsTUFBTSxXQUFXLGFBQWEsS0FBSyxDQUFDO0FBQ3pFLGVBQU8sRUFBRSxJQUFJLEtBQUs7QUFBQSxNQUNwQjtBQUVBLFVBQUk7QUFDRixjQUFNLFFBQVEsU0FBUyxFQUFFLFVBQVUsQ0FBQztBQUNwQyxlQUFPLEVBQUUsSUFBSSxLQUFLO0FBQUEsTUFDcEIsU0FBUyxPQUFPO0FBQ2QsY0FBTSxVQUFVLGlCQUFpQixRQUFRLE1BQU0sVUFBVSxPQUFPLEtBQUs7QUFDckUsY0FBTSxPQUNKLGlCQUFpQixnQkFDYixNQUFNO0FBQUE7QUFBQSxVQUMyQixPQUFRLFFBQVE7QUFBQTtBQUN2RCxlQUFPLE1BQU0sMkJBQTJCLEVBQUUsTUFBTSxPQUFPLFFBQVEsQ0FBQztBQUNoRSxrQkFBVSxNQUFNLFNBQVMsU0FBUztBQUNsQyxlQUFPLEVBQUUsSUFBSSxPQUFPLEtBQUs7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFLQSxhQUFTLFFBQVEsU0FBUyxZQUFZO0FBQ3BDLFVBQUksVUFBVTtBQUNaO0FBQUEsTUFDRjtBQUNBLGlCQUFXO0FBQ1gsaUJBQVcsQ0FBQyxFQUFFLEtBQUssS0FBSyxTQUFTO0FBQy9CLHFCQUFhLE1BQU0sS0FBSztBQUN4QixjQUFNLE9BQU8sSUFBSSxjQUFjLGVBQWUsa0JBQWtCLE1BQU0sRUFBRSxDQUFDO0FBQUEsTUFDM0U7QUFDQSxjQUFRLE1BQU07QUFDZCxlQUFTLE1BQU07QUFBQSxJQUNqQjtBQUVBLFdBQU87QUFBQSxNQUNMO0FBQUEsTUFDQTtBQUFBLE1BQ0EsU0FBUztBQUFBLE1BQ1Q7QUFBQSxNQUNBO0FBQUEsTUFDQSxjQUFjLE1BQU0sUUFBUTtBQUFBLE1BQzVCLFlBQVksTUFBTTtBQUFBLE1BQ2xCLFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjs7O0FDdFJPLE1BQU0sa0JBQWtCLE9BQU8sT0FBTztBQUFBLElBQzNDLFdBQVc7QUFBQSxJQUNYLFlBQVk7QUFBQSxJQUNaLGVBQWU7QUFBQSxJQUNmLGFBQWE7QUFBQSxJQUNiLFdBQVc7QUFBQSxFQUNiLENBQUM7OztBQ1hNLE1BQU0saUJBQWlCLE9BQU8sT0FBTztBQUFBLElBQzFDO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSxpQkFBaUIsT0FBTyxPQUFPO0FBQUEsSUFDMUM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFHTSxNQUFNLGVBQWUsT0FBTyxPQUFPO0FBQUEsSUFDeEM7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSx3QkFBd0IsT0FBTyxPQUFPO0FBQUEsSUFDakQ7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFHTSxNQUFNLG9CQUFvQixPQUFPLE9BQU8sQ0FBQyxTQUFTLFlBQVksVUFBVSxPQUFPLENBQUM7QUFHaEYsTUFBTSxrQkFBa0IsT0FBTyxPQUFPLENBQUMsYUFBYSxVQUFVLENBQUM7OztBQzdEL0QsTUFBTSxvQkFBb0I7QUFpRzFCLFdBQVMsWUFBWSxLQUFLO0FBRS9CLFVBQU0sU0FBUyxDQUFDO0FBQ2hCLFFBQUksT0FBTyxRQUFRLFlBQVksUUFBUSxRQUFRLE1BQU0sUUFBUSxHQUFHLEdBQUc7QUFDakUsYUFBTyxFQUFFLElBQUksT0FBTyxRQUFRLENBQUMsd0JBQXdCLEVBQUU7QUFBQSxJQUN6RDtBQUNBLFVBQU07QUFBQTtBQUFBLE1BQW9EO0FBQUE7QUFDMUQsUUFBSSxVQUFVLGVBQWUsbUJBQW1CO0FBQzlDLGFBQU8sS0FBSywyQkFBMkIsT0FBTyxVQUFVLFVBQVUsQ0FBQyxHQUFHO0FBQUEsSUFDeEU7QUFDQSxRQUFJLFVBQVUsWUFBWSxPQUFPO0FBQy9CLHFCQUFlLFdBQVcsTUFBTTtBQUNoQyxhQUFPLE9BQU8sU0FBUyxJQUNuQixFQUFFLElBQUksT0FBTyxPQUFPLElBQ3BCLEVBQUUsSUFBSSxNQUFNO0FBQUE7QUFBQSxRQUE4QjtBQUFBLFFBQUs7QUFBQSxJQUNyRDtBQUNBLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFVBQU0sUUFBUSxVQUFVO0FBQ3hCLFFBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3pCLGFBQU8sS0FBSyx5QkFBeUI7QUFBQSxJQUN2QztBQUNBLFFBQUksQ0FBQyxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ3pCLGFBQU8sS0FBSyx5QkFBeUI7QUFBQSxJQUN2QztBQUNBLFFBQUksTUFBTSxRQUFRLEtBQUssS0FBSyxNQUFNLFFBQVEsS0FBSyxHQUFHO0FBQ2hELFlBQU0sTUFBTSxvQkFBSSxJQUFJO0FBQ3BCLGlCQUFXLFFBQVEsT0FBTztBQUN4QixjQUFNO0FBQUE7QUFBQSxVQUE2QyxLQUFNO0FBQUE7QUFDekQsWUFBSSxPQUFPLE9BQU8sVUFBVTtBQUMxQixpQkFBTyxLQUFLLCtCQUErQjtBQUMzQztBQUFBLFFBQ0Y7QUFDQSxZQUFJLElBQUksSUFBSSxFQUFFLEdBQUc7QUFDZixpQkFBTyxLQUFLLHNCQUFzQixFQUFFLElBQUk7QUFBQSxRQUMxQztBQUNBLFlBQUksSUFBSSxFQUFFO0FBQUEsTUFDWjtBQUNBLGlCQUFXLFFBQVEsT0FBTztBQUN4QixjQUFNO0FBQUE7QUFBQSxVQUFpRDtBQUFBO0FBQ3ZELFlBQUksT0FBTyxPQUFPLFNBQVMsWUFBWSxDQUFDLElBQUksSUFBSSxPQUFPLElBQUksR0FBRztBQUM1RCxpQkFBTyxLQUFLLFNBQVMsT0FBTyxPQUFPLEVBQUUsQ0FBQywrQkFBK0I7QUFBQSxRQUN2RTtBQUNBLFlBQUksT0FBTyxPQUFPLE9BQU8sWUFBWSxDQUFDLElBQUksSUFBSSxPQUFPLEVBQUUsR0FBRztBQUN4RCxpQkFBTyxLQUFLLFNBQVMsT0FBTyxPQUFPLEVBQUUsQ0FBQywrQkFBK0I7QUFBQSxRQUN2RTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQ0EsUUFBSSxPQUFPLFNBQVMsR0FBRztBQUNyQixhQUFPLEVBQUUsSUFBSSxPQUFPLE9BQU87QUFBQSxJQUM3QjtBQUNBLFdBQU8sRUFBRSxJQUFJLE1BQU07QUFBQTtBQUFBLE1BQThCO0FBQUEsTUFBSztBQUFBLEVBQ3hEO0FBTUEsV0FBUyxlQUFlLFdBQVcsUUFBUTtBQUN6QyxRQUFJLFVBQVUsY0FBYyxPQUFPO0FBQ2pDLGFBQU8sS0FBSyx5Q0FBeUM7QUFBQSxJQUN2RDtBQUNBLFVBQU0sS0FBSyxVQUFVO0FBQ3JCLFFBQUksT0FBTyxPQUFPLFlBQVksT0FBTyxRQUFRLE1BQU0sUUFBUSxFQUFFLEdBQUc7QUFDOUQsYUFBTyxLQUFLLDZCQUE2QjtBQUFBLElBQzNDLE9BQU87QUFDTCxZQUFNO0FBQUE7QUFBQSxRQUFpRDtBQUFBO0FBQ3ZELGlCQUFXLE9BQU8sQ0FBQyxZQUFZLFFBQVEsaUJBQWlCLE1BQU0sR0FBRztBQUMvRCxZQUFJLE9BQU8sT0FBTyxHQUFHLE1BQU0sVUFBVTtBQUNuQyxpQkFBTyxLQUFLLFlBQVksR0FBRyxvQkFBb0I7QUFBQSxRQUNqRDtBQUFBLE1BQ0Y7QUFDQSxVQUFJLE9BQU8sVUFBVSxRQUFRLENBQUMsV0FBVyxPQUFPLEtBQUssR0FBRztBQUN0RCxlQUFPLEtBQUssbURBQW1EO0FBQUEsTUFDakU7QUFBQSxJQUNGO0FBRUEsVUFBTSxRQUFRLFVBQVU7QUFDeEIsVUFBTSxRQUFRLFVBQVU7QUFDeEIsUUFBSSxDQUFDLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDekIsYUFBTyxLQUFLLHlCQUF5QjtBQUNyQztBQUFBLElBQ0Y7QUFDQSxRQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN6QixhQUFPLEtBQUsseUJBQXlCO0FBQ3JDO0FBQUEsSUFDRjtBQUVBLFVBQU0sTUFBTSxvQkFBSSxJQUFJO0FBRXBCLFVBQU0sV0FBVyxDQUFDO0FBRWxCLFVBQU0sVUFBVSxDQUFDO0FBQ2pCLGVBQVcsU0FBUyxPQUFPO0FBQ3pCLFVBQUksT0FBTyxVQUFVLFlBQVksVUFBVSxRQUFRLE1BQU0sUUFBUSxLQUFLLEdBQUc7QUFDdkUsZUFBTyxLQUFLLCtCQUErQjtBQUMzQztBQUFBLE1BQ0Y7QUFDQSxZQUFNO0FBQUE7QUFBQSxRQUErQztBQUFBO0FBQ3JELFlBQU0sS0FBSyxLQUFLO0FBQ2hCLFVBQUksT0FBTyxPQUFPLFVBQVU7QUFDMUIsZUFBTyxLQUFLLCtCQUErQjtBQUMzQztBQUFBLE1BQ0Y7QUFDQSxVQUFJLElBQUksSUFBSSxFQUFFLEdBQUc7QUFDZixlQUFPLEtBQUssc0JBQXNCLEVBQUUsSUFBSTtBQUFBLE1BQzFDO0FBQ0EsVUFBSSxJQUFJLEVBQUU7QUFDVixVQUFJLENBQUMsZUFBZSxTQUFTLE9BQU8sS0FBSyxJQUFJLENBQUMsR0FBRztBQUMvQyxlQUFPLEtBQUssU0FBUyxFQUFFLHVCQUF1QixPQUFPLEtBQUssSUFBSSxDQUFDLElBQUk7QUFBQSxNQUNyRTtBQUNBLFVBQUksQ0FBQyxhQUFhLFNBQVMsT0FBTyxLQUFLLE1BQU0sQ0FBQyxHQUFHO0FBQy9DLGVBQU8sS0FBSyxTQUFTLEVBQUUseUJBQXlCLE9BQU8sS0FBSyxNQUFNLENBQUMsSUFBSTtBQUFBLE1BQ3pFO0FBQ0EsVUFBSSxPQUFPLEtBQUssVUFBVSxVQUFVO0FBQ2xDLGVBQU8sS0FBSyxTQUFTLEVBQUUseUJBQXlCO0FBQUEsTUFDbEQ7QUFDQSxVQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssVUFBVSxLQUFLLEtBQUssV0FBVyxLQUFLLENBQUMsU0FBUyxPQUFPLFNBQVMsUUFBUSxHQUFHO0FBQy9GLGVBQU8sS0FBSyxTQUFTLEVBQUUsNEJBQTRCO0FBQUEsTUFDckQ7QUFDQSxVQUFJLEtBQUssVUFBVSxRQUFRLENBQUMsV0FBVyxLQUFLLEtBQUssR0FBRztBQUNsRCxlQUFPLEtBQUssU0FBUyxFQUFFLG1DQUFtQztBQUFBLE1BQzVEO0FBQ0EsVUFBSSxDQUFDLFdBQVcsS0FBSyxRQUFRLEdBQUc7QUFDOUIsZUFBTyxLQUFLLFNBQVMsRUFBRSw0QkFBNEI7QUFBQSxNQUNyRDtBQUNBLFVBQUksS0FBSyxTQUFTLFNBQVM7QUFDekIsaUJBQVMsS0FBSyxFQUFFO0FBQUEsTUFDbEI7QUFDQSxVQUFJLEtBQUssU0FBUyxRQUFRO0FBQ3hCLGdCQUFRLEtBQUssRUFBRTtBQUFBLE1BQ2pCO0FBQ0EsVUFBSSxLQUFLLFVBQVUsUUFBVztBQUM1QixZQUFJLENBQUMsTUFBTSxRQUFRLEtBQUssS0FBSyxHQUFHO0FBQzlCLGlCQUFPLEtBQUssU0FBUyxFQUFFLHdDQUF3QztBQUFBLFFBQ2pFLE9BQU87QUFDTCxxQkFBVyxRQUFRLEtBQUssT0FBTztBQUM3QixnQkFDRSxPQUFPLFNBQVMsWUFDaEIsU0FBUyxRQUNULE9BQU8sS0FBSyxPQUFPLFlBQ25CLE9BQU8sS0FBSyxVQUFVLFlBQ3RCLENBQUMsYUFBYSxTQUFTLE9BQU8sS0FBSyxNQUFNLENBQUMsR0FDMUM7QUFDQSxxQkFBTyxLQUFLLFNBQVMsRUFBRSwrQkFBK0I7QUFBQSxZQUN4RDtBQUFBLFVBQ0Y7QUFBQSxRQUNGO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFDQSxRQUFJLFNBQVMsV0FBVyxHQUFHO0FBQ3pCLGFBQU8sS0FBSyw2Q0FBNkMsU0FBUyxNQUFNLEdBQUc7QUFBQSxJQUM3RTtBQUNBLFFBQUksUUFBUSxXQUFXLEdBQUc7QUFDeEIsYUFBTyxLQUFLLDRDQUE0QyxRQUFRLE1BQU0sR0FBRztBQUFBLElBQzNFO0FBQ0EsUUFBSSxVQUFVLFlBQVksU0FBUyxDQUFDLEdBQUc7QUFDckMsYUFBTyxLQUFLLHdDQUF3QztBQUFBLElBQ3REO0FBQ0EsUUFBSSxVQUFVLFdBQVcsUUFBUSxDQUFDLEdBQUc7QUFDbkMsYUFBTyxLQUFLLHNDQUFzQztBQUFBLElBQ3BEO0FBRUEsVUFBTSxVQUFVLG9CQUFJLElBQUk7QUFDeEIsZUFBVyxTQUFTLE9BQU87QUFDekIsVUFBSSxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN2RSxlQUFPLEtBQUssK0JBQStCO0FBQzNDO0FBQUEsTUFDRjtBQUNBLFlBQU07QUFBQTtBQUFBLFFBQStDO0FBQUE7QUFDckQsWUFBTSxLQUFLLEtBQUs7QUFDaEIsVUFBSSxPQUFPLE9BQU8sVUFBVTtBQUMxQixlQUFPLEtBQUssK0JBQStCO0FBQzNDO0FBQUEsTUFDRjtBQUNBLFVBQUksUUFBUSxJQUFJLEVBQUUsR0FBRztBQUNuQixlQUFPLEtBQUssc0JBQXNCLEVBQUUsSUFBSTtBQUFBLE1BQzFDO0FBQ0EsY0FBUSxJQUFJLEVBQUU7QUFDZCxVQUFJLE9BQU8sS0FBSyxTQUFTLFlBQVksQ0FBQyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUc7QUFDeEQsZUFBTyxLQUFLLFNBQVMsRUFBRSwrQkFBK0I7QUFBQSxNQUN4RDtBQUNBLFVBQUksT0FBTyxLQUFLLE9BQU8sWUFBWSxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsR0FBRztBQUNwRCxlQUFPLEtBQUssU0FBUyxFQUFFLCtCQUErQjtBQUFBLE1BQ3hEO0FBQ0EsVUFBSSxDQUFDLGVBQWUsU0FBUyxPQUFPLEtBQUssSUFBSSxDQUFDLEdBQUc7QUFDL0MsZUFBTyxLQUFLLFNBQVMsRUFBRSx1QkFBdUIsT0FBTyxLQUFLLElBQUksQ0FBQyxJQUFJO0FBQUEsTUFDckU7QUFDQSxVQUFJLENBQUMsYUFBYSxTQUFTLE9BQU8sS0FBSyxNQUFNLENBQUMsR0FBRztBQUMvQyxlQUFPLEtBQUssU0FBUyxFQUFFLHlCQUF5QixPQUFPLEtBQUssTUFBTSxDQUFDLElBQUk7QUFBQSxNQUN6RTtBQUNBLFVBQUksT0FBTyxLQUFLLFVBQVUsVUFBVTtBQUNsQyxlQUFPLEtBQUssU0FBUyxFQUFFLHlCQUF5QjtBQUFBLE1BQ2xEO0FBQ0EsVUFBSSxPQUFPLEtBQUssU0FBUyxZQUFZLE9BQU8sS0FBSyxjQUFjLFVBQVU7QUFDdkUsZUFBTyxLQUFLLFNBQVMsRUFBRSwyQ0FBMkM7QUFBQSxNQUNwRTtBQUFBLElBQ0Y7QUFFQSxVQUFNLGVBQWUsVUFBVTtBQUMvQixRQUFJLENBQUMsTUFBTSxRQUFRLFlBQVksR0FBRztBQUNoQyxhQUFPLEtBQUssZ0NBQWdDO0FBQUEsSUFDOUMsT0FBTztBQUNMLGlCQUFXLFNBQVMsY0FBYztBQUNoQyxZQUNFLE9BQU8sVUFBVSxZQUNqQixVQUFVLFFBQ1YsT0FBTyxNQUFNLFNBQVMsWUFDdEIsT0FBTyxNQUFNLFlBQVksWUFDekIsQ0FBQyxDQUFDLFFBQVEsV0FBVyxPQUFPLEVBQUUsU0FBUyxPQUFPLE1BQU0sUUFBUSxDQUFDLEdBQzdEO0FBQ0EsaUJBQU8sS0FBSyx1REFBdUQ7QUFBQSxRQUNyRTtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsVUFBTSxTQUFTLFVBQVU7QUFDekIsUUFDRSxPQUFPLFdBQVcsWUFDbEIsV0FBVyxRQUNYLENBQUMsT0FBTyxTQUFTLE9BQU8sS0FBSyxLQUM3QixDQUFDLE9BQU8sU0FBUyxPQUFPLE1BQU0sR0FDOUI7QUFDQSxhQUFPLEtBQUssNENBQTRDO0FBQUEsSUFDMUQ7QUFBQSxFQUNGO0FBTUEsV0FBUyxXQUFXLE9BQU87QUFDekIsUUFBSSxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN2RSxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU07QUFBQTtBQUFBLE1BQWdEO0FBQUE7QUFDdEQsV0FDRSxPQUFPLE1BQU0sV0FBVyxZQUN4QixPQUFPLFVBQVUsTUFBTSxTQUFTLEtBQ2hDLE9BQU8sVUFBVSxNQUFNLFdBQVcsS0FDbEMsT0FBTyxVQUFVLE1BQU0sT0FBTyxLQUM5QixPQUFPLFVBQVUsTUFBTSxTQUFTLEtBQ2hDLE1BQU0sYUFBYSxLQUNuQixNQUFNLGVBQWUsS0FDckIsTUFBTSxXQUFXLEtBQ2pCLE1BQU0sYUFBYTtBQUFBLEVBRXZCO0FBTUEsV0FBUyxXQUFXLE9BQU87QUFDekIsUUFBSSxPQUFPLFVBQVUsWUFBWSxVQUFVLFFBQVEsTUFBTSxRQUFRLEtBQUssR0FBRztBQUN2RSxhQUFPO0FBQUEsSUFDVDtBQUNBLFVBQU07QUFBQTtBQUFBLE1BQW1EO0FBQUE7QUFDekQsV0FDRSxPQUFPLFNBQVMsU0FBUyxDQUFDLEtBQzFCLE9BQU8sU0FBUyxTQUFTLENBQUMsS0FDMUIsT0FBTyxTQUFTLFNBQVMsS0FBSyxLQUM5QixPQUFPLFNBQVMsU0FBUyxNQUFNLEtBQy9CLE9BQU8sVUFBVSxTQUFTLEtBQUs7QUFBQSxFQUVuQzs7O0FDNVdBLE1BQU0sU0FBUztBQVlmLFdBQVMsTUFBTSxNQUFNLGFBQWEsQ0FBQyxHQUFHO0FBQ3BDLFVBQU0sVUFBVSxTQUFTLGdCQUFnQixRQUFRLElBQUk7QUFDckQsZUFBVyxDQUFDLEtBQUssS0FBSyxLQUFLLE9BQU8sUUFBUSxVQUFVLEdBQUc7QUFDckQsY0FBUSxhQUFhLEtBQUssT0FBTyxLQUFLLENBQUM7QUFBQSxJQUN6QztBQUNBLFdBQU87QUFBQSxFQUNUO0FBT0EsV0FBUyxTQUFTLE9BQU8sS0FBSztBQUM1QixVQUFNLE9BQU8sT0FBTyxTQUFTLEVBQUU7QUFDL0IsV0FBTyxLQUFLLFNBQVMsTUFBTSxHQUFHLEtBQUssTUFBTSxHQUFHLE1BQU0sQ0FBQyxDQUFDLFdBQU07QUFBQSxFQUM1RDtBQUtPLFdBQVMsa0JBQWtCLEVBQUUsS0FBQUEsTUFBSyxTQUFTLEdBQUc7QUFFbkQsUUFBSSxNQUFNO0FBRVYsUUFBSSxXQUFXO0FBRWYsVUFBTSxlQUFlLG9CQUFJLElBQUk7QUFFN0IsVUFBTSxlQUFlLG9CQUFJLElBQUk7QUFFN0IsUUFBSSxhQUFhO0FBRWpCLFFBQUksUUFBUTtBQUNaLFFBQUksYUFBYTtBQUNqQixRQUFJLGFBQWE7QUFDakIsUUFBSSxXQUFXO0FBQ2YsUUFBSSxZQUFZLEVBQUUsR0FBRyxHQUFHLEdBQUcsR0FBRyxJQUFJLEdBQUcsSUFBSSxFQUFFO0FBRTNDLGFBQVMsaUJBQWlCO0FBQ3hCLFVBQUksVUFBVTtBQUNaLGlCQUFTO0FBQUEsVUFDUDtBQUFBLFVBQ0EsYUFBYSxXQUFXLFFBQVEsQ0FBQyxDQUFDLElBQUksV0FBVyxRQUFRLENBQUMsQ0FBQyxXQUFXLE1BQU0sUUFBUSxDQUFDLENBQUM7QUFBQSxRQUN4RjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBRUEsYUFBUyxVQUFVLE1BQU0sTUFBTTtBQUM3QixVQUFJLFNBQVMsT0FBTztBQUNsQixlQUFPO0FBQUEsVUFDTCxHQUFHLEtBQUssU0FBUyxJQUFJLEtBQUssU0FBUztBQUFBLFVBQ25DLEdBQUcsS0FBSyxTQUFTLElBQUksS0FBSyxTQUFTLFNBQVM7QUFBQSxRQUM5QztBQUFBLE1BQ0Y7QUFDQSxhQUFPLEVBQUUsR0FBRyxLQUFLLFNBQVMsR0FBRyxHQUFHLEtBQUssU0FBUyxJQUFJLEtBQUssU0FBUyxTQUFTLEVBQUU7QUFBQSxJQUM3RTtBQUVBLGFBQVMsU0FBUyxRQUFRLFFBQVE7QUFDaEMsVUFBSSxPQUFPLE9BQU8sT0FBTyxJQUFJO0FBQzNCLGNBQU0sRUFBRSxHQUFHLEdBQUcsT0FBTyxPQUFPLElBQUksT0FBTztBQUN2QyxjQUFNLEtBQUssSUFBSSxRQUFRO0FBQ3ZCLGNBQU0sU0FBUyxJQUFJO0FBQ25CLGVBQU8sS0FBSyxFQUFFLElBQUksTUFBTSxNQUFNLEtBQUssRUFBRSxJQUFJLElBQUksRUFBRSxLQUFLLEtBQUssRUFBRSxJQUFJLElBQUksRUFBRSxLQUFLLEVBQUUsSUFBSSxJQUFJLFNBQVMsQ0FBQztBQUFBLE1BQ2hHO0FBQ0EsWUFBTSxPQUFPLFVBQVUsUUFBUSxLQUFLO0FBQ3BDLFlBQU0sS0FBSyxVQUFVLFFBQVEsSUFBSTtBQUNqQyxZQUFNLE9BQU8sS0FBSyxJQUFJLElBQUksS0FBSyxJQUFJLEdBQUcsSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDO0FBQ3JELGFBQU8sS0FBSyxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxLQUFLLElBQUksSUFBSSxJQUFJLEtBQUssQ0FBQyxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDO0FBQUEsSUFDcEc7QUFFQSxhQUFTLFFBQVE7QUFDZixVQUFJLFVBQVU7QUFDWixRQUFBQSxLQUFJLFlBQVksUUFBUTtBQUFBLE1BQzFCO0FBQ0EsaUJBQVcsTUFBTSxLQUFLLEVBQUUsT0FBTyxjQUFjLENBQUM7QUFDOUMsTUFBQUEsS0FBSSxZQUFZLFFBQVE7QUFDeEIsbUJBQWEsTUFBTTtBQUNuQixtQkFBYSxNQUFNO0FBQ25CLG1CQUFhO0FBQUEsSUFDZjtBQUVBLGFBQVMsT0FBTyxRQUFRO0FBQ3RCLG1CQUFhO0FBQ2IsaUJBQVcsQ0FBQyxJQUFJLE9BQU8sS0FBSyxjQUFjO0FBQ3hDLGdCQUFRLFVBQVUsT0FBTyxlQUFlLE9BQU8sTUFBTTtBQUFBLE1BQ3ZEO0FBQ0EsaUJBQVcsQ0FBQyxFQUFFLE9BQU8sS0FBSyxjQUFjO0FBQ3RDLGNBQU0sU0FDSixXQUFXLFNBQVMsUUFBUSxRQUFRLFNBQVMsVUFBVSxRQUFRLFFBQVEsT0FBTztBQUNoRixnQkFBUSxVQUFVLE9BQU8sYUFBYSxNQUFNO0FBQUEsTUFDOUM7QUFDQSxVQUFJLGNBQWMsYUFBYSxJQUFJLFVBQVUsR0FBRztBQUM5QyxjQUFNO0FBQUE7QUFBQSxVQUErQixLQUFLLE1BQU0sS0FBSyxDQUFDLFNBQVMsS0FBSyxPQUFPLFVBQVU7QUFBQTtBQUNyRixpQkFBUyxZQUFZLElBQUk7QUFBQSxNQUMzQjtBQUFBLElBQ0Y7QUFFQSxhQUFTLFlBQVk7QUFDbkIsVUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVO0FBQ3JCO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBU0EsS0FBSSxzQkFBc0I7QUFDekMsWUFBTSxVQUFVO0FBQ2hCLFlBQU0sUUFBUSxLQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sS0FBSztBQUMxQyxZQUFNLFNBQVMsS0FBSyxJQUFJLEdBQUcsSUFBSSxPQUFPLE1BQU07QUFDNUMsWUFBTSxpQkFBaUIsS0FBSyxJQUFJLEtBQUssT0FBTyxRQUFRLFVBQVUsQ0FBQztBQUMvRCxZQUFNLGtCQUFrQixLQUFLLElBQUksS0FBSyxPQUFPLFNBQVMsVUFBVSxDQUFDO0FBQ2pFLGNBQVEsS0FBSyxJQUFJLEtBQUssaUJBQWlCLE9BQU8sa0JBQWtCLE1BQU07QUFDdEUsY0FBUSxLQUFLLElBQUksTUFBTSxLQUFLO0FBQzVCLG9CQUFjLE9BQU8sUUFBUSxRQUFRLFNBQVM7QUFDOUMsb0JBQWMsT0FBTyxTQUFTLFNBQVMsU0FBUztBQUNoRCxxQkFBZTtBQUFBLElBQ2pCO0FBS0EsYUFBUyxPQUFPLFNBQVM7QUFDdkIsWUFBTTtBQUNOLFlBQU07QUFDTixVQUFJLENBQUMsVUFBVTtBQUNiO0FBQUEsTUFDRjtBQUVBLFlBQU0sT0FBTyxJQUFJLElBQUksSUFBSSxNQUFNLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO0FBRTdELGlCQUFXLFFBQVEsSUFBSSxPQUFPO0FBQzVCLGNBQU0sU0FBUyxLQUFLLElBQUksS0FBSyxJQUFJO0FBQ2pDLGNBQU0sU0FBUyxLQUFLLElBQUksS0FBSyxFQUFFO0FBQy9CLFlBQUksQ0FBQyxVQUFVLENBQUMsUUFBUTtBQUN0QjtBQUFBLFFBQ0Y7QUFDQSxjQUFNO0FBQUE7QUFBQSxVQUNKLE1BQU0sUUFBUTtBQUFBLFlBQ1osT0FBTyxvQkFBb0IsS0FBSyxNQUFNLGtCQUFrQixLQUFLLFFBQVEsS0FBSyxJQUFJO0FBQUEsWUFDOUUsR0FBRyxTQUFTLFFBQVEsTUFBTTtBQUFBLFlBQzFCLGFBQWEsS0FBSztBQUFBLFlBQ2xCLFdBQVcsS0FBSztBQUFBLFlBQ2hCLEdBQUksS0FBSyxPQUFPLEVBQUUsb0JBQW9CLEtBQUssS0FBSyxJQUFJLENBQUM7QUFBQSxVQUN2RCxDQUFDO0FBQUE7QUFFSCxhQUFLLFFBQVEsT0FBTyxLQUFLO0FBQ3pCLGFBQUssUUFBUSxLQUFLLEtBQUs7QUFDdkIsY0FBTSxRQUFRLE1BQU0sT0FBTztBQUMzQixjQUFNLGNBQWMsR0FBRyxLQUFLLFFBQVEsS0FBSyxJQUFJLEtBQUssS0FBSyxNQUFNLElBQzNELEtBQUssYUFBYSxLQUFLLEtBQUssVUFBVSxLQUFLLEVBQzdDLEdBQUcsS0FBSyxZQUFZLElBQUksS0FBSyxTQUFTLEtBQUssRUFBRTtBQUM3QyxhQUFLLFlBQVksS0FBSztBQUN0QixpQkFBUyxZQUFZLElBQUk7QUFDekIscUJBQWEsSUFBSSxLQUFLLElBQUksSUFBSTtBQUU5QixZQUFJLEtBQUssU0FBUyxLQUFLLE1BQU0sU0FBUyxHQUFHO0FBQ3ZDLGdCQUFNLE9BQU8sVUFBVSxRQUFRLEtBQUs7QUFDcEMsZ0JBQU0sS0FBSyxVQUFVLFFBQVEsSUFBSTtBQUNqQyxnQkFBTSxRQUFRLE1BQU0sUUFBUTtBQUFBLFlBQzFCLE9BQU87QUFBQSxZQUNQLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSztBQUFBLFlBQ3JCLElBQUksS0FBSyxJQUFJLEdBQUcsS0FBSyxJQUFJO0FBQUEsWUFDekIsZUFBZTtBQUFBLFVBQ2pCLENBQUM7QUFDRCxnQkFBTSxjQUFjLFNBQVMsS0FBSyxPQUFPLEVBQUU7QUFDM0MsbUJBQVMsWUFBWSxLQUFLO0FBQUEsUUFDNUI7QUFBQSxNQUNGO0FBRUEsaUJBQVcsUUFBUSxJQUFJLE9BQU87QUFDNUIsY0FBTTtBQUFBO0FBQUEsVUFDSixNQUFNLEtBQUs7QUFBQSxZQUNULE9BQU8sb0JBQW9CLEtBQUssTUFBTSxrQkFBa0IsS0FBSyxJQUFJLEdBQy9ELEtBQUssV0FBVyx1QkFBdUIsRUFDekMsR0FBRyxLQUFLLGNBQWMsMEJBQTBCLEVBQUU7QUFBQSxZQUNsRCxXQUFXLGFBQWEsS0FBSyxTQUFTLENBQUMsSUFBSSxLQUFLLFNBQVMsQ0FBQztBQUFBLFlBQzFELFVBQVU7QUFBQSxZQUNWLE1BQU07QUFBQSxZQUNOLGNBQWMsR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FDdEQsS0FBSyxjQUFjLGtCQUFrQixFQUN2QyxHQUFHLEtBQUssV0FBVyxzQkFBc0IsRUFBRTtBQUFBLFVBQzdDLENBQUM7QUFBQTtBQUdILGNBQU07QUFBQSxVQUNKLE1BQU0sUUFBUTtBQUFBLFlBQ1osT0FBTztBQUFBLFlBQ1AsT0FBTyxLQUFLLFNBQVM7QUFBQSxZQUNyQixRQUFRLEtBQUssU0FBUztBQUFBLFlBQ3RCLElBQUk7QUFBQSxZQUNKLElBQUk7QUFBQSxVQUNOLENBQUM7QUFBQSxRQUNIO0FBRUEsY0FBTSxRQUNKLE1BQU0sUUFBUSxLQUFLLFVBQVUsS0FBSyxLQUFLLFdBQVcsU0FBUyxJQUN2RCxLQUFLLFdBQVcsTUFBTSxHQUFHLENBQUMsSUFDMUIsQ0FBQyxTQUFTLEtBQUssT0FBTyxFQUFFLENBQUM7QUFDL0IsY0FBTSxhQUFhO0FBQ25CLGNBQU0sY0FBYyxNQUFNLFNBQVM7QUFDbkMsY0FBTSxRQUFRLE1BQU0sUUFBUTtBQUFBLFVBQzFCLE9BQU87QUFBQSxVQUNQLEdBQUc7QUFBQSxVQUNILEdBQUcsS0FBSyxTQUFTLFNBQVMsSUFBSSxjQUFjLElBQUksYUFBYTtBQUFBLFFBQy9ELENBQUM7QUFDRCxtQkFBVyxDQUFDLE9BQU8sSUFBSSxLQUFLLE1BQU0sUUFBUSxHQUFHO0FBQzNDLGdCQUFNLE9BQU8sTUFBTSxTQUFTO0FBQUEsWUFDMUIsR0FBRztBQUFBLFlBQ0gsR0FBSSxVQUFVLElBQUksQ0FBQyxJQUFJLEVBQUUsSUFBSSxXQUFXO0FBQUEsVUFDMUMsQ0FBQztBQUNELGVBQUssY0FBYztBQUNuQixnQkFBTSxZQUFZLElBQUk7QUFBQSxRQUN4QjtBQUNBLGNBQU0sWUFBWSxLQUFLO0FBRXZCLGNBQU0sT0FBTyxNQUFNLFFBQVE7QUFBQSxVQUN6QixPQUFPO0FBQUEsVUFDUCxHQUFHO0FBQUEsVUFDSCxHQUFHLEtBQUssU0FBUyxTQUFTO0FBQUEsUUFDNUIsQ0FBQztBQUNELGFBQUssY0FBYyxLQUFLLFdBQVcsR0FBRyxLQUFLLElBQUksbUJBQWdCLEtBQUs7QUFDcEUsY0FBTSxZQUFZLElBQUk7QUFFdEIsY0FBTSxZQUNKLE1BQU0sUUFBUSxLQUFLLE1BQU0sS0FBSyxLQUFLLE9BQU8sU0FBUyxJQUMvQyxLQUFLLE9BQU8sS0FBSyxRQUFLLElBQ3RCLEtBQUssVUFBVSxLQUFLLFdBQVcsYUFBYSxLQUFLLFNBQVM7QUFDaEUsWUFBSSxXQUFXO0FBQ2IsZ0JBQU0sUUFBUSxNQUFNLFFBQVE7QUFBQSxZQUMxQixPQUFPO0FBQUEsWUFDUCxHQUFHLEtBQUssU0FBUyxRQUFRO0FBQUEsWUFDekIsR0FBRztBQUFBLFlBQ0gsZUFBZTtBQUFBLFVBQ2pCLENBQUM7QUFDRCxnQkFBTSxjQUFjLFNBQVMsV0FBVyxFQUFFO0FBQzFDLGdCQUFNLFlBQVksS0FBSztBQUFBLFFBQ3pCO0FBRUEsY0FBTSxRQUFRLE1BQU0sT0FBTztBQUMzQixjQUFNLFdBQ0osTUFBTSxRQUFRLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLElBQzdDO0FBQUEsU0FBWSxLQUFLLE1BQU0sSUFBSSxDQUFDLFNBQVMsR0FBRyxLQUFLLEtBQUssS0FBSyxLQUFLLE1BQU0sR0FBRyxFQUFFLEtBQUssSUFBSSxDQUFDLEtBQ2pGO0FBQ04sY0FBTSxjQUFjLEdBQUcsS0FBSyxJQUFJLElBQUksS0FBSyxLQUFLO0FBQUEsVUFBYSxLQUFLLE1BQU0sR0FDcEUsS0FBSyxRQUFRO0FBQUEsUUFBVyxLQUFLLE1BQU0sWUFBWSxDQUFDLElBQUksS0FBSyxNQUFNLFVBQVUsQ0FBQyxLQUFLLEVBQ2pGLEdBQUcsS0FBSyxhQUFhO0FBQUEsVUFBYSxLQUFLLFVBQVUsS0FBSyxFQUFFLEdBQUcsUUFBUTtBQUNuRSxjQUFNLFlBQVksS0FBSztBQUV2QixjQUFNLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUN6QyxnQkFBTSxnQkFBZ0I7QUFDdEIsaUJBQU8sS0FBSyxFQUFFO0FBQUEsUUFDaEIsQ0FBQztBQUNELGNBQU0saUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQzNDLGNBQUksTUFBTSxRQUFRLFdBQVcsTUFBTSxRQUFRLEtBQUs7QUFDOUMsa0JBQU0sZUFBZTtBQUNyQixtQkFBTyxLQUFLLEVBQUU7QUFBQSxVQUNoQjtBQUFBLFFBQ0YsQ0FBQztBQUVELGlCQUFTLFlBQVksS0FBSztBQUMxQixxQkFBYSxJQUFJLEtBQUssSUFBSSxLQUFLO0FBQUEsTUFDakM7QUFFQSxnQkFBVTtBQUFBLElBQ1o7QUFFQSxhQUFTLGNBQWMsV0FBVztBQUNoQyxVQUFJLENBQUMsT0FBTyxJQUFJLE1BQU0sV0FBVyxHQUFHO0FBQ2xDO0FBQUEsTUFDRjtBQUNBLFlBQU0sVUFBVSxhQUFhLElBQUksTUFBTSxLQUFLLENBQUMsU0FBUyxLQUFLLE9BQU8sVUFBVSxJQUFJO0FBQ2hGLFVBQUksQ0FBQyxTQUFTO0FBQ1osY0FBTSxRQUFRLElBQUksTUFBTSxDQUFDO0FBQ3pCLGVBQU8sTUFBTSxFQUFFO0FBQ2YscUJBQWEsSUFBSSxNQUFNLEVBQUUsR0FBRyxNQUFNO0FBQ2xDO0FBQUEsTUFDRjtBQUNBLFlBQU0sU0FBUztBQUFBLFFBQ2IsR0FBRyxRQUFRLFNBQVMsSUFBSSxRQUFRLFNBQVMsUUFBUTtBQUFBLFFBQ2pELEdBQUcsUUFBUSxTQUFTLElBQUksUUFBUSxTQUFTLFNBQVM7QUFBQSxNQUNwRDtBQUVBLFVBQUksT0FBTztBQUNYLFVBQUksWUFBWSxPQUFPO0FBQ3ZCLGlCQUFXLGFBQWEsSUFBSSxPQUFPO0FBQ2pDLFlBQUksVUFBVSxPQUFPLFFBQVEsSUFBSTtBQUMvQjtBQUFBLFFBQ0Y7QUFDQSxjQUFNLFFBQVE7QUFBQSxVQUNaLEdBQUcsVUFBVSxTQUFTLElBQUksVUFBVSxTQUFTLFFBQVE7QUFBQSxVQUNyRCxHQUFHLFVBQVUsU0FBUyxJQUFJLFVBQVUsU0FBUyxTQUFTO0FBQUEsUUFDeEQ7QUFDQSxjQUFNLEtBQUssTUFBTSxJQUFJLE9BQU87QUFDNUIsY0FBTSxLQUFLLE1BQU0sSUFBSSxPQUFPO0FBQzVCLGNBQU0sVUFDSCxjQUFjLGdCQUFnQixLQUFLLEtBQ25DLGNBQWMsZUFBZSxLQUFLLE1BQ2xDLGNBQWMsZUFBZSxLQUFLLEtBQ2xDLGNBQWMsYUFBYSxLQUFLO0FBQ25DLFlBQUksQ0FBQyxTQUFTO0FBQ1o7QUFBQSxRQUNGO0FBQ0EsY0FBTSxVQUNKLGNBQWMsZ0JBQWdCLGNBQWMsY0FBYyxLQUFLLElBQUksRUFBRSxJQUFJLEtBQUssSUFBSSxFQUFFO0FBQ3RGLGNBQU0sWUFDSixjQUFjLGdCQUFnQixjQUFjLGNBQWMsS0FBSyxJQUFJLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRTtBQUN0RixjQUFNLFFBQVEsVUFBVSxZQUFZO0FBQ3BDLFlBQUksUUFBUSxXQUFXO0FBQ3JCLHNCQUFZO0FBQ1osaUJBQU87QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUNBLFVBQUksTUFBTTtBQUNSLGVBQU8sS0FBSyxFQUFFO0FBQ2QscUJBQWEsSUFBSSxLQUFLLEVBQUUsR0FBRyxNQUFNO0FBQUEsTUFDbkM7QUFBQSxJQUNGO0FBRUEsSUFBQUEsS0FBSTtBQUFBLE1BQ0Y7QUFBQSxNQUNBLENBQUMsVUFBVTtBQUNULFlBQUksQ0FBQyxLQUFLO0FBQ1I7QUFBQSxRQUNGO0FBQ0EsY0FBTSxlQUFlO0FBQ3JCLGNBQU0sU0FBU0EsS0FBSSxzQkFBc0I7QUFDekMsY0FBTSxXQUFXLE1BQU0sVUFBVSxPQUFPO0FBQ3hDLGNBQU0sV0FBVyxNQUFNLFVBQVUsT0FBTztBQUN4QyxjQUFNLFNBQVMsTUFBTSxTQUFTLElBQUksT0FBTyxJQUFJO0FBQzdDLGNBQU0sWUFBWSxLQUFLLElBQUksS0FBSyxLQUFLLElBQUksTUFBTSxRQUFRLE1BQU0sQ0FBQztBQUM5RCxjQUFNLFFBQVEsWUFBWTtBQUMxQixxQkFBYSxZQUFZLFdBQVcsY0FBYztBQUNsRCxxQkFBYSxZQUFZLFdBQVcsY0FBYztBQUNsRCxnQkFBUTtBQUNSLHVCQUFlO0FBQUEsTUFDakI7QUFBQSxNQUNBLEVBQUUsU0FBUyxNQUFNO0FBQUEsSUFDbkI7QUFFQSxJQUFBQSxLQUFJLGlCQUFpQixlQUFlLENBQUMsVUFBVTtBQUM3QyxVQUFJLE1BQU0sV0FBVyxHQUFHO0FBQ3RCO0FBQUEsTUFDRjtBQUNBLGlCQUFXO0FBQ1gsa0JBQVksRUFBRSxHQUFHLE1BQU0sU0FBUyxHQUFHLE1BQU0sU0FBUyxJQUFJLFlBQVksSUFBSSxXQUFXO0FBQ2pGLE1BQUFBLEtBQUksa0JBQWtCLE1BQU0sU0FBUztBQUFBLElBQ3ZDLENBQUM7QUFDRCxJQUFBQSxLQUFJLGlCQUFpQixlQUFlLENBQUMsVUFBVTtBQUM3QyxVQUFJLENBQUMsVUFBVTtBQUNiO0FBQUEsTUFDRjtBQUNBLG1CQUFhLFVBQVUsTUFBTSxNQUFNLFVBQVUsVUFBVTtBQUN2RCxtQkFBYSxVQUFVLE1BQU0sTUFBTSxVQUFVLFVBQVU7QUFDdkQscUJBQWU7QUFBQSxJQUNqQixDQUFDO0FBQ0QsVUFBTSxVQUFVLENBQUMsVUFBVTtBQUN6QixpQkFBVztBQUNYLFVBQUlBLEtBQUksa0JBQWtCLE1BQU0sU0FBUyxHQUFHO0FBQzFDLFFBQUFBLEtBQUksc0JBQXNCLE1BQU0sU0FBUztBQUFBLE1BQzNDO0FBQUEsSUFDRjtBQUNBLElBQUFBLEtBQUksaUJBQWlCLGFBQWEsT0FBTztBQUN6QyxJQUFBQSxLQUFJLGlCQUFpQixpQkFBaUIsT0FBTztBQUU3QyxJQUFBQSxLQUFJLGlCQUFpQixTQUFTLE1BQU07QUFDbEMsVUFBSSxZQUFZO0FBQ2QsZUFBTyxJQUFJO0FBQUEsTUFDYjtBQUFBLElBQ0YsQ0FBQztBQUVELElBQUFBLEtBQUksaUJBQWlCLFdBQVcsQ0FBQyxVQUFVO0FBQ3pDLFVBQUksTUFBTSxJQUFJLFdBQVcsT0FBTyxHQUFHO0FBQ2pDLGNBQU0sZUFBZTtBQUNyQixzQkFBYyxNQUFNLEdBQUc7QUFDdkI7QUFBQSxNQUNGO0FBQ0EsVUFBSSxNQUFNLFFBQVEsT0FBTyxNQUFNLFFBQVEsS0FBSztBQUMxQyxjQUFNLGVBQWU7QUFDckIsZ0JBQVEsS0FBSyxJQUFJLEtBQUssUUFBUSxJQUFJO0FBQ2xDLHVCQUFlO0FBQ2Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxNQUFNLFFBQVEsS0FBSztBQUNyQixjQUFNLGVBQWU7QUFDckIsZ0JBQVEsS0FBSyxJQUFJLE1BQU0sUUFBUSxJQUFJO0FBQ25DLHVCQUFlO0FBQ2Y7QUFBQSxNQUNGO0FBQ0EsVUFBSSxNQUFNLFFBQVEsS0FBSztBQUNyQixjQUFNLGVBQWU7QUFDckIsa0JBQVU7QUFBQSxNQUNaO0FBQUEsSUFDRixDQUFDO0FBRUQsV0FBTztBQUFBLE1BQ0w7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsVUFBVTtBQUNSLGNBQU07QUFDTixjQUFNO0FBQUEsTUFDUjtBQUFBLElBQ0Y7QUFBQSxFQUNGOzs7QUMzWkEsTUFBTSxZQUFZLGlCQUFpQjtBQUVuQyxNQUFNO0FBQUE7QUFBQSxJQUFvQyxTQUFTLGVBQWUsVUFBVTtBQUFBO0FBQzVFLE1BQU07QUFBQTtBQUFBLElBQW1DLFNBQVMsZUFBZSxTQUFTO0FBQUE7QUFDMUUsTUFBTTtBQUFBO0FBQUEsSUFBcUMsU0FBUyxlQUFlLFdBQVc7QUFBQTtBQUM5RSxNQUFNO0FBQUE7QUFBQSxJQUFxQyxTQUFTLGVBQWUsV0FBVztBQUFBO0FBQzlFLE1BQU07QUFBQTtBQUFBLElBQW9DLFNBQVMsZUFBZSxVQUFVO0FBQUE7QUFDNUUsTUFBTTtBQUFBO0FBQUEsSUFBeUMsU0FBUyxlQUFlLGdCQUFnQjtBQUFBO0FBQ3ZGLE1BQU07QUFBQTtBQUFBLElBQXFDLFNBQVMsZUFBZSxXQUFXO0FBQUE7QUFDOUUsTUFBTTtBQUFBO0FBQUEsSUFBaUQsU0FBUyxlQUFlLFlBQVk7QUFBQTtBQUMzRixNQUFNO0FBQUE7QUFBQSxJQUNKLFNBQVMsZUFBZSxhQUFhO0FBQUE7QUFJdkMsTUFBSSxhQUFhO0FBQ2pCLE1BQU0sb0JBQW9CLFNBQVMsS0FBSyxRQUFRLG1CQUFtQjtBQUduRSxNQUFJLG1CQUFtQjtBQUd2QixNQUFNLFdBQVcsa0JBQWtCO0FBQUEsSUFDakM7QUFBQSxJQUNBLFVBQVUsQ0FBQyxRQUFRLFNBQVM7QUFDMUIsc0JBQWdCLFFBQVEsSUFBSTtBQUM1QixhQUFPLFFBQVEsZUFBZSxFQUFFLE9BQU8sQ0FBQztBQUFBLElBQzFDO0FBQUEsRUFDRixDQUFDO0FBRUQsTUFBTSxTQUFTLGFBQWE7QUFBQSxJQUMxQixNQUFNLENBQUMsWUFBWSxVQUFVLFlBQVksT0FBTztBQUFBLElBQ2hELGtCQUFrQixXQUFXO0FBQUEsSUFDN0IsV0FBVztBQUFBLElBQ1gsUUFBUTtBQUFBLE1BQ04sT0FBTyxNQUFNO0FBQUEsTUFBQztBQUFBLE1BQ2QsTUFBTSxDQUFDLFNBQVMsV0FBVyxRQUFRLEtBQUssY0FBYyxTQUFTLE1BQU07QUFBQSxNQUNyRSxPQUFPLENBQUMsU0FBUyxXQUFXLFFBQVEsTUFBTSxjQUFjLFNBQVMsTUFBTTtBQUFBLElBQ3pFO0FBQUEsRUFDRixDQUFDO0FBTUQsV0FBUyxVQUFVLFNBQVMsVUFBVSxPQUFPO0FBQzNDLFFBQUksQ0FBQyxTQUFTO0FBQ1osYUFBTyxTQUFTO0FBQ2hCLGFBQU8sY0FBYztBQUNyQjtBQUFBLElBQ0Y7QUFDQSxXQUFPLFNBQVM7QUFDaEIsV0FBTyxVQUFVLE9BQU8sWUFBWSxPQUFPO0FBQzNDLFdBQU8sY0FBYztBQUFBLEVBQ3ZCO0FBS0EsV0FBUyxVQUFVLE1BQU07QUFDdkIsV0FBTyxjQUFjO0FBQUEsRUFDdkI7QUFFQSxXQUFTLGNBQWM7QUFDckIsZUFBVyxnQkFBZ0I7QUFDM0IsVUFBTSxZQUFZLFNBQVMsY0FBYyxHQUFHO0FBQzVDLGNBQVUsWUFBWTtBQUN0QixjQUFVLGNBQWM7QUFDeEIsZUFBVyxZQUFZLFNBQVM7QUFBQSxFQUNsQztBQU9BLFdBQVMsV0FBVyxPQUFPLE9BQU87QUFDaEMsVUFBTSxPQUFPLFNBQVMsY0FBYyxJQUFJO0FBQ3hDLFNBQUssY0FBYztBQUNuQixVQUFNLGNBQWMsU0FBUyxjQUFjLElBQUk7QUFDL0MsZ0JBQVksY0FBYztBQUMxQixXQUFPLENBQUMsTUFBTSxXQUFXO0FBQUEsRUFDM0I7QUFNQSxXQUFTLGdCQUFnQixRQUFRLE1BQU07QUFDckMsUUFBSSxDQUFDLFVBQVUsQ0FBQyxNQUFNO0FBQ3BCLGtCQUFZO0FBQ1o7QUFBQSxJQUNGO0FBQ0EsVUFBTSxPQUFPLFNBQVMsY0FBYyxJQUFJO0FBQ3hDLFNBQUssT0FBTyxHQUFHLFdBQVcsU0FBUyxLQUFLLEtBQUssQ0FBQztBQUM5QyxTQUFLLE9BQU8sR0FBRyxXQUFXLFFBQVEsS0FBSyxJQUFJLENBQUM7QUFDNUMsU0FBSyxPQUFPLEdBQUcsV0FBVyxVQUFVLEtBQUssTUFBTSxDQUFDO0FBQ2hELFFBQUksS0FBSyxVQUFVO0FBQ2pCLFdBQUssT0FBTyxHQUFHLFdBQVcsVUFBVSxnREFBZ0QsQ0FBQztBQUFBLElBQ3ZGO0FBQ0EsUUFBSSxLQUFLLE9BQU87QUFDZCxXQUFLLE9BQU8sR0FBRyxXQUFXLFNBQVMsR0FBRyxLQUFLLE1BQU0sWUFBWSxDQUFDLFNBQUksS0FBSyxNQUFNLFVBQVUsQ0FBQyxFQUFFLENBQUM7QUFDM0YsV0FBSyxPQUFPLEdBQUcsV0FBVyxRQUFRLEtBQUssTUFBTSxNQUFNLENBQUM7QUFBQSxJQUN0RDtBQUNBLFFBQUksS0FBSyxPQUFPO0FBQ2QsV0FBSyxPQUFPLEdBQUcsV0FBVyxRQUFRLEtBQUssS0FBSyxDQUFDO0FBQUEsSUFDL0M7QUFDQSxRQUFJLEtBQUssYUFBYTtBQUNwQixXQUFLLE9BQU8sR0FBRyxXQUFXLFVBQVUsMkJBQTJCLENBQUM7QUFBQSxJQUNsRTtBQUNBLFFBQUksS0FBSyxhQUFhO0FBQ3BCLFdBQUssT0FBTyxHQUFHLFdBQVcsZ0JBQWdCLDBCQUEwQixDQUFDO0FBQUEsSUFDdkU7QUFDQSxRQUFJLEtBQUssWUFBWTtBQUNuQixXQUFLLE9BQU8sR0FBRyxXQUFXLFVBQVUsS0FBSyxVQUFVLENBQUM7QUFBQSxJQUN0RDtBQUNBLFFBQUksTUFBTSxRQUFRLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTSxTQUFTLEdBQUc7QUFDdEQsV0FBSztBQUFBLFFBQ0gsR0FBRztBQUFBLFVBQ0Q7QUFBQSxVQUNBLEtBQUssTUFBTSxJQUFJLENBQUMsU0FBUyxHQUFHLEtBQUssS0FBSyxLQUFLLEtBQUssTUFBTSxHQUFHLEVBQUUsS0FBSyxJQUFJO0FBQUEsUUFDdEU7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUVBLFVBQU0sU0FBUyxZQUFZLFNBQVMsQ0FBQyxHQUFHO0FBQUEsTUFDdEMsQ0FBQyxTQUFTLEtBQUssU0FBUyxVQUFVLEtBQUssT0FBTztBQUFBLElBQ2hEO0FBQ0EsUUFBSSxNQUFNLFNBQVMsR0FBRztBQUNwQixXQUFLLE9BQU8sR0FBRyxXQUFXLGlCQUFpQixPQUFPLE1BQU0sTUFBTSxDQUFDLENBQUM7QUFBQSxJQUNsRTtBQUVBLGVBQVcsZ0JBQWdCLElBQUk7QUFFL0IsUUFBSSxNQUFNLFNBQVMsR0FBRztBQUNwQixZQUFNLFVBQVUsU0FBUyxjQUFjLElBQUk7QUFDM0MsY0FBUSxZQUFZO0FBQ3BCLGNBQVEsY0FBYztBQUN0QixpQkFBVyxZQUFZLE9BQU87QUFFOUIsWUFBTSxXQUFXLFNBQVMsY0FBYyxJQUFJO0FBQzVDLGVBQVMsWUFBWTtBQUNyQixpQkFBVyxRQUFRLE1BQU0sTUFBTSxHQUFHLEVBQUUsR0FBRztBQUNyQyxjQUFNLE9BQU8sU0FBUyxjQUFjLElBQUk7QUFDeEMsY0FBTSxZQUFZLEtBQUssU0FBUyxTQUFTLFdBQU07QUFDL0MsY0FBTSxRQUFRLEtBQUssU0FBUyxTQUFTLEtBQUssS0FBSyxLQUFLO0FBQ3BELGFBQUssY0FBYyxHQUFHLFNBQVMsSUFBSSxLQUFLLElBQUksU0FBTSxLQUFLLEtBQUssS0FBSyxNQUFNO0FBQ3ZFLGlCQUFTLFlBQVksSUFBSTtBQUFBLE1BQzNCO0FBQ0EsaUJBQVcsWUFBWSxRQUFRO0FBQUEsSUFDakM7QUFBQSxFQUNGO0FBS0EsV0FBUyxhQUFhLEtBQUs7QUFDekIsV0FBTyxnQkFBZ0I7QUFDdkIsZUFBVyxjQUFjLElBQUksT0FBTyxVQUFVO0FBQzVDLFlBQU0sT0FBTyxTQUFTLGNBQWMsSUFBSTtBQUN4QyxZQUFNLFNBQVMsU0FBUyxjQUFjLE1BQU07QUFDNUMsYUFBTyxZQUFZLHNCQUFzQixVQUFVO0FBQ25ELFlBQU0sUUFBUSxTQUFTLGNBQWMsTUFBTTtBQUMzQyxZQUFNLGNBQWM7QUFDcEIsVUFBSSxlQUFlLFlBQVk7QUFDN0IsY0FBTSxjQUFjLEdBQUcsVUFBVTtBQUFBLE1BQ25DO0FBQ0EsV0FBSyxPQUFPLFFBQVEsS0FBSztBQUN6QixhQUFPLFlBQVksSUFBSTtBQUFBLElBQ3pCO0FBQ0EsZUFBVyxZQUFZLElBQUksT0FBTyxhQUFhLENBQUMsR0FBRztBQUNqRCxZQUFNLE9BQU8sU0FBUyxjQUFjLElBQUk7QUFDeEMsWUFBTSxTQUFTLFNBQVMsY0FBYyxNQUFNO0FBQzVDLGFBQU8sWUFBWSwyQkFBMkIsUUFBUTtBQUN0RCxZQUFNLFFBQVEsU0FBUyxjQUFjLE1BQU07QUFDM0MsWUFBTSxjQUFjLFNBQVMsUUFBUTtBQUNyQyxXQUFLLE9BQU8sUUFBUSxLQUFLO0FBQ3pCLGFBQU8sWUFBWSxJQUFJO0FBQUEsSUFDekI7QUFBQSxFQUNGO0FBS0EsV0FBUyxxQkFBcUIsTUFBTTtBQUNsQyxRQUFJLENBQUMsZ0JBQWdCO0FBQ25CO0FBQUEsSUFDRjtBQUNBLG1CQUFlLGdCQUFnQjtBQUMvQixlQUFXLFNBQVMsTUFBTTtBQUN4QixZQUFNLFNBQVMsU0FBUyxjQUFjLFFBQVE7QUFDOUMsYUFBTyxRQUFRLE1BQU07QUFDckIsYUFBTyxjQUFjLEdBQUcsTUFBTSxhQUFhLEtBQUssTUFBTSxJQUFJO0FBQzFELHFCQUFlLFlBQVksTUFBTTtBQUFBLElBQ25DO0FBQ0EsbUJBQWUsU0FBUyxLQUFLLFVBQVU7QUFDdkMsUUFBSSxrQkFBa0I7QUFDcEIscUJBQWUsUUFBUTtBQUFBLElBQ3pCO0FBQUEsRUFDRjtBQUVBLFdBQVMsaUJBQWlCLFNBQVM7QUFDakMsVUFBTSxXQUFXLE1BQU0sUUFBUSxRQUFRLFFBQVEsSUFBSSxRQUFRLFdBQVcsQ0FBQztBQUN2RSxVQUFNLFFBQVEsU0FBUyxJQUFJLENBQUMsWUFBWSxRQUFRLEVBQUUsRUFBRSxLQUFLLElBQUksS0FBSztBQUNsRSxTQUFLLGNBQWMsNEJBQXlCLEtBQUssbUJBQWdCLFFBQVEsbUJBQW1CLEdBQUc7QUFBQSxFQUNqRztBQUtBLFdBQVMsWUFBWSxTQUFTO0FBQzVCLFVBQU07QUFBQTtBQUFBLE1BQStDLFFBQVM7QUFBQTtBQUM5RCxVQUFNLGFBQWEsWUFBWSxZQUFZO0FBQzNDLFFBQUksQ0FBQyxXQUFXLElBQUk7QUFDbEIsZ0JBQVUsMEJBQTBCLFdBQVcsT0FBTyxDQUFDLENBQUMsSUFBSSxJQUFJO0FBQ2hFLGdCQUFVLGVBQWU7QUFDekI7QUFBQSxJQUNGO0FBQ0EsVUFBTSxNQUFNLFdBQVc7QUFDdkIsaUJBQWE7QUFDYixVQUFNLFNBQVM7QUFDZixhQUFTLE9BQU8sR0FBRztBQUNuQixpQkFBYSxHQUFHO0FBQ2hCLGdCQUFZO0FBQ1osVUFBTSxVQUNKLElBQUksWUFBWSxTQUFTLElBQUksV0FDekIsR0FBRyxJQUFJLFNBQVMsYUFBYSxjQUM3QjtBQUNOO0FBQUEsTUFDRSxHQUFHLE9BQU8sU0FBTSxJQUFJLFFBQVEsU0FBTSxJQUFJLE1BQU0sTUFBTSxlQUFZLElBQUksTUFBTSxNQUFNLGVBQVksSUFBSSxZQUFZO0FBQUEsSUFDNUc7QUFDQSxTQUFLLGNBQWMsR0FBRyxJQUFJLFNBQVMsU0FBTSxPQUFPLGNBQVcsSUFBSSxVQUFVO0FBQ3pFLFVBQU0sZUFBZSxJQUFJLGdCQUFnQixDQUFDO0FBQzFDLFVBQU0sV0FBVyxhQUFhO0FBQUEsTUFBSSxDQUFDLFVBQ2pDLE9BQU8sVUFBVSxXQUNiLFFBQ0EsR0FBRyxNQUFNLGFBQWEsU0FBUyxLQUFLLEdBQUcsTUFBTSxRQUFRLElBQUksR0FBRyxNQUFNLE9BQU87QUFBQSxJQUMvRTtBQUNBLGNBQVUsU0FBUyxTQUFTLElBQUksU0FBUyxLQUFLLFFBQUssSUFBSSxJQUFJLEtBQUs7QUFBQSxFQUNsRTtBQUVBLFNBQU8sR0FBRyxrQkFBa0IsQ0FBQyxZQUFZO0FBQ3ZDLFVBQU0sT0FBTyxPQUFPLFFBQVEsU0FBUyxXQUFXLFFBQVEsT0FBTztBQUMvRCxVQUFNLFVBQVUsT0FBTyxRQUFRLFlBQVksV0FBVyxRQUFRLFVBQVU7QUFDeEUsY0FBVSxHQUFHLElBQUksS0FBSyxPQUFPLElBQUksSUFBSTtBQUNyQyxjQUFVLE9BQU87QUFBQSxFQUNuQixDQUFDO0FBS0QsaUJBQWUsUUFBUSxVQUFVO0FBQy9CLGNBQVUsbUNBQThCO0FBQ3hDLGNBQVUsRUFBRTtBQUNaLFFBQUk7QUFHRixZQUFNLFdBQVcsTUFBTSxPQUFPLFFBQVEsWUFBWSxFQUFFLFNBQVMsQ0FBQztBQUM5RCx5QkFBbUI7QUFDbkIsa0JBQVksU0FBUyxPQUFPO0FBQzVCLGFBQU87QUFBQSxJQUNULFNBQVMsT0FBTztBQUNkLGdCQUFVLHdCQUF3QixPQUFPLFdBQVcsT0FBTyxLQUFLLENBQUMsSUFBSSxJQUFJO0FBQ3pFLGdCQUFVLGlCQUFpQjtBQUMzQixhQUFPO0FBQUEsSUFDVDtBQUFBLEVBQ0Y7QUFFQSxpQkFBZSxZQUFZO0FBQ3pCLGNBQVUscUJBQWdCO0FBQzFCLGNBQVUsRUFBRTtBQUNaLFFBQUk7QUFDRixZQUFNLFdBQVcsTUFBTSxPQUFPLFFBQVEsaUJBQWlCLENBQUMsQ0FBQztBQUN6RCxZQUFNLE9BQU8sTUFBTSxRQUFRLFNBQVMsUUFBUSxTQUFTLElBQUksU0FBUyxRQUFRLFlBQVksQ0FBQztBQUN2RixVQUFJLEtBQUssU0FBUyxHQUFHO0FBQ25CLDZCQUFxQixJQUFJO0FBQ3pCLGNBQU0sV0FDSixvQkFBb0IsS0FBSyxLQUFLLENBQUMsVUFBVSxNQUFNLGFBQWEsZ0JBQWdCLElBQ3hFLG1CQUNBLEtBQUssQ0FBQyxFQUFFO0FBQ2QsY0FBTSxTQUFTLE1BQU0sUUFBUSxRQUFRO0FBQ3JDLFlBQUksUUFBUTtBQUNWO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLFFBQVE7QUFBQSxJQUdSO0FBQ0EsUUFBSTtBQUNGLFlBQU0sV0FBVyxNQUFNLE9BQU8sUUFBUSxjQUFjLEVBQUUsTUFBTSxLQUFLLENBQUM7QUFDbEUsa0JBQVksU0FBUyxPQUFPO0FBQUEsSUFDOUIsU0FBUyxPQUFPO0FBQ2QsZ0JBQVUseUJBQXlCLE9BQU8sV0FBVyxPQUFPLEtBQUssQ0FBQyxJQUFJLElBQUk7QUFDMUUsZ0JBQVUsYUFBYTtBQUN2QixZQUFNLFNBQVM7QUFBQSxJQUNqQjtBQUFBLEVBQ0Y7QUFFQSxlQUFhLGlCQUFpQixTQUFTLE1BQU07QUFDM0MsU0FBSyxVQUFVO0FBQUEsRUFDakIsQ0FBQztBQUVELGtCQUFnQixpQkFBaUIsVUFBVSxNQUFNO0FBQy9DLFVBQU0sV0FBVyxlQUFlO0FBQ2hDLFFBQUksVUFBVTtBQUNaLFdBQUssUUFBUSxRQUFRO0FBQUEsSUFDdkI7QUFBQSxFQUNGLENBQUM7QUFFRCxTQUFPLGlCQUFpQixTQUFTLENBQUMsVUFBVTtBQUMxQyxjQUFVLGtCQUFrQixNQUFNLE9BQU8sSUFBSSxJQUFJO0FBQUEsRUFDbkQsQ0FBQztBQUVELFNBQU8saUJBQWlCLHNCQUFzQixDQUFDLFVBQVU7QUFDdkQsY0FBVSx3QkFBd0IsT0FBTyxNQUFNLE1BQU0sQ0FBQyxJQUFJLElBQUk7QUFBQSxFQUNoRSxDQUFDO0FBRUQsaUJBQWUsT0FBTztBQUNwQixRQUFJO0FBQ0YsWUFBTSxXQUFXLE1BQU0sT0FBTyxRQUFRLGlCQUFpQjtBQUFBLFFBQ3JELFFBQVE7QUFBQSxRQUNSLGlCQUFpQjtBQUFBLE1BQ25CLENBQUM7QUFDRCx1QkFBaUIsU0FBUyxPQUFPO0FBQUEsSUFDbkMsUUFBUTtBQUFBLElBRVI7QUFDQSxVQUFNLFVBQVU7QUFBQSxFQUNsQjtBQUVBLE9BQUssS0FBSzsiLAogICJuYW1lcyI6IFsic3ZnIl0KfQo=
