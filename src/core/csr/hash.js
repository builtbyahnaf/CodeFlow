/**
 * Small, dependency-free hashing used for identity and change detection.
 *
 * These are not cryptographic hashes. They exist so that repeated runs can be
 * compared cheaply and so that ids are short and deterministic. Security-facing
 * hashes (file content, extensions) are produced by the host, not here.
 */

const FNV_OFFSET_A = 0x811c9dc5;
const FNV_OFFSET_B = 0x01000193;
const FNV_PRIME = 0x01000193;

/**
 * @param {string} text
 * @param {number} seed
 * @returns {string} eight lower-case hex characters
 */
function fnv1a32(text, seed) {
  let hash = seed >>> 0;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * 64-bit-ish hash built from two independent 32-bit passes. Stable across
 * processes and platforms because it only uses char codes and integer math.
 *
 * @param {string} text
 * @returns {string} sixteen lower-case hex characters
 */
export function hashHex(text) {
  const value = String(text);
  return `${fnv1a32(value, FNV_OFFSET_A)}${fnv1a32(value, FNV_OFFSET_B)}`;
}

/**
 * @param {string} text
 * @returns {string} eight lower-case hex characters
 */
export function shortHash(text) {
  return fnv1a32(String(text), FNV_OFFSET_A);
}
