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
 * @param {{nonce: string, cspSource: string, scriptUri: string, styleUri: string, title?: string, preferredSymbolId?: string|null}} input
 * @returns {string}
 */
export function renderPanelHtml({
  nonce,
  cspSource,
  scriptUri,
  styleUri,
  title = 'CodeFlow',
  preferredSymbolId = null,
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
  <body${preferredSymbolId ? ` data-preferred-symbol="${escapeHtml(preferredSymbolId)}"` : ''}>
    <header class="cf-header">
      <div class="cf-title">
        <span class="cf-mark" aria-hidden="true"></span>
        <span id="cf-title-text">CodeFlow</span>
      </div>
      <div id="cf-meta" class="cf-meta" role="status" aria-live="polite">Loading…</div>
      <div class="cf-actions">
        <label class="cf-picker">
          <span class="cf-picker-label">Function</span>
          <select id="cf-function" class="cf-select" aria-label="Function to display" hidden></select>
        </label>
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
