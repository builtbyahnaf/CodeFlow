/**
 * Language-neutral CFG vocabulary.
 *
 * These names are frozen by `docs/GRAPH_SPECIFICATION.md`. Adapters describe
 * source structure with `ControlConstruct` trees; this module owns the smaller
 * set of nodes and edges the renderer understands.
 */

/** Node kinds a CFG may contain. */
export const CFG_NODE_KINDS = Object.freeze([
  'entry',
  'exit',
  'statement',
  'condition',
  'multiway',
  'merge',
  'loop_header',
  'loop_latch',
  'loop_body_entry',
  'break',
  'continue',
  'return',
  'throw',
  'call',
  'await',
  'catch_entry',
  'finally_entry',
  'unreachable',
  'unmodeled',
]);

/** Edge kinds a CFG may contain. */
export const CFG_EDGE_KINDS = Object.freeze([
  'seq',
  'true',
  'false',
  'case',
  'default',
  'loop_back',
  'break',
  'continue',
  'return',
  'throw',
  'exception',
  'finally',
  'unreachable',
]);

/** Statuses shared with CSR relationships. */
export const CFG_STATUSES = Object.freeze([
  'resolved',
  'inferred',
  'possible',
  'unresolved',
  'stale',
]);

/** Degradation codes emitted by the builder. */
export const CFG_DEGRADATION_CODES = Object.freeze([
  'unmodeled_construct',
  'goto_flow',
  'indirect_goto_flow',
  'iteration_source_opaque',
  'call_site_unrecorded',
  'condition_shape_unmodeled',
  'orphan_jump',
  'modeled_exception_path',
  'analysis_partial',
  'truncated',
]);

/** Edge kinds that do not advance the normal successor path. */
export const ABRUPT_EDGE_KINDS = Object.freeze(['break', 'continue', 'return', 'throw']);

/** Edges excluded from rank computation because they point backwards. */
export const BACK_EDGE_KINDS = Object.freeze(['loop_back', 'continue']);

/**
 * @param {string} status
 * @returns {string}
 */
export function dashForStatus(status) {
  switch (status) {
    case 'inferred':
      return '8 4';
    case 'possible':
      return '3 3';
    case 'unresolved':
      return '2 5';
    case 'stale':
      return '1 4';
    default:
      return '';
  }
}

/**
 * Non-colour cue for a status. Phase 12 will extend this into a full
 * accessibility pass; the DTO already carries the field.
 *
 * @param {string} status
 * @returns {string}
 */
export function glyphForStatus(status) {
  switch (status) {
    case 'resolved':
      return '●';
    case 'inferred':
      return '◐';
    case 'possible':
      return '○';
    case 'unresolved':
      return '✕';
    case 'stale':
      return '⋯';
    default:
      return '?';
  }
}

/**
 * @param {string} kind
 * @returns {string}
 */
export function edgeLabel(kind, extra = '') {
  if (extra) {
    return kind === 'case' ? `case ${extra}` : extra;
  }
  switch (kind) {
    case 'seq':
      return '';
    case 'loop_back':
      return 'loop back';
    case 'exception':
      return 'exception';
    case 'finally':
      return 'finally';
    case 'unreachable':
      return 'unreachable';
    default:
      return kind;
  }
}
