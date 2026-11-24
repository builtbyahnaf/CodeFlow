/**
 * Variable, mutation, and foundational data-dependency rules (Phase 6 §8.5, §8.7).
 */

import { createEvidenceRef } from '../model.js';
import { rangeEvidence } from '../facts.js';
import { qualifyStatus } from '../phrasing.js';

/**
 * @param {Record<string, any>} ctx
 * @returns {Array<Record<string, any>>}
 */
export function runVariableRules(ctx) {
  const { node, nodeFacts, depth, stale } = ctx;
  const variables = nodeFacts?.variables ?? [];
  const dependencies = nodeFacts?.dependencies ?? [];
  const items = [];

  for (const variable of variables) {
    const evidence = [
      rangeEvidence(variable.declarationRange, variable.symbolId) ??
        createEvidenceRef({
          kind: 'semantic',
          id: variable.symbolId,
          label: variable.name,
        }),
      createEvidenceRef({
        kind: 'semantic',
        id: variable.symbolId,
        label: `${variable.declarationKind} ${variable.name}`,
      }),
    ].filter(Boolean);
    if (evidence.length === 0) {
      continue;
    }

    const status = stale ? 'stale' : 'resolved';
    const claim = stale ? 'qualified' : 'grounded';
    const initNote = variable.hasInitializer ? 'with an initializer' : 'without an initializer';
    const firstUse =
      variable.readLines.length > 0
        ? ` and first read at line ${variable.readLines[0]}`
        : '';

    items.push({
      ruleId: 'var.declare',
      topic: 'variable',
      status,
      claim,
      fragments: [
        {
          text: `Declares \`${variable.name}\` (${variable.declarationKind}) ${initNote}${firstUse}.`,
          evidence,
        },
      ],
    });

    if (depth >= 2 && variable.reassignCount > 0) {
      const lines = variable.writeLines.map((line) => `line ${line}`).join(', ');
      items.push({
        ruleId: 'var.reassign',
        topic: 'mutation',
        status,
        claim,
        fragments: [
          {
            text: `\`${variable.name}\` is reassigned ${variable.reassignCount} time(s) after declaration (${lines}).`,
            evidence,
          },
        ],
      });
    }

    if (depth >= 2 && variable.capturedBy.length > 0) {
      items.push({
        ruleId: 'var.captured',
        topic: 'variable',
        status: stale ? 'stale' : 'inferred',
        claim: 'qualified',
        fragments: [
          {
            text: `\`${variable.name}\` is captured by nested closure(s) (${variable.capturedBy.join(', ')}), ${qualifyStatus('inferred', { basis: 'lexical capture analysis' })}.`,
            evidence,
          },
        ],
      });
    }

    if (depth >= 2 && variable.isShadowed) {
      items.push({
        ruleId: 'var.shadowed',
        topic: 'variable',
        status,
        claim,
        fragments: [
          {
            text: `\`${variable.name}\` shares a name with an outer or sibling binding; references inside this scope bind to this declaration.`,
            evidence,
          },
        ],
      });
    }

    if (depth >= 2 && variable.hasTdzRisk) {
      items.push({
        ruleId: 'var.tdz_risk',
        topic: 'variable',
        status: stale ? 'stale' : 'inferred',
        claim: 'qualified',
        fragments: [
          {
            text: `\`${variable.name}\` appears in a reference before its declaration line in the same lexical scope, ${qualifyStatus('inferred', { basis: 'TDZ ordering check' })}.`,
            evidence,
          },
        ],
      });
    }

    if (depth >= 2 && variable.isUnused) {
      items.push({
        ruleId: 'var.unused',
        topic: 'variable',
        status,
        claim,
        fragments: [
          {
            text: `\`${variable.name}\` is declared and has no recorded reads in this scope.`,
            evidence,
          },
        ],
      });
    }
  }

  if (depth >= 3) {
    for (const dep of dependencies) {
      const evidence = [
        rangeEvidence(dep.range ?? node.range, dep.symbolId) ??
          createEvidenceRef({
            kind: 'semantic',
            id: dep.symbolId,
            label: dep.name,
          }),
      ].filter(Boolean);
      if (evidence.length === 0) {
        continue;
      }

      if (dep.overwrittenBeforeRead && dep.overwriteLine) {
        items.push({
          ruleId: 'dep.overwritten',
          topic: 'dependency',
          status: stale ? 'stale' : 'resolved',
          claim: stale ? 'qualified' : 'grounded',
          fragments: [
            {
              text: `The value assigned to \`${dep.name}\` at line ${dep.defLine} is overwritten at line ${dep.overwriteLine} before any recorded read.`,
              evidence,
            },
          ],
        });
      }

      if (dep.useLines.length > 0) {
        if (dep.crossesUnresolvedCall) {
          items.push({
            ruleId: 'dep.chain',
            topic: 'dependency',
            status: stale ? 'stale' : 'unresolved',
            claim: 'qualified',
            fragments: [
              {
                text: `Data-dependency chaining for \`${dep.name}\` from line ${dep.defLine} to line ${dep.useLines[0]} ${qualifyStatus('unresolved', { reason: 'chain crosses an unresolved or uncertain call' })}.`,
                evidence,
              },
            ],
          });
        } else {
          items.push({
            ruleId: 'dep.def_use',
            topic: 'dependency',
            status: stale ? 'stale' : 'resolved',
            claim: stale ? 'qualified' : 'grounded',
            fragments: [
              {
                text: `\`${dep.name}\` is defined at line ${dep.defLine} and read at line(s) ${dep.useLines.join(', ')}.`,
                evidence,
              },
            ],
          });
        }
      }
    }
  }

  return items;
}
