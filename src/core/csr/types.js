/**
 * CodeFlow Semantic Representation (CSR) — normative vocabulary, version 1.1.
 *
 * STATUS: NORMATIVE. `docs/CSR_SPECIFICATION.md` is the prose contract; this
 * module is the executable half of it. Every consumer treats these enums as
 * closed. Adding a value requires updating the spec, the validator, the graph
 * legend, and the tests in one change.
 *
 * Version policy:
 * - additive fields are a minor bump;
 * - semantic changes are a major bump;
 * - consumers reject an unknown major and ignore an unknown minor.
 */

export const CSR_VERSION = '1.1.0';

/** The only major version this build understands. */
export const CSR_SUPPORTED_MAJOR = 1;

/**
 * @param {unknown} value
 * @returns {{major: number, minor: number, patch: number} | null}
 */
export function parseCsrVersion(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(value);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

/**
 * A consumer accepts any minor/patch of its supported major. It reports an
 * unknown newer minor as a diagnostic rather than rejecting it, because
 * additive fields must not break older consumers.
 *
 * @param {unknown} value
 * @returns {boolean}
 */
export function isCompatibleCsrVersion(value) {
  const parsed = parseCsrVersion(value);
  return parsed !== null && parsed.major === CSR_SUPPORTED_MAJOR;
}

/**
 * @param {unknown} value
 * @returns {boolean} true when the version is newer than this build's minor
 */
export function isNewerMinor(value) {
  const parsed = parseCsrVersion(value);
  const current = parseCsrVersion(CSR_VERSION);
  if (!parsed || !current) {
    return false;
  }
  return parsed.major === current.major && parsed.minor > current.minor;
}

/** @type {readonly string[]} */
export const SYMBOL_KINDS = Object.freeze([
  'file',
  'namespace',
  'module',
  'class',
  'struct',
  'interface',
  'function',
  'method',
  'constructor',
  'destructor',
  'lambda',
  'closure',
  'variable',
  'parameter',
  'field',
  'property',
  'enum',
  'enum_member',
  'type_alias',
  'macro',
  'unknown',
]);

/**
 * Stored relationship types. Inverse types (`called_by`, `defined_in`,
 * `referenced_by`) are derived by the query layer and must never be stored:
 * storing both directions invites drift.
 *
 * @type {readonly string[]}
 */
export const RELATIONSHIP_TYPES = Object.freeze([
  'calls',
  'references',
  'defines',
  'declares',
  'imports',
  'exports',
  'includes',
  'inherits',
  'implements',
  'overrides',
  'instantiates',
  'reads',
  'writes',
  'assigns',
  'parameter_of',
  'captures',
]);

/** Relationship types the query layer can synthesise. Never stored. */
export const DERIVED_RELATIONSHIP_TYPES = Object.freeze([
  'called_by',
  'defined_in',
  'referenced_by',
  'declared_by',
  'read_by',
  'written_by',
  'captured_by',
]);

/** Certainty model. `resolved` is the only status that implies certainty. */
export const RESOLUTION_STATUSES = Object.freeze([
  'resolved',
  'inferred',
  'possible',
  'unresolved',
  'stale',
]);

/**
 * Closed reason-code vocabulary. Free-text explanations belong in diagnostics;
 * reason codes are a filterable, groupable enum.
 *
 * @type {readonly string[]}
 */
export const REASON_CODES = Object.freeze([
  'dynamic_dispatch',
  'function_pointer',
  'missing_compile_db',
  'missing_system_headers',
  'toolchain_version_mismatch',
  'template_dependent',
  'unsupported_construct',
  'header_without_tu',
  'macro_expansion',
  'unknown_import_target',
  'external_package',
  'path_alias_unresolved',
  'exports_map_unsupported',
  'reexport_depth_exceeded',
  'overload_ambiguous',
  'out_of_scope',
  'parse_error',
  'unsupported_syntax',
  'unknown_receiver',
  'computed_member',
  'eval_scope',
  'dynamic_scope',
  'prototype_mutation',
  'callback_parameter',
  'deferred_invocation',
  'mixed_module_system',
  'index_stale',
  'too_deep',
  'generated_source',
  'unsupported_language',
  'budget_exceeded',
  'cancelled',
  'adapter_error',
  'internal_error',
  'mock_data',
]);

/** Human descriptions used by diagnostics and the capability UI. */
export const REASON_CODE_DESCRIPTIONS = Object.freeze({
  dynamic_dispatch: 'The target depends on a value that is only known at runtime.',
  function_pointer: 'The call goes through a function pointer, callback, or bound method.',
  missing_compile_db: 'No compile database or include configuration was available.',
  missing_system_headers:
    'System headers were not available, so some declarations could not be resolved.',
  toolchain_version_mismatch: 'The installed toolchain is outside the supported version range.',
  template_dependent: 'The target depends on a template parameter that is not known here.',
  unsupported_construct: 'The construct is outside the supported analysis boundaries.',
  header_without_tu: 'No translation unit includes this header, so it was analyzed syntactically.',
  macro_expansion: 'The fact comes from macro-expanded code, not user-written source.',
  unknown_import_target: 'The imported module could not be resolved inside the scope.',
  external_package: 'The target is in an external package and is not analyzed in this phase.',
  path_alias_unresolved: 'A bundler or tsconfig path alias could not be resolved.',
  exports_map_unsupported: 'The package exports map is unsupported or could not be resolved.',
  reexport_depth_exceeded: 'The re-export chain exceeded the configured depth budget.',
  overload_ambiguous: 'More than one declaration matches and the adapter cannot choose.',
  out_of_scope: 'The target is real but outside the analysed scope.',
  parse_error: 'The source could not be parsed completely.',
  unsupported_syntax: 'The file uses syntax this adapter does not support.',
  unknown_receiver: 'The receiver of the member call has no statically known shape.',
  computed_member: 'The member name is computed and cannot be resolved statically.',
  eval_scope: 'An eval or Function constructor makes the surrounding scope dynamic.',
  dynamic_scope: 'A with statement makes the surrounding scope dynamic.',
  prototype_mutation: 'A prototype was mutated, so the target set is uncertain.',
  callback_parameter: 'The call goes through a callback parameter rather than a direct call.',
  deferred_invocation: 'The call is scheduled for later by a timer or event loop.',
  mixed_module_system: 'The file mixes ESM and CommonJS semantics.',
  index_stale: 'The fact was produced by an older analysis and may no longer hold.',
  too_deep: 'The adapter stopped following references at its depth budget.',
  generated_source: 'The file is generated output and is excluded by policy.',
  unsupported_language: 'No adapter in this build understands the language.',
  budget_exceeded: 'The analysis stopped because a time, memory, or size budget was reached.',
  cancelled: 'The user or host cancelled the analysis.',
  adapter_error: 'The adapter failed while analysing; output may be incomplete.',
  internal_error: 'CodeFlow hit an internal error while building this result.',
  mock_data: 'This fact comes from the demonstration fixture, not real code.',
});

export const COMPLETENESS_LEVELS = Object.freeze(['full', 'partial', 'syntactic_only']);

export const DIAGNOSTIC_SEVERITIES = Object.freeze(['info', 'warning', 'error']);

export const VISIBILITIES = Object.freeze([
  'public',
  'protected',
  'private',
  'internal',
  'package',
  'local',
  'unknown',
]);

/** Language-neutral control structure vocabulary (Phase 4 consumes this). */
export const CONTROL_CONSTRUCT_KINDS = Object.freeze([
  'entry',
  'exit',
  'sequence',
  'block',
  'if',
  'else',
  'switch',
  'case',
  'loop',
  'for',
  'while',
  'do_while',
  'try',
  'catch',
  'finally',
  'return',
  'throw',
  'break',
  'continue',
  'await',
  'yield',
  'jump',
  'unknown',
]);

/** Data-flow fact kinds (Phase 11 consumes these). */
export const DATA_FACT_KINDS = Object.freeze([
  'definition',
  'use',
  'assignment',
  'read',
  'write',
  'parameter',
  'return',
  'capture',
]);

export const EVIDENCE_KINDS = Object.freeze([
  'source_range',
  'symbol',
  'relationship',
  'diagnostic',
  'macro_expansion',
  'import',
  'heuristic',
]);

/** Capabilities an adapter may declare. Values are `true`, `'partial'`, or false. */
export const CAPABILITY_KEYS = Object.freeze([
  'parse',
  'discoverDeclarations',
  'resolveSymbols',
  'resolveTypes',
  'resolveCalls',
  'generateCFG',
  'generateDFG',
  'resolveImports',
  'mapSourceLocations',
  'reportDiagnostics',
]);

/** Prefixes that mark a target as outside the analysed run. */
export const EXTERNAL_TARGET_PREFIX = 'external:';
