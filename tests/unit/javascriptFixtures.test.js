import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { createAdapterRegistry } from '../../src/core/adapterRegistry.js';
import { validateAnalysisRun } from '../../src/core/csr/validate.js';
import { createJavaScriptAnalysisService } from '../../src/extension/javascript/pipeline.js';

const FIXTURE_ROOT = new URL('../fixtures/javascript/', import.meta.url);
const WORKSPACE = 'D:/w';
const PLATFORM = 'win32';

/**
 * Every concern folder under `tests/fixtures/javascript/` that carries an
 * `expected.json` is executed. Loose fixtures without expectations are used by
 * the focused unit tests instead.
 *
 * @returns {Promise<{name: string, expected: any, files: Record<string, string>}[]>}
 */
async function loadCases() {
  const directories = await fs.readdir(FIXTURE_ROOT, { withFileTypes: true });
  const cases = [];
  for (const directory of directories) {
    if (!directory.isDirectory()) {
      continue;
    }
    const folder = new URL(`${directory.name}/`, FIXTURE_ROOT);
    let expectedText;
    try {
      expectedText = await fs.readFile(new URL('expected.json', folder), 'utf8');
    } catch {
      continue;
    }
    const expected = JSON.parse(expectedText);
    const files = {};
    for (const [file, content] of Object.entries(expected.inline ?? {})) {
      files[file] = content;
    }
    if (Object.keys(files).length === 0) {
      for (const relative of await listFiles(folder)) {
        files[relative] = await fs.readFile(new URL(relative, folder), 'utf8');
      }
    }
    if (expected.synthetic) {
      const { count, template } = expected.synthetic;
      files[expected.main] = Array.from({ length: count }, (_, index) =>
        template.replaceAll('{index}', String(index + 1)),
      ).join('\n');
    }
    cases.push({ name: directory.name, expected, files });
  }
  return cases.sort((left, right) => left.name.localeCompare(right.name));
}

/**
 * @param {URL} folder
 * @returns {Promise<string[]>}
 */
async function listFiles(folder) {
  /** @type {string[]} */
  const found = [];
  /**
   * @param {URL} current
   * @param {string} prefix
   */
  async function walk(current, prefix) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'expected.json') {
        continue;
      }
      const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(new URL(`${entry.name}/`, current), relative);
      } else {
        found.push(relative);
      }
    }
  }
  await walk(folder, '');
  return found;
}

/**
 * @param {string} value
 * @returns {string}
 */
function normalize(value) {
  return path.resolve(value).replace(/\\/g, '/').toLowerCase();
}

/**
 * @param {Record<string, string>} files
 */
function createFileSystem(files) {
  const entries = new Map();
  for (const [file, content] of Object.entries(files)) {
    entries.set(normalize(`${WORKSPACE}/${file}`), content);
  }
  for (const key of [...entries.keys()]) {
    let current = path.posix.dirname(key);
    while (current !== '.' && current !== '/' && !entries.has(current)) {
      entries.set(current, null);
      current = path.posix.dirname(current);
    }
  }
  return {
    entries,
    async readFile(candidate) {
      const key = normalize(candidate);
      const value = entries.get(key);
      if (typeof value !== 'string') {
        const error = new Error(`ENOENT: ${candidate}`);
        // @ts-expect-error test double
        error.code = 'ENOENT';
        throw error;
      }
      return value;
    },
    async stat(candidate) {
      const key = normalize(candidate);
      if (!entries.has(key)) {
        const error = new Error(`ENOENT: ${candidate}`);
        // @ts-expect-error test double
        error.code = 'ENOENT';
        throw error;
      }
      const value = entries.get(key);
      const isFile = typeof value === 'string';
      return {
        isFile: () => isFile,
        isDirectory: () => !isFile,
        size: isFile ? Buffer.byteLength(/** @type {string} */ (value), 'utf8') : 0,
      };
    },
  };
}

/**
 * @param {{expected: any, files: Record<string, string>, name: string}} testCase
 */
async function analyzeCase(testCase) {
  const { expected, files, name } = testCase;
  const virtualFiles = {};
  for (const [file, content] of Object.entries(files)) {
    virtualFiles[`${name}/${file}`] = content;
  }
  if (expected.packageType) {
    virtualFiles['package.json'] = JSON.stringify({ type: expected.packageType });
  }
  const fileSystem = createFileSystem(virtualFiles);
  const registry = createAdapterRegistry();
  registry.register(javascriptAdapter);
  const service = createJavaScriptAnalysisService({
    registry,
    readFile: fileSystem.readFile,
    stat: fileSystem.stat,
    settings: {},
    platform: PLATFORM,
    logger: {},
  });

  const started = Date.now();
  const result = await service.analyze({
    runId: `run:${name}`,
    path: `${name}/${expected.main}`,
    workspaceRoot: WORKSPACE,
    trusted: true,
  });
  const durationMs = Date.now() - started;
  return { result, durationMs };
}

