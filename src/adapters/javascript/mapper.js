/**
 * ESTree + eslint-scope to CSR mapper.
 *
 * The mapper is deliberately conservative. A call is `resolved` only when the
 * lexical binding and (for imports) the exported declaration are both known in
 * this run. Receivers, computed members, `eval`, `with`, and prototype mutation
 * degrade to `inferred`, `possible`, or `unresolved` with a reason code.
 */

import {
  createDiagnostic,
  createEvidence,
  createFileRecord,
  createRelationship,
  createSymbol,
} from '../../core/csr/entities.js';
import { CSR_VERSION } from '../../core/csr/types.js';
import { createIdentityAllocator, createRelationshipAllocator } from '../../core/csr/identity.js';
import { createJavaScriptLocator } from './locator.js';
import { childNodes, parseJavaScript } from './parser.js';
import { detectModuleKind } from './moduleKind.js';

const LANGUAGE = 'javascript';

/**
 * @param {unknown} value
 * @returns {Record<string, any>}
 */
function asNode(value) {
  return /** @type {Record<string, any>} */ (value ?? {});
}

/**
 * @param {unknown} node
 * @returns {boolean}
 */
function isFunctionNode(node) {
  const candidate = asNode(node);
  return (
    candidate.type === 'FunctionDeclaration' ||
    candidate.type === 'FunctionExpression' ||
    candidate.type === 'ArrowFunctionExpression'
  );
}

/**
 * @param {unknown} node
 * @returns {boolean}
 */
function isClassNode(node) {
  const candidate = asNode(node);
  return candidate.type === 'ClassDeclaration' || candidate.type === 'ClassExpression';
}

/**
 * @param {Record<string, any>} node
 * @returns {string|null}
 */
function propertyName(node) {
  if (!node) {
    return null;
  }
  if (node.type === 'Identifier') {
    return node.name;
  }
  if (node.type === 'PrivateIdentifier') {
    return `#${node.name}`;
  }
  if (node.type === 'Literal') {
    return String(node.value);
  }
  return null;
}

/**
 * @param {Record<string, any>} pattern
 * @returns {Record<string, any>[]}
 */
function bindingIdentifiers(pattern) {
  const result = [];
  const visit = (node) => {
    if (!node) {
      return;
    }
    if (node.type === 'Identifier') {
      result.push(node);
      return;
    }
    if (node.type === 'ObjectPattern') {
      for (const property of node.properties ?? []) {
        visit(property.type === 'RestElement' ? property.argument : property.value);
      }
      return;
    }
    if (node.type === 'ArrayPattern') {
      for (const element of node.elements ?? []) {
        visit(element);
      }
      return;
    }
    if (node.type === 'AssignmentPattern') {
      visit(node.left);
      return;
    }
    if (node.type === 'RestElement') {
      visit(node.argument);
    }
  };
  visit(pattern);
  return result;
}

/**
 * @param {Record<string, any>} declaration
 * @returns {string[]}
 */
function declaredNames(declaration) {
  if (!declaration) {
    return [];
  }
  if (declaration.type === 'VariableDeclaration') {
    return declaration.declarations.flatMap((entry) =>
      bindingIdentifiers(entry.id).map((identifier) => identifier.name),
    );
  }
  if (declaration.type === 'FunctionDeclaration' || declaration.type === 'ClassDeclaration') {
    return declaration.id?.name ? [declaration.id.name] : [];
  }
  return [];
}

/**
 * @param {Record<string, any>} init
 * @returns {string}
 */
