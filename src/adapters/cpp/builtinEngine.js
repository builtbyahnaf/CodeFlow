/**
 * Built-in pure JavaScript C/C++ syntactic analyzer.
 *
 * Provides a self-contained, frictionless fallback engine when Clang is absent.
 * It extracts functions, control-flow constructs (if/for/while/switch/return),
 * and call relationships with exact source-range fidelity directly from source text.
 *
 * No external dependencies, no compilers, no process spawning.
 */

export const BUILTIN_ENGINE_VERSION = '1.2.0';

/**
 * Convert character offset to 0-based { line, column }.
 *
 * @param {number[]} lineStarts
 * @param {number} offset
 * @returns {{ line: number, column: number }}
 */
export function offsetToPos(lineStarts, offset) {
  let low = 0;
  let high = lineStarts.length - 1;
  let line = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineStarts[mid] <= offset) {
      line = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return { line, column: Math.max(0, offset - lineStarts[line]) };
}
