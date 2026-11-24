import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { javaAdapter } from '../../src/adapters/java/index.js';

const source = await fs.readFile(new URL('../fixtures/java/basic.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-basic.json', import.meta.url), 'utf8');

describe('Java Declarations, Types & Overloads (P14-03, P14-05, AC-14.2)', () => {
  const run = javaAdapter.analyze({
    runId: 'run:java-decl',
    path: 'src/BasicDemo.java',
    text: source,
    javaAst: ast,
    javaMode: 'compile-db',
  });

  it('maps Java classes and inner classes with containment', () => {
    const mainClass = run.symbols.find((s) => s.name === 'BasicDemo');
    assert.ok(mainClass);
    assert.equal(mainClass.kind, 'class');
    assert.equal(mainClass.visibility, 'public');

    const innerPoint = run.symbols.find((s) => s.name === 'Point');
    assert.ok(innerPoint);
    assert.equal(innerPoint.kind, 'class');
    assert.equal(innerPoint.parentId, mainClass.symbolId);

    // Fields in Point
    const fieldX = run.symbols.find((s) => s.name === 'x');
    assert.ok(fieldX);
    assert.equal(fieldX.kind, 'field');
    assert.equal(fieldX.parentId, innerPoint.symbolId);

    const definesRel = run.relationships.find(
      (r) => r.type === 'defines' && r.from === innerPoint.symbolId && r.to === fieldX.symbolId,
    );
    assert.ok(definesRel);
  });

  it('maps Java enums and enum constant members', () => {
    const colorEnum = run.symbols.find((s) => s.name === 'Color');
    assert.ok(colorEnum);
    assert.equal(colorEnum.kind, 'enum');

    const red = run.symbols.find((s) => s.name === 'RED');
    assert.ok(red);
    assert.equal(red.kind, 'enum_member');
    assert.equal(red.parentId, colorEnum.symbolId);
  });

  it('maps Java methods and distinguishes overloads using parameter signatures', () => {
    const addMethods = run.symbols.filter((s) => s.name === 'add');
    assert.equal(addMethods.length, 2);

    const intAdd = addMethods.find((m) => m.disambiguator?.includes('int'));
    const doubleAdd = addMethods.find((m) => m.disambiguator?.includes('double'));
    assert.ok(intAdd, 'int overload must exist');
    assert.ok(doubleAdd, 'double overload must exist');
    assert.notEqual(intAdd.symbolId, doubleAdd.symbolId);
  });

  it('maps static methods with appropriate extension flags', () => {
    const helper = run.symbols.find((s) => s.name === 'helper');
    assert.ok(helper);
    assert.equal(helper.kind, 'method');
    assert.equal(helper.extensions?.isStatic, true);
  });
});
