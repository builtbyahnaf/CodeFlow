/**
 * Shared CFG fixture harness.
 *
 * Fixtures describe a control-construct tree in a language-neutral shape. The
 * harness turns that into a real CSR run and a query layer so the CFG builder
 * is exercised exactly as it is in production: through `createQueryLayer`, with
 * no adapter, no parser, no file access and no process.
 */

import { createAnalysisRun } from '../../../src/core/csr/entities.js';
import { createQueryLayer } from '../../../src/core/csr/query.js';
import { createCapabilities } from '../../../src/core/adapterRegistry.js';
import { buildCfg } from '../../../src/core/graph/cfg/builder.js';

export const FIXTURE_FILE_ID = 'file:cfg-fixture';
export const FIXTURE_PATH = 'fixtures/cfg/program.txt';
export const FIXTURE_SYMBOL_ID = 'symbol:cfg:fixture#function';
export const FIXTURE_CALLEE_ID = 'symbol:cfg:fixture:callee#function';
export const FIXTURE_UNKNOWN_ID = 'external:cfg:unknown';

const CAPABILITIES = createCapabilities({
  parse: 'partial',
  discoverDeclarations: true,
  resolveSymbols: 'partial',
  resolveCalls: 'partial',
  generateCFG: true,
});

/**
 * @param {number} startLine
 * @param {number} [startColumn]
 * @param {number} [endColumn]
 */
export function range(startLine, startColumn = 0, endColumn = 12) {
  return {
    fileId: FIXTURE_FILE_ID,
    startLine,
    startColumn,
    endLine: startLine,
    endColumn,
  };
}

/**
 * @param {Record<string, any>} expression
 * @param {number} line
 * @returns {Record<string, any>}
 */
function fillExpression(expression, line) {
  const filled = { ...expression };
  if (!filled.range) {
    filled.range = range(line);
  }
  for (const key of ['left', 'right', 'operand', 'test', 'consequent', 'alternate']) {
    if (filled[key] && typeof filled[key] === 'object') {
      filled[key] = fillExpression(filled[key], line);
    }
  }
  return filled;
}

/**
 * @param {Record<string, any>} program
 * @returns {{run: import('../../../src/core/csr/entities.js').AnalysisRun, query: ReturnType<typeof createQueryLayer>, symbolId: string}}
 */
