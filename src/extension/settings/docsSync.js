/**
 * Settings Documentation Synchronizer & Enforcement (Phase 12 §6, P12-11, AC-12.13).
 *
 * Verifies that 100% of settings contributed in package.json configuration
 * are documented in docs/SETTINGS.md.
 */

/**
 * Check that all contributed package.json settings exist in markdown documentation.
 *
 * @param {Record<string, unknown>} packageJson
 * @param {string} settingsMarkdownContent
 * @returns {{
 *   inSync: boolean,
 *   contributedCount: number,
 *   documentedCount: number,
 *   missingFromDocs: string[],
 * }}
 */
export function checkSettingsDocumentation(packageJson, settingsMarkdownContent) {
  const properties =
    /** @type {Record<string, unknown>} */ (
      packageJson?.contributes?.configuration?.properties ?? {}
    );
  const contributedKeys = Object.keys(properties);

  const missingFromDocs = [];
  for (const key of contributedKeys) {
    if (!settingsMarkdownContent.includes(`\`${key}\``)) {
      missingFromDocs.push(key);
    }
  }

  return {
    inSync: missingFromDocs.length === 0,
    contributedCount: contributedKeys.length,
    documentedCount: contributedKeys.length - missingFromDocs.length,
    missingFromDocs,
  };
}
