import test from 'node:test';
import assert from 'node:assert/strict';

import { focusRunOnPath } from '../../src/core/csr/focus.js';

function fixture() {
  const files = [
    { fileId: 'file:a', path: 'a.cpp' },
    { fileId: 'file:b', path: 'include/b.h' },
  ];
  const symbols = [
    { symbolId: 'a1', declaration: { fileId: 'file:a' } },
    { symbolId: 'b1', parentId: 'a1', declaration: { fileId: 'file:b' } },
    { symbolId: 'b2', parentId: 'b1', declaration: { fileId: 'file:b' } },
    { symbolId: 'a2', declaration: { fileId: 'file:a' } },
  ];
  const relationships = [
    { relationshipId: 'r1', from: 'b1', to: 'b2', status: 'resolved' },
    { relationshipId: 'r2', from: 'b1', to: 'a1', status: 'resolved' },
    { relationshipId: 'r3', from: 'a1', to: 'b1', status: 'possible' },
    { relationshipId: 'r4', from: 'b1', to: 'external:printf', status: 'unresolved' },
  ];
  const controlConstructs = [
    { constructId: 'c1', symbolId: 'b1' },
    { constructId: 'c2', symbolId: 'a1' },
  ];
  const dataFacts = [
    { factId: 'd1', symbolId: 'b2' },
    { factId: 'd2', symbolId: 'a2' },
  ];
  return /** @type {any} */ ({
    runId: 'run:focus',
    csrVersion: '1.1.0',
    adapterId: 'test',
    adapterVersion: '1',
    language: 'cpp',
    scope: { kind: 'workspace', path: 'a.cpp' },
    completeness: 'full',
    files,
    symbols,
    relationships,
    controlConstructs,
    dataFacts,
    diagnostics: [],
  });
}

test('focusing keeps declarations from the requested file only', () => {
  const result = focusRunOnPath(fixture(), 'include/b.h');
  assert.deepEqual(
    result.run.symbols.map((symbol) => symbol.symbolId),
    ['b1', 'b2'],
  );
  assert.equal(result.keptSymbols, 2);
  assert.equal(result.droppedSymbols, 2);
  assert.equal(result.run.scope.path, 'include/b.h');
});

test('a parent outside the focus is dropped rather than dangling', () => {
  const result = focusRunOnPath(fixture(), 'include/b.h');
  const b1 = result.run.symbols.find((symbol) => symbol.symbolId === 'b1');
  assert.equal(b1.parentId, undefined);
  const b2 = result.run.symbols.find((symbol) => symbol.symbolId === 'b2');
  assert.equal(b2.parentId, 'b1');
});

test('relationships survive only when their endpoints do', () => {
  const result = focusRunOnPath(fixture(), 'include/b.h');
  assert.deepEqual(
    result.run.relationships.map((relationship) => relationship.relationshipId),
    ['r1', 'r4'],
  );
  assert.equal(result.droppedRelationships, 2);
});

test('a resolved relationship to a dropped symbol cannot survive', () => {
  const result = focusRunOnPath(fixture(), 'include/b.h');
  assert.equal(
    result.run.relationships.some((relationship) => relationship.to === 'a1'),
    false,
  );
});

test('control constructs and data facts follow their symbols', () => {
  const result = focusRunOnPath(fixture(), 'include/b.h');
  assert.deepEqual(
    result.run.controlConstructs.map((construct) => construct.constructId),
    ['c1'],
  );
  assert.deepEqual(
    result.run.dataFacts.map((fact) => fact.factId),
    ['d1'],
  );
});

test('focusing on a file that was not analysed yields an empty, scoped run', () => {
  const result = focusRunOnPath(fixture(), 'include/missing.h');
  assert.equal(result.run.scope.path, 'include/missing.h');
  assert.deepEqual(result.run.symbols, []);
  assert.deepEqual(result.run.relationships, []);
  assert.equal(result.keptSymbols, 0);
  assert.equal(result.droppedSymbols, 4);
});
