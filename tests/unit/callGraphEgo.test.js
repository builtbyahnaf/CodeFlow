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
import { validateDto } from '../../src/core/graph/dto.js';
import { createCallGraphQueryService } from '../../src/core/graph/calls/query.js';
import { createCallGraphSession } from '../../src/core/graph/calls/ego.js';

const CAPS = createCapabilities({
  parse: true,
  discoverDeclarations: true,
  resolveCalls: true,
  generateCFG: true,
});

const r = (line) => ({
  fileId: 'file:a',
  startLine: line,
  startColumn: 0,
  endLine: line,
  endColumn: 12,
});

function buildChainFixture() {
  const symbols = ['center', 'caller1', 'callee1', 'hop2', 'hop3'].map((name, i) =>
    createSymbol({
      symbolId: `sym:${name}`,
      kind: 'function',
      name,
      qualifiedName: name,
      language: 'javascript',
      declaration: r(i),
    }),
  );
  const relationships = [
    createRelationship({
      relationshipId: 'rel:caller1->center',
      type: 'calls',
      from: 'sym:caller1',
      to: 'sym:center',
      status: 'resolved',
      site: r(1),
    }),
    createRelationship({
      relationshipId: 'rel:center->callee1',
      type: 'calls',
      from: 'sym:center',
      to: 'sym:callee1',
      status: 'resolved',
      site: r(2),
    }),
    createRelationship({
      relationshipId: 'rel:callee1->hop2',
      type: 'calls',
      from: 'sym:callee1',
      to: 'sym:hop2',
      status: 'possible',
      reasonCode: 'callback_parameter',
      site: r(3),
    }),
    createRelationship({
      relationshipId: 'rel:hop2->hop3',
      type: 'calls',
      from: 'sym:hop2',
      to: 'sym:hop3',
      status: 'resolved',
      site: r(4),
    }),
    createRelationship({
      relationshipId: 'rel:center->unresolved',
      type: 'calls',
      from: 'sym:center',
      to: 'external:dyn',
      status: 'unresolved',
      reasonCode: 'unknown_receiver',
      site: r(5),
    }),
  ];

  const run = createAnalysisRun({
    runId: 'run:ego',
    adapterId: 'javascript',
    adapterVersion: '1.0.0',
    language: 'javascript',
    completeness: 'full',
    files: [
      createFileRecord({
        fileId: 'file:a',
        path: 'src/ego.js',
        language: 'javascript',
        lineCount: 30,
      }),
    ],
    symbols,
    relationships,
  });

  const query = createQueryLayer(run, { capabilities: CAPS });
  const queryService = createCallGraphQueryService({ query });
  return createCallGraphSession({ queryService });
}

test('ego session opens 1-hop neighborhood with unresolved bucket, non-color edge cues, and valid DTO', () => {
  const session = buildChainFixture();
  const opened = session.open('sym:center');
  assert.equal(opened.ok, true);
  assert.equal(validateDto(opened.dto).ok, true);

  const nodeIds = opened.dto.nodes.map((n) => n.id);
  assert.ok(nodeIds.includes('sym:center'));
  assert.ok(nodeIds.includes('sym:caller1'));
  assert.ok(nodeIds.includes('sym:callee1'));
  assert.ok(nodeIds.includes('bucket:unresolved:sym:center'));
  assert.equal(nodeIds.includes('sym:hop2'), false, 'hop 2 stays collapsed initially');

  for (const edge of opened.dto.edges) {
    assert.equal(typeof edge.dash, 'string');
    assert.ok(edge.glyphHint.length >= 1, 'every edge has a non-color glyphHint');
  }
});

test('expanding and collapsing evicts unreachable descendants with zero state leak over 50 cycles', () => {
  const session = buildChainFixture();
  const base = session.open('sym:center');
  const baselineNodeCount = base.dto.nodes.length;
  const baselineEdgeCount = base.dto.edges.length;

  for (let i = 0; i < 50; i += 1) {
    const exp1 = session.expand('sym:callee1');
    assert.ok(exp1.dto.nodes.some((n) => n.id === 'sym:hop2'));
    const exp2 = session.expand('sym:hop2');
    assert.ok(exp2.dto.nodes.some((n) => n.id === 'sym:hop3'));

    // Collapsing `sym:callee1` must evict both `sym:hop2` and `sym:hop3`.
    const collapsed = session.collapse('sym:callee1');
    assert.equal(collapsed.dto.nodes.length, baselineNodeCount);
    assert.equal(collapsed.dto.edges.length, baselineEdgeCount);
    assert.equal(session.expandedCount(), 1);
  }
});

test('filtering by status and focusing a node dims non-neighborhood while keeping counts intact', () => {
  const session = buildChainFixture();
  session.open('sym:center');
  session.expand('sym:callee1');

  const focused = session.focus('sym:callee1');
  const callerNode = focused.dto.nodes.find((n) => n.id === 'sym:caller1');
  const calleeNode = focused.dto.nodes.find((n) => n.id === 'sym:callee1');
  assert.equal(callerNode.dimmed, true);
  assert.equal(calleeNode.dimmed, false);
  assert.equal(focused.dto.counts.callers, 1);

  const resolvedOnly = session.filter({ statuses: ['resolved'] });
  assert.equal(
    resolvedOnly.dto.nodes.some((n) => n.id === 'sym:hop2'),
    false,
    'possible edge target is hidden when filtering for resolved only',
  );
});
