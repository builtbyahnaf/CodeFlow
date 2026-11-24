# CodeFlow Product Requirements Document (PRD) — V1.0.0

> Version: 1.0.0 (Release Target) · Date: 2026-11-24 · License: GPL-3.0-only
> Author: Muhammad Tahmid Ahnaf

---

## 1. Executive Summary

Modern software engineering frequently requires developers to understand, audit, and refactor large, unfamiliar codebases. Existing tools force engineers to mentally reconstruct execution paths from linear text or rely on lossy, speculative cloud AI summaries.

**CodeFlow** is an offline, privacy-first VS Code extension that renders exact, multi-level structural graphs of codebases. It is built on the core principle of **Honest Uncertainty**: CodeFlow never guesses unseen flows, invents facts, or fabricates certainty. If a dynamic edge or pointer alias cannot be mathematically proven from static analysis, CodeFlow surfaces candidate sets and conservative degradation codes directly in the UI.

---

## 2. Target Users

1. **Systems & Embedded Engineers (C++):** Navigating complex control flow, multi-file translation units, and hardware register manipulations without executing build scripts.
2. **Full-Stack & Library Developers (JavaScript):** Comprehending intricate call hierarchies, module dependency graphs, and variable reaching definitions across asynchronous routines.
3. **Security Auditors & Code Reviewers:** Verifying control constructs, identifying abnormal exits, and checking data flow boundaries completely offline with zero data leakage.

---

## 3. Non-Goals (Out of Scope for V1)

- **Not a Build System or Compiler:** CodeFlow does not compile binaries or run tests. It performs passive, read-only AST parsing.
- **Not an AI Code Generator:** No LLMs, no remote inference, and no generative text. All explanations are generated deterministically from syntactic facts.
- **No Cloud Telemetry or Tracking:** Zero analytics, zero crash uploads, and zero remote network requests.
- **No Code Execution:** Analyzed code is never loaded into `eval()` or executed in the host environment.

---

## 4. Delivered V1 Features & Capabilities

```
+---------------------------------------------------------------------------------+
|                                 CodeFlow V1                                      |
+---------------------------------------------------------------------------------+
|  [L0 Workspace] -> [L1 Module] -> [L2 File] -> [L3 Symbol] -> [L4 CFG] -> [L5]  |
|                                                                                 |
|  * Semantic Zoom: 6-level hierarchical overview with spatial minimap.           |
|  * Control-Flow Graph (CFG): Full construct blocks, abnormal exits, loop edges. |
|  * Data-Flow Graph (DFG): Conservative reaching definitions & loop-carried data.|
|  * Call Graph: Tri-state resolution (Resolved / Possible Candidates / Unmapped).|
|  * Explanation Engine: Deterministic natural-language breakdown with limits.    |
|  * Theme System: Light, Dark, High-Contrast with WCAG AA (>= 4.5:1) contrast.   |
|  * Accessibility: Full keyboard model, Accessible Outline mode, ARIA live.      |
|  * Security Guard: Zero network calls, path containment, strict CSP sandbox.     |
+---------------------------------------------------------------------------------+
```

---

## 5. Verification & Acceptance Criteria Traceability

| ID | Capability | Normative Requirement |
|---|---|---|
| **AC-12.1** | Offline Operation | 100% of workflows operate without internet access. |
| **AC-12.2** | Theme Accessibility | Dark, Light, High-Contrast contrast >= 4.5:1 (WCAG AA). |
| **AC-12.3** | Graceful Degradation | Large files (> 20k lines) capped with explicit diagnostics, no hangs. |
| **AC-12.4** | Extension Host Health | Activation < 500ms; sub-50ms query latency; zero event-loop locks. |
| **AC-12.5** | Data Integrity | Immutable CSR model with relational query layer and validated invariants. |
| **AC-12.8** | Keyboard Navigation | Complete graph navigation reachable via directional keys and Tab. |
| **AC-12.9** | Screen-Reader Support | Accessible Outline mode with `aria-live` navigation announcements. |
| **AC-12.11** | Zero Network Calls | Verified by instrumented network guard test harness. |
| **AC-12.12** | Read-Only Invariance | Workspace file contents are never modified by CodeFlow. |
