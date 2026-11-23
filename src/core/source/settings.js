/**
 * Preview and navigation settings.
 *
 * The defaults here are the contract. `package.json` declares the same keys and
 * defaults; `tests/unit/sourceSettings.test.js` keeps the manifest and this
 * module in sync.
 */

export const PREVIEW_DEFAULTS = Object.freeze({
  enabled: true,
  delayMs: 300,
  maxLines: 12,
  syntaxHighlighting: true,
  clickToNavigate: true,
  pinByDefault: false,
  openInPreviewTab: false,
});

/**
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampInteger(value, fallback, min, max) {
  const candidate = Number(value);
  if (!Number.isFinite(candidate)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(candidate)));
}

/**
 * @param {unknown} value
 * @param {boolean} fallback
 * @returns {boolean}
 */
function asBoolean(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

/**
 * Normalize settings from any source (VS Code configuration, protocol payload,
 * tests). Unknown shapes fall back to the documented defaults; nothing throws.
 *
 * @param {Record<string, unknown>} [raw]
 * @returns {{enabled: boolean, delayMs: number, maxLines: number, syntaxHighlighting: boolean, clickToNavigate: boolean, pinByDefault: boolean, openInPreviewTab: boolean}}
 */
export function resolvePreviewSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: asBoolean(source.enabled, PREVIEW_DEFAULTS.enabled),
    delayMs: clampInteger(source.delayMs, PREVIEW_DEFAULTS.delayMs, 0, 2_000),
    maxLines: clampInteger(source.maxLines, PREVIEW_DEFAULTS.maxLines, 4, 40),
    syntaxHighlighting: asBoolean(source.syntaxHighlighting, PREVIEW_DEFAULTS.syntaxHighlighting),
    clickToNavigate: asBoolean(source.clickToNavigate, PREVIEW_DEFAULTS.clickToNavigate),
    pinByDefault: asBoolean(source.pinByDefault, PREVIEW_DEFAULTS.pinByDefault),
    openInPreviewTab: asBoolean(source.openInPreviewTab, PREVIEW_DEFAULTS.openInPreviewTab),
  };
}

/**
 * True when a configuration-change event touches a key this module owns.
 *
 * @param {{affectsConfiguration?: (section: string) => boolean}} event
 * @returns {boolean}
 */
export function settingsChanged(event) {
  return (
    Boolean(event?.affectsConfiguration?.('codeflow.preview')) ||
    Boolean(event?.affectsConfiguration?.('codeflow.navigation'))
  );
}
