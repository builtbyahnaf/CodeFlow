/**
 * Function summary and mandatory Depth-4 limitations rules (Phase 6 §8.6, §7).
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { formatLimitations, qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runFunctionSummaryRules(ctx) {
  const { fnFacts, cfg, depth, stale, subjectKind } = ctx;
  const shape = fnFacts?.functionShape;
  if (!shape) {
    return [];
  }

  const fnRange = cfg.function?.range ?? null;
  const primaryEvidence =
    rangeEvidence(fnRange, cfg.symbolId || cfg.entryId) ??
    createEvidenceRef({
      kind: 'semantic',
      id: cfg.symbolId || cfg.entryId || 'function',
      label: shape.qualifiedName,
    });
  if (!primaryEvidence) {
    return [];
  }
  const evidence = [primaryEvidence];

  const items = [];
  const completeness = fnFacts.completeness ?? 'full';
  const isPartial = completeness !== 'full';
  const counts = shape.callCounts ?? {};

  if (subjectKind !== 'node') {
    const paramText =
      shape.parameterCount === 1
        ? 'takes 1 parameter'
        : `takes ${shape.parameterCount} parameters`;
    const returnText =
      shape.returnCount === 0
        ? 'has no explicit return statements'
        : shape.returnCount === 1
          ? shape.returnsWithValue > 0
            ? 'returns a value from 1 path'
            : 'exits from 1 return path'
          : `returns from ${shape.returnCount} paths`;

    const fragments = [
      {
        text: `\`${shape.qualifiedName}\` ${paramText} and ${returnText}.`,
        evidence,
      },
    ];

    if (depth >= 2) {
      const callParts = [];
      if (counts.resolved > 0) {
        callParts.push(`${counts.resolved} resolved`);
      }
      if (counts.inferred > 0) {
        callParts.push(`${counts.inferred} inferred`);
      }
      if (counts.possible > 0) {
        callParts.push(`${counts.possible} possible`);
      }
      if (counts.unresolved > 0) {
        callParts.push(`${counts.unresolved} unresolved`);
      }
      const callClause =
        callParts.length > 0 ? `Calls: ${callParts.join(', ')}.` : 'Makes no recorded calls.';
      const branchClause =
        shape.branchCount === 1 ? '1 branch' : `${shape.branchCount} branches`;
      const loopClause = shape.loopCount === 1 ? '1 loop' : `${shape.loopCount} loops`;
      fragments.push({
        text: `Contains ${branchClause} and ${loopClause}. ${callClause}`,
        evidence,
      });
    }

    if (depth >= 3) {
      const depthClause =
        shape.maxLoopDepth > 0 ? `Max loop nesting depth: ${shape.maxLoopDepth}.` : '';
      const exitClause =
        shape.earlyExitCount > 0 ? `Early jumps/throws: ${shape.earlyExitCount}.` : '';
      const extra = [depthClause, exitClause].filter(Boolean).join(' ');
      if (extra) {
        fragments.push({ text: extra, evidence });
      }
    }

    if (isPartial || stale) {
      const reasonParts = [];
      if (stale) {
        reasonParts.push('based on source before the last edit');
      }
      if (isPartial) {
        reasonParts.push(`completeness: ${completeness}`);
      }
      fragments.push({
        text: `Analysis status: ${reasonParts.join('; ')}.`,
        evidence,
      });
    }

    const summaryStatus = stale
      ? 'stale'
      : counts.unresolved > 0
        ? 'unresolved'
        : counts.possible > 0
          ? 'possible'
          : isPartial
            ? 'inferred'
            : 'resolved';
    if (summaryStatus === 'inferred' && !fragments.some((f) => /\binferred from\b/i.test(f.text))) {
      fragments.push({
        text: `${qualifyStatus('inferred', { basis: `${completeness} analysis` })}.`,
        evidence,
      });
    } else if (
      summaryStatus === 'possible' &&
      !fragments.some((f) => /\bpossible\b/i.test(f.text))
    ) {
      fragments.push({
        text: `Includes ${counts.possible} possible call target(s).`,
        evidence,
      });
    } else if (
      summaryStatus === 'unresolved' &&
      !fragments.some((f) => /\bunresolved\b/i.test(f.text))
    ) {
      fragments.push({
        text: `Includes unresolved targets (${counts.unresolved}).`,
        evidence,
      });
    }

    items.push({
      ruleId: 'fn.summary',
      topic: 'function_summary',
      status: summaryStatus,
      claim: summaryStatus === 'resolved' ? 'grounded' : 'qualified',
      fragments,
    });
  }

  const limitationsText = formatLimitations({
    completeness,
    unresolvedEdges: shape.unresolvedEdges,
    unmodeledCount: shape.unmodeledCount,
    degradations: fnFacts.degradations,
    stale,
  });
  if (depth >= 4 && limitationsText) {
    const limitStatus = stale
      ? 'stale'
      : shape.unresolvedEdges > 0 || shape.unmodeledCount > 0
        ? 'unresolved'
        : 'inferred';
    const qualifier =
      limitStatus === 'inferred'
        ? `${limitationsText.slice(0, -1)}, inferred from recorded degradations.`
        : limitationsText;
    items.push({
      ruleId: 'fn.limitations',
      topic: 'function_summary',
      status: limitStatus,
      claim: 'qualified',
      fragments: [{ text: qualifier, evidence }],
    });
  }

  return items;
}
