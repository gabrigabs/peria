/**
 * Static HTML generation for Peria documentation
 */

import type { PeriaManifest } from '@peria/core';
import { generateNavigation } from './config.js';
import { generatePagesFromManifest } from './content.js';
import { parseMarkdown } from './markdown.js';
import type { DocsMetadata, GeneratedPage, NavSection } from './types.js';

export interface StaticDocsOptions {
  /**
   * Peria manifest to render
   */
  manifest: PeriaManifest;

  /**
   * Base URL for the documentation
   * @default '/docs'
   */
  baseUrl?: string;

  /**
   * Custom CSS to inject
   */
  customCss?: string;
}

/**
 * Generate complete static documentation
 */
export function generateStaticDocs(options: StaticDocsOptions): string {
  const { manifest, baseUrl = '/docs', customCss } = options;

  // Generate pages
  const pages = generatePagesFromManifest({ manifest, baseUrl });

  // Generate navigation
  const navigation = generateNavigation(
    pages.routes,
    pages.packages,
    pages.schemas,
    pages.driftFindings.length,
    baseUrl
  );

  // Generate index HTML
  const indexHtml = generateIndexHtml({
    metadata: pages.metadata,
    navigation,
    pages: pages.pages,
    baseUrl,
    customCss,
  });

  return indexHtml;
}

/**
 * Generate index HTML page
 */
