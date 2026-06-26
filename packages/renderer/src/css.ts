/**
 * Wiki CSS Generator
 *
 * Generates the CSS for the wiki UI.
 */

/**
 * Render wiki CSS
 */
export function renderWikiCss(): string {
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
`;
}
