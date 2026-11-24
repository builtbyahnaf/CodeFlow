/**
 * Memory Ceilings and Bounded Cache Eviction (Phase 12 §10.3, P12-22).
 *
 * Enforces hard memory ceilings across DTO, preview, DFG, and cluster caches,
 * guaranteeing bounded memory usage and preventing leaks on repeated cycles.
 */

/** Subsystem memory entry caps per Phase 12 §10.3. */
export const SUBSYSTEM_CAPS = Object.freeze({
  dtoCache: 100,
  previewCache: 50,
  dfgCache: 64,
  clusterExpansionCache: 32,
});

/**
 * Bounded LRU Cache with explicit eviction monitoring.
 *
 * @template K, V
 */
export class BoundedLruCache {
  /**
   * @param {number} capacity Maximum number of entries before eviction
   */
  constructor(capacity) {
    if (!Number.isInteger(capacity) || capacity <= 0) {
      throw new Error(`Capacity must be a positive integer, received: ${capacity}`);
    }
    this.capacity = capacity;
    /** @type {Map<K, V>} */
    this.map = new Map();
    this.evictionCount = 0;
  }

  /**
   * Get an entry and refresh its recency.
   *
   * @param {K} key
   * @returns {V | undefined}
   */
  get(key) {
    if (!this.map.has(key)) {
      return undefined;
    }
    const val = this.map.get(key);
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  /**
   * Put an entry, evicting the least recently used entry if at capacity.
   *
   * @param {K} key
   * @param {V} value
   */
  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // Evict oldest (first key in map iteration order)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
        this.evictionCount++;
      }
    }
    this.map.set(key, value);
  }

  /**
   * Check whether key exists without refreshing recency.
   *
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    return this.map.has(key);
  }

  /** Current entry count. */
  get size() {
    return this.map.size;
  }

  /** Clear all entries and reset eviction count. */
  clear() {
    this.map.clear();
    this.evictionCount = 0;
  }
}
