/**
 * Webview entry point.
 *
 * Responsibilities are deliberately narrow: talk protocol, render the DTO, show
 * selection details. No analysis, no file access, no graph construction.
 */

import { createBridge } from '../core/protocol/bridge.js';
import { DIRECTIONS, PROTOCOL_VERSION } from '../core/protocol/envelope.js';
import { validateDto } from '../core/graph/dto.js';
import { createSvgRenderer } from '../visualization/renderer/svgRenderer.js';

const vscodeApi = acquireVsCodeApi();

const svg = /** @type {SVGSVGElement} */ (document.getElementById('cf-graph'));
const meta = /** @type {HTMLElement} */ (document.getElementById('cf-meta'));
const status = /** @type {HTMLElement} */ (document.getElementById('cf-status'));
const banner = /** @type {HTMLElement} */ (document.getElementById('cf-banner'));
const empty = /** @type {HTMLElement} */ (document.getElementById('cf-empty'));
const detailBody = /** @type {HTMLElement} */ (document.getElementById('cf-detail-body'));
const legend = /** @type {HTMLElement} */ (document.getElementById('cf-legend'));
const reloadButton = /** @type {HTMLButtonElement} */ (document.getElementById('cf-refresh'));
const functionPicker = /** @type {HTMLSelectElement|null} */ (
  document.getElementById('cf-function')
);

/** @type {import('../core/graph/dto.js').GraphDto | null} */
let currentDto = null;
const preferredSymbolId = document.body.dataset.preferredSymbol || null;

/** @type {string | null} */
let selectedSymbolId = preferredSymbolId;


const renderer = createSvgRenderer({
  svg,
  onSelect: (nodeId, node) => {
    showNodeDetails(nodeId, node);
    bridge.respond('node.select', { nodeId });
  },
});

const bridge = createBridge({
  post: (message) => vscodeApi.postMessage(message),
  inboundDirection: DIRECTIONS.HOST_TO_WEBVIEW,
  timeoutMs: 8000,
  logger: {
    debug: () => {},
    warn: (message, fields) => console.warn('[codeflow]', message, fields),
    error: (message, fields) => console.error('[codeflow]', message, fields),
  },
});

/**
 * @param {string} message
 * @param {boolean} [isError]
 */
function setBanner(message, isError = false) {
  if (!message) {
    banner.hidden = true;
    banner.textContent = '';
    return;
  }
  banner.hidden = false;
  banner.classList.toggle('is-error', isError);
  banner.textContent = message;
}

/**
 * @param {string} text
 */
function setStatus(text) {
  status.textContent = text;
}

function clearDetail() {
  detailBody.replaceChildren();
  const paragraph = document.createElement('p');
  paragraph.className = 'cf-muted';
  paragraph.textContent = 'Select a node to inspect it.';
  detailBody.appendChild(paragraph);
}

/**
 * @param {string} label
 * @param {string} value
 * @returns {[HTMLElement, HTMLElement]}
 */
function detailPair(label, value) {
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = value;
  return [term, description];
}

/**
 * @param {string} nodeId
 * @param {import('../core/graph/dto.js').DtoNode} [node]
 */
function showNodeDetails(nodeId, node) {
  if (!nodeId || !node) {
    clearDetail();
    return;
  }
  const list = document.createElement('dl');
  list.append(...detailPair('label', node.label));
  list.append(...detailPair('kind', node.kind));
  list.append(...detailPair('status', node.status));
  if (node.external) {
    list.append(...detailPair('origin', 'external target (not declared in the analysis)'));
  }
  if (node.range) {
    list.append(...detailPair('lines', `${node.range.startLine + 1}–${node.range.endLine + 1}`));
    list.append(...detailPair('file', node.range.fileId));
  }
  if (node.badge) {
    list.append(...detailPair('note', node.badge));
  }
  if (node.isSynthetic) {
    list.append(...detailPair('origin', 'synthetic structural node'));
  }
  if (node.unreachable) {
    list.append(...detailPair('reachability', 'not reachable from entry'));
  }
  if (node.reasonCode) {
    list.append(...detailPair('reason', node.reasonCode));
  }
  if (Array.isArray(node.calls) && node.calls.length > 0) {
    list.append(
      ...detailPair(
        'calls',
        node.calls.map((call) => `${call.label} (${call.status})`).join(', '),
      ),
    );
  }

  const edges = (currentDto?.edges ?? []).filter(
    (edge) => edge.from === nodeId || edge.to === nodeId,
  );
  if (edges.length > 0) {
    list.append(...detailPair('relationships', String(edges.length)));
  }

  detailBody.replaceChildren(list);

  if (edges.length > 0) {
    const heading = document.createElement('h3');
    heading.className = 'cf-detail-title';
    heading.textContent = 'Relationships';
    detailBody.appendChild(heading);

    const edgeList = document.createElement('ul');
    edgeList.className = 'cf-legend';
    for (const edge of edges.slice(0, 12)) {
      const item = document.createElement('li');
      const direction = edge.from === nodeId ? '→' : '←';
      const other = edge.from === nodeId ? edge.to : edge.from;
      item.textContent = `${direction} ${edge.type} · ${other} (${edge.status})`;
      edgeList.appendChild(item);
    }
    detailBody.appendChild(edgeList);
  }
}

