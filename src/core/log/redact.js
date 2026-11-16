/**
 * Log redaction.
 *
 * Logs are for diagnosing CodeFlow, not for reproducing project contents.
 * This module is the single place where a value becomes log text, so the rules
 * live in one tested function instead of being re-implemented at call sites.
 *
 * Absolute rules:
 * - Never log analyzed source text.
 * - Never log credentials, tokens, or keys, even if a caller passes them.
 * - Cap every value so one bad field cannot flood the output channel.
 */

export const MAX_FIELD_LENGTH = 500;
export const MAX_FIELDS = 20;
const MAX_DEPTH = 3;

const SECRET_KEY_PATTERN =
  /(pass(word)?|secret|token|api[-_]?key|apikey|credential|authorization|cookie|private[-_]?key)/i;

const SECRET_VALUE_PATTERNS = [
  [/\bgh[pousr]_[A-Za-z0-9]{20,}\b/g, 'gh*_***'],
  [/\bgithub_pat_[A-Za-z0-9_]{20,}\b/g, 'github_pat_***'],
  [/\bsk-[A-Za-z0-9]{20,}\b/g, 'sk-***'],
  [/\bAKIA[0-9A-Z]{16}\b/g, 'AKIA***'],
  [/\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, 'xox*-***'],
];

/**
 * @param {string} input
 * @returns {string}
 */
export function redactString(input) {
  let output = input;
  for (const [pattern, replacement] of SECRET_VALUE_PATTERNS) {
    output = output.replace(pattern, replacement);
  }
  if (output.length > MAX_FIELD_LENGTH) {
    const removed = output.length - MAX_FIELD_LENGTH;
    output = `${output.slice(0, MAX_FIELD_LENGTH)}…(+${removed} chars)`;
  }
  return output;
}

/**
 * @param {unknown} value
 * @param {number} depth
 * @returns {unknown}
 */
export function redactValue(value, depth = 0) {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === 'string') {
    return redactString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'bigint') {
    return `${value.toString()}n`;
  }
  if (typeof value === 'function') {
    return '[function]';
  }
  if (value instanceof Error) {
    return { name: value.name, message: redactString(value.message) };
  }
  if (depth >= MAX_DEPTH) {
    return Array.isArray(value) ? '[array]' : '[object]';
  }
  if (Array.isArray(value)) {
    return value.slice(0, MAX_FIELDS).map((item) => redactValue(item, depth + 1));
  }
  if (typeof value === 'object') {
    /** @type {Record<string, unknown>} */
    const output = {};
    const entries = Object.entries(value).slice(0, MAX_FIELDS);
    for (const [key, child] of entries) {
      output[key] = SECRET_KEY_PATTERN.test(key) ? '***' : redactValue(child, depth + 1);
    }
    return output;
  }
  return String(value);
}

/**
 * @param {Record<string, unknown> | undefined} fields
 * @returns {Record<string, unknown>}
 */
export function redactFields(fields) {
  if (!fields) {
    return {};
  }
  /** @type {Record<string, unknown>} */
  const output = {};
  for (const [key, value] of Object.entries(fields).slice(0, MAX_FIELDS)) {
    output[key] = SECRET_KEY_PATTERN.test(key) ? '***' : redactValue(value);
  }
  return output;
}

/**
 * Render one log line. Stable format: timestamp, level, message, fields.
 *
 * @param {{level: string, message: string, fields?: Record<string, unknown>, timestamp?: Date}} entry
 * @returns {string}
 */
export function formatLogLine(entry) {
  const timestamp = (entry.timestamp ?? new Date()).toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const fields = redactFields(entry.fields);
  const fieldKeys = Object.keys(fields);
  const suffix = fieldKeys.length > 0 ? ` ${JSON.stringify(fields)}` : '';
  return `[${timestamp}] ${level} ${redactString(entry.message)}${suffix}`;
}
