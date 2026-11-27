/**
 * Shared classification for well-known builtin, runtime, and standard-library
 * calls.
 *
 * Adapters are deliberately honest: a call whose declaration is not part of the
 * analyzed file is reported as `unresolved` with `reasonCode: 'out_of_scope'`.
 * That is correct at the CSR level, but consumers (CFG badges, call graph
 * buckets, semantic zoom aggregates) must not treat a call to `console.log`,
 * `std::sort`, or `arr.push_back` as an unknown user target. This module is the
 * single source of truth those consumers share.
 *
 * The classifier is intentionally conservative: it only recognizes names that
 * are unambiguously part of a language runtime or standard library. A name that
 * merely *could* be user-defined is left unresolved so the graph never invents
 * certainty.
 */

/**
 * Target id prefixes that are always considered builtin/runtime calls.
 *
 * @type {readonly string[]}
 */
export const KNOWN_BUILTIN_PREFIXES = Object.freeze([
  'external:global.console.',
  'external:global.Math.',
  'external:global.JSON.',
  'external:global.Object.',
  'external:global.Array.',
  'external:global.Promise.',
  'external:global.Date.',
  'external:global.Number.',
  'external:global.String.',
  'external:global.Boolean.',
  'external:global.Reflect.',
  'external:global.Map.',
  'external:global.Set.',
  'external:global.document.',
  'external:global.window.',
  'external:global.navigator.',
  'external:global.location.',
  'external:global.history.',
  'external:global.localStorage.',
  'external:global.sessionStorage.',
  'external:global.URL.',
  'external:global.Buffer.',
  'external:global.process.',
  'external:global.crypto.',
  'external:global.performance.',
  'external:global.localStorage.',
  'external:global.sessionStorage.',
  'external:std::',
  'external:std::__1::',
  'external:std::__cxx11::',
  'external:__gnu_cxx::',
]);

/**
 * Bare callee names that are always considered builtin/runtime/stdlib calls.
 *
 * @type {ReadonlySet<string>}
 */
export const KNOWN_BUILTIN_NAMES = new Set([
  'console',
  'fetch',
  'setTimeout',
  'clearTimeout',
  'setInterval',
  'clearInterval',
  'requestAnimationFrame',
  'cancelAnimationFrame',
  'queueMicrotask',
  'structuredClone',
  'parseInt',
  'parseFloat',
  'isNaN',
  'isFinite',
  'encodeURIComponent',
  'decodeURIComponent',
  'encodeURI',
  'decodeURI',
  'atob',
  'btoa',
  'alert',
  'confirm',
  'prompt',
  'String',
  'Number',
  'Boolean',
  'Array',
  'Object',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Date',
  'RegExp',
  'Error',
  'TypeError',
  'URL',
  'URLSearchParams',
  'FormData',
  'Headers',
  'Request',
  'Response',
  'AbortController',
  'WebSocket',
  'FileReader',
  // Common JS/DOM collection & prototype methods
  'map',
  'filter',
  'reduce',
  'forEach',
  'find',
  'findIndex',
  'some',
  'every',
  'includes',
  'indexOf',
  'push',
  'pop',
  'shift',
  'unshift',
  'slice',
  'splice',
  'concat',
  'join',
  'split',
  'trim',
  'replace',
  'replaceAll',
  'match',
  'test',
  'startsWith',
  'endsWith',
  'toLowerCase',
  'toUpperCase',
  'toFixed',
  'toString',
  'valueOf',
  'json',
  'text',
  'then',
  'catch',
  'finally',
  'addEventListener',
  'removeEventListener',
  'querySelector',
  'querySelectorAll',
  'getElementById',
  'getElementsByClassName',
  'getElementsByTagName',
  'createElement',
  'appendChild',
  'removeChild',
  'insertBefore',
  'remove',
  'focus',
  'blur',
  'click',
  'preventDefault',
  'stopPropagation',
  'setAttribute',
  'getAttribute',
  'has',
  'get',
  'set',
  'delete',
  'clear',
  'keys',
  'values',
  'entries',
  'from',
  'isArray',
  'stringify',
  'parse',
  // Common C/C++ stdlib / STL methods
  'printf',
  'fprintf',
  'sprintf',
  'snprintf',
  'scanf',
  'puts',
  'getchar',
  'malloc',
  'calloc',
  'realloc',
  'free',
  'memcpy',
  'memset',
  'memmove',
  'strlen',
  'strcmp',
  'strncmp',
  'strcpy',
  'strncpy',
  'strcat',
  'exit',
  'abort',
  'assert',
  'push_back',
  'emplace_back',
  'pop_back',
  'push_front',
  'emplace_front',
  'pop_front',
  'emplace',
  'insert',
  'erase',
  'empty',
  'size',
  'length',
  'capacity',
  'reserve',
  'resize',
  'begin',
  'end',
  'rbegin',
  'rend',
  'front',
  'back',
  'at',
  'count',
  'contains',
  'lower_bound',
  'upper_bound',
  'equal_range',
  'sort',
  'stable_sort',
  'reverse',
  'unique',
  'swap',
  'assign',
  'merge',
  'min',
  'max',
  'min_element',
  'max_element',
  'accumulate',
  'transform',
  'for_each',
  'make_pair',
  'make_shared',
  'make_unique',
  'to_string',
  'stoi',
  'stol',
  'stod',
  'getline',
  'substr',
  'c_str',
  'append',
  'compare',
]);

