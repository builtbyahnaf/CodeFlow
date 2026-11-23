/**
 * Clang AST JSON -> CSR.
 *
 * The mapper is deliberately conservative. It emits `resolved` only when
 * Clang's own declaration id links the call to a declaration we mapped.
 * Everything else keeps an honest status and a reason code.
 *
 * It does not read files, spawn tools, or know about the host. The host runs
 * Clang and passes the AST text here.
 */

import { CSR_VERSION } from '../../core/csr/types.js';
import {
  createAnalysisRun,
  createDiagnostic,
  createEvidence,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../core/csr/entities.js';
import {
  createAnonymousDisambiguator,
  createIdentityAllocator,
  createOverloadDisambiguator,
  createRelationshipAllocator,
} from '../../core/csr/identity.js';
import { createSourceLocator } from './locator.js';
import { collectFunctionConstructs } from './constructs.js';

/**
 * @typedef {import('../../core/csr/entities.js').AnalysisRun} AnalysisRun
 * @typedef {import('../../core/csr/entities.js').SymbolRecord} SymbolRecord
 * @typedef {import('../../core/csr/entities.js').Relationship} Relationship
 * @typedef {import('../../core/csr/entities.js').Diagnostic} Diagnostic
 * @typedef {import('../../core/csr/entities.js').SourceRange} SourceRange
 */

/**
 * @typedef {Object} MapCppOptions
 * @property {string} runId
 * @property {string|Record<string, unknown>} ast
 * @property {string} path                Workspace-relative translation unit
 * @property {string} [text]              Translation-unit source text
 * @property {string} [workspaceRoot]
 * @property {string} [adapterId]
 * @property {string} [adapterVersion]
 * @property {'compile-db'|'heuristic'} [mode]
 * @property {Array<{code: string, message: string}>} [warnings]
 * @property {string} [stderr]
 * @property {Record<string, unknown>} [headerMap]
 * @property {string} [toolchain]
 */

/**
 * @param {MapCppOptions} options
 * @returns {AnalysisRun}
 */
export function mapClangAst(options) {
  const {
    runId,
    path: tuPath,
    text = '',
    workspaceRoot,
    adapterId = 'cpp-clang',
    adapterVersion = '0.1.0',
    mode = 'compile-db',
    warnings = [],
    stderr = '',
    headerMap = {},
    toolchain = 'clang',
  } = options;

  const locator = createSourceLocator({ workspaceRoot, tuPath, text, language: 'cpp' });
  const language = 'cpp';
  const allocator = createIdentityAllocator({ language });
  const relationshipIds = createRelationshipAllocator();
  /** @type {Relationship[]} */
  const relationships = [];

  /** @type {SymbolRecord[]} */
  const symbols = [];
  /** @type {Map<string, SymbolRecord>} */
  const byId = new Map();
  /** @type {Map<string, SymbolRecord>} */
  const byNodeId = new Map();
  /** @type {Map<string, SymbolRecord>} */
  const byScopeKey = new Map();
  /** @type {Map<string, SymbolRecord>} */
  const fileSymbols = new Map();
  /** @type {SymbolRecord[]} */
  const pendingFileSymbols = [];

  /** @type {Diagnostic[]} */
  const diagnostics = warnings.map((warning) =>
    createDiagnostic({
      severity: warning.code === 'missing_compile_db' ? 'warning' : 'warning',
      code: warning.code,
      message: warning.message,
    }),
  );

  /** @type {import('../../core/csr/entities.js').ControlConstruct[]} */
  const controlConstructs = [];
  /** @type {Array<{node: Record<string, unknown>, file: string, functionId: string|null, range: SourceRange|null}>} */
  const callSites = [];
  /** @type {Array<{file: string, name: string, system: boolean, line: number, lineText: string}>} */
  const includes = scanIncludes(text);

  let templateSeen = false;
  let unsupportedSeen = false;

  /**
   * @typedef {Object} ScopeFrame
   * @property {string} name
   * @property {string} qualifiedName
   * @property {string} symbolId
   * @property {string} kind
   */

  /**
   * @param {string|null} filePath
   * @returns {SymbolRecord}
   */
  function fileSymbol(filePath) {
    const path = filePath ?? locator.tuPath;
    const existing = fileSymbols.get(path);
    if (existing) {
      return existing;
    }
    // Ensure the file is recorded even when no declaration position was read
    // from the AST (for example an empty translation unit).
    locator.ensureFile(path, 1);
    const fileId = locator.fileIdFor(path);
    const declaration = {
      fileId,
      startLine: 0,
      startColumn: 0,
      endLine: 0,
      endColumn: 1,
    };
    const identity = allocator.symbol({
      path,
      kind: 'file',
      qualifiedName: path,
    });
    const symbol = createSymbol({
      symbolId: identity.symbolId,
      kind: 'file',
      name: basename(path),
      qualifiedName: path,
      language,
      declaration,
      visibility: 'public',
    });
    symbols.push(symbol);
    byId.set(symbol.symbolId, symbol);
    fileSymbols.set(path, symbol);
    pendingFileSymbols.push(symbol);
    return symbol;
  }

  /**
   * @param {{
   *   node: Record<string, unknown>,
   *   name: string,
   *   kind: string,
   *   file: string,
   *   parent: ScopeFrame | null,
   *   declaration: SourceRange,
   *   visibility?: string,
   *   disambiguator?: string,
   *   signature?: string,
   *   extensions?: Record<string, unknown>,
   * }} input
   * @returns {SymbolRecord}
   */
  function declare(input) {
    // Every declaration implies its file exists, even when the file carries no
    // header symbol otherwise. This makes include edges resolvable later.
    fileSymbol(input.file);
    const qualifiedName = input.parent
      ? `${input.parent.qualifiedName}::${input.name}`
      : input.name;
    const scopeKey = `${input.file}|${input.kind}|${qualifiedName}|${input.disambiguator ?? ''}`;
    const existing = byScopeKey.get(scopeKey);
    if (existing) {
      if (input.node.id) {
        byNodeId.set(String(input.node.id), existing);
      }
      if (
        input.node.completeDefinition === true &&
        existing.declaration.startLine === 0 &&
        existing.declaration.endLine === 0
      ) {
        existing.declaration = input.declaration;
      }
      return existing;
    }

    const identity = allocator.symbol({
      path: input.file,
      kind: input.kind,
      qualifiedName,
      disambiguator: input.disambiguator,
    });
    const symbol = createSymbol({
      symbolId: identity.symbolId,
      kind: input.kind,
      name: input.name,
      qualifiedName,
      language,
      declaration: input.declaration,
      ...(input.parent ? { parentId: input.parent.symbolId } : {}),
      ...(input.visibility ? { visibility: input.visibility } : {}),
      ...(input.signature ? { signature: input.signature } : {}),
      ...(input.disambiguator ? { disambiguator: input.disambiguator } : {}),
      ...(input.extensions ? { extensions: input.extensions } : {}),
    });
    symbols.push(symbol);
    byId.set(symbol.symbolId, symbol);
    byScopeKey.set(scopeKey, symbol);
    if (input.node.id) {
      byNodeId.set(String(input.node.id), symbol);
    }
    return symbol;
  }

  /**
   * @param {Record<string, unknown>} node
   * @param {{
   *   file: string,
   *   scope: ScopeFrame[],
   *   functionId: string|null,
   *   classId: string|null,
   *   visibility: string,
   *   template: boolean,
   *   inLambda: boolean,
   * }} context
   */
  function visit(node, context) {
    if (!isObject(node) || typeof node.kind !== 'string') {
      return;
    }
    if (node.isImplicit === true) {
      return;
    }

    const rawFile =
      typeof node.loc?.file === 'string'
        ? node.loc.file
        : typeof node.range?.begin?.file === 'string'
          ? node.range.begin.file
          : undefined;
    const file = rawFile ? locator.toWorkspacePath(rawFile) : context.file;
    if (file === null) {
      return; // system or out-of-workspace file
    }

    const range = locator.rangeFor(node, file);
    const kind = node.kind;
    const name = typeof node.name === 'string' ? node.name : '';
    const parent = context.scope[context.scope.length - 1] ?? null;

    if (kind === 'ClassTemplateDecl') {
      templateSeen = true;
      for (const child of inner(node)) {
        visit(child, { ...context, file, template: true });
      }
      return;
    }

    if (kind === 'FunctionTemplateDecl') {
      templateSeen = true;
      for (const child of inner(node)) {
        visit(child, { ...context, file, template: true });
      }
      return;
    }

    if (kind === 'NamespaceDecl') {
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const symbol = declare({
        node,
        name,
        kind: 'namespace',
        file,
        parent,
        declaration: range,
        visibility: 'public',
      });
      const frame = {
        name,
        qualifiedName: symbol.qualifiedName,
        symbolId: symbol.symbolId,
        kind: 'namespace',
      };
      for (const child of inner(node)) {
        visit(child, { ...context, file, scope: [...context.scope, frame] });
      }
      return;
    }

    if (kind === 'CXXRecordDecl' || kind === 'RecordDecl') {
      const isLambdaRecord = context.inLambda && /lambda|operator\(\)/i.test(name);
      if (isLambdaRecord) {
        return;
      }
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const recordKind = String(node.tagUsed ?? (kind === 'RecordDecl' ? 'struct' : 'class'));
      const symbolKind =
        recordKind === 'union' ? 'class' : recordKind === 'struct' ? 'struct' : 'class';
      const visibility =
        typeof node.access === 'string'
          ? String(node.access)
          : recordKind === 'class'
            ? 'private'
            : 'public';
      const symbol = declare({
        node,
        name,
        kind: symbolKind,
        file,
        parent,
        declaration: range,
        visibility,
        extensions: {
          cpp: {
            recordKind,
            completeDefinition: node.completeDefinition === true,
            ...(context.template ? { template: true } : {}),
          },
        },
      });
      const frame = {
        name,
        qualifiedName: symbol.qualifiedName,
        symbolId: symbol.symbolId,
        kind: symbolKind,
      };
      let memberVisibility = visibility;
      for (const child of inner(node)) {
        if (child.kind === 'AccessSpecDecl') {
          if (typeof child.access === 'string') {
            memberVisibility = child.access;
          }
          continue;
        }
        visit(child, {
          ...context,
          file,
          scope: [...context.scope, frame],
          classId: symbol.symbolId,
          visibility: memberVisibility,
        });
      }
      return;
    }

    if (
      kind === 'FunctionDecl' ||
      kind === 'CXXMethodDecl' ||
      kind === 'CXXConstructorDecl' ||
      kind === 'CXXDestructorDecl' ||
      kind === 'CXXConversionDecl'
    ) {
      if (!name || !range) {
        for (const child of inner(node)) {
          visit(child, { ...context, file });
        }
        return;
      }
      const parameterTypes = inner(node)
        .filter((child) => child.kind === 'ParmVarDecl')
        .map((child) => String(child.type?.qualType ?? 'unknown'));
      const symbolKind = functionKind(kind);
      const disambiguator = createOverloadDisambiguator(parameterTypes);
      const symbol = declare({
        node,
        name,
        kind: symbolKind,
        file,
        parent,
        declaration: range,
        visibility: context.visibility,
        disambiguator,
        signature: typeof node.type?.qualType === 'string' ? node.type.qualType : undefined,
        extensions: {
          cpp: {
            ...(context.template ? { template: true } : {}),
            ...(node.virtual === true ? { virtual: true } : {}),
            ...(node.pure === true ? { pure: true } : {}),
          },
        },
      });
      const frame = {
        name,
        qualifiedName: symbol.qualifiedName,
        symbolId: symbol.symbolId,
        kind: symbolKind,
      };
      collectConstructs(node, symbol, file);
      for (const child of inner(node)) {
        visit(child, {
          ...context,
          file,
          scope: [...context.scope, frame],
          functionId: symbol.symbolId,
          classId: context.classId,
        });
      }
      return;
    }

    if (kind === 'ParmVarDecl') {
      if (name && range) {
        declare({
          node,
          name,
          kind: 'parameter',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...(typeof node.type?.qualType === 'string' ? { type: node.type.qualType } : {}),
            },
          },
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }

    if (kind === 'VarDecl') {
      if (name && range) {
        const parentKind = parent?.kind;
        declare({
          node,
          name,
          kind:
            parentKind === 'namespace' || parentKind === 'class' || parentKind === 'struct'
              ? 'variable'
              : 'variable',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...(typeof node.type?.qualType === 'string' ? { type: node.type.qualType } : {}),
              ...(parentKind === 'namespace' || parentKind === 'class' || parentKind === 'struct'
                ? { linkage: 'external' }
                : { local: true }),
            },
          },
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }

    if (kind === 'FieldDecl') {
      if (name && range) {
        declare({
          node,
          name,
          kind: 'field',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...(typeof node.type?.qualType === 'string' ? { type: node.type.qualType } : {}),
            },
          },
        });
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }

    if (kind === 'EnumDecl') {
      if (name && range) {
        const symbol = declare({
          node,
          name,
          kind: 'enum',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
        });
        const frame = {
          name,
          qualifiedName: symbol.qualifiedName,
          symbolId: symbol.symbolId,
          kind: 'enum',
        };
        for (const child of inner(node)) {
          visit(child, { ...context, file, scope: [...context.scope, frame] });
        }
        return;
      }
      for (const child of inner(node)) {
        visit(child, { ...context, file });
      }
      return;
    }

    if (kind === 'EnumConstantDecl') {
      if (name && range) {
        declare({
          node,
          name,
          kind: 'enum_member',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
        });
      }
      return;
    }

    if (kind === 'TypedefDecl' || kind === 'TypeAliasDecl') {
      if (name && range) {
        declare({
          node,
          name,
          kind: 'type_alias',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          extensions: {
            cpp: {
              ...(typeof node.type?.qualType === 'string' ? { type: node.type.qualType } : {}),
            },
          },
        });
      }
      return;
    }

    if (kind === 'LambdaExpr') {
      const ordinal = countLambdas(context.scope);
      if (range) {
        const symbol = declare({
          node,
          name: '<lambda>',
          kind: 'closure',
          file,
          parent,
          declaration: range,
          visibility: context.visibility,
          disambiguator: createAnonymousDisambiguator(ordinal),
          extensions: { cpp: { anonymous: true } },
        });
        const frame = {
          name: `<lambda>`,
          qualifiedName: symbol.qualifiedName,
          symbolId: symbol.symbolId,
          kind: 'closure',
        };
        collectConstructs(node, symbol, file);
        for (const child of inner(node)) {
          visit(child, {
            ...context,
            file,
            scope: [...context.scope, frame],
            functionId: symbol.symbolId,
            inLambda: true,
          });
        }
        return;
      }
    }

    if (
      kind === 'CallExpr' ||
      kind === 'CXXMemberCallExpr' ||
      kind === 'CXXOperatorCallExpr' ||
      kind === 'CXXConstructExpr'
    ) {
      callSites.push({
        node,
        file,
        functionId: context.functionId,
        range,
      });
    }

    if (
      kind === 'GotoStmt' ||
      kind === 'IndirectGotoStmt' ||
      kind === 'CXXTryStmt' ||
      kind === 'CXXThrowExpr'
    ) {
      unsupportedSeen = true;
    }

    for (const child of inner(node)) {
      visit(child, { ...context, file });
    }
  }

  function countLambdas(scope) {
    return (
      symbols.filter(
        (symbol) =>
          symbol.kind === 'closure' &&
          symbol.qualifiedName.startsWith(scope[scope.length - 1]?.qualifiedName ?? ''),
      ).length + 1
    );
  }

  // Root traversal starts in the TU.
  const root = typeof options.ast === 'string' ? parseAst(options.ast) : options.ast;
  if (!isObject(root)) {
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        code: 'parse_error',
        message: 'Clang did not produce a JSON AST for this translation unit.',
      }),
    );
    return finish();
  }

  fileSymbol(locator.tuPath);
  visit(root, {
    file: locator.tuPath,
    scope: [],
    functionId: null,
    classId: null,
    visibility: 'public',
    template: false,
    inLambda: false,
  });

  // File symbols for every file that appeared in the AST.
  for (const file of locator.fileRecords()) {
    const after = locator.ensureFile(file.path);
    void after;
  }

  // Extend file symbols to their real range once line counts are known.
  for (const symbol of pendingFileSymbols) {
    const record = locator
      .fileRecords()
      .find((entry) => entry.fileId === symbol.declaration.fileId);
    if (record) {
      symbol.declaration.endLine = Math.max(0, record.lineCount - 1);
      symbol.declaration.endColumn = 1;
    }
  }

  // Calls and includes need the complete symbol table.
  for (const call of callSites) {
    const relationship = callRelationship(call);
    if (relationship) {
      relationships.push(relationship);
    }
  }
  for (const include of includes) {
    const relationship = includeRelationship(include);
    if (relationship) {
      relationships.push(relationship);
    }
  }

  if (templateSeen) {
    diagnostics.push(
      createDiagnostic({
        severity: 'info',
        code: 'unsupported_construct',
        message: 'Template declarations are modeled; template instantiations are not expanded.',
      }),
    );
  }
  if (unsupportedSeen) {
    diagnostics.push(
      createDiagnostic({
        severity: 'info',
        code: 'unsupported_construct',
        message:
          'goto, exception paths, and computed jumps are recorded only as constructs; full control flow is Phase 4.',
      }),
    );
  }

  if (typeof stderr === 'string' && stderr.trim().length > 0) {
    diagnostics.push(...parseStderr(stderr, locator.tuPath));
  }

  const unmappedHeaders = Object.entries(headerMap)
    .filter(([, value]) => !value || typeof value !== 'object' || typeof value.tuPath !== 'string')
    .map(([header]) => header);
  if (unmappedHeaders.length > 0) {
    diagnostics.push(
      createDiagnostic({
        severity: 'warning',
        code: 'header_without_tu',
        message: `No translation unit includes ${unmappedHeaders.slice(0, 3).join(', ')}; those headers were analyzed syntactically only.`,
      }),
    );
  }

  return finish();

  /**
   * @param {Record<string, unknown>} call
   * @returns {Relationship|null}
   */
  function callRelationship(call) {
    const from = call.functionId ?? fileSymbol(call.file).symbolId;
    if (!from) {
      return null;
    }
    const site = call.range ?? undefined;
    const target = resolveCallee(call.node);
    if (!target) {
      return null;
    }

    if (target.kind === 'construct') {
      const classSymbol = findClassByType(target.typeName);
      if (classSymbol) {
        return createRelationship({
          relationshipId: relationshipIds.relationship({
            type: 'instantiates',
            from,
            to: classSymbol.symbolId,
          }),
          type: 'instantiates',
          from,
          to: classSymbol.symbolId,
          status: 'resolved',
          evidence: [createEvidence({ kind: 'source_range', ...(site ? { range: site } : {}) })],
          ...(site ? { site } : {}),
        });
      }
      return null;
    }

    if (target.status === 'resolved' && target.symbol) {
      if (target.virtual || target.functionPointer) {
        return createRelationship({
          relationshipId: relationshipIds.relationship({
            type: 'calls',
            from,
            to: target.symbol.symbolId,
          }),
          type: 'calls',
          from,
          to: target.symbol.symbolId,
          status: target.functionPointer ? 'unresolved' : 'possible',
          reasonCode: target.functionPointer ? 'function_pointer' : 'dynamic_dispatch',
          evidence: [createEvidence({ kind: 'source_range', ...(site ? { range: site } : {}) })],
          ...(site ? { site } : {}),
          extensions: { cpp: { candidates: [target.symbol.symbolId] } },
        });
      }
      return createRelationship({
        relationshipId: relationshipIds.relationship({
          type: 'calls',
          from,
          to: target.symbol.symbolId,
        }),
        type: 'calls',
        from,
        to: target.symbol.symbolId,
        status: 'resolved',
        evidence: [createEvidence({ kind: 'source_range', ...(site ? { range: site } : {}) })],
        ...(site ? { site } : {}),
      });
    }

    const externalName = target.name || '(anonymous)';
    return createRelationship({
      relationshipId: relationshipIds.relationship({
        type: 'calls',
        from,
        to: `external:${externalName}`,
      }),
      type: 'calls',
      from,
      to: `external:${externalName}`,
      status: 'unresolved',
      reasonCode: target.functionPointer ? 'function_pointer' : 'out_of_scope',
      evidence: [createEvidence({ kind: 'source_range', ...(site ? { range: site } : {}) })],
      ...(site ? { site } : {}),
    });
  }

  /**
   * @param {{file: string, name: string, system: boolean, line: number, lineText: string}} include
   * @returns {Relationship|null}
   */
  function includeRelationship(include) {
    if (include.system) {
      return null;
    }
    const from = fileSymbol(locator.tuPath).symbolId;
    const target = findFileSymbolByInclude(include.name);
    const site = {
      fileId: locator.fileIdFor(locator.tuPath),
      startLine: include.line,
      startColumn: 0,
      endLine: include.line,
      endColumn: Math.max(1, include.lineText.length),
    };
    if (target) {
      return createRelationship({
        relationshipId: relationshipIds.relationship({
          type: 'includes',
          from,
          to: target.symbolId,
        }),
        type: 'includes',
        from,
        to: target.symbolId,
        status: 'resolved',
        evidence: [createEvidence({ kind: 'import', range: site })],
        site,
      });
    }
    return createRelationship({
      relationshipId: relationshipIds.relationship({
        type: 'includes',
        from,
        to: `external:${include.name}`,
      }),
      type: 'includes',
      from,
      to: `external:${include.name}`,
      status: 'unresolved',
      reasonCode: 'out_of_scope',
      evidence: [createEvidence({ kind: 'import', range: site })],
      site,
    });
  }

  /**
   * @param {string} includeName
   * @returns {SymbolRecord|null}
   */
  function findFileSymbolByInclude(includeName) {
    const needle = includeName.replace(/\\/g, '/');
    for (const [path, symbol] of fileSymbols) {
      if (path === needle || path.endsWith(`/${needle}`) || basename(path) === needle) {
        return symbol;
      }
    }
    return null;
  }

  /**
   * @param {string} typeName
   * @returns {SymbolRecord|null}
   */
  function findClassByType(typeName) {
    const clean = String(typeName)
      .replace(/^class\s+/, '')
      .replace(/^struct\s+/, '')
      .replace(/<.*$/, '')
      .replace(/\s*\*+$/, '')
      .trim();
    const short = clean.split('::').pop() ?? clean;
    for (const symbol of symbols) {
      if (symbol.kind === 'class' || symbol.kind === 'struct') {
        if (symbol.qualifiedName === clean || symbol.name === short) {
          return symbol;
        }
      }
    }
    return null;
  }

  /**
   * @param {Record<string, unknown>} node
   * @param {string} file
   * @returns {{kind: 'construct', typeName: string} | {kind: 'symbol', symbol?: SymbolRecord, name: string, status: string, virtual?: boolean, functionPointer?: boolean} | null}
   */
  function resolveCallee(node) {
    if (node.kind === 'CXXConstructExpr') {
      return { kind: 'construct', typeName: String(node.type?.qualType ?? '') };
    }
    const referenced = findReferencedDecl(node);
    if (referenced?.id) {
      const symbol = byNodeId.get(String(referenced.id));
      if (symbol) {
        return {
          kind: 'symbol',
          symbol,
          name: symbol.name,
          status: 'resolved',
          virtual: symbol.extensions?.cpp?.virtual === true,
          functionPointer: isFunctionPointerType(referenced.type),
        };
      }
    }
    const name = calleeName(node) || referenced?.name || '';
    if (!name) {
      return null;
    }
    const candidate = findFunctionByName(name);
    if (candidate) {
      return {
        kind: 'symbol',
        symbol: candidate,
        name,
        status: 'resolved',
        virtual: candidate.extensions?.cpp?.virtual === true,
        functionPointer: false,
      };
    }
    return {
      kind: 'symbol',
      name,
      status: 'unresolved',
      functionPointer: isFunctionPointerType(referenced?.type),
    };
  }

  /**
   * @param {string} name
   * @returns {SymbolRecord|null}
   */
  function findFunctionByName(name) {
    const matches = symbols.filter(
      (symbol) =>
        (symbol.kind === 'function' ||
          symbol.kind === 'method' ||
          symbol.kind === 'constructor' ||
          symbol.kind === 'destructor') &&
        (symbol.name === name || symbol.name.endsWith(`::${name}`)),
    );
    return matches.length === 1 ? matches[0] : null;
  }

  /**
   * Derive the control constructs for one function. A failure here degrades the
   * CFG for that function only; it never invalidates the surrounding run.
   *
   * @param {Record<string, unknown>} node
   * @param {SymbolRecord} symbol
   * @param {string} file
   */
  function collectConstructs(node, symbol, file) {
    try {
      const result = collectFunctionConstructs({
        functionNode: /** @type {Record<string, any>} */ (node),
        symbol,
        locator,
        file,
      });
      controlConstructs.push(...result.constructs);
      for (const diagnostic of result.diagnostics) {
        diagnostics.push(
          createDiagnostic({
            severity: 'info',
            code: diagnostic.code,
            message: diagnostic.message,
          }),
        );
      }
    } catch (error) {
      diagnostics.push(
        createDiagnostic({
          severity: 'warning',
          code: 'construct_failed',
          message: `Control constructs for ${symbol.qualifiedName} could not be derived: ${
            error instanceof Error ? error.message : String(error)
          }`,
        }),
      );
    }
  }

  /**
   * @param {SymbolRecord[]} _unused
   * @returns {AnalysisRun}
   */
  function finish(_unused) {
    const files = dedupeFiles([
      ...locator.fileRecords(),
      ...symbols
        .filter((symbol) => symbol.kind === 'file')
        .map((symbol) => {
          const record = locator
            .fileRecords()
            .find((entry) => entry.fileId === symbol.declaration.fileId);
          return (
            record ??
            createFileRecord({
              fileId: symbol.declaration.fileId,
              path: symbol.qualifiedName,
              language,
              contentHash: `clang:${symbol.qualifiedName}`,
              sizeBytes: 0,
              lineCount: 1,
            })
          );
        }),
    ]);

    const partial =
      mode === 'heuristic' ||
      diagnostics.some((diagnostic) => diagnostic.severity === 'error') ||
      diagnostics.some((diagnostic) => diagnostic.code === 'missing_compile_db');
    return createAnalysisRun({
      runId,
      adapterId,
      adapterVersion,
      language,
      csrVersion: CSR_VERSION,
      scope: { kind: 'file', path: locator.tuPath },
      completeness: partial ? 'partial' : 'full',
      files,
      symbols,
      relationships,
      controlConstructs,
      dataFacts: [],
      diagnostics,
      extensions: {
        cpp: {
          toolchain,
          mode,
          headerMap,
        },
      },
    });
  }
}

