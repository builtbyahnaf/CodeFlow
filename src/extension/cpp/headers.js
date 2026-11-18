/**
 * Header-to-translation-unit mapping.
 *
 * A header is not a program. It is analyzed in the context of a TU that
 * includes it; when no TU does, the header is analyzed syntactically only and
 * the run must say so.
 */

/**
 * @typedef {import('./compileDb.js').CompileEntry} CompileEntry
 */

/**
 * @typedef {Object} IncludeDirective
 * @property {string} name   Text between the delimiters
 * @property {boolean} system True for `<...>`
 * @property {number} line    0-based line number
 */

/**
 * Extract `#include` directives without preprocessing. Angle includes are
 * system includes and are never used to claim workspace ownership.
 *
 * @param {string} text
 * @returns {IncludeDirective[]}
 */
export function extractIncludes(text) {
  if (typeof text !== 'string') {
    return [];
  }
  /** @type {IncludeDirective[]} */
  const includes = [];
  const pattern = /^[ \t]*#[ \t]*include[ \t]*([<"])([^>"]+)[>"]/gm;
  for (const match of text.matchAll(pattern)) {
    const before = text.slice(0, match.index ?? 0);
    const line = before.split('\n').length - 1;
    includes.push({
      name: match[2].trim(),
      system: match[1] === '<',
      line,
    });
  }
  return includes;
}

/**
 * @param {string} filePath
 * @returns {boolean}
 */
export function isHeaderPath(filePath) {
  return /\.(h|hh|hpp|hxx|ipp)$/i.test(String(filePath));
}

/**
 * Choose one representative TU for a header. Quoted includes are matched by
 * basename and by the path relative to the TU's directory. The choice is
 * deterministic: exact directory matches win, then lexicographic path order.
 *
 * @param {{
 *   headerPath: string,
 *   entries: CompileEntry[],
 *   includesByTu: Record<string, IncludeDirective[]>,
 * }} options
 * @returns {{tu: CompileEntry, candidates: string[], reason: 'same_directory'|'basename'}|null}
 */
export function selectRepresentativeTu({ headerPath, entries, includesByTu }) {
  const normalizedHeader = toPosix(headerPath);
  const headerName = basename(normalizedHeader);
  /** @type {Array<{entry: CompileEntry, reason: 'same_directory'|'basename'}>} */
  const matches = [];

  for (const entry of entries) {
    const includes = includesByTu[entry.path] ?? [];
    for (const include of includes) {
      if (include.system) {
        continue;
      }
      const includeName = toPosix(include.name);
      const tuDirectory = dirname(toPosix(entry.path));
      const resolvedRelative = normalize(`${tuDirectory}/${includeName}`);
      if (resolvedRelative === normalizedHeader) {
        matches.push({ entry, reason: 'same_directory' });
        break;
      }
      if (basename(includeName) === headerName) {
        matches.push({ entry, reason: 'basename' });
        break;
      }
    }
  }

  if (matches.length === 0) {
    return null;
  }
  matches.sort(
    (left, right) =>
      (left.reason === right.reason ? 0 : left.reason === 'same_directory' ? -1 : 1) ||
      left.entry.path.localeCompare(right.entry.path),
  );
  const best = matches[0];
  return {
    tu: best.entry,
    candidates: matches.map((match) => match.entry.path),
    reason: best.reason,
  };
}

/**
 * Build the complete map for a set of headers.
 *
 * @param {{
 *   headerPaths: string[],
 *   entries: CompileEntry[],
 *   includesByTu: Record<string, IncludeDirective[]>,
 * }} options
 * @returns {{
 *   map: Record<string, {tuPath: string, candidates: string[], reason: string}>,
 *   unmapped: string[],
 * }}
 */
export function buildHeaderMap({ headerPaths, entries, includesByTu }) {
  /** @type {Record<string, {tuPath: string, candidates: string[], reason: string}>} */
  const map = {};
  /** @type {string[]} */
  const unmapped = [];

  for (const headerPath of [...headerPaths].sort()) {
    const selected = selectRepresentativeTu({ headerPath, entries, includesByTu });
    if (!selected) {
      unmapped.push(headerPath);
      continue;
    }
    map[headerPath] = {
      tuPath: selected.tu.path,
      candidates: selected.candidates,
      reason: selected.reason,
    };
  }

  return { map, unmapped };
}

/**
 * @param {string} value
 * @returns {string}
 */
function toPosix(value) {
  return String(value).replace(/\\/g, '/');
}

/**
 * @param {string} value
 * @returns {string}
 */
function basename(value) {
  const parts = value.split('/');
  return parts[parts.length - 1];
}

/**
 * @param {string} value
 * @returns {string}
 */
function dirname(value) {
  const index = value.lastIndexOf('/');
  return index === -1 ? '' : value.slice(0, index);
}

/**
 * Resolve `.` and `..` segments in a POSIX path without touching the file
 * system.
 *
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  /** @type {string[]} */
  const output = [];
  for (const segment of value.split('/')) {
    if (segment === '' || segment === '.') {
      continue;
    }
    if (segment === '..') {
      output.pop();
      continue;
    }
    output.push(segment);
  }
  return output.join('/');
}
