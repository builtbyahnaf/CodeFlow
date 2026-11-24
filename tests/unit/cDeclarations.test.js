import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import { cAdapter } from '../../src/adapters/c/index.js';

const source = await fs.readFile(new URL('../fixtures/c/basic.c', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/c/ast-basic.json', import.meta.url), 'utf8');

describe('C Declarations & Type Mapping (P13-03, P13-04, AC-13.2)', () => {
  const run = cAdapter.analyze({
    runId: 'run:c-decl',
    path: 'src/basic.c',
    text: source,
    cAst: ast,
    cMode: 'compile-db',
  });

  it('maps C functions with static and extern storage classes', () => {
    const helper = run.symbols.find((s) => s.name === 'helper');
    assert.ok(helper);
    assert.equal(helper.kind, 'function');
    assert.equal(helper.visibility, 'private');
    assert.equal(helper.extensions?.isStatic, true);

    const calc = run.symbols.find((s) => s.name === 'calculate');
    assert.ok(calc);
    assert.equal(calc.kind, 'function');
    assert.equal(calc.visibility, 'public');
    assert.equal(calc.extensions?.isStatic, false);
  });

  it('maps C struct and union records with field contains relationships', () => {
    const pt = run.symbols.find((s) => s.name === 'Point');
    assert.ok(pt);
    assert.equal(pt.kind, 'struct');

    const val = run.symbols.find((s) => s.name === 'Value');
    assert.ok(val);
    assert.equal(val.kind, 'struct');
    assert.equal(val.extensions?.isUnion, true);

    // Fields
    const fieldX = run.symbols.find((s) => s.name === 'x');
    assert.ok(fieldX);
    assert.equal(fieldX.kind, 'field');
    assert.equal(fieldX.parentId, pt.symbolId);

    const defines = run.relationships.filter((r) => r.type === 'defines' && r.from === pt.symbolId);
    assert.equal(defines.length, 2);
  });

  it('maps C enum declarations and enum constants', () => {
    const color = run.symbols.find((s) => s.name === 'Color');
    assert.ok(color);
    assert.equal(color.kind, 'enum');

    const red = run.symbols.find((s) => s.name === 'RED');
    assert.ok(red);
    assert.equal(red.kind, 'enum_member');
    assert.equal(red.parentId, color.symbolId);
  });

  it('maps C typedef declarations', () => {
    const byte = run.symbols.find((s) => s.name === 'byte');
    assert.ok(byte);
    assert.equal(byte.kind, 'type_alias');
    assert.equal(byte.extensions?.underlyingType, 'unsigned char');
  });

  it('maps C global and static variables', () => {
    const countVar = run.symbols.find((s) => s.name === 'internal_count');
    assert.ok(countVar);
    assert.equal(countVar.kind, 'variable');
    assert.equal(countVar.extensions?.isStatic, true);
    assert.equal(countVar.visibility, 'private');
  });

  it('resolves direct function calls between C functions', () => {
    const helper = run.symbols.find((s) => s.name === 'helper');
    const calc = run.symbols.find((s) => s.name === 'calculate');
    assert.ok(helper && calc);

    const callRel = run.relationships.find(
      (r) => r.type === 'calls' && r.from === calc.symbolId && r.to === helper.symbolId,
    );
    assert.ok(callRel);
    assert.equal(callRel.status, 'resolved');
  });
});
