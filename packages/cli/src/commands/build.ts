/**
 * Build command - generates the Peria wiki artifacts
 */

import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildWiki, loadConfig } from '@peria/core'
import { logger } from '../utils/logger.js'

type WikiManifest = Awaited<ReturnType<typeof buildWiki>>['manifest']

export async function buildCommand(cwd: string): Promise<void> {
  logger.header('Peria Build')

  const config = await loadConfig(cwd)
  if (!config) {
    logger.warning('No peria.config.ts found. Using default configuration.')
  }

  const result = await buildWiki(cwd, config ?? {})
  const docsDir = join(cwd, result.config.docs.outputDir)
  const pagesDir = join(docsDir, 'pages')
  const assetsDir = join(docsDir, 'assets')
  const artifactDir = join(cwd, '.eria')

  await mkdir(pagesDir, { recursive: true })
  await mkdir(assetsDir, { recursive: true })
  await mkdir(artifactDir, { recursive: true })

  // Write all wiki pages in parallel
  await Promise.all(result.pages.map((page) => writeFile(join(docsDir, page.path), page.body, 'utf-8')))

  // Write all remaining files in parallel
  await Promise.all([
    writeJsonFile(join(docsDir, 'wiki-manifest.json'), result.manifest),
    writeFile(join(docsDir, 'index.html'), renderWikiHtml(result.manifest), 'utf-8'),
    writeFile(join(assetsDir, 'wiki.css'), renderWikiCss(), 'utf-8'),
    writeFile(join(assetsDir, 'wiki.js'), renderWikiJs(), 'utf-8'),
    writeJsonFile(join(artifactDir, 'graph.json'), result.graph),
    writeJsonFile(join(artifactDir, 'manifest.json'), result.manifest),
    writeFile(join(artifactDir, 'ai-context.md'), result.llmsText, 'utf-8'),
    writeFile(join(cwd, 'llms.txt'), result.llmsText, 'utf-8'),
  ])

  logger.success(`Generated ${result.pages.length} wiki pages in ${result.config.docs.outputDir}`)
  logger.success('Generated visual wiki UI')
  logger.success('Generated .eria/graph.json')
  logger.success('Generated llms.txt')
  logger.dim(`Commit: ${result.commit ?? 'unknown'}`)
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8')
}

function renderWikiHtml(manifest: WikiManifest): string {
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
`
}

function renderWikiCss(): string {
  return `:root {
  color-scheme: light;
  --bg: #f6f7f4;
  --panel: #ffffff;
  --panel-strong: #fdfbf7;
  --text: #1d2522;
  --muted: #62706b;
  --border: #d9dfd7;
  --accent: #226b5f;
  --accent-strong: #164b43;
  --blue: #355f8c;
  --code: #202a36;
  --shadow: 0 18px 45px rgba(25, 40, 35, 0.12);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.app-shell {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  min-height: 100vh;
}

.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  border-right: 1px solid var(--border);
  background: var(--panel-strong);
  padding: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--accent);
  color: #ffffff;
  font-weight: 800;
}

.brand strong,
.brand small {
  display: block;
}

.brand small,
.eyebrow,
.meta,
.search span,
.nav-section-title {
  color: var(--muted);
  font-size: 12px;
}

.project-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  background: #ffffff;
  padding: 12px;
  margin-bottom: 24px;
}

.project-card p {
  margin: 0;
  color: #35433e;
  font-size: 13px;
  line-height: 1.5;
}

.search {
  display: grid;
  gap: 8px;
  margin-bottom: 24px;
}

.search input {
  width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  background: #ffffff;
  color: var(--text);
  font: inherit;
}

.wiki-nav {
  display: grid;
  gap: 20px;
}

.nav-section-title {
  margin: 0 0 8px;
  text-transform: uppercase;
  letter-spacing: 0;
  font-weight: 700;
}

.nav-link {
  display: block;
  margin: 2px 0;
  border-radius: 8px;
  padding: 8px 10px;
  color: var(--text);
  text-decoration: none;
}

