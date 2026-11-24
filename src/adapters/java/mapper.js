/**
 * Java AST -> Canonical Semantic Representation (CSR) Mapper (Phase 14 §3, P14-03, AC-14.2).
 *
 * Maps Java compilation units into CSR entities: packages, classes, interfaces, records,
 * enums, constructors, methods, fields, overloads, inheritance hierarchies, and calls.
 */

import {
  createAnalysisRun,
  createDiagnostic,
  createRelationship,
  createSymbol,
} from '../../core/csr/entities.js';
import {
  createIdentityAllocator,
  createOverloadDisambiguator,
  createRelationshipAllocator,
} from '../../core/csr/identity.js';
import { createSourceLocator } from './locator.js';
import { extractJavaPackagesAndImports } from './packages.js';
import { extractHierarchyRelationships } from './hierarchy.js';
import { resolveJavaCall } from './dispatch.js';
import { collectJavaMethodConstructs } from './constructs.js';

/**
 * Map Java AST to AnalysisRun.
 *
 * @param {{
 *   runId: string,
 *   path: string,
 *   text?: string,
 *   workspaceRoot?: string,
 *   ast?: Record<string, any> | string | null,
 *   mode?: 'compile-db' | 'heuristic',
 *   warnings?: Array<{ code: string, message: string }>,
 *   adapterId?: string,
 *   adapterVersion?: string,
 * }} options
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function mapJavaAst(options) {
  const {
    runId,
    path: cuPath,
    text = '',
    workspaceRoot,
    ast: rawAst,
    mode = 'compile-db',
    warnings = [],
    adapterId = 'java-ast',
    adapterVersion = '0.1.0',
  } = options;

  let ast = null;
  if (typeof rawAst === 'string' && rawAst.trim().startsWith('{')) {
    try {
      ast = JSON.parse(rawAst);
    } catch {
      ast = null;
    }
  } else if (rawAst && typeof rawAst === 'object') {
    ast = rawAst;
  }

  const locator = createSourceLocator({ workspaceRoot, cuPath, text, language: 'java' });
  const allocator = createIdentityAllocator({ language: 'java' });
  const relationshipAllocator = createRelationshipAllocator();

  /** @type {import('../../core/csr/entities.js').SymbolRecord[]} */
  const symbols = [];
  /** @type {import('../../core/csr/entities.js').Relationship[]} */
  const relationships = [];
  /** @type {import('../../core/csr/entities.js').ControlConstruct[]} */
  const controlConstructs = [];
  /** @type {import('../../core/csr/entities.js').Diagnostic[]} */
  const diagnostics = warnings.map((w) =>
    createDiagnostic({
      severity: 'warning',
      code: w.code,
      message: w.message,
    }),
  );

  const symbolsByName = new Map();
  const classesByName = new Map();
  const methodsByName = new Map();
  const fileSymbols = new Map();

  function fileSymbol(filePath) {
    if (fileSymbols.has(filePath)) {
      return fileSymbols.get(filePath);
    }
    const fileId = locator.ensureFile(filePath, 1);
    const declaration = {
      fileId: fileId ?? `file:${filePath}`,
      startLine: 0,
      startColumn: 0,
      endLine: 0,
      endColumn: 1,
    };
    const identity = allocator.symbol({
      path: filePath,
      kind: 'file',
      qualifiedName: filePath,
    });
    const symbol = createSymbol({
      symbolId: identity.symbolId,
      kind: 'file',
      name: filePath.split('/').pop() || filePath,
      qualifiedName: filePath,
      language: 'java',
      declaration,
      visibility: 'public',
    });
    symbols.push(symbol);
    fileSymbols.set(filePath, symbol);
    return symbol;
  }

  // Ensure file symbol for CU
  fileSymbol(cuPath);

  if (!ast) {
    diagnostics.push(
      createDiagnostic({
        severity: 'warning',
        code: 'missing_ast',
        message: 'No Java AST supplied; heuristic empty run generated.',
      }),
    );
    return createAnalysisRun({
      runId,
      adapterId,
      adapterVersion,
      language: 'java',
      completeness: 'partial',
      files: locator.fileRecords(),
      symbols,
      relationships: [],
      controlConstructs: [],
      dataFacts: [],
      diagnostics,
    });
  }

  // 1. Packages and Imports
  const pkgData = extractJavaPackagesAndImports({
    ast,
    cuPath,
    allocator,
    relationshipAllocator,
    knownSymbolsByFqn: symbolsByName,
  });
  if (pkgData.packageSymbol) {
    symbols.push(pkgData.packageSymbol);
  }
  relationships.push(...pkgData.relationships);

  const packageName = pkgData.packageSymbol?.qualifiedName ?? '';

  // 2. Discover Types (Classes, Interfaces, Enums, Records)
  function visitTypeDecl(node, parentSymbol = null) {
    if (!node || typeof node !== 'object') return;
    const kind = node.kind;

    const isClass = kind === 'ClassDeclaration' || kind === 'class';
    const isInterface = kind === 'InterfaceDeclaration' || kind === 'interface';
    const isEnum = kind === 'EnumDeclaration' || kind === 'enum';
    const isRecord = kind === 'RecordDeclaration' || kind === 'record';

    if (isClass || isInterface || isEnum || isRecord) {
      const typeName = node.name;
      if (!typeName) return;

      const qName = parentSymbol
        ? `${parentSymbol.qualifiedName}.${typeName}`
        : packageName
          ? `${packageName}.${typeName}`
          : typeName;

      const symbolKind = isInterface ? 'interface' : isEnum ? 'enum' : 'class';
      const declRange = locator.rangeFor(node, cuPath);

      const identity = allocator.symbol({
        path: cuPath,
        kind: symbolKind,
        qualifiedName: qName,
      });

      const typeSymbol = createSymbol({
        symbolId: identity.symbolId,
        ...(parentSymbol ? { parentId: parentSymbol.symbolId } : {}),
        name: typeName,
        qualifiedName: qName,
        kind: symbolKind,
        language: 'java',
        declaration: declRange,
        visibility: node.visibility ?? 'public',
        extensions: {
          isInterface,
          isEnum,
          isRecord,
          isAbstract: node.isAbstract === true,
          isStatic: node.isStatic === true,
        },
      });

      symbols.push(typeSymbol);
      symbolsByName.set(typeName, typeSymbol);
      symbolsByName.set(qName, typeSymbol);
      classesByName.set(typeName, typeSymbol);
      classesByName.set(qName, typeSymbol);

      // Hierarchy (extends & implements)
      const hierarchyEdges = extractHierarchyRelationships({
        classSymbol: typeSymbol,
        node,
        symbolsByName,
        allocator: relationshipAllocator,
      });
      relationships.push(...hierarchyEdges);

      // Members
      const members = Array.isArray(node.members)
        ? node.members
        : Array.isArray(node.body)
          ? node.body
          : Array.isArray(node.inner)
            ? node.inner
            : [];

      for (const m of members) {
        if (!m || typeof m !== 'object') continue;

        // Nested types
        const isNestedType =
          m.kind === 'ClassDeclaration' ||
          m.kind === 'InterfaceDeclaration' ||
          m.kind === 'EnumDeclaration' ||
          m.kind === 'RecordDeclaration' ||
          m.kind === 'class' ||
          m.kind === 'interface' ||
          m.kind === 'enum' ||
          m.kind === 'record';

        if (isNestedType) {
          visitTypeDecl(m, typeSymbol);
          continue;
        }

        // Fields
        if (m.kind === 'FieldDeclaration' || m.kind === 'field') {
          const fieldName = m.name;
          if (fieldName) {
            const fieldId = allocator.symbol({
              path: cuPath,
              kind: 'field',
              qualifiedName: `${qName}.${fieldName}`,
            });

            const fieldSym = createSymbol({
              symbolId: fieldId.symbolId,
              parentId: typeSymbol.symbolId,
              name: fieldName,
              qualifiedName: `${qName}.${fieldName}`,
              kind: 'field',
              language: 'java',
              declaration: locator.rangeFor(m, cuPath),
              visibility: m.visibility ?? 'private',
            });
            symbols.push(fieldSym);

            relationships.push(
              createRelationship({
                relationshipId: relationshipAllocator.relationship({
                  type: 'defines',
                  from: typeSymbol.symbolId,
                  to: fieldSym.symbolId,
                }),
                type: 'defines',
                from: typeSymbol.symbolId,
                to: fieldSym.symbolId,
                status: 'resolved',
              }),
            );
          }
          continue;
        }

        // Enum constants
        if (m.kind === 'EnumConstantDeclaration' || m.kind === 'enum_constant') {
          const constName = m.name;
          if (constName) {
            const memId = allocator.symbol({
              path: cuPath,
              kind: 'enum_member',
              qualifiedName: `${qName}.${constName}`,
            });

            const memSym = createSymbol({
              symbolId: memId.symbolId,
              parentId: typeSymbol.symbolId,
              name: constName,
              qualifiedName: `${qName}.${constName}`,
              kind: 'enum_member',
              language: 'java',
              declaration: locator.rangeFor(m, cuPath),
              visibility: 'public',
            });
            symbols.push(memSym);

            relationships.push(
              createRelationship({
                relationshipId: relationshipAllocator.relationship({
                  type: 'defines',
                  from: typeSymbol.symbolId,
                  to: memSym.symbolId,
                }),
                type: 'defines',
                from: typeSymbol.symbolId,
                to: memSym.symbolId,
                status: 'resolved',
              }),
            );
          }
          continue;
        }

        // Methods & Constructors
        const isMethod = m.kind === 'MethodDeclaration' || m.kind === 'method';
        const isCtor = m.kind === 'ConstructorDeclaration' || m.kind === 'constructor';

        if (isMethod || isCtor) {
          const methodName = isCtor ? '<init>' : m.name;
          const params = Array.isArray(m.parameters) ? m.parameters : [];
          const paramTypes = params.map((p) => String(p.type ?? 'Object'));
          const disambiguator = createOverloadDisambiguator(paramTypes);

          const methodId = allocator.symbol({
            path: cuPath,
            kind: isCtor ? 'constructor' : 'method',
            qualifiedName: `${qName}.${methodName}`,
            disambiguator,
          });

          const methodSym = createSymbol({
            symbolId: methodId.symbolId,
            parentId: typeSymbol.symbolId,
            name: isCtor ? typeName : methodName,
            qualifiedName: `${qName}.${methodName}`,
            kind: isCtor ? 'constructor' : 'method',
            language: 'java',
            declaration: locator.rangeFor(m, cuPath),
            visibility: m.visibility ?? 'public',
            signature: `${m.returnType ?? 'void'} (${paramTypes.join(', ')})`,
            disambiguator,
            extensions: {
              isStatic: m.isStatic === true,
              isFinal: m.isFinal === true,
              isAbstract: m.isAbstract === true,
            },
          });

          symbols.push(methodSym);
          if (!methodsByName.has(methodName)) {
            methodsByName.set(methodName, []);
          }
          methodsByName.get(methodName).push(methodSym);

          // Control constructs
          if (m.body) {
            const { constructs } = collectJavaMethodConstructs({
              methodNode: m,
              symbol: methodSym,
              locator,
              file: cuPath,
            });
            controlConstructs.push(...constructs);
          }
        }
      }
    }
  }

  const types = Array.isArray(ast.types)
    ? ast.types
    : Array.isArray(ast.classes)
      ? ast.classes
      : Array.isArray(ast.inner)
        ? ast.inner
        : [ast];

  for (const t of types) {
    visitTypeDecl(t, null);
  }

  // 3. Method Call Resolution
  function visitCalls(node, enclosingMethod) {
    if (!node || typeof node !== 'object') return;

    if (node.kind === 'MethodDeclaration' || node.kind === 'ConstructorDeclaration') {
      const methodName = node.kind === 'ConstructorDeclaration' ? '<init>' : node.name;
      const candidates = methodsByName.get(methodName) ?? [];
      const currentMethod = candidates[0] ?? enclosingMethod;
      if (node.body && typeof node.body === 'object') {
        visitCalls(node.body, currentMethod);
      }
      return;
    }

    if (
      node.kind === 'MethodCallExpr' ||
      node.kind === 'CallExpr' ||
      node.kind === 'NewClassExpr' ||
      node.kind === 'ConstructorCall'
    ) {
      if (enclosingMethod) {
        const callRange = locator.rangeFor(node, cuPath);
        const rel = resolveJavaCall({
          callNode: node,
          callerSymbol: enclosingMethod,
          callRange,
          methodsByName,
          classesByName,
          relationshipAllocator,
        });
        if (rel) {
          relationships.push(rel);
        }
      }
    }

    const children = Array.isArray(node.statements)
      ? node.statements
      : Array.isArray(node.inner)
        ? node.inner
        : Object.values(node).filter((v) => v && typeof v === 'object');

    for (const child of children) {
      visitCalls(child, enclosingMethod);
    }
  }

  for (const t of types) {
    visitCalls(t, null);
  }

  const fileRecords = locator.fileRecords();
  for (const f of fileRecords) {
    fileSymbol(f.path);
  }

  return createAnalysisRun({
    runId,
    adapterId,
    adapterVersion,
    language: 'java',
    completeness: mode === 'heuristic' ? 'partial' : 'full',
    files: fileRecords,
    symbols,
    relationships,
    controlConstructs,
    dataFacts: [],
    diagnostics,
  });
}
