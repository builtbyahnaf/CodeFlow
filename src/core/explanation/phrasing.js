/**
 * Centralized qualification phrasing and prohibited-language linter.
 *
 * Every non-`resolved` status must declare its uncertainty explicitly, and no
 * generated prose may contain advice, name-based speculation, or unproven
 * algorithm claims.
 */

const UNQUALIFIED_CERTAINTY_PATTERNS = Object.freeze([
  { id: 'certainty.will_execute', pattern: /\bwill execute\b/i, message: 'Uses unqualified "will execute".' },
  { id: 'certainty.always', pattern: /\balways\b/i, message: 'Uses unqualified "always".' },
  { id: 'certainty.never', pattern: /\bnever\b/i, message: 'Uses unqualified "never".' },
]);

export const BANNED_PHRASING_RULES = Object.freeze([
  {
    id: 'advice.you_should',
    pattern: /\byou should\b/i,
    message: 'Prescriptive advice ("you should") is prohibited.',
  },
  {
    id: 'advice.consider_refactoring',
    pattern: /\bconsider refactoring\b/i,
    message: 'Prescriptive refactoring advice is prohibited.',
  },
  {
    id: 'advice.recommend',
    pattern: /\b(?:we |i )?recommend\b/i,
    message: 'Prescriptive recommendation language is prohibited.',
  },
  {
    id: 'advice.best_practice',
    pattern: /\bbest practice\b/i,
    message: 'Prescriptive "best practice" language is prohibited.',
  },
  {
    id: 'algorithm.binary_search',
    pattern: /\bbinary search\b/i,
    message: '"binary search" requires sorting evidence and must never be named.',
  },
  {
    id: 'algorithm.unproven_sort',
    pattern: /\b(?:quicksort|mergesort|merge sort|bubble sort|heapsort|heap sort)\b/i,
    message: 'Sorting algorithm names require proof not available from syntax alone.',
  },
  {
    id: 'speculation.name_intent',
    pattern: /\b(?:saves? to (?:the )?database|fetches? from (?:the )?network|sends? over (?:the )?network)\b/i,
    message: 'Name-based runtime intent speculation is prohibited.',
  },
]);

/**
 * Format status qualification text per Phase 6 §9.
 *
 * @param {'resolved'|'inferred'|'possible'|'unresolved'|'stale'} status
 * @param {{basis?: string, count?: number, reason?: string, action?: string}} [detail]
 * @returns {string}
 */
export function qualifyStatus(status, detail = {}) {
  const basis = typeof detail.basis === 'string' && detail.basis.trim() ? detail.basis.trim() : 'local static analysis';
  const reason = typeof detail.reason === 'string' && detail.reason.trim() ? detail.reason.trim() : 'static target unknown';
  const count = Number.isInteger(detail.count) && Number(detail.count) > 0 ? Number(detail.count) : 2;
  const action = typeof detail.action === 'string' && detail.action.trim() ? detail.action.trim() : '';

  switch (status) {
    case 'resolved':
      return action;
    case 'inferred':
      return action ? `${action}, inferred from ${basis}` : `inferred from ${basis}`;
    case 'possible':
      return action
        ? `${action} (one of ${count} possible targets)`
        : `may call one of ${count} possible targets`;
    case 'unresolved':
      return action
        ? `${action}, could not be resolved (${reason})`
        : `could not be resolved (${reason})`;
    case 'stale':
      return action
        ? `${action}, based on source before the last edit`
        : 'based on source before the last edit';
    default:
      return action || `status ${String(status)}`;
  }
}

/**
 * Summarize a single call target or aggregate call set without overclaiming.
 *
 * @param {{
 *   targets?: Array<{label?: string, status?: string, reasonCode?: string}>,
 *   status?: string,
 *   targetCount?: number,
 * }} callFact
 * @returns {string}
 */
export function formatCallSummary(callFact) {
  const targets = Array.isArray(callFact?.targets) ? callFact.targets : [];
  if (targets.length === 0) {
    return qualifyStatus('unresolved', { action: 'Calls a target', reason: 'no target recorded' });
  }
  const status = callFact.status ?? targets[0]?.status ?? 'unresolved';
  const names = targets
    .map((target) => target.label || 'target')
    .filter(Boolean);
  if (status === 'resolved' && targets.length === 1) {
    return `Calls \`${names[0]}\` (resolved).`;
  }
  if (status === 'inferred') {
    const basis = targets[0]?.reasonCode || 'local type or structure';
    return `Calls \`${names[0]}\` (${qualifyStatus('inferred', { basis })}).`;
  }
  if (status === 'possible') {
    const list = names.slice(0, 3).map((name) => `\`${name}\``).join(', ');
    const suffix = names.length > 3 ? ', …' : '';
    const reason = targets[0]?.reasonCode ? ` (${targets[0].reasonCode})` : '';
    return `Calls one of ${targets.length} possible targets: ${list}${suffix}${reason}.`;
  }
  const reason = targets[0]?.reasonCode || 'dynamic or unknown target';
  return `Calls a target that ${qualifyStatus('unresolved', { reason })}.`;
}

