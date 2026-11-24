import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { cAdapter } from '../../src/adapters/c/index.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';

const source = await fs.readFile(new URL('../fixtures/c/basic.c', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/c/ast-basic.json', import.meta.url), 'utf8');

describe('C Control-Flow Graph Generation (P13-07, AC-13.5)', () => {
  const run = cAdapter.analyze({
    runId: 'run:c-cfg',
    path: 'src/basic.c',
    text: source,
    cAst: ast,
    cMode: 'compile-db',
  });

  it('produces valid control constructs for C functions', () => {
    assert.ok(run.controlConstructs.length > 0);
    const branch = run.controlConstructs.find((c) => c.kind === 'if');
    assert.ok(branch);
  });

  it('builds executable CFG from C control constructs', () => {
    const query = createQueryLayer(run, { capabilities: cAdapter.capabilities });
    const calcFn = run.symbols.find((s) => s.name === 'calculate');
    assert.ok(calcFn);

    const cfgRes = buildCfg(query, calcFn.symbolId);
    assert.ok(cfgRes.cfg);
    assert.ok(cfgRes.cfg.nodes.length >= 4);

    // Has entry and exit nodes
    const entry = cfgRes.cfg.nodes.find((n) => n.kind === 'entry');
    const exit = cfgRes.cfg.nodes.find((n) => n.kind === 'exit');
    assert.ok(entry);
    assert.ok(exit);
  });
});
