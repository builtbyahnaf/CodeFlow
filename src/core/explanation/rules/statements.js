/**
 * Statement-level explanation rules (Phase 6 §8.1).
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runStatementRules(ctx) {
  const { node, nodeFacts, stale } = ctx;
  const stmt = nodeFacts?.statement;
  if (!stmt) {
    return [];
  }

  const primaryEvidence =
    rangeEvidence(node.range, node.id) ??
    createEvidenceRef({
      kind: 'construct',
      id: node.constructId || node.id,
      label: `${node.kind} node`,
    });
  if (!primaryEvidence) {
    return [];
  }
  const evidence = [primaryEvidence];
  if (node.constructId) {
    const constructRef = createEvidenceRef({
      kind: 'construct',
      id: node.constructId,
      label: `${node.kind} construct`,
    });
    if (constructRef) {
      evidence.push(constructRef);
    }
  }

  const items = [];
  const status = stale ? 'stale' : node.status;
  const claim = status === 'resolved' ? 'grounded' : 'qualified';

  if (stmt.synthetic) {
    const text =
      node.kind === 'entry'
        ? 'Marks the entry point of this function.'
        : node.kind === 'exit'
          ? 'Marks the normal exit point of this function.'
          : 'Joins incoming control-flow paths.';
    items.push({
      ruleId: 'stmt.synthetic',
      topic: 'statement',
      status: stale ? 'stale' : 'resolved',
      claim: stale ? 'qualified' : 'grounded',
      fragments: [
        {
          text: stale ? qualifyStatus('stale', { action: text.slice(0, -1) }) : text,
          evidence,
        },
      ],
    });
    return items;
  }

  if (stmt.unreachable) {
    items.push({
      ruleId: 'stmt.unreachable',
      topic: 'statement',
      status: stale ? 'stale' : 'resolved',
      claim: stale ? 'qualified' : 'grounded',
      fragments: [
        {
          text: `Unreachable statement after an earlier exit or jump (${stmt.label}).`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (node.kind === 'unmodeled') {
    const reason = node.reasonCode || 'unsupported_construct';
    items.push({
      ruleId: 'stmt.unmodeled',
      topic: 'statement',
      status: 'unresolved',
      claim: 'qualified',
      fragments: [
        {
          text: `Control flow for \`${stmt.label}\` ${qualifyStatus('unresolved', { reason })}.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (node.kind === 'await') {
    const target = stmt.awaitTarget || stmt.label.replace(/^await\s+/, '') || 'the awaited expression';
    items.push({
      ruleId: 'stmt.await',
      topic: 'statement',
      status,
      claim,
      fragments: [
        {
          text: `Suspends execution until \`${target}\` settles.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (node.kind === 'throw') {
    const target = stmt.throwValue || stmt.label.replace(/^throw\s+/, '') || 'an error value';
    items.push({
      ruleId: 'stmt.throw',
      topic: 'statement',
      status: stale ? 'stale' : 'inferred',
      claim: 'qualified',
      fragments: [
        {
          text: `Throws \`${target}\`, ${qualifyStatus('inferred', { basis: 'static exception path modeling' })}.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (node.kind === 'return' && nodeFacts.ret) {
    const ruleId = nodeFacts.ret.hasValue ? 'stmt.return.value' : 'stmt.return.void';
    const expr = nodeFacts.ret.valueText || node.label.replace(/^return\s*/, '') || 'a value';
    const text = nodeFacts.ret.hasValue
      ? `Returns \`${expr}\`.`
      : 'Exits the function without a return value.';
    items.push({
      ruleId,
      topic: 'return',
      status: stale ? 'stale' : 'resolved',
      claim: stale ? 'qualified' : 'grounded',
      fragments: [
        {
          text: stale ? qualifyStatus('stale', { action: text.slice(0, -1) }) : text,
          evidence,
        },
      ],
    });
    return items;
  }

  if (stmt.isMultiAssign) {
    items.push({
      ruleId: 'stmt.assign.multi',
      topic: 'mutation',
      status,
      claim,
      fragments: [
        {
          text: `Assigns \`${stmt.targetNames.join('`, `')}\` from ${stmt.valueText || 'the right-hand values'}.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (stmt.isAssignment && stmt.targetName) {
    items.push({
      ruleId: 'stmt.assign',
      topic: 'mutation',
      status,
      claim,
      fragments: [
        {
          text: `Sets \`${stmt.targetName}\` to ${stmt.valueText ? `\`${stmt.valueText}\`` : 'the computed value'}.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (stmt.isIncrement && stmt.incrementTarget) {
    const step = stmt.incrementStep ?? 1;
    items.push({
      ruleId: 'stmt.increment',
      topic: 'mutation',
      status,
      claim,
      fragments: [
        {
          text: `Increments \`${stmt.incrementTarget}\` by ${step}.`,
          evidence,
        },
      ],
    });
    return items;
  }

  if (node.kind === 'call' && nodeFacts.call) {
    const first = nodeFacts.call.targets?.[0]?.label || node.label;
    const ruleId = nodeFacts.call.resultUsed ? 'stmt.call.used' : 'stmt.call.unused';
    const callPhrase = nodeFacts.call.resultUsed
      ? `Calls \`${first}\` and uses the returned value`
      : `Calls \`${first}\` and discards any return value`;
    const qualified =
      nodeFacts.call.status === 'resolved'
        ? `${callPhrase}.`
        : `${qualifyStatus(nodeFacts.call.status, {
            action: callPhrase,
            count: nodeFacts.call.targetCount,
            reason: nodeFacts.call.targets?.[0]?.reasonCode,
          })}.`;
    items.push({
      ruleId,
      topic: 'call',
      status: stale ? 'stale' : nodeFacts.call.status,
      claim: nodeFacts.call.status === 'resolved' && !stale ? 'grounded' : 'qualified',
      fragments: [{ text: qualified, evidence }],
    });
    return items;
  }

  if (node.kind === 'statement') {
    const baseText = `Executes statement \`${stmt.label}\``;
    items.push({
      ruleId: 'stmt.generic',
      topic: 'statement',
      status,
      claim,
      fragments: [
        {
          text: stale ? `${qualifyStatus('stale', { action: baseText })}.` : `${baseText}.`,
          evidence,
        },
      ],
    });
  }

  return items;
}
