# CodeFlow Known Limitations (V1.0.0)

> Reference: Phase 12 §11, AC-12.14.
> Principle: **Honest Uncertainty**. CodeFlow never invents facts, guesses unseen flows, or claims certainty when static invariants cannot be proven.

This document describes all known limitations of the CodeFlow V1 static analysis engine, grouped by feature area. Where an operation is bounded or degraded, CodeFlow explicitly marks the affected visual nodes and edges with typed reason badges.

---

## 1. C++ Language Analysis

| Limitation | Technical Detail | Visual & Semantic Presentation |
|---|---|---|
| **Missing Compilation Database** | When `compile_commands.json` is absent, CodeFlow falls back to heuristic compiler arguments (`fallbackIncludePaths`, `fallbackDefines`, `fallbackStandard`). | The status banner explicitly reports **"Partial Analysis (Heuristic Mode)"**. All symbols and edges are flagged partial. |
| **Complex C++ Templates** | Uninstantiated template definitions without concrete types or specialization arguments cannot resolve member method calls statically. | Unresolved call edges rendered with dotted lines and `?` glyphs; explanation engine lists uninstantiated template parameters. |
| **Pointer Aliasing & Pointer Arithmetic** | CodeFlow does not execute whole-program points-to analysis. Raw pointer writes (`*ptr = val`) conservatively kill or degrade aliased local flows. | DFG edges touching aliased pointers carry the reason code `E_POINTER_ALIAS` and degraded line patterns. |
| **Macro Metaprogramming** | Token-pasting (`##`) and stringification (`#`) in preprocessor macros that generate function declarations are parsed via Clang AST output only after expansion. | If preprocessor expansion fails, the translation unit falls back to declaration-only mode. |

---

## 2. JavaScript Language Analysis

| Limitation | Technical Detail | Visual & Semantic Presentation |
|---|---|---|
| **Dynamic `eval()` & `new Function()`** | CodeFlow strictly refuses to execute untrusted user code. Any function calling `eval()` or dynamic code evaluation has its local variable bindings degraded. | All local DFG reaching definitions inside the scope carry the reason badge `eval_scope`. |
| **Computed Property Access (`obj[key]`)** | Dynamic property reads and writes where `key` is a non-literal runtime variable cannot be resolved to a specific property definition. | Rendered as possible candidates (`?` glyph); never falsely resolved. |
| **Whole-Program Cross-Module Taint** | V1 data-flow analysis is strictly intra-procedural (bounded to single functions and direct module imports up to depth 8). | Inter-procedural calls display caller/callee links, but data-flow value tracking stops at procedural boundaries. |
| **TypeScript (.ts / .tsx)** | Full TypeScript semantic checking requires the TypeScript compiler host, which is deferred to V2. `.ts` files are parsed for syntax and declarations only where Babel permits. | Analysis is marked partial with an explicit diagnostic badge. |

---

## 3. Graph Perspectives & Scale

| Limitation | Technical Detail | Visual & Semantic Presentation |
|---|---|---|
| **Extreme File Size (> 20,000 lines)** | Files exceeding the 20,000-line budget are analyzed for syntax and declarations only to prevent editor freezing. | Marked `completeness: 'partial'` with diagnostic code `E_LIMIT`. |
| **Dense Call Clusters (> 400 targets)** | In semantic zoom (L0–L5) and call graph views, call clusters containing > 20 candidates are paginated. | Paged with "Show more candidates" controls; cluster edges summarize candidate counts. |
| **Viewport Virtualization Boundary** | While graphs support 2,000+ nodes smoothly, offscreen nodes are culled from DOM rendering. | Minimap reflects the full density heat grid; viewport recenters on minimap click. |

---

## 4. Environment & Platform

| Limitation | Technical Detail | Recommendation |
|---|---|---|
| **Restricted Mode / Untrusted Workspaces** | In VS Code Restricted Mode, CodeFlow activates in inert demonstration mode. It does not read workspace files or execute Clang. | Trust the workspace to enable full local analysis. |
| **Remote Development (SSH / WSL / Dev Containers)** | Analysis runs on the remote host where the extension host is located. Toolchains (`clang`) must exist on the remote environment. | Configure `codeflow.cpp.clangPath` in remote settings if Clang is not on system `PATH`. |
