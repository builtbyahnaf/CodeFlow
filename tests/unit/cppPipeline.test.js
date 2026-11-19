import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { createCppAnalysisService } from '../../src/extension/cpp/pipeline.js';
import { cppAdapter } from '../../src/adapters/cpp/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import { validateAnalysisRun } from '../../src/core/csr/entities.js';

const workspaceRoot = 'D:/w';
const astText = await fs.readFile(
  new URL('../fixtures/cpp/ast-basic.json', import.meta.url),
  'utf8',
);
const sourceText = await fs.readFile(new URL('../fixtures/cpp/basic.cpp', import.meta.url), 'utf8');
const multiAstText = await fs.readFile(
  new URL('../fixtures/cpp/ast-multi-tu.json', import.meta.url),
  'utf8',
);
const multiMain = await fs.readFile(
  new URL('../fixtures/cpp/multi-tu/src/main.cpp', import.meta.url),
  'utf8',
);
const multiHeader = await fs.readFile(
  new URL('../fixtures/cpp/multi-tu/include/widget.h', import.meta.url),
  'utf8',
);

/**
 * @param {Record<string, string>} sources
 */
function reader(sources) {
  const normalized = Object.fromEntries(
    Object.entries(sources).map(([key, value]) => [path.normalize(key), value]),
  );
  return async (filePath) => {
    const value = normalized[path.normalize(filePath)];
    if (value === undefined) {
      const error = new Error(`ENOENT: ${filePath}`);
      /** @type {{code?: string}} */ (error).code = 'ENOENT';
      throw error;
    }
    return value;
  };
}

/**
 * @param {{ast?: string, toolResult?: object, onTool?: Function}} [options]
 */
function createService(options = {}) {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const calls = [];
  const service = createCppAnalysisService({
    registry,
    readFile: reader({
      'D:/w/src/main.cpp': sourceText,
      'D:/w/include/widget.h': multiHeader,
    }),
    readDir: async () => [],
    runTool: async ({ command, args, cwd }) => {
      calls.push({ command, args, cwd });
      if (options.onTool) {
        options.onTool({ command, args, cwd });
      }
      if (options.toolResult) {
        return options.toolResult;
      }
      return { ok: true, stdout: options.ast ?? astText, stderr: '', exitCode: 0 };
    },
    discoverClangFn: async () => ({
      ok: true,
      clang: { path: 'clang++', version: '18.1.0', major: 18, compatible: true },
    }),
    discoverCompileDbFn: async () => ({
      ok: false,
      code: 'E_COMPILE_DB',
      message: 'No readable compile_commands.json was found; heuristic mode is required.',
      candidates: [],
      issues: [],
    }),
    settings: { timeoutMs: 5_000 },
  });
  return { service, registry, calls };
}

test('a translation unit is analysed end to end through the injected tool', async () => {
  const { service, calls } = createService();
  const result = await service.analyze({
    runId: 'run:cpp-1',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.adapterId, 'cpp-clang');
  assert.equal(result.run.completeness, 'partial');
  assert.equal(result.run.scope.path, 'src/main.cpp');
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'missing_compile_db'));
  assert.equal(validateAnalysisRun(result.run).ok, true);

  const call = calls.at(-1);
  assert.equal(call.command, 'clang++');
  assert.equal(call.cwd, workspaceRoot);
  assert.ok(call.args.includes('-ast-dump=json'));
  assert.ok(call.args.includes('-fsyntax-only'));
  assert.equal(call.args.at(-1), path.resolve('D:/w/src/main.cpp'));
});

test('a compile-database entry switches the run out of heuristic mode', async () => {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const service = createCppAnalysisService({
    registry,
    readFile: reader({ 'D:/w/src/main.cpp': sourceText }),
    runTool: async () => ({ ok: true, stdout: astText, stderr: '', exitCode: 0 }),
    discoverClangFn: async () => ({
      ok: true,
      clang: { path: 'clang++', version: '18.1.0', major: 18, compatible: true },
    }),
    discoverCompileDbFn: async () => ({
      ok: true,
      choice: {
        path: 'compile_commands.json',
        entries: [
          {
            directory: workspaceRoot,
            absoluteFile: path.normalize('D:/w/src/main.cpp'),
            path: 'src/main.cpp',
            arguments: ['clang++', '-std=c++20', '-Iinclude', '-c', 'src/main.cpp'],
            flags: ['-std=c++20', '-Iinclude'],
          },
        ],
      },
      candidates: [],
      issues: [],
    }),
  });

  const result = await service.analyze({
    runId: 'run:cpp-2',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.run.completeness, 'full');
  assert.equal(result.run.extensions.cpp.mode, 'compile-db');
  assert.ok(result.run.diagnostics.every((entry) => entry.code !== 'missing_compile_db'));
});

test('a header request is focused onto the header through its representative TU', async () => {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const service = createCppAnalysisService({
    registry,
    readFile: reader({
      'D:/w/src/main.cpp': multiMain,
      'D:/w/include/widget.h': multiHeader,
    }),
    runTool: async () => ({ ok: true, stdout: multiAstText, stderr: '', exitCode: 0 }),
    discoverClangFn: async () => ({
      ok: true,
      clang: { path: 'clang++', version: '18.0.0', major: 18, compatible: true },
    }),
    discoverCompileDbFn: async () => ({
      ok: true,
      choice: {
        path: 'compile_commands.json',
        entries: [
          {
            directory: workspaceRoot,
            absoluteFile: path.normalize('D:/w/src/main.cpp'),
            path: 'src/main.cpp',
            arguments: ['clang++', '-c', 'src/main.cpp'],
            flags: [],
          },
        ],
      },
      candidates: [],
      issues: [],
    }),
  });

  const result = await service.analyze({
    runId: 'run:cpp-header',
    path: 'include/widget.h',
    workspaceRoot,
  });
  assert.equal(result.ok, true, JSON.stringify(result));
  assert.equal(result.run.scope.path, 'include/widget.h');
  assert.equal(result.run.completeness, 'partial');
  assert.equal(
    result.run.symbols.some((symbol) => symbol.qualifiedName === 'main'),
    false,
  );
  const widget = result.run.symbols.find((symbol) => symbol.qualifiedName === 'Widget');
  assert.ok(widget);
  const save = result.run.symbols.find((symbol) => symbol.qualifiedName === 'Widget::save');
  assert.ok(save);
  assert.equal(save.parentId, widget.symbolId);
  assert.equal(
    result.run.diagnostics.some((diagnostic) => diagnostic.code === 'out_of_scope'),
    true,
  );
  assert.equal(validateAnalysisRun(result.run).ok, true);
});

test('a timeout becomes a partial diagnosed run, not a thrown error', async () => {
  const { service } = createService({
    toolResult: {
      ok: false,
      code: 'E_TOOL_TIMEOUT',
      message: 'Clang exceeded the 5000 ms budget.',
      stderr: '',
    },
  });
  const result = await service.analyze({
    runId: 'run:cpp-timeout',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, true);
  assert.equal(result.run.completeness, 'partial');
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'budget_exceeded'));
});

