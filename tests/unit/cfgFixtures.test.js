import test from 'node:test';
import assert from 'node:assert/strict';

import { toCfgDto } from '../../src/core/graph/cfg/dto.js';
import { CFG_EDGE_KINDS, CFG_NODE_KINDS } from '../../src/core/graph/cfg/kinds.js';
import { validateDto, serializeDto, parseDto } from '../../src/core/graph/dto.js';
import {
  SHARED_PROGRAMS,
  EXPECTED_FIXTURE_COUNT,
} from '../fixtures/cfg/programs.js';
import {
  buildFixtureCfg,
  countEntryExitPaths,
} from '../fixtures/cfg/harness.js';

test('the shared corpus has at least 25 fixtures across the required shapes', () => {
  assert.ok(EXPECTED_FIXTURE_COUNT >= 25, `only ${EXPECTED_FIXTURE_COUNT} fixtures`);
  const shapes = new Set(SHARED_PROGRAMS.map((program) => program.shape));
  for (const shape of [
    'sequence',
    'branch',
    'loop',
    'switch',
    'early-return',
    'exception',
    'iteration',
    'expression-branch',
    'unmodeled',
    'call',
  ]) {
    assert.ok(shapes.has(shape), `missing shape ${shape}`);
  }
});

for (const program of SHARED_PROGRAMS) {
  test(`fixture ${program.id} produces a valid, honest CFG`, () => {
    const cfg = buildFixtureCfg(program);
    const expectations = program.expect ?? {};

    assert.equal(cfg.function.symbolId, cfg.symbolId);
    assert.equal(cfg.nodes.filter((node) => node.kind === 'entry').length, 1);
    assert.equal(cfg.nodes.filter((node) => node.kind === 'exit').length, 1);

    for (const node of cfg.nodes) {
      assert.ok(
        CFG_NODE_KINDS.includes(node.kind),
        `fixture ${program.id} emitted unknown node kind ${node.kind}`,
      );
      assert.ok(
        ['resolved', 'inferred', 'possible', 'unresolved', 'stale'].includes(node.status),
        `fixture ${program.id} emitted unknown status ${node.status}`,
      );
      if (!node.synthetic && node.kind !== 'exit') {
        assert.ok(node.range, `fixture ${program.id} node ${node.kind} has no range`);
      }
    }
    for (const edge of cfg.edges) {
      assert.ok(
        CFG_EDGE_KINDS.includes(edge.kind),
        `fixture ${program.id} emitted unknown edge kind ${edge.kind}`,
      );
    }

    for (const expected of expectations.nodeKinds ?? []) {
      assert.ok(
        cfg.nodes.some((node) => node.kind === expected),
        `fixture ${program.id} is missing node kind ${expected}`,
      );
    }
    const edgeKinds = new Set(cfg.edges.map((edge) => edge.kind));
    for (const expected of expectations.edgeKinds ?? []) {
      assert.ok(
        edgeKinds.has(expected),
        `fixture ${program.id} is missing edge kind ${expected}`,
      );
    }
    const degradationCodes = new Set(cfg.degradations.map((entry) => entry.code));
    for (const expected of expectations.degradationCodes ?? []) {
      assert.ok(
        degradationCodes.has(expected),
        `fixture ${program.id} is missing degradation ${expected}`,
      );
    }
    if (Number.isInteger(expectations.paths)) {
      assert.equal(
        countEntryExitPaths(cfg),
        expectations.paths,
        `fixture ${program.id} path count changed`,
      );
    }

    // DTO round-trip: the fixture corpus also proves the transport contract.
    const dto = toCfgDto(cfg);
    const validation = validateDto(JSON.parse(serializeDto(dto)));
    assert.equal(
      validation.ok,
      true,
      validation.ok ? '' : validation.issues.join('; '),
    );
    assert.doesNotThrow(() => parseDto(serializeDto(dto)));
  });
}

test('no fixture DTO carries raw source text', () => {
  for (const program of SHARED_PROGRAMS) {
    const dto = toCfgDto(buildFixtureCfg(program));
    const json = serializeDto(dto);
    assert.equal(/"text"\s*:/.test(json), false, `${program.id} leaked text`);
  }
});

test('fixture graphs are deterministic under rebuild', () => {
  for (const program of SHARED_PROGRAMS) {
    const a = serializeDto(toCfgDto(buildFixtureCfg(program)));
    const b = serializeDto(toCfgDto(buildFixtureCfg(program)));
    assert.equal(a, b, `${program.id} was not deterministic`);
  }
});
