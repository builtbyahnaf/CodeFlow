import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STALE_LOCK_THRESHOLD_MS,
  createLockPayload,
  evaluateLockState,
} from '../../src/core/indexing/locks.js';

test('evaluateLockState reports free when no lock exists and owned_by_self for current PID', () => {
  const free = evaluateLockState(null, { currentPid: 1000, currentHostname: 'host-a' });
  assert.equal(free.status, 'free');
  assert.equal(free.canWrite, true);
  assert.equal(free.readOnly, false);

  const lock = createLockPayload({
    pid: 1000,
    hostname: 'host-a',
    now: 5000,
    version: '0.1.815',
  });
  const owned = evaluateLockState(lock, {
    currentPid: 1000,
    currentHostname: 'host-a',
    now: 5500,
  });
  assert.equal(owned.status, 'owned_by_self');
  assert.equal(owned.canWrite, true);
});

test('evaluateLockState degrades to read-only when held by another live process and recovers stale locks', () => {
  const lock = createLockPayload({
    pid: 2222,
    hostname: 'host-a',
    now: 10_000,
  });

  // Another live process on same host -> read-only fallback
  const held = evaluateLockState(lock, {
    currentPid: 1000,
    currentHostname: 'host-a',
    now: 15_000,
    isProcessAlive: (pid) => pid === 2222,
  });
  assert.equal(held.status, 'held_by_live_process');
  assert.equal(held.canWrite, false);
  assert.equal(held.readOnly, true);

  // Dead process -> stale_recoverable
  const dead = evaluateLockState(lock, {
    currentPid: 1000,
    currentHostname: 'host-a',
    now: 15_000,
    isProcessAlive: () => false,
  });
  assert.equal(dead.status, 'stale_recoverable');
  assert.equal(dead.canWrite, true);

  // Exceeded STALE_LOCK_THRESHOLD_MS -> stale_recoverable even if probe unavailable
  const expired = evaluateLockState(lock, {
    currentPid: 1000,
    currentHostname: 'host-b',
    now: 10_000 + STALE_LOCK_THRESHOLD_MS + 1,
  });
  assert.equal(expired.status, 'stale_recoverable');
  assert.equal(expired.canWrite, true);
});