.nav-link:hover,
.nav-link.active {
  background: #e5eee9;
  color: var(--accent-strong);
}

.content-shell {
  min-width: 0;
  padding: 32px clamp(20px, 5vw, 72px) 72px;
}

.topbar {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 8px;
  text-transform: uppercase;
  font-weight: 700;
}

.topbar h1 {
  margin: 0;
  font-size: clamp(30px, 4vw, 52px);
  line-height: 1.02;
  letter-spacing: 0;
}

.page-description {
  max-width: 760px;
  margin: 12px 0 0;
  color: #45534f;
  font-size: 16px;
  line-height: 1.55;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 220px;
  max-width: 320px;
  text-align: right;
  overflow-wrap: anywhere;
}

.meta span {
  border: 1px solid var(--border);
  border-radius: 999px;
  background: #ffffff;
  padding: 6px 9px;
}

.wiki-content {
  max-width: 1120px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--panel);
  box-shadow: var(--shadow);
  padding: clamp(24px, 4vw, 48px);
}

.wiki-content h1 {
  margin-top: 0;
  font-size: 34px;
  letter-spacing: 0;
}

.wiki-content h2 {
  margin-top: 34px;
  padding-top: 20px;
  border-top: 1px solid var(--border);
  font-size: 23px;
  letter-spacing: 0;
}

.wiki-content h3 {
  margin-top: 24px;
  font-size: 18px;
  letter-spacing: 0;
}

.wiki-content p,
.wiki-content li {
  color: #2e3834;
  line-height: 1.68;
}

.wiki-content a {
  color: var(--blue);
}

.wiki-content code {
  border-radius: 5px;
  background: #eef2ef;
  padding: 2px 5px;
  color: #1d3833;
  font-size: 0.92em;
}

.wiki-content pre {
  overflow-x: auto;
  border-radius: 8px;
  background: var(--code);
  padding: 18px;
  color: #edf5f2;
}

.wiki-content pre code {
  background: transparent;
  color: inherit;
  padding: 0;
}

.wiki-content blockquote {
  margin: 18px 0;
  border-left: 4px solid var(--accent);
  background: #eef5f1;
  padding: 12px 16px;
  color: #243832;
}

.wiki-content blockquote p {
  margin: 0;
}

.wiki-content table {
  display: block;
  width: 100%;
  overflow-x: auto;
  border-collapse: collapse;
  margin: 18px 0 28px;
}

.wiki-content th,
.wiki-content td {
  border-bottom: 1px solid var(--border);
  padding: 10px 12px;
  text-align: left;
  vertical-align: top;
}

.wiki-content th {
  background: #eef2ef;
  color: var(--accent-strong);
}

@media (max-width: 860px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .sidebar {
    position: static;
    height: auto;
    border-right: 0;
    border-bottom: 1px solid var(--border);
  }

  .topbar {
    display: grid;
  }

  .meta {
    text-align: left;
  }
}
`
}

function renderWikiJs(): string {
  return `const state = {
  manifest: null,
  pages: [],
  activeSlug: '',
  search: '',
}

const nav = document.querySelector('#wiki-nav')
const title = document.querySelector('#page-title')
const description = document.querySelector('#page-description')
const content = document.querySelector('#wiki-content')
const searchInput = document.querySelector('#search-input')

async function init() {
  const response = await fetch('./wiki-manifest.json')
  state.manifest = await response.json()
  state.pages = state.manifest.pages
  state.activeSlug = getSlugFromHash() || state.pages[0]?.slug || ''

  renderNav()
  await loadActivePage()
}

