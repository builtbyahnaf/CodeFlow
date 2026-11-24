/**
 * Clang C AST JSON -> Canonical Semantic Representation (CSR).
 *
 * Maps C translation units into CSR entities: functions, structs, unions, enums,
 * typedefs, global variables, direct calls, indirect calls through function pointers,
 * and header inclusions.
 */

import {
  createAnalysisRun,
  createDiagnostic,
  createEvidence,
  createRelationship,
  createSymbol,
} from '../../core/csr/entities.js';
import {
  createIdentityAllocator,
  createRelationshipAllocator,
} from '../../core/csr/identity.js';
import { createSourceLocator } from './locator.js';
import { collectCFunctionConstructs } from './constructs.js';
import {
  extractFunctionPointerAssignments,
  resolveIndirectCall,
} from './functionPointers.js';
import { extractHeaderRelationships } from './headers.js';

/**
 * Map Clang C AST to AnalysisRun.
 *
 * @param {{
 *   runId: string,
 *   path: string,
 *   text?: string,
 *   workspaceRoot?: string,
 *   ast?: Record<string, any> | string | null,
 *   mode?: 'compile-db' | 'heuristic',
 *   warnings?: Array<{ code: string, message: string }>,
 *   headerMap?: Record<string, unknown>,
 *   toolchain?: string,
 *   adapterId?: string,
 *   adapterVersion?: string,
 * }} options
 * @returns {import('../../core/csr/entities.js').AnalysisRun}
 */
