import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAnonymousDisambiguator,
  createFileId,
  createIdentityAllocator,
  createIdentityKey,
  createOverloadDisambiguator,
  createRelationshipAllocator,
  createSymbolId,
  normalizePath,
  normalizeQualifiedName,
} from '../../src/core/csr/identity.js';

const base = {
  language: 'js',
  path: 'src/app.js',
  kind: 'function',
  qualifiedName: 'main',
};

test('identity ignores line numbers and survives whitespace, comment, and line-shift edits', () => {
  // An edit above a declaration changes its range but not its identity.
  const before = createSymbolId({ ...base });
  const after = createSymbolId({ ...base });
  assert.equal(before, after);
  assert.ok(!/\d+:\d+/.test(before), 'an id must not embed a line/column pair');

  assert.equal(normalizePath('src\\app.js'), 'src/app.js');
  assert.equal(normalizeQualifiedName('DBHandler::check'), 'DBHandler.check');
});

test('two overloads receive distinct, stable ids', () => {
  const allocator = createIdentityAllocator({ language: 'js' });
  const one = allocator.symbol({
    ...base,
    qualifiedName: 'open',
    disambiguator: createOverloadDisambiguator(['path']),
  });
  const two = allocator.symbol({
    ...base,
    qualifiedName: 'open',
    disambiguator: createOverloadDisambiguator(['path', 'encoding']),
  });

  assert.notEqual(one.symbolId, two.symbolId);
  assert.notEqual(one.identityKey, two.identityKey);

  const repeat = createIdentityAllocator({ language: 'js' });
  const oneAgain = repeat.symbol({
    ...base,
    qualifiedName: 'open',
    disambiguator: createOverloadDisambiguator(['path']),
  });
  const twoAgain = repeat.symbol({
    ...base,
    qualifiedName: 'open',
    disambiguator: createOverloadDisambiguator(['path', 'encoding']),
  });
  assert.equal(one.symbolId, oneAgain.symbolId);
  assert.equal(two.symbolId, twoAgain.symbolId);
});

test('same-named locals in different functions do not collide', () => {
  const first = createSymbolId({
    ...base,
    kind: 'variable',
    qualifiedName: 'alpha.i',
  });
  const second = createSymbolId({
    ...base,
    kind: 'variable',
    qualifiedName: 'beta.i',
  });
  assert.notEqual(first, second);
});

test('a shadowed inner scope differs from the outer scope', () => {
  const outer = createSymbolId({ ...base, kind: 'variable', qualifiedName: 'f.x' });
  const inner = createSymbolId({ ...base, kind: 'variable', qualifiedName: 'f.block.x' });
  assert.notEqual(outer, inner);
});

test('anonymous constructs are distinct and stable within a parent', () => {
  const first = createAnonymousDisambiguator(1);
  const second = createAnonymousDisambiguator(2);
  assert.equal(first, 'anon.1');
  assert.notEqual(first, second);
  assert.equal(
    createSymbolId({
      ...base,
      kind: 'lambda',
      qualifiedName: 'main.<anonymous>',
      disambiguator: first,
    }),
    createSymbolId({
      ...base,
      kind: 'lambda',
      qualifiedName: 'main.<anonymous>',
      disambiguator: first,
    }),
  );
});

test('a collision without an explicit disambiguator falls back to declaration order', () => {
  const firstRun = createIdentityAllocator({ language: 'js' });
  const first = firstRun.symbol({ ...base, qualifiedName: 'dupe' });
  const second = firstRun.symbol({ ...base, qualifiedName: 'dupe' });
  assert.notEqual(first.symbolId, second.symbolId);
  assert.match(second.symbolId, /#1$/);

  const secondRun = createIdentityAllocator({ language: 'js' });
  assert.equal(secondRun.symbol({ ...base, qualifiedName: 'dupe' }).symbolId, first.symbolId);
  assert.equal(secondRun.symbol({ ...base, qualifiedName: 'dupe' }).symbolId, second.symbolId);
});

test('identity keys expose the C-03 tuple and ids escape separators', () => {
  const key = createIdentityKey({
    path: 'src/a:b.js',
    kind: 'function',
    qualifiedName: 'a.b',
    disambiguator: 'arity1.int',
  });
  assert.equal(key, 'src/a:b.js|function|a.b|arity1.int');

  const id = createSymbolId({ ...base, path: 'src/a:b.js', qualifiedName: 'a::b' });
  assert.ok(id.includes('%3A'), 'a colon in the path must be escaped');
  assert.ok(id.includes('function:a.b'));
  assert.equal(createFileId('src/a:b.js'), 'file:src/a%3Ab.js');
});

test('relationship ids are deterministic and disambiguate repeated pairs', () => {
  const allocator = createRelationshipAllocator();
  const first = allocator.relationship({ type: 'calls', from: 'a', to: 'b' });
  const second = allocator.relationship({ type: 'calls', from: 'a', to: 'b' });
  const other = allocator.relationship({ type: 'calls', from: 'a', to: 'c' });
  assert.notEqual(first, second);
  assert.match(second, /#2$/);
  assert.notEqual(first, other);

  const repeat = createRelationshipAllocator();
  assert.equal(repeat.relationship({ type: 'calls', from: 'a', to: 'b' }), first);
});
