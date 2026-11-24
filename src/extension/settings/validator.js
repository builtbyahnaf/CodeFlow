/**
 * Settings Validation and Fallback Hardening (Phase 12 §6, P12-11, AC-12.13).
 *
 * Validates setting values against their schema constraints and falls back safely
 * without crashing or silently accepting corrupt values.
 */

/** Schema rules and bounds for every CodeFlow setting. */
export const SETTING_RULES = Object.freeze({
  'codeflow.logLevel': {
    type: 'string',
    enum: ['off', 'error', 'warn', 'info', 'debug'],
    default: 'warn',
  },
  'codeflow.protocol.traceMessages': {
    type: 'boolean',
    default: false,
  },
  'codeflow.explorer.retainContext': {
    type: 'boolean',
    default: false,
  },
  'codeflow.cpp.clangPath': {
    type: 'string',
    default: '',
  },
  'codeflow.cpp.compileCommandsPath': {
    type: 'string',
    default: '',
  },
  'codeflow.cpp.fallbackIncludePaths': {
    type: 'array',
    default: [],
  },
  'codeflow.cpp.fallbackDefines': {
    type: 'array',
    default: [],
  },
  'codeflow.cpp.fallbackStandard': {
    type: 'string',
    default: '',
  },
  'codeflow.cpp.timeoutMs': {
    type: 'number',
    min: 1000,
    max: 600000,
    default: 60000,
  },
  'codeflow.cpp.maxOutputBytes': {
    type: 'number',
    min: 1048576,
    default: 67108864,
  },
  'codeflow.cpp.maxFileBytes': {
    type: 'number',
    min: 65536,
    default: 4194304,
  },
  'codeflow.javascript.resolveNodeModules': {
    type: 'boolean',
    default: false,
  },
  'codeflow.javascript.maxFileBytes': {
    type: 'number',
    min: 65536,
    default: 2097152,
  },
  'codeflow.javascript.maxLines': {
    type: 'number',
    min: 100,
    default: 20000,
  },
  'codeflow.javascript.maxModules': {
    type: 'number',
    min: 1,
    max: 512,
    default: 64,
  },
  'codeflow.javascript.maxDepth': {
    type: 'number',
    min: 1,
    max: 64,
    default: 8,
  },
  'codeflow.preview.enabled': {
    type: 'boolean',
    default: true,
  },
  'codeflow.preview.delayMs': {
    type: 'number',
    min: 0,
    max: 2000,
    default: 300,
  },
  'codeflow.preview.maxLines': {
    type: 'number',
    min: 4,
    max: 40,
    default: 12,
  },
  'codeflow.preview.syntaxHighlighting': {
    type: 'boolean',
    default: true,
  },
  'codeflow.preview.clickToNavigate': {
    type: 'boolean',
    default: true,
  },
  'codeflow.preview.pinByDefault': {
    type: 'boolean',
    default: false,
  },
  'codeflow.navigation.openInPreviewTab': {
    type: 'boolean',
    default: false,
  },
  'codeflow.explanation.defaultDepth': {
    type: 'number',
    min: 1,
    max: 4,
    default: 2,
  },
  'codeflow.explanation.showEvidence': {
    type: 'boolean',
    default: true,
  },
  'codeflow.explanation.includeLimitations': {
    type: 'boolean',
    default: true,
  },
  'codeflow.index.debounceMs': {
    type: 'number',
    min: 100,
    max: 2000,
    default: 350,
  },
});

/**
 * Validate a setting value against its registered rule.
 *
 * @param {string} key
 * @param {unknown} value
 * @returns {{
 *   valid: boolean,
 *   clampedValue: unknown,
 *   issue?: string
 * }}
 */
export function validateSettingValue(key, value) {
  const rule = SETTING_RULES[key];
  if (!rule) {
    return { valid: false, clampedValue: value, issue: `Unknown setting: ${key}` };
  }

  if (value === undefined || value === null) {
    return { valid: true, clampedValue: rule.default };
  }

  if (rule.type === 'boolean') {
    if (typeof value === 'boolean') {
      return { valid: true, clampedValue: value };
    }
    return {
      valid: false,
      clampedValue: rule.default,
      issue: `Expected boolean for ${key}, received ${typeof value}`,
    };
  }

  if (rule.type === 'number') {
    const num = Number(value);
    if (!Number.isFinite(num)) {
      return {
        valid: false,
        clampedValue: rule.default,
        issue: `Expected finite number for ${key}, received ${String(value)}`,
      };
    }
    let clamped = Math.round(num);
    let issue;
    if (typeof rule.min === 'number' && clamped < rule.min) {
      clamped = rule.min;
      issue = `Value ${num} clamped to minimum ${rule.min} for ${key}`;
    }
    if (typeof rule.max === 'number' && clamped > rule.max) {
      clamped = rule.max;
      issue = `Value ${num} clamped to maximum ${rule.max} for ${key}`;
    }
    return { valid: issue === undefined, clampedValue: clamped, issue };
  }

  if (rule.type === 'string') {
    if (typeof value !== 'string') {
      return {
        valid: false,
        clampedValue: rule.default,
        issue: `Expected string for ${key}, received ${typeof value}`,
      };
    }
    if (rule.enum && !rule.enum.includes(value)) {
      return {
        valid: false,
        clampedValue: rule.default,
        issue: `Value "${value}" is not one of: ${rule.enum.join(', ')}`,
      };
    }
    return { valid: true, clampedValue: value };
  }

  if (rule.type === 'array') {
    if (Array.isArray(value)) {
      return { valid: true, clampedValue: value };
    }
    return {
      valid: false,
      clampedValue: rule.default,
      issue: `Expected array for ${key}, received ${typeof value}`,
    };
  }

  return { valid: true, clampedValue: value };
}
