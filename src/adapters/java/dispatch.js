/**
 * Java Call Resolution & Polymorphic Virtual Dispatch (Phase 14 §3, P14-06, AC-14.4).
 *
 * In Java, all non-static, non-final, non-private methods are virtual by default.
 * Static method calls and constructor invocations resolve deterministically.
 * Virtual method invocations produce honest 'possible' status with 'dynamic_dispatch' reason code.
 */

import { createEvidence, createRelationship } from '../../core/csr/entities.js';

/**
 * Resolve method call or constructor instantiation.
 *
 * @param {{
 *   callNode: Record<string, any>,
 *   callerSymbol: import('../../core/csr/entities.js').SymbolRecord,
 *   callRange: import('../../core/csr/entities.js').SourceRange | null,
 *   methodsByName: Map<string, Array<import('../../core/csr/entities.js').SymbolRecord>>,
 *   classesByName: Map<string, import('../../core/csr/entities.js').SymbolRecord>,
 *   relationshipAllocator: { relationship: Function },
 * }} options
 * @returns {import('../../core/csr/entities.js').Relationship | null}
 */
export function resolveJavaCall({
  callNode,
  callerSymbol,
  callRange,
  methodsByName,
  classesByName,
  relationshipAllocator,
}) {
  const isConstructor = callNode.kind === 'NewClassExpr' || callNode.kind === 'ConstructorCall';
  const methodName = callNode.name ?? callNode.methodName ?? '';
  const receiverType = callNode.receiverType ?? callNode.targetClass ?? '';
  const isStatic = callNode.isStatic === true;

  // 1. Constructor instantiation (new MyClass())
  if (isConstructor) {
    const className = callNode.className ?? callNode.type ?? methodName;
    const targetClass = classesByName.get(className);
    const toId = targetClass ? targetClass.symbolId : `external:${className}`;

    return createRelationship({
      relationshipId: relationshipAllocator.relationship({
        type: 'instantiates',
        from: callerSymbol.symbolId,
        to: toId,
      }),
      type: 'instantiates',
      from: callerSymbol.symbolId,
      to: toId,
      status: targetClass ? 'resolved' : 'unresolved',
      ...(targetClass ? {} : { reasonCode: 'out_of_scope' }),
      evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
      ...(callRange ? { site: callRange } : {}),
    });
  }

  // 2. Direct Static Method Call
  if (isStatic && methodName) {
    const candidates = methodsByName.get(methodName) ?? [];
    const directMatch = candidates.find((m) => m.extensions?.isStatic);
    if (directMatch) {
      return createRelationship({
        relationshipId: relationshipAllocator.relationship({
          type: 'calls',
          from: callerSymbol.symbolId,
          to: directMatch.symbolId,
        }),
        type: 'calls',
        from: callerSymbol.symbolId,
        to: directMatch.symbolId,
        status: 'resolved',
        evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
        ...(callRange ? { site: callRange } : {}),
      });
    }
  }

  // 3. Virtual Method Invocation (Polymorphic Dispatch)
  if (methodName) {
    const candidates = methodsByName.get(methodName) ?? [];

    if (candidates.length === 1 && (candidates[0].visibility === 'private' || candidates[0].extensions?.isFinal)) {
      // Private or final methods cannot be overridden; monomorphic dispatch
      return createRelationship({
        relationshipId: relationshipAllocator.relationship({
          type: 'calls',
          from: callerSymbol.symbolId,
          to: candidates[0].symbolId,
        }),
        type: 'calls',
        from: callerSymbol.symbolId,
        to: candidates[0].symbolId,
        status: 'resolved',
        evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
        ...(callRange ? { site: callRange } : {}),
      });
    }

    if (candidates.length > 0) {
      // Polymorphic virtual dispatch
      const candIds = candidates.map((c) => c.symbolId);
      const primaryTarget = candidates[0].symbolId;

      return createRelationship({
        relationshipId: relationshipAllocator.relationship({
          type: 'calls',
          from: callerSymbol.symbolId,
          to: primaryTarget,
        }),
        type: 'calls',
        from: callerSymbol.symbolId,
        to: primaryTarget,
        status: 'possible',
        reasonCode: 'dynamic_dispatch',
        evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
        ...(callRange ? { site: callRange } : {}),
        extensions: {
          candidates: candIds,
          receiverType: receiverType || 'unknown',
        },
      });
    }

    // Unresolved external call (e.g., standard JDK method System.out.println)
    return createRelationship({
      relationshipId: relationshipAllocator.relationship({
        type: 'calls',
        from: callerSymbol.symbolId,
        to: `external:${receiverType ? `${receiverType}.${methodName}` : methodName}`,
      }),
      type: 'calls',
      from: callerSymbol.symbolId,
      to: `external:${receiverType ? `${receiverType}.${methodName}` : methodName}`,
      status: 'unresolved',
      reasonCode: 'out_of_scope',
      evidence: callRange ? [createEvidence({ kind: 'source_range', range: callRange })] : [],
      ...(callRange ? { site: callRange } : {}),
    });
  }

  return null;
}