function getSlugFromHash() {
  return window.location.hash.replace(/^#\\/?/, '')
}

function renderNav() {
  const query = state.search.trim().toLowerCase()
  const pageMatches = new Set(
    state.pages
      .filter((page) => !query || page.title.toLowerCase().includes(query) || page.description.toLowerCase().includes(query))
      .map((page) => page.slug)
  )

  nav.innerHTML = state.manifest.tree.map((section) => {
    const links = section.pages
      .map((slug) => state.pages.find((page) => page.slug === slug))
      .filter((page) => page && pageMatches.has(page.slug))
      .map((page) => '<a class="nav-link ' + (page.slug === state.activeSlug ? 'active' : '') + '" href="#/' + page.slug + '">' + escapeHtml(page.title) + '</a>')
      .join('')

    if (!links) return ''
    return '<section><p class="nav-section-title">' + escapeHtml(section.title) + '</p>' + links + '</section>'
  }).join('')
}

async function loadActivePage() {
  const page = state.pages.find((item) => item.slug === state.activeSlug) || state.pages[0]
  if (!page) return

  state.activeSlug = page.slug
  title.textContent = page.title
  description.textContent = page.description
  const response = await fetch('./' + page.path)
  const markdown = await response.text()
  content.innerHTML = markdownToHtml(markdown)
  renderNav()
}

function markdownToHtml(markdown) {
  const lines = markdown.split('\\n')
  const html = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    if (line.startsWith('\`\`\`')) {
      const code = []
      index += 1
      while (index < lines.length && !lines[index].startsWith('\`\`\`')) {
        code.push(lines[index])
        index += 1
      }
      html.push('<pre><code>' + escapeHtml(code.join('\\n')) + '</code></pre>')
      index += 1
      continue
    }

    if (/^\\|.+\\|$/.test(line) && /^\\|\\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const tableLines = [line]
      index += 2
      while (index < lines.length && /^\\|.+\\|$/.test(lines[index])) {
        tableLines.push(lines[index])
        index += 1
      }
      html.push(renderTable(tableLines))
      continue
    }

    if (line.startsWith('### ')) {
      html.push('<h3>' + inline(line.slice(4)) + '</h3>')
    } else if (line.startsWith('## ')) {
      html.push('<h2>' + inline(line.slice(3)) + '</h2>')
    } else if (line.startsWith('# ')) {
      html.push('<h1>' + inline(line.slice(2)) + '</h1>')
    } else if (line.startsWith('> ')) {
      const quotes = []
      while (index < lines.length && lines[index].startsWith('> ')) {
        quotes.push('<p>' + inline(lines[index].slice(2)) + '</p>')
        index += 1
      }
      html.push('<blockquote>' + quotes.join('') + '</blockquote>')
      continue
    } else if (line.startsWith('- ')) {
      const items = []
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push('<li>' + inline(lines[index].slice(2)) + '</li>')
        index += 1
      }
      html.push('<ul>' + items.join('') + '</ul>')
      continue
    } else if (/^\\d+\\.\\s/.test(line)) {
      const items = []
      while (index < lines.length && /^\\d+\\.\\s/.test(lines[index])) {
        items.push('<li>' + inline(lines[index].replace(/^\\d+\\.\\s/, '')) + '</li>')
        index += 1
      }
      html.push('<ol>' + items.join('') + '</ol>')
      continue
    } else if (line.trim()) {
      html.push('<p>' + inline(line) + '</p>')
    }

    index += 1
  }

  return html.join('\\n')
}

function renderTable(lines) {
  const rows = lines.map((line) => line.split('|').slice(1, -1).map((cell) => inline(cell.trim())))
  const header = rows.shift() || []
  const head = '<thead><tr>' + header.map((cell) => '<th>' + cell + '</th>').join('') + '</tr></thead>'
  const body = '<tbody>' + rows.map((row) => '<tr>' + row.map((cell) => '<td>' + cell + '</td>').join('') + '</tr>').join('') + '</tbody>'
  return '<table>' + head + body + '</table>'
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\\*\\*([^*]+)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

window.addEventListener('hashchange', async () => {
  state.activeSlug = getSlugFromHash() || state.activeSlug
  await loadActivePage()
})

searchInput.addEventListener('input', () => {
  state.search = searchInput.value
  renderNav()
})

init().catch((error) => {
  title.textContent = 'Wiki failed to load'
  content.innerHTML = '<p>' + escapeHtml(error.message) + '</p>'
})
`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
