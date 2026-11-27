/**
 * SVG renderer.
 *
 * Phase 0 renderer: deterministic layered positions come from the DTO, so this
 * module only draws. It has no knowledge of analysis, adapters, or the protocol.
 *
 * Kept behind a small interface (`render`, `select`, `destroy`) because Phase 4
 * benchmarks Cytoscape/ELK and may replace the implementation. Callers must not
 * depend on SVG internals.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * @typedef {import('../../core/graph/dto.js').GraphDto} GraphDto
 * @typedef {import('../../core/graph/dto.js').DtoNode} DtoNode
 */

/**
 * @param {string} name
 * @param {Record<string, string | number>} [attributes]
 * @returns {SVGElement}
 */
function svgEl(name, attributes = {}) {
  const element = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, String(value));
  }
  return element;
}

/**
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
function truncate(value, max) {
  const text = String(value ?? '');
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

/**
 * Standard flowchart outline for a node. Keeping the outline in one place
 * lets the legend, DTO and renderer agree on what each kind means.
 *
 * @param {string|undefined} kind
 * @param {number} width
 * @param {number} height
 * @returns {{tag: string, attrs: Record<string, string|number>}}
 */
export function shapeOutline(kind, width, height) {
  const normalized = String(kind ?? 'statement');

  if (normalized === 'entry' || normalized === 'exit') {
    const radius = Math.min(height / 2, 28);
    return { tag: 'rect', attrs: { width, height, rx: radius, ry: radius } };
  }

  if (normalized === 'condition') {
    return {
      tag: 'path',
      attrs: {
        d: `M ${width / 2} 0 L ${width} ${height / 2} L ${width / 2} ${height} L 0 ${height / 2} Z`,
      },
    };
  }

  if (
    normalized === 'multiway' ||
    normalized === 'loop_header' ||
    normalized === 'loop_latch'
  ) {
    const cut = Math.min(24, width * 0.14);
    return {
      tag: 'path',
      attrs: {
        d: `M ${cut} 0 H ${width - cut} L ${width} ${height / 2} L ${width - cut} ${height} H ${cut} L 0 ${height / 2} Z`,
      },
    };
  }

  if (normalized === 'return' || normalized === 'throw') {
    const slant = Math.min(20, width * 0.12);
    return {
      tag: 'path',
      attrs: { d: `M ${slant} 0 H ${width} L ${width - slant} ${height} H 0 Z` },
    };
  }

  if (normalized === 'call' || normalized === 'await') {
    const inset = Math.min(16, width * 0.08);
    return {
      tag: 'path',
      attrs: {
        d: `M 0 0 H ${width} V ${height} H 0 Z M ${inset} 0 V ${height} M ${width - inset} 0 V ${height}`,
      },
    };
  }

  if (normalized === 'merge') {
    return {
      tag: 'ellipse',
      attrs: { cx: width / 2, cy: height / 2, rx: width / 2, ry: height / 2 },
    };
  }

  const radius = normalized === 'unmodeled' || normalized === 'unreachable' ? 0 : 4;
  return { tag: 'rect', attrs: { width, height, rx: radius, ry: radius } };
}

/**
 * @param {{
 *   svg: SVGSVGElement,
 *   onSelect: (nodeId: string, node: DtoNode) => void,
 *   onNavigate?: (nodeId: string, node: DtoNode, trigger?: 'pointer'|'keyboard') => void,
 *   onPreviewEnter?: (nodeId: string, node: DtoNode, point: {x: number, y: number}) => void,
 *   onPreviewMove?: (point: {x: number, y: number}) => void,
 *   onPreviewLeave?: (nodeId: string) => void,
 *   onPreviewKey?: (nodeId: string, node: DtoNode) => void,
 * }} options
 */
