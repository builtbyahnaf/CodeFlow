/**
 * Workflow Profiling Baselines & Regression Thresholds (Phase 12 §10, P12-21, P12-23).
 *
 * Defines normative latency baselines and checks for regressions (> 20%).
 */

/** Normative latency and throughput baselines in milliseconds. */
export const WORKFLOW_BASELINES = Object.freeze({
  activation: Object.freeze({
    metric: 'activation',
    targetMs: 250,
    maxBudgetMs: 500,
    description: 'Time to command availability after activation',
  }),
  fileToCfg: Object.freeze({
    metric: 'fileToCfg',
    targetMs: 40,
    maxBudgetMs: 100,
    description: 'Parse file and construct control-flow graph',
  }),
  hoverPreviewCold: Object.freeze({
    metric: 'hoverPreviewCold',
    targetMs: 30,
    maxBudgetMs: 80,
    description: 'Cold hover source range slice & syntax tokenization',
  }),
  hoverPreviewWarm: Object.freeze({
    metric: 'hoverPreviewWarm',
    targetMs: 5,
    maxBudgetMs: 20,
    description: 'Warm cache retrieval of source preview card',
  }),
  levelDescent: Object.freeze({
    metric: 'levelDescent',
    targetMs: 35,
    maxBudgetMs: 80,
    description: 'Per-step semantic zoom level descent and state restoration',
  }),
  explanationRender: Object.freeze({
    metric: 'explanationRender',
    targetMs: 25,
    maxBudgetMs: 60,
    description: 'Fact extraction and deterministic natural language explanation',
  }),
  dfgBuild: Object.freeze({
    metric: 'dfgBuild',
    targetMs: 50,
    maxBudgetMs: 120,
    description: 'Reaching definitions fixpoint and intra-procedural DFG assembly',
  }),
});

/**
 * Evaluate measured metrics against baselines with a 20% regression threshold.
 *
 * @param {Record<string, number>} measuredMetrics
 * @param {number} [regressionThresholdFraction=0.20]
 * @returns {{
 *   ok: boolean,
 *   regressions: Array<{ metric: string, baselineMs: number, measuredMs: number, regressionPercent: number }>
 * }}
 */
export function evaluatePerformanceRegression(
  measuredMetrics,
  regressionThresholdFraction = 0.2,
) {
  const regressions = [];
  for (const [key, measuredMs] of Object.entries(measuredMetrics)) {
    const baseline = WORKFLOW_BASELINES[key];
    if (!baseline) continue;

    const threshold = baseline.maxBudgetMs * (1 + regressionThresholdFraction);
    if (measuredMs > threshold) {
      const excess = measuredMs - baseline.maxBudgetMs;
      const regressionPercent = Math.round((excess / baseline.maxBudgetMs) * 100);
      regressions.push({
        metric: key,
        baselineMs: baseline.maxBudgetMs,
        measuredMs: Math.round(measuredMs * 10) / 10,
        regressionPercent,
      });
    }
  }

  return {
    ok: regressions.length === 0,
    regressions,
  };
}
