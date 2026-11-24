/**
 * C Function Pointer Tracking & Candidate Resolution (Phase 13 §3, P13-06, AC-13.3).
 *
 * In C, indirect function calls through function pointers are first-class constructs.
 * This module tracks function address bindings and evaluates indirect call sites,
 * returning honest candidate sets ('possible') or reason-coded unmapped calls ('unresolved').
 */

/**
 * Check if a Clang type string represents a function pointer.
 *
 * @param {string} typeStr
 * @returns {boolean}
 */
export function isFunctionPointerType(typeStr) {
  if (typeof typeStr !== 'string') return false;
  // Patterns like 'int (*)(int, int)', 'void (*)(void)', 'callback_t', '(*)'
  return (
    /\(\s*\*\s*\)/.test(typeStr) ||
    /\(\s*\*[a-zA-Z0-9_]*\s*\)\s*\(/.test(typeStr) ||
    /function\s+pointer/i.test(typeStr)
  );
}

/**
 * Extract function pointer assignment bindings across a C AST.
 *
 * @param {Record<string, any>} ast Clang AST JSON
 * @returns {Map<string, Set<string>>} Map of variable name -> Set of assigned function symbol names
 */
export function extractFunctionPointerAssignments(ast) {
  /** @type {Map<string, Set<string>>} */
  const bindings = new Map();

  function walk(node) {
    if (!node || typeof node !== 'object') return;

    // Check for BinaryOperator assignment (=)
    if (node.kind === 'BinaryOperator' && node.opcode === '=') {
      const lhs = node.inner?.[0];
      const rhs = node.inner?.[1];
      if (lhs && rhs) {
        const varName = extractDeclRefName(lhs);
        const fnTarget = extractFunctionRefName(rhs);
        if (varName && fnTarget) {
          if (!bindings.has(varName)) {
            bindings.set(varName, new Set());
          }
          bindings.get(varName).add(fnTarget);
        }
      }
    }

    // Check for VarDecl with initial value
    if (node.kind === 'VarDecl' && node.inner && node.inner.length > 0) {
      const varName = node.name;
      const initExpr = node.inner[0];
      const fnTarget = extractFunctionRefName(initExpr);
      if (varName && fnTarget) {
        if (!bindings.has(varName)) {
          bindings.set(varName, new Set());
        }
        bindings.get(varName).add(fnTarget);
      }
    }

    if (Array.isArray(node.inner)) {
      for (const child of node.inner) {
        walk(child);
      }
    }
  }

  walk(ast);
  return bindings;
}

/**
 * Resolve candidates for an indirect call site in C.
 *
 * @param {Record<string, any>} callNode Clang CallExpr node
 * @param {Map<string, Set<string>>} bindings Assignment map
 * @param {Map<string, any>} functionsByName Known function symbols map
 * @returns {{
 *   isIndirect: boolean,
 *   candidates: string[],
 *   status: 'resolved' | 'possible' | 'unresolved',
 *   reasonCode?: string
 * }}
 */
export function resolveIndirectCall(callNode, bindings, functionsByName) {
  if (!callNode || callNode.kind !== 'CallExpr') {
    return { isIndirect: false, candidates: [], status: 'unresolved' };
  }

  const callee = callNode.inner?.[0];
  if (!callee) {
    return { isIndirect: true, candidates: [], status: 'unresolved', reasonCode: 'function_pointer' };
  }

  // If callee is direct DeclRefExpr to FunctionDecl, it is a direct call
  if (callee.kind === 'ImplicitCastExpr') {
    const sub = callee.inner?.[0];
    if (sub && sub.kind === 'DeclRefExpr' && sub.referencedDecl?.kind === 'FunctionDecl') {
      return { isIndirect: false, candidates: [sub.referencedDecl.name], status: 'resolved' };
    }
  }

  // Indirect call through function pointer variable or parameter
  const varName = extractDeclRefName(callee);
  if (varName && bindings.has(varName)) {
    const candidateNames = Array.from(bindings.get(varName));
    const targetSymbolIds = [];
    for (const name of candidateNames) {
      const sym = functionsByName.get(name);
      if (sym) {
        targetSymbolIds.push(sym.symbolId);
      }
    }
    if (targetSymbolIds.length > 0) {
      return {
        isIndirect: true,
        candidates: targetSymbolIds,
        status: 'possible',
        reasonCode: 'function_pointer',
      };
    }
  }

  return {
    isIndirect: true,
    candidates: [],
    status: 'unresolved',
    reasonCode: 'function_pointer',
  };
}

function extractDeclRefName(node) {
  if (!node) return null;
  if (node.kind === 'DeclRefExpr') {
    return node.referencedDecl?.name || node.name || null;
  }
  if (node.kind === 'ImplicitCastExpr' && node.inner?.[0]) {
    return extractDeclRefName(node.inner[0]);
  }
  return null;
}

function extractFunctionRefName(node) {
  if (!node) return null;
  if (node.kind === 'UnaryOperator' && node.opcode === '&') {
    return extractFunctionRefName(node.inner?.[0]);
  }
  if (node.kind === 'ImplicitCastExpr' && node.inner?.[0]) {
    return extractFunctionRefName(node.inner[0]);
  }
  if (node.kind === 'DeclRefExpr') {
    const decl = node.referencedDecl;
    if (decl && (decl.kind === 'FunctionDecl' || !decl.kind)) {
      return decl.name || node.name || null;
    }
  }
  return null;
}
