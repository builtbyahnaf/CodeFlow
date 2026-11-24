import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  getCategoryQuickPickItems,
  getAllCategorizedSettingKeys,
} from '../../src/extension/settings/index.js';

describe('Settings Commands & Interactions (P12-12, AC-12.13)', () => {
  it('getCategoryQuickPickItems provides well-formed items with category ids', () => {
    const items = getCategoryQuickPickItems();
    assert.ok(items.length >= 5);
    for (const item of items) {
      assert.ok(item.id);
      assert.ok(item.label);
      assert.ok(item.description);
      assert.ok(Array.isArray(item.settings));
      assert.ok(item.settings.length > 0);
    }
  });

  it('getAllCategorizedSettingKeys returns non-empty list of all settings', () => {
    const keys = getAllCategorizedSettingKeys();
    assert.ok(keys.length >= 27);
    assert.ok(keys.includes('codeflow.logLevel'));
    assert.ok(keys.includes('codeflow.preview.enabled'));
    assert.ok(keys.includes('codeflow.cpp.clangPath'));
    assert.ok(keys.includes('codeflow.javascript.resolveNodeModules'));
  });

  it('every setting key starts with codeflow.', () => {
    const keys = getAllCategorizedSettingKeys();
    for (const key of keys) {
      assert.ok(key.startsWith('codeflow.'), `Key ${key} must start with "codeflow."`);
    }
  });
});