/**
 * @param {Record<string, unknown>} node
 * @returns {Record<string, unknown>[]}
 */
function inner(node) {
  return Array.isArray(node.inner) ? node.inner.filter(isObject) : [];
}

/**
 * @param {string} kind
 * @returns {string}
 */
function functionKind(kind) {
  switch (kind) {
    case 'CXXMethodDecl':
      return 'method';
    case 'CXXConstructorDecl':
      return 'constructor';
    case 'CXXDestructorDecl':
      return 'destructor';
    case 'CXXConversionDecl':
      return 'method';
    default:
      return 'function';
  }
}

/**
 * @param {string} text
 * @returns {Record<string, unknown>|null}
 */
function parseAst(text) {
  try {
    const value = JSON.parse(text);
    return isObject(value) ? value : null;
  } catch {
    return null;
  }
}

/**
 * @param {string} text
 * @returns {Array<{file: string, name: string, system: boolean, line: number, lineText: string}>}
 */
function scanIncludes(text) {
  /** @type {Array<{file: string, name: string, system: boolean, line: number, lineText: string}>} */
  const found = [];
  if (typeof text !== 'string' || text.length === 0) {
    return found;
  }
  const lines = text.split(/\r\n|\r|\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const match = lines[index].match(/^\s*#\s*include\s*([<"])([^>"]+)[>"]/);
    if (match) {
      found.push({
        file: '',
        name: match[2].trim(),
        system: match[1] === '<',
        line: index,
        lineText: lines[index],
      });
    }
  }
  return found;
}

/**
 * @param {string} stderr
 * @param {string} tuPath
 * @returns {Diagnostic[]}
 */
function parseStderr(stderr, tuPath) {
  /** @type {Diagnostic[]} */
  const diagnostics = [];
  const lines = stderr.split(/\r\n|\r|\n/);
  for (const line of lines) {
    if (!/error:/i.test(line)) {
      continue;
    }
    const message = line
      .replace(/^.*?error:\s*/i, '')
      .replace(new RegExp(escapeRegExp(tuPath), 'g'), basename(tuPath))
      .trim();
    if (message.length === 0) {
      continue;
    }
    diagnostics.push(
      createDiagnostic({
        severity: 'error',
        code: 'parse_error',
        message: message.slice(0, 500),
      }),
    );
    if (diagnostics.length >= 20) {
      break;
    }
  }
  if (diagnostics.length === 0) {
    diagnostics.push(
      createDiagnostic({
        severity: 'warning',
        code: 'parse_error',
        message: 'Clang reported diagnostics for this translation unit.',
      }),
    );
  }
  return diagnostics;
}

/**
 * @param {Record<string, unknown>} node
 * @param {number} [depth]
 * @returns {{id?: string, name?: string, kind?: string, type?: string}|null}
 */
function findReferencedDecl(node, depth = 0) {
  if (depth > 4 || !isObject(node)) {
    return null;
  }
  if (isObject(node.referencedDecl)) {
    return {
      id: typeof node.referencedDecl.id === 'string' ? node.referencedDecl.id : undefined,
      name: typeof node.referencedDecl.name === 'string' ? node.referencedDecl.name : undefined,
      kind: typeof node.referencedDecl.kind === 'string' ? node.referencedDecl.kind : undefined,
      type:
        typeof node.referencedDecl.type?.qualType === 'string'
          ? node.referencedDecl.type.qualType
          : undefined,
    };
  }
  if (typeof node.referencedMemberDecl === 'string') {
    return { id: node.referencedMemberDecl, name: node.name, kind: 'CXXMethodDecl' };
  }
  for (const child of inner(node)) {
    const found = findReferencedDecl(child, depth + 1);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} node
 * @returns {string}
 */
function calleeName(node) {
  const name = typeof node.name === 'string' ? node.name : '';
  if (name) {
    return name;
  }
  for (const child of inner(node)) {
    const found = calleeName(child);
    if (found) {
      return found;
    }
  }
  return '';
}

/**
 * @param {string|undefined} type
 * @returns {boolean}
 */
function isFunctionPointerType(type) {
  if (typeof type !== 'string') {
    return false;
  }
  return /\(\s*\*/.test(type) || /std::function/.test(type) || /member function pointer/.test(type);
}

/**
 * @param {import('../../core/csr/entities.js').FileRecord[]} records
 * @returns {import('../../core/csr/entities.js').FileRecord[]}
 */
function dedupeFiles(records) {
  const byId = new Map();
  for (const record of records) {
    if (!byId.has(record.fileId)) {
      byId.set(record.fileId, record);
    }
  }
  return [...byId.values()].sort((left, right) => left.fileId.localeCompare(right.fileId));
}

/**
 * @param {string} filePath
 * @returns {string}
 */
function basename(filePath) {
  const parts = String(filePath).split(/[\\/]/);
  return parts[parts.length - 1] || filePath;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * @param {unknown} value
 * @returns {value is Record<string, any>}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
