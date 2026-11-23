import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveWorkspacePath } from '../../src/extension/sourcePaths.js';

const root = 'C:\\work\\project';

test('a safe relative path resolves inside the workspace', () => {
  const result = resolveWorkspacePath(root, 'src/app.js', 'win32');
  assert.equal(result.ok, true);
  assert.equal(result.absolutePath, 'C:\\work\\project\\src\\app.js');
  assert.equal(result.relativePath, 'src/app.js');
});

test('forward slashes and backslashes both resolve', () => {
  const forward = resolveWorkspacePath(root, 'src/lib/app.js', 'win32');
  const backward = resolveWorkspacePath(root, 'src\\lib\\app.js', 'win32');
  assert.equal(forward.ok, true);
  assert.equal(backward.ok, true);
  assert.equal(forward.absolutePath, backward.absolutePath);
});

test('traversal is rejected before any read', () => {
  for (const value of ['../secret.txt', 'src/../../secret.txt', '..\\..\\secret.txt']) {
    const result = resolveWorkspacePath(root, value, 'win32');
    assert.equal(result.ok, false, value);
    assert.equal(result.code, 'E_PATH');
  }
});

test('absolute paths outside the workspace are rejected', () => {
  const result = resolveWorkspacePath(root, 'C:\\Windows\\System32\\drivers\\etc\\hosts', 'win32');
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_PATH');
});

test('absolute paths inside the workspace are accepted and normalized', () => {
  const result = resolveWorkspacePath(root, 'C:\\work\\project\\src\\app.js', 'win32');
  assert.equal(result.ok, true);
  assert.equal(result.relativePath, 'src/app.js');
});

test('a missing workspace root is a typed failure', () => {
  for (const value of ['', null, undefined]) {
    const result = resolveWorkspacePath(value, 'src/app.js', 'win32');
    assert.equal(result.ok, false);
    assert.equal(result.code, 'E_WORKSPACE');
  }
});

test('NUL bytes and overlong paths are rejected', () => {
  assert.equal(resolveWorkspacePath(root, 'src/app\u0000.js', 'win32').code, 'E_PATH');
  assert.equal(resolveWorkspacePath(root, 'a'.repeat(2_049), 'win32').code, 'E_PATH');
  assert.equal(resolveWorkspacePath(root, '', 'win32').code, 'E_PATH');
});

test('posix roots follow the same containment rules', () => {
  const posix = resolveWorkspacePath('/home/me/project', 'src/app.js', 'linux');
  assert.equal(posix.ok, true);
  assert.equal(posix.absolutePath, '/home/me/project/src/app.js');
  assert.equal(resolveWorkspacePath('/home/me/project', '../other/app.js', 'linux').ok, false);
});
