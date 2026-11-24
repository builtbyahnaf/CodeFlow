/**
 * Loop explanation rules (Phase 6 §8.3).
 *
 * Strict rule: never say "iterates N times" unless N is a literal constant
 * bound with a literal step, no early exit, and no body mutation of the bound.
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runLoopRules(ctx) {
  const { node, nodeFacts, depth, stale } = ctx;
  const loop = nodeFacts?.loop;
  if (!loop) {
    return [];
  }

  const evidence = [
    rangeEvidence(node.range, node.id) ??
      createEvidenceRef({
        kind: 'construct',
        id: node.constructId || node.id,
        label: `${loop.loopKind} loop`,
      }),
  ].filter(Boolean);
  if (evidence.length === 0) {
    return [];
  }

  const items = [];
  const status = stale ? 'stale' : loop.iterableOpaque ? 'inferred' : node.status;
  const claim = status === 'resolved' ? 'grounded' : 'qualified';

  if (loop.loopKind === 'for') {
    const canStateExactCount =
      loop.hasLiteralBound &&
      loop.hasLiteralStep &&
      !loop.hasEarlyExit &&
      !loop.boundMutatedInBody;
    const parts = [];
    if (loop.initializerText) {
      parts.push(`initializer \`${loop.initializerText}\``);
    }
    if (loop.boundText) {
      parts.push(`bound \`${loop.boundText}\``);
    } else {
      parts.push(`condition \`${loop.label}\``);
    }
    if (loop.stepText) {
      parts.push(`step \`${loop.stepText}\``);
    }
    const baseText = canStateExactCount
      ? `Counter loop (${parts.join(', ')}) iterates ${loop.literalBoundValue} times with literal bound and step and no early exit.`
      : `Counter loop checks ${parts.join(', ')}.`;
    items.push({
      ruleId: 'loop.for.counter',
      topic: 'loop',
      status,
      claim,
      fragments: [{ text: baseText, evidence }],
    });
  } else if (loop.loopKind === 'foreach') {
    const binding = loop.bindingText || 'each element';
    const iterable = loop.iterableText || loop.label;
    const baseText = `Iterates \`${binding}\` over \`${iterable}\``;
    items.push({
      ruleId: 'loop.foreach',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: loop.iterableOpaque
            ? `${qualifyStatus('inferred', { action: baseText, basis: 'iteration_source_opaque' })}.`
            : `${baseText}.`,
          evidence,
        },
      ],
    });
  } else if (loop.loopKind === 'do_while') {
    items.push({
      ruleId: 'loop.do_while',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: `Post-test loop executes its body once before checking \`${loop.label}\`.`,
          evidence,
        },
      ],
    });
  } else {
    const mutationNote = loop.conditionOperandMutated
      ? ' and modifies a condition operand inside the body'
      : '';
    items.push({
      ruleId: 'loop.while.bound',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: `Pre-test loop checks \`${loop.label}\` before each iteration${mutationNote}.`,
          evidence,
        },
      ],
    });
  }

  if (depth >= 2 && loop.isEmptyBody) {
    items.push({
      ruleId: 'loop.body.empty',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: 'The loop body contains no modeled statements.',
          evidence,
        },
      ],
    });
  }

  if (depth >= 2 && loop.hasEarlyExit) {
    items.push({
      ruleId: 'loop.early_exit',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: 'The loop body contains an explicit `break`, `return`, or `throw` exit path.',
          evidence,
        },
      ],
    });
  }

  if (depth >= 2 && loop.nestedDepth > 1) {
    items.push({
      ruleId: 'loop.nested',
      topic: 'loop',
      status,
      claim,
      fragments: [
        {
          text: `Nested at loop depth ${loop.nestedDepth} inside an enclosing loop.`,
          evidence,
        },
      ],
    });
  }

  return items;
}
