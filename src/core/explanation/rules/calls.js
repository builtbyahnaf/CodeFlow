/**
 * Call and return path explanation rules (Phase 6 §8.4).
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { formatCallSummary, qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runCallRules(ctx) {
  const { node, nodeFacts, fnFacts, depth, stale } = ctx;
  const call = nodeFacts?.call;
  const items = [];

  if (call) {
    const evidence = [
      rangeEvidence(node.range, node.id) ??
        createEvidenceRef({
          kind: 'construct',
          id: node.constructId || node.id,
          label: 'call site',
        }),
    ].filter(Boolean);
    if (evidence.length > 0) {
      for (const target of call.targets ?? []) {
        const relRef = createEvidenceRef({
          kind: 'relationship',
          id: `call:${node.id}:${target.to}`,
          label: `${target.label} (${target.status})`,
        });
        if (relRef) {
          evidence.push(relRef);
        }
      }

      if (call.isSelfRecursive) {
        const argSuffix = call.argumentText ? ` with \`${call.argumentText}\`` : '';
        items.push({
          ruleId: 'call.self_recursive',
          topic: 'call',
          status: stale ? 'stale' : call.status,
          claim: call.status === 'resolved' && !stale ? 'grounded' : 'qualified',
          fragments: [
            {
              text: `Calls itself recursively${argSuffix}.`,
              evidence,
            },
          ],
        });
      } else {
        const ruleId =
          call.status === 'resolved'
            ? 'call.resolved'
            : call.status === 'inferred'
              ? 'call.inferred'
              : call.status === 'possible'
                ? 'call.possible'
                : 'call.unresolved';
        const summary = formatCallSummary(call);
        items.push({
          ruleId,
          topic: 'call',
          status: stale ? 'stale' : call.status,
          claim: call.status === 'resolved' && !stale ? 'grounded' : 'qualified',
          fragments: [
            {
              text: stale ? qualifyStatus('stale', { action: summary.slice(0, -1) }) + '.' : summary,
              evidence,
            },
          ],
        });
      }

      if (depth >= 3 && call.status !== 'resolved') {
        items.push({
          ruleId: 'call.status_effect',
          topic: 'call',
          status: stale ? 'stale' : call.status,
          claim: 'qualified',
          fragments: [
            {
              text: `Because this call is ${call.status}, downstream side effects and data dependencies across the call remain unverified.`,
              evidence,
            },
          ],
        });
      }
    }
  }

  if (node.kind === 'return' && depth >= 2 && fnFacts?.functionShape) {
    const returns = Object.values(fnFacts.returnsByNodeId ?? {});
    const evidence = [
      rangeEvidence(node.range, node.id) ??
        createEvidenceRef({
          kind: 'construct',
          id: node.constructId || node.id,
          label: 'return site',
        }),
    ].filter(Boolean);
    if (evidence.length > 0 && returns.length > 0) {
      if (returns.length === 1) {
        items.push({
          ruleId: 'return.single',
          topic: 'return',
          status: stale ? 'stale' : 'resolved',
          claim: stale ? 'qualified' : 'grounded',
          fragments: [
            {
              text: `The single return path in this function exits at line ${returns[0].line ?? '?'}.`,
              evidence,
            },
          ],
        });
      } else {
        const lines = returns
          .map((entry) => (entry.line ? `line ${entry.line}` : 'unknown line'))
          .slice(0, 6)
          .join(', ');
        items.push({
          ruleId: 'return.multiple',
          topic: 'return',
          status: stale ? 'stale' : 'resolved',
          claim: stale ? 'qualified' : 'grounded',
          fragments: [
            {
              text: `Returns from ${returns.length} points (${lines}).`,
              evidence,
            },
          ],
        });
      }
    }
  }

  return items;
}
