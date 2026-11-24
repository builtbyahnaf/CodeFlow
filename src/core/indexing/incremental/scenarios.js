/**
 * Deterministic incremental edit scenario runner and 500-edit equivalence
 * verifier (Phase 9 §10 M4, §11, P9-15, AC-9.1).
 *
 * The 500-edit equivalence test is Phase 9's primary correctness gate:
 * after applying an arbitrary sequence of file creations, body edits, comment
 * edits, signature edits, renames, and deletions incrementally, the index's
 * `logicalHash()` must equal the `logicalHash()` of a clean full rebuild over
 * the final workspace state.
 */

import { CHANGE_KINDS } from './events.js';

/**
 * Simple deterministic PRNG (Mulberry32) so the 500-edit sequence is 100%
 * reproducible across runs and platforms.
 *
 * @param {number} seed
 * @returns {() => number}
 */
export function createDeterministicRng(seed = 0x9e3779b9) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generate a deterministic sequence of `editCount` workspace edits starting
 * from an initial file map.
 *
 * Operations generated:
 * 1. Comment/whitespace edit (`local`)
 * 2. Function body edit (`local`)
 * 3. Symbol addition / signature edit (`dependent`)
 * 4. New file creation (`file_create`)
 * 5. File deletion (`file_delete`, keeping at least 5 files alive)
 * 6. File rename (`file_rename`)
 *
 * @param {Record<string, string>} initialFiles
 * @param {{editCount?: number, seed?: number}} [options]
 */
export function generateDeterministicEditSequence(initialFiles, options = {}) {
  const editCount = Math.max(1, Math.trunc(Number(options.editCount) || 500));
  const rng = createDeterministicRng(options.seed ?? 42);
  /** @type {Record<string, string>} */
  const workingFiles = { ...initialFiles };
  /** @type {Array<{kind: string, path?: string, fromPath?: string, toPath?: string, text?: string}>} */
  const operations = [];
  let fileSeq = Object.keys(workingFiles).length + 1;

  for (let step = 0; step < editCount; step += 1) {
    const paths = Object.keys(workingFiles).sort();
    const pickIdx = Math.floor(rng() * paths.length);
    const targetPath = paths[pickIdx];
    const roll = rng();

    if (roll < 0.25 && targetPath) {
      // 1. Comment/whitespace edit
      const nextText = `${workingFiles[targetPath]}\n// comment step ${step}\n`;
      workingFiles[targetPath] = nextText;
      operations.push({
        kind: CHANGE_KINDS.EDITOR_SAVE,
        path: targetPath,
        text: nextText,
      });
    } else if (roll < 0.5 && targetPath) {
      // 2. Function body edit (keeps exported function name & parameters identical)
      const fnMatch = workingFiles[targetPath].match(/export function ([A-Za-z0-9_]+)/);
      const fnName = fnMatch ? fnMatch[1] : `fn_${pickIdx}`;
      const nextText = `export function ${fnName}(x) {\n  const stepVal = ${step};\n  return x + stepVal;\n}\n`;
      workingFiles[targetPath] = nextText;
      operations.push({
        kind: CHANGE_KINDS.EDITOR_SAVE,
        path: targetPath,
        text: nextText,
      });
    } else if (roll < 0.75 && targetPath) {
      // 3. Symbol addition / signature change
      const nextText = `export function fn_${pickIdx}(x, y = ${step}) {\n  return x + y;\n}\nexport function helper_${step}(z) {\n  return z * 2;\n}\n`;
      workingFiles[targetPath] = nextText;
      operations.push({
        kind: CHANGE_KINDS.EDITOR_SAVE,
        path: targetPath,
        text: nextText,
      });
    } else if (roll < 0.85 || paths.length <= 6) {
      // 4. Create a new file
      fileSeq += 1;
      const newPath = `src/gen/mod_${fileSeq}.js`;
      const newText = `export function created_${fileSeq}(a) {\n  return a + ${fileSeq};\n}\n`;
      workingFiles[newPath] = newText;
      operations.push({
        kind: CHANGE_KINDS.FILE_CREATE,
        path: newPath,
        text: newText,
      });
    } else if (roll < 0.93 && targetPath) {
      // 5. Delete a file
      delete workingFiles[targetPath];
      operations.push({
        kind: CHANGE_KINDS.FILE_DELETE,
        path: targetPath,
      });
    } else if (targetPath) {
      // 6. Rename a file
      fileSeq += 1;
      const toPath = `src/renamed/mod_${fileSeq}.js`;
      const content = workingFiles[targetPath];
      delete workingFiles[targetPath];
      workingFiles[toPath] = content;
      operations.push({
        kind: CHANGE_KINDS.FILE_RENAME,
        fromPath: targetPath,
        toPath,
        text: content,
      });
    }
  }

  return {
    operations,
    finalFiles: workingFiles,
  };
}
