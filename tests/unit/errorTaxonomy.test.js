import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  ERROR_TAXONOMY,
  describeError,
} from '../../src/core/errors/index.js';

describe('Error Taxonomy Audit (P12-16, AC-12.10)', () => {
  it('covers all standard error codes with user message, severity, and recovery action', () => {
    const validSeverities = new Set(['error', 'warn', 'info']);
    const codes = Object.keys(ERROR_TAXONOMY);
    assert.ok(codes.length >= 13, `Expected at least 13 error codes, found ${codes.length}`);

    for (const code of codes) {
      const entry = ERROR_TAXONOMY[code];
      assert.equal(entry.code, code);
      assert.ok(entry.userMessage.length >= 10, `userMessage for ${code} must be descriptive`);
      assert.ok(validSeverities.has(entry.severity), `severity for ${code} must be valid`);
      assert.ok(entry.recoveryAction.length >= 5, `recoveryAction for ${code} must be actionable`);
    }
  });

  it('describeError returns registered entry for known code', () => {
    const entry = describeError('E_TIMEOUT');
    assert.equal(entry.code, 'E_TIMEOUT');
    assert.equal(entry.severity, 'warn');
    assert.ok(entry.recoveryAction.includes('Increase timeoutMs'));
  });

  it('describeError falls back safely for unregistered codes', () => {
    const fallback = describeError('E_NONEXISTENT');
    assert.equal(fallback.code, 'E_NONEXISTENT');
    assert.equal(fallback.severity, 'error');
    assert.ok(fallback.userMessage.includes('E_NONEXISTENT'));
    assert.ok(fallback.recoveryAction.length > 0);
  });
});
