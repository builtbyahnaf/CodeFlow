import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
  SETTINGS_CATEGORIES,
  CATEGORY_DESCRIPTORS,
  getCategoryQuickPickItems,
  getAllCategorizedSettingKeys,
} from '../../src/extension/settings/index.js';

describe('Settings Categories & QuickPick UX (P12-11, P12-12)', () => {
  it('defines 5 functional categories covering all settings', () => {
    assert.equal(Object.keys(SETTINGS_CATEGORIES).length, 5);
    assert.ok(SETTINGS_CATEGORIES.ANALYSIS);
    assert.ok(SETTINGS_CATEGORIES.INDEXING);
    assert.ok(SETTINGS_CATEGORIES.PREVIEW);
    assert.ok(SETTINGS_CATEGORIES.EXPLANATION);
    assert.ok(SETTINGS_CATEGORIES.APPEARANCE);
  });

  it('every category descriptor has an icon label, description, and settings list', () => {
    for (const cat of CATEGORY_DESCRIPTORS) {
      assert.ok(cat.id, 'Category must have an ID');
      assert.ok(cat.label.includes('$('), 'Category label must have VS Code icon syntax');
      assert.ok(cat.description.length > 5, 'Category must have a description');
      assert.ok(cat.settings.length > 0, 'Category must contain setting keys');
    }
  });

  it('getCategoryQuickPickItems outputs clean options for VS Code QuickPick', () => {
    const items = getCategoryQuickPickItems();
    assert.equal(items.length, 5);
    for (const item of items) {
      assert.ok(item.label);
      assert.ok(Array.isArray(item.settings));
    }
  });

  it('every setting declared in package.json is mapped to a category', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const contributed = Object.keys(pkg.contributes.configuration.properties);
    const categorized = new Set(getAllCategorizedSettingKeys());

    for (const key of contributed) {
      assert.ok(
        categorized.has(key),
        `Setting "${key}" in package.json is not mapped to any category in CATEGORY_DESCRIPTORS`,
      );
    }
  });
});
