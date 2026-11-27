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
  'createTextNode',
  'createDocumentFragment',
  'appendChild',
  'removeChild',
  'insertBefore',
  'replaceChild',
  'replaceWith',
  'append',
  'prepend',
  'closest',
  'matches',
  'getBoundingClientRect',
  'scrollIntoView',
  'dispatchEvent',
  'remove',
  'focus',
  'blur',
  'click',
  'reset',
  'submit',
  'showModal',
  'preventDefault',
  'stopPropagation',
  'setAttribute',
  'getAttribute',
  'removeAttribute',
  'hasAttribute',
  'toggle',
  'add',
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
  'assign',
  'freeze',
  'defineProperty',
  'hasOwn',
  'stringify',
  'parse',
  // Common C/C++ stdlib & STL functions, containers, algorithms, streams, threading
  'printf',
  'fprintf',
  'sprintf',
  'snprintf',
  'vprintf',
  'vfprintf',
  'vsprintf',
  'vsnprintf',
  'scanf',
  'fscanf',
  'sscanf',
  'puts',
  'fputs',
  'fgets',
  'getchar',
  'putchar',
  'fgetc',
  'fputc',
  'ungetc',
  'fopen',
  'fclose',
  'fflush',
  'fread',
  'fwrite',
  'fseek',
  'ftell',
  'rewind',
  'feof',
  'ferror',
  'perror',
  'malloc',
  'calloc',
  'realloc',
  'free',
  'memcpy',
  'memset',
  'memmove',
  'memcmp',
  'memchr',
  'strlen',
  'strcmp',
  'strncmp',
  'strcpy',
  'strncpy',
  'strcat',
  'strncat',
  'strchr',
  'strrchr',
  'strstr',
  'strtok',
  'strerror',
  'atoi',
  'atol',
  'atoll',
  'atof',
  'strtol',
  'strtoul',
  'strtoll',
  'strtod',
  'strtof',
  'rand',
  'srand',
  'qsort',
  'bsearch',
  'abs',
  'labs',
  'llabs',
  'fabs',
  'div',
  'ldiv',
  'isalpha',
  'isdigit',
  'isalnum',
  'isspace',
  'isupper',
  'islower',
  'isprint',
  'iscntrl',
  'ispunct',
  'isxdigit',
  'toupper',
  'tolower',
  'sin',
  'cos',
  'tan',
  'asin',
  'acos',
  'atan',
  'atan2',
  'sinh',
  'cosh',
  'tanh',
  'exp',
  'exp2',
  'log',
  'log2',
  'log10',
  'pow',
  'sqrt',
  'cbrt',
  'hypot',
  'ceil',
  'floor',
  'trunc',
  'round',
  'lround',
  'llround',
  'fmod',
  'remainder',
  'fma',
  'fmin',
  'fmax',
  'isnan',
  'isinf',
  'isfinite',
  'time',
  'clock',
  'difftime',
  'mktime',
  'localtime',
  'gmtime',
  'strftime',
  'getenv',
  'system',
  'exit',
  'abort',
  'assert',
  'push',
  'pop',
  'top',
  'push_back',
  'emplace_back',
  'pop_back',
  'push_front',
  'emplace_front',
  'pop_front',
  'emplace',
  'try_emplace',
  'insert',
  'insert_or_assign',
  'erase',
  'extract',
  'empty',
  'size',
  'max_size',
  'length',
  'capacity',
  'reserve',
  'resize',
  'shrink_to_fit',
  'bucket_count',
  'load_factor',
  'rehash',
  'begin',
  'end',
  'cbegin',
  'cend',
  'rbegin',
  'rend',
  'crbegin',
  'crend',
  'front',
  'back',
  'at',
  'data',
  'count',
  'count_if',
  'contains',
  'find_if',
  'find_if_not',
  'find_first_of',
  'find_end',
  'adjacent_find',
  'search',
  'lower_bound',
  'upper_bound',
  'equal_range',
  'binary_search',
  'sort',
  'stable_sort',
  'partial_sort',
  'nth_element',
  'is_sorted',
  'is_sorted_until',
  'reverse',
  'reverse_copy',
  'rotate',
  'rotate_copy',
  'shuffle',
  'unique',
  'unique_copy',
  'swap',
  'swap_ranges',
  'iter_swap',
  'assign',
  'merge',
  'inplace_merge',
  'set_union',
  'set_intersection',
  'set_difference',
  'set_symmetric_difference',
  'make_heap',
  'push_heap',
  'pop_heap',
  'sort_heap',
  'min',
  'max',
  'minmax',
  'min_element',
  'max_element',
  'minmax_element',
  'clamp',
  'lexicographical_compare',
  'next_permutation',
  'prev_permutation',
  'all_of',
  'any_of',
  'none_of',
  'copy',
  'copy_if',
  'copy_n',
  'copy_backward',
  'move',
  'move_backward',
  'forward',
  'exchange',
  'fill',
  'fill_n',
  'generate',
  'generate_n',
  'replace_if',
  'replace_copy',
  'replace_copy_if',
  'remove_if',
  'remove_copy',
  'remove_copy_if',
  'accumulate',
  'inner_product',
  'partial_sum',
  'adjacent_difference',
  'exclusive_scan',
  'inclusive_scan',
  'transform_reduce',
  'iota',
  'transform',
  'for_each',
  'distance',
  'advance',
  'next',
  'prev',
  'back_inserter',
  'front_inserter',
  'inserter',
  'gcd',
  'lcm',
  'midpoint',
  'make_pair',
  'make_tuple',
  'forward_as_tuple',
  'tuple_cat',
  'tie',
  'make_shared',
  'make_unique',
  'allocate_shared',
  'static_pointer_cast',
  'dynamic_pointer_cast',
  'const_pointer_cast',
  'make_optional',
  'make_any',
  'any_cast',
  'holds_alternative',
  'get_if',
  'visit',
  'apply',
  'addressof',
  'invoke',
  'bind',
  'ref',
  'cref',
  'mem_fn',
  'reset',
  'release',
  'use_count',
  'expired',
  'lock',
  'unlock',
  'try_lock',
  'wait',
  'wait_for',
  'wait_until',
  'notify_one',
  'notify_all',
  'join',
  'detach',
  'joinable',
  'get_id',
  'hardware_concurrency',
  'async',
  'get_future',
  'sleep_for',
  'sleep_until',
  'yield',
  'now',
  'duration_cast',
  'time_since_epoch',
  'to_string',
  'stoi',
  'stol',
  'stoll',
  'stoul',
  'stoull',
  'stof',
  'stod',
  'stold',
  'getline',
  'substr',
  'c_str',
  'append',
  'compare',
  'rfind',
  'find_first_not_of',
  'find_last_of',
  'find_last_not_of',
  'starts_with',
  'ends_with',
  'str',
  'rdbuf',
  'eof',
  'good',
  'fail',
  'bad',
  'rdstate',
  'setstate',
  'exceptions',
  'peek',
  'ignore',
  'putback',
  'unget',
  'read',
  'write',
  'gcount',
  'seekg',
  'tellg',
  'seekp',
  'tellp',
  'open',
  'close',
  'is_open',
  'flush',
  'sync',
  'setf',
  'unsetf',
  'flags',
  'precision',
  'width',
  'setw',
  'setfill',
  'setprecision',
  'sync_with_stdio',
  'cin',
  'cout',
  'cerr',
  'clog',
  'endl',
  'regex_match',
  'regex_search',
  'regex_replace',
  'vector',
  'string',
  'wstring',
  'string_view',
  'map',
  'unordered_map',
  'set',
  'unordered_set',
  'multimap',
  'multiset',
  'deque',
  'list',
  'forward_list',
  'stack',
  'queue',
  'priority_queue',
  'pair',
  'tuple',
  'array',
  'span',
  'bitset',
  'optional',
  'variant',
  'any',
  'unique_ptr',
  'shared_ptr',
  'weak_ptr',
  'function',
  'thread',
  'mutex',
  'recursive_mutex',
  'shared_mutex',
  'lock_guard',
  'unique_lock',
  'scoped_lock',
  'condition_variable',
  'stringstream',
  'istringstream',
  'ostringstream',
  'ifstream',
  'ofstream',
  'fstream',
  'numeric_limits',
  'typeid',
]);

