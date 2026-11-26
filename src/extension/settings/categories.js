/**
 * CodeFlow Settings UX & Categories (Phase 12 §6, P12-11, P12-12, AC-12.13).
 *
 * Organizes settings into intuitive functional categories for the `CodeFlow: Configure`
 * quick pick, and provides safe, confirmed reset handlers.
 */

export const SETTINGS_CATEGORIES = Object.freeze({
  ANALYSIS: 'analysis',
  INDEXING: 'indexing',
  PREVIEW: 'preview',
  EXPLANATION: 'explanation',
  APPEARANCE: 'appearance',
});

export const CATEGORY_DESCRIPTORS = Object.freeze([
  {
    id: SETTINGS_CATEGORIES.ANALYSIS,
    label: '$(gear) Analysis & Toolchain',
    description: 'C++ and JavaScript parser bounds, paths, compile_commands.json, timeouts, logging verbosity',
    settings: [
      'codeflow.logLevel',
      'codeflow.protocol.traceMessages',
      'codeflow.cpp.clangPath',
      'codeflow.cpp.compileCommandsPath',
      'codeflow.cpp.fallbackIncludePaths',
      'codeflow.cpp.fallbackDefines',
      'codeflow.cpp.fallbackStandard',
      'codeflow.cpp.timeoutMs',
      'codeflow.cpp.maxOutputBytes',
      'codeflow.cpp.maxFileBytes',
      'codeflow.javascript.resolveNodeModules',
      'codeflow.javascript.includeWorkspaceGlobals',
      'codeflow.javascript.maxFileBytes',
      'codeflow.javascript.maxLines',
      'codeflow.javascript.maxModules',
      'codeflow.javascript.maxDepth',
    ],
  },
  {
    id: SETTINGS_CATEGORIES.INDEXING,
    label: '$(database) Project Indexing',
    description: 'Background indexing debounce, optional auto-update, prompt behavior, and file limits',
    settings: [
      'codeflow.index.debounceMs',
      'codeflow.index.promptOnOpen',
      'codeflow.index.autoUpdate',
      'codeflow.index.maxFileBytes',
    ],
  },
  {
    id: SETTINGS_CATEGORIES.PREVIEW,
    label: '$(preview) Source Preview & Navigation',
    description: 'Hover delay, line count limits, click-to-navigate, syntax highlighting, preview tabs',
    settings: [
      'codeflow.preview.enabled',
      'codeflow.preview.delayMs',
      'codeflow.preview.maxLines',
      'codeflow.preview.syntaxHighlighting',
      'codeflow.preview.clickToNavigate',
      'codeflow.preview.pinByDefault',
      'codeflow.navigation.openInPreviewTab',
    ],
  },
  {
    id: SETTINGS_CATEGORIES.EXPLANATION,
    label: '$(comment-discussion) Explanation Engine',
    description: 'Default explanation depth, evidence links, and limitations disclosures',
    settings: [
      'codeflow.explanation.defaultDepth',
      'codeflow.explanation.showEvidence',
      'codeflow.explanation.includeLimitations',
    ],
  },
  {
    id: SETTINGS_CATEGORIES.APPEARANCE,
    label: '$(symbol-color) Appearance & Performance',
    description: 'Webview context retention, theme behavior',
    settings: ['codeflow.explorer.retainContext'],
  },
]);

/**
 * Generate QuickPick options for `CodeFlow: Configure`.
 *
 * @returns {Array<{id: string, label: string, description: string, settings: string[]}>}
 */
export function getCategoryQuickPickItems() {
  return CATEGORY_DESCRIPTORS.map((cat) => ({
    id: cat.id,
    label: cat.label,
    description: cat.description,
    settings: [...cat.settings],
  }));
}

/**
 * Return all contributed settings across all categories.
 *
 * @returns {string[]}
 */
export function getAllCategorizedSettingKeys() {
  const set = new Set();
  for (const cat of CATEGORY_DESCRIPTORS) {
    for (const key of cat.settings) {
      set.add(key);
    }
  }
  return [...set];
}
