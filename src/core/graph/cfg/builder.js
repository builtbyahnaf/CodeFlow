/**
 * CFG builder.
 *
 * Consumes the language-neutral `ControlConstruct` tree from the CSR query
 * layer and produces a graph the renderer can draw. It knows nothing about C++,
 * JavaScript, parsers, adapters, or the webview.
 *
 * Design rules:
 * - every source node keeps the construct's range;
 * - structural edges are `resolved`; exception and `goto` edges are honest
 *   about their uncertainty;
 * - unsupported constructs become `unmodeled` nodes plus a degradation entry,
 *   never a silently missing edge;
 * - dead code becomes an `unreachable` node instead of disappearing.
 */

import {
  ABRUPT_EDGE_KINDS,
  CFG_EDGE_KINDS,
  CFG_NODE_KINDS,
  CFG_STATUSES,
  dashForStatus,
  edgeLabel,
  glyphForStatus,
} from './kinds.js';
import { isKnownBuiltinCall } from '../builtins.js';

/**
 * @typedef {import('../../csr/entities.js').ControlConstruct} ControlConstruct
 * @typedef {import('../../csr/entities.js').SourceRange} SourceRange
 * @typedef {import('../../csr/entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('../../csr/query.js').createQueryLayer} QueryFactory
 * @typedef {ReturnType<QueryFactory>} QueryLayer
 */

/** @typedef {'seq'|'break'|'continue'|'return'|'throw'} ExitKind */

/**
 * @typedef {Object} Pending
 * @property {string|null} from
 * @property {ExitKind} kind
 * @property {string} [status]
 * @property {string} [reasonCode]
 * @property {string} [label]
 * @property {string} [caseValue]
 */

/**
 * @typedef {Object} CfgNode
 * @property {string} id
 * @property {string} kind
 * @property {string} label
 * @property {string} status
 * @property {SourceRange|null} range
 * @property {boolean} synthetic
 * @property {boolean} unreachable
 * @property {string} [badge]
 * @property {string} [reasonCode]
 * @property {string} [constructId]
 * @property {Array<{to: string, label: string, status: string, reasonCode?: string}>} [calls]
 */

/**
 * @typedef {Object} CfgEdge
 * @property {string} id
 * @property {string} from
 * @property {string} to
 * @property {string} kind
 * @property {string} status
 * @property {string} label
 * @property {string} dash
 * @property {string} glyph
 * @property {string} [reasonCode]
 * @property {string} [caseValue]
 */

/**
 * @typedef {Object} CfgDegradation
 * @property {string} code
 * @property {string} message
 * @property {'info'|'warning'|'error'} severity
 * @property {SourceRange} [range]
 */

/**
 * @typedef {Object} Cfg
 * @property {string} graphId
 * @property {string} symbolId
 * @property {string} runId
 * @property {string} language
 * @property {string} adapterId
 * @property {'full'|'partial'|'syntactic_only'} completeness
 * @property {{symbolId: string, name: string, qualifiedName: string, kind: string, range: SourceRange}} function
 * @property {CfgNode[]} nodes
 * @property {CfgEdge[]} edges
 * @property {CfgDegradation[]} degradations
 * @property {string} entryId
 * @property {string} exitId
 * @property {{nodeCount: number, edgeCount: number, unmodeledCount: number, unreachableCount: number}} stats
 */

/**
 * Contain any unexpected failure as a typed result. A malformed adapter or a
 * corrupted run must degrade the panel, never take it down.
 *
 * @param {QueryLayer} query
 * @param {string} symbolId
 * @param {{maxNodes?: number, allowLarge?: boolean}} [options]
 * @returns {{ok: true, cfg: Cfg} | {ok: false, code: string, message: string, detail?: Record<string, unknown>}}
 */
