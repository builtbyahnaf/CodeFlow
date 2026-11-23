/**
 * Shared, language-neutral CFG fixtures.
 *
 * Each fixture is a control-construct tree. The same 30+ shapes are used by the
 * builder tests and by the C++/JavaScript parity test, so the vocabulary is
 * exercised once and both languages are measured against it.
 *
 * `expect` is a semantic assertion set, not a snapshot: it names the node and
 * edge kinds that must be present, the degradations that must be reported, and
 * (optionally) the exact entry-to-exit path count.
 */

import { range } from './harness.js';

const comparison = { type: 'leaf', label: 'comparison' };

/** @param {Array<Record<string, any>>} children */
const entry = (children) => ({ kind: 'entry', children });
/** @param {Array<Record<string, any>>} children */
const block = (children) => ({ kind: 'block', children });
/** @param {Array<Record<string, any>>} children */
const elseBlock = (children) => ({ kind: 'else', children });
const stmt = () => ({ kind: 'statement', line: 4 });
const ret = () => ({ kind: 'return', line: 3 });
const retValue = () => ({
  kind: 'return',
  line: 3,
  extensions: { valueRange: range(3) },
});

/**
 * @param {Array<Record<string, any>>} children
 * @param {Record<string, any>} [expression]
 */
const ifStmt = (children, expression = comparison) => ({
  kind: 'if',
  condition: expression,
  children,
});

/**
 * @param {Array<Record<string, any>>} children
 * @param {Record<string, any>} [expression]
 */
const whileStmt = (children, expression = comparison) => ({
  kind: 'while',
  condition: expression,
  children,
});

