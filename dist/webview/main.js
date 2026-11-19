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
    "query.capabilities"
  ]);
  var HOST_TO_WEBVIEW = Object.freeze([
    "graph.data",
    "capabilities.data",
    "csr.data",
    "query.data",
    "analysis.progress",
    "protocol.error",
    "protocol.ack",
    "panel.pong"
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
            class: `cf-edge cf-edge--${edge.status}`,
            d: edgePath(source, target),
            "data-from": edge.from,
            "data-to": edge.to
          })
        );
        path.dataset.from = edge.from;
        path.dataset.to = edge.to;
        const title = svgEl("title");
        title.textContent = `${edge.type} (${edge.status})${edge.reasonCode ? `: ${edge.reasonCode}` : ""}`;
        path.appendChild(title);
        viewport.appendChild(path);
        edgeElements.set(edge.id, path);
      }
      for (const node of dto.nodes) {
        const group = (
          /** @type {SVGGElement} */
          svgEl("g", {
            class: `cf-node cf-node--${node.status}${node.external ? " cf-node--external" : ""}`,
            transform: `translate(${node.position.x} ${node.position.y})`,
            tabindex: "0",
            role: "button",
            "aria-label": `${node.kind} ${node.label}, ${node.status}${node.external ? ", external target" : ""}`
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
        const label = svgEl("text", {
          class: "cf-node-label",
          x: 10,
          y: node.position.height / 2 - 1
        });
        label.textContent = truncate(node.label, 26);
        group.appendChild(label);
        const kind = svgEl("text", {
          class: "cf-node-kind",
          x: 10,
          y: node.position.height / 2 + 13
        });
        kind.textContent = node.external ? `${node.kind} \xB7 external` : node.kind;
        group.appendChild(kind);
        if (node.badge || node.status !== "resolved") {
          const badge = svgEl("text", {
            class: "cf-node-badge",
            x: node.position.width - 8,
            y: 12,
            "text-anchor": "end"
          });
          badge.textContent = truncate(node.badge || node.status, 18);
          group.appendChild(badge);
        }
        const title = svgEl("title");
        title.textContent = `${node.kind} ${node.label}
status: ${node.status}${node.range ? `
lines ${node.range.startLine + 1}-${node.range.endLine + 1}` : ""}`;
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
  var currentDto = null;
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
    setStatus(
      `${dto.language} \xB7 ${dto.nodes.length} nodes \xB7 ${dto.edges.length} edges \xB7 ${dto.completeness}`
    );
    const degradations = dto.degradations ?? [];
    setBanner(degradations.length > 0 ? degradations.join(" \xB7 ") : "", false);
  }
  bridge.on("protocol.error", (payload) => {
    const code = typeof payload.code === "string" ? payload.code : "E_PROTOCOL";
    const message = typeof payload.message === "string" ? payload.message : "Unknown error.";
    setBanner(`${code}: ${message}`, true);
    setStatus("Error");
  });
  async function loadGraph() {
    setStatus("Loading graph\u2026");
    setBanner("");
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMiLCAiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2xheW91dC5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBDb2RlRmxvdyB3ZWJ2aWV3IHByb3RvY29sLlxuICpcbiAqIFRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcgYXJlIHNlcGFyYXRlIEphdmFTY3JpcHQgY29udGV4dHMuIEV2ZXJ5XG4gKiBtZXNzYWdlIHRoYXQgY3Jvc3NlcyB0aGF0IGJvdW5kYXJ5IG11c3QgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIHNvIHRoYXQgYVxuICogc2luZ2xlLCB2ZXJzaW9uZWQgY29udHJhY3QgZGVjaWRlcyB3aGF0IGlzIGxlZ2FsLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGludGVudGlvbmFsbHkgZGVwZW5kZW5jeS1mcmVlOiBpdCBpcyBidW5kbGVkIGludG8gYm90aCB0aGVcbiAqIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2Vidmlldy5cbiAqL1xuXG5leHBvcnQgY29uc3QgUFJPVE9DT0xfVkVSU0lPTiA9IDE7XG5cbi8qKiBIYXJkIGNlaWxpbmcgb24gYSBzZXJpYWxpemVkIG1lc3NhZ2UuIExhcmdlciBtZXNzYWdlcyBhcmUgcmVqZWN0ZWQsIG5ldmVyIHRydW5jYXRlZC4gKi9cbmV4cG9ydCBjb25zdCBNQVhfUEFZTE9BRF9CWVRFUyA9IDFfMDAwXzAwMDtcblxuLyoqIGBkb21haW4uYWN0aW9uYCBpbiBsb3dlciBjYXNlLCBhdCBsZWFzdCB0d28gc2VnbWVudHMuICovXG5leHBvcnQgY29uc3QgS0lORF9QQVRURVJOID0gL15bYS16XSsoXFwuW2Etel0rKSskLztcblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfSURfUEFUVEVSTiA9IC9eW0EtWmEtejAtOV8tXXsxLDEyOH0kLztcblxuLyoqIEtpbmRzIGEgd2VidmlldyBtYXkgc2VuZCB0byB0aGUgaG9zdC4gKi9cbmV4cG9ydCBjb25zdCBXRUJWSUVXX1RPX0hPU1QgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3dlYnZpZXcucmVhZHknLFxuICAnZ3JhcGgubG9hZCcsXG4gICdjc3IubG9hZCcsXG4gICdub2RlLnNlbGVjdCcsXG4gICdwYW5lbC5waW5nJyxcbiAgJ3F1ZXJ5LnN5bWJvbCcsXG4gICdxdWVyeS5zeW1ib2xzJyxcbiAgJ3F1ZXJ5LmNhbGxlcnMnLFxuICAncXVlcnkuY2FsbGVlcycsXG4gICdxdWVyeS5jb25zdHJ1Y3RzJyxcbiAgJ3F1ZXJ5LmNhcGFiaWxpdGllcycsXG5dKTtcblxuLyoqIEtpbmRzIHRoZSBob3N0IG1heSBzZW5kIHRvIHRoZSB3ZWJ2aWV3LiAqL1xuZXhwb3J0IGNvbnN0IEhPU1RfVE9fV0VCVklFVyA9IE9iamVjdC5mcmVlemUoW1xuICAnZ3JhcGguZGF0YScsXG4gICdjYXBhYmlsaXRpZXMuZGF0YScsXG4gICdjc3IuZGF0YScsXG4gICdxdWVyeS5kYXRhJyxcbiAgJ2FuYWx5c2lzLnByb2dyZXNzJyxcbiAgJ3Byb3RvY29sLmVycm9yJyxcbiAgJ3Byb3RvY29sLmFjaycsXG4gICdwYW5lbC5wb25nJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgRElSRUNUSU9OUyA9IE9iamVjdC5mcmVlemUoe1xuICBXRUJWSUVXX1RPX0hPU1Q6ICd3ZWJ2aWV3X3RvX2hvc3QnLFxuICBIT1NUX1RPX1dFQlZJRVc6ICdob3N0X3RvX3dlYnZpZXcnLFxufSk7XG5cbmNvbnN0IEtJTkRfQUxMT1dMSVNUID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFtESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVF06IG5ldyBTZXQoV0VCVklFV19UT19IT1NUKSxcbiAgW0RJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXTogbmV3IFNldChIT1NUX1RPX1dFQlZJRVcpLFxufSk7XG5cbmNvbnN0IFVOU0FGRV9LRVlTID0gbmV3IFNldChbJ19fcHJvdG9fXycsICdjb25zdHJ1Y3RvcicsICdwcm90b3R5cGUnXSk7XG5cbmNvbnN0IE1BWF9LRVlfU0NBTl9ERVBUSCA9IDg7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRW52ZWxvcGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwcm90b2NvbFZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25TdWNjZXNzXG4gKiBAcHJvcGVydHkge3RydWV9IG9rXG4gKiBAcHJvcGVydHkge0VudmVsb3BlfSBlbnZlbG9wZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbkZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1BST1RPQ09MJ3wnRV9MSU1JVCd9IGNvZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWFzb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhdGhdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqL1xuXG4vKipcbiAqIEJ1aWxkIGEgd2VsbC1mb3JtZWQgZW52ZWxvcGUuIFByb2R1Y2VycyBzaG91bGQgdXNlIHRoaXMgaW5zdGVhZCBvZiB3cml0aW5nXG4gKiBvYmplY3QgbGl0ZXJhbHMgc28gdGhhdCB0aGUgdmVyc2lvbiBmaWVsZCBjYW4gbmV2ZXIgYmUgZm9yZ290dGVuLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHJldHVybnMge0VudmVsb3BlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQ6IHBheWxvYWQgPz8ge30sXG4gIH07XG4gIGlmIChyZXF1ZXN0SWQpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cbiAgcmV0dXJuIGVudmVsb3BlO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgdHlwZWQgZXJyb3IgcGF5bG9hZC4gYGRldGFpbGAgbXVzdCBuZXZlciBjb250YWluIHNvdXJjZSB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgY29uc3QgcGF5bG9hZCA9IHsgY29kZSwgbWVzc2FnZSB9O1xuICBpZiAoZGV0YWlsKSB7XG4gICAgcGF5bG9hZC5kZXRhaWwgPSBkZXRhaWw7XG4gIH1cbiAgcmV0dXJuIHBheWxvYWQ7XG59XG5cbi8qKlxuICogQXBwcm94aW1hdGUgc2VyaWFsaXplZCBzaXplIG9mIGEgbWVzc2FnZS4gVXNlZCBmb3IgbGltaXQgZW5mb3JjZW1lbnQ7IHRoZVxuICogZXhhY3QgYnl0ZXMgZG8gbm90IG1hdHRlciwgb25seSB0aGF0IG92ZXJzaXplZCBtZXNzYWdlcyBhcmUgcmVmdXNlZCBiZWZvcmVcbiAqIHRoZXkgYXJlIHBvc3RlZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVzc2FnZVNpemUodmFsdWUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIHJldHVybiB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBqc29uLmxlbmd0aCA6IDA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIFJlamVjdCBwYXlsb2FkcyB0aGF0IGNvdWxkIHBvaXNvbiBwcm90b3R5cGVzIHdoZW4gbWVyZ2VkIG9yIHNwcmVhZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlfSB8IHtvazogZmFsc2UsIHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmd9fVxuICovXG5mdW5jdGlvbiBzY2FuVW5zYWZlS2V5cyh2YWx1ZSwgcGF0aCwgZGVwdGgpIHtcbiAgaWYgKGRlcHRoID4gTUFYX0tFWV9TQ0FOX0RFUFRIIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmVudHJpZXMoKSA6IE9iamVjdC5lbnRyaWVzKHZhbHVlKTtcbiAgZm9yIChjb25zdCBba2V5LCBjaGlsZF0gb2YgZW50cmllcykge1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gYCR7cGF0aH1bJHtrZXl9XWAgOiBgJHtwYXRofS4ke2tleX1gO1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgVU5TQUZFX0tFWVMuaGFzKFN0cmluZyhrZXkpKSkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBwYXRoOiBjaGlsZFBhdGgsIGtleTogU3RyaW5nKGtleSkgfTtcbiAgICB9XG4gICAgY29uc3QgbmVzdGVkID0gc2NhblVuc2FmZUtleXMoY2hpbGQsIGNoaWxkUGF0aCwgZGVwdGggKyAxKTtcbiAgICBpZiAoIW5lc3RlZC5vaykge1xuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBpbmJvdW5kIG1lc3NhZ2UgYWdhaW5zdCB0aGUgcHJvdG9jb2wgY29udHJhY3QuXG4gKlxuICogVmFsaWRhdGlvbiBpcyB0b3RhbDogZXZlcnkgcmVqZWN0aW9uIHJldHVybnMgYSB0eXBlZCBmYWlsdXJlIHdpdGggYSBzdGFibGVcbiAqIHJlYXNvbiBjb2RlLCBhbmQgbmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcGFyYW0ge3tkaXJlY3Rpb246ICd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VmFsaWRhdGlvblN1Y2Nlc3MgfCBWYWxpZGF0aW9uRmFpbHVyZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRW52ZWxvcGUocmF3LCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnM/LmRpcmVjdGlvbjtcbiAgY29uc3QgYWxsb3dsaXN0ID0gS0lORF9BTExPV0xJU1RbZGlyZWN0aW9uXTtcbiAgaWYgKCFhbGxvd2xpc3QpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9kaXJlY3Rpb24nLFxuICAgICAgbWVzc2FnZTogYFVua25vd24gcHJvdG9jb2wgZGlyZWN0aW9uOiAke1N0cmluZyhkaXJlY3Rpb24pfWAsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghaXNQbGFpbk9iamVjdChyYXcpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ25vdF9hbl9vYmplY3QnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocmF3KTtcblxuICBpZiAoY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbiAhPT0gUFJPVE9DT0xfVkVSU0lPTikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd2ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgIG1lc3NhZ2U6IGBVbnN1cHBvcnRlZCBwcm90b2NvbCB2ZXJzaW9uOiBleHBlY3RlZCAke1BST1RPQ09MX1ZFUlNJT059LCByZWNlaXZlZCAke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbixcbiAgICAgICl9LmAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtpbmQgPSBjYW5kaWRhdGUua2luZDtcbiAgaWYgKHR5cGVvZiBraW5kICE9PSAnc3RyaW5nJyB8fCAhS0lORF9QQVRURVJOLnRlc3Qoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9raW5kJyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIGtpbmQgbXVzdCBsb29rIGxpa2UgXCJkb21haW4uYWN0aW9uXCIgaW4gbG93ZXIgY2FzZS4nLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWFsbG93bGlzdC5oYXMoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9raW5kJyxcbiAgICAgIG1lc3NhZ2U6IGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBhY2NlcHRlZCBpbiBkaXJlY3Rpb24gXCIke2RpcmVjdGlvbn1cIi5gLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZXF1ZXN0SWQgPSBjYW5kaWRhdGUucmVxdWVzdElkO1xuICBpZiAocmVxdWVzdElkICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RJZCAhPT0gJ3N0cmluZycgfHwgIVJFUVVFU1RfSURfUEFUVEVSTi50ZXN0KHJlcXVlc3RJZCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgICByZWFzb246ICdpbnZhbGlkX3JlcXVlc3RfaWQnLFxuICAgICAgICBtZXNzYWdlOiAncmVxdWVzdElkIG11c3QgYmUgMS0xMjggY2hhcmFjdGVycyBvZiBBLVosIGEteiwgMC05LCBcIl9cIiBvciBcIi1cIi4nLFxuICAgICAgICBwYXRoOiAncmVxdWVzdElkJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcGF5bG9hZCA9IGNhbmRpZGF0ZS5wYXlsb2FkID8/IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QocGF5bG9hZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9wYXlsb2FkJyxcbiAgICAgIG1lc3NhZ2U6ICdwYXlsb2FkIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICAgIHBhdGg6ICdwYXlsb2FkJyxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtleVNjYW4gPSBzY2FuVW5zYWZlS2V5cyhwYXlsb2FkLCAncGF5bG9hZCcsIDApO1xuICBpZiAoIWtleVNjYW4ub2spIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5zYWZlX2tleScsXG4gICAgICBtZXNzYWdlOiBgUGF5bG9hZCBjb250YWlucyBhIGZvcmJpZGRlbiBrZXkgXCIke2tleVNjYW4ua2V5fVwiLmAsXG4gICAgICBwYXRoOiBrZXlTY2FuLnBhdGgsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBpZiAobWVzc2FnZVNpemUoY2FuZGlkYXRlKSA+IE1BWF9QQVlMT0FEX0JZVEVTKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX0xJTUlUJyxcbiAgICAgIHJlYXNvbjogJ3BheWxvYWRfdG9vX2xhcmdlJyxcbiAgICAgIG1lc3NhZ2U6IGBNZXNzYWdlIGV4Y2VlZHMgdGhlICR7TUFYX1BBWUxPQURfQllURVN9IGJ5dGUgbGltaXQuYCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQsXG4gIH07XG4gIGlmICh0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJykge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuXG4gIHJldHVybiB7IG9rOiB0cnVlLCBlbnZlbG9wZSB9O1xufVxuIiwgIi8qKlxuICogV2VidmlldyBtZXNzYWdlIGJyaWRnZS5cbiAqXG4gKiBTeW1tZXRyaWMgaW1wbGVtZW50YXRpb24gdXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKiBSZXNwb25zaWJpbGl0aWVzOlxuICogLSBWYWxpZGF0ZSBldmVyeSBpbmJvdW5kIG1lc3NhZ2UgYmVmb3JlIGFueSBoYW5kbGVyIHNlZXMgaXQuXG4gKiAtIENvcnJlbGF0ZSByZXF1ZXN0cyB3aXRoIHJlc3BvbnNlcywgd2l0aCBhIHRpbWVvdXQgcGVyIHJlcXVlc3QuXG4gKiAtIENvbnRhaW4gaGFuZGxlciBmYWlsdXJlcyBhbmQgcmVwb3J0IHRoZW0gYXMgdHlwZWQgcHJvdG9jb2wgZXJyb3JzLlxuICogLSBSZWplY3Qgd29yayBhZnRlciBkaXNwb3NhbCBzbyBhIGNsb3NlZCBwYW5lbCBjYW5ub3QgbGVhayB0aW1lcnMuXG4gKlxuICogVGhlIGJyaWRnZSBoYXMgbm8gZGVwZW5kZW5jeSBvbiB0aGUgYHZzY29kZWAgbW9kdWxlOiB0aGUgdHJhbnNwb3J0IChgcG9zdGApXG4gKiBpcyBpbmplY3RlZC4gVGhhdCBtYWtlcyB0aGUgd2hvbGUgcmVxdWVzdC9yZXNwb25zZSBjb250cmFjdCB1bml0LXRlc3RhYmxlIGluXG4gKiBwbGFpbiBOb2RlLlxuICovXG5cbmltcG9ydCB7XG4gIERJUkVDVElPTlMsXG4gIEhPU1RfVE9fV0VCVklFVyxcbiAgV0VCVklFV19UT19IT1NULFxuICBjcmVhdGVFbnZlbG9wZSxcbiAgY3JlYXRlRXJyb3JQYXlsb2FkLFxuICBtZXNzYWdlU2l6ZSxcbiAgdmFsaWRhdGVFbnZlbG9wZSxcbn0gZnJvbSAnLi9lbnZlbG9wZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcm90b2NvbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdQcm90b2NvbEVycm9yJztcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIGlmIChkZXRhaWwpIHtcbiAgICAgIHRoaXMuZGV0YWlsID0gZGV0YWlsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQHR5cGUge3tkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259fSAqL1xuY29uc3QgTk9PUF9MT0dHRVIgPSB7XG4gIGRlYnVnKCkge30sXG4gIHdhcm4oKSB7fSxcbiAgZXJyb3IoKSB7fSxcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQnJpZGdlT3B0aW9uc1xuICogQHByb3BlcnR5IHsobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWR9IHBvc3QgIFRyYW5zcG9ydCB0byB0aGUgb3RoZXIgc2lkZS5cbiAqIEBwcm9wZXJ0eSB7J3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J30gaW5ib3VuZERpcmVjdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ9IFt0aW1lb3V0TXNdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW21heEluRmxpZ2h0XVxuICogQHByb3BlcnR5IHsoKSA9PiBzdHJpbmd9IFtjcmVhdGVSZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge3R5cGVvZiBOT09QX0xPR0dFUn0gW2xvZ2dlcl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QnJpZGdlT3B0aW9uc30gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnJpZGdlKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBwb3N0LCBpbmJvdW5kRGlyZWN0aW9uLCBsb2dnZXIgPSBOT09QX0xPR0dFUiB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0aW9ucy50aW1lb3V0TXMgPz8gNTAwMDtcbiAgY29uc3QgbWF4SW5GbGlnaHQgPSBvcHRpb25zLm1heEluRmxpZ2h0ID8/IDMyO1xuICBjb25zdCBvdXRib3VuZERpcmVjdGlvbiA9XG4gICAgaW5ib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RcbiAgICAgID8gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVdcbiAgICAgIDogRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1Q7XG4gIGNvbnN0IG91dGJvdW5kS2luZHMgPSBuZXcgU2V0KFxuICAgIG91dGJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyA/IEhPU1RfVE9fV0VCVklFVyA6IFdFQlZJRVdfVE9fSE9TVCxcbiAgKTtcblxuICBsZXQgc2VxdWVuY2UgPSAwO1xuICBjb25zdCBjcmVhdGVSZXF1ZXN0SWQgPVxuICAgIG9wdGlvbnMuY3JlYXRlUmVxdWVzdElkID8/XG4gICAgKCgpID0+IHtcbiAgICAgIHNlcXVlbmNlICs9IDE7XG4gICAgICByZXR1cm4gYHIke3NlcXVlbmNlLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcbiAgICB9KTtcblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHtyZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+fT59ICovXG4gIGNvbnN0IHBlbmRpbmcgPSBuZXcgTWFwKCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bj59ICovXG4gIGNvbnN0IGhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICBjb25zdCByZXBvcnRlZEtpbmRzID0gbmV3IFNldCgpO1xuICBsZXQgZGlzcG9zZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpO1xuICAgIH1cbiAgICBpZiAoIW91dGJvdW5kS2luZHMuaGFzKGtpbmQpKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9QUk9UT0NPTCcsIGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBzZW5kYWJsZSBpbiB0aGlzIGRpcmVjdGlvbi5gKTtcbiAgICB9XG4gICAgY29uc3QgZW52ZWxvcGUgPSBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgIGlmIChtZXNzYWdlU2l6ZShlbnZlbG9wZSkgPiAxXzAwMF8wMDApIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgJ1JlZnVzaW5nIHRvIHNlbmQgYW4gb3ZlcnNpemVkIG1lc3NhZ2UuJyk7XG4gICAgfVxuICAgIHBvc3QoZW52ZWxvcGUpO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wuc2VuZCcsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQsIGRldGFpbCkge1xuICAgIHRyeSB7XG4gICAgICBzZW5kKCdwcm90b2NvbC5lcnJvcicsIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpLCByZXF1ZXN0SWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gVGhlIHBhbmVsIG1heSBhbHJlYWR5IGJlIGdvbmUuIE5vdGhpbmcgdXNlZnVsIHJlbWFpbnMgdG8gZG8uXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7KHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bn0gaGFuZGxlclxuICAgKiBAcmV0dXJucyB7KCkgPT4gdm9pZH0gdW5zdWJzY3JpYmVcbiAgICovXG4gIGZ1bmN0aW9uIG9uKGtpbmQsIGhhbmRsZXIpIHtcbiAgICBoYW5kbGVycy5zZXQoa2luZCwgaGFuZGxlcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmIChoYW5kbGVycy5nZXQoa2luZCkgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGtpbmQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHJlcXVlc3QgYW5kIGF3YWl0IHRoZSBjb3JyZWxhdGVkIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAgICogQHBhcmFtIHt7dGltZW91dE1zPzogbnVtYmVyfX0gW3JlcXVlc3RPcHRpb25zXVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7a2luZDogc3RyaW5nLCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0+fVxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdChraW5kLCBwYXlsb2FkID0ge30sIHJlcXVlc3RPcHRpb25zID0ge30pIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpKTtcbiAgICB9XG4gICAgaWYgKHBlbmRpbmcuc2l6ZSA+PSBtYXhJbkZsaWdodCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsIGBUb28gbWFueSBpbi1mbGlnaHQgcmVxdWVzdHMgKCR7bWF4SW5GbGlnaHR9KS5gKSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGNyZWF0ZVJlcXVlc3RJZCgpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZVRpbWVvdXQgPSByZXF1ZXN0T3B0aW9ucy50aW1lb3V0TXMgPz8gdGltZW91dE1zO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChcbiAgICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcihcbiAgICAgICAgICAgICdFX1RJTUVPVVQnLFxuICAgICAgICAgICAgYE5vIHJlc3BvbnNlIHRvIFwiJHtraW5kfVwiIHdpdGhpbiAke2VmZmVjdGl2ZVRpbWVvdXR9IG1zLmAsXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGtpbmQsXG4gICAgICAgICAgICAgIHJlcXVlc3RJZCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgKSxcbiAgICAgICAgKTtcbiAgICAgIH0sIGVmZmVjdGl2ZVRpbWVvdXQpO1xuICAgICAgcGVuZGluZy5zZXQocmVxdWVzdElkLCB7IHJlc29sdmUsIHJlamVjdCwgdGltZXIgfSk7XG4gICAgICB0cnkge1xuICAgICAgICBzZW5kKGtpbmQsIHBheWxvYWQsIHJlcXVlc3RJZCk7XG4gICAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgICBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICByZWplY3QoZXJyb3IpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gICAqIEByZXR1cm5zIHtQcm9taXNlPHtvazogYm9vbGVhbiwgY29kZT86IHN0cmluZywgcmVhc29uPzogc3RyaW5nfT59XG4gICAqL1xuICBhc3luYyBmdW5jdGlvbiBoYW5kbGVNZXNzYWdlKHJhdykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlOiAnRV9DQU5DRUxMRUQnLCByZWFzb246ICdkaXNwb3NlZCcgfTtcbiAgICB9XG5cbiAgICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVFbnZlbG9wZShyYXcsIHsgZGlyZWN0aW9uOiBpbmJvdW5kRGlyZWN0aW9uIH0pO1xuICAgIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgICAgaWYgKCFyZXBvcnRlZEtpbmRzLmhhcyh2YWxpZGF0aW9uLnJlYXNvbikpIHtcbiAgICAgICAgcmVwb3J0ZWRLaW5kcy5hZGQodmFsaWRhdGlvbi5yZWFzb24pO1xuICAgICAgICBsb2dnZXIud2FybigncHJvdG9jb2wucmVqZWN0ZWQnLCB7XG4gICAgICAgICAgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbixcbiAgICAgICAgICBwYXRoOiB2YWxpZGF0aW9uLnBhdGggPz8gbnVsbCxcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBzZW5kRXJyb3IodmFsaWRhdGlvbi5jb2RlLCB2YWxpZGF0aW9uLm1lc3NhZ2UsIHZhbGlkYXRpb24ucmVxdWVzdElkLCB7XG4gICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICB9KTtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogdmFsaWRhdGlvbi5jb2RlLCByZWFzb246IHZhbGlkYXRpb24ucmVhc29uIH07XG4gICAgfVxuXG4gICAgY29uc3QgZW52ZWxvcGUgPSB2YWxpZGF0aW9uLmVudmVsb3BlO1xuICAgIGNvbnN0IHsga2luZCwgcmVxdWVzdElkLCBwYXlsb2FkIH0gPSBlbnZlbG9wZTtcbiAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnJlY2VpdmUnLCB7XG4gICAgICBraW5kLFxuICAgICAgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCxcbiAgICAgIGJ5dGVzOiBtZXNzYWdlU2l6ZShlbnZlbG9wZSksXG4gICAgfSk7XG5cbiAgICBpZiAoa2luZCA9PT0gJ3Byb3RvY29sLmVycm9yJykge1xuICAgICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgICAgaWYgKGVudHJ5KSB7XG4gICAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICAgIGNvbnN0IGNvZGUgPSB0eXBlb2YgcGF5bG9hZC5jb2RlID09PSAnc3RyaW5nJyA/IHBheWxvYWQuY29kZSA6ICdFX1BST1RPQ09MJztcbiAgICAgICAgICBjb25zdCBtZXNzYWdlID1cbiAgICAgICAgICAgIHR5cGVvZiBwYXlsb2FkLm1lc3NhZ2UgPT09ICdzdHJpbmcnXG4gICAgICAgICAgICAgID8gcGF5bG9hZC5tZXNzYWdlXG4gICAgICAgICAgICAgIDogJ1RoZSBvdGhlciBzaWRlIHJlcG9ydGVkIGFuIGVycm9yLic7XG4gICAgICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKGNvZGUsIG1lc3NhZ2UsIHsgcmVxdWVzdElkIH0pKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9XG5cbiAgICBpZiAocmVxdWVzdElkICYmIHBlbmRpbmcuaGFzKHJlcXVlc3RJZCkpIHtcbiAgICAgIGNvbnN0IGVudHJ5ID0gcGVuZGluZy5nZXQocmVxdWVzdElkKTtcbiAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgICBwZW5kaW5nLmRlbGV0ZShyZXF1ZXN0SWQpO1xuICAgICAgICBlbnRyeS5yZXNvbHZlKHsga2luZCwgcGF5bG9hZCB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgY29uc3QgaGFuZGxlciA9IGhhbmRsZXJzLmdldChraW5kKTtcbiAgICBpZiAoIWhhbmRsZXIpIHtcbiAgICAgIC8vIEEgcmVzcG9uc2Ugd2hvc2UgcmVxdWVzdCBhbHJlYWR5IHRpbWVkIG91dCBpcyBleHBlY3RlZCBhbmQgaGFybWxlc3MuXG4gICAgICBsb2dnZXIuZGVidWcoJ3Byb3RvY29sLnVuaGFuZGxlZCcsIHsga2luZCwgcmVxdWVzdElkOiByZXF1ZXN0SWQgPz8gbnVsbCB9KTtcbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIGF3YWl0IGhhbmRsZXIocGF5bG9hZCwgeyByZXF1ZXN0SWQgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBtZXNzYWdlID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgICAgY29uc3QgY29kZSA9XG4gICAgICAgIGVycm9yIGluc3RhbmNlb2YgUHJvdG9jb2xFcnJvclxuICAgICAgICAgID8gZXJyb3IuY29kZVxuICAgICAgICAgIDogKC8qKiBAdHlwZSB7e2NvZGU/OiBzdHJpbmd9fSAqLyAoZXJyb3IpPy5jb2RlID8/ICdFX1BST1RPQ09MJyk7XG4gICAgICBsb2dnZXIuZXJyb3IoJ3Byb3RvY29sLmhhbmRsZXJfZmFpbGVkJywgeyBraW5kLCBlcnJvcjogbWVzc2FnZSB9KTtcbiAgICAgIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQpO1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBjb2RlIH07XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZWFzb25cbiAgICovXG4gIGZ1bmN0aW9uIGRpc3Bvc2UocmVhc29uID0gJ2Rpc3Bvc2VkJykge1xuICAgIGlmIChkaXNwb3NlZCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkaXNwb3NlZCA9IHRydWU7XG4gICAgZm9yIChjb25zdCBbLCBlbnRyeV0gb2YgcGVuZGluZykge1xuICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCBgQnJpZGdlIGNsb3NlZDogJHtyZWFzb259YCkpO1xuICAgIH1cbiAgICBwZW5kaW5nLmNsZWFyKCk7XG4gICAgaGFuZGxlcnMuY2xlYXIoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgb24sXG4gICAgcmVxdWVzdCxcbiAgICByZXNwb25kOiBzZW5kLFxuICAgIGhhbmRsZU1lc3NhZ2UsXG4gICAgZGlzcG9zZSxcbiAgICBwZW5kaW5nQ291bnQ6ICgpID0+IHBlbmRpbmcuc2l6ZSxcbiAgICBpc0Rpc3Bvc2VkOiAoKSA9PiBkaXNwb3NlZCxcbiAgICBkaXJlY3Rpb246IGluYm91bmREaXJlY3Rpb24sXG4gIH07XG59XG4iLCAiLyoqXG4gKiBEZXRlcm1pbmlzdGljIGxheWVyZWQgbGF5b3V0LlxuICpcbiAqIFBoYXNlIDAgbmVlZHMgcG9zaXRpb25zIHNvIHRoZSB3ZWJ2aWV3IGNhbiBkcmF3IHNvbWV0aGluZyB3aXRob3V0IG93bmluZyBhXG4gKiBsYXlvdXQgYWxnb3JpdGhtLiBQaGFzZSA0IGJlbmNobWFya3MgcmVhbCBlbmdpbmVzIChDeXRvc2NhcGUvRUxLL2RhZ3JlKSBhbmRcbiAqIHJlcGxhY2VzIHRoaXMgYmVoaW5kIHRoZSByZW5kZXJlciBib3VuZGFyeTsgdW50aWwgdGhlbiwgZGV0ZXJtaW5pc3RpYyBvdXRwdXRcbiAqIGlzIG1vcmUgdmFsdWFibGUgdGhhbiBwcmV0dHkgb3V0cHV0IGJlY2F1c2UgaXQgbWFrZXMgdGVzdHMgc3RhYmxlLlxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi9tb2RlbC5qcycpLkdyYXBofSBHcmFwaFxuICogQHR5cGVkZWYge3t4OiBudW1iZXIsIHk6IG51bWJlciwgd2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXIsIGxheWVyOiBudW1iZXJ9fSBQb3NpdGlvblxuICovXG5cbmV4cG9ydCBjb25zdCBMQVlPVVRfREVGQVVMVFMgPSBPYmplY3QuZnJlZXplKHtcbiAgbm9kZVdpZHRoOiAxOTAsXG4gIG5vZGVIZWlnaHQ6IDU0LFxuICBob3Jpem9udGFsR2FwOiA5MCxcbiAgdmVydGljYWxHYXA6IDI2LFxuICBtYXhMYXllcnM6IDQwLFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEBwYXJhbSB7UGFydGlhbDx0eXBlb2YgTEFZT1VUX0RFRkFVTFRTPn0gW29wdGlvbnNdXG4gKiBAcmV0dXJucyB7e3Bvc2l0aW9uczogUmVjb3JkPHN0cmluZywgUG9zaXRpb24+LCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXJzOiBzdHJpbmdbXVtdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNvbXB1dGVMYXlvdXQoZ3JhcGgsIG9wdGlvbnMgPSB7fSkge1xuICBjb25zdCBjb25maWcgPSB7IC4uLkxBWU9VVF9ERUZBVUxUUywgLi4ub3B0aW9ucyB9O1xuICBjb25zdCBub2RlSWRzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiBub2RlLmlkKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBudW1iZXI+fSAqL1xuICBjb25zdCBsYXllck9mID0gbmV3IE1hcCgpO1xuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBpbmNvbWluZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3Qgb3V0Z29pbmcgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBbXV0pKTtcblxuICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZ3JhcGguZWRnZXMpIHtcbiAgICBpZiAoIWluY29taW5nLmhhcyhlZGdlLnRvKSB8fCAhaW5jb21pbmcuaGFzKGVkZ2UuZnJvbSkgfHwgZWRnZS5mcm9tID09PSBlZGdlLnRvKSB7XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaW5jb21pbmcuZ2V0KGVkZ2UudG8pPy5wdXNoKGVkZ2UuZnJvbSk7XG4gICAgb3V0Z29pbmcuZ2V0KGVkZ2UuZnJvbSk/LnB1c2goZWRnZS50byk7XG4gIH1cblxuICAvLyBLYWhuJ3MgYWxnb3JpdGhtIGdpdmVzIGEgdG9wb2xvZ2ljYWwgb3JkZXI7IGN5Y2xlcyBhcmUgaGFuZGxlZCBhZnRlcndhcmRzLlxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGluZGVncmVlID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgaW5jb21pbmcuZ2V0KGlkKT8ubGVuZ3RoID8/IDBdKSk7XG4gIGNvbnN0IHJlYWR5ID0gbm9kZUlkcy5maWx0ZXIoKGlkKSA9PiAoaW5kZWdyZWUuZ2V0KGlkKSA/PyAwKSA9PT0gMCkuc29ydCgpO1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBvcmRlciA9IFtdO1xuXG4gIHdoaWxlIChyZWFkeS5sZW5ndGggPiAwKSB7XG4gICAgY29uc3QgaWQgPSAvKiogQHR5cGUge3N0cmluZ30gKi8gKHJlYWR5LnNoaWZ0KCkpO1xuICAgIG9yZGVyLnB1c2goaWQpO1xuICAgIGZvciAoY29uc3QgbmV4dCBvZiAob3V0Z29pbmcuZ2V0KGlkKSA/PyBbXSkuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZyA9IChpbmRlZ3JlZS5nZXQobmV4dCkgPz8gMCkgLSAxO1xuICAgICAgaW5kZWdyZWUuc2V0KG5leHQsIHJlbWFpbmluZyk7XG4gICAgICBpZiAocmVtYWluaW5nID09PSAwKSB7XG4gICAgICAgIHJlYWR5LnB1c2gobmV4dCk7XG4gICAgICAgIHJlYWR5LnNvcnQoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBsZXQgbWF4TGF5ZXIgPSAwO1xuICBmb3IgKGNvbnN0IGlkIG9mIG9yZGVyKSB7XG4gICAgY29uc3QgcHJlZGVjZXNzb3JzID0gaW5jb21pbmcuZ2V0KGlkKSA/PyBbXTtcbiAgICBjb25zdCBsYXllciA9XG4gICAgICBwcmVkZWNlc3NvcnMubGVuZ3RoID09PSAwXG4gICAgICAgID8gMFxuICAgICAgICA6IE1hdGgubWF4KC4uLnByZWRlY2Vzc29ycy5tYXAoKHByZWQpID0+IGxheWVyT2YuZ2V0KHByZWQpID8/IDApKSArIDE7XG4gICAgbGF5ZXJPZi5zZXQoaWQsIGxheWVyKTtcbiAgICBtYXhMYXllciA9IE1hdGgubWF4KG1heExheWVyLCBsYXllcik7XG4gIH1cblxuICAvLyBOb2RlcyBpbnNpZGUgYSBjeWNsZSBuZXZlciByZWFjaCBpbmRlZ3JlZSAwLiBQbGFjZSB0aGVtIGFmdGVyIGV2ZXJ5dGhpbmdcbiAgLy8gdGhhdCBjb3VsZCBiZSBvcmRlcmVkLCByYXRoZXIgdGhhbiBkcm9wcGluZyB0aGVtLlxuICBjb25zdCBjeWNsaWMgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+ICFsYXllck9mLmhhcyhpZCkpLnNvcnQoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBjeWNsaWMpIHtcbiAgICBsYXllck9mLnNldChpZCwgTWF0aC5taW4obWF4TGF5ZXIgKyAxLCBjb25maWcubWF4TGF5ZXJzKSk7XG4gIH1cblxuICAvKiogQHR5cGUge01hcDxudW1iZXIsIHN0cmluZ1tdPn0gKi9cbiAgY29uc3QgYnlMYXllciA9IG5ldyBNYXAoKTtcbiAgZm9yIChjb25zdCBpZCBvZiBub2RlSWRzLnNsaWNlKCkuc29ydCgpKSB7XG4gICAgY29uc3QgbGF5ZXIgPSBNYXRoLm1pbihsYXllck9mLmdldChpZCkgPz8gMCwgY29uZmlnLm1heExheWVycyk7XG4gICAgaWYgKCFieUxheWVyLmhhcyhsYXllcikpIHtcbiAgICAgIGJ5TGF5ZXIuc2V0KGxheWVyLCBbXSk7XG4gICAgfVxuICAgIGJ5TGF5ZXIuZ2V0KGxheWVyKT8ucHVzaChpZCk7XG4gIH1cblxuICAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIFBvc2l0aW9uPn0gKi9cbiAgY29uc3QgcG9zaXRpb25zID0ge307XG4gIC8qKiBAdHlwZSB7c3RyaW5nW11bXX0gKi9cbiAgY29uc3QgbGF5ZXJzID0gW107XG4gIGxldCB0YWxsZXN0ID0gMDtcblxuICBmb3IgKGNvbnN0IGxheWVyIG9mIFsuLi5ieUxheWVyLmtleXMoKV0uc29ydCgoYSwgYikgPT4gYSAtIGIpKSB7XG4gICAgY29uc3QgaWRzID0gYnlMYXllci5nZXQobGF5ZXIpID8/IFtdO1xuICAgIGxheWVycy5wdXNoKGlkcyk7XG4gICAgaWRzLmZvckVhY2goKGlkLCBpbmRleCkgPT4ge1xuICAgICAgcG9zaXRpb25zW2lkXSA9IHtcbiAgICAgICAgeDogbGF5ZXIgKiAoY29uZmlnLm5vZGVXaWR0aCArIGNvbmZpZy5ob3Jpem9udGFsR2FwKSxcbiAgICAgICAgeTogaW5kZXggKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgICAgICB3aWR0aDogY29uZmlnLm5vZGVXaWR0aCxcbiAgICAgICAgaGVpZ2h0OiBjb25maWcubm9kZUhlaWdodCxcbiAgICAgICAgbGF5ZXIsXG4gICAgICB9O1xuICAgIH0pO1xuICAgIHRhbGxlc3QgPSBNYXRoLm1heCh0YWxsZXN0LCBpZHMubGVuZ3RoKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgcG9zaXRpb25zLFxuICAgIHdpZHRoOiBNYXRoLm1heCgxLCBsYXllcnMubGVuZ3RoKSAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgIGhlaWdodDogTWF0aC5tYXgoMSwgdGFsbGVzdCkgKiAoY29uZmlnLm5vZGVIZWlnaHQgKyBjb25maWcudmVydGljYWxHYXApLFxuICAgIGxheWVycyxcbiAgfTtcbn1cbiIsICIvKipcbiAqIEdyYXBoIHZpZXctbW9kZWwgKERUTykuXG4gKlxuICogVGhlIERUTyBpcyB0aGUgb25seSBncmFwaCBzaGFwZSB0aGUgd2VidmlldyB1bmRlcnN0YW5kcy4gSXQgaXMgcGxhaW4gSlNPTjpcbiAqIG5vIGZ1bmN0aW9ucywgbm8gaWRzIHRoYXQgcmVxdWlyZSBhIGxvb2t1cCwgbm8gc291cmNlIHRleHQuXG4gKlxuICogU291cmNlIHRleHQgaXMgZmV0Y2hlZCBvbiBkZW1hbmQgaW4gUGhhc2UgNSB0aHJvdWdoIGEgc2VwYXJhdGUsIHZhbGlkYXRlZFxuICogcmVxdWVzdC4gS2VlcGluZyB0aGUgRFRPIGZyZWUgb2Ygc291cmNlIHByZXZlbnRzIGFjY2lkZW50YWwgbGVha2FnZSBpbnRvXG4gKiBjYWNoZXMgYW5kIGtlZXBzIG1lc3NhZ2Ugc2l6ZXMgcHJlZGljdGFibGUuXG4gKi9cblxuaW1wb3J0IHsgY29tcHV0ZUxheW91dCB9IGZyb20gJy4vbGF5b3V0LmpzJztcblxuZXhwb3J0IGNvbnN0IEdSQVBIX0RUT19WRVJTSU9OID0gMTtcblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBEdG9Ob2RlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gaWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYWJlbFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGtpbmRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBzdGF0dXNcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBiYWRnZVxuICogQHByb3BlcnR5IHtib29sZWFufSBleHRlcm5hbFxuICogQHByb3BlcnR5IHt7ZmlsZUlkOiBzdHJpbmcsIHN0YXJ0TGluZTogbnVtYmVyLCBlbmRMaW5lOiBudW1iZXJ9IHwgbnVsbH0gcmFuZ2VcbiAqIEBwcm9wZXJ0eSB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IHBvc2l0aW9uXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7T2JqZWN0fSBHcmFwaER0b1xuICogQHByb3BlcnR5IHtudW1iZXJ9IGR0b1ZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBncmFwaElkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gcnVuSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBsYW5ndWFnZVxuICogQHByb3BlcnR5IHtzdHJpbmd9IGFkYXB0ZXJJZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGNvbXBsZXRlbmVzc1xuICogQHByb3BlcnR5IHtEdG9Ob2RlW119IG5vZGVzXG4gKiBAcHJvcGVydHkge0FycmF5PHtpZDogc3RyaW5nLCBmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcsIHR5cGU6IHN0cmluZywgc3RhdHVzOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcsIHJlYXNvbkNvZGU/OiBzdHJpbmd9Pn0gZWRnZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2NvZGU6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nLCBzZXZlcml0eTogc3RyaW5nfT59IGRpYWdub3N0aWNzXG4gKiBAcHJvcGVydHkge3N0cmluZ1tdfSBkZWdyYWRhdGlvbnNcbiAqIEBwcm9wZXJ0eSB7e3dpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyfX0gZXh0ZW50XG4gKiBAcHJvcGVydHkge3tzdGF0dXNlczogc3RyaW5nW10sIGtpbmRzOiBzdHJpbmdbXX19IGxlZ2VuZFxuICovXG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaH0gZ3JhcGhcbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRHRvKGdyYXBoKSB7XG4gIGNvbnN0IGxheW91dCA9IGNvbXB1dGVMYXlvdXQoZ3JhcGgpO1xuXG4gIGNvbnN0IG5vZGVzID0gZ3JhcGgubm9kZXMubWFwKChub2RlKSA9PiAoe1xuICAgIGlkOiBub2RlLmlkLFxuICAgIGxhYmVsOiBub2RlLmxhYmVsLFxuICAgIGtpbmQ6IG5vZGUua2luZCxcbiAgICBzdGF0dXM6IG5vZGUuc3RhdHVzLFxuICAgIGJhZGdlOiBub2RlLmJhZGdlID8/ICcnLFxuICAgIGV4dGVybmFsOiBub2RlLmV4dGVybmFsLFxuICAgIHJhbmdlOiBub2RlLnJhbmdlXG4gICAgICA/IHtcbiAgICAgICAgICBmaWxlSWQ6IG5vZGUucmFuZ2UuZmlsZUlkLFxuICAgICAgICAgIHN0YXJ0TGluZTogbm9kZS5yYW5nZS5zdGFydExpbmUsXG4gICAgICAgICAgZW5kTGluZTogbm9kZS5yYW5nZS5lbmRMaW5lLFxuICAgICAgICB9XG4gICAgICA6IG51bGwsXG4gICAgcG9zaXRpb246IGxheW91dC5wb3NpdGlvbnNbbm9kZS5pZF0gPz8geyB4OiAwLCB5OiAwLCB3aWR0aDogMTkwLCBoZWlnaHQ6IDU0LCBsYXllcjogMCB9LFxuICB9KSk7XG5cbiAgY29uc3Qgc3RhdHVzZXMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuc3RhdHVzKSldLnNvcnQoKTtcbiAgY29uc3Qga2luZHMgPSBbLi4ubmV3IFNldChub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUua2luZCkpXS5zb3J0KCk7XG5cbiAgcmV0dXJuIHtcbiAgICBkdG9WZXJzaW9uOiBHUkFQSF9EVE9fVkVSU0lPTixcbiAgICBncmFwaElkOiBncmFwaC5ncmFwaElkLFxuICAgIHJ1bklkOiBncmFwaC5ydW5JZCxcbiAgICBsYW5ndWFnZTogZ3JhcGgubGFuZ3VhZ2UsXG4gICAgYWRhcHRlcklkOiBncmFwaC5hZGFwdGVySWQsXG4gICAgY29tcGxldGVuZXNzOiBncmFwaC5jb21wbGV0ZW5lc3MsXG4gICAgbm9kZXMsXG4gICAgZWRnZXM6IGdyYXBoLmVkZ2VzLm1hcCgoZWRnZSkgPT4ge1xuICAgICAgLyoqIEB0eXBlIHt7aWQ6IHN0cmluZywgZnJvbTogc3RyaW5nLCB0bzogc3RyaW5nLCB0eXBlOiBzdHJpbmcsIHN0YXR1czogc3RyaW5nLCBsYWJlbDogc3RyaW5nLCByZWFzb25Db2RlPzogc3RyaW5nfX0gKi9cbiAgICAgIGNvbnN0IGR0b0VkZ2UgPSB7XG4gICAgICAgIGlkOiBlZGdlLmlkLFxuICAgICAgICBmcm9tOiBlZGdlLmZyb20sXG4gICAgICAgIHRvOiBlZGdlLnRvLFxuICAgICAgICB0eXBlOiBlZGdlLnR5cGUsXG4gICAgICAgIHN0YXR1czogZWRnZS5zdGF0dXMsXG4gICAgICAgIGxhYmVsOiBlZGdlLmxhYmVsLFxuICAgICAgfTtcbiAgICAgIC8vIE9taXQgdGhlIGtleSBlbnRpcmVseSB3aGVuIGFic2VudCBzbyB0aGUgRFRPIHN1cnZpdmVzIGEgSlNPTiByb3VuZC10cmlwXG4gICAgICAvLyB1bmNoYW5nZWQgKEpTT04gY2Fubm90IHJlcHJlc2VudCBgdW5kZWZpbmVkYCkuXG4gICAgICBpZiAoZWRnZS5yZWFzb25Db2RlKSB7XG4gICAgICAgIGR0b0VkZ2UucmVhc29uQ29kZSA9IGVkZ2UucmVhc29uQ29kZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBkdG9FZGdlO1xuICAgIH0pLFxuICAgIGRpYWdub3N0aWNzOiBncmFwaC5kaWFnbm9zdGljcyxcbiAgICBkZWdyYWRhdGlvbnM6IGdyYXBoLmRlZ3JhZGF0aW9ucyxcbiAgICBleHRlbnQ6IHsgd2lkdGg6IGxheW91dC53aWR0aCwgaGVpZ2h0OiBsYXlvdXQuaGVpZ2h0IH0sXG4gICAgbGVnZW5kOiB7IHN0YXR1c2VzLCBraW5kcyB9LFxuICB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gZHRvXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlLCBkdG86IEdyYXBoRHRvfSB8IHtvazogZmFsc2UsIGlzc3Vlczogc3RyaW5nW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVEdG8oZHRvKSB7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IGlzc3VlcyA9IFtdO1xuICBpZiAodHlwZW9mIGR0byAhPT0gJ29iamVjdCcgfHwgZHRvID09PSBudWxsIHx8IEFycmF5LmlzQXJyYXkoZHRvKSkge1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgaXNzdWVzOiBbJ0RUTyBtdXN0IGJlIGFuIG9iamVjdC4nXSB9O1xuICB9XG4gIGNvbnN0IGNhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChkdG8pO1xuICBpZiAoY2FuZGlkYXRlLmR0b1ZlcnNpb24gIT09IEdSQVBIX0RUT19WRVJTSU9OKSB7XG4gICAgaXNzdWVzLnB1c2goYFVuc3VwcG9ydGVkIGR0b1ZlcnNpb246ICR7U3RyaW5nKGNhbmRpZGF0ZS5kdG9WZXJzaW9uKX0uYCk7XG4gIH1cbiAgY29uc3Qgbm9kZXMgPSBjYW5kaWRhdGUubm9kZXM7XG4gIGNvbnN0IGVkZ2VzID0gY2FuZGlkYXRlLmVkZ2VzO1xuICBpZiAoIUFycmF5LmlzQXJyYXkobm9kZXMpKSB7XG4gICAgaXNzdWVzLnB1c2goJ25vZGVzIG11c3QgYmUgYW4gYXJyYXkuJyk7XG4gIH1cbiAgaWYgKCFBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdlZGdlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9XG4gIGlmIChBcnJheS5pc0FycmF5KG5vZGVzKSAmJiBBcnJheS5pc0FycmF5KGVkZ2VzKSkge1xuICAgIGNvbnN0IGlkcyA9IG5ldyBTZXQoKTtcbiAgICBmb3IgKGNvbnN0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgIGNvbnN0IGlkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKG5vZGUpLmlkO1xuICAgICAgaWYgKHR5cGVvZiBpZCAhPT0gJ3N0cmluZycpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goJ0V2ZXJ5IG5vZGUgbmVlZHMgYSBzdHJpbmcgaWQuJyk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKGlkcy5oYXMoaWQpKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBEdXBsaWNhdGUgbm9kZSBpZCBcIiR7aWR9XCIuYCk7XG4gICAgICB9XG4gICAgICBpZHMuYWRkKGlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGVkZ2VzKSB7XG4gICAgICBjb25zdCByZWNvcmQgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZWRnZSk7XG4gICAgICBpZiAodHlwZW9mIHJlY29yZC5mcm9tICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhyZWNvcmQuZnJvbSkpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHNvdXJjZSBub2RlLmApO1xuICAgICAgfVxuICAgICAgaWYgKHR5cGVvZiByZWNvcmQudG8gIT09ICdzdHJpbmcnIHx8ICFpZHMuaGFzKHJlY29yZC50bykpIHtcbiAgICAgICAgaXNzdWVzLnB1c2goYEVkZ2UgXCIke1N0cmluZyhyZWNvcmQuaWQpfVwiIGhhcyBhbiB1bmtub3duIHRhcmdldCBub2RlLmApO1xuICAgICAgfVxuICAgIH1cbiAgfVxuICBpZiAoaXNzdWVzLmxlbmd0aCA+IDApIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlcyB9O1xuICB9XG4gIHJldHVybiB7IG9rOiB0cnVlLCBkdG86IC8qKiBAdHlwZSB7R3JhcGhEdG99ICovIChkdG8pIH07XG59XG5cbi8qKlxuICogQHBhcmFtIHtHcmFwaER0b30gZHRvXG4gKiBAcmV0dXJucyB7c3RyaW5nfVxuICovXG5leHBvcnQgZnVuY3Rpb24gc2VyaWFsaXplRHRvKGR0bykge1xuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkoZHRvKTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30ganNvblxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2VEdG8oanNvbikge1xuICBjb25zdCBwYXJzZWQgPSBKU09OLnBhcnNlKGpzb24pO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8ocGFyc2VkKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIGdyYXBoIERUTzogJHt2YWxpZGF0aW9uLmlzc3Vlcy5qb2luKCc7ICcpfWApO1xuICB9XG4gIHJldHVybiB2YWxpZGF0aW9uLmR0bztcbn1cbiIsICIvKipcbiAqIFNWRyByZW5kZXJlci5cbiAqXG4gKiBQaGFzZSAwIHJlbmRlcmVyOiBkZXRlcm1pbmlzdGljIGxheWVyZWQgcG9zaXRpb25zIGNvbWUgZnJvbSB0aGUgRFRPLCBzbyB0aGlzXG4gKiBtb2R1bGUgb25seSBkcmF3cy4gSXQgaGFzIG5vIGtub3dsZWRnZSBvZiBhbmFseXNpcywgYWRhcHRlcnMsIG9yIHRoZSBwcm90b2NvbC5cbiAqXG4gKiBLZXB0IGJlaGluZCBhIHNtYWxsIGludGVyZmFjZSAoYHJlbmRlcmAsIGBzZWxlY3RgLCBgZGVzdHJveWApIGJlY2F1c2UgUGhhc2UgNFxuICogYmVuY2htYXJrcyBDeXRvc2NhcGUvRUxLIGFuZCBtYXkgcmVwbGFjZSB0aGUgaW1wbGVtZW50YXRpb24uIENhbGxlcnMgbXVzdCBub3RcbiAqIGRlcGVuZCBvbiBTVkcgaW50ZXJuYWxzLlxuICovXG5cbmNvbnN0IFNWR19OUyA9ICdodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Zyc7XG5cbi8qKlxuICogQHR5cGVkZWYge2ltcG9ydCgnLi4vLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0b30gR3JhcGhEdG9cbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gRHRvTm9kZVxuICovXG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5hbWVcbiAqIEBwYXJhbSB7UmVjb3JkPHN0cmluZywgc3RyaW5nIHwgbnVtYmVyPn0gW2F0dHJpYnV0ZXNdXG4gKiBAcmV0dXJucyB7U1ZHRWxlbWVudH1cbiAqL1xuZnVuY3Rpb24gc3ZnRWwobmFtZSwgYXR0cmlidXRlcyA9IHt9KSB7XG4gIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoU1ZHX05TLCBuYW1lKTtcbiAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgT2JqZWN0LmVudHJpZXMoYXR0cmlidXRlcykpIHtcbiAgICBlbGVtZW50LnNldEF0dHJpYnV0ZShrZXksIFN0cmluZyh2YWx1ZSkpO1xuICB9XG4gIHJldHVybiBlbGVtZW50O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSB2YWx1ZVxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZnVuY3Rpb24gdHJ1bmNhdGUodmFsdWUsIG1heCkge1xuICBjb25zdCB0ZXh0ID0gU3RyaW5nKHZhbHVlID8/ICcnKTtcbiAgcmV0dXJuIHRleHQubGVuZ3RoID4gbWF4ID8gYCR7dGV4dC5zbGljZSgwLCBtYXggLSAxKX1cdTIwMjZgIDogdGV4dDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3tzdmc6IFNWR1NWR0VsZW1lbnQsIG9uU2VsZWN0OiAobm9kZUlkOiBzdHJpbmcsIG5vZGU6IER0b05vZGUpID0+IHZvaWR9fSBvcHRpb25zXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTdmdSZW5kZXJlcih7IHN2Zywgb25TZWxlY3QgfSkge1xuICAvKiogQHR5cGUge0dyYXBoRHRvIHwgbnVsbH0gKi9cbiAgbGV0IGR0byA9IG51bGw7XG4gIC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnQgfCBudWxsfSAqL1xuICBsZXQgdmlld3BvcnQgPSBudWxsO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR0dFbGVtZW50Pn0gKi9cbiAgY29uc3Qgbm9kZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIFNWR1BhdGhFbGVtZW50Pn0gKi9cbiAgY29uc3QgZWRnZUVsZW1lbnRzID0gbmV3IE1hcCgpO1xuICAvKiogQHR5cGUge3N0cmluZyB8IG51bGx9ICovXG4gIGxldCBzZWxlY3RlZElkID0gbnVsbDtcblxuICBsZXQgc2NhbGUgPSAxO1xuICBsZXQgdHJhbnNsYXRlWCA9IDA7XG4gIGxldCB0cmFuc2xhdGVZID0gMDtcbiAgbGV0IGRyYWdnaW5nID0gZmFsc2U7XG4gIGxldCBkcmFnU3RhcnQgPSB7IHg6IDAsIHk6IDAsIHR4OiAwLCB0eTogMCB9O1xuXG4gIGZ1bmN0aW9uIGFwcGx5VHJhbnNmb3JtKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgdmlld3BvcnQuc2V0QXR0cmlidXRlKFxuICAgICAgICAndHJhbnNmb3JtJyxcbiAgICAgICAgYHRyYW5zbGF0ZSgke3RyYW5zbGF0ZVgudG9GaXhlZCgyKX0gJHt0cmFuc2xhdGVZLnRvRml4ZWQoMil9KSBzY2FsZSgke3NjYWxlLnRvRml4ZWQoMyl9KWAsXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vZGVQb2ludChub2RlLCBzaWRlKSB7XG4gICAgaWYgKHNpZGUgPT09ICdvdXQnKSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB4OiBub2RlLnBvc2l0aW9uLnggKyBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICB5OiBub2RlLnBvc2l0aW9uLnkgKyBub2RlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgIH1cbiAgICByZXR1cm4geyB4OiBub2RlLnBvc2l0aW9uLngsIHk6IG5vZGUucG9zaXRpb24ueSArIG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiB9O1xuICB9XG5cbiAgZnVuY3Rpb24gZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpIHtcbiAgICBpZiAoc291cmNlLmlkID09PSB0YXJnZXQuaWQpIHtcbiAgICAgIGNvbnN0IHsgeCwgeSwgd2lkdGgsIGhlaWdodCB9ID0gc291cmNlLnBvc2l0aW9uO1xuICAgICAgY29uc3QgY3ggPSB4ICsgd2lkdGggLyAyO1xuICAgICAgY29uc3Qgc3RhcnRZID0geSAtIDI7XG4gICAgICByZXR1cm4gYE0gJHtjeH0gJHtzdGFydFl9IEMgJHtjeCAtIDQ2fSAke3kgLSA2MH0sICR7Y3ggKyA0Nn0gJHt5IC0gNjB9LCAke2N4fSAke3kgKyBoZWlnaHQgKyAyfWA7XG4gICAgfVxuICAgIGNvbnN0IGZyb20gPSBub2RlUG9pbnQoc291cmNlLCAnb3V0Jyk7XG4gICAgY29uc3QgdG8gPSBub2RlUG9pbnQodGFyZ2V0LCAnaW4nKTtcbiAgICBjb25zdCBiZW5kID0gTWF0aC5tYXgoMzYsIE1hdGguYWJzKHRvLnggLSBmcm9tLngpIC8gMik7XG4gICAgcmV0dXJuIGBNICR7ZnJvbS54fSAke2Zyb20ueX0gQyAke2Zyb20ueCArIGJlbmR9ICR7ZnJvbS55fSwgJHt0by54IC0gYmVuZH0gJHt0by55fSwgJHt0by54fSAke3RvLnl9YDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNsZWFyKCkge1xuICAgIGlmICh2aWV3cG9ydCkge1xuICAgICAgc3ZnLnJlbW92ZUNoaWxkKHZpZXdwb3J0KTtcbiAgICB9XG4gICAgdmlld3BvcnQgPSBzdmdFbCgnZycsIHsgY2xhc3M6ICdjZi12aWV3cG9ydCcgfSk7XG4gICAgc3ZnLmFwcGVuZENoaWxkKHZpZXdwb3J0KTtcbiAgICBub2RlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBlZGdlRWxlbWVudHMuY2xlYXIoKTtcbiAgICBzZWxlY3RlZElkID0gbnVsbDtcbiAgfVxuXG4gIGZ1bmN0aW9uIHNlbGVjdChub2RlSWQpIHtcbiAgICBzZWxlY3RlZElkID0gbm9kZUlkO1xuICAgIGZvciAoY29uc3QgW2lkLCBlbGVtZW50XSBvZiBub2RlRWxlbWVudHMpIHtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtc2VsZWN0ZWQnLCBpZCA9PT0gbm9kZUlkKTtcbiAgICB9XG4gICAgZm9yIChjb25zdCBbLCBlbGVtZW50XSBvZiBlZGdlRWxlbWVudHMpIHtcbiAgICAgIGNvbnN0IGFjdGl2ZSA9XG4gICAgICAgIG5vZGVJZCAhPT0gbnVsbCAmJiAoZWxlbWVudC5kYXRhc2V0LmZyb20gPT09IG5vZGVJZCB8fCBlbGVtZW50LmRhdGFzZXQudG8gPT09IG5vZGVJZCk7XG4gICAgICBlbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoJ2lzLWFjdGl2ZScsIGFjdGl2ZSk7XG4gICAgfVxuICAgIGlmIChzZWxlY3RlZElkICYmIG5vZGVFbGVtZW50cy5oYXMoc2VsZWN0ZWRJZCkpIHtcbiAgICAgIGNvbnN0IG5vZGUgPSAvKiogQHR5cGUge0R0b05vZGV9ICovIChkdG8/Lm5vZGVzLmZpbmQoKGl0ZW0pID0+IGl0ZW0uaWQgPT09IHNlbGVjdGVkSWQpKTtcbiAgICAgIG9uU2VsZWN0KHNlbGVjdGVkSWQsIG5vZGUpO1xuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIHpvb21Ub0ZpdCgpIHtcbiAgICBpZiAoIWR0byB8fCAhdmlld3BvcnQpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgIGNvbnN0IHBhZGRpbmcgPSA0ODtcbiAgICBjb25zdCB3aWR0aCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQud2lkdGgpO1xuICAgIGNvbnN0IGhlaWdodCA9IE1hdGgubWF4KDEsIGR0by5leHRlbnQuaGVpZ2h0KTtcbiAgICBjb25zdCBhdmFpbGFibGVXaWR0aCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLndpZHRoIC0gcGFkZGluZyAqIDIpO1xuICAgIGNvbnN0IGF2YWlsYWJsZUhlaWdodCA9IE1hdGgubWF4KDEyMCwgYm91bmRzLmhlaWdodCAtIHBhZGRpbmcgKiAyKTtcbiAgICBzY2FsZSA9IE1hdGgubWluKDEuNCwgYXZhaWxhYmxlV2lkdGggLyB3aWR0aCwgYXZhaWxhYmxlSGVpZ2h0IC8gaGVpZ2h0KTtcbiAgICBzY2FsZSA9IE1hdGgubWF4KDAuMTUsIHNjYWxlKTtcbiAgICB0cmFuc2xhdGVYID0gKGJvdW5kcy53aWR0aCAtIHdpZHRoICogc2NhbGUpIC8gMjtcbiAgICB0cmFuc2xhdGVZID0gKGJvdW5kcy5oZWlnaHQgLSBoZWlnaHQgKiBzY2FsZSkgLyAyO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtHcmFwaER0b30gbmV4dER0b1xuICAgKi9cbiAgZnVuY3Rpb24gcmVuZGVyKG5leHREdG8pIHtcbiAgICBkdG8gPSBuZXh0RHRvO1xuICAgIGNsZWFyKCk7XG4gICAgaWYgKCF2aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGJ5SWQgPSBuZXcgTWFwKGR0by5ub2Rlcy5tYXAoKG5vZGUpID0+IFtub2RlLmlkLCBub2RlXSkpO1xuXG4gICAgZm9yIChjb25zdCBlZGdlIG9mIGR0by5lZGdlcykge1xuICAgICAgY29uc3Qgc291cmNlID0gYnlJZC5nZXQoZWRnZS5mcm9tKTtcbiAgICAgIGNvbnN0IHRhcmdldCA9IGJ5SWQuZ2V0KGVkZ2UudG8pO1xuICAgICAgaWYgKCFzb3VyY2UgfHwgIXRhcmdldCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBhdGggPSAvKiogQHR5cGUge1NWR1BhdGhFbGVtZW50fSAqLyAoXG4gICAgICAgIHN2Z0VsKCdwYXRoJywge1xuICAgICAgICAgIGNsYXNzOiBgY2YtZWRnZSBjZi1lZGdlLS0ke2VkZ2Uuc3RhdHVzfWAsXG4gICAgICAgICAgZDogZWRnZVBhdGgoc291cmNlLCB0YXJnZXQpLFxuICAgICAgICAgICdkYXRhLWZyb20nOiBlZGdlLmZyb20sXG4gICAgICAgICAgJ2RhdGEtdG8nOiBlZGdlLnRvLFxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICAgIHBhdGguZGF0YXNldC5mcm9tID0gZWRnZS5mcm9tO1xuICAgICAgcGF0aC5kYXRhc2V0LnRvID0gZWRnZS50bztcbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke2VkZ2UudHlwZX0gKCR7ZWRnZS5zdGF0dXN9KSR7ZWRnZS5yZWFzb25Db2RlID8gYDogJHtlZGdlLnJlYXNvbkNvZGV9YCA6ICcnfWA7XG4gICAgICBwYXRoLmFwcGVuZENoaWxkKHRpdGxlKTtcbiAgICAgIHZpZXdwb3J0LmFwcGVuZENoaWxkKHBhdGgpO1xuICAgICAgZWRnZUVsZW1lbnRzLnNldChlZGdlLmlkLCBwYXRoKTtcbiAgICB9XG5cbiAgICBmb3IgKGNvbnN0IG5vZGUgb2YgZHRvLm5vZGVzKSB7XG4gICAgICBjb25zdCBncm91cCA9IC8qKiBAdHlwZSB7U1ZHR0VsZW1lbnR9ICovIChcbiAgICAgICAgc3ZnRWwoJ2cnLCB7XG4gICAgICAgICAgY2xhc3M6IGBjZi1ub2RlIGNmLW5vZGUtLSR7bm9kZS5zdGF0dXN9JHtub2RlLmV4dGVybmFsID8gJyBjZi1ub2RlLS1leHRlcm5hbCcgOiAnJ31gLFxuICAgICAgICAgIHRyYW5zZm9ybTogYHRyYW5zbGF0ZSgke25vZGUucG9zaXRpb24ueH0gJHtub2RlLnBvc2l0aW9uLnl9KWAsXG4gICAgICAgICAgdGFiaW5kZXg6ICcwJyxcbiAgICAgICAgICByb2xlOiAnYnV0dG9uJyxcbiAgICAgICAgICAnYXJpYS1sYWJlbCc6IGAke25vZGUua2luZH0gJHtub2RlLmxhYmVsfSwgJHtub2RlLnN0YXR1c30ke1xuICAgICAgICAgICAgbm9kZS5leHRlcm5hbCA/ICcsIGV4dGVybmFsIHRhcmdldCcgOiAnJ1xuICAgICAgICAgIH1gLFxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoXG4gICAgICAgIHN2Z0VsKCdyZWN0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1ib3gnLFxuICAgICAgICAgIHdpZHRoOiBub2RlLnBvc2l0aW9uLndpZHRoLFxuICAgICAgICAgIGhlaWdodDogbm9kZS5wb3NpdGlvbi5oZWlnaHQsXG4gICAgICAgICAgcng6IDYsXG4gICAgICAgICAgcnk6IDYsXG4gICAgICAgIH0pLFxuICAgICAgKTtcblxuICAgICAgY29uc3QgbGFiZWwgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWxhYmVsJyxcbiAgICAgICAgeDogMTAsXG4gICAgICAgIHk6IG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiAtIDEsXG4gICAgICB9KTtcbiAgICAgIGxhYmVsLnRleHRDb250ZW50ID0gdHJ1bmNhdGUobm9kZS5sYWJlbCwgMjYpO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQobGFiZWwpO1xuXG4gICAgICBjb25zdCBraW5kID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1raW5kJyxcbiAgICAgICAgeDogMTAsXG4gICAgICAgIHk6IG5vZGUucG9zaXRpb24uaGVpZ2h0IC8gMiArIDEzLFxuICAgICAgfSk7XG4gICAgICBraW5kLnRleHRDb250ZW50ID0gbm9kZS5leHRlcm5hbCA/IGAke25vZGUua2luZH0gXHUwMEI3IGV4dGVybmFsYCA6IG5vZGUua2luZDtcbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKGtpbmQpO1xuXG4gICAgICBpZiAobm9kZS5iYWRnZSB8fCBub2RlLnN0YXR1cyAhPT0gJ3Jlc29sdmVkJykge1xuICAgICAgICBjb25zdCBiYWRnZSA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICAgIGNsYXNzOiAnY2Ytbm9kZS1iYWRnZScsXG4gICAgICAgICAgeDogbm9kZS5wb3NpdGlvbi53aWR0aCAtIDgsXG4gICAgICAgICAgeTogMTIsXG4gICAgICAgICAgJ3RleHQtYW5jaG9yJzogJ2VuZCcsXG4gICAgICAgIH0pO1xuICAgICAgICBiYWRnZS50ZXh0Q29udGVudCA9IHRydW5jYXRlKG5vZGUuYmFkZ2UgfHwgbm9kZS5zdGF0dXMsIDE4KTtcbiAgICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoYmFkZ2UpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCB0aXRsZSA9IHN2Z0VsKCd0aXRsZScpO1xuICAgICAgdGl0bGUudGV4dENvbnRlbnQgPSBgJHtub2RlLmtpbmR9ICR7bm9kZS5sYWJlbH1cXG5zdGF0dXM6ICR7bm9kZS5zdGF0dXN9JHtcbiAgICAgICAgbm9kZS5yYW5nZSA/IGBcXG5saW5lcyAke25vZGUucmFuZ2Uuc3RhcnRMaW5lICsgMX0tJHtub2RlLnJhbmdlLmVuZExpbmUgKyAxfWAgOiAnJ1xuICAgICAgfWA7XG4gICAgICBncm91cC5hcHBlbmRDaGlsZCh0aXRsZSk7XG5cbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKGV2ZW50KSA9PiB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICB9KTtcbiAgICAgIGdyb3VwLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKGV2ZW50LmtleSA9PT0gJ0VudGVyJyB8fCBldmVudC5rZXkgPT09ICcgJykge1xuICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgc2VsZWN0KG5vZGUuaWQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgdmlld3BvcnQuYXBwZW5kQ2hpbGQoZ3JvdXApO1xuICAgICAgbm9kZUVsZW1lbnRzLnNldChub2RlLmlkLCBncm91cCk7XG4gICAgfVxuXG4gICAgem9vbVRvRml0KCk7XG4gIH1cblxuICBmdW5jdGlvbiBtb3ZlU2VsZWN0aW9uKGRpcmVjdGlvbikge1xuICAgIGlmICghZHRvIHx8IGR0by5ub2Rlcy5sZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3QgY3VycmVudCA9IHNlbGVjdGVkSWQgPyBkdG8ubm9kZXMuZmluZCgobm9kZSkgPT4gbm9kZS5pZCA9PT0gc2VsZWN0ZWRJZCkgOiBudWxsO1xuICAgIGlmICghY3VycmVudCkge1xuICAgICAgY29uc3QgZmlyc3QgPSBkdG8ubm9kZXNbMF07XG4gICAgICBzZWxlY3QoZmlyc3QuaWQpO1xuICAgICAgbm9kZUVsZW1lbnRzLmdldChmaXJzdC5pZCk/LmZvY3VzKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGNvbnN0IG9yaWdpbiA9IHtcbiAgICAgIHg6IGN1cnJlbnQucG9zaXRpb24ueCArIGN1cnJlbnQucG9zaXRpb24ud2lkdGggLyAyLFxuICAgICAgeTogY3VycmVudC5wb3NpdGlvbi55ICsgY3VycmVudC5wb3NpdGlvbi5oZWlnaHQgLyAyLFxuICAgIH07XG5cbiAgICBsZXQgYmVzdCA9IG51bGw7XG4gICAgbGV0IGJlc3RTY29yZSA9IE51bWJlci5QT1NJVElWRV9JTkZJTklUWTtcbiAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBkdG8ubm9kZXMpIHtcbiAgICAgIGlmIChjYW5kaWRhdGUuaWQgPT09IGN1cnJlbnQuaWQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwb2ludCA9IHtcbiAgICAgICAgeDogY2FuZGlkYXRlLnBvc2l0aW9uLnggKyBjYW5kaWRhdGUucG9zaXRpb24ud2lkdGggLyAyLFxuICAgICAgICB5OiBjYW5kaWRhdGUucG9zaXRpb24ueSArIGNhbmRpZGF0ZS5wb3NpdGlvbi5oZWlnaHQgLyAyLFxuICAgICAgfTtcbiAgICAgIGNvbnN0IGR4ID0gcG9pbnQueCAtIG9yaWdpbi54O1xuICAgICAgY29uc3QgZHkgPSBwb2ludC55IC0gb3JpZ2luLnk7XG4gICAgICBjb25zdCBmb3J3YXJkID1cbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnICYmIGR4ID4gOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgJiYgZHggPCAtOCkgfHxcbiAgICAgICAgKGRpcmVjdGlvbiA9PT0gJ0Fycm93RG93bicgJiYgZHkgPiA4KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dVcCcgJiYgZHkgPCAtOCk7XG4gICAgICBpZiAoIWZvcndhcmQpIHtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBjb25zdCBwcmltYXJ5ID1cbiAgICAgICAgZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgfHwgZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyA/IE1hdGguYWJzKGR4KSA6IE1hdGguYWJzKGR5KTtcbiAgICAgIGNvbnN0IHNlY29uZGFyeSA9XG4gICAgICAgIGRpcmVjdGlvbiA9PT0gJ0Fycm93UmlnaHQnIHx8IGRpcmVjdGlvbiA9PT0gJ0Fycm93TGVmdCcgPyBNYXRoLmFicyhkeSkgOiBNYXRoLmFicyhkeCk7XG4gICAgICBjb25zdCBzY29yZSA9IHByaW1hcnkgKyBzZWNvbmRhcnkgKiAyLjI7XG4gICAgICBpZiAoc2NvcmUgPCBiZXN0U2NvcmUpIHtcbiAgICAgICAgYmVzdFNjb3JlID0gc2NvcmU7XG4gICAgICAgIGJlc3QgPSBjYW5kaWRhdGU7XG4gICAgICB9XG4gICAgfVxuICAgIGlmIChiZXN0KSB7XG4gICAgICBzZWxlY3QoYmVzdC5pZCk7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KGJlc3QuaWQpPy5mb2N1cygpO1xuICAgIH1cbiAgfVxuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKFxuICAgICd3aGVlbCcsXG4gICAgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoIWR0bykge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgY29uc3QgYm91bmRzID0gc3ZnLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgY29uc3QgcG9pbnRlclggPSBldmVudC5jbGllbnRYIC0gYm91bmRzLmxlZnQ7XG4gICAgICBjb25zdCBwb2ludGVyWSA9IGV2ZW50LmNsaWVudFkgLSBib3VuZHMudG9wO1xuICAgICAgY29uc3QgZmFjdG9yID0gZXZlbnQuZGVsdGFZIDwgMCA/IDEuMTIgOiAxIC8gMS4xMjtcbiAgICAgIGNvbnN0IG5leHRTY2FsZSA9IE1hdGgubWluKDMuNSwgTWF0aC5tYXgoMC4xMiwgc2NhbGUgKiBmYWN0b3IpKTtcbiAgICAgIGNvbnN0IHJhdGlvID0gbmV4dFNjYWxlIC8gc2NhbGU7XG4gICAgICB0cmFuc2xhdGVYID0gcG9pbnRlclggLSAocG9pbnRlclggLSB0cmFuc2xhdGVYKSAqIHJhdGlvO1xuICAgICAgdHJhbnNsYXRlWSA9IHBvaW50ZXJZIC0gKHBvaW50ZXJZIC0gdHJhbnNsYXRlWSkgKiByYXRpbztcbiAgICAgIHNjYWxlID0gbmV4dFNjYWxlO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICB9LFxuICAgIHsgcGFzc2l2ZTogZmFsc2UgfSxcbiAgKTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQuYnV0dG9uICE9PSAwKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRyYWdnaW5nID0gdHJ1ZTtcbiAgICBkcmFnU3RhcnQgPSB7IHg6IGV2ZW50LmNsaWVudFgsIHk6IGV2ZW50LmNsaWVudFksIHR4OiB0cmFuc2xhdGVYLCB0eTogdHJhbnNsYXRlWSB9O1xuICAgIHN2Zy5zZXRQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICB9KTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJtb3ZlJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKCFkcmFnZ2luZykge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICB0cmFuc2xhdGVYID0gZHJhZ1N0YXJ0LnR4ICsgKGV2ZW50LmNsaWVudFggLSBkcmFnU3RhcnQueCk7XG4gICAgdHJhbnNsYXRlWSA9IGRyYWdTdGFydC50eSArIChldmVudC5jbGllbnRZIC0gZHJhZ1N0YXJ0LnkpO1xuICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gIH0pO1xuICBjb25zdCBlbmREcmFnID0gKGV2ZW50KSA9PiB7XG4gICAgZHJhZ2dpbmcgPSBmYWxzZTtcbiAgICBpZiAoc3ZnLmhhc1BvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCkpIHtcbiAgICAgIHN2Zy5yZWxlYXNlUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKTtcbiAgICB9XG4gIH07XG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVydXAnLCBlbmREcmFnKTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJjYW5jZWwnLCBlbmREcmFnKTtcblxuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgaWYgKHNlbGVjdGVkSWQpIHtcbiAgICAgIHNlbGVjdChudWxsKTtcbiAgICB9XG4gIH0pO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgaWYgKGV2ZW50LmtleS5zdGFydHNXaXRoKCdBcnJvdycpKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgbW92ZVNlbGVjdGlvbihldmVudC5rZXkpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoZXZlbnQua2V5ID09PSAnKycgfHwgZXZlbnQua2V5ID09PSAnPScpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBzY2FsZSA9IE1hdGgubWluKDMuNSwgc2NhbGUgKiAxLjE1KTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICctJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNjYWxlID0gTWF0aC5tYXgoMC4xMiwgc2NhbGUgLyAxLjE1KTtcbiAgICAgIGFwcGx5VHJhbnNmb3JtKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICcwJykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHpvb21Ub0ZpdCgpO1xuICAgIH1cbiAgfSk7XG5cbiAgcmV0dXJuIHtcbiAgICByZW5kZXIsXG4gICAgc2VsZWN0LFxuICAgIHpvb21Ub0ZpdCxcbiAgICBkZXN0cm95KCkge1xuICAgICAgY2xlYXIoKTtcbiAgICAgIGR0byA9IG51bGw7XG4gICAgfSxcbiAgfTtcbn1cbiIsICIvKipcbiAqIFdlYnZpZXcgZW50cnkgcG9pbnQuXG4gKlxuICogUmVzcG9uc2liaWxpdGllcyBhcmUgZGVsaWJlcmF0ZWx5IG5hcnJvdzogdGFsayBwcm90b2NvbCwgcmVuZGVyIHRoZSBEVE8sIHNob3dcbiAqIHNlbGVjdGlvbiBkZXRhaWxzLiBObyBhbmFseXNpcywgbm8gZmlsZSBhY2Nlc3MsIG5vIGdyYXBoIGNvbnN0cnVjdGlvbi5cbiAqL1xuXG5pbXBvcnQgeyBjcmVhdGVCcmlkZ2UgfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2JyaWRnZS5qcyc7XG5pbXBvcnQgeyBESVJFQ1RJT05TLCBQUk9UT0NPTF9WRVJTSU9OIH0gZnJvbSAnLi4vY29yZS9wcm90b2NvbC9lbnZlbG9wZS5qcyc7XG5pbXBvcnQgeyB2YWxpZGF0ZUR0byB9IGZyb20gJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJztcbmltcG9ydCB7IGNyZWF0ZVN2Z1JlbmRlcmVyIH0gZnJvbSAnLi4vdmlzdWFsaXphdGlvbi9yZW5kZXJlci9zdmdSZW5kZXJlci5qcyc7XG5cbmNvbnN0IHZzY29kZUFwaSA9IGFjcXVpcmVWc0NvZGVBcGkoKTtcblxuY29uc3Qgc3ZnID0gLyoqIEB0eXBlIHtTVkdTVkdFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWdyYXBoJykpO1xuY29uc3QgbWV0YSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbWV0YScpKTtcbmNvbnN0IHN0YXR1cyA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2Ytc3RhdHVzJykpO1xuY29uc3QgYmFubmVyID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1iYW5uZXInKSk7XG5jb25zdCBlbXB0eSA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZW1wdHknKSk7XG5jb25zdCBkZXRhaWxCb2R5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1kZXRhaWwtYm9keScpKTtcbmNvbnN0IGxlZ2VuZCA9IC8qKiBAdHlwZSB7SFRNTEVsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtbGVnZW5kJykpO1xuY29uc3QgcmVsb2FkQnV0dG9uID0gLyoqIEB0eXBlIHtIVE1MQnV0dG9uRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1yZWZyZXNoJykpO1xuXG4vKiogQHR5cGUge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5HcmFwaER0byB8IG51bGx9ICovXG5sZXQgY3VycmVudER0byA9IG51bGw7XG5cbmNvbnN0IHJlbmRlcmVyID0gY3JlYXRlU3ZnUmVuZGVyZXIoe1xuICBzdmcsXG4gIG9uU2VsZWN0OiAobm9kZUlkLCBub2RlKSA9PiB7XG4gICAgc2hvd05vZGVEZXRhaWxzKG5vZGVJZCwgbm9kZSk7XG4gICAgYnJpZGdlLnJlc3BvbmQoJ25vZGUuc2VsZWN0JywgeyBub2RlSWQgfSk7XG4gIH0sXG59KTtcblxuY29uc3QgYnJpZGdlID0gY3JlYXRlQnJpZGdlKHtcbiAgcG9zdDogKG1lc3NhZ2UpID0+IHZzY29kZUFwaS5wb3N0TWVzc2FnZShtZXNzYWdlKSxcbiAgaW5ib3VuZERpcmVjdGlvbjogRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVcsXG4gIHRpbWVvdXRNczogODAwMCxcbiAgbG9nZ2VyOiB7XG4gICAgZGVidWc6ICgpID0+IHt9LFxuICAgIHdhcm46IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUud2FybignW2NvZGVmbG93XScsIG1lc3NhZ2UsIGZpZWxkcyksXG4gICAgZXJyb3I6IChtZXNzYWdlLCBmaWVsZHMpID0+IGNvbnNvbGUuZXJyb3IoJ1tjb2RlZmxvd10nLCBtZXNzYWdlLCBmaWVsZHMpLFxuICB9LFxufSk7XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lzRXJyb3JdXG4gKi9cbmZ1bmN0aW9uIHNldEJhbm5lcihtZXNzYWdlLCBpc0Vycm9yID0gZmFsc2UpIHtcbiAgaWYgKCFtZXNzYWdlKSB7XG4gICAgYmFubmVyLmhpZGRlbiA9IHRydWU7XG4gICAgYmFubmVyLnRleHRDb250ZW50ID0gJyc7XG4gICAgcmV0dXJuO1xuICB9XG4gIGJhbm5lci5oaWRkZW4gPSBmYWxzZTtcbiAgYmFubmVyLmNsYXNzTGlzdC50b2dnbGUoJ2lzLWVycm9yJywgaXNFcnJvcik7XG4gIGJhbm5lci50ZXh0Q29udGVudCA9IG1lc3NhZ2U7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRcbiAqL1xuZnVuY3Rpb24gc2V0U3RhdHVzKHRleHQpIHtcbiAgc3RhdHVzLnRleHRDb250ZW50ID0gdGV4dDtcbn1cblxuZnVuY3Rpb24gY2xlYXJEZXRhaWwoKSB7XG4gIGRldGFpbEJvZHkucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGNvbnN0IHBhcmFncmFwaCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3AnKTtcbiAgcGFyYWdyYXBoLmNsYXNzTmFtZSA9ICdjZi1tdXRlZCc7XG4gIHBhcmFncmFwaC50ZXh0Q29udGVudCA9ICdTZWxlY3QgYSBub2RlIHRvIGluc3BlY3QgaXQuJztcbiAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChwYXJhZ3JhcGgpO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbFxuICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlXG4gKiBAcmV0dXJucyB7W0hUTUxFbGVtZW50LCBIVE1MRWxlbWVudF19XG4gKi9cbmZ1bmN0aW9uIGRldGFpbFBhaXIobGFiZWwsIHZhbHVlKSB7XG4gIGNvbnN0IHRlcm0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkdCcpO1xuICB0ZXJtLnRleHRDb250ZW50ID0gbGFiZWw7XG4gIGNvbnN0IGRlc2NyaXB0aW9uID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGQnKTtcbiAgZGVzY3JpcHRpb24udGV4dENvbnRlbnQgPSB2YWx1ZTtcbiAgcmV0dXJuIFt0ZXJtLCBkZXNjcmlwdGlvbl07XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IG5vZGVJZFxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuRHRvTm9kZX0gW25vZGVdXG4gKi9cbmZ1bmN0aW9uIHNob3dOb2RlRGV0YWlscyhub2RlSWQsIG5vZGUpIHtcbiAgaWYgKCFub2RlSWQgfHwgIW5vZGUpIHtcbiAgICBjbGVhckRldGFpbCgpO1xuICAgIHJldHVybjtcbiAgfVxuICBjb25zdCBsaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGwnKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignbGFiZWwnLCBub2RlLmxhYmVsKSk7XG4gIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2tpbmQnLCBub2RlLmtpbmQpKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignc3RhdHVzJywgbm9kZS5zdGF0dXMpKTtcbiAgaWYgKG5vZGUuZXh0ZXJuYWwpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdvcmlnaW4nLCAnZXh0ZXJuYWwgdGFyZ2V0IChub3QgZGVjbGFyZWQgaW4gdGhlIGFuYWx5c2lzKScpKTtcbiAgfVxuICBpZiAobm9kZS5yYW5nZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ2xpbmVzJywgYCR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfVx1MjAxMyR7bm9kZS5yYW5nZS5lbmRMaW5lICsgMX1gKSk7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcignZmlsZScsIG5vZGUucmFuZ2UuZmlsZUlkKSk7XG4gIH1cbiAgaWYgKG5vZGUuYmFkZ2UpIHtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdub3RlJywgbm9kZS5iYWRnZSkpO1xuICB9XG5cbiAgY29uc3QgZWRnZXMgPSAoY3VycmVudER0bz8uZWRnZXMgPz8gW10pLmZpbHRlcihcbiAgICAoZWRnZSkgPT4gZWRnZS5mcm9tID09PSBub2RlSWQgfHwgZWRnZS50byA9PT0gbm9kZUlkLFxuICApO1xuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ3JlbGF0aW9uc2hpcHMnLCBTdHJpbmcoZWRnZXMubGVuZ3RoKSkpO1xuICB9XG5cbiAgZGV0YWlsQm9keS5yZXBsYWNlQ2hpbGRyZW4obGlzdCk7XG5cbiAgaWYgKGVkZ2VzLmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBoZWFkaW5nID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaDMnKTtcbiAgICBoZWFkaW5nLmNsYXNzTmFtZSA9ICdjZi1kZXRhaWwtdGl0bGUnO1xuICAgIGhlYWRpbmcudGV4dENvbnRlbnQgPSAnUmVsYXRpb25zaGlwcyc7XG4gICAgZGV0YWlsQm9keS5hcHBlbmRDaGlsZChoZWFkaW5nKTtcblxuICAgIGNvbnN0IGVkZ2VMaXN0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgndWwnKTtcbiAgICBlZGdlTGlzdC5jbGFzc05hbWUgPSAnY2YtbGVnZW5kJztcbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZWRnZXMuc2xpY2UoMCwgMTIpKSB7XG4gICAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICAgIGNvbnN0IGRpcmVjdGlvbiA9IGVkZ2UuZnJvbSA9PT0gbm9kZUlkID8gJ1x1MjE5MicgOiAnXHUyMTkwJztcbiAgICAgIGNvbnN0IG90aGVyID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyBlZGdlLnRvIDogZWRnZS5mcm9tO1xuICAgICAgaXRlbS50ZXh0Q29udGVudCA9IGAke2RpcmVjdGlvbn0gJHtlZGdlLnR5cGV9IFx1MDBCNyAke290aGVyfSAoJHtlZGdlLnN0YXR1c30pYDtcbiAgICAgIGVkZ2VMaXN0LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgIH1cbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGVkZ2VMaXN0KTtcbiAgfVxufVxuXG4vKipcbiAqIEBwYXJhbSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkdyYXBoRHRvfSBkdG9cbiAqL1xuZnVuY3Rpb24gcmVuZGVyTGVnZW5kKGR0bykge1xuICBsZWdlbmQucmVwbGFjZUNoaWxkcmVuKCk7XG4gIGZvciAoY29uc3Qgc3RhdHVzTmFtZSBvZiBkdG8ubGVnZW5kLnN0YXR1c2VzKSB7XG4gICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgY29uc3Qgc3dhdGNoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIHN3YXRjaC5jbGFzc05hbWUgPSBgY2Ytc3dhdGNoIGNmLWVkZ2UtLSR7c3RhdHVzTmFtZX1gO1xuICAgIGNvbnN0IGxhYmVsID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3BhbicpO1xuICAgIGxhYmVsLnRleHRDb250ZW50ID0gc3RhdHVzTmFtZTtcbiAgICBpZiAoc3RhdHVzTmFtZSAhPT0gJ3Jlc29sdmVkJykge1xuICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSBgJHtzdGF0dXNOYW1lfSAocGF0dGVybiArIGxhYmVsKWA7XG4gICAgfVxuICAgIGl0ZW0uYXBwZW5kKHN3YXRjaCwgbGFiZWwpO1xuICAgIGxlZ2VuZC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBzaG93Q2FwYWJpbGl0aWVzKHBheWxvYWQpIHtcbiAgY29uc3QgYWRhcHRlcnMgPSBBcnJheS5pc0FycmF5KHBheWxvYWQuYWRhcHRlcnMpID8gcGF5bG9hZC5hZGFwdGVycyA6IFtdO1xuICBjb25zdCBuYW1lcyA9IGFkYXB0ZXJzLm1hcCgoYWRhcHRlcikgPT4gYWRhcHRlci5pZCkuam9pbignLCAnKSB8fCAnbm9uZSc7XG4gIG1ldGEudGV4dENvbnRlbnQgPSBgTW9jayBkYXRhIFx1MDBCNyBhZGFwdGVyczogJHtuYW1lc30gXHUwMEI3IHByb3RvY29sIHYke3BheWxvYWQucHJvdG9jb2xWZXJzaW9uID8/ICc/J31gO1xufVxuXG4vKipcbiAqIEBwYXJhbSB7dW5rbm93bn0gcGF5bG9hZFxuICovXG5mdW5jdGlvbiBoYW5kbGVHcmFwaChwYXlsb2FkKSB7XG4gIGNvbnN0IGR0b0NhbmRpZGF0ZSA9IC8qKiBAdHlwZSB7e2R0bz86IHVua25vd259fSAqLyAocGF5bG9hZCkuZHRvO1xuICBjb25zdCB2YWxpZGF0aW9uID0gdmFsaWRhdGVEdG8oZHRvQ2FuZGlkYXRlKTtcbiAgaWYgKCF2YWxpZGF0aW9uLm9rKSB7XG4gICAgc2V0QmFubmVyKGBJbnZhbGlkIGdyYXBoIHBheWxvYWQ6ICR7dmFsaWRhdGlvbi5pc3N1ZXNbMF19YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdSZW5kZXIgZmFpbGVkJyk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGR0byA9IHZhbGlkYXRpb24uZHRvO1xuICBjdXJyZW50RHRvID0gZHRvO1xuICBlbXB0eS5oaWRkZW4gPSB0cnVlO1xuICByZW5kZXJlci5yZW5kZXIoZHRvKTtcbiAgcmVuZGVyTGVnZW5kKGR0byk7XG4gIGNsZWFyRGV0YWlsKCk7XG4gIHNldFN0YXR1cyhcbiAgICBgJHtkdG8ubGFuZ3VhZ2V9IFx1MDBCNyAke2R0by5ub2Rlcy5sZW5ndGh9IG5vZGVzIFx1MDBCNyAke2R0by5lZGdlcy5sZW5ndGh9IGVkZ2VzIFx1MDBCNyAke2R0by5jb21wbGV0ZW5lc3N9YCxcbiAgKTtcbiAgY29uc3QgZGVncmFkYXRpb25zID0gZHRvLmRlZ3JhZGF0aW9ucyA/PyBbXTtcbiAgc2V0QmFubmVyKGRlZ3JhZGF0aW9ucy5sZW5ndGggPiAwID8gZGVncmFkYXRpb25zLmpvaW4oJyBcdTAwQjcgJykgOiAnJywgZmFsc2UpO1xufVxuXG5icmlkZ2Uub24oJ3Byb3RvY29sLmVycm9yJywgKHBheWxvYWQpID0+IHtcbiAgY29uc3QgY29kZSA9IHR5cGVvZiBwYXlsb2FkLmNvZGUgPT09ICdzdHJpbmcnID8gcGF5bG9hZC5jb2RlIDogJ0VfUFJPVE9DT0wnO1xuICBjb25zdCBtZXNzYWdlID0gdHlwZW9mIHBheWxvYWQubWVzc2FnZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLm1lc3NhZ2UgOiAnVW5rbm93biBlcnJvci4nO1xuICBzZXRCYW5uZXIoYCR7Y29kZX06ICR7bWVzc2FnZX1gLCB0cnVlKTtcbiAgc2V0U3RhdHVzKCdFcnJvcicpO1xufSk7XG5cbmFzeW5jIGZ1bmN0aW9uIGxvYWRHcmFwaCgpIHtcbiAgc2V0U3RhdHVzKCdMb2FkaW5nIGdyYXBoXHUyMDI2Jyk7XG4gIHNldEJhbm5lcignJyk7XG4gIHRyeSB7XG4gICAgLy8gQSByZXF1ZXN0IHJlc29sdmVzIHdpdGggaXRzIGNvcnJlbGF0ZWQgcmVzcG9uc2UuIFRoZSByZXNwb25zZSBpcyBub3RcbiAgICAvLyBkaXNwYXRjaGVkIHRvIGBicmlkZ2Uub25gLCBzbyBoYW5kbGUgaXQgaGVyZS5cbiAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IGJyaWRnZS5yZXF1ZXN0KCdncmFwaC5sb2FkJywgeyBkZW1vOiB0cnVlIH0pO1xuICAgIGhhbmRsZUdyYXBoKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIHNldEJhbm5lcihgQ291bGQgbm90IGxvYWQgZ3JhcGg6ICR7ZXJyb3I/Lm1lc3NhZ2UgPz8gU3RyaW5nKGVycm9yKX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ0xvYWQgZmFpbGVkJyk7XG4gICAgZW1wdHkuaGlkZGVuID0gZmFsc2U7XG4gIH1cbn1cblxucmVsb2FkQnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICB2b2lkIGxvYWRHcmFwaCgpO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdlcnJvcicsIChldmVudCkgPT4ge1xuICBzZXRCYW5uZXIoYFdlYnZpZXcgZXJyb3I6ICR7ZXZlbnQubWVzc2FnZX1gLCB0cnVlKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigndW5oYW5kbGVkcmVqZWN0aW9uJywgKGV2ZW50KSA9PiB7XG4gIHNldEJhbm5lcihgVW5oYW5kbGVkIHJlamVjdGlvbjogJHtTdHJpbmcoZXZlbnQucmVhc29uKX1gLCB0cnVlKTtcbn0pO1xuXG5hc3luYyBmdW5jdGlvbiBib290KCkge1xuICB0cnkge1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgYnJpZGdlLnJlcXVlc3QoJ3dlYnZpZXcucmVhZHknLCB7XG4gICAgICBjbGllbnQ6ICd3ZWJ2aWV3JyxcbiAgICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICB9KTtcbiAgICBzaG93Q2FwYWJpbGl0aWVzKHJlc3BvbnNlLnBheWxvYWQpO1xuICB9IGNhdGNoIHtcbiAgICAvLyBDYXBhYmlsaXRpZXMgYXJlIGluZm9ybWF0aW9uYWw7IGdyYXBoIGxvYWQgY2FuIHN0aWxsIHN1Y2NlZWQuXG4gIH1cbiAgYXdhaXQgbG9hZEdyYXBoKCk7XG59XG5cbnZvaWQgYm9vdCgpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFXTyxNQUFNLG1CQUFtQjtBQUd6QixNQUFNLG9CQUFvQjtBQUcxQixNQUFNLGVBQWU7QUFFckIsTUFBTSxxQkFBcUI7QUFHM0IsTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBR00sTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsRUFDRixDQUFDO0FBRU0sTUFBTSxhQUFhLE9BQU8sT0FBTztBQUFBLElBQ3RDLGlCQUFpQjtBQUFBLElBQ2pCLGlCQUFpQjtB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
