import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  discoverCompileDb,
  extractDefines,
  extractIncludePaths,
  extractStandard,
  flagsFromArguments,
  heuristicFlags,
  matchCompileEntry,
  parseCompileCommands,
  splitCommandLine,
} from '../../src/extension/cpp/compileDb.js';

const workspace = path.join(os.tmpdir(), 'codeflow-cpp-fixture');

test('a command line is tokenized without executing a shell', () => {
  assert.deepEqual(splitCommandLine('clang++ -std=c++20 -I"include dir" -DNAME=1 src/main.cpp'), [
    'clang++',
    '-std=c++20',
    '-Iinclude dir',
    '-DNAME=1',
    'src/main.cpp',
  ]);
  assert.deepEqual(splitCommandLine("clang++ '-DNAME=hello world'"), [
    'clang++',
    '-DNAME=hello world',
  ]);
  // Windows paths keep their backslashes unless escaping a quote.
  assert.deepEqual(splitCommandLine('clang++ C:\\work\\src\\main.cpp'), [
    'clang++',
    'C:\\work\\src\\main.cpp',
  ]);
});

test('compile database entries are normalized and their flags cleaned', () => {
  const parsed = parseCompileCommands(
    [
      {
        directory: path.join(workspace, 'build'),
        file: '../src/main.cpp',
        command: 'clang++ -std=c++20 -I../include -c ../src/main.cpp -o main.o',
      },
      {
        directory: workspace,
        file: 'src/util.cpp',
        arguments: ['clang++', '-DDEBUG', '-c', 'src/util.cpp', '-o', 'util.o'],
      },
      { file: 'broken.cpp' },
    ],
    workspace,
  );

  assert.equal(parsed.ok, true);
  assert.equal(parsed.entries.length, 2);
  assert.equal(parsed.issues.length, 1);
  assert.equal(parsed.entries[0].path, 'src/main.cpp');
  assert.deepEqual(parsed.entries[0].flags, ['-std=c++20', '-I../include']);
  assert.equal(parsed.entries[1].path, 'src/util.cpp');
  assert.deepEqual(parsed.entries[1].flags, ['-DDEBUG']);
});

test('a non-array database is rejected', () => {
  const parsed = parseCompileCommands({ entries: [] }, workspace);
  assert.equal(parsed.ok, false);
  assert.equal(parsed.code, 'E_COMPILE_DB');
});

test('include paths, defines and the standard are extracted', () => {
  const flags = [
    '-std=c++17',
    '-Iinclude',
    '-I',
    'vendor',
    '-isystem',
    '/usr/include',
    '-DDEBUG',
    '-D',
    'NAME=1',
  ];
  assert.deepEqual(extractIncludePaths(flags), ['include', 'vendor', '/usr/include']);
  assert.deepEqual(extractDefines(flags), ['DEBUG', 'NAME=1']);
  assert.equal(extractStandard(flags), 'c++17');
  assert.deepEqual(heuristicFlags({ defines: ['DEBUG'], includePaths: ['include'] }), [
    '-std=c++17',
    '-DDEBUG',
    '-Iinclude',
  ]);
});

test('flags drop the compiler, source, output and dependency options', () => {
  assert.deepEqual(
    flagsFromArguments(
      ['clang++', '-std=c++17', 'src/a.cpp', '-o', 'a.o', '-MMD', '-MF', 'a.d', '-Isrc'],
      path.resolve('src/a.cpp'),
      'src/a.cpp',
    ),
    ['-std=c++17', '-Isrc'],
  );
});

test('the largest database wins and ties are broken by path', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-db-'));
  try {
    const build = path.join(root, 'build');
    const out = path.join(root, 'out');
    await fs.mkdir(build, { recursive: true });
    await fs.mkdir(out, { recursive: true });
    const entry = (file) => ({
      directory: root,
      file,
      arguments: ['clang++', '-c', file],
    });
    await fs.writeFile(
      path.join(build, 'compile_commands.json'),
      JSON.stringify([entry('main.cpp'), entry('util.cpp')]),
    );
    await fs.writeFile(
      path.join(out, 'compile_commands.json'),
      JSON.stringify([entry('main.cpp')]),
    );

    const discovered = await discoverCompileDb({ workspaceRoot: root });
    assert.equal(discovered.ok, true);
    assert.equal(discovered.choice.entries.length, 2);
    assert.match(discovered.choice.path, /build/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('cmake-build directories and nested databases are discovered', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-db-'));
  try {
    const cmake = path.join(root, 'cmake-build-debug');
    const nested = path.join(root, 'sub', 'project');
    await fs.mkdir(cmake, { recursive: true });
    await fs.mkdir(nested, { recursive: true });
    const payload = JSON.stringify([
      { directory: root, file: 'a.cpp', arguments: ['clang++', '-c', 'a.cpp'] },
    ]);
    await fs.writeFile(path.join(cmake, 'compile_commands.json'), payload);
    await fs.writeFile(path.join(nested, 'compile_commands.json'), payload);

    const discovered = await discoverCompileDb({ workspaceRoot: root });
    assert.equal(discovered.ok, true);
    assert.ok(discovered.candidates.some((candidate) => candidate.includes('cmake-build-debug')));
    assert.ok(
      discovered.candidates.some((candidate) => candidate.includes(path.join('sub', 'project'))),
    );
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('a missing database returns E_COMPILE_DB with the search list', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-db-'));
  try {
    const discovered = await discoverCompileDb({ workspaceRoot: root });
    assert.equal(discovered.ok, false);
    assert.equal(discovered.code, 'E_COMPILE_DB');
    assert.ok(discovered.candidates.length >= 3);
    assert.match(discovered.message, /heuristic mode/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('malformed JSON is reported and other databases are still considered', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-db-'));
  try {
    const build = path.join(root, 'build');
    await fs.mkdir(build, { recursive: true });
    await fs.writeFile(path.join(root, 'compile_commands.json'), '{ not json');
    await fs.writeFile(
      path.join(build, 'compile_commands.json'),
      JSON.stringify([{ directory: root, file: 'a.cpp', arguments: ['clang++', '-c', 'a.cpp'] }]),
    );

    const discovered = await discoverCompileDb({ workspaceRoot: root });
    assert.equal(discovered.ok, true);
    assert.match(discovered.choice.path, /build/);
    assert.ok(discovered.issues.some((issue) => issue.includes('compile_commands.json')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('configured paths are honored before workspace discovery', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-db-'));
  try {
    const custom = path.join(root, 'config', 'db.json');
    await fs.mkdir(path.dirname(custom), { recursive: true });
    await fs.writeFile(
      custom,
      JSON.stringify([{ directory: root, file: 'x.cpp', arguments: ['clang++', '-c', 'x.cpp'] }]),
    );
    const discovered = await discoverCompileDb({ workspaceRoot: root, configuredPath: custom });
    assert.equal(discovered.ok, true);
    assert.equal(discovered.choice.path, custom);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('entries are matched by absolute path, case-insensitively on Windows', () => {
  const entries = [
    {
      directory: 'C:/w',
      absoluteFile: 'C:/w/Src/Main.cpp',
      path: 'Src/Main.cpp',
      arguments: [],
      flags: [],
    },
  ];
  assert.equal(matchCompileEntry(entries, 'C:/w/Src/Main.cpp', 'win32').path, 'Src/Main.cpp');
  assert.equal(matchCompileEntry(entries, 'C:/w/src/main.cpp', 'win32').path, 'Src/Main.cpp');
  assert.equal(matchCompileEntry(entries, 'C:/w/src/main.cpp', 'linux'), null);
});
