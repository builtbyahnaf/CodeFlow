/**
 * Aggregate status distributions and degradation summaries (Phase 10 §5.3,
 * P10-03, P10-04, AC-10.5).
 *
 * Non-negotiable semantic preservation rules:
 * 1. An aggregate's status is a distribution, never a single collapsed status.
 *    Rendering an aggregate as `resolved` when it contains `possible`,
 *    `unresolved`, or `stale` members is forbidden.
 * 2. Unresolved and unmodeled counts are surfaced above the fold as explicit
 *    badges on the cluster DTO.
 * 3. A cluster containing any `partial` analysis carries `completeness: 'partial'`.
 */

/**
 * Build a status distribution and above-the-fold badge summary from a list of
 * status/item records.
 *
 * @param {Array<{
 *   status?: string,
 *   stale?: boolean,
 *   completeness?: 'full'|'partial'|'failed',
 *   unmodeled?: boolean,
 *   degradationCount?: number,
 * }>} items
 */
export function createStatusDistribution(items = []) {
  const counts = {
    resolved: 0,
    inferred: 0,
    possible: 0,
    unresolved: 0,
    stale: 0,
  };
  let total = 0;
  let unmodeledCount = 0;
  let degradationCount = 0;
  let hasPartial = false;

  for (const item of Array.isArray(items) ? items : []) {
    if (!item || typeof item !== 'object') {
      continue;
    }
    total += 1;
    const status = String(item.status ?? 'resolved');
    if (status === 'stale' || item.stale === true) {
      counts.stale += 1;
    } else if (status === 'unresolved') {
      counts.unresolved += 1;
    } else if (status === 'possible') {
      counts.possible += 1;
    } else if (status === 'inferred') {
      counts.inferred += 1;
    } else {
      counts.resolved += 1;
    }

    if (item.unmodeled === true) {
      unmodeledCount += 1;
    }
    if (Number.isFinite(item.degradationCount) && Number(item.degradationCount) > 0) {
      degradationCount += Math.trunc(Number(item.degradationCount));
    }
    if (item.completeness && item.completeness !== 'full') {
      hasPartial = true;
    }
  }

  return finalizeDistribution({
    counts,
    total,
    unmodeledCount,
    degradationCount,
    hasPartial,
  });
}

/**
 * Merge multiple status distributions into one parent aggregate distribution.
 *
 * @param {Array<ReturnType<typeof createStatusDistribution>>} distributions
 */
export function mergeStatusDistributions(distributions = []) {
  const counts = {
    resolved: 0,
    inferred: 0,
    possible: 0,
    unresolved: 0,
    stale: 0,
  };
  let total = 0;
  let unmodeledCount = 0;
  let degradationCount = 0;
  let hasPartial = false;

  for (const dist of Array.isArray(distributions) ? distributions : []) {
    if (!dist || typeof dist !== 'object') {
      continue;
    }
    counts.resolved += Number(dist.counts?.resolved ?? 0);
    counts.inferred += Number(dist.counts?.inferred ?? 0);
    counts.possible += Number(dist.counts?.possible ?? 0);
    counts.unresolved += Number(dist.counts?.unresolved ?? 0);
    counts.stale += Number(dist.counts?.stale ?? 0);
    total += Number(dist.total ?? 0);
    unmodeledCount += Number(dist.unmodeledCount ?? 0);
    degradationCount += Number(dist.degradationCount ?? 0);
    if (dist.completeness === 'partial') {
      hasPartial = true;
    }
  }

  return finalizeDistribution({
    counts,
    total,
    unmodeledCount,
    degradationCount,
    hasPartial,
  });
}

/**
 * @param {{
 *   counts: {resolved: number, inferred: number, possible: number, unresolved: number, stale: number},
 *   total: number,
 *   unmodeledCount: number,
 *   degradationCount: number,
 *   hasPartial: boolean,
 * }} raw
 */
function finalizeDistribution({ counts, total, unmodeledCount, degradationCount, hasPartial }) {
  const nonResolvedCount = counts.inferred + counts.possible + counts.unresolved + counts.stale;
  const nonZeroBuckets = Object.values(counts).filter((c) => c > 0).length;

  /**
   * Non-negotiable Rule #1 (AC-10.5): never collapse a mixed distribution or a
   * distribution with non-resolved members into `'resolved'`.
   *
   * @type {'resolved'|'inferred'|'possible'|'unresolved'|'stale'|'mixed'|'empty'}
   */
  let displayStatus = 'empty';
  if (total === 0) {
    displayStatus = 'empty';
  } else if (nonZeroBuckets > 1 || (counts.resolved > 0 && nonResolvedCount > 0)) {
    displayStatus = 'mixed';
  } else if (counts.stale > 0) {
    displayStatus = 'stale';
  } else if (counts.unresolved > 0) {
    displayStatus = 'unresolved';
  } else if (counts.possible > 0) {
    displayStatus = 'possible';
  } else if (counts.inferred > 0) {
    displayStatus = 'inferred';
  } else {
    displayStatus = 'resolved';
  }

  const completeness =
    hasPartial || counts.unresolved > 0 || unmodeledCount > 0 ? 'partial' : 'full';

  /** @type {string[]} */
  const badges = [];
  if (counts.unresolved > 0) {
    badges.push(`${counts.unresolved} unresolved`);
  }
  if (counts.possible > 0) {
    badges.push(`${counts.possible} possible`);
  }
  if (counts.stale > 0) {
    badges.push(`${counts.stale} stale`);
  }
  if (unmodeledCount > 0) {
    badges.push(`${unmodeledCount} unmodeled`);
  }
  if (degradationCount > 0) {
    badges.push(`${degradationCount} degraded`);
  }
  if (completeness === 'partial' && badges.length === 0) {
    badges.push('partial');
  }

  return {
    counts: Object.freeze({ ...counts }),
    total,
    displayStatus,
    completeness,
    unmodeledCount,
    degradationCount,
    badges: Object.freeze(badges),
  };
}
