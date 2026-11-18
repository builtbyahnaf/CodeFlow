import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildHeaderMap,
  extractIncludes,
  isHeaderPath,
  selectRepresentativeTu,
} from '../../src/extension/cpp/headers.js';

const entries = [
  {
    directory: '',
    absoluteFile: '/w/src/main.cpp',
    path: 'src/main.cpp',
    arguments: [],
    flags: [],
  },
  {
    directory: '',
    absoluteFile: '/w/src/util.cpp',
    path: 'src/util.cpp',
    arguments: [],
    flags: [],
  },
  { directory: '', absoluteFile: '/w/app/app.cpp', path: 'app/app.cpp', arguments: [], flags: [] },
];

test('include directives keep their spelling, kind and line', () => {
  const includes = extractIncludes(
    ['#include <vector>', '# include "common/util.h"', '// #include "ignored.h"', 'int x;'].join(
      '\n',
    ),
  );
  assert.deepEqual(includes, [
    { name: 'vector', system: true, line: 0 },
    { name: 'common/util.h', system: false, line: 1 },
  ]);
  assert.deepEqual(extractIncludes(undefined), []);
});

test('header extensions are recognized case-insensitively', () => {
  for (const name of ['a.h', 'b.hpp', 'c.hh', 'd.hxx', 'e.ipp', 'F.HPP']) {
    assert.equal(isHeaderPath(name), true, name);
  }
  assert.equal(isHeaderPath('main.cpp'), false);
});

test('a header is mapped to a TU that includes it', () => {
  const includesByTu = {
    'src/main.cpp': [{ name: 'common/util.h', system: false, line: 2 }],
    'app/app.cpp': [{ name: '../../src/common/util.h', system: false, line: 1 }],
  };
  const selected = selectRepresentativeTu({
    headerPath: 'src/common/util.h',
    entries,
    includesByTu,
  });
  assert.ok(selected);
  assert.equal(selected.tu.path, 'app/app.cpp');
  assert.equal(selected.reason, 'same_directory');
  assert.deepEqual(selected.candidates, ['app/app.cpp', 'src/main.cpp']);
});

test('angle includes never create a workspace header mapping', () => {
  const selected = selectRepresentativeTu({
    headerPath: 'src/util.h',
    entries,
    includesByTu: { 'src/main.cpp': [{ name: 'util.h', system: true, line: 1 }] },
  });
  assert.equal(selected, null);
});

test('unmapped headers are reported, not silently dropped', () => {
  const result = buildHeaderMap({
    headerPaths: ['include/a.h', 'include/b.h'],
    entries,
    includesByTu: {
      'src/main.cpp': [{ name: 'a.h', system: false, line: 1 }],
    },
  });
  assert.equal(result.map['include/a.h'].tuPath, 'src/main.cpp');
  assert.deepEqual(result.unmapped, ['include/b.h']);
});

test('the mapping is deterministic when several TUs include a header', () => {
  const includesByTu = {
    'src/main.cpp': [{ name: 'shared.h', system: false, line: 1 }],
    'src/util.cpp': [{ name: 'shared.h', system: false, line: 1 }],
    'app/app.cpp': [{ name: 'shared.h', system: false, line: 1 }],
  };
  const first = buildHeaderMap({ headerPaths: ['include/shared.h'], entries, includesByTu });
  const second = buildHeaderMap({ headerPaths: ['include/shared.h'], entries, includesByTu });
  assert.deepEqual(first, second);
  assert.equal(first.map['include/shared.h'].tuPath, 'app/app.cpp');
});
