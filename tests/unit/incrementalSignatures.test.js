import test from 'node:test';
import assert from 'node:assert/strict';

import {
  computeSymbolSignature,
  diffFileRows,
} from '../../src/core/indexing/incremental/signatures.js';

test('computeSymbolSignature ignores line numbers and body shifts while detecting signature/visibility changes (P9-05)', () => {
  const base = {
    symbol_id: 'sym:fn',
    kind: 'function',
    name: 'compute',
    qualified_name: 'compute',
    visibility: 'public',
    start_line: 10,
    start_col: 0,
    end_line: 20,
    end_col: 1,
    extensions_json: JSON.stringify({ parameters: ['a', 'b'], returnType: 'number' }),
  };

  const shiftedLines = {
    ...base,
    start_line: 45,
    end_line: 55,
  };
  assert.equal(
    computeSymbolSignature(base),
    computeSymbolSignature(shiftedLines),
    'line shift must not alter symbol signature',
  );

  const paramChanged = {
    ...base,
    extensions_json: JSON.stringify({ parameters: ['a', 'b', 'c'], returnType: 'number' }),
  };
  assert.notEqual(computeSymbolSignature(base), computeSymbolSignature(paramChanged));
});

test('diffFileRows classifies added, removed, signature-changed, range-shifted symbols, relationships, and dependencies', () => {
  const prev = {
    symbolRows: [
      {
        symbol_id: 'sym:a',
        kind: 'function',
        name: 'a',
        qualified_name: 'a',
        visibility: 'public',
        start_line: 0,
        start_col: 0,
        end_line: 5,
        end_col: 1,
      },
    ],
    relationshipRows: [
      {
        type: 'calls',
        from_id: 'sym:a',
        to_id: 'sym:helper',
        status: 'resolved',
        site_start_line: 2,
      },
    ],
    dependencyRows: [
      { from_file: 'file:a', to_file: 'file:b', type: 'imports', status: 'resolved' },
    ],
  };

  // Pure line shift (comment inserted above function) -> isSemanticNoOp: true
  const lineShifted = {
    symbolRows: [{ ...prev.symbolRows[0], start_line: 3, end_line: 8 }],
    relationshipRows: [{ ...prev.relationshipRows[0], site_start_line: 5 }],
    dependencyRows: [...prev.dependencyRows],
  };
  const noOpDiff = diffFileRows(prev, lineShifted);
  assert.equal(noOpDiff.isSemanticNoOp, true);
  assert.deepEqual(noOpDiff.rangeShiftedSymbols, ['sym:a']);

  // Added symbol and new dependency
  const expanded = {
    symbolRows: [
      ...prev.symbolRows,
      {
        symbol_id: 'sym:new',
        kind: 'function',
        name: 'newFn',
        qualified_name: 'newFn',
        visibility: 'public',
        start_line: 10,
        start_col: 0,
        end_line: 12,
        end_col: 1,
      },
    ],
    relationshipRows: prev.relationshipRows,
    dependencyRows: [
      ...prev.dependencyRows,
      { from_file: 'file:a', to_file: 'file:c', type: 'imports', status: 'resolved' },
    ],
  };
  const expDiff = diffFileRows(prev, expanded);
  assert.equal(expDiff.isSemanticNoOp, false);
  assert.equal(expDiff.symbolsIdentical, false);
  assert.deepEqual(expDiff.addedSymbols, ['sym:new']);
  assert.deepEqual(expDiff.addedDependencyTargets, ['file:c']);
});
