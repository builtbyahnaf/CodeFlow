# ADR 0009 — Graph rendering stack

**Status:** Accepted  
**Date:** 2026-11-23  
**Phase:** 4  
**Author:** Muhammad Tahmid Ahnaf (<this.is.ahnaf101@gmail.com>)

## Context

Phase 0 shipped a deliberately small SVG renderer behind an adapter-shaped
boundary (`src/visualization/renderer/`). Phase 4 is the first phase that draws
real control-flow graphs, and Phase 10 will aggregate many functions into one
view. The renderer and layout choice therefore has to survive dense graphs,
status encodings that do not rely on colour, and a CSP-restricted webview.

The candidates were:

1. **Cytoscape.js** with `cytoscape-dagre` for layered layout.
2. **ELK.js** for layout plus a custom SVG renderer.
3. **dagre** for layout plus a custom SVG renderer.
4. **D3** (`d3-selection` + `d3-zoom`) plus a custom renderer.
5. **Custom deterministic layered layout plus the existing custom SVG
   renderer.**

## Decision

Keep the custom SVG renderer and add a dedicated deterministic CFG layout in
the extension host (`src/core/graph/cfg/layout.js`). Layout runs before the DTO
crosses the boundary, so the webview only draws positions it receives.

The decision favours a tiny, auditable, CSP-friendly renderer and the ability to
encode every DTO field (status glyphs, dash patterns, case labels, degradation
badges) without fighting a library's model. It also keeps the existing Phase 0
swap point intact: if Phase 10 needs better large-graph routing, ELK can be
adopted for layout without changing the DTO or the core.

## Measurements

Machine: Windows 11 Pro, 12th Gen Intel Core i5-1235U, 15.7 GB RAM, Node
v24.22.1. Graphs are CFG-shaped DAGs (a spine with periodic two-way branches and
joins) matching the benchmark tiers. Layout timings are the median of three
runs. Bundle sizes are `esbuild --bundle --minify` output and gzip level 9.

### Layout time (ms)

| Nodes | Custom layered | dagre | Cytoscape + dagre |   ELK |
| ----: | -------------: | ----: | ----------------: | ----: |
|    20 |           0.04 |   6.0 |               5.5 |  51.0 |
|   100 |           0.19 |  22.9 |              27.3 | 111.9 |
|   500 |           0.83 | 222.9 |             290.6 | 559.2 |
|  1500 |           1.35 | 3 537 |             3 698 | 1 555 |

### Bundle contribution (KB)

| Candidate                       | minified | min + gzip |
| ------------------------------- | -------: | ---------: |
| Custom SVG renderer (this repo) |      5.7 |        2.4 |
| dagre alone                     |     86.6 |       31.4 |
| d3-selection + d3-zoom          |     54.0 |       18.2 |
| Cytoscape + cytoscape-dagre     |    471.2 |      154.8 |
| ELK.js (bundled build)          |  1 457.8 |      440.5 |

### Incremental heap at 1 500 nodes (KiB)

Same graph data held for every engine; each engine builds its own structures
on top. This is indicative, not an apples-to-apples library-only measurement.

| Candidate         | Heap delta |
| ----------------- | ---------: |
| Custom layered    |      2 682 |
| ELK               |     47 322 |
| Cytoscape + dagre |     99 727 |
| dagre             |    106 483 |

### What was not measured

- Sustained pan/zoom frame rate in the real webview. The architectural
  guarantee is stronger than a sample: the webview performs no layout or graph
  traversal, only DOM updates, so the main thread cannot block on layout. A
  browser frame trace remains author-only.
- Renderer DOM construction time at 2 000 nodes. It is linear and bounded by the
  DTO cap, but no frame trace is recorded in this environment.
- Linux and macOS numbers. All timings are single-machine Windows.

## Why the alternatives lose

- **ELK** gives the best-looking layered routing at 1 500 nodes, but 440 KB of
  gzip is unacceptable for a graph that is currently rendered with less than
  3 KB, and 559 ms at 500 nodes breaks the 200 ms main-thread budget unless it
  moves to a worker. Its quality advantage is real; it is the fallback if
  Phase 10 aggregation exposes the custom layout's limits.
- **dagre** is small enough (31 KB) but takes 223 ms at 500 and 3.5 s at 1 500.
  It also adds a dependency for a layout we already need to customise for loops
  and back edges.
- **Cytoscape.js** adds 155 KB and takes over the render model. Status glyphs,
  dash patterns and degradation badges would live inside library styles, and
  the DTO would have to be translated again. It is the heaviest option for the
  least control.
- **D3** is only an interaction toolkit here (18 KB) and still leaves layout and
  rendering to us. Adopting it would add code without removing work.

## Consequences

- The DTO remains the only renderer input. Swapping layout engines changes
  `layoutCfg`, not the DTO, the core or the tests.
- Layout quality for dense, wide graphs is the known weakness. The CFG layout
  caps ranks, ignores back edges for ranking and centres layers; it is readable
  for function-sized graphs but is not a general graph-drawing engine.
- Phase 10 must revisit this ADR with aggregation measurements. The swap point
  is preserved deliberately.
- The render cap (2 000 nodes) and the 1 500-node opt-in are part of the
  contract, not UI preferences.
