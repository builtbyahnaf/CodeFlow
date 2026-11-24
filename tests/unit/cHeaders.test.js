import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

import {
  cAdapter,
  C_SYSTEM_HEADERS,
} from '../../src/adapters/c/index.js';

const source = await fs.readFile(new URL('../fixtures/c/headers.c', import.meta.url), 'utf8');
const ast = await fs.readFile(new URL('../fixtures/c/ast-headers.json', import.meta.url), 'utf8');

describe('C Header Inclusions & Relationships (P13-08, AC-13.4)', () => {
  it('C_SYSTEM_HEADERS contains standard C runtime headers', () => {
    assert.ok(C_SYSTEM_HEADERS.has('stdio.h'));
    assert.ok(C_SYSTEM_HEADERS.has('stdlib.h'));
    assert.ok(C_SYSTEM_HEADERS.has('string.h'));
    assert.ok(C_SYSTEM_HEADERS.has('stdbool.h'));
    assert.equal(C_SYSTEM_HEADERS.has('iostream'), false); // C++ header
  });

  it('maps #include relationships from TU to workspace quote headers', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-headers',
      path: 'src/headers.c',
      text: source,
      cAst: ast,
      cHeaderMap: {
        'src/headers.h': { isSystem: false },
      },
    });

    const includeRel = run.relationships.find((r) => r.type === 'includes');
    assert.ok(includeRel, 'Includes relationship must exist');
    assert.equal(includeRel.status, 'resolved');
  });

  it('resolves calls across included headers', () => {
    const run = cAdapter.analyze({
      runId: 'run:c-headers',
      path: 'src/headers.c',
      text: source,
      cAst: ast,
    });

    const useHeader = run.symbols.find((s) => s.name === 'use_header');
    const computeVal = run.symbols.find((s) => s.name === 'compute_header_value');
    assert.ok(useHeader && computeVal);

    const callRel = run.relationships.find(
      (r) => r.type === 'calls' && r.from === useHeader.symbolId && r.to === computeVal.symbolId,
    );
    assert.ok(callRel);
    assert.equal(callRel.status, 'resolved');
  });
});
