/**
 * Work ordering and batch planning for the indexing pipeline (Phase 8 §7).
 *
 * Files are ordered shallow-first (fewest directory segments), then by byte
 * size ascending, then lexicographically by normalized path so early batches
 * commit quickly and ordering is 100% deterministic.
 */

/**
 * @typedef {{path: string, sizeBytes?: number, language?: 'cpp'|'javascript'}} CandidateFile
 */

/**
 * Count directory depth (`src/a.js` -> 1, `a.js` -> 0).
 *
 * @param {string} relativePath
 * @returns {number}
 */
export function pathDepth(relativePath) {
  const unix = String(relativePath ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  if (!unix) {
    return 0;
  }
  return unix.split('/').length - 1;
}

/**
 * Sort candidate files shallow-first, then by size ascending, then by path.
 *
 * @template {CandidateFile} T
 * @param {T[]} candidates
 * @returns {Array<T & {path: string, sizeBytes: number, depth: number}>}
 */
export function orderCandidateFiles(candidates) {
  return [...(Array.isArray(candidates) ? candidates : [])]
    .filter((item) => item && typeof item.path === 'string' && item.path.length > 0)
    .map((item) => {
      const normalized = item.path.replace(/\\/g, '/').replace(/^\.\//, '');
      const sizeBytes = Math.max(
        0,
        Number.isFinite(Number(item.sizeBytes)) ? Number(item.sizeBytes) : 0,
      );
      return {
        ...item,
        path: normalized,
        sizeBytes,
        depth: pathDepth(normalized),
      };
    })
    .sort((a, b) => {
      if (a.depth !== b.depth) {
        return a.depth - b.depth;
      }
      if (a.sizeBytes !== b.sizeBytes) {
        return a.sizeBytes - b.sizeBytes;
      }
      return a.path < b.path ? -1 : a.path > b.path ? 1 : 0;
    });
}

/**
 * Split ordered files into atomic transaction batches (default 50 files per batch).
 *
 * @template T
 * @param {T[]} orderedFiles
 * @param {number | {batchSize?: number}} [batchSizeOrOptions]
 * @returns {T[][]}
 */
export function planIndexBatches(orderedFiles, batchSizeOrOptions = 50) {
  const list = Array.isArray(orderedFiles) ? orderedFiles : [];
  const rawSize =
    typeof batchSizeOrOptions === 'number' ? batchSizeOrOptions : batchSizeOrOptions?.batchSize;
  const batchSize = Math.max(1, Math.trunc(Number(rawSize) || 50));
  /** @type {T[][]} */
  const batches = [];
  for (let index = 0; index < list.length; index += batchSize) {
    batches.push(list.slice(index, index + batchSize));
  }
  return batches;
}
