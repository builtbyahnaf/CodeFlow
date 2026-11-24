import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import { checkSettingsDocumentation } from '../../src/extension/settings/index.js';

describe('Settings Documentation Sync (P12-11, AC-12.13)', () => {
  it('100% of package.json contributed settings are documented in docs/SETTINGS.md', () => {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const markdown = fs.readFileSync('docs/SETTINGS.md', 'utf8');

    const result = checkSettingsDocumentation(pkg, markdown);
    assert.ok(
      result.inSync,
      `Undocumented settings in docs/SETTINGS.md: ${result.missingFromDocs.join(', ')}`,
    );
    assert.equal(
      result.missingFromDocs.length,
      0,
      `Expected 0 missing settings, found: ${result.missingFromDocs.join(', ')}`,
    );
    assert.ok(result.documentedCount >= 19);
  });
});
