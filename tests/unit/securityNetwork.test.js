import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { createQueryLayer } from '../../src/core/csr/query.js';
import { createExplanationEngine } from '../../src/core/explanation/engine.js';

describe('Network Isolation & Zero-Upload Guard (Phase 12 §9, P12-19, AC-12.1, AC-12.11)', () => {
  it('performs end-to-end analysis and explanation with exactly ZERO network calls', () => {
    let networkAttempts = 0;
    const recordedTargets = [];

    // Save originals
    const origHttpRequest = http.request;
    const origHttpGet = http.get;
    const origHttpsRequest = https.request;
    const origHttpsGet = https.get;
    const origNetConnect = net.connect;
    const origFetch = globalThis.fetch;

    const trap = (target) => {
      networkAttempts++;
      recordedTargets.push(target);
      throw new Error(`SECURITY VIOLATION: Unauthorized network call attempted: ${target}`);
    };

    try {
      // Install traps
      http.request = () => trap('http.request');
      http.get = () => trap('http.get');
      https.request = () => trap('https.request');
      https.get = () => trap('https.get');
      net.connect = () => trap('net.connect');
      if (typeof globalThis.fetch === 'function') {
        globalThis.fetch = () => trap('fetch');
      }

      // Execute real AST -> CSR analysis
      const sampleJs = `
        function processTelemetry(items, flag) {
          let total = 0;
          for (let i = 0; i < items.length; i++) {
            if (flag) {
              total += items[i].value;
            } else {
              total -= 1;
            }
          }
          return total;
        }
      `;

      const run = javascriptAdapter.analyze({
        runId: 'run:net-guard',
        path: 'src/analytics.js',
        text: sampleJs,
      });

      assert.ok(run);
      assert.ok(run.symbols.length > 0);

      const query = createQueryLayer(run, { capabilities: javascriptAdapter.capabilities });
      const funcSymbol = run.symbols.find((s) => s.name === 'processTelemetry');
      assert.ok(funcSymbol);

      // Execute CFG builder
      const cfgRes = buildCfg(query, funcSymbol.symbolId);
      assert.ok(cfgRes.cfg);
      assert.ok(cfgRes.cfg.nodes.length > 0);

      // Execute Explanation builder
      const engine = createExplanationEngine();
      const explanation = engine.explainFunction({
        query,
        cfg: cfgRes.cfg,
        depth: 3,
      });
      assert.equal(explanation.ok, true);
      assert.ok(explanation.items.length > 0);

      // Assert zero calls attempted
      assert.equal(networkAttempts, 0, `Expected 0 network calls, recorded: ${recordedTargets.join(', ')}`);
    } finally {
      // Restore originals
      http.request = origHttpRequest;
      http.get = origHttpGet;
      https.request = origHttpsRequest;
      https.get = origHttpsGet;
      net.connect = origNetConnect;
      globalThis.fetch = origFetch;
    }
  });
});
