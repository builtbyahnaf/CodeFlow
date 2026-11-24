import test from 'node:test';
import assert from 'node:assert/strict';

import { createEmptyIndexSnapshot } from '../../src/core/indexing/schema.js';
import { evaluateIndexHealth, evaluateIndexScope } from '../../src/core/indexing/health.js';

test('evaluateIndexScope and evaluateIndexHealth classify complete, partial, stale, and corrupt snapshots', () => {
  const snap = createEmptyIndexSnapshot({ now: 1000, state: 'complete' });
  snap.files['file:a'] = {
    file_id: 'file:a',
    path: 'src/a.js',
    language: 'javascript',
    content_hash: 'sha256:aaa',
    size_bytes: 50,
    line_count: 3,
    indexed_at: 1000,
    run_id: 'run:1',
  };
  snap.analysis_state['file:a'] = {
    file_id: 'file:a',
    completeness: 'full',
    diagnostics_json: '[]',
    updated_at: 1000,
  };

  const completeScope = evaluateIndexScope(snap);
  assert.equal(completeScope.scope, 'complete');
  assert.equal(completeScope.rawScope, 'complete');

  const staleHealth = evaluateIndexHealth(snap, { 'file:a': 'sha256:changed' });
  assert.equal(staleHealth.ok, true);
  assert.equal(staleHealth.scope, 'stale');
  assert.deepEqual(staleHealth.staleFileIds, ['file:a']);

  const corruptHealth = evaluateIndexHealth(null);
  assert.equal(corruptHealth.ok, false);
  assert.equal(corruptHealth.integrity, 'corrupt');
});
