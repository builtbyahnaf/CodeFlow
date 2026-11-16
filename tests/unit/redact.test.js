import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_FIELD_LENGTH,
  formatLogLine,
  redactFields,
  redactString,
  redactValue,
} from '../../src/core/log/redact.js';

test('masks values whose key looks secret', () => {
  const fields = redactFields({
    path: 'src/a.js',
    apiKey: 'abc123',
    Authorization: 'Bearer xyz',
    'session-token': 'zzz',
  });

  assert.equal(fields.path, 'src/a.js');
  assert.equal(fields.apiKey, '***');
  assert.equal(fields.Authorization, '***');
  assert.equal(fields['session-token'], '***');
});

test('masks token-shaped values even under innocent keys', () => {
  const line = redactString(
    'ghp_abcdefghijklmnopqrstuvwxyz0123456789 sk-abcdefghijklmnopqrstuvwxyz AKIAABCDEFGHIJKLMNOP',
  );
  assert.ok(!line.includes('ghp_abcdefghijklmnopqrstuvwxyz0123456789'));
  assert.ok(!line.includes('sk-abcdefghijklmnopqrstuvwxyz'));
  assert.ok(!line.includes('AKIAABCDEFGHIJKLMNOP'));
  assert.match(line, /gh\*_\*\*\*/);
});

test('truncates long values and reports how much was removed', () => {
  const long = 'a'.repeat(MAX_FIELD_LENGTH + 25);
  const result = redactString(long);
  assert.equal(result.length, MAX_FIELD_LENGTH + '…(+25 chars)'.length);
  assert.match(result, /…\(\+25 chars\)$/);
});

test('nested objects are redacted and depth-capped', () => {
  const value = redactValue({
    level1: {
      password: 'hunter2',
      level2: { token: 'abc', level3: { level4: { deep: true } } },
    },
  });

  assert.equal(value.level1.password, '***');
  assert.equal(value.level1.level2.token, '***');
  assert.equal(value.level1.level2.level3, '[object]');
});

test('errors, functions, and bigints are rendered safely', () => {
  assert.deepEqual(redactValue(new Error('failed with token ghp_abcdefghijklmnopqrstuvwxyz')), {
    name: 'Error',
    message: 'failed with token gh*_***',
  });
  assert.equal(
    redactValue(() => {}),
    '[function]',
  );
  assert.equal(redactValue(10n), '10n');
});

test('formatLogLine has a stable shape and no source text field', () => {
  const line = formatLogLine({
    level: 'warn',
    message: 'protocol.rejected',
    fields: { reason: 'unknown_kind', apiKey: 'secret' },
    timestamp: new Date('2026-01-02T03:04:05.000Z'),
  });

  assert.equal(
    line,
    '[2026-01-02T03:04:05.000Z] WARN  protocol.rejected {"reason":"unknown_kind","apiKey":"***"}',
  );
});

test('formatLogLine omits the field object when there are no fields', () => {
  const line = formatLogLine({
    level: 'info',
    message: 'extension.activated',
    timestamp: new Date('2026-01-02T03:04:05.000Z'),
  });
  assert.equal(line, '[2026-01-02T03:04:05.000Z] INFO  extension.activated');
});
