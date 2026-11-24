/**
 * Pattern recognition and complexity rules with strict proof obligations (Phase 6 §8.8, §8.9).
 *
 * Unproven patterns fall back to structural descriptions; `binary search` is
 * prohibited; complexity outside strict preconditions states that no claim can
 * be made.
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runPatternAndComplexityRules(ctx) {
  const { fnFacts, cfg, depth, stale, subjectKind, node } = ctx;
  if (depth < 4) {
    return [];
  }

  const items = [];
  const patterns = fnFacts?.patterns ?? [];
  const relevantPatterns =
    subjectKind === 'node' && node
      ? patterns.filter((pattern) => pattern.nodeId === node.id)
      : patterns;

  for (const pattern of relevantPatterns) {
    const evidence = [
      rangeEvidence(pattern.range ?? cfg.function?.range, pattern.nodeId || cfg.symbolId) ??
        createEvidenceRef({
          kind: 'construct',
          id: pattern.nodeId || cfg.symbolId || 'pattern',
          label: pattern.id,
        }),
    ].filter(Boolean);
    if (evidence.length === 0) {
      continue;
    }

    const status = stale ? 'stale' : pattern.proven ? 'resolved' : 'inferred';
    const claim = pattern.proven && !stale ? 'grounded' : 'qualified';

    switch (pattern.id) {
      case 'accumulation':
        items.push({
          ruleId: 'pattern.accumulation',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: `Matches an accumulation loop over \`${pattern.accumulatorName}\` with a single accumulator write derived from the loop value.`,
              evidence,
            },
          ],
        });
        break;
      case 'linear_search':
        items.push({
          ruleId: 'pattern.linear_search',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: 'Matches a linear scan with an element-comparison early exit.',
              evidence,
            },
          ],
        });
        break;
      case 'nested_pairwise':
        items.push({
          ruleId: 'pattern.nested_pairwise',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: 'Matches a nested pairwise comparison across two enclosing loops over the same collection.',
              evidence,
            },
          ],
        });
        break;
      case 'recursion':
        items.push({
          ruleId: 'pattern.recursion',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: pattern.proven
                ? 'Exhibits direct recursion with a base-case return branch.'
                : `Exhibits direct recursion (${pattern.detail}), ${qualifyStatus('inferred', { basis: 'call-edge cycle without proven base case' })}.`,
              evidence,
            },
          ],
        });
        break;
      case 'divide_and_conquer':
        items.push({
          ruleId: 'pattern.divide_and_conquer',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: 'Matches recursive subproblem splitting with a base-case branch and combine step.',
              evidence,
            },
          ],
        });
        break;
      case 'memoization':
        items.push({
          ruleId: 'pattern.memoization',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: 'Matches a memoized lookup: reads cached entry before computation and stores the result by the same key.',
              evidence,
            },
          ],
        });
        break;
      case 'higher_order_collection':
        items.push({
          ruleId: 'pattern.higher_order',
          topic: 'pattern',
          status,
          claim,
          fragments: [
            {
              text: `Uses resolved collection operation \`${pattern.methodName}\` with a callback.`,
              evidence,
            },
          ],
        });
        break;
      case 'bounds_narrowing':
        items.push({
          ruleId: 'pattern.bounds_narrowing',
          topic: 'pattern',
          status: stale ? 'stale' : 'inferred',
          claim: 'qualified',
          fragments: [
            {
              text: `Narrows index bounds inside a loop (${qualifyStatus('inferred', { basis: 'structural bound updates only; ordering preconditions are not statically established' })}).`,
              evidence,
            },
          ],
        });
        break;
      default:
        break;
    }
  }

  // Complexity claims apply at function scope (or when inspecting a loop node).
  const complexity = fnFacts?.complexity;
  const emitComplexity =
    complexity &&
    (subjectKind === 'function' || (subjectKind === 'node' && node?.id === complexity.nodeId));
  if (emitComplexity) {
    const evidence = [
      rangeEvidence(complexity.range ?? cfg.function?.range, complexity.nodeId || cfg.symbolId) ??
        createEvidenceRef({
          kind: 'construct',
          id: complexity.nodeId || cfg.symbolId || 'complexity',
          label: 'complexity basis',
        }),
    ].filter(Boolean);
    if (evidence.length > 0) {
      if (complexity.kind === 'literal_bound') {
        items.push({
          ruleId: 'complexity.literal_bound',
          topic: 'complexity',
          status: stale ? 'stale' : 'resolved',
          claim: stale ? 'qualified' : 'grounded',
          fragments: [
            {
              text: `Loop count is bounded by the literal ${complexity.bound}.`,
              evidence,
            },
          ],
        });
      } else if (complexity.kind === 'structural_upper_bound') {
        items.push({
          ruleId: 'complexity.structural_upper_bound',
          topic: 'complexity',
          status: stale ? 'stale' : 'inferred',
          claim: 'qualified',
          fragments: [
            {
              text: `Structural upper bound ${complexity.notation}: for the loop structure, work grows with the number of elements × nesting depth (${complexity.depth}), ${qualifyStatus('inferred', { basis: 'static loop nesting without early exits' })}.`,
              evidence,
            },
          ],
        });
      } else if (complexity.kind === 'input_dependent') {
        items.push({
          ruleId: 'complexity.input_dependent',
          topic: 'complexity',
          status: stale ? 'stale' : 'inferred',
          claim: 'qualified',
          fragments: [
            {
              text: `Iteration count depends on input size (loop depth ${complexity.depth}), ${qualifyStatus('inferred', { basis: 'collection iteration without static size' })}.`,
              evidence,
            },
          ],
        });
      } else if (complexity.kind === 'nested_depth') {
        items.push({
          ruleId: 'complexity.nested_depth',
          topic: 'complexity',
          status: stale ? 'stale' : 'resolved',
          claim: stale ? 'qualified' : 'grounded',
          fragments: [
            {
              text: `Nested loop depth is ${complexity.depth}.`,
              evidence,
            },
          ],
        });
      } else if (subjectKind === 'function' && (fnFacts.functionShape?.loopCount > 0 || complexity.reason)) {
        items.push({
          ruleId: 'complexity.unavailable',
          topic: 'complexity',
          status: stale ? 'stale' : 'unresolved',
          claim: 'qualified',
          fragments: [
            {
              text: `No complexity claim can be made from the available analysis (${qualifyStatus('unresolved', { reason: complexity.reason || 'unbounded control flow' })}).`,
              evidence,
            },
          ],
        });
      }
    }
  }

  return items;
}
