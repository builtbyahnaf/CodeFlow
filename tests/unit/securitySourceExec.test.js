import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

/** Strip comments and string literals to only inspect executable code. */
function stripCommentsAndStrings(code) {
  return code
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove single-line comments
    .replace(/\/\/[^\n]*/g, '')
    // Remove template literals
    .replace(/`[\s\S]*?`/g, '""')
    // Remove double-quoted strings
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    // Remove single-quoted strings
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

describe('Security Audit: Zero Source Execution (Phase 12 §9, P12-18)', () => {
  async function scanDirectory(dir, violations) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (['node_modules', 'dist', '.git'].includes(entry.name)) {
          continue;
        }
        await scanDirectory(fullPath, violations);
      } else if (entry.isFile() && /\.(js|mjs|cjs)$/.test(entry.name)) {
        const rawContent = await fs.readFile(fullPath, 'utf8');
        const codeOnly = stripCommentsAndStrings(rawContent);

        // Check for executable eval()
        if (/\beval\s*\(/.test(codeOnly)) {
          violations.push({ file: fullPath, issue: 'eval() is strictly forbidden' });
        }

        // Check for new Function()
        if (/\bnew\s+Function\s*\(/.test(codeOnly)) {
          violations.push({ file: fullPath, issue: 'new Function() is strictly forbidden' });
        }

        // Check for vm.runIn*
        if (/\bvm\.runIn/.test(codeOnly)) {
          violations.push({ file: fullPath, issue: 'Node vm execution is strictly forbidden' });
        }
      }
    }
  }

  it('scans all source files and verifies zero usage of eval, new Function, or vm', async () => {
    const violations = [];
    await scanDirectory('src', violations);
    assert.deepEqual(
      violations,
      [],
      `Found dynamic execution violations:\n${violations.map((v) => `${v.file}: ${v.issue}`).join('\n')}`,
    );
  });
});
