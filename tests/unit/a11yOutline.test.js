import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildAccessibleOutline,
  renderOutlineHtml,
  formatAriaStatus,
} from '../../src/visualization/a11y/index.js';

describe('Accessible outline mode (P12-07, AC-12.9)', () => {
  it('formatAriaStatus expands status codes into human speech labels', () => {
    assert.equal(formatAriaStatus('resolved'), 'Proven resolved');
    assert.equal(formatAriaStatus('inferred'), 'Inferred by heuristic');
    assert.equal(formatAriaStatus('possible'), 'Possible but unconfirmed');
    assert.equal(formatAriaStatus('unresolved'), 'Unresolved capability gap');
    assert.equal(formatAriaStatus('stale'), 'Stale due to source edits');
    assert.equal(formatAriaStatus('mixed'), 'Mixed statuses present');
  });

  it('buildAccessibleOutline transforms semantic zoom DTO into tree items', () => {
    const dto = {
      level: 'function',
      nodes: [
        {
          id: 'n1',
          label: 'calculateTotal',
          kind: 'function',
          status: 'resolved',
          range: { startLine: 10, endLine: 25 },
        },
        {
          id: 'c1',
          label: 'src/utils',
          isCluster: true,
          memberCount: 15,
          status: 'mixed',
          badges: ['2 unresolved'],
        },
      ],
    };

    const outline = buildAccessibleOutline(dto);
    assert.equal(outline.level, 'function');
    assert.equal(outline.itemCount, 2);
    assert.equal(outline.items[0].label, 'calculateTotal');
    assert.equal(outline.items[0].rangeDescription, 'Line 11 to 26');
    assert.equal(outline.items[1].memberCount, 15);
    assert.deepEqual(outline.items[1].badges, ['2 unresolved']);
  });

  it('renderOutlineHtml outputs compliant ARIA tree HTML', () => {
    const outline = buildAccessibleOutline({
      level: 'workspace',
      nodes: [
        {
          id: 'mod1',
          label: 'core',
          kind: 'directory',
          status: 'resolved',
        },
      ],
    });

    const html = renderOutlineHtml(outline);
    assert.ok(html.includes('role="navigation"'));
    assert.ok(html.includes('role="tree"'));
    assert.ok(html.includes('role="treeitem"'));
    assert.ok(html.includes('aria-label='));
    assert.ok(html.includes('Proven resolved'));
  });
});
