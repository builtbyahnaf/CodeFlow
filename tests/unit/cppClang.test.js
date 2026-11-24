import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MIN_CLANG_MAJOR,
  defaultClangCandidates,
  discoverClang,
  parseClangVersion,
} from '../../src/extension/cpp/clang.js';

test('clang version strings are parsed for the common distributions', () => {
  assert.deepEqual(parseClangVersion('clang version 18.1.8 (https://llvm.org)'), {
    version: '18.1.8',
    major: 18,
  });
  assert.deepEqual(parseClangVersion('Apple clang version 15.0.0 (clang-1500.3.9.4)'), {
    version: '15.0.0',
    major: 15,
  });
  assert.deepEqual(parseClangVersion('clang-cl version 16.0.0'), { version: '16.0.0', major: 16 });
  assert.equal(parseClangVersion('gcc version 13.2.0'), null);
  assert.equal(parseClangVersion(undefined), null);
});

test('the configured compiler is probed before PATH candidates', async () => {
  const calls = [];
  const result = await discoverClang({
    configuredPath: 'C:/tools/llvm/bin/clang++.exe',
    candidates: ['clang++'],
    runTool: async ({ command }) => {
      calls.push(command);
      if (command === 'C:/tools/llvm/bin/clang++.exe') {
        return { ok: true, exitCode: 0, stdout: 'clang version 18.1.0', stderr: '' };
      }
      throw new Error('the fallback must not be probed');
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.clang.path, 'C:/tools/llvm/bin/clang++.exe');
  assert.equal(result.clang.compatible, true);
  assert.deepEqual(calls, ['C:/tools/llvm/bin/clang++.exe']);
});

test('discovery falls through candidates that do not answer', async () => {
  const result = await discoverClang({
    candidates: ['missing-clang', 'clang++'],
    runTool: async ({ command }) =>
      command === 'clang++'
        ? { ok: true, exitCode: 0, stdout: 'clang version 17.0.6', stderr: '' }
        : { ok: false, code: 'E_TOOL_NOT_FOUND', message: 'missing' },
  });
  assert.equal(result.ok, true);
  assert.equal(result.clang.path, 'clang++');
});

test('a tool that exits non-zero is not treated as Clang', async () => {
  const result = await discoverClang({
    candidates: ['not-clang'],
    runTool: async () => ({ ok: true, exitCode: 1, stdout: 'usage: not-clang', stderr: '' }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
  assert.match(result.message, /codeflow\.cpp\.clangPath/);
});

test('an old Clang is usable but returns a version warning', async () => {
  const result = await discoverClang({
    candidates: ['clang++'],
    runTool: async () => ({
      ok: true,
      exitCode: 0,
      stdout: `clang version ${MIN_CLANG_MAJOR - 1}.0.0`,
      stderr: '',
    }),
  });
  assert.equal(result.ok, true);
  assert.equal(result.clang.compatible, false);
  assert.equal(result.warning.code, 'toolchain_version_mismatch');
});

test('no toolchain produces an actionable E_UNSUPPORTED result', async () => {
  const result = await discoverClang({
    candidates: ['clang++'],
    runTool: async () => ({ ok: false, code: 'E_TOOL_NOT_FOUND', message: 'missing' }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
  assert.match(result.message, /never runs your build system/i);
});

test('platform candidates match the host conventions', () => {
  const win = defaultClangCandidates('win32');
  assert.ok(win.includes('clang++.exe'));
  assert.ok(win.includes('clang.exe'));
  assert.ok(win.includes('clang-cl.exe'));
  assert.ok(win.some((c) => c.includes('LLVM')));
  assert.ok(win.some((c) => c.includes('msys64')));

  const linux = defaultClangCandidates('linux');
  assert.ok(linux.includes('clang++'));
  assert.ok(linux.includes('clang'));
  assert.ok(linux.includes('/usr/bin/clang++'));

  const darwin = defaultClangCandidates('darwin');
  assert.ok(darwin.includes('clang++'));
  assert.ok(darwin.includes('clang'));
  assert.ok(darwin.includes('/opt/homebrew/bin/clang++'));
});
