/**
 * Integration test launcher.
 *
 * Loads the built extension into a real VS Code extension host and runs
 * `tests/integration/suite/index.cjs`.
 *
 * The extension is staged into a space-free temporary directory first. VS Code
 * injects the tests path into the extension host without quoting, so a
 * repository path containing spaces (common on Windows) otherwise fails with a
 * truncated module name. Staging also means the test exercises the built
 * artifact (`dist/`) rather than the source tree.
 *
 * Run `npm run build` first. Set CODEFLOW_VSCODE_EXECUTABLE to a local Code
 * executable to skip the ~380 MB download.
 */

import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs/promises';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { runTests } from '@vscode/test-electron';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

/**
 * Copy the minimum an extension host needs: the manifest and the bundle.
 *
 * @returns {Promise<{stageRoot: string, workspace: string, testsPath: string}>}
 */
async function stageExtension() {
  const stageRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-it-'));
  await fs.cp(path.join(root, 'dist'), path.join(stageRoot, 'dist'), { recursive: true });
  await fs.copyFile(path.join(root, 'package.json'), path.join(stageRoot, 'package.json'));
  await fs.cp(path.join(root, 'tests', 'integration', 'suite'), path.join(stageRoot, 'suite'), {
    recursive: true,
  });

  const workspace = path.join(stageRoot, 'workspace');
  await fs.mkdir(workspace, { recursive: true });
  await fs.copyFile(
    path.join(root, 'tests', 'integration', 'fixtures', 'workspace', 'README.md'),
    path.join(workspace, 'README.md'),
  );

  return {
    stageRoot,
    workspace,
    testsPath: path.join(stageRoot, 'suite', 'index.cjs'),
  };
}

async function main() {
  try {
    await fs.access(path.join(root, 'dist', 'extension.cjs'));
  } catch {
    console.error('[integration] dist/extension.cjs is missing. Run `npm run build` first.');
    process.exitCode = 1;
    return;
  }

  // An installed VS Code avoids the download. Point at Code.exe with
  // CODEFLOW_VSCODE_EXECUTABLE; otherwise the harness downloads a build.
  /** @type {string | undefined} */
  let vscodeExecutablePath;
  const configuredExecutable = process.env.CODEFLOW_VSCODE_EXECUTABLE?.trim();
  if (configuredExecutable) {
    try {
      await fs.access(configuredExecutable);
      vscodeExecutablePath = configuredExecutable;
      console.log(`[integration] using installed VS Code: ${configuredExecutable}`);
    } catch {
      console.warn(
        `[integration] CODEFLOW_VSCODE_EXECUTABLE does not exist (${configuredExecutable}); downloading instead.`,
      );
    }
  }

  const stage = await stageExtension();
  console.log(`[integration] staged extension at ${stage.stageRoot}`);

  // test-electron creates `.vscode-test/` relative to the working directory and
  // passes it to VS Code as an argument. A working directory containing spaces
  // makes VS Code truncate `--user-data-dir` at the first space, which silently
  // breaks the extension host. The staged directory is space-free.
  process.chdir(stage.stageRoot);

  /** @type {string[]} */
  const launchArgs = [stage.workspace, '--disable-gpu', '--disable-workspace-trust'];
  if (process.platform === 'linux') {
    // GitHub's Linux runners have no sandbox; xvfb provides the display.
    launchArgs.push('--no-sandbox', '--disable-dev-shm-usage');
  }

  const startedAt = Date.now();
  let failed = false;
  try {
    await runTests({
      extensionDevelopmentPath: stage.stageRoot,
      extensionTestsPath: stage.testsPath,
      launchArgs,
      ...(vscodeExecutablePath ? { vscodeExecutablePath } : {}),
      extensionTestsEnv: {
        CODEFLOW_INTEGRATION: '1',
      },
    });
    console.log(`[integration] passed in ${Date.now() - startedAt} ms`);
  } catch (error) {
    failed = true;
    console.error('[integration] failed:', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }

  if (!failed && process.env.CODEFLOW_KEEP_STAGE !== '1') {
    // Leave the staged directory before deleting it: on Windows a process
    // cannot remove its own working directory.
    process.chdir(root);
    try {
      await fs.rm(stage.stageRoot, {
        recursive: true,
        force: true,
        maxRetries: 5,
        retryDelay: 200,
      });
    } catch (error) {
      console.warn(
        `[integration] could not remove the staged directory (${stage.stageRoot}): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  } else {
    process.chdir(root);
    console.error(`[integration] stage kept for inspection: ${stage.stageRoot}`);
  }
}

await main();
