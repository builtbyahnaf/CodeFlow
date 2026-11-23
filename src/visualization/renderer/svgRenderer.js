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

  function nodePoint(node, side) {
    if (side === 'out') {
      return {
        x: node.position.x + node.position.width,
        y: node.position.y + node.position.height / 2,
      };
    }
    return { x: node.position.x, y: node.position.y + node.position.height / 2 };
  }

  function edgePath(source, target) {
    if (source.id === target.id) {
      const { x, y, width, height } = source.position;
      const cx = x + width / 2;
      const startY = y - 2;
      return `M ${cx} ${startY} C ${cx - 46} ${y - 60}, ${cx + 46} ${y - 60}, ${cx} ${y + height + 2}`;
    }
    const from = nodePoint(source, 'out');
    const to = nodePoint(target, 'in');
    const bend = Math.max(36, Math.abs(to.x - from.x) / 2);
    return `M ${from.x} ${from.y} C ${from.x + bend} ${from.y}, ${to.x - bend} ${to.y}, ${to.x} ${to.y}`;
  }

  function clear() {
    if (viewport) {
      svg.removeChild(viewport);
    }
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
    const width = Math.max(1, dto.extent.width);
    const height = Math.max(1, dto.extent.height);
    const availableWidth = Math.max(120, bounds.width - padding * 2);
    const availableHeight = Math.max(120, bounds.height - padding * 2);
    scale = Math.min(1.4, availableWidth / width, availableHeight / height);
    scale = Math.max(0.15, scale);
    translateX = (bounds.width - width * scale) / 2;
    translateY = (bounds.height - height * scale) / 2;
    applyTransform();
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
      const path = /** @type {SVGPathElement} */ (
        svgEl('path', {
          class: `cf-edge cf-edge--${edge.status} cf-edge--kind-${edge.kind ?? edge.type}`,
          d: edgePath(source, target),
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
        const from = nodePoint(source, 'out');
        const to = nodePoint(target, 'in');
        const label = svgEl('text', {
          class: 'cf-edge-label',
          x: (from.x + to.x) / 2,
          y: (from.y + to.y) / 2 - 4,
          'text-anchor': 'middle',
        });
        label.textContent = truncate(edge.label, 22);
        viewport.appendChild(label);
      }
    }

    for (const node of dto.nodes) {
      const group = /** @type {SVGGElement} */ (
        svgEl('g', {
          class: `cf-node cf-node--${node.status} cf-node--kind-${node.kind}${
            node.external ? ' cf-node--external' : ''
          }${node.unreachable ? ' cf-node--unreachable' : ''}`,
          transform: `translate(${node.position.x} ${node.position.y})`,
          tabindex: '0',
          role: 'button',
          'aria-label': `${node.kind} ${node.label}, ${node.status}${
            node.unreachable ? ', unreachable' : ''
          }${node.external ? ', external target' : ''}`,
        })
      );

      group.appendChild(
        svgEl('rect', {
          class: 'cf-node-box',
          width: node.position.width,
          height: node.position.height,
          rx: 6,
          ry: 6,
        }),
      );

      const lines =
        Array.isArray(node.labelLines) && node.labelLines.length > 0
          ? node.labelLines.slice(0, 3)
          : [truncate(node.label, 26)];
      const lineHeight = 13;
      const blockHeight = lines.length * lineHeight;
      const label = svgEl('text', {
        class: 'cf-node-label',
        x: 10,
        y: node.position.height / 2 - blockHeight / 2 + lineHeight - 3,
      });
      for (const [index, text] of lines.entries()) {
        const span = svgEl('tspan', {
          x: 10,
          ...(index === 0 ? {} : { dy: lineHeight }),
        });
        span.textContent = text;
        label.appendChild(span);
      }
      group.appendChild(label);

      const kind = svgEl('text', {
        class: 'cf-node-kind',
        x: 10,
        y: node.position.height - 8,
      });
      kind.textContent = node.external ? `${node.kind} · external` : node.kind;
      group.appendChild(kind);

      const badgeText =
        Array.isArray(node.badges) && node.badges.length > 0
          ? node.badges.join(' · ')
          : node.badge || (node.status !== 'resolved' ? node.status : '');
      if (badgeText) {
        const badge = svgEl('text', {
          class: 'cf-node-badge',
          x: node.position.width - 8,
          y: 13,
          'text-anchor': 'end',
        });
        badge.textContent = truncate(badgeText, 24);
        group.appendChild(badge);
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

      viewport.appendChild(group);
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
