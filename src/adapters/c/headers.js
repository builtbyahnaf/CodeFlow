/**
 * C Header Inclusion & Dependency Graph (Phase 13 §3, P13-08, AC-13.4).
 *
 * Models `#include` relationships between translation units and header files (.h),
 * distinguishing workspace quote includes from system library headers.
 */

import { createFileId } from '../../core/csr/identity.js';
import { createRelationship } from '../../core/csr/entities.js';

/**
 * Standard C library system headers.
 */
export const C_SYSTEM_HEADERS = Object.freeze(
  new Set([
    'assert.h',
    'complex.h',
    'ctype.h',
    'errno.h',
    'fenv.h',
    'float.h',
    'inttypes.h',
    'iso646.h',
    'limits.h',
    'locale.h',
    'math.h',
    'setjmp.h',
    'signal.h',
    'stdalign.h',
    'stdarg.h',
    'stdatomic.h',
    'stdbool.h',
    'stddef.h',
    'stdint.h',
    'stdio.h',
    'stdlib.h',
    'stdnoreturn.h',
    'string.h',
    'tgmath.h',
    'threads.h',
    'time.h',
    'uchar.h',
    'wchar.h',
    'wctype.h',
  ]),
);

/**
 * Analyze header inclusions from AST locations and headerMap.
 *
 * @param {{
 *   tuPath: string,
 *   headerMap?: Record<string, unknown>,
 *   allFiles: Array<{ path: string, fileId: string }>,
 *   fileSymbolsByPath: Map<string, import('../../core/csr/entities.js').SymbolRecord>,
 *   allocator: { relationship: (input: { type: string, from: string, to: string }) => string },
 * }} options
 * @returns {{
 *   relationships: Array<import('../../core/csr/entities.js').Relationship>,
 *   systemHeaders: string[],
 *   workspaceHeaders: string[],
 * }}
 */
export function extractHeaderRelationships({
  tuPath,
  headerMap = {},
  allFiles,
  fileSymbolsByPath,
  allocator,
}) {
  const tuSymbol = fileSymbolsByPath.get(tuPath);
  const fromId = tuSymbol ? tuSymbol.symbolId : createFileId(tuPath);
  const relationships = [];
  const systemHeaders = [];
  const workspaceHeaders = [];
  const seenHeaders = new Set();

  // 1. Process explicit headerMap if provided by host
  for (const [headerPath, meta] of Object.entries(headerMap)) {
    const isSystem =
      /** @type {{isSystem?: boolean}} */ (meta)?.isSystem ||
      C_SYSTEM_HEADERS.has(headerPath.split('/').pop() || '');

    if (isSystem) {
      systemHeaders.push(headerPath);
    } else {
      workspaceHeaders.push(headerPath);
      seenHeaders.add(headerPath);

      const targetSym = fileSymbolsByPath.get(headerPath);
      const toId = targetSym ? targetSym.symbolId : createFileId(headerPath);

      relationships.push(
        createRelationship({
          relationshipId: allocator.relationship({
            type: 'includes',
            from: fromId,
            to: toId,
          }),
          type: 'includes',
          from: fromId,
          to: toId,
          status: 'resolved',
        }),
      );
    }
  }

  // 2. Discover header files present in the AST file table
  for (const file of allFiles) {
    if (file.path !== tuPath && (file.path.endsWith('.h') || file.path.endsWith('.hpp'))) {
      if (!seenHeaders.has(file.path)) {
        seenHeaders.add(file.path);
        workspaceHeaders.push(file.path);

        const targetSym = fileSymbolsByPath.get(file.path);
        const toId = targetSym ? targetSym.symbolId : file.fileId;

        relationships.push(
          createRelationship({
            relationshipId: allocator.relationship({
              type: 'includes',
              from: fromId,
              to: toId,
            }),
            type: 'includes',
            from: fromId,
            to: toId,
            status: 'resolved',
          }),
        );
      }
    }
  }

  return {
    relationships,
    systemHeaders,
    workspaceHeaders,
  };
}
