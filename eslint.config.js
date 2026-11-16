import js from '@eslint/js';

/** Globals available in Node (tests, scripts, extension host). */
const nodeGlobals = {
  Buffer: 'readonly',
  console: 'readonly',
  clearInterval: 'readonly',
  clearTimeout: 'readonly',
  process: 'readonly',
  queueMicrotask: 'readonly',
  setImmediate: 'readonly',
  setInterval: 'readonly',
  setTimeout: 'readonly',
  structuredClone: 'readonly',
  TextDecoder: 'readonly',
  TextEncoder: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
};

/** Browser globals for the webview bundle. */
const browserGlobals = {
  acquireVsCodeApi: 'readonly',
  console: 'readonly',
  document: 'readonly',
  HTMLElement: 'readonly',
  HTMLButtonElement: 'readonly',
  SVGElement: 'readonly',
  SVGSVGElement: 'readonly',
  window: 'readonly',
};

/** CommonJS globals for the VS Code integration-test entry. */
const commonJsGlobals = {
  module: 'writable',
  require: 'readonly',
  __dirname: 'readonly',
  exports: 'writable',
};

export default [
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      'context/**',
      'docs/**',
      '.vscode-test/**',
      'codeflow.vsix',
      '**/*.vsix',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...nodeGlobals, ...browserGlobals },
    },
    rules: {
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-async-promise-executor': 'error',
      'no-console': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-return-await': 'error',
      'no-throw-literal': 'error',
      'no-unused-vars': [
        'error',
        { args: 'after-used', argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-var': 'error',
      'prefer-const': ['error', { destructuring: 'all' }],
    },
  },
  {
    // The core, adapters, and rendering layers must stay host-independent.
    files: [
      'src/core/**/*.js',
      'src/adapters/**/*.js',
      'src/visualization/**/*.js',
      'src/webview/**/*.js',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'vscode',
              message:
                'This layer must not depend on the VS Code API. Inject a transport or adapter instead.',
            },
            {
              name: 'node:fs',
              message: 'File access belongs in the extension host, behind a validated service.',
            },
            {
              name: 'node:child_process',
              message: 'Process spawning belongs in a host-controlled tool facility.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/webview/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['scripts/**/*.js', 'tests/**/*.js'],
    rules: {
      'no-console': 'off',
    },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...nodeGlobals, ...commonJsGlobals },
    },
  },
];
