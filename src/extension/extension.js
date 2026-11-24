/**
 * Extension entry point.
 *
 * Activation is deliberately cheap: create a logger, build the adapter registry,
 * register three commands. Nothing touches the file system, spawns a process, or
 * reads workspace contents until the user invokes a command. That keeps startup
 * fast and keeps Restricted Mode inert.
 */

import * as vscode from 'vscode';
import { createLogger } from './log.js';
import { createAdapterRegistry } from '../core/adapterRegistry.js';
import { mockAdapter } from '../adapters/mock/index.js';
import { CPP_ADAPTER_ID, cppAdapter } from '../adapters/cpp/index.js';
import { C_ADAPTER_ID, cAdapter } from '../adapters/c/index.js';
import { javaAdapter } from '../adapters/java/index.js';
import { JS_ADAPTER_ID, javascriptAdapter } from '../adapters/javascript/index.js';
import { createCppAnalysisService } from './cpp/pipeline.js';
import { createJavaScriptAnalysisService } from './javascript/pipeline.js';
import { runTool } from './tooling/runTool.js';
import { createPanelManager } from './panel.js';
import { registerCommands } from './commands.js';
import { createWorkspaceIndexService } from './indexing/service.js';
import { PROTOCOL_VERSION } from '../core/protocol/envelope.js';

const EXTENSION_VERSION = '1.1.0';

/**
 * Read the C++ settings. Called per analysis so a settings change takes effect
 * without reloading the window.
 *
 * @returns {import('./cpp/pipeline.js').CppSettings}
 */
function cppSettings() {
  const config = vscode.workspace.getConfiguration('codeflow');
  return {
    clangPath: config.get('cpp.clangPath', ''),
    compileCommandsPath: config.get('cpp.compileCommandsPath', ''),
    fallbackIncludePaths: config.get('cpp.fallbackIncludePaths', []),
    fallbackDefines: config.get('cpp.fallbackDefines', []),
    fallbackStandard: config.get('cpp.fallbackStandard', ''),
    timeoutMs: config.get('cpp.timeoutMs', 60_000),
    maxOutputBytes: config.get('cpp.maxOutputBytes', 64 * 1024 * 1024),
    maxTuBytes: config.get('cpp.maxFileBytes', 4 * 1024 * 1024),
  };
}

/**
 * Read the JavaScript settings. Called per analysis so a settings change takes
 * effect without reloading the window.
 *
 * @returns {import('./javascript/pipeline.js').JavaScriptSettings}
 */
function javascriptSettings() {
  const config = vscode.workspace.getConfiguration('codeflow');
  return {
    resolveNodeModules: config.get('javascript.resolveNodeModules', false),
    maxFileBytes: config.get('javascript.maxFileBytes', 2 * 1024 * 1024),
    maxLines: config.get('javascript.maxLines', 20_000),
    maxModules: config.get('javascript.maxModules', 64),
    maxDepth: config.get('javascript.maxDepth', 8),
  };
}

/**
 * @param {vscode.ExtensionContext} context
 */
export async function activate(context) {
  const startedAt = Date.now();
  const logger = createLogger(context);

  const registry = createAdapterRegistry();
  registry.register(mockAdapter);
  registry.register(cppAdapter);
  registry.register(cAdapter);
  registry.register(javaAdapter);
  registry.register(javascriptAdapter);

  const cppAnalysis = createCppAnalysisService({
    registry,
    runTool,
    settings: cppSettings,
    logger,
  });
  const javascriptAnalysis = createJavaScriptAnalysisService({
    registry,
    settings: javascriptSettings,
    logger,
  });

  // The panel speaks to one analyzer. Route by the resolved adapter so the
  // panel and the command share exactly the same host pipeline.
  const analysis = {
    /**
     * @param {{path?: string}} input
     */
    analyze(input) {
      const adapter = registry.resolve(input?.path ?? '');
      if (adapter?.id === JS_ADAPTER_ID) {
        return javascriptAnalysis.analyze(input);
      }
      if (adapter?.id === CPP_ADAPTER_ID || adapter?.id === C_ADAPTER_ID) {
        return cppAnalysis.analyze(input);
      }
      return registry.analyze(input);
    },
  };

  const indexService = createWorkspaceIndexService({
    context,
    logger,
    analysis,
    extensionVersion: EXTENSION_VERSION,
  });

  const panelManager = createPanelManager({
    context,
    logger,
    registry,
    analysis,
    extensionVersion: EXTENSION_VERSION,
    indexProvider: indexService.indexProvider,
  });

  registerCommands({
    context,
    logger,
    panelManager,
    registry,
    extensionVersion: EXTENSION_VERSION,
    indexService,
  });

  context.subscriptions.push({
    dispose() {
      indexService.dispose();
      panelManager.dispose();
    },
  });

  logger.info('extension.activated', {
    ms: Date.now() - startedAt,
    version: EXTENSION_VERSION,
    vscode: vscode.version,
    trusted: vscode.workspace.isTrusted,
  });

  // Returned for integration tests and future commands; not a public API.
  return {
    version: EXTENSION_VERSION,
    protocolVersion: PROTOCOL_VERSION,
    registry,
    analysis,
    panelManager,
    indexService,
    logger,
  };
}

export function deactivate() {
  // Disposables registered in `context.subscriptions` handle teardown.
}
