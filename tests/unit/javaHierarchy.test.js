import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javaAdapter } from '../../src/adapters/java/index.js';

const source = await fs.readFile(new URL('../fixtures/java/hierarchy.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-hierarchy.json', import.meta.url), 'utf8');

describe('Java Type Hierarchy & Inheritance (P14-04, AC-14.3)', () => {
  const run = javaAdapter.analyze({
    runId: 'run:java-hierarchy',
    path: 'src/HierarchyDemo.java',
    text: source,
    javaAst: ast,
    javaMode: 'compile-db',
  });

  it('maps Java interfaces with abstract methods', () => {
    const drawable = run.symbols.find((s) => s.name === 'Drawable');
    assert.ok(drawable);
    assert.equal(drawable.kind, 'interface');

    const drawMethod = run.symbols.find((s) => s.name === 'draw' && s.parentId === drawable.symbolId);
    assert.ok(drawMethod);
    assert.equal(drawMethod.extensions?.isAbstract, true);
  });

  it('maps class inheritance via inherits relationship', () => {
    const circle = run.symbols.find((s) => s.name === 'Circle');
    const shape = run.symbols.find((s) => s.name === 'Shape');
    assert.ok(circle && shape);

    const inheritsRel = run.relationships.find(
      (r) => r.type === 'inherits' && r.from === circle.symbolId && r.to === shape.symbolId,
    );
    assert.ok(inheritsRel, 'Circle must inherit from Shape');
    assert.equal(inheritsRel.status, 'resolved');
  });

  it('maps interface implementation via implements relationship', () => {
    const shape = run.symbols.find((s) => s.name === 'Shape');
    const drawable = run.symbols.find((s) => s.name === 'Drawable');
    assert.ok(shape && drawable);

    const implementsRel = run.relationships.find(
      (r) => r.type === 'implements' && r.from === shape.symbolId && r.to === drawable.symbolId,
    );
    assert.ok(implementsRel, 'Shape must implement Drawable');
    assert.equal(implementsRel.status, 'resolved');
  });

  it('maps constructors and distinct methods on derived classes', () => {
    const circle = run.symbols.find((s) => s.name === 'Circle');
    assert.ok(circle);

    const ctor = run.symbols.find((s) => s.kind === 'constructor' && s.parentId === circle.symbolId);
    assert.ok(ctor);

    const areaMethod = run.symbols.find((s) => s.name === 'area' && s.parentId === circle.symbolId);
    assert.ok(areaMethod);
    assert.equal(areaMethod.kind, 'method');
  });
});
