import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveCodeflowArtifactPath } from '../../src/storage/paths.js';

test('resolveCodeflowArtifactPath accepts paths inside .codeflow/ and rejects traversal or empty roots', () => {
  const ok = resolveCodeflowArtifactPath('/workspace/project', 'index/codeflow.sqlite');
  assert.equal(ok.ok, true);
  assert.match(ok.resolved.replace(/\\/g, '/'), /\/\.codeflow\/index\/codeflow\.sqlite$/);

  const escape = resolveCodeflowArtifactPath('/workspace/project', '../../etc/passwd');
  assert.equal(escape.ok, false);
  assert.equal(escape.code, 'E_PATH_UNSAFE');

  const emptyRoot = resolveCodeflowArtifactPath('', 'config.json');
  assert.equal(emptyRoot.ok, false);
  assert.equal(emptyRoot.code, 'E_PATH_UNSAFE');
});