export function createSvgRenderer(options) {
  const { svg, onSelect } = options;
  /** @type {GraphDto | null} */
  let dto = null;
  /** @type {SVGGElement | null} */
  let viewport = null;
  /** @type {Map<string, SVGGElement>} */
  const nodeElements = new Map();
  /** @type {Map<string, SVGPathElement>} */
  const edgeElements = new Map();
  /** @type {string | null} */
  let selectedId = null;

  let scale = 1;
  let translateX = 0;
  let translateY = 0;
  let dragging = false;
  let dragStart = { x: 0, y: 0, tx: 0, ty: 0 };

  function applyTransform() {
    if (viewport) {
      viewport.setAttribute(
        'transform',
        `translate(${translateX.toFixed(2)} ${translateY.toFixed(2)}) scale(${scale.toFixed(3)})`,
      );
    }
  }

  function edgeAnchors(source, target) {
    const sx = source.position.x + source.position.width / 2;
    const sy = source.position.y + source.position.height / 2;
    const tx = target.position.x + target.position.width / 2;
    const ty = target.position.y + target.position.height / 2;
    const dx = tx - sx;
    const dy = ty - sy;

    if (target.position.y > source.position.y + 10) {
      return {
        mode: 'down',
        from: {
          x: source.position.x + source.position.width / 2,
          y: source.position.y + source.position.height,
        },
        to: {
          x: target.position.x + target.position.width / 2,
          y: target.position.y,
        },
      };
    }

    if (Math.abs(dy) >= Math.abs(dx) && target.position.y < source.position.y - 10) {
      return {
        mode: 'back-up',
        from: {
          x: source.position.x,
          y: source.position.y + source.position.height / 2,
        },
        to: {
          x: target.position.x,
          y: target.position.y + target.position.height / 2,
        },
      };
    }

    if (target.position.x >= source.position.x) {
      return {
        mode: 'right',
        from: {
          x: source.position.x + source.position.width,
          y: source.position.y + source.position.height / 2,
        },
        to: {
          x: target.position.x,
          y: target.position.y + target.position.height / 2,
        },
      };
    }

    return {
      mode: 'back-left',
      from: {
        x: source.position.x + source.position.width / 2,
        y: source.position.y,
      },
      to: {
        x: target.position.x + target.position.width / 2,
        y: target.position.y,
      },
    };
  }

  function edgeGeometry(source, target) {
    if (source.id === target.id) {
      const { x, y, width, height } = source.position;
      const cx = x + width / 2;
      const startY = y - 2;
      return {
        path: `M ${cx} ${startY} C ${cx - 46} ${y - 60}, ${cx + 46} ${y - 60}, ${cx} ${y + height + 2}`,
        labelPos: { x: cx, y: y - 48 },
      };
    }
    const anchor = edgeAnchors(source, target);
    const { from, to, mode } = anchor;

    if (mode === 'down') {
      const dy = Math.max(16, to.y - from.y);
      const bend = Math.max(24, dy / 2);
      return {
        path: `M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`,
        labelPos: { x: (from.x + to.x) / 2 + (to.x < from.x ? -16 : 16), y: (from.y + to.y) / 2 },
      };
    }

    if (mode === 'back-up') {
      const minX = Math.min(from.x, to.x) - 52;
      return {
        path: `M ${from.x} ${from.y} C ${minX} ${from.y}, ${minX} ${to.y}, ${to.x} ${to.y}`,
        labelPos: { x: minX + 12, y: (from.y + to.y) / 2 },
      };
    }

    if (mode === 'back-left') {
      const minY = Math.min(from.y, to.y) - 42;
      return {
        path: `M ${from.x} ${from.y} C ${from.x} ${minY}, ${to.x} ${minY}, ${to.x} ${to.y}`,
        labelPos: { x: (from.x + to.x) / 2, y: minY + 12 },
      };
    }

    const bend = Math.max(36, Math.abs(to.x - from.x) / 2);
    return {
      path: `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`,
      labelPos: { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 - 6 },
    };
  }

  function clear() {
    if (viewport) {
      svg.removeChild(viewport);
    }
    const existingDefs = svg.querySelector('defs');
    if (existingDefs) {
      svg.removeChild(existingDefs);
    }
    const defs = svgEl('defs');
    const marker = svgEl('marker', {
      id: 'cf-arrow',
      viewBox: '0 0 10 10',
      refX: 8,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: 'auto-start-reverse',
    });
    marker.appendChild(svgEl('path', { d: 'M 0 1 L 8 5 L 0 9 z', fill: 'currentColor' }));
    defs.appendChild(marker);
    svg.appendChild(defs);

    viewport = svgEl('g', { class: 'cf-viewport' });
    svg.appendChild(viewport);
    nodeElements.clear();
    edgeElements.clear();
    selectedId = null;
  }

  function select(nodeId) {
    selectedId = nodeId;
    for (const [id, element] of nodeElements) {
      element.classList.toggle('is-selected', id === nodeId);
    }
    for (const [, element] of edgeElements) {
      const active =
        nodeId !== null && (element.dataset.from === nodeId || element.dataset.to === nodeId);
      element.classList.toggle('is-active', active);
    }
    if (selectedId && nodeElements.has(selectedId)) {
      const node = /** @type {DtoNode} */ (dto?.nodes.find((item) => item.id === selectedId));
      onSelect(selectedId, node);
    }
  }

  function zoomToFit() {
    if (!dto || !viewport) {
      return;
    }
    const bounds = svg.getBoundingClientRect();
    const padding = 48;
    let width = 1;
    let height = 1;
    if (dto.extent && Number.isFinite(dto.extent.width) && Number.isFinite(dto.extent.height)) {
      width = Math.max(1, dto.extent.width);
      height = Math.max(1, dto.extent.height);
    } else if (Array.isArray(dto.nodes) && dto.nodes.length > 0) {
      let maxX = 0;
      let maxY = 0;
      for (const node of dto.nodes) {
        const nx = (node.position?.x ?? 0) + (node.position?.width ?? 160);
        const ny = (node.position?.y ?? 0) + (node.position?.height ?? 50);
        if (nx > maxX) maxX = nx;
        if (ny > maxY) maxY = ny;
      }
      width = Math.max(1, maxX + 64);
      height = Math.max(1, maxY + 64);
    }
    const availableWidth = Math.max(120, bounds.width - padding * 2);
    const availableHeight = Math.max(120, bounds.height - padding * 2);
    scale = Math.min(1.4, availableWidth / width, availableHeight / height);
    scale = Math.max(0.15, scale);
    translateX = (bounds.width - width * scale) / 2;
    translateY = (bounds.height - height * scale) / 2;
    applyTransform();
  }

/**
 * Wrap any raw single-line text exceeding `maxChars` into readable multi-line chunks
 * so un-prewrapped labels (such as long identifiers or call chains) still wrap
 * cleanly inside their box outline.
 *
 * @param {string} value
 * @param {number} [maxChars]
 * @returns {string[]}
 */
function wrapTextFallback(value, maxChars = 40) {
  const lines = [];
  for (const para of String(value ?? '').split(/\r?\n/)) {
    let rest = para.replace(/[ \t]+/g, ' ').trim();
    if (!rest) continue;
    while (rest.length > maxChars) {
      let split = rest.lastIndexOf(' ', maxChars);
      if (split <= 0) {
        let punct = -1;
        for (let i = Math.min(maxChars - 1, rest.length - 1); i >= Math.floor(maxChars * 0.35); i -= 1) {
          const ch = rest[i];
          if (ch === ',' || ch === ';' || ch === '(' || ch === '.' || ch === '&' || ch === '|') {
            punct = i + 1;
            break;
          }
        }
        split = punct > 0 ? punct : maxChars;
      }
      const head = rest.slice(0, split).trimEnd();
      if (head) lines.push(head);
      rest = rest.slice(split).trimStart();
    }
    if (rest) lines.push(rest);
  }
  return lines.length > 0 ? lines : [''];
}

/**
 * @param {SVGGElement} group
 * @param {DtoNode} node
 */
function appendNodeShape(group, node) {
  const outline = shapeOutline(node.kind, node.position.width, node.position.height);
  const el = svgEl(outline.tag, {
    class: 'cf-node-box cf-node-shape',
    ...outline.attrs,
  });
  group.appendChild(el);
  return el;
}

  /**
   * @param {GraphDto} nextDto
   */
  function render(nextDto) {
    dto = nextDto;
    clear();
    if (!viewport) {
      return;
    }

    const byId = new Map(dto.nodes.map((node) => [node.id, node]));

    for (const edge of dto.edges) {
      const source = byId.get(edge.from);
      const target = byId.get(edge.to);
      if (!source || !target) {
        continue;
      }
      const geom = edgeGeometry(source, target);
      const path = /** @type {SVGPathElement} */ (
        svgEl('path', {
          class: `cf-edge cf-edge--${edge.status} cf-edge--kind-${edge.kind ?? edge.type}${
            edge.isCycle ? ' cf-edge--cycle' : ''
          }${edge.dimmed ? ' is-dimmed' : ''}`,
          d: geom.path,
          'marker-end': 'url(#cf-arrow)',
          'data-from': edge.from,
          'data-to': edge.to,
          ...(edge.dash ? { 'stroke-dasharray': edge.dash } : {}),
        })
      );
      path.dataset.from = edge.from;
      path.dataset.to = edge.to;
      const title = svgEl('title');
      title.textContent = `${edge.kind ?? edge.type} (${edge.status})${
        edge.reasonCode ? `: ${edge.reasonCode}` : ''
      }${edge.glyphHint ? ` ${edge.glyphHint}` : ''}`;
      path.appendChild(title);
      viewport.appendChild(path);
      edgeElements.set(edge.id, path);

      if (edge.label && edge.label.length > 0) {
        const label = svgEl('text', {
          class: 'cf-edge-label',
          x: geom.labelPos.x,
          y: geom.labelPos.y,
          'text-anchor': 'middle',
        });
        label.textContent = truncate(edge.label, 32);
        viewport.appendChild(label);
      }
    }

    for (const node of dto.nodes) {
      const group = /** @type {SVGGElement} */ (
        svgEl('g', {
          class: `cf-node cf-node--${node.status} cf-node--kind-${node.kind}${
            node.external ? ' cf-node--external' : ''
          }${node.unreachable ? ' cf-node--unreachable' : ''}${
            node.isCenter ? ' cf-node--center' : ''
          }${node.isCyclic ? ' cf-node--cyclic' : ''}${node.dimmed ? ' is-dimmed' : ''}`,
          transform: `translate(${node.position.x} ${node.position.y})`,
          tabindex: '0',
          role: 'button',
          'aria-label': `${node.kind} ${node.label}, ${node.status}${
            node.unreachable ? ', unreachable' : ''
          }${node.external ? ', external target' : ''}`,
        })
      );

      const shapeEl = appendNodeShape(group, node);

      const badgeText =
        Array.isArray(node.badges) && node.badges.length > 0
          ? node.badges.join(' · ')
          : node.badge || (node.status !== 'resolved' ? node.status : '');

      const rawLines =
        Array.isArray(node.labelLines) && node.labelLines.length > 0
          ? node.labelLines.filter((l) => typeof l === 'string' && l.trim().length > 0)
          : [];
      const fallbackLabel =
        (node.label && String(node.label).trim()) ||
        (node.kind && String(node.kind).trim()) ||
        node.id;
      const lines =
        rawLines.length > 0
          ? rawLines.flatMap((line) => (line.length > 44 ? wrapTextFallback(line, 40) : [line]))
          : wrapTextFallback(fallbackLabel, 40);
      const lineHeight = 16;
      const blockHeight = lines.length * lineHeight;
      const topClearance = badgeText ? 22 : lineHeight;
      const firstBaseline = Math.max(
        topClearance,
        (badgeText ? 12 : 0) + node.position.height / 2 - blockHeight / 2 + lineHeight * 0.75,
      );

      let boxWidth = node.position.width;
      let boxHeight = Math.max(
        node.position.height,
        Math.ceil(firstBaseline + (lines.length - 1) * lineHeight + 12),
      );

      const label = svgEl('text', {
        class: 'cf-node-label',
        x: boxWidth / 2,
        y: firstBaseline,
        'text-anchor': 'middle',
      });
      for (const [index, text] of lines.entries()) {
        const span = svgEl('tspan', {
          x: boxWidth / 2,
          ...(index === 0 ? {} : { dy: lineHeight }),
        });
        span.textContent = text;
        label.appendChild(span);
      }
      group.appendChild(label);

      let badgeEl = null;
      if (badgeText) {
        badgeEl = svgEl('text', {
          class: 'cf-node-badge',
          x: boxWidth - 8,
          y: 13,
          'text-anchor': 'end',
        });
        badgeEl.textContent = truncate(badgeText, 28);
        group.appendChild(badgeEl);
      }

      const title = svgEl('title');
      const callText =
        Array.isArray(node.calls) && node.calls.length > 0
          ? `\ncalls: ${node.calls.map((call) => `${call.label} (${call.status})`).join(', ')}`
          : '';
      title.textContent = `${node.kind} ${node.label}\nstatus: ${node.status}${
        node.range ? `\nlines ${node.range.startLine + 1}-${node.range.endLine + 1}` : ''
      }${node.reasonCode ? `\nreason: ${node.reasonCode}` : ''}${callText}`;
      group.appendChild(title);

      viewport.appendChild(group);

      // In a real browser DOM, verify rendered text fits comfortably inside the
      // box shape outline; expand the outline if any glyph metric exceeds budget.
      if (typeof label.getBBox === 'function' && shapeEl) {
        try {
          const textBBox = label.getBBox();
          const badgeBBox = badgeEl && typeof badgeEl.getBBox === 'function' ? badgeEl.getBBox() : null;
          const shapePadX =
            node.kind === 'condition' ? 56 : node.kind === 'call' ? 48 : 30;
          boxWidth = Math.max(
            boxWidth,
            Math.ceil((textBBox?.width ?? 0) + shapePadX),
            badgeBBox ? Math.ceil(badgeBBox.width + 24) : 0,
          );
          boxHeight = Math.max(
            boxHeight,
            Math.ceil((textBBox?.y ?? 0) + (textBBox?.height ?? 0) + 12),
          );
        } catch {
          // Safe fallback when getBBox is unsupported (e.g. detached SVG)
        }
      }
      if (shapeEl && (boxWidth > node.position.width || boxHeight > node.position.height)) {
        const nextOutline = shapeOutline(node.kind, boxWidth, boxHeight);
        if (nextOutline.tag === shapeEl.tagName) {
          for (const [k, v] of Object.entries(nextOutline.attrs)) {
            shapeEl.setAttribute(k, String(v));
          }
        }
        label.setAttribute('x', String(boxWidth / 2));
        for (const tspan of label.children) {
          tspan.setAttribute('x', String(boxWidth / 2));
        }
        if (badgeEl) {
          badgeEl.setAttribute('x', String(boxWidth - 8));
        }
      }

      group.addEventListener('click', (event) => {
        event.stopPropagation();
        select(node.id);
      });
      group.addEventListener('dblclick', (event) => {
        event.stopPropagation();
        select(node.id);
        options.onNavigate?.(node.id, node, 'pointer');
      });
      group.addEventListener('pointerenter', (event) => {
        options.onPreviewEnter?.(node.id, node, { x: event.clientX, y: event.clientY });
      });
      group.addEventListener('pointermove', (event) => {
        options.onPreviewMove?.({ x: event.clientX, y: event.clientY });
      });
      group.addEventListener('pointerleave', () => {
        options.onPreviewLeave?.(node.id);
      });
      group.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          select(node.id);
          options.onNavigate?.(node.id, node, 'keyboard');
          return;
        }
        if (event.key === ' ' || event.key === 'Spacebar') {
          event.preventDefault();
          if (event.shiftKey) {
            options.onPreviewKey?.(node.id, node);
          } else {
            select(node.id);
          }
          return;
        }
        if (event.key === 'h' || event.key === 'H') {
          event.preventDefault();
          options.onPreviewKey?.(node.id, node);
        }
      });

      nodeElements.set(node.id, group);
    }

    zoomToFit();
  }

  function moveSelection(direction) {
    if (!dto || dto.nodes.length === 0) {
      return;
    }
    const current = selectedId ? dto.nodes.find((node) => node.id === selectedId) : null;
    if (!current) {
      const first = dto.nodes[0];
      select(first.id);
      nodeElements.get(first.id)?.focus();
      return;
    }
    const origin = {
      x: current.position.x + current.position.width / 2,
      y: current.position.y + current.position.height / 2,
    };

    let best = null;
    let bestScore = Number.POSITIVE_INFINITY;
    for (const candidate of dto.nodes) {
      if (candidate.id === current.id) {
        continue;
      }
      const point = {
        x: candidate.position.x + candidate.position.width / 2,
        y: candidate.position.y + candidate.position.height / 2,
      };
      const dx = point.x - origin.x;
      const dy = point.y - origin.y;
      const forward =
        (direction === 'ArrowRight' && dx > 8) ||
        (direction === 'ArrowLeft' && dx < -8) ||
        (direction === 'ArrowDown' && dy > 8) ||
        (direction === 'ArrowUp' && dy < -8);
      if (!forward) {
        continue;
      }
      const primary =
        direction === 'ArrowRight' || direction === 'ArrowLeft' ? Math.abs(dx) : Math.abs(dy);
      const secondary =
        direction === 'ArrowRight' || direction === 'ArrowLeft' ? Math.abs(dy) : Math.abs(dx);
      const score = primary + secondary * 2.2;
      if (score < bestScore) {
        bestScore = score;
        best = candidate;
      }
    }
    if (best) {
      select(best.id);
      nodeElements.get(best.id)?.focus();
    }
  }

  svg.addEventListener(
    'wheel',
    (event) => {
      if (!dto) {
        return;
      }
      event.preventDefault();
      const bounds = svg.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;
      const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nextScale = Math.min(3.5, Math.max(0.12, scale * factor));
      const ratio = nextScale / scale;
      translateX = pointerX - (pointerX - translateX) * ratio;
      translateY = pointerY - (pointerY - translateY) * ratio;
      scale = nextScale;
      applyTransform();
    },
    { passive: false },
  );

  svg.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) {
      return;
    }
    dragging = true;
    dragStart = { x: event.clientX, y: event.clientY, tx: translateX, ty: translateY };
    svg.setPointerCapture(event.pointerId);
  });
  svg.addEventListener('pointermove', (event) => {
    if (!dragging) {
      return;
    }
    translateX = dragStart.tx + (event.clientX - dragStart.x);
    translateY = dragStart.ty + (event.clientY - dragStart.y);
    applyTransform();
  });
  const endDrag = (event) => {
    dragging = false;
    if (svg.hasPointerCapture(event.pointerId)) {
      svg.releasePointerCapture(event.pointerId);
    }
  };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  svg.addEventListener('click', () => {
    if (selectedId) {
      select(null);
    }
  });

  svg.addEventListener('keydown', (event) => {
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      moveSelection(event.key);
      return;
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      scale = Math.min(3.5, scale * 1.15);
      applyTransform();
      return;
    }
    if (event.key === '-') {
      event.preventDefault();
      scale = Math.max(0.12, scale / 1.15);
      applyTransform();
      return;
    }
    if (event.key === '0') {
      event.preventDefault();
      zoomToFit();
    }
  });

  /**
   * Editor-driven highlight. Distinct from selection so typing in the editor
   * never steals graph focus or rewrites the detail panel.
   *
   * @param {string[]} nodeIds
   */
  function highlight(nodeIds) {
    const wanted = new Set(Array.isArray(nodeIds) ? nodeIds : []);
    for (const [id, element] of nodeElements) {
      element.classList.toggle('is-synced', wanted.has(id));
    }
    for (const [, element] of edgeElements) {
      const active =
        wanted.size > 0 &&
        (wanted.has(element.dataset.from ?? '') || wanted.has(element.dataset.to ?? ''));
      element.classList.toggle('is-synced', active);
    }
  }

  /**
   * @param {string[]} nodeIds
   */
  function markStale(nodeIds) {
    const wanted = new Set(Array.isArray(nodeIds) ? nodeIds : []);
    for (const [id, element] of nodeElements) {
      element.classList.toggle('is-stale', wanted.has(id));
    }
  }

  function focusSelection() {
    if (selectedId) {
      nodeElements.get(selectedId)?.focus();
      return true;
    }
    return false;
  }

  return {
    render,
    select,
    highlight,
    markStale,
    focusSelection,
    zoomToFit,
    destroy() {
      clear();
      dto = null;
    },
  };
}
