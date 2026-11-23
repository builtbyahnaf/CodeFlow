/** Public CFG boundary. Hosts build a CFG from a CSR query layer. */

export { buildCfg, checkInvariants } from './builder.js';
export { layoutCfg, CFG_LAYOUT_DEFAULTS } from './layout.js';
export { toCfgDto, CFG_DTO_VERSION, CFG_RENDER_NODE_LIMIT } from './dto.js';
export {
  CFG_NODE_KINDS,
  CFG_EDGE_KINDS,
  CFG_STATUSES,
  CFG_DEGRADATION_CODES,
  ABRUPT_EDGE_KINDS,
  BACK_EDGE_KINDS,
  dashForStatus,
  glyphForStatus,
  edgeLabel,
} from './kinds.js';
