import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeContentFingerprint,
  diffWorkspaceFingerprints,
} from '../../src/core/indexing/fingerprints.js';

test('computeContentFingerprint produces deterministic SHA-256 hash, byte size, and line count', () => {
  const fp1 = computeContentFingerprint('function a() {\n  return 1;\n}\n');
  const fp2 = computeContentFingerprint('function a() {\n  return 1;\n}\n');
  const fp3 = computeContentFingerprint('function a() {\n  return 2;\n}\n');

  assert.equal(fp1.contentHash, fp2.contentHash);
  assert.notEqual(fp1.contentHash, fp3.contentHash);
  assert.match(fp1.contentHash, /^sha256:[0-9a-f]{64}$/);
  assert.equal(fp1.lineCount, 4);
  assert.ok(fp1.sizeBytes > 0);
});

test('diffWorkspaceFingerprints classifies unchanged, added, modified, deleted, and renamed files', () => {
  const indexedFiles = {
    'file:unchanged': {
      file_id: 'file:unchanged',
      path: 'src/unchanged.js',
      content_hash: 'sha256:111',
      size_bytes: 10,
      line_count: 1,
      language: 'javascript',
    },
    'file:modified': {
      file_id: 'file:modified',
      path: 'src/modified.js',
      content_hash: 'sha256:222',
      size_bytes: 20,
      line_count: 2,
      language: 'javascript',
    },
    'file:deleted': {
      file_id: 'file:deleted',
      path: 'src/deleted.js',
      content_hash: 'sha256:333',
      size_bytes: 30,
      line_count: 3,
      language: 'javascript',
    },
    'file:old_name': {
      file_id: 'file:old_name',
      path: 'src/oldName.js',
      content_hash: 'sha256:444',
      size_bytes: 40,
      line_count: 4,
      language: 'javascript',
    },
  };

  const diskCandidates = [
    {
      fileId: 'file:unchanged',
      path: 'src/unchanged.js',
      contentHash: 'sha256:111',
      sizeBytes: 10,
      lineCount: 1,
      language: 'javascript',
    },
    {
      fileId: 'file:modified',
      path: 'src/modified.js',
      contentHash: 'sha256:222-new',
      sizeBytes: 25,
      lineCount: 3,
      language: 'javascript',
    },
    {
      fileId: 'file:added',
      path: 'src/added.js',
      contentHash: 'sha256:555',
      sizeBytes: 50,
      lineCount: 5,
      language: 'javascript',
    },
    {
      fileId: 'file:new_name',
      path: 'src/newName.js',
      contentHash: 'sha256:444',
      sizeBytes: 40,
      lineCount: 4,
      language: 'javascript',
    },
  ];

  const diff = diffWorkspaceFingerprints(indexedFiles, diskCandidates);

  assert.deepEqual(diff.unchanged, ['file:unchanged']);
  assert.deepEqual(
    diff.modified.map((m) => m.fileId),
    ['file:modified'],
  );
  assert.deepEqual(
    diff.added.map((a) => a.fileId),
    ['file:added'],
  );
  assert.deepEqual(diff.deleted, ['file:deleted']);
  assert.equal(diff.renamed.length, 1);
  assert.equal(diff.renamed[0].fromFileId, 'file:old_name');
  assert.equal(diff.renamed[0].toFileId, 'file:new_name');
});
