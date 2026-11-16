/**
 * Stable symbol identity.
 *
 * Scheme (normative):
 *
 *   symbol:<language>:<workspace-path>:<kind>:<qualified-name>[#<disambiguator>]
 *
 * Rules:
 * - Line numbers never appear in an id. Whitespace, comment, and line-shift
 *   edits must leave identity untouched (Phase 9 depends on that).
 * - `qualifiedName` uses the producer's native separator (`::` or `.`) in the
 *   record; the id normalises it to `.`.
 * - Overloads use a disambiguator made of arity plus normalised parameter kinds.
 * - Anonymous constructs use `anon.<ordinal-within-parent>`.
 * - A collision that the explicit disambiguator cannot explain falls back to a
 *   declaration-order ordinal. That is stable under whitespace edits but not
 *   under reordering; it is the documented last resort.
 * - Renames change identity. The old id is removed and the new one is added;
 *   ids are never silently reused.
 *
 * The id is human-readable by design, because debugging identity is expensive.
 * It is still opaque to consumers: nothing may parse it to discover a range.
 */

import { shortHash } from './hash.js';

/**
 * @param {unknown} path
 * @returns {string} forward-slash path without a leading `./`
 */
export function normalizePath(path) {
  return String(path ?? '')
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\.\//, '');
}

/**
 * Normalise a qualified name for use inside an id.
 *
 * @param {unknown} name
 * @returns {string}
 */
export function normalizeQualifiedName(name) {
  return String(name ?? '')
    .replace(/::/g, '.')
    .replace(/\.{2,}/g, '.')
    .replace(/^\./, '')
    .replace(/\.$/, '');
}

/**
 * Escape only the characters that would make the id ambiguous. Unicode is left
 * readable on purpose.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function escapeIdSegment(value) {
  return String(value ?? '')
    .replace(/%/g, '%25')
    .replace(/:/g, '%3A')
    .replace(/#/g, '%23');
}

/**
 * @param {unknown} path
 * @returns {string}
 */
export function createFileId(path) {
  return `file:${escapeIdSegment(normalizePath(path))}`;
}

/**
 * @param {{language: string, path: string, kind: string, qualifiedName: string, disambiguator?: string}} input
 * @returns {string}
 */
export function createSymbolId(input) {
  const base = [
    'symbol',
    escapeIdSegment(input.language),
    escapeIdSegment(normalizePath(input.path)),
    escapeIdSegment(input.kind),
    escapeIdSegment(normalizeQualifiedName(input.qualifiedName)),
  ].join(':');
  const disambiguator = input.disambiguator ? `#${escapeIdSegment(input.disambiguator)}` : '';
  return `${base}${disambiguator}`;
}

/**
 * The identity tuple C-03 checks for uniqueness.
 *
 * @param {{path: string, kind: string, qualifiedName: string, disambiguator?: string}} input
 * @returns {string}
 */
export function createIdentityKey(input) {
  return [
    normalizePath(input.path),
    String(input.kind),
    normalizeQualifiedName(input.qualifiedName),
    String(input.disambiguator ?? ''),
  ].join('|');
}

/**
 * @param {unknown[]} parameterKinds
 * @returns {string}
 */
export function createOverloadDisambiguator(parameterKinds) {
  const kinds = Array.isArray(parameterKinds) ? parameterKinds : [];
  const normalized = kinds.map((kind) =>
    String(kind ?? 'unknown')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'unknown',
  );
  return normalized.length === 0 ? 'arity0' : `arity${normalized.length}.${normalized.join('+')}`;
}

/**
 * @param {number} ordinal 1-based ordinal within the parent scope
 * @returns {string}
 */
export function createAnonymousDisambiguator(ordinal) {
  const safe = Number.isInteger(ordinal) && ordinal > 0 ? ordinal : 1;
  return `anon.${safe}`;
}

/**
 * A per-run allocator. It is deliberately stateful: two declarations that
 * collide must receive different ids, and the allocator is the only place that
 * knows about earlier declarations.
 *
 * @param {{language: string}} options
 */
export function createIdentityAllocator({ language }) {
  /** @type {Set<string>} */
  const usedIds = new Set();
  /** @type {Map<string, number>} */
  const bases = new Map();

  /**
   * @param {{path: string, kind: string, qualifiedName: string, disambiguator?: string}} input
   * @returns {{symbolId: string, identityKey: string, disambiguator: string}}
   */
  function symbol(input) {
    const explicit = input.disambiguator ? String(input.disambiguator) : '';
    const baseKey = createIdentityKey({
      path: input.path,
      kind: input.kind,
      qualifiedName: input.qualifiedName,
      disambiguator: '',
    });

    let disambiguator = explicit;
    let symbolId = createSymbolId({ ...input, language, disambiguator });
    let identityKey = createIdentityKey({ ...input, disambiguator });

    if (usedIds.has(symbolId)) {
      // Last resort: declaration-order index, never a line number.
      let ordinal = bases.get(`${baseKey}#${explicit}`) ?? 1;
      do {
        disambiguator = explicit ? `${explicit}.${ordinal}` : String(ordinal);
        symbolId = createSymbolId({ ...input, language, disambiguator });
        identityKey = createIdentityKey({ ...input, disambiguator });
        ordinal += 1;
      } while (usedIds.has(symbolId) && ordinal < 10_000);
      bases.set(`${baseKey}#${explicit}`, ordinal);
    } else if (!explicit) {
      disambiguator = '0';
      identityKey = createIdentityKey({ ...input, disambiguator });
    }

    usedIds.add(symbolId);
    return { symbolId, identityKey, disambiguator };
  }

  return { symbol };
}

/**
 * Deterministic, readable relationship id. Two calls between the same pair get
 * distinct ids through the allocator's ordinal suffix.
 *
 * @param {{type: string, from: string, to: string}} input
 * @returns {string}
 */
export function createRelationshipId(input) {
  return `rel:${escapeIdSegment(input.type)}:${shortHash(`${input.from}|${input.to}`)}`;
}

/**
 * @returns {{relationship: (input: {type: string, from: string, to: string}) => string}}
 */
export function createRelationshipAllocator() {
  /** @type {Map<string, number>} */
  const counts = new Map();
  return {
    relationship(input) {
      const base = createRelationshipId(input);
      const seen = counts.get(base) ?? 0;
      counts.set(base, seen + 1);
      return seen === 0 ? base : `${base}#${seen + 1}`;
    },
  };
}
