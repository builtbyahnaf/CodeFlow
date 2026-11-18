import test from 'node:test';
import assert from 'node:assert/strict';

import { runConformanceSuite } from './harness.js';

/**
 * A deliberately hostile adapter: valid enough to reach validation, invalid
 * enough that several rules must fail with a specific citation. It exists to
 * prove the conformance suite fails loudly instead of rubber-stamping.
 *
 * @type {import('../../src/core/adapterRegistry.js').AdapterDescriptor}
 */
const hostileAdapter = {
  id: 'hostile',
  displayName: 'Hostile conformance fixture',
  version: '0.0.0',
  languages: ['mock'],
  extensions: ['.hostile'],
  capabilities: {
    parse: true,
    discoverDeclarations: true,
    resolveSymbols: true,
    resolveCalls: true,
    resolveTypes: false,
    generateCFG: false,
    generateDFG: false,
    resolveImports: false,
    mapSourceLocations: false,
    reportDiagnostics: false,
  },
  analyze(input) {
    return {
      runId: input.runId,
      adapterId: 'hostile',
      adapterVersion: '0.0.0',
      language: 'mock',
      csrVersion: '1.1.0',
      scope: { kind: 'workspace' },
      completeness: 'full',
      files: [],
      symbols: [
        {
          symbolId: 'symbol:hostile:dupe',
          kind: 'hologram',
          name: 'dupe',
          qualifiedName: 'dupe',
          language: 'mock',
          declaration: {
            fileId: 'file:missing.js',
            startLine: 0,
            startColumn: 0,
            endLine: 0,
            endColumn: 1,
          },
        },
        {
          symbolId: 'symbol:hostile:dupe',
          kind: 'function',
          name: 'dupe',
          qualifiedName: 'dupe',
          language: 'mock',
          declaration: {
            fileId: 'file:missing.js',
            startLine: 0,
            startColumn: 0,
            endLine: 0,
            endColumn: 1,
          },
        },
      ],
      relationships: [
        {
          relationshipId: 'rel:hostile:1',
          type: 'calls',
          from: 'symbol:hostile:dupe',
          to: 'symbol:hostile:nowhere',
          status: 'possible',
        },
      ],
      controlConstructs: [],
      dataFacts: [],
      diagnostics: [],
    };
  },
};

test('a hostile adapter fails conformance with specific rule citations', async () => {
  const suite = await runConformanceSuite({
    name: 'hostile',
    adapter: hostileAdapter,
    fixturePath: 'sample.hostile',
  });

  assert.equal(suite.passed, false);
  const byId = new Map(suite.results.map((entry) => [entry.id, entry]));

  const shape = byId.get('C-01');
  assert.equal(shape.passed, false);
  assert.match(shape.detail, /E_VALIDATION/);
  assert.match(shape.detail, /symbols\[0\]\.kind|Unknown symbol kind/);

  const provenance = byId.get('C-02');
  assert.equal(provenance.passed, false);
  assert.match(provenance.detail, /unknown file/);

  const identity = byId.get('C-03');
  assert.equal(identity.passed, false);
  assert.match(identity.detail, /duplicate symbolId/);

  const status = byId.get('C-04');
  assert.equal(status.passed, false);
  assert.match(status.detail, /reasonCode/);

  // Fault isolation and cancellation are registry behaviour, not adapter
  // behaviour, so they still pass for a hostile fixture.
  assert.equal(byId.get('C-07').passed, true);
  assert.equal(byId.get('C-08').passed, true);
});
