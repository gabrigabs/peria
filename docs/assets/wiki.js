const state = {
  manifest: null,
  pages: [],
  activeSlug: '',
  search: '',
};

const nav = document.querySelector('#wiki-nav');
const title = document.querySelector('#page-title');
const description = document.querySelector('#page-description');
const content = document.querySelector('#wiki-content');
const searchInput = document.querySelector('#search-input');

async function init() {
  const response = await fetch('./wiki-manifest.json');
  state.manifest = await response.json();
  state.pages = state.manifest.pages;
  state.activeSlug = getSlugFromHash() || state.pages[0]?.slug || '';

  renderNav();
  await loadActivePage();
}

function getSlugFromHash() {
  return window.location.hash.replace(/^#\/?/, '');
}

function renderNav() {
  const query = state.search.trim().toLowerCase();
  const pageMatches = new Set(
    state.pages
      .filter(
        (page) =>
          !query ||
          page.title.toLowerCase().includes(query) ||
          page.description.toLowerCase().includes(query)
      )
      .map((page) => page.slug)
  );

  nav.innerHTML = state.manifest.tree
    .map((section) => {
      const links = section.pages
        .map((slug) => state.pages.find((page) => page.slug === slug))
        .filter((page) => page && pageMatches.has(page.slug))
        .map(
          (page) =>
            '<a class="nav-link ' +
            (page.slug === state.activeSlug ? 'active' : '') +
            '" href="#/' +
            page.slug +
            '">' +
            escapeHtml(page.title) +
            '</a>'
        )
        .join('');

      if (!links) return '';
      return (
        '<section><p class="nav-section-title">' +
        escapeHtml(section.title) +
        '</p>' +
        links +
        '</section>'
      );
    })
    .join('');
}

async function loadActivePage() {
  const page = state.pages.find((item) => item.slug === state.activeSlug) || state.pages[0];
  if (!page) return;

  state.activeSlug = page.slug;
  title.textContent = page.title;
  description.textContent = page.description;
  const response = await fetch(`./${page.path}`);
  const markdown = await response.text();
  content.innerHTML = markdownToHtml(markdown);
  renderNav();
}

function markdownToHtml(markdown) {
  const lines = markdown.split('\n');
  const html = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith('```')) {
      const code = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) {
        code.push(lines[index]);
        index += 1;
      }
      html.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      index += 1;
      continue;
    }

    if (/^\|.+\|$/.test(line) && /^\|\s*:?-{3,}/.test(lines[index + 1] || '')) {
      const tableLines = [line];
      index += 2;
      while (index < lines.length && /^\|.+\|$/.test(lines[index])) {
        tableLines.push(lines[index]);
        index += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    if (line.startsWith('### ')) {
      html.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      html.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      html.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith('> ')) {
      const quotes = [];
      while (index < lines.length && lines[index].startsWith('> ')) {
        quotes.push(`<p>${inline(lines[index].slice(2))}</p>`);
        index += 1;
      }
      html.push(`<blockquote>${quotes.join('')}</blockquote>`);
      continue;
    } else if (line.startsWith('- ')) {
      const items = [];
      while (index < lines.length && lines[index].startsWith('- ')) {
        items.push(`<li>${inline(lines[index].slice(2))}</li>`);
        index += 1;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    } else if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (index < lines.length && /^\d+\.\s/.test(lines[index])) {
        items.push(`<li>${inline(lines[index].replace(/^\d+\.\s/, ''))}</li>`);
        index += 1;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    } else if (line.trim()) {
      html.push(`<p>${inline(line)}</p>`);
    }

    index += 1;
  }

  return html.join('\n');
}

function renderTable(lines) {
  const rows = lines.map((line) =>
    line
      .split('|')
      .slice(1, -1)
      .map((cell) => inline(cell.trim()))
  );
  const header = rows.shift() || [];
  const head = `<thead><tr>${header.map((cell) => `<th>${cell}</th>`).join('')}</tr></thead>`;
  const body =
    '<tbody>' +
    rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('') +
    '</tbody>';
  return `<table>${head}${body}</table>`;
}

function inline(value) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

window.addEventListener('hashchange', async () => {
  state.activeSlug = getSlugFromHash() || state.activeSlug;
  await loadActivePage();
});

searchInput.addEventListener('input', () => {
  state.search = searchInput.value;
  renderNav();
});

init().catch((error) => {
  title.textContent = 'Wiki failed to load';
  content.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
});
