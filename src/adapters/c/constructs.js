/**
 * C Language Control Construct Collector (Phase 13 §3, P13-07, AC-13.5).
 *
 * Traverses C function AST bodies and constructs language-neutral ControlConstruct records
 * representing conditional branches, loops, switches, labels, and jumps.
 */

import { createControlConstruct } from '../../core/csr/entities.js';

const C_ABNORMAL_EXIT_FUNCTIONS = new Set(['abort', 'exit', 'quick_exit', '_Exit', 'longjmp']);

/**
 * Collect control-flow constructs for a C function.
 *
 * @param {{
 *   functionNode: Record<string, any>,
 *   symbol: import('../../core/csr/entities.js').SymbolRecord,
 *   locator: { rangeFor: (node: any, file: string) => any },
 *   file: string,
 * }} input
 * @returns {{
 *   constructs: import('../../core/csr/entities.js').ControlConstruct[],
 *   diagnostics: Array<{ code: string, message: string, range?: any }>,
 * }}
 */
export function collectCFunctionConstructs({ functionNode, symbol, locator, file }) {
  const constructs = [];
  const diagnostics = [];
  let counter = 0;

  function rangeOf(node) {
    if (!node || typeof node !== 'object') return null;
    return locator.rangeFor(node, file) ?? null;
  }

  function make(kind, node, options = {}) {
    counter += 1;
    const children = Array.isArray(options.children) ? options.children : [];
    const construct = createControlConstruct({
      constructId: `construct:${symbol.symbolId}:c${counter}`,
      symbolId: symbol.symbolId,
      kind,
      sourceRange: options.range ?? rangeOf(node) ?? symbol.declaration,
      ...(options.condition ? { condition: options.condition } : {}),
      children: children.map((c) => c.constructId),
      extensions: options.extensions ?? {},
    });

    for (const child of children) {
      child.parentId = construct.constructId;
    }

    constructs.push(construct);
    return construct;
  }

  function statementList(nodes) {
    const res = [];
    if (!Array.isArray(nodes)) return res;
    for (const n of nodes) {
      const c = statementConstruct(n);
      if (c) res.push(c);
    }
    return res;
  }

  function bodyBlock(node) {
    if (!node) return make('block', null);
    if (node.kind === 'CompoundStmt') {
      return make('block', node, { children: statementList(node.inner) });
    }
    const c = statementConstruct(node);
    return make('block', node, { children: c ? [c] : [] });
  }

  function statementConstruct(node) {
    if (!node || typeof node !== 'object') return null;
    const kind = node.kind;

    if (kind === 'CompoundStmt') {
      return make('block', node, { children: statementList(node.inner) });
    }

    if (kind === 'IfStmt') {
      const condNode = node.inner?.[0];
      const thenNode = node.inner?.[1];
      const elseNode = node.inner?.[2];

      const thenConstruct = thenNode ? bodyBlock(thenNode) : make('block', node);
      const children = [thenConstruct];
      if (elseNode) {
        children.push(
          make('else', elseNode, {
            children: [bodyBlock(elseNode)],
          }),
        );
      }

      return make('if', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children,
        extensions: { branchType: 'if' },
      });
    }

    if (kind === 'WhileStmt') {
      const condNode = node.inner?.[0];
      const bodyNode = node.inner?.[1];
      return make('while', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: [bodyBlock(bodyNode)],
        extensions: { loopType: 'while' },
      });
    }

    if (kind === 'DoStmt') {
      const bodyNode = node.inner?.[0];
      const condNode = node.inner?.[1];
      return make('do_while', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: [bodyBlock(bodyNode)],
        extensions: { loopType: 'do-while' },
      });
    }

    if (kind === 'ForStmt') {
      const bodyNode = node.inner?.[node.inner.length - 1];
      return make('for', node, {
        children: [bodyBlock(bodyNode)],
        extensions: { loopType: 'for' },
      });
    }

    if (kind === 'SwitchStmt') {
      const condNode = node.inner?.[0];
      const bodyNode = node.inner?.[1];
      return make('switch', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: [bodyBlock(bodyNode)],
        extensions: { branchType: 'switch' },
      });
    }

    if (kind === 'CaseStmt' || kind === 'DefaultStmt') {
      const isDefault = kind === 'DefaultStmt';
      const body = node.inner?.length > 1 ? node.inner[node.inner.length - 1] : node.inner?.[0];
      const child = body ? statementConstruct(body) : null;
      return make('case', node, {
        children: child ? [child] : [],
        extensions: { test: isDefault ? 'default' : 'case' },
      });
    }

    if (kind === 'GotoStmt') {
      return make('goto', node, {
        extensions: { label: node.targetLabelDeclId ?? node.name ?? 'unknown' },
      });
    }

    if (kind === 'LabelStmt') {
      const child = node.inner?.[0] ? statementConstruct(node.inner[0]) : null;
      return make('label', node, {
        children: child ? [child] : [],
        extensions: { label: node.name ?? 'label' },
      });
    }

    if (kind === 'ReturnStmt') {
      return make('return', node);
    }

    if (kind === 'BreakStmt') {
      return make('break', node);
    }

    if (kind === 'ContinueStmt') {
      return make('continue', node);
    }

    if (kind === 'CallExpr') {
      const callee = node.inner?.[0];
      const calleeName =
        callee?.referencedDecl?.name ||
        callee?.inner?.[0]?.referencedDecl?.name ||
        callee?.name;

      if (calleeName && C_ABNORMAL_EXIT_FUNCTIONS.has(calleeName)) {
        return make('statement', node, {
          extensions: { exitFunction: calleeName, isAbnormalExit: true },
        });
      }
      return make('call', node);
    }

    // Default statement
    return make('statement', node);
  }

  // Find the function body (typically a CompoundStmt in functionNode.inner)
  if (Array.isArray(functionNode.inner)) {
    const body = functionNode.inner.find((child) => child && child.kind === 'CompoundStmt');
    if (body) {
      statementConstruct(body);
    }
  }

  return { constructs, diagnostics };
}
