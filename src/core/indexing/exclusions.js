/**
 * Workspace file exclusion and inclusion rules (Phase 8 §8, P8-05).
 *
 * Precedence:
 * 1. Mandatory safety exclusions (`.codeflow/**`, `.git/**`, traversal `..`,
 *    absolute paths, NUL bytes, binary extensions, unsupported extensions)
 *    ALWAYS exclude.
 * 2. User `exclude` patterns ALWAYS win over `include` and defaults.
 * 3. User `include` patterns override default directory exclusions (e.g.
 *    allowing `vendor/custom/**` when explicitly included).
 * 4. Default directory/file excludes and root `.gitignore` hints exclude
 *    everything else matching them.
 */

export const ALWAYS_EXCLUDED_DIRS = Object.freeze(['.codeflow', '.git']);

export const DEFAULT_EXCLUDED_DIRS = Object.freeze([
  '.git',
  'node_modules',
  '.codeflow',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  'third_party',
]);

export const DEFAULT_SUPPORTED_EXTENSIONS = Object.freeze([
  '.js',
  '.mjs',
  '.cjs',
  '.cpp',
  '.cc',
  '.cxx',
  '.hpp',
  '.hh',
  '.hxx',
  '.h',
]);

export const BINARY_EXTENSIONS = Object.freeze([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.ico',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.vsix',
  '.exe',
  '.dll',
  '.so',
  '.dylib',
  '.o',
  '.obj',
  '.a',
  '.lib',
  '.wasm',
  '.sqlite',
  '.db',
]);

const CPP_EXTENSIONS = new Set(['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx', '.h']);

/**
 * Convert a simple workspace-relative glob (`**`, `*`, `?`, `dir/**`, `*.ext`)
 * into a RegExp.
 *
 * @param {string} pattern
 * @returns {RegExp}
 */
export function globToRegExp(pattern) {
  let unix = String(pattern ?? '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  if (unix.endsWith('/')) {
    unix = `${unix}**`;
  }
  let regex = '^';
  for (let i = 0; i < unix.length; i += 1) {
    const ch = unix[i];
    if (ch === '*') {
      if (unix[i + 1] === '*') {
        if (unix[i + 2] === '/') {
          regex += '(?:.*/)?';
          i += 2;
        } else {
          regex += '.*';
          i += 1;
        }
      } else {
        regex += '[^/]*';
      }
    } else if (ch === '?') {
      regex += '[^/]';
    } else if ('.+^${}()|[]\\'.includes(ch)) {
      regex += `\\${ch}`;
    } else {
      regex += ch;
    }
  }
  regex += '$';
  return new RegExp(regex);
}

/**
 * Parse a root `.gitignore` file into simple workspace-relative exclusion hints.
 * Negated (`!`) and complex anchored rules are ignored because `.gitignore` is
 * used as a default hint only (Phase 8 §8).
 *
 * @param {string} text
 * @returns {string[]}
 */
export function parseGitignoreHints(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return [];
  }
  /** @type {string[]} */
  const hints = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('!')) {
      continue;
    }
    const clean = line.replace(/^\/+/, '');
    if (!clean || clean.includes('..')) {
      continue;
    }
    if (clean.endsWith('/')) {
      hints.push(`${clean}**`);
    } else if (!clean.includes('/')) {
      hints.push(clean, `**/${clean}`, `${clean}/**`, `**/${clean}/**`);
    } else {
      hints.push(clean, `${clean}/**`);
    }
  }
  return [...new Set(hints)];
}

/**
 * Decide whether a workspace-relative path should be indexed.
 *
 * @param {string} relativePath
 * @param {{
 *   exclude?: string[],
 *   include?: string[],
 *   gitignorePatterns?: string[],
 *   gitignoreHints?: string[],
 *   supportedExtensions?: readonly string[],
 * }} [options]
 * @returns {{
 *   allowed: boolean,
 *   include: boolean,
 *   reason: string,
 *   normalizedPath: string,
 *   language?: 'cpp'|'javascript',
 * }}
 */
export function shouldIndexPath(relativePath, options = {}) {
  if (
    typeof relativePath !== 'string' ||
    relativePath.length === 0 ||
    relativePath.includes('\u0000')
  ) {
    return { allowed: false, include: false, reason: 'invalid_path', normalizedPath: '' };
  }
  const unix = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  if (unix.startsWith('/') || /^[A-Za-z]:/.test(unix)) {
    return { allowed: false, include: false, reason: 'absolute_path', normalizedPath: unix };
  }
  const segments = unix.split('/').filter(Boolean);
  if (segments.length === 0 || segments.includes('..')) {
    return { allowed: false, include: false, reason: 'path_traversal', normalizedPath: unix };
  }

  // Self-indexing of `.codeflow` or `.git` is unconditionally forbidden.
  if (segments.some((seg) => ALWAYS_EXCLUDED_DIRS.includes(seg))) {
    return { allowed: false, include: false, reason: 'always_excluded', normalizedPath: unix };
  }

  const lower = unix.toLowerCase();
  if (lower.endsWith('.min.js') || lower.endsWith('.bundle.js')) {
    return { allowed: false, include: false, reason: 'minified_or_bundle', normalizedPath: unix };
  }
  for (const binExt of BINARY_EXTENSIONS) {
    if (lower.endsWith(binExt)) {
      return {
        allowed: false,
        include: false,
        reason: 'binary_or_generated',
        normalizedPath: unix,
      };
    }
  }

  const supported = options.supportedExtensions ?? DEFAULT_SUPPORTED_EXTENSIONS;
  const matchedExt = supported.find((ext) => lower.endsWith(ext.toLowerCase()));
  if (!matchedExt) {
    return {
      allowed: false,
      include: false,
      reason: 'unsupported_extension',
      normalizedPath: unix,
    };
  }
  const language = CPP_EXTENSIONS.has(matchedExt.toLowerCase()) ? 'cpp' : 'javascript';

  // User exclude patterns always win.
  for (const pattern of options.exclude ?? []) {
    if (globToRegExp(pattern).test(unix)) {
      return {
        allowed: false,
        include: false,
        reason: 'user_excluded',
        normalizedPath: unix,
        language,
      };
    }
  }

  // User include patterns override default directory and gitignore exclusions.
  for (const pattern of options.include ?? []) {
    if (globToRegExp(pattern).test(unix)) {
      return {
        allowed: true,
        include: true,
        reason: 'user_included',
        normalizedPath: unix,
        language,
      };
    }
  }

  // Default excluded directories.
  for (const seg of segments.slice(0, -1)) {
    if (DEFAULT_EXCLUDED_DIRS.includes(seg) || seg.startsWith('cmake-build-')) {
      return {
        allowed: false,
        include: false,
        reason: 'default_excluded',
        normalizedPath: unix,
        language,
      };
    }
  }

  // Root .gitignore hints.
  const gitignoreList = options.gitignorePatterns ?? options.gitignoreHints ?? [];
  for (const hint of gitignoreList) {
    if (globToRegExp(hint).test(unix)) {
      return {
        allowed: false,
        include: false,
        reason: 'gitignore_excluded',
        normalizedPath: unix,
        language,
      };
    }
  }

  return {
    allowed: true,
    include: true,
    reason: 'included',
    normalizedPath: unix,
    language,
  };
}
