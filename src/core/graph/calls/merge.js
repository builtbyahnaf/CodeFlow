/**
 * Deterministic multi-source relationship merge policy (Phase 7 §6).
 *
 * Combines adapter-local evidence with index or language-server evidence using
 * an order-independent precedence truth table per `(from, to, type)` triple.
 *
 * Non-negotiable invariants:
 * 1. Never merge two `possible` targets into one `resolved` edge.
 * 2. Never merge across relationship types (`calls` vs `references`).
 * 3. Order-independent: sorting inputs before merging yields identical output
 *    for any permutation of sources or relationships.
 * 4. Disagreements (`resolved` in source A, absent in source B that covers the
 *    same origin symbol) produce a `source_disagreement` diagnostic and never
 *    silently downgrade.
 * 5. Unresolved sites keep their count in the unresolved bucket even when
 *    another site in the same function has a resolved target.
 */

import { CALL_RELATIONSHIP_TYPES, STATUS_STRENGTH } from './kinds.js';

const ALLOWED_TYPES = new Set(CALL_RELATIONSHIP_TYPES);

/**
 * Combine two resolution statuses according to the Phase 7 §6 truth table.
 *
 * `stale` is a provenance marker rather than a strength rank: merging `status`
 * with `stale` preserves the strongest underlying status and sets `stale: true`.
 *
 * @param {string} leftStatus
 * @param {string} rightStatus
 * @param {{leftStale?: boolean, rightStale?: boolean}} [options]
 * @returns {{status: 'resolved'|'inferred'|'possible'|'unresolved', stale: boolean, upgraded: boolean}}
 */
export function mergeStatusPair(leftStatus, rightStatus, options = {}) {
  const leftIsStale = leftStatus === 'stale' || options.leftStale === true;
  const rightIsStale = rightStatus === 'stale' || options.rightStale === true;
  const normLeft = leftStatus === 'stale' ? 'unresolved' : leftStatus;
  const normRight = rightStatus === 'stale' ? 'unresolved' : rightStatus;

  const strengthLeft = STATUS_STRENGTH[normLeft] ?? 1;
  const strengthRight = STATUS_STRENGTH[normRight] ?? 1;
  const maxStrength = Math.max(strengthLeft, strengthRight);

  /** @type {'resolved'|'inferred'|'possible'|'unresolved'} */
  let status = 'unresolved';
  if (maxStrength === 4) {
    status = 'resolved';
  } else if (maxStrength === 3) {
    status = 'inferred';
  } else if (maxStrength === 2) {
    status = 'possible';
  }

  return {
    status,
    stale: leftIsStale || rightIsStale,
    upgraded: strengthLeft !== strengthRight,
  };
}

/**
 * @param {Record<string, any>|null|undefined} site
 * @returns {string}
 */
function siteKey(site) {
  if (!site || typeof site.fileId !== 'string') {
    return '';
  }
  return `${site.fileId}:${site.startLine ?? 0}:${site.startColumn ?? 0}-${site.endLine ?? 0}:${site.endColumn ?? 0}`;
}

/**
 * @param {Record<string, any>} rel
 * @param {string} sourceId
 * @returns {string}
 */
function canonicalRelKey(rel, sourceId) {
  return [
    rel.from ?? '',
    rel.to ?? '',
    rel.type ?? '',
    rel.status ?? '',
    rel.reasonCode ?? '',
    siteKey(rel.site),
    sourceId,
  ].join('|');
}

/**
 * Merge symbols and relationships across one or more evidence sources.
 *
 * @param {Array<{
 *   sourceId: string,
 *   kind?: 'adapter'|'index'|'lsp',
 *   scope?: 'complete'|'partial'|'same_file_only',
 *   scopeReasons?: string[],
 *   contentHashes?: Record<string, string>,
 *   staleFiles?: Iterable<string>,
 *   coveredSymbols?: Iterable<string>,
 *   symbols?: Array<Record<string, any>>,
 *   relationships?: Array<Record<string, any>>,
 * }>} sources
 * @param {{
 *   diskHashes?: Record<string, string>,
 *   staleFiles?: Iterable<string>,
 *   logger?: {debug?: (msg: string, fields?: Record<string, unknown>) => void},
 * }} [options]
 */
