import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  SearchFilterManager,
} from '../../src/visualization/search/filterManager.js';

describe('Search & Filter Manager (P12-13, P12-14)', () => {
  it('creates empty filter state with zero active constraints', () => {
    const manager = new SearchFilterManager();
    assert.equal(manager.isActive(), false);
    assert.equal(manager.getActiveCount(), 0);
    assert.deepEqual(manager.getChips(), []);
    assert.equal(manager.getBreadcrumbSummary(), '');
  });

  it('toggles kind, status, and query filters with correct chip generation', () => {
    const manager = new SearchFilterManager();
    manager.setQuery('parse');
    manager.toggleKind('function');
    manager.toggleStatus('resolved');

    assert.equal(manager.isActive(), true);
    assert.equal(manager.getActiveCount(), 3);

    const chips = manager.getChips();
    assert.equal(chips.length, 3);
    assert.equal(chips[0].label, 'Search: "parse"');
    assert.equal(chips[1].label, 'Kind: function');
    assert.equal(chips[2].label, 'Status: resolved');

    assert.equal(manager.getBreadcrumbSummary(), '[3 filters active]');
  });

  it('matchesNode tests nodes against all active constraints', () => {
    const manager = new SearchFilterManager();
    manager.setQuery('Ast');
    manager.toggleKind('class');

    const matching = { name: 'AstBuilder', kind: 'class', status: 'resolved' };
    const wrongKind = { name: 'AstBuilder', kind: 'function', status: 'resolved' };
    const wrongName = { name: 'Lexer', kind: 'class', status: 'resolved' };

    assert.equal(manager.matchesNode(matching), true);
    assert.equal(manager.matchesNode(wrongKind), false);
    assert.equal(manager.matchesNode(wrongName), false);
  });

  it('clearAll resets all active filters immediately', () => {
    const manager = new SearchFilterManager();
    manager.setQuery('test');
    manager.toggleKind('function');
    manager.toggleStatus('unresolved');
    assert.equal(manager.isActive(), true);

    manager.clearAll();
    assert.equal(manager.isActive(), false);
    assert.equal(manager.getActiveCount(), 0);
    assert.equal(manager.getChips().length, 0);
  });
});
