import test from 'node:test';
import assert from 'node:assert/strict';

import { createClusterExpansionService } from '../../src/core/graph/zoom/expansion.js';

test('createClusterExpansionService paginates a 400-member cluster to completion, caches per runId, and keeps cluster collapsed on error (P10-06, P10-07, P10-08, AC-10.3)', () => {
  const members = Array.from({ length: 400 }, (_, i) => ({
    id: `sym:m_${i}`,
    label: `member_${i}`,
    kind: 'function',
  }));
  let loadCalls = 0;
  const service = createClusterExpansionService();

  // Paginate all 400 members in pages of 100 (default first page is 50)
  const firstPage = service.expand({
    graphId: 'workspace',
    runId: 'run:1',
    clusterId: 'cluster:dir:src',
    loadItems: () => {
      loadCalls += 1;
      return members;
    },
  });
  assert.equal(firstPage.ok, true);
  assert.equal(firstPage.items.length, 50);
  assert.equal(firstPage.total, 400);
  assert.equal(firstPage.remainingCount, 350);
  assert.equal(firstPage.moreLabel, '350 more');
  assert.equal(firstPage.nextCursor, '50');
  assert.equal(firstPage.fromCache, false);

  // Repeat identical page request -> served from cache without calling loadItems
  const cachedFirst = service.expand({
    graphId: 'workspace',
    runId: 'run:1',
    clusterId: 'cluster:dir:src',
    loadItems: () => {
      loadCalls += 1;
      return members;
    },
  });
  assert.equal(cachedFirst.fromCache, true);
  assert.equal(loadCalls, 1);

  // Drain remaining pages using nextCursor and limit: 100
  const collectedIds = new Set(firstPage.items.map((item) => item.id));
  let cursor = firstPage.nextCursor;
  while (cursor) {
    const page = service.expand({
      graphId: 'workspace',
      runId: 'run:1',
      clusterId: 'cluster:dir:src',
      page: { limit: 100, cursor },
      loadItems: () => members,
    });
    assert.equal(page.ok, true);
    for (const item of page.items) {
      collectedIds.add(item.id);
    }
    cursor = page.nextCursor;
  }
  assert.equal(collectedIds.size, 400, 'paginated expansion must reveal every single member');

  // Changing runId invalidates the cache (P10-07)
  const newRunPage = service.expand({
    graphId: 'workspace',
    runId: 'run:2',
    clusterId: 'cluster:dir:src',
    loadItems: () => {
      loadCalls += 1;
      return members;
    },
  });
  assert.equal(newRunPage.fromCache, false);
  assert.equal(loadCalls, 2);

  // Injected failure keeps cluster collapsed with retryable error (P10-08)
  const failed = service.expand({
    graphId: 'workspace',
    runId: 'run:2',
    clusterId: 'cluster:broken',
    loadItems: () => {
      throw new Error('Index read timeout');
    },
  });
  assert.equal(failed.ok, false);
  assert.equal(failed.retryable, true);
  assert.equal(failed.keepCollapsed, true);
});
