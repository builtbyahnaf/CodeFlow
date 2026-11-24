import test from 'node:test';
import assert from 'node:assert/strict';

import { CHANGE_KINDS } from '../../src/core/indexing/incremental/events.js';
import {
  clampDebounceMs,
  createIncrementalDebouncer,
} from '../../src/core/indexing/incremental/debounce.js';

test('typing 200 characters in one file produces exactly one analysis after the pause (Checkpoint M1, AC-9.5)', () => {
  assert.equal(clampDebounceMs(20), 100);
  assert.equal(clampDebounceMs(5000), 2000);
  assert.equal(clampDebounceMs(350), 350);

  /** @type {Array<Record<string, any>>} */
  const flushed = [];
  const debouncer = createIncrementalDebouncer({
    debounceMs: 350,
    maxWaitMs: 30_000,
    onFlush: (ev) => flushed.push(ev),
  });

  // Simulate 200 rapid keystrokes spaced 10 ms apart (total 2,000 ms)
  for (let i = 1; i <= 200; i += 1) {
    debouncer.push(
      {
        kind: CHANGE_KINDS.EDITOR_DIRTY,
        path: 'src/active.js',
        text: `export const count = ${i};`,
      },
      i * 10,
    );
    debouncer.tick(i * 10);
  }

  assert.equal(flushed.length, 0, 'must never analyze mid-typing before debounce window elapses');

  // Advance 350 ms past the last keystroke (2000 + 350 = 2350 ms)
  debouncer.tick(2350);
  assert.equal(flushed.length, 1);
  assert.equal(flushed[0].text, 'export const count = 200;');
  assert.equal(debouncer.stats().totalIngested, 200);
  assert.equal(debouncer.stats().totalFlushed, 1);
});

test('continuous typing triggers trailing maxWaitMs flush and respects IME composition hold', () => {
  /** @type {Array<Record<string, any>>} */
  const flushed = [];
  const debouncer = createIncrementalDebouncer({
    debounceMs: 350,
    maxWaitMs: 1000,
    onFlush: (ev) => flushed.push(ev),
  });

  // Hold for IME composition
  debouncer.setImeComposition('src/ime.js', true, 0);
  debouncer.push({ kind: CHANGE_KINDS.EDITOR_DIRTY, path: 'src/ime.js', text: 'kanji' }, 100);
  debouncer.tick(5000);
  assert.equal(flushed.length, 0, 'must never flush while IME composition is active');

  debouncer.setImeComposition('src/ime.js', false, 5000);
  debouncer.tick(5350);
  assert.equal(flushed.length, 1);

  // Continuous typing across 1,200 ms triggers maxWaitMs (1,000 ms) trailing flush
  flushed.length = 0;
  for (let t = 6000; t <= 7200; t += 100) {
    debouncer.push({ kind: CHANGE_KINDS.EDITOR_DIRTY, path: 'src/stream.js', text: `t=${t}` }, t);
  }
  assert.equal(flushed.length, 1, 'trailing flush must fire once maxWaitMs is reached');
});

test('burst of >25 file watcher events within 1s switches to single bulk invalidation pass (P9-03)', () => {
  /** @type {Array<Record<string, any>>} */
  const bursts = [];
  /** @type {Array<Record<string, any>>} */
  const individual = [];
  const debouncer = createIncrementalDebouncer({
    debounceMs: 350,
    burstWindowMs: 1000,
    burstThresholdFiles: 25,
    onFlush: (ev) => individual.push(ev),
    onBulkBurst: (burst) => bursts.push(burst),
  });

  // Simulate 40 files changing within 200 ms (git checkout / branch switch)
  for (let i = 0; i < 40; i += 1) {
    debouncer.push(
      {
        kind: CHANGE_KINDS.WATCHER_CHANGE,
        path: `src/file_${i}.js`,
      },
      100 + i * 2,
    );
  }
  debouncer.tick(2000);

  assert.ok(bursts.length >= 1, 'must trigger bulk burst mode');
  assert.equal(bursts[0].kind, CHANGE_KINDS.BULK_BURST);
  assert.ok(bursts[0].paths.length >= 26);
});
