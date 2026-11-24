import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javaAdapter } from '../../src/adapters/java/index.js';

const source = await fs.readFile(new URL('../fixtures/java/calls.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-calls.json', import.meta.url), 'utf8');

describe('Java Call Resolution & Virtual Dispatch (P14-06, AC-14.4)', () => {
  const run = javaAdapter.analyze({
    runId: 'run:java-calls',
    path: 'src/CallDemo.java',
    text: source,
    javaAst: ast,
    javaMode: 'compile-db',
  });

  it('resolves direct static method calls within same class', () => {
    const runMethod = run.symbols.find((s) => s.name === 'run');
    const renderMethod = run.symbols.find((s) => s.name === 'render');
    assert.ok(runMethod && renderMethod);

    const staticCall = run.relationships.find(
      (r) => r.type === 'calls' && r.from === runMethod.symbolId && r.to === renderMethod.symbolId,
    );
    assert.ok(staticCall, 'Call from run to render must exist');
    assert.equal(staticCall.status, 'resolved');
  });

  it('marks external library calls as unresolved with out_of_scope reason code', () => {
    const runMethod = run.symbols.find((s) => s.name === 'run');
    assert.ok(runMethod);

    // Call to System.out.println
    const printCall = run.relationships.find(
      (r) => r.type === 'calls' && r.from === runMethod.symbolId && r.to.includes('println'),
    );
    assert.ok(printCall, 'Call to println must exist');
    assert.equal(printCall.status, 'unresolved');
    assert.equal(printCall.reasonCode, 'out_of_scope');
  });
});
