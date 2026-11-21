/**
 * JavaScript file classification.
 *
 * Module kind is decided by extension first and the nearest `package.json`
 * `type` second, matching Node's rules. TypeScript and JSX are classified
 * explicitly so they can be rejected instead of half-parsed.
 */

export const JAVASCRIPT_EXTENSIONS = Object.freeze(['.js', '.mjs', '.cjs', '.jsx']);

export const DEFAULT_EXCLUDED_SEGMENTS = Object.freeze([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'vendor',
  '.codeflow',
]);

/**
 * @param {unknown} path
 * @returns {string} lower-case extension including the dot
 */
export function extensionOf(path) {
  const value = String(path ?? '').replace(/\\/g, '/');
  const name = value.slice(value.lastIndexOf('/') + 1);
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index).toLowerCase();
}

/**
 * @param {unknown} path
 * @returns {boolean}
 */
export function isTypeScriptPath(path) {
  const ext = extensionOf(path);
  return ext === '.ts' || ext === '.mts' || ext === '.cts';
}

/**
 * @param {unknown} path
 * @returns {boolean}
 */
export function isJsxPath(path) {
  const ext = extensionOf(path);
  return ext === '.jsx' || ext === '.tsx';
}

/**
 * @param {unknown} path
 * @returns {boolean}
 */
export function isJavaScriptPath(path) {
  return JAVASCRIPT_EXTENSIONS.includes(extensionOf(path));
}

/**
 * @param {unknown} path
 * @returns {boolean}
 */
export function isMinifiedPath(path) {
  const value = String(path ?? '').replace(/\\/g, '/');
  return /\.min\.[cm]?js$/i.test(value) || /\.bundle\.[cm]?js$/i.test(value);
}

/**
 * @param {unknown} path
 * @param {{segments?: readonly string[]}} [options]
 * @returns {{excluded: boolean, reason?: 'excluded_directory'|'minified'}}
 */
export function exclusionFor(path, options = {}) {
  const segments = options.segments ?? DEFAULT_EXCLUDED_SEGMENTS;
  const normalized = String(path ?? '').replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  if (parts.some((part) => segments.includes(part))) {
    return { excluded: true, reason: 'excluded_directory' };
  }
  if (isMinifiedPath(normalized)) {
    return { excluded: true, reason: 'minified' };
  }
  return { excluded: false };
}

/**
 * @param {unknown} text
 * @returns {boolean}
 */
export function isGeneratedSource(text) {
  const head = String(text ?? '').slice(0, 2_000);
  return /@generated\b/i.test(head) || /Code generated .*DO NOT EDIT/i.test(head);
}

/**
 * @param {{path: string, packageType?: 'module'|'commonjs'|undefined}} input
 * @returns {'module'|'script'}
 */
export function detectModuleKind(input) {
  const ext = extensionOf(input.path);
  if (ext === '.mjs') {
    return 'module';
  }
  if (ext === '.cjs') {
    return 'script';
  }
  return input.packageType === 'module' ? 'module' : 'script';
}
