(() => {
  // src/core/protocol/envelope.js
  var PROTOCOL_VERSION = 1;
  var MAX_PAYLOAD_BYTES = 1e6;
  var KIND_PATTERN = /^[a-z]+(\.[a-z]+)+$/;
  var REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;
  var WEBVIEW_TO_HOST = Object.freeze([
    "webview.ready",
    "graph.load",
    "node.select",
    "panel.ping"
  ]);
  var HOST_TO_WEBVIEW = Object.freeze([
    "graph.data",
    "capabilities.data",
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
            new ProtocolError("E_TIMEOUT", `No response to "${kind}" within ${effectiveTimeout} ms.`, {
              kind,
              requestId
            })
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
        return { x: node.position.x + node.position.width, y: node.position.y + node.position.height / 2 };
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
      list.append(
        ...detailPair("lines", `${node.range.startLine + 1}\u2013${node.range.endLine + 1}`)
      );
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
  bridge.on("graph.data", (payload) => {
    handleGraph(payload);
  });
  bridge.on("capabilities.data", (payload) => {
    showCapabilities(payload);
  });
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
      await bridge.request("graph.load", { demo: true });
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
      await bridge.request("webview.ready", {
        client: "webview",
        protocolVersion: PROTOCOL_VERSION
      });
    } catch {
    }
    await loadGraph();
  }
  void boot();
})();
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvZW52ZWxvcGUuanMiLCAiLi4vLi4vc3JjL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzIiwgIi4uLy4uL3NyYy9jb3JlL2dyYXBoL2xheW91dC5qcyIsICIuLi8uLi9zcmMvY29yZS9ncmFwaC9kdG8uanMiLCAiLi4vLi4vc3JjL3Zpc3VhbGl6YXRpb24vcmVuZGVyZXIvc3ZnUmVuZGVyZXIuanMiLCAiLi4vLi4vc3JjL3dlYnZpZXcvbWFpbi5qcyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLyoqXG4gKiBDb2RlRmxvdyB3ZWJ2aWV3IHByb3RvY29sLlxuICpcbiAqIFRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcgYXJlIHNlcGFyYXRlIEphdmFTY3JpcHQgY29udGV4dHMuIEV2ZXJ5XG4gKiBtZXNzYWdlIHRoYXQgY3Jvc3NlcyB0aGF0IGJvdW5kYXJ5IG11c3QgcGFzcyB0aHJvdWdoIHRoaXMgbW9kdWxlIHNvIHRoYXQgYVxuICogc2luZ2xlLCB2ZXJzaW9uZWQgY29udHJhY3QgZGVjaWRlcyB3aGF0IGlzIGxlZ2FsLlxuICpcbiAqIFRoaXMgbW9kdWxlIGlzIGludGVudGlvbmFsbHkgZGVwZW5kZW5jeS1mcmVlOiBpdCBpcyBidW5kbGVkIGludG8gYm90aCB0aGVcbiAqIGV4dGVuc2lvbiBob3N0IGFuZCB0aGUgd2Vidmlldy5cbiAqL1xuXG5leHBvcnQgY29uc3QgUFJPVE9DT0xfVkVSU0lPTiA9IDE7XG5cbi8qKiBIYXJkIGNlaWxpbmcgb24gYSBzZXJpYWxpemVkIG1lc3NhZ2UuIExhcmdlciBtZXNzYWdlcyBhcmUgcmVqZWN0ZWQsIG5ldmVyIHRydW5jYXRlZC4gKi9cbmV4cG9ydCBjb25zdCBNQVhfUEFZTE9BRF9CWVRFUyA9IDFfMDAwXzAwMDtcblxuLyoqIGBkb21haW4uYWN0aW9uYCBpbiBsb3dlciBjYXNlLCBhdCBsZWFzdCB0d28gc2VnbWVudHMuICovXG5leHBvcnQgY29uc3QgS0lORF9QQVRURVJOID0gL15bYS16XSsoXFwuW2Etel0rKSskLztcblxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfSURfUEFUVEVSTiA9IC9eW0EtWmEtejAtOV8tXXsxLDEyOH0kLztcblxuLyoqIEtpbmRzIGEgd2VidmlldyBtYXkgc2VuZCB0byB0aGUgaG9zdC4gKi9cbmV4cG9ydCBjb25zdCBXRUJWSUVXX1RPX0hPU1QgPSBPYmplY3QuZnJlZXplKFtcbiAgJ3dlYnZpZXcucmVhZHknLFxuICAnZ3JhcGgubG9hZCcsXG4gICdub2RlLnNlbGVjdCcsXG4gICdwYW5lbC5waW5nJyxcbl0pO1xuXG4vKiogS2luZHMgdGhlIGhvc3QgbWF5IHNlbmQgdG8gdGhlIHdlYnZpZXcuICovXG5leHBvcnQgY29uc3QgSE9TVF9UT19XRUJWSUVXID0gT2JqZWN0LmZyZWV6ZShbXG4gICdncmFwaC5kYXRhJyxcbiAgJ2NhcGFiaWxpdGllcy5kYXRhJyxcbiAgJ3Byb3RvY29sLmVycm9yJyxcbiAgJ3Byb3RvY29sLmFjaycsXG4gICdwYW5lbC5wb25nJyxcbl0pO1xuXG5leHBvcnQgY29uc3QgRElSRUNUSU9OUyA9IE9iamVjdC5mcmVlemUoe1xuICBXRUJWSUVXX1RPX0hPU1Q6ICd3ZWJ2aWV3X3RvX2hvc3QnLFxuICBIT1NUX1RPX1dFQlZJRVc6ICdob3N0X3RvX3dlYnZpZXcnLFxufSk7XG5cbmNvbnN0IEtJTkRfQUxMT1dMSVNUID0gT2JqZWN0LmZyZWV6ZSh7XG4gIFtESVJFQ1RJT05TLldFQlZJRVdfVE9fSE9TVF06IG5ldyBTZXQoV0VCVklFV19UT19IT1NUKSxcbiAgW0RJUkVDVElPTlMuSE9TVF9UT19XRUJWSUVXXTogbmV3IFNldChIT1NUX1RPX1dFQlZJRVcpLFxufSk7XG5cbmNvbnN0IFVOU0FGRV9LRVlTID0gbmV3IFNldChbJ19fcHJvdG9fXycsICdjb25zdHJ1Y3RvcicsICdwcm90b3R5cGUnXSk7XG5cbmNvbnN0IE1BWF9LRVlfU0NBTl9ERVBUSCA9IDg7XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gRW52ZWxvcGVcbiAqIEBwcm9wZXJ0eSB7bnVtYmVyfSBwcm90b2NvbFZlcnNpb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBraW5kXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqIEBwcm9wZXJ0eSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59IHBheWxvYWRcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IFZhbGlkYXRpb25TdWNjZXNzXG4gKiBAcHJvcGVydHkge3RydWV9IG9rXG4gKiBAcHJvcGVydHkge0VudmVsb3BlfSBlbnZlbG9wZVxuICovXG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gVmFsaWRhdGlvbkZhaWx1cmVcbiAqIEBwcm9wZXJ0eSB7ZmFsc2V9IG9rXG4gKiBAcHJvcGVydHkgeydFX1BST1RPQ09MJ3wnRV9MSU1JVCd9IGNvZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSByZWFzb25cbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBtZXNzYWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3BhdGhdXG4gKiBAcHJvcGVydHkge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAqL1xuXG4vKipcbiAqIEJ1aWxkIGEgd2VsbC1mb3JtZWQgZW52ZWxvcGUuIFByb2R1Y2VycyBzaG91bGQgdXNlIHRoaXMgaW5zdGVhZCBvZiB3cml0aW5nXG4gKiBvYmplY3QgbGl0ZXJhbHMgc28gdGhhdCB0aGUgdmVyc2lvbiBmaWVsZCBjYW4gbmV2ZXIgYmUgZm9yZ290dGVuLlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdElkXVxuICogQHJldHVybnMge0VudmVsb3BlfVxuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlRW52ZWxvcGUoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQ6IHBheWxvYWQgPz8ge30sXG4gIH07XG4gIGlmIChyZXF1ZXN0SWQpIHtcbiAgICBlbnZlbG9wZS5yZXF1ZXN0SWQgPSByZXF1ZXN0SWQ7XG4gIH1cbiAgcmV0dXJuIGVudmVsb3BlO1xufVxuXG4vKipcbiAqIEJ1aWxkIGEgdHlwZWQgZXJyb3IgcGF5bG9hZC4gYGRldGFpbGAgbXVzdCBuZXZlciBjb250YWluIHNvdXJjZSB0ZXh0LlxuICpcbiAqIEBwYXJhbSB7c3RyaW5nfSBjb2RlXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAqIEByZXR1cm5zIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpIHtcbiAgLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi9cbiAgY29uc3QgcGF5bG9hZCA9IHsgY29kZSwgbWVzc2FnZSB9O1xuICBpZiAoZGV0YWlsKSB7XG4gICAgcGF5bG9hZC5kZXRhaWwgPSBkZXRhaWw7XG4gIH1cbiAgcmV0dXJuIHBheWxvYWQ7XG59XG5cbi8qKlxuICogQXBwcm94aW1hdGUgc2VyaWFsaXplZCBzaXplIG9mIGEgbWVzc2FnZS4gVXNlZCBmb3IgbGltaXQgZW5mb3JjZW1lbnQ7IHRoZVxuICogZXhhY3QgYnl0ZXMgZG8gbm90IG1hdHRlciwgb25seSB0aGF0IG92ZXJzaXplZCBtZXNzYWdlcyBhcmUgcmVmdXNlZCBiZWZvcmVcbiAqIHRoZXkgYXJlIHBvc3RlZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7bnVtYmVyfVxuICovXG5leHBvcnQgZnVuY3Rpb24gbWVzc2FnZVNpemUodmFsdWUpIHtcbiAgdHJ5IHtcbiAgICBjb25zdCBqc29uID0gSlNPTi5zdHJpbmdpZnkodmFsdWUpO1xuICAgIHJldHVybiB0eXBlb2YganNvbiA9PT0gJ3N0cmluZycgPyBqc29uLmxlbmd0aCA6IDA7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBOdW1iZXIuUE9TSVRJVkVfSU5GSU5JVFk7XG4gIH1cbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcmV0dXJucyB7dmFsdWUgaXMgUmVjb3JkPHN0cmluZywgdW5rbm93bj59XG4gKi9cbmZ1bmN0aW9uIGlzUGxhaW5PYmplY3QodmFsdWUpIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgIUFycmF5LmlzQXJyYXkodmFsdWUpO1xufVxuXG4vKipcbiAqIFJlamVjdCBwYXlsb2FkcyB0aGF0IGNvdWxkIHBvaXNvbiBwcm90b3R5cGVzIHdoZW4gbWVyZ2VkIG9yIHNwcmVhZC5cbiAqXG4gKiBAcGFyYW0ge3Vua25vd259IHZhbHVlXG4gKiBAcGFyYW0ge3N0cmluZ30gcGF0aFxuICogQHBhcmFtIHtudW1iZXJ9IGRlcHRoXG4gKiBAcmV0dXJucyB7e29rOiB0cnVlfSB8IHtvazogZmFsc2UsIHBhdGg6IHN0cmluZywga2V5OiBzdHJpbmd9fVxuICovXG5mdW5jdGlvbiBzY2FuVW5zYWZlS2V5cyh2YWx1ZSwgcGF0aCwgZGVwdGgpIHtcbiAgaWYgKGRlcHRoID4gTUFYX0tFWV9TQ0FOX0RFUFRIIHx8IHZhbHVlID09PSBudWxsIHx8IHR5cGVvZiB2YWx1ZSAhPT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICB9XG4gIGNvbnN0IGVudHJpZXMgPSBBcnJheS5pc0FycmF5KHZhbHVlKSA/IHZhbHVlLmVudHJpZXMoKSA6IE9iamVjdC5lbnRyaWVzKHZhbHVlKTtcbiAgZm9yIChjb25zdCBba2V5LCBjaGlsZF0gb2YgZW50cmllcykge1xuICAgIGNvbnN0IGNoaWxkUGF0aCA9IEFycmF5LmlzQXJyYXkodmFsdWUpID8gYCR7cGF0aH1bJHtrZXl9XWAgOiBgJHtwYXRofS4ke2tleX1gO1xuICAgIGlmICghQXJyYXkuaXNBcnJheSh2YWx1ZSkgJiYgVU5TQUZFX0tFWVMuaGFzKFN0cmluZyhrZXkpKSkge1xuICAgICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBwYXRoOiBjaGlsZFBhdGgsIGtleTogU3RyaW5nKGtleSkgfTtcbiAgICB9XG4gICAgY29uc3QgbmVzdGVkID0gc2NhblVuc2FmZUtleXMoY2hpbGQsIGNoaWxkUGF0aCwgZGVwdGggKyAxKTtcbiAgICBpZiAoIW5lc3RlZC5vaykge1xuICAgICAgcmV0dXJuIG5lc3RlZDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbn1cblxuLyoqXG4gKiBWYWxpZGF0ZSBhbiBpbmJvdW5kIG1lc3NhZ2UgYWdhaW5zdCB0aGUgcHJvdG9jb2wgY29udHJhY3QuXG4gKlxuICogVmFsaWRhdGlvbiBpcyB0b3RhbDogZXZlcnkgcmVqZWN0aW9uIHJldHVybnMgYSB0eXBlZCBmYWlsdXJlIHdpdGggYSBzdGFibGVcbiAqIHJlYXNvbiBjb2RlLCBhbmQgbmV2ZXIgdGhyb3dzLlxuICpcbiAqIEBwYXJhbSB7dW5rbm93bn0gcmF3XG4gKiBAcGFyYW0ge3tkaXJlY3Rpb246ICd3ZWJ2aWV3X3RvX2hvc3QnIHwgJ2hvc3RfdG9fd2Vidmlldyd9fSBvcHRpb25zXG4gKiBAcmV0dXJucyB7VmFsaWRhdGlvblN1Y2Nlc3MgfCBWYWxpZGF0aW9uRmFpbHVyZX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRW52ZWxvcGUocmF3LCBvcHRpb25zKSB7XG4gIGNvbnN0IGRpcmVjdGlvbiA9IG9wdGlvbnM/LmRpcmVjdGlvbjtcbiAgY29uc3QgYWxsb3dsaXN0ID0gS0lORF9BTExPV0xJU1RbZGlyZWN0aW9uXTtcbiAgaWYgKCFhbGxvd2xpc3QpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9kaXJlY3Rpb24nLFxuICAgICAgbWVzc2FnZTogYFVua25vd24gcHJvdG9jb2wgZGlyZWN0aW9uOiAke1N0cmluZyhkaXJlY3Rpb24pfWAsXG4gICAgfTtcbiAgfVxuXG4gIGlmICghaXNQbGFpbk9iamVjdChyYXcpKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX1BST1RPQ09MJyxcbiAgICAgIHJlYXNvbjogJ25vdF9hbl9vYmplY3QnLFxuICAgICAgbWVzc2FnZTogJ01lc3NhZ2UgbXVzdCBiZSBhIHBsYWluIG9iamVjdC4nLFxuICAgIH07XG4gIH1cblxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAocmF3KTtcblxuICBpZiAoY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbiAhPT0gUFJPVE9DT0xfVkVSU0lPTikge1xuICAgIHJldHVybiB7XG4gICAgICBvazogZmFsc2UsXG4gICAgICBjb2RlOiAnRV9QUk9UT0NPTCcsXG4gICAgICByZWFzb246ICd2ZXJzaW9uX21pc21hdGNoJyxcbiAgICAgIG1lc3NhZ2U6IGBVbnN1cHBvcnRlZCBwcm90b2NvbCB2ZXJzaW9uOiBleHBlY3RlZCAke1BST1RPQ09MX1ZFUlNJT059LCByZWNlaXZlZCAke1N0cmluZyhcbiAgICAgICAgY2FuZGlkYXRlLnByb3RvY29sVmVyc2lvbixcbiAgICAgICl9LmAsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtpbmQgPSBjYW5kaWRhdGUua2luZDtcbiAgaWYgKHR5cGVvZiBraW5kICE9PSAnc3RyaW5nJyB8fCAhS0lORF9QQVRURVJOLnRlc3Qoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9raW5kJyxcbiAgICAgIG1lc3NhZ2U6ICdNZXNzYWdlIGtpbmQgbXVzdCBsb29rIGxpa2UgXCJkb21haW4uYWN0aW9uXCIgaW4gbG93ZXIgY2FzZS4nLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBpZiAoIWFsbG93bGlzdC5oYXMoa2luZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5rbm93bl9raW5kJyxcbiAgICAgIG1lc3NhZ2U6IGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBhY2NlcHRlZCBpbiBkaXJlY3Rpb24gXCIke2RpcmVjdGlvbn1cIi5gLFxuICAgICAgcGF0aDogJ2tpbmQnLFxuICAgIH07XG4gIH1cblxuICBjb25zdCByZXF1ZXN0SWQgPSBjYW5kaWRhdGUucmVxdWVzdElkO1xuICBpZiAocmVxdWVzdElkICE9PSB1bmRlZmluZWQpIHtcbiAgICBpZiAodHlwZW9mIHJlcXVlc3RJZCAhPT0gJ3N0cmluZycgfHwgIVJFUVVFU1RfSURfUEFUVEVSTi50ZXN0KHJlcXVlc3RJZCkpIHtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIG9rOiBmYWxzZSxcbiAgICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgICByZWFzb246ICdpbnZhbGlkX3JlcXVlc3RfaWQnLFxuICAgICAgICBtZXNzYWdlOiAncmVxdWVzdElkIG11c3QgYmUgMS0xMjggY2hhcmFjdGVycyBvZiBBLVosIGEteiwgMC05LCBcIl9cIiBvciBcIi1cIi4nLFxuICAgICAgICBwYXRoOiAncmVxdWVzdElkJyxcbiAgICAgIH07XG4gICAgfVxuICB9XG5cbiAgY29uc3QgcGF5bG9hZCA9IGNhbmRpZGF0ZS5wYXlsb2FkID8/IHt9O1xuICBpZiAoIWlzUGxhaW5PYmplY3QocGF5bG9hZCkpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAnaW52YWxpZF9wYXlsb2FkJyxcbiAgICAgIG1lc3NhZ2U6ICdwYXlsb2FkIG11c3QgYmUgYSBwbGFpbiBvYmplY3QuJyxcbiAgICAgIHBhdGg6ICdwYXlsb2FkJyxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIGNvbnN0IGtleVNjYW4gPSBzY2FuVW5zYWZlS2V5cyhwYXlsb2FkLCAncGF5bG9hZCcsIDApO1xuICBpZiAoIWtleVNjYW4ub2spIHtcbiAgICByZXR1cm4ge1xuICAgICAgb2s6IGZhbHNlLFxuICAgICAgY29kZTogJ0VfUFJPVE9DT0wnLFxuICAgICAgcmVhc29uOiAndW5zYWZlX2tleScsXG4gICAgICBtZXNzYWdlOiBgUGF5bG9hZCBjb250YWlucyBhIGZvcmJpZGRlbiBrZXkgXCIke2tleVNjYW4ua2V5fVwiLmAsXG4gICAgICBwYXRoOiBrZXlTY2FuLnBhdGgsXG4gICAgICByZXF1ZXN0SWQ6IHR5cGVvZiByZXF1ZXN0SWQgPT09ICdzdHJpbmcnID8gcmVxdWVzdElkIDogdW5kZWZpbmVkLFxuICAgIH07XG4gIH1cblxuICBpZiAobWVzc2FnZVNpemUoY2FuZGlkYXRlKSA+IE1BWF9QQVlMT0FEX0JZVEVTKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG9rOiBmYWxzZSxcbiAgICAgIGNvZGU6ICdFX0xJTUlUJyxcbiAgICAgIHJlYXNvbjogJ3BheWxvYWRfdG9vX2xhcmdlJyxcbiAgICAgIG1lc3NhZ2U6IGBNZXNzYWdlIGV4Y2VlZHMgdGhlICR7TUFYX1BBWUxPQURfQllURVN9IGJ5dGUgbGltaXQuYCxcbiAgICAgIHJlcXVlc3RJZDogdHlwZW9mIHJlcXVlc3RJZCA9PT0gJ3N0cmluZycgPyByZXF1ZXN0SWQgOiB1bmRlZmluZWQsXG4gICAgfTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7RW52ZWxvcGV9ICovXG4gIGNvbnN0IGVudmVsb3BlID0ge1xuICAgIHByb3RvY29sVmVyc2lvbjogUFJPVE9DT0xfVkVSU0lPTixcbiAgICBraW5kLFxuICAgIHBheWxvYWQsXG4gIH07XG4gIGlmICh0eXBlb2YgcmVxdWVzdElkID09PSAnc3RyaW5nJykge1xuICAgIGVudmVsb3BlLnJlcXVlc3RJZCA9IHJlcXVlc3RJZDtcbiAgfVxuXG4gIHJldHVybiB7IG9rOiB0cnVlLCBlbnZlbG9wZSB9O1xufVxuIiwgIi8qKlxuICogV2VidmlldyBtZXNzYWdlIGJyaWRnZS5cbiAqXG4gKiBTeW1tZXRyaWMgaW1wbGVtZW50YXRpb24gdXNlZCBieSBib3RoIHRoZSBleHRlbnNpb24gaG9zdCBhbmQgdGhlIHdlYnZpZXcuXG4gKiBSZXNwb25zaWJpbGl0aWVzOlxuICogLSBWYWxpZGF0ZSBldmVyeSBpbmJvdW5kIG1lc3NhZ2UgYmVmb3JlIGFueSBoYW5kbGVyIHNlZXMgaXQuXG4gKiAtIENvcnJlbGF0ZSByZXF1ZXN0cyB3aXRoIHJlc3BvbnNlcywgd2l0aCBhIHRpbWVvdXQgcGVyIHJlcXVlc3QuXG4gKiAtIENvbnRhaW4gaGFuZGxlciBmYWlsdXJlcyBhbmQgcmVwb3J0IHRoZW0gYXMgdHlwZWQgcHJvdG9jb2wgZXJyb3JzLlxuICogLSBSZWplY3Qgd29yayBhZnRlciBkaXNwb3NhbCBzbyBhIGNsb3NlZCBwYW5lbCBjYW5ub3QgbGVhayB0aW1lcnMuXG4gKlxuICogVGhlIGJyaWRnZSBoYXMgbm8gZGVwZW5kZW5jeSBvbiB0aGUgYHZzY29kZWAgbW9kdWxlOiB0aGUgdHJhbnNwb3J0IChgcG9zdGApXG4gKiBpcyBpbmplY3RlZC4gVGhhdCBtYWtlcyB0aGUgd2hvbGUgcmVxdWVzdC9yZXNwb25zZSBjb250cmFjdCB1bml0LXRlc3RhYmxlIGluXG4gKiBwbGFpbiBOb2RlLlxuICovXG5cbmltcG9ydCB7XG4gIERJUkVDVElPTlMsXG4gIEhPU1RfVE9fV0VCVklFVyxcbiAgV0VCVklFV19UT19IT1NULFxuICBjcmVhdGVFbnZlbG9wZSxcbiAgY3JlYXRlRXJyb3JQYXlsb2FkLFxuICBtZXNzYWdlU2l6ZSxcbiAgdmFsaWRhdGVFbnZlbG9wZSxcbn0gZnJvbSAnLi9lbnZlbG9wZS5qcyc7XG5cbmV4cG9ydCBjbGFzcyBQcm90b2NvbEVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvZGVcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2VcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGNvbnN0cnVjdG9yKGNvZGUsIG1lc3NhZ2UsIGRldGFpbCkge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICAgIHRoaXMubmFtZSA9ICdQcm90b2NvbEVycm9yJztcbiAgICB0aGlzLmNvZGUgPSBjb2RlO1xuICAgIGlmIChkZXRhaWwpIHtcbiAgICAgIHRoaXMuZGV0YWlsID0gZGV0YWlsO1xuICAgIH1cbiAgfVxufVxuXG4vKiogQHR5cGUge3tkZWJ1ZzogRnVuY3Rpb24sIHdhcm46IEZ1bmN0aW9uLCBlcnJvcjogRnVuY3Rpb259fSAqL1xuY29uc3QgTk9PUF9MT0dHRVIgPSB7XG4gIGRlYnVnKCkge30sXG4gIHdhcm4oKSB7fSxcbiAgZXJyb3IoKSB7fSxcbn07XG5cbi8qKlxuICogQHR5cGVkZWYge09iamVjdH0gQnJpZGdlT3B0aW9uc1xuICogQHByb3BlcnR5IHsobWVzc2FnZTogUmVjb3JkPHN0cmluZywgdW5rbm93bj4pID0+IHZvaWR9IHBvc3QgIFRyYW5zcG9ydCB0byB0aGUgb3RoZXIgc2lkZS5cbiAqIEBwcm9wZXJ0eSB7J3dlYnZpZXdfdG9faG9zdCcgfCAnaG9zdF90b193ZWJ2aWV3J30gaW5ib3VuZERpcmVjdGlvblxuICogQHByb3BlcnR5IHtudW1iZXJ9IFt0aW1lb3V0TXNdXG4gKiBAcHJvcGVydHkge251bWJlcn0gW21heEluRmxpZ2h0XVxuICogQHByb3BlcnR5IHsoKSA9PiBzdHJpbmd9IFtjcmVhdGVSZXF1ZXN0SWRdXG4gKiBAcHJvcGVydHkge3R5cGVvZiBOT09QX0xPR0dFUn0gW2xvZ2dlcl1cbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7QnJpZGdlT3B0aW9uc30gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQnJpZGdlKG9wdGlvbnMpIHtcbiAgY29uc3QgeyBwb3N0LCBpbmJvdW5kRGlyZWN0aW9uLCBsb2dnZXIgPSBOT09QX0xPR0dFUiB9ID0gb3B0aW9ucztcbiAgY29uc3QgdGltZW91dE1zID0gb3B0aW9ucy50aW1lb3V0TXMgPz8gNTAwMDtcbiAgY29uc3QgbWF4SW5GbGlnaHQgPSBvcHRpb25zLm1heEluRmxpZ2h0ID8/IDMyO1xuICBjb25zdCBvdXRib3VuZERpcmVjdGlvbiA9XG4gICAgaW5ib3VuZERpcmVjdGlvbiA9PT0gRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1RcbiAgICAgID8gRElSRUNUSU9OUy5IT1NUX1RPX1dFQlZJRVdcbiAgICAgIDogRElSRUNUSU9OUy5XRUJWSUVXX1RPX0hPU1Q7XG4gIGNvbnN0IG91dGJvdW5kS2luZHMgPSBuZXcgU2V0KFxuICAgIG91dGJvdW5kRGlyZWN0aW9uID09PSBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyA/IEhPU1RfVE9fV0VCVklFVyA6IFdFQlZJRVdfVE9fSE9TVCxcbiAgKTtcblxuICBsZXQgc2VxdWVuY2UgPSAwO1xuICBjb25zdCBjcmVhdGVSZXF1ZXN0SWQgPVxuICAgIG9wdGlvbnMuY3JlYXRlUmVxdWVzdElkID8/XG4gICAgKCgpID0+IHtcbiAgICAgIHNlcXVlbmNlICs9IDE7XG4gICAgICByZXR1cm4gYHIke3NlcXVlbmNlLnRvU3RyaW5nKDM2KX0tJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zbGljZSgyLCAxMCl9YDtcbiAgICB9KTtcblxuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIHtyZXNvbHZlOiBGdW5jdGlvbiwgcmVqZWN0OiBGdW5jdGlvbiwgdGltZXI6IFJldHVyblR5cGU8dHlwZW9mIHNldFRpbWVvdXQ+fT59ICovXG4gIGNvbnN0IHBlbmRpbmcgPSBuZXcgTWFwKCk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgKHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bj59ICovXG4gIGNvbnN0IGhhbmRsZXJzID0gbmV3IE1hcCgpO1xuICBjb25zdCByZXBvcnRlZEtpbmRzID0gbmV3IFNldCgpO1xuICBsZXQgZGlzcG9zZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtpbmRcbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gcGF5bG9hZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmQoa2luZCwgcGF5bG9hZCwgcmVxdWVzdElkKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpO1xuICAgIH1cbiAgICBpZiAoIW91dGJvdW5kS2luZHMuaGFzKGtpbmQpKSB7XG4gICAgICB0aHJvdyBuZXcgUHJvdG9jb2xFcnJvcignRV9QUk9UT0NPTCcsIGBLaW5kIFwiJHtraW5kfVwiIGlzIG5vdCBzZW5kYWJsZSBpbiB0aGlzIGRpcmVjdGlvbi5gKTtcbiAgICB9XG4gICAgY29uc3QgZW52ZWxvcGUgPSBjcmVhdGVFbnZlbG9wZShraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgIGlmIChtZXNzYWdlU2l6ZShlbnZlbG9wZSkgPiAxXzAwMF8wMDApIHtcbiAgICAgIHRocm93IG5ldyBQcm90b2NvbEVycm9yKCdFX0xJTUlUJywgJ1JlZnVzaW5nIHRvIHNlbmQgYW4gb3ZlcnNpemVkIG1lc3NhZ2UuJyk7XG4gICAgfVxuICAgIHBvc3QoZW52ZWxvcGUpO1xuICAgIGxvZ2dlci5kZWJ1ZygncHJvdG9jb2wuc2VuZCcsIHtcbiAgICAgIGtpbmQsXG4gICAgICByZXF1ZXN0SWQ6IHJlcXVlc3RJZCA/PyBudWxsLFxuICAgICAgYnl0ZXM6IG1lc3NhZ2VTaXplKGVudmVsb3BlKSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29kZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3RJZF1cbiAgICogQHBhcmFtIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gW2RldGFpbF1cbiAgICovXG4gIGZ1bmN0aW9uIHNlbmRFcnJvcihjb2RlLCBtZXNzYWdlLCByZXF1ZXN0SWQsIGRldGFpbCkge1xuICAgIHRyeSB7XG4gICAgICBzZW5kKCdwcm90b2NvbC5lcnJvcicsIGNyZWF0ZUVycm9yUGF5bG9hZChjb2RlLCBtZXNzYWdlLCBkZXRhaWwpLCByZXF1ZXN0SWQpO1xuICAgIH0gY2F0Y2gge1xuICAgICAgLy8gVGhlIHBhbmVsIG1heSBhbHJlYWR5IGJlIGdvbmUuIE5vdGhpbmcgdXNlZnVsIHJlbWFpbnMgdG8gZG8uXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBraW5kXG4gICAqIEBwYXJhbSB7KHBheWxvYWQ6IFJlY29yZDxzdHJpbmcsIHVua25vd24+LCBtZXRhOiB7cmVxdWVzdElkPzogc3RyaW5nfSkgPT4gdW5rbm93bn0gaGFuZGxlclxuICAgKiBAcmV0dXJucyB7KCkgPT4gdm9pZH0gdW5zdWJzY3JpYmVcbiAgICovXG4gIGZ1bmN0aW9uIG9uKGtpbmQsIGhhbmRsZXIpIHtcbiAgICBoYW5kbGVycy5zZXQoa2luZCwgaGFuZGxlcik7XG4gICAgcmV0dXJuICgpID0+IHtcbiAgICAgIGlmIChoYW5kbGVycy5nZXQoa2luZCkgPT09IGhhbmRsZXIpIHtcbiAgICAgICAgaGFuZGxlcnMuZGVsZXRlKGtpbmQpO1xuICAgICAgfVxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogU2VuZCBhIHJlcXVlc3QgYW5kIGF3YWl0IHRoZSBjb3JyZWxhdGVkIHJlc3BvbnNlLlxuICAgKlxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2luZFxuICAgKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSBbcGF5bG9hZF1cbiAgICogQHBhcmFtIHt7dGltZW91dE1zPzogbnVtYmVyfX0gW3JlcXVlc3RPcHRpb25zXVxuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7a2luZDogc3RyaW5nLCBwYXlsb2FkOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0+fVxuICAgKi9cbiAgZnVuY3Rpb24gcmVxdWVzdChraW5kLCBwYXlsb2FkID0ge30sIHJlcXVlc3RPcHRpb25zID0ge30pIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcignRV9DQU5DRUxMRUQnLCAnQnJpZGdlIGlzIGRpc3Bvc2VkLicpKTtcbiAgICB9XG4gICAgaWYgKHBlbmRpbmcuc2l6ZSA+PSBtYXhJbkZsaWdodCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFxuICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcignRV9MSU1JVCcsIGBUb28gbWFueSBpbi1mbGlnaHQgcmVxdWVzdHMgKCR7bWF4SW5GbGlnaHR9KS5gKSxcbiAgICAgICk7XG4gICAgfVxuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGNyZWF0ZVJlcXVlc3RJZCgpO1xuICAgIGNvbnN0IGVmZmVjdGl2ZVRpbWVvdXQgPSByZXF1ZXN0T3B0aW9ucy50aW1lb3V0TXMgPz8gdGltZW91dE1zO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgIHBlbmRpbmcuZGVsZXRlKHJlcXVlc3RJZCk7XG4gICAgICAgIHJlamVjdChcbiAgICAgICAgICBuZXcgUHJvdG9jb2xFcnJvcignRV9USU1FT1VUJywgYE5vIHJlc3BvbnNlIHRvIFwiJHtraW5kfVwiIHdpdGhpbiAke2VmZmVjdGl2ZVRpbWVvdXR9IG1zLmAsIHtcbiAgICAgICAgICAgIGtpbmQsXG4gICAgICAgICAgICByZXF1ZXN0SWQsXG4gICAgICAgICAgfSksXG4gICAgICAgICk7XG4gICAgICB9LCBlZmZlY3RpdmVUaW1lb3V0KTtcbiAgICAgIHBlbmRpbmcuc2V0KHJlcXVlc3RJZCwgeyByZXNvbHZlLCByZWplY3QsIHRpbWVyIH0pO1xuICAgICAgdHJ5IHtcbiAgICAgICAgc2VuZChraW5kLCBwYXlsb2FkLCByZXF1ZXN0SWQpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgcmVqZWN0KGVycm9yKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge3Vua25vd259IHJhd1xuICAgKiBAcmV0dXJucyB7UHJvbWlzZTx7b2s6IGJvb2xlYW4sIGNvZGU/OiBzdHJpbmcsIHJlYXNvbj86IHN0cmluZ30+fVxuICAgKi9cbiAgYXN5bmMgZnVuY3Rpb24gaGFuZGxlTWVzc2FnZShyYXcpIHtcbiAgICBpZiAoZGlzcG9zZWQpIHtcbiAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgY29kZTogJ0VfQ0FOQ0VMTEVEJywgcmVhc29uOiAnZGlzcG9zZWQnIH07XG4gICAgfVxuXG4gICAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRW52ZWxvcGUocmF3LCB7IGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbiB9KTtcbiAgICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICAgIGlmICghcmVwb3J0ZWRLaW5kcy5oYXModmFsaWRhdGlvbi5yZWFzb24pKSB7XG4gICAgICAgIHJlcG9ydGVkS2luZHMuYWRkKHZhbGlkYXRpb24ucmVhc29uKTtcbiAgICAgICAgbG9nZ2VyLndhcm4oJ3Byb3RvY29sLnJlamVjdGVkJywge1xuICAgICAgICAgIHJlYXNvbjogdmFsaWRhdGlvbi5yZWFzb24sXG4gICAgICAgICAgcGF0aDogdmFsaWRhdGlvbi5wYXRoID8/IG51bGwsXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgc2VuZEVycm9yKHZhbGlkYXRpb24uY29kZSwgdmFsaWRhdGlvbi5tZXNzYWdlLCB2YWxpZGF0aW9uLnJlcXVlc3RJZCwge1xuICAgICAgICByZWFzb246IHZhbGlkYXRpb24ucmVhc29uLFxuICAgICAgfSk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGU6IHZhbGlkYXRpb24uY29kZSwgcmVhc29uOiB2YWxpZGF0aW9uLnJlYXNvbiB9O1xuICAgIH1cblxuICAgIGNvbnN0IGVudmVsb3BlID0gdmFsaWRhdGlvbi5lbnZlbG9wZTtcbiAgICBjb25zdCB7IGtpbmQsIHJlcXVlc3RJZCwgcGF5bG9hZCB9ID0gZW52ZWxvcGU7XG4gICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC5yZWNlaXZlJywge1xuICAgICAga2luZCxcbiAgICAgIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwsXG4gICAgICBieXRlczogbWVzc2FnZVNpemUoZW52ZWxvcGUpLFxuICAgIH0pO1xuXG4gICAgaWYgKGtpbmQgPT09ICdwcm90b2NvbC5lcnJvcicpIHtcbiAgICAgIGlmIChyZXF1ZXN0SWQgJiYgcGVuZGluZy5oYXMocmVxdWVzdElkKSkge1xuICAgICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICAgIGlmIChlbnRyeSkge1xuICAgICAgICAgIGNsZWFyVGltZW91dChlbnRyeS50aW1lcik7XG4gICAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gICAgICAgICAgY29uc3QgbWVzc2FnZSA9XG4gICAgICAgICAgICB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJyA/IHBheWxvYWQubWVzc2FnZSA6ICdUaGUgb3RoZXIgc2lkZSByZXBvcnRlZCBhbiBlcnJvci4nO1xuICAgICAgICAgIGVudHJ5LnJlamVjdChuZXcgUHJvdG9jb2xFcnJvcihjb2RlLCBtZXNzYWdlLCB7IHJlcXVlc3RJZCB9KSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB7IG9rOiB0cnVlIH07XG4gICAgfVxuXG4gICAgaWYgKHJlcXVlc3RJZCAmJiBwZW5kaW5nLmhhcyhyZXF1ZXN0SWQpKSB7XG4gICAgICBjb25zdCBlbnRyeSA9IHBlbmRpbmcuZ2V0KHJlcXVlc3RJZCk7XG4gICAgICBpZiAoZW50cnkpIHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGVudHJ5LnRpbWVyKTtcbiAgICAgICAgcGVuZGluZy5kZWxldGUocmVxdWVzdElkKTtcbiAgICAgICAgZW50cnkucmVzb2x2ZSh7IGtpbmQsIHBheWxvYWQgfSk7XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZXIgPSBoYW5kbGVycy5nZXQoa2luZCk7XG4gICAgaWYgKCFoYW5kbGVyKSB7XG4gICAgICAvLyBBIHJlc3BvbnNlIHdob3NlIHJlcXVlc3QgYWxyZWFkeSB0aW1lZCBvdXQgaXMgZXhwZWN0ZWQgYW5kIGhhcm1sZXNzLlxuICAgICAgbG9nZ2VyLmRlYnVnKCdwcm90b2NvbC51bmhhbmRsZWQnLCB7IGtpbmQsIHJlcXVlc3RJZDogcmVxdWVzdElkID8/IG51bGwgfSk7XG4gICAgICByZXR1cm4geyBvazogdHJ1ZSB9O1xuICAgIH1cblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCBoYW5kbGVyKHBheWxvYWQsIHsgcmVxdWVzdElkIH0pO1xuICAgICAgcmV0dXJuIHsgb2s6IHRydWUgfTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIGNvbnN0IGNvZGUgPVxuICAgICAgICBlcnJvciBpbnN0YW5jZW9mIFByb3RvY29sRXJyb3JcbiAgICAgICAgICA/IGVycm9yLmNvZGVcbiAgICAgICAgICA6IC8qKiBAdHlwZSB7e2NvZGU/OiBzdHJpbmd9fSAqLyAoZXJyb3IpPy5jb2RlID8/ICdFX1BST1RPQ09MJztcbiAgICAgIGxvZ2dlci5lcnJvcigncHJvdG9jb2wuaGFuZGxlcl9mYWlsZWQnLCB7IGtpbmQsIGVycm9yOiBtZXNzYWdlIH0pO1xuICAgICAgc2VuZEVycm9yKGNvZGUsIG1lc3NhZ2UsIHJlcXVlc3RJZCk7XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGNvZGUgfTtcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlYXNvblxuICAgKi9cbiAgZnVuY3Rpb24gZGlzcG9zZShyZWFzb24gPSAnZGlzcG9zZWQnKSB7XG4gICAgaWYgKGRpc3Bvc2VkKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGRpc3Bvc2VkID0gdHJ1ZTtcbiAgICBmb3IgKGNvbnN0IFssIGVudHJ5XSBvZiBwZW5kaW5nKSB7XG4gICAgICBjbGVhclRpbWVvdXQoZW50cnkudGltZXIpO1xuICAgICAgZW50cnkucmVqZWN0KG5ldyBQcm90b2NvbEVycm9yKCdFX0NBTkNFTExFRCcsIGBCcmlkZ2UgY2xvc2VkOiAke3JlYXNvbn1gKSk7XG4gICAgfVxuICAgIHBlbmRpbmcuY2xlYXIoKTtcbiAgICBoYW5kbGVycy5jbGVhcigpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbixcbiAgICByZXF1ZXN0LFxuICAgIHJlc3BvbmQ6IHNlbmQsXG4gICAgaGFuZGxlTWVzc2FnZSxcbiAgICBkaXNwb3NlLFxuICAgIHBlbmRpbmdDb3VudDogKCkgPT4gcGVuZGluZy5zaXplLFxuICAgIGlzRGlzcG9zZWQ6ICgpID0+IGRpc3Bvc2VkLFxuICAgIGRpcmVjdGlvbjogaW5ib3VuZERpcmVjdGlvbixcbiAgfTtcbn1cbiIsICIvKipcbiAqIERldGVybWluaXN0aWMgbGF5ZXJlZCBsYXlvdXQuXG4gKlxuICogUGhhc2UgMCBuZWVkcyBwb3NpdGlvbnMgc28gdGhlIHdlYnZpZXcgY2FuIGRyYXcgc29tZXRoaW5nIHdpdGhvdXQgb3duaW5nIGFcbiAqIGxheW91dCBhbGdvcml0aG0uIFBoYXNlIDQgYmVuY2htYXJrcyByZWFsIGVuZ2luZXMgKEN5dG9zY2FwZS9FTEsvZGFncmUpIGFuZFxuICogcmVwbGFjZXMgdGhpcyBiZWhpbmQgdGhlIHJlbmRlcmVyIGJvdW5kYXJ5OyB1bnRpbCB0aGVuLCBkZXRlcm1pbmlzdGljIG91dHB1dFxuICogaXMgbW9yZSB2YWx1YWJsZSB0aGFuIHByZXR0eSBvdXRwdXQgYmVjYXVzZSBpdCBtYWtlcyB0ZXN0cyBzdGFibGUuXG4gKi9cblxuLyoqXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuL21vZGVsLmpzJykuR3JhcGh9IEdyYXBoXG4gKiBAdHlwZWRlZiB7e3g6IG51bWJlciwgeTogbnVtYmVyLCB3aWR0aDogbnVtYmVyLCBoZWlnaHQ6IG51bWJlciwgbGF5ZXI6IG51bWJlcn19IFBvc2l0aW9uXG4gKi9cblxuZXhwb3J0IGNvbnN0IExBWU9VVF9ERUZBVUxUUyA9IE9iamVjdC5mcmVlemUoe1xuICBub2RlV2lkdGg6IDE5MCxcbiAgbm9kZUhlaWdodDogNTQsXG4gIGhvcml6b250YWxHYXA6IDkwLFxuICB2ZXJ0aWNhbEdhcDogMjYsXG4gIG1heExheWVyczogNDAsXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHBhcmFtIHtQYXJ0aWFsPHR5cGVvZiBMQVlPVVRfREVGQVVMVFM+fSBbb3B0aW9uc11cbiAqIEByZXR1cm5zIHt7cG9zaXRpb25zOiBSZWNvcmQ8c3RyaW5nLCBQb3NpdGlvbj4sIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcnM6IHN0cmluZ1tdW119fVxuICovXG5leHBvcnQgZnVuY3Rpb24gY29tcHV0ZUxheW91dChncmFwaCwgb3B0aW9ucyA9IHt9KSB7XG4gIGNvbnN0IGNvbmZpZyA9IHsgLi4uTEFZT1VUX0RFRkFVTFRTLCAuLi5vcHRpb25zIH07XG4gIGNvbnN0IG5vZGVJZHMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+IG5vZGUuaWQpO1xuICAvKiogQHR5cGUge01hcDxzdHJpbmcsIG51bWJlcj59ICovXG4gIGNvbnN0IGxheWVyT2YgPSBuZXcgTWFwKCk7XG5cbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBzdHJpbmdbXT59ICovXG4gIGNvbnN0IGluY29taW5nID0gbmV3IE1hcChub2RlSWRzLm1hcCgoaWQpID0+IFtpZCwgW11dKSk7XG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgc3RyaW5nW10+fSAqL1xuICBjb25zdCBvdXRnb2luZyA9IG5ldyBNYXAobm9kZUlkcy5tYXAoKGlkKSA9PiBbaWQsIFtdXSkpO1xuXG4gIGZvciAoY29uc3QgZWRnZSBvZiBncmFwaC5lZGdlcykge1xuICAgIGlmICghaW5jb21pbmcuaGFzKGVkZ2UudG8pIHx8ICFpbmNvbWluZy5oYXMoZWRnZS5mcm9tKSB8fCBlZGdlLmZyb20gPT09IGVkZ2UudG8pIHtcbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpbmNvbWluZy5nZXQoZWRnZS50byk/LnB1c2goZWRnZS5mcm9tKTtcbiAgICBvdXRnb2luZy5nZXQoZWRnZS5mcm9tKT8ucHVzaChlZGdlLnRvKTtcbiAgfVxuXG4gIC8vIEthaG4ncyBhbGdvcml0aG0gZ2l2ZXMgYSB0b3BvbG9naWNhbCBvcmRlcjsgY3ljbGVzIGFyZSBoYW5kbGVkIGFmdGVyd2FyZHMuXG4gIC8qKiBAdHlwZSB7TWFwPHN0cmluZywgbnVtYmVyPn0gKi9cbiAgY29uc3QgaW5kZWdyZWUgPSBuZXcgTWFwKG5vZGVJZHMubWFwKChpZCkgPT4gW2lkLCBpbmNvbWluZy5nZXQoaWQpPy5sZW5ndGggPz8gMF0pKTtcbiAgY29uc3QgcmVhZHkgPSBub2RlSWRzLmZpbHRlcigoaWQpID0+IChpbmRlZ3JlZS5nZXQoaWQpID8/IDApID09PSAwKS5zb3J0KCk7XG4gIC8qKiBAdHlwZSB7c3RyaW5nW119ICovXG4gIGNvbnN0IG9yZGVyID0gW107XG5cbiAgd2hpbGUgKHJlYWR5Lmxlbmd0aCA+IDApIHtcbiAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7c3RyaW5nfSAqLyAocmVhZHkuc2hpZnQoKSk7XG4gICAgb3JkZXIucHVzaChpZCk7XG4gICAgZm9yIChjb25zdCBuZXh0IG9mIChvdXRnb2luZy5nZXQoaWQpID8/IFtdKS5zbGljZSgpLnNvcnQoKSkge1xuICAgICAgY29uc3QgcmVtYWluaW5nID0gKGluZGVncmVlLmdldChuZXh0KSA/PyAwKSAtIDE7XG4gICAgICBpbmRlZ3JlZS5zZXQobmV4dCwgcmVtYWluaW5nKTtcbiAgICAgIGlmIChyZW1haW5pbmcgPT09IDApIHtcbiAgICAgICAgcmVhZHkucHVzaChuZXh0KTtcbiAgICAgICAgcmVhZHkuc29ydCgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGxldCBtYXhMYXllciA9IDA7XG4gIGZvciAoY29uc3QgaWQgb2Ygb3JkZXIpIHtcbiAgICBjb25zdCBwcmVkZWNlc3NvcnMgPSBpbmNvbWluZy5nZXQoaWQpID8/IFtdO1xuICAgIGNvbnN0IGxheWVyID1cbiAgICAgIHByZWRlY2Vzc29ycy5sZW5ndGggPT09IDBcbiAgICAgICAgPyAwXG4gICAgICAgIDogTWF0aC5tYXgoLi4ucHJlZGVjZXNzb3JzLm1hcCgocHJlZCkgPT4gbGF5ZXJPZi5nZXQocHJlZCkgPz8gMCkpICsgMTtcbiAgICBsYXllck9mLnNldChpZCwgbGF5ZXIpO1xuICAgIG1heExheWVyID0gTWF0aC5tYXgobWF4TGF5ZXIsIGxheWVyKTtcbiAgfVxuXG4gIC8vIE5vZGVzIGluc2lkZSBhIGN5Y2xlIG5ldmVyIHJlYWNoIGluZGVncmVlIDAuIFBsYWNlIHRoZW0gYWZ0ZXIgZXZlcnl0aGluZ1xuICAvLyB0aGF0IGNvdWxkIGJlIG9yZGVyZWQsIHJhdGhlciB0aGFuIGRyb3BwaW5nIHRoZW0uXG4gIGNvbnN0IGN5Y2xpYyA9IG5vZGVJZHMuZmlsdGVyKChpZCkgPT4gIWxheWVyT2YuaGFzKGlkKSkuc29ydCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIGN5Y2xpYykge1xuICAgIGxheWVyT2Yuc2V0KGlkLCBNYXRoLm1pbihtYXhMYXllciArIDEsIGNvbmZpZy5tYXhMYXllcnMpKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7TWFwPG51bWJlciwgc3RyaW5nW10+fSAqL1xuICBjb25zdCBieUxheWVyID0gbmV3IE1hcCgpO1xuICBmb3IgKGNvbnN0IGlkIG9mIG5vZGVJZHMuc2xpY2UoKS5zb3J0KCkpIHtcbiAgICBjb25zdCBsYXllciA9IE1hdGgubWluKGxheWVyT2YuZ2V0KGlkKSA/PyAwLCBjb25maWcubWF4TGF5ZXJzKTtcbiAgICBpZiAoIWJ5TGF5ZXIuaGFzKGxheWVyKSkge1xuICAgICAgYnlMYXllci5zZXQobGF5ZXIsIFtdKTtcbiAgICB9XG4gICAgYnlMYXllci5nZXQobGF5ZXIpPy5wdXNoKGlkKTtcbiAgfVxuXG4gIC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgUG9zaXRpb24+fSAqL1xuICBjb25zdCBwb3NpdGlvbnMgPSB7fTtcbiAgLyoqIEB0eXBlIHtzdHJpbmdbXVtdfSAqL1xuICBjb25zdCBsYXllcnMgPSBbXTtcbiAgbGV0IHRhbGxlc3QgPSAwO1xuXG4gIGZvciAoY29uc3QgbGF5ZXIgb2YgWy4uLmJ5TGF5ZXIua2V5cygpXS5zb3J0KChhLCBiKSA9PiBhIC0gYikpIHtcbiAgICBjb25zdCBpZHMgPSBieUxheWVyLmdldChsYXllcikgPz8gW107XG4gICAgbGF5ZXJzLnB1c2goaWRzKTtcbiAgICBpZHMuZm9yRWFjaCgoaWQsIGluZGV4KSA9PiB7XG4gICAgICBwb3NpdGlvbnNbaWRdID0ge1xuICAgICAgICB4OiBsYXllciAqIChjb25maWcubm9kZVdpZHRoICsgY29uZmlnLmhvcml6b250YWxHYXApLFxuICAgICAgICB5OiBpbmRleCAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgICAgIHdpZHRoOiBjb25maWcubm9kZVdpZHRoLFxuICAgICAgICBoZWlnaHQ6IGNvbmZpZy5ub2RlSGVpZ2h0LFxuICAgICAgICBsYXllcixcbiAgICAgIH07XG4gICAgfSk7XG4gICAgdGFsbGVzdCA9IE1hdGgubWF4KHRhbGxlc3QsIGlkcy5sZW5ndGgpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBwb3NpdGlvbnMsXG4gICAgd2lkdGg6IE1hdGgubWF4KDEsIGxheWVycy5sZW5ndGgpICogKGNvbmZpZy5ub2RlV2lkdGggKyBjb25maWcuaG9yaXpvbnRhbEdhcCksXG4gICAgaGVpZ2h0OiBNYXRoLm1heCgxLCB0YWxsZXN0KSAqIChjb25maWcubm9kZUhlaWdodCArIGNvbmZpZy52ZXJ0aWNhbEdhcCksXG4gICAgbGF5ZXJzLFxuICB9O1xufVxuIiwgIi8qKlxuICogR3JhcGggdmlldy1tb2RlbCAoRFRPKS5cbiAqXG4gKiBUaGUgRFRPIGlzIHRoZSBvbmx5IGdyYXBoIHNoYXBlIHRoZSB3ZWJ2aWV3IHVuZGVyc3RhbmRzLiBJdCBpcyBwbGFpbiBKU09OOlxuICogbm8gZnVuY3Rpb25zLCBubyBpZHMgdGhhdCByZXF1aXJlIGEgbG9va3VwLCBubyBzb3VyY2UgdGV4dC5cbiAqXG4gKiBTb3VyY2UgdGV4dCBpcyBmZXRjaGVkIG9uIGRlbWFuZCBpbiBQaGFzZSA1IHRocm91Z2ggYSBzZXBhcmF0ZSwgdmFsaWRhdGVkXG4gKiByZXF1ZXN0LiBLZWVwaW5nIHRoZSBEVE8gZnJlZSBvZiBzb3VyY2UgcHJldmVudHMgYWNjaWRlbnRhbCBsZWFrYWdlIGludG9cbiAqIGNhY2hlcyBhbmQga2VlcHMgbWVzc2FnZSBzaXplcyBwcmVkaWN0YWJsZS5cbiAqL1xuXG5pbXBvcnQgeyBjb21wdXRlTGF5b3V0IH0gZnJvbSAnLi9sYXlvdXQuanMnO1xuXG5leHBvcnQgY29uc3QgR1JBUEhfRFRPX1ZFUlNJT04gPSAxO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4vbW9kZWwuanMnKS5HcmFwaH0gR3JhcGhcbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IER0b05vZGVcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBpZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhYmVsXG4gKiBAcHJvcGVydHkge3N0cmluZ30ga2luZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IHN0YXR1c1xuICogQHByb3BlcnR5IHtzdHJpbmd9IGJhZGdlXG4gKiBAcHJvcGVydHkge2Jvb2xlYW59IGV4dGVybmFsXG4gKiBAcHJvcGVydHkge3tmaWxlSWQ6IHN0cmluZywgc3RhcnRMaW5lOiBudW1iZXIsIGVuZExpbmU6IG51bWJlcn0gfCBudWxsfSByYW5nZVxuICogQHByb3BlcnR5IHt7eDogbnVtYmVyLCB5OiBudW1iZXIsIHdpZHRoOiBudW1iZXIsIGhlaWdodDogbnVtYmVyLCBsYXllcjogbnVtYmVyfX0gcG9zaXRpb25cbiAqL1xuXG4vKipcbiAqIEB0eXBlZGVmIHtPYmplY3R9IEdyYXBoRHRvXG4gKiBAcHJvcGVydHkge251bWJlcn0gZHRvVmVyc2lvblxuICogQHByb3BlcnR5IHtzdHJpbmd9IGdyYXBoSWRcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBydW5JZFxuICogQHByb3BlcnR5IHtzdHJpbmd9IGxhbmd1YWdlXG4gKiBAcHJvcGVydHkge3N0cmluZ30gYWRhcHRlcklkXG4gKiBAcHJvcGVydHkge3N0cmluZ30gY29tcGxldGVuZXNzXG4gKiBAcHJvcGVydHkge0R0b05vZGVbXX0gbm9kZXNcbiAqIEBwcm9wZXJ0eSB7QXJyYXk8e2lkOiBzdHJpbmcsIGZyb206IHN0cmluZywgdG86IHN0cmluZywgdHlwZTogc3RyaW5nLCBzdGF0dXM6IHN0cmluZywgbGFiZWw6IHN0cmluZywgcmVhc29uQ29kZT86IHN0cmluZ30+fSBlZGdlc1xuICogQHByb3BlcnR5IHtBcnJheTx7Y29kZTogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcsIHNldmVyaXR5OiBzdHJpbmd9Pn0gZGlhZ25vc3RpY3NcbiAqIEBwcm9wZXJ0eSB7c3RyaW5nW119IGRlZ3JhZGF0aW9uc1xuICogQHByb3BlcnR5IHt7d2lkdGg6IG51bWJlciwgaGVpZ2h0OiBudW1iZXJ9fSBleHRlbnRcbiAqIEBwcm9wZXJ0eSB7e3N0YXR1c2VzOiBzdHJpbmdbXSwga2luZHM6IHN0cmluZ1tdfX0gbGVnZW5kXG4gKi9cblxuLyoqXG4gKiBAcGFyYW0ge0dyYXBofSBncmFwaFxuICogQHJldHVybnMge0dyYXBoRHRvfVxuICovXG5leHBvcnQgZnVuY3Rpb24gdG9EdG8oZ3JhcGgpIHtcbiAgY29uc3QgbGF5b3V0ID0gY29tcHV0ZUxheW91dChncmFwaCk7XG5cbiAgY29uc3Qgbm9kZXMgPSBncmFwaC5ub2Rlcy5tYXAoKG5vZGUpID0+ICh7XG4gICAgaWQ6IG5vZGUuaWQsXG4gICAgbGFiZWw6IG5vZGUubGFiZWwsXG4gICAga2luZDogbm9kZS5raW5kLFxuICAgIHN0YXR1czogbm9kZS5zdGF0dXMsXG4gICAgYmFkZ2U6IG5vZGUuYmFkZ2UgPz8gJycsXG4gICAgZXh0ZXJuYWw6IG5vZGUuZXh0ZXJuYWwsXG4gICAgcmFuZ2U6IG5vZGUucmFuZ2VcbiAgICAgID8ge1xuICAgICAgICAgIGZpbGVJZDogbm9kZS5yYW5nZS5maWxlSWQsXG4gICAgICAgICAgc3RhcnRMaW5lOiBub2RlLnJhbmdlLnN0YXJ0TGluZSxcbiAgICAgICAgICBlbmRMaW5lOiBub2RlLnJhbmdlLmVuZExpbmUsXG4gICAgICAgIH1cbiAgICAgIDogbnVsbCxcbiAgICBwb3NpdGlvbjogbGF5b3V0LnBvc2l0aW9uc1tub2RlLmlkXSA/PyB7IHg6IDAsIHk6IDAsIHdpZHRoOiAxOTAsIGhlaWdodDogNTQsIGxheWVyOiAwIH0sXG4gIH0pKTtcblxuICBjb25zdCBzdGF0dXNlcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5zdGF0dXMpKV0uc29ydCgpO1xuICBjb25zdCBraW5kcyA9IFsuLi5uZXcgU2V0KG5vZGVzLm1hcCgobm9kZSkgPT4gbm9kZS5raW5kKSldLnNvcnQoKTtcblxuICByZXR1cm4ge1xuICAgIGR0b1ZlcnNpb246IEdSQVBIX0RUT19WRVJTSU9OLFxuICAgIGdyYXBoSWQ6IGdyYXBoLmdyYXBoSWQsXG4gICAgcnVuSWQ6IGdyYXBoLnJ1bklkLFxuICAgIGxhbmd1YWdlOiBncmFwaC5sYW5ndWFnZSxcbiAgICBhZGFwdGVySWQ6IGdyYXBoLmFkYXB0ZXJJZCxcbiAgICBjb21wbGV0ZW5lc3M6IGdyYXBoLmNvbXBsZXRlbmVzcyxcbiAgICBub2RlcyxcbiAgICBlZGdlczogZ3JhcGguZWRnZXMubWFwKChlZGdlKSA9PiAoe1xuICAgICAgaWQ6IGVkZ2UuaWQsXG4gICAgICBmcm9tOiBlZGdlLmZyb20sXG4gICAgICB0bzogZWRnZS50byxcbiAgICAgIHR5cGU6IGVkZ2UudHlwZSxcbiAgICAgIHN0YXR1czogZWRnZS5zdGF0dXMsXG4gICAgICBsYWJlbDogZWRnZS5sYWJlbCxcbiAgICAgIHJlYXNvbkNvZGU6IGVkZ2UucmVhc29uQ29kZSA/PyBudWxsLFxuICAgIH0pKSxcbiAgICBkaWFnbm9zdGljczogZ3JhcGguZGlhZ25vc3RpY3MsXG4gICAgZGVncmFkYXRpb25zOiBncmFwaC5kZWdyYWRhdGlvbnMsXG4gICAgZXh0ZW50OiB7IHdpZHRoOiBsYXlvdXQud2lkdGgsIGhlaWdodDogbGF5b3V0LmhlaWdodCB9LFxuICAgIGxlZ2VuZDogeyBzdGF0dXNlcywga2luZHMgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3Vua25vd259IGR0b1xuICogQHJldHVybnMge3tvazogdHJ1ZSwgZHRvOiBHcmFwaER0b30gfCB7b2s6IGZhbHNlLCBpc3N1ZXM6IHN0cmluZ1tdfX1cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHZhbGlkYXRlRHRvKGR0bykge1xuICAvKiogQHR5cGUge3N0cmluZ1tdfSAqL1xuICBjb25zdCBpc3N1ZXMgPSBbXTtcbiAgaWYgKHR5cGVvZiBkdG8gIT09ICdvYmplY3QnIHx8IGR0byA9PT0gbnVsbCB8fCBBcnJheS5pc0FycmF5KGR0bykpIHtcbiAgICByZXR1cm4geyBvazogZmFsc2UsIGlzc3VlczogWydEVE8gbXVzdCBiZSBhbiBvYmplY3QuJ10gfTtcbiAgfVxuICBjb25zdCBjYW5kaWRhdGUgPSAvKiogQHR5cGUge1JlY29yZDxzdHJpbmcsIHVua25vd24+fSAqLyAoZHRvKTtcbiAgaWYgKGNhbmRpZGF0ZS5kdG9WZXJzaW9uICE9PSBHUkFQSF9EVE9fVkVSU0lPTikge1xuICAgIGlzc3Vlcy5wdXNoKGBVbnN1cHBvcnRlZCBkdG9WZXJzaW9uOiAke1N0cmluZyhjYW5kaWRhdGUuZHRvVmVyc2lvbil9LmApO1xuICB9XG4gIGNvbnN0IG5vZGVzID0gY2FuZGlkYXRlLm5vZGVzO1xuICBjb25zdCBlZGdlcyA9IGNhbmRpZGF0ZS5lZGdlcztcbiAgaWYgKCFBcnJheS5pc0FycmF5KG5vZGVzKSkge1xuICAgIGlzc3Vlcy5wdXNoKCdub2RlcyBtdXN0IGJlIGFuIGFycmF5LicpO1xuICB9XG4gIGlmICghQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBpc3N1ZXMucHVzaCgnZWRnZXMgbXVzdCBiZSBhbiBhcnJheS4nKTtcbiAgfVxuICBpZiAoQXJyYXkuaXNBcnJheShub2RlcykgJiYgQXJyYXkuaXNBcnJheShlZGdlcykpIHtcbiAgICBjb25zdCBpZHMgPSBuZXcgU2V0KCk7XG4gICAgZm9yIChjb25zdCBub2RlIG9mIG5vZGVzKSB7XG4gICAgICBjb25zdCBpZCA9IC8qKiBAdHlwZSB7UmVjb3JkPHN0cmluZywgdW5rbm93bj59ICovIChub2RlKS5pZDtcbiAgICAgIGlmICh0eXBlb2YgaWQgIT09ICdzdHJpbmcnKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKCdFdmVyeSBub2RlIG5lZWRzIGEgc3RyaW5nIGlkLicpO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmIChpZHMuaGFzKGlkKSkge1xuICAgICAgICBpc3N1ZXMucHVzaChgRHVwbGljYXRlIG5vZGUgaWQgXCIke2lkfVwiLmApO1xuICAgICAgfVxuICAgICAgaWRzLmFkZChpZCk7XG4gICAgfVxuICAgIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcykge1xuICAgICAgY29uc3QgcmVjb3JkID0gLyoqIEB0eXBlIHtSZWNvcmQ8c3RyaW5nLCB1bmtub3duPn0gKi8gKGVkZ2UpO1xuICAgICAgaWYgKHR5cGVvZiByZWNvcmQuZnJvbSAhPT0gJ3N0cmluZycgfHwgIWlkcy5oYXMocmVjb3JkLmZyb20pKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtTdHJpbmcocmVjb3JkLmlkKX1cIiBoYXMgYW4gdW5rbm93biBzb3VyY2Ugbm9kZS5gKTtcbiAgICAgIH1cbiAgICAgIGlmICh0eXBlb2YgcmVjb3JkLnRvICE9PSAnc3RyaW5nJyB8fCAhaWRzLmhhcyhyZWNvcmQudG8pKSB7XG4gICAgICAgIGlzc3Vlcy5wdXNoKGBFZGdlIFwiJHtTdHJpbmcocmVjb3JkLmlkKX1cIiBoYXMgYW4gdW5rbm93biB0YXJnZXQgbm9kZS5gKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgaWYgKGlzc3Vlcy5sZW5ndGggPiAwKSB7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBpc3N1ZXMgfTtcbiAgfVxuICByZXR1cm4geyBvazogdHJ1ZSwgZHRvOiAvKiogQHR5cGUge0dyYXBoRHRvfSAqLyAoZHRvKSB9O1xufVxuXG4vKipcbiAqIEBwYXJhbSB7R3JhcGhEdG99IGR0b1xuICogQHJldHVybnMge3N0cmluZ31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHNlcmlhbGl6ZUR0byhkdG8pIHtcbiAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KGR0byk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGpzb25cbiAqIEByZXR1cm5zIHtHcmFwaER0b31cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHBhcnNlRHRvKGpzb24pIHtcbiAgY29uc3QgcGFyc2VkID0gSlNPTi5wYXJzZShqc29uKTtcbiAgY29uc3QgdmFsaWRhdGlvbiA9IHZhbGlkYXRlRHRvKHBhcnNlZCk7XG4gIGlmICghdmFsaWRhdGlvbi5vaykge1xuICAgIHRocm93IG5ldyBFcnJvcihgSW52YWxpZCBncmFwaCBEVE86ICR7dmFsaWRhdGlvbi5pc3N1ZXMuam9pbignOyAnKX1gKTtcbiAgfVxuICByZXR1cm4gdmFsaWRhdGlvbi5kdG87XG59XG4iLCAiLyoqXG4gKiBTVkcgcmVuZGVyZXIuXG4gKlxuICogUGhhc2UgMCByZW5kZXJlcjogZGV0ZXJtaW5pc3RpYyBsYXllcmVkIHBvc2l0aW9ucyBjb21lIGZyb20gdGhlIERUTywgc28gdGhpc1xuICogbW9kdWxlIG9ubHkgZHJhd3MuIEl0IGhhcyBubyBrbm93bGVkZ2Ugb2YgYW5hbHlzaXMsIGFkYXB0ZXJzLCBvciB0aGUgcHJvdG9jb2wuXG4gKlxuICogS2VwdCBiZWhpbmQgYSBzbWFsbCBpbnRlcmZhY2UgKGByZW5kZXJgLCBgc2VsZWN0YCwgYGRlc3Ryb3lgKSBiZWNhdXNlIFBoYXNlIDRcbiAqIGJlbmNobWFya3MgQ3l0b3NjYXBlL0VMSyBhbmQgbWF5IHJlcGxhY2UgdGhlIGltcGxlbWVudGF0aW9uLiBDYWxsZXJzIG11c3Qgbm90XG4gKiBkZXBlbmQgb24gU1ZHIGludGVybmFscy5cbiAqL1xuXG5jb25zdCBTVkdfTlMgPSAnaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnO1xuXG4vKipcbiAqIEB0eXBlZGVmIHtpbXBvcnQoJy4uLy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IEdyYXBoRHRvXG4gKiBAdHlwZWRlZiB7aW1wb3J0KCcuLi8uLi9jb3JlL2dyYXBoL2R0by5qcycpLkR0b05vZGV9IER0b05vZGVcbiAqL1xuXG4vKipcbiAqIEBwYXJhbSB7c3RyaW5nfSBuYW1lXG4gKiBAcGFyYW0ge1JlY29yZDxzdHJpbmcsIHN0cmluZyB8IG51bWJlcj59IFthdHRyaWJ1dGVzXVxuICogQHJldHVybnMge1NWR0VsZW1lbnR9XG4gKi9cbmZ1bmN0aW9uIHN2Z0VsKG5hbWUsIGF0dHJpYnV0ZXMgPSB7fSkge1xuICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFNWR19OUywgbmFtZSk7XG4gIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKGF0dHJpYnV0ZXMpKSB7XG4gICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoa2V5LCBTdHJpbmcodmFsdWUpKTtcbiAgfVxuICByZXR1cm4gZWxlbWVudDtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEBwYXJhbSB7bnVtYmVyfSBtYXhcbiAqIEByZXR1cm5zIHtzdHJpbmd9XG4gKi9cbmZ1bmN0aW9uIHRydW5jYXRlKHZhbHVlLCBtYXgpIHtcbiAgY29uc3QgdGV4dCA9IFN0cmluZyh2YWx1ZSA/PyAnJyk7XG4gIHJldHVybiB0ZXh0Lmxlbmd0aCA+IG1heCA/IGAke3RleHQuc2xpY2UoMCwgbWF4IC0gMSl9XHUyMDI2YCA6IHRleHQ7XG59XG5cbi8qKlxuICogQHBhcmFtIHt7c3ZnOiBTVkdTVkdFbGVtZW50LCBvblNlbGVjdDogKG5vZGVJZDogc3RyaW5nLCBub2RlOiBEdG9Ob2RlKSA9PiB2b2lkfX0gb3B0aW9uc1xuICovXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU3ZnUmVuZGVyZXIoeyBzdmcsIG9uU2VsZWN0IH0pIHtcbiAgLyoqIEB0eXBlIHtHcmFwaER0byB8IG51bGx9ICovXG4gIGxldCBkdG8gPSBudWxsO1xuICAvKiogQHR5cGUge1NWR0dFbGVtZW50IHwgbnVsbH0gKi9cbiAgbGV0IHZpZXdwb3J0ID0gbnVsbDtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTVkdHRWxlbWVudD59ICovXG4gIGNvbnN0IG5vZGVFbGVtZW50cyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtNYXA8c3RyaW5nLCBTVkdQYXRoRWxlbWVudD59ICovXG4gIGNvbnN0IGVkZ2VFbGVtZW50cyA9IG5ldyBNYXAoKTtcbiAgLyoqIEB0eXBlIHtzdHJpbmcgfCBudWxsfSAqL1xuICBsZXQgc2VsZWN0ZWRJZCA9IG51bGw7XG5cbiAgbGV0IHNjYWxlID0gMTtcbiAgbGV0IHRyYW5zbGF0ZVggPSAwO1xuICBsZXQgdHJhbnNsYXRlWSA9IDA7XG4gIGxldCBkcmFnZ2luZyA9IGZhbHNlO1xuICBsZXQgZHJhZ1N0YXJ0ID0geyB4OiAwLCB5OiAwLCB0eDogMCwgdHk6IDAgfTtcblxuICBmdW5jdGlvbiBhcHBseVRyYW5zZm9ybSgpIHtcbiAgICBpZiAodmlld3BvcnQpIHtcbiAgICAgIHZpZXdwb3J0LnNldEF0dHJpYnV0ZShcbiAgICAgICAgJ3RyYW5zZm9ybScsXG4gICAgICAgIGB0cmFuc2xhdGUoJHt0cmFuc2xhdGVYLnRvRml4ZWQoMil9ICR7dHJhbnNsYXRlWS50b0ZpeGVkKDIpfSkgc2NhbGUoJHtzY2FsZS50b0ZpeGVkKDMpfSlgLFxuICAgICAgKTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBub2RlUG9pbnQobm9kZSwgc2lkZSkge1xuICAgIGlmIChzaWRlID09PSAnb3V0Jykge1xuICAgICAgcmV0dXJuIHsgeDogbm9kZS5wb3NpdGlvbi54ICsgbm9kZS5wb3NpdGlvbi53aWR0aCwgeTogbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyIH07XG4gICAgfVxuICAgIHJldHVybiB7IHg6IG5vZGUucG9zaXRpb24ueCwgeTogbm9kZS5wb3NpdGlvbi55ICsgbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyIH07XG4gIH1cblxuICBmdW5jdGlvbiBlZGdlUGF0aChzb3VyY2UsIHRhcmdldCkge1xuICAgIGlmIChzb3VyY2UuaWQgPT09IHRhcmdldC5pZCkge1xuICAgICAgY29uc3QgeyB4LCB5LCB3aWR0aCwgaGVpZ2h0IH0gPSBzb3VyY2UucG9zaXRpb247XG4gICAgICBjb25zdCBjeCA9IHggKyB3aWR0aCAvIDI7XG4gICAgICBjb25zdCBzdGFydFkgPSB5IC0gMjtcbiAgICAgIHJldHVybiBgTSAke2N4fSAke3N0YXJ0WX0gQyAke2N4IC0gNDZ9ICR7eSAtIDYwfSwgJHtjeCArIDQ2fSAke3kgLSA2MH0sICR7Y3h9ICR7eSArIGhlaWdodCArIDJ9YDtcbiAgICB9XG4gICAgY29uc3QgZnJvbSA9IG5vZGVQb2ludChzb3VyY2UsICdvdXQnKTtcbiAgICBjb25zdCB0byA9IG5vZGVQb2ludCh0YXJnZXQsICdpbicpO1xuICAgIGNvbnN0IGJlbmQgPSBNYXRoLm1heCgzNiwgTWF0aC5hYnModG8ueCAtIGZyb20ueCkgLyAyKTtcbiAgICByZXR1cm4gYE0gJHtmcm9tLnh9ICR7ZnJvbS55fSBDICR7ZnJvbS54ICsgYmVuZH0gJHtmcm9tLnl9LCAke3RvLnggLSBiZW5kfSAke3RvLnl9LCAke3RvLnh9ICR7dG8ueX1gO1xuICB9XG5cbiAgZnVuY3Rpb24gY2xlYXIoKSB7XG4gICAgaWYgKHZpZXdwb3J0KSB7XG4gICAgICBzdmcucmVtb3ZlQ2hpbGQodmlld3BvcnQpO1xuICAgIH1cbiAgICB2aWV3cG9ydCA9IHN2Z0VsKCdnJywgeyBjbGFzczogJ2NmLXZpZXdwb3J0JyB9KTtcbiAgICBzdmcuYXBwZW5kQ2hpbGQodmlld3BvcnQpO1xuICAgIG5vZGVFbGVtZW50cy5jbGVhcigpO1xuICAgIGVkZ2VFbGVtZW50cy5jbGVhcigpO1xuICAgIHNlbGVjdGVkSWQgPSBudWxsO1xuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0KG5vZGVJZCkge1xuICAgIHNlbGVjdGVkSWQgPSBub2RlSWQ7XG4gICAgZm9yIChjb25zdCBbaWQsIGVsZW1lbnRdIG9mIG5vZGVFbGVtZW50cykge1xuICAgICAgZWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKCdpcy1zZWxlY3RlZCcsIGlkID09PSBub2RlSWQpO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IFssIGVsZW1lbnRdIG9mIGVkZ2VFbGVtZW50cykge1xuICAgICAgY29uc3QgYWN0aXZlID1cbiAgICAgICAgbm9kZUlkICE9PSBudWxsICYmXG4gICAgICAgIChlbGVtZW50LmRhdGFzZXQuZnJvbSA9PT0gbm9kZUlkIHx8IGVsZW1lbnQuZGF0YXNldC50byA9PT0gbm9kZUlkKTtcbiAgICAgIGVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtYWN0aXZlJywgYWN0aXZlKTtcbiAgICB9XG4gICAgaWYgKHNlbGVjdGVkSWQgJiYgbm9kZUVsZW1lbnRzLmhhcyhzZWxlY3RlZElkKSkge1xuICAgICAgY29uc3Qgbm9kZSA9IC8qKiBAdHlwZSB7RHRvTm9kZX0gKi8gKGR0bz8ubm9kZXMuZmluZCgoaXRlbSkgPT4gaXRlbS5pZCA9PT0gc2VsZWN0ZWRJZCkpO1xuICAgICAgb25TZWxlY3Qoc2VsZWN0ZWRJZCwgbm9kZSk7XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gem9vbVRvRml0KCkge1xuICAgIGlmICghZHRvIHx8ICF2aWV3cG9ydCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBib3VuZHMgPSBzdmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgY29uc3QgcGFkZGluZyA9IDQ4O1xuICAgIGNvbnN0IHdpZHRoID0gTWF0aC5tYXgoMSwgZHRvLmV4dGVudC53aWR0aCk7XG4gICAgY29uc3QgaGVpZ2h0ID0gTWF0aC5tYXgoMSwgZHRvLmV4dGVudC5oZWlnaHQpO1xuICAgIGNvbnN0IGF2YWlsYWJsZVdpZHRoID0gTWF0aC5tYXgoMTIwLCBib3VuZHMud2lkdGggLSBwYWRkaW5nICogMik7XG4gICAgY29uc3QgYXZhaWxhYmxlSGVpZ2h0ID0gTWF0aC5tYXgoMTIwLCBib3VuZHMuaGVpZ2h0IC0gcGFkZGluZyAqIDIpO1xuICAgIHNjYWxlID0gTWF0aC5taW4oMS40LCBhdmFpbGFibGVXaWR0aCAvIHdpZHRoLCBhdmFpbGFibGVIZWlnaHQgLyBoZWlnaHQpO1xuICAgIHNjYWxlID0gTWF0aC5tYXgoMC4xNSwgc2NhbGUpO1xuICAgIHRyYW5zbGF0ZVggPSAoYm91bmRzLndpZHRoIC0gd2lkdGggKiBzY2FsZSkgLyAyO1xuICAgIHRyYW5zbGF0ZVkgPSAoYm91bmRzLmhlaWdodCAtIGhlaWdodCAqIHNjYWxlKSAvIDI7XG4gICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBAcGFyYW0ge0dyYXBoRHRvfSBuZXh0RHRvXG4gICAqL1xuICBmdW5jdGlvbiByZW5kZXIobmV4dER0bykge1xuICAgIGR0byA9IG5leHREdG87XG4gICAgY2xlYXIoKTtcbiAgICBpZiAoIXZpZXdwb3J0KSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgY29uc3QgYnlJZCA9IG5ldyBNYXAoZHRvLm5vZGVzLm1hcCgobm9kZSkgPT4gW25vZGUuaWQsIG5vZGVdKSk7XG5cbiAgICBmb3IgKGNvbnN0IGVkZ2Ugb2YgZHRvLmVkZ2VzKSB7XG4gICAgICBjb25zdCBzb3VyY2UgPSBieUlkLmdldChlZGdlLmZyb20pO1xuICAgICAgY29uc3QgdGFyZ2V0ID0gYnlJZC5nZXQoZWRnZS50byk7XG4gICAgICBpZiAoIXNvdXJjZSB8fCAhdGFyZ2V0KSB7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgY29uc3QgcGF0aCA9IC8qKiBAdHlwZSB7U1ZHUGF0aEVsZW1lbnR9ICovIChcbiAgICAgICAgc3ZnRWwoJ3BhdGgnLCB7XG4gICAgICAgICAgY2xhc3M6IGBjZi1lZGdlIGNmLWVkZ2UtLSR7ZWRnZS5zdGF0dXN9YCxcbiAgICAgICAgICBkOiBlZGdlUGF0aChzb3VyY2UsIHRhcmdldCksXG4gICAgICAgICAgJ2RhdGEtZnJvbSc6IGVkZ2UuZnJvbSxcbiAgICAgICAgICAnZGF0YS10byc6IGVkZ2UudG8sXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgICAgcGF0aC5kYXRhc2V0LmZyb20gPSBlZGdlLmZyb207XG4gICAgICBwYXRoLmRhdGFzZXQudG8gPSBlZGdlLnRvO1xuICAgICAgY29uc3QgdGl0bGUgPSBzdmdFbCgndGl0bGUnKTtcbiAgICAgIHRpdGxlLnRleHRDb250ZW50ID0gYCR7ZWRnZS50eXBlfSAoJHtlZGdlLnN0YXR1c30pJHtlZGdlLnJlYXNvbkNvZGUgPyBgOiAke2VkZ2UucmVhc29uQ29kZX1gIDogJyd9YDtcbiAgICAgIHBhdGguYXBwZW5kQ2hpbGQodGl0bGUpO1xuICAgICAgdmlld3BvcnQuYXBwZW5kQ2hpbGQocGF0aCk7XG4gICAgICBlZGdlRWxlbWVudHMuc2V0KGVkZ2UuaWQsIHBhdGgpO1xuICAgIH1cblxuICAgIGZvciAoY29uc3Qgbm9kZSBvZiBkdG8ubm9kZXMpIHtcbiAgICAgIGNvbnN0IGdyb3VwID0gLyoqIEB0eXBlIHtTVkdHRWxlbWVudH0gKi8gKFxuICAgICAgICBzdmdFbCgnZycsIHtcbiAgICAgICAgICBjbGFzczogYGNmLW5vZGUgY2Ytbm9kZS0tJHtub2RlLnN0YXR1c30ke25vZGUuZXh0ZXJuYWwgPyAnIGNmLW5vZGUtLWV4dGVybmFsJyA6ICcnfWAsXG4gICAgICAgICAgdHJhbnNmb3JtOiBgdHJhbnNsYXRlKCR7bm9kZS5wb3NpdGlvbi54fSAke25vZGUucG9zaXRpb24ueX0pYCxcbiAgICAgICAgICB0YWJpbmRleDogJzAnLFxuICAgICAgICAgIHJvbGU6ICdidXR0b24nLFxuICAgICAgICAgICdhcmlhLWxhYmVsJzogYCR7bm9kZS5raW5kfSAke25vZGUubGFiZWx9LCAke25vZGUuc3RhdHVzfSR7XG4gICAgICAgICAgICBub2RlLmV4dGVybmFsID8gJywgZXh0ZXJuYWwgdGFyZ2V0JyA6ICcnXG4gICAgICAgICAgfWAsXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBncm91cC5hcHBlbmRDaGlsZChcbiAgICAgICAgc3ZnRWwoJ3JlY3QnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJveCcsXG4gICAgICAgICAgd2lkdGg6IG5vZGUucG9zaXRpb24ud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiBub2RlLnBvc2l0aW9uLmhlaWdodCxcbiAgICAgICAgICByeDogNixcbiAgICAgICAgICByeTogNixcbiAgICAgICAgfSksXG4gICAgICApO1xuXG4gICAgICBjb25zdCBsYWJlbCA9IHN2Z0VsKCd0ZXh0Jywge1xuICAgICAgICBjbGFzczogJ2NmLW5vZGUtbGFiZWwnLFxuICAgICAgICB4OiAxMCxcbiAgICAgICAgeTogbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyIC0gMSxcbiAgICAgIH0pO1xuICAgICAgbGFiZWwudGV4dENvbnRlbnQgPSB0cnVuY2F0ZShub2RlLmxhYmVsLCAyNik7XG4gICAgICBncm91cC5hcHBlbmRDaGlsZChsYWJlbCk7XG5cbiAgICAgIGNvbnN0IGtpbmQgPSBzdmdFbCgndGV4dCcsIHtcbiAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWtpbmQnLFxuICAgICAgICB4OiAxMCxcbiAgICAgICAgeTogbm9kZS5wb3NpdGlvbi5oZWlnaHQgLyAyICsgMTMsXG4gICAgICB9KTtcbiAgICAgIGtpbmQudGV4dENvbnRlbnQgPSBub2RlLmV4dGVybmFsID8gYCR7bm9kZS5raW5kfSBcdTAwQjcgZXh0ZXJuYWxgIDogbm9kZS5raW5kO1xuICAgICAgZ3JvdXAuYXBwZW5kQ2hpbGQoa2luZCk7XG5cbiAgICAgIGlmIChub2RlLmJhZGdlIHx8IG5vZGUuc3RhdHVzICE9PSAncmVzb2x2ZWQnKSB7XG4gICAgICAgIGNvbnN0IGJhZGdlID0gc3ZnRWwoJ3RleHQnLCB7XG4gICAgICAgICAgY2xhc3M6ICdjZi1ub2RlLWJhZGdlJyxcbiAgICAgICAgICB4OiBub2RlLnBvc2l0aW9uLndpZHRoIC0gOCxcbiAgICAgICAgICB5OiAxMixcbiAgICAgICAgICAndGV4dC1hbmNob3InOiAnZW5kJyxcbiAgICAgICAgfSk7XG4gICAgICAgIGJhZGdlLnRleHRDb250ZW50ID0gdHJ1bmNhdGUobm9kZS5iYWRnZSB8fCBub2RlLnN0YXR1cywgMTgpO1xuICAgICAgICBncm91cC5hcHBlbmRDaGlsZChiYWRnZSk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHRpdGxlID0gc3ZnRWwoJ3RpdGxlJyk7XG4gICAgICB0aXRsZS50ZXh0Q29udGVudCA9IGAke25vZGUua2luZH0gJHtub2RlLmxhYmVsfVxcbnN0YXR1czogJHtub2RlLnN0YXR1c30ke1xuICAgICAgICBub2RlLnJhbmdlID8gYFxcbmxpbmVzICR7bm9kZS5yYW5nZS5zdGFydExpbmUgKyAxfS0ke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCA6ICcnXG4gICAgICB9YDtcbiAgICAgIGdyb3VwLmFwcGVuZENoaWxkKHRpdGxlKTtcblxuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoZXZlbnQpID0+IHtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgIHNlbGVjdChub2RlLmlkKTtcbiAgICAgIH0pO1xuICAgICAgZ3JvdXAuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIChldmVudCkgPT4ge1xuICAgICAgICBpZiAoZXZlbnQua2V5ID09PSAnRW50ZXInIHx8IGV2ZW50LmtleSA9PT0gJyAnKSB7XG4gICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICBzZWxlY3Qobm9kZS5pZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICB2aWV3cG9ydC5hcHBlbmRDaGlsZChncm91cCk7XG4gICAgICBub2RlRWxlbWVudHMuc2V0KG5vZGUuaWQsIGdyb3VwKTtcbiAgICB9XG5cbiAgICB6b29tVG9GaXQoKTtcbiAgfVxuXG4gIGZ1bmN0aW9uIG1vdmVTZWxlY3Rpb24oZGlyZWN0aW9uKSB7XG4gICAgaWYgKCFkdG8gfHwgZHRvLm5vZGVzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBjb25zdCBjdXJyZW50ID0gc2VsZWN0ZWRJZCA/IGR0by5ub2Rlcy5maW5kKChub2RlKSA9PiBub2RlLmlkID09PSBzZWxlY3RlZElkKSA6IG51bGw7XG4gICAgaWYgKCFjdXJyZW50KSB7XG4gICAgICBjb25zdCBmaXJzdCA9IGR0by5ub2Rlc1swXTtcbiAgICAgIHNlbGVjdChmaXJzdC5pZCk7XG4gICAgICBub2RlRWxlbWVudHMuZ2V0KGZpcnN0LmlkKT8uZm9jdXMoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY29uc3Qgb3JpZ2luID0ge1xuICAgICAgeDogY3VycmVudC5wb3NpdGlvbi54ICsgY3VycmVudC5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICB5OiBjdXJyZW50LnBvc2l0aW9uLnkgKyBjdXJyZW50LnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgfTtcblxuICAgIGxldCBiZXN0ID0gbnVsbDtcbiAgICBsZXQgYmVzdFNjb3JlID0gTnVtYmVyLlBPU0lUSVZFX0lORklOSVRZO1xuICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIGR0by5ub2Rlcykge1xuICAgICAgaWYgKGNhbmRpZGF0ZS5pZCA9PT0gY3VycmVudC5pZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHBvaW50ID0ge1xuICAgICAgICB4OiBjYW5kaWRhdGUucG9zaXRpb24ueCArIGNhbmRpZGF0ZS5wb3NpdGlvbi53aWR0aCAvIDIsXG4gICAgICAgIHk6IGNhbmRpZGF0ZS5wb3NpdGlvbi55ICsgY2FuZGlkYXRlLnBvc2l0aW9uLmhlaWdodCAvIDIsXG4gICAgICB9O1xuICAgICAgY29uc3QgZHggPSBwb2ludC54IC0gb3JpZ2luLng7XG4gICAgICBjb25zdCBkeSA9IHBvaW50LnkgLSBvcmlnaW4ueTtcbiAgICAgIGNvbnN0IGZvcndhcmQgPVxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgJiYgZHggPiA4KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyAmJiBkeCA8IC04KSB8fFxuICAgICAgICAoZGlyZWN0aW9uID09PSAnQXJyb3dEb3duJyAmJiBkeSA+IDgpIHx8XG4gICAgICAgIChkaXJlY3Rpb24gPT09ICdBcnJvd1VwJyAmJiBkeSA8IC04KTtcbiAgICAgIGlmICghZm9yd2FyZCkge1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHByaW1hcnkgPSBkaXJlY3Rpb24gPT09ICdBcnJvd1JpZ2h0JyB8fCBkaXJlY3Rpb24gPT09ICdBcnJvd0xlZnQnID8gTWF0aC5hYnMoZHgpIDogTWF0aC5hYnMoZHkpO1xuICAgICAgY29uc3Qgc2Vjb25kYXJ5ID0gZGlyZWN0aW9uID09PSAnQXJyb3dSaWdodCcgfHwgZGlyZWN0aW9uID09PSAnQXJyb3dMZWZ0JyA/IE1hdGguYWJzKGR5KSA6IE1hdGguYWJzKGR4KTtcbiAgICAgIGNvbnN0IHNjb3JlID0gcHJpbWFyeSArIHNlY29uZGFyeSAqIDIuMjtcbiAgICAgIGlmIChzY29yZSA8IGJlc3RTY29yZSkge1xuICAgICAgICBiZXN0U2NvcmUgPSBzY29yZTtcbiAgICAgICAgYmVzdCA9IGNhbmRpZGF0ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKGJlc3QpIHtcbiAgICAgIHNlbGVjdChiZXN0LmlkKTtcbiAgICAgIG5vZGVFbGVtZW50cy5nZXQoYmVzdC5pZCk/LmZvY3VzKCk7XG4gICAgfVxuICB9XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoXG4gICAgJ3doZWVsJyxcbiAgICAoZXZlbnQpID0+IHtcbiAgICAgIGlmICghZHRvKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBjb25zdCBib3VuZHMgPSBzdmcuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBwb2ludGVyWCA9IGV2ZW50LmNsaWVudFggLSBib3VuZHMubGVmdDtcbiAgICAgIGNvbnN0IHBvaW50ZXJZID0gZXZlbnQuY2xpZW50WSAtIGJvdW5kcy50b3A7XG4gICAgICBjb25zdCBmYWN0b3IgPSBldmVudC5kZWx0YVkgPCAwID8gMS4xMiA6IDEgLyAxLjEyO1xuICAgICAgY29uc3QgbmV4dFNjYWxlID0gTWF0aC5taW4oMy41LCBNYXRoLm1heCgwLjEyLCBzY2FsZSAqIGZhY3RvcikpO1xuICAgICAgY29uc3QgcmF0aW8gPSBuZXh0U2NhbGUgLyBzY2FsZTtcbiAgICAgIHRyYW5zbGF0ZVggPSBwb2ludGVyWCAtIChwb2ludGVyWCAtIHRyYW5zbGF0ZVgpICogcmF0aW87XG4gICAgICB0cmFuc2xhdGVZID0gcG9pbnRlclkgLSAocG9pbnRlclkgLSB0cmFuc2xhdGVZKSAqIHJhdGlvO1xuICAgICAgc2NhbGUgPSBuZXh0U2NhbGU7XG4gICAgICBhcHBseVRyYW5zZm9ybSgpO1xuICAgIH0sXG4gICAgeyBwYXNzaXZlOiBmYWxzZSB9LFxuICApO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVyZG93bicsIChldmVudCkgPT4ge1xuICAgIGlmIChldmVudC5idXR0b24gIT09IDApIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgZHJhZ2dpbmcgPSB0cnVlO1xuICAgIGRyYWdTdGFydCA9IHsgeDogZXZlbnQuY2xpZW50WCwgeTogZXZlbnQuY2xpZW50WSwgdHg6IHRyYW5zbGF0ZVgsIHR5OiB0cmFuc2xhdGVZIH07XG4gICAgc3ZnLnNldFBvaW50ZXJDYXB0dXJlKGV2ZW50LnBvaW50ZXJJZCk7XG4gIH0pO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcm1vdmUnLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoIWRyYWdnaW5nKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIHRyYW5zbGF0ZVggPSBkcmFnU3RhcnQudHggKyAoZXZlbnQuY2xpZW50WCAtIGRyYWdTdGFydC54KTtcbiAgICB0cmFuc2xhdGVZID0gZHJhZ1N0YXJ0LnR5ICsgKGV2ZW50LmNsaWVudFkgLSBkcmFnU3RhcnQueSk7XG4gICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgfSk7XG4gIGNvbnN0IGVuZERyYWcgPSAoZXZlbnQpID0+IHtcbiAgICBkcmFnZ2luZyA9IGZhbHNlO1xuICAgIGlmIChzdmcuaGFzUG9pbnRlckNhcHR1cmUoZXZlbnQucG9pbnRlcklkKSkge1xuICAgICAgc3ZnLnJlbGVhc2VQb2ludGVyQ2FwdHVyZShldmVudC5wb2ludGVySWQpO1xuICAgIH1cbiAgfTtcbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJ1cCcsIGVuZERyYWcpO1xuICBzdmcuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmNhbmNlbCcsIGVuZERyYWcpO1xuXG4gIHN2Zy5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICBpZiAoc2VsZWN0ZWRJZCkge1xuICAgICAgc2VsZWN0KG51bGwpO1xuICAgIH1cbiAgfSk7XG5cbiAgc3ZnLmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCAoZXZlbnQpID0+IHtcbiAgICBpZiAoZXZlbnQua2V5LnN0YXJ0c1dpdGgoJ0Fycm93JykpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBtb3ZlU2VsZWN0aW9uKGV2ZW50LmtleSk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChldmVudC5rZXkgPT09ICcrJyB8fCBldmVudC5rZXkgPT09ICc9Jykge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNjYWxlID0gTWF0aC5taW4oMy41LCBzY2FsZSAqIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJy0nKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2NhbGUgPSBNYXRoLm1heCgwLjEyLCBzY2FsZSAvIDEuMTUpO1xuICAgICAgYXBwbHlUcmFuc2Zvcm0oKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGV2ZW50LmtleSA9PT0gJzAnKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgem9vbVRvRml0KCk7XG4gICAgfVxuICB9KTtcblxuICByZXR1cm4ge1xuICAgIHJlbmRlcixcbiAgICBzZWxlY3QsXG4gICAgem9vbVRvRml0LFxuICAgIGRlc3Ryb3koKSB7XG4gICAgICBjbGVhcigpO1xuICAgICAgZHRvID0gbnVsbDtcbiAgICB9LFxuICB9O1xufVxuIiwgIi8qKlxuICogV2VidmlldyBlbnRyeSBwb2ludC5cbiAqXG4gKiBSZXNwb25zaWJpbGl0aWVzIGFyZSBkZWxpYmVyYXRlbHkgbmFycm93OiB0YWxrIHByb3RvY29sLCByZW5kZXIgdGhlIERUTywgc2hvd1xuICogc2VsZWN0aW9uIGRldGFpbHMuIE5vIGFuYWx5c2lzLCBubyBmaWxlIGFjY2Vzcywgbm8gZ3JhcGggY29uc3RydWN0aW9uLlxuICovXG5cbmltcG9ydCB7IGNyZWF0ZUJyaWRnZSB9IGZyb20gJy4uL2NvcmUvcHJvdG9jb2wvYnJpZGdlLmpzJztcbmltcG9ydCB7IERJUkVDVElPTlMsIFBST1RPQ09MX1ZFUlNJT04gfSBmcm9tICcuLi9jb3JlL3Byb3RvY29sL2VudmVsb3BlLmpzJztcbmltcG9ydCB7IHZhbGlkYXRlRHRvIH0gZnJvbSAnLi4vY29yZS9ncmFwaC9kdG8uanMnO1xuaW1wb3J0IHsgY3JlYXRlU3ZnUmVuZGVyZXIgfSBmcm9tICcuLi92aXN1YWxpemF0aW9uL3JlbmRlcmVyL3N2Z1JlbmRlcmVyLmpzJztcblxuY29uc3QgdnNjb2RlQXBpID0gYWNxdWlyZVZzQ29kZUFwaSgpO1xuXG5jb25zdCBzdmcgPSAvKiogQHR5cGUge1NWR1NWR0VsZW1lbnR9ICovIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2YtZ3JhcGgnKSk7XG5jb25zdCBtZXRhID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1tZXRhJykpO1xuY29uc3Qgc3RhdHVzID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1zdGF0dXMnKSk7XG5jb25zdCBiYW5uZXIgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWJhbm5lcicpKTtcbmNvbnN0IGVtcHR5ID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1lbXB0eScpKTtcbmNvbnN0IGRldGFpbEJvZHkgPSAvKiogQHR5cGUge0hUTUxFbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLWRldGFpbC1ib2R5JykpO1xuY29uc3QgbGVnZW5kID0gLyoqIEB0eXBlIHtIVE1MRWxlbWVudH0gKi8gKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjZi1sZWdlbmQnKSk7XG5jb25zdCByZWxvYWRCdXR0b24gPSAvKiogQHR5cGUge0hUTUxCdXR0b25FbGVtZW50fSAqLyAoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NmLXJlZnJlc2gnKSk7XG5cbi8qKiBAdHlwZSB7aW1wb3J0KCcuLi9jb3JlL2dyYXBoL2R0by5qcycpLkdyYXBoRHRvIHwgbnVsbH0gKi9cbmxldCBjdXJyZW50RHRvID0gbnVsbDtcblxuY29uc3QgcmVuZGVyZXIgPSBjcmVhdGVTdmdSZW5kZXJlcih7XG4gIHN2ZyxcbiAgb25TZWxlY3Q6IChub2RlSWQsIG5vZGUpID0+IHtcbiAgICBzaG93Tm9kZURldGFpbHMobm9kZUlkLCBub2RlKTtcbiAgICBicmlkZ2UucmVzcG9uZCgnbm9kZS5zZWxlY3QnLCB7IG5vZGVJZCB9KTtcbiAgfSxcbn0pO1xuXG5jb25zdCBicmlkZ2UgPSBjcmVhdGVCcmlkZ2Uoe1xuICBwb3N0OiAobWVzc2FnZSkgPT4gdnNjb2RlQXBpLnBvc3RNZXNzYWdlKG1lc3NhZ2UpLFxuICBpbmJvdW5kRGlyZWN0aW9uOiBESVJFQ1RJT05TLkhPU1RfVE9fV0VCVklFVyxcbiAgdGltZW91dE1zOiA4MDAwLFxuICBsb2dnZXI6IHtcbiAgICBkZWJ1ZzogKCkgPT4ge30sXG4gICAgd2FybjogKG1lc3NhZ2UsIGZpZWxkcykgPT4gY29uc29sZS53YXJuKCdbY29kZWZsb3ddJywgbWVzc2FnZSwgZmllbGRzKSxcbiAgICBlcnJvcjogKG1lc3NhZ2UsIGZpZWxkcykgPT4gY29uc29sZS5lcnJvcignW2NvZGVmbG93XScsIG1lc3NhZ2UsIGZpZWxkcyksXG4gIH0sXG59KTtcblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZVxuICogQHBhcmFtIHtib29sZWFufSBbaXNFcnJvcl1cbiAqL1xuZnVuY3Rpb24gc2V0QmFubmVyKG1lc3NhZ2UsIGlzRXJyb3IgPSBmYWxzZSkge1xuICBpZiAoIW1lc3NhZ2UpIHtcbiAgICBiYW5uZXIuaGlkZGVuID0gdHJ1ZTtcbiAgICBiYW5uZXIudGV4dENvbnRlbnQgPSAnJztcbiAgICByZXR1cm47XG4gIH1cbiAgYmFubmVyLmhpZGRlbiA9IGZhbHNlO1xuICBiYW5uZXIuY2xhc3NMaXN0LnRvZ2dsZSgnaXMtZXJyb3InLCBpc0Vycm9yKTtcbiAgYmFubmVyLnRleHRDb250ZW50ID0gbWVzc2FnZTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFxuICovXG5mdW5jdGlvbiBzZXRTdGF0dXModGV4dCkge1xuICBzdGF0dXMudGV4dENvbnRlbnQgPSB0ZXh0O1xufVxuXG5mdW5jdGlvbiBjbGVhckRldGFpbCgpIHtcbiAgZGV0YWlsQm9keS5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgY29uc3QgcGFyYWdyYXBoID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgncCcpO1xuICBwYXJhZ3JhcGguY2xhc3NOYW1lID0gJ2NmLW11dGVkJztcbiAgcGFyYWdyYXBoLnRleHRDb250ZW50ID0gJ1NlbGVjdCBhIG5vZGUgdG8gaW5zcGVjdCBpdC4nO1xuICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKHBhcmFncmFwaCk7XG59XG5cbi8qKlxuICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsXG4gKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVcbiAqIEByZXR1cm5zIHtbSFRNTEVsZW1lbnQsIEhUTUxFbGVtZW50XX1cbiAqL1xuZnVuY3Rpb24gZGV0YWlsUGFpcihsYWJlbCwgdmFsdWUpIHtcbiAgY29uc3QgdGVybSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2R0Jyk7XG4gIHRlcm0udGV4dENvbnRlbnQgPSBsYWJlbDtcbiAgY29uc3QgZGVzY3JpcHRpb24gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkZCcpO1xuICBkZXNjcmlwdGlvbi50ZXh0Q29udGVudCA9IHZhbHVlO1xuICByZXR1cm4gW3Rlcm0sIGRlc2NyaXB0aW9uXTtcbn1cblxuLyoqXG4gKiBAcGFyYW0ge3N0cmluZ30gbm9kZUlkXG4gKiBAcGFyYW0ge2ltcG9ydCgnLi4vY29yZS9ncmFwaC9kdG8uanMnKS5EdG9Ob2RlfSBbbm9kZV1cbiAqL1xuZnVuY3Rpb24gc2hvd05vZGVEZXRhaWxzKG5vZGVJZCwgbm9kZSkge1xuICBpZiAoIW5vZGVJZCB8fCAhbm9kZSkge1xuICAgIGNsZWFyRGV0YWlsKCk7XG4gICAgcmV0dXJuO1xuICB9XG4gIGNvbnN0IGxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkbCcpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdsYWJlbCcsIG5vZGUubGFiZWwpKTtcbiAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigna2luZCcsIG5vZGUua2luZCkpO1xuICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdzdGF0dXMnLCBub2RlLnN0YXR1cykpO1xuICBpZiAobm9kZS5leHRlcm5hbCkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ29yaWdpbicsICdleHRlcm5hbCB0YXJnZXQgKG5vdCBkZWNsYXJlZCBpbiB0aGUgYW5hbHlzaXMpJykpO1xuICB9XG4gIGlmIChub2RlLnJhbmdlKSB7XG4gICAgbGlzdC5hcHBlbmQoXG4gICAgICAuLi5kZXRhaWxQYWlyKCdsaW5lcycsIGAke25vZGUucmFuZ2Uuc3RhcnRMaW5lICsgMX1cdTIwMTMke25vZGUucmFuZ2UuZW5kTGluZSArIDF9YCksXG4gICAgKTtcbiAgICBsaXN0LmFwcGVuZCguLi5kZXRhaWxQYWlyKCdmaWxlJywgbm9kZS5yYW5nZS5maWxlSWQpKTtcbiAgfVxuICBpZiAobm9kZS5iYWRnZSkge1xuICAgIGxpc3QuYXBwZW5kKC4uLmRldGFpbFBhaXIoJ25vdGUnLCBub2RlLmJhZGdlKSk7XG4gIH1cblxuICBjb25zdCBlZGdlcyA9IChjdXJyZW50RHRvPy5lZGdlcyA/PyBbXSkuZmlsdGVyKFxuICAgIChlZGdlKSA9PiBlZGdlLmZyb20gPT09IG5vZGVJZCB8fCBlZGdlLnRvID09PSBub2RlSWQsXG4gICk7XG4gIGlmIChlZGdlcy5sZW5ndGggPiAwKSB7XG4gICAgbGlzdC5hcHBlbmQoLi4uZGV0YWlsUGFpcigncmVsYXRpb25zaGlwcycsIFN0cmluZyhlZGdlcy5sZW5ndGgpKSk7XG4gIH1cblxuICBkZXRhaWxCb2R5LnJlcGxhY2VDaGlsZHJlbihsaXN0KTtcblxuICBpZiAoZWRnZXMubGVuZ3RoID4gMCkge1xuICAgIGNvbnN0IGhlYWRpbmcgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdoMycpO1xuICAgIGhlYWRpbmcuY2xhc3NOYW1lID0gJ2NmLWRldGFpbC10aXRsZSc7XG4gICAgaGVhZGluZy50ZXh0Q29udGVudCA9ICdSZWxhdGlvbnNoaXBzJztcbiAgICBkZXRhaWxCb2R5LmFwcGVuZENoaWxkKGhlYWRpbmcpO1xuXG4gICAgY29uc3QgZWRnZUxpc3QgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd1bCcpO1xuICAgIGVkZ2VMaXN0LmNsYXNzTmFtZSA9ICdjZi1sZWdlbmQnO1xuICAgIGZvciAoY29uc3QgZWRnZSBvZiBlZGdlcy5zbGljZSgwLCAxMikpIHtcbiAgICAgIGNvbnN0IGl0ZW0gPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdsaScpO1xuICAgICAgY29uc3QgZGlyZWN0aW9uID0gZWRnZS5mcm9tID09PSBub2RlSWQgPyAnXHUyMTkyJyA6ICdcdTIxOTAnO1xuICAgICAgY29uc3Qgb3RoZXIgPSBlZGdlLmZyb20gPT09IG5vZGVJZCA/IGVkZ2UudG8gOiBlZGdlLmZyb207XG4gICAgICBpdGVtLnRleHRDb250ZW50ID0gYCR7ZGlyZWN0aW9ufSAke2VkZ2UudHlwZX0gXHUwMEI3ICR7b3RoZXJ9ICgke2VkZ2Uuc3RhdHVzfSlgO1xuICAgICAgZWRnZUxpc3QuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuICAgIGRldGFpbEJvZHkuYXBwZW5kQ2hpbGQoZWRnZUxpc3QpO1xuICB9XG59XG5cbi8qKlxuICogQHBhcmFtIHtpbXBvcnQoJy4uL2NvcmUvZ3JhcGgvZHRvLmpzJykuR3JhcGhEdG99IGR0b1xuICovXG5mdW5jdGlvbiByZW5kZXJMZWdlbmQoZHRvKSB7XG4gIGxlZ2VuZC5yZXBsYWNlQ2hpbGRyZW4oKTtcbiAgZm9yIChjb25zdCBzdGF0dXNOYW1lIG9mIGR0by5sZWdlbmQuc3RhdHVzZXMpIHtcbiAgICBjb25zdCBpdGVtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnbGknKTtcbiAgICBjb25zdCBzd2F0Y2ggPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgc3dhdGNoLmNsYXNzTmFtZSA9IGBjZi1zd2F0Y2ggY2YtZWRnZS0tJHtzdGF0dXNOYW1lfWA7XG4gICAgY29uc3QgbGFiZWwgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdzcGFuJyk7XG4gICAgbGFiZWwudGV4dENvbnRlbnQgPSBzdGF0dXNOYW1lO1xuICAgIGlmIChzdGF0dXNOYW1lICE9PSAncmVzb2x2ZWQnKSB7XG4gICAgICBsYWJlbC50ZXh0Q29udGVudCA9IGAke3N0YXR1c05hbWV9IChwYXR0ZXJuICsgbGFiZWwpYDtcbiAgICB9XG4gICAgaXRlbS5hcHBlbmQoc3dhdGNoLCBsYWJlbCk7XG4gICAgbGVnZW5kLmFwcGVuZENoaWxkKGl0ZW0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIHNob3dDYXBhYmlsaXRpZXMocGF5bG9hZCkge1xuICBjb25zdCBhZGFwdGVycyA9IEFycmF5LmlzQXJyYXkocGF5bG9hZC5hZGFwdGVycykgPyBwYXlsb2FkLmFkYXB0ZXJzIDogW107XG4gIGNvbnN0IG5hbWVzID0gYWRhcHRlcnMubWFwKChhZGFwdGVyKSA9PiBhZGFwdGVyLmlkKS5qb2luKCcsICcpIHx8ICdub25lJztcbiAgbWV0YS50ZXh0Q29udGVudCA9IGBNb2NrIGRhdGEgXHUwMEI3IGFkYXB0ZXJzOiAke25hbWVzfSBcdTAwQjcgcHJvdG9jb2wgdiR7cGF5bG9hZC5wcm90b2NvbFZlcnNpb24gPz8gJz8nfWA7XG59XG5cbi8qKlxuICogQHBhcmFtIHt1bmtub3dufSBwYXlsb2FkXG4gKi9cbmZ1bmN0aW9uIGhhbmRsZUdyYXBoKHBheWxvYWQpIHtcbiAgY29uc3QgZHRvQ2FuZGlkYXRlID0gLyoqIEB0eXBlIHt7ZHRvPzogdW5rbm93bn19ICovIChwYXlsb2FkKS5kdG87XG4gIGNvbnN0IHZhbGlkYXRpb24gPSB2YWxpZGF0ZUR0byhkdG9DYW5kaWRhdGUpO1xuICBpZiAoIXZhbGlkYXRpb24ub2spIHtcbiAgICBzZXRCYW5uZXIoYEludmFsaWQgZ3JhcGggcGF5bG9hZDogJHt2YWxpZGF0aW9uLmlzc3Vlc1swXX1gLCB0cnVlKTtcbiAgICBzZXRTdGF0dXMoJ1JlbmRlciBmYWlsZWQnKTtcbiAgICByZXR1cm47XG4gIH1cbiAgY29uc3QgZHRvID0gdmFsaWRhdGlvbi5kdG87XG4gIGN1cnJlbnREdG8gPSBkdG87XG4gIGVtcHR5LmhpZGRlbiA9IHRydWU7XG4gIHJlbmRlcmVyLnJlbmRlcihkdG8pO1xuICByZW5kZXJMZWdlbmQoZHRvKTtcbiAgY2xlYXJEZXRhaWwoKTtcbiAgc2V0U3RhdHVzKFxuICAgIGAke2R0by5sYW5ndWFnZX0gXHUwMEI3ICR7ZHRvLm5vZGVzLmxlbmd0aH0gbm9kZXMgXHUwMEI3ICR7ZHRvLmVkZ2VzLmxlbmd0aH0gZWRnZXMgXHUwMEI3ICR7ZHRvLmNvbXBsZXRlbmVzc31gLFxuICApO1xuICBjb25zdCBkZWdyYWRhdGlvbnMgPSBkdG8uZGVncmFkYXRpb25zID8/IFtdO1xuICBzZXRCYW5uZXIoZGVncmFkYXRpb25zLmxlbmd0aCA+IDAgPyBkZWdyYWRhdGlvbnMuam9pbignIFx1MDBCNyAnKSA6ICcnLCBmYWxzZSk7XG59XG5cbmJyaWRnZS5vbignZ3JhcGguZGF0YScsIChwYXlsb2FkKSA9PiB7XG4gIGhhbmRsZUdyYXBoKHBheWxvYWQpO1xufSk7XG5cbmJyaWRnZS5vbignY2FwYWJpbGl0aWVzLmRhdGEnLCAocGF5bG9hZCkgPT4ge1xuICBzaG93Q2FwYWJpbGl0aWVzKHBheWxvYWQpO1xufSk7XG5cbmJyaWRnZS5vbigncHJvdG9jb2wuZXJyb3InLCAocGF5bG9hZCkgPT4ge1xuICBjb25zdCBjb2RlID0gdHlwZW9mIHBheWxvYWQuY29kZSA9PT0gJ3N0cmluZycgPyBwYXlsb2FkLmNvZGUgOiAnRV9QUk9UT0NPTCc7XG4gIGNvbnN0IG1lc3NhZ2UgPSB0eXBlb2YgcGF5bG9hZC5tZXNzYWdlID09PSAnc3RyaW5nJyA/IHBheWxvYWQubWVzc2FnZSA6ICdVbmtub3duIGVycm9yLic7XG4gIHNldEJhbm5lcihgJHtjb2RlfTogJHttZXNzYWdlfWAsIHRydWUpO1xuICBzZXRTdGF0dXMoJ0Vycm9yJyk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gbG9hZEdyYXBoKCkge1xuICBzZXRTdGF0dXMoJ0xvYWRpbmcgZ3JhcGhcdTIwMjYnKTtcbiAgc2V0QmFubmVyKCcnKTtcbiAgdHJ5IHtcbiAgICBhd2FpdCBicmlkZ2UucmVxdWVzdCgnZ3JhcGgubG9hZCcsIHsgZGVtbzogdHJ1ZSB9KTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBzZXRCYW5uZXIoYENvdWxkIG5vdCBsb2FkIGdyYXBoOiAke2Vycm9yPy5tZXNzYWdlID8/IFN0cmluZyhlcnJvcil9YCwgdHJ1ZSk7XG4gICAgc2V0U3RhdHVzKCdMb2FkIGZhaWxlZCcpO1xuICAgIGVtcHR5LmhpZGRlbiA9IGZhbHNlO1xuICB9XG59XG5cbnJlbG9hZEJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgdm9pZCBsb2FkR3JhcGgoKTtcbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZXJyb3InLCAoZXZlbnQpID0+IHtcbiAgc2V0QmFubmVyKGBXZWJ2aWV3IGVycm9yOiAke2V2ZW50Lm1lc3NhZ2V9YCwgdHJ1ZSk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3VuaGFuZGxlZHJlamVjdGlvbicsIChldmVudCkgPT4ge1xuICBzZXRCYW5uZXIoYFVuaGFuZGxlZCByZWplY3Rpb246ICR7U3RyaW5nKGV2ZW50LnJlYXNvbil9YCwgdHJ1ZSk7XG59KTtcblxuYXN5bmMgZnVuY3Rpb24gYm9vdCgpIHtcbiAgdHJ5IHtcbiAgICBhd2FpdCBicmlkZ2UucmVxdWVzdCgnd2Vidmlldy5yZWFkeScsIHtcbiAgICAgIGNsaWVudDogJ3dlYnZpZXcnLFxuICAgICAgcHJvdG9jb2xWZXJzaW9uOiBQUk9UT0NPTF9WRVJTSU9OLFxuICAgIH0pO1xuICB9IGNhdGNoIHtcbiAgICAvLyBDYXBhYmlsaXRpZXMgYXJlIGluZm9ybWF0aW9uYWw7IGdyYXBoIGxvYWQgY2FuIHN0aWxsIHN1Y2NlZWQuXG4gIH1cbiAgYXdhaXQgbG9hZEdyYXBoKCk7XG59XG5cbnZvaWQgYm9vdCgpO1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7QUFXTyxNQUFNLG1CQUFtQjtBQUd6QixNQUFNLG9CQUFvQjtBQUcxQixNQUFNLGVBQWU7QUFFckIsTUFBTSxxQkFBcUI7QUFHM0IsTUFBTSxrQkFBa0IsT0FBTyxPQUFPO0FBQUEsSUFDM0M7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFHTSxNQUFNLGtCQUFrQixPQUFPLE9BQU87QUFBQSxJQUMzQztBQUFBLElBQ0E7QUFBQSxJQUNBO0FBQUEsSUFDQTtBQUFBLElBQ0E7QUFBQSxFQUNGLENBQUM7QUFFTSxNQUFNLGFBQWEsT0FBTyxPQUFPO0FBQUEsSUFD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
