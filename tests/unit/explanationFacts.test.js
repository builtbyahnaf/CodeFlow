import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { mapClangAst } from '../../src/adapters/cpp/mapper.js';
import { extractFunctionFacts, extractNodeFacts } from '../../src/core/explanation/facts.js';

const CAPABILITIES = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
  generateDFG: true,
});

test('extractFunctionFacts extracts branches, loops, calls, and returns from a JavaScript CFG', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:facts-js',
    path: 'src/sample.js',
    text: `function helper(v) { return v + 1; }
function inspect(items, limit) {
  let total = 0;
  for (let i = 0; i < items.length; i += 1) {
    if (i > limit) {
      return total;
    }
    total += helper(items[i]);
  }
  return total;
}
`,
  });
  const query = createQueryLayer(run, { capabilities: CAPABILITIES });
  const inspectSym = query.cfgFunctions().value.find((fn) => fn.name === 'inspect');
  assert.ok(inspectSym);
  const built = buildCfg(query, inspectSym.symbolId);
  assert.equal(built.ok, true);

  const facts = extractFunctionFacts(query, built.cfg);
  assert.equal(facts.functionShape.parameterCount, 2);
  assert.equal(facts.functionShape.returnCount, 2);
  assert.ok(facts.functionShape.branchCount >= 1);
  assert.equal(facts.functionShape.loopCount, 1);
  assert.equal(Object.values(facts.loopsByNodeId)[0].hasEarlyExit, true);
  assert.ok(Object.keys(facts.callsByNodeId).length >= 1);

  const nodeFacts = extractNodeFacts(built.cfg.entryId, facts, built.cfg);
  assert.ok(nodeFacts);
  assert.equal(nodeFacts.node.kind, 'entry');
});

test('extractFunctionFacts normalizes C++ parity fixture through the same fact model', () => {
  const root = 'tests/fixtures/cpp';
  const text = fs.readFileSync(path.join(root, 'parity.cpp'), 'utf8');
  const ast = JSON.parse(fs.readFileSync(path.join(root, 'ast-parity.json'), 'utf8'));
  const run = mapClangAst({
    runId: 'run:facts-cpp',
    path: 'src/parity.cpp',
    text,
    workspaceRoot: 'D:/w',
    ast,
    mode: 'compile-db',
    adapterId: 'cpp-clang',
    adapterVersion: '0.1.0',
  });
  const query = createQueryLayer(run, { capabilities: CAPABILITIES });
  const fn = query.cfgFunctions().value[0];
  const built = buildCfg(query, fn.symbolId);
  assert.equal(built.ok, true);

  const facts = extractFunctionFacts(query, built.cfg);
  assert.equal(facts.language, 'cpp');
  assert.ok(facts.functionShape.nodeCount > 0);
  assert.ok(facts.functionShape.branchCount >= 1);
  assert.ok(facts.functionShape.loopCount >= 1);
});
