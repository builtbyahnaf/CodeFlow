/**
 * Webview HTML template.
 *
 * Kept as a string module (not a file read) so it is available in the bundled
 * extension and in unit tests without path resolution games.
 *
 * The template contains no inline script. The single script tag carries a
 * per-load nonce that also appears in the Content-Security-Policy.
 */

/**
 * @param {{nonce: string, cspSource: string, scriptUri: string, styleUri: string, title?: string, preferredSymbolId?: string|null, preferredPerspective?: string|null}} input
 * @returns {string}
 */
export function renderPanelHtml({
  nonce,
  cspSource,
  scriptUri,
  styleUri,
  title = 'CodeFlow',
  preferredSymbolId = null,
  preferredPerspective = null,
}) {
  const csp = [
    "default-src 'none'",
    `img-src ${cspSource} data:`,
    `style-src ${cspSource}`,
    `font-src ${cspSource}`,
    `script-src 'nonce-${nonce}'`,
    "connect-src 'none'",
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${csp}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="${styleUri}" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body${preferredSymbolId ? ` data-preferred-symbol="${escapeHtml(preferredSymbolId)}"` : ''}${preferredPerspective ? ` data-preferred-perspective="${escapeHtml(preferredPerspective)}"` : ''}>
    <header class="cf-header">
      <div class="cf-title">
        <span class="cf-mark" aria-hidden="true"></span>
        <span id="cf-title-text">CodeFlow</span>
      </div>
      <div id="cf-meta" class="cf-meta" role="status" aria-live="polite">Loading…</div>
      <div class="cf-actions">
        <label class="cf-picker">
          <span class="cf-picker-label">View</span>
          <select id="cf-perspective" class="cf-select" aria-label="Graph perspective">
            <option value="cfg">Control Flow (CFG)</option>
            <option value="call_graph">Call Graph</option>
          </select>
        </label>
        <label class="cf-picker">
          <span class="cf-picker-label">Function</span>
          <select id="cf-function" class="cf-select" aria-label="Function to display" hidden></select>
        </label>
        <button id="cf-switch-perspective" type="button" class="cf-button" title="Switch perspective for the selected function" hidden>
          Show in Call Graph
        </button>
        <button id="cf-refresh" type="button" class="cf-button" title="Reload the graph">
          Reload
        </button>
      </div>
    </header>

    <div id="cf-banner" class="cf-banner" role="alert" hidden></div>
    <div id="cf-scope-banner" class="cf-scope-banner" role="status" hidden></div>
    <div id="cf-fn-summary" class="cf-fn-summary" role="region" aria-label="Function summary" hidden></div>

    <main class="cf-main">
      <section class="cf-canvas-wrap" aria-label="Graph">
        <svg
          id="cf-graph"
          class="cf-graph"
          role="img"
          aria-label="CodeFlow graph"
          tabindex="0"
        ></svg>
        <div id="cf-empty" class="cf-empty" hidden>
          <p>No graph loaded.</p>
        </div>
        <section
          id="cf-preview"
          class="cf-preview"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cf-preview-title"
          tabindex="-1"
          hidden
        >
          <header class="cf-preview-head">
            <span id="cf-preview-title" class="cf-preview-title">Source preview</span>
            <button id="cf-preview-pin" type="button" class="cf-button cf-preview-pin" aria-pressed="false">
              Pin
            </button>
            <button id="cf-preview-close" type="button" class="cf-button" aria-label="Close preview">
              Close
            </button>
          </header>
          <div id="cf-preview-meta" class="cf-preview-meta"></div>
          <div id="cf-preview-explain" class="cf-preview-explain" hidden></div>
          <div id="cf-preview-body" class="cf-preview-body" tabindex="0"></div>
          <footer class="cf-preview-foot">
            <span id="cf-preview-note" class="cf-preview-note" role="status"></span>
            <button id="cf-preview-open" type="button" class="cf-button cf-preview-open">
              Open source
            </button>
          </footer>
        </section>
      </section>
      <aside class="cf-detail" aria-label="Selection details">
        <h2 class="cf-detail-title">Selection</h2>
        <div id="cf-detail-body" class="cf-detail-body">
          <p class="cf-muted">Select a node to inspect it.</p>
        </div>
        <section id="cf-explain" class="cf-explain" aria-label="Explanation" hidden>
          <div class="cf-explain-head">
            <h2 class="cf-detail-title">Explanation</h2>
            <select id="cf-explain-depth" class="cf-select cf-explain-depth" aria-label="Explanation depth">
              <option value="1">1 · Basic</option>
              <option value="2" selected>2 · Intermediate</option>
              <option value="3">3 · Advanced</option>
              <option value="4">4 · Deep</option>
            </select>
          </div>
          <div id="cf-explain-items" class="cf-explain-items"></div>
          <details id="cf-explain-evidence" class="cf-explain-disclosure" hidden>
            <summary>Why this?</summary>
            <ul id="cf-explain-evidence-list" class="cf-explain-evidence-list"></ul>
          </details>
          <details id="cf-explain-limits" class="cf-explain-disclosure" open hidden>
            <summary>Limitations</summary>
            <p id="cf-explain-limits-text" class="cf-explain-limits-text"></p>
          </details>
        </section>
        <section id="cf-calls-panel" class="cf-calls-panel" aria-label="Call relationships" hidden>
          <div class="cf-calls-toolbar">
            <h2 class="cf-detail-title">Call Graph</h2>
            <select id="cf-calls-filter-status" class="cf-select" aria-label="Filter calls by status">
              <option value="all">All statuses</option>
              <option value="resolved">Resolved only</option>
              <option value="inferred,possible">Inferred &amp; possible</option>
              <option value="unresolved">Unresolved only</option>
            </select>
          </div>
          <div class="cf-calls-node-actions">
            <button id="cf-calls-expand" type="button" class="cf-button" disabled>Expand</button>
            <button id="cf-calls-collapse" type="button" class="cf-button" disabled>Collapse</button>
            <button id="cf-calls-focus" type="button" class="cf-button" aria-pressed="false">Focus</button>
          </div>
          <div class="cf-calls-group">
            <h3 id="cf-callers-heading" class="cf-detail-title">Callers</h3>
            <ul id="cf-callers-list" class="cf-calls-list"></ul>
            <button id="cf-callers-more" type="button" class="cf-button" hidden>More callers</button>
          </div>
          <div class="cf-calls-group">
            <h3 id="cf-callees-heading" class="cf-detail-title">Callees</h3>
            <ul id="cf-callees-list" class="cf-calls-list"></ul>
            <button id="cf-callees-more" type="button" class="cf-button" hidden>More callees</button>
          </div>
          <details id="cf-unresolved-bucket" class="cf-explain-disclosure" hidden>
            <summary id="cf-unresolved-summary">Unresolved targets</summary>
            <ul id="cf-unresolved-list" class="cf-calls-list"></ul>
          </details>
        </section>
        <h2 class="cf-detail-title">Legend</h2>
        <ul id="cf-legend" class="cf-legend"></ul>
      </aside>
    </main>

    <footer class="cf-footer">
      <span id="cf-status" class="cf-status">Starting…</span>
      <span class="cf-hint">Pan: drag · Zoom: wheel · Select: click · Preview: hover or H · Open: Enter</span>
    </footer>

    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}

/**
 * @param {string} value
 * @returns {string}
 */
function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
