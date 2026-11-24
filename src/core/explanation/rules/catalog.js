/**
 * Deterministic explanation rule catalog (Phase 6 §8, §10).
 */

import { runStatementRules } from './statements.js';
import { runConditionRules } from './conditions.js';
import { runLoopRules } from './loops.js';
import { runCallRules } from './calls.js';
import { runVariableRules } from './variables.js';
import { runFunctionSummaryRules } from './summary.js';
import { runPatternAndComplexityRules } from './patterns.js';

export const RULE_GROUPS = Object.freeze([
  Object.freeze({
    id: 'group.statements',
    subject: 'node',
    minDepth: 1,
    proofObligation: 'Requires a CFG node with a source range or construct id.',
    run: runStatementRules,
  }),
  Object.freeze({
    id: 'group.conditions',
    subject: 'node',
    minDepth: 1,
    proofObligation: 'Requires a condition/multiway CFG node and outgoing CFG edges.',
    run: runConditionRules,
  }),
  Object.freeze({
    id: 'group.loops',
    subject: 'node',
    minDepth: 1,
    proofObligation: 'Requires a loop_header/loop_body_entry node; exact count requires literal bound+step and no early exit.',
    run: runLoopRules,
  }),
  Object.freeze({
    id: 'group.calls',
    subject: 'node',
    minDepth: 1,
    proofObligation: 'Requires call relationships attached to the node or return nodes in the CFG.',
    run: runCallRules,
  }),
  Object.freeze({
    id: 'group.variables',
    subject: 'node',
    minDepth: 1,
    proofObligation: 'Requires CSR variable/parameter symbols or DataFact records anchored at the node line.',
    run: runVariableRules,
  }),
  Object.freeze({
    id: 'group.function_summary',
    subject: 'both',
    minDepth: 1,
    proofObligation: 'Requires extracted function shape, counts, and completeness from CSR+CFG.',
    run: runFunctionSummaryRules,
  }),
  Object.freeze({
    id: 'group.patterns_complexity',
    subject: 'both',
    minDepth: 4,
    proofObligation: 'Pattern names and complexity claims fire only when strict preconditions hold.',
    run: runPatternAndComplexityRules,
  }),
]);
