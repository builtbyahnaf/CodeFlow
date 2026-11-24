/**
 * LRU cache for built DFGs.
 *
 * DFG construction can be expensive for large functions. We cache the last
 * DFG_CACHE_CAPACITY results keyed by (functionId, runHash). When the run
 * changes all entries become stale — the caller is responsible for using a
 * fresh runHash.
 *
 * The cache is a simple doubly-linked list + Map (classic LRU). No external
 * dependencies.
 */

import { DFG_CACHE_CAPACITY } from './kinds.js';

/**
 * @template V
 * @typedef {Object} LruNode
 * @property {string} key
 * @property {V} value
 * @property {LruNode<V>|null} prev
 * @property {LruNode<V>|null} next
 */

/**
 * Create an LRU cache.
 *
 * @template V
 * @param {number} [capacity]
 * @returns {{ get: (key: string) => V|undefined, set: (key: string, value: V) => void, delete: (key: string) => void, clear: () => void, size: () => number }}
 */
export function createLruCache(capacity = DFG_CACHE_CAPACITY) {
  /** @type {Map<string, LruNode<V>>} */
  const map = new Map();

  /** @type {LruNode<V>} sentinel head */
  const head = { key: '', value: /** @type {any} */ (null), prev: null, next: null };
  /** @type {LruNode<V>} sentinel tail */
  const tail = { key: '', value: /** @type {any} */ (null), prev: null, next: null };
  head.next = tail;
  tail.prev = head;

  /**
   * @param {LruNode<V>} node
   */
  function detach(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  /**
   * @param {LruNode<V>} node
   */
  function attachAfterHead(node) {
    node.next = head.next;
    node.prev = head;
    head.next.prev = node;
    head.next = node;
  }

  return {
    get(key) {
      const node = map.get(key);
      if (!node) return undefined;
      detach(node);
      attachAfterHead(node);
      return node.value;
    },

    set(key, value) {
      if (map.has(key)) {
        const node = map.get(key);
        node.value = value;
        detach(node);
        attachAfterHead(node);
        return;
      }
      if (map.size >= capacity) {
        // evict LRU (node before tail)
        const lru = tail.prev;
        detach(lru);
        map.delete(lru.key);
      }
      /** @type {LruNode<V>} */
      const node = { key, value, prev: null, next: null };
      map.set(key, node);
      attachAfterHead(node);
    },

    delete(key) {
      const node = map.get(key);
      if (!node) return;
      detach(node);
      map.delete(key);
    },

    clear() {
      map.clear();
      head.next = tail;
      tail.prev = head;
    },

    size() {
      return map.size;
    },
  };
}

/**
 * Create a DFG cache service that wraps the LRU with the builder.
 *
 * @param {typeof import('./builder.js').buildDfg} builder
 * @param {number} [capacity]
 * @returns {{
 *   get: (key: string) => import('./model.js').Dfg|undefined,
 *   build: (key: string, opts: Parameters<typeof import('./builder.js').buildDfg>[0]) => import('./model.js').Dfg,
 *   invalidate: (functionId: string) => void,
 *   clear: () => void,
 * }}
 */
export function createDfgCache(builder, capacity = DFG_CACHE_CAPACITY) {
  const lru = createLruCache(capacity);

  return {
    get(key) {
      return lru.get(key);
    },

    build(key, opts) {
      const cached = lru.get(key);
      if (cached) return cached;
      const dfg = builder(opts);
      lru.set(key, dfg);
      return dfg;
    },

    invalidate(functionId) {
      // We cannot enumerate keys by prefix in the LRU map without a secondary
      // index; in practice invalidation is rare and the LRU will evict stale
      // entries naturally. Full clear on run change is handled by the caller.
      lru.delete(functionId);
    },

    clear() {
      lru.clear();
    },
  };
}
