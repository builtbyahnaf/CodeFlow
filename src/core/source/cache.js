/**
 * Bounded LRU cache for source slices.
 *
 * The cache is keyed by caller-supplied strings. It is intentionally small and
 * dependency-free so its eviction rules can be tested without a document.
 */

/**
 * @template T
 * @param {{maxEntries?: number, maxBytes?: number}} [options]
 */
export function createLru(options = {}) {
  const maxEntries = Math.max(1, options.maxEntries ?? 30);
  const maxBytes = Math.max(1, options.maxBytes ?? 5 * 1024 * 1024);
  /** @type {Map<string, {value: T, bytes: number}>} */
  const entries = new Map();
  let bytes = 0;

  /**
   * @param {string} key
   * @param {T} value
   * @param {number} size
   */
  function set(key, value, size = 0) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError('Cache keys must be non-empty strings.');
    }
    const safeSize = Number.isFinite(size) ? Math.max(0, size) : 0;
    const previous = entries.get(key);
    if (previous) {
      bytes -= previous.bytes;
      entries.delete(key);
    }
    entries.set(key, { value, bytes: safeSize });
    bytes += safeSize;
    prune();
  }

  /**
   * @param {string} key
   * @returns {T|undefined}
   */
  function get(key) {
    const entry = entries.get(key);
    if (!entry) {
      return undefined;
    }
    entries.delete(key);
    entries.set(key, entry);
    return entry.value;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  function remove(key) {
    const entry = entries.get(key);
    if (!entry) {
      return false;
    }
    entries.delete(key);
    bytes -= entry.bytes;
    return true;
  }

  /**
   * @param {string} prefix
   * @returns {number}
   */
  function removeByPrefix(prefix) {
    let removed = 0;
    for (const [key, entry] of [...entries]) {
      if (key.startsWith(prefix)) {
        entries.delete(key);
        bytes -= entry.bytes;
        removed += 1;
      }
    }
    return removed;
  }

  function prune() {
    while (entries.size > maxEntries || bytes > maxBytes) {
      const oldest = entries.keys().next();
      if (oldest.done) {
        break;
      }
      remove(oldest.value);
    }
  }

  return {
    get,
    set,
    delete: remove,
    deleteByPrefix: removeByPrefix,
    clear() {
      entries.clear();
      bytes = 0;
    },
    prune,
    size: () => entries.size,
    bytes: () => bytes,
    keys: () => [...entries.keys()],
  };
}
