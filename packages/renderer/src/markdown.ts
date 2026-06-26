/**
 * Markdown parsing utilities
 */

export interface MarkdownOptions {
  /**
   * Enable syntax highlighting
   * @default true
   */
  highlight?: boolean;

  /**
   * Enable GFM (GitHub Flavored Markdown)
   * @default true
   */
  gfm?: boolean;

  /**
   * Custom code language class prefix
   */
  codeClassPrefix?: string;
}

/**
 * Parse markdown to HTML
 *
 * This is a simple markdown parser that handles the most common cases.
 * For production use, consider using 'marked' library.
 */
export function parseMarkdown(content: string, options: MarkdownOptions = {}): string {
  const { gfm = true } = options;

  let html = content;

  // Escape HTML first
  html = escapeHtml(html);

  // Code blocks (must be processed first)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || 'text';
    const escapedCode = code.trim();
    return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headers
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');

  // Strikethrough
  if (gfm) {
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  }

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Unordered lists
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

  // Tables (GFM)
  if (gfm) {
    html = parseTables(html);
  }

  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>\s*<\/p>/g, '');

  // Clean up multiple newlines
  html = html.replace(/\n+/g, '\n');

  return html;
}

/**
 * Parse GFM tables
 */
function parseTables(html: string): string {
  const tableRegex = /\|(.+)\|\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g;

  return html.replace(tableRegex, (_, header, body) => {
    const headers = header
      .split('|')
      .map((h: string) => h.trim())
      .filter(Boolean);
    const rows = body
      .trim()
      .split('\n')
      .map((row: string) =>
        row
          .split('|')
          .map((cell: string) => cell.trim())
          .filter(Boolean)
      );

    let table = '<table>\n<thead>\n<tr>\n';
    for (const h of headers) {
      table += `<th>${h}</th>`;
    }
    table += '</tr>\n</thead>\n<tbody>\n';

    for (const row of rows) {
      table += '<tr>\n';
      for (const cell of row) {
        table += `<td>${cell}</td>`;
      }
      table += '</tr>\n';
    }

    table += '</tbody>\n</table>';
    return table;
  });
}

/**
 * Render markdown to HTML with styling classes
 */
export function renderMarkdownToHtml(content: string, options: MarkdownOptions = {}): string {
  const html = parseMarkdown(content, options);

  // Wrap in a container for styling
  return `<div class="markdown-body">\n${html}\n</div>`;
}

/**
 * Extract headings from markdown
 */
export function extractHeadings(
  content: string
): Array<{ level: number; text: string; id: string }> {
  const headings: Array<{ level: number; text: string; id: string }> = [];
  const regex = /^(#{1,6}) (.+)$/gm;

  let match: RegExpExecArray | null = regex.exec(content);
  while (match !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    const id = text.toLowerCase().replace(/[^\w]+/g, '-');
    headings.push({ level, text, id });
    match = regex.exec(content);
  }

  return headings;
}

/**
 * Generate table of contents from markdown
 */
export function generateTableOfContents(content: string): string {
  const headings = extractHeadings(content);

  if (headings.length === 0) return '';

  let toc = '<nav class="toc">\n<h2>Table of Contents</h2>\n<ul>\n';

  for (const heading of headings) {
    const indent = '  '.repeat(heading.level - 1);
    toc += `${indent}<li><a href="#${heading.id}">${heading.text}</a></li>\n`;
  }

  toc += '</ul>\n</nav>';
  return toc;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return text.replace(/[&<>"']/g, (char) => htmlEntities[char] || char);
}

/**
 * Strip markdown formatting and return plain text
 */
export function stripMarkdown(content: string): string {
  let text = content;

  // Remove code blocks
  text = text.replace(/```[\s\S]*?```/g, '');

  // Remove inline code
  text = text.replace(/`[^`]+`/g, '');

  // Remove headers
  text = text.replace(/^#{1,6} /gm, '');

  // Remove links but keep text
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove images
  text = text.replace(/!\[[^\]]*\]\([^)]+\)/g, '');

  // Remove bold/italic
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
  text = text.replace(/\*([^*]+)\*/g, '$1');
  text = text.replace(/__([^_]+)__/g, '$1');
  text = text.replace(/_([^_]+)_/g, '$1');

  // Remove strikethrough
  text = text.replace(/~~([^~]+)~~/g, '$1');

  // Remove blockquotes
  text = text.replace(/^> /gm, '');

  // Remove list markers
  text = text.replace(/^[-*] /gm, '');
  text = text.replace(/^\d+\. /gm, '');

  // Clean up whitespace
  text = text.replace(/\n{3,}/g, '\n\n');

  return text.trim();
}
