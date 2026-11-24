/**
 * Explanation data model and fragment/evidence enforcement.
 *
 * Every explanation item carries non-empty evidence references and plain,
 * structured text (never HTML). Sentence fragments without evidence cannot
 * render.
 */

export const RULESET_VERSION = '1.0.0';

export const EXPLANATION_TOPICS = Object.freeze([
  'statement',
  'condition',
  'branch',
  'loop',
  'call',
  'return',
  'variable',
  'mutation',
  'function_summary',
  'dependency',
  'pattern',
  'complexity',
]);

export const EVIDENCE_KINDS = Object.freeze([
  'source',
  'semantic',
  'construct',
  'relationship',
]);

export const CLAIM_KINDS = Object.freeze(['grounded', 'qualified']);

export const DEPTH_LEVELS = Object.freeze([1, 2, 3, 4]);

export const RESOLUTION_STATUSES = Object.freeze([
  'resolved',
  'inferred',
  'possible',
  'unresolved',
  'stale',
]);

const TOPIC_SET = new Set(EXPLANATION_TOPICS);
const EVIDENCE_KIND_SET = new Set(EVIDENCE_KINDS);
const CLAIM_SET = new Set(CLAIM_KINDS);
const STATUS_SET = new Set(RESOLUTION_STATUSES);
const HTML_TAG_PATTERN = /<\/?[a-z][^>]*>/i;

/**
 * @typedef {Object} EvidenceRef
 * @property {'source'|'semantic'|'construct'|'relationship'} kind
 * @property {string} id
 * @property {string} [label]
 * @property {Record<string, any>} [range]
 */

/**
 * @typedef {Object} ExplanationItem
 * @property {string} id
 * @property {string} subjectId
 * @property {string} topic
 * @property {1|2|3|4} depth
 * @property {string} text
 * @property {EvidenceRef[]} evidence
 * @property {'grounded'|'qualified'} claim
 * @property {string} [status]
 * @property {string} ruleId
 * @property {string} rulesetVersion
 */

/**
 * @param {unknown} range
 * @returns {Record<string, any>|undefined}
 */
function copyRange(range) {
  if (!range || typeof range !== 'object' || Array.isArray(range)) {
    return undefined;
  }
  const r = /** @type {Record<string, any>} */ (range);
  if (
    typeof r.fileId !== 'string' ||
    !r.fileId ||
    !Number.isInteger(r.startLine) ||
    !Number.isInteger(r.startColumn) ||
    !Number.isInteger(r.endLine) ||
    !Number.isInteger(r.endColumn)
  ) {
    return undefined;
  }
  return {
    fileId: r.fileId,
    startLine: r.startLine,
    startColumn: r.startColumn,
    endLine: r.endLine,
    endColumn: r.endColumn,
  };
}

/**
 * @param {{kind: string, id: string, label?: string, range?: Record<string, any>}} input
 * @returns {EvidenceRef|null}
 */
export function createEvidenceRef(input) {
  if (!input || typeof input !== 'object') {
    return null;
  }
  if (!EVIDENCE_KIND_SET.has(input.kind)) {
    return null;
  }
  if (typeof input.id !== 'string' || input.id.length === 0) {
    return null;
  }
  /** @type {EvidenceRef} */
  const ref = {
    kind: /** @type {EvidenceRef['kind']} */ (input.kind),
    id: input.id,
  };
  if (typeof input.label === 'string' && input.label.trim().length > 0) {
    ref.label = input.label.trim();
  }
  const range = copyRange(input.range);
  if (range) {
    ref.range = range;
  }
  return ref;
}

/**
 * @param {EvidenceRef[]} refs
 * @returns {EvidenceRef[]}
 */
export function dedupeEvidence(refs) {
  /** @type {Map<string, EvidenceRef>} */
  const seen = new Map();
  for (const raw of Array.isArray(refs) ? refs : []) {
    const ref = createEvidenceRef(raw);
    if (!ref) {
      continue;
    }
    const key = `${ref.kind}:${ref.id}`;
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, ref);
    } else if (!existing.range && ref.range) {
      seen.set(key, { ...existing, range: ref.range });
    }
  }
  return [...seen.values()];
}

