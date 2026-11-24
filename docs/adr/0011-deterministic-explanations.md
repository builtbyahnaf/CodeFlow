# ADR 0011 — Deterministic explanations with no model in the loop

**Status:** Accepted  
**Date:** 2026-11-24  
**Phase:** 6  
**Author:** Muhammad Tahmid Ahnaf

## Context

Phase 6 adds explanations: statements, conditions, branches, loops, calls,
returns, variables, mutations, function summaries, dependencies, patterns, and
complexity. The user-facing temptation is to generate fluent prose with a
language model. That would violate the product's trust model:
CodeFlow's value is that it does not guess.

A model in the loop would make three properties impossible to guarantee:

- **Evidence completeness:** a sentence could assert a fact that no CSR entity
  or source range supports.
- **Determinism:** the same graph could produce different text across runs.
- **Offline independence:** the extension would acquire a network dependency and
  a runtime failure mode the rest of the architecture forbids.

The Phase 6 specification therefore requires a deterministic engine with a
per-rule proof obligation, evidence on every fragment, and mandated uncertainty
phrasing.

## Decision

Implement explanations as a pure, headless engine in
`src/core/explanation/` with no model, no network, and no randomness.

1. **Facts before templates.** `facts.js` derives language-neutral facts from
   the CFG and the CSR query layer. Rules never read adapter output or raw run
   arrays.
2. **Evidence is structural.** Every sentence fragment is bound to one or more
   `EvidenceRef` values. Fragments without evidence are dropped before an item
   exists.
3. **Status controls phrasing.** `resolved`, `inferred`, `possible`,
   `unresolved`, and `stale` each have a mandated phrase, enforced by a linter
   that rejects violations. Stale qualification is applied centrally so a rule
   cannot silently lose an item.
4. **Patterns need proof.** Naming a pattern requires the corresponding fact
   (a proof flag or a CFG/relationship derivation). Binary search is never
   named because ordering evidence is not statically established.
5. **Complexity needs preconditions.** Literal-bound counts and structural
   nesting are allowed; asymptotic or runtime claims are not.
6. **Depth is a request parameter.** Depth 1–4 selects more rules and detail
   from the same facts. Depth 4 always discloses limitations for partial,
   unresolved, unmodeled, or stale subjects.
7. **The UI is a thin consumer.** `explain.node` and `explain.function` reuse
   the existing protocol, source navigation, and settings push paths. Hover or
   selection never triggers analysis.

## Alternatives rejected

| Alternative                        | Why rejected                                                                                                                     |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| LLM-generated summaries            | Non-deterministic, unsupported claims, network and privacy cost, impossible evidence guarantee                                   |
| Static prose per node kind         | Too generic to be useful; cannot mention operands, targets, or status honestly                                                   |
| Grammar/template engine dependency | The deterministic fragments are small enough that a dependency adds supply-chain and bundle cost without increasing correctness  |
| Naming algorithms from name/shape  | Directly violates the prohibited-behaviour contract; negative fixtures exist for `sort`, `quicksort`, `save`, and `binarySearch` |
| Snapshot-only testing of wording   | Rubber-stamps wording drift; structural assertions plus a banned-language linter catch the failures that matter                  |

## Consequences

- Explanations are testable in plain Node without VS Code, the webview, or a
  network connection.
- Ruleset version `1.0.0` participates in item ids and cache keys. A wording
  change that alters output bumps it.
- Some explanations are shorter than a model would produce. That is the intended
  trade: omitted beats unverifiable.
- Pattern naming on real code is currently conservative because the C++ and
  JavaScript adapters do not set every proof flag. Recursion and bounds
  narrowing fire from CFG evidence; the rest are fixture-verified until the
  adapters grow those facts.
- Any future AI layer may consume `ExplanationItem` as input context but may
  never replace it as the source of facts.
