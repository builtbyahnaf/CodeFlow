import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  C_ADAPTER_ID,
  C_ADAPTER_VERSION,
  C_EXTENSIONS,
  cAdapter,
} from '../../src/adapters/c/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';

describe('C Language Adapter Contract (P13-01, AC-13.1)', () => {
  it('declares correct adapter identity, version, and language', () => {
    assert.equal(cAdapter.id, C_ADAPTER_ID);
    assert.equal(cAdapter.id, 'c-clang');
    assert.equal(cAdapter.version, C_ADAPTER_VERSION);
    assert.deepEqual(cAdapter.languages, ['c']);
  });

  it('declares exact C file extensions (.c, .h)', () => {
    assert.deepEqual(C_EXTENSIONS, ['.c', '.h']);
    assert.ok(cAdapter.extensions.includes('.c'));
    assert.ok(cAdapter.extensions.includes('.h'));
    assert.equal(cAdapter.extensions.includes('.cpp'), false);
    assert.equal(cAdapter.extensions.includes('.js'), false);
  });

  it('registers into createAdapterRegistry and resolves .c and .h files', () => {
    const registry = createAdapterRegistry();
    registry.register(cAdapter);

    assert.equal(registry.resolve('src/main.c')?.id, C_ADAPTER_ID);
    assert.equal(registry.resolve('include/header.h')?.id, C_ADAPTER_ID);
  });

  it('declares honest capabilities (CFG true, DFG false, parse partial)', () => {
    assert.equal(cAdapter.capabilities.generateCFG, true);
    assert.equal(cAdapter.capabilities.generateDFG, false);
    assert.equal(cAdapter.capabilities.parse, 'partial');
    assert.equal(cAdapter.capabilities.discoverDeclarations, true);
    assert.equal(cAdapter.capabilities.reportDiagnostics, true);
  });
});
