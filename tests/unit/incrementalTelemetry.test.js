import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computePercentiles,
  createIncrementalTelemetry,
} from '../../src/core/indexing/incremental/telemetry.js';

test('createIncrementalTelemetry computes p50/p95 durations, ratios, and counters while remaining 100% content-free (Phase 9 §9, AC-9.8)', () => {
  assert.deepEqual(computePercentiles([]), { count: 0, p50Ms: 0, p95Ms: 0 });

  const telemetry = createIncrementalTelemetry();
  telemetry.recordEvent({ coalesced: false });
  telemetry.recordEvent({ coalesced: true });
  telemetry.recordTaskEnqueued({ superseded: false });
  telemetry.recordTaskEnqueued({ superseded: true });
  telemetry.recordTaskStarted();
  telemetry.recordTaskCompleted({ language: 'javascript', durationMs: 12, provisional: true });
  telemetry.recordTaskCompleted({ language: 'javascript', durationMs: 28, provisional: false });
  telemetry.recordTaskCompleted({ language: 'cpp', durationMs: 45, provisional: false });
  telemetry.recordClassification('local', 'none');
  telemetry.recordClassification('dependent', 'direct_dependents');
  telemetry.recordCacheLookup(true);
  telemetry.recordCacheLookup(false);
  telemetry.recordDbWrite({ rowCount: 18 });
  telemetry.recordResponsivenessThrottle();

  const snap = telemetry.snapshot();
  assert.equal(snap.eventsProcessed, 2);
  assert.equal(snap.debounceCoalescingRatio, 0.5);
  assert.equal(snap.tasks.enqueued, 2);
  assert.equal(snap.tasks.superseded, 1);
  assert.equal(snap.tasks.completed, 3);
  assert.equal(snap.provisionalRuns, 1);
  assert.equal(snap.classifications.local, 1);
  assert.equal(snap.classifications.dependent, 1);
  assert.equal(snap.escalations.direct_dependents, 1);
  assert.equal(snap.cache.hitRatio, 0.5);
  assert.equal(snap.db.transactions, 1);
  assert.equal(snap.db.rowsWritten, 18);
  assert.equal(snap.responsivenessThrottles, 1);
  assert.equal(snap.durations.javascript.count, 2);
  assert.equal(snap.durations.cpp.p50Ms, 45);

  // Content-free audit: serialized snapshot must contain zero file paths or source snippets
  const serialized = JSON.stringify(snap);
  assert.ok(!serialized.includes('src/'));
  assert.ok(!serialized.includes('function'));
});
