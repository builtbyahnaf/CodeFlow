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
import { buildPreviewModel } from '../core/source/presentation.js';
import { resolvePreviewSettings } from '../core/source/settings.js';
import { createPreviewController } from './previewController.js';
import { highlightLines } from './highlight.js';

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
const preview = /** @type {HTMLElement} */ (document.getElementById('cf-preview'));
const previewTitle = /** @type {HTMLElement} */ (document.getElementById('cf-preview-title'));
const previewMeta = /** @type {HTMLElement} */ (document.getElementById('cf-preview-meta'));
const previewBody = /** @type {HTMLElement} */ (document.getElementById('cf-preview-body'));
const previewNote = /** @type {HTMLElement} */ (document.getElementById('cf-preview-note'));
const previewPin = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-pin'));
const previewClose = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-close'));
const previewOpen = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-open'));

/** @type {import('../core/graph/dto.js').GraphDto | null} */
let currentDto = null;
const preferredSymbolId = document.body.dataset.preferredSymbol || null;

/** @type {string | null} */
let selectedSymbolId = preferredSymbolId;

/** @type {Record<string, any>} */
let settings = resolvePreviewSettings({});
/** @type {Map<string, Record<string, any>>} */
const previewCache = new Map();
/** @type {Map<string, string>} */
let integrityByNode = new Map();
/** @type {string|null} */
let previewNodeId = null;
/** @type {number} */
let previewRequest = 0;
/** @type {{x: number, y: number}|null} */
let previewAnchor = null;

const renderer = createSvgRenderer({
  svg,
  onSelect: (nodeId, node) => {
    showNodeDetails(nodeId, node);
    bridge.respond('node.select', { nodeId });
  },
  onNavigate: (nodeId, node, trigger) => {
    if (trigger === 'pointer' && !settings.clickToNavigate) {
      return;
    }
    void navigateTo(nodeId, node);
  },
  onPreviewEnter: (nodeId, _node, point) => {
    previewController.pointerEnter(nodeId, point);
  },
  onPreviewMove: (point) => {
    previewController.pointerMove(point);
  },
  onPreviewLeave: () => {
    previewController.pointerLeave();
  },
  onPreviewKey: (nodeId) => {
    void openPreview(nodeId, null, true);
  },
});

const previewController = createPreviewController({
  delayMs: settings.delayMs,
  enabled: settings.enabled,
  pinByDefault: settings.pinByDefault,
  onShow: (nodeId, anchor) => {
    syncPinButton(previewController.isPinned());
    void openPreview(nodeId, anchor, false);
  },
  onHide: () => {
    hidePreview();
  },
});
if (settings.pinByDefault) {
  previewController.setPinned(true);
}
syncPinButton(settings.pinByDefault);

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
      ...detailPair('calls', node.calls.map((call) => `${call.label} (${call.status})`).join(', ')),
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
 * @param {Record<string, any>} next
 */
function applySettings(next) {
  const previousMaxLines = settings.maxLines;
  settings = resolvePreviewSettings({ ...settings, ...next });
  previewController.configure({
    delayMs: settings.delayMs,
    enabled: settings.enabled,
    pinByDefault: settings.pinByDefault,
  });
  if (settings.maxLines !== previousMaxLines) {
    previewCache.clear();
  }
  if (!settings.enabled) {
    previewController.dismiss();
    hidePreview();
  }
}

/**
 * @param {boolean} pinned
 */
function syncPinButton(pinned) {
  previewPin.setAttribute('aria-pressed', pinned ? 'true' : 'false');
  previewPin.textContent = pinned ? 'Pinned' : 'Pin';
}

/**
 * @param {string} nodeId
 * @returns {Record<string, any>|null}
 */
function nodeById(nodeId) {
  return currentDto?.nodes.find((node) => node.id === nodeId) ?? null;
}

/**
 * @param {{x: number, y: number}|null} anchor
 */
function positionPreview(anchor) {
  const wrap = svg.parentElement?.getBoundingClientRect();
  if (!wrap) {
    return;
  }
  const point = anchor ?? {
    x: wrap.left + 24,
    y: wrap.top + 72,
  };
  const width = Math.min(380, Math.max(260, wrap.width - 32));
  const maxLeft = Math.max(8, wrap.width - width - 8);
  const left = Math.max(8, Math.min(maxLeft, point.x - wrap.left + 14));
  const top = Math.max(8, Math.min(Math.max(8, wrap.height - 220), point.y - wrap.top + 14));
  preview.style.width = `${width}px`;
  preview.style.left = `${left}px`;
  preview.style.top = `${top}px`;
}

/**
 * @param {Record<string, any>} node
 * @param {Record<string, any>|null} slice
 */
