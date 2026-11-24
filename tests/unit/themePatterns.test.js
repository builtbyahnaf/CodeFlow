import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  STATUS_GLYPHS,
  EDGE_DASH_PATTERNS,
  getStatusPatternDescriptor,
} from '../../src/visualization/theme/patterns.js';

describe('Theme Non-Color Patterns & Colorblind Safety (P12-04, AC-12.2)', () => {
  it('defines distinct glyphs for all status variants', () => {
    assert.equal(STATUS_GLYPHS.RESOLVED, '✓');
    assert.equal(STATUS_GLYPHS.POSSIBLE, '?');
    assert.equal(STATUS_GLYPHS.UNRESOLVED, '✗');
    assert.equal(STATUS_GLYPHS.PARTIAL, '⚠');
    assert.equal(STATUS_GLYPHS.STALE, '↻');

    // All glyphs are distinct
    const values = Object.values(STATUS_GLYPHS);
    assert.equal(new Set(values).size, values.length);
  });

  it('defines distinct stroke dash patterns for edge relationship states', () => {
    assert.equal(EDGE_DASH_PATTERNS.RESOLVED_CALL, 'none');
    assert.notEqual(EDGE_DASH_PATTERNS.POSSIBLE_CALL, 'none');
    assert.notEqual(EDGE_DASH_PATTERNS.UNRESOLVED_CALL, 'none');
    assert.notEqual(EDGE_DASH_PATTERNS.POSSIBLE_CALL, EDGE_DASH_PATTERNS.UNRESOLVED_CALL);
    assert.notEqual(EDGE_DASH_PATTERNS.DATA_FLOW, EDGE_DASH_PATTERNS.POSSIBLE_CALL);
  });

  it('getStatusPatternDescriptor provides complete non-color accessibility descriptors', () => {
    const statuses = ['resolved', 'possible', 'unresolved', 'partial', 'stale'];
    for (const status of statuses) {
      const desc = getStatusPatternDescriptor(status);
      assert.ok(desc.glyph.length > 0, `Glyph must exist for ${status}`);
      assert.ok(desc.borderStyle.length > 0, `Border style must exist for ${status}`);
      assert.ok(desc.dashArray.length > 0, `Dash array must exist for ${status}`);
      assert.ok(desc.accessibleLabel.length > 0, `Accessible label must exist for ${status}`);
    }
  });

  it('handles unknown status fallback without throwing', () => {
    const fallback = getStatusPatternDescriptor('custom_unknown');
    assert.equal(fallback.glyph, '');
    assert.equal(fallback.borderStyle, 'solid');
    assert.equal(fallback.dashArray, 'none');
    assert.equal(fallback.accessibleLabel, 'custom_unknown');
  });
});
