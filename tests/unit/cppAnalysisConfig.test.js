import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import {
  buildClangArgs,
  decideAnalysisConfig,
  describeConfig,
  sanitizeFlags,
  standardForFile,
} from '../../src/extension/cpp/analysisConfig.js';

const workspaceRoot = path.join(path.sep, 'work');
const absoluteFile = path.join(workspaceRoot, 'src', 'main.cpp');

test('a matching compile-database entry is used verbatim', () => {
  const config = decideAnalysisConfig({
    absoluteFile,
    compileDb: {
      path: 'compile_commands.json',
      entries: [
        {
          directory: workspaceRoot,
          absoluteFile,
          path: 'src/main.cpp',
          arguments: ['clang++', '-std=c++20', '-Iinclude', '-c', 'src/main.cpp'],
          flags: ['-std=c++20', '-Iinclude'],
        },
      ],
    },
  });
  assert.equal(config.mode, 'compile-db');
  assert.deepEqual(config.flags, ['-std=c++20', '-Iinclude']);
  assert.deepEqual(config.warnings, []);
});

test('a file without an entry degrades to heuristic mode with a warning', () => {
  const config = decideAnalysisConfig({
    absoluteFile,
    compileDb: { path: 'compile_commands.json', entries: [] },
    settings: { defines: ['DEBUG'], includePaths: ['include'], standard: 'c++20' },
  });
  assert.equal(config.mode, 'heuristic');
  assert.deepEqual(config.flags, ['-std=c++20', '-DDEBUG', '-Iinclude']);
  assert.equal(config.warnings[0].code, 'missing_compile_db');
  assert.match(config.warnings[0].message, /system headers/);
});

test('the default standard depends on the file kind', () => {
  assert.equal(standardForFile('a.cpp'), 'c++17');
  assert.equal(standardForFile('a.c'), 'c11');
  assert.equal(standardForFile('a.h'), 'c11');
});

test('dangerous flags are removed before Clang is invoked', () => {
  assert.deepEqual(
    sanitizeFlags([
      '-std=c++17',
      '-fplugin=/tmp/evil.so',
      '-Xclang',
      '-load',
      '-Xclang',
      '/tmp/evil.so',
      '@/tmp/args',
      '-Include',
      '-fsanitize=address',
    ]),
    ['-std=c++17', '-Include', '-fsanitize=address'],
  );
});

test('argv is an array with AST JSON enabled and the source last', () => {
  const args = buildClangArgs({
    absoluteFile,
    config: {
      mode: 'compile-db',
      flags: ['-Iinclude', '-DDEBUG'],
      entry: null,
      warnings: [],
    },
  });
  assert.deepEqual(args, [
    '-std=c++17',
    '-fsyntax-only',
    '-Xclang',
    '-ast-dump=json',
    '-Iinclude',
    '-DDEBUG',
    absoluteFile,
  ]);
  assert.equal(args[args.length - 1], absoluteFile);
});

test('an explicit -std is not duplicated', () => {
  const args = buildClangArgs({
    absoluteFile,
    config: { mode: 'compile-db', flags: ['-std=c++20'], entry: null, warnings: [] },
  });
  assert.equal(args.filter((arg) => arg.startsWith('-std=')).length, 1);
  assert.ok(args.includes('-std=c++20'));
});

test('include roots are described relative to the workspace', () => {
  const described = describeConfig(
    {
      mode: 'compile-db',
      flags: ['-std=c++17', '-Iinclude', '-I/abs/include', '-DDEBUG'],
      entry: null,
      warnings: [],
    },
    workspaceRoot,
  );
  assert.equal(described.standard, 'c++17');
  assert.deepEqual(described.defines, ['DEBUG']);
  assert.deepEqual(described.includePaths, [
    path.resolve(workspaceRoot, 'include'),
    path.normalize('/abs/include'),
  ]);
});
