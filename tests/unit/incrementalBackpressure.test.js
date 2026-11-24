import test from 'node:test';
import assert from 'node:assert/strict';

import { createBackpressureController } from '../../src/core/indexing/incremental/backpressure.js';

test('backpressure pauses P2/P3 during continuous typing (>10s) or queue saturation (>500), halves concurrency while typing, and resumes after 2s idle (P9-12, P9-13, AC-9.4)', () => {
  const controller = createBackpressureController({
    maxQueueDepth: 500,
    continuousTypingThresholdMs: 10_000,
    idleResumeMs: 2000,
    lagThresholdMs: 100,
    poolSize: 4,
  });

  // Start typing at t=0: concurrency is halved to 2 (50% of poolSize 4)
  controller.recordTyping(0);
  const early = controller.evaluate({ now: 500, queueDepth: 10 });
  assert.equal(early.isActivelyTyping, true);
  assert.equal(early.allowedConcurrency, 2);
  assert.equal(early.pauseBackground, false);

  // Continuous typing for 10.5 seconds pauses P2/P3 background work
  for (let t = 1000; t <= 10_500; t += 500) {
    controller.recordTyping(t);
  }
  const paused = controller.evaluate({ now: 10_500, queueDepth: 10 });
  assert.equal(paused.status, 'paused_while_typing');
  assert.equal(paused.pauseBackground, true);
  assert.equal(paused.pausedForTyping, true);

  // Resume after 2 seconds of idle (t = 12,600)
  const resumed = controller.evaluate({ now: 12_600, queueDepth: 5 });
  assert.equal(resumed.pauseBackground, false);
  assert.equal(resumed.allowedConcurrency, 4);
  assert.equal(resumed.status, 'catching_up');

  // Event-loop lag guard (>100 ms sample throttles background work)
  const lagRes = controller.recordEventLoopLag(145);
  assert.equal(lagRes.throttled, true);
  assert.equal(lagRes.responsivenessThrottleCount, 1);
  assert.equal(controller.evaluate({ now: 12_700, queueDepth: 5 }).status, 'lag_throttled');

  controller.clearLagThrottle();
  assert.equal(controller.evaluate({ now: 12_800, queueDepth: 0 }).status, 'active');
});
