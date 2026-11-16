/**
 * CodeFlow Semantic Representation (CSR) — draft vocabulary.
 *
 * STATUS: DRAFT. Phase 0 needs just enough structure to prove that the graph
 * layer is language-independent. Phase 1 replaces this with the normative
 * model, validators, identity strategy, and migration mechanism.
 *
 * Consumers must treat these enums as closed. Adding a value is a schema change,
 * not a local decision.
 */

export const CSR_VERSION = '0.1.0-draft';

/** @type {readonly string[]} */
export const SYMBOL_KINDS = Object.freeze([
  'file',
  'namespace',
  'module',
  'class',
  'struct',
  'function',
  'method',
  'constructor',
  'destructor',
  'closure',
  'variable',
  'parameter',
  'field',
  'property',
  'enum',
  'enum_member',
  'type_alias',
  'unknown',
]);

/** Store one direction only; inverse relationships are derived. */
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

/** Certainty model from Roadmap section 20. */
export const RESOLUTION_STATUSES = Object.freeze([
  'resolved',
  'inferred',
  'possible',
  'unresolved',
  'stale',
]);

/**
 * Closed reason-code vocabulary. Free text belongs in diagnostics, not here.
 * Phase 1 owns the full list; these are the codes the mock adapter uses.
 */
export const REASON_CODES = Object.freeze([
  'dynamic_dispatch',
  'function_pointer',
  'missing_compile_db',
  'macro_expansion',
  'unknown_import_target',
  'overload_ambiguous',
  'out_of_scope',
  'parse_error',
  'index_stale',
  'too_deep',
  'mock_data',
]);

export const COMPLETENESS_LEVELS = Object.freeze(['full', 'partial', 'syntactic_only']);

export const DIAGNOSTIC_SEVERITIES = Object.freeze(['info', 'warning', 'error']);
