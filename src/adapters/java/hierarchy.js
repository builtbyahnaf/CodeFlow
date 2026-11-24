/**
 * Java Type Hierarchy & Inheritance (Phase 14 §3, P14-04, AC-14.3).
 *
 * Maps Java class inheritance ('inherits') and interface implementation ('implements')
 * relationships, honoring single class inheritance and multiple interface inheritance.
 */

import { createRelationship } from '../../core/csr/entities.js';

/**
 * Map class inheritance and interface implementation relationships.
 *
 * @param {{
 *   classSymbol: import('../../core/csr/entities.js').SymbolRecord,
 *   node: Record<string, any>,
 *   symbolsByName: Map<string, import('../../core/csr/entities.js').SymbolRecord>,
 *   allocator: { relationship: (input: { type: string, from: string, to: string }) => string },
 * }} options
 * @returns {Array<import('../../core/csr/entities.js').Relationship>}
 */
export function extractHierarchyRelationships({
  classSymbol,
  node,
  symbolsByName,
  allocator,
}) {
  const relationships = [];

  // Superclass (extends)
  const superName = node.extends ?? node.superClass?.name ?? '';
  if (superName && superName !== 'Object' && superName !== 'java.lang.Object') {
    const superSym = symbolsByName.get(superName);
    const toId = superSym ? superSym.symbolId : `external:${superName}`;
    const status = superSym ? 'resolved' : 'unresolved';

    relationships.push(
      createRelationship({
        relationshipId: allocator.relationship({
          type: 'inherits',
          from: classSymbol.symbolId,
          to: toId,
        }),
        type: 'inherits',
        from: classSymbol.symbolId,
        to: toId,
        status,
        ...(status === 'unresolved' ? { reasonCode: 'out_of_scope' } : {}),
      }),
    );
  }

  // Interfaces (implements)
  const interfaces = Array.isArray(node.implements)
    ? node.implements
    : Array.isArray(node.interfaces)
      ? node.interfaces
      : [];

  for (const iface of interfaces) {
    const ifaceName = typeof iface === 'string' ? iface : iface.name ?? '';
    if (ifaceName) {
      const ifaceSym = symbolsByName.get(ifaceName);
      const toId = ifaceSym ? ifaceSym.symbolId : `external:${ifaceName}`;
      const status = ifaceSym ? 'resolved' : 'unresolved';

      relationships.push(
        createRelationship({
          relationshipId: allocator.relationship({
            type: 'implements',
            from: classSymbol.symbolId,
            to: toId,
          }),
          type: 'implements',
          from: classSymbol.symbolId,
          to: toId,
          status,
          ...(status === 'unresolved' ? { reasonCode: 'out_of_scope' } : {}),
        }),
      );
    }
  }

  return relationships;
}
