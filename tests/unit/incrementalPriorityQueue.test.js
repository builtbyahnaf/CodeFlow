import test from 'node:test';
import assert from 'node:assert/strict';

import {
  EXECUTION_PRIORITIES,
  createPriorityTaskQueue,
  resolveWorkerPoolSize,
} from '../../src/core/indexing/incremental/priorityQueue.js';

test('resolveWorkerPoolSize clamps concurrency between 2 and 4 (never 1, never unbounded)', () => {
  assert.equal(resolveWorkerPoolSize(1), 2);
  assert.equal(resolveWorkerPoolSize(2), 2);
  assert.equal(resolveWorkerPoolSize(4), 3);
  assert.equal(resolveWorkerPoolSize(16), 4);
});

test('priority queue orders P0 > P1 > P2 > P3, preempts P2/P3 when P0 arrives, and ages P3 tasks to prevent starvation (P9-10)', () => {
  const queue = createPriorityTaskQueue({ agingIntervalMs: 1000 });

  queue.enqueue({
    fileId: 'file:p3',
    contentHash: 'sha256:p3',
    priority: EXECUTION_PRIORITIES.P3_BACKGROUND,
    enqueuedAt: 0,
  });
  queue.enqueue({
    fileId: 'file:p2',
    contentHash: 'sha256:p2',
    priority: EXECUTION_PRIORITIES.P2_RECENT,
    enqueuedAt: 10,
  });

  // Dequeue starts P2 first
  const runningP2 = queue.dequeue({ now: 20 });
  assert.equal(runningP2.fileId, 'file:p2');
  assert.equal(runningP2.preemptRequested, false);

  // Enqueuing P0 flags in-flight P2 for cooperative preemption
  queue.enqueue({
    fileId: 'file:p0',
    contentHash: 'sha256:p0',
    priority: EXECUTION_PRIORITIES.P0_ACTIVE,
    enqueuedAt: 30,
  });
  assert.equal(runningP2.preemptRequested, true);

  const nextTask = queue.dequeue({ now: 30 });
  assert.equal(nextTask.fileId, 'file:p0');
  queue.complete(nextTask);

  // Aging: after 4,000 ms, P3 has aged to effective priority 0 and runs next
  const agedP3 = queue.dequeue({ now: 4000 });
  assert.equal(agedP3.fileId, 'file:p3');
  queue.complete(agedP3);
});

test('per-file supersession by (fileId, contentHash) cancels older in-flight tasks and discards stale completions (P9-11, AC-9.7)', () => {
  const queue = createPriorityTaskQueue();

  queue.enqueue({
    fileId: 'file:rapid',
    contentHash: 'sha256:v1',
    priority: EXECUTION_PRIORITIES.P0_ACTIVE,
    enqueuedAt: 10,
  });
  const firstInFlight = queue.dequeue({ now: 10 });
  assert.equal(queue.canCommit(firstInFlight), true);

  // Rapid edits v2 and v3 arrive while v1 is still in flight
  queue.enqueue({
    fileId: 'file:rapid',
    contentHash: 'sha256:v2',
    priority: EXECUTION_PRIORITIES.P0_ACTIVE,
    enqueuedAt: 20,
  });
  queue.enqueue({
    fileId: 'file:rapid',
    contentHash: 'sha256:v3',
    priority: EXECUTION_PRIORITIES.P0_ACTIVE,
    enqueuedAt: 30,
  });

  assert.equal(firstInFlight.token.isCancelled, true);
  assert.equal(
    queue.canCommit(firstInFlight),
    false,
    'stale v1 completion must never be committed after v3 supersedes it',
  );

  const newest = queue.dequeue({ now: 35 });
  assert.equal(newest.contentHash, 'sha256:v3');
  assert.equal(queue.canCommit(newest), true);
  queue.complete(newest);
  assert.equal(queue.stats().supersededCount, 2);
});
