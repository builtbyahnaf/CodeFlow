import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  javaAdapter,
  JAVA_JDK_PACKAGES,
} from '../../src/adapters/java/index.js';

const source = await fs.readFile(new URL('../fixtures/java/basic.java', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/java/ast-basic.json', import.meta.url), 'utf8');

describe('Java Packages & Imports (P14-07, AC-14.5)', () => {
  const run = javaAdapter.analyze({
    runId: 'run:java-pkg',
    path: 'src/BasicDemo.java',
    text: source,
    javaAst: ast,
    javaMode: 'compile-db',
  });

  it('JAVA_JDK_PACKAGES catalogs standard Java SDK packages', () => {
    assert.ok(JAVA_JDK_PACKAGES.has('java.util'));
    assert.ok(JAVA_JDK_PACKAGES.has('java.io'));
    assert.ok(JAVA_JDK_PACKAGES.has('java.time'));
    assert.equal(JAVA_JDK_PACKAGES.has('com.example'), false);
  });

  it('maps package declaration to namespace symbol', () => {
    const pkgSym = run.symbols.find((s) => s.kind === 'namespace');
    assert.ok(pkgSym);
    assert.equal(pkgSym.qualifiedName, 'com.example.basic');
  });

  it('maps imports relationships for external and JDK libraries', () => {
    const importRel = run.relationships.find(
      (r) => r.type === 'imports' && r.to.includes('java.util.List'),
    );
    assert.ok(importRel, 'Import for java.util.List must exist');
    assert.equal(importRel.status, 'unresolved');
    assert.equal(importRel.reasonCode, 'external_package');
  });
});
