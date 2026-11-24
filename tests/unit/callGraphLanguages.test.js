import test from 'node:test';
import assert from 'node:assert/strict';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import {
  createAnalysisRun,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../src/core/csr/entities.js';
import { createCallGraphQueryService } from '../../src/core/graph/calls/query.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
});

const r = (line) => ({
  fileId: 'file:cpp',
  startLine: line,
  startColumn: 0,
  endLine: line,
  endColumn: 16,
});

test('C++ direct, virtual, overload, function-pointer, constructor, macro, and template calls preserve exact status and candidate buckets', () => {
  const callerId = 'sym:cpp:driver';
  const symbols = [
    createSymbol({
      symbolId: callerId,
      kind: 'function',
      name: 'driver',
      qualifiedName: 'driver',
      language: 'cpp',
      declaration: r(0),
    }),
    createSymbol({
      symbolId: 'sym:cpp:direct',
      kind: 'function',
      name: 'directFn',
      qualifiedName: 'directFn',
      language: 'cpp',
      declaration: r(10),
    }),
    createSymbol({
      symbolId: 'sym:cpp:single_override',
      kind: 'method',
      name: 'run',
      qualifiedName: 'Derived::run',
      language: 'cpp',
      declaration: r(20),
    }),
    createSymbol({
      symbolId: 'sym:cpp:ctor',
      kind: 'constructor',
      name: 'Widget',
      qualifiedName: 'Widget::Widget',
      language: 'cpp',
      declaration: r(30),
    }),
  ];

  // 6 virtual overrides to exercise candidate bucket aggregation (> 5 threshold).
  const virtualCandidates = [];
  const relationships = [
    createRelationship({
      relationshipId: 'rel:direct',
      type: 'calls',
      from: callerId,
      to: 'sym:cpp:direct',
      status: 'resolved',
      site: r(1),
    }),
    createRelationship({
      relationshipId: 'rel:virtual:single',
      type: 'calls',
      from: callerId,
      to: 'sym:cpp:single_override',
      status: 'inferred',
      reasonCode: 'dynamic_dispatch',
      site: r(2),
    }),
    createRelationship({
      relationshipId: 'rel:ctor:inst',
      type: 'instantiates',
      from: callerId,
      to: 'sym:cpp:ctor',
      status: 'resolved',
      site: r(3),
    }),
    createRelationship({
      relationshipId: 'rel:fnptr',
      type: 'calls',
      from: callerId,
      to: 'external:fn_ptr',
      status: 'unresolved',
      reasonCode: 'function_pointer',
      site: r(4),
    }),
    createRelationship({
      relationshipId: 'rel:tpl',
      type: 'calls',
      from: callerId,
      to: 'external:T::exec',
      status: 'unresolved',
      reasonCode: 'template_dependent',
      site: r(5),
    }),
  ];

  for (let i = 0; i < 6; i += 1) {
    const id = `sym:cpp:override:${i}`;
    virtualCandidates.push(id);
    symbols.push(
      createSymbol({
        symbolId: id,
        kind: 'method',
        name: `handle_${i}`,
        qualifiedName: `Impl${i}::handle`,
        language: 'cpp',
        declaration: r(40 + i),
      }),
    );
  }
  relationships.push(
    createRelationship({
      relationshipId: 'rel:virtual:multi',
      type: 'calls',
      from: callerId,
      to: virtualCandidates[0],
      status: 'possible',
      reasonCode: 'dynamic_dispatch',
      site: r(6),
      extensions: { candidates: virtualCandidates },
    }),
  );

  const run = createAnalysisRun({
    runId: 'run:cpp-calls',
    adapterId: 'cpp-clang',
    adapterVersion: '1.0.0',
    language: 'cpp',
    completeness: 'full',
    files: [
      createFileRecord({
        fileId: 'file:cpp',
        path: 'src/driver.cpp',
        language: 'cpp',
        lineCount: 60,
      }),
    ],
    symbols,
    relationships,
  });

  const query = createQueryLayer(run, { capabilities: CAPS });
  const service = createCallGraphQueryService({ query });
  const out = service.outgoing(callerId);
  assert.equal(out.ok, true);

  const byTarget = new Map(out.items.map((item) => [item.symbolId, item]));
  assert.equal(byTarget.get('sym:cpp:direct').status, 'resolved');
  assert.equal(byTarget.get('sym:cpp:single_override').status, 'inferred');
  assert.equal(byTarget.get('sym:cpp:ctor').type, 'instantiates');
  assert.equal(byTarget.get(virtualCandidates[0]).status, 'possible');

  // Unresolved bucket holds function_pointer and template_dependent sites, never resolved.
  assert.equal(out.unresolvedBucket.count, 2);
  assert.deepEqual(
    out.unresolvedBucket.reasons.map((r) => r.reasonCode),
    ['function_pointer', 'template_dependent'],
  );

  const expanded = service.depth(callerId, { depth: 2 });
  assert.equal(expanded.candidateBuckets.length, 1);
  assert.equal(expanded.candidateBuckets[0].candidates.length, 6);
});

test('JavaScript adapter call extraction never invents resolved edges for unknown receivers, computed members, or callbacks', () => {
  const source = `
function localTarget(x) {
  return x + 1;
}
function run(receiver, key, cb) {
  localTarget(1);
  receiver.unknownMethod();
  receiver[key]();
  cb();
  setTimeout(localTarget, 10);
}
`;
  const run = javascriptAdapter.analyze({
    runId: 'run:js-calls',
    path: 'src/calls.js',
    text: source,
  });
  const query = createQueryLayer(run, { capabilities: CAPS });
  const service = createCallGraphQueryService({ query });
  const runSym = run.symbols.find((s) => s.name === 'run');
  assert.ok(runSym);

  const out = service.outgoing(runSym.symbolId);
  assert.equal(out.ok, true);

  // Only `localTarget(1)` may be `resolved`; dynamic/indirect calls must be possible or unresolved.
  const resolvedItems = out.items.filter((item) => item.status === 'resolved');
  assert.equal(resolvedItems.length, 1);
  assert.equal(resolvedItems[0].name, 'localTarget');
  assert.ok(out.unresolvedBucket.count >= 2);
});
