/**
 * Public entry point for CodeFlow Settings UX & Management (`src/extension/settings/`).
 */

export {
  SETTINGS_CATEGORIES,
  CATEGORY_DESCRIPTORS,
  getCategoryQuickPickItems,
  getAllCategorizedSettingKeys,
} from './categories.js';

export {
  SETTING_RULES,
  validateSettingValue,
} from './validator.js';

export {
  checkSettingsDocumentation,
} from './docsSync.js';
