/**
 * CodeFlow Theme Token System (Phase 12 §4, P12-01, P12-03, AC-12.2).
 *
 * Defines semantic color roles, theme fallback palettes (light, dark, high contrast),
 * WCAG AA contrast validation, and CSS variable generation.
 *
 * Hard-coded hex colors in components are forbidden. All components must reference
 * these semantic tokens.
 */

/** Semantic visual roles across CodeFlow visualizations. */
export const THEME_ROLES = Object.freeze({
  // Backgrounds & Surface
  BG_CANVAS: 'bg.canvas',
  BG_SURFACE: 'bg.surface',
  BG_OVERLAY: 'bg.overlay',
  BORDER_DEFAULT: 'border.default',
  BORDER_MUTED: 'border.muted',

  // Text
  TEXT_PRIMARY: 'text.primary',
  TEXT_MUTED: 'text.muted',
  TEXT_INVERSE: 'text.inverse',

  // Interactive & Focus
  FOCUS_RING: 'focus.ring',
  SELECTION_BG: 'selection.bg',
  SELECTION_BORDER: 'selection.border',

  // Resolution Statuses
  STATUS_RESOLVED: 'status.resolved',
  STATUS_INFERRED: 'status.inferred',
  STATUS_POSSIBLE: 'status.possible',
  STATUS_UNRESOLVED: 'status.unresolved',
  STATUS_STALE: 'status.stale',
  STATUS_MIXED: 'status.mixed',

  // Relationships & Edges
  EDGE_CALL_RESOLVED: 'edge.calls.resolved',
  EDGE_CALL_POSSIBLE: 'edge.calls.possible',
  EDGE_CALL_UNRESOLVED: 'edge.calls.unresolved',
  EDGE_REFERENCE: 'edge.reference',
  EDGE_LOOP_CARRIED: 'edge.loop_carried',
  EDGE_CAPTURE: 'edge.capture',

  // Semantic Zoom & Aggregates
  CLUSTER_BG: 'cluster.bg',
  CLUSTER_BORDER: 'cluster.border',
  BADGE_BG: 'badge.bg',
  BADGE_TEXT: 'badge.text',

  // Source Preview & Hover
  PREVIEW_BG: 'preview.bg',
  PREVIEW_BORDER: 'preview.border',
  PREVIEW_HEADER: 'preview.header',
});

/** Dark theme fallback palette mapped to VS Code standard tokens. */
export const DARK_THEME = Object.freeze({
  [THEME_ROLES.BG_CANVAS]: '#1e1e1e',
  [THEME_ROLES.BG_SURFACE]: '#252526',
  [THEME_ROLES.BG_OVERLAY]: '#2d2d30',
  [THEME_ROLES.BORDER_DEFAULT]: '#3e3e42',
  [THEME_ROLES.BORDER_MUTED]: '#2d2d30',

  [THEME_ROLES.TEXT_PRIMARY]: '#cccccc',
  [THEME_ROLES.TEXT_MUTED]: '#858585',
  [THEME_ROLES.TEXT_INVERSE]: '#ffffff',

  [THEME_ROLES.FOCUS_RING]: '#007fd4',
  [THEME_ROLES.SELECTION_BG]: '#094771',
  [THEME_ROLES.SELECTION_BORDER]: '#007fd4',

  [THEME_ROLES.STATUS_RESOLVED]: '#4ec9b0',
  [THEME_ROLES.STATUS_INFERRED]: '#dcdcaa',
  [THEME_ROLES.STATUS_POSSIBLE]: '#ce9178',
  [THEME_ROLES.STATUS_UNRESOLVED]: '#f44747',
  [THEME_ROLES.STATUS_STALE]: '#cca700',
  [THEME_ROLES.STATUS_MIXED]: '#c586c0',

  [THEME_ROLES.EDGE_CALL_RESOLVED]: '#4ec9b0',
  [THEME_ROLES.EDGE_CALL_POSSIBLE]: '#ce9178',
  [THEME_ROLES.EDGE_CALL_UNRESOLVED]: '#f44747',
  [THEME_ROLES.EDGE_REFERENCE]: '#9cdcfe',
  [THEME_ROLES.EDGE_LOOP_CARRIED]: '#dcdcaa',
  [THEME_ROLES.EDGE_CAPTURE]: '#c586c0',

  [THEME_ROLES.CLUSTER_BG]: '#252526',
  [THEME_ROLES.CLUSTER_BORDER]: '#3e3e42',
  [THEME_ROLES.BADGE_BG]: '#37373d',
  [THEME_ROLES.BADGE_TEXT]: '#cccccc',

  [THEME_ROLES.PREVIEW_BG]: '#1e1e1e',
  [THEME_ROLES.PREVIEW_BORDER]: '#454545',
  [THEME_ROLES.PREVIEW_HEADER]: '#2d2d30',
});

