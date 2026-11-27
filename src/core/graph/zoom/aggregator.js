/**
 * Multi-level semantic zoom aggregation builders (Phase 10 §5, P10-02,
 * P10-09, P10-10, AC-10.2, AC-10.4).
 *
 * Levels:
 * - L0 Workspace (`buildWorkspaceOverview`): rolls up indexed files into <= 60
 *   top-level directory clusters with file count, symbol count, status mix,
 *   degradation count, and bundled directory-to-directory dependency edges.
 * - L1 Module (`buildModuleView`): files and immediate subdirectories within a
 *   chosen module prefix (`<= 120` nodes).
 * - L2 File (`buildFileView`): symbols declared in a file, grouping dense
 *   symbol sets (`> 120`) into kind clusters (`"42 functions"`).
 * - L3 Symbol (`buildSymbolView`): 1-hop caller/callee neighborhood (`<= 150`
 *   nodes) with caller/callee cluster rollups above threshold.
 * - L4 Function (`buildFunctionView`): CFG nodes from Phase 4, automatically
 *   clustering dense construct regions when node count exceeds `150`
 *   (`"loop body (12 nodes)"`).
 * - L5 Statement (`buildStatementView`): statement-level detail inside an
 *   expanded construct with a Phase 11 `overlays.dfg` slot.
 */

import { ZOOM_LEVELS, LEVEL_CAPS } from './levels.js';
import { createStatusDistribution } from './distributions.js';
import { bundleClusterEdges } from './edgeBundles.js';
import { normalizeBuiltinCalls, resolveExternalCallsWithSymbols } from '../builtins.js';

/**
 * Extract top-level directory segment (`src/core/a.js` -> `src`, `root.js` -> `.`).
 *
 * @param {string} filePath
 * @returns {string}
 */
