import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  PREVIEW_DEFAULTS,
  resolvePreviewSettings,
  settingsChanged,
} from '../../src/core/source/settings.js';

const manifest = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);
const properties = manifest.contributes.configuration.properties;

/** Config key -> resolved field. Kept explicit so a rename cannot drift. */
const CONFIG_KEYS = {
  'codeflow.preview.enabled': 'enabled',
  'codeflow.preview.delayMs': 'delayMs',
  'codeflow.preview.maxLines': 'maxLines',
  'codeflow.preview.syntaxHighlighting': 'syntaxHighlighting',
  'codeflow.preview.clickToNavigate': 'clickToNavigate',
  'codeflow.preview.pinByDefault': 'pinByDefault',
  'codeflow.navigation.openInPreviewTab': 'openInPreviewTab',
};

test('every preview setting is declared in the manifest with the core default', () => {
  for (const [key, field] of Object.entries(CONFIG_KEYS)) {
    const property = properties[key];
    assert.ok(property, `missing ${key}`);
    assert.equal(
      property.default,
      PREVIEW_DEFAULTS[field],
      `${key} default must match PREVIEW_DEFAULTS.${field}`,
    );
  }
});

test('clamping ranges in the manifest match the resolver', () => {
  assert.equal(properties['codeflow.preview.delayMs'].minimum, 0);
  assert.equal(properties['codeflow.preview.delayMs'].maximum, 2000);
  assert.equal(properties['codeflow.preview.maxLines'].minimum, 4);
  assert.equal(properties['codeflow.preview.maxLines'].maximum, 40);
});

test('unknown or malformed settings fall back without throwing', () => {
  assert.deepEqual(resolvePreviewSettings(), PREVIEW_DEFAULTS);
  assert.deepEqual(resolvePreviewSettings(null), PREVIEW_DEFAULTS);
  assert.deepEqual(resolvePreviewSettings([]), PREVIEW_DEFAULTS);
  const normalized = resolvePreviewSettings({
    enabled: 'yes',
    delayMs: 'fast',
    maxLines: 9_999,
    syntaxHighlighting: 1,
  });
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.delayMs, PREVIEW_DEFAULTS.delayMs);
  assert.equal(normalized.maxLines, 40);
  assert.equal(normalized.syntaxHighlighting, true);
});

test('numbers are truncated and clamped to their documented window', () => {
  assert.equal(resolvePreviewSettings({ delayMs: -50 }).delayMs, 0);
  assert.equal(resolvePreviewSettings({ delayMs: 5_000 }).delayMs, 2000);
  assert.equal(resolvePreviewSettings({ delayMs: 12.9 }).delayMs, 12);
  assert.equal(resolvePreviewSettings({ maxLines: 1 }).maxLines, 4);
  assert.equal(resolvePreviewSettings({ maxLines: 12.7 }).maxLines, 12);
});

test('settingsChanged only reacts to the sections the webview consumes', () => {
  const event = (sections) => ({
    affectsConfiguration: (section) => sections.some((value) => section.startsWith(value)),
  });
  assert.equal(settingsChanged(event(['codeflow.preview'])), true);
  assert.equal(settingsChanged(event(['codeflow.navigation'])), true);
  assert.equal(settingsChanged(event(['codeflow.cpp'])), false);
  assert.equal(settingsChanged(undefined), false);
});
