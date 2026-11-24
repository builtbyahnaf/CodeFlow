/**
 * Multi-Perspective Search & Filter Manager (Phase 12 §7, P12-13, P12-14).
 *
 * Centralizes filtering across kinds, statuses, relationship types, and query terms,
 * producing filter chips, breadcrumb summary tags, and one-click clear actions.
 */

/**
 * @typedef {{
 *   kinds: Set<string>,
 *   relationshipTypes: Set<string>,
 *   statuses: Set<string>,
 *   query: string,
 * }} FilterState
 */

/**
 * Create a fresh, empty filter state.
 *
 * @returns {FilterState}
 */
export function createEmptyFilterState() {
  return {
    kinds: new Set(),
    relationshipTypes: new Set(),
    statuses: new Set(),
    query: '',
  };
}

/**
 * Pure manager for graph search and filter state.
 */
export class SearchFilterManager {
  /**
   * @param {FilterState} [initialState]
   */
  constructor(initialState) {
    this.state = initialState
      ? {
          kinds: new Set(initialState.kinds),
          relationshipTypes: new Set(initialState.relationshipTypes),
          statuses: new Set(initialState.statuses),
          query: initialState.query ?? '',
        }
      : createEmptyFilterState();
  }

  /**
   * Set or clear the search query string.
   *
   * @param {string} query
   */
  setQuery(query) {
    this.state.query = String(query ?? '').trim();
  }

  /**
   * Toggle a kind filter.
   *
   * @param {string} kind
   */
  toggleKind(kind) {
    if (this.state.kinds.has(kind)) {
      this.state.kinds.delete(kind);
    } else {
      this.state.kinds.add(kind);
    }
  }

  /**
   * Toggle a relationship type filter.
   *
   * @param {string} relType
   */
  toggleRelationshipType(relType) {
    if (this.state.relationshipTypes.has(relType)) {
      this.state.relationshipTypes.delete(relType);
    } else {
      this.state.relationshipTypes.add(relType);
    }
  }

  /**
   * Toggle a status filter.
   *
   * @param {string} status
   */
  toggleStatus(status) {
    if (this.state.statuses.has(status)) {
      this.state.statuses.delete(status);
    } else {
      this.state.statuses.add(status);
    }
  }

  /**
   * Reset all filters and search query.
   */
  clearAll() {
    this.state.kinds.clear();
    this.state.relationshipTypes.clear();
    this.state.statuses.clear();
    this.state.query = '';
  }

  /**
   * Check whether any filter or query is active.
   *
   * @returns {boolean}
   */
  isActive() {
    return (
      this.state.kinds.size > 0 ||
      this.state.relationshipTypes.size > 0 ||
      this.state.statuses.size > 0 ||
      this.state.query.length > 0
    );
  }

  /**
   * Get active count of filter constraints.
   *
   * @returns {number}
   */
  getActiveCount() {
    return (
      this.state.kinds.size +
      this.state.relationshipTypes.size +
      this.state.statuses.size +
      (this.state.query.length > 0 ? 1 : 0)
    );
  }

  /**
   * Generate visual filter chips for display in the UI toolbar.
   *
   * @returns {Array<{type: 'query'|'kind'|'rel'|'status', value: string, label: string}>}
   */
  getChips() {
    const chips = [];
    if (this.state.query) {
      chips.push({
        type: 'query',
        value: this.state.query,
        label: `Search: "${this.state.query}"`,
      });
    }
    for (const kind of this.state.kinds) {
      chips.push({
        type: 'kind',
        value: kind,
        label: `Kind: ${kind}`,
      });
    }
    for (const rel of this.state.relationshipTypes) {
      chips.push({
        type: 'rel',
        value: rel,
        label: `Rel: ${rel}`,
      });
    }
    for (const st of this.state.statuses) {
      chips.push({
        type: 'status',
        value: st,
        label: `Status: ${st}`,
      });
    }
    return chips;
  }

  /**
   * Summary text for breadcrumb context.
   *
   * @returns {string}
   */
  getBreadcrumbSummary() {
    if (!this.isActive()) {
      return '';
    }
    const count = this.getActiveCount();
    return `[${count} filter${count > 1 ? 's' : ''} active]`;
  }

  /**
   * Test whether a node matches the active filter criteria.
   *
   * @param {{
   *   name?: string,
   *   label?: string,
   *   kind?: string,
   *   status?: string,
   *   resolvedStatus?: string
   * }} node
   * @returns {boolean}
   */
  matchesNode(node) {
    if (!node) return false;

    if (this.state.query) {
      const term = this.state.query.toLowerCase();
      const name = String(node.name ?? '').toLowerCase();
      const label = String(node.label ?? '').toLowerCase();
      if (!name.includes(term) && !label.includes(term)) {
        return false;
      }
    }

    if (this.state.kinds.size > 0 && node.kind) {
      if (!this.state.kinds.has(node.kind)) {
        return false;
      }
    }

    if (this.state.statuses.size > 0) {
      const st = node.resolvedStatus ?? node.status;
      if (st && !this.state.statuses.has(st)) {
        return false;
      }
    }

    return true;
  }
}
