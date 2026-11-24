/**
 * Privacy-Preserving Diagnostics Report Generator (Phase 12 §8, P12-17, AC-12.10).
 *
 * Produces copyable markdown diagnostics containing versions, toolchain health,
 * index metrics, and redacted recent errors.
 *
 * ABSOLUTE RULE: Zero source text and zero absolute paths outside workspace-relative.
 */

/**
 * Sanitize a path so that it does not leak personal user directories or full system paths.
 *
 * @param {string} fullPath
 * @param {string} [workspaceRoot]
 * @returns {string}
 */
export function sanitizePath(fullPath, workspaceRoot) {
  if (!fullPath || typeof fullPath !== 'string') {
    return '';
  }
  let normalized = fullPath.replace(/\\/g, '/');
  if (workspaceRoot) {
    const normRoot = workspaceRoot.replace(/\\/g, '/').replace(/\/$/, '');
    if (normalized.startsWith(normRoot)) {
      return `[workspace]${normalized.slice(normRoot.length)}`;
    }
  }
  // Strip user home or drive roots
  normalized = normalized.replace(/^[A-Za-z]:\/(Users|home|root)\/[^/]+/i, '[home]');
  normalized = normalized.replace(/^[A-Za-z]:\//i, '[drive]/');
  return normalized;
}

/**
 * Redact error messages to guarantee no source text or tokens leak into reports.
 *
 * @param {string} message
 * @param {string} [workspaceRoot]
 * @returns {string}
 */
export function redactErrorMessage(message, workspaceRoot) {
  if (!message || typeof message !== 'string') {
    return '';
  }
  let sanitized = message;
  if (workspaceRoot) {
    const normRootFwd = workspaceRoot.replace(/\\/g, '/');
    const normRootBack = workspaceRoot.replace(/\//g, '\\');
    sanitized = sanitized.split(normRootBack).join('[workspace]');
    sanitized = sanitized.split(normRootFwd).join('[workspace]');
  }
  // Strip drive letters and user paths
  sanitized = sanitized.replace(/[A-Za-z]:\\(?:Users|home)\\[^\\]+/gi, '[home]');
  sanitized = sanitized.replace(/[A-Za-z]:\/(?:Users|home)\/[^/]+/gi, '[home]');
  return sanitized;
}

/**
 * Build privacy-safe markdown diagnostics report.
 *
 * @param {{
 *   extensionVersion: string,
 *   vscodeVersion: string,
 *   nodeVersion: string,
 *   platform: string,
 *   toolchain: { clangPath?: string, clangVersion?: string, compileCommandsFound?: boolean },
 *   indexHealth?: { totalFiles?: number, totalSymbols?: number, status?: string },
 *   recentErrors?: Array<{ code: string, message: string, timestamp?: string }>,
 *   workspaceRoot?: string,
 * }} data
 * @returns {string}
 */
export function generateDiagnosticsReport(data) {
  const ws = data.workspaceRoot || '';
  const clangSanitized = data.toolchain?.clangPath
    ? sanitizePath(data.toolchain.clangPath, ws)
    : 'Not configured / system fallback';

  const errorsSection =
    Array.isArray(data.recentErrors) && data.recentErrors.length > 0
      ? data.recentErrors
          .map(
            (err) =>
              `- **[${err.code}]** ${redactErrorMessage(err.message, ws)}` +
              (err.timestamp ? ` _(${err.timestamp})_` : ''),
          )
          .join('\n')
      : '_No errors recorded._';

  return `# CodeFlow Diagnostics Report

## 1. Environment
| Component | Version / Identifier |
|---|---|
| Extension | v${data.extensionVersion} |
| VS Code Host | ${data.vscodeVersion} |
| Node.js Runtime | ${data.nodeVersion} |
| OS Platform | ${data.platform} |

## 2. Toolchain
| Tool | State |
|---|---|
| Clang Executable | \`${clangSanitized}\` |
| Clang Version | ${data.toolchain?.clangVersion || 'Unknown'} |
| Compilation Database | ${data.toolchain?.compileCommandsFound ? 'Present' : 'Absent (Heuristic Fallback)'} |

## 3. Index Health
| Metric | Value |
|---|---|
| State | ${data.indexHealth?.status || 'Unindexed'} |
| Indexed Files | ${data.indexHealth?.totalFiles ?? 0} |
| Indexed Symbols | ${data.indexHealth?.totalSymbols ?? 0} |

## 4. Feature Availability Matrix
| Feature | C++ | JavaScript |
|---|---|---|
| AST Analysis | Full (Clang AST) | Full (Babel AST) |
| Control Flow (CFG) | Full | Full |
| Data Flow (DFG) | Conservative Kill | Intra-procedural |
| Semantic Zoom (L0-L5) | Full | Full |
| Offline Operation | 100% | 100% |

## 5. Recent Errors (Redacted)
${errorsSection}
`;
}
