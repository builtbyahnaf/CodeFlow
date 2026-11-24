import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';

import {
  WORKFLOW_BASELINES,
  evaluatePerformanceRegression,
} from '../../src/core/perf/index.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createExplanationEngine } from '../../src/core/explanation/engine.js';

describe('Workflow Performance Profiling & Regression Enforcement (P12-21, P12-23, AC-12.4)', () => {
  it('defines normative baselines for all core workflows', () => {
    const baselines = Object.keys(WORKFLOW_BASELINES);
    assert.ok(baselines.length >= 7);
    for (const key of baselines) {
      const b = WORKFLOW_BASELINES[key];
      assert.ok(b.metric);
      assert.ok(b.targetMs > 0);
      assert.ok(b.maxBudgetMs >= b.targetMs);
      assert.ok(b.description.length > 5);
    }
  });

  it('measures real CFG and explanation execution within baseline budgets', () => {
    const code = `
      function computeStatistics(data) {
        let sum = 0;
        let count = 0;
        for (let i = 0; i < data.length; i++) {
          if (data[i] !== null && data[i] !== undefined) {
            sum += data[i];
            count++;
          }
        }
        return count > 0 ? sum / count : 0;
      }
    `;

    // Benchmark fileToCfg
    const t0 = performance.now();
    const run = javascriptAdapter.analyze({
      runId: 'run:perf-bench',
      path: 'src/stats.js',
      text: code,
    });
    const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
    const func = run.symbols.find((s) => s.name === 'computeStatistics');
    assert.ok(func);
    const cfgRes = buildCfg(query, func.symbolId);
    const fileToCfgDuration = performance.now() - t0;

    // Benchmark explanationRender
    const engine = createExplanationEngine();
    const t1 = performance.now();
    const explanation = engine.explainFunction({
      query,
      cfg: cfgRes.cfg,
      depth: 3,
    });
    const explanationDuration = performance.now() - t1;

    assert.equal(explanation.ok, true);

    const check = evaluatePerformanceRegression({
      fileToCfg: fileToCfgDuration,
      explanationRender: explanationDuration,
    });

    assert.ok(
      check.ok,
      `Performance regression detected: ${JSON.stringify(check.regressions)}`,
    );
  });

  it('detects and flags regressions exceeding 20% over budget', () => {
    const measured = {
      fileToCfg: 250, // Max budget is 100ms; 250ms exceeds by > 20%
      explanationRender: 20, // Clean pass
    };

    const check = evaluatePerformanceRegression(measured, 0.2);
    assert.equal(check.ok, false);
    assert.equal(check.regressions.length, 1);
    assert.equal(check.regressions[0].metric, 'fileToCfg');
    assert.ok(check.regressions[0].regressionPercent >= 100);
  });
});
