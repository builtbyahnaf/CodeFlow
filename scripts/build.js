/**
 * Build script.
 *
 * Two bundles:
 * - dist/extension.cjs  (Node/CommonJS, `vscode` external)
 * - dist/webview/main.js (browser/IIFE, no Node built-ins)
 *
 * Assets are copied next to the webview bundle so `webview.asWebviewUri` has a
 * stable, narrow `localResourceRoots` target.
 */

import esbuild from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const webviewDir = path.join(distDir, 'webview');
const watch = process.argv.includes('--watch');
const production = process.argv.includes('--production') || process.env.NODE_ENV === 'production';

const shared = {
  bundle: true,
  legalComments: 'none',
  logLevel: 'info',
  sourcemap: production ? false : 'inline',
  minify: production,
  metafile: true,
};

/** @type {import('esbuild').BuildOptions} */
const extensionOptions = {
  ...shared,
  entryPoints: [path.join(root, 'src/extension/extension.js')],
  outfile: path.join(distDir, 'extension.cjs'),
  platform: 'node',
  format: 'cjs',
  target: ['node20'],
  external: ['vscode'],
  define: {
    'process.env.NODE_ENV': JSON.stringify(production ? 'production' : 'development'),
  },
};

/** @type {import('esbuild').BuildOptions} */
const webviewOptions = {
  ...shared,
  entryPoints: [path.join(root, 'src/webview/main.js')],
  outfile: path.join(webviewDir, 'main.js'),
  platform: 'browser',
  format: 'iife',
  target: ['chrome110'],
};

const ASSETS = [
  { from: 'src/webview/styles.css', to: 'dist/webview/styles.css' },
];

/**
 * @returns {import('esbuild').Plugin}
 */
function assetPlugin() {
  return {
    name: 'codeflow-assets',
    setup(build) {
      build.onEnd(async (result) => {
        if (result.errors.length > 0) {
          return;
        }
        await fs.mkdir(webviewDir, { recursive: true });
        for (const asset of ASSETS) {
          await fs.copyFile(path.join(root, asset.from), path.join(root, asset.to));
        }
        const report = await buildReport();
        await fs.writeFile(
          path.join(distDir, 'build-report.json'),
          `${JSON.stringify(report, null, 2)}\n`,
          'utf8',
        );
        console.log(
          `[build] extension ${report.extensionBytes} bytes · webview ${report.webviewBytes} bytes · css ${report.stylesBytes} bytes${production ? ' · production' : ''}`,
        );
      });
    },
  };
}

/**
 * @returns {Promise<{extensionBytes: number, webviewBytes: number, stylesBytes: number, production: boolean}>}
 */
async function buildReport() {
  /**
   * @param {string} file
   * @returns {Promise<number>}
   */
  const size = async (file) => {
    try {
      const stat = await fs.stat(path.join(root, file));
      return stat.size;
    } catch {
      return 0;
    }
  };
  return {
    extensionBytes: await size('dist/extension.cjs'),
    webviewBytes: await size('dist/webview/main.js'),
    stylesBytes: await size('dist/webview/styles.css'),
    production,
  };
}

async function main() {
  await fs.mkdir(webviewDir, { recursive: true });

  const extensionContext = await esbuild.context({
    ...extensionOptions,
    plugins: [assetPlugin()],
  });
  const webviewContext = await esbuild.context(webviewOptions);

  if (watch) {
    await Promise.all([extensionContext.watch(), webviewContext.watch()]);
    console.log('[build] watching src/ — press Ctrl+C to stop');
    return;
  }

  await Promise.all([extensionContext.rebuild(), webviewContext.rebuild()]);
  await Promise.all([extensionContext.dispose(), webviewContext.dispose()]);
  await fs.copyFile(path.join(root, 'src/webview/styles.css'), path.join(webviewDir, 'styles.css'));
  const report = await buildReport();
  await fs.writeFile(
    path.join(distDir, 'build-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
    'utf8',
  );
  console.log(
    `[build] extension ${report.extensionBytes} bytes · webview ${report.webviewBytes} bytes · css ${report.stylesBytes} bytes${production ? ' · production' : ''}`,
  );
}

main().catch((error) => {
  console.error('[build] failed:', error);
  process.exitCode = 1;
});
