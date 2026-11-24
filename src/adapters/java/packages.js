/**
 * Java Packages & Imports Analyzer (Phase 14 §3, P14-07, AC-14.5).
 *
 * Extracts package declaration namespace and import dependencies, distinguishing
 * workspace symbol targets from standard Java SDK libraries (java.lang, java.util).
 */

import { createRelationship, createSymbol } from '../../core/csr/entities.js';

export const JAVA_JDK_PACKAGES = Object.freeze(
  new Set([
    'java.lang',
    'java.util',
    'java.io',
    'java.nio',
    'java.net',
    'java.math',
    'java.time',
    'java.sql',
    'java.text',
    'java.util.concurrent',
    'java.util.stream',
    'java.util.function',
    'javax.net',
    'javax.crypto',
  ]),
);

/**
 * Extract package declaration symbol and import relationships.
 *
 * @param {{
 *   ast: Record<string, any>,
 *   cuPath: string,
 *   allocator: { symbol: Function },
 *   relationshipAllocator: { relationship: Function },
 *   knownSymbolsByFqn: Map<string, import('../../core/csr/entities.js').SymbolRecord>,
 * }} options
 * @returns {{
 *   packageSymbol: import('../../core/csr/entities.js').SymbolRecord | null,
 *   relationships: Array<import('../../core/csr/entities.js').Relationship>,
 *   imports: Array<{ name: string, isStatic: boolean, isWildcard: boolean }>,
 * }}
 */
export function extractJavaPackagesAndImports({
  ast,
  cuPath,
  allocator,
  relationshipAllocator,
  knownSymbolsByFqn,
}) {
  let packageSymbol = null;
  const relationships = [];
  const imports = [];

  const pkgName = ast.package ?? ast.packageDeclaration?.name ?? '';
  if (pkgName) {
    const pkgId = allocator.symbol({
      path: cuPath,
      kind: 'namespace',
      qualifiedName: pkgName,
    });

    packageSymbol = createSymbol({
      symbolId: pkgId.symbolId,
      name: pkgName.split('.').pop() || pkgName,
      qualifiedName: pkgName,
      kind: 'namespace',
      language: 'java',
      declaration: {
        fileId: `file:${cuPath}`,
        startLine: 0,
        startColumn: 0,
        endLine: 0,
        endColumn: 1,
      },
      visibility: 'public',
    });
  }

  // Process imports
  const rawImports = Array.isArray(ast.imports) ? ast.imports : [];
  for (const imp of rawImports) {
    const importName = typeof imp === 'string' ? imp : imp.name ?? '';
    const isStatic = imp.isStatic === true;
    const isWildcard = imp.isWildcard === true || importName.endsWith('.*');
    const cleanName = importName.replace(/\.\*$/, '');

    imports.push({ name: cleanName, isStatic, isWildcard });

    const targetSym = knownSymbolsByFqn.get(cleanName);
    const toId = targetSym ? targetSym.symbolId : `external:${cleanName}`;
    const status = targetSym ? 'resolved' : 'unresolved';

    relationships.push(
      createRelationship({
        relationshipId: relationshipAllocator.relationship({
          type: 'imports',
          from: `file:${cuPath}`,
          to: toId,
        }),
        type: 'imports',
        from: `file:${cuPath}`,
        to: toId,
        status,
        ...(status === 'unresolved' ? { reasonCode: 'external_package' } : {}),
      }),
    );
  }

  return { packageSymbol, relationships, imports };
}