function renderPreviewCard(node, slice) {
  const model = buildPreviewModel({
    node,
    slice,
    maxLines: settings.maxLines,
  });
  previewTitle.textContent = `${model.kind} · ${model.title}`;
  previewMeta.textContent = [
    model.file,
    `lines ${model.lineLabel}`,
    model.integrity !== 'exact'
      ? model.integrity
      : model.documentVersion
        ? `v${model.documentVersion}`
        : '',
  ]
    .filter(Boolean)
    .join(' · ');
  previewBody.replaceChildren();

  if (!model.synthetic && !model.empty) {
    const language =
      typeof slice?.languageId === 'string' ? slice.languageId : (node.range?.fileId ?? '');
    const rendered = settings.syntaxHighlighting
      ? highlightLines(model.text, language)
      : highlightLines(model.text, '');
    const firstLine = Number(slice?.lines?.startLine ?? node.range?.startLine ?? 0) + 1;
    const code = document.createElement('div');
    code.className = 'cf-preview-code';
    for (const [index, tokens] of rendered.lines.entries()) {
      const line = document.createElement('div');
      line.className = 'cf-preview-line';
      const number = document.createElement('span');
      number.className = 'cf-preview-line-number';
      number.textContent = String(firstLine + index);
      const content = document.createElement('span');
      content.className = 'cf-preview-line-text';
      for (const token of tokens) {
        const span = document.createElement('span');
        if (token.className) {
          span.className = token.className;
        }
        span.textContent = token.text;
        content.appendChild(span);
      }
      line.append(number, content);
      code.appendChild(line);
    }
    previewBody.appendChild(code);
    if (rendered.degraded) {
      previewBody.classList.add('is-plain');
    } else {
      previewBody.classList.remove('is-plain');
    }
  }

  const notes = [];
  if (model.message) {
    notes.push(model.message);
  }
  if (model.truncated) {
    notes.push(`Preview truncated to ${settings.maxLines} lines.`);
  }
  previewNote.textContent = notes.join(' ');
  const canOpen = !model.synthetic && !model.empty && model.integrity === 'exact';
  previewBody.classList.toggle('is-clickable', Boolean(settings.clickToNavigate && canOpen));
  previewOpen.disabled = !canOpen;
  preview.classList.toggle('is-stale', model.stale);
  preview.classList.toggle('is-synthetic', model.synthetic);
  preview.hidden = false;
  positionPreview(previewAnchor);
}

function hidePreview() {
  previewRequest += 1;
  previewNodeId = null;
  previewAnchor = null;
  preview.hidden = true;
  previewBody.replaceChildren();
  previewNote.textContent = '';
  syncPinButton(false);
}

/**
 * @param {string} nodeId
 * @param {{x: number, y: number}|null} [anchor]
 * @param {boolean} [pin]
 */
async function openPreview(nodeId, anchor = null, pin = false) {
  const node = nodeById(nodeId);
  if (!node) {
    return;
  }
  previewNodeId = nodeId;
  previewAnchor = anchor;
  if (pin) {
    previewController.setPinned(true);
    syncPinButton(true);
    preview.focus();
  }
  if (node.isSynthetic || !node.range) {
    renderPreviewCard(node, null);
    return;
  }
  const key = `${nodeId}|${settings.maxLines}`;
  const cached = previewCache.get(key);
  if (cached) {
    renderPreviewCard(node, cached);
    return;
  }
  const request = ++previewRequest;
  try {
    const response = await bridge.request('source.slice', {
      fileId: node.range.fileId,
      range: node.range,
      maxLines: settings.maxLines,
    });
    if (request !== previewRequest || previewNodeId !== nodeId) {
      return;
    }
    const slice = response.payload.slice ?? null;
    previewCache.set(key, slice);
    if (slice?.integrity && slice.integrity !== 'exact') {
      integrityByNode.set(nodeId, slice.integrity);
      renderer.markStale([nodeId]);
    }
    renderPreviewCard(node, slice);
  } catch (error) {
    if (request !== previewRequest) {
      return;
    }
    renderPreviewCard(node, {
      text: '',
      relativePath: '',
      integrity: 'missing',
      reason: error?.message ?? String(error),
    });
  }
}

/**
 * @param {string} nodeId
 * @param {Record<string, any>} [node]
 */
async function navigateTo(nodeId, node = nodeById(nodeId)) {
  if (!node?.range || node.isSynthetic) {
    setBanner('This node has no source to open.', false);
    return;
  }
  try {
    const response = await bridge.request('navigate.to', {
      fileId: node.range.fileId,
      range: node.range,
      nodeId,
    });
    if (response.payload.ok !== true) {
      setBanner(
        `${response.payload.code ?? 'E_NAVIGATION'}: ${response.payload.message ?? 'Could not open source.'}`,
        true,
      );
    }
  } catch (error) {
    setBanner(`Could not open source: ${error?.message ?? String(error)}`, true);
  }
}

