import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

import { PROTOCOL_VERSION } from '../../src/core/protocol/envelope.js';

const root = process.cwd();

/**
 * @param {string} directory
 * @returns {Promise<string[]>} workspace-relative, forward-slash paths
 */
async function listSourceFiles(directory) {
  /** @type {string[]} */
  const found = [];
  /** @param {string} current */
  async function walk(current) {
    const entries = await fs.readdir(path.join(root, current), { withFileTypes: true });
    for (const entry of entries) {
      const relative = `${current}/${entry.name}`;
      if (entry.isDirectory()) {
        await walk(relative);
      } else if (entry.name.endsWith('.js')) {
        found.push(relative);
      }
    }
  }
  await walk(directory);
  return found;
}

/**
 * @param {string} file
 * @returns {Promise<{source: string, imports: string[]}>}
 */
async function readWithImports(file) {
  const source = await fs.readFile(path.join(root, file), 'utf8');
  /** @type {string[]} */
  const imports = [];

  const staticImport = /\bfrom\s+['"]([^'"]+)['"]/g;
  const sideEffectImport = /\bimport\s+['"]([^'"]+)['"]/g;
  const dynamicImport = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  const requireCall = /\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  for (const pattern of [staticImport, sideEffectImport, dynamicImport, requireCall]) {
    for (const match of source.matchAll(pattern)) {
      imports.push(match[1]);
    }
  }

  return { source, imports };
}

const LAYERS = {
  core: 'src/core',
  adapters: 'src/adapters',
  visualization: 'src/visualization',
  webview: 'src/webview',
};

test('every source file is readable and free of CommonJS require in ESM layers', async () => {
  const files = await listSourceFiles('src');
  assert.ok(files.length >= 15, `expected a populated src tree, found ${files.length} files`);

  for (const file of files) {
    const { source } = await readWithImports(file);
    assert.ok(source.length > 0, `${file} is empty`);
    assert.ok(!/\brequire\s*\(/.test(source), `${file} uses require() inside an ESM tree`);
    assert.ok(
      !/\bmodule\.exports\b/.test(source),
      `${file} uses module.exports inside an ESM tree`,
    );
  }
});

test('host-independent layers never import vscode', async () => {
  for (const [layer, directory] of Object.entries(LAYERS)) {
    for (const file of await listSourceFiles(directory)) {
      const { imports } = await readWithImports(file);
      assert.ok(
        !imports.includes('vscode'),
        `${layer} file ${file} imports the VS Code API; inject a transport instead`,
      );
    }
  }
});

test('host-independent layers never import Node file or process APIs', async () => {
  const forbidden = [
    'fs',
    'node:fs',
    'node:fs/promises',
    'child_process',
    'node:child_process',
    'node:worker_threads',
  ];
  for (const [layer, directory] of Object.entries(LAYERS)) {
    for (const file of await listSourceFiles(directory)) {
      const { imports } = await readWithImports(file);
      for (const specifier of imports) {
        assert.ok(
          !forbidden.includes(specifier),
          `${layer} file ${file} imports "${specifier}"; that belongs in the extension host`,
        );
      }
    }
  }
});

test('the graph layer does not know about adapters, languages, or rendering', async () => {
  const forbidden = ['adapters', 'extension', 'webview', 'visualization', 'vscode'];
  for (const file of await listSourceFiles('src/core/graph')) {
    const { imports } = await readWithImports(file);
    for (const specifier of imports) {
      for (const token of forbidden) {
        assert.ok(
          !specifier.includes(token),
          `${file} imports "${specifier}"; the graph layer must stay independent of ${token}`,
        );
      }
    }
  }
});

test('the CSR layer does not import the graph layer or adapters', async () => {
  for (const file of await listSourceFiles('src/core/csr')) {
    const { imports } = await readWithImports(file);
    for (const specifier of imports) {
      assert.ok(!specifier.includes('graph/'), `${file} imports the graph layer: ${specifier}`);
      assert.ok(!specifier.includes('adapters/'), `${file} imports adapters: ${specifier}`);
    }
  }
});

test('the activation path never touches the file system or spawns processes', async () => {
  const activationPath = [
    'src/extension/extension.js',
    'src/extension/log.js',
    'src/extension/commands.js',
    'src/extension/panel.js',
    'src/extension/panelTemplate.js',
    'src/extension/diagnostics.js',
  ];
  const forbidden = [
    'fs',
    'node:fs',
    'node:fs/promises',
    'child_process',
    'node:child_process',
    'node:os',
    'node:process',
  ];

  for (const file of activationPath) {
    const { imports } = await readWithImports(file);
    for (const specifier of imports) {
      assert.ok(
        !forbidden.includes(specifier),
        `${file} imports "${specifier}"; activation must stay inert in Restricted Mode`,
      );
    }
  }
});

test('Restricted Mode support is declared as limited, not falsely full', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(manifest.capabilities.untrustedWorkspaces.supported, 'limited');
  assert.ok(manifest.capabilities.untrustedWorkspaces.description.length > 20);
});

