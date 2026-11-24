/**
 * Deterministic Explanation Engine (Phase 6).
 *
 * Consumes CSR query layer + CFG, runs pure rules in deterministic priority
 * order, enforces non-empty evidence and prohibited-phrasing linting, and
 * caches by `(runId, rulesetVersion, depth, stale, subjectKey)`.
 */

import {
  RULESET_VERSION,
  assembleFragments,
  explanationId,
  validateExplanationItem,
} from './model.js';
import { ensureStatusQualification, lintExplanationText } from './phrasing.js';
import { clampExplanationDepth, resolveExplanationSettings } from './settings.js';
import { createExplanationCache } from './cache.js';
import { extractFunctionFacts, extractNodeFacts } from './facts.js';
import { RULE_GROUPS } from './rules/catalog.js';

/**
 * @typedef {ReturnType<typeof import('../csr/query.js').createQueryLayer>} QueryLayer
 * @typedef {import('../graph/cfg/builder.js').Cfg} Cfg
 */

/**
 * @param {{
 *   rulesetVersion?: string,
 *   ruleGroups?: typeof RULE_GROUPS,
 *   maxCacheEntries?: number,
 * }} [options]
 */
export function createExplanationEngine(options = {}) {
  const rulesetVersion = options.rulesetVersion ?? RULESET_VERSION;
  const ruleGroups = Array.isArray(options.ruleGroups) ? options.ruleGroups : RULE_GROUPS;
  const itemCache = createExplanationCache({ maxEntries: options.maxCacheEntries ?? 256 });
  /** @type {Map<string, Record<string, any>>} */
  const factCache = new Map();

  /**
   * @param {QueryLayer} query
   * @param {Cfg} cfg
   * @returns {Record<string, any>}
   */
  function getFunctionFacts(query, cfg) {
    const info = query.runInfo?.();
    const runId = info?.ok ? info.value.runId : cfg.runId;
    const key = `${runId}|${cfg.graphId ?? cfg.symbolId}`;
    let facts = factCache.get(key);
    if (!facts) {
      facts = extractFunctionFacts(query, cfg);
      factCache.set(key, facts);
      if (factCache.size > 64) {
        const oldest = factCache.keys().next();
        if (!oldest.done) {
          factCache.delete(oldest.value);
        }
      }
    }
    return facts;
  }

  /**
   * Execute rule groups safely, isolating any throwing rule so one failure
   * never suppresses other rules.
   *
   * @param {Record<string, any>} ctx
   * @param {'node'|'function'} subjectKind
   * @param {string} subjectId
   * @returns {{items: import('./model.js').ExplanationItem[], droppedFragments: number, ruleErrors: Array<{groupId: string, message: string}>, lintViolations: Array<{ruleId: string, violations: Array<{id: string, message: string}>}>}}
   */
  function runCatalog(ctx, subjectKind, subjectId) {
    /** @type {import('./model.js').ExplanationItem[]} */
    const items = [];
    /** @type {Array<{groupId: string, message: string}>} */
    const ruleErrors = [];
    /** @type {Array<{ruleId: string, violations: Array<{id: string, message: string}>}>} */
    const lintViolations = [];
    let droppedFragments = 0;

    for (const group of ruleGroups) {
      if (group.subject !== 'both' && group.subject !== subjectKind) {
        continue;
      }
      if (ctx.depth < group.minDepth) {
        continue;
      }
      /** @type {Array<Record<string, any>>} */
      let drafts = [];
      try {
        drafts = group.run(ctx) ?? [];
      } catch (error) {
        ruleErrors.push({
          groupId: group.id,
          message: error instanceof Error ? error.message : String(error),
        });
        continue;
      }

      for (const draft of drafts) {
        const assembled = assembleFragments(draft.fragments);
        droppedFragments += assembled.droppedCount;
        if (!assembled.text || assembled.evidence.length === 0) {
          continue;
        }
        const candidate = {
          id: explanationId(subjectId, draft.ruleId, ctx.depth, rulesetVersion),
          subjectId,
          topic: draft.topic,
          depth: ctx.depth,
          text: ensureStatusQualification(assembled.text, draft.status),
          evidence: assembled.evidence,
          claim: draft.claim,
          ...(draft.status ? { status: draft.status } : {}),
          ruleId: draft.ruleId,
          rulesetVersion,
        };
        const validated = validateExplanationItem(candidate);
        if (!validated.ok) {
          ruleErrors.push({
            groupId: draft.ruleId,
            message: validated.issues.join(' '),
          });
          continue;
        }
        const lint = lintExplanationText(validated.value.text, {
          status: validated.value.status,
        });
        if (!lint.ok) {
          lintViolations.push({ ruleId: validated.value.ruleId, violations: lint.violations });
          continue;
        }
        items.push(validated.value);
      }
    }

    return { items, droppedFragments, ruleErrors, lintViolations };
  }

  /**
   * Explain a single CFG node at the requested depth (1–4).
   *
   * @param {{
   *   query: QueryLayer,
   *   cfg: Cfg,
   *   nodeId: string,
   *   depth?: number,
   *   stale?: boolean,
   *   settings?: Record<string, unknown>,
   * }} input
   */
  function explainNode(input) {
    const resolvedSettings = resolveExplanationSettings(input.settings);
    const depth = clampExplanationDepth(input.depth ?? resolvedSettings.defaultDepth);
    const stale = Boolean(input.stale);
    const fnFacts = getFunctionFacts(input.query, input.cfg);
    const nodeFacts = extractNodeFacts(input.nodeId, fnFacts, input.cfg);
    if (!nodeFacts) {
      return {
        ok: false,
        code: 'E_NOT_FOUND',
        message: `No CFG node "${String(input.nodeId)}" in this graph.`,
      };
    }

    const cacheKey = {
      runId: fnFacts.runId,
      rulesetVersion,
      depth,
      stale,
      subjectKey: `node:${input.cfg.symbolId}:${input.nodeId}`,
    };
    const hit = itemCache.get(cacheKey);
    if (hit) {
      return { ...hit, cached: true };
    }

    const result = runCatalog(
      {
        subjectKind: 'node',
        query: input.query,
        cfg: input.cfg,
        fnFacts,
        nodeFacts,
        node: nodeFacts.node,
        depth,
        stale,
        settings: resolvedSettings,
      },
      'node',
      input.nodeId,
    );

    const summary = result.items.map((item) => item.text).join(' ');
    const payload = {
      ok: true,
      subjectKind: 'node',
      subjectId: input.nodeId,
      depth,
      stale,
      rulesetVersion,
      items: result.items,
      summary,
      limitations:
        depth >= 4
          ? result.items
              .filter((item) => item.ruleId === 'fn.limitations')
              .map((item) => item.text)
          : [],
      diagnostics: {
        droppedFragments: result.droppedFragments,
        ruleErrors: result.ruleErrors,
        lintViolations: result.lintViolations,
      },
      cached: false,
    };
    itemCache.set(cacheKey, payload);
    return payload;
  }

  /**
   * Explain an entire function (summary, patterns, complexity, limitations).
   *
   * @param {{
   *   query: QueryLayer,
   *   cfg: Cfg,
   *   depth?: number,
   *   stale?: boolean,
   *   settings?: Record<string, unknown>,
   * }} input
   */
  function explainFunction(input) {
    const resolvedSettings = resolveExplanationSettings(input.settings);
    const depth = clampExplanationDepth(input.depth ?? resolvedSettings.defaultDepth);
    const stale = Boolean(input.stale);
    const fnFacts = getFunctionFacts(input.query, input.cfg);
    const subjectId = input.cfg.symbolId ?? input.cfg.function?.symbolId ?? '';

    const cacheKey = {
      runId: fnFacts.runId,
      rulesetVersion,
      depth,
      stale,
      subjectKey: `fn:${subjectId}`,
    };
    const hit = itemCache.get(cacheKey);
    if (hit) {
      return { ...hit, cached: true };
    }

    const result = runCatalog(
      {
        subjectKind: 'function',
        query: input.query,
        cfg: input.cfg,
        fnFacts,
        nodeFacts: null,
        node: null,
        depth,
        stale,
        settings: resolvedSettings,
      },
      'function',
      subjectId,
    );

    const summaryItem = result.items.find((item) => item.ruleId === 'fn.summary');
    const limitations = result.items
      .filter((item) => item.ruleId === 'fn.limitations')
      .map((item) => item.text);

    const payload = {
      ok: true,
      subjectKind: 'function',
      subjectId,
      depth,
      stale,
      rulesetVersion,
      items: result.items,
      summary: summaryItem?.text ?? result.items.map((item) => item.text).join(' '),
      limitations,
      diagnostics: {
        droppedFragments: result.droppedFragments,
        ruleErrors: result.ruleErrors,
        lintViolations: result.lintViolations,
      },
      cached: false,
    };
    itemCache.set(cacheKey, payload);
    return payload;
  }

  return {
    rulesetVersion,
    explainNode,
    explainFunction,
    invalidateRun(runId) {
      itemCache.invalidateRun(runId);
      for (const key of [...factCache.keys()]) {
        if (key.startsWith(`${runId}|`)) {
          factCache.delete(key);
        }
      }
    },
    clearCache() {
      itemCache.clear();
      factCache.clear();
    },
    cacheStats: () => itemCache.stats(),
  };
}
