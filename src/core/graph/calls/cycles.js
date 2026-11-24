/**
 * Call-graph cycle detection (Phase 7 §4, §9, P7-04).
 *
 * Uses Tarjan's strongly-connected-components algorithm plus self-loop scanning
 * to identify direct recursion (`A -> A`) and mutual recursion (`A -> B -> A`)
 * in linear O(V + E) time without unbounded traversal.
 */

/**
 * @param {Array<{id?: string, symbolId?: string}>} nodes
 * @param {Array<{id?: string, relationshipId?: string, from: string, to: string, type?: string}>} edges
 * @returns {{
 *   cycleEdgeIds: Set<string>,
 *   cyclicSymbolIds: Set<string>,
 *   sccs: string[][],
 *   cycles: Array<{kind: 'self'|'mutual', members: string[], edgeIds: string[]}>,
 * }}
 */
export function detectCallCycles(nodes, edges) {
  const vertexSet = new Set();
  for (const node of Array.isArray(nodes) ? nodes : []) {
    const id = node?.id ?? node?.symbolId;
    if (typeof id === 'string' && id.length > 0) {
      vertexSet.add(id);
    }
  }
  for (const edge of Array.isArray(edges) ? edges : []) {
    if (typeof edge?.from === 'string' && edge.from.length > 0) {
      vertexSet.add(edge.from);
    }
    if (typeof edge?.to === 'string' && edge.to.length > 0) {
      vertexSet.add(edge.to);
    }
  }

  const vertices = [...vertexSet].sort();
  /** @type {Map<string, Array<{to: string, edgeId: string}>>} */
  const adjacency = new Map(vertices.map((v) => [v, []]));
  /** @type {Set<string>} */
  const cycleEdgeIds = new Set();
  /** @type {Set<string>} */
  const cyclicSymbolIds = new Set();
  /** @type {Array<{kind: 'self'|'mutual', members: string[], edgeIds: string[]}>} */
  const cycles = [];

  for (const edge of Array.isArray(edges) ? edges : []) {
    if (!edge || typeof edge.from !== 'string' || typeof edge.to !== 'string') {
      continue;
    }
    const edgeId = String(edge.id ?? edge.relationshipId ?? `${edge.from}->${edge.to}`);
    adjacency.get(edge.from)?.push({ to: edge.to, edgeId });
    if (edge.from === edge.to) {
      cycleEdgeIds.add(edgeId);
      cyclicSymbolIds.add(edge.from);
      cycles.push({
        kind: 'self',
        members: [edge.from],
        edgeIds: [edgeId],
      });
    }
  }

  let index = 0;
  /** @type {Map<string, number>} */
  const indices = new Map();
  /** @type {Map<string, number>} */
  const lowlink = new Map();
  /** @type {string[]} */
  const stack = [];
  /** @type {Set<string>} */
  const onStack = new Set();
  /** @type {string[][]} */
  const sccs = [];

  /**
   * Iterative/bounded Tarjan DFS over vertices.
   *
   * @param {string} root
   */
  function strongConnect(root) {
    /** @type {Array<{v: string, neighborIndex: number}>} */
    const callStack = [{ v: root, neighborIndex: 0 }];
    indices.set(root, index);
    lowlink.set(root, index);
    index += 1;
    stack.push(root);
    onStack.add(root);

    while (callStack.length > 0) {
      const frame = callStack[callStack.length - 1];
      const neighbors = adjacency.get(frame.v) ?? [];

      if (frame.neighborIndex < neighbors.length) {
        const { to: w } = neighbors[frame.neighborIndex];
        frame.neighborIndex += 1;

        if (!indices.has(w)) {
          indices.set(w, index);
          lowlink.set(w, index);
          index += 1;
          stack.push(w);
          onStack.add(w);
          callStack.push({ v: w, neighborIndex: 0 });
        } else if (onStack.has(w)) {
          lowlink.set(frame.v, Math.min(lowlink.get(frame.v) ?? 0, indices.get(w) ?? 0));
        }
      } else {
        callStack.pop();
        if (callStack.length > 0) {
          const parent = callStack[callStack.length - 1].v;
          lowlink.set(parent, Math.min(lowlink.get(parent) ?? 0, lowlink.get(frame.v) ?? 0));
        }

        if (lowlink.get(frame.v) === indices.get(frame.v)) {
          /** @type {string[]} */
          const component = [];
          while (stack.length > 0) {
            const w = /** @type {string} */ (stack.pop());
            onStack.delete(w);
            component.push(w);
            if (w === frame.v) {
              break;
            }
          }
          component.sort();
          if (component.length > 1) {
            sccs.push(component);
            const memberSet = new Set(component);
            /** @type {string[]} */
            const memberEdges = [];
            for (const member of component) {
              cyclicSymbolIds.add(member);
              for (const next of adjacency.get(member) ?? []) {
                if (memberSet.has(next.to)) {
                  cycleEdgeIds.add(next.edgeId);
                  memberEdges.push(next.edgeId);
                }
              }
            }
            cycles.push({
              kind: 'mutual',
              members: component,
              edgeIds: memberEdges.sort(),
            });
          }
        }
      }
    }
  }

  for (const v of vertices) {
    if (!indices.has(v)) {
      strongConnect(v);
    }
  }

  return {
    cycleEdgeIds,
    cyclicSymbolIds,
    sccs,
    cycles,
  };
}
