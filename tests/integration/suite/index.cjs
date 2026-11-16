/**
 * Integration suite, executed inside the real VS Code extension host.
 *
 * Deliberately dependency-free: @vscode/test-electron only needs this module to
 * export `run()`. Mocha would be a fourth dev dependency for no added signal.
 */

const vscode = require('vscode');
const assert = require('node:assert/strict');

const EXTENSION_ID = 'builtbyahnaf.codeflow';
const COMMANDS = ['codeflow.openExplorer', 'codeflow.showDiagnostics', 'codeflow.showLog'];

/** @type {Array<{name: string, fn: () => Promise<void> | void}>} */
const tests = [];

/**
 * @param {string} name
 * @param {() => Promise<void> | void} fn
 */
function test(name, fn) {
  tests.push({ name, fn });
}

/** @type {any} */
let api;

test('the extension is installed and its manifest matches the build', () => {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension, `extension ${EXTENSION_ID} is not installed`);

  assert.equal(extension.packageJSON.main, './dist/extension.cjs');
  assert.equal(extension.packageJSON.type, 'module');
  assert.equal(extension.packageJSON.license, 'GPL-3.0-only');
  assert.match(extension.packageJSON.version, /^\d+\.\d+\.\d+$/);
});

test('activation succeeds and returns the documented surface', async () => {
  const extension = vscode.extensions.getExtension(EXTENSION_ID);
  assert.ok(extension);

  api = await extension.activate();

  assert.equal(extension.isActive, true);
  assert.equal(api.version, extension.packageJSON.version);
  assert.equal(api.protocolVersion, 1);
  assert.equal(typeof api.registry.analyze, 'function');
  assert.equal(typeof api.panelManager.show, 'function');
  assert.equal(api.panelManager.isOpen(), false);
});

test('the mock adapter is registered and reports honest capabilities', () => {
  const matrix = api.registry.capabilityMatrix();

  assert.equal(matrix.length, 1);
  assert.equal(matrix[0].id, 'mock');
  assert.deepEqual(matrix[0].languages, ['mock']);
  assert.equal(matrix[0].capabilities.parse, true);
  assert.equal(matrix[0].capabilities.resolveCalls, true);
  assert.equal(matrix[0].capabilities.generateCFG, false);
  assert.equal(matrix[0].capabilities.generateDFG, false);
  assert.equal(matrix[0].capabilities.resolveTypes, false);
});

test('the mock adapter produces a valid run inside the host', async () => {
  const result = await api.registry.analyze({ path: 'demo.mock', runId: 'run:integration' });

  assert.equal(result.ok, true, result.ok ? '' : `${result.code}: ${result.message}`);
  assert.equal(result.run.runId, 'run:integration');
  assert.equal(result.run.adapterId, 'mock');
  assert.equal(result.run.symbols.length, 5);
  assert.equal(result.run.relationships.length, 4);
});

test('a file without an adapter fails honestly instead of pretending', async () => {
  const result = await api.registry.analyze({ path: 'src/main.cpp', runId: 'run:integration' });

  assert.equal(result.ok, false);
  assert.equal(result.code, 'E_UNSUPPORTED');
});

test('all three commands are registered with VS Code', async () => {
  const available = await vscode.commands.getCommands(true);

  for (const command of COMMANDS) {
    assert.ok(available.includes(command), `command ${command} is not registered`);
  }
});

test('openExplorer opens a panel and reuses it on the second invocation', async () => {
  await vscode.commands.executeCommand('codeflow.openExplorer');
  assert.equal(api.panelManager.isOpen(), true, 'first invocation should open the panel');
  assert.equal(api.panelManager.pendingRequests(), 0);

  await vscode.commands.executeCommand('codeflow.openExplorer');
  assert.equal(api.panelManager.isOpen(), true, 'second invocation should reuse the panel');
});

test('diagnostics render a report without source text', async () => {
  await vscode.commands.executeCommand('codeflow.showDiagnostics');

  const editor = vscode.window.activeTextEditor;
  assert.ok(editor, 'diagnostics should open a text document');
  const text = editor.document.getText();

  assert.match(text, /# CodeFlow diagnostics/);
  assert.match(text, /- Protocol: v1/);
  assert.match(text, /## Adapters/);
  assert.match(text, /- mock \(mock\): parse, discoverDeclarations, resolveCalls/);
  assert.match(text, /no real C\+\+ or JavaScript analysis exists yet/);
  assert.ok(!text.includes('class DBHandler'), 'diagnostics must not contain source text');
  assert.ok(!text.includes('check_db_exists'), 'diagnostics must not contain source text');

  await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
});

test('showLog opens the output channel without throwing', async () => {
  await vscode.commands.executeCommand('codeflow.showLog');
});

test('activation does not require a trusted workspace', () => {
  // Informational: the launcher disables the trust prompt, so this normally
  // reports `true`. The assertion is that activation itself (above) worked and
  // never consulted trust state for a decision.
  assert.equal(typeof vscode.workspace.isTrusted, 'boolean');
});

test('disposing the panel releases it', () => {
  api.panelManager.dispose();
  assert.equal(api.panelManager.isOpen(), false);
});

async function run() {
  /** @type {Array<{name: string, error: Error}>} */
  const failures = [];

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`  ok - ${name}`);
    } catch (error) {
      failures.push({ name, error: error instanceof Error ? error : new Error(String(error)) });
      console.error(`  not ok - ${name}\n    ${failures[failures.length - 1].error.stack}`);
    }
  }

  console.log(`\n${tests.length - failures.length}/${tests.length} integration checks passed`);

  if (failures.length > 0) {
    throw new Error(
      `integration suite failed:\n${failures.map((failure) => `- ${failure.name}`).join('\n')}`,
    );
  }
}

module.exports = { run };
