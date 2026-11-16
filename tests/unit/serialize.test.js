import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import { createMockAnalysis } from '../../src/adapters/mock/index.js';
import {
  canonicalRun,
  hashRun,
  parseRun,
  serializeRun,
  stableStringify,
} from '../../src/core/csr/serialize.js';

test('two runs over identical input serialize identically', () => {
  const first = createMockAnalysis();
  const second = createMockAnalysis();
  assert.equal(serializeRun(first), serializeRun(second));
  assert.equal(hashRun(first), hashRun(second));
  assert.match(hashRun(first), /^[a-f0-9]{16}$/);
});

test('collection order and extension key order do not affect the serialization', () => {
  const base = createMockAnalysis();
  const shuffled = createMockAnalysis();
  shuffled.files.reverse();
  shuffled.symbols.reverse();
  shuffled.relationships.reverse();
  shuffled.controlConstructs.reverse();
  shuffled.dataFacts.reverse();
  shuffled.diagnostics.reverse();

  // Same extension entries, different key insertion order.
  shuffled.symbols.find((symbol) => symbol.qualifiedName === 'DBHandler').extensions = {
    exported: true,
    z: 1,
    a: 2,
  };
  base.symbols.find((symbol) => symbol.qualifiedName === 'DBHandler').extensions = {
    a: 2,
    z: 1,
    exported: true,
  };

  assert.equal(serializeRun(shuffled), serializeRun(base));
});

test('timestamps and durations are metadata, not deterministic facts', () => {
  const base = createMockAnalysis();
  const timed = createMockAnalysis();
  timed.startedAt = '2026-01-01T00:00:00.000Z';
  timed.durationMs = 1234;
  assert.equal(serializeRun(timed), serializeRun(base));
  assert.equal(hashRun(timed), hashRun(base));
});

test('serialization round-trips ranges, evidence, and names byte-identically', () => {
  const run = createMockAnalysis();
  const json = serializeRun(run);
  const parsed = parseRun(json);
  assert.equal(parsed.ok, true, parsed.ok ? '' : JSON.stringify(parsed.issues));
  assert.equal(serializeRun(parsed.run), json);

  const originalMain = run.symbols.find((symbol) => symbol.name === 'main');
  const parsedMain = parsed.run.symbols.find((symbol) => symbol.name === 'main');
  assert.deepEqual(parsedMain.declaration, originalMain.declaration);

  const originalCall = run.relationships.find(
    (relationship) => relationship.status === 'resolved' && relationship.evidence.length > 0,
  );
  const parsedCall = parsed.run.relationships.find(
    (relationship) => relationship.relationshipId === originalCall.relationshipId,
  );
  assert.deepEqual(parsedCall.evidence, originalCall.evidence);

  const naive = parsed.run.symbols.find((symbol) => symbol.name === 'naïve');
  assert.ok(naive, 'non-ASCII identifiers survive serialization');
});

test('a changed range changes the hash', () => {
  const run = createMockAnalysis();
  const before = hashRun(run);
  run.symbols[0].declaration.endColumn += 1;
  assert.notEqual(hashRun(run), before);
});

test('stableStringify sorts object keys recursively', () => {
  assert.equal(stableStringify({ b: 1, a: { d: 2, c: 3 } }), '{"a":{"c":3,"d":2},"b":1}');
});

test('parseRun rejects truncated or invalid JSON with a typed result', () => {
  const truncated = parseRun('{"runId": "x"');
  assert.equal(truncated.ok, false);
  assert.equal(truncated.issues[0].path, '$');

  const wrongShape = parseRun('[]');
  assert.equal(wrongShape.ok, false);
});

test('the hash is identical in a fresh process', () => {
  const root = process.cwd();
  const script = [
    "const mock = await import('./src/adapters/mock/index.js');",
    "const serialize = await import('./src/core/csr/serialize.js');",
    'process.stdout.write(serialize.hashRun(mock.createMockAnalysis()));',
  ].join('\n');
  const output = execFileSync(process.execPath, ['--input-type=module', '-e', script], {
    cwd: root,
    encoding: 'utf8',
  });
  assert.equal(output.trim(), hashRun(createMockAnalysis()));
});

test('canonicalRun does not mutate its input', () => {
  const run = createMockAnalysis();
  const before = JSON.stringify(run);
  canonicalRun(run);
  assert.equal(JSON.stringify(run), before);
});
