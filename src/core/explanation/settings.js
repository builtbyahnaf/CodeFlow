/**
 * Explanation settings defaults and normalization.
 *
 * `package.json` declares the same defaults; `tests/unit/explanationSettings.test.js`
 * enforces 1:1 parity.
 */

export const EXPLANATION_DEFAULTS = Object.freeze({
  defaultDepth: 2,
  showEvidence: true,
  includeLimitations: true,
});

/**
 * @param {unknown} value
 * @returns {1|2|3|4}
 */
export function clampExplanationDepth(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    return EXPLANATION_DEFAULTS.defaultDepth;
  }
  const clamped = Math.min(4, Math.max(1, Math.trunc(num)));
  return /** @type {1|2|3|4} */ (clamped);
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
 * Normalize explanation settings from VS Code configuration, protocol payloads,
 * or test inputs without throwing.
 *
 * @param {Record<string, unknown>} [raw]
 * @returns {{defaultDepth: 1|2|3|4, showEvidence: boolean, includeLimitations: boolean}}
 */
export function resolveExplanationSettings(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  return {
    defaultDepth: clampExplanationDepth(source.defaultDepth),
    showEvidence: asBoolean(source.showEvidence, EXPLANATION_DEFAULTS.showEvidence),
    includeLimitations: asBoolean(
      source.includeLimitations,
      EXPLANATION_DEFAULTS.includeLimitations,
    ),
  };
}

/**
 * @param {{affectsConfiguration?: (section: string) => boolean}} event
 * @returns {boolean}
 */
export function explanationSettingsChanged(event) {
  return Boolean(event?.affectsConfiguration?.('codeflow.explanation'));
}
