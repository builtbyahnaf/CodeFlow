/**
 * Multi-window writer lock evaluation and stale-lock recovery (Phase 8 §10).
 *
 * Lock record lives at `.codeflow/metadata/index.lock` with
 * `{pid, hostname, startedAt, runId, version}`.
 *
 * Rules:
 * - Never delete a lock held by a live process on the same host.
 * - If another live process holds the lock, fall back to read-only mode.
 * - If the holding process is no longer alive (or on another host / older than
 *   `staleThresholdMs`), classify as `stale_recoverable`.
 */

export const STALE_LOCK_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * @param {{pid?: number, hostname?: string, startedAt?: number, now?: number, runId?: string, version?: string}} [input]
 * @returns {{pid: number, hostname: string, startedAt: number, runId: string, version: string}}
 */
export function createLockPayload(input = {}) {
  const startedAt = Number.isFinite(input.startedAt)
    ? Number(input.startedAt)
    : Number.isFinite(input.now)
      ? Number(input.now)
      : 0;
  return {
    pid: Number.isInteger(input.pid) ? Number(input.pid) : process.pid,
    hostname: typeof input.hostname === 'string' && input.hostname ? input.hostname : 'local',
    startedAt,
    runId: typeof input.runId === 'string' && input.runId ? input.runId : 'run:index',
    version: typeof input.version === 'string' && input.version ? input.version : '0.0.1',
  };
}

/**
 * Evaluate an existing lock file against the current process and clock.
 *
 * @param {unknown} existingLock
 * @param {{
 *   currentPid?: number,
 *   currentHostname?: string,
 *   now?: number,
 *   staleThresholdMs?: number,
 *   isProcessAlive?: (pid: number) => boolean,
 * }} [options]
 * @returns {{
 *   status: 'free'|'owned_by_self'|'held_by_live_process'|'stale_recoverable',
 *   state: 'free'|'owned_by_self'|'held_by_live_process'|'stale_recoverable',
 *   canWrite: boolean,
 *   canAcquireWrite: boolean,
 *   readOnly: boolean,
 *   readOnlyFallback: boolean,
 *   holder: Record<string, any> | null,
 *   reason: string,
 * }}
 */
export function evaluateLockState(existingLock, options = {}) {
  function result(status, canWrite, reason, holder = null) {
    return {
      status,
      state: status,
      canWrite,
      canAcquireWrite: canWrite,
      readOnly: !canWrite,
      readOnlyFallback: !canWrite,
      holder,
      reason,
    };
  }

  if (!existingLock || typeof existingLock !== 'object' || Array.isArray(existingLock)) {
    return result('free', true, 'no_lock', null);
  }
  const lock = /** @type {Record<string, any>} */ (existingLock);
  const currentPid = options.currentPid ?? process.pid;
  const currentHostname = options.currentHostname ?? 'local';
  const now = options.now ?? 0;
  const threshold = options.staleThresholdMs ?? STALE_LOCK_THRESHOLD_MS;

  if (!Number.isInteger(lock.pid) || lock.pid <= 0) {
    return result('stale_recoverable', true, 'corrupt_lock_payload', lock);
  }

  if (lock.pid === currentPid && (lock.hostname ?? currentHostname) === currentHostname) {
    return result('owned_by_self', true, 'same_process', lock);
  }

  const ageMs = Math.max(0, now - Number(lock.startedAt || 0));
  if (ageMs >= threshold) {
    return result('stale_recoverable', true, 'lock_timeout_exceeded', lock);
  }

  const checkAlive =
    options.isProcessAlive ??
    ((pid) => {
      try {
        process.kill(pid, 0);
        return true;
      } catch (error) {
        return /** @type {{code?: string}} */ (error)?.code === 'EPERM';
      }
    });

  const sameHost = (lock.hostname ?? currentHostname) === currentHostname;
  const alive = sameHost ? Boolean(checkAlive(lock.pid)) : true;

  if (alive) {
    return result('held_by_live_process', false, `locked_by_pid_${lock.pid}`, lock);
  }

  return result('stale_recoverable', true, `dead_pid_${lock.pid}`, lock);
}
