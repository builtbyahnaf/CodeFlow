/**
 * Preview presentation model.
 *
 * Pure: given a graph node and an optional source slice, decide what the card
 * says. The webview turns this into DOM; tests assert the decisions without a
 * browser. Synthetic and stale nodes must explain themselves instead of
 * showing misleading source.
 */

import { SOURCE_LIMITS, truncateSource } from './ranges.js';

/**
 * @typedef {Object} PreviewNode
 * @property {string} id
 * @property {string} kind
 * @property {string} label
 * @property {boolean} [isSynthetic]
 * @property {Record<string, any>|null} [range]
 */

/**
 * @typedef {Object} PreviewSlice
 * @property {string} text
 * @property {string} relativePath
 * @property {{startLine: number, endLine: number}} [lines]
 * @property {boolean} [truncated]
 * @property {'exact'|'stale'|'missing'} [integrity]
 * @property {number} [documentVersion]
 * @property {string} [contentHash]
 * @property {string} [reason]
 */

/**
 * @param {{node: PreviewNode, slice?: PreviewSlice|null, maxLines?: number}} input
 * @returns {{
 *   title: string,
 *   kind: string,
 *   file: string,
 *   lineLabel: string,
 *   text: string,
 *   truncated: boolean,
 *   synthetic: boolean,
 *   stale: boolean,
 *   empty: boolean,
 *   message: string,
 *   integrity: 'exact'|'stale'|'missing',
 *   documentVersion: number|null
 * }}
 */
export function buildPreviewModel({ node, slice = null, maxLines = SOURCE_LIMITS.maxLines }) {
  const range = node?.range ?? null;
  const title = String(node?.label ?? 'source');
  const lineLabel = range
    ? `${Number(range.startLine) + 1}–${Number(range.endLine) + 1}`
    : 'no line range';
  const synthetic = node?.isSynthetic === true || !range;

  if (synthetic) {
    return {
      title,
      kind: String(node?.kind ?? 'node'),
      file: range?.fileId ?? '',
      lineLabel,
      text: '',
      truncated: false,
      synthetic: true,
      stale: false,
      empty: false,
      message: range
        ? `Synthetic ${node?.kind ?? 'node'} — function structure, not a source statement. Anchored at line ${Number(range.startLine) + 1}.`
        : `Synthetic ${node?.kind ?? 'node'} — this node has no source range.`,
      integrity: 'exact',
      documentVersion: null,
    };
  }

  if (!slice) {
    return {
      title,
      kind: String(node?.kind ?? 'node'),
      file: range?.fileId ?? '',
      lineLabel,
      text: '',
      truncated: false,
      synthetic: false,
      stale: false,
      empty: true,
      message: 'Source is not available for this range.',
      integrity: 'missing',
      documentVersion: null,
    };
  }

  const trimmed = truncateSource(String(slice.text ?? ''), maxLines);
  const integrity = slice.integrity ?? 'exact';
  const stale = integrity === 'stale';
  const empty = trimmed.text.trim().length === 0;
  let message = '';
  if (stale) {
    message =
      'The document changed since this analysis. The text below is current, but the graph may not match it. Re-analyze before trusting the range.';
  } else if (integrity === 'missing') {
    message = slice.reason || 'The analyzed document is no longer available.';
  } else if (empty) {
    message = 'This range has no source content.';
  }

  return {
    title,
    kind: String(node?.kind ?? 'node'),
    file: String(slice.relativePath ?? range?.fileId ?? ''),
    lineLabel,
    text: trimmed.text,
    truncated: Boolean(trimmed.truncated || slice.truncated),
    synthetic: false,
    stale,
    empty,
    message,
    integrity,
    documentVersion: Number.isInteger(slice.documentVersion) ? slice.documentVersion : null,
  };
}