export function buildProgram(program) {
  const constructs = [];
  let counter = 0;
  let lineCursor = 0;

  /**
   * @param {Record<string, any>} spec
   * @param {string|null} parentId
   * @returns {string}
   */
  function convert(spec, parentId) {
    counter += 1;
    const id = `construct:${program.id}:c${counter}`;
    const line = Number.isInteger(spec.line)
      ? Number(spec.line)
      : (lineCursor += 1);
    /** @type {Record<string, any>} */
    const construct = {
      constructId: id,
      kind: String(spec.kind ?? 'statement'),
      symbolId: FIXTURE_SYMBOL_ID,
      children: [],
      sourceRange: spec.sourceRange ?? range(line),
      ...(parentId ? { parentId } : {}),
    };
    if (spec.condition === true) {
      construct.condition = range(line);
    } else if (spec.condition && typeof spec.condition === 'object') {
      construct.condition = range(line);
      construct.extensions = {
        ...(spec.extensions ?? {}),
        expression: fillExpression(spec.condition, line),
      };
    } else if (spec.extensions) {
      construct.extensions = { ...spec.extensions };
    }
    constructs.push(construct);
    construct.children = (spec.children ?? []).map((child) => convert(child, id));
    return id;
  }

  const rootId = convert(program.root, null);

  const symbols = [
    {
      symbolId: FIXTURE_SYMBOL_ID,
      kind: 'function',
      name: program.name ?? 'fixture',
      qualifiedName: program.name ?? 'fixture',
      language: program.language ?? 'neutral',
      declaration: range(0),
    },
  ];
  for (const callee of program.symbols ?? []) {
    symbols.push({
      symbolId: callee.symbolId,
      kind: callee.kind ?? 'function',
      name: callee.name ?? 'callee',
      qualifiedName: callee.qualifiedName ?? callee.name ?? 'callee',
      language: program.language ?? 'neutral',
      declaration: range(0),
    });
  }

  const relationships = [];
  let relationshipCounter = 0;
  for (const call of program.calls ?? []) {
    relationshipCounter += 1;
    const target = call.to ?? FIXTURE_CALLEE_ID;
    relationships.push({
      relationshipId: `rel:${program.id}:r${relationshipCounter}`,
      type: call.type ?? 'calls',
      from: FIXTURE_SYMBOL_ID,
      to: target,
      status: call.status ?? 'resolved',
      ...(call.reasonCode ? { reasonCode: call.reasonCode } : {}),
      site: call.site ?? range(call.line ?? 1),
      evidence: [],
    });
  }

  const run = createAnalysisRun({
    runId: `run:${program.id}`,
    adapterId: 'fixture',
    adapterVersion: '1.0.0',
    language: program.language ?? 'neutral',
    scope: { kind: 'file', path: FIXTURE_PATH },
    completeness: program.completeness ?? 'full',
    files: [
      {
        fileId: FIXTURE_FILE_ID,
        path: FIXTURE_PATH,
        language: program.language ?? 'neutral',
        contentHash: 'fixture',
        sizeBytes: 0,
        lineCount: 64,
      },
    ],
    symbols,
    relationships,
    controlConstructs: constructs,
  });

  return {
    run,
    query: createQueryLayer(run, { capabilities: CAPABILITIES }),
    symbolId: FIXTURE_SYMBOL_ID,
    rootId,
  };
}

/**
 * @param {Record<string, any>} program
 * @returns {import('../../../src/core/graph/cfg/builder.js').Cfg}
 */
export function buildFixtureCfg(program) {
  const { query, symbolId } = buildProgram(program);
  const result = buildCfg(query, symbolId);
  if (!result.ok) {
    throw new Error(`Fixture "${program.id}" failed: ${result.code}: ${result.message}`);
  }
  return result.cfg;
}

/**
 * Sorted multiset of node kinds.
 *
 * @param {{nodes: Array<{kind: string}>}} cfg
 * @returns {Record<string, number>}
 */
export function nodeKindCounts(cfg) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const node of cfg.nodes) {
    counts[node.kind] = (counts[node.kind] ?? 0) + 1;
  }
  return counts;
}

/**
 * Sorted multiset of edge kinds.
 *
 * @param {{edges: Array<{kind: string}>}} cfg
 * @returns {Record<string, number>}
 */
export function edgeKindCounts(cfg) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const edge of cfg.edges) {
    counts[edge.kind] = (counts[edge.kind] ?? 0) + 1;
  }
  return counts;
}

/**
 * Enumerate every entry-to-exit path, capped to keep pathological graphs from
 * exploding.
 *
 * @param {{entryId: string, exitId: string, nodes: Array<{id: string}>, edges: Array<{from: string, to: string}>}} cfg
 * @param {number} [limit]
 * @returns {number}
 */
export function countEntryExitPaths(cfg, limit = 5000) {
  /** @type {Map<string, string[]>} */
  const adjacency = new Map();
  for (const edge of cfg.edges) {
    const list = adjacency.get(edge.from) ?? [];
    list.push(edge.to);
    adjacency.set(edge.from, list);
  }
  let paths = 0;
  let steps = 0;
  /** @param {string} node @param {Set<string>} visited */
  const walk = (node, visited) => {
    if (paths >= limit || steps >= limit * 8) {
      return;
    }
    steps += 1;
    if (node === cfg.exitId) {
      paths += 1;
      return;
    }
    if (visited.has(node)) {
      return;
    }
    const next = new Set(visited);
    next.add(node);
    for (const successor of adjacency.get(node) ?? []) {
      walk(successor, next);
    }
  };
  walk(cfg.entryId, new Set());
  return paths;
}
