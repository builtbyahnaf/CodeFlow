/**
 * ESTree -> language-neutral control constructs.
 *
 * The mapper already owns symbols and call relationships. This module only
 * describes source structure: branches, loops, handlers, jumps and call sites.
 * The core CFG builder lowers these constructs; nothing here invents an edge.
 */

import { createControlConstruct } from '../../core/csr/entities.js';

/**
 * @typedef {import('../../core/csr/entities.js').ControlConstruct} ControlConstruct
 * @typedef {import('../../core/csr/entities.js').SourceRange} SourceRange
 * @typedef {import('../../core/csr/entities.js').SymbolRecord} SymbolRecord
 */

/**
 * @param {{moduleInfo: Record<string, any>, functionNode: Record<string, any>, symbol: SymbolRecord}} input
 * @returns {{constructs: ControlConstruct[], diagnostics: Array<{code: string, message: string, range?: SourceRange}>}}
 */
export function collectFunctionConstructs({ moduleInfo, functionNode, symbol }) {
  const locator = moduleInfo.locator;
  /** @type {ControlConstruct[]} */
  const constructs = [];
  /** @type {Array<{code: string, message: string, range?: SourceRange}>} */
  const diagnostics = [];
  let counter = 0;

  /**
   * @param {unknown} node
   * @returns {SourceRange}
   */
  function rangeOf(node) {
    return locator.range(node ?? functionNode);
  }

  /**
   * @param {string} kind
   * @param {unknown} node
   * @param {{children?: ControlConstruct[], condition?: SourceRange, extensions?: Record<string, unknown>, range?: SourceRange}} [input]
   * @returns {ControlConstruct}
   */
  function make(kind, node, input = {}) {
    counter += 1;
    const children = input.children ?? [];
    const construct = createControlConstruct({
      constructId: `construct:${symbol.symbolId}:c${counter}`,
      kind,
      symbolId: symbol.symbolId,
      sourceRange: input.range ?? rangeOf(node),
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
   * @param {Record<string, any>[]} statements
   * @returns {ControlConstruct[]}
   */
  function statementList(statements) {
    /** @type {ControlConstruct[]} */
    const result = [];
    for (const statement of statements ?? []) {
      const construct = statementConstruct(statement);
      if (construct) {
        result.push(construct);
      }
    }
    return result;
  }

  /**
   * @param {Record<string, any>} expression
   * @returns {Record<string, any>}
   */
  function expressionTree(expression) {
    if (!expression) {
      return { type: 'leaf', range: null };
    }
    if (expression.type === 'ChainExpression') {
      return expressionTree(expression.expression);
    }
    if (expression.type === 'LogicalExpression') {
      const type =
        expression.operator === '&&' ? 'and' : expression.operator === '??' ? 'nullish' : 'or';
      return {
        type,
        left: expressionTree(expression.left),
        right: expressionTree(expression.right),
      };
    }
    if (expression.type === 'UnaryExpression' && expression.operator === '!') {
      return { type: 'not', operand: expressionTree(expression.argument) };
    }
    if (expression.type === 'ConditionalExpression') {
      return {
        type: 'ternary',
        test: expressionTree(expression.test),
        consequent: expressionTree(expression.consequent),
        alternate: expressionTree(expression.alternate),
      };
    }
    if (expression.type === 'CallExpression' || expression.type === 'NewExpression') {
      return {
        type: 'leaf',
        range: rangeOf(expression),
        label: 'call',
        callSite: rangeOf(expression.callee ?? expression),
      };
    }
    const label =
      expression.type === 'BinaryExpression' || expression.type === 'LogicalExpression'
        ? 'comparison'
        : 'condition';
    const call = findCall(expression);
    return {
      type: 'leaf',
      range: rangeOf(expression),
      label,
      ...(call ? { callSite: rangeOf(call.callee ?? call) } : {}),
    };
  }

  /**
   * The first call inside an expression, so `if (check(x) > 0)` keeps its
   * call correlation on the condition node. Nested functions are not entered.
   *
   * @param {unknown} expression
   * @returns {Record<string, any>|null}
   */
  function findCall(expression) {
    if (!expression || typeof expression !== 'object') {
      return null;
    }
    const node = /** @type {Record<string, any>} */ (expression);
    if (node.type === 'CallExpression' || node.type === 'NewExpression') {
      return node;
    }
    if (
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression' ||
      node.type === 'ClassExpression'
    ) {
      return null;
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc' || key === 'range' || key === 'parent') {
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          const found = findCall(item);
          if (found) {
            return found;
          }
        }
      } else if (value && typeof value === 'object' && typeof value.type === 'string') {
        const found = findCall(value);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  /**
   * @param {Record<string, any>} callee
   * @returns {string}
   */
  function calleeName(callee) {
    if (!callee) {
      return 'call';
    }
    if (callee.type === 'Identifier') {
      return callee.name;
    }
    if (callee.type === 'MemberExpression' && !callee.computed) {
      const property = callee.property;
      if (property?.type === 'Identifier') {
        return property.name;
      }
      if (property?.type === 'PrivateIdentifier') {
        return `#${property.name}`;
      }
    }
    if (callee.type === 'Super') {
      return 'super';
    }
    return 'call';
  }

  /**
   * @param {Record<string, any>} expression
   * @returns {ControlConstruct|null}
   */
  function expressionConstruct(expression) {
    if (!expression) {
      return null;
    }
    if (expression.type === 'ChainExpression') {
      return expressionConstruct(expression.expression);
    }
    if (expression.type === 'CallExpression' || expression.type === 'NewExpression') {
      return make('call', expression, {
        extensions: {
          calleeName: calleeName(expression.callee),
          callSite: rangeOf(expression.callee ?? expression),
          ...(expression.type === 'NewExpression' ? { constructor: true } : {}),
        },
      });
    }
    if (expression.type === 'AwaitExpression') {
      const child = expressionConstruct(expression.argument);
      return make('await', expression, { children: child ? [child] : [] });
    }
    if (expression.type === 'YieldExpression') {
      const child = expression.argument ? expressionConstruct(expression.argument) : null;
      return make('yield', expression, { children: child ? [child] : [] });
    }
    if (expression.type === 'ConditionalExpression') {
      const consequent =
        expressionConstruct(expression.consequent) ??
        make('statement', expression.consequent, { extensions: { branch: 'then' } });
      const alternate =
        expressionConstruct(expression.alternate) ??
        make('statement', expression.alternate, { extensions: { branch: 'else' } });
      if (consequent.extensions) {
        consequent.extensions.branch = 'then';
      }
      if (alternate.extensions) {
        alternate.extensions.branch = 'else';
      }
      return make('ternary', expression, {
        condition: rangeOf(expression.test),
        children: [consequent, alternate],
        extensions: { expression: expressionTree(expression.test) },
      });
    }
    if (expression.type === 'LogicalExpression') {
      return make('short_circuit', expression, {
        condition: rangeOf(expression),
        extensions: {
          operator: expression.operator,
          expression: expressionTree(expression),
        },
      });
    }
    if (expression.type === 'SequenceExpression') {
      const children = (expression.expressions ?? [])
        .map((entry) => expressionConstruct(entry))
        .filter(Boolean);
      return make('block', expression, { children });
    }
    if (expression.type === 'AssignmentExpression') {
      const child = expressionConstruct(expression.right);
      if (child) {
        return child;
      }
    }
    return make('statement', expression);
  }

  /**
   * Expressions that expand into their own control-flow nodes. A plain
   * identifier or literal is left to the enclosing node's range instead.
   *
   * @param {Record<string, any>|null|undefined} expression
   * @returns {ControlConstruct|null}
   */
  function branchyExpression(expression) {
    if (!expression) {
      return null;
    }
    const construct = expressionConstruct(expression);
    if (!construct) {
      return null;
    }
    return ['call', 'await', 'yield', 'ternary', 'short_circuit', 'block'].includes(construct.kind)
      ? construct
      : null;
  }

  /**
   * @param {Record<string, any>} statement
   * @param {{label?: string}} [options]
   * @returns {ControlConstruct|null}
   */
  function statementConstruct(statement, options = {}) {
    if (!statement) {
      return null;
    }
    switch (statement.type) {
      case 'EmptyStatement':
        return null;

      case 'BlockStatement':
        return make('block', statement, { children: statementList(statement.body) });

      case 'ExpressionStatement':
        return expressionConstruct(statement.expression);

      case 'VariableDeclaration': {
        /** @type {ControlConstruct[]} */
        const children = [];
        for (const declaration of statement.declarations ?? []) {
          const child = declaration.init ? expressionConstruct(declaration.init) : null;
          if (child && child.kind !== 'statement') {
            children.push(child);
          }
        }
        return children.length > 0
          ? make('block', statement, { children })
          : make('statement', statement);
      }

      case 'ReturnStatement': {
        const value = statement.argument ? rangeOf(statement.argument) : null;
        const child = branchyExpression(statement.argument);
        return make('return', statement, {
          ...(child ? { children: [child] } : {}),
          ...(value ? { extensions: { valueRange: value } } : {}),
        });
      }

      case 'ThrowStatement': {
        const value = statement.argument ? rangeOf(statement.argument) : null;
        const child = branchyExpression(statement.argument);
        return make('throw', statement, {
          ...(child ? { children: [child] } : {}),
          ...(value ? { extensions: { valueRange: value } } : {}),
        });
      }

      case 'IfStatement': {
        const thenConstruct =
          statementConstruct(statement.consequent) ??
          make('statement', statement.consequent, { extensions: { branch: 'then' } });
        const elseConstruct = statement.alternate
          ? make('else', statement.alternate, {
              children: [
                statementConstruct(statement.alternate) ??
                  make('statement', statement.alternate),
              ],
            })
          : null;
        return make('if', statement, {
          condition: rangeOf(statement.test),
          children: elseConstruct ? [thenConstruct, elseConstruct] : [thenConstruct],
          extensions: { expression: expressionTree(statement.test) },
        });
      }

      case 'WhileStatement':
        return make('while', statement, {
          condition: rangeOf(statement.test),
          children: [
            statementConstruct(statement.body) ?? make('block', statement.body, { children: [] }),
          ],
          extensions: {
            expression: expressionTree(statement.test),
            ...(options.label ? { label: options.label } : {}),
          },
        });

      case 'DoWhileStatement':
        return make('do_while', statement, {
          condition: rangeOf(statement.test),
          children: [
            statementConstruct(statement.body) ?? make('block', statement.body, { children: [] }),
          ],
          extensions: {
            expression: expressionTree(statement.test),
            ...(options.label ? { label: options.label } : {}),
          },
        });

      case 'ForStatement': {
        const extensions = {
          hasInit: Boolean(statement.init),
          hasCondition: Boolean(statement.test),
          hasUpdate: Boolean(statement.update),
          ...(statement.init ? { initRange: rangeOf(statement.init) } : {}),
          ...(statement.test ? { updateRange: rangeOf(statement.test) } : {}),
          ...(statement.update ? { updateRange: rangeOf(statement.update) } : {}),
          expression: expressionTree(statement.test),
          ...(options.label ? { label: options.label } : {}),
        };
        return make('for', statement, {
          ...(statement.test ? { condition: rangeOf(statement.test) } : {}),
          children: [
            statementConstruct(statement.body) ?? make('block', statement.body, { children: [] }),
          ],
          extensions,
        });
      }

      case 'ForOfStatement':
      case 'ForInStatement': {
        const extensions = {
          iteration: statement.type === 'ForOfStatement' ? 'of' : 'in',
          hasInit: false,
          hasCondition: true,
          hasUpdate: false,
          expression: expressionTree(statement.right),
          ...(options.label ? { label: options.label } : {}),
        };
        return make('for', statement, {
          condition: rangeOf(statement.right),
          children: [
            statementConstruct(statement.body) ?? make('block', statement.body, { children: [] }),
          ],
          extensions,
        });
      }

      case 'SwitchStatement': {
        const children = (statement.cases ?? []).map((entry) => switchCaseConstruct(entry));
        return make('switch', statement, {
          condition: rangeOf(statement.discriminant),
          children,
          extensions: { expression: expressionTree(statement.discriminant) },
        });
      }

      case 'TryStatement': {
        const children = [];
        const block = statementConstruct(statement.block);
        if (block) {
          children.push(block);
        }
        if (statement.handler) {
          children.push(
            make('catch', statement.handler, {
              children: [
                statementConstruct(statement.handler.body) ??
                  make('block', statement.handler.body, { children: [] }),
              ],
              extensions: {
                ...(statement.handler.param
                  ? { paramRange: rangeOf(statement.handler.param) }
                  : {}),
              },
            }),
          );
        }
        if (statement.finalizer) {
          children.push(
            make('finally', statement.finalizer, {
              children: [
                statementConstruct(statement.finalizer) ??
                  make('block', statement.finalizer, { children: [] }),
              ],
            }),
          );
        }
        return make('try', statement, { children });
      }

      case 'BreakStatement':
        return make('break', statement, {
          ...(statement.label ? { extensions: { label: statement.label.name } } : {}),
        });

      case 'ContinueStatement':
        return make('continue', statement, {
          ...(statement.label ? { extensions: { label: statement.label.name } } : {}),
        });

      case 'LabeledStatement':
        return labeledConstruct(statement);

      case 'WithStatement': {
        diagnostics.push({
          code: 'unsupported_construct',
          message: 'A with statement changes name resolution dynamically and is not modeled.',
          range: rangeOf(statement),
        });
        return make('unknown', statement, { extensions: { reasonCode: 'with_scope' } });
      }

      case 'DebuggerStatement':
        return make('statement', statement, { extensions: { label: 'debugger' } });

      case 'FunctionDeclaration':
      case 'ClassDeclaration':
        return make('statement', statement, {
          extensions: { label: statement.type === 'ClassDeclaration' ? 'class' : 'function' },
        });

      default:
        return make('statement', statement);
    }
  }

  /**
   * @param {Record<string, any>} statement
   * @returns {ControlConstruct}
   */
  function labeledConstruct(statement) {
    const label = statement.label?.name;
    const body = statement.body;
    if (
      body &&
      ['WhileStatement', 'DoWhileStatement', 'ForStatement', 'ForOfStatement', 'ForInStatement'].includes(
        body.type,
      )
    ) {
      return /** @type {ControlConstruct} */ (
        statementConstruct(body, { label: typeof label === 'string' ? label : undefined })
      );
    }
    const child = statementConstruct(body);
    return make('label', statement, {
      children: child ? [child] : [],
      ...(label ? { extensions: { label } } : {}),
    });
  }

  /**
   * @param {Record<string, any>} entry
   * @returns {ControlConstruct}
   */
  function switchCaseConstruct(entry) {
    let test = 'default';
    if (entry.test) {
      test =
        entry.test.type === 'Literal'
          ? String(entry.test.value)
          : entry.test.type === 'Identifier'
            ? entry.test.name
            : 'case';
    }
    return make('case', entry, {
      children: statementList(entry.consequent),
      extensions: { test },
    });
  }

  // -------------------------------------------------------------------------
  // Function root.
  // -------------------------------------------------------------------------

  const body = functionNode.body;
  /** @type {ControlConstruct[]} */
  let bodyConstructs = [];
  if (body?.type === 'BlockStatement') {
    bodyConstructs = statementList(body.body);
  } else if (body) {
    const expression = expressionConstruct(body);
    bodyConstructs = [
      expression?.kind === 'call'
        ? make('sequence', body, { children: [expression, make('return', body)] })
        : make('return', body, { extensions: { valueRange: rangeOf(body) } }),
    ];
  }

  const entry = make('entry', functionNode, {
    range: symbol.declaration,
    children: bodyConstructs,
  });

  return { constructs, diagnostics, rootId: entry.constructId };
}
