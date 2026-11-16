/**
 * Diagnostics report.
 *
 * Must answer "why isn't this working?" without asking the user to open an
 * editor's developer tools. It contains versions, capability state, and setting
 * values — never source text and never secrets.
 */

import * as vscode from 'vscode';
import { PROTOCOL_VERSION } from '../core/protocol/envelope.js';

/**
 * @param {{
 *   registry: ReturnType<typeof import('../core/adapterRegistry.js').createAdapterRegistry>,
 *   panelManager: {isOpen: () => boolean, pendingRequests: () => number},
 *   logger: {level: () => string},
 *   extensionVersion: string,
 * }} options
 * @returns {string}
 */
export function buildDiagnosticsReport({ registry, panelManager, logger, extensionVersion }) {
  const versions = process.versions ?? {};
  const configuration = vscode.workspace.getConfiguration('codeflow');
  const workspaceFolders = (vscode.workspace.workspaceFolders ?? []).map(
    (folder) => folder.name,
  );

  const lines = [
    '# CodeFlow diagnostics',
    '',
    'Copy this report when filing an issue. It contains no source text.',
    '',
    '## Build',
    '',
    `- Extension: ${extensionVersion}`,
    `- VS Code: ${vscode.version}`,
    `- Protocol: v${PROTOCOL_VERSION}`,
    `- Node: ${versions.node ?? 'unknown'}`,
    `- Electron: ${versions.electron ?? 'n/a'}`,
    `- Chromium: ${versions.chrome ?? 'n/a'}`,
    `- Platform: ${process.platform} ${process.arch}`,
    '',
    '## Workspace',
    '',
    `- Folders: ${workspaceFolders.length > 0 ? workspaceFolders.join(', ') : '(none)'}`,
    `- Workspace trusted: ${vscode.workspace.isTrusted ? 'yes' : 'no'}`,
    '',
    '## Runtime',
    '',
    `- Log level: ${logger.level()}`,
    `- Graph panel open: ${panelManager.isOpen() ? 'yes' : 'no'}`,
    `- Pending webview requests: ${panelManager.pendingRequests()}`,
    '',
    '## Adapters',
    '',
  ];

  const adapters = registry.capabilityMatrix();
  if (adapters.length === 0) {
    lines.push('- No adapters registered.');
  } else {
    for (const adapter of adapters) {
      const enabled = Object.entries(adapter.capabilities)
        .filter(([, value]) => value)
        .map(([key]) => key);
      lines.push(
        `- ${adapter.id} (${adapter.languages.join(', ')}): ${
          enabled.length > 0 ? enabled.join(', ') : 'no capabilities'
        }`,
      );
    }
  }

  lines.push('', '## Settings', '');
  for (const key of ['logLevel', 'protocol.traceMessages', 'explorer.retainContext']) {
    lines.push(`- codeflow.${key}: ${JSON.stringify(configuration.get(key))}`);
  }

  lines.push(
    '',
    '## Known Phase 0 limits',
    '',
    '- Graph data comes from the mock adapter; no real C++ or JavaScript analysis exists yet.',
    '- No source preview, call graph, data flow, indexing, or explanations yet.',
    '- Capability flags above reflect adapter declarations, not shipped features.',
    '',
  );

  return lines.join('\n');
}

/**
 * @param {string} content
 * @returns {Promise<void>}
 */
export async function openDiagnosticsDocument(content) {
  const document = await vscode.workspace.openTextDocument({
    content,
    language: 'markdown',
  });
  await vscode.window.showTextDocument(document, { preview: true });
}
