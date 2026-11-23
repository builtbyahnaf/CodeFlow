import test from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { toCfgDto } from '../../src/core/graph/cfg/dto.js';
import { validateDto } from '../../src/core/graph/dto.js';
import { buildProgram } from '../fixtures/cfg/harness.js';

const entry = (children) => ({ kind: 'entry', children });
const stmt = () => ({ kind: 'statement' });

function synthetic(nodes) {
  return entry(Array.from({ length: nodes }, () => stmt()));
}

/**
 * @param {number} nodeTarget
 */
function timedBuild(nodeTarget) {
  const { query, symbolId } = buildProgram({
    id: `perf-${nodeTarget}`,
    root: synthetic(nodeTarget),
  });
  const started = performance.now();
  const built = buildCfg(query, symbolId, { allowLarge: true });
  const builtAt = performance.now();
  assert.equal(built.ok, true, built.ok ? '' : built.message);
  const dto = toCfgDto(built.cfg);
  const laidOutAt = performance.now();
  assert.equal(validateDto(dto).ok, true);
  return {
    nodeCount: dto.nodes.length,
    buildMs: builtAt - started,
    layoutMs: laidOutAt - builtAt,
  };
}

test('500-node CFGs build and lay out well inside the phase budget', () => {
  const result = timedBuild(500);
  assert.ok(result.nodeCount >= 500);
  // Phase 4 budget: first render < 1.5 s and layout must not block > 200 ms.
  assert.ok(result.buildMs < 1500, `build took ${result.buildMs.toFixed(1)} ms`);
  assert.ok(result.layoutMs < 500, `layout took ${result.layoutMs.toFixed(1)} ms`);
});

test('1500-node CFGs still stay within the interactive budget', () => {
  const result = timedBuild(1500);
  assert.ok(result.nodeCount >= 1500);
  assert.ok(result.buildMs < 4000, `build took ${result.buildMs.toFixed(1)} ms`);
  assert.ok(result.layoutMs < 1500, `layout took ${result.layoutMs.toFixed(1)} ms`);
});

test('a hostile query layer cannot take the builder down', () => {
  const { query } = buildProgram({ id: 'hostile', root: synthetic(3) });
  const hostile = {
    ...query,
    runInfo() {
      throw new Error('run metadata exploded');
    },
  };
  const result = buildCfg(hostile, 'symbol:anything');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CFG_INTERNAL');
  assert.equal(typeof result.message, 'string');
});

test('a malformed construct tree degrades instead of crashing', () => {
  const { query, symbolId } = buildProgram({
    id: 'malformed',
    root: {
      kind: 'entry',
      children: [
        { kind: 'if', condition: { type: 'leaf' }, children: [{ kind: 'block', children: [] }] },
        { kind: 'mystery', extensions: { label: 'mystery node' } },
      ],
    },
  });
  const result = buildCfg(query, symbolId);
  assert.equal(result.ok, true, result.ok ? '' : result.message);
  const unmodeled = result.cfg.nodes.find((node) => node.kind === 'unmodeled');
  assert.ok(unmodeled);
  assert.ok(result.cfg.degradations.some((entry) => entry.code === 'unmodeled_construct'));
});

test('the builder never mutates the CSR run', () => {
  const { run, query, symbolId } = buildProgram({
    id: 'immutable',
    root: entry([stmt(), { kind: 'return' }]),
  });
  const before = JSON.stringify(run);
  buildCfg(query, symbolId);
  assert.equal(JSON.stringify(run), before);
});

test('the DTO marks a truncated graph without breaking validation', () => {
  const { query, symbolId } = buildProgram({
    id: 'cap',
    root: synthetic(60),
  });
  const built = buildCfg(query, symbolId);
  assert.equal(built.ok, true);
  const dto = toCfgDto(built.cfg, { maxNodes: 20 });
  assert.equal(dto.truncated, true);
  assert.ok(dto.nodes.length <= 22);
  assert.equal(validateDto(dto).ok, true);
});
