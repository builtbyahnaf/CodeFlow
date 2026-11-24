import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';

import { validatePathContainment } from '../../src/core/security/index.js';

describe('Security Path Containment (P12-18, AC-12.11)', () => {
  const root = path.resolve('fixtures/security-root');

  it('allows safe workspace relative files and child paths', () => {
    const res1 = validatePathContainment('src/index.js', root);
    assert.equal(res1.safe, true);

    const res2 = validatePathContainment(path.join(root, 'src', 'deep', 'file.cpp'), root);
    assert.equal(res2.safe, true);
  });

  it('rejects path traversal escaping using parent directory navigation (..)', () => {
    const res = validatePathContainment('../../../etc/passwd', root);
    assert.equal(res.safe, false);
    assert.ok(res.reason?.includes('escapes root boundary'));
  });

  it('rejects UNC network paths', () => {
    const res1 = validatePathContainment('\\\\attacker-server\\share\\exploit.js', root);
    assert.equal(res1.safe, false);
    assert.ok(res1.reason?.includes('UNC network paths are forbidden'));

    const res2 = validatePathContainment('//attacker-server/share/exploit.js', root);
    assert.equal(res2.safe, false);
    assert.ok(res2.reason?.includes('UNC network paths are forbidden'));
  });

  it('rejects null byte injection', () => {
    const res = validatePathContainment('safe.js\0/../../secret.txt', root);
    assert.equal(res.safe, false);
    assert.ok(res.reason?.includes('Null byte'));
  });

  it('rejects empty or non-string paths safely', () => {
    const res1 = validatePathContainment('', root);
    assert.equal(res1.safe, false);

    const res2 = validatePathContainment(null, root);
    assert.equal(res2.safe, false);
  });
});