test('the webview bundle imports only core modules', async () => {
  for (const file of await listSourceFiles('src/webview')) {
    const { imports } = await readWithImports(file);
    for (const specifier of imports) {
      assert.ok(
        !specifier.includes('src/extension') && !specifier.startsWith('../extension'),
        `${file} imports the extension host: ${specifier}`,
      );
      assert.ok(!specifier.includes('/adapters/'), `${file} imports an adapter: ${specifier}`);
    }
  }
});

test('no TypeScript sources or configuration exist', async () => {
  /** @type {string[]} */
  const offenders = [];

  /** @param {string} current */
  async function walk(current) {
    for (const entry of await fs.readdir(path.join(root, current), { withFileTypes: true })) {
      if (['node_modules', 'dist', '.git', '.vscode-test', 'context'].includes(entry.name)) {
        continue;
      }
      const relative = path.posix.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(relative);
      } else if (/\.(ts|tsx|mts|cts)$/i.test(entry.name)) {
        offenders.push(relative);
      }
    }
  }
  await walk('.');

  assert.deepEqual(offenders, [], 'TypeScript sources are not allowed');
  await assert.rejects(fs.access(path.join(root, 'tsconfig.json')), 'tsconfig.json must not exist');
});

test('the manifest points at the bundled entry point and requires a compatible host', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));

  assert.equal(manifest.main, './dist/extension.cjs');
  assert.equal(manifest.type, 'module');
  assert.equal(manifest.license, 'GPL-3.0-only');
  assert.match(manifest.engines.vscode, /^\^1\.\d+\.0$/);
  assert.ok(Number(manifest.engines.vscode.slice(1).split('.')[0]) >= 1);
  assert.ok(manifest.devDependencies, 'devDependencies are required');
  assert.equal(
    Object.keys(manifest.devDependencies).some((name) => /typescript/i.test(name)),
    false,
    'TypeScript must not be a dependency',
  );
});

test('every contributed command is also registered in code, and vice versa', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const contributed = manifest.contributes.commands.map((command) => command.command);

  assert.equal(new Set(contributed).size, contributed.length, 'duplicate command ids in manifest');

  const source = await fs.readFile(path.join(root, 'src/extension/commands.js'), 'utf8');
  const registered = [...source.matchAll(/register\('(codeflow\.[A-Za-z]+)'/g)].map(
    (match) => match[1],
  );

  assert.deepEqual([...registered].sort(), [...contributed].sort());
});

test('settings declare a type and a default', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const properties = manifest.contributes.configuration.properties;

  const keys = Object.keys(properties);
  assert.ok(keys.length > 0);
  for (const key of keys) {
    assert.ok(key.startsWith('codeflow.'), `setting "${key}" must be namespaced`);
    assert.ok(properties[key].type, `setting "${key}" must declare a type`);
    assert.ok(Object.hasOwn(properties[key], 'default'), `setting "${key}" must declare a default`);
    assert.ok(properties[key].description, `setting "${key}" must be described`);
  }
});

test('the declared extension version matches the runtime constant', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const source = await fs.readFile(path.join(root, 'src/extension/extension.js'), 'utf8');
  const match = source.match(/const EXTENSION_VERSION = '([^']+)'/);

  assert.ok(match, 'EXTENSION_VERSION must be a single literal');
  assert.equal(match[1], manifest.version);
});

test('the manifest and the code agree on the protocol version', async () => {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  assert.equal(
    manifest.protocolVersion,
    undefined,
    'protocol version belongs in code, not the manifest',
  );
  assert.equal(PROTOCOL_VERSION, 1);
});

test('CI runs lint, tests, build, license audit, packaging and integration tests', async () => {
  const workflow = await fs.readFile(path.join(root, '.github/workflows/ci.yml'), 'utf8');

  for (const step of [
    'npm ci',
    'npm run lint',
    'npm run check:no-typescript',
    'npm run test:unit',
    'npm run build',
    'npm run check:licenses',
    'npm run package',
    'npm run test:integration',
  ]) {
    assert.ok(workflow.includes(step), `CI is missing "${step}"`);
  }

  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /ubuntu-latest/);
});

test('the webview policy forbids remote code and inline execution', async () => {
  const { renderPanelHtml } = await import('../../src/extension/panelTemplate.js');
  const html = renderPanelHtml({
    nonce: 'arch-nonce',
    cspSource: 'vscode-webview://arch',
    scriptUri: 'vscode-webview://arch/main.js',
    styleUri: 'vscode-webview://arch/styles.css',
  });

  for (const directive of [
    "default-src 'none'",
    "script-src 'nonce-arch-nonce'",
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ]) {
    assert.ok(html.includes(directive), `CSP is missing "${directive}"`);
  }
  assert.ok(!/unsafe-(inline|eval)/.test(html));
  assert.ok(!/<script>/.test(html), 'no inline script tags are allowed');
});