/**
 * @param {import('../core/graph/dto.js').GraphDto} dto
 */
function renderLegend(dto) {
  legend.replaceChildren();
  for (const statusName of dto.legend.statuses) {
    const item = document.createElement('li');
    const swatch = document.createElement('span');
    swatch.className = `cf-swatch cf-edge--${statusName}`;
    const label = document.createElement('span');
    label.textContent = statusName;
    if (statusName !== 'resolved') {
      label.textContent = `${statusName} (pattern + label)`;
    }
    item.append(swatch, label);
    legend.appendChild(item);
  }
  for (const edgeKind of dto.legend.edgeKinds ?? []) {
    const item = document.createElement('li');
    const swatch = document.createElement('span');
    swatch.className = `cf-swatch cf-edge--kind-${edgeKind}`;
    const label = document.createElement('span');
    label.textContent = `edge: ${edgeKind}`;
    item.append(swatch, label);
    legend.appendChild(item);
  }
}

/**
 * @param {Array<{symbolId: string, name: string, qualifiedName: string, kind: string}>} list
 */
function renderFunctionPicker(list) {
  if (!functionPicker) {
    return;
  }
  functionPicker.replaceChildren();
  for (const entry of list) {
    const option = document.createElement('option');
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
  const names = adapters.map((adapter) => adapter.id).join(', ') || 'none';
  meta.textContent = `Mock data · adapters: ${names} · protocol v${payload.protocolVersion ?? '?'}`;
}

/**
 * @param {unknown} payload
 */
function handleGraph(payload) {
  const dtoCandidate = /** @type {{dto?: unknown}} */ (payload).dto;
  const validation = validateDto(dtoCandidate);
  if (!validation.ok) {
    setBanner(`Invalid graph payload: ${validation.issues[0]}`, true);
    setStatus('Render failed');
    return;
  }
  const dto = validation.dto;
  currentDto = dto;
  empty.hidden = true;
  renderer.render(dto);
  renderLegend(dto);
  clearDetail();
  const subject =
    dto.dtoKind === 'cfg' && dto.function
      ? `${dto.function.qualifiedName} · CFG`
      : 'call graph';
  setStatus(
    `${subject} · ${dto.language} · ${dto.nodes.length} nodes · ${dto.edges.length} edges · ${dto.completeness}`,
  );
  meta.textContent = `${dto.adapterId} · ${subject} · dto v${dto.dtoVersion}`;
  const degradations = dto.degradations ?? [];
  const messages = degradations.map((entry) =>
    typeof entry === 'string'
      ? entry
      : `${entry.severity === 'info' ? '' : `${entry.severity}: `}${entry.message}`,
  );
  setBanner(messages.length > 0 ? messages.join(' · ') : '', false);
}

bridge.on('protocol.error', (payload) => {
  const code = typeof payload.code === 'string' ? payload.code : 'E_PROTOCOL';
  const message = typeof payload.message === 'string' ? payload.message : 'Unknown error.';
  setBanner(`${code}: ${message}`, true);
  setStatus('Error');
});

/**
 * @param {string} symbolId
 */
async function loadCfg(symbolId) {
  setStatus('Building control-flow graph…');
  setBanner('');
  try {
    // A request resolves with its correlated response. The response is not
    // dispatched to `bridge.on`, so handle it here.
    const response = await bridge.request('cfg.load', { symbolId });
    selectedSymbolId = symbolId;
    handleGraph(response.payload);
    return true;
  } catch (error) {
    setBanner(`Could not build CFG: ${error?.message ?? String(error)}`, true);
    setStatus('CFG unavailable');
    return false;
  }
}

async function loadGraph() {
  setStatus('Loading graph…');
  setBanner('');
  try {
    const response = await bridge.request('cfg.functions', {});
    const list = Array.isArray(response.payload.functions) ? response.payload.functions : [];
    if (list.length > 0) {
      renderFunctionPicker(list);
      const retained =
        selectedSymbolId && list.some((entry) => entry.symbolId === selectedSymbolId)
          ? selectedSymbolId
          : list[0].symbolId;
      const loaded = await loadCfg(retained);
      if (loaded) {
        return;
      }
    }
  } catch {
    // The CFG capability may be absent (for example the built-in demo run).
    // Falling back to the call graph keeps the panel useful and honest.
  }
  try {
    const response = await bridge.request('graph.load', { demo: true });
    handleGraph(response.payload);
  } catch (error) {
    setBanner(`Could not load graph: ${error?.message ?? String(error)}`, true);
    setStatus('Load failed');
    empty.hidden = false;
  }
}

reloadButton.addEventListener('click', () => {
  void loadGraph();
});

functionPicker?.addEventListener('change', () => {
  const symbolId = functionPicker.value;
  if (symbolId) {
    void loadCfg(symbolId);
  }
});

window.addEventListener('error', (event) => {
  setBanner(`Webview error: ${event.message}`, true);
});

window.addEventListener('unhandledrejection', (event) => {
  setBanner(`Unhandled rejection: ${String(event.reason)}`, true);
});

async function boot() {
  try {
    const response = await bridge.request('webview.ready', {
      client: 'webview',
      protocolVersion: PROTOCOL_VERSION,
    });
    showCapabilities(response.payload);
  } catch {
    // Capabilities are informational; graph load can still succeed.
  }
  await loadGraph();
}

void boot();
