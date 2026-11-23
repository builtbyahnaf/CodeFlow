import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { createQueryLayer } from '../../src/core/csr/query.js';
import { createCapabilities } from '../../src/core/adapterRegistry.js';
import { buildCfg } from '../../src/core/graph/cfg/builder.js';
import { toCfgDto } from '../../src/core/graph/cfg/dto.js';
import {
  createDocumentView,
  rangeWithinDocument,
  sliceText,
} from '../../src/core/source/ranges.js';
import { javascriptAdapter } from '../../src/adapters/javascript/index.js';
import { mapClangAst } from '../../src/adapters/cpp/mapper.js';

const CAPABILITIES = createCapabilities({ generateCFG: true });

const queryFor = (run) => createQueryLayer(run, { capabilities: CAPABILITIES });

/**
 * Every non-synthetic node with a range must slice to real, non-empty source
 * text from the analyzed document. This is the Phase 5 accuracy contract.
 *
 * @param {Record<string, any>} run
 * @param {Map<string, string>} textByFileId
 * @returns {{checked: number, files: Set<string>}}
 */
function assertAllNodesResolve(run, textByFileId) {
  const query = queryFor(run);
  const functions = query.cfgFunctions();
  assert.equal(functions.ok, true);
  assert.ok(functions.value.length > 0, 'fixture must expose at least one function');

  const files = new Set();
  let checked = 0;

  for (const entry of functions.value) {
    const built = buildCfg(query, entry.symbolId);
    assert.equal(built.ok, true, built.ok ? '' : built.message);
    const dto = toCfgDto(built.cfg);
    for (const node of dto.nodes) {
      if (node.isSynthetic || !node.range) {
        continue;
      }
      const text = textByFileId.get(node.range.fileId);
      if (text === undefined) {
        // A node in a header or imported module is outside this fixture's text
        // map; it is not a fidelity failure of the analyzed document.
        continue;
      }
      files.add(node.range.fileId);
      const view = createDocumentView(text);
      const bounds = rangeWithinDocument(node.range, view);
      assert.equal(
        bounds.ok,
        true,
        `${node.kind} ${node.id}: ${bounds.ok ? '' : bounds.issues.join(' ')}`,
      );
      const slice = sliceText(text, node.range);
      assert.ok(
        slice.trim().length > 0,
        `${node.kind} ${node.id} sliced to empty text at ${node.range.startLine}:${node.range.startColumn}`,
      );
      // Slicing the same range twice is stable; a preview can be regenerated.
      assert.equal(sliceText(text, node.range), slice);
      checked += 1;
    }
  }

  return { checked, files };
}

const JS_SOURCE = `function classify(n) {
  if (n < 0) {
    return 'negative';
  } else if (n === 0) {
    return 'zero';
  }
  for (let i = 0; i < n; i += 1) {
    if (i === 3) continue;
    if (i > 5) break;
  }
  try {
    return n > 10 ? 'large' : 'small';
  } catch (error) {
    throw error;
  }
}
`;

test('every JavaScript CFG node slices to exact source from the analyzed file', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:fidelity-js',
    path: 'src/classify.js',
    text: JS_SOURCE,
  });
  const fileId = run.files[0].fileId;
  const { checked, files } = assertAllNodesResolve(run, new Map([[fileId, JS_SOURCE]]));
  assert.ok(checked > 10, `expected many source nodes, checked ${checked}`);
  assert.equal(files.size, 1);
});

test('every C++ CFG node slices to exact source from a consistent AST fixture', () => {
  const root = 'tests/fixtures/cpp';
  const text = fs.readFileSync(path.join(root, 'parity.cpp'), 'utf8');
  const ast = JSON.parse(fs.readFileSync(path.join(root, 'ast-parity.json'), 'utf8'));
  const run = mapClangAst({
    runId: 'run:fidelity-cpp',
    path: 'src/parity.cpp',
    text,
    workspaceRoot: 'D:/w',
    ast,
    mode: 'compile-db',
    adapterId: 'cpp-clang',
    adapterVersion: '0.1.0',
  });
  const fileId = run.files[0].fileId;
  const { checked } = assertAllNodesResolve(run, new Map([[fileId, text]]));
  assert.ok(checked > 4, `expected source nodes, checked ${checked}`);
});

test('the CFG DTO carries ranges and short labels, never the whole source body', () => {
  const run = javascriptAdapter.analyze({
    runId: 'run:fidelity-js',
    path: 'src/classify.js',
    text: JS_SOURCE,
  });
  const query = queryFor(run);
  const built = buildCfg(query, query.cfgFunctions().value[0].symbolId);
  const dto = toCfgDto(built.cfg);
  const serialized = JSON.stringify(dto);

  // The full fixture text must not appear as a value. Node labels are derived
  // and short; a leak would embed whole lines or the whole function.
  assert.ok(!serialized.includes(JS_SOURCE));
  assert.ok(!serialized.includes('  if (n < 0) {'));
  assert.ok(!serialized.includes('return \'negative\';'));
  for (const node of dto.nodes) {
    assert.equal(typeof node.label, 'string');
    assert.ok(!node.label.includes('\n'), 'labels are single-line derivations');
    assert.ok(node.label.length <= 160, `label too long: ${node.label.slice(0, 40)}…`);
  }
});