function initializerKind(init) {
  if (!init) {
    return 'none';
  }
  if (isFunctionNode(init)) {
    return 'function';
  }
  if (isClassNode(init)) {
    return 'class';
  }
  if (init.type === 'ObjectExpression') {
    return 'object';
  }
  if (init.type === 'NewExpression') {
    return 'new';
  }
  if (init.type === 'CallExpression') {
    return 'call';
  }
  if (init.type === 'Literal' || init.type === 'TemplateLiteral') {
    return 'literal';
  }
  return 'expression';
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function basename(value) {
  const normalized = String(value ?? '').replace(/\\/g, '/');
  const name = normalized.slice(normalized.lastIndexOf('/') + 1);
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(0, dot) : name;
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function normalizePath(value) {
  return String(value ?? '')
    .replace(/\\/g, '/')
    .replace(/\/{2,}/g, '/')
    .replace(/^\.\//, '');
}

/**
 * @param {string} text
 * @returns {boolean}
 */
function isEvalCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'eval'
  );
}

/**
 * @param {Record<string, any>} node
 * @returns {boolean}
 */
function isFunctionConstructor(node) {
  return (
    node.type === 'NewExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'Function'
  );
}

/**
 * @param {string} code
 * @returns {boolean}
 */
function isRequireCall(node) {
  return (
    node.type === 'CallExpression' &&
    node.callee?.type === 'Identifier' &&
    node.callee.name === 'require' &&
    node.arguments?.length >= 1 &&
    node.arguments[0]?.type === 'Literal' &&
    typeof node.arguments[0].value === 'string'
  );
}

/**
 * @param {unknown} options
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function mapJavaScript(options) {
  const input = /** @type {Record<string, any>} */ (options ?? {});
  const runId = String(input.runId ?? '');
  const adapterId = String(input.adapterId ?? 'js-acorn');
  const adapterVersion = String(input.adapterVersion ?? '0.1.0');
  const mainPath = normalizePath(input.path ?? '');
  const textSupplied = typeof input.text === 'string';
  const mainText = textSupplied ? input.text : '';
  const syntaxOnly = input.syntaxOnly === true;
  const resolutions = Array.isArray(input.resolutions) ? input.resolutions : [];
  const hostDiagnostics = Array.isArray(input.diagnostics) ? input.diagnostics : [];

  const allocator = createIdentityAllocator({ language: LANGUAGE });
  const relationshipIds = createRelationshipAllocator();

  /** @type {import('../../core/csr/entities.js').FileRecord[]} */
  const files = [];
  /** @type {import('../../core/csr/entities.js').SymbolRecord[]} */
  const symbols = [];
  /** @type {import('../../core/csr/entities.js').Relationship[]} */
  const relationships = [];
  /** @type {import('../../core/csr/entities.js').Diagnostic[]} */
  const diagnostics = hostDiagnostics.map((entry) =>
    createDiagnostic({
      severity: entry.severity ?? 'warning',
      code: entry.code ?? 'analysis_warning',
      message: entry.message ?? String(entry),
    }),
  );

  if (!textSupplied) {
    diagnostics.push(
      createDiagnostic({
        severity: 'warning',
        code: 'source_unavailable',
        message:
          'The host did not supply source text for this file, so only an empty placeholder run was produced.',
        affects: [],
      }),
    );
  }

  /** @type {Map<string, import('../../core/csr/entities.js').SymbolRecord>} */
  const symbolById = new Map();
  /** @type {Map<string, Record<string, any>>} */
  const moduleByPath = new Map();
  /** @type {Map<object, import('../../core/csr/entities.js').SymbolRecord>} */
  const symbolByAstNode = new Map();
  /** @type {Map<object, import('../../core/csr/entities.js').SymbolRecord>} */
  const symbolByVariable = new Map();
  /** @type {Map<string, {status: string, path?: string, reasonCode?: string, message?: string}>} */
  const resolutionByKey = new Map();

  for (const entry of resolutions) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const from = normalizePath(entry.from ?? mainPath);
    const specifier = String(entry.specifier ?? '');
    if (specifier.length === 0) {
      continue;
    }
    resolutionByKey.set(`${from}\u0000${specifier}`, {
      status: String(entry.status ?? 'unresolved'),
      ...(entry.path ? { path: normalizePath(entry.path) } : {}),
      ...(entry.reasonCode ? { reasonCode: String(entry.reasonCode) } : {}),
      ...(entry.message ? { message: String(entry.message) } : {}),
    });
  }

  let anonymousCounter = 0;

  /**
   * @param {string} value
   * @returns {string}
   */
  function anonName() {
    anonymousCounter += 1;
    return `#anon.${anonymousCounter}`;
  }

  /**
   * @param {{path: string, text: string, moduleKind: 'module'|'script', json?: boolean}} entry
   */
  function loadModule(entry) {
    const modulePath = normalizePath(entry.path);
    const locator = createJavaScriptLocator(modulePath, entry.text);
    const fileSymbol = createSymbol({
      symbolId: allocator.symbol({ path: modulePath, kind: 'file', qualifiedName: modulePath })
        .symbolId,
      kind: 'file',
      name: modulePath.slice(modulePath.lastIndexOf('/') + 1),
      qualifiedName: modulePath,
      language: LANGUAGE,
      declaration: locator.fileRange(),
      visibility: 'public',
    });
    symbols.push(fileSymbol);
    symbolById.set(fileSymbol.symbolId, fileSymbol);
    files.push(createFileRecord(locator.fileRecord()));

    const moduleSymbol = createSymbol({
      symbolId: allocator.symbol({
        path: modulePath,
        kind: 'module',
        qualifiedName: basename(modulePath),
      }).symbolId,
      kind: 'module',
      name: basename(modulePath),
      qualifiedName: basename(modulePath),
      language: LANGUAGE,
      declaration: locator.fileRange(),
      parentId: fileSymbol.symbolId,
      visibility: 'public',
    });
    symbols.push(moduleSymbol);
    symbolById.set(moduleSymbol.symbolId, moduleSymbol);

    /** @type {Record<string, any>} */
    const info = {
      path: modulePath,
      text: entry.text,
      moduleKind: entry.moduleKind,
      json: entry.json === true,
      locator,
      fileSymbol,
      moduleSymbol,
      ast: null,
      scopeManager: null,
      moduleScope: null,
      exports: new Map(),
      starExports: [],
      classes: [],
      symbolInitializers: new Map(),
      cjs: false,
      esm: false,
      parseError: false,
      objectMethods: new Map(),
    };
    moduleByPath.set(modulePath, info);
    return info;
  }

  /**
   * @param {string} modulePath
   * @param {string} specifier
   */
  function resolutionFor(modulePath, specifier) {
    return resolutionByKey.get(`${normalizePath(modulePath)}\u0000${specifier}`);
  }

  /**
   * @param {string} modulePath
   * @param {{status: string, path?: string, reasonCode?: string}} resolution
   * @returns {Record<string, any>|null}
   */
  function targetModule(modulePath, resolution) {
    if (!resolution || resolution.status !== 'resolved' || !resolution.path) {
      return null;
    }
    return moduleByPath.get(normalizePath(resolution.path)) ?? null;
  }

  /**
   * @param {{type: string, from: string, to: string, status: string, reasonCode?: string, site?: any, evidence?: any[], extensions?: any}} value
   * @returns {import('../../core/csr/entities.js').Relationship}
   */
  function rel(value) {
    return createRelationship({
      relationshipId: relationshipIds.relationship({
        type: value.type,
        from: value.from,
        to: value.to,
      }),
      type: value.type,
      from: value.from,
      to: value.to,
      status: value.status,
      ...(value.reasonCode ? { reasonCode: value.reasonCode } : {}),
      evidence: value.evidence ?? [
        createEvidence({ kind: 'source_range', ...(value.site ? { range: value.site } : {}) }),
      ],
      ...(value.site ? { site: value.site } : {}),
      ...(value.extensions ? { extensions: value.extensions } : {}),
    });
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @returns {import('../../core/csr/entities.js').SymbolRecord}
   */
  function fileSymbolFor(moduleInfo) {
    return moduleInfo.fileSymbol;
  }

  // ---------------------------------------------------------------------------
  // Load and parse every module the host resolved.
  // ---------------------------------------------------------------------------

  const main = loadModule({
    path: mainPath,
    text: mainText,
    moduleKind: input.moduleKind === 'script' ? 'script' : 'module',
  });
  /** @type {Record<string, any>[]} */
  const orderedModules = [main];
  for (const entry of Array.isArray(input.modules) ? input.modules : []) {
    if (!entry || !entry.path) {
      continue;
    }
    const modulePath = normalizePath(entry.path);
    if (modulePath === mainPath || moduleByPath.has(modulePath)) {
      continue;
    }
    orderedModules.push(
      loadModule({
        path: modulePath,
        text: String(entry.text ?? ''),
        moduleKind: entry.moduleKind === 'module' ? 'module' : 'script',
        json: entry.json === true,
      }),
    );
  }

  for (const moduleInfo of orderedModules) {
    if (moduleInfo.json) {
      moduleInfo.moduleScope = null;
      continue;
    }
    const parsed = parseJavaScript(moduleInfo.text, { sourceType: moduleInfo.moduleKind });
    if (!parsed.ok) {
      moduleInfo.parseError = true;
      diagnostics.push(
        createDiagnostic({
          severity: 'error',
          code: parsed.diagnostic.code,
          message:
            moduleInfo.path === mainPath
              ? parsed.diagnostic.message
              : `${moduleInfo.path}: ${parsed.diagnostic.message}`,
          ...(parsed.diagnostic.line
            ? {
                sourceRange: moduleInfo.locator.rangeAt(
                  {
                    line: Math.max(0, parsed.diagnostic.line - 1),
                    column: parsed.diagnostic.column ?? 0,
                  },
                  {
                    line: Math.max(0, parsed.diagnostic.line - 1),
                    column: parsed.diagnostic.column ?? 0,
                  },
                ),
              }
            : {}),
          affects: [moduleInfo.fileSymbol.symbolId],
        }),
      );
      continue;
    }
    moduleInfo.ast = parsed.ast;
    moduleInfo.scopeManager = parsed.scopeManager;
    const scopes = parsed.scopeManager.scopes;
    moduleInfo.moduleScope =
      scopes.find((scope) => scope.type === 'module') ??
      scopes.find((scope) => scope.type === 'script') ??
      scopes.find((scope) => scope.type === 'global') ??
      null;
    if (moduleInfo.ast.body?.some((node) => node.type === 'ImportDeclaration')) {
      moduleInfo.esm = true;
    }
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @returns {Record<string, any>}
   */
  function newContext(moduleInfo) {
    return {
      module: moduleInfo,
      symbol: moduleInfo.moduleSymbol,
      functionSymbol: null,
      classSymbol: null,
    };
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} scope
   * @returns {import('../../core/csr/entities.js').SymbolRecord}
   */
  function symbolForScope(moduleInfo, scope) {
    let current = scope;
    if (current?.type === 'function-expression-name') {
      current = current.upper;
    }
    while (current) {
      const block = current.block;
      if (block?.type === 'Program') {
        return moduleInfo.moduleSymbol;
      }
      const found = symbolByAstNode.get(block);
      if (found) {
        return found;
      }
      current = current.upper;
    }
    return moduleInfo.moduleSymbol;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {{name: string, kind: string, parent: any, declaration: any, disambiguator?: string, extensions?: any, visibility?: string, signature?: string, node?: any}} spec
   * @returns {import('../../core/csr/entities.js').SymbolRecord}
   */
  function addSymbol(moduleInfo, spec) {
    const parent = spec.parent ?? moduleInfo.moduleSymbol;
    const qualifiedName = parent ? `${parent.qualifiedName}::${spec.name}` : spec.name;
    const identity = allocator.symbol({
      path: moduleInfo.path,
      kind: spec.kind,
      qualifiedName,
      ...(spec.disambiguator ? { disambiguator: spec.disambiguator } : {}),
    });
    const symbol = createSymbol({
      symbolId: identity.symbolId,
      kind: spec.kind,
      name: spec.name,
      qualifiedName,
      language: LANGUAGE,
      declaration: spec.declaration,
      ...(parent ? { parentId: parent.symbolId } : {}),
      ...(spec.visibility ? { visibility: spec.visibility } : {}),
      ...(identity.disambiguator && identity.disambiguator !== '0'
        ? { disambiguator: identity.disambiguator }
        : {}),
      ...(spec.extensions ? { extensions: spec.extensions } : {}),
      ...(spec.signature ? { signature: spec.signature } : {}),
    });
    symbols.push(symbol);
    symbolById.set(symbol.symbolId, symbol);
    if (spec.node) {
      symbolByAstNode.set(spec.node, symbol);
    }
    return symbol;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {'function'|'closure'} kind
   * @param {string} name
   * @param {Record<string, any>} context
   * @returns {import('../../core/csr/entities.js').SymbolRecord}
   */
  function functionSymbol(moduleInfo, node, kind, name, context) {
    const parent = context.functionSymbol ?? context.classSymbol ?? moduleInfo.moduleSymbol;
    const scope = moduleInfo.scopeManager?.scopes.find((entry) => entry.block === node);
    const disambiguator =
      scope?.upper && scope.upper.type !== 'module' && scope.upper.type !== 'global'
        ? `scope${moduleInfo.scopeManager.scopes.indexOf(scope.upper)}`
        : undefined;
    return addSymbol(moduleInfo, {
      name,
      kind,
      parent,
      declaration: moduleInfo.locator.range(node),
      node,
      disambiguator,
      extensions: {
        async: node.async === true,
        generator: node.generator === true,
        arrow: node.type === 'ArrowFunctionExpression',
      },
      signature: `${name}(${(node.params ?? []).map((param) => param.type).join(', ')})`,
    });
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {Record<string, any>} context
   * @param {{nameHint?: string}} [options]
   */
  function walkDeclarations(moduleInfo, node, context, options = {}) {
    if (!node) {
      return;
    }
    if (node.type === 'Program') {
      for (const child of node.body ?? []) {
        walkDeclarations(moduleInfo, child, context);
      }
      return;
    }

    if (node.type === 'FunctionDeclaration') {
      const name = node.id?.name ?? anonName();
      const symbol = functionSymbol(moduleInfo, node, 'function', name, context);
      const inner = { ...context, functionSymbol: symbol, classSymbol: null };
      for (const param of node.params ?? []) {
        walkDeclarations(moduleInfo, param, inner);
      }
      walkDeclarations(moduleInfo, node.body, inner);
      return;
    }

    if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
      // A named function expression binds its own inner name; that name is the
      // function's identity, while the surrounding variable is a separate
      // binding that points at it.
      const name = node.id?.name ?? options.nameHint ?? anonName();
      const symbol = functionSymbol(moduleInfo, node, 'closure', name, context);
      const inner = { ...context, functionSymbol: symbol, classSymbol: null };
      for (const param of node.params ?? []) {
        walkDeclarations(moduleInfo, param, inner);
      }
      walkDeclarations(moduleInfo, node.body, inner);
      return;
    }

    if (isClassNode(node)) {
      const name = options.nameHint ?? node.id?.name ?? anonName();
      const symbol = addSymbol(moduleInfo, {
        name,
        kind: 'class',
        parent: context.functionSymbol ?? context.classSymbol ?? moduleInfo.moduleSymbol,
        declaration: moduleInfo.locator.range(node),
        node,
        extensions: { hasSuperClass: Boolean(node.superClass) },
      });
      const inner = { ...context, classSymbol: symbol };
      moduleInfo.classes.push({ node, symbol });
      for (const element of node.body?.body ?? []) {
        walkDeclarations(moduleInfo, element, inner);
      }
      return;
    }

    if (node.type === 'MethodDefinition') {
      const key = propertyName(node.key);
      const isConstructor = node.kind === 'constructor';
      const kind = isConstructor ? 'constructor' : 'method';
      const parent = context.classSymbol ?? context.functionSymbol ?? moduleInfo.moduleSymbol;
      const disambiguator = node.kind === 'get' || node.kind === 'set' ? node.kind : undefined;
      const symbol = addSymbol(moduleInfo, {
        name: key ?? (isConstructor ? 'constructor' : anonName()),
        kind,
        parent,
        declaration: moduleInfo.locator.range(node),
        node,
        ...(disambiguator ? { disambiguator } : {}),
        visibility: node.key?.type === 'PrivateIdentifier' ? 'private' : 'public',
        extensions: {
          static: node.static === true,
          getter: node.kind === 'get',
          setter: node.kind === 'set',
          async: node.value?.async === true,
          generator: node.value?.generator === true,
          private: node.key?.type === 'PrivateIdentifier',
        },
        signature: `${key ?? 'constructor'}(${(node.value?.params ?? [])
          .map((param) => param.type)
          .join(', ')})`,
      });
      symbolByAstNode.set(node.value, symbol);
      const inner = { ...context, functionSymbol: symbol, classSymbol: context.classSymbol };
      for (const param of node.value?.params ?? []) {
        walkDeclarations(moduleInfo, param, inner);
      }
      walkDeclarations(moduleInfo, node.value?.body, inner);
      return;
    }

    if (node.type === 'PropertyDefinition') {
      const name = propertyName(node.key) ?? anonName();
      const parent = context.classSymbol ?? context.functionSymbol ?? moduleInfo.moduleSymbol;
      addSymbol(moduleInfo, {
        name,
        kind: 'field',
        parent,
        declaration: moduleInfo.locator.range(node),
        node,
        visibility: node.key?.type === 'PrivateIdentifier' ? 'private' : 'public',
        extensions: {
          static: node.static === true,
          private: node.key?.type === 'PrivateIdentifier',
          initializer: initializerKind(node.value),
        },
      });
      if (node.value) {
        walkDeclarations(moduleInfo, node.value, context);
      }
      return;
    }

    if (node.type === 'StaticBlock') {
      diagnostics.push(
        createDiagnostic({
          severity: 'info',
          code: 'unsupported_construct',
          message: 'Class static blocks are parsed but not modelled as symbols in V1.',
          sourceRange: moduleInfo.locator.range(node),
          affects: [moduleInfo.fileSymbol.symbolId],
        }),
      );
      for (const child of node.body ?? []) {
        walkDeclarations(moduleInfo, child, context);
      }
      return;
    }

    if (node.type === 'ObjectExpression') {
      const methods = new Map();
      for (const property of node.properties ?? []) {
        if (property.type !== 'Property') {
          continue;
        }
        const name = propertyName(property.key);
        if (!name) {
          continue;
        }
        if (
          property.kind === 'get' ||
          property.kind === 'set' ||
          property.method === true ||
          isFunctionNode(property.value)
        ) {
          const symbol = addSymbol(moduleInfo, {
            name,
            kind: 'method',
            parent: context.functionSymbol ?? context.classSymbol ?? moduleInfo.moduleSymbol,
            declaration: moduleInfo.locator.range(property),
            node: property.value,
            visibility: 'public',
            extensions: {
              objectLiteral: true,
              getter: property.kind === 'get',
              setter: property.kind === 'set',
              async: property.value?.async === true,
            },
          });
          methods.set(name, symbol);
          symbolByAstNode.set(property.value, symbol);
          walkDeclarations(moduleInfo, property.value?.body, {
            ...context,
            functionSymbol: symbol,
          });
        } else {
          walkDeclarations(moduleInfo, property.value, context);
        }
      }
      moduleInfo.objectMethods.set(node, methods);
      return;
    }

    if (node.type === 'VariableDeclarator') {
      const nameHint = node.id?.type === 'Identifier' ? node.id.name : undefined;
      if (node.init) {
        if (isFunctionNode(node.init) || isClassNode(node.init)) {
          walkDeclarations(moduleInfo, node.init, context, { nameHint });
        } else {
          walkDeclarations(moduleInfo, node.init, context);
        }
      }
      walkDeclarations(moduleInfo, node.id, context);
      return;
    }

    for (const child of childNodes(node)) {
      walkDeclarations(moduleInfo, child, context, options);
    }
  }

  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    walkDeclarations(moduleInfo, moduleInfo.ast, newContext(moduleInfo));
  }

  // ---------------------------------------------------------------------------
  // Bind lexical variables to symbols. Function and class variables reuse the
  // symbol created by the declaration walk; everything else becomes a variable,
  // parameter, field, or import binding.
  // ---------------------------------------------------------------------------

  /**
   * @param {Record<string, any>} pattern
   * @param {string} bindingName
   * @returns {string|null}
   */
  function patternPropertyName(pattern, bindingName) {
    if (!pattern) {
      return null;
    }
    if (pattern.type === 'ObjectPattern') {
      for (const property of pattern.properties ?? []) {
        if (property.type === 'RestElement') {
          continue;
        }
        const identifiers = bindingIdentifiers(property.value);
        if (identifiers.some((identifier) => identifier.name === bindingName)) {
          return propertyName(property.key);
        }
      }
    }
    if (pattern.type === 'AssignmentPattern') {
      return patternPropertyName(pattern.left, bindingName);
    }
    return null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {import('../../core/csr/entities.js').SymbolRecord} symbol
   * @param {Record<string, any>} definition
   * @param {string} variableName
   */
  function applyInitializerMetadata(moduleInfo, symbol, definition, variableName) {
    const init = definition.node?.init;
    if (!init) {
      return;
    }
    if (init.type === 'ObjectExpression') {
      moduleInfo.symbolInitializers.set(symbol.symbolId, init);
      return;
    }
    if (init.type === 'NewExpression' && init.callee?.type === 'Identifier') {
      symbol.extensions = { ...(symbol.extensions ?? {}), className: init.callee.name };
    }
    if (isRequireCall(init)) {
      symbol.extensions = {
        ...(symbol.extensions ?? {}),
        require: {
          source: init.arguments[0].value,
          namespace: definition.node.id?.type === 'Identifier',
          importedName:
            definition.node.id?.type === 'Identifier'
              ? null
              : patternPropertyName(definition.node.id, variableName),
          moduleSystem: 'cjs',
        },
      };
      return;
    }
    if (init.type === 'MemberExpression' && !init.computed && isRequireCall(init.object)) {
      symbol.extensions = {
        ...(symbol.extensions ?? {}),
        require: {
          source: init.object.arguments[0].value,
          namespace: false,
          importedName: propertyName(init.property),
          moduleSystem: 'cjs',
        },
      };
    }
  }

  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.scopeManager) {
      continue;
    }
    const scopes = moduleInfo.scopeManager.scopes;
    for (const [scopeIndex, scope] of scopes.entries()) {
      const parentSymbol = symbolForScope(moduleInfo, scope);
      for (const variable of scope.variables) {
        if (variable.name === 'arguments' && variable.defs.length === 0) {
          continue;
        }
        const def = variable.defs[0];
        if (!def) {
          continue;
        }
        let symbol = null;
        if (def.type === 'FunctionName' || def.type === 'ClassName') {
          symbol = symbolByAstNode.get(def.node) ?? null;
        }
        if (
          !symbol &&
          def.type === 'Variable' &&
          def.node?.init &&
          (isFunctionNode(def.node.init) || isClassNode(def.node.init)) &&
          def.node.id?.type === 'Identifier'
        ) {
          symbol = symbolByAstNode.get(def.node.init) ?? null;
        }
        if (symbol) {
          symbolByVariable.set(variable, symbol);
          continue;
        }

        const kind =
          def.type === 'Parameter'
            ? 'parameter'
            : def.type === 'ImportBinding'
              ? 'variable'
              : def.type === 'FunctionName'
                ? 'closure'
                : def.type === 'ClassName'
                  ? 'class'
                  : 'variable';
        const declaration = def.name
          ? moduleInfo.locator.range(def.name)
          : moduleInfo.locator.range(variable.identifiers?.[0] ?? def.node);
        const rootScope =
          scope.type === 'module' || scope.type === 'global' || scope.type === 'script';
        const extensions = {};
        if (def.type === 'ImportBinding') {
          const specifier = def.parent?.source?.value;
          const imported =
            def.node.type === 'ImportDefaultSpecifier'
              ? 'default'
              : def.node.type === 'ImportNamespaceSpecifier'
                ? '*'
                : propertyName(def.node.imported);
          Object.assign(extensions, {
            import: {
              source: String(specifier ?? ''),
              imported,
              kind:
                def.node.type === 'ImportDefaultSpecifier'
                  ? 'default'
                  : def.node.type === 'ImportNamespaceSpecifier'
                    ? 'namespace'
                    : 'named',
              binding: variable.name,
            },
          });
        } else if (def.type === 'Parameter') {
          extensions.parameter = true;
        } else if (def.type === 'Variable') {
          extensions.declarationKind = def.parent?.kind ?? 'var';
          extensions.initializer = initializerKind(def.node?.init);
        } else if (def.type === 'CatchClause') {
          extensions.catchParameter = true;
        }

        symbol = addSymbol(moduleInfo, {
          name: variable.name,
          kind,
          parent: parentSymbol,
          declaration,
          node: def.name,
          disambiguator: rootScope ? undefined : `scope${scopeIndex}`,
          visibility: kind === 'parameter' ? 'local' : 'local',
          extensions,
        });
        symbolByVariable.set(variable, symbol);
        if (def.type === 'Variable') {
          applyInitializerMetadata(moduleInfo, symbol, def, variable.name);
        }
        if (variable.defs.length > 1) {
          diagnostics.push(
            createDiagnostic({
              severity: 'warning',
              code: 'redeclaration',
              message: `"${variable.name}" is declared more than once; references resolve to the first declaration.`,
              sourceRange: moduleInfo.locator.range(variable.defs[1]?.name ?? def.name),
              affects: [symbol.symbolId],
            }),
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Reference map for call and read/write extraction.
  // ---------------------------------------------------------------------------

  /** @type {Map<object, Record<string, any>>} */
  const referenceByIdentifier = new Map();
  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.scopeManager) {
      continue;
    }
    for (const scope of moduleInfo.scopeManager.scopes) {
      for (const reference of scope.references) {
        referenceByIdentifier.set(reference.identifier, reference);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Exports and imports.
  // ---------------------------------------------------------------------------

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {string} name
   * @param {import('../../core/csr/entities.js').SymbolRecord} symbol
   * @param {string} exportKind
   */
  function addExport(moduleInfo, name, symbol, exportKind) {
    if (!moduleInfo.exports.has(name)) {
      moduleInfo.exports.set(name, { symbol, exportKind, reexport: null });
    }
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {Record<string, any>} context
   */
  function collectExports(moduleInfo, node) {
    if (!node || node.type !== 'Program') {
      return;
    }
    for (const statement of node.body ?? []) {
      if (statement.type === 'ExportNamedDeclaration') {
        moduleInfo.esm = true;
        if (statement.declaration) {
          for (const name of declaredNames(statement.declaration)) {
            const variable = moduleInfo.moduleScope?.set?.get(name);
            const symbol = variable ? symbolByVariable.get(variable) : null;
            if (symbol) {
              addExport(moduleInfo, name, symbol, 'named');
            }
          }
        }
        for (const specifier of statement.specifiers ?? []) {
          const exported = propertyName(specifier.exported) ?? propertyName(specifier.local);
          const local = propertyName(specifier.local) ?? exported;
          if (statement.source) {
            moduleInfo.starExports.push({
              source: statement.source.value,
              names: [{ exported, local }],
            });
            continue;
          }
          const variable = moduleInfo.moduleScope?.set?.get(local);
          const symbol = variable ? symbolByVariable.get(variable) : null;
          if (symbol) {
            addExport(moduleInfo, exported, symbol, 'named');
          }
        }
      } else if (statement.type === 'ExportDefaultDeclaration') {
        moduleInfo.esm = true;
        const declaration = statement.declaration;
        let symbol = null;
        if (isFunctionNode(declaration) || isClassNode(declaration)) {
          symbol = symbolByAstNode.get(declaration) ?? null;
        } else if (declaration.type === 'Identifier') {
          const reference = referenceByIdentifier.get(declaration);
          const variable = reference?.resolved;
          symbol = variable ? (symbolByVariable.get(variable) ?? null) : null;
        }
        if (!symbol) {
          symbol = addSymbol(moduleInfo, {
            name: 'default',
            kind: 'variable',
            parent: moduleInfo.moduleSymbol,
            declaration: moduleInfo.locator.range(declaration),
            extensions: { defaultExport: true, initializer: initializerKind(declaration) },
          });
        }
        addExport(moduleInfo, 'default', symbol, 'default');
      } else if (statement.type === 'ExportAllDeclaration') {
        moduleInfo.esm = true;
        moduleInfo.starExports.push({ source: statement.source.value, names: [] });
      } else if (statement.type === 'ImportDeclaration') {
        moduleInfo.esm = true;
        const target = resolutionFor(moduleInfo.path, statement.source.value);
        const targetInfo = targetModule(moduleInfo.path, target);
        relationships.push(
          rel({
            type: 'imports',
            from: moduleInfo.moduleSymbol.symbolId,
            to: targetInfo
              ? fileSymbolFor(targetInfo).symbolId
              : `external:${statement.source.value}`,
            status: target?.status === 'resolved' ? 'resolved' : 'unresolved',
            ...(target?.status === 'resolved'
              ? {}
              : { reasonCode: target?.reasonCode ?? 'unknown_import_target' }),
            site: moduleInfo.locator.range(statement.source),
            extensions: {
              specifier: statement.source.value,
              moduleSystem: 'esm',
              imported: (statement.specifiers ?? [])
                .map((specifier) => propertyName(specifier.imported ?? specifier.local))
                .filter(Boolean),
            },
          }),
        );
      } else if (statement.type === 'ExpressionStatement') {
        collectCommonJsExport(moduleInfo, statement.expression);
      }
    }
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} expression
   */
  function collectCommonJsExport(moduleInfo, expression) {
    if (!expression || expression.type !== 'AssignmentExpression') {
      return;
    }
    const left = expression.left;
    const right = expression.right;
    const isModuleExports =
      left?.type === 'MemberExpression' &&
      !left.computed &&
      left.object?.type === 'Identifier' &&
      left.object.name === 'module' &&
      propertyName(left.property) === 'exports';
    const isExportsMember =
      left?.type === 'MemberExpression' &&
      !left.computed &&
      left.object?.type === 'Identifier' &&
      left.object.name === 'exports';
    const isModuleExportsMember =
      left?.type === 'MemberExpression' &&
      !left.computed &&
      left.object?.type === 'MemberExpression' &&
      left.object.object?.type === 'Identifier' &&
      left.object.object.name === 'module' &&
      propertyName(left.object.property) === 'exports';

    if (!isModuleExports && !isExportsMember && !isModuleExportsMember) {
      return;
    }
    moduleInfo.cjs = true;
    if (isModuleExports) {
      if (right.type === 'ObjectExpression') {
        for (const property of right.properties ?? []) {
          if (property.type !== 'Property') {
            continue;
          }
          const name = propertyName(property.key);
          if (!name) {
            continue;
          }
          const symbol = symbolForValue(moduleInfo, property.value);
          if (symbol) {
            addExport(moduleInfo, name, symbol, 'cjs_named');
          }
        }
        return;
      }
      const symbol = symbolForValue(moduleInfo, right);
      if (symbol) {
        addExport(moduleInfo, 'default', symbol, 'cjs_default');
      }
      return;
    }
    const name = propertyName(left.property);
    const symbol = symbolForValue(moduleInfo, right);
    if (name && symbol) {
      addExport(moduleInfo, name, symbol, 'cjs_named');
    }
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function symbolForValue(moduleInfo, node) {
    if (!node) {
      return null;
    }
    if (isFunctionNode(node) || isClassNode(node)) {
      return symbolByAstNode.get(node) ?? null;
    }
    if (node.type === 'Identifier') {
      const reference = referenceByIdentifier.get(node);
      const variable = reference?.resolved;
      if (variable) {
        return symbolByVariable.get(variable) ?? null;
      }
      const moduleVariable = moduleInfo.moduleScope?.set?.get(node.name);
      return moduleVariable ? (symbolByVariable.get(moduleVariable) ?? null) : null;
    }
    return null;
  }

  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    // A CommonJS module request is a CJS notion even when no export is
    // written, so the mixed-module diagnostic must see it before call
    // collection runs.
    if (!moduleInfo.cjs) {
      /** @param {Record<string, any>} node */
      const scan = (node) => {
        if (moduleInfo.cjs) {
          return;
        }
        if (isRequireCall(node)) {
          moduleInfo.cjs = true;
          return;
        }
        for (const child of childNodes(node)) {
          scan(child);
        }
      };
      scan(moduleInfo.ast);
    }
    collectExports(moduleInfo, moduleInfo.ast);
    if (moduleInfo.esm && moduleInfo.cjs) {
      diagnostics.push(
        createDiagnostic({
          severity: 'warning',
          code: 'mixed_module_system',
          message:
            'This file mixes ES module syntax with CommonJS require/exports. Resolution follows the file extension and package type.',
          affects: [moduleInfo.fileSymbol.symbolId],
        }),
      );
    }
  }

  /**
   * @param {string} modulePath
   * @param {string} name
   * @param {Set<string>} seen
   * @param {number} depth
   * @returns {{symbol: import('../../core/csr/entities.js').SymbolRecord|null, reasonCode?: string, modulePath?: string}}
   */
  function resolveExport(modulePath, name, seen = new Set(), depth = 0) {
    if (depth > 8) {
      return { symbol: null, reasonCode: 'reexport_depth_exceeded' };
    }
    const key = `${modulePath}\u0000${name}`;
    if (seen.has(key)) {
      return { symbol: null, reasonCode: 'unknown_import_target' };
    }
    seen.add(key);
    const moduleInfo = moduleByPath.get(modulePath);
    if (!moduleInfo) {
      return { symbol: null, reasonCode: 'unknown_import_target' };
    }
    if (moduleInfo.json) {
      if (name === 'default') {
        const symbol = moduleInfo.exports.get('default')?.symbol ?? null;
        return symbol
          ? { symbol, modulePath }
          : { symbol: null, reasonCode: 'unknown_import_target' };
      }
      return { symbol: null, reasonCode: 'unknown_import_target' };
    }
    const direct = moduleInfo.exports.get(name);
    if (direct?.symbol) {
      return { symbol: direct.symbol, modulePath };
    }
    for (const star of moduleInfo.starExports) {
      const resolution = resolutionFor(moduleInfo.path, star.source);
      if (resolution?.status !== 'resolved' || !resolution.path) {
        continue;
      }
      const target = moduleByPath.get(normalizePath(resolution.path));
      if (!target) {
        continue;
      }
      const explicit = star.names?.find((entry) => entry.exported === name);
      const lookup = explicit ? explicit.local : name;
      const found = resolveExport(target.path, lookup, seen, depth + 1);
      if (found.symbol) {
        return found;
      }
    }
    return { symbol: null, reasonCode: 'unknown_import_target' };
  }

  // Add default symbols for JSON modules.
  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.json) {
      continue;
    }
    const symbol = addSymbol(moduleInfo, {
      name: 'default',
      kind: 'variable',
      parent: moduleInfo.moduleSymbol,
      declaration: moduleInfo.locator.fileRange(),
      extensions: { jsonModule: true },
    });
    addExport(moduleInfo, 'default', symbol, 'default');
  }

  // ---------------------------------------------------------------------------
  // Export relationships and per-import file edges for re-exports/dynamic
  // imports/require calls.
  // ---------------------------------------------------------------------------

  for (const moduleInfo of orderedModules) {
    for (const [name, entry] of moduleInfo.exports) {
      relationships.push(
        rel({
          type: 'exports',
          from: moduleInfo.moduleSymbol.symbolId,
          to: entry.symbol.symbolId,
          status: 'resolved',
          site: entry.symbol.declaration,
          extensions: { exportName: name, exportKind: entry.exportKind },
        }),
      );
    }
    for (const star of moduleInfo.starExports) {
      const resolution = resolutionFor(moduleInfo.path, star.source);
      const target = targetModule(moduleInfo.path, resolution);
      if (star.names.length > 0) {
        for (const { exported, local } of star.names) {
          const found = target ? resolveExport(target.path, local) : { symbol: null };
          relationships.push(
            rel({
              type: 'exports',
              from: moduleInfo.moduleSymbol.symbolId,
              to: found.symbol?.symbolId ?? `external:${star.source}#${local}`,
              status: found.symbol ? 'resolved' : 'unresolved',
              ...(found.symbol
                ? {}
                : {
                    reasonCode:
                      found.reasonCode ?? resolution?.reasonCode ?? 'unknown_import_target',
                  }),
              site: moduleInfo.locator.fileRange(),
              extensions: {
                exportName: exported,
                exportKind: 'reexport',
                from: star.source,
                reexport: true,
              },
            }),
          );
        }
      } else if (target) {
        for (const [name, entry] of target.exports) {
          relationships.push(
            rel({
              type: 'exports',
              from: moduleInfo.moduleSymbol.symbolId,
              to: entry.symbol.symbolId,
              status: 'resolved',
              site: entry.symbol.declaration,
              extensions: {
                exportName: name,
                exportKind: 'reexport',
                from: star.source,
                reexport: true,
              },
            }),
          );
        }
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Calls, reads, and writes.
  // ---------------------------------------------------------------------------

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} scope
   * @returns {'eval_scope'|'dynamic_scope'|null}
   */
  function dynamicScopeReason(moduleInfo, scope) {
    let current = scope;
    while (current) {
      if (current.__hasEval) {
        return 'eval_scope';
      }
      if (current.__hasDynamic) {
        return 'dynamic_scope';
      }
      if (current.type === 'module' || current.type === 'global') {
        break;
      }
      current = current.upper;
    }
    return null;
  }

  // Pre-pass: mark eval/with scopes and remember which lexical scope owns each
  // node so later passes do not have to guess from the node's block.
  /** @type {WeakMap<object, Record<string, any>>} */
  const nodeScope = new WeakMap();
  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    const visit = (node, scope) => {
      if (!node) {
        return;
      }
      if (isEvalCall(node) || isFunctionConstructor(node)) {
        if (scope) {
          scope.__hasEval = true;
          diagnostics.push(
            createDiagnostic({
              severity: 'warning',
              code: 'eval_scope',
              message:
                'eval or new Function appears in this scope; dynamic calls in it are downgraded to possible or unresolved.',
              affects: [moduleInfo.fileSymbol.symbolId],
            }),
          );
        }
      }
      if (node.type === 'WithStatement') {
        if (scope) {
          scope.__hasDynamic = true;
          diagnostics.push(
            createDiagnostic({
              severity: 'warning',
              code: 'dynamic_scope',
              message:
                'A with statement makes identifier resolution dynamic; affected calls are downgraded.',
              affects: [moduleInfo.fileSymbol.symbolId],
            }),
          );
        }
      }
      const acquired =
        moduleInfo.scopeManager?.scopes.find((entry) => entry.block === node) ?? scope;
      if (scope) {
        nodeScope.set(node, scope);
      }
      for (const child of childNodes(node)) {
        visit(child, acquired);
      }
    };
    visit(moduleInfo.ast, moduleInfo.moduleScope);
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @returns {Record<string, any>|null}
   */
  function referenceFor(moduleInfo, node) {
    return node ? (referenceByIdentifier.get(node) ?? null) : null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} identifier
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function symbolForIdentifier(moduleInfo, identifier) {
    const reference = referenceFor(moduleInfo, identifier);
    if (reference?.resolved) {
      return symbolByVariable.get(reference.resolved) ?? null;
    }
    if (identifier?.name) {
      const variable = moduleInfo.moduleScope?.set?.get(identifier.name);
      return variable ? (symbolByVariable.get(variable) ?? null) : null;
    }
    return null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} symbol
   * @param {string} name
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function methodOfSymbol(moduleInfo, symbol, name) {
    if (!symbol) {
      return null;
    }
    if (symbol.kind === 'class') {
      const methods = [...symbolById.values()].filter(
        (candidate) =>
          candidate.parentId === symbol.symbolId &&
          (candidate.kind === 'method' || candidate.kind === 'constructor'),
      );
      const direct = methods.find((candidate) => candidate.name === name);
      if (direct) {
        return direct;
      }
      const baseId = symbol.extensions?.baseClassId;
      if (typeof baseId === 'string') {
        return methodOfSymbol(moduleInfo, symbolById.get(baseId) ?? null, name);
      }
      return null;
    }
    return null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {string} name
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function findClassByName(moduleInfo, name) {
    const variable = moduleInfo.moduleScope?.set?.get(name);
    const symbol = variable ? (symbolByVariable.get(variable) ?? null) : null;
    if (symbol?.kind === 'class') {
      return symbol;
    }
    const candidate = moduleInfo.classes.find((entry) => entry.symbol.name === name);
    return candidate?.symbol ?? null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {string} source
   * @param {string} exported
   * @returns {{symbol: import('../../core/csr/entities.js').SymbolRecord|null, reasonCode?: string}}
   */
  function resolveImportedSymbol(moduleInfo, source, exported) {
    const resolution = resolutionFor(moduleInfo.path, source);
    if (!resolution || resolution.status !== 'resolved' || !resolution.path) {
      return { symbol: null, reasonCode: resolution?.reasonCode ?? 'unresolved_import' };
    }
    return resolveExport(normalizePath(resolution.path), exported);
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} symbol
   * @param {string} name
   * @returns {{symbol: import('../../core/csr/entities.js').SymbolRecord|null, status?: string, reasonCode?: string, note?: string}}
   */
  function resolveMember(moduleInfo, symbol, name) {
    if (!symbol) {
      return { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    const imported = symbol.extensions?.import;
    if (imported) {
      if (imported.kind === 'namespace') {
        const found = resolveImportedSymbol(moduleInfo, imported.source, name);
        return found.symbol
          ? { symbol: found.symbol, status: 'resolved' }
          : {
              symbol: null,
              status: 'unresolved',
              reasonCode: found.reasonCode ?? 'unknown_import_target',
            };
      }
      return { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    const required = symbol.extensions?.require;
    if (required) {
      if (required.namespace) {
        const found = resolveImportedSymbol(moduleInfo, required.source, name);
        return found.symbol
          ? { symbol: found.symbol, status: 'resolved' }
          : {
              symbol: null,
              status: 'unresolved',
              reasonCode: found.reasonCode ?? 'unknown_import_target',
            };
      }
      return { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    if (symbol.kind === 'class') {
      const method = methodOfSymbol(moduleInfo, symbol, name);
      return method
        ? { symbol: method, status: 'resolved' }
        : { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    if (typeof symbol.extensions?.className === 'string') {
      const classSymbol = findClassByName(moduleInfo, symbol.extensions.className);
      const method = methodOfSymbol(moduleInfo, classSymbol, name);
      return method
        ? {
            symbol: method,
            status: 'inferred',
            reasonCode: 'dynamic_dispatch',
            note: `same-file instance of ${symbol.extensions.className}`,
          }
        : { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    const objectNode = moduleInfo.symbolInitializers.get(symbol.symbolId);
    if (objectNode) {
      const methods = moduleInfo.objectMethods.get(objectNode);
      const method = methods?.get(name) ?? null;
      return method
        ? {
            symbol: method,
            status: 'inferred',
            reasonCode: 'dynamic_dispatch',
            note: 'same-file object literal',
          }
        : { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
    }
    return { symbol: null, status: 'unresolved', reasonCode: 'unknown_receiver' };
  }

  // Inheritance needs the variable and reference maps built above.
  for (const moduleInfo of orderedModules) {
    for (const entry of moduleInfo.classes) {
      const superClass = entry.node.superClass;
      if (!superClass) {
        continue;
      }
      const base =
        superClass.type === 'Identifier'
          ? symbolForIdentifier(moduleInfo, superClass)
          : (symbolByAstNode.get(superClass) ?? null);
      if (base?.kind !== 'class') {
        continue;
      }
      entry.symbol.extensions = {
        ...(entry.symbol.extensions ?? {}),
        baseClassId: base.symbolId,
      };
      relationships.push(
        rel({
          type: 'inherits',
          from: entry.symbol.symbolId,
          to: base.symbolId,
          status: 'resolved',
          site: moduleInfo.locator.range(superClass),
        }),
      );
    }
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {Record<string, any>} context
   * @returns {{kind: 'symbol', symbol: any, status: string, reasonCode?: string, note?: string} | {kind: 'external', target: string, status: string, reasonCode: string, note?: string} | null}
   */
  function classifyCallee(moduleInfo, node, context) {
    if (!node) {
      return null;
    }
    if (isFunctionNode(node) || isClassNode(node)) {
      const symbol = symbolByAstNode.get(node) ?? null;
      return symbol
        ? { kind: 'symbol', symbol, status: 'resolved' }
        : {
            kind: 'external',
            target: 'external:anonymous',
            status: 'unresolved',
            reasonCode: 'unknown_receiver',
          };
    }
    if (node.type === 'Identifier') {
      if (node.name === 'eval' || node.name === 'require') {
        return null;
      }
      const symbol = symbolForIdentifier(moduleInfo, node);
      if (symbol) {
        if (symbol.extensions?.import) {
          const imported = symbol.extensions.import;
          if (imported.kind === 'namespace') {
            return {
              kind: 'external',
              target: `external:module:${imported.source}`,
              status: 'unresolved',
              reasonCode: 'unknown_receiver',
              note: 'namespace import called as a function',
            };
          }
          const found = resolveImportedSymbol(moduleInfo, imported.source, imported.imported);
          if (found.symbol) {
            return { kind: 'symbol', symbol: found.symbol, status: 'resolved' };
          }
          return {
            kind: 'external',
            target: `external:${imported.source}#${imported.imported}`,
            status: 'unresolved',
            reasonCode: found.reasonCode ?? 'unknown_import_target',
          };
        }
        if (symbol.extensions?.require) {
          const required = symbol.extensions.require;
          if (required.importedName) {
            const found = resolveImportedSymbol(moduleInfo, required.source, required.importedName);
            if (found.symbol) {
              return { kind: 'symbol', symbol: found.symbol, status: 'resolved' };
            }
            return {
              kind: 'external',
              target: `external:${required.source}#${required.importedName}`,
              status: 'unresolved',
              reasonCode: found.reasonCode ?? 'unknown_import_target',
            };
          }
          return {
            kind: 'external',
            target: `external:require:${required.source}`,
            status: 'unresolved',
            reasonCode: 'unknown_receiver',
            note: 'CommonJS namespace called as a function',
          };
        }
        if (symbol.kind === 'class') {
          return {
            kind: 'symbol',
            symbol,
            status: 'resolved',
            note: 'class construction requires new; call treated as reference',
          };
        }
        if (symbol.kind === 'parameter') {
          // A parameter is a known binding, not a known callee. The function it
          // holds arrives at runtime, so the edge stays possible.
          return {
            kind: 'symbol',
            symbol,
            status: 'possible',
            reasonCode: 'callback_parameter',
            note: 'callback parameter invocation',
          };
        }
        if (symbol.kind === 'variable' || symbol.kind === 'parameter') {
          if (
            symbol.extensions?.initializer === 'function' ||
            symbol.extensions?.initializer === 'class'
          ) {
            return { kind: 'symbol', symbol, status: 'resolved' };
          }
          if (symbol.kind === 'variable') {
            return {
              kind: 'external',
              target: `external:variable:${symbol.name}`,
              status: 'unresolved',
              reasonCode: 'unknown_receiver',
              note: 'variable holds no statically known callable',
            };
          }
        }
        return { kind: 'symbol', symbol, status: 'resolved' };
      }
      return {
        kind: 'external',
        target: `external:global.${node.name}`,
        status: 'unresolved',
        reasonCode: 'out_of_scope',
        note: 'unbound identifier',
      };
    }
    if (node.type === 'MemberExpression') {
      if (node.computed) {
        return {
          kind: 'external',
          target: 'external:computed',
          status: 'unresolved',
          reasonCode: 'computed_member',
        };
      }
      const name = propertyName(node.property);
      if (!name) {
        return {
          kind: 'external',
          target: 'external:computed',
          status: 'unresolved',
          reasonCode: 'computed_member',
        };
      }
      const object = node.object;
      if (['call', 'apply', 'bind'].includes(name) && object?.type === 'Identifier') {
        const symbol = symbolForIdentifier(moduleInfo, object);
        if (symbol) {
          return {
            kind: 'symbol',
            symbol,
            status: 'inferred',
            reasonCode: 'dynamic_dispatch',
            note: `Function.prototype.${name}`,
          };
        }
      }
      if (object?.type === 'ThisExpression') {
        const method = context.classSymbol
          ? methodOfSymbol(moduleInfo, context.classSymbol, name)
          : null;
        if (method) {
          return { kind: 'symbol', symbol: method, status: 'resolved' };
        }
        return {
          kind: 'external',
          target: `external:this.${name}`,
          status: 'unresolved',
          reasonCode: 'unknown_receiver',
        };
      }
      if (
        object?.type === 'Identifier' &&
        (object.name === 'module' || object.name === 'exports')
      ) {
        return {
          kind: 'external',
          target: `external:cjs.${name}`,
          status: 'unresolved',
          reasonCode: 'unknown_receiver',
        };
      }
      if (isRequireCall(object)) {
        const specifier = object.arguments[0].value;
        const found = resolveImportedSymbol(moduleInfo, specifier, name);
        return found.symbol
          ? { kind: 'symbol', symbol: found.symbol, status: 'resolved' }
          : {
              kind: 'external',
              target: `external:${specifier}#${name}`,
              status: 'unresolved',
              reasonCode: found.reasonCode ?? 'unknown_import_target',
            };
      }
      if (object?.type === 'Identifier') {
        const symbol = symbolForIdentifier(moduleInfo, object);
        if (symbol) {
          const member = resolveMember(moduleInfo, symbol, name);
          return member.symbol
            ? {
                kind: 'symbol',
                symbol: member.symbol,
                status: member.status ?? 'inferred',
                ...(member.reasonCode ? { reasonCode: member.reasonCode } : {}),
                ...(member.note ? { note: member.note } : {}),
              }
            : {
                kind: 'external',
                target: `external:${object.name}.${name}`,
                status: 'unresolved',
                reasonCode: member.reasonCode ?? 'unknown_receiver',
              };
        }
        if (
          [
            'console',
            'Math',
            'JSON',
            'Object',
            'Array',
            'Promise',
            'process',
            'Date',
            'Number',
            'String',
            'Reflect',
          ].includes(object.name)
        ) {
          return {
            kind: 'external',
            target: `external:global.${object.name}.${name}`,
            status: 'unresolved',
            reasonCode: 'out_of_scope',
          };
        }
        return {
          kind: 'external',
          target: `external:${object.name}.${name}`,
          status: 'unresolved',
          reasonCode: 'unknown_receiver',
        };
      }
      if (object?.type === 'NewExpression') {
        const classSymbol = classifyCallee(moduleInfo, object.callee, context);
        if (classSymbol?.kind === 'symbol' && classSymbol.symbol.kind === 'class') {
          const method = methodOfSymbol(moduleInfo, classSymbol.symbol, name);
          return method
            ? {
                kind: 'symbol',
                symbol: method,
                status: 'inferred',
                reasonCode: 'dynamic_dispatch',
                note: 'fresh instance',
              }
            : {
                kind: 'external',
                target: `external:new.${name}`,
                status: 'unresolved',
                reasonCode: 'unknown_receiver',
              };
        }
      }
      // fn.call / fn.apply / fn.bind are classified before the generic member
      // path so they keep their `inferred` status.
      return {
        kind: 'external',
        target: 'external:member',
        status: 'unresolved',
        reasonCode: 'unknown_receiver',
      };
    }
    return null;
  }

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {Record<string, any>} context
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function symbolForCallArgument(moduleInfo, node) {
    if (!node) {
      return null;
    }
    if (isFunctionNode(node) || isClassNode(node)) {
      return symbolByAstNode.get(node) ?? null;
    }
    if (node.type === 'Identifier') {
      return symbolForIdentifier(moduleInfo, node);
    }
    if (node.type === 'MemberExpression' && !node.computed) {
      const objectSymbol =
        node.object?.type === 'Identifier' ? symbolForIdentifier(moduleInfo, node.object) : null;
      const name = propertyName(node.property);
      if (objectSymbol && name) {
        return resolveMember(moduleInfo, objectSymbol, name).symbol;
      }
    }
    return null;
  }

  /** @type {Set<object>} */
  const callCalleeIdentifiers = new Set();
  /** @type {Array<{node: Record<string, any>, context: Record<string, any>, moduleInfo: Record<string, any>}>} */
  const calls = [];

  /**
   * @param {Record<string, any>} moduleInfo
   * @param {Record<string, any>} node
   * @param {Record<string, any>} context
   */
  function collectCalls(moduleInfo, node, context) {
    if (!node) {
      return;
    }
    let inner = context;
    if (node.type === 'Program') {
      for (const child of node.body ?? []) {
        collectCalls(moduleInfo, child, context);
      }
      return;
    }
    if (isFunctionNode(node)) {
      const symbol = symbolByAstNode.get(node) ?? context.functionSymbol;
      inner = { ...context, functionSymbol: symbol ?? context.functionSymbol, classSymbol: null };
      for (const param of node.params ?? []) {
        collectCalls(moduleInfo, param, inner);
      }
      collectCalls(moduleInfo, node.body, inner);
      return;
    }
    if (isClassNode(node)) {
      const symbol = symbolByAstNode.get(node) ?? context.classSymbol;
      inner = { ...context, classSymbol: symbol ?? context.classSymbol };
      collectCalls(moduleInfo, node.body, inner);
      return;
    }
    if (node.type === 'MethodDefinition') {
      const symbol = symbolByAstNode.get(node.value) ?? context.functionSymbol;
      inner = { ...context, functionSymbol: symbol ?? context.functionSymbol };
      collectCalls(moduleInfo, node.value?.body, inner);
      return;
    }
    if (node.type === 'PropertyDefinition') {
      collectCalls(moduleInfo, node.value, context);
      return;
    }
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      if (node.callee?.type === 'Identifier') {
        callCalleeIdentifiers.add(node.callee);
      }
      if (node.type === 'CallExpression') {
        calls.push({ node, context: inner, moduleInfo });
      } else {
        calls.push({ node, context: inner, moduleInfo });
      }
      if (node.callee) {
        collectCalls(moduleInfo, node.callee, inner);
      }
      for (const argument of node.arguments ?? []) {
        collectCalls(moduleInfo, argument, inner);
      }
      return;
    }
    for (const child of childNodes(node)) {
      collectCalls(moduleInfo, child, inner);
    }
  }

  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    collectCalls(moduleInfo, moduleInfo.ast, newContext(moduleInfo));
  }

  for (const call of calls) {
    const { node, context, moduleInfo } = call;
    const from = context.functionSymbol?.symbolId ?? moduleInfo.moduleSymbol.symbolId;
    const scope =
      nodeScope.get(node) ?? moduleInfo.scopeManager?.scopes.find((entry) => entry.block === node);
    const evalScope = scope ? dynamicScopeReason(moduleInfo, scope) : null;
    const site = moduleInfo.locator.range(node.callee ?? node);

    if (node.type === 'NewExpression') {
      const classified = classifyCallee(moduleInfo, node.callee, context);
      if (!classified) {
        continue;
      }
      const target = classified.kind === 'symbol' ? classified.symbol.symbolId : classified.target;
      relationships.push(
        rel({
          type: 'instantiates',
          from,
          to: target,
          status: classified.kind === 'symbol' ? 'resolved' : classified.status,
          ...(classified.kind === 'symbol'
            ? {}
            : { reasonCode: classified.reasonCode ?? 'unknown_receiver' }),
          site,
          ...(classified.note ? { extensions: { note: classified.note } } : {}),
        }),
      );
      continue;
    }

    // A CommonJS module request is an import edge, not a call.
    if (isRequireCall(node)) {
      const specifier = node.arguments[0].value;
      const resolution = resolutionFor(moduleInfo.path, specifier);
      const target = targetModule(moduleInfo.path, resolution);
      relationships.push(
        rel({
          type: 'imports',
          from: moduleInfo.moduleSymbol.symbolId,
          to: target ? fileSymbolFor(target).symbolId : `external:${specifier}`,
          status: resolution?.status === 'resolved' ? 'resolved' : 'unresolved',
          ...(resolution?.status === 'resolved'
            ? {}
            : { reasonCode: resolution?.reasonCode ?? 'unknown_import_target' }),
          site: moduleInfo.locator.range(node.arguments[0]),
          extensions: { specifier, moduleSystem: 'cjs' },
        }),
      );
      continue;
    }

    const callee = node.callee;
    const classified = classifyCallee(moduleInfo, callee, context);
    if (!classified) {
      continue;
    }

    let status = classified.kind === 'symbol' ? classified.status : classified.status;
    let reasonCode = classified.reasonCode;
    if (
      evalScope &&
      status === 'resolved' &&
      classified.kind === 'symbol' &&
      classified.symbol.symbolId !== from
    ) {
      status = 'possible';
      reasonCode = evalScope;
    }

    relationships.push(
      rel({
        type: 'calls',
        from,
        to: classified.kind === 'symbol' ? classified.symbol.symbolId : classified.target,
        status,
        ...(status === 'resolved' ? {} : { reasonCode: reasonCode ?? 'unknown_receiver' }),
        site,
        ...(classified.kind === 'symbol' && classified.symbol.symbolId === from
          ? { extensions: { recursive: true } }
          : classified.note
            ? { extensions: { note: classified.note } }
            : {}),
      }),
    );

    // Callback parameters passed to a known local function, and deferred
    // scheduler calls, become possible edges from the receiving function.
    const timerNames = new Set(['setTimeout', 'setInterval', 'setImmediate', 'queueMicrotask']);
    const isTimer =
      (callee.type === 'Identifier' && timerNames.has(callee.name)) ||
      (callee.type === 'MemberExpression' &&
        !callee.computed &&
        callee.object?.type === 'Identifier' &&
        callee.object.name === 'process' &&
        propertyName(callee.property) === 'nextTick');
    for (const argument of node.arguments ?? []) {
      const callback = symbolForCallArgument(moduleInfo, argument);
      if (!callback) {
        continue;
      }
      // A bare parameter is not evidence of a callback unless it is handed to a
      // scheduler, where the receiving API invokes it by contract.
      const callable = ['function', 'closure', 'method', 'constructor'].includes(callback.kind);
      if (!callable && !(isTimer && callback.kind === 'parameter')) {
        continue;
      }
      if (isTimer) {
        relationships.push(
          rel({
            type: 'calls',
            from,
            to: callback.symbolId,
            status: 'possible',
            reasonCode: 'deferred_invocation',
            site: moduleInfo.locator.range(argument),
            extensions: { note: 'scheduled callback' },
          }),
        );
      } else if (
        classified.kind === 'symbol' &&
        (classified.symbol.kind === 'function' || classified.symbol.kind === 'closure')
      ) {
        relationships.push(
          rel({
            type: 'calls',
            from: classified.symbol.symbolId,
            to: callback.symbolId,
            status: 'possible',
            reasonCode: 'callback_parameter',
            site: moduleInfo.locator.range(argument),
            extensions: { note: 'callback argument' },
          }),
        );
      }
    }
  }

  // Reads and writes for resolved lexical references.
  for (const [identifier, reference] of referenceByIdentifier) {
    if (!reference.resolved || callCalleeIdentifiers.has(identifier)) {
      continue;
    }
    const moduleInfo = orderedModules.find((entry) =>
      entry.scopeManager?.scopes.some((scope) => scope.references.includes(reference)),
    );
    if (!moduleInfo) {
      continue;
    }
    const symbol = symbolByVariable.get(reference.resolved);
    if (!symbol) {
      continue;
    }
    const scope = reference.from;
    const from = symbolForScope(moduleInfo, scope).symbolId;
    const site = moduleInfo.locator.range(identifier);
    const isWrite = reference.isWrite();
    const isRead = reference.isRead();
    if (isWrite) {
      relationships.push(
        rel({
          type: 'writes',
          from,
          to: symbol.symbolId,
          status: 'resolved',
          site,
          ...(isRead ? { extensions: { readWrite: true } } : {}),
        }),
      );
    }
    if (isRead && !isWrite) {
      relationships.push(
        rel({
          type: 'reads',
          from,
          to: symbol.symbolId,
          status: 'resolved',
          site,
        }),
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Property access through `this`. A field or accessor is `inferred`: the
  // declared class shape is evidence, but a subclass, a proxy, or a prototype
  // patch can change what the property means at runtime. Matching by name alone
  // is never enough, so only the receiver's own class chain is consulted.
  // ---------------------------------------------------------------------------

  /** @type {Map<string, import('../../core/csr/entities.js').SymbolRecord[]>} */
  const membersByParent = new Map();
  for (const symbol of symbols) {
    if (!symbol.parentId) {
      continue;
    }
    const bucket = membersByParent.get(symbol.parentId);
    if (bucket) {
      bucket.push(symbol);
    } else {
      membersByParent.set(symbol.parentId, [symbol]);
    }
  }

  /**
   * @param {import('../../core/csr/entities.js').SymbolRecord|null} classSymbol
   * @param {string} name
   * @param {(symbol: import('../../core/csr/entities.js').SymbolRecord) => boolean} predicate
   * @returns {import('../../core/csr/entities.js').SymbolRecord|null}
   */
  function memberOfClassChain(classSymbol, name, predicate) {
    let current = classSymbol;
    const seen = new Set();
    while (current && !seen.has(current.symbolId)) {
      seen.add(current.symbolId);
      const match = (membersByParent.get(current.symbolId) ?? []).find(
        (candidate) => candidate.name === name && predicate(candidate),
      );
      if (match) {
        return match;
      }
      const baseId = current.extensions?.baseClassId;
      current = typeof baseId === 'string' ? (symbolById.get(baseId) ?? null) : null;
    }
    return null;
  }

  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    /**
     * @param {Record<string, any>} node
     * @param {{classSymbol: import('../../core/csr/entities.js').SymbolRecord|null, functionSymbol: import('../../core/csr/entities.js').SymbolRecord|null}} context
     */
    const visit = (node, context) => {
      if (!node) {
        return;
      }
      if (isClassNode(node)) {
        const symbol = symbolByAstNode.get(node) ?? context.classSymbol;
        for (const element of node.body?.body ?? []) {
          visit(element, { ...context, classSymbol: symbol });
        }
        return;
      }
      if (node.type === 'MethodDefinition') {
        visit(node.value?.body, {
          ...context,
          classSymbol: context.classSymbol,
          functionSymbol: symbolByAstNode.get(node.value) ?? context.functionSymbol,
        });
        return;
      }
      if (node.type === 'PropertyDefinition') {
        // A field initializer's `this` is the instance, but it does not belong
        // to any method body.
        visit(node.value, { ...context, functionSymbol: null });
        return;
      }
      if (isFunctionNode(node)) {
        // Arrow functions keep the lexical `this`; ordinary functions do not.
        const arrow = node.type === 'ArrowFunctionExpression';
        visit(node.body, {
          ...context,
          classSymbol: arrow ? context.classSymbol : null,
          functionSymbol: symbolByAstNode.get(node) ?? context.functionSymbol,
        });
        return;
      }
      // The receiver must be `this` and the enclosing class must be known.
      const classSymbol = context.classSymbol;
      if (classSymbol && node.type === 'AssignmentExpression') {
        const target = node.left;
        const name =
          target?.type === 'MemberExpression' && !target.computed
            ? propertyName(target.property)
            : null;
        if (name && target.object?.type === 'ThisExpression') {
          const field = memberOfClassChain(classSymbol, name, (entry) => entry.kind === 'field');
          const setter = memberOfClassChain(
            classSymbol,
            name,
            (entry) => entry.extensions?.setter === true,
          );
          const to = setter ?? field;
          if (to) {
            relationships.push(
              rel({
                type: 'writes',
                from: context.functionSymbol?.symbolId ?? classSymbol.symbolId,
                to: to.symbolId,
                status: 'inferred',
                reasonCode: 'dynamic_dispatch',
                site: moduleInfo.locator.range(target.property),
                extensions: { propertyAccess: true, accessor: setter ? 'setter' : 'field' },
              }),
            );
          }
          // `x += 1` also reads the previous value.
          if (node.operator !== '=') {
            const getter = memberOfClassChain(
              classSymbol,
              name,
              (entry) => entry.extensions?.getter === true,
            );
            const readTarget = getter ?? field;
            if (readTarget) {
              relationships.push(
                rel({
                  type: 'reads',
                  from: context.functionSymbol?.symbolId ?? classSymbol.symbolId,
                  to: readTarget.symbolId,
                  status: 'inferred',
                  reasonCode: 'dynamic_dispatch',
                  site: moduleInfo.locator.range(target.property),
                  extensions: { propertyAccess: true, accessor: getter ? 'getter' : 'field' },
                }),
              );
            }
          }
          visit(node.right, context);
          return;
        }
      }
      if (classSymbol && node.type === 'UpdateExpression') {
        const target = node.argument;
        const name =
          target?.type === 'MemberExpression' && !target.computed
            ? propertyName(target.property)
            : null;
        if (name && target.object?.type === 'ThisExpression') {
          const getter = memberOfClassChain(
            classSymbol,
            name,
            (entry) => entry.extensions?.getter === true,
          );
          const setter = memberOfClassChain(
            classSymbol,
            name,
            (entry) => entry.extensions?.setter === true,
          );
          const field = memberOfClassChain(classSymbol, name, (entry) => entry.kind === 'field');
          const readTarget = getter ?? field;
          const writeTarget = setter ?? field;
          const from = context.functionSymbol?.symbolId ?? classSymbol.symbolId;
          const site = moduleInfo.locator.range(target.property);
          if (readTarget) {
            relationships.push(
              rel({
                type: 'reads',
                from,
                to: readTarget.symbolId,
                status: 'inferred',
                reasonCode: 'dynamic_dispatch',
                site,
                extensions: { propertyAccess: true, accessor: getter ? 'getter' : 'field' },
              }),
            );
          }
          if (writeTarget) {
            relationships.push(
              rel({
                type: 'writes',
                from,
                to: writeTarget.symbolId,
                status: 'inferred',
                reasonCode: 'dynamic_dispatch',
                site,
                extensions: { propertyAccess: true, accessor: setter ? 'setter' : 'field' },
              }),
            );
          }
          return;
        }
      }
      if (classSymbol && node.type === 'MemberExpression') {
        const name = node.computed ? null : propertyName(node.property);
        if (name && node.object?.type === 'ThisExpression') {
          const getter = memberOfClassChain(
            classSymbol,
            name,
            (entry) => entry.extensions?.getter === true,
          );
          const field = memberOfClassChain(classSymbol, name, (entry) => entry.kind === 'field');
          const target = getter ?? field;
          if (target) {
            relationships.push(
              rel({
                type: 'reads',
                from: context.functionSymbol?.symbolId ?? classSymbol.symbolId,
                to: target.symbolId,
                status: 'inferred',
                reasonCode: 'dynamic_dispatch',
                site: moduleInfo.locator.range(node.property),
                extensions: { propertyAccess: true, accessor: getter ? 'getter' : 'field' },
              }),
            );
          }
          return;
        }
      }
      for (const child of childNodes(node)) {
        visit(child, context);
      }
    };
    visit(moduleInfo.ast, { classSymbol: null, functionSymbol: null });
  }

  // Dynamic import/export edges are not CallExpressions in ESTree.
  for (const moduleInfo of orderedModules) {
    if (!moduleInfo.ast) {
      continue;
    }
    const visit = (node, context) => {
      if (!node) {
        return;
      }
      if (node.type === 'ImportExpression') {
        const specifier =
          node.source?.type === 'Literal' && typeof node.source.value === 'string'
            ? node.source.value
            : null;
        if (specifier) {
          const resolution = resolutionFor(moduleInfo.path, specifier);
          const target = targetModule(moduleInfo.path, resolution);
          relationships.push(
            rel({
              type: 'imports',
              from: context.functionSymbol?.symbolId ?? moduleInfo.moduleSymbol.symbolId,
              to: target ? fileSymbolFor(target).symbolId : `external:${specifier}`,
              status: target ? 'possible' : 'unresolved',
              reasonCode: target
                ? 'dynamic_dispatch'
                : (resolution?.reasonCode ?? 'unknown_import_target'),
              site: moduleInfo.locator.range(node.source),
              extensions: { specifier, dynamic: true, moduleSystem: 'esm' },
            }),
          );
        }
      }
      if (node.type === 'AssignmentExpression') {
        const target = node.left;
        if (
          target?.type === 'MemberExpression' &&
          !target.computed &&
          propertyName(target.property) &&
          target.object?.type === 'MemberExpression' &&
          !target.object.computed &&
          propertyName(target.object.property) === 'prototype'
        ) {
          const className =
            target.object.object?.type === 'Identifier' ? target.object.object.name : 'unknown';
          const method = propertyName(target.property);
          relationships.push(
            rel({
              type: 'writes',
              from: context.functionSymbol?.symbolId ?? moduleInfo.moduleSymbol.symbolId,
              to: `external:${className}.prototype.${method}`,
              status: 'possible',
              reasonCode: 'prototype_mutation',
              site: moduleInfo.locator.range(target),
            }),
          );
        }
      }
      const inner = isFunctionNode(node)
        ? {
            ...context,
            functionSymbol: symbolByAstNode.get(node) ?? context.functionSymbol,
            classSymbol: null,
          }
        : context;
      for (const child of childNodes(node)) {
        visit(child, inner);
      }
    };
    visit(moduleInfo.ast, newContext(moduleInfo));
  }

  // ---------------------------------------------------------------------------
  // Completeness and diagnostics.
  // ---------------------------------------------------------------------------

  let unresolvedImports = 0;
  for (const relationship of relationships) {
    if (relationship.type === 'imports' && relationship.status === 'unresolved') {
      unresolvedImports += 1;
    }
  }
  if (unresolvedImports > 0) {
    diagnostics.push(
      createDiagnostic({
        severity: 'info',
        code: 'unknown_import_target',
        message: `${unresolvedImports} module request(s) could not be resolved. Imports outside the analysed workspace are not guessed.`,
        affects: [main.fileSymbol.symbolId],
      }),
    );
  }

  const parseFailed = orderedModules.some((entry) => entry.parseError);
  const mixedModuleSystem = orderedModules.some((entry) => entry.esm && entry.cjs);
  const completeness =
    syntaxOnly || parseFailed || unresolvedImports > 0 || !textSupplied || mixedModuleSystem
      ? 'partial'
      : 'full';

  const run = {
    runId,
    adapterId,
    adapterVersion,
    language: LANGUAGE,
    csrVersion: CSR_VERSION,
    scope: { kind: 'file', path: mainPath },
    completeness,
    files,
    symbols,
    relationships,
    controlConstructs: [],
    dataFacts: [],
    diagnostics,
    extensions: {
      parser: 'acorn',
      scopeAnalysis: 'eslint-scope',
      moduleKind: main.moduleKind,
      analysedModules: orderedModules.map((entry) => entry.path),
      syntaxOnly,
    },
  };
  return /** @type {import('../../core/csr/entities.js').AnalysisRun} */ (run);
}

export { detectModuleKind };
