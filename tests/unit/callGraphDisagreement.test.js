import test from 'node:test';
import assert from 'node:assert/strict';

import { detectRelationshipDisagreements } from '../../src/core/graph/calls/disagreement.js';

test('detectRelationshipDisagreements flags resolved edges missing from another covering source', () => {
  const mergedEdges = [
    {
      from: 'sym:a',
      to: 'sym:b',
      type: 'calls',
      strongestStatus: 'resolved',
      sourceIds: ['adapter:local'],
    },
    {
      from: 'sym:a',
      to: 'sym:c',
      type: 'calls',
      strongestStatus: 'possible',
      sourceIds: ['adapter:local'],
    },
  ];
  const sources = [{ sourceId: 'adapter:local' }, { sourceId: 'index:workspace' }];
  const covered = new Map([
    ['adapter:local', new Set(['sym:a'])],
    ['index:workspace', new Set(['sym:a'])],
  ]);

  const diags = detectRelationshipDisagreements(mergedEdges, sources, covered);
  assert.equal(diags.length, 1);
  assert.equal(diags[0].code, 'source_disagreement');
  assert.equal(diags[0].from, 'sym:a');
  assert.equal(diags[0].to, 'sym:b');
});

test('detectRelationshipDisagreements returns empty when only one source or non-overlapping coverage', () => {
  const mergedEdges = [
    {
      from: 'sym:a',
      to: 'sym:b',
      type: 'calls',
      strongestStatus: 'resolved',
      sourceIds: ['adapter:local'],
    },
  ];
  const sources = [{ sourceId: 'adapter:local' }, { sourceId: 'index:workspace' }];
  const disjoint = new Map([
    ['adapter:local', new Set(['sym:a'])],
    ['index:workspace', new Set(['sym:other'])],
  ]);

  assert.equal(detectRelationshipDisagreements(mergedEdges, [sources[0]], disjoint).length, 0);
  assert.equal(detectRelationshipDisagreements(mergedEdges, sources, disjoint).length, 0);
});
