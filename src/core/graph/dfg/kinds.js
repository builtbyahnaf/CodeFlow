/**
 * Data-flow graph vocabulary.
 *
 * These constants are frozen by docs/GRAPH_SPECIFICATION.md §14. No new kinds
 * may be added without updating that document and incrementing the DFG schema
 * version. Adapters must map to these; they may not invent their own.
 *
 * Design note: kinds are intentionally narrow. The spec lists exactly what
 * V1 claims. If a construct does not map to a kind here it must surface as
 * `unresolved` with a reason code, never be silently dropped.
 */

/** Roles a flow node may play at a CFG node. */
export const FLOW_NODE_KINDS = Object.freeze([
  'def',     // variable receives a new value here
  'use',     // variable value is consumed here
  'defuse',  // both: e.g. x++ (read then write)
  'param',   // function parameter entry point
  'return',  // return value produce site
  'kill',    // binding is explicitly or conservatively killed here
]);

/** Relationships between two flow nodes. */
export const FLOW_EDGE_KINDS = Object.freeze([
  'reaching',      // def reaches a use along CFG paths
  'assign',        // direct assignment (also a subtype of reaching)
  'param_to_arg',  // actual argument at call site → parameter in callee
  'return_to_use', // return value of callee → use at call site
  'loop_carried',  // def in an earlier loop iteration reaches use in a later one
  'capture',       // closure captures a binding from an outer scope
]);

/** Resolution status shared with CSR edges. */
export const FLOW_STATUSES = Object.freeze([
  'resolved',    // the flow is structurally certain within modeled bounds
  'inferred',    // derived by structural heuristic; likely but not proven
  'possible',    // cannot be ruled out; mutation through reference/closure
  'unresolved',  // analysis declined to claim; a reason code is mandatory
  'partial',     // budget exhaustion; output is incomplete
]);

/**
 * Reason codes that accompany `unresolved`, `possible`, or `partial` status.
 * This list is exhaustive for V1; the UI uses it to surface limitation notices.
 */
export const FLOW_REASON_CODES = Object.freeze([
  'aliasing_unknown',         // C++ pointer/reference; cannot track pointee
  'pointer_aliasing',         // dereference write (*p = ...) without shape info
  'reference_parameter',      // callee may mutate via reference param
  'property_of_unknown_object', // JS property write on unknown receiver
  'deferred_invocation',      // passed to callback; invocation order unknown
  'eval_scope',               // eval() in function; all locals suspect
  'template_dependent',       // C++ template-dependent expression
  'capture_mutation',         // closure may mutate an outer binding
  'unmodeled_region',         // unmodeled CFG node; subsequent flows degrade
  'unresolved_call',          // call target is unresolved/possible; no interprocedural flow
  'flow_budget_exceeded',     // iteration/time budget hit; output is partial
  'too_large',                // function too large for slicing
  'missing_cfg',              // no CFG available for this function
  'loop_carried',             // loop-carried dependency (informational)
]);

/**
 * Schema version for DFG DTOs. Increment when a field is added or removed.
 * Consumers must check this before trusting the shape.
 */
