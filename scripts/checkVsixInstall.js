/**
 * Verify that the packaged VSIX installs into a clean extensions directory.
 *
 * This is the AC-0.1 "install from the built .vsix" check. It needs a VS Code
 * executable because installation is performed by VS Code's own CLI, so it is
 * opt-in:
 *
 *   CODEFLOW_VSCODE_EXECUTABLE=/path/to/Code.exe npm run check:vsix
 *
 * Without the environment variable it prints a skip notice and exits 0. The
 * CI artifact upload covers packaging; this script covers installation.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const vsixPath = path.join(root, 'codeflow.vsix');
const executable = process.env.CODEFLOW_VSCODE_EXECUTABLE?.trim();

/**
 * @param {string} command
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code} (signal ${signal ?? 'none'})`));
    });
  });
}

async function main() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
  const target = `${manifest.publisher}.${manifest.name}`;

  if (!executable) {
    console.log(
      '[vsix] skipped: set CODEFLOW_VSCODE_EXECUTABLE to a VS Code executable to run this check',
    );
    return;
  }

  try {
    await fs.access(vsixPath);
  } catch {
    console.error('[vsix] codeflow.vsix is missing. Run `npm run package` first.');
    process.exitCode = 1;
    return;
  }

  await fs.access(executable);

  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'codeflow-vsix-'));
  const extensionsDir = path.join(tempRoot, 'extensions');
  const userDataDir = path.join(tempRoot, 'user-data');

  try {
    await run(executable, [
      '--install-extension',
      vsixPath,
      '--extensions-dir',
      extensionsDir,
      '--user-data-dir',
      userDataDir,
      '--force',
    ]);

    const installed = (await fs.readdir(extensionsDir)).filter((name) =>
      name.toLowerCase().startsWith(target.toLowerCase()),
    );
    if (installed.length !== 1) {
      throw new Error(
        `expected one installed folder for ${target}, found: ${installed.join(', ')}`,
      );
    }

    const installedRoot = path.join(extensionsDir, installed[0]);
    const installedManifest = JSON.parse(
      await fs.readFile(path.join(installedRoot, 'package.json'), 'utf8'),
    );
    await fs.access(path.join(installedRoot, 'dist', 'extension.cjs'));
    await fs.access(path.join(installedRoot, 'dist', 'webview', 'main.js'));
    await fs.access(path.join(installedRoot, 'dist', 'webview', 'styles.css'));

    if (installedManifest.version !== manifest.version) {
      throw new Error(
        `installed version ${installedManifest.version} does not match packaged ${manifest.version}`,
      );
    }

    console.log(
      `[vsix] OK: ${target}@${installedManifest.version} installed into a clean extensions directory`,
    );
  } catch (error) {
    console.error(`[vsix] FAILED: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  } finally {
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
}

await main();