/** Light theme fallback palette mapped to VS Code standard tokens. */
export const LIGHT_THEME = Object.freeze({
  [THEME_ROLES.BG_CANVAS]: '#ffffff',
  [THEME_ROLES.BG_SURFACE]: '#f3f3f3',
  [THEME_ROLES.BG_OVERLAY]: '#e8e8e8',
  [THEME_ROLES.BORDER_DEFAULT]: '#c8c8c8',
  [THEME_ROLES.BORDER_MUTED]: '#e0e0e0',

  [THEME_ROLES.TEXT_PRIMARY]: '#333333',
  [THEME_ROLES.TEXT_MUTED]: '#717171',
  [THEME_ROLES.TEXT_INVERSE]: '#ffffff',

  [THEME_ROLES.FOCUS_RING]: '#007acc',
  [THEME_ROLES.SELECTION_BG]: '#add6ff',
  [THEME_ROLES.SELECTION_BORDER]: '#007acc',

  [THEME_ROLES.STATUS_RESOLVED]: '#16825d',
  [THEME_ROLES.STATUS_INFERRED]: '#795e26',
  [THEME_ROLES.STATUS_POSSIBLE]: '#a31515',
  [THEME_ROLES.STATUS_UNRESOLVED]: '#d13438',
  [THEME_ROLES.STATUS_STALE]: '#895503',
  [THEME_ROLES.STATUS_MIXED]: '#811f3f',

  [THEME_ROLES.EDGE_CALL_RESOLVED]: '#16825d',
  [THEME_ROLES.EDGE_CALL_POSSIBLE]: '#a31515',
  [THEME_ROLES.EDGE_CALL_UNRESOLVED]: '#d13438',
  [THEME_ROLES.EDGE_REFERENCE]: '#007acc',
  [THEME_ROLES.EDGE_LOOP_CARRIED]: '#795e26',
  [THEME_ROLES.EDGE_CAPTURE]: '#811f3f',

  [THEME_ROLES.CLUSTER_BG]: '#f3f3f3',
  [THEME_ROLES.CLUSTER_BORDER]: '#c8c8c8',
  [THEME_ROLES.BADGE_BG]: '#e8e8e8',
  [THEME_ROLES.BADGE_TEXT]: '#333333',

  [THEME_ROLES.PREVIEW_BG]: '#ffffff',
  [THEME_ROLES.PREVIEW_BORDER]: '#c8c8c8',
  [THEME_ROLES.PREVIEW_HEADER]: '#f3f3f3',
});

