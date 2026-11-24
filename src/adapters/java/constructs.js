/**
 * Java Language Control Construct Collector (Phase 14 §3, P14-08, AC-14.6).
 *
 * Traverses Java method and constructor AST bodies to emit language-neutral
 * ControlConstruct records for if, switch, loops, try-catch-finally, and jumps.
 */

import { createControlConstruct } from '../../core/csr/entities.js';

/**
 * Collect control constructs for a Java method or constructor.
 *
 * @param {{
 *   methodNode: Record<string, any>,
 *   symbol: import('../../core/csr/entities.js').SymbolRecord,
 *   locator: { rangeFor: (node: any, file: string) => any },
 *   file: string,
 * }} input
 * @returns {{
 *   constructs: import('../../core/csr/entities.js').ControlConstruct[],
 *   diagnostics: Array<{ code: string, message: string, range?: any }>,
 * }}
 */
export function collectJavaMethodConstructs({ methodNode, symbol, locator, file }) {
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
    if (node.kind === 'BlockStmt') {
      return make('block', node, { children: statementList(node.statements ?? node.inner) });
    }
    const c = statementConstruct(node);
    return make('block', node, { children: c ? [c] : [] });
  }

  function statementConstruct(node) {
    if (!node || typeof node !== 'object') return null;
    const kind = node.kind;

    if (kind === 'BlockStmt') {
      return make('block', node, { children: statementList(node.statements ?? node.inner) });
    }

    if (kind === 'IfStmt') {
      const condNode = node.condition ?? node.inner?.[0];
      const thenNode = node.thenBranch ?? node.thenStmt ?? node.inner?.[1];
      const elseNode = node.elseBranch ?? node.elseStmt ?? node.inner?.[2];

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
      const condNode = node.condition ?? node.inner?.[0];
      const bodyNode = node.body ?? node.inner?.[1];
      return make('while', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: [bodyBlock(bodyNode)],
        extensions: { loopType: 'while' },
      });
    }

    if (kind === 'DoWhileStmt') {
      const bodyNode = node.body ?? node.inner?.[0];
      const condNode = node.condition ?? node.inner?.[1];
      return make('do_while', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: [bodyBlock(bodyNode)],
        extensions: { loopType: 'do-while' },
      });
    }

    if (kind === 'ForStmt' || kind === 'EnhancedForStmt') {
      const bodyNode = node.body ?? node.inner?.[node.inner?.length - 1];
      return make('for', node, {
        children: [bodyBlock(bodyNode)],
        extensions: {
          loopType: kind === 'EnhancedForStmt' ? 'enhanced_for' : 'for',
        },
      });
    }

    if (kind === 'SwitchStmt' || kind === 'SwitchExpr') {
      const condNode = node.expression ?? node.inner?.[0];
      const entries = Array.isArray(node.entries)
        ? node.entries
        : Array.isArray(node.cases)
          ? node.cases
          : [];

      const caseConstructs = entries.map((entry) => {
        const isDefault = entry.isDefault === true || entry.kind === 'DefaultEntry';
        const stmts = entry.statements ?? entry.inner ?? [];
        return make('case', entry, {
          children: statementList(stmts),
          extensions: { test: isDefault ? 'default' : (entry.label ?? 'case') },
        });
      });

      return make('switch', node, {
        condition: rangeOf(condNode) ?? rangeOf(node) ?? symbol.declaration,
        children: caseConstructs,
        extensions: { branchType: 'switch' },
      });
    }

    if (kind === 'TryStmt') {
      const tryBlock = bodyBlock(node.tryBlock ?? node.body);
      const catches = Array.isArray(node.catchClauses) ? node.catchClauses : [];
      const catchConstructs = catches.map((c) => {
        const catchBody = bodyBlock(c.body ?? c.block);
        return make('catch', c, {
          children: [catchBody],
          extensions: { exceptionType: c.param?.type ?? 'Throwable' },
        });
      });

      const children = [tryBlock, ...catchConstructs];
      if (node.finallyBlock) {
        children.push(
          make('finally', node.finallyBlock, {
            children: [bodyBlock(node.finallyBlock)],
          }),
        );
      }

      return make('try', node, { children });
    }

    if (kind === 'ThrowStmt') {
      return make('throw', node);
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

    if (kind === 'MethodCallExpr' || kind === 'CallExpr') {
      return make('call', node);
    }

    return make('statement', node);
  }

  const body = methodNode.body ?? methodNode.block;
  if (body) {
    statementConstruct(body);
  }

  return { constructs, diagnostics };
}