/**
 * @param {string|null|undefined} target
 * @param {string|null|undefined} calleeName
 * @returns {boolean}
 */
export function isKnownBuiltinCall(target, calleeName) {
  const id = String(target ?? '');
  if (KNOWN_BUILTIN_PREFIXES.some((prefix) => id.startsWith(prefix))) {
    return true;
  }
  const cleanName = String(calleeName ?? '').trim();
  if (KNOWN_BUILTIN_NAMES.has(cleanName)) {
    return true;
  }
  if (
    id.startsWith('external:global.') &&
    KNOWN_BUILTIN_NAMES.has(id.slice('external:global.'.length))
  ) {
    return true;
  }
  return false;
}

/**
 * Derive the most specific callee name from a target id.
 *
 * @param {string|null|undefined} target
 * @returns {string}
 */
export function calleeNameFromTarget(target) {
  const id = String(target ?? '');
  if (id.startsWith('external:global.')) {
    return id.slice('external:global.'.length);
  }
  if (id.startsWith('external:')) {
    return id.slice('external:'.length);
  }
  const parts = id.split(/[.:/#]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : id;
}

/**
 * Normalize a single relationship so a known builtin call is no longer counted
 * as an unresolved user target.
 *
 * Only `calls` relationships are touched, and only when they are currently
 * `unresolved`. Everything else is returned unchanged.
 *
 * @template {Record<string, any>} T
 * @param {T} rel
 * @returns {T}
 */
export function normalizeBuiltinCallRelationship(rel) {
  if (!rel || rel.type !== 'calls' || rel.status !== 'unresolved') {
    return rel;
  }
  const calleeName = rel.calleeName ?? rel.extensions?.calleeName ?? calleeNameFromTarget(rel.to);
  if (!isKnownBuiltinCall(rel.to, calleeName)) {
    return rel;
  }
  return {
    ...rel,
    status: 'resolved',
    strongestStatus: 'resolved',
    reasonCode: 'builtin_api',
  };
}

/**
 * Normalize a relationship list. Returns a new array; input records are not
 * mutated.
 *
 * @template {Record<string, any>} T
 * @param {T[]|null|undefined} relationships
 * @returns {T[]}
 */
export function normalizeBuiltinCalls(relationships) {
  return (Array.isArray(relationships) ? relationships : []).map(
    normalizeBuiltinCallRelationship,
  );
}
