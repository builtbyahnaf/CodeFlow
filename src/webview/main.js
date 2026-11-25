/**
 * Webview entry point.
 *
 * Responsibilities are deliberately narrow: talk protocol, render the DTO, show
 * selection details. No analysis, no file access, no graph construction.
 */

import { createBridge } from '../core/protocol/bridge.js';
import { DIRECTIONS, PROTOCOL_VERSION } from '../core/protocol/envelope.js';
import { validateDto } from '../core/graph/dto.js';
import { createSvgRenderer, shapeOutline } from '../visualization/renderer/svgRenderer.js';
import { LEVEL_LABELS, LEVEL_ORDER } from '../core/graph/zoom/levels.js';
import { buildPreviewModel } from '../core/source/presentation.js';
import { resolvePreviewSettings } from '../core/source/settings.js';
import { clampExplanationDepth, resolveExplanationSettings } from '../core/explanation/settings.js';
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
const shapeLegend = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-shape-legend')
);
const shapeLegendList = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-shape-legend-list')
);
const reloadButton = /** @type {HTMLButtonElement} */ (document.getElementById('cf-refresh'));
const fullWindowButton = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-full-window')
);
const zoomFitButton = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-zoom-fit')
);
const functionPicker = /** @type {HTMLSelectElement|null} */ (
  document.getElementById('cf-function')
);
const preview = /** @type {HTMLElement} */ (document.getElementById('cf-preview'));
const previewTitle = /** @type {HTMLElement} */ (document.getElementById('cf-preview-title'));
const previewMeta = /** @type {HTMLElement} */ (document.getElementById('cf-preview-meta'));
const previewExplain = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-preview-explain')
);
const previewBody = /** @type {HTMLElement} */ (document.getElementById('cf-preview-body'));
const previewNote = /** @type {HTMLElement} */ (document.getElementById('cf-preview-note'));
const previewPin = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-pin'));
const previewClose = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-close'));
const previewOpen = /** @type {HTMLButtonElement} */ (document.getElementById('cf-preview-open'));
const fnSummary = /** @type {HTMLElement|null} */ (document.getElementById('cf-fn-summary'));
const explainSection = /** @type {HTMLElement|null} */ (document.getElementById('cf-explain'));
const explainDepthSelect = /** @type {HTMLSelectElement|null} */ (
  document.getElementById('cf-explain-depth')
);
const explainItems = /** @type {HTMLElement|null} */ (document.getElementById('cf-explain-items'));
const explainEvidence = /** @type {HTMLDetailsElement|null} */ (
  document.getElementById('cf-explain-evidence')
);
const explainEvidenceList = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-explain-evidence-list')
);
const explainLimits = /** @type {HTMLDetailsElement|null} */ (
  document.getElementById('cf-explain-limits')
);
const explainLimitsText = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-explain-limits-text')
);
const perspectiveSelect = /** @type {HTMLSelectElement|null} */ (
  document.getElementById('cf-perspective')
);
const switchPerspectiveBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-switch-perspective')
);
const zoomBar = /** @type {HTMLElement|null} */ (document.getElementById('cf-zoom-bar'));
const zoomLevelBadge = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-zoom-level-badge')
);
const zoomBreadcrumbs = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-zoom-breadcrumbs')
);
const zoomSearch = /** @type {HTMLInputElement|null} */ (
  document.getElementById('cf-zoom-search')
);
const zoomChips = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-zoom-chips')
);
const scopeBanner = /** @type {HTMLElement|null} */ (document.getElementById('cf-scope-banner'));
const callsPanel = /** @type {HTMLElement|null} */ (document.getElementById('cf-calls-panel'));
const callsFilterStatus = /** @type {HTMLSelectElement|null} */ (
  document.getElementById('cf-calls-filter-status')
);
const callsExpandBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-calls-expand')
);
const callsCollapseBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-calls-collapse')
);
const callsFocusBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-calls-focus')
);
const callersHeading = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-callers-heading')
);
const callersList = /** @type {HTMLElement|null} */ (document.getElementById('cf-callers-list'));
const callersMoreBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-callers-more')
);
const calleesHeading = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-callees-heading')
);
const calleesList = /** @type {HTMLElement|null} */ (document.getElementById('cf-callees-list'));
const calleesMoreBtn = /** @type {HTMLButtonElement|null} */ (
  document.getElementById('cf-callees-more')
);
const unresolvedBucketDetails = /** @type {HTMLDetailsElement|null} */ (
  document.getElementById('cf-unresolved-bucket')
);
const unresolvedSummary = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-unresolved-summary')
);
const unresolvedList = /** @type {HTMLElement|null} */ (
  document.getElementById('cf-unresolved-list')
);

