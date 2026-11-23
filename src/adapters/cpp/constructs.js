/**
 * Clang AST JSON -> language-neutral control constructs.
 *
 * The C++ mapper already owns symbols and call relationships. This module only
 * describes source structure for one function at a time. It is deliberately
 * conservative: Clang's JSON does not label statement children, so the few
 * ambiguous shapes (`ForStmt`, `SwitchStmt`) are reduced to the node shapes
 * that can be identified from `kind` and ordering.
 *
 * Nothing here executes, compiles, or reads files.
 */

import { createControlConstruct } from '../../core/csr/entities.js';

/**
 * @typedef {import('../../core/csr/entities.js').ControlConstruct} ControlConstruct
 * @typedef {import('../../core/csr/entities.js').SourceRange} SourceRange
 * @typedef {import('../../core/csr/entities.js').SymbolRecord} SymbolRecord
 */

/** Statement nodes that open a nested function scope. Their bodies belong to
 * another symbol; including them here would duplicate calls across functions. */
const NESTED_SCOPE_KINDS = new Set([
  'FunctionDecl',
  'CXXMethodDecl',
  'CXXConstructorDecl',
  'CXXDestructorDecl',
  'CXXConversionDecl',
  'LambdaExpr',
  'BlockDecl',
  'ObjCMethodDecl',
]);

/** Nodes that are expressions, not statements. */
const STATEMENT_KINDS = new Set([
  'CompoundStmt',
  'DeclStmt',
  'IfStmt',
  'WhileStmt',
  'DoStmt',
  'ForStmt',
  'CXXForRangeStmt',
  'SwitchStmt',
  'CaseStmt',
  'DefaultStmt',
  'ReturnStmt',
  'CXXThrowExpr',
  'CXXTryStmt',
  'CXXCatchStmt',
  'GotoStmt',
  'IndirectGotoStmt',
  'LabelStmt',
  'BreakStmt',
  'ContinueStmt',
  'NullStmt',
  'AttributedStmt',
  'CompoundAssignOperator',
  'BinaryOperator',
  'UnaryOperator',
  'CallExpr',
  'CXXMemberCallExpr',
  'CXXOperatorCallExpr',
  'CXXConstructExpr',
  'CXXNewExpr',
  'ConditionalOperator',
  'ExprWithCleanups',
  'MaterializeTemporaryExpr',
  'CXXBindTemporaryExpr',
]);

/**
 * @param {{functionNode: Record<string, any>, symbol: SymbolRecord, locator: {rangeFor: Function}, file: string}} input
 * @returns {{constructs: ControlConstruct[], diagnostics: Array<{code: string, message: string, range?: SourceRange}>}}
 */
