/**
 * ADR 0011 — Data-Flow Analysis Model and Conservative Kill Rules
 *
 * Status: Accepted  
 * Date: 2026-11-24  
 * Phase: 11  
 */

# ADR 0011 — Data-Flow Analysis: Conservative Kill Rules and Scope Boundary

## Status

Accepted

## Context

Phase 11 delivers foundational intraprocedural data-flow analysis. The core
tension: "data flow" sounds total; static analysis of real C++ and JavaScript is
not. Every design decision must choose between precision (claiming fewer flows)
and recall (claiming more). For a developer tool that surfaces uncertainty, false
positives (claiming a resolved flow that is actually aliased or mutated) are
worse than false negatives.

Three questions required explicit decisions:

1. **Which flows to claim as `resolved`?**
2. **When must status degrade to `possible` or `unresolved`?**
3. **What is the budget and what happens when it is exceeded?**

## Decision

### 1. Reaching-definition algorithm

Classic forward monotone dataflow (GEN/KILL worklist to fixpoint) over the
per-function CFG produced by Phase 4. This is sound for straight-line and
branching code; loop-carried flows are detected via DFS back-edge discovery and
tagged `loop_carried` on the edge, which the UI renders with a distinct glyph
(↻) so colour is never the only encoding.

### 2. Conservative kill rules

| Trigger | Status degradation | Reason code |
|---|---|---|
| Mutable reference/pointer binding passed to `unresolved` or `possible` call | `possible` / `unresolved` | `unresolved_call` |
| Binding passed through an `unmodeled` CFG node | `possible` | `unmodeled_region` |
| Closure captures a binding | `inferred` kill site | `capture_mutation` |
| `eval()` detected anywhere in function | Degrade ALL resolved edges in function | `eval_scope` |
| C++ reference or pointer parameter at function entry | `possible` | `reference_parameter` |
| Template-dependent expression | Fact carries `unresolved` from adapter | `template_dependent` |

The rule is: **when mutation cannot be ruled out, edge status degrades. It is
never left `resolved`.**

### 3. Budget

| Limit | Value | Action when exceeded |
|---|---|---|
| Reaching-def iterations | 20 000 | Return `partial` DFG with `flow_budget_exceeded` reason |
| Reaching-def wall time | 250 ms | Same |
| Backward slice wall time | 150 ms | Return partial slice with `too_large` |

A partial DFG is always labeled. Silent truncation is a defect.

### 4. Interprocedural scope

Param→arg and return→use edges are emitted **only** for `resolved` call targets
supplied by the host (which already filtered the call graph). No edges are ever
synthesised for `possible`, `unresolved`, or virtual/function-pointer calls.

### 5. Limitations surface

The UI shows a banner whenever:
- Any reference/pointer binding is in scope (C++)
- `eval()` is in scope (JS)
- The DFG is partial

These are product commitments, not optional. The spec names the product promise
"variable trace", not "data flow everywhere", to manage expectations.

## Alternatives considered

**Path-sensitive analysis (SSA + constraint solving):** Would improve precision
but requires a constraint solver and dramatically increases per-function cost.
Deferred to a future "deep tier" behind explicit user initiation.

**Whole-program reaching definitions:** Unsound across separate compilation
units; cost untenable for a background language server. V1 scope is
intraprocedural.

**Always-conservative (mark everything `possible`):** Would pass all negative
tests trivially but provide no value. Rejected.

## Consequences

- The negative-test quota (≥ 15 tests proving the analysis declines to claim
  a flow) is the phase's integrity mechanism. These tests are not to be deleted
  or weakened.
- Phase 12 audits DFG labeling as part of the "no fabricated certainty" release
  gate. Any surface that presents a `possible` flow as `resolved` blocks release.
- Post-V1 taint, points-to, and whole-program analyses are separate projects
  with their own specs. The `FLOW_EDGE_KINDS` and `FLOW_REASON_CODES` frozen
  lists may not be extended to absorb them without a new ADR.
