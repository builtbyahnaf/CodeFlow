import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateSettingValue,
} from '../../src/extension/settings/index.js';

describe('Settings Validator & Safe Fallbacks (P12-11, AC-12.13)', () => {
  it('validates boolean settings and rejects non-booleans with default fallback', () => {
    const valid = validateSettingValue('codeflow.preview.enabled', false);
    assert.equal(valid.valid, true);
    assert.equal(valid.clampedValue, false);

    const invalid = validateSettingValue('codeflow.preview.enabled', 'yes');
    assert.equal(invalid.valid, false);
    assert.equal(invalid.clampedValue, true); // fallback to default
    assert.ok(invalid.issue?.includes('Expected boolean'));
  });

  it('clamps number settings within min/max bounds', () => {
    // delayMs bounds: min 0, max 2000
    const clampedUnder = validateSettingValue('codeflow.preview.delayMs', -50);
    assert.equal(clampedUnder.valid, false);
    assert.equal(clampedUnder.clampedValue, 0);

    const clampedOver = validateSettingValue('codeflow.preview.delayMs', 5000);
    assert.equal(clampedOver.valid, false);
    assert.equal(clampedOver.clampedValue, 2000);

    const valid = validateSettingValue('codeflow.preview.delayMs', 500);
    assert.equal(valid.valid, true);
    assert.equal(valid.clampedValue, 500);
  });

  it('validates enum string settings and rejects unknown options', () => {
    const valid = validateSettingValue('codeflow.logLevel', 'debug');
    assert.equal(valid.valid, true);
    assert.equal(valid.clampedValue, 'debug');

    const invalid = validateSettingValue('codeflow.logLevel', 'verbose');
    assert.equal(invalid.valid, false);
    assert.equal(invalid.clampedValue, 'warn'); // fallback to default
  });

  it('falls back to default for null and undefined without issue', () => {
    const undef = validateSettingValue('codeflow.index.debounceMs', undefined);
    assert.equal(undef.valid, true);
    assert.equal(undef.clampedValue, 350);

    const nul = validateSettingValue('codeflow.preview.maxLines', null);
    assert.equal(nul.valid, true);
    assert.equal(nul.clampedValue, 12);
  });

  it('handles unknown settings gracefully', () => {
    const res = validateSettingValue('codeflow.unknown.setting', 42);
    assert.equal(res.valid, false);
    assert.ok(res.issue?.includes('Unknown setting'));
  });
});
