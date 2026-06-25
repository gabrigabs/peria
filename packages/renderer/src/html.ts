/**
 * Wiki HTML Shell Generator
 * 
 * Generates the static HTML shell for the wiki UI.
 */

import type { WikiManifest } from '@peria/core';

/**
 * Escape HTML special characters
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Render wiki HTML shell
 */
export function renderWikiHtml(manifest: WikiManifest): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(manifest.title)}</title>
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="./assets/wiki.css">
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="brand-mark">${escapeHtml(manifest.project.name.charAt(0))}</span>
          <div>
            <strong>${escapeHtml(manifest.project.name)} Wiki</strong>
            <small>${escapeHtml(manifest.tagline)}</small>
          </div>
        </div>
        <div class="project-card">
          <p>${escapeHtml(manifest.project.currentFocus)}</p>
        </div>
        <label class="search">
          <span>Search</span>
          <input id="search-input" type="search" placeholder="Find pages, modules, CLI...">
        </label>
        <nav id="wiki-nav" class="wiki-nav" aria-label="Wiki pages"></nav>
      </aside>

      <main class="content-shell">
        <header class="topbar">
          <div>
            <p class="eyebrow">Generated technical wiki</p>
            <h1 id="page-title">Loading wiki...</h1>
            <p id="page-description" class="page-description">${escapeHtml(manifest.project.description)}</p>
          </div>
          <div class="meta">
            <span>${escapeHtml(manifest.git.branch ?? 'unknown branch')}</span>
            <span>${escapeHtml(manifest.git.shortCommit ?? manifest.commit ?? 'unknown commit')}</span>
            <span>${manifest.git.isDirty ? `${manifest.git.changedFiles.length} changed files` : 'clean tree'}</span>
          </div>
        </header>
        <article id="wiki-content" class="wiki-content"></article>
      </main>
    </div>
    <script type="module" src="./assets/wiki.js"></script>
  </body>
</html>
`;
}