export function mapClangCAst(options) {
  const {
    runId,
    path: tuPath,
    text = '',
    workspaceRoot,
    ast: rawAst,
    mode = 'compile-db',
    warnings = [],
    headerMap = {},
    adapterId = 'c-clang',
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

  const locator = createSourceLocator({ workspaceRoot, tuPath, text, language: 'c' });
  const allocator = createIdentityAllocator({ language: 'c' });
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

  const byAstId = new Map();
  const byName = new Map();
  const fileSymbols = new Map();

  function fileSymbol(filePath) {
    if (fileSymbols.has(filePath)) {
      return fileSymbols.get(filePath);
    }
    locator.ensureFile(filePath, 1);
    const fileId = locator.ensureFile(filePath, 1);
    const declaration = {
      fileId,
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
      language: 'c',
      declaration,
      visibility: 'public',
    });
    symbols.push(symbol);
    fileSymbols.set(filePath, symbol);
    return symbol;
  }

  // Ensure file symbol for TU
  fileSymbol(tuPath);

  if (!ast) {
    diagnostics.push(
      createDiagnostic({
        severity: 'warning',
        code: 'missing_ast',
        message: 'No Clang AST supplied; heuristic empty run generated.',
      }),
    );
    return createAnalysisRun({
      runId,
      adapterId,
      adapterVersion,
      language: 'c',
      completeness: 'partial',
      files: locator.fileRecords(),
      symbols,
      relationships: [],
      controlConstructs: [],
      dataFacts: [],
      diagnostics,
    });
  }

  // 1. First pass: extract function pointer assignments
  const fpAssignments = extractFunctionPointerAssignments(ast);

  // 2. Discover top-level and record declarations
  function visitDecl(node) {
    if (!node || typeof node !== 'object') return;
    const kind = node.kind;

    if (kind === 'FunctionDecl' && node.name) {
      const declRange = locator.rangeFor(node, tuPath);
      const isStatic = node.storageClass === 'static';
      const hasDefinition = Boolean(node.inner?.some((c) => c && c.kind === 'CompoundStmt'));

      const identity = allocator.symbol({
        path: tuPath,
        kind: 'function',
        qualifiedName: node.name,
      });

      const symbol = createSymbol({
        symbolId: identity.symbolId,
        name: node.name,
        qualifiedName: node.name,
        kind: 'function',
        language: 'c',
        declaration: declRange,
        definition: hasDefinition ? declRange : null,
        visibility: isStatic ? 'private' : 'public',
        extensions: {
          storageClass: node.storageClass || 'extern',
          isStatic,
          hasDefinition,
          returnType: node.type?.qualType || '',
        },
      });

      symbols.push(symbol);
      byName.set(node.name, symbol);
      if (node.id) byAstId.set(node.id, symbol);

      // Collect control constructs if definition is present
      if (hasDefinition) {
        const { constructs } = collectCFunctionConstructs({
          functionNode: node,
          symbol,
          locator,
          file: tuPath,
        });
        controlConstructs.push(...constructs);
      }
      return;
    }

    if (kind === 'RecordDecl') {
      const isUnion = node.tagUsed === 'union';
      const structName = node.name || `anonymous_${symbols.length}`;
      const declRange = locator.rangeFor(node, tuPath);

      const identity = allocator.symbol({
        path: tuPath,
        kind: 'struct',
        qualifiedName: structName,
      });

      const symbol = createSymbol({
        symbolId: identity.symbolId,
        name: structName,
        qualifiedName: (isUnion ? 'union ' : 'struct ') + structName,
        kind: 'struct',
        language: 'c',
        declaration: declRange,
        definition: node.isCompleteDefinition ? declRange : null,
        extensions: {
          isUnion,
          tag: isUnion ? 'union' : 'struct',
        },
      });

      symbols.push(symbol);
      if (node.id) byAstId.set(node.id, symbol);
      if (node.name) byName.set(node.name, symbol);

      // Map struct/union fields
      if (Array.isArray(node.inner)) {
        for (const field of node.inner) {
          if (field && field.kind === 'FieldDecl' && field.name) {
            const fieldId = allocator.symbol({
              path: tuPath,
              kind: 'field',
              qualifiedName: `${structName}.${field.name}`,
            });

            const fieldSym = createSymbol({
              symbolId: fieldId.symbolId,
              parentId: symbol.symbolId,
              name: field.name,
              qualifiedName: `${structName}.${field.name}`,
              kind: 'field',
              language: 'c',
              declaration: locator.rangeFor(field, tuPath),
            });
            symbols.push(fieldSym);

            relationships.push(
              createRelationship({
                relationshipId: relationshipAllocator.relationship({
                  type: 'defines',
                  from: symbol.symbolId,
                  to: fieldSym.symbolId,
                }),
                type: 'defines',
                from: symbol.symbolId,
                to: fieldSym.symbolId,
                status: 'resolved',
              }),
            );
          }
        }
      }
      return;
    }

    if (kind === 'EnumDecl') {
      const enumName = node.name || `anonymous_enum_${symbols.length}`;
      const declRange = locator.rangeFor(node, tuPath);

      const identity = allocator.symbol({
        path: tuPath,
        kind: 'enum',
        qualifiedName: enumName,
      });

      const symbol = createSymbol({
        symbolId: identity.symbolId,
        name: enumName,
        qualifiedName: `enum ${enumName}`,
        kind: 'enum',
        language: 'c',
        declaration: declRange,
      });

      symbols.push(symbol);
      if (node.id) byAstId.set(node.id, symbol);

      // Enum members
      if (Array.isArray(node.inner)) {
        for (const item of node.inner) {
          if (item && item.kind === 'EnumConstantDecl' && item.name) {
            const memId = allocator.symbol({
              path: tuPath,
              kind: 'enum_member',
              qualifiedName: `${enumName}.${item.name}`,
            });

            const memSym = createSymbol({
              symbolId: memId.symbolId,
              parentId: symbol.symbolId,
              name: item.name,
              qualifiedName: `${enumName}.${item.name}`,
              kind: 'enum_member',
              language: 'c',
              declaration: locator.rangeFor(item, tuPath),
            });
            symbols.push(memSym);

            relationships.push(
              createRelationship({
                relationshipId: relationshipAllocator.relationship({
                  type: 'defines',
                  from: symbol.symbolId,
                  to: memSym.symbolId,
                }),
                type: 'defines',
                from: symbol.symbolId,
                to: memSym.symbolId,
                status: 'resolved',
              }),
            );
          }
        }
      }
      return;
    }

    if (kind === 'TypedefDecl' && node.name) {
      const declRange = locator.rangeFor(node, tuPath);
      const identity = allocator.symbol({
        path: tuPath,
        kind: 'type_alias',
        qualifiedName: node.name,
      });

      const symbol = createSymbol({
        symbolId: identity.symbolId,
        name: node.name,
        qualifiedName: node.name,
        kind: 'type_alias',
        language: 'c',
        declaration: declRange,
        extensions: {
          underlyingType: node.type?.qualType || '',
        },
      });
      symbols.push(symbol);
      if (node.id) byAstId.set(node.id, symbol);
      return;
    }

    if (kind === 'VarDecl' && node.name) {
      const declRange = locator.rangeFor(node, tuPath);
      const isStatic = node.storageClass === 'static';
      const identity = allocator.symbol({
        path: tuPath,
        kind: 'variable',
        qualifiedName: node.name,
      });

      const symbol = createSymbol({
        symbolId: identity.symbolId,
        name: node.name,
        qualifiedName: node.name,
        kind: 'variable',
        language: 'c',
        declaration: declRange,
        visibility: isStatic ? 'private' : 'public',
        extensions: {
          storageClass: node.storageClass || 'extern',
          isStatic,
        },
      });
      symbols.push(symbol);
      return;
    }

    // Traverse children
    if (Array.isArray(node.inner)) {
      for (const child of node.inner) {
        visitDecl(child);
      }
    }
  }

  visitDecl(ast);

  // 3. Discover Call Relationships
  function visitCalls(node, enclosingFn) {
    if (!node || typeof node !== 'object') return;

    if (node.kind === 'FunctionDecl' && node.name) {
      const fnSym = byName.get(node.name);
      if (Array.isArray(node.inner)) {
        for (const child of node.inner) {
          visitCalls(child, fnSym);
        }
      }
      return;
    }

    if (node.kind === 'CallExpr' && enclosingFn) {
      const indirect = resolveIndirectCall(node, fpAssignments, byName);
      const callRange = locator.rangeFor(node, tuPath);

      if (!indirect.isIndirect) {
        // Direct call
        const targetName = indirect.candidates[0];
        const targetSym = byName.get(targetName);
        if (targetSym) {
          relationships.push(
            createRelationship({
              relationshipId: relationshipAllocator.relationship({
                type: 'calls',
                from: enclosingFn.symbolId,
                to: targetSym.symbolId,
              }),
              type: 'calls',
              from: enclosingFn.symbolId,
              to: targetSym.symbolId,
              status: 'resolved',
              evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
              ...(callRange ? { site: callRange } : {}),
            }),
          );
        } else if (targetName) {
          // Unresolved external call (e.g. library function)
          relationships.push(
            createRelationship({
              relationshipId: relationshipAllocator.relationship({
                type: 'calls',
                from: enclosingFn.symbolId,
                to: `external:${targetName}`,
              }),
              type: 'calls',
              from: enclosingFn.symbolId,
              to: `external:${targetName}`,
              status: 'unresolved',
              reasonCode: 'out_of_scope',
              evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
              ...(callRange ? { site: callRange } : {}),
            }),
          );
        }
      } else {
        // Indirect call via function pointer
        if (indirect.candidates.length > 0) {
          for (const candId of indirect.candidates) {
            relationships.push(
              createRelationship({
                relationshipId: relationshipAllocator.relationship({
                  type: 'calls',
                  from: enclosingFn.symbolId,
                  to: candId,
                }),
                type: 'calls',
                from: enclosingFn.symbolId,
                to: candId,
                status: 'possible',
                reasonCode: 'function_pointer',
                evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
                ...(callRange ? { site: callRange } : {}),
                extensions: { candidates: indirect.candidates },
              }),
            );
          }
        } else {
          relationships.push(
            createRelationship({
              relationshipId: relationshipAllocator.relationship({
                type: 'calls',
                from: enclosingFn.symbolId,
                to: 'external:function_pointer',
              }),
              type: 'calls',
              from: enclosingFn.symbolId,
              to: 'external:function_pointer',
              status: 'unresolved',
              reasonCode: 'function_pointer',
              evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
              ...(callRange ? { site: callRange } : {}),
            }),
          );
        }
      }
    }

    if (Array.isArray(node.inner)) {
      for (const child of node.inner) {
        visitCalls(child, enclosingFn);
      }
    }
  }

  visitCalls(ast, null);

  // 4. Header Inclusion relationships
  const fileRecords = locator.fileRecords();
  for (const f of fileRecords) {
    fileSymbol(f.path);
  }

  const headerData = extractHeaderRelationships({
    tuPath,
    headerMap,
    allFiles: fileRecords,
    fileSymbolsByPath: fileSymbols,
    allocator: relationshipAllocator,
  });
  relationships.push(...headerData.relationships);

  return createAnalysisRun({
    runId,
    adapterId,
    adapterVersion,
    language: 'c',
    completeness: mode === 'heuristic' ? 'partial' : 'full',
    files: fileRecords,
    symbols,
    relationships,
    controlConstructs,
    dataFacts: [],
    diagnostics,
  });
}
