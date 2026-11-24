# CodeFlow Settings Reference

All configuration options contributed by CodeFlow to VS Code settings (`settings.json`).

Settings can be configured interactively using the command `CodeFlow: Configure` or through the standard VS Code Settings editor (`Ctrl+,` / `Cmd+,`).

---

## 1. Analysis & Toolchain

### `codeflow.logLevel`
- **Type:** `string`
- **Default:** `"warn"`
- **Options:** `"off"`, `"error"`, `"warn"`, `"info"`, `"debug"`
- **Description:** Verbosity of the CodeFlow output channel. Debug adds execution timings and protocol traces but never source text or user code.

### `codeflow.protocol.traceMessages`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Log webview protocol message kinds and payload byte sizes at debug level. Message contents are never logged.

### `codeflow.cpp.clangPath`
- **Type:** `string`
- **Default:** `""`
- **Description:** Absolute path to `clang` or `clang++` executable. When empty, CodeFlow probes `PATH` and common system toolchain locations. CodeFlow never executes workspace build scripts.

### `codeflow.cpp.compileCommandsPath`
- **Type:** `string`
- **Default:** `""`
- **Description:** Path to `compile_commands.json` compilation database. When empty, CodeFlow searches the workspace root, `build/`, `cmake-build-*/`, and `out/`.

### `codeflow.cpp.fallbackIncludePaths`
- **Type:** `array` (strings)
- **Default:** `[]`
- **Description:** Additional include directory paths used when no compilation database entry covers a C++ file. Results in heuristic fallback mode are explicitly labeled partial.

### `codeflow.cpp.fallbackDefines`
- **Type:** `array` (strings)
- **Default:** `[]`
- **Description:** Preprocessor defines used in heuristic mode (e.g. `DEBUG`, `VERSION=1`).

### `codeflow.cpp.fallbackStandard`
- **Type:** `string`
- **Default:** `""`
- **Description:** C++ language standard used in heuristic mode (e.g. `c++17`, `c++20`). When empty, CodeFlow chooses from the file extension.

### `codeflow.cpp.timeoutMs`
- **Type:** `number`
- **Default:** `60000` (min: `1000`, max: `600000`)
- **Description:** Time budget for one Clang invocation in milliseconds. Exceeding it produces a partial run, never a frozen window.

### `codeflow.cpp.maxOutputBytes`
- **Type:** `number`
- **Default:** `67108864` (min: `1048576`)
- **Description:** Maximum Clang stdout/stderr size in bytes. A larger AST produces a partial run with an explicit diagnostic.

### `codeflow.cpp.maxFileBytes`
- **Type:** `number`
- **Default:** `4194304` (min: `65536`)
- **Description:** Maximum source file size in bytes that CodeFlow will read for one C++ translation unit.

### `codeflow.javascript.resolveNodeModules`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Resolve package imports through the workspace `node_modules` directory. Disabled by default so analysis stays inside workspace source.

### `codeflow.javascript.maxFileBytes`
- **Type:** `number`
- **Default:** `2097152` (min: `65536`)
- **Description:** Maximum JavaScript file size in bytes CodeFlow will read, including imported modules.

### `codeflow.javascript.maxLines`
- **Type:** `number`
- **Default:** `20000` (min: `100`)
- **Description:** Files with more lines are analysed for syntax and declarations only and marked partial.

### `codeflow.javascript.maxModules`
- **Type:** `number`
- **Default:** `64` (min: `1`, max: `512`)
- **Description:** Maximum number of modules read while following imports. Further imports become unresolved with a budget diagnostic.

### `codeflow.javascript.maxDepth`
- **Type:** `number`
- **Default:** `8` (min: `1`, max: `64`)
- **Description:** Maximum import depth followed from the analysed JavaScript file.

---

## 2. Project Indexing

### `codeflow.index.debounceMs`
- **Type:** `number`
- **Default:** `350` (min: `100`, max: `2000`)
- **Description:** Per-document debounce delay in milliseconds before incremental index analysis runs after an edit.

---

## 3. Source Preview & Navigation

### `codeflow.preview.enabled`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Show a source preview card when hovering a graph node. The preview is always a slice of the real document, never a reconstruction.

### `codeflow.preview.delayMs`
- **Type:** `number`
- **Default:** `300` (min: `0`, max: `2000`)
- **Description:** Hover dwell delay in milliseconds before opening the source preview card. Lower values feel faster; higher values flicker less while scanning.

### `codeflow.preview.maxLines`
- **Type:** `number`
- **Default:** `12` (min: `4`, max: `40`)
- **Description:** Maximum number of source lines shown in a preview card. Longer ranges are truncated with a visible note.

### `codeflow.preview.syntaxHighlighting`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Highlight preview source in the webview. Disabling it keeps previews readable when a language is unrecognized or performance is a concern.

### `codeflow.preview.clickToNavigate`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Open the source range in the editor when a graph node is double-clicked or activated with Enter.

### `codeflow.preview.pinByDefault`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Keep a hover preview open until it is dismissed instead of hiding when the pointer leaves.

### `codeflow.navigation.openInPreviewTab`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Open source navigation targets in a preview tab. Disabled by default so trust-building navigation does not replace the current editor.

---

## 4. Explanation Engine

### `codeflow.explanation.defaultDepth`
- **Type:** `number`
- **Default:** `2` (min: `1`, max: `4`)
- **Description:** Default explanation detail depth (`1` Basic, `2` Intermediate, `3` Advanced, `4` Deep).

### `codeflow.explanation.showEvidence`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Show source and semantic evidence links under explanations.

### `codeflow.explanation.includeLimitations`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Expand analysis limitation disclosures by default. Limitations remain accessible for honesty even when collapsed.

---

## 5. Appearance & Context

### `codeflow.explorer.retainContext`
- **Type:** `boolean`
- **Default:** `false`
- **Description:** Keep the CodeFlow webview alive when hidden. Disabled by default to reduce memory use; re-rendering is cheap.
