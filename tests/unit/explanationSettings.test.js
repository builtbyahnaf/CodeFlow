import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  EXPLANATION_DEFAULTS,
  clampExplanationDepth,
  explanationSettingsChanged,
  resolveExplanationSettings,
} from '../../src/core/explanation/settings.js';

const manifest = JSON.parse(
  await readFile(new URL('../../package.json', import.meta.url), 'utf8'),
);
const properties = manifest.contributes.configuration.properties;

const CONFIG_KEYS = {
  'codeflow.explanation.defaultDepth': 'defaultDepth',
  'codeflow.explanation.showEvidence': 'showEvidence',
  'codeflow.explanation.includeLimitations': 'includeLimitations',
};

test('every explanation setting is declared in package.json with the core default', () => {
  for (const [key, field] of Object.entries(CONFIG_KEYS)) {
    const property = properties[key];
    assert.ok(property, `missing ${key}`);
    assert.equal(property.default, EXPLANATION_DEFAULTS[field]);
  }
  assert.equal(properties['codeflow.explanation.defaultDepth'].minimum, 1);
  assert.equal(properties['codeflow.explanation.defaultDepth'].maximum, 4);
});

test('resolveExplanationSettings clamps depth 1-4 and handles malformed values', () => {
  assert.deepEqual(resolveExplanationSettings(), EXPLANATION_DEFAULTS);
  assert.deepEqual(resolveExplanationSettings(null), EXPLANATION_DEFAULTS);
  assert.equal(clampExplanationDepth(0), 1);
  assert.equal(clampExplanationDepth(99), 4);
  assert.equal(clampExplanationDepth('bad'), EXPLANATION_DEFAULTS.defaultDepth);
  const resolved = resolveExplanationSettings({
    defaultDepth: 3.9,
    showEvidence: false,
    includeLimitations: 'nope',
  });
  assert.equal(resolved.defaultDepth, 3);
  assert.equal(resolved.showEvidence, false);
  assert.equal(resolved.includeLimitations, true);
});

test('explanationSettingsChanged matches codeflow.explanation configuration events', () => {
  const event = (prefix) => ({
    affectsConfiguration: (section) => section.startsWith(prefix),
  });
  assert.equal(explanationSettingsChanged(event('codeflow.explanation')), true);
  assert.equal(explanationSettingsChanged(event('codeflow.preview')), false);
  assert.equal(explanationSettingsChanged(undefined), false);
});
