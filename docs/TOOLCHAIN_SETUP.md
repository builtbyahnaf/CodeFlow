# CodeFlow Toolchain Setup Guide

CodeFlow is designed to be **frictionless**: it comes with a built-in pure JavaScript syntactic analyzer that extracts functions, control flow graphs, call hierarchies, and basic data flow directly from your source files without requiring any compilers or external tools.

However, for compiler-grade AST semantics, template instantiations, macro expansions, and precise type deduction in C and C++, CodeFlow can leverage an installed **Clang / LLVM** toolchain.

---