/**
 * @param {import('../../src/core/csr/entities.js').AnalysisRun} run
 * @param {Record<string, any>} want
 */
function relationshipMatches(run, want) {
  const byId = new Map(run.symbols.map((symbol) => [symbol.symbolId, symbol]));
  return run.relationships.some((relationship) => {
    if (want.type && relationship.type !== want.type) {
      return false;
    }
    if (want.status && relationship.status !== want.status) {
      return false;
    }
    if ('reasonCode' in want && (relationship.reasonCode ?? null) !== want.reasonCode) {
      return false;
    }
    const from = byId.get(relationship.from);
    const to = byId.get(relationship.to);
    if (want.from && relationship.from !== want.from && from?.qualifiedName !== want.from) {
      return false;
    }
    if (want.to && relationship.to !== want.to && to?.qualifiedName !== want.to) {
      return false;
    }
    if (want.fromName && from?.name !== want.fromName) {
      return false;
    }
    if (want.fromKind && from?.kind !== want.fromKind) {
      return false;
    }
    if (want.toName && to?.name !== want.toName) {
      return false;
    }
    if (want.toKind && to?.kind !== want.toKind) {
      return false;
    }
    if (want.extensions) {
      for (const [key, value] of Object.entries(want.extensions)) {
        if (relationship.extensions?.[key] !== value) {
          return false;
        }
      }
    }
    return true;
  });
}

const cases = await loadCases();
assert.ok(cases.length >= 28, `expected at least 28 concern fixtures, found ${cases.length}`);

for (const testCase of cases) {
  test(`fixture ${testCase.name}: ${JSON.stringify(testCase.expected.completeness)}`, async () => {
    const { expected, name } = testCase;
    const { result, durationMs } = await analyzeCase(testCase);

    if (expected.error) {
      assert.equal(result.ok, false, `${name} should fail`);
      assert.equal(result.code, expected.error);
      return;
    }

    assert.equal(result.ok, true, `${name} should analyse: ${JSON.stringify(result.issues ?? [])}`);
    const run = result.run;
    assert.equal(
      validateAnalysisRun(run, { mode: 'strict' }).ok,
      true,
      `${name} must be valid CSR`,
    );
    assert.equal(run.completeness, expected.completeness, `${name} completeness`);

    for (const code of expected.diagnostics ?? []) {
      assert.ok(
        run.diagnostics.some((entry) => entry.code === code),
        `${name} should raise diagnostic ${code}`,
      );
    }

    for (const want of expected.symbols ?? []) {
      assert.ok(
        run.symbols.some(
          (symbol) =>
            symbol.name === want.name &&
            (want.kind === undefined || symbol.kind === want.kind) &&
            (want.disambiguator === undefined || symbol.disambiguator === want.disambiguator),
        ),
        `${name} should declare ${JSON.stringify(want)}`,
      );
    }

    for (const want of expected.symbolExtensions ?? []) {
      const symbol = run.symbols.find((entry) => entry.name === want.name);
      assert.ok(symbol, `${name} should declare ${want.name}`);
      for (const [key, value] of Object.entries(want.extensions)) {
        assert.equal(symbol.extensions?.[key], value, `${name} ${want.name}.${key}`);
      }
    }

    for (const want of expected.symbolPositions ?? []) {
      const symbol = run.symbols.find((entry) => entry.name === want.name);
      assert.ok(symbol, `${name} should declare ${want.name}`);
      if (want.startLine !== undefined) {
        assert.equal(symbol.declaration.startLine, want.startLine, `${name} ${want.name} line`);
      }
      if (want.startColumn !== undefined) {
        assert.equal(
          symbol.declaration.startColumn,
          want.startColumn,
          `${name} ${want.name} column`,
        );
      }
    }

    if (expected.symbolCountAtLeast !== undefined) {
      assert.ok(
        run.symbols.length >= expected.symbolCountAtLeast,
        `${name} should declare at least ${expected.symbolCountAtLeast} symbols, found ${run.symbols.length}`,
      );
    }

    for (const want of expected.relationships ?? []) {
      assert.ok(relationshipMatches(run, want), `${name} should contain ${JSON.stringify(want)}`);
    }

    for (const want of expected.absentRelationships ?? []) {
      assert.equal(
        relationshipMatches(run, want),
        false,
        `${name} must not contain ${JSON.stringify(want)}`,
      );
    }

    if (expected.maxDurationMs !== undefined) {
      assert.ok(
        durationMs <= expected.maxDurationMs,
        `${name} took ${durationMs} ms, budget ${expected.maxDurationMs} ms`,
      );
    }
  });
}
