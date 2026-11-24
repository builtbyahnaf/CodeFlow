import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  JAVA_ADAPTER_ID,
  JAVA_ADAPTER_VERSION,
  JAVA_EXTENSIONS,
  javaAdapter,
} from '../../src/adapters/java/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';

describe('Java Language Adapter Contract (P14-01, AC-14.1)', () => {
  it('declares correct adapter identity, version, and language', () => {
    assert.equal(javaAdapter.id, JAVA_ADAPTER_ID);
    assert.equal(javaAdapter.id, 'java-ast');
    assert.equal(javaAdapter.version, JAVA_ADAPTER_VERSION);
    assert.deepEqual(javaAdapter.languages, ['java']);
  });

  it('declares exact Java file extensions (.java)', () => {
    assert.deepEqual(JAVA_EXTENSIONS, ['.java']);
    assert.ok(javaAdapter.extensions.includes('.java'));
    assert.equal(javaAdapter.extensions.includes('.cpp'), false);
    assert.equal(javaAdapter.extensions.includes('.c'), false);
    assert.equal(javaAdapter.extensions.includes('.js'), false);
  });

  it('registers into createAdapterRegistry and resolves .java files', () => {
    const registry = createAdapterRegistry();
    registry.register(javaAdapter);

    assert.equal(registry.resolve('src/Main.java')?.id, JAVA_ADAPTER_ID);
    assert.equal(registry.resolve('com/example/Service.java')?.id, JAVA_ADAPTER_ID);
  });

  it('declares honest capabilities (CFG true, DFG false, parse partial)', () => {
    assert.equal(javaAdapter.capabilities.generateCFG, true);
    assert.equal(javaAdapter.capabilities.generateDFG, false);
    assert.equal(javaAdapter.capabilities.parse, 'partial');
    assert.equal(javaAdapter.capabilities.discoverDeclarations, true);
    assert.equal(javaAdapter.capabilities.reportDiagnostics, true);
  });
});
