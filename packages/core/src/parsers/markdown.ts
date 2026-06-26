/**
 * Markdown parser for Peria
 *
 * Uses remark to parse markdown files and extract:
 * - Frontmatter (YAML/TOML)
 * - Headings with anchor IDs
 * - Route mentions (e.g., GET /users/:id)
 * - Schema references (e.g., UserDto, CreateUserRequest)
 * - Source file links
 */

import remarkFrontmatter from 'remark-frontmatter';
import remarkParse from 'remark-parse';
import { unified } from 'unified';
import type { Heading, RouteMention, SchemaReference, SourceRef } from '../types/graph.js';
import type { MarkdownSource } from '../types/source.js';

// Pattern for route mentions: METHOD /path or just /path
const ROUTE_PATTERN = /\b(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\s+(\/[^\s\])}]+)/gi;

// Pattern for schema references: PascalCase words that look like DTOs/types
const SCHEMA_PATTERN =
  /\b([A-Z][a-zA-Z0-9]*(?:Dto|Request|Response|Input|Output|Args|Params|Config|Options|Item|Entity|Model)\b)/g;

// Pattern for source file links
const SOURCE_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+\.(?:ts|tsx|js|jsx)(?:#[^)]+)?)\)/g;

// Pattern for code block language hints
const CODE_BLOCK_PATTERN = /^```(\w+)/;

/**
 * Parse markdown content and extract structured data
 */
export async function parseMarkdown(filePath: string, content: string): Promise<MarkdownSource> {
  const headings = extractHeadings(content);
  const frontmatter = extractFrontmatterFromContent(content);
  const routeMentions = extractRouteMentions(content);
  const schemaRefs = extractSchemaReferences(content);
  const sourceLinks = extractSourceLinks(content);
  const languageHints = extractLanguageHints(content);

  return {
    id: generateId(filePath),
    type: 'markdown',
    path: filePath,
    content,
    frontmatter,
    headings,
    metadata: {
      routeMentions,
      schemaRefs,
      sourceLinks,
      languageHints,
      wordCount: countWords(content),
      hasCodeBlocks: content.includes('```'),
      hasTables: content.includes('|'),
    },
  };
}

/**
 * Extract headings from markdown content
 */
function extractHeadings(content: string): Heading[] {
  const headings: Heading[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const anchor = generateAnchor(text);
      headings.push({ level, text, anchor });
    }
  }

  return headings;
}

/**
 * Extract frontmatter from markdown content
 */
