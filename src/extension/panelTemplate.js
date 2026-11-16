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
 * @param {{nonce: string, cspSource: string, scriptUri: string, styleUri: string, title?: string}} input
 * @returns {string}
 */
export function renderPanelHtml({ nonce, cspSource, scriptUri, styleUri, title = 'CodeFlow' }) {
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
  <body>
    <header class="cf-header">
      <div class="cf-title">
        <span class="cf-mark" aria-hidden="true"></span>
        <span id="cf-title-text">CodeFlow</span>
      </div>
      <div id="cf-meta" class="cf-meta" role="status" aria-live="polite">Loading…</div>
      <div class="cf-actions">
        <button id="cf-refresh" type="button" class="cf-button" title="Reload the graph">
          Reload
        </button>
      </div>
    </header>

    <div id="cf-banner" class="cf-banner" role="alert" hidden></div>

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
      </section>
      <aside class="cf-detail" aria-label="Selection details">
        <h2 class="cf-detail-title">Selection</h2>
        <div id="cf-detail-body" class="cf-detail-body">
          <p class="cf-muted">Select a node to inspect it.</p>
        </div>
        <h2 class="cf-detail-title">Legend</h2>
        <ul id="cf-legend" class="cf-legend"></ul>
      </aside>
    </main>

    <footer class="cf-footer">
      <span id="cf-status" class="cf-status">Starting…</span>
      <span class="cf-hint">Pan: drag · Zoom: wheel · Select: click</span>
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