test('an output cap becomes a partial diagnosed run', async () => {
  const { service } = createService({
    toolResult: {
      ok: false,
      code: 'E_TOOL_LIMIT',
      message: 'Clang exceeded the output cap.',
      stderr: '',
    },
  });
  const result = await service.analyze({
    runId: 'run:cpp-limit',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, true);
  assert.ok(result.run.diagnostics.some((entry) => entry.code === 'budget_exceeded'));
});

test('a missing toolchain is reported before any file is analysed', async () => {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const service = createCppAnalysisService({
    registry,
    readFile: reader({ 'D:/w/src/main.cpp': sourceText }),
    runTool: async () => {
      throw new Error('must not run');
    },
    discoverClangFn: async () => ({
      ok: false,
      code: 'E_UNSUPPORTED',
      message: 'No Clang toolchain was found. Set codeflow.cpp.clangPath.',
    }),
    discoverCompileDbFn: async () => ({ ok: false, code: 'E_COMPILE_DB', message: '' }),
  });
  const result = await service.analyze({
    runId: 'run:cpp-no-clang',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
  assert.match(result.message, /clangPath/);
});

test('paths outside the workspace and missing files are rejected as input errors', async () => {
  const { service } = createService();
  const outside = await service.analyze({
    runId: 'run:cpp-outside',
    path: '../outside.cpp',
    workspaceRoot,
  });
  assert.equal(outside.ok, false);
  assert.equal(outside.code, 'E_INPUT');

  const missing = await service.analyze({
    runId: 'run:cpp-missing',
    path: 'src/missing.cpp',
    workspaceRoot,
  });
  assert.equal(missing.ok, false);
  assert.equal(missing.code, 'E_INPUT');
  assert.match(missing.message, /Could not read/);
});

test('toolchain and database discovery are cached between analyses', async () => {
  let clangCalls = 0;
  let dbCalls = 0;
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  const service = createCppAnalysisService({
    registry,
    readFile: reader({ 'D:/w/src/main.cpp': sourceText }),
    runTool: async () => ({ ok: true, stdout: astText, stderr: '', exitCode: 0 }),
    discoverClangFn: async () => {
      clangCalls += 1;
      return {
        ok: true,
        clang: { path: 'clang++', version: '18.1.0', major: 18, compatible: true },
      };
    },
    discoverCompileDbFn: async () => {
      dbCalls += 1;
      return { ok: false, code: 'E_COMPILE_DB', message: 'missing' };
    },
  });
  await service.analyze({ runId: 'run:cache-1', path: 'src/main.cpp', workspaceRoot });
  await service.analyze({ runId: 'run:cache-2', path: 'src/main.cpp', workspaceRoot });
  assert.equal(clangCalls, 1);
  assert.equal(dbCalls, 1);
  service.reset();
  await service.analyze({ runId: 'run:cache-3', path: 'src/main.cpp', workspaceRoot });
  assert.equal(clangCalls, 2);
  assert.equal(dbCalls, 2);
});

test('Restricted Mode is rejected before any file is read', async () => {
  const registry = createAdapterRegistry();
  registry.register(cppAdapter);
  let read = false;
  const service = createCppAnalysisService({
    registry,
    readFile: async () => {
      read = true;
      return '';
    },
    runTool: async () => {
      throw new Error('must not run');
    },
    discoverClangFn: async () => ({ ok: false, code: 'E_UNSUPPORTED', message: '' }),
    discoverCompileDbFn: async () => ({ ok: false, code: 'E_COMPILE_DB', message: '' }),
  });
  const result = await service.analyze({
    runId: 'run:cpp-untrusted',
    path: 'src/main.cpp',
    workspaceRoot,
    trusted: false,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNTRUSTED');
  assert.equal(read, false);
});

test('stderr is sanitized before it reaches the CSR', async () => {
  const { service } = createService({
    toolResult: {
      ok: true,
      stdout: '',
      stderr: 'D:/w/src/main.cpp:3:1: error: expected ;\n',
      exitCode: 1,
    },
  });
  const result = await service.analyze({
    runId: 'run:cpp-stderr',
    path: 'src/main.cpp',
    workspaceRoot,
  });
  assert.equal(result.ok, true);
  const error = result.run.diagnostics.find((entry) => entry.severity === 'error');
  assert.ok(error);
  assert.equal(error.message.includes('D:/w'), false);
});