export function generateIndexHtml(options: {
  metadata: DocsMetadata;
  navigation: NavSection[];
  pages: GeneratedPage[];
  baseUrl: string;
  customCss?: string;
}): string {
  const { metadata, pages, customCss } = options;

  const pageList = pages
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((page) => `<li><a href="${page.url}">${page.title}</a></li>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title}</title>
  <meta name="description" content="${metadata.description || ''}">
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-muted: #f1f5f9;
      --text-primary: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --primary: #3b82f6;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
    }
    .dark {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-muted: #334155;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--border);
      margin-bottom: 2rem;
    }
    .title { font-size: 2rem; font-weight: 700; }
    .subtitle { font-size: 1rem; color: var(--text-muted); margin-top: 0.25rem; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    .stat { background: var(--bg-secondary); padding: 1.5rem; border-radius: 0.5rem; border: 1px solid var(--border); }
    .stat-value { font-size: 2rem; font-weight: 700; color: var(--primary); }
    .stat-label { font-size: 0.875rem; color: var(--text-muted); }
    .pages { margin-top: 2rem; }
    .pages h2 { font-size: 1.5rem; margin-bottom: 1rem; }
    .page-list { list-style: none; }
    .page-list li { margin-bottom: 0.5rem; }
    .page-list a {
      display: block;
      padding: 0.75rem 1rem;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 0.375rem;
      text-decoration: none;
      color: var(--text-primary);
      transition: all 0.2s;
    }
    .page-list a:hover {
      background: var(--bg-muted);
      border-color: var(--primary);
    }
    .dark-toggle {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
    }
    ${customCss || ''}
  </style>
</head>
<body>
  <header class="header">
    <div>
      <h1 class="title">${metadata.title}</h1>
      <p class="subtitle">${metadata.description}</p>
    </div>
    <button class="dark-toggle" onclick="document.documentElement.classList.toggle('dark')">
      🌓 Toggle theme
    </button>
  </header>

  <div class="container">
    <div class="stats">
      <div class="stat">
        <div class="stat-value">${metadata.stats?.routes || 0}</div>
        <div class="stat-label">Routes</div>
      </div>
      <div class="stat">
        <div class="stat-value">${metadata.stats?.schemas || 0}</div>
        <div class="stat-label">Schemas</div>
      </div>
      <div class="stat">
        <div class="stat-value">${metadata.stats?.packages || 0}</div>
        <div class="stat-label">Packages</div>
      </div>
      <div class="stat">
        <div class="stat-value">${metadata.stats?.driftFindings || 0}</div>
        <div class="stat-label">Drift</div>
      </div>
    </div>

    <div class="pages">
      <h2>Pages</h2>
      <ul class="page-list">
        ${pageList}
      </ul>
    </div>
  </div>

  <script>
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  </script>
</body>
</html>`;
}

/**
 * Generate individual page HTML
 */
export function generatePageHtml(options: {
  page: GeneratedPage;
  metadata: DocsMetadata;
  navigation: NavSection[];
  baseUrl: string;
  customCss?: string;
}): string {
  const { page, metadata, navigation, customCss } = options;

  void page;
  void metadata;
  void navigation;
  void customCss;

  const navHtml = navigation
    .map(
      (section) => `
      <div class="nav-section">
        <h3 class="nav-title">${section.title}</h3>
        ${section.items
          .map((item) => `<a href="${item.href}" class="nav-item">${item.title}</a>`)
          .join('')}
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title} | ${metadata.title}</title>
  <meta name="description" content="${page.description || ''}">
  <style>
    :root {
      --bg-primary: #ffffff;
      --bg-secondary: #f8fafc;
      --bg-muted: #f1f5f9;
      --text-primary: #0f172a;
      --text-muted: #64748b;
      --border: #e2e8f0;
      --primary: #3b82f6;
      --success: #22c55e;
      --warning: #eab308;
      --error: #ef4444;
    }
    .dark {
      --bg-primary: #0f172a;
      --bg-secondary: #1e293b;
      --bg-muted: #334155;
      --text-primary: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      line-height: 1.6;
    }
    .layout { display: flex; min-height: 100vh; }
    .sidebar {
      width: 280px;
      border-right: 1px solid var(--border);
      background: var(--bg-secondary);
      padding: 1.5rem;
      position: fixed;
      height: 100vh;
      overflow-y: auto;
    }
    .main { flex: 1; margin-left: 280px; padding: 2rem 3rem; max-width: 1200px; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      border-bottom: 1px solid var(--border);
      background: var(--bg-secondary);
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .nav-section { margin-bottom: 1.5rem; }
    .nav-title { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 0.5rem; }
    .nav-item { display: block; padding: 0.375rem 0.75rem; border-radius: 0.375rem; color: var(--text-primary); text-decoration: none; font-size: 0.875rem; }
    .nav-item:hover { background: var(--bg-muted); }
    .nav-item.active { background: var(--primary); color: white; }
    h1 { font-size: 2rem; font-weight: 700; margin-bottom: 1rem; }
    h2 { font-size: 1.5rem; font-weight: 600; margin: 2rem 0 1rem; }
    h3 { font-size: 1.25rem; font-weight: 600; margin: 1.5rem 0 0.75rem; }
    p { margin: 1rem 0; }
    .badge { display: inline-block; padding: 0.125rem 0.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 500; }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-yellow { background: #fef9c3; color: #854d0e; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .card { border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; margin: 1rem 0; }
    .card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem; }
    .method { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem; font-weight: 600; font-family: monospace; }
    .method-get { background: #dcfce7; color: #166534; }
    .method-post { background: #dbeafe; color: #1e40af; }
    .method-put { background: #fef9c3; color: #854d0e; }
    .method-patch { background: #ffedd5; color: #9a3412; }
    .method-delete { background: #fee2e2; color: #991b1b; }
    .route-path { font-family: monospace; font-size: 0.875rem; }
    .meta { font-size: 0.75rem; color: var(--text-muted); }
    .table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    .table th, .table td { border: 1px solid var(--border); padding: 0.75rem; text-align: left; }
    .table th { background: var(--bg-secondary); font-weight: 600; }
    .table tr:hover { background: var(--bg-muted); }
    code { font-family: 'SF Mono', Monaco, monospace; background: var(--bg-muted); padding: 0.125rem 0.25rem; border-radius: 0.25rem; font-size: 0.875em; }
    .dark-toggle { background: var(--bg-muted); border: 1px solid var(--border); padding: 0.5rem; border-radius: 0.5rem; cursor: pointer; }
    ${customCss || ''}
  </style>
</head>
<body>
  <aside class="sidebar">
    ${navHtml}
  </aside>
  <main class="main">
    <header class="header">
      <div>
        <strong>${page.title}</strong>
        <span class="meta"> | ${metadata.git?.branch ?? 'unknown'} @ ${metadata.git?.commit?.slice(0, 7) ?? 'unknown'}</span>
      </div>
      <button class="dark-toggle" onclick="document.documentElement.classList.toggle('dark')">
        🌓 Toggle theme
      </button>
    </header>

    <article>
      ${parseMarkdown(page.content)}
    </article>
  </main>

  <script>
    // Check for saved theme preference
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  </script>
</body>
</html>`;
}