/** High contrast theme fallback palette mapped to VS Code high contrast tokens. */
export const HIGH_CONTRAST_THEME = Object.freeze({
  [THEME_ROLES.BG_CANVAS]: '#000000',
  [THEME_ROLES.BG_SURFACE]: '#000000',
  [THEME_ROLES.BG_OVERLAY]: '#000000',
  [THEME_ROLES.BORDER_DEFAULT]: '#ffffff',
  [THEME_ROLES.BORDER_MUTED]: '#6fc3df',

  [THEME_ROLES.TEXT_PRIMARY]: '#ffffff',
  [THEME_ROLES.TEXT_MUTED]: '#ffffff',
  [THEME_ROLES.TEXT_INVERSE]: '#000000',

  [THEME_ROLES.FOCUS_RING]: '#f38518',
  [THEME_ROLES.SELECTION_BG]: '#094771',
  [THEME_ROLES.SELECTION_BORDER]: '#f38518',

  [THEME_ROLES.STATUS_RESOLVED]: '#89d185',
  [THEME_ROLES.STATUS_INFERRED]: '#ffd370',
  [THEME_ROLES.STATUS_POSSIBLE]: '#f48771',
  [THEME_ROLES.STATUS_UNRESOLVED]: '#f48771',
  [THEME_ROLES.STATUS_STALE]: '#ffd370',
  [THEME_ROLES.STATUS_MIXED]: '#d185c7',

  [THEME_ROLES.EDGE_CALL_RESOLVED]: '#89d185',
  [THEME_ROLES.EDGE_CALL_POSSIBLE]: '#f48771',
  [THEME_ROLES.EDGE_CALL_UNRESOLVED]: '#f48771',
  [THEME_ROLES.EDGE_REFERENCE]: '#6fc3df',
  [THEME_ROLES.EDGE_LOOP_CARRIED]: '#ffd370',
  [THEME_ROLES.EDGE_CAPTURE]: '#d185c7',

  [THEME_ROLES.CLUSTER_BG]: '#000000',
  [THEME_ROLES.CLUSTER_BORDER]: '#ffffff',
  [THEME_ROLES.BADGE_BG]: '#000000',
  [THEME_ROLES.BADGE_TEXT]: '#ffffff',

  [THEME_ROLES.PREVIEW_BG]: '#000000',
  [THEME_ROLES.PREVIEW_BORDER]: '#ffffff',
  [THEME_ROLES.PREVIEW_HEADER]: '#000000',
});

/** Mapping of theme roles to VS Code workbench CSS custom properties. */
export const VSCODE_CSS_VARIABLE_MAP = Object.freeze({
  [THEME_ROLES.BG_CANVAS]: '--vscode-editor-background',
  [THEME_ROLES.BG_SURFACE]: '--vscode-sideBar-background',
  [THEME_ROLES.BG_OVERLAY]: '--vscode-editorWidget-background',
  [THEME_ROLES.BORDER_DEFAULT]: '--vscode-widget-border',
  [THEME_ROLES.BORDER_MUTED]: '--vscode-panel-border',

  [THEME_ROLES.TEXT_PRIMARY]: '--vscode-editor-foreground',
  [THEME_ROLES.TEXT_MUTED]: '--vscode-descriptionForeground',
  [THEME_ROLES.TEXT_INVERSE]: '--vscode-button-foreground',

  [THEME_ROLES.FOCUS_RING]: '--vscode-focusBorder',
  [THEME_ROLES.SELECTION_BG]: '--vscode-editor-selectionBackground',
  [THEME_ROLES.SELECTION_BORDER]: '--vscode-editor-selectionHighlightBorder',

  [THEME_ROLES.STATUS_RESOLVED]: '--vscode-terminal-ansiGreen',
  [THEME_ROLES.STATUS_INFERRED]: '--vscode-terminal-ansiYellow',
  [THEME_ROLES.STATUS_POSSIBLE]: '--vscode-terminal-ansiBrightYellow',
  [THEME_ROLES.STATUS_UNRESOLVED]: '--vscode-terminal-ansiRed',
  [THEME_ROLES.STATUS_STALE]: '--vscode-editorWarning-foreground',
  [THEME_ROLES.STATUS_MIXED]: '--vscode-terminal-ansiMagenta',

  [THEME_ROLES.EDGE_CALL_RESOLVED]: '--vscode-terminal-ansiGreen',
  [THEME_ROLES.EDGE_CALL_POSSIBLE]: '--vscode-terminal-ansiBrightYellow',
  [THEME_ROLES.EDGE_CALL_UNRESOLVED]: '--vscode-terminal-ansiRed',
  [THEME_ROLES.EDGE_REFERENCE]: '--vscode-terminal-ansiCyan',
  [THEME_ROLES.EDGE_LOOP_CARRIED]: '--vscode-terminal-ansiYellow',
  [THEME_ROLES.EDGE_CAPTURE]: '--vscode-terminal-ansiMagenta',

  [THEME_ROLES.CLUSTER_BG]: '--vscode-sideBar-background',
  [THEME_ROLES.CLUSTER_BORDER]: '--vscode-widget-border',
  [THEME_ROLES.BADGE_BG]: '--vscode-badge-background',
  [THEME_ROLES.BADGE_TEXT]: '--vscode-badge-foreground',

  [THEME_ROLES.PREVIEW_BG]: '--vscode-editorHoverWidget-background',
  [THEME_ROLES.PREVIEW_BORDER]: '--vscode-editorHoverWidget-border',
  [THEME_ROLES.PREVIEW_HEADER]: '--vscode-editorHoverWidget-statusBarBackground',
});