/** @type {import('../core/graph/dto.js').GraphDto | null} */
let currentDto = null;
const preferredSymbolId = document.body.dataset.preferredSymbol || null;
const rawPref = document.body.dataset.preferredPerspective;
const preferredPerspective =
  rawPref === 'call_graph' ? 'call_graph' : rawPref === 'semantic_zoom' ? 'semantic_zoom' : 'cfg';

/** @type {string | null} */
let selectedSymbolId = preferredSymbolId;
/** @type {'cfg'|'call_graph'|'semantic_zoom'} */
let activePerspective = preferredPerspective;
/** @type {string|undefined} */
let callersNextCursor;
/** @type {string|undefined} */
let calleesNextCursor;
if (perspectiveSelect) {
  perspectiveSelect.value = activePerspective;
}

/** @type {Record<string, any>} */
let settings = resolvePreviewSettings({});
/** @type {{defaultDepth: 1|2|3|4, showEvidence: boolean, includeLimitations: boolean}} */
let explanationSettings = resolveExplanationSettings({});
/** @type {1|2|3|4} */
let activeExplainDepth = explanationSettings.defaultDepth;
/** @type {string|null} */
let activeNodeId = null;
/** @type {number} */
let explainNodeRequest = 0;
/** @type {number} */
let explainFunctionRequest = 0;
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
    if (currentDto?.dtoKind === 'semantic_zoom') {
      if (node?.expandable === false) {
        return;
      }
      void descendSemanticZoom(nodeId, node);
      return;
    }
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

function renderGraphOverview() {
  detailBody.replaceChildren();
  if (!currentDto) {
    const paragraph = document.createElement('p');
    paragraph.className = 'cf-muted';
    paragraph.textContent = 'Select a node to inspect it.';
    detailBody.appendChild(paragraph);
    return;
  }

  if (currentDto.dtoKind === 'cfg' && currentDto.function) {
    const fn = currentDto.function;
    const review = document.createElement('div');
    review.className = 'cf-review-section';

    if (fn.signature) {
      const sigHeading = document.createElement('h3');
      sigHeading.className = 'cf-detail-title';
      sigHeading.textContent = 'Signature';
      const sigBox = document.createElement('div');
      sigBox.className = 'cf-signature-box';
      sigBox.textContent = fn.signature;
      review.append(sigHeading, sigBox);
    }

    const nodes = Array.isArray(currentDto.nodes) ? currentDto.nodes : [];
    const branchCount = nodes.filter(
      (n) => n.kind === 'condition' || n.kind === 'multiway',
    ).length;
    const loopCount = nodes.filter((n) => n.kind === 'loop_header').length;
    const callCount = nodes.filter((n) => n.kind === 'call').length;
    const stmtCount = nodes.filter((n) => n.kind === 'statement').length;

    const statsGrid = document.createElement('div');
    statsGrid.className = 'cf-review-stats';
    for (const [val, label] of [
      [branchCount, 'Decisions'],
      [loopCount, 'Loops'],
      [callCount, 'Calls'],
      [stmtCount, 'Statements'],
    ]) {
      const card = document.createElement('div');
      card.className = 'cf-stat-card';
      const valEl = document.createElement('div');
      valEl.className = 'cf-stat-value';
      valEl.textContent = String(val);
      const lblEl = document.createElement('div');
      lblEl.className = 'cf-stat-label';
      lblEl.textContent = String(label);
      card.append(valEl, lblEl);
      statsGrid.appendChild(card);
    }
    review.appendChild(statsGrid);

    const params = Array.isArray(fn.parameters) ? fn.parameters : [];
    const paramHeading = document.createElement('h3');
    paramHeading.className = 'cf-detail-title';
    paramHeading.textContent = `Inputs / Parameters (${params.length})`;
    review.appendChild(paramHeading);

    if (params.length > 0) {
      const paramList = document.createElement('ul');
      paramList.className = 'cf-review-list';
      for (const p of params) {
        const li = document.createElement('li');
        li.className = 'cf-review-item';
        const nameSpan = document.createElement('span');
        nameSpan.className = 'cf-review-name';
        nameSpan.textContent = p.name || '(unnamed)';
        const typeSpan = document.createElement('span');
        typeSpan.className = 'cf-review-type';
        typeSpan.textContent = `${p.type || 'auto'}${p.defaultValue ? ` = ${p.defaultValue}` : ''}`;
        li.append(nameSpan, typeSpan);
        paramList.appendChild(li);
      }
      review.appendChild(paramList);
    } else {
      const none = document.createElement('p');
      none.className = 'cf-muted';
      none.textContent = 'No input parameters.';
      review.appendChild(none);
    }

    const retHeading = document.createElement('h3');
    retHeading.className = 'cf-detail-title';
    retHeading.textContent = 'Emitted Result / Returns';
    review.appendChild(retHeading);

    const dl = document.createElement('dl');
    dl.append(...detailPair('return type', fn.returnType || 'inferred'));
    const returns = Array.isArray(fn.returns) && fn.returns.length > 0 ? fn.returns : [];
    if (returns.length > 0) {
      dl.append(...detailPair('emits', returns.join(' | ')));
    }
    review.appendChild(dl);

    const dataFlows = Array.isArray(fn.dataFlows) ? fn.dataFlows : [];
    if (dataFlows.length > 0) {
      const dfHeading = document.createElement('h3');
      dfHeading.className = 'cf-detail-title';
      dfHeading.textContent = `External & Call Data Usage (${dataFlows.length})`;
      review.appendChild(dfHeading);

      const dfList = document.createElement('ul');
      dfList.className = 'cf-review-list';
      for (const df of dataFlows) {
        const li = document.createElement('li');
        li.className = 'cf-review-item';
        const lhs = document.createElement('span');
        lhs.className = 'cf-review-name';
        lhs.textContent = df.target;
        const rhs = document.createElement('span');
        rhs.className = 'cf-review-type';
        rhs.textContent = df.sourceCall ? `<- ${df.sourceCall}()` : df.expression;
        li.append(lhs, rhs);
        dfList.appendChild(li);
      }
      review.appendChild(dfList);
    }

    const hint = document.createElement('p');
    hint.className = 'cf-muted';
    hint.textContent = 'Click any node to inspect flow paths, or hover to preview highlighted code.';
    review.appendChild(hint);

    detailBody.appendChild(review);
    return;
  }

  const dl = document.createElement('dl');
  dl.append(...detailPair('view', currentDto.dtoKind || 'graph'));
  dl.append(...detailPair('nodes', String(currentDto.nodes?.length ?? 0)));
  dl.append(...detailPair('edges', String(currentDto.edges?.length ?? 0)));
  if (currentDto.function?.name) {
    dl.append(...detailPair('symbol', currentDto.function.name));
  }
  const hint = document.createElement('p');
  hint.className = 'cf-muted';
  hint.textContent = 'Select any node to inspect details and code preview.';
  detailBody.append(dl, hint);
}

