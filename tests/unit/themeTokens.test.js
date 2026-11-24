import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  THEME_ROLES,
  DARK_THEME,
  LIGHT_THEME,
  HIGH_CONTRAST_THEME,
  VSCODE_CSS_VARIABLE_MAP,
  calculateContrastRatio,
  validatePaletteContrast,
  generateThemeCssVariables,
} from '../../src/visualization/theme/index.js';

describe('Theme token coverage (P12-01, AC-12.2)', () => {
  it('every semantic role is defined in all three theme palettes', () => {
    const roles = Object.values(THEME_ROLES);
    assert.ok(roles.length >= 20, 'Expected at least 20 semantic roles');

    for (const role of roles) {
      assert.ok(
        typeof DARK_THEME[role] === 'string' && DARK_THEME[role].startsWith('#'),
        `Missing dark theme token for ${role}`,
      );
      assert.ok(
        typeof LIGHT_THEME[role] === 'string' && LIGHT_THEME[role].startsWith('#'),
        `Missing light theme token for ${role}`,
      );
      assert.ok(
        typeof HIGH_CONTRAST_THEME[role] === 'string' && HIGH_CONTRAST_THEME[role].startsWith('#'),
        `Missing high contrast theme token for ${role}`,
      );
      assert.ok(
        typeof VSCODE_CSS_VARIABLE_MAP[role] === 'string' &&
          VSCODE_CSS_VARIABLE_MAP[role].startsWith('--vscode-'),
        `Missing VS Code CSS variable mapping for ${role}`,
      );
    }
  });

  it('theme palettes are frozen and tamper-proof', () => {
    assert.ok(Object.isFrozen(THEME_ROLES));
    assert.ok(Object.isFrozen(DARK_THEME));
    assert.ok(Object.isFrozen(LIGHT_THEME));
    assert.ok(Object.isFrozen(HIGH_CONTRAST_THEME));
    assert.ok(Object.isFrozen(VSCODE_CSS_VARIABLE_MAP));
  });
});

describe('Automated WCAG AA contrast validation (P12-03, AC-12.2)', () => {
  it('light theme text meets WCAG AA 4.5:1 against canvas background', () => {
    const result = validatePaletteContrast(LIGHT_THEME);
    assert.ok(result.valid, `Light theme contrast issues: ${result.issues.join(', ')}`);
    assert.ok(result.textContrast >= 4.5, `Expected >= 4.5, got ${result.textContrast}`);
  });

  it('dark theme text meets WCAG AA 4.5:1 against canvas background', () => {
    const result = validatePaletteContrast(DARK_THEME);
    assert.ok(result.valid, `Dark theme contrast issues: ${result.issues.join(', ')}`);
    assert.ok(result.textContrast >= 4.5, `Expected >= 4.5, got ${result.textContrast}`);
  });

  it('high contrast theme achieves maximum contrast (>= 15:1)', () => {
    const ratio = calculateContrastRatio(
      HIGH_CONTRAST_THEME[THEME_ROLES.TEXT_PRIMARY],
      HIGH_CONTRAST_THEME[THEME_ROLES.BG_CANVAS],
    );
    assert.ok(ratio >= 15.0, `Expected high contrast ratio >= 15:1, got ${ratio}:1`);
  });

  it('generateThemeCssVariables outputs valid CSS rules with fallbacks', () => {
    const css = generateThemeCssVariables(DARK_THEME);
    assert.ok(css.startsWith(':root {'));
    assert.ok(css.includes('--cf-bg-canvas: var(--vscode-editor-background, #1e1e1e);'));
    assert.ok(css.includes('--cf-status-resolved: var(--vscode-terminal-ansiGreen, #4ec9b0);'));
    assert.ok(css.endsWith('}'));
  });
});
