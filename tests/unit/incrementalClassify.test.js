import test from 'node:test';
import assert from 'node:assert/strict';

import { CHANGE_KINDS } from '../../src/core/indexing/incremental/events.js';
import { diffFileRows } from '../../src/core/indexing/incremental/signatures.js';
import {
  INVALIDATION_CLASSES,
  classifyChange,
} from '../../src/core/indexing/incremental/classify.js';

const baseRows = {
  symbolRows: [
    {
      symbol_id: 'sym:fn',
      kind: 'function',
      name: 'run',
      qualified_name: 'run',
      visibility: 'public',
      start_line: 1,
      start_col: 0,
      end_line: 6,
      end_col: 1,
    },
  ],
  relationshipRows: [{ type: 'calls', from_id: 'sym:fn', to_id: 'sym:inner1', status: 'resolved' }],
  dependencyRows: [
    { from_file: 'file:main', to_file: 'file:util', type: 'imports', status: 'resolved' },
  ],
};

test('classifyChange covers every row of the Phase 9 §5.1 classification table (Checkpoint M2)', () => {
  // 1. Comments/whitespace only -> local
  const commentDiff = diffFileRows(baseRows, {
    ...baseRows,
    symbolRows: [{ ...baseRows.symbolRows[0], start_line: 5, end_line: 10 }],
  });
  const commentClass = classifyChange({
    event: { kind: CHANGE_KINDS.EDITOR_SAVE, path: 'src/main.js' },
    rowDiff: commentDiff,
  });
  assert.equal(commentClass.scopeClass, INVALIDATION_CLASSES.LOCAL);
  assert.equal(commentClass.reason, 'comments_or_whitespace_only');
  assert.equal(commentClass.reanalyzeDependents, false);

  // 2. Function body changed (new internal call), symbol signature and imports unchanged -> local
  const bodyDiff = diffFileRows(baseRows, {
    ...baseRows,
    relationshipRows: [
      { type: 'calls', from_id: 'sym:fn', to_id: 'sym:inner2', status: 'resolved' },
    ],
  });
  const bodyClass = classifyChange({
    event: { kind: CHANGE_KINDS.EDITOR_SAVE, path: 'src/main.js' },
    rowDiff: bodyDiff,
  });
  assert.equal(bodyClass.scopeClass, INVALIDATION_CLASSES.LOCAL);
  assert.equal(bodyClass.reason, 'function_body_only');
  assert.equal(bodyClass.reanalyzeDependents, false);

  // 3. Symbol added/removed/signature changed -> dependent
  const symDiff = diffFileRows(baseRows, {
    ...baseRows,
    symbolRows: [
      {
        ...baseRows.symbolRows[0],
        visibility: 'private',
      },
    ],
  });
  const symClass = classifyChange({
    event: { kind: CHANGE_KINDS.EDITOR_SAVE, path: 'src/main.js' },
    rowDiff: symDiff,
  });
  assert.equal(symClass.scopeClass, INVALIDATION_CLASSES.DEPENDENT);
  assert.equal(symClass.reason, 'symbol_surface_or_signature_changed');
  assert.equal(symClass.reanalyzeDependents, true);

  // 4. Include/import set changed -> dependent
  const depDiff = diffFileRows(baseRows, {
    ...baseRows,
    dependencyRows: [
      { from_file: 'file:main', to_file: 'file:other', type: 'imports', status: 'resolved' },
    ],
  });
  const depClass = classifyChange({
    event: { kind: CHANGE_KINDS.EDITOR_SAVE, path: 'src/main.js' },
    rowDiff: depDiff,
  });
  assert.equal(depClass.scopeClass, INVALIDATION_CLASSES.DEPENDENT);
  assert.equal(depClass.reason, 'include_or_import_set_changed');
  assert.deepEqual(depClass.affectedDependencyTargets.sort(), ['file:other', 'file:util']);

  // 5. C++ header file declaration change -> dependent + transitive
  const headerClass = classifyChange({
    event: { kind: CHANGE_KINDS.EDITOR_SAVE, path: 'include/engine.hpp' },
    rowDiff: symDiff,
  });
  assert.equal(headerClass.scopeClass, INVALIDATION_CLASSES.DEPENDENT);
  assert.equal(headerClass.reason, 'header_declarations_changed');
  assert.equal(headerClass.transitiveDependents, true);

  // 6, 7, 8. Compile DB, exclusions config, and toolchain changes -> global
  assert.equal(classifyChange({ compileDbChanged: true }).scopeClass, INVALIDATION_CLASSES.GLOBAL);
  assert.equal(classifyChange({ configChanged: true }).scopeClass, INVALIDATION_CLASSES.GLOBAL);
  assert.equal(classifyChange({ toolchainChanged: true }).scopeClass, INVALIDATION_CLASSES.GLOBAL);
});
