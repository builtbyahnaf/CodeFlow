/**
 * Guard rail for a binding project decision: CodeFlow is implemented in
 * JavaScript, not TypeScript (Roadmap section 3.1).
 *
 * A stray `.ts` file or `tsconfig.json` means either a mistake or an unrecorded
 * reversal of that decision. Both should fail CI loudly.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SKIP_DIRECTORIES = new Set(['.git', '.vscode-test', 'node_modules', 'dist', 'context']);

const OFFENDING = ['.ts', '.tsx', '.mts', '.cts'];

/**
 * @param {string} directory
 * @param {string[]} found
 * @returns {Promise<string[]>}
 */
async function scan(directory, found) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (SKIP_DIRECTORIES.has(entry.name)) {
        continue;
      }
      await scan(path.join(directory, entry.name), found);
      continue;
    }
    const lower = entry.name.toLowerCase();
    if (OFFENDING.some((extension) => lower.endsWith(extension))) {
      found.push(path.relative(process.cwd(), path.join(directory, entry.name)));
    }
  }
  return found;
}

const files = await scan(process.cwd(), []);

let failed = false;

if (files.length > 0) {
  failed = true;
  console.error('[no-typescript] FAILED: TypeScript files found:');
  for (const file of files) {
    console.error(`  ${file}`);
  }
}

try {
  await fs.access(path.join(process.cwd(), 'tsconfig.json'));
  failed = true;
  console.error('[no-typescript] FAILED: tsconfig.json exists.');
} catch {
  // Expected: no tsconfig.
}

if (failed) {
  console.error(
    '[no-typescript] CodeFlow V1 is JavaScript-only. See docs/adr/0001-javascript-not-typescript.md.',
  );
  process.exitCode = 1;
} else {
  console.log('[no-typescript] OK: no TypeScript sources or configuration');
}
