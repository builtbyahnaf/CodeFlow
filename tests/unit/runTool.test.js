import test from 'node:test';
import assert from 'node:assert/strict';

import { runTool } from '../../src/extension/tooling/runTool.js';

const node = process.execPath;

test('a successful tool returns stdout, stderr and exit code', async () => {
  const result = await runTool({
    command: node,
    args: ['-e', "process.stdout.write('out'); process.stderr.write('err')"],
  });
  assert.equal(result.ok, true);
  assert.equal(result.stdout, 'out');
  assert.equal(result.stderr, 'err');
  assert.equal(result.exitCode, 0);
  assert.ok(result.durationMs >= 0);
});

test('a non-zero exit is reported as a result, not a rejection', async () => {
  const result = await runTool({
    command: node,
    args: ['-e', 'process.exit(3)'],
  });
  assert.equal(result.ok, true);
  assert.equal(result.exitCode, 3);
});

test('a missing tool returns E_TOOL_NOT_FOUND', async () => {
  const result = await runTool({ command: 'codeflow-tool-that-does-not-exist', args: [] });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_TOOL_NOT_FOUND');
  assert.match(result.message, /was not found/);
});

test('a hung tool is killed at the timeout with E_TOOL_TIMEOUT', async () => {
  const result = await runTool({
    command: node,
    args: ['-e', 'setTimeout(() => {}, 10000)'],
    timeoutMs: 150,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_TOOL_TIMEOUT');
});

test('output beyond the cap is rejected with E_TOOL_LIMIT', async () => {
  const result = await runTool({
    command: node,
    args: ['-e', "process.stdout.write('x'.repeat(5000))"],
    maxOutputBytes: 1000,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_TOOL_LIMIT');
  assert.match(result.message, /output cap/);
});

test('an aborted signal cancels the tool and keeps partial output', async () => {
  const controller = new globalThis.AbortController();
  const pending = runTool({
    command: node,
    args: ['-e', "process.stdout.write('start'); setTimeout(() => {}, 10000)"],
    signal: controller.signal,
    timeoutMs: 5000,
  });
  setTimeout(() => controller.abort(), 100);
  const result = await pending;
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CANCELLED');
  assert.equal(result.stdout, 'start');
});

test('an already-aborted signal never starts the tool', async () => {
  const controller = new globalThis.AbortController();
  controller.abort();
  const result = await runTool({ command: node, args: ['-e', '1'], signal: controller.signal });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_CANCELLED');
});

test('invalid options are rejected without spawning', async () => {
  assert.equal((await runTool({ command: '' })).code, 'E_TOOL_ERROR');
  assert.equal(
    (await runTool({ command: node, args: /** @type {any} */ ('nope') })).code,
    'E_TOOL_ERROR',
  );
  assert.equal((await runTool({ command: node, timeoutMs: 0 })).code, 'E_TOOL_ERROR');
  assert.equal((await runTool({ command: node, maxOutputBytes: -1 })).code, 'E_TOOL_ERROR');
});

test('the child environment is restricted to an allowlist plus explicit extras', async () => {
  const result = await runTool({
    command: node,
    args: ['-e', 'process.stdout.write(JSON.stringify(process.env))'],
    env: { CODEFLOW_TEST_VALUE: 'kept' },
  });
  assert.equal(result.ok, true);
  const env = JSON.parse(result.stdout);
  assert.equal(env.CODEFLOW_TEST_VALUE, 'kept');
  // A variable that exists in the parent but is not allowlisted must be gone.
  process.env.CODEFLOW_SHOULD_NOT_LEAK = 'secret';
  try {
    const second = await runTool({
      command: node,
      args: ['-e', 'process.stdout.write(JSON.stringify(process.env))'],
    });
    const secondEnv = JSON.parse(second.stdout);
    assert.equal(secondEnv.CODEFLOW_SHOULD_NOT_LEAK, undefined);
  } finally {
    delete process.env.CODEFLOW_SHOULD_NOT_LEAK;
  }
});