function extractFrontmatterFromContent(content: string): Record<string, unknown> | undefined {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return undefined;

  const frontmatterContent = match[1];
  const result: Record<string, unknown> = {};

  for (const line of frontmatterContent.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value: string | boolean | number | string[] = line.slice(colonIndex + 1).trim();

    // Parse arrays
    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((v: string) => v.trim().replace(/^["']|["']$/g, ''));
    }
    // Parse booleans
    else if (typeof value === 'string' && value === 'true') value = true;
    else if (typeof value === 'string' && value === 'false') value = false;
    // Parse numbers
    else if (typeof value === 'string' && !Number.isNaN(Number(value))) value = Number(value);

    result[key] = value;
  }

  return result;
}

/**
 * Extract route mentions from content
 */
function extractRouteMentions(content: string): RouteMention[] {
  const mentions: RouteMention[] = [];
  const seen = new Set<string>();

  // Find METHOD /path patterns
  let match: RegExpExecArray | null;
  ROUTE_PATTERN.lastIndex = 0;

  while (true) {
    match = ROUTE_PATTERN.exec(content);
    if (match === null) break;

    const method = match[1].toUpperCase() as RouteMention['method'];
    const path = match[2];
    const key = `${method}:${path}`;

    if (!seen.has(key)) {
      seen.add(key);

      // Get context around the mention (50 chars before and after)
      const start = Math.max(0, match.index - 50);
      const end = Math.min(content.length, match.index + match[0].length + 50);
      const context = content.slice(start, end).replace(/\n/g, ' ').trim();

      mentions.push({ path, method, context });
    }
  }

  // Also find standalone paths (starting with /)
  const standalonePathPattern = /(?<![a-zA-Z])\/[\w/:-{}?*[\]]+(?![a-zA-Z/])/g;
  let standaloneMatch: RegExpExecArray | null;

  while (true) {
    standaloneMatch = standalonePathPattern.exec(content);
    if (standaloneMatch === null) break;

    const path = standaloneMatch[0];
    const key = `PATH:${path}`;

    if (!seen.has(key) && !path.includes('{{')) {
      // Skip template-like paths
      seen.add(key);

      const start = Math.max(0, standaloneMatch.index - 50);
      const end = Math.min(content.length, standaloneMatch.index + standaloneMatch[0].length + 50);
      const context = content.slice(start, end).replace(/\n/g, ' ').trim();

      mentions.push({ path, context });
    }
  }

  return mentions;
}

/**
 * Extract schema references from content
 */
function extractSchemaReferences(content: string): SchemaReference[] {
  const refs: SchemaReference[] = [];
  const seen = new Set<string>();

  SCHEMA_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = SCHEMA_PATTERN.exec(content);

  while (match !== null) {
    const name = match[1];

    if (!seen.has(name)) {
      seen.add(name);

      // Determine type based on suffix
      let type: SchemaReference['type'];
      if (name.endsWith('Request') || name.endsWith('Input')) type = 'interface';
      else if (name.endsWith('Response') || name.endsWith('Output')) type = 'interface';
      else if (name.endsWith('Dto')) type = 'type';
      else if (name.endsWith('Config')) type = 'interface';
      else if (name.endsWith('Options')) type = 'interface';

      refs.push({ name, type });
    }

    match = SCHEMA_PATTERN.exec(content);
  }

  return refs;
}

/**
 * Extract source file links from content
 */
function extractSourceLinks(content: string): SourceRef[] {
  const refs: SourceRef[] = [];
  const seen = new Set<string>();

  SOURCE_LINK_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null = SOURCE_LINK_PATTERN.exec(content);

  while (match !== null) {
    const url = match[2];

    // Skip external URLs
    if (url.startsWith('http') || url.startsWith('//')) {
      match = SOURCE_LINK_PATTERN.exec(content);
      continue;
    }

    // Extract line number from URL fragment
    const [file, fragment] = url.split('#');
    let line: number | undefined;

    if (fragment && /^\d+$/.test(fragment)) {
      line = parseInt(fragment, 10);
    }

    const key = `${file}:${line}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({ file, line, url });
    }

    match = SOURCE_LINK_PATTERN.exec(content);
  }

  return refs;
}

/**
 * Extract language hints from code blocks
 */
function extractLanguageHints(content: string): string[] {
  const hints = new Set<string>();
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(CODE_BLOCK_PATTERN);
    if (match) {
      hints.add(match[1]);
    }
  }

  return Array.from(hints);
}

/**
 * Count words in content (excluding markdown syntax)
 */
function countWords(content: string): number {
  // Remove code blocks
  let text = content.replace(/```[\s\S]*?```/g, ' ');
  // Remove inline code
  text = text.replace(/`[^`]+`/g, ' ');
  // Remove links
  text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  // Remove headings markers
  text = text.replace(/^#+\s+/gm, '');
  // Remove bold/italic
  text = text.replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');

  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

/**
 * Generate anchor from heading text
 */
function generateAnchor(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

/**
 * Generate unique ID from file path
 */
function generateId(filePath: string): string {
  // Simple hash-like ID from path
  const normalized = filePath.replace(/^\.\//, '').replace(/\//g, '-');
  return `markdown:${normalized}`;
}

/**
 * Parse markdown with unified (for more advanced processing)
 */
export async function parseMarkdownWithUnified(
  _filePath: string,
  content: string
): Promise<{
  vfile: { value: string; data: Record<string, unknown> };
  headings: Heading[];
  frontmatter: Record<string, unknown> | undefined;
  routeMentions: RouteMention[];
  schemaRefs: SchemaReference[];
  sourceLinks: SourceRef[];
}> {
  const processor = unified().use(remarkParse).use(remarkFrontmatter, ['yaml', 'toml']);

  const vfile = await processor.process(content);

  return {
    vfile: { value: String(vfile.value), data: vfile.data as Record<string, unknown> },
    headings: extractHeadings(content),
    frontmatter: extractFrontmatterFromContent(content),
    routeMentions: extractRouteMentions(content),
    schemaRefs: extractSchemaReferences(content),
    sourceLinks: extractSourceLinks(content),
  };
}