export function mergeEvidenceSources(sources, options = {}) {
  const diskHashes = options.diskHashes ?? {};
  const globalStaleFiles = new Set(options.staleFiles ?? []);
  const logger = options.logger;

  const sortedSources = [...(Array.isArray(sources) ? sources : [])]
    .filter((src) => src && typeof src.sourceId === 'string')
    .sort((a, b) => (a.sourceId < b.sourceId ? -1 : a.sourceId > b.sourceId ? 1 : 0));

  // 1. Merge symbol declarations deterministically. When two sources disagree
  //    on a symbol's fileId, prefer the source whose contentHash matches disk;
  //    otherwise mark the symbol stale.
  /** @type {Map<string, Record<string, any>>} */
  const symbolsById = new Map();
  /** @type {Array<{code: string, severity: 'warning'|'info', message: string, from?: string, to?: string, type?: string, sources: string[]}>} */
  const diagnostics = [];
  /** @type {Set<string>} */
  const diagnosticKeys = new Set();

  for (const source of sortedSources) {
    const sourceStale = new Set(source.staleFiles ?? []);
    const sourceHashes = source.contentHashes ?? {};
    const syms = [...(source.symbols ?? [])].sort((a, b) =>
      a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0,
    );

    for (const sym of syms) {
      if (!sym || typeof sym.symbolId !== 'string') {
        continue;
      }
      const fileId = sym.declaration?.fileId ?? '';
      const diskHash = fileId ? diskHashes[fileId] : undefined;
      const srcHash = fileId ? sourceHashes[fileId] : undefined;
      const matchesDisk = Boolean(diskHash && srcHash && diskHash === srcHash);
      const isFileStale =
        globalStaleFiles.has(fileId) ||
        sourceStale.has(fileId) ||
        Boolean(diskHash && srcHash && diskHash !== srcHash);

      const existing = symbolsById.get(sym.symbolId);
      if (!existing) {
        symbolsById.set(sym.symbolId, {
          ...sym,
          stale: isFileStale,
          matchesDisk,
          sourceIds: [source.sourceId],
        });
        continue;
      }

      const existingFileId = existing.declaration?.fileId ?? '';
      if (existingFileId !== fileId) {
        if (matchesDisk && !existing.matchesDisk) {
          symbolsById.set(sym.symbolId, {
            ...sym,
            stale: false,
            matchesDisk: true,
            sourceIds: [...new Set([...existing.sourceIds, source.sourceId])],
          });
        } else if (!existing.matchesDisk && !matchesDisk) {
          existing.stale = true;
          existing.sourceIds = [...new Set([...existing.sourceIds, source.sourceId])];
        } else {
          existing.sourceIds = [...new Set([...existing.sourceIds, source.sourceId])];
        }
        const diagKey = `symbol_move|${sym.symbolId}|${existingFileId}|${fileId}`;
        if (!diagnosticKeys.has(diagKey)) {
          diagnosticKeys.add(diagKey);
          diagnostics.push({
            code: 'source_disagreement',
            severity: 'warning',
            message: `Sources disagree on file location for symbol "${sym.qualifiedName || sym.name || sym.symbolId}" (${existingFileId} vs ${fileId}).`,
            from: sym.symbolId,
            sources: [...new Set([...existing.sourceIds, source.sourceId])],
          });
        }
      } else {
        existing.stale = existing.stale || isFileStale;
        existing.matchesDisk = existing.matchesDisk || matchesDisk;
        if (!existing.sourceIds.includes(source.sourceId)) {
          existing.sourceIds.push(source.sourceId);
        }
      }
    }
  }

  // Track which symbols each source claims coverage over, so we can detect
  // when a `resolved` edge in source A is absent in source B.
  /** @type {Map<string, Set<string>>} */
  const coveredBySource = new Map();
  for (const source of sortedSources) {
    const covered = new Set(source.coveredSymbols ?? []);
    for (const sym of source.symbols ?? []) {
      if (sym?.symbolId) {
        covered.add(sym.symbolId);
      }
    }
    for (const rel of source.relationships ?? []) {
      if (rel?.from) {
        covered.add(rel.from);
      }
    }
    coveredBySource.set(source.sourceId, covered);
  }

  // Collect all valid call-graph relationships in canonical order.
  /** @type {Array<{rel: Record<string, any>, sourceId: string, isStale: boolean}>} */
  const allRecords = [];
  for (const source of sortedSources) {
    const sourceStale = new Set(source.staleFiles ?? []);
    const sourceHashes = source.contentHashes ?? {};
    for (const rel of source.relationships ?? []) {
      if (
        !rel ||
        typeof rel.from !== 'string' ||
        typeof rel.to !== 'string' ||
        !ALLOWED_TYPES.has(rel.type)
      ) {
        continue;
      }
      const siteFileId = rel.site?.fileId || symbolsById.get(rel.from)?.declaration?.fileId || '';
      const diskHash = siteFileId ? diskHashes[siteFileId] : undefined;
      const srcHash = siteFileId ? sourceHashes[siteFileId] : undefined;
      const isStale =
        rel.status === 'stale' ||
        globalStaleFiles.has(siteFileId) ||
        sourceStale.has(siteFileId) ||
        Boolean(diskHash && srcHash && diskHash !== srcHash) ||
        symbolsById.get(rel.from)?.stale === true;
      allRecords.push({ rel, sourceId: source.sourceId, isStale });
    }
  }

  allRecords.sort((a, b) => {
    const ka = canonicalRelKey(a.rel, a.sourceId);
    const kb = canonicalRelKey(b.rel, b.sourceId);
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  // Separate truly unresolved records (whose target is unknown/external and status is unresolved)
  // only when they do not share a concrete target symbol with a stronger edge, OR keep a
  // site-keyed unresolved bucket so resolved edges never erase unresolved counts at other sites.
  /** @type {Map<string, Record<string, any>>} */
  const mergedTriples = new Map();
  /** @type {Map<string, {from: string, to: string, type: string, reasonCode: string, site: Record<string, any>|null, siteKey: string, sourceIds: Set<string>, stale: boolean}>} */
  const unresolvedSites = new Map();

  for (const { rel, sourceId, isStale } of allRecords) {
    const sk = siteKey(rel.site);
    const baseStatus =
      rel.status === 'stale' ? (rel.strongestStatus ?? 'unresolved') : (rel.status ?? 'unresolved');

    // Track unresolved sites by (from, type, siteKey || to) so unresolved call sites
    // at other locations remain in the unresolved bucket even if a resolved edge exists.
    if (baseStatus === 'unresolved') {
      const uKey = `${rel.from}|${rel.type}|${sk || rel.to}|${rel.reasonCode ?? 'unknown'}`;
      const existingSite = unresolvedSites.get(uKey);
      if (!existingSite) {
        unresolvedSites.set(uKey, {
          from: rel.from,
          to: rel.to,
          type: rel.type,
          reasonCode: rel.reasonCode ?? 'unresolved_target',
          site: rel.site ?? null,
          siteKey: sk,
          sourceIds: new Set([sourceId]),
          stale: isStale,
        });
      } else {
        existingSite.sourceIds.add(sourceId);
        existingSite.stale = existingSite.stale || isStale;
      }
    }

    const tripleKey = `${rel.from}|${rel.to}|${rel.type}`;
    const existing = mergedTriples.get(tripleKey);

    if (!existing) {
      const siteSet = new Set(sk ? [sk] : []);
      mergedTriples.set(tripleKey, {
        relationshipId: `merged:${tripleKey}`,
        from: rel.from,
        to: rel.to,
        type: rel.type,
        strongestStatus: baseStatus,
        status: isStale ? 'stale' : baseStatus,
        stale: isStale,
        reasonCode: baseStatus === 'resolved' ? undefined : rel.reasonCode,
        reasonCodes: rel.reasonCode ? [rel.reasonCode] : [],
        candidates: Array.isArray(rel.extensions?.candidates)
          ? [...rel.extensions.candidates]
          : [rel.to],
        siteKeys: siteSet,
        callSites: rel.site ? [rel.site] : [],
        evidence: Array.isArray(rel.evidence) ? [...rel.evidence] : [],
        sourceIds: [sourceId],
        statusBySource: { [sourceId]: baseStatus },
      });
      continue;
    }

    const combined = mergeStatusPair(existing.strongestStatus, baseStatus, {
      leftStale: existing.stale,
      rightStale: isStale,
    });

    if (combined.upgraded && logger?.debug) {
      logger.debug('calls.merge.status_changed', {
        from: rel.from,
        to: rel.to,
        type: rel.type,
        previous: existing.strongestStatus,
        incoming: baseStatus,
        result: combined.status,
        sources: [...new Set([...existing.sourceIds, sourceId])],
      });
    }

    existing.strongestStatus = combined.status;
    existing.stale = combined.stale;
    existing.status = combined.stale ? 'stale' : combined.status;

    if (rel.reasonCode && !existing.reasonCodes.includes(rel.reasonCode)) {
      existing.reasonCodes.push(rel.reasonCode);
    }
    existing.reasonCode =
      existing.strongestStatus === 'resolved' ? undefined : existing.reasonCodes[0];

    for (const candidate of rel.extensions?.candidates ?? [rel.to]) {
      if (!existing.candidates.includes(candidate)) {
        existing.candidates.push(candidate);
      }
    }
    if (sk && !existing.siteKeys.has(sk)) {
      existing.siteKeys.add(sk);
      if (rel.site) {
        existing.callSites.push(rel.site);
      }
    }
    if (!existing.sourceIds.includes(sourceId)) {
      existing.sourceIds.push(sourceId);
    }
    const prevSourceStatus = existing.statusBySource[sourceId];
    if (
      !prevSourceStatus ||
      (STATUS_STRENGTH[baseStatus] ?? 1) > (STATUS_STRENGTH[prevSourceStatus] ?? 1)
    ) {
      existing.statusBySource[sourceId] = baseStatus;
    }
  }

  // If a concrete (from, to, type) triple upgraded from unresolved to resolved at
  // the exact same call site, remove only that exact site from `unresolvedSites`;
  // keep all other unresolved call sites intact!
  for (const edge of mergedTriples.values()) {
    if (edge.strongestStatus === 'resolved') {
      for (const [uKey, uSite] of [...unresolvedSites.entries()]) {
        if (
          uSite.from === edge.from &&
          uSite.type === edge.type &&
          uSite.to === edge.to &&
          (uSite.siteKey === '' || edge.siteKeys.has(uSite.siteKey))
        ) {
          unresolvedSites.delete(uKey);
        }
      }
    }
  }

  // Check for `source_disagreement`: edge is `resolved` in source A, but absent
  // in source B even though source B covers `edge.from`.
  if (sortedSources.length > 1) {
    for (const edge of mergedTriples.values()) {
      if (edge.strongestStatus !== 'resolved') {
        continue;
      }
      const presentIn = new Set(edge.sourceIds);
      const missingFrom = [];
      for (const source of sortedSources) {
        const covered = coveredBySource.get(source.sourceId);
        if (covered?.has(edge.from) && !presentIn.has(source.sourceId)) {
          missingFrom.push(source.sourceId);
        }
      }
      if (missingFrom.length > 0) {
        const diagKey = `disagree|${edge.from}|${edge.to}|${edge.type}`;
        if (!diagnosticKeys.has(diagKey)) {
          diagnosticKeys.add(diagKey);
          diagnostics.push({
            code: 'source_disagreement',
            severity: 'warning',
            message: `Resolved ${edge.type} edge "${edge.from} -> ${edge.to}" is present in [${[...presentIn].join(', ')}] but absent in [${missingFrom.join(', ')}].`,
            from: edge.from,
            to: edge.to,
            type: edge.type,
            sources: [...presentIn, ...missingFrom],
          });
        }
      }
    }
  }

  // Determine overall scope across active sources.
  let scope = /** @type {'complete'|'partial'|'same_file_only'} */ ('same_file_only');
  const scopeReasons = new Set();
  for (const source of sortedSources) {
    if (source.scope === 'complete') {
      scope = 'complete';
    } else if (source.scope === 'partial' && scope !== 'complete') {
      scope = 'partial';
    }
    for (const reason of source.scopeReasons ?? []) {
      scopeReasons.add(reason);
    }
  }
  if (scope === 'complete' && (globalStaleFiles.size > 0 || diagnostics.length > 0)) {
    // Disagreements or stale files lower effective completeness to partial.
    if (globalStaleFiles.size > 0) {
      scope = 'partial';
      scopeReasons.add('index_stale');
    }
  }
  if (scope === 'same_file_only' && scopeReasons.size === 0) {
    scopeReasons.add('no_index');
  }

  const relationships = [...mergedTriples.values()]
    .map((entry) => ({
      relationshipId: entry.relationshipId,
      from: entry.from,
      to: entry.to,
      type: entry.type,
      status: entry.status,
      strongestStatus: entry.strongestStatus,
      stale: entry.stale,
      ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      reasonCodes: entry.reasonCodes,
      candidates: entry.candidates.sort(),
      callSiteCount: Math.max(1, entry.callSites.length),
      callSites: entry.callSites,
      evidence: entry.evidence,
      sourceIds: entry.sourceIds,
    }))
    .sort((a, b) =>
      a.relationshipId < b.relationshipId ? -1 : a.relationshipId > b.relationshipId ? 1 : 0,
    );

  const unresolved = [...unresolvedSites.values()]
    .map((site) => ({
      from: site.from,
      to: site.to,
      type: site.type,
      reasonCode: site.reasonCode,
      site: site.site,
      stale: site.stale,
      sourceIds: [...site.sourceIds].sort(),
    }))
    .sort((a, b) => {
      const ka = `${a.from}|${a.to}|${a.reasonCode}|${siteKey(a.site)}`;
      const kb = `${b.from}|${b.to}|${b.reasonCode}|${siteKey(b.site)}`;
      return ka < kb ? -1 : ka > kb ? 1 : 0;
    });

  return {
    symbols: [...symbolsById.values()].sort((a, b) =>
      a.symbolId < b.symbolId ? -1 : a.symbolId > b.symbolId ? 1 : 0,
    ),
    relationships,
    unresolvedSites: unresolved,
    diagnostics,
    scope,
    scopeReasons: [...scopeReasons].sort(),
  };
}
