# Integration fixture workspace

VS Code is launched against this folder so the extension runs in a real
workspace instead of the repository root.

There is intentionally nothing here to analyze: Phase 0 never reads workspace
files. The `demo.mock` file exists only so the folder is not empty.

Nothing in this directory is parsed, executed, or imported by the tests.
