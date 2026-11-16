import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGraph } from '../../src/core/graph/model.js';
import { computeLayout } from '../../src/core/graph/layout.js';
import {
  GRAPH_DTO_VERSION,
  parseDto,
  serializeDto,
  toDto,
  validateDto,
} from '../../src/core/graph/dto.js';
import { createAnalysisRun } from '../../src/core/csr/entities.js';
import { createMockAnalysis } from '../../src/adapters/mock/index.js';

test('builds a graph from CSR without language knowledge', () => {
  const graph = buildGraph(createMockAnalysis());

  assert.equal(graph.language, 'mock');
  assert.equal(graph.nodes.length, 6, 'five declared symbols plus one unresolved target');
  assert.equal(graph.edges.length, 4);

  // Deterministic ordering by id.
  const ids = graph.nodes.map((node) => node.id);
  assert.deepEqual(ids, [...ids].sort());

  const external = graph.nodes.find((node) => node.external);
  assert.ok(external);
  assert.equal(external.id, 'external:logger.info');
  assert.equal(external.status, 'unresolved');

  const unresolved = graph.edges.filter((edge) => edge.status === 'unresolved');
  assert.equal(unresolved.length, 1);
  assert.equal(unresolved[0].reasonCode, 'unknown_import_target');
});

test('degradations surface partial completeness and warnings but not info', () => {
  const graph = buildGraph(createMockAnalysis());
  assert.ok(graph.degradations.some((entry) => /partial/.test(entry)));
  assert.ok(graph.degradations.some((entry) => /mock_data/.test(entry)));
  assert.ok(!graph.degradations.some((entry) => /partial_coverage/.test(entry)));
});

test('edges without a declared source are skipped rather than invented', () => {
  const run = createMockAnalysis();
  run.relationships.push({
    relationshipId: 'rel:ghost',
    type: 'calls',
    from: 'symbol:does-not-exist',
    to: 'symbol:js:src/DBHandler.js:function:main',
    status: 'unresolved',
    reasonCode: 'out_of_scope',
  });

  const graph = buildGraph(run);
  assert.equal(graph.edges.length, 4);
  assert.ok(!graph.nodes.some((node) => node.id === 'symbol:does-not-exist'));
  assert.ok(
    graph.degradations.some((entry) => entry.includes('rel:ghost')),
    'a skipped relationship must be reported as a degradation',
  );
});

test('graph construction is deterministic', () => {
  const first = JSON.stringify(buildGraph(createMockAnalysis()));
  const second = JSON.stringify(buildGraph(createMockAnalysis()));
  assert.equal(first, second);
});

test('DTO validates and carries positions for every node', () => {
  const dto = toDto(buildGraph(createMockAnalysis()));

  assert.equal(dto.dtoVersion, GRAPH_DTO_VERSION);
  const validation = validateDto(dto);
  assert.equal(validation.ok, true, JSON.stringify(validation.issues));

  for (const node of dto.nodes) {
    assert.ok(node.position, `node ${node.id} has a position`);
    assert.equal(typeof node.position.x, 'number');
    assert.equal(typeof node.position.y, 'number');
  }
  assert.ok(dto.extent.width > 0);
  assert.ok(dto.extent.height > 0);
  assert.ok(dto.legend.statuses.includes('resolved'));
  assert.ok(dto.legend.statuses.includes('unresolved'));
});

test('DTO never contains source text', () => {
  const json = JSON.stringify(toDto(buildGraph(createMockAnalysis())));
  for (const forbidden of [
    '// Phase 0 mock fixture',
    'class DBHandler {',
    'check_db_exists(path)',
  ]) {
    assert.ok(!json.includes(forbidden), `DTO leaked source text: ${forbidden}`);
  }
});

test('DTO round-trips through JSON', () => {
  const dto = toDto(buildGraph(createMockAnalysis()));
  const parsed = parseDto(serializeDto(dto));
  assert.deepEqual(parsed, dto);
});

test('DTO validation rejects dangling edges, duplicate nodes, and bad versions', () => {
  const dto = toDto(buildGraph(createMockAnalysis()));
  const dangling = structuredClone(dto);
  dangling.edges[0].to = 'missing-node';
  assert.equal(validateDto(dangling).ok, false);

  const duplicate = structuredClone(dto);
  duplicate.nodes.push({ ...duplicate.nodes[0] });
  assert.equal(validateDto(duplicate).ok, false);

  const versioned = structuredClone(dto);
  versioned.dtoVersion = 999;
  assert.equal(validateDto(versioned).ok, false);

  assert.equal(validateDto(null).ok, false);
  assert.equal(validateDto({ dtoVersion: GRAPH_DTO_VERSION }).ok, false);
});

test('layout is deterministic and cycle-safe', () => {
  const dto = toDto(buildGraph(createMockAnalysis()));
  const graph = buildGraph(createMockAnalysis());

  const first = computeLayout(graph);
  const second = computeLayout(graph);
  assert.deepEqual(first.positions, second.positions);

  const cyclic = {
    nodes: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    edges: [
      { from: 'a', to: 'b' },
      { from: 'b', to: 'a' },
      { from: 'b', to: 'c' },
      { from: 'c', to: 'c' },
    ],
  };
  const layout = computeLayout(cyclic);
  assert.equal(Object.keys(layout.positions).length, 3);
  for (const id of ['a', 'b', 'c']) {
    assert.ok(layout.positions[id], `missing position for ${id}`);
  }

  // Every node in the mock DTO has a layer within the declared maximum.
  const maxLayer = Math.max(...dto.nodes.map((node) => node.position.layer));
  assert.ok(maxLayer < 40);
});

test('an empty graph still produces a valid DTO', () => {
  const empty = createAnalysisRun({
    runId: 'run:empty',
    adapterId: 'mock',
    language: 'mock',
    completeness: 'syntactic_only',
  });
  const graph = buildGraph(empty);
  assert.equal(graph.nodes.length, 0);
  const dto = toDto(graph);
  assert.equal(validateDto(dto).ok, true);
  assert.ok(dto.extent.width > 0);
});
