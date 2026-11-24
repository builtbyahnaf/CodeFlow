import test from 'node:test';
import assert from 'node:assert/strict';

import { parseGitignoreHints, shouldIndexPath } from '../../src/core/indexing/exclusions.js';

test('shouldIndexPath always excludes .codeflow and .git even if user include matches', () => {
  const codeflowCheck = shouldIndexPath('.codeflow/index/codeflow.sqlite', {
    include: ['**/*'],
    exclude: [],
  });
  assert.equal(codeflowCheck.allowed, false);
  assert.equal(codeflowCheck.reason, 'always_excluded');

  const gitCheck = shouldIndexPath('.git/config', {
    include: ['**/*'],
    exclude: [],
  });
  assert.equal(gitCheck.allowed, false);
  assert.equal(gitCheck.reason, 'always_excluded');
});

test('shouldIndexPath enforces precedence: user exclude > user include > default excludes & gitignore hints', () => {
  // Default excluded directory (node_modules, build, cmake-build-debug)
  assert.equal(shouldIndexPath('node_modules/pkg/index.js').allowed, false);
  assert.equal(shouldIndexPath('cmake-build-debug/main.cpp').allowed, false);

  // User include can opt a default-excluded directory back in if not in user exclude
  const optedIn = shouldIndexPath('vendor/custom/helper.cpp', {
    include: ['vendor/custom/**/*.cpp'],
    exclude: [],
  });
  assert.equal(optedIn.allowed, true);
  assert.equal(optedIn.language, 'cpp');

  // User exclude wins over user include
  const excludedAgain = shouldIndexPath('vendor/custom/helper.cpp', {
    include: ['vendor/custom/**/*.cpp'],
    exclude: ['vendor/**'],
  });
  assert.equal(excludedAgain.allowed, false);
  assert.equal(excludedAgain.reason, 'user_excluded');

  // Gitignore hint exclusion
  const gitignorePatterns = parseGitignoreHints('# comment\ngenerated/\n*.gen.cpp\n!keep.cpp\n');
  assert.equal(shouldIndexPath('generated/foo.js', { gitignorePatterns }).allowed, false);
  assert.equal(
    shouldIndexPath('src/foo.gen.cpp', { gitignorePatterns }).reason,
    'gitignore_excluded',
  );
});

test('shouldIndexPath rejects binary, minified, bundle, and unsupported extensions', () => {
  assert.equal(shouldIndexPath('assets/logo.png').reason, 'binary_or_generated');
  assert.equal(shouldIndexPath('dist/app.min.js').allowed, false);
  assert.equal(shouldIndexPath('src/vendor.bundle.js').reason, 'minified_or_bundle');
  assert.equal(shouldIndexPath('README.md').reason, 'unsupported_extension');

  const validJs = shouldIndexPath('src/core/engine.js');
  assert.equal(validJs.allowed, true);
  assert.equal(validJs.language, 'javascript');

  const validCpp = shouldIndexPath('src/native/parser.hpp');
  assert.equal(validCpp.allowed, true);
  assert.equal(validCpp.language, 'cpp');
});
