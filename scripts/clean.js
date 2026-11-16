/**
 * Remove build output and packaged artifacts. Never touches source.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const targets = ['dist', 'codeflow.vsix', '.vscode-test'];

for (const target of targets) {
  const full = path.join(process.cwd(), target);
  await fs.rm(full, { recursive: true, force: true });
  console.log(`[clean] removed ${target}`);
}