/**
 * Validate every source-backed node once on graph load.
 *
 * @param {Record<string, any>} dto
 */
async function validateGraph(dto) {
  integrityByNode = new Map();
  const ranges = dto.nodes
    .filter((node) => node.range && !node.isSynthetic)
    .map((node) => ({ nodeId: node.id, ...node.range }));
  if (ranges.length === 0) {
    return;
  }
  try {
    const response = await bridge.request('source.validation', {
      ranges: ranges.map(({ nodeId: _nodeId, ...range }) => range),
    });
    const results = Array.isArray(response.payload.results) ? response.payload.results : [];
    const stale = [];
    for (const [index, result] of results.entries()) {
      const nodeId = ranges[index]?.nodeId;
      if (!nodeId) {
        continue;
      }
      integrityByNode.set(nodeId, result.integrity ?? 'missing');
      if (result.integrity !== 'exact') {
        stale.push(nodeId);
      }
    }
    if (stale.length > 0) {
      renderer.markStale(stale);
      setBanner(
        `${stale.length} node${stale.length === 1 ? '' : 's'} reference changed or missing source. Preview marks them stale; re-analyze before trusting them.`,
        false,
      );
    }
  } catch {
    // Validation is an enhancement. A failure must not hide the graph.
  }
}

/**
 * @param {string[]} fileIds
 */
function markStaleFiles(fileIds) {
  const wanted = new Set(Array.isArray(fileIds) ? fileIds : []);
  if (!currentDto || wanted.size === 0) {
    return;
  }
  const stale = currentDto.nodes
    .filter((node) => node.range && wanted.has(node.range.fileId))
    .map((node) => node.id);
  if (stale.length === 0) {
    return;
  }
  previewCache.clear();
  for (const nodeId of stale) {
    integrityByNode.set(nodeId, 'stale');
  }
  renderer.markStale(stale);
  previewController.dismiss();
  hidePreview();
  setBanner(
    `Source changed for ${stale.length} node${stale.length === 1 ? '' : 's'}. Previews are stale; re-analyze before trusting them.`,
    false,
  );
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
  if (payload?.settings && typeof payload.settings === 'object') {
    applySettings(payload.settings);
  }
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
  previewCache.clear();
  integrityByNode = new Map();
  hidePreview();
  empty.hidden = true;
  renderer.render(dto);
  renderLegend(dto);
  clearDetail();
  void validateGraph(dto);
  const subject =
    dto.dtoKind === 'cfg' && dto.function ? `${dto.function.qualifiedName} · CFG` : 'call graph';
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

bridge.on('settings.data', (payload) => {
  const next = payload?.settings;
  if (next && typeof next === 'object') {
    applySettings(next);
  }
});

bridge.on('source.stale', (payload) => {
  markStaleFiles(Array.isArray(payload?.fileIds) ? payload.fileIds : []);
});

bridge.on('selection.changed', (payload) => {
  const nodeIds = Array.isArray(payload?.nodeIds) ? payload.nodeIds : [];
  renderer.highlight(nodeIds);
  const activeNodeId = typeof payload?.activeNodeId === 'string' ? payload.activeNodeId : null;
  if (activeNodeId) {
    const node = nodeById(activeNodeId);
    if (node) {
      showNodeDetails(activeNodeId, node);
    }
  }
});

bridge.on('graph.focus', (payload) => {
  if (typeof payload?.nodeId === 'string') {
    const node = nodeById(payload.nodeId);
    if (node) {
      renderer.select(payload.nodeId);
      showNodeDetails(payload.nodeId, node);
    }
  }
  svg.focus?.();
});

preview.addEventListener('pointerenter', () => {
  previewController.pointerEnterCard();
});
preview.addEventListener('pointerleave', () => {
  previewController.pointerLeaveCard();
});
previewPin.addEventListener('click', () => {
  syncPinButton(previewController.togglePin());
});
previewClose.addEventListener('click', () => {
  previewController.dismiss();
  hidePreview();
});
previewOpen.addEventListener('click', () => {
  if (previewNodeId) {
    void navigateTo(previewNodeId);
  }
});
previewBody.addEventListener('click', () => {
  if (settings.clickToNavigate && previewNodeId && !previewOpen.disabled) {
    void navigateTo(previewNodeId);
  }
});
preview.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    previewController.dismiss();
    hidePreview();
    renderer.focusSelection();
  }
});
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !preview.hidden) {
    previewController.dismiss();
    hidePreview();
  }
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