export function buildCfg(query, symbolId, options = {}) {
  try {
    return buildCfgUnsafe(query, symbolId, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failure('E_CFG_INTERNAL', `CFG construction failed: ${message}`, {
      symbolId: typeof symbolId === 'string' ? symbolId : null,
    });
  }
}

/**
 * @param {QueryLayer} query
 * @param {string} symbolId
 * @param {{maxNodes?: number, allowLarge?: boolean}} [options]
 * @returns {{ok: true, cfg: Cfg} | {ok: false, code: string, message: string, detail?: Record<string, unknown>}}
 */
function buildCfgUnsafe(query, symbolId, options = {}) {
  if (!query || typeof query !== 'object') {
    return failure('E_CFG_INPUT', 'CFG building requires a CSR query layer.');
  }
  if (typeof symbolId !== 'string' || symbolId.length === 0) {
    return failure('E_CFG_INPUT', 'CFG building requires a symbol id.');
  }

  const infoResult = query.runInfo();
  if (!infoResult || infoResult.ok !== true) {
    return failure('E_CFG_INPUT', 'The CSR run has no readable metadata.');
  }
  const info = infoResult.value;

  const symbolResult = query.symbolById(symbolId);
  if (!symbolResult || symbolResult.ok !== true) {
    return failure('E_NOT_FOUND', `No symbol "${symbolId}".`);
  }
  const symbol = symbolResult.value;

  const constructsResult = query.constructsOf(symbolId);
  if (!constructsResult || constructsResult.ok !== true) {
    return failure(
      constructsResult?.code ?? 'E_CFG_UNAVAILABLE',
      constructsResult?.message ?? 'Control constructs are not available for this symbol.',
    );
  }
  const constructs = constructsResult.value;
  if (!Array.isArray(constructs.roots) || constructs.roots.length === 0) {
    return failure(
      'E_CFG_UNAVAILABLE',
      `No control constructs were produced for "${symbol.qualifiedName}".`,
      { symbolId },
    );
  }

  const relationshipsResult = query.allRelationships();
  const relationships =
    relationshipsResult && relationshipsResult.ok ? relationshipsResult.value : [];

  const callRelationships = relationships.filter(
    (relationship) =>
      (relationship.type === 'calls' || relationship.type === 'instantiates') &&
      relationship.from === symbolId,
  );
  const resolveExternalCall =
    typeof options.resolveExternalCall === 'function' ? options.resolveExternalCall : null;

  const maxNodes = options.allowLarge === true ? 20_000 : Math.max(2, options.maxNodes ?? 1500);

  /** @type {CfgNode[]} */
  const nodes = [];
  /** @type {CfgEdge[]} */
  const edges = [];
  /** @type {CfgDegradation[]} */
  const degradations = [];
  /** @type {Map<string, ControlConstruct>} */
  const byId = new Map();
  for (const [id, construct] of Object.entries(constructs.byId ?? {})) {
    byId.set(id, /** @type {ControlConstruct} */ (construct));
  }
  /** @type {Map<string, SymbolRecord>} */
  const symbolById = new Map();
  const allSymbols = query.allSymbols();
  if (allSymbols && allSymbols.ok) {
    for (const entry of allSymbols.value) {
      symbolById.set(entry.symbolId, entry);
    }
  }

  let nodeCounter = 0;
  let edgeCounter = 0;
  let unmodeledCount = 0;
  let unreachableCount = 0;
  let missingCallSites = 0;
  /** @type {Set<string>} */
  const edgeKeys = new Set();

  /**
   * @param {string} kind
   * @param {{label?: string, range?: SourceRange|null, status?: string, badge?: string, reasonCode?: string, constructId?: string, synthetic?: boolean, unreachable?: boolean, calls?: CfgNode['calls']}} [input]
   * @returns {CfgNode}
   */
  function addNode(kind, input = {}) {
    if (nodes.length >= maxNodes) {
      const error = /** @type {Error & {code: string, detail: Record<string, unknown>}} */ (
        new Error(`The CFG exceeds the ${maxNodes}-node limit.`)
      );
      error.code = 'E_CFG_TOO_LARGE';
      error.detail = { symbolId, nodeCount: nodes.length + 1, limit: maxNodes };
      throw error;
    }
    nodeCounter += 1;
    const id = `cfg:${symbolId}:n${String(nodeCounter).padStart(4, '0')}`;
    const status = CFG_STATUSES.includes(input.status ?? 'resolved')
      ? String(input.status ?? 'resolved')
      : 'resolved';
    /** @type {CfgNode} */
    const node = {
      id,
      kind,
      label: String(input.label ?? kind),
      status,
      range: input.range ?? null,
      synthetic: input.synthetic === true,
      unreachable: input.unreachable === true,
    };
    if (input.badge) {
      node.badge = input.badge;
    }
    if (input.reasonCode) {
      node.reasonCode = input.reasonCode;
    }
    if (input.constructId) {
      node.constructId = input.constructId;
    }
    if (input.calls && input.calls.length > 0) {
      node.calls = input.calls;
    }
    if (isPlainObject(input.details)) {
      node.details = input.details;
    }
    nodes.push(node);
    return node;
  }

  /**
   * @param {{from: string, to: string, kind: string, status?: string, reasonCode?: string, label?: string, caseValue?: string}} input
   */
  function addEdge(input) {
    const kind = CFG_EDGE_KINDS.includes(input.kind) ? input.kind : 'seq';
    const status = CFG_STATUSES.includes(input.status ?? 'resolved')
      ? String(input.status ?? 'resolved')
      : 'resolved';
    const label = input.label ?? edgeLabel(kind, input.caseValue);
    const key = `${input.from}|${input.to}|${kind}|${label}|${status}`;
    if (edgeKeys.has(key)) {
      return;
    }
    edgeKeys.add(key);
    edgeCounter += 1;
    /** @type {CfgEdge} */
    const edge = {
      id: `cfg:${symbolId}:e${String(edgeCounter).padStart(4, '0')}`,
      from: input.from,
      to: input.to,
      kind,
      status,
      label,
      dash: dashForStatus(status),
      glyph: glyphForStatus(status),
    };
    if (input.reasonCode) {
      edge.reasonCode = input.reasonCode;
    }
    if (input.caseValue !== undefined) {
      edge.caseValue = input.caseValue;
    }
    edges.push(edge);
  }

  /**
   * @param {string} code
   * @param {string} message
   * @param {SourceRange} [range]
   * @param {'info'|'warning'|'error'} [severity]
   */
  function degrade(code, message, range, severity = 'warning') {
    degradations.push({
      code,
      message,
      severity,
      ...(range ? { range } : {}),
    });
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {ControlConstruct[]}
   */
  function childrenOf(construct) {
    const ids = Array.isArray(construct.children) ? construct.children : [];
    /** @type {ControlConstruct[]} */
    const result = [];
    for (const id of ids) {
      const child = byId.get(id);
      if (child) {
        result.push(child);
      }
    }
    return result;
  }

  /**
   * @param {ControlConstruct} construct
   * @param {string} [kind]
   * @returns {ControlConstruct|null}
   */
  function childOfKind(construct, kind) {
    return childrenOf(construct).find((child) => child.kind === kind) ?? null;
  }

  /**
   * Calls recorded by the adapter at the same source range as the construct.
   *
   * @param {ControlConstruct} construct
   * @returns {CfgNode['calls']}
   */
  function callsAt(construct) {
    const site =
      construct.extensions && isPlainObject(construct.extensions.callSite)
        ? /** @type {SourceRange} */ (construct.extensions.callSite)
        : construct.sourceRange;
    return callsAtRange(site);
  }

  /**
   * @param {SourceRange|null|undefined} site
   * @returns {CfgNode['calls']}
   */
  function callsAtRange(site) {
    if (!isPlainObject(site)) {
      return undefined;
    }
    const key = rangeKey(site);
    let exactMatches = callRelationships.filter(
      (relationship) => relationship.site && rangeKey(relationship.site) === key,
    );
    if (exactMatches.length === 0) {
      exactMatches = callRelationships.filter(
        (relationship) => relationship.site && rangeContains(site, relationship.site),
      );
    }
    if (exactMatches.length === 0) {
      return undefined;
    }
    return exactMatches.map((relationship) => {
      const target = symbolById.get(relationship.to);
      const baseLabel = target
        ? target.name || target.qualifiedName
        : placeholderName(relationship.to);
      if (relationship.status === 'unresolved' && resolveExternalCall) {
        const resolved = resolveExternalCall({
          to: relationship.to,
          calleeName: baseLabel,
          relationship,
        });
        if (resolved && resolved.to) {
          return {
            to: resolved.to,
            label: resolved.label ?? baseLabel,
            status: resolved.status ?? 'inferred',
            ...(resolved.reasonCode ? { reasonCode: resolved.reasonCode } : {}),
          };
        }
      }
      if (
        relationship.status === 'unresolved' &&
        isKnownBuiltinCall(relationship.to, baseLabel)
      ) {
        return {
          to: relationship.to,
          label: baseLabel,
          status: 'resolved',
          reasonCode: 'builtin_api',
        };
      }
      return {
        to: relationship.to,
        label: baseLabel,
        status: relationship.status,
        ...(relationship.reasonCode ? { reasonCode: relationship.reasonCode } : {}),
      };
    });
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {{status: string, badge: string, calls: CfgNode['calls']}}
   */
  function callSummary(construct) {
    const calls = callsAt(construct);
    const calleeName = extensionString(construct, 'calleeName');
    if (!calls) {
      if (resolveExternalCall && calleeName) {
        const resolved = resolveExternalCall({ to: `external:${calleeName}`, calleeName });
        if (resolved && resolved.to) {
          const entry = [
            {
              to: resolved.to,
              label: resolved.label ?? calleeName,
              status: resolved.status ?? 'inferred',
              ...(resolved.reasonCode ? { reasonCode: resolved.reasonCode } : {}),
            },
          ];
          return { ...summarizeCalls(entry), calls: entry };
        }
      }
      if (calleeName && isKnownBuiltinCall(`external:${calleeName}`, calleeName)) {
        return { status: 'resolved', badge: '', calls: [] };
      }
      missingCallSites += 1;
      return { status: 'unresolved', badge: 'unresolved', calls: [] };
    }
    return { ...summarizeCalls(calls), calls };
  }

  /**
   * @param {NonNullable<CfgNode['calls']>} calls
   * @returns {{status: string, badge: string}}
   */
  function summarizeCalls(calls) {
    const statuses = new Set(calls.map((entry) => entry.status));
    const status = statuses.has('resolved')
      ? 'resolved'
      : statuses.has('possible')
        ? 'possible'
        : statuses.has('inferred')
          ? 'inferred'
          : statuses.has('stale')
            ? 'stale'
            : 'unresolved';
    const badge =
      calls.length > 1
        ? `${calls.length} targets · ${status}`
        : status === 'resolved'
          ? ''
          : `${status}`;
    return { status, badge };
  }

  /**
   * @param {Pending[]} pending
   * @param {CfgNode} node
   * @returns {Pending[]}
   */
  function attach(pending, node) {
    /** @type {Pending[]} */
    const preserved = [];
    for (const entry of pending) {
      if (ABRUPT_EDGE_KINDS.includes(entry.kind) || entry.kind === 'unreachable') {
        preserved.push(entry);
        continue;
      }
      if (entry.from) {
        addEdge({
          from: entry.from,
          to: node.id,
          kind: entry.kind,
          ...(entry.status ? { status: entry.status } : {}),
          ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
          ...(entry.label ? { label: entry.label } : {}),
          ...(entry.caseValue !== undefined ? { caseValue: entry.caseValue } : {}),
        });
      }
    }
    return [...preserved, { from: node.id, kind: 'seq' }];
  }

  /**
   * @param {Pending[]} pending
   * @param {string} kind
   * @param {string} [status]
   * @param {string} [reasonCode]
   * @returns {Pending[]}
   */
  function retag(pending, kind, status, reasonCode) {
    return pending.map((entry) => ({
      ...entry,
      kind,
      ...(status ? { status } : {}),
      ...(reasonCode ? { reasonCode } : {}),
    }));
  }

  /**
   * Lower a normalized condition expression tree. Returns the pending edges that
   * leave the true and false sides of the test.
   *
   * @param {any} expression
   * @param {Pending[]} incoming
   * @param {string} [fallbackSource]
   * @returns {{truthy: Pending[], falsy: Pending[]}}
   */
  function lowerCondition(expression, incoming, fallbackRange) {
    const shape = isPlainObject(expression) ? expression : { type: 'leaf', range: fallbackRange };
    const type = String(shape.type ?? 'leaf');
    if (type === 'and' || type === 'or' || type === 'nullish') {
      const left = lowerCondition(shape.left, incoming, fallbackRange);
      const right = lowerCondition(shape.right, left.truthy, fallbackRange);
      if (type === 'and') {
        return { truthy: right.truthy, falsy: [...left.falsy, ...right.falsy] };
      }
      return { truthy: [...left.truthy, ...right.truthy], falsy: right.falsy };
    }
    if (type === 'not') {
      let current = shape;
      let inverted = false;
      while (current && current.type === 'not') {
        inverted = !inverted;
        current = current.operand;
      }
      const leafLike =
        current &&
        current.type !== 'and' &&
        current.type !== 'or' &&
        current.type !== 'nullish' &&
        current.type !== 'ternary';
      if (leafLike) {
        const innerLabel =
          typeof current.label === 'string' && current.label ? current.label : 'condition';
        const explicitLabel = typeof shape.label === 'string' && shape.label ? shape.label : '';
        const finalLabel =
          explicitLabel ||
          (inverted ? (innerLabel.startsWith('!') ? innerLabel : `!${innerLabel}`) : innerLabel);
        const leafRange = asRange(shape.range ?? current.range ?? fallbackRange);
        const leafCallSite = asRange(shape.callSite ?? current.callSite);
        return lowerCondition(
          {
            type: 'leaf',
            label: finalLabel,
            range: leafRange,
            ...(leafCallSite ? { callSite: leafCallSite } : {}),
          },
          incoming,
          fallbackRange,
        );
      }
      const inner = lowerCondition(shape.operand, incoming, fallbackRange);
      return { truthy: retag(inner.falsy, 'true'), falsy: retag(inner.truthy, 'false') };
    }
    if (type === 'ternary') {
      // A ternary used as a condition means: the true side of the test is the
      // consequent's truth value and the false side is the alternate's.
      const test = lowerCondition(shape.test, incoming, fallbackRange);
      const consequent = lowerCondition(shape.consequent, test.truthy, fallbackRange);
      const alternate = lowerCondition(shape.alternate, test.falsy, fallbackRange);
      return {
        truthy: [...consequent.truthy, ...alternate.falsy],
        falsy: [...consequent.falsy, ...alternate.truthy],
      };
    }
    if (type !== 'leaf') {
      degrade(
        'condition_shape_unmodeled',
        `The condition shape "${type}" is not modelled; a single test node was used.`,
        asRange(shape.range ?? fallbackRange),
      );
    }
    const range = asRange(shape.range ?? fallbackRange);
    const callTargets = callsAtRange(asRange(shape.callSite) ?? range);
    const callInfo = callTargets ? summarizeCalls(callTargets) : null;
    const node = addNode('condition', {
      label: typeof shape.label === 'string' && shape.label ? shape.label : 'condition',
      range,
      synthetic: !range,
      ...(callInfo
        ? {
            status: callInfo.status,
            ...(callInfo.badge ? { badge: callInfo.badge } : {}),
            calls: callTargets,
          }
        : range
          ? {}
          : { status: 'unresolved', reasonCode: 'range_unavailable' }),
    });
    return {
      truthy: retag(attach(incoming, node), 'true'),
      falsy: retag([{ from: node.id, kind: 'seq' }], 'false'),
    };
  }

  /**
   * Lower one construct. Entries that leave the previous construct abruptly
   * (return, break, continue, throw) bypass this construct instead of being
   * rewired into it, so they stay attached to their real target.
   *
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerConstruct(construct, incoming) {
    const normal = [];
    /** @type {Pending[]} */
    const carried = [];
    for (const entry of incoming) {
      (isNormalEntry(entry) ? normal : carried).push(entry);
    }
    return [...carried, ...lowerConstructInner(construct, normal)];
  }

  /**
   * @param {Pending} entry
   * @returns {boolean}
   */
  function isNormalEntry(entry) {
    return !ABRUPT_EDGE_KINDS.includes(entry.kind) && entry.kind !== 'unreachable';
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerConstructInner(construct, incoming) {
    const kind = String(construct.kind ?? 'unknown');
    switch (kind) {
      case 'sequence':
      case 'block':
      case 'entry':
      case 'else':
        return lowerList(childrenOf(construct), incoming);

      case 'statement':
        return lowerSimple(construct, incoming, 'statement');

      case 'call': {
        const summary = callSummary(construct);
        const name =
          isPlainObject(construct.extensions) && typeof construct.extensions.calleeName === 'string'
            ? construct.extensions.calleeName
            : '';
        const assignmentTarget = extensionString(construct, 'assignmentTarget');
        const expression = extensionString(construct, 'expression');
        const node = addNode('call', {
          label: extensionString(construct, 'label') ?? (name ? `call ${name}` : 'call'),
          range: construct.sourceRange,
          status: summary.status,
          badge: assignmentTarget ? `-> ${assignmentTarget}` : summary.badge,
          constructId: construct.constructId,
          calls: summary.calls,
          ...((name || assignmentTarget || expression)
            ? {
                details: {
                  ...(name ? { calleeName: name } : {}),
                  ...(assignmentTarget ? { assignmentTarget } : {}),
                  ...(expression ? { expression } : {}),
                },
              }
            : {}),
        });
        return attach(incoming, node);
      }

      case 'await':
      case 'yield': {
        const node = addNode(kind, {
          label: extensionString(construct, 'label') ?? kind,
          range: construct.sourceRange,
          constructId: construct.constructId,
        });
        const after = attach(incoming, node);
        const children = childrenOf(construct);
        return children.length > 0 ? lowerList(children, after) : after;
      }

      case 'return': {
        const children = childrenOf(construct);
        const before = children.length > 0 ? lowerList(children, incoming) : incoming;
        const range = returnValueRange(construct);
        const returnExpression = extensionString(construct, 'returnExpression');
        const node = addNode('return', {
          label: extensionString(construct, 'label') ?? 'return',
          range: construct.sourceRange,
          constructId: construct.constructId,
          ...(range ? { badge: 'value' } : {}),
          ...(returnExpression ? { details: { returnExpression } } : {}),
        });
        attach(before, node);
        return [{ from: node.id, kind: 'return' }];
      }

      case 'throw': {
        const children = childrenOf(construct);
        const before = children.length > 0 ? lowerList(children, incoming) : incoming;
        const node = addNode('throw', {
          label: extensionString(construct, 'label') ?? 'throw',
          range: construct.sourceRange,
          constructId: construct.constructId,
        });
        attach(before, node);
        return [{ from: node.id, kind: 'throw' }];
      }

      case 'break':
      case 'continue': {
        const label = extensionString(construct, 'label');
        const node = addNode(kind, {
          label: extensionString(construct, 'sourceLabel') ?? (label ? `${kind} ${label}` : kind),
          range: construct.sourceRange,
          constructId: construct.constructId,
        });
        attach(incoming, node);
        return [{ from: node.id, kind, ...(label ? { label } : {}) }];
      }

      case 'if':
        return lowerIf(construct, incoming);

      case 'ternary':
      case 'short_circuit':
        return lowerExpressionBranches(construct, incoming);

      case 'while':
        return lowerPreTestLoop(construct, incoming, 'while');

      case 'do_while':
        return lowerPostTestLoop(construct, incoming);

      case 'for':
        return lowerForLoop(construct, incoming);

      case 'loop':
        return lowerPreTestLoop(construct, incoming, 'loop');

      case 'switch':
        return lowerSwitch(construct, incoming);

      case 'case':
      case 'default':
        return lowerList(childrenOf(construct), incoming);

      case 'try':
        return lowerTry(construct, incoming);

      case 'catch':
      case 'finally':
        return lowerList(childrenOf(construct), incoming);

      case 'goto':
      case 'jump': {
        const label = extensionString(construct, 'label');
        const indirect = extensionBoolean(construct, 'indirect') || kind === 'jump';
        const node = addNode('unmodeled', {
          label: indirect ? 'computed jump' : `goto${label ? ` ${label}` : ''}`,
          range: construct.sourceRange,
          status: 'unresolved',
          reasonCode: indirect ? 'indirect_goto_flow' : 'goto_flow',
          badge: indirect ? 'computed goto' : 'goto',
          constructId: construct.constructId,
        });
        unmodeledCount += 1;
        degrade(
          indirect ? 'indirect_goto_flow' : 'goto_flow',
          indirect
            ? 'A computed goto cannot be modeled statically; the outgoing edge is unresolved.'
            : `A goto${label ? ` to "${label}"` : ''} cannot be modeled statically; the outgoing edge is unresolved.`,
          construct.sourceRange,
        );
        attach(incoming, node);
        return [
          {
            from: node.id,
            kind: 'seq',
            status: 'unresolved',
            reasonCode: indirect ? 'indirect_goto_flow' : 'goto_flow',
          },
        ];
      }

      case 'label':
        return lowerList(childrenOf(construct), incoming);

      case 'unreachable': {
        unreachableCount += 1;
        const node = addNode('unreachable', {
          label: 'unreachable code',
          range: construct.sourceRange,
          unreachable: true,
          badge: 'unreachable',
          constructId: construct.constructId,
        });
        attach(incoming, node);
        return [{ from: node.id, kind: 'seq' }];
      }

      case 'unsupported':
      case 'unknown':
      default: {
        const reasonCode = extensionString(construct, 'reasonCode') ?? 'unsupported_construct';
        const node = addNode('unmodeled', {
          label: extensionString(construct, 'label') ?? `unmodeled ${kind}`,
          range: construct.sourceRange,
          status: 'unresolved',
          reasonCode,
          badge: 'unmodeled',
          constructId: construct.constructId,
        });
        unmodeledCount += 1;
        degrade(
          'unmodeled_construct',
          `The "${kind}" construct could not be modeled (${reasonCode}).`,
          construct.sourceRange,
        );
        return attach(incoming, node);
      }
    }
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @param {'statement'} kind
   * @returns {Pending[]}
   */
  function lowerSimple(construct, incoming, kind) {
    const node = addNode(kind, {
      label: extensionString(construct, 'label') ?? kind,
      range: construct.sourceRange,
      constructId: construct.constructId,
    });
    return attach(incoming, node);
  }

  /**
   * @param {ControlConstruct[]} constructs
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerList(constructs, incoming) {
    let pending = incoming;
    for (let index = 0; index < constructs.length; index += 1) {
      const hasNormal = pending.some(
        (entry) => !ABRUPT_EDGE_KINDS.includes(entry.kind) && entry.kind !== 'unreachable',
      );
      if (!hasNormal && pending.length > 0) {
        const remaining = constructs.slice(index);
        const first = remaining[0];
        const last = remaining[remaining.length - 1];
        const range = mergeRanges(first.sourceRange, last.sourceRange);
        unreachableCount += 1;
        const dead = addNode('unreachable', {
          label:
            remaining.length > 1
              ? `unreachable code (${remaining.length} constructs)`
              : 'unreachable code',
          range,
          unreachable: true,
          badge: 'unreachable',
        });
        for (const entry of pending) {
          addEdge({
            from: entry.from,
            to: dead.id,
            kind: 'unreachable',
            ...(entry.status ? { status: entry.status } : {}),
            ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
          });
        }
        return [{ from: dead.id, kind: 'seq' }];
      }
      pending = lowerConstruct(constructs[index], pending);
    }
    return pending;
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {ControlConstruct[]}
   */
  function bodyChildren(construct) {
    return childrenOf(construct);
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {ControlConstruct|null}
   */
  function firstBodyNode(construct) {
    return bodyChildren(construct)[0] ?? null;
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {[ControlConstruct|null, ControlConstruct|null]}
   */
  function ifBranchesOf(construct) {
    const all = bodyChildren(construct);
    const elseConstruct = all.find((child) => child.kind === 'else') ?? null;
    const thenConstruct = all.find((child) => child !== elseConstruct) ?? null;
    return [thenConstruct, elseConstruct];
  }

  /**
   * @param {ControlConstruct} construct
   * @returns {[ControlConstruct|null, ControlConstruct|null]}
   */
  function expressionBranchesOf(construct) {
    const all = bodyChildren(construct);
    const elseConstruct =
      all.find((child) => child.kind === 'else') ??
      all.find((child) => child.extensions?.branch === 'else') ??
      null;
    const thenConstruct =
      all.find((child) => child !== elseConstruct && child.extensions?.branch !== 'else') ?? null;
    return [thenConstruct, elseConstruct];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerIf(construct, incoming) {
    const condition = conditionOf(construct);
    const split = lowerCondition(condition, incoming, construct.condition ?? construct.sourceRange);
    const [thenConstruct, elseConstruct] = ifBranchesOf(construct);
    const thenExits = thenConstruct ? lowerConstruct(thenConstruct, split.truthy) : split.truthy;
    const elseExits = elseConstruct ? lowerConstruct(elseConstruct, split.falsy) : split.falsy;
    return joinBranches([...thenExits, ...elseExits], construct.sourceRange);
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerExpressionBranches(construct, incoming) {
    const condition = conditionOf(construct);
    const split = lowerCondition(
      condition,
      incoming,
      construct.condition ?? construct.sourceRange,
    );
    const [thenConstruct, elseConstruct] = expressionBranchesOf(construct);
    const thenExits = thenConstruct ? lowerConstruct(thenConstruct, split.truthy) : split.truthy;
    const elseExits = elseConstruct ? lowerConstruct(elseConstruct, split.falsy) : split.falsy;
    return joinBranches([...thenExits, ...elseExits], construct.sourceRange);
  }

  /**
   * @param {Pending[]} exits
   * @param {SourceRange} range
   * @returns {Pending[]}
   */
  function joinBranches(exits, range) {
    const normal = exits.filter(isNormalEntry);
    const abrupt = exits.filter((entry) => !isNormalEntry(entry));
    if (normal.length === 0) {
      return abrupt;
    }
    const merge = addNode('merge', {
      label: 'merge',
      range,
      synthetic: true,
    });
    for (const entry of normal) {
      addEdge({
        from: entry.from,
        to: merge.id,
        kind: entry.kind,
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      });
    }
    return [...abrupt, { from: merge.id, kind: 'seq' }];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @param {'while'|'loop'} kind
   * @returns {Pending[]}
   */
  function lowerPreTestLoop(construct, incoming, kind) {
    const label = extensionString(construct, 'label');
    const header = addNode('loop_header', {
      label: extensionString(construct, 'sourceLabel') ?? `${kind} test`,
      range: construct.condition ?? construct.sourceRange,
      constructId: construct.constructId,
      ...(label ? { badge: label } : {}),
    });
    attach(incoming, header);
    const condition = conditionOf(construct);
    const split = lowerCondition(condition, [{ from: header.id, kind: 'seq' }], construct.condition ?? construct.sourceRange);
    const body = childOfKind(construct, 'block') ?? firstBodyNode(construct);
    const bodyExits = body ? lowerConstruct(body, split.truthy) : split.truthy;
    const after = addNode('merge', {
      label: 'after loop',
      range: construct.sourceRange,
      synthetic: true,
    });
    const latch = addNode('loop_latch', {
      label: 'loop back',
      range: construct.sourceRange,
      synthetic: true,
    });
    const loops = { label, breakTarget: after.id, continueTarget: latch.id };
    const { normal, breaks, continues, other } = classifyLoopExits(bodyExits, loops);
    for (const entry of normal) {
      addEdge({ from: entry.from, to: latch.id, kind: 'seq' });
    }
    for (const entry of breaks) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'break',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    for (const entry of continues) {
      addEdge({
        from: entry.from,
        to: latch.id,
        kind: 'continue',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    addEdge({ from: latch.id, to: header.id, kind: 'loop_back' });
    for (const entry of split.falsy) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'false',
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      });
    }
    return [...other, { from: after.id, kind: 'seq' }];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerPostTestLoop(construct, incoming) {
    const label = extensionString(construct, 'label');
    const bodyEntry = addNode('loop_body_entry', {
      label: 'do body',
      range: construct.sourceRange,
      constructId: construct.constructId,
      ...(label ? { badge: label } : {}),
    });
    attach(incoming, bodyEntry);
    const body = childOfKind(construct, 'block') ?? firstBodyNode(construct);
    const bodyExits = body
      ? lowerConstruct(body, [{ from: bodyEntry.id, kind: 'seq' }])
      : [{ from: bodyEntry.id, kind: 'seq' }];
    const after = addNode('merge', {
      label: 'after loop',
      range: construct.sourceRange,
      synthetic: true,
    });
    const latch = addNode('loop_latch', {
      label: extensionString(construct, 'sourceLabel') ?? 'do test',
      range: construct.condition ?? construct.sourceRange,
      constructId: construct.constructId,
    });
    const loops = { label, breakTarget: after.id, continueTarget: latch.id };
    const { normal, breaks, continues, other } = classifyLoopExits(bodyExits, loops);
    for (const entry of normal) {
      addEdge({ from: entry.from, to: latch.id, kind: 'seq' });
    }
    for (const entry of breaks) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'break',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    for (const entry of continues) {
      addEdge({
        from: entry.from,
        to: latch.id,
        kind: 'continue',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    const split = lowerCondition(conditionOf(construct), [{ from: latch.id, kind: 'seq' }], construct.condition ?? construct.sourceRange);
    for (const entry of split.truthy) {
      addEdge({ from: entry.from, to: bodyEntry.id, kind: 'loop_back' });
    }
    for (const entry of split.falsy) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'false',
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      });
    }
    return [...other, { from: after.id, kind: 'seq' }];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerForLoop(construct, incoming) {
    const label = extensionString(construct, 'label');
    const iteration = extensionString(construct, 'iteration');
    let pending = incoming;
    if (extensionBoolean(construct, 'hasInit')) {
      const init = addNode('statement', {
        label: extensionString(construct, 'initLabel') ?? 'for init',
        range: asRange(construct.extensions?.initRange) ?? construct.sourceRange,
        constructId: construct.constructId,
      });
      pending = attach(pending, init);
    }
    const header = addNode('loop_header', {
      label:
        extensionString(construct, 'sourceLabel') ??
        (iteration ? `for-${iteration} test` : 'for test'),
      range: construct.condition ?? construct.sourceRange,
      constructId: construct.constructId,
      ...(iteration === 'of' || iteration === 'in' ? { badge: 'iteration' } : {}),
      ...(label ? { badge: label } : {}),
    });
    attach(pending, header);
    if (iteration === 'of' || iteration === 'in') {
      degrade(
        'iteration_source_opaque',
        `The ${iteration === 'of' ? 'iterated' : 'enumerated'} value is not expanded into individual iterations; the loop is shown as one header.`,
        construct.condition ?? construct.sourceRange,
        'info',
      );
    }
    let condition;
    if (extensionBoolean(construct, 'hasCondition') || construct.condition) {
      condition = lowerCondition(
        conditionOf(construct),
        [{ from: header.id, kind: 'seq' }],
        construct.condition ?? construct.sourceRange,
      );
    } else {
      condition = {
        truthy: [{ from: header.id, kind: 'true' }],
        falsy: [],
      };
    }
    const body = childOfKind(construct, 'block') ?? firstBodyNode(construct);
    const bodyExits = body ? lowerConstruct(body, condition.truthy) : condition.truthy;
    const after = addNode('merge', {
      label: 'after loop',
      range: construct.sourceRange,
      synthetic: true,
    });
    const latch = addNode('loop_latch', {
      label:
        extensionString(construct, 'updateLabel') ??
        (extensionBoolean(construct, 'hasUpdate') ? 'for update' : 'loop back'),
      range: asRange(construct.extensions?.updateRange) ?? construct.sourceRange,
      constructId: construct.constructId,
    });
    const loops = { label, breakTarget: after.id, continueTarget: latch.id };
    const { normal, breaks, continues, other } = classifyLoopExits(bodyExits, loops);
    for (const entry of normal) {
      addEdge({ from: entry.from, to: latch.id, kind: 'seq' });
    }
    for (const entry of breaks) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'break',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    for (const entry of continues) {
      addEdge({
        from: entry.from,
        to: latch.id,
        kind: 'continue',
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    addEdge({ from: latch.id, to: header.id, kind: 'loop_back' });
    for (const entry of condition.falsy) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: 'false',
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
      });
    }
    return [...other, { from: after.id, kind: 'seq' }];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerSwitch(construct, incoming) {
    const label = extensionString(construct, 'label');
    const multiway = addNode('multiway', {
      label: extensionString(construct, 'sourceLabel') ?? 'switch',
      range: construct.condition ?? construct.sourceRange,
      constructId: construct.constructId,
      ...(label ? { badge: label } : {}),
    });
    attach(incoming, multiway);
    const cases = childrenOf(construct).filter(
      (child) => child.kind === 'case' || child.kind === 'default',
    );
    const after = addNode('merge', {
      label: 'after switch',
      range: construct.sourceRange,
      synthetic: true,
    });
    /** @type {Pending[]} */
    let fallthrough = [];
    /** @type {Pending[]} */
    const abrupt = [];
    let hasDefault = false;
    for (const caseConstruct of cases) {
      const test =
        caseConstruct.kind === 'default'
          ? 'default'
          : (extensionString(caseConstruct, 'test') ?? 'default');
      const isDefault = test === 'default' || caseConstruct.kind === 'default';
      hasDefault = hasDefault || isDefault;
      const entryKind = isDefault ? 'default' : 'case';
      /** @type {Pending[]} */
      const incomingEdges = [
        {
          from: multiway.id,
          kind: entryKind,
          ...(isDefault ? {} : { caseValue: test, label: `case ${test}` }),
        },
        ...fallthrough,
      ];
      if (childrenOf(caseConstruct).length === 0) {
        // An empty case falls through immediately; keep its dispatch edges
        // pending so they attach to the next case or to `after`.
        fallthrough = incomingEdges;
        continue;
      }
      const exits = lowerConstruct(caseConstruct, incomingEdges);
      fallthrough = exits.filter(isNormalEntry);
      for (const entry of exits) {
        if (isNormalEntry(entry)) {
          continue;
        }
        if (entry.kind === 'break' && (!entry.label || entry.label === label)) {
          addEdge({ from: entry.from, to: after.id, kind: 'break' });
          continue;
        }
        abrupt.push(entry);
      }
    }
    if (!hasDefault) {
      addEdge({ from: multiway.id, to: after.id, kind: 'default', label: 'no match' });
    }
    for (const entry of fallthrough) {
      addEdge({
        from: entry.from,
        to: after.id,
        kind: entry.kind === 'seq' ? 'seq' : entry.kind,
        ...(entry.status ? { status: entry.status } : {}),
        ...(entry.reasonCode ? { reasonCode: entry.reasonCode } : {}),
        ...(entry.label ? { label: entry.label } : {}),
      });
    }
    return [...abrupt, { from: after.id, kind: 'seq' }];
  }

  /**
   * @param {ControlConstruct} construct
   * @param {Pending[]} incoming
   * @returns {Pending[]}
   */
  function lowerTry(construct, incoming) {
    const body = childOfKind(construct, 'block') ?? childOfKind(construct, 'sequence') ?? firstBodyNode(construct);
    const catchConstruct = childOfKind(construct, 'catch');
    const finallyConstruct = childOfKind(construct, 'finally');
    const outgoing = [];
    let normal = incoming;
    let thrown = [];
    let bodyEntryNode = null;
    if (body) {
      const before = nodes.length;
      const exits = lowerConstruct(body, incoming);
      bodyEntryNode = nodes[before] ?? null;
      normal = exits.filter((entry) => entry.kind !== 'throw');
      thrown = exits.filter((entry) => entry.kind === 'throw');
    }
    let catchExits = [];
    if (catchConstruct) {
      const catchEntry = addNode('catch_entry', {
        label: extensionString(catchConstruct, 'label') ?? 'catch',
        range: catchConstruct.sourceRange,
        constructId: catchConstruct.constructId,
      });
      // The modeled exception path is inferred: static analysis cannot prove
      // every throw from this body reaches this handler.
      const firstSource = body?.sourceRange ?? construct.sourceRange;
      if (bodyEntryNode) {
        addEdge({
          from: bodyEntryNode.id,
          to: catchEntry.id,
          kind: 'exception',
          status: 'inferred',
          reasonCode: 'modeled_exception_path',
          label: 'exception',
        });
      }
      degrade(
        'modeled_exception_path',
        'Exception edges are modeled, not proven: any call in the try body may throw.',
        firstSource,
        'info',
      );
      for (const entry of thrown) {
        addEdge({
          from: entry.from,
          to: catchEntry.id,
          kind: 'exception',
          status: 'inferred',
          reasonCode: 'modeled_exception_path',
        });
      }
      const exits = lowerConstruct(catchConstruct, [{ from: catchEntry.id, kind: 'seq' }]);
      catchExits = exits;
      thrown = exits.filter((entry) => entry.kind === 'throw');
      normal = [...normal, ...exits.filter((entry) => entry.kind !== 'throw')];
    }
    if (finallyConstruct) {
      const finallyEntry = addNode('finally_entry', {
        label: extensionString(finallyConstruct, 'label') ?? 'finally',
        range: finallyConstruct.sourceRange,
        constructId: finallyConstruct.constructId,
      });
      for (const entry of normal) {
        addEdge({ from: entry.from, to: finallyEntry.id, kind: 'finally' });
      }
      const exits = lowerConstruct(finallyConstruct, [{ from: finallyEntry.id, kind: 'seq' }]);
      outgoing.push(...exits);
    } else {
      outgoing.push(...normal, ...catchExits.filter((entry) => entry.kind === 'throw'), ...thrown);
    }
    return outgoing;
  }

  /**
   * @param {Pending[]} exits
   * @param {{label?: string, breakTarget: string, continueTarget: string}} targets
   */
  function classifyLoopExits(exits, targets) {
    /** @type {Pending[]} */
    const normal = [];
    /** @type {Pending[]} */
    const breaks = [];
    /** @type {Pending[]} */
    const continues = [];
    /** @type {Pending[]} */
    const other = [];
    for (const entry of exits) {
      if (isNormalEntry(entry)) {
        normal.push(entry);
      } else if (entry.kind === 'break') {
        if (!entry.label || entry.label === targets.label) {
          breaks.push(entry);
        } else {
          other.push(entry);
        }
      } else if (entry.kind === 'continue') {
        if (!entry.label || entry.label === targets.label) {
          continues.push(entry);
        } else {
          other.push(entry);
        }
      } else {
        other.push(entry);
      }
    }
    return { normal, breaks, continues, other };
  }

  // -------------------------------------------------------------------------
  // Function-level assembly.
  // -------------------------------------------------------------------------

  const entryConstruct =
    constructs.roots.find((construct) => construct.kind === 'entry') ?? constructs.roots[0];
  const entry = addNode('entry', {
    label: `entry ${symbol.name || symbol.qualifiedName}`,
    range: symbol.declaration,
    synthetic: true,
    constructId: entryConstruct?.constructId,
  });

  let exits;
  try {
    const bodyChildren =
      entryConstruct?.kind === 'entry' ? childrenOf(entryConstruct) : constructs.roots;
    exits = lowerList(bodyChildren, [{ from: entry.id, kind: 'seq' }]);
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'E_CFG_TOO_LARGE') {
      return {
        ok: false,
        code: 'E_CFG_TOO_LARGE',
        message: `${symbol.qualifiedName} has more than ${error.detail?.limit ?? maxNodes} CFG nodes.`,
        detail: error.detail ?? { symbolId, limit: maxNodes },
      };
    }
    throw error;
  }

  const exit = addNode('exit', {
    label: 'exit',
    range: null,
    synthetic: true,
  });

  /** @type {Pending[]} */
  const residual = [];
  for (const entryEdge of exits) {
    if (entryEdge.kind === 'seq') {
      addEdge({ from: entryEdge.from, to: exit.id, kind: 'seq' });
    } else if (entryEdge.kind === 'return') {
      addEdge({ from: entryEdge.from, to: exit.id, kind: 'return' });
    } else if (entryEdge.kind === 'throw') {
      addEdge({
        from: entryEdge.from,
        to: exit.id,
        kind: 'throw',
        status: 'inferred',
        reasonCode: 'uncaught_exception',
      });
    } else {
      residual.push(entryEdge);
    }
  }
  for (const entryEdge of residual) {
    degrade(
      'orphan_jump',
      `A ${entryEdge.kind} statement has no enclosing target; it was connected to the exit.`,
      null,
    );
    addEdge({
      from: entryEdge.from,
      to: exit.id,
      kind: 'seq',
      status: 'unresolved',
      reasonCode: 'orphan_jump',
    });
  }

  if (missingCallSites > 0) {
    degrade(
      'call_site_unrecorded',
      `${missingCallSites} call site(s) had no recorded relationship; they are shown as unresolved.`,
      null,
      'info',
    );
  }
  if (info.completeness !== 'full') {
    degrade(
      'analysis_partial',
      `The underlying analysis is ${info.completeness}; the CFG inherits that limit.`,
      null,
      'info',
    );
  }

  // Any node that the constructed edges cannot reach is genuinely unreachable.
  // Mark it explicitly instead of failing an invariant or pretending it is live.
  const reachable = new Set();
  /** @type {Map<string, string[]>} */
  const adjacency = new Map();
  for (const edge of edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }
  const stack = [entry.id];
  while (stack.length > 0) {
    const current = stack.pop();
    if (reachable.has(current)) {
      continue;
    }
    reachable.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  for (const node of nodes) {
    if (!reachable.has(node.id) && !node.unreachable) {
      node.unreachable = true;
      node.badge = node.badge ? `${node.badge} · unreachable` : 'unreachable';
      unreachableCount += 1;
    }
  }

  const dataFlows = nodes
    .filter((node) => node.details?.assignmentTarget)
    .map((node) => ({
      target: node.details.assignmentTarget,
      sourceCall: node.details.calleeName ?? null,
      expression: node.details.expression ?? node.label,
      nodeId: node.id,
    }));
  const returns = nodes
    .filter((node) => node.kind === 'return')
    .map((node) => node.details?.returnExpression ?? node.label);

  /** @type {Cfg} */
  const cfg = {
    graphId: `cfg:${info.runId}:${symbolId}`,
    symbolId,
    runId: info.runId,
    language: info.language,
    adapterId: info.adapterId,
    completeness: info.completeness,
    function: {
      symbolId,
      name: symbol.name || symbol.qualifiedName,
      qualifiedName: symbol.qualifiedName,
      kind: symbol.kind,
      range: symbol.declaration,
      ...(symbol.signature ? { signature: symbol.signature } : {}),
      ...(symbol.extensions?.returnType ? { returnType: symbol.extensions.returnType } : {}),
      ...(Array.isArray(symbol.extensions?.parameters)
        ? { parameters: symbol.extensions.parameters }
        : {}),
      dataFlows,
      returns,
    },
    nodes,
    edges,
    degradations,
    entryId: entry.id,
    exitId: exit.id,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      unmodeledCount,
      unreachableCount,
    },
  };

  const invariant = checkInvariants(cfg);
  if (!invariant.ok) {
    return failure('E_CFG_INVARIANT', invariant.message, { issues: invariant.issues });
  }
  return { ok: true, cfg };
}

/**
 * @param {Cfg} cfg
 * @returns {{ok: true} | {ok: false, message: string, issues: string[]}}
 */
export function checkInvariants(cfg) {
  /** @type {string[]} */
  const issues = [];
  const ids = new Set();
  for (const node of cfg.nodes) {
    if (ids.has(node.id)) {
      issues.push(`Duplicate node id "${node.id}".`);
    }
    ids.add(node.id);
  }
  const entries = cfg.nodes.filter((node) => node.kind === 'entry');
  const exits = cfg.nodes.filter((node) => node.kind === 'exit');
  if (entries.length !== 1) {
    issues.push(`Expected exactly one entry node, found ${entries.length}.`);
  }
  if (exits.length !== 1) {
    issues.push(`Expected exactly one exit node, found ${exits.length}.`);
  }
  const edgeKeys = new Set();
  for (const edge of cfg.edges) {
    if (!ids.has(edge.from)) {
      issues.push(`Edge "${edge.id}" has an unknown source "${edge.from}".`);
    }
    if (!ids.has(edge.to)) {
      issues.push(`Edge "${edge.id}" has an unknown target "${edge.to}".`);
    }
    const key = `${edge.from}|${edge.to}|${edge.kind}|${edge.label}`;
    if (edgeKeys.has(key)) {
      issues.push(`Duplicate edge ${key}.`);
    }
    edgeKeys.add(key);
  }
  for (const node of cfg.nodes) {
    if (node.synthetic || node.kind === 'exit') {
      continue;
    }
    if (!node.range) {
      issues.push(`Non-synthetic node "${node.id}" (${node.kind}) has no range.`);
    }
  }
  // Every node must be reachable from entry, or explicitly marked unreachable.
  const adjacency = new Map();
  for (const edge of cfg.edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }
  const seen = new Set();
  const stack = entries[0] ? [entries[0].id] : [];
  while (stack.length > 0) {
    const current = stack.pop();
    if (seen.has(current)) {
      continue;
    }
    seen.add(current);
    for (const next of adjacency.get(current) ?? []) {
      stack.push(next);
    }
  }
  for (const node of cfg.nodes) {
    if (!seen.has(node.id) && !node.unreachable) {
      issues.push(`Node "${node.id}" is neither reachable nor marked unreachable.`);
    }
  }
  if (issues.length > 0) {
    return { ok: false, message: 'CFG invariants failed.', issues };
  }
  return { ok: true };
}

/**
 * @param {ControlConstruct} construct
 * @returns {any}
 */
function conditionOf(construct) {
  const expression = construct.extensions?.expression;
  if (isPlainObject(expression)) {
    return expression;
  }
  const condition = construct.condition ?? construct.sourceRange;
  return { type: 'leaf', range: condition ?? null };
}

/**
 * @param {ControlConstruct} construct
 * @returns {SourceRange|null}
 */
function returnValueRange(construct) {
  const value = construct.extensions?.valueRange;
  return isPlainObject(value) ? /** @type {SourceRange} */ (value) : null;
}

/**
 * @param {ControlConstruct} construct
 * @param {string} key
 * @returns {string|undefined}
 */
function extensionString(construct, key) {
  const value = construct.extensions?.[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

/**
 * @param {ControlConstruct} construct
 * @param {string} key
 * @returns {boolean}
 */
function extensionBoolean(construct, key) {
  return construct.extensions?.[key] === true;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {unknown} value
 * @returns {SourceRange|null}
 */
function asRange(value) {
  return isPlainObject(value) ? /** @type {SourceRange} */ (value) : null;
}

/**
 * @param {SourceRange} range
 * @returns {string}
 */
function rangeKey(range) {
  return [
    range.fileId,
    range.startLine,
    range.startColumn,
    range.endLine,
    range.endColumn,
  ].join('|');
}

/**
 * True when `outer` encloses `inner` in the same file.
 *
 * @param {SourceRange} outer
 * @param {SourceRange} inner
 * @returns {boolean}
 */
function rangeContains(outer, inner) {
  if (!outer || !inner || outer.fileId !== inner.fileId) {
    return false;
  }
  const startsBefore =
    outer.startLine < inner.startLine ||
    (outer.startLine === inner.startLine && outer.startColumn <= inner.startColumn);
  const endsAfter =
    outer.endLine > inner.endLine ||
    (outer.endLine === inner.endLine && outer.endColumn >= inner.endColumn);
  return startsBefore && endsAfter;
}


/**
 * @param {SourceRange} a
 * @param {SourceRange} b
 * @returns {SourceRange}
 */
function mergeRanges(a, b) {
  if (!a) {
    return b;
  }
  if (!b || a.fileId !== b.fileId) {
    return a;
  }
  return {
    fileId: a.fileId,
    startLine: Math.min(a.startLine, b.startLine),
    startColumn: a.startLine <= b.startLine ? a.startColumn : b.startColumn,
    endLine: Math.max(a.endLine, b.endLine),
    endColumn: a.endLine >= b.endLine ? a.endColumn : b.endColumn,
  };
}

/**
 * @param {string} target
 * @returns {string}
 */
function placeholderName(target) {
  const parts = String(target).split(/[.:/#]/).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : String(target);
}

/**
 * @param {string} code
 * @param {string} message
 * @param {Record<string, unknown>} [detail]
 */
function failure(code, message, detail) {
  return { ok: false, code, message, ...(detail ? { detail } : {}) };
}

export { CFG_NODE_KINDS, CFG_EDGE_KINDS, ABRUPT_EDGE_KINDS };
