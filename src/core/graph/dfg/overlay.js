/**
 * DFG overlay for the Phase 10 zoom OVERLAY_SLOTS.DFG slot.
 *
 * The overlay is a view-layer adapter: it takes a Dfg and the currently
 * selected binding (if any) and produces a minimal descriptor the webview
 * renderer can merge with the CFG/zoom drawing.
 *
 * Rules:
 * - Only nodes/edges for the selected binding (variable trace mode).
 * - When no binding is selected, the overlay is empty with an empty-state message.
 * - Limitation banners are always included if the DFG is partial or has limitations.
 * - No resolved status is fabricated.
 */

import { traceBinding, bindingDetailEntries } from './query.js';
import { glyphForFlowStatus, flowEdgeLabel, SLICE_BUDGET_MS } from './kinds.js';

/**
 * @typedef {import('./model.js').Dfg} Dfg
 */

/**
 * @typedef {Object} OverlayNode
 * @property {string} id
 * @property {string} cfgNodeId
 * @property {string} kind
 * @property {string} status
 * @property {string} glyph
 * @property {string} [reasonCode]
 * @property {object|null} range
 */

/**
 * @typedef {Object} OverlayEdge
 * @property {string} from
 * @property {string} to
 * @property {string} kind
 * @property {string} label
 * @property {string} status
 * @property {string} [reasonCode]
 */

/**
 * @typedef {Object} DfgOverlay
 * @property {string} slot                - always 'dfg'
 * @property {OverlayNode[]} nodes
 * @property {OverlayEdge[]} edges
 * @property {string[]} limitations
 * @property {string[]} detailEntries     - human-readable flow facts
 * @property {boolean} partial
 * @property {string} emptyStateMessage   - non-empty when nodes is empty
 * @property {string|null} selectedBinding
 */

/**
 * Build a DFG overlay descriptor for the webview.
 *
 * @param {Dfg|null} dfg
 * @param {string|null} bindingId
 * @param {number} [budgetMs]
 * @returns {DfgOverlay}
 */
export function buildDfgOverlay(dfg, bindingId, budgetMs = SLICE_BUDGET_MS) {
  if (!dfg) {
    return emptyOverlay(null, 'No data-flow facts available. Run analysis first.');
  }

  if (!bindingId) {
    return emptyOverlay(
      null,
      'Select a variable in the detail panel to trace its data flow.',
      dfg.limitations,
    );
  }

  const trace = traceBinding(dfg, bindingId, budgetMs);

  if (trace.nodes.length === 0) {
    return emptyOverlay(
      bindingId,
      `No data-flow facts found for this variable. ${dfg.limitations.join(' ')}`.trim(),
      dfg.limitations,
    );
  }

  const overlayNodes = trace.nodes.map((n) => ({
    id:        n.id,
    cfgNodeId: n.cfgNodeId,
    kind:      n.kind,
    status:    n.status,
    glyph:     glyphForFlowStatus(n.status),
    range:     n.range,
    ...(n.reasonCode ? { reasonCode: n.reasonCode } : {}),
  }));

  const overlayEdges = trace.edges.map((e) => ({
    from:   e.from,
    to:     e.to,
    kind:   e.kind,
    label:  flowEdgeLabel(e.kind),
    status: e.status,
    ...(e.reasonCode ? { reasonCode: e.reasonCode } : {}),
  }));

  const detailEntries = bindingDetailEntries(dfg, bindingId).map((d) => d.text);

  const limitations = [
    ...dfg.limitations,
    ...(trace.partial ? [`Trace truncated due to size. ${SLICE_BUDGET_MS} ms budget exhausted.`] : []),
  ];

  return {
    slot: 'dfg',
    nodes: overlayNodes,
    edges: overlayEdges,
    limitations: [...new Set(limitations)],
    detailEntries,
    partial: dfg.partial || trace.partial,
    emptyStateMessage: '',
    selectedBinding: bindingId,
  };
}

/**
 * @param {string|null} bindingId
 * @param {string} message
 * @param {string[]} [limitations]
 * @returns {DfgOverlay}
 */
function emptyOverlay(bindingId, message, limitations = []) {
  return {
    slot: 'dfg',
    nodes: [],
    edges: [],
    limitations,
    detailEntries: [],
    partial: false,
    emptyStateMessage: message,
    selectedBinding: bindingId,
  };
}
