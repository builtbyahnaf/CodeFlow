/**
 * Bounded deterministic explanation cache.
 *
 * Keyed by `(runId, rulesetVersion, depth, stale, subjectKey)` so stale or
 * cross-run reads are impossible and ruleset bumps automatically invalidate.
 */

/**
 * @template T
 * @param {{maxEntries?: number}} [options]
 */
export function createExplanationCache(options = {}) {
  const maxEntries = Math.max(1, Number(options.maxEntries ?? 256));
  /** @type {Map<string, T>} */
  const store = new Map();
  let hits = 0;
  let misses = 0;

  /**
   * @param {{runId: string, rulesetVersion: string, depth: number, stale?: boolean, subjectKey: string}} parts
   * @returns {string}
   */
  function makeKey({ runId, rulesetVersion, depth, stale = false, subjectKey }) {
    return `${runId}|${rulesetVersion}|d${depth}|${stale ? 'stale' : 'fresh'}|${subjectKey}`;
  }

  /**
   * @param {{runId: string, rulesetVersion: string, depth: number, stale?: boolean, subjectKey: string}} parts
   * @returns {T|undefined}
   */
  function get(parts) {
    const key = makeKey(parts);
    const value = store.get(key);
    if (value === undefined) {
      misses += 1;
      return undefined;
    }
    store.delete(key);
    store.set(key, value);
    hits += 1;
    return value;
  }

  /**
   * @param {{runId: string, rulesetVersion: string, depth: number, stale?: boolean, subjectKey: string}} parts
   * @param {T} value
   */
  function set(parts, value) {
    const key = makeKey(parts);
    if (store.has(key)) {
      store.delete(key);
    }
    store.set(key, value);
    while (store.size > maxEntries) {
      const oldest = store.keys().next();
      if (oldest.done) {
        break;
      }
      store.delete(oldest.value);
    }
  }

  /**
   * @param {string} runId
   * @returns {number}
   */
  function invalidateRun(runId) {
    const prefix = `${runId}|`;
    let removed = 0;
    for (const key of [...store.keys()]) {
      if (key.startsWith(prefix)) {
        store.delete(key);
        removed += 1;
      }
    }
    return removed;
  }

  return {
    get,
    set,
    invalidateRun,
    clear() {
      store.clear();
      hits = 0;
      misses = 0;
    },
    stats: () => ({ hits, misses, size: store.size }),
  };
}