/**
 * Assemble an honest limitation disclosure whenever analysis is incomplete,
 * unresolved, unmodeled, or stale. Returns empty string when nothing is limited.
 *
 * @param {{
 *   completeness?: string,
 *   unresolvedEdges?: number,
 *   unmodeledCount?: number,
 *   degradations?: Array<{code?: string, message?: string}>,
 *   stale?: boolean,
 * }} input
 * @returns {string}
 */
export function formatLimitations(input = {}) {
  /** @type {string[]} */
  const limits = [];
  if (input.stale) {
    limits.push('source changed since this analysis (based on source before the last edit)');
  }
  if (input.completeness && input.completeness !== 'full') {
    limits.push(`analysis completeness is ${input.completeness}`);
  }
  if (Number(input.unresolvedEdges) > 0) {
    limits.push(`${input.unresolvedEdges} unresolved control-flow or call target(s)`);
  }
  if (Number(input.unmodeledCount) > 0) {
    limits.push(`${input.unmodeledCount} unmodeled construct(s)`);
  }
  const codes = [...new Set((input.degradations ?? []).map((item) => item?.code).filter(Boolean))];
  if (codes.length > 0 && limits.length === 0) {
    limits.push(`degradations recorded (${codes.join(', ')})`);
  }
  if (limits.length === 0) {
    return '';
  }
  return `What this analysis cannot establish: ${limits.join('; ')}.`;
}

/**
 * Enforce the status-mandated qualification at assembly time.
 *
 * Rules may attach the `stale` status without repeating the required phrase.
 * Centralizing the phrase here means a stale explanation is never dropped by
 * the prohibited-language linter just because one rule forgot the sentence.
 * Other statuses stay untouched: their phrasing carries rule-specific basis
 * text that must not be invented centrally.
 *
 * @param {string} text
 * @param {string} [status]
 * @returns {string}
 */
export function ensureStatusQualification(text, status) {
  if (typeof text !== 'string' || status !== 'stale') {
    return text;
  }
  if (/\bbefore the last edit\b/i.test(text)) {
    return text;
  }
  const trimmed = text.replace(/[.!?]\s*$/, '');
  return `${qualifyStatus('stale', { action: trimmed })}.`;
}

/**
 * Scan generated text for prohibited phrasing or status/certainty mismatches.
 *
 * @param {string} text
 * @param {{status?: string, allowSinglePathCertainty?: boolean, provenPatterns?: string[]}} [context]
 * @returns {{ok: boolean, violations: Array<{id: string, message: string}>}}
 */
export function lintExplanationText(text, context = {}) {
  const input = typeof text === 'string' ? text : '';
  /** @type {Array<{id: string, message: string}>} */
  const violations = [];

  for (const rule of BANNED_PHRASING_RULES) {
    if (rule.pattern.test(input)) {
      violations.push({ id: rule.id, message: rule.message });
    }
  }

  if (!context.allowSinglePathCertainty) {
    for (const rule of UNQUALIFIED_CERTAINTY_PATTERNS) {
      if (rule.pattern.test(input)) {
        violations.push({ id: rule.id, message: rule.message });
      }
    }
  }

  if (context.status === 'resolved') {
    if (/\b(?:may call|possible targets?|could not be resolved)\b/i.test(input)) {
      violations.push({
        id: 'status.resolved_with_uncertainty',
        message: 'A resolved item must not phrase its primary resolved subject as uncertain.',
      });
    }
  } else if (context.status === 'possible') {
    if (!/\b(?:possible|may call)\b/i.test(input)) {
      violations.push({
        id: 'status.possible_unqualified',
        message: 'A possible item must explicitly use "possible" or "may call" phrasing.',
      });
    }
  } else if (context.status === 'unresolved') {
    if (!/\b(?:could not be resolved|unresolved)\b/i.test(input)) {
      violations.push({
        id: 'status.unresolved_unqualified',
        message: 'An unresolved item must explicitly state that it could not be resolved.',
      });
    }
  } else if (context.status === 'inferred') {
    if (!/\binferred from\b/i.test(input)) {
      violations.push({
        id: 'status.inferred_unqualified',
        message: 'An inferred item must state "inferred from <basis>".',
      });
    }
  } else if (context.status === 'stale') {
    if (!/\bbefore the last edit\b/i.test(input)) {
      violations.push({
        id: 'status.stale_unqualified',
        message: 'A stale item must state "based on source before the last edit".',
      });
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  };
}
