/**
 * Theme Non-Color Encodings and Colorblind Safety (Phase 12 §4.3, P12-04, AC-12.2).
 *
 * Ensures every semantic distinction (resolved, possible, unresolved, control flow,
 * data flow, calls) carries distinct shapes, dash patterns, and glyphs so that
 * graphs remain 100% comprehensible under complete desaturation / colorblindness.
 */

/** Visual glyphs for status distinction without color. */
export const STATUS_GLYPHS = Object.freeze({
  RESOLVED: '✓',
  POSSIBLE: '?',
  UNRESOLVED: '✗',
  PARTIAL: '⚠',
  STALE: '↻',
});

/** Stroke dash patterns for SVG edge rendering. */
export const EDGE_DASH_PATTERNS = Object.freeze({
  RESOLVED_CALL: 'none', // Solid line
  POSSIBLE_CALL: '6,4', // Dashed line
  UNRESOLVED_CALL: '2,3', // Dotted line
  DATA_FLOW: '8,3,2,3', // Dash-dot line
  CONTROL_FLOW: 'none', // Solid line
  DEGRADED_FLOW: '4,4', // Uniform short dash
});

/** Border style specifications for node rendering. */
export const NODE_BORDER_STYLES = Object.freeze({
  RESOLVED: 'solid',
  POSSIBLE: 'dashed',
  UNRESOLVED: 'dotted',
  PARTIAL: 'double',
  STALE: 'dashed',
});

/** Node shape indicators (e.g. for badges and canvas nodes). */
export const NODE_SHAPE_ROLES = Object.freeze({
  FUNCTION: 'rectangle-rounded',
  CLASS: 'rectangle-sharp',
  METHOD: 'stadium',
  VARIABLE: 'diamond',
  CFG_CONSTRUCT: 'hexagon',
  STATEMENT: 'rectangle-pill',
  CLUSTER: 'subgraph-frame',
});

/**
 * Get the non-color visual descriptor for a given status.
 *
 * @param {'resolved' | 'possible' | 'unresolved' | 'partial' | 'stale'} status
 * @returns {{
 *   glyph: string,
 *   borderStyle: string,
 *   dashArray: string,
 *   accessibleLabel: string
 * }}
 */
export function getStatusPatternDescriptor(status) {
  const norm = String(status).toLowerCase();
  switch (norm) {
    case 'resolved':
      return {
        glyph: STATUS_GLYPHS.RESOLVED,
        borderStyle: NODE_BORDER_STYLES.RESOLVED,
        dashArray: EDGE_DASH_PATTERNS.RESOLVED_CALL,
        accessibleLabel: 'Resolved (confirmed)',
      };
    case 'possible':
      return {
        glyph: STATUS_GLYPHS.POSSIBLE,
        borderStyle: NODE_BORDER_STYLES.POSSIBLE,
        dashArray: EDGE_DASH_PATTERNS.POSSIBLE_CALL,
        accessibleLabel: 'Possible (candidate)',
      };
    case 'unresolved':
      return {
        glyph: STATUS_GLYPHS.UNRESOLVED,
        borderStyle: NODE_BORDER_STYLES.UNRESOLVED,
        dashArray: EDGE_DASH_PATTERNS.UNRESOLVED_CALL,
        accessibleLabel: 'Unresolved (unmapped)',
      };
    case 'partial':
      return {
        glyph: STATUS_GLYPHS.PARTIAL,
        borderStyle: NODE_BORDER_STYLES.PARTIAL,
        dashArray: EDGE_DASH_PATTERNS.DEGRADED_FLOW,
        accessibleLabel: 'Partial (bounded)',
      };
    case 'stale':
      return {
        glyph: STATUS_GLYPHS.STALE,
        borderStyle: NODE_BORDER_STYLES.STALE,
        dashArray: EDGE_DASH_PATTERNS.POSSIBLE_CALL,
        accessibleLabel: 'Stale (document modified)',
      };
    default:
      return {
        glyph: '',
        borderStyle: 'solid',
        dashArray: 'none',
        accessibleLabel: norm,
      };
  }
}