/**
 * Deterministic item identifier. Excludes line numbers from ruleset/depth keys.
 *
 * @param {string} subjectId
 * @param {string} ruleId
 * @param {number} depth
 * @param {string} [rulesetVersion]
 * @returns {string}
 */
export function explanationId(subjectId, ruleId, depth, rulesetVersion = RULESET_VERSION) {
  return `exp:${subjectId}:${ruleId}:d${depth}:v${rulesetVersion}`;
}

/**
 * Assemble sentence fragments into plain text, dropping any fragment that lacks
 * valid non-empty evidence. Fragments without evidence cannot render.
 *
 * @param {Array<{text: string, evidence: EvidenceRef[]}>} fragments
 * @returns {{text: string, evidence: EvidenceRef[], droppedCount: number}}
 */
export function assembleFragments(fragments) {
  /** @type {string[]} */
  const sentences = [];
  /** @type {EvidenceRef[]} */
  const refs = [];
  let droppedCount = 0;

  for (const fragment of Array.isArray(fragments) ? fragments : []) {
    const text = typeof fragment?.text === 'string' ? fragment.text.trim() : '';
    const validEvidence = dedupeEvidence(fragment?.evidence ?? []);
    if (text.length === 0 || validEvidence.length === 0 || HTML_TAG_PATTERN.test(text)) {
      droppedCount += 1;
      continue;
    }
    const normalized = /[.!?]$/.test(text) ? text : `${text}.`;
    sentences.push(normalized);
    refs.push(...validEvidence);
  }

  return {
    text: sentences.join(' '),
    evidence: dedupeEvidence(refs),
    droppedCount,
  };
}

/**
 * Validate an ExplanationItem without throwing.
 *
 * @param {unknown} item
 * @returns {{ok: true, value: ExplanationItem} | {ok: false, code: 'E_EXPLANATION', issues: string[]}}
 */
export function validateExplanationItem(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    return { ok: false, code: 'E_EXPLANATION', issues: ['Explanation item must be an object.'] };
  }
  const candidate = /** @type {Record<string, any>} */ (item);
  /** @type {string[]} */
  const issues = [];

  for (const field of ['id', 'subjectId', 'ruleId', 'rulesetVersion']) {
    if (typeof candidate[field] !== 'string' || candidate[field].trim().length === 0) {
      issues.push(`${field} must be a non-empty string.`);
    }
  }
  if (!TOPIC_SET.has(candidate.topic)) {
    issues.push(`Unsupported topic "${String(candidate.topic)}".`);
  }
  if (!Number.isInteger(candidate.depth) || candidate.depth < 1 || candidate.depth > 4) {
    issues.push(`depth must be 1, 2, 3, or 4 (received ${String(candidate.depth)}).`);
  }
  if (typeof candidate.text !== 'string' || candidate.text.trim().length === 0) {
    issues.push('text must be a non-empty string.');
  } else if (HTML_TAG_PATTERN.test(candidate.text)) {
    issues.push('text must be plain text without HTML markup.');
  }
  if (!CLAIM_SET.has(candidate.claim)) {
    issues.push(`claim must be "grounded" or "qualified" (received ${String(candidate.claim)}).`);
  }
  if (candidate.status !== undefined && !STATUS_SET.has(candidate.status)) {
    issues.push(`Invalid status "${String(candidate.status)}".`);
  }
  const evidence = dedupeEvidence(candidate.evidence);
  if (evidence.length === 0) {
    issues.push('evidence must contain at least one valid EvidenceRef.');
  }

  if (issues.length > 0) {
    return { ok: false, code: 'E_EXPLANATION', issues };
  }

  return {
    ok: true,
    value: {
      id: candidate.id,
      subjectId: candidate.subjectId,
      topic: candidate.topic,
      depth: candidate.depth,
      text: candidate.text.trim(),
      evidence,
      claim: candidate.claim,
      ...(candidate.status !== undefined ? { status: candidate.status } : {}),
      ruleId: candidate.ruleId,
      rulesetVersion: candidate.rulesetVersion,
    },
  };
}