function topDirectoryOf(filePath) {
  const norm = String(filePath ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const slash = norm.indexOf('/');
  return slash > 0 ? norm.slice(0, slash) : '.';
}

/**
 * Extract immediate child segment relative to `modulePrefix`
 * (`modulePrefix = 'src'`, `path = 'src/core/a.js'` -> `{kind: 'directory', id: 'src/core', name: 'core'}`).
 *
 * @param {string} modulePrefix
 * @param {string} filePath
 */
function childWithinModule(modulePrefix, filePath) {
  const prefix = String(modulePrefix ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  const norm = String(filePath ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const rel = prefix && norm.startsWith(`${prefix}/`) ? norm.slice(prefix.length + 1) : norm;
  const slash = rel.indexOf('/');
  if (slash > 0) {
    const subName = rel.slice(0, slash);
    const subPrefix = prefix ? `${prefix}/${subName}` : subName;
    return {
      isDirectory: true,
      id: `cluster:dir:${subPrefix}`,
      scopeId: subPrefix,
      label: subName,
    };
  }
  return {
    isDirectory: false,
    id: `file:${norm}`,
    scopeId: norm,
    label: rel || norm,
  };
}

/**
 * Build L0 Workspace overview DTO from the project index (or single-file query
 * layer when unindexed). Never issues per-file queries: aggregates in one pass
 * over `filesUnder('')`, `allSymbols()`, and `allRelationships()`.
 *
 * @param {{
 *   index?: {
 *     filesUnder?: (prefix?: string) => {items: Array<Record<string, any>>, scope?: string},
 *     allSymbols?: () => Array<Record<string, any>>,
 *     allRelationships?: () => Array<Record<string, any>>,
 *   }|null,
 *   query?: {
 *     allFiles?: () => {ok: boolean, value: Array<Record<string, any>>},
 *     allSymbols?: () => {ok: boolean, value: Array<Record<string, any>>},
 *     allRelationships?: () => {ok: boolean, value: Array<Record<string, any>>},
 *   }|null,
 *   files?: Array<Record<string, any>>,
 *   cap?: number,
 * }} [input]
 */
export function buildWorkspaceOverview(input = {}) {
  const cap = Math.max(4, Math.trunc(Number(input.cap) || LEVEL_CAPS[ZOOM_LEVELS.L0_WORKSPACE]));

  const filesFromIndex = input.index?.filesUnder?.('')?.items;
  const filesFromQuery = input.query?.allFiles?.();
  const filesFromInput = Array.isArray(input.files) ? input.files : [];
  const files =
    Array.isArray(filesFromIndex) && filesFromIndex.length > 0
      ? filesFromIndex
      : filesFromQuery?.ok && filesFromQuery.value.length > 0
        ? filesFromQuery.value
        : filesFromInput;

  const indexSymbols =
    typeof input.index?.allSymbols === 'function' ? input.index.allSymbols() : [];
  const querySymbols = input.query?.allSymbols?.();
  const symbols =
    Array.isArray(indexSymbols) && indexSymbols.length > 0
      ? indexSymbols
      : querySymbols?.ok
        ? querySymbols.value
        : [];

  const indexRelationships =
    typeof input.index?.allRelationships === 'function' ? input.index.allRelationships() : [];
  const queryRelationships = input.query?.allRelationships?.();
  const relationships = resolveExternalCallsWithSymbols(
    normalizeBuiltinCalls(
      Array.isArray(indexRelationships) && indexRelationships.length > 0
        ? indexRelationships
        : queryRelationships?.ok
          ? queryRelationships.value
          : [],
    ),
    symbols,
  );

  /** @type {Map<string, string>} */
  const fileIdToDir = new Map();
  /** @type {Map<string, {dir: string, files: Array<Record<string, any>>, symbolCount: number, rels: Array<Record<string, any>>}>} */
  const dirBuckets = new Map();

  for (const file of files) {
    const fileId = file.fileId ?? file.file_id;
    const dir = topDirectoryOf(file.path);
    fileIdToDir.set(fileId, dir);
    let bucket = dirBuckets.get(dir);
    if (!bucket) {
      bucket = { dir, files: [], symbolCount: 0, rels: [] };
      dirBuckets.set(dir, bucket);
    }
    bucket.files.push(file);
  }

  /** @type {Map<string, string>} */
  const symbolIdToDir = new Map();
  for (const sym of symbols) {
    const fileId = sym.fileId ?? sym.declaration?.fileId;
    const dir = fileIdToDir.get(fileId) ?? topDirectoryOf(sym.declaration?.fileId ?? '');
    if (sym.symbolId) {
      symbolIdToDir.set(sym.symbolId, dir);
    }
    const bucket = dirBuckets.get(dir);
    if (bucket) {
      bucket.symbolCount += 1;
    }
  }

  for (const rel of relationships) {
    const fromDir = symbolIdToDir.get(rel.from) ?? fileIdToDir.get(rel.site?.fileId) ?? '.';
    const bucket = dirBuckets.get(fromDir);
    if (bucket) {
      bucket.rels.push(rel);
    }
  }

  const sortedBuckets = [...dirBuckets.values()].sort((a, b) => {
    if (b.files.length !== a.files.length) {
      return b.files.length - a.files.length;
    }
    return a.dir < b.dir ? -1 : a.dir > b.dir ? 1 : 0;
  });

  const primaryBuckets =
    sortedBuckets.length > cap ? sortedBuckets.slice(0, cap - 1) : sortedBuckets;
  const overflowBuckets = sortedBuckets.length > cap ? sortedBuckets.slice(cap - 1) : [];

  /** @type {Array<Record<string, any>>} */
  const nodes = [];
  /** @type {Map<string, Array<Record<string, any>>>} */
  const membersByClusterId = new Map();
  /** @type {Map<string, string>} */
  const symbolToClusterId = new Map();
  /** @type {Map<string, string>} */
  const dirToClusterId = new Map();

  for (const bucket of primaryBuckets) {
    const clusterId = `cluster:dir:${bucket.dir}`;
    dirToClusterId.set(bucket.dir, clusterId);
    const statusMix = createStatusDistribution(bucket.rels);
    const memberItems = bucket.files.map((f) => ({
      id: f.fileId ?? f.file_id,
      label: f.path,
      kind: 'file',
      scopeId: f.fileId ?? f.file_id,
      statusMix: { counts: { resolved: 1 }, total: 1, displayStatus: 'resolved' },
      badges: [],
    }));
    membersByClusterId.set(clusterId, memberItems);
    for (const f of bucket.files) {
      const fId = f.fileId ?? f.file_id;
      symbolToClusterId.set(fId, clusterId);
    }

    nodes.push({
      id: clusterId,
      kind: 'directory_cluster',
      level: ZOOM_LEVELS.L0_WORKSPACE,
      targetLevel: ZOOM_LEVELS.L1_MODULE,
      scopeId: bucket.dir,
      label: `${bucket.dir} (${bucket.files.length} files)`,
      fileCount: bucket.files.length,
      symbolCount: bucket.symbolCount,
      status: statusMix.displayStatus,
      statusMix,
      displayStatus: statusMix.displayStatus,
      completeness: statusMix.completeness,
      degradationCount: statusMix.degradationCount,
      unmodeledCount: statusMix.unmodeledCount,
      badges: statusMix.badges,
      expandable: true,
    });
  }

  if (overflowBuckets.length > 0) {
    const overflowId = 'cluster:dir:__other__';
    const allOverflowFiles = overflowBuckets.flatMap((b) => b.files);
    const allOverflowRels = overflowBuckets.flatMap((b) => b.rels);
    const totalSyms = overflowBuckets.reduce((acc, b) => acc + b.symbolCount, 0);
    const statusMix = createStatusDistribution(allOverflowRels);
    for (const b of overflowBuckets) {
      dirToClusterId.set(b.dir, overflowId);
    }
    membersByClusterId.set(
      overflowId,
      overflowBuckets.map((b) => ({
        id: `cluster:dir:${b.dir}`,
        label: `${b.dir} (${b.files.length} files)`,
        kind: 'directory_cluster',
        scopeId: b.dir,
        statusMix: createStatusDistribution(b.rels),
        badges: [],
      })),
    );
    nodes.push({
      id: overflowId,
      kind: 'directory_cluster',
      level: ZOOM_LEVELS.L0_WORKSPACE,
      targetLevel: null,
      expandClusterOnly: true,
      scopeId: '__other__',
      label: `Other directories (${overflowBuckets.length} dirs, ${allOverflowFiles.length} files)`,
      fileCount: allOverflowFiles.length,
      symbolCount: totalSyms,
      status: statusMix.displayStatus,
      statusMix,
      displayStatus: statusMix.displayStatus,
      completeness: statusMix.completeness,
      degradationCount: statusMix.degradationCount,
      unmodeledCount: statusMix.unmodeledCount,
      badges: statusMix.badges,
      expandable: true,
    });
  }

  for (const [symId, dir] of symbolIdToDir.entries()) {
    const clusterId = dirToClusterId.get(dir);
    if (clusterId) {
      symbolToClusterId.set(symId, clusterId);
    }
  }

  const edgeBundles = bundleClusterEdges(relationships, symbolToClusterId);

  return {
    dtoKind: 'semantic_zoom',
    level: ZOOM_LEVELS.L0_WORKSPACE,
    scopeId: 'workspace',
    nodes,
    edges: edgeBundles,
    membersByClusterId,
    totalFiles: files.length,
    totalSymbols: symbols.length,
    capped: overflowBuckets.length > 0,
  };
}

/**
 * Build L1 Module view DTO showing files and immediate subdirectories within
 * `modulePrefix` (`<= 120` nodes).
 *
 * @param {{
 *   modulePrefix: string,
 *   index?: {
 *     filesUnder?: (prefix: string) => {items: Array<Record<string, any>>},
 *     allSymbols?: () => Array<Record<string, any>>,
 *     allRelationships?: () => Array<Record<string, any>>,
 *   }|null,
 *   query?: {
 *     allSymbols?: () => {ok: boolean, value: Array<Record<string, any>>},
 *     allRelationships?: () => {ok: boolean, value: Array<Record<string, any>>},
 *   }|null,
 *   files?: Array<Record<string, any>>,
 *   cap?: number,
 * }} input
 */
export function buildModuleView(input) {
  const prefix = String(input?.modulePrefix ?? '')
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '');
  const cap = Math.max(4, Math.trunc(Number(input?.cap) || LEVEL_CAPS[ZOOM_LEVELS.L1_MODULE]));
  const indexedFiles = input?.index?.filesUnder?.(prefix === '.' ? '' : prefix)?.items ?? [];
  const allFiles = Array.isArray(input?.files) ? input.files : [];
  const rawFiles =
    indexedFiles.length > 0
      ? indexedFiles
      : allFiles.filter((file) => {
          const normalized = String(file.path ?? '').replace(/\\/g, '/').replace(/^\/+/, '');
          return prefix === '.' || prefix === '' || normalized.startsWith(`${prefix}/`);
        });
  const files =
    prefix === '.' || prefix === ''
      ? rawFiles.filter((file) => topDirectoryOf(file.path) === '.')
      : rawFiles;

  const indexSymbols = input?.index?.allSymbols?.() ?? [];
  const querySymbols = input?.query?.allSymbols?.();
  const symbols =
    indexSymbols.length > 0 ? indexSymbols : querySymbols?.ok ? querySymbols.value : [];

  const indexRelationships = input?.index?.allRelationships?.() ?? [];
  const queryRelationships = input?.query?.allRelationships?.();
  const relationships = resolveExternalCallsWithSymbols(
    normalizeBuiltinCalls(
      indexRelationships.length > 0
        ? indexRelationships
        : queryRelationships?.ok
          ? queryRelationships.value
          : [],
    ),
    symbols,
  );

  /** @type {Map<string, {id: string, scopeId: string, label: string, isDirectory: boolean, files: Array<Record<string, any>>, rels: Array<Record<string, any>>}>} */
  const groups = new Map();
  /** @type {Map<string, string>} */
  const fileToGroup = new Map();

  for (const file of files) {
    const child = childWithinModule(prefix === '.' ? '' : prefix, file.path);
    const fId = file.fileId ?? file.file_id;
    fileToGroup.set(fId, child.id);
    let grp = groups.get(child.id);
    if (!grp) {
      grp = { ...child, scopeId: child.isDirectory ? child.scopeId : fId, files: [], rels: [] };
      groups.set(child.id, grp);
    }
    grp.files.push(file);
  }

  /** @type {Map<string, string>} */
  const symToGroup = new Map();
  for (const sym of symbols) {
    const fId = sym.fileId ?? sym.declaration?.fileId;
    const grpId = fileToGroup.get(fId);
    if (grpId) {
      symToGroup.set(sym.symbolId, grpId);
    }
  }

  for (const rel of relationships) {
    const grpId = symToGroup.get(rel.from);
    if (grpId && groups.has(grpId)) {
      groups.get(grpId).rels.push(rel);
    }
  }

  const allGroups = [...groups.values()].sort((a, b) =>
    a.label < b.label ? -1 : a.label > b.label ? 1 : 0,
  );
  const visibleGroups = allGroups.slice(0, cap);
  /** @type {Map<string, Array<Record<string, any>>>} */
  const membersByClusterId = new Map();

  const nodes = visibleGroups.map((grp) => {
    const statusMix = createStatusDistribution(grp.rels);
    if (grp.isDirectory) {
      membersByClusterId.set(
        grp.id,
        grp.files.map((f) => ({
          id: f.fileId ?? f.file_id,
          label: f.path,
          kind: 'file',
          scopeId: f.fileId ?? f.file_id,
          statusMix: { counts: { resolved: 1 }, total: 1, displayStatus: 'resolved' },
          badges: [],
        })),
      );
    }
    return {
      id: grp.id,
      kind: grp.isDirectory ? 'directory_cluster' : 'file',
      level: ZOOM_LEVELS.L1_MODULE,
      targetLevel: grp.isDirectory ? ZOOM_LEVELS.L1_MODULE : ZOOM_LEVELS.L2_FILE,
      scopeId: grp.scopeId,
      label: grp.isDirectory ? `${grp.label} (${grp.files.length} files)` : grp.label,
      fileCount: grp.files.length,
      status: statusMix.displayStatus,
      statusMix,
      displayStatus: statusMix.displayStatus,
      completeness: statusMix.completeness,
      badges: statusMix.badges,
      expandable: true,
    };
  });

  const edges = bundleClusterEdges(relationships, symToGroup);

  return {
    dtoKind: 'semantic_zoom',
    level: ZOOM_LEVELS.L1_MODULE,
    scopeId: prefix || '.',
    nodes,
    edges,
    membersByClusterId,
    capped: allGroups.length > cap,
  };
}

/**
 * Build L2 File view DTO showing declared symbols in `fileId`, grouping by
 * symbol kind into clusters when the file contains more than `cap` symbols.
 *
 * @param {{
 *   fileId: string,
 *   index?: {
 *     symbolsInFile?: (fileId: string) => {items: Array<Record<string, any>>},
 *     allRelationships?: () => Array<Record<string, any>>,
 *   }|null,
 *   query?: {
 *     symbolsInFile?: (fileId: string) => {ok: boolean, value: Array<Record<string, any>>},
 *     allRelationships?: () => {ok: boolean, value: Array<Record<string, any>>},
 *   }|null,
 *   cap?: number,
 * }} input
 */
export function buildFileView(input) {
  const fileId = String(input?.fileId ?? '');
  const cap = Math.max(4, Math.trunc(Number(input?.cap) || LEVEL_CAPS[ZOOM_LEVELS.L2_FILE]));

  const fromIndex = input?.index?.symbolsInFile?.(fileId)?.items;
  const fromQuery = input?.query?.symbolsInFile?.(fileId)?.ok
    ? input.query.symbolsInFile(fileId).value
    : [];
  const symbols = (Array.isArray(fromIndex) && fromIndex.length > 0 ? fromIndex : fromQuery).filter(
    (s) => s.kind !== 'file',
  );

  const relationships = normalizeBuiltinCalls(
    typeof input?.index?.allRelationships === 'function'
      ? input.index.allRelationships()
      : input?.query?.allRelationships?.()?.ok
        ? input.query.allRelationships().value
        : [],
  );

  /** @type {Map<string, Array<Record<string, any>>>} */
  const membersByClusterId = new Map();

  // Dense file: group symbols by kind ("42 functions")
  if (symbols.length > cap) {
    /** @type {Map<string, Array<Record<string, any>>>} */
    const byKind = new Map();
    /** @type {Map<string, string>} */
    const symToCluster = new Map();
    for (const sym of symbols) {
      const kind = sym.kind || 'symbol';
      const clusterId = `cluster:kind:${fileId}:${kind}`;
      symToCluster.set(sym.symbolId, clusterId);
      let list = byKind.get(kind);
      if (!list) {
        list = [];
        byKind.set(kind, list);
      }
      list.push(sym);
    }

    const nodes = [];
    for (const [kind, kindSyms] of [...byKind.entries()].sort((a, b) =>
      a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0,
    )) {
      const clusterId = `cluster:kind:${fileId}:${kind}`;
      const symSet = new Set(kindSyms.map((s) => s.symbolId));
      const kindRels = relationships.filter((r) => symSet.has(r.from));
      const statusMix = createStatusDistribution(kindRels);
      membersByClusterId.set(
        clusterId,
        kindSyms.map((s) => ({
          id: s.symbolId,
          label: s.qualifiedName || s.name,
          kind: s.kind,
          scopeId: s.symbolId,
          range: s.declaration,
          statusMix: { counts: { resolved: 1 }, total: 1, displayStatus: 'resolved' },
          badges: [],
        })),
      );
      nodes.push({
        id: clusterId,
        kind: 'file_symbol_cluster',
        level: ZOOM_LEVELS.L2_FILE,
        scopeId: clusterId,
        label: `${kindSyms.length} ${kind}s`,
        symbolCount: kindSyms.length,
        statusMix,
        displayStatus: statusMix.displayStatus,
        completeness: statusMix.completeness,
        badges: statusMix.badges,
        expandable: true,
      });
    }

    return {
      dtoKind: 'semantic_zoom',
      level: ZOOM_LEVELS.L2_FILE,
      scopeId: fileId,
      nodes,
      edges: bundleClusterEdges(relationships, symToCluster),
      membersByClusterId,
      groupedByKind: true,
    };
  }

  const symSet = new Set(symbols.map((s) => s.symbolId));
  const nodes = symbols.map((sym) => {
    const outRels = relationships.filter((r) => r.from === sym.symbolId);
    const statusMix = createStatusDistribution(outRels);
    return {
      id: sym.symbolId,
      kind: sym.kind,
      level: ZOOM_LEVELS.L2_FILE,
      scopeId: sym.symbolId,
      label: sym.qualifiedName || sym.name,
      range: sym.declaration,
      statusMix,
      displayStatus: statusMix.displayStatus,
      completeness: statusMix.completeness,
      badges: statusMix.badges,
      expandable: sym.kind === 'function' || sym.kind === 'method',
    };
  });

  const fileRels = relationships.filter((r) => symSet.has(r.from) && symSet.has(r.to));
  const edges = bundleClusterEdges(fileRels);

  return {
    dtoKind: 'semantic_zoom',
    level: ZOOM_LEVELS.L2_FILE,
    scopeId: fileId,
    nodes,
    edges,
    membersByClusterId,
    groupedByKind: false,
  };
}

/**
 * Build L4 Function CFG view with automatic construct clustering when node
 * count exceeds `cap` (default 150, P10-09).
 *
 * @param {{
 *   cfg: {
 *     symbolId: string,
 *     function?: Record<string, any>,
 *     nodes: Array<Record<string, any>>,
 *     edges: Array<Record<string, any>>,
 *     degradations?: Array<Record<string, any>>,
 *   },
 *   cap?: number,
 * }} input
 */
export function buildFunctionView(input) {
  const cfg = input?.cfg;
  const cap = Math.max(10, Math.trunc(Number(input?.cap) || LEVEL_CAPS[ZOOM_LEVELS.L4_FUNCTION]));
  const rawNodes = cfg?.nodes ?? [];
  const rawEdges = cfg?.edges ?? [];
  /** @type {Map<string, Array<Record<string, any>>>} */
  const membersByClusterId = new Map();

  if (rawNodes.length <= cap) {
    return {
      dtoKind: 'semantic_zoom',
      level: ZOOM_LEVELS.L4_FUNCTION,
      scopeId: cfg?.symbolId ?? '',
      nodes: rawNodes.map((n) => ({
        ...n,
        level: ZOOM_LEVELS.L4_FUNCTION,
        scopeId: n.constructId ?? n.id,
        expandable: Boolean(n.constructId),
      })),
      edges: rawEdges,
      membersByClusterId,
      clusteredConstructs: false,
    };
  }

  // Group dense CFG nodes by constructId (or chunk regions of 25 nodes) so total
  // rendered nodes at L4 stay <= cap while every construct cluster is expandable!
  /** @type {Map<string, Array<Record<string, any>>>} */
  const constructBuckets = new Map();
  /** @type {Map<string, string>} */
  const nodeToCluster = new Map();
  /** @type {Array<Record<string, any>>} */
  const nodes = [];

  for (let idx = 0; idx < rawNodes.length; idx += 1) {
    const node = rawNodes[idx];
    if (node.kind === 'entry' || node.kind === 'exit') {
      nodes.push({ ...node, level: ZOOM_LEVELS.L4_FUNCTION, expandable: false });
      nodeToCluster.set(node.id, node.id);
      continue;
    }
    const groupKey = node.constructId || `region_${Math.floor(idx / 25)}`;
    const clusterId = `cluster:construct:${cfg?.symbolId ?? 'fn'}:${groupKey}`;
    nodeToCluster.set(node.id, clusterId);
    let list = constructBuckets.get(clusterId);
    if (!list) {
      list = [];
      constructBuckets.set(clusterId, list);
    }
    list.push(node);
  }

  for (const [clusterId, members] of constructBuckets.entries()) {
    const hasUnmodeled = members.some((m) => m.kind === 'unmodeled' || m.status === 'unresolved');
    const statusMix = createStatusDistribution(
      members.map((m) => ({
        status: m.status ?? 'resolved',
        unmodeled: m.kind === 'unmodeled',
      })),
    );
    membersByClusterId.set(
      clusterId,
      members.map((m) => ({
        id: m.id,
        label: m.label || m.kind,
        kind: m.kind,
        scopeId: m.id,
        range: m.range,
        statusMix: createStatusDistribution([{ status: m.status ?? 'resolved' }]),
        badges: m.kind === 'unmodeled' ? ['1 unmodeled'] : [],
      })),
    );
    nodes.push({
      id: clusterId,
      kind: 'construct_cluster',
      level: ZOOM_LEVELS.L4_FUNCTION,
      scopeId: clusterId,
      label: `construct body (${members.length} nodes)`,
      memberCount: members.length,
      hasUnmodeled,
      statusMix,
      displayStatus: statusMix.displayStatus,
      completeness: statusMix.completeness,
      badges: statusMix.badges,
      expandable: true,
    });
  }

  const edges = bundleClusterEdges(
    rawEdges.map((e) => ({
      id: e.id,
      from: e.from,
      to: e.to,
      type: e.kind || 'cfg_flow',
      status: e.status ?? 'resolved',
    })),
    nodeToCluster,
  );

  return {
    dtoKind: 'semantic_zoom',
    level: ZOOM_LEVELS.L4_FUNCTION,
    scopeId: cfg?.symbolId ?? '',
    nodes,
    edges,
    membersByClusterId,
    clusteredConstructs: true,
  };
}

/**
 * Build L5 Statement detail view inside a construct or CFG region, including
 * the Phase 11 `overlays` slot (`overlays.dfg`, P10-10, §16).
 *
 * @param {{
 *   symbolId: string,
 *   constructId: string,
 *   cfg: {nodes: Array<Record<string, any>>, edges: Array<Record<string, any>>},
 *   activeOverlays?: string[],
 *   dfgEdges?: Array<Record<string, any>>,
 * }} input
 */
export function buildStatementView(input) {
  const constructId = String(input?.constructId ?? '');
  const rawNodes = input?.cfg?.nodes ?? [];
  const matching = rawNodes.filter(
    (n) =>
      !constructId ||
      n.constructId === constructId ||
      n.id === constructId ||
      `cluster:construct:${input?.symbolId}:${n.constructId}` === constructId,
  );
  const selectedNodes = (matching.length > 0 ? matching : rawNodes).slice(
    0,
    LEVEL_CAPS[ZOOM_LEVELS.L5_STATEMENT],
  );
  const nodeIds = new Set(selectedNodes.map((n) => n.id));
  const cfgEdges = (input?.cfg?.edges ?? []).filter(
    (e) => nodeIds.has(e.from) && nodeIds.has(e.to),
  );
  const activeOverlays = Array.isArray(input?.activeOverlays) ? input.activeOverlays : [];

  return {
    dtoKind: 'semantic_zoom',
    level: ZOOM_LEVELS.L5_STATEMENT,
    scopeId: constructId || input?.symbolId || 'statement',
    nodes: selectedNodes.map((n) => ({
      ...n,
      level: ZOOM_LEVELS.L5_STATEMENT,
      expandable: false,
    })),
    edges: cfgEdges,
    overlays: {
      active: activeOverlays,
      dfg: activeOverlays.includes('dfg') ? (input?.dfgEdges ?? []) : [],
    },
  };
}
