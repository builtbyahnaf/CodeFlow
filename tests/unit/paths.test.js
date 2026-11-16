import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PathSafetyError,
  isAbsoluteAnywhere,
  isPathInside,
  isSafeRelativePath,
  toWorkspaceRelative,
} from '../../src/extension/security/paths.js';

test('detects containment on POSIX paths', () => {
  assert.equal(isPathInside('/ws', '/ws/src/a.js', 'linux'), true);
  assert.equal(isPathInside('/ws', '/ws', 'linux'), true);
  assert.equal(isPathInside('/ws', '/ws-other/a.js', 'linux'), false);
  assert.equal(isPathInside('/ws', '/etc/passwd', 'linux'), false);
  assert.equal(isPathInside('/ws', '/ws/../etc/passwd', 'linux'), false);
});

test('detects containment on Windows paths, case-insensitively', () => {
  assert.equal(isPathInside('C:\\ws', 'C:\\ws\\src\\a.cpp', 'win32'), true);
  assert.equal(isPathInside('C:\\ws', 'c:\\WS\\src\\a.cpp', 'win32'), true);
  assert.equal(isPathInside('C:\\ws', 'C:\\ws2\\a.cpp', 'win32'), false);
  assert.equal(isPathInside('C:\\ws', 'D:\\ws\\a.cpp', 'win32'), false);
  assert.equal(isPathInside('C:\\ws', 'C:\\ws\\..\\Windows\\system32', 'win32'), false);
});

test('isPathInside rejects null bytes and non-strings', () => {
  assert.equal(isPathInside('/ws', '/ws/a\u0000b', 'linux'), false);
  assert.equal(isPathInside(undefined, '/ws/a', 'linux'), false);
  assert.equal(isPathInside('/ws', 42, 'linux'), false);
});

test('isAbsoluteAnywhere recognises Windows and POSIX absolute paths', () => {
  for (const value of ['C:\\x', 'c:/x', '\\\\server\\share', '//server/share', '/x']) {
    assert.equal(isAbsoluteAnywhere(value), true, `expected "${value}" to be absolute`);
  }
  for (const value of ['src/a.js', './a', '../a', 'a/b']) {
    assert.equal(isAbsoluteAnywhere(value), false, `expected "${value}" to be relative`);
  }
});

test('toWorkspaceRelative produces forward-slash relative paths', () => {
  assert.equal(toWorkspaceRelative('/ws', '/ws/src/a.js', 'linux'), 'src/a.js');
  assert.equal(
    toWorkspaceRelative('C:\\ws', 'C:\\ws\\src\\deep\\a.cpp', 'win32'),
    'src/deep/a.cpp',
  );
});

test('toWorkspaceRelative refuses to escape the workspace', () => {
  assert.throws(
    () => toWorkspaceRelative('/ws', '/etc/passwd', 'linux'),
    (error) => {
      assert.ok(error instanceof PathSafetyError);
      assert.equal(error.code, 'E_PATH');
      return true;
    },
  );
  assert.throws(() => toWorkspaceRelative('C:\\ws', 'D:\\x', 'win32'), PathSafetyError);
});

test('isSafeRelativePath accepts ordinary workspace paths', () => {
  for (const value of ['a.js', 'src/a.js', 'src/deep/nested/a.cpp', 'vendor/x-1.2/y.js']) {
    assert.equal(isSafeRelativePath(value), true, `expected "${value}" to be safe`);
  }
});

test('isSafeRelativePath rejects traversal, absolute, and unprintable input', () => {
  const unsafe = [
    '',
    '/abs/path',
    'C:/abs/path',
    '\\\\server\\share\\x',
    '../escape',
    'src/../../escape',
    './a',
    'src/./a',
    'src\\a',
    'a\u0000b',
    'x'.repeat(1100),
  ];
  for (const value of unsafe) {
    assert.equal(isSafeRelativePath(value), false, `expected "${value}" to be rejected`);
  }
});