/** @type {Array<Record<string, any>>} */
export const SHARED_PROGRAMS = [
  {
    id: 'sequence',
    shape: 'sequence',
    root: entry([stmt(), stmt()]),
    expect: {
      nodeKinds: ['entry', 'statement', 'exit'],
      edgeKinds: ['seq'],
      paths: 1,
    },
  },
  {
    id: 'if',
    shape: 'branch',
    root: entry([ifStmt([block([ret()])])]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'merge', 'exit'],
      edgeKinds: ['true', 'false', 'return'],
      paths: 2,
    },
  },
  {
    id: 'if-else',
    shape: 'branch',
    root: entry([
      ifStmt([block([ret()]), elseBlock([block([ret()])])]),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false', 'return'],
      paths: 2,
    },
  },
  {
    id: 'else-if-chain',
    shape: 'branch',
    root: entry([
      ifStmt([
        block([ret()]),
        elseBlock([
          block([
            ifStmt([
              block([ret()]),
              elseBlock([block([ret()])]),
            ]),
          ]),
        ]),
      ]),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false', 'return'],
      paths: 3,
    },
  },
  {
    id: 'ternary',
    shape: 'expression-branch',
    root: entry([
      {
        kind: 'ternary',
        condition: comparison,
        children: [
          { kind: 'call', line: 3, extensions: { calleeName: 'a', callSite: range(3) } },
          { kind: 'call', line: 3, extensions: { calleeName: 'b', callSite: range(3) } },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'call', 'merge', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
      paths: 2,
    },
  },
  {
    id: 'short-circuit-and',
    shape: 'expression-branch',
    root: entry([
      {
        kind: 'short_circuit',
        condition: {
          type: 'and',
          left: { type: 'leaf', label: 'comparison' },
          right: { type: 'leaf', label: 'comparison' },
        },
        extensions: { operator: '&&' },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
      paths: 3,
    },
  },
  {
    id: 'short-circuit-or',
    shape: 'expression-branch',
    root: entry([
      {
        kind: 'short_circuit',
        condition: {
          type: 'or',
          left: { type: 'leaf', label: 'comparison' },
          right: { type: 'leaf', label: 'comparison' },
        },
        extensions: { operator: '||' },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
      paths: 3,
    },
  },
  {
    id: 'short-circuit-nullish',
    shape: 'expression-branch',
    root: entry([
      {
        kind: 'short_circuit',
        condition: {
          type: 'nullish',
          left: { type: 'leaf', label: 'comparison' },
          right: { type: 'leaf', label: 'comparison' },
        },
        extensions: { operator: '??' },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
    },
  },
  {
    id: 'negated-condition',
    shape: 'branch',
    root: entry([
      ifStmt([
        block([ret()]),
        elseBlock([block([ret()])]),
      ], { type: 'not', operand: { type: 'leaf', label: 'comparison' } }),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
      paths: 2,
    },
  },
  {
    id: 'while',
    shape: 'loop',
    root: entry([whileStmt([block([stmt()])]), ret()]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'loop_latch', 'merge', 'return', 'exit'],
      edgeKinds: ['true', 'false', 'loop_back'],
      paths: 1,
    },
  },
  {
    id: 'while-break',
    shape: 'loop',
    root: entry([
      whileStmt([block([ifStmt([block([{ kind: 'break', line: 5 }])]), stmt()])]),
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'break', 'merge', 'return', 'exit'],
      edgeKinds: ['break', 'loop_back'],
      paths: 2,
    },
  },
  {
    id: 'while-continue',
    shape: 'loop',
    root: entry([
      whileStmt([block([ifStmt([block([{ kind: 'continue', line: 5 }])]), stmt()])]),
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'continue', 'loop_latch', 'exit'],
      edgeKinds: ['continue', 'loop_back'],
    },
  },
  {
    id: 'do-while',
    shape: 'loop',
    root: entry([
      {
        kind: 'do_while',
        condition: comparison,
        children: [block([stmt()])],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_body_entry', 'loop_latch', 'merge', 'return', 'exit'],
      edgeKinds: ['loop_back', 'false'],
    },
  },
  {
    id: 'for',
    shape: 'loop',
    root: entry([
      {
        kind: 'for',
        condition: comparison,
        children: [block([stmt()])],
        extensions: { hasInit: true, hasCondition: true, hasUpdate: true },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'statement', 'loop_header', 'loop_latch', 'merge', 'return', 'exit'],
      edgeKinds: ['loop_back', 'true', 'false'],
      paths: 1,
    },
  },
  {
    id: 'for-of',
    shape: 'iteration',
    root: entry([
      {
        kind: 'for',
        condition: { type: 'leaf', label: 'iteration' },
        children: [block([stmt()])],
        extensions: { iteration: 'of', hasCondition: true },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'loop_latch', 'exit'],
      edgeKinds: ['loop_back'],
      degradationCodes: ['iteration_source_opaque'],
    },
  },
  {
    id: 'for-in',
    shape: 'iteration',
    root: entry([
      {
        kind: 'for',
        condition: { type: 'leaf', label: 'iteration' },
        children: [block([stmt()])],
        extensions: { iteration: 'in', hasCondition: true },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'loop_latch'],
      edgeKinds: ['loop_back'],
      degradationCodes: ['iteration_source_opaque'],
    },
  },
  {
    id: 'nested-loops',
    shape: 'loop',
    root: entry([
      whileStmt([block([whileStmt([block([stmt()])])])]),
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'loop_latch', 'merge', 'return', 'exit'],
      edgeKinds: ['true', 'false', 'loop_back'],
    },
  },
  {
    id: 'nested-break-inner',
    shape: 'loop',
    root: entry([
      whileStmt([
        block([
          whileStmt([block([ifStmt([block([{ kind: 'break', line: 6 }])])])]),
          stmt(),
        ]),
      ]),
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'break', 'merge', 'exit'],
      edgeKinds: ['break', 'loop_back'],
    },
  },
  {
    id: 'labeled-continue',
    shape: 'loop',
    root: entry([
      {
        kind: 'while',
        condition: comparison,
        extensions: { label: 'outer' },
        children: [
          block([
            {
              kind: 'continue',
              line: 5,
              extensions: { label: 'outer' },
            },
          ]),
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'loop_header', 'continue', 'exit'],
      edgeKinds: ['continue', 'loop_back'],
    },
  },
  {
    id: 'switch-cases',
    shape: 'switch',
    root: entry([
      {
        kind: 'switch',
        condition: comparison,
        children: [
          { kind: 'case', extensions: { test: '1' }, children: [block([ret()])] },
          { kind: 'case', extensions: { test: '2' }, children: [block([stmt()])] },
          { kind: 'case', extensions: { test: 'default' }, children: [block([ret()])] },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'multiway', 'return', 'merge', 'exit'],
      edgeKinds: ['case', 'default', 'return'],
    },
  },
  {
    id: 'switch-fallthrough',
    shape: 'switch',
    root: entry([
      {
        kind: 'switch',
        condition: comparison,
        children: [
          { kind: 'case', extensions: { test: '1' }, children: [stmt()] },
          { kind: 'case', extensions: { test: '2' }, children: [ret()] },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'multiway', 'statement', 'return', 'merge', 'exit'],
      edgeKinds: ['case', 'return'],
    },
  },
  {
    id: 'switch-no-default',
    shape: 'switch',
    root: entry([
      {
        kind: 'switch',
        condition: comparison,
        children: [
          { kind: 'case', extensions: { test: '1' }, children: [block([stmt()])] },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'multiway', 'merge', 'return', 'exit'],
      edgeKinds: ['case', 'default'],
      // The mandatory `no match` default edge plus the case path.
      paths: 2,
    },
  },
  {
    id: 'return-value',
    shape: 'early-return',
    root: entry([retValue()]),
    expect: {
      nodeKinds: ['entry', 'return', 'exit'],
      edgeKinds: ['return'],
      paths: 1,
    },
  },
  {
    id: 'multiple-returns',
    shape: 'early-return',
    root: entry([
      ifStmt([block([retValue()])]),
      retValue(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['return', 'false'],
      paths: 2,
    },
  },
  {
    id: 'throw',
    shape: 'exception',
    root: entry([{ kind: 'throw', line: 4 }]),
    expect: {
      nodeKinds: ['entry', 'throw', 'exit'],
      edgeKinds: ['throw'],
      paths: 1,
    },
  },
  {
    id: 'try-catch',
    shape: 'exception',
    root: entry([
      {
        kind: 'try',
        children: [
          block([stmt()]),
          { kind: 'catch', children: [block([ret()])] },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'catch_entry', 'return', 'exit'],
      edgeKinds: ['exception'],
      degradationCodes: ['modeled_exception_path'],
    },
  },
  {
    id: 'try-catch-finally',
    shape: 'exception',
    root: entry([
      {
        kind: 'try',
        children: [
          block([stmt()]),
          { kind: 'catch', children: [block([stmt()])] },
          { kind: 'finally', children: [block([stmt()])] },
        ],
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'catch_entry', 'finally_entry', 'return', 'exit'],
      edgeKinds: ['exception', 'finally'],
      degradationCodes: ['modeled_exception_path'],
    },
  },
  {
    id: 'await',
    shape: 'async',
    language: 'javascript',
    root: entry([
      { kind: 'await', line: 4 },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'await', 'return', 'exit'],
      edgeKinds: ['seq'],
      paths: 1,
    },
  },
  {
    id: 'unreachable-after-return',
    shape: 'unreachable',
    root: entry([ret(), stmt(), stmt()]),
    expect: {
      nodeKinds: ['entry', 'return', 'unreachable', 'exit'],
      edgeKinds: ['unreachable'],
      paths: 1,
    },
  },
  {
    id: 'goto',
    shape: 'unmodeled',
    language: 'cpp',
    root: entry([
      { kind: 'goto', line: 4, extensions: { label: 'done' } },
      { kind: 'label', line: 6, extensions: { label: 'done' }, children: [ret()] },
    ]),
    expect: {
      nodeKinds: ['entry', 'unmodeled', 'return', 'exit'],
      degradationCodes: ['goto_flow'],
    },
  },
  {
    id: 'computed-goto',
    shape: 'unmodeled',
    language: 'cpp',
    root: entry([
      { kind: 'goto', line: 4, extensions: { indirect: true } },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'unmodeled', 'return', 'exit'],
      degradationCodes: ['indirect_goto_flow'],
    },
  },
  {
    id: 'unsupported-construct',
    shape: 'unmodeled',
    root: entry([
      {
        kind: 'coroutine_yield_to',
        line: 4,
        extensions: { reasonCode: 'unsupported_construct', label: 'unmodeled coroutine' },
      },
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'unmodeled', 'return', 'exit'],
      degradationCodes: ['unmodeled_construct'],
    },
  },
  {
    id: 'call-resolved',
    shape: 'call',
    root: entry([
      {
        kind: 'call',
        line: 4,
        extensions: { calleeName: 'callee', callSite: range(4) },
      },
      ret(),
    ]),
    calls: [{ line: 4, status: 'resolved' }],
    expect: {
      nodeKinds: ['entry', 'call', 'return', 'exit'],
      edgeKinds: ['seq'],
      paths: 1,
    },
  },
  {
    id: 'call-unresolved',
    shape: 'call',
    root: entry([
      {
        kind: 'call',
        line: 4,
        extensions: { calleeName: 'mystery', callSite: range(4) },
      },
      ret(),
    ]),
    calls: [{ line: 4, status: 'unresolved', reasonCode: 'dynamic_dispatch' }],
    expect: {
      nodeKinds: ['entry', 'call', 'return', 'exit'],
    },
  },
  {
    id: 'empty-function',
    shape: 'empty',
    root: entry([]),
    expect: {
      nodeKinds: ['entry', 'exit'],
      edgeKinds: ['seq'],
      paths: 1,
    },
  },
  {
    id: 'boolean-tree',
    shape: 'branch',
    root: entry([
      ifStmt(
        [block([ret()])],
        {
          type: 'or',
          left: {
            type: 'and',
            left: { type: 'leaf', label: 'comparison' },
            right: { type: 'leaf', label: 'comparison' },
          },
          right: { type: 'leaf', label: 'comparison' },
        },
      ),
      ret(),
    ]),
    expect: {
      nodeKinds: ['entry', 'condition', 'return', 'exit'],
      edgeKinds: ['true', 'false'],
      paths: 3,
    },
  },
];

export const EXPECTED_FIXTURE_COUNT = SHARED_PROGRAMS.length;
