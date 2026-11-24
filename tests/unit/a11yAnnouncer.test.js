import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  announceLevelChange,
  announceClusterExpansion,
  announceSelection,
  announceStaleSources,
  announceNotice,
} from '../../src/visualization/a11y/index.js';

describe('Accessibility live announcer (P12-08, AC-12.9)', () => {
  it('announceLevelChange formats clear navigation context', () => {
    const msg = announceLevelChange('L1 Module', 'src/core', 24);
    assert.equal(msg, 'Navigated to L1 Module: src/core. 24 items displayed.');
  });

  it('announceClusterExpansion announces remaining members count', () => {
    const partial = announceClusterExpansion('handlers', 50, 120);
    assert.equal(partial, 'Expanded cluster handlers. Showing 50 members, 120 remaining.');

    const complete = announceClusterExpansion('handlers', 50, 0);
    assert.equal(complete, 'Expanded cluster handlers. Showing all 50 members.');
  });

  it('announceSelection describes selected node, status, and line location', () => {
    const msg = announceSelection({
      label: 'processQueue',
      kind: 'function',
      status: 'resolved',
      range: { startLine: 41 },
    });
    assert.equal(msg, 'Selected function processQueue, status: resolved, line 42.');
  });

  it('announceStaleSources warns about single or multiple edited files', () => {
    const single = announceStaleSources(['src/app.js']);
    assert.ok(single.includes('Source file src/app.js was modified'));

    const multiple = announceStaleSources(['src/a.js', 'src/b.js']);
    assert.ok(multiple.includes('2 source files were modified'));
  });

  it('announceNotice formats errors and warnings with typed prefixes', () => {
    assert.equal(announceNotice('Reaching budget exceeded', 'error'), 'Error: Reaching budget exceeded');
    assert.equal(announceNotice('Memory usage high', 'warning'), 'Warning: Memory usage high');
    assert.equal(announceNotice('Ready', 'info'), 'Ready');
  });
});