function clearDetail() {
  activeNodeId = null;
  renderGraphOverview();
  clearExplanation();
}

function clearExplanation() {
  explainNodeRequest += 1;
  if (explainSection) {
    explainSection.hidden = true;
  }
  explainItems?.replaceChildren();
  if (explainEvidence) {
    explainEvidence.hidden = true;
  }
  explainEvidenceList?.replaceChildren();
  if (explainLimits) {
    explainLimits.hidden = true;
  }
  if (explainLimitsText) {
    explainLimitsText.textContent = '';
  }
}

/**
 * @param {Record<string, any>} payload
 */
function renderNodeExplanation(payload) {
  if (!explainSection || !explainItems) {
    return;
  }
  const items = Array.isArray(payload?.items) ? payload.items : [];
  const limits = Array.isArray(payload?.limitations) ? payload.limitations : [];
  explainItems.replaceChildren();
  if (items.length === 0 && limits.length === 0) {
    explainSection.hidden = true;
    return;
  }
  explainSection.hidden = false;

  const evidenceRefs = [];
  for (const item of items) {
    if (item.ruleId === 'fn.limitations') {
      continue;
    }
    const row = document.createElement('p');
    row.className = `cf-explain-item cf-explain--${item.claim ?? 'grounded'}`;
    row.textContent = item.text;
    explainItems.appendChild(row);
    for (const ref of item.evidence ?? []) {
      evidenceRefs.push(ref);
    }
  }

  if (explainEvidence && explainEvidenceList) {
    explainEvidenceList.replaceChildren();
    const seen = new Set();
    const uniqueRefs = evidenceRefs.filter((ref) => {
      const key = `${ref.kind}:${ref.id}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
    if (explanationSettings.showEvidence && uniqueRefs.length > 0) {
      explainEvidence.hidden = false;
      for (const ref of uniqueRefs.slice(0, 8)) {
        const li = document.createElement('li');
        if (ref.range) {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'cf-evidence-link';
          btn.textContent = ref.label || `${ref.kind}: line ${ref.range.startLine + 1}`;
          btn.addEventListener('click', () => {
            void navigateToRange(ref.range);
          });
          li.appendChild(btn);
        } else {
          li.textContent = `${ref.kind}: ${ref.label || ref.id}`;
        }
        explainEvidenceList.appendChild(li);
      }
    } else {
      explainEvidence.hidden = true;
    }
  }

  if (explainLimits && explainLimitsText) {
    if (limits.length > 0) {
      explainLimits.hidden = false;
      explainLimits.open = explanationSettings.includeLimitations;
      explainLimitsText.textContent = limits.join(' ');
    } else {
      explainLimits.hidden = true;
      explainLimitsText.textContent = '';
    }
  }
}

/**
 * @param {Record<string, any>} range
 */
async function navigateToRange(range) {
  try {
    const response = await bridge.request('navigate.to', {
      fileId: range.fileId,
      range,
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
 * @param {string} nodeId
 */
async function loadNodeExplanation(nodeId) {
  if (!currentDto || currentDto.dtoKind !== 'cfg' || !explainSection) {
    return;
  }
  const request = ++explainNodeRequest;
  const skeletonTimer = setTimeout(() => {
    if (request === explainNodeRequest && explainSection && explainItems) {
      explainSection.hidden = false;
      explainItems.textContent = 'Generating explanation…';
    }
  }, 100);
  try {
    const response = await bridge.request('explain.node', {
      nodeId,
      depth: activeExplainDepth,
    });
    clearTimeout(skeletonTimer);
    if (request !== explainNodeRequest || activeNodeId !== nodeId) {
      return;
    }
    renderNodeExplanation(response.payload);
  } catch {
    clearTimeout(skeletonTimer);
    if (request === explainNodeRequest) {
      clearExplanation();
    }
  }
}

/**
 * @param {import('../core/graph/dto.js').GraphDto} dto
 */
async function loadFunctionSummary(dto) {
  if (!fnSummary) {
    return;
  }
  if (dto.dtoKind !== 'cfg') {
    fnSummary.hidden = true;
    fnSummary.textContent = '';
    return;
  }
  const request = ++explainFunctionRequest;
  try {
    const response = await bridge.request('explain.function', {
      depth: activeExplainDepth,
    });
    if (request !== explainFunctionRequest || currentDto !== dto) {
      return;
    }
    const text = [response.payload?.summary, ...(response.payload?.limitations ?? [])]
      .filter(Boolean)
      .join(' ');
    if (text) {
      fnSummary.textContent = text;
      fnSummary.hidden = false;
    } else {
      fnSummary.hidden = true;
    }
  } catch {
    if (request === explainFunctionRequest) {
      fnSummary.hidden = true;
    }
  }
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
  activeNodeId = nodeId;
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
  if (node.details?.assignmentTarget) {
    list.append(...detailPair('assigns', node.details.assignmentTarget));
  }
  if (node.details?.calleeName) {
    list.append(...detailPair('calls target', node.details.calleeName));
  }
  if (node.details?.returnExpression) {
    list.append(...detailPair('emits', node.details.returnExpression));
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

  void loadNodeExplanation(nodeId);
  syncCallNodeButtons(node);
}

/**
 * @param {Record<string, any>|undefined} node
 */
function syncCallNodeButtons(node) {
  if (!callsExpandBtn || !callsCollapseBtn || !callsFocusBtn) {
    return;
  }
  const isCallGraph = currentDto?.dtoKind === 'call_graph';
  if (!isCallGraph || !node || node.kind === 'unresolved_bucket') {
    callsExpandBtn.disabled = true;
    callsCollapseBtn.disabled = true;
    return;
  }
  callsExpandBtn.disabled = Boolean(node.expanded);
  callsCollapseBtn.disabled = !node.expanded || Boolean(node.isCenter);
}

/**
 * @param {Record<string, any>} dto
 */
async function updateCallGraphSidePanel(dto) {
  if (!callsPanel) {
    return;
  }
  if (dto.dtoKind !== 'call_graph') {
    callsPanel.hidden = true;
    if (scopeBanner) {
      scopeBanner.hidden = true;
    }
    return;
  }
  callsPanel.hidden = false;
  if (scopeBanner) {
    scopeBanner.textContent = dto.scopeBanner || '';
    scopeBanner.hidden = !dto.scopeBanner;
  }
  if (callsFocusBtn) {
    const focused = Boolean(dto.focusedNodeId);
    callsFocusBtn.setAttribute('aria-pressed', focused ? 'true' : 'false');
    callsFocusBtn.textContent = focused ? 'Unfocus' : 'Focus';
  }

  if (unresolvedBucketDetails && unresolvedSummary && unresolvedList) {
    const bucket = dto.unresolvedBucket;
    if (bucket && bucket.count > 0) {
      unresolvedBucketDetails.hidden = false;
      unresolvedSummary.textContent = `${bucket.count} unresolved target${bucket.count === 1 ? '' : 's'}`;
      unresolvedList.replaceChildren();
      for (const reason of bucket.reasons ?? []) {
        const li = document.createElement('li');
        li.textContent = `${reason.reasonCode}: ${reason.count} site${reason.count === 1 ? '' : 's'}`;
        unresolvedList.appendChild(li);
      }
    } else {
      unresolvedBucketDetails.hidden = true;
    }
  }

  if (dto.centerSymbolId) {
    callersNextCursor = undefined;
    calleesNextCursor = undefined;
    callersList?.replaceChildren();
    calleesList?.replaceChildren();
    await Promise.all([
      loadNeighborPage('incoming', dto.centerSymbolId, false),
      loadNeighborPage('outgoing', dto.centerSymbolId, false),
    ]);
  }
}

/**
 * @param {'incoming'|'outgoing'} direction
 * @param {string} symbolId
 * @param {boolean} append
 */
async function loadNeighborPage(direction, symbolId, append) {
  const kind = direction === 'incoming' ? 'calls.incoming' : 'calls.outgoing';
  const cursor = direction === 'incoming' ? callersNextCursor : calleesNextCursor;
  const listEl = direction === 'incoming' ? callersList : calleesList;
  const headingEl = direction === 'incoming' ? callersHeading : calleesHeading;
  const moreBtn = direction === 'incoming' ? callersMoreBtn : calleesMoreBtn;
  if (!listEl) {
    return;
  }
  try {
    const response = await bridge.request(kind, {
      symbolId,
      limit: 50,
      ...(append && cursor ? { cursor } : {}),
    });
    const payload = response.payload ?? {};
    if (!append) {
      listEl.replaceChildren();
    }
    if (headingEl) {
      headingEl.textContent =
        direction === 'incoming'
          ? `Callers (${payload.total ?? 0})`
          : `Callees (${payload.total ?? 0})`;
    }
    for (const item of payload.items ?? []) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cf-evidence-link';
      btn.textContent = `${item.displayName} (${item.status}${item.callSiteCount > 1 ? ` ×${item.callSiteCount}` : ''})`;
      btn.addEventListener('click', () => {
        renderer.select(item.symbolId);
      });
      li.appendChild(btn);
      listEl.appendChild(li);
    }
    if (direction === 'incoming') {
      callersNextCursor = payload.nextCursor;
    } else {
      calleesNextCursor = payload.nextCursor;
    }
    if (moreBtn) {
      moreBtn.hidden = !payload.nextCursor;
    }
  } catch {
    if (moreBtn) {
      moreBtn.hidden = true;
    }
  }
}

/**
 * @param {Record<string, any>} next
 */
function applySettings(next) {
  const previousMaxLines = settings.maxLines;
  settings = resolvePreviewSettings({ ...settings, ...next });
  if (next?.explanation && typeof next.explanation === 'object') {
    explanationSettings = resolveExplanationSettings(next.explanation);
    activeExplainDepth = explanationSettings.defaultDepth;
    if (explainDepthSelect) {
      explainDepthSelect.value = String(activeExplainDepth);
    }
    if (activeNodeId) {
      void loadNodeExplanation(activeNodeId);
    }
    if (currentDto?.dtoKind === 'cfg') {
      void loadFunctionSummary(currentDto);
    }
  }
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
      typeof slice?.languageId === 'string' && slice.languageId
        ? slice.languageId
        : currentDto?.language || slice?.path || node.range?.fileId || '';
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
  if (previewExplain) {
    previewExplain.hidden = true;
    previewExplain.textContent = '';
  }
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
  if (previewExplain && currentDto?.dtoKind === 'cfg') {
    const requestForExplain = previewRequest + 1;
    void bridge
      .request('explain.node', { nodeId, depth: 1 })
      .then((res) => {
        if (
          previewNodeId === nodeId &&
          previewRequest <= requestForExplain &&
          res.payload?.summary
        ) {
          previewExplain.textContent = res.payload.summary;
          previewExplain.hidden = false;
        }
      })
      .catch(() => {});
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

const SHAPE_LEGEND_ITEMS = [
  { kinds: ['entry', 'exit'], sample: 'entry', label: 'Start / end' },
  { kinds: ['condition'], sample: 'condition', label: 'Decision' },
  { kinds: ['multiway'], sample: 'multiway', label: 'Switch / multi-way' },
  { kinds: ['loop_header', 'loop_latch'], sample: 'loop_header', label: 'Loop' },
  { kinds: ['call', 'await'], sample: 'call', label: 'Call / await' },
  { kinds: ['return', 'throw'], sample: 'return', label: 'Return / throw' },
  { kinds: ['merge'], sample: 'merge', label: 'Merge' },
  {
    kinds: [
      'statement',
      'loop_body_entry',
      'catch_entry',
      'finally_entry',
      'break',
      'continue',
      'unreachable',
      'unmodeled',
    ],
    sample: 'statement',
    label: 'Statement',
  },
];

/**
 * @param {import('../core/graph/dto.js').GraphDto} dto
 */
function renderShapeLegend(dto) {
  if (!shapeLegend || !shapeLegendList) {
    return;
  }
  if (dto?.dtoKind !== 'cfg') {
    shapeLegend.hidden = true;
    shapeLegendList.replaceChildren();
    return;
  }

  const present = new Set((dto.nodes ?? []).map((node) => node.kind));
  const items = SHAPE_LEGEND_ITEMS.filter((item) =>
    item.kinds.some((kind) => present.has(kind)),
  );
  shapeLegendList.replaceChildren();
  if (items.length === 0) {
    shapeLegend.hidden = true;
    return;
  }

  for (const item of items) {
    const li = document.createElement('li');
    li.className = 'cf-shape-legend-item';
    li.append(createShapeGlyph(item.sample), document.createTextNode(item.label));
    shapeLegendList.appendChild(li);
  }
  shapeLegend.hidden = false;
}

/**
 * Miniature SVG glyph for the shape legend. It reuses the renderer's outline
 * so the footnote can never drift from what the graph draws.
 *
 * @param {string} kind
 * @returns {SVGSVGElement}
 */
function createShapeGlyph(kind) {
  const svgNs = 'http://www.w3.org/2000/svg';
  const width = 34;
  const height = 18;
  const glyph = /** @type {SVGSVGElement} */ (document.createElementNS(svgNs, 'svg'));
  glyph.setAttribute('class', 'cf-shape-glyph');
  glyph.setAttribute('viewBox', `0 0 ${width} ${height}`);
  glyph.setAttribute('aria-hidden', 'true');
  const outline = shapeOutline(kind, width, height);
  const shape = document.createElementNS(svgNs, outline.tag);
  shape.setAttribute('class', 'cf-node-box cf-node-shape');
  for (const [key, value] of Object.entries(outline.attrs)) {
    shape.setAttribute(key, String(value));
  }
  glyph.appendChild(shape);
  return glyph;
}

/**
 * @param {import('../core/graph/dto.js').GraphDto} dto
 */
function renderLegend(dto) {
  legend.replaceChildren();
  const statuses = Array.isArray(dto?.legend?.statuses) ? dto.legend.statuses : [];
  for (const statusName of statuses) {
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
  const edgeKinds = Array.isArray(dto?.legend?.edgeKinds) ? dto.legend.edgeKinds : [];
  for (const edgeKind of edgeKinds) {
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
  empty.hidden = true;
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
  void loadFunctionSummary(dto);
  void updateCallGraphSidePanel(dto);
  updateZoomBar(dto);
  if (switchPerspectiveBtn) {
    switchPerspectiveBtn.hidden = !selectedSymbolId || dto.dtoKind === 'semantic_zoom';
    switchPerspectiveBtn.textContent =
      dto.dtoKind === 'call_graph' ? 'Show in CFG' : 'Show in Call Graph';
  }
  const subject =
    dto.dtoKind === 'cfg' && dto.function
      ? `${dto.function.qualifiedName} · CFG`
      : dto.dtoKind === 'call_graph'
        ? `${dto.centerSymbolId} · Call Graph`
        : dto.dtoKind === 'semantic_zoom'
          ? `${dto.level ?? 'Overview'} · Semantic Zoom`
          : 'graph';
  setStatus(
    `${subject} · ${dto.language ?? 'workspace'} · ${dto.nodes.length} nodes · ${dto.edges.length} edges · ${dto.completeness ?? 'complete'}`,
  );
  meta.textContent = `${dto.adapterId ?? 'codeflow'} · ${subject} · dto v${dto.dtoVersion}`;
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
 * @param {Record<string, any>} dto
 */
function updateZoomBar(dto) {
  if (!zoomBar) {
    return;
  }
  if (dto.dtoKind !== 'semantic_zoom') {
    zoomBar.hidden = true;
    return;
  }
  zoomBar.hidden = false;
  if (zoomLevelBadge) {
    zoomLevelBadge.textContent = dto.level ? `${dto.level}` : 'Semantic Zoom';
  }
  if (zoomBreadcrumbs && Array.isArray(dto.breadcrumbs)) {
    zoomBreadcrumbs.replaceChildren();
    for (const [index, crumb] of dto.breadcrumbs.entries()) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cf-button';
      btn.style.padding = '2px 8px';
      btn.style.fontSize = '11px';
      btn.textContent = crumb.label || crumb.scopeId || `Level ${index}`;
      btn.addEventListener('click', async () => {
        try {
          const res = await bridge.request('zoom.breadcrumb', { index });
          handleGraph(res.payload);
        } catch (e) {
          setBanner(`Could not navigate breadcrumb: ${e?.message ?? e}`, true);
        }
      });
      li.appendChild(btn);
      zoomBreadcrumbs.appendChild(li);
    }
  }
  if (zoomChips && Array.isArray(dto.filterChips)) {
    zoomChips.replaceChildren();
    for (const chip of dto.filterChips) {
      const span = document.createElement('span');
      span.className = 'cf-badge';
      span.textContent = `${chip.label || chip.kind} (${chip.count ?? 0})`;
      zoomChips.appendChild(span);
    }
  }
}

/**
 * @param {string} nodeId
 * @param {Record<string, any>} [node]
 */
async function descendSemanticZoom(nodeId, node = nodeById(nodeId)) {
  if (!node) {
    return;
  }
  const currentLevel = currentDto?.level;
  let nextLevel = 'L1_MODULE';
  if (currentLevel === 'L0_WORKSPACE') nextLevel = 'L1_MODULE';
  else if (currentLevel === 'L1_MODULE') nextLevel = 'L2_FILE';
  else if (currentLevel === 'L2_FILE') nextLevel = 'L3_SYMBOL';
  else if (currentLevel === 'L3_SYMBOL') nextLevel = 'L4_FUNCTION';
  else if (currentLevel === 'L4_FUNCTION') nextLevel = 'L5_STATEMENT';

  try {
    const res = await bridge.request('zoom.descend', {
      level: nextLevel,
      scopeId: node.scopeId || node.id,
      label: node.label,
    });
    handleGraph(res.payload);
  } catch (error) {
    setBanner(`Could not descend: ${error?.message ?? String(error)}`, true);
  }
}

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

async function loadSemanticZoom() {
  setStatus('Loading semantic zoom…');
  setBanner('');
  try {
    const response = await bridge.request('zoom.open', {});
    activePerspective = 'semantic_zoom';
    if (perspectiveSelect) {
      perspectiveSelect.value = 'semantic_zoom';
    }
    handleGraph(response.payload);
    return true;
  } catch (error) {
    setBanner(`Could not open semantic zoom: ${error?.message ?? String(error)}`, true);
    setStatus('Semantic zoom unavailable');
    return false;
  }
}

/**
 * @param {string} symbolId
 */
async function loadCallGraph(symbolId) {
  setStatus('Building call graph…');
  setBanner('');
  try {
    const response = await bridge.request('calls.load', { symbolId });
    selectedSymbolId = symbolId;
    activePerspective = 'call_graph';
    if (perspectiveSelect) {
      perspectiveSelect.value = 'call_graph';
    }
    handleGraph(response.payload);
    return true;
  } catch (error) {
    setBanner(`Could not build call graph: ${error?.message ?? String(error)}`, true);
    setStatus('Call graph unavailable');
    return false;
  }
}

async function loadGraph() {
  setStatus('Loading graph…');
  setBanner('');
  if (activePerspective === 'semantic_zoom') {
    const loaded = await loadSemanticZoom();
    if (loaded) {
      return;
    }
  }
  try {
    const response = await bridge.request('cfg.functions', {});
    const list = Array.isArray(response.payload.functions) ? response.payload.functions : [];
    if (list.length > 0) {
      renderFunctionPicker(list);
      const retained =
        selectedSymbolId && list.some((entry) => entry.symbolId === selectedSymbolId)
          ? selectedSymbolId
          : list[0].symbolId;
      const loaded =
        activePerspective === 'call_graph'
          ? await loadCallGraph(retained)
          : await loadCfg(retained);
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
    if (activePerspective === 'call_graph') {
      void loadCallGraph(symbolId);
    } else {
      void loadCfg(symbolId);
    }
  }
});

perspectiveSelect?.addEventListener('change', () => {
  const val = perspectiveSelect.value;
  activePerspective =
    val === 'call_graph' ? 'call_graph' : val === 'semantic_zoom' ? 'semantic_zoom' : 'cfg';
  if (activePerspective === 'semantic_zoom') {
    void loadSemanticZoom();
    return;
  }
  const symbolToUse = selectedSymbolId || (functionPicker?.options[0]?.value ?? null);
  if (symbolToUse) {
    if (activePerspective === 'call_graph') {
      void loadCallGraph(symbolToUse);
    } else {
      void loadCfg(symbolToUse);
    }
  } else {
    void loadGraph();
  }
});

let searchDebounce = null;
zoomSearch?.addEventListener('input', () => {
  if (searchDebounce) {
    clearTimeout(searchDebounce);
  }
  searchDebounce = setTimeout(async () => {
    searchDebounce = null;
    const queryText = zoomSearch.value.trim();
    if (!queryText) {
      return;
    }
    try {
      const res = await bridge.request('zoom.search', { queryText });
      const items = res.payload?.items ?? res.payload?.results?.items ?? [];
      if (items.length > 0) {
        const jump = await bridge.request('zoom.search', { jumpItem: items[0] });
        handleGraph(jump.payload);
      }
    } catch {
      // Non-fatal
    }
  }, 300);
});

switchPerspectiveBtn?.addEventListener('click', () => {
  const targetSymbol =
    activeNodeId && currentDto?.dtoKind === 'call_graph' && !activeNodeId.startsWith('bucket:')
      ? activeNodeId
      : selectedSymbolId || (functionPicker?.options[0]?.value ?? null);
  if (!targetSymbol) {
    return;
  }
  if (currentDto?.dtoKind === 'call_graph') {
    activePerspective = 'cfg';
    if (perspectiveSelect) {
      perspectiveSelect.value = 'cfg';
    }
    void loadCfg(targetSymbol);
  } else {
    activePerspective = 'call_graph';
    if (perspectiveSelect) {
      perspectiveSelect.value = 'call_graph';
    }
    void loadCallGraph(targetSymbol);
  }
});

callsExpandBtn?.addEventListener('click', async () => {
  if (!activeNodeId || currentDto?.dtoKind !== 'call_graph') {
    return;
  }
  try {
    const res = await bridge.request('calls.expand', { symbolId: activeNodeId });
    handleGraph(res.payload);
  } catch (error) {
    setBanner(`Expand failed: ${error?.message ?? String(error)}`, true);
  }
});

callsCollapseBtn?.addEventListener('click', async () => {
  if (!activeNodeId || currentDto?.dtoKind !== 'call_graph') {
    return;
  }
  try {
    const res = await bridge.request('calls.collapse', { symbolId: activeNodeId });
    handleGraph(res.payload);
  } catch (error) {
    setBanner(`Collapse failed: ${error?.message ?? String(error)}`, true);
  }
});

callsFocusBtn?.addEventListener('click', async () => {
  if (currentDto?.dtoKind !== 'call_graph') {
    return;
  }
  const nextFocus = currentDto.focusedNodeId ? null : (activeNodeId ?? currentDto.centerSymbolId);
  try {
    const res = await bridge.request('calls.focus', { symbolId: nextFocus });
    handleGraph(res.payload);
  } catch (error) {
    setBanner(`Focus failed: ${error?.message ?? String(error)}`, true);
  }
});

callsFilterStatus?.addEventListener('change', async () => {
  if (currentDto?.dtoKind !== 'call_graph') {
    return;
  }
  const value = callsFilterStatus.value;
  const statuses = value === 'all' ? null : value.split(',');
  try {
    const res = await bridge.request('calls.filter', { statuses });
    handleGraph(res.payload);
  } catch (error) {
    setBanner(`Filter failed: ${error?.message ?? String(error)}`, true);
  }
});

callersMoreBtn?.addEventListener('click', () => {
  if (currentDto?.centerSymbolId) {
    void loadNeighborPage('incoming', currentDto.centerSymbolId, true);
  }
});

calleesMoreBtn?.addEventListener('click', () => {
  if (currentDto?.centerSymbolId) {
    void loadNeighborPage('outgoing', currentDto.centerSymbolId, true);
  }
});

explainDepthSelect?.addEventListener('change', () => {
  activeExplainDepth = clampExplanationDepth(explainDepthSelect.value);
  if (activeNodeId) {
    void loadNodeExplanation(activeNodeId);
  }
  if (currentDto?.dtoKind === 'cfg') {
    void loadFunctionSummary(currentDto);
  }
});

// Route VS Code extension-host messages into the bridge so every pending
// request is resolved (or rejected) rather than timing out silently.
window.addEventListener('message', (event) => {
  void bridge.handleMessage(event.data);
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
