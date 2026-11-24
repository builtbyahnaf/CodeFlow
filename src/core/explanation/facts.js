/**
 * Language-neutral fact extraction for the explanation engine.
 *
 * Consumes ONLY the CFG and the CSR query layer (`createQueryLayer`).
 * Templates never touch AST nodes, adapter output, or raw `run.*` arrays.
 */

import { createEvidenceRef } from './model.js';

/**
 * @typedef {ReturnType<typeof import('../csr/query.js').createQueryLayer>} QueryLayer
 * @typedef {import('../graph/cfg/builder.js').Cfg} Cfg
 * @typedef {import('../graph/cfg/builder.js').CfgNode} CfgNode
 * @typedef {import('../graph/cfg/builder.js').CfgEdge} CfgEdge
 * @typedef {import('../csr/entities.js').ControlConstruct} ControlConstruct
 * @typedef {import('../csr/entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('../csr/entities.js').Relationship} Relationship
 * @typedef {import('../csr/entities.js').DataFact} DataFact
 */

/**
 * @param {Record<string, any>|null|undefined} range
 * @param {string} [fallbackId]
 * @returns {import('./model.js').EvidenceRef|null}
 */
export function rangeEvidence(range, fallbackId = 'range') {
  if (!range || typeof range.fileId !== 'string' || !Number.isInteger(range.startLine)) {
    return null;
  }
  const line = range.startLine + 1;
  const endLine = Number.isInteger(range.endLine) ? range.endLine + 1 : line;
  const id = `${range.fileId}:${range.startLine}:${range.startColumn}-${range.endLine}:${range.endColumn}`;
  return createEvidenceRef({
    kind: 'source',
    id: id || fallbackId,
    label: line === endLine ? `line ${line}` : `lines ${line}–${endLine}`,
    range,
  });
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Extract normalized, language-neutral facts for one CFG function.
 *
 * @param {QueryLayer} query
 * @param {Cfg} cfg
 * @returns {Record<string, any>}
 */
export function extractFunctionFacts(query, cfg) {
  const infoRes = query.runInfo?.();
  const runInfo = infoRes?.ok ? infoRes.value : { runId: cfg.runId, completeness: cfg.completeness };
  const symbolId = cfg.symbolId ?? cfg.function?.symbolId ?? '';
  const symbolRes = symbolId ? query.symbolById?.(symbolId) : null;
  const fnSymbol = symbolRes?.ok ? symbolRes.value : null;

  const allSymbolsRes = query.allSymbols?.();
  /** @type {SymbolRecord[]} */
  const allSymbols = allSymbolsRes?.ok ? allSymbolsRes.value : [];
  const symbolMap = new Map(allSymbols.map((entry) => [entry.symbolId, entry]));

  const constructsRes = symbolId ? query.constructsOf?.(symbolId) : null;
  /** @type {Record<string, ControlConstruct>} */
  const constructById = constructsRes?.ok ? constructsRes.value.byId ?? {} : {};
  /** @type {ControlConstruct[]} */
  const constructs = constructsRes?.ok ? constructsRes.value.constructs ?? [] : [];

  const outgoingRes = symbolId ? query.outgoing?.(symbolId) : null;
  /** @type {Relationship[]} */
  const outgoing = outgoingRes?.ok ? outgoingRes.value : [];
  const incomingRes = symbolId ? query.incoming?.(symbolId) : null;
  /** @type {Relationship[]} */
  const incoming = incomingRes?.ok ? incomingRes.value : [];
  const calleesRes = symbolId ? query.callees?.(symbolId) : null;
  const callees = calleesRes?.ok ? calleesRes.value : [];

  // Data facts are capability-gated on generateDFG; absence is tolerated cleanly.
  const dataFactsRes = symbolId ? query.dataFactsOf?.(symbolId) : null;
  /** @type {DataFact[]} */
  const dataFacts = dataFactsRes?.ok ? dataFactsRes.value : [];

  const diagRes = query.diagnostics?.();
  const diagnostics = diagRes?.ok ? diagRes.value : [];

  const nodes = Array.isArray(cfg.nodes) ? cfg.nodes : [];
  const edges = Array.isArray(cfg.edges) ? cfg.edges : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const outEdges = new Map();
  const inEdges = new Map();
  for (const edge of edges) {
    const outList = outEdges.get(edge.from) ?? [];
    outList.push(edge);
    outEdges.set(edge.from, outList);
    const inList = inEdges.get(edge.to) ?? [];
    inList.push(edge);
    inEdges.set(edge.to, inList);
  }

  // Child symbols belonging to this function (parameters, local variables, nested lambdas).
  const childSymbols = allSymbols.filter((entry) => entry.parentId === symbolId);
  const parameters = childSymbols.filter((entry) => entry.kind === 'parameter');
  const locals = childSymbols.filter(
    (entry) => entry.kind === 'variable' || entry.kind === 'field' || entry.kind === 'property',
  );

  // Structural indices over CFG nodes.
  /** @type {Record<string, any>} */
  const statementsByNodeId = {};
  /** @type {Record<string, any>} */
  const conditionsByNodeId = {};
  /** @type {Record<string, any>} */
  const branchesByNodeId = {};
  /** @type {Record<string, any>} */
  const loopsByNodeId = {};
  /** @type {Record<string, any>} */
  const callsByNodeId = {};
  /** @type {Record<string, any>} */
  const returnsByNodeId = {};

  const callCounts = { resolved: 0, inferred: 0, possible: 0, unresolved: 0, stale: 0 };
  let returnCount = 0;
  let returnsWithValue = 0;
  let returnsVoid = 0;
  let branchCount = 0;
  let earlyExitCount = 0;
  let throwCount = 0;

  for (const node of nodes) {
    const construct = node.constructId ? constructById[node.constructId] : null;
    const ext = construct?.extensions ?? {};
    const nodeOut = outEdges.get(node.id) ?? [];
    const nodeIn = inEdges.get(node.id) ?? [];

    if (node.kind === 'return') {
      returnCount += 1;
      const hasValue =
        ext.hasValue === true ||
        Boolean(ext.valueRange) ||
        /^return\s+\S/.test(node.label);
      if (hasValue) {
        returnsWithValue += 1;
      } else {
        returnsVoid += 1;
      }
      returnsByNodeId[node.id] = {
        nodeId: node.id,
        hasValue,
        valueText: typeof ext.valueText === 'string' ? ext.valueText : '',
        line: node.range ? node.range.startLine + 1 : null,
        range: node.range ?? null,
        constructId: node.constructId ?? null,
      };
    }

    if (node.kind === 'throw') {
      throwCount += 1;
      earlyExitCount += 1;
    }

    if (node.kind === 'break' || node.kind === 'continue') {
      earlyExitCount += 1;
    }

    // Calls attached directly to call nodes or condition nodes.
    if (Array.isArray(node.calls) && node.calls.length > 0) {
      for (const call of node.calls) {
        if (Object.hasOwn(callCounts, call.status)) {
          callCounts[call.status] += 1;
        }
      }
      const hasResolved = node.calls.some((call) => call.status === 'resolved');
      const hasPossible = node.calls.some((call) => call.status === 'possible');
      const hasInferred = node.calls.some((call) => call.status === 'inferred');
      const hasUnresolved = node.calls.some((call) => call.status === 'unresolved');
      const aggregateStatus =
        node.calls.length === 1
          ? node.calls[0].status
          : hasUnresolved
            ? 'unresolved'
            : hasPossible
              ? 'possible'
              : hasInferred
                ? 'inferred'
                : hasResolved
                  ? 'resolved'
                  : node.status;
      const isSelfRecursive = node.calls.some((call) => call.to === symbolId);
      const resultUsed =
        ext.resultUsed === true ||
        node.kind === 'condition' ||
        node.kind === 'loop_header' ||
        node.kind === 'return' ||
        Boolean(ext.targetName);
      callsByNodeId[node.id] = {
        nodeId: node.id,
        targets: node.calls.map((call) => ({ ...call })),
        targetCount: node.calls.length,
        status: aggregateStatus,
        isSelfRecursive,
        resultUsed,
        argumentText: typeof ext.argumentText === 'string' ? ext.argumentText : '',
        targetName: typeof ext.targetName === 'string' ? ext.targetName : '',
        range: node.range ?? null,
        constructId: node.constructId ?? null,
      };
    }

    if (node.kind === 'condition' || node.kind === 'multiway') {
      branchCount += 1;
      const trueEdge = nodeOut.find((edge) => edge.kind === 'true');
      const falseEdge = nodeOut.find((edge) => edge.kind === 'false');
      const trueTarget = trueEdge ? nodeById.get(trueEdge.to) : null;
      const falseTarget = falseEdge ? nodeById.get(falseEdge.to) : null;
      const caseEdges = nodeOut.filter((edge) => edge.kind === 'case' || edge.kind === 'default');
      const elseMissing =
        Boolean(falseTarget) &&
        (falseTarget.kind === 'merge' || falseTarget.kind === 'exit') &&
        nodeOut.some((edge) => edge.kind === 'true');
      const hasEarlyReturnArm =
        trueTarget?.kind === 'return' || falseTarget?.kind === 'return';
      const hasThrowArm =
        trueTarget?.kind === 'throw' || falseTarget?.kind === 'throw';

      const expr = ext.expression ?? {};
      const operator =
        typeof ext.operator === 'string'
          ? ext.operator
          : expr.type === 'and'
            ? '&&'
            : expr.type === 'or'
              ? '||'
              : expr.type === 'nullish'
                ? '??'
                : typeof expr.operator === 'string'
                  ? expr.operator
                  : '';
      const isShortCircuit =
        construct?.kind === 'short_circuit' ||
        operator === '&&' ||
        operator === '||' ||
        operator === '??';
      const isNullish = operator === '??' || ext.nullish === true || expr.type === 'nullish';
      const isOptionalChain = ext.optionalChain === true;
      const isNegated = expr.type === 'not' || /^!\s*/.test(node.label);

      conditionsByNodeId[node.id] = {
        nodeId: node.id,
        kind: node.kind,
        label: node.label,
        operator,
        leftOperand: typeof ext.leftOperand === 'string' ? ext.leftOperand : '',
        rightOperand: typeof ext.rightOperand === 'string' ? ext.rightOperand : '',
        isShortCircuit,
        isNullish,
        isOptionalChain,
        isNegated,
        calls: Array.isArray(node.calls) ? node.calls : [],
        range: node.range ?? null,
        constructId: node.constructId ?? null,
      };

      branchesByNodeId[node.id] = {
        nodeId: node.id,
        armCount: node.kind === 'multiway' ? caseEdges.length : nodeOut.length,
        elseMissing,
        hasEarlyReturnArm,
        hasThrowArm,
        trueLabel: trueTarget?.label ?? null,
        trueKind: trueTarget?.kind ?? null,
        falseLabel: falseTarget?.label ?? null,
        falseKind: falseTarget?.kind ?? null,
        caseLabels: caseEdges
          .filter((edge) => edge.kind === 'case')
          .map((edge) => edge.caseValue ?? edge.label)
          .filter(Boolean),
        hasDefault: caseEdges.some((edge) => edge.kind === 'default'),
        range: node.range ?? null,
        constructId: node.constructId ?? null,
      };
    }

    if (
      node.kind === 'statement' ||
      node.kind === 'call' ||
      node.kind === 'await' ||
      node.kind === 'throw' ||
      node.kind === 'return' ||
      node.kind === 'unmodeled' ||
      node.kind === 'unreachable' ||
      node.synthetic
    ) {
      const targetNames = Array.isArray(ext.targetNames)
        ? ext.targetNames.filter((name) => typeof name === 'string' && name.length > 0)
        : [];
      statementsByNodeId[node.id] = {
        nodeId: node.id,
        kind: node.kind,
        label: node.label,
        status: node.status,
        reasonCode: node.reasonCode ?? null,
        synthetic: node.synthetic === true,
        unreachable: node.unreachable === true,
        targetName: typeof ext.targetName === 'string' ? ext.targetName : '',
        targetNames,
        valueText: typeof ext.valueText === 'string' ? ext.valueText : '',
        incrementTarget: typeof ext.incrementTarget === 'string' ? ext.incrementTarget : '',
        incrementStep: finiteNumber(ext.incrementStep),
        throwValue: typeof ext.throwValue === 'string' ? ext.throwValue : '',
        awaitTarget: typeof ext.awaitTarget === 'string' ? ext.awaitTarget : '',
        isAssignment: Boolean(ext.targetName) || targetNames.length > 0 || ext.assignment === true,
        isMultiAssign: targetNames.length > 1,
        isIncrement: Boolean(ext.incrementTarget) || ext.increment === true,
        range: node.range ?? null,
        constructId: node.constructId ?? null,
        incomingCount: nodeIn.length,
        outgoingCount: nodeOut.length,
      };
    }
  }

  // Loop analysis: pair loop_header / loop_body_entry with reachable body nodes up to loop_back.
  const loopNodes = nodes.filter(
    (node) => node.kind === 'loop_header' || node.kind === 'loop_body_entry',
  );
  const backEdgeSourcesByTarget = new Map();
  for (const edge of edges) {
    if (edge.kind === 'loop_back' || (edge.kind === 'true' && nodeById.get(edge.from)?.kind === 'loop_latch')) {
      const list = backEdgeSourcesByTarget.get(edge.to) ?? [];
      list.push(edge.from);
      backEdgeSourcesByTarget.set(edge.to, list);
    }
  }

  /** @type {Record<string, {bodyNodeIds: string[], startIndex: number, endIndex: number}>} */
  const loopSpans = {};
  const nodeIndex = new Map(nodes.map((node, index) => [node.id, index]));

  for (const loopNode of loopNodes) {
    const construct = loopNode.constructId ? constructById[loopNode.constructId] : null;
    const ext = construct?.extensions ?? {};
    const latchIds = backEdgeSourcesByTarget.get(loopNode.id) ?? [];
    const startIdx = nodeIndex.get(loopNode.id) ?? 0;
    const endIdx = latchIds.reduce(
      (max, latchId) => Math.max(max, nodeIndex.get(latchId) ?? startIdx),
      startIdx,
    );
    const bodyNodes = nodes.slice(startIdx + 1, endIdx + 1).filter(
      (candidate) => candidate.kind !== 'loop_latch' && !candidate.synthetic,
    );
    const bodyNodeIds = bodyNodes.map((candidate) => candidate.id);
    loopSpans[loopNode.id] = { bodyNodeIds, startIndex: startIdx, endIndex: endIdx };

    const loopKind =
      loopNode.kind === 'loop_body_entry' || construct?.kind === 'do_while'
        ? 'do_while'
        : ext.iteration === 'of' || ext.iteration === 'in'
          ? 'foreach'
          : construct?.kind === 'for'
            ? 'for'
            : 'while';
    const hasEarlyExit = bodyNodes.some(
      (candidate) =>
        candidate.kind === 'break' ||
        candidate.kind === 'return' ||
        candidate.kind === 'throw',
    );
    const literalBoundValue = finiteNumber(ext.literalBound);
    const literalStepValue = finiteNumber(ext.literalStep);
    const hasLiteralBound = literalBoundValue !== null;
    const hasLiteralStep = literalStepValue !== null && literalStepValue !== 0;
    const boundMutatedInBody = ext.boundMutatedInBody === true;
    const iterableOpaque =
      ext.iterableOpaque === true ||
      cfg.degradations?.some((item) => item.code === 'iteration_source_opaque');
    const isEmptyBody =
      bodyNodes.length === 0 ||
      (bodyNodes.length === 1 && bodyNodes[0].kind === 'merge');

    loopsByNodeId[loopNode.id] = {
      nodeId: loopNode.id,
      loopKind,
      label: loopNode.label,
      initializerText: typeof ext.initializerText === 'string' ? ext.initializerText : '',
      boundText: typeof ext.boundText === 'string' ? ext.boundText : '',
      stepText: typeof ext.stepText === 'string' ? ext.stepText : '',
      iterableText: typeof ext.iterableText === 'string' ? ext.iterableText : '',
      bindingText: typeof ext.bindingText === 'string' ? ext.bindingText : '',
      bodyNodeIds,
      bodySize: bodyNodes.length,
      nestedDepth: 1,
      hasEarlyExit,
      hasLiteralBound,
      literalBoundValue,
      hasLiteralStep,
      literalStepValue,
      boundMutatedInBody,
      iterableOpaque,
      isEmptyBody,
      conditionOperandMutated: ext.conditionOperandMutated === true,
      collectionLoop: loopKind === 'foreach' || ext.collectionLoop === true,
      range: loopNode.range ?? null,
      constructId: loopNode.constructId ?? null,
    };
  }

  // Compute nesting depth across loops using CFG node index spans.
  let maxLoopDepth = 0;
  for (const loop of Object.values(loopsByNodeId)) {
    const span = loopSpans[loop.nodeId];
    let depth = 1;
    for (const [otherId, otherSpan] of Object.entries(loopSpans)) {
      if (otherId === loop.nodeId) {
        continue;
      }
      if (otherSpan.startIndex < span.startIndex && otherSpan.endIndex >= span.endIndex) {
        depth += 1;
      }
    }
    loop.nestedDepth = depth;
    if (depth > maxLoopDepth) {
      maxLoopDepth = depth;
    }
  }

  // Variable & data-fact aggregation.
  /** @type {Record<string, any>} */
  const variablesBySymbolId = {};
  /** @type {Record<string, string[]>} */
  const variablesByName = {};
  const shadowCounts = new Map();
  for (const sym of childSymbols) {
    shadowCounts.set(sym.name, (shadowCounts.get(sym.name) ?? 0) + 1);
  }

  const factsByVarSymbol = new Map();
  for (const fact of dataFacts) {
    const list = factsByVarSymbol.get(fact.relatedSymbolId ?? fact.symbolId) ?? [];
    list.push(fact);
    factsByVarSymbol.set(fact.relatedSymbolId ?? fact.symbolId, list);
  }

  for (const sym of [...parameters, ...locals]) {
    const ext = sym.extensions ?? {};
    const rels = [
      ...outgoing.filter((rel) => rel.to === sym.symbolId || rel.from === sym.symbolId),
      ...incoming.filter((rel) => rel.to === sym.symbolId || rel.from === sym.symbolId),
    ];
    const symFacts = factsByVarSymbol.get(sym.symbolId) ?? [];
    const reads = symFacts.filter((f) => f.kind === 'read' || f.kind === 'use');
    const writes = symFacts.filter((f) => f.kind === 'write' || f.kind === 'assignment');
    const captures = [
      ...symFacts.filter((f) => f.kind === 'capture'),
      ...rels.filter((rel) => rel.type === 'captures' || rel.type === 'captured_by'),
    ];
    const readLines = [
      ...reads.map((f) => (f.at ? f.at.startLine + 1 : null)),
      ...rels.filter((r) => r.type === 'reads' && r.site).map((r) => r.site.startLine + 1),
    ].filter((line) => Number.isInteger(line));
    const writeLines = [
      ...writes.map((f) => (f.at ? f.at.startLine + 1 : null)),
      ...rels.filter((r) => (r.type === 'writes' || r.type === 'assigns') && r.site).map((r) => r.site.startLine + 1),
    ].filter((line) => Number.isInteger(line));

    const firstUseLine = readLines.length > 0 ? Math.min(...readLines) : null;
    const declLine = sym.declaration ? sym.declaration.startLine + 1 : null;
    const hasTdzRisk =
      ext.tdzRisk === true ||
      (runInfo.language === 'javascript' &&
        ext.declarationKind !== 'var' &&
        firstUseLine !== null &&
        declLine !== null &&
        firstUseLine < declLine);

    const record = {
      symbolId: sym.symbolId,
      name: sym.name,
      kind: sym.kind,
      declarationKind: typeof ext.declarationKind === 'string' ? ext.declarationKind : sym.kind,
      hasInitializer: ext.hasInitializer === true,
      declarationRange: sym.declaration,
      declLine,
      readLines: [...new Set(readLines)].sort((a, b) => a - b),
      writeLines: [...new Set(writeLines)].sort((a, b) => a - b),
      reassignCount: writeLines.length,
      capturedBy: captures
        .map((c) => symbolMap.get(c.from === sym.symbolId ? c.to : c.from)?.name ?? c.symbolId ?? 'closure')
        .filter(Boolean),
      isShadowed: ext.shadowed === true || (shadowCounts.get(sym.name) ?? 0) > 1,
      hasTdzRisk,
      isUnused:
        ext.unused === true ||
        (sym.kind !== 'parameter' &&
          readLines.length === 0 &&
          captures.length === 0 &&
          (symFacts.length > 0 || ext.trackUnused === true)),
    };
    variablesBySymbolId[sym.symbolId] = record;
    const list = variablesByName[sym.name] ?? [];
    list.push(sym.symbolId);
    variablesByName[sym.name] = list;
  }

  // Foundational intraprocedural def-use chains. Never cross unresolved calls.
  const unresolvedCallLines = Object.values(callsByNodeId)
    .filter((call) => call.status === 'unresolved' || call.status === 'possible')
    .map((call) => (call.range ? call.range.startLine + 1 : null))
    .filter((line) => Number.isInteger(line));

  /** @type {Array<Record<string, any>>} */
  const dependencies = [];
  for (const variable of Object.values(variablesBySymbolId)) {
    const defLine = variable.declLine;
    if (!Number.isInteger(defLine)) {
      continue;
    }
    const useLines = variable.readLines;
    const writeLines = variable.writeLines;
    if (useLines.length === 0 && writeLines.length === 0) {
      continue;
    }
    const firstRead = useLines.length > 0 ? useLines[0] : null;
    const firstOverwriteBeforeRead =
      writeLines.find((line) => line > defLine && (firstRead === null || line < firstRead)) ??
      null;
    const crossesUnresolvedCall =
      firstRead !== null &&
      unresolvedCallLines.some((callLine) => callLine >= defLine && callLine <= firstRead);

    dependencies.push({
      symbolId: variable.symbolId,
      name: variable.name,
      defLine,
      useLines,
      overwrittenBeforeRead: firstOverwriteBeforeRead !== null && variable.hasInitializer,
      overwriteLine: firstOverwriteBeforeRead,
      crossesUnresolvedCall,
      range: variable.declarationRange,
    });
  }

  // Pattern proof-obligation extraction (structural only when proof unmet; never binary search).
  const hasRecursion = Object.values(callsByNodeId).some((call) => call.isSelfRecursive);
  const hasBaseCaseBranch = branchCount > 0 && returnCount > 0;
  /** @type {Array<Record<string, any>>} */
  const patterns = [];

  if (hasRecursion) {
    const recursiveCalls = Object.values(callsByNodeId).filter((call) => call.isSelfRecursive);
    const fnExt = fnSymbol?.extensions ?? {};
    const divideProven =
      fnExt.divideAndConquerProven === true && recursiveCalls.length >= 2 && hasBaseCaseBranch;
    if (divideProven) {
      patterns.push({
        id: 'divide_and_conquer',
        proven: true,
        nodeId: recursiveCalls[0].nodeId,
        range: recursiveCalls[0].range,
        detail: 'splits bounds and combines recursive results',
      });
    } else {
      patterns.push({
        id: 'recursion',
        proven: hasBaseCaseBranch,
        nodeId: recursiveCalls[0].nodeId,
        range: recursiveCalls[0].range,
        detail: hasBaseCaseBranch
          ? 'direct self-recursive call with a base-case return branch'
          : 'direct self-recursive call without an explicit base-case branch',
      });
    }
  }

  for (const loop of Object.values(loopsByNodeId)) {
    const loopNode = nodeById.get(loop.nodeId);
    const construct = loopNode?.constructId ? constructById[loopNode.constructId] : null;
    const ext = construct?.extensions ?? {};

    if (ext.accumulationProven === true && typeof ext.accumulatorName === 'string') {
      patterns.push({
        id: 'accumulation',
        proven: true,
        nodeId: loop.nodeId,
        range: loop.range,
        accumulatorName: ext.accumulatorName,
      });
    }
    if (ext.linearSearchProven === true) {
      patterns.push({
        id: 'linear_search',
        proven: true,
        nodeId: loop.nodeId,
        range: loop.range,
      });
    }
    if (ext.nestedPairwiseProven === true && loop.nestedDepth >= 2) {
      patterns.push({
        id: 'nested_pairwise',
        proven: true,
        nodeId: loop.nodeId,
        range: loop.range,
      });
    }
    if (ext.boundsNarrowing === true) {
      // Phase 6 §8.8: NEVER name binary search; describe bounds narrowing structurally.
      patterns.push({
        id: 'bounds_narrowing',
        proven: false,
        nodeId: loop.nodeId,
        range: loop.range,
        detail: 'narrows index bounds inside a loop',
      });
    }
  }

  const fnExt = fnSymbol?.extensions ?? {};
  if (fnExt.memoizationProven === true) {
    patterns.push({
      id: 'memoization',
      proven: true,
      nodeId: cfg.entryId,
      range: cfg.function?.range ?? null,
    });
  }
  if (fnExt.higherOrderCollectionProven === true && typeof fnExt.higherOrderMethod === 'string') {
    patterns.push({
      id: 'higher_order_collection',
      proven: true,
      nodeId: cfg.entryId,
      range: cfg.function?.range ?? null,
      methodName: fnExt.higherOrderMethod,
    });
  }

  // Complexity preconditions per Phase 6 §8.9.
  const loopList = Object.values(loopsByNodeId);
  const anyUnresolvedInLoop = loopList.some((loop) =>
    loop.bodyNodeIds.some((id) => {
      const call = callsByNodeId[id];
      return call && (call.status === 'unresolved' || call.status === 'possible');
    }),
  );
  /** @type {Record<string, any>} */
  let complexity = { kind: 'none', justified: false, reason: 'no static loop bound proved' };
  if (loopList.length > 0 && !hasRecursion && !anyUnresolvedInLoop) {
    const primary = loopList[0];
    if (
      loopList.length === 1 &&
      primary.hasLiteralBound &&
      primary.hasLiteralStep &&
      !primary.hasEarlyExit &&
      !primary.boundMutatedInBody
    ) {
      complexity = {
        kind: 'literal_bound',
        justified: true,
        bound: primary.literalBoundValue,
        nodeId: primary.nodeId,
        range: primary.range,
      };
    } else if (
      loopList.every((loop) => loop.collectionLoop && !loop.iterableOpaque && !loop.hasEarlyExit) &&
      maxLoopDepth >= 1 &&
      maxLoopDepth <= 2 &&
      !loopList.some((loop) => loop.bodyNodeIds.some((id) => Boolean(callsByNodeId[id])))
    ) {
      complexity = {
        kind: 'structural_upper_bound',
        justified: true,
        depth: maxLoopDepth,
        notation: maxLoopDepth === 1 ? 'O(n)' : 'O(n^2)',
        nodeId: primary.nodeId,
        range: primary.range,
      };
    } else if (loopList.some((loop) => loop.collectionLoop)) {
      complexity = {
        kind: 'input_dependent',
        justified: true,
        depth: maxLoopDepth,
        nodeId: primary.nodeId,
        range: primary.range,
      };
    } else if (maxLoopDepth >= 1) {
      complexity = {
        kind: 'nested_depth',
        justified: true,
        depth: maxLoopDepth,
        nodeId: primary.nodeId,
        range: primary.range,
      };
    }
  } else if (anyUnresolvedInLoop || hasRecursion) {
    complexity = {
      kind: 'none',
      justified: false,
      reason: hasRecursion
        ? 'recursion depth is not claimed statically'
        : 'loop body includes unresolved or uncertain calls',
    };
  }

  const unresolvedEdges = edges.filter(
    (edge) => edge.status === 'unresolved' || edge.status === 'possible',
  ).length;
  const unmodeledCount = cfg.stats?.unmodeledCount ?? nodes.filter((n) => n.kind === 'unmodeled').length;
  const unreachableCount =
    cfg.stats?.unreachableCount ?? nodes.filter((n) => n.unreachable || n.kind === 'unreachable').length;

  return {
    runId: runInfo.runId ?? cfg.runId,
    language: runInfo.language ?? cfg.language,
    symbolId,
    function: cfg.function,
    completeness: cfg.completeness ?? runInfo.completeness ?? 'full',
    degradations: Array.isArray(cfg.degradations) ? cfg.degradations : [],
    diagnostics,
    constructCount: constructs.length,
    callees,
    functionShape: {
      name: cfg.function?.name ?? fnSymbol?.name ?? 'function',
      qualifiedName: cfg.function?.qualifiedName ?? fnSymbol?.qualifiedName ?? 'function',
      parameterCount: parameters.length,
      parameters: parameters.map((p) => p.name),
      localCount: locals.length,
      nodeCount: nodes.length,
      edgeCount: edges.length,
      branchCount,
      loopCount: loopList.length,
      maxLoopDepth,
      returnCount,
      returnsWithValue,
      returnsVoid,
      throwCount,
      earlyExitCount,
      callCounts,
      totalCalls:
        callCounts.resolved +
        callCounts.inferred +
        callCounts.possible +
        callCounts.unresolved +
        callCounts.stale,
      unresolvedEdges,
      unmodeledCount,
      unreachableCount,
    },
    statementsByNodeId,
    conditionsByNodeId,
    branchesByNodeId,
    loopsByNodeId,
    callsByNodeId,
    returnsByNodeId,
    variablesBySymbolId,
    variablesByName,
    dependencies,
    patterns,
    complexity,
  };
}

/**
 * Resolve all extracted facts anchored to a single CFG node.
 *
 * @param {string} nodeId
 * @param {Record<string, any>} fnFacts
 * @param {Cfg} cfg
 * @returns {Record<string, any>|null}
 */
export function extractNodeFacts(nodeId, fnFacts, cfg) {
  const node = cfg?.nodes?.find((entry) => entry.id === nodeId);
  if (!node) {
    return null;
  }
  const statement = fnFacts.statementsByNodeId?.[nodeId] ?? null;
  const condition = fnFacts.conditionsByNodeId?.[nodeId] ?? null;
  const branch = fnFacts.branchesByNodeId?.[nodeId] ?? null;
  const loop = fnFacts.loopsByNodeId?.[nodeId] ?? null;
  const call = fnFacts.callsByNodeId?.[nodeId] ?? null;
  const ret = fnFacts.returnsByNodeId?.[nodeId] ?? null;
  const nodeLine = node.range ? node.range.startLine + 1 : null;

  const variables = Object.values(fnFacts.variablesBySymbolId ?? {}).filter(
    (variable) => variable.declLine !== null && variable.declLine === nodeLine,
  );
  const dependencies = (fnFacts.dependencies ?? []).filter(
    (dep) => dep.defLine === nodeLine || dep.useLines.includes(nodeLine),
  );
  const patterns = (fnFacts.patterns ?? []).filter((pattern) => pattern.nodeId === nodeId);

  return {
    node,
    statement,
    condition,
    branch,
    loop,
    call,
    ret,
    variables,
    dependencies,
    patterns,
  };
}
