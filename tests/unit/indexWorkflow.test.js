import test from 'node:test';
import assert from 'node:assert/strict';

import {
  FIRST_OPEN_ACTIONS,
  FIRST_OPEN_CHOICES,
  decideFirstOpenAction,
  formatIndexStatusBar,
} from '../../src/core/indexing/workflow.js';
import { createMemoryFsAdapter } from '../../src/storage/indexStore.js';
import {
  checkGitignoreStatus,
  addCodeflowToGitignore,
} from '../../src/extension/indexing/gitignore.js';

test('decideFirstOpenAction covers all eight Phase 8 §9 workspace-open states', () => {
  // 1. Restricted Mode -> completely silent, never touches disk
  const untrusted = decideFirstOpenAction({
    trusted: false,
    hasSupportedFiles: true,
    indexExists: false,
  });
  assert.equal(untrusted.action, FIRST_OPEN_ACTIONS.SILENT_UNTRUSTED);
  assert.equal(untrusted.shouldTouchDisk, false);
  assert.equal(untrusted.readOnly, true);

  // 2. Trusted workspace with no C++/JS files -> silent
  const noFiles = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: false,
  });
  assert.equal(noFiles.action, FIRST_OPEN_ACTIONS.SILENT_NO_FILES);

  // 3. Multi-window lock held by another live process -> silent read-only
  const readOnly = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: true,
    lockStatus: 'held_by_live_process',
  });
  assert.equal(readOnly.action, FIRST_OPEN_ACTIONS.SILENT_READ_ONLY);
  assert.equal(readOnly.readOnly, true);

  // 4. Corrupt or incompatible index -> prompt rebuild
  const corrupt = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: true,
    state: 'corrupt',
    health: { ok: false, rebuildRequired: true },
  });
  assert.equal(corrupt.action, FIRST_OPEN_ACTIONS.PROMPT_REBUILD);

  // 5. Interrupted prior run / stale lock -> prompt recover
  const interrupted = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: true,
    state: 'indexing',
    lockStatus: 'stale_recoverable',
  });
  assert.equal(interrupted.action, FIRST_OPEN_ACTIONS.PROMPT_RECOVER);

  // 6. Existing complete & healthy index -> silent ready
  const ready = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: true,
    state: 'complete',
    health: { ok: true },
  });
  assert.equal(ready.action, FIRST_OPEN_ACTIONS.SILENT_READY);

  // 7. User selected "Don't ask again" in this workspace -> silent
  const dismissed = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: false,
    dismissedInWorkspace: true,
  });
  assert.equal(dismissed.action, FIRST_OPEN_ACTIONS.SILENT_DISMISSED);

  // 8. Trusted workspace with supported files and no index -> offer non-modal index prompt
  const offer = decideFirstOpenAction({
    trusted: true,
    hasSupportedFiles: true,
    indexExists: false,
    dismissedInWorkspace: false,
  });
  assert.equal(offer.action, FIRST_OPEN_ACTIONS.OFFER_INDEX);
  assert.deepEqual(offer.choices, FIRST_OPEN_CHOICES);
});

test('formatIndexStatusBar renders clear status strings across states', () => {
  assert.match(formatIndexStatusBar({ trusted: false }).text, /Restricted/);
  assert.match(
    formatIndexStatusBar({ trusted: true, state: 'indexing', indexedFiles: 15, totalFiles: 100 })
      .text,
    /Indexing \(15\/100\)/,
  );
  assert.match(
    formatIndexStatusBar({ trusted: true, state: 'complete', fileCount: 42 }).text,
    /Indexed \(42 files\)/,
  );
  assert.match(
    formatIndexStatusBar({
      trusted: true,
      state: 'partial',
      fileCount: 42,
      staleFileCount: 3,
      readOnly: true,
    }).text,
    /3 stale.*\(read-only\)/,
  );
});

test('addCodeflowToGitignore refuses to modify .gitignore without explicit user consent', () => {
  const memFs = createMemoryFsAdapter();
  const root = '/workspace/project';
  memFs.writeFileSync(`${root}/.gitignore`, 'node_modules/\ndist/\n');

  const initial = checkGitignoreStatus(root, memFs);
  assert.equal(initial.hasGitignore, true);
  assert.equal(initial.coversCodeflow, false);

  const denied = addCodeflowToGitignore(root, { consent: false, fsAdapter: memFs });
  assert.equal(denied.ok, false);
  assert.equal(denied.code, 'E_CONSENT_REQUIRED');
  assert.equal(memFs.readFileSync(`${root}/.gitignore`), 'node_modules/\ndist/\n');

  const granted = addCodeflowToGitignore(root, { consent: true, fsAdapter: memFs });
  assert.equal(granted.ok, true);
  assert.equal(granted.updated, true);
  assert.equal(checkGitignoreStatus(root, memFs).coversCodeflow, true);
});
