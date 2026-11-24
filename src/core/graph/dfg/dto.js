/**
 * DFG DTO serialization and validation.
 *
 * Converts a Dfg object into a plain JSON-safe DTO that the webview can
 * consume via the protocol, and validates inbound DTO shapes.
 */

import { validateDfg } from './model.js';
import { DFG_DTO_VERSION } from './kinds.js';

/**
 * @typedef {import('./model.js').Dfg} Dfg
 */

/**
 * Serialize a Dfg to a plain DTO suitable for JSON.stringify.
 *
 * @param {Dfg} dfg
 * @returns {Record<string, unknown>}
 */
export function toDfgDto(dfg) {
  return {
    version:        dfg.version ?? DFG_DTO_VERSION,
    functionId:     dfg.functionId,
    fileId:         dfg.fileId,
    nodes:          dfg.nodes,
    edges:          dfg.edges,
    partial:        dfg.partial,
    partialReasons: dfg.partialReasons ?? [],
    limitations:    dfg.limitations ?? [],
    // byBinding is not serialized (derived on the client side)
  };
}

/**
 * Validate a raw DTO received from the host.
 *
 * @param {unknown} raw
 * @returns {{ ok: true, dfg: Dfg } | { ok: false, issues: import('./model.js').ValidationIssue[] }}
 */
export function fromDfgDto(raw) {
  return validateDfg(raw);
}
