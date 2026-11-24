/**
 * Condition and branch explanation rules (Phase 6 §8.2).
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runConditionRules(ctx) {
  const { node, nodeFacts, depth, stale } = ctx;
  const cond = nodeFacts?.condition;
  const branch = nodeFacts?.branch;
  if (!cond && !branch) {
    return [];
  }

  const evidence = [
    rangeEvidence(node.range, node.id) ??
      createEvidenceRef({
        kind: 'construct',
        id: node.constructId || node.id,
        label: `${node.kind} condition`,
      }),
  ].filter(Boolean);
  if (evidence.length === 0) {
    return [];
  }

  const items = [];
  const status = stale ? 'stale' : node.status;
  const claim = status === 'resolved' ? 'grounded' : 'qualified';

  if (cond && cond.kind === 'condition') {
    if (cond.isNullish) {
      items.push({
        ruleId: 'cond.nullish',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: `Checks whether \`${cond.leftOperand || cond.label}\` is nullish before evaluating the fallback operand.`,
            evidence,
          },
        ],
      });
    } else if (cond.isOptionalChain) {
      items.push({
        ruleId: 'cond.optional_chain',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: `Guards member access on \`${cond.leftOperand || cond.label}\` against null or undefined.`,
            evidence,
          },
        ],
      });
    } else if (cond.isShortCircuit && (cond.operator === '&&' || cond.operator === '||')) {
      const orderNote =
        cond.operator === '&&'
          ? 'evaluates the right operand only when the left operand is truthy'
          : 'evaluates the right operand only when the left operand is falsy';
      items.push({
        ruleId: 'cond.conjunction',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: `Evaluates \`${cond.leftOperand || cond.label}\` (${cond.operator}) and ${orderNote}.`,
            evidence,
          },
        ],
      });
    } else if (cond.leftOperand && cond.rightOperand && cond.operator) {
      items.push({
        ruleId: 'cond.comparison',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: `Tests \`${cond.leftOperand} ${cond.operator} ${cond.rightOperand}\`.`,
            evidence,
          },
        ],
      });
    } else if (cond.isNegated) {
      items.push({
        ruleId: 'cond.negated',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: `Negates the condition \`${cond.label}\` and swaps the taken/not-taken edges.`,
            evidence,
          },
        ],
      });
    } else {
      const text = `Evaluates condition \`${cond.label}\``;
      items.push({
        ruleId: 'cond.comparison',
        topic: 'condition',
        status,
        claim,
        fragments: [
          {
            text: stale ? `${qualifyStatus('stale', { action: text })}.` : `${text}.`,
            evidence,
          },
        ],
      });
    }
  }

  if (branch && depth >= 2) {
    if (cond?.kind === 'multiway') {
      const cases = branch.caseLabels.length > 0 ? branch.caseLabels.join(', ') : 'labeled arms';
      items.push({
        ruleId: 'branch.multiway',
        topic: 'branch',
        status,
        claim,
        fragments: [
          {
            text: `Dispatches on \`${cond.label}\` across ${branch.armCount} arms (${cases}${branch.hasDefault ? ', plus default' : ''}).`,
            evidence,
          },
        ],
      });
    } else if (branch.hasEarlyReturnArm) {
      items.push({
        ruleId: 'branch.early_return',
        topic: 'branch',
        status,
        claim,
        fragments: [
          {
            text: `When \`${cond?.label || 'the condition'}\` holds, this branch exits via \`${branch.trueLabel || 'return'}\`; otherwise execution follows the alternative path.`,
            evidence,
          },
        ],
      });
    } else if (branch.hasThrowArm) {
      items.push({
        ruleId: 'branch.throw_arm',
        topic: 'branch',
        status: stale ? 'stale' : 'inferred',
        claim: 'qualified',
        fragments: [
          {
            text: `One arm enters a failure path (\`throw\`), ${qualifyStatus('inferred', { basis: 'exception-edge modeling' })}.`,
            evidence,
          },
        ],
      });
    } else if (branch.elseMissing) {
      items.push({
        ruleId: 'branch.else_missing',
        topic: 'branch',
        status,
        claim,
        fragments: [
          {
            text: `When \`${cond?.label || 'the condition'}\` holds, control enters \`${branch.trueLabel || 'the then-branch'}\`; otherwise control skips directly to the merge point (no else branch).`,
            evidence,
          },
        ],
      });
    } else if (branch.trueLabel || branch.falseLabel) {
      items.push({
        ruleId: 'branch.two_arm',
        topic: 'branch',
        status,
        claim,
        fragments: [
          {
            text: `Two-way branch: true enters \`${branch.trueLabel || 'then'}\`; false enters \`${branch.falseLabel || 'else'}\`.`,
            evidence,
          },
        ],
      });
    }
  }

  if (branch && depth >= 3 && cond?.calls?.length > 0) {
    items.push({
      ruleId: 'branch.interaction',
      topic: 'branch',
      status: stale ? 'stale' : cond.calls[0].status,
      claim: cond.calls[0].status === 'resolved' && !stale ? 'grounded' : 'qualified',
      fragments: [
        {
          text: `Branch selection depends on call \`${cond.calls[0].label}\` (${cond.calls[0].status}).`,
          evidence,
        },
      ],
    });
  }

  return items;
}
