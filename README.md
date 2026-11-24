<div align="center">

# CodeFlow

### See how your code works.

**Understand code through interactive, progressively detailed visualizations.**

CodeFlow is a developer-focused code understanding tool designed to make complex programs easier to explore, built by Muhammad Tahmid Ahnaf (@builtbyahnaf). It turns the relationships inside a codebase like functions, calls, control flow, and data movement into a visual model you can navigate from the project level down to individual statements.

<br/>

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Version](https://img.shields.io/badge/version-pre--alpha-lightgrey)
![V1 Languages](https://img.shields.io/badge/V1-C%2B%2B%20%7C%20JavaScript-blue)
![Implementation](https://img.shields.io/badge/implementation-JavaScript-yellow)

**Explore. Understand. Navigate.**

</div>

---

## The idea

Understanding an unfamiliar codebase can be harder than writing new code.

A project may contain hundreds of files, deeply nested function calls, indirect dependencies, and data flowing across multiple layers. Reading files one by one often leaves you with fragments rather than a coherent picture of how the system behaves.

CodeFlow aims to close that gap.

Instead of treating source code as a collection of isolated text files, CodeFlow builds a navigable representation of its structure and relationships. You can start with the overall project, move into a module or file, inspect a function's execution path, and eventually examine the statements that make up its logic.

The goal is not to replace the source code. It is to make the source code easier to understand.

## What CodeFlow is and isn't

| CodeFlow is                                                | CodeFlow is not                                         |
| ---------------------------------------------------------- | ------------------------------------------------------- |
| A code understanding and exploration tool                  | A debugging environment                                 |
| A visual way to explore program structure                  | A replacement for your editor                           |
| A way to follow calls and data relationships               | An automatic bug-fixing system                          |
| A source-connected visualization layer                     | An AI chatbot wrapped around code                       |
| A tool for both learning and professional code exploration | A promise that every program can be explained perfectly |

CodeFlow may help developers notice suspicious paths, unexpected dependencies, or opportunities for improvement while exploring a program. Those observations are incidental benefits of understanding the code—not a promise of automated debugging or optimization.

---

## Core product direction

> The following describes the intended product direction. CodeFlow is still in development; these capabilities should not be interpreted as features already available in a released build.

### 1. Progressive visual exploration

CodeFlow is designed around progressive, map-like navigation. Rather than overwhelming users with every detail at once, it reveals more information as they zoom into a particular area.

```text
Project
  └── Modules
       └── Files
            └── Functions and symbols
                 └── Control flow and data flow
                      └── Statements and details
```

At a high level, you see how the project is organized. As you move deeper, you can inspect individual functions, their execution paths, and their relationships with other parts of the codebase.

### 2. Understand execution flow

A function is more than its declaration and body. Its conditions, branches, loops, returns, and calls determine how it behaves.

CodeFlow's planned visual analysis includes:

- **Control-flow graphs (CFG):** Understand branches, loops, and execution paths.
- **Call relationships:** See which functions call one another.
- **Data-flow relationships:** Follow where values originate and where they are used.
- **Cross-file connections:** Explore relationships that extend beyond a single source file.

These views are intended to work together, providing different perspectives on the same underlying program.

### 3. Stay connected to the real source

Visualizations should never become detached representations that are difficult to verify.

The intended source-navigation experience includes:

- Hovering over a visualization element to preview its corresponding source code.
- Keeping source previews enabled by default, with an option to disable them.
- Clicking an element to open the actual source file at the relevant location.
- Highlighting the corresponding source range.
- Allowing normal editing in the editor.

The visualization helps you navigate and understand. The source remains authoritative.

### 4. Project indexing is optional by design

CodeFlow is planned to support optional project indexing.

When enabled, it can build a local representation of functions, variables, and their relationships. This makes it possible to explore connections across files, for example, where a function is called, what it calls, and how a value moves through the project.

The intended indexing design includes:

- Local project metadata stored in `.codeflow/`.
- Incremental updates when source files change.
- Rebuild and recovery mechanisms.
- User control over enabling or disabling indexing.

Indexing should be a deliberate choice, not a requirement for opening a project.

### 5. Explanations without mandatory AI

CodeFlow's foundation is intended to be based on deterministic program analysis, not on an AI model guessing what the code does.

The long-term direction is to provide explanations at different levels of depth, from concise overviews to detailed walkthroughs. Optional local AI assistance and bring-your-own-key integrations may be considered in later stages, but AI is not a prerequisite for the core product.

---

## Language support

CodeFlow is being developed as a multi-language tool, but language support will be introduced deliberately.

| Release target | Languages                                                        |
| -------------- | ---------------------------------------------------------------- |
| **V1**         | C++, JavaScript                                                  |
| **V2**         | C, Java                                                          |
| **V3**         | Python, Rust                                                     |
| **Future**     | Additional languages based on demand and engineering feasibility |

The extension itself is being implemented in **JavaScript**.

Language support depends on reliable parsing and semantic analysis. The priority is to make the initial languages useful and trustworthy before expanding the list.

### Nirqoba

Nirqoba support is intentionally excluded from V1. Nirqoba is still under active development, and integration should only be considered once the language has a stable build and a suitable integration boundary.

CodeFlow should not depend on an unstable language toolchain.

---

## Design principles

CodeFlow is being shaped around a few non-negotiable principles.

**Understand before explaining.** Build a reliable structural representation of the program before presenting conclusions about it.

**Source is the authority.** Every meaningful visualization should be traceable to real source locations.

**Progressive disclosure.** Show the right level of detail at the right time. Do not turn every project into an unreadable wall of nodes.

**Useful without AI.** Core understanding must not depend on a remote model, API key, or network connection.

**Local-first indexing.** Project metadata should remain local and under the user's control.

**Honest analysis.** Distinguish facts established by static analysis from approximations, incomplete information, and unsupported conclusions.

**Focused scope.** Build a genuinely useful C++ and JavaScript experience before chasing a long list of language integrations.

---

## Current status

<div align="center">

### In development

</div>

CodeFlow is currently a project under development. The product direction and intended V1 scope are defined, but the capabilities described in this README are planned design goals unless explicitly documented as implemented in the repository.

At this stage:

- **Phases 0–6 are implemented in source** (extension foundation, CSR 1.1
  model, C++ Clang-AST adapter, JavaScript acorn/eslint-scope adapter, CFG
  generation and custom SVG visualization, live source synchronization with
  hover previews, click-to-navigate, bidirectional highlighting, and
  stale-source detection, plus a deterministic explanation engine with
  evidence-linked statements, conditions, loops, calls, variables, summaries,
  and proof-gated pattern/complexity claims).
- **Explanation settings** (`codeflow.explanation.*`) select depth, evidence
  visibility, and limitation disclosure. Explanations run with no model, no
  network call, and no randomness.
- **Preview and navigation settings** (`codeflow.preview.*` and
  `codeflow.navigation.openInPreviewTab`) and the `CodeFlow: Back to Graph`
  command are wired end to end without triggering re-analysis on hover.
- **V1 scope** is focused on C++ and JavaScript, implemented in pure JavaScript.
- **Unverified in this environment:** no local Clang/clangd compiler or
  packaged VS Code integration run has executed here; C++ tests run against
  committed AST fixtures and no stable public release is claimed yet.

Installation instructions, screenshots, release downloads, and usage examples
will be added when they reflect a working, reproducible build. Development setup
is documented in [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md).

---

## Technology direction

The implementation is being designed around a language-independent internal representation, with language-specific analysis adapters feeding a shared model.

This separation is intended to keep the visualization and navigation layers independent from the details of any single programming language.

The architecture will need to account for:

- Parsing and semantic information from supported languages.
- A shared representation of symbols, source locations, and relationships.
- Control-flow and data-flow analysis.
- Source mapping and editor navigation.
- Optional local project indexing.
- Incremental analysis and background processing.
- Clear confidence and provenance for analysis results.

Specific libraries and implementation choices should be evaluated against correctness, maintainability, extension compatibility, and performance, not selected merely because they are fashionable.

---

## Privacy and project data

CodeFlow's intended direction is local-first.

Project indexing is optional, and its metadata is planned to be stored in the project's `.codeflow/` directory. Any future AI-assisted capabilities should remain optional and clearly distinguish local processing from external services.

The project will document its actual data handling, permissions, and network behavior as implementation progresses. No claim of complete offline operation or zero data transmission should be inferred before those behaviors are verified in a release.

---

## Contributing

CodeFlow is still establishing its technical foundations. Contribution guidelines, development setup, and issue templates will be added when the repository is ready to support external contributions reliably.

If you are interested in the project, useful early feedback includes:

- Which parts of understanding a codebase are most difficult for you?
- Which visualizations would genuinely help you understand unfamiliar code?
- What should a useful C++ or JavaScript control-flow view show?
- Where do existing code exploration tools fall short?

Please keep feedback focused on the project's central goal: **making code easier to understand.**

---

## Project philosophy

CodeFlow is built around a simple belief:

> Code should not have to be read line by line before its structure becomes understandable.

A good visualization should reveal relationships that are difficult to hold in your head. A good explanation should be grounded in what the program actually does. And a good exploration tool should help you move naturally between the big picture and the smallest meaningful detail.

**Less guessing. More understanding.**

---

<div align="center">

### CodeFlow

**Understand the flow. Understand the code.**

<sub>Built with a focus on clarity, correctness, and thoughtful engineering.</sub>

</div>
