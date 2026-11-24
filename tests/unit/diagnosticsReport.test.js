import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  sanitizePath,
  redactErrorMessage,
  generateDiagnosticsReport,
} from '../../src/extension/diagnosticsReport.js';

describe('Privacy-Preserving Diagnostics Report (P12-17, AC-12.10)', () => {
  const mockWorkspace = 'C:\\Projects\\SecretApp';

  it('sanitizePath converts workspace paths to relative [workspace] prefixes', () => {
    const sanitized = sanitizePath('C:\\Projects\\SecretApp\\src\\engine.cpp', mockWorkspace);
    assert.equal(sanitized, '[workspace]/src/engine.cpp');
  });

  it('sanitizePath redacts user home directories', () => {
    const sanitized = sanitizePath('C:\\Users\\Alice\\.toolchains\\clang.exe');
    assert.equal(sanitized, '[home]/.toolchains/clang.exe');
  });

  it('redactErrorMessage eliminates absolute user paths and sensitive roots', () => {
    const raw = 'Failed to open C:\\Users\\Alice\\SecretApp\\file.js due to lock';
    const redacted = redactErrorMessage(raw);
    assert.ok(!redacted.includes('Alice'));
    assert.ok(redacted.includes('[home]'));
  });

  it('generateDiagnosticsReport produces compliant markdown without personal paths or source code', () => {
    const report = generateDiagnosticsReport({
      extensionVersion: '1.0.0',
      vscodeVersion: '1.93.0',
      nodeVersion: 'v20.18.0',
      platform: 'win32-x64',
      workspaceRoot: mockWorkspace,
      toolchain: {
        clangPath: 'C:\\Projects\\SecretApp\\tools\\clang.exe',
        clangVersion: 'clang version 18.1.8',
        compileCommandsFound: true,
      },
      indexHealth: {
        totalFiles: 42,
        totalSymbols: 318,
        status: 'Ready',
      },
      recentErrors: [
        {
          code: 'E_PARSE',
          message: 'Syntax error in C:\\Projects\\SecretApp\\bad.cpp at line 14',
          timestamp: '2026-11-24T10:00:00Z',
        },
      ],
    });

    assert.ok(report.includes('# CodeFlow Diagnostics Report'));
    assert.ok(report.includes('v1.0.0'));
    assert.ok(report.includes('[workspace]/tools/clang.exe'));
    assert.ok(!report.includes('C:\\Projects\\SecretApp'));
    assert.ok(report.includes('Feature Availability Matrix'));
    assert.ok(report.includes('Recent Errors (Redacted)'));
  });
});
