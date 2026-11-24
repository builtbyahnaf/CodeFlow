import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javaAdapter } from '../../src/adapters/java/index.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';

const source = await fs.readFile(new URL('../fixtures/java/calls.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-calls.json', import.meta.url), 'utf8');

describe('Java Control Flow & Exception Graph (P14-08, AC-14.6)', () => {
  const run = javaAdapter.analyze({
    runId: 'run:java-cfg',
    path: 'src/CallDemo.java',
    text: source,
    javaAst: ast,
    javaMode: 'compile-db',
  });

  it('produces valid control constructs for Java try-catch-finally blocks', () => {
    assert.ok(run.controlConstructs.length > 0);
    const tryConstruct = run.controlConstructs.find((c) => c.kind === 'try');
    assert.ok(tryConstruct, 'try construct must exist');

    const catchConstruct = run.controlConstructs.find((c) => c.kind === 'catch');
    assert.ok(catchConstruct, 'catch construct must exist');

    const finallyConstruct = run.controlConstructs.find((c) => c.kind === 'finally');
    assert.ok(finallyConstruct, 'finally construct must exist');
  });

  it('builds executable CFG from Java control constructs', () => {
    const query = createQueryLayer(run, { capabilities: javaAdapter.capabilities });
    const runMethod = run.symbols.find((s) => s.name === 'run');
    assert.ok(runMethod);

    const cfgRes = buildCfg(query, runMethod.symbolId);
    assert.ok(cfgRes.cfg);
    assert.ok(cfgRes.cfg.nodes.length >= 4);

    const entry = cfgRes.cfg.nodes.find((n) => n.kind === 'entry');
    const exit = cfgRes.cfg.nodes.find((n) => n.kind === 'exit');
    assert.ok(entry);
    assert.ok(exit);
  });
});
