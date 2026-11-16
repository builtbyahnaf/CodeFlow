/**
 * License audit.
 *
 * CodeFlow is distributed under GPL-3.0-only. Every dependency must be
 * compatible with that. Production dependencies are enforced; development-only
 * dependencies are reported so a human can review them.
 *
 * Reads `package-lock.json` only — no network, no dependency required.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const ALLOWED = new Set([
  '0BSD',
  'Apache-2.0',
  'BlueOak-1.0.0',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'CC0-1.0',
  'CC-BY-4.0',
  'ISC',
  'MIT',
  'MIT-0',
  'Python-2.0',
  'Unlicense',
  'WTFPL',
  'Zlib',
]);

/**
 * @param {string} expression
 * @returns {boolean}
 */
function isAllowed(expression) {
  const cleaned = expression.replace(/[()]/g, ' ').trim();
  if (cleaned.length === 0) {
    return false;
  }
  const hasAnd = /\sAND\s/i.test(cleaned);
  const parts = cleaned
    .split(/\s+(?:OR|AND)\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return false;
  }
  return hasAnd
    ? parts.every((part) => ALLOWED.has(part))
    : parts.some((part) => ALLOWED.has(part));
}

const lockPath = path.join(process.cwd(), 'package-lock.json');
let lock;
try {
  lock = JSON.parse(await fs.readFile(lockPath, 'utf8'));
} catch (error) {
  console.error(`[licenses] cannot read package-lock.json: ${error.message}`);
  process.exitCode = 1;
  process.exit();
}

/** @type {Array<{name: string, version: string, license: string, dev: boolean}>} */
const entries = [];
for (const [key, value] of Object.entries(lock.packages ?? {})) {
  if (!key || key === '' || !value || typeof value !== 'object') {
    continue;
  }
  if (!value.version) {
    continue;
  }
  const name = key.replace(/^.*node_modules\//, '');
  entries.push({
    name,
    version: String(value.version),
    license: String(value.license ?? 'UNKNOWN'),
    dev: value.dev === true,
  });
}

const productionViolations = entries.filter((entry) => !entry.dev && !isAllowed(entry.license));
const developmentReviews = entries.filter((entry) => entry.dev && !isAllowed(entry.license));

const byLicense = new Map();
for (const entry of entries) {
  const key = `${entry.license}${entry.dev ? ' (dev)' : ''}`;
  byLicense.set(key, (byLicense.get(key) ?? 0) + 1);
}

console.log(`[licenses] ${entries.length} packages inspected`);
for (const [license, count] of [...byLicense.entries()].sort()) {
  console.log(`  ${license}: ${count}`);
}

if (developmentReviews.length > 0) {
  console.log('\n[licenses] development-only packages needing review (not shipped):');
  for (const entry of developmentReviews) {
    console.log(`  ${entry.name}@${entry.version} — ${entry.license}`);
  }
}

if (productionViolations.length > 0) {
  console.error('\n[licenses] FAILED: shipped dependencies with incompatible licenses:');
  for (const entry of productionViolations) {
    console.error(`  ${entry.name}@${entry.version} — ${entry.license}`);
  }
  process.exitCode = 1;
} else {
  console.log('\n[licenses] OK: all shipped dependencies are on the allowlist');
}