/**
 * Normalize a callee identifier by stripping template specializations (`<...>`)
 * and returning both the trimmed candidate and its final segment after `::` or `.`.
 *
 * @param {string|null|undefined} raw
 * @returns {{whole: string, leaf: string}}
 */
function stripTemplateAndNamespace(raw) {
  const whole = String(raw ?? '')
    .replace(/<[^<>]*>/g, '')
    .trim();
  if (!whole) {
    return { whole: '', leaf: '' };
  }
  const parts = whole.split(/(?:::|\.)/).filter(Boolean);
  const leaf = parts.length > 0 ? parts[parts.length - 1] : whole;
  return { whole, leaf };
}

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
  const nameParts = stripTemplateAndNamespace(calleeName);
  if (KNOWN_BUILTIN_NAMES.has(nameParts.whole) || KNOWN_BUILTIN_NAMES.has(nameParts.leaf)) {
    return true;
  }
  if (/^operator\s*(?:<<|>>|\[\]|\(\)|->|==|!=|<=|>=|<|>|\+|-|\*|\/|=)$/.test(nameParts.leaf)) {
    return true;
  }
  if (id.startsWith('external:')) {
    const rawTarget = id.replace(/^external:(?:global\.|member\.)?/, '');
    const targetParts = stripTemplateAndNamespace(rawTarget);
    if (KNOWN_BUILTIN_NAMES.has(targetParts.whole) || KNOWN_BUILTIN_NAMES.has(targetParts.leaf)) {
      return true;
    }
    if (/^(?:std::|__1::|__cxx11::|__gnu_cxx::)/.test(targetParts.whole)) {
      return true;
    }
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
  if (id.startsWith('external:member.')) {
    return id.slice('external:member.'.length);
  }
  if (id.startsWith('external:')) {
    return id.slice('external:'.length);
  }
  const parts = id.split(/[.:/#]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : id;
}

/**
 * Normalize a single relationship so a known builtin or STL call/instantiation
 * is no longer counted as an unresolved user target.
 *
 * Only `calls` and `instantiates` relationships are touched, and only when they
 * are currently `unresolved`. Everything else is returned unchanged.
 *
 * @template {Record<string, any>} T
 * @param {T} rel
 * @returns {T}
 */
export function normalizeBuiltinCallRelationship(rel) {
  if (
    !rel ||
    (rel.type !== 'calls' && rel.type !== 'instantiates') ||
    rel.status !== 'unresolved'
  ) {
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

const CALLABLE_SYMBOL_KINDS = new Set([
  'function',
  'method',
  'constructor',
  'class',
  'closure',
]);

/**
 * Resolve `external:...` call/instantiation relationships against a cross-file
 * symbol table (such as the project index or multi-module run) after builtin
 * normalization. Only symbols declared outside `rel.from`'s external placeholder
 * are matched; genuine ambiguous or unindexed targets keep their status.
 *
 * @template {Record<string, any>} T
 * @param {T[]|null|undefined} relationships
 * @param {Array<Record<string, any>>|null|undefined} symbols
 * @returns {T[]}
 */
export function resolveExternalCallsWithSymbols(relationships, symbols) {
  const relList = Array.isArray(relationships) ? relationships : [];
  const symList = Array.isArray(symbols) ? symbols : [];
  if (symList.length === 0 || relList.length === 0) {
    return relList;
  }
  /** @type {Map<string, Array<Record<string, any>>>} */
  const byName = new Map();
  /** @type {Map<string, Array<Record<string, any>>>} */
  const byQualified = new Map();

  for (const sym of symList) {
    if (!sym || typeof sym.symbolId !== 'string' || !CALLABLE_SYMBOL_KINDS.has(sym.kind)) {
      continue;
    }
    if (sym.name) {
      const list = byName.get(sym.name) ?? [];
      list.push(sym);
      byName.set(sym.name, list);
    }
    if (sym.qualifiedName) {
      const qList = byQualified.get(sym.qualifiedName) ?? [];
      qList.push(sym);
      byQualified.set(sym.qualifiedName, qList);
    }
  }

  return relList.map((rel) => {
    if (
      !rel ||
      (rel.type !== 'calls' && rel.type !== 'instantiates') ||
      rel.status !== 'unresolved' ||
      typeof rel.to !== 'string' ||
      !rel.to.startsWith('external:')
    ) {
      return rel;
    }
    const rawTarget = rel.to
      .replace(/^external:(?:global\.|member\.|module:|require:)?/, '')
      .trim();
    const { whole, leaf } = stripTemplateAndNamespace(rawTarget);
    const qualifiedMatches = whole ? (byQualified.get(whole) ?? []) : [];
    const nameMatches = qualifiedMatches.length > 0 ? qualifiedMatches : (byName.get(leaf) ?? []);
    if (nameMatches.length === 0) {
      return rel;
    }
    const best = nameMatches[0];
    const nextStatus = nameMatches.length === 1 ? 'resolved' : 'inferred';
    return {
      ...rel,
      to: best.symbolId,
      status: nextStatus,
      strongestStatus: nextStatus,
      reasonCode: 'workspace_index',
      ...(nameMatches.length > 1
        ? {
            extensions: {
              ...(rel.extensions ?? {}),
              candidates: nameMatches.map((m) => m.symbolId),
            },
          }
        : {}),
    };
  });
}