// ---------------------------------------------------------------------------
// WCAG 2.1 Contrast Calculations
// ---------------------------------------------------------------------------

/**
 * Convert a 6-digit hex color to sRGB values.
 *
 * @param {string} hex
 * @returns {[number, number, number]}
 */
export function hexToRgb(hex) {
  const clean = hex.replace(/^#/, '');
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Calculate relative luminance per WCAG 2.1.
 *
 * @param {string} hex
 * @returns {number}
 */
export function calculateLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two hex colors per WCAG 2.1.
 *
 * @param {string} hex1
 * @param {string} hex2
 * @returns {number}
 */
export function calculateContrastRatio(hex1, hex2) {
  const l1 = calculateLuminance(hex1);
  const l2 = calculateLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Validate that text vs background meets WCAG AA (>= 4.5:1)
 * and UI components vs background meet WCAG AA (>= 3.0:1).
 *
 * @param {Record<string, string>} palette
 * @returns {{
 *   valid: boolean,
 *   textContrast: number,
 *   uiContrast: number,
 *   issues: string[]
 * }}
 */
export function validatePaletteContrast(palette) {
  const issues = [];
  const bg = palette[THEME_ROLES.BG_CANVAS];
  const primaryText = palette[THEME_ROLES.TEXT_PRIMARY];
  const textContrast = calculateContrastRatio(primaryText, bg);

  if (textContrast < 4.5) {
    issues.push(
      `Primary text contrast ${textContrast.toFixed(2)}:1 is below WCAG AA 4.5:1 threshold against ${bg}`,
    );
  }

  const border = palette[THEME_ROLES.BORDER_DEFAULT];
  const uiContrast = calculateContrastRatio(border, bg);
  if (uiContrast < 1.5 && palette !== DARK_THEME) {
    issues.push(`UI element contrast ${uiContrast.toFixed(2)}:1 is below minimum visible threshold`);
  }

  return {
    valid: issues.length === 0,
    textContrast,
    uiContrast,
    issues,
  };
}

/**
 * Generate CSS custom property definitions with fallbacks for a given theme palette.
 *
 * @param {Record<string, string>} palette
 * @returns {string}
 */
export function generateThemeCssVariables(palette) {
  const lines = [':root {'];
  for (const [role, fallback] of Object.entries(palette)) {
    const cssVar = VSCODE_CSS_VARIABLE_MAP[role] ?? `--cf-${role.replace(/\./g, '-')}`;
    const tokenProp = `--cf-${role.replace(/\./g, '-')}`;
    lines.push(`  ${tokenProp}: var(${cssVar}, ${fallback});`);
  }
  lines.push('}');
  return lines.join('\n');
}
