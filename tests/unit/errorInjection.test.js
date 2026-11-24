import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { containError } from '../../src/extension/errorContainment.js';

describe('Failure Injection & Crash Containment (Phase 12 §8, P12-16, AC-12.4, AC-12.10)', () => {
  // The 12 mandatory failure injection scenarios per context/Phase-12-UX-Hardening.md §8
  const scenarios = [
    {
      id: 1,
      name: 'Protocol version mismatch',
      error: Object.assign(new Error('Incompatible protocol version 99'), { code: 'E_PROTOCOL' }),
      expectedCode: 'E_PROTOCOL',
    },
    {
      id: 2,
      name: 'Malformed request payload',
      error: Object.assign(new Error('Missing required field: symbolId'), { code: 'E_VALIDATION' }),
      expectedCode: 'E_VALIDATION',
    },
    {
      id: 3,
      name: 'Handler execution timeout',
      error: Object.assign(new Error('Clang timed out after 60000ms'), { code: 'E_TIMEOUT' }),
      expectedCode: 'E_TIMEOUT',
    },
    {
      id: 4,
      name: 'Missing symbol target',
      error: Object.assign(new Error('Symbol sym_999 not found in graph'), { code: 'E_VALIDATION' }),
      expectedCode: 'E_VALIDATION',
    },
    {
      id: 5,
      name: 'Parse failure / adapter error',
      error: Object.assign(new Error('Unexpected token in source file'), { code: 'E_PARSE' }),
      expectedCode: 'E_PARSE',
    },
    {
      id: 6,
      name: 'Stale source document edit',
      error: Object.assign(new Error('Source file modified since analysis'), { code: 'E_STALE' }),
      expectedCode: 'E_STALE',
    },
    {
      id: 7,
      name: 'Analysis budget / line limit exceeded',
      error: Object.assign(new Error('File exceeds 20000 lines budget'), { code: 'E_LIMIT' }),
      expectedCode: 'E_LIMIT',
    },
    {
      id: 8,
      name: 'Unmodeled language construct (eval, dynamic import)',
      error: Object.assign(new Error('Dynamic eval construct cannot be statically resolved'), { code: 'E_UNSUPPORTED' }),
      expectedCode: 'E_UNSUPPORTED',
    },
    {
      id: 9,
      name: 'Request cancellation in flight',
      error: Object.assign(new Error('Operation cancelled by subsequent selection'), { code: 'E_CANCELLED' }),
      expectedCode: 'E_CANCELLED',
    },
    {
      id: 10,
      name: 'Index lock acquisition failure',
      error: Object.assign(new Error('Index currently locked by background re-index'), { code: 'E_INDEX_LOCK' }),
      expectedCode: 'E_INDEX_LOCK',
    },
    {
      id: 11,
      name: 'Memory ceiling / DTO cache exhaustion',
      error: Object.assign(new Error('Cache ceiling reached, evicting cold entries'), { code: 'E_MEMORY_CEILING' }),
      expectedCode: 'E_MEMORY_CEILING',
    },
    {
      id: 12,
      name: 'Corrupt or unparseable settings JSON',
      error: Object.assign(new Error('Invalid setting format for codeflow.logLevel'), { code: 'E_VALIDATION' }),
      expectedCode: 'E_VALIDATION',
    },
  ];

  for (const scenario of scenarios) {
    it(`scenario ${scenario.id}: cleanly contains ${scenario.name}`, () => {
      const contained = containError(scenario.error);
      assert.equal(contained.ok, false);
      assert.equal(contained.code, scenario.expectedCode);
      assert.ok(contained.message.length > 0);
      assert.ok(['error', 'warn', 'info'].includes(contained.severity));
      assert.ok(contained.recoveryAction.length > 0);
    });
  }

  it('handles completely unhandled throws (strings, null, plain objects)', () => {
    const strError = containError('Raw string error');
    assert.equal(strError.ok, false);
    assert.equal(strError.code, 'E_INTERNAL');

    const nullError = containError(null);
    assert.equal(nullError.ok, false);
    assert.equal(nullError.code, 'E_INTERNAL');

    const objError = containError({ message: 'Custom object throw' });
    assert.equal(objError.ok, false);
    assert.equal(objError.code, 'E_INTERNAL');
  });
});