export function collectFunctionConstructs({ functionNode, symbol, locator, file }) {
  /** @type {ControlConstruct[]} */
  const constructs = [];
  /** @type {Array<{code: string, message: string, range?: SourceRange}>} */
  const diagnostics = [];
  let counter = 0;

  /**
   * @param {unknown} node
   * @returns {SourceRange|null}
   */
  function rangeOf(node) {
    if (!isObject(node)) {
      return null;
    }
    return locator.rangeFor(node, file) ?? null;
  }

  /**
   * @param {string} kind
   * @param {Record<string, any>|null} node
   * @param {{children?: ControlConstruct[], condition?: SourceRange, range?: SourceRange, extensions?: Record<string, unknown>}} [input]
   * @returns {ControlConstruct}
   */
  function make(kind, node, input = {}) {
    counter += 1;
    const children = input.children ?? [];
    const construct = createControlConstruct({
      constructId: `construct:${symbol.symbolId}:c${counter}`,
      kind,
      symbolId: symbol.symbolId,
      sourceRange: input.range ?? rangeOf(node) ?? symbol.declaration,
      ...(input.condition ? { condition: input.condition } : {}),
      children: children.map((child) => child.constructId),
      ...(input.extensions ? { extensions: input.extensions } : {}),
    });
    for (const child of children) {
      child.parentId = construct.constructId;
    }
    constructs.push(construct);
    return construct;
  }

  /**
   * @param {Record<string, any>[]} nodes
   * @returns {ControlConstruct[]}
   */
  function statementList(nodes) {
    /** @type {ControlConstruct[]} */
    const result = [];
    for (const node of nodes) {
      const construct = statementConstruct(node);
      if (construct) {
        result.push(construct);
      }
    }
    return result;
  }

  /**
   * @param {Record<string, any>} node
   * @returns {Record<string, any>}
   */
  function expressionTree(node) {
    if (!isObject(node)) {
      return { type: 'leaf', range: null };
    }
    if (node.kind === 'ParenExpr' || node.kind === 'ExprWithCleanups') {
      return expressionTree(inner(node)[0]);
    }
    if (node.kind === 'BinaryOperator') {
      if (node.opcode === '&&' || node.opcode === '||') {
        const items = inner(node);
        return {
          type: node.opcode === '&&' ? 'and' : 'or',
          left: expressionTree(items[0]),
          right: expressionTree(items[1]),
        };
      }
      const call = findCallNode(node);
      return {
        type: 'leaf',
        range: rangeOf(node),
        label: 'comparison',
        ...(call ? { callSite: rangeOf(call) } : {}),
      };
    }
    if (node.kind === 'UnaryOperator' && node.opcode === '!') {
      return { type: 'not', operand: expressionTree(inner(node)[0]) };
    }
    if (node.kind === 'ConditionalOperator') {
      const items = inner(node);
      return {
        type: 'ternary',
        test: expressionTree(items[0]),
        consequent: expressionTree(items[1]),
        alternate: expressionTree(items[2]),
      };
    }
    const isCall =
      node.kind === 'CallExpr' ||
      node.kind === 'CXXMemberCallExpr' ||
      node.kind === 'CXXOperatorCallExpr' ||
      node.kind === 'CXXConstructExpr';
    return {
      type: 'leaf',
      range: rangeOf(node),
      label: isCall ? 'call' : 'condition',
      ...(isCall ? { callSite: rangeOf(node) } : {}),
    };
  }

  /**
   * @param {Record<string, any>} node
   * @returns {string}
   */
  function calleeName(node) {
    const found = findReferencedName(node);
    if (found) {
      return found;
    }
    if (node.kind === 'CXXConstructExpr') {
      return node.type?.qualType ? String(node.type.qualType).split('<')[0] : 'construct';
    }
    return 'call';
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct|null}
   */
  function expressionConstruct(node) {
    if (!isObject(node)) {
      return null;
    }
    if (node.kind === 'ParenExpr' || node.kind === 'ExprWithCleanups') {
      return expressionConstruct(inner(node)[0]);
    }
    if (
      (node.kind === 'BinaryOperator' && node.opcode === '=') ||
      node.kind === 'CompoundAssignOperator'
    ) {
      return expressionConstruct(inner(node)[1]);
    }
    if (
      node.kind === 'CallExpr' ||
      node.kind === 'CXXMemberCallExpr' ||
      node.kind === 'CXXOperatorCallExpr' ||
      node.kind === 'CXXConstructExpr'
    ) {
      return make('call', node, {
        extensions: {
          calleeName: calleeName(node),
          callSite: rangeOf(node),
        },
      });
    }
    if (node.kind === 'ConditionalOperator') {
      const items = inner(node);
      const consequent = branchConstruct(items[1], 'then');
      const alternate = branchConstruct(items[2], 'else');
      return make('ternary', node, {
        condition: rangeOf(items[0]) ?? rangeOf(node) ?? symbol.declaration,
        children: [consequent, alternate],
        extensions: { expression: expressionTree(items[0]) },
      });
    }
    if (node.kind === 'BinaryOperator' && (node.opcode === '&&' || node.opcode === '||')) {
      return make('short_circuit', node, {
        condition: rangeOf(node) ?? symbol.declaration,
        extensions: {
          operator: node.opcode,
          expression: expressionTree(node),
        },
      });
    }
    return null;
  }

  /**
   * @param {Record<string, any>|undefined} node
   * @param {'then'|'else'} branch
   * @returns {ControlConstruct}
   */
  function branchConstruct(node, branch) {
    return (
      expressionConstruct(node) ??
      make('statement', node ?? null, {
        extensions: { branch },
      })
    );
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct|null}
   */
  function statementConstruct(node) {
    if (!isObject(node) || typeof node.kind !== 'string') {
      return null;
    }
    if (NESTED_SCOPE_KINDS.has(node.kind)) {
      return make('statement', node, {
        extensions: { label: node.kind === 'LambdaExpr' ? 'lambda' : 'nested declaration' },
      });
    }

    switch (node.kind) {
      case 'NullStmt':
        return null;

      case 'CompoundStmt':
        return make('block', node, { children: statementList(inner(node)) });

      case 'AttributedStmt':
        return statementConstruct(inner(node)[0]);

      case 'DeclStmt': {
        const children = inner(node)
          .flatMap((declaration) => inner(declaration))
          .filter((child) => isStatementLike(child))
          .map((child) => expressionConstruct(child))
          .filter(Boolean);
        return children.length > 0
          ? make('block', node, { children })
          : make('statement', node);
      }

      case 'IfStmt':
        return ifConstruct(node);

      case 'WhileStmt': {
        const items = inner(node);
        const condition = items[0];
        const body = items[1];
        return make('while', node, {
          condition: rangeOf(condition) ?? rangeOf(node) ?? symbol.declaration,
          children: [body ? bodyBlock(body) : make('block', node)],
          extensions: { expression: expressionTree(condition) },
        });
      }

      case 'DoStmt': {
        const items = inner(node);
        const body = items[0];
        const condition = items[1];
        return make('do_while', node, {
          condition: rangeOf(condition) ?? rangeOf(node) ?? symbol.declaration,
          children: [body ? bodyBlock(body) : make('block', node)],
          extensions: { expression: expressionTree(condition) },
        });
      }

      case 'ForStmt':
        return forConstruct(node);

      case 'CXXForRangeStmt':
        return rangeForConstruct(node);

      case 'SwitchStmt':
        return switchConstruct(node);

      case 'CaseStmt': {
        const items = inner(node);
        const value = literalValue(items[0]);
        const body = items.length > 1 ? items[items.length - 1] : null;
        return make('case', node, {
          children: body ? [statementConstruct(body) ?? make('block', body)] : [],
          extensions: { test: value ?? 'case' },
        });
      }

      case 'DefaultStmt': {
        const body = inner(node)[0];
        return make('case', node, {
          children: body ? [statementConstruct(body) ?? make('block', body)] : [],
          extensions: { test: 'default' },
        });
      }

      case 'ReturnStmt': {
        const value = inner(node)[0];
        const child = value ? expressionConstruct(value) : null;
        return make('return', node, {
          ...(child ? { children: [child] } : {}),
          ...(value ? { extensions: { valueRange: rangeOf(value) } } : {}),
        });
      }

      case 'CXXThrowExpr': {
        const value = inner(node)[0];
        const child = value ? expressionConstruct(value) : null;
        return make('throw', node, {
          ...(child ? { children: [child] } : {}),
          ...(value ? { extensions: { valueRange: rangeOf(value) } } : {}),
        });
      }

      case 'CXXTryStmt':
        return tryConstruct(node);

      case 'CXXCatchStmt': {
        const body = inner(node)[0];
        return make('catch', node, {
          children: [body ? statementConstruct(body) ?? make('block', body) : make('block', node)],
        });
      }

      case 'GotoStmt': {
        const label = labelName(node);
        return make('goto', node, {
          ...(label ? { extensions: { label } } : {}),
        });
      }

      case 'IndirectGotoStmt':
        return make('goto', node, {
          extensions: { indirect: true },
        });

      case 'LabelStmt': {
        const child = statementConstruct(inner(node)[0]);
        const label = typeof node.name === 'string' ? node.name : undefined;
        return make('label', node, {
          children: child ? [child] : [],
          ...(label ? { extensions: { label } } : {}),
        });
      }

      case 'BreakStmt':
        return make('break', node);

      case 'ContinueStmt':
        return make('continue', node);

      case 'CallExpr':
      case 'CXXMemberCallExpr':
      case 'CXXOperatorCallExpr':
      case 'CXXConstructExpr': {
        const call = expressionConstruct(node);
        return call ?? make('statement', node);
      }

      case 'ConditionalOperator': {
        const conditional = expressionConstruct(node);
        return conditional ?? make('statement', node);
      }

      case 'BinaryOperator':
      case 'UnaryOperator':
      case 'CompoundAssignOperator': {
        const branchy = expressionConstruct(node);
        if (branchy) {
          return branchy;
        }
        return make('statement', node);
      }

      default:
        return STATEMENT_KINDS.has(node.kind) || isStatementLike(node)
          ? make('statement', node)
          : make('unsupported', node, {
              extensions: {
                reasonCode: 'unsupported_construct',
                label: `unmodeled ${node.kind}`,
              },
            });
    }
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function ifConstruct(node) {
    const items = inner(node);
    let index = 0;
    /** @type {ControlConstruct|null} */
    let init = null;
    if (node.hasInit === true && items.length > 0) {
      init = statementConstruct(items[0]);
      index = 1;
    }
    const condition = items[index];
    const thenNode = items[index + 1];
    const elseNode = node.hasElse === true ? items[index + 2] : null;

    const thenConstruct = thenNode ? bodyBlock(thenNode) : make('block', node);
    const children = [thenConstruct];
    if (elseNode) {
      children.push(
        make('else', elseNode, {
          children: [bodyBlock(elseNode)],
        }),
      );
    }
    const ifConstructNode = make('if', node, {
      condition: rangeOf(condition) ?? rangeOf(node) ?? symbol.declaration,
      children,
      extensions: { expression: expressionTree(condition) },
    });
    return init
      ? make('block', node, { children: [init, ifConstructNode] })
      : ifConstructNode;
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function forConstruct(node) {
    const items = inner(node);
    const body = items.length > 0 ? items[items.length - 1] : null;
    const head = items.slice(0, Math.max(0, items.length - 1));
    /** @type {Record<string, any>|undefined} */
    let init;
    /** @type {Record<string, any>|undefined} */
    let condition;
    /** @type {Record<string, any>|undefined} */
    let update;
    if (head.length > 0) {
      if (head[0]?.kind === 'DeclStmt' || head[0]?.kind === 'BinaryOperator') {
        init = head[0];
        head.shift();
      }
    }
    if (head.length > 0) {
      condition = head[0];
      head.shift();
    }
    if (head.length > 0) {
      update = head[head.length - 1];
    }
    const extensions = {
      hasInit: Boolean(init),
      hasCondition: Boolean(condition),
      hasUpdate: Boolean(update),
      ...(init ? { initRange: rangeOf(init) } : {}),
      ...(update ? { updateRange: rangeOf(update) } : {}),
      expression: expressionTree(condition),
    };
    return make('for', node, {
      ...(condition ? { condition: rangeOf(condition) ?? symbol.declaration } : {}),
      children: [body ? bodyBlock(body) : make('block', node)],
      extensions,
    });
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function rangeForConstruct(node) {
    const items = inner(node);
    const body = items.length > 0 ? items[items.length - 1] : null;
    const rangeExpression = items.length > 1 ? items[items.length - 2] : null;
    return make('for', node, {
      condition: rangeOf(rangeExpression) ?? rangeOf(node) ?? symbol.declaration,
      children: [body ? bodyBlock(body) : make('block', node)],
      extensions: {
        iteration: 'of',
        hasInit: false,
        hasCondition: true,
        hasUpdate: false,
        expression: expressionTree(rangeExpression),
      },
    });
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function switchConstruct(node) {
    const items = inner(node);
    const condition = items[0];
    const body = items[1];
    const cases = body ? inner(body).map((entry) => statementConstruct(entry)).filter(Boolean) : [];
    return make('switch', node, {
      condition: rangeOf(condition) ?? rangeOf(node) ?? symbol.declaration,
      children: /** @type {ControlConstruct[]} */ (cases),
      extensions: { expression: expressionTree(condition) },
    });
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function tryConstruct(node) {
    const items = inner(node);
    const body = items[0];
    const handlers = items
      .slice(1)
      .filter((child) => child.kind === 'CXXCatchStmt')
      .map((child) => statementConstruct(child))
      .filter(Boolean);
    return make('try', node, {
      children: [
        body ? bodyBlock(body) : make('block', node),
        .../** @type {ControlConstruct[]} */ (handlers),
      ],
    });
  }

  /**
   * @param {Record<string, any>} node
   * @returns {ControlConstruct}
   */
  function bodyBlock(node) {
    return statementConstruct(node) ?? make('block', node);
  }

  const rootBody = findBody(functionNode, functionNode.kind === 'LambdaExpr');
  const bodyConstructs = rootBody ? statementList(inner(rootBody)) : [];

  const entry = make('entry', functionNode, {
    range: symbol.declaration,
    children: bodyConstructs,
  });

  return { constructs, diagnostics, rootId: entry.constructId };
}

/**
 * @param {Record<string, any>} node
 * @returns {Record<string, any>[]}
 */
function inner(node) {
  return Array.isArray(node?.inner) ? node.inner.filter(isObject) : [];
}

/**
 * Find a definition body without descending into an unrelated nested function.
 * A lambda is the exception: its body lives inside the generated `operator()`.
 *
 * @param {Record<string, any>} node
 * @param {boolean} allowNestedFunction
 * @returns {Record<string, any>|null}
 */
function findBody(node, allowNestedFunction) {
  for (const child of inner(node)) {
    if (child.kind === 'CompoundStmt') {
      return child;
    }
    if (NESTED_SCOPE_KINDS.has(child.kind)) {
      if (allowNestedFunction) {
        const nested = findBody(child, false);
        if (nested) {
          return nested;
        }
      }
      continue;
    }
    const found = findBody(child, allowNestedFunction);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * @param {Record<string, any>} node
 * @returns {boolean}
 */
function isStatementLike(node) {
  return isObject(node) && typeof node.kind === 'string' && STATEMENT_KINDS.has(node.kind);
}

/**
 * @param {Record<string, any>} node
 * @returns {string|null}
 */
function findReferencedName(node) {
  if (!isObject(node)) {
    return null;
  }
  if (isObject(node.referencedDecl) && typeof node.referencedDecl.name === 'string') {
    return node.referencedDecl.name;
  }
  if (node.kind === 'MemberExpr' && isObject(node.name)) {
    return null;
  }
  for (const child of inner(node)) {
    const found = findReferencedName(child);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * The first call inside an expression, so `helper(n) > 100` keeps its call
 * correlation on the condition node. Nested function scopes are not entered.
 *
 * @param {Record<string, any>} node
 * @returns {Record<string, any>|null}
 */
function findCallNode(node) {
  if (!isObject(node)) {
    return null;
  }
  if (
    node.kind === 'CallExpr' ||
    node.kind === 'CXXMemberCallExpr' ||
    node.kind === 'CXXOperatorCallExpr' ||
    node.kind === 'CXXConstructExpr'
  ) {
    return node;
  }
  if (NESTED_SCOPE_KINDS.has(node.kind)) {
    return null;
  }
  for (const child of inner(node)) {
    const found = findCallNode(child);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * @param {Record<string, any>|undefined} node
 * @returns {string|null}
 */
function literalValue(node) {
  if (!isObject(node)) {
    return null;
  }
  if (typeof node.value === 'string') {
    return node.value;
  }
  if (typeof node.value === 'number') {
    return String(node.value);
  }
  const items = inner(node);
  for (const child of items) {
    const value = literalValue(child);
    if (value !== null) {
      return value;
    }
  }
  return null;
}

/**
 * @param {Record<string, any>} node
 * @returns {string|undefined}
 */
function labelName(node) {
  if (typeof node.label === 'string') {
    return node.label;
  }
  if (typeof node.targetLabelDeclId === 'string') {
    return node.targetLabelDeclId;
  }
  const label = node.label;
  if (isObject(label) && typeof label.name === 'string') {
    return label.name;
  }
  return undefined;
}
