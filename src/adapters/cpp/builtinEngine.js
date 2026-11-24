/**
 * Built-in pure JavaScript C/C++ syntactic analyzer.
 *
 * Provides a self-contained, frictionless fallback engine when Clang is absent.
 * It extracts functions, control-flow constructs (if/for/while/switch/return),
 * and call relationships with exact source-range fidelity directly from source text.
 *
 * No external dependencies, no compilers, no process spawning.
 */

export const BUILTIN_ENGINE_VERSION = '1.2.0';
