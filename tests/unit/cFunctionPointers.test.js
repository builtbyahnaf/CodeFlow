import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  cAdapter,
  isFunctionPointerType,
} from '../../src/adapters/c/index.js';

const source = await fs.readFile(
  new URL('../fixtures/c/function_pointers.c', import.meta.url),
  'utf8',
);
const ast = await fs.readFile(
  new URL('../fixtures/c/ast-function_pointers.json', import.meta.url),
  'utf8',
);

describe('C Function Pointers & Indirect Calls (P13-05, P13-06, AC-13.3)', () => {
  it('isFunctionPointerType detects function pointer types', () => {
    assert.equal(isFunctionPointerType('int (*)(int, int)'), true);
    assert.equal(isFunctionPointerType('void (*)(void *)'), true);
    assert.equal(isFunctionPointerType('int (*handler)(float)'), true);
    assert.equal(isFunctionPointerType('int'), false);
    assert.equal(isFunctionPointerType('char *'), false);
  });

  it('analyzes function pointer assignments and resolves indirect call candidates', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-fp',
      path: 'src/function_pointers.c',
      text: source,
      cAst: ast,
      cMode: 'compile-db',
    });

    const addFn = run.symbols.find((s) => s.name === 'add');
    const runOp = run.symbols.find((s) => s.name === 'run_op');
    assert.ok(addFn && runOp);

    // Call from run_op to add through function pointer
    const indirectCall = run.relationships.find(
      (r) => r.type === 'calls' && r.from === runOp.symbolId && r.to === addFn.symbolId,
    );
    assert.ok(indirectCall, 'Indirect call from run_op to add must exist');
    assert.equal(indirectCall.status, 'possible');
    assert.equal(indirectCall.reasonCode, 'function_pointer');
  });
});
