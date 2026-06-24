/**
 * llms.txt parser for Peria
 *
 * Parses llms.txt files and extracts structured data about:
 * - File variant (full vs summary)
 * - Page links
 * - Section structure
 * - Source file references
 */

import { readFile, stat } from 'node:fs/promises';
import type { Heading } from '../types/graph.js';
import type { LlmsSource } from '../types/source.js';

// Pattern for page links in llms.txt
const PAGE_LINK_PATTERN = /^\s*-\s+(.+?):\s+(.+)$/gm;

// Pattern for section headers (## or #)
const SECTION_PATTERN = /^#{1,2}\s+(.+)$/gm;

// Pattern for file paths
const FILE_PATH_PATTERN =
  /(?:^|\s)((?:[./]?[a-zA-Z0-9_/-])+(?:\.(?:md|ts|tsx|js|jsx|json|yaml|yml|toml)))/gm;

// Pattern for URLs
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s)]+/gi;

// Known llms.txt variants
export type LlmsVariant = 'full' | 'summary' | 'unknown';

/**
 * Parse an llms.txt file
 */
export async function parseLlms(filePath: string): Promise<LlmsSource> {
  const exists = await fileExists(filePath);

  if (!exists) {
    return {
      id: generateId(filePath),
      type: 'llms',
      path: filePath,
      content: '',
      variant: 'unknown',
      metadata: {
        exists: false,
        pageCount: 0,
        sectionCount: 0,
        hasUrls: false,
      },
    };
  }

  const content = await readFile(filePath, 'utf-8');
  const stats = await stat(filePath);

  // Detect variant
  const variant = detectVariant(content);

  // Extract pages
  const pages = extractPages(content);

  // Extract sections
  const sections = extractSections(content);

  // Extract file paths
  const filePaths = extractFilePaths(content);

  // Check for URLs
  const hasUrls = containsUrls(content);

  return {
    id: generateId(filePath),
    type: 'llms',
    path: filePath,
    content,
    variant,
    metadata: {
      exists: true,
      pageCount: pages.length,
      sectionCount: sections.length,
      hasUrls,
      filePaths,
      lineCount: content.split('\n').length,
      byteSize: stats.size,
      variant,
    },
  };
}

/**
 * Parse llms.txt content directly
 */
export function parseLlmsContent(filePath: string, content: string): LlmsSource {
  const variant = detectVariant(content);
  const pages = extractPages(content);
  const sections = extractSections(content);
  const filePaths = extractFilePaths(content);
  const hasUrls = containsUrls(content);

  return {
    id: generateId(filePath),
    type: 'llms',
    path: filePath,
    content,
    variant,
    metadata: {
      exists: true,
      pageCount: pages.length,
      sectionCount: sections.length,
      hasUrls,
      filePaths,
      lineCount: content.split('\n').length,
      variant,
    },
  };
}

/**
 * Detect the variant of an llms.txt file
 */
function detectVariant(content: string): LlmsVariant {
  const firstLines = content.split('\n').slice(0, 10).join('\n').toLowerCase();

  // Check for variant indicators in first lines
  if (firstLines.includes('summary') || firstLines.includes('overview')) {
    return 'summary';
  }

  if (firstLines.includes('full') || firstLines.includes('complete')) {
    return 'full';
  }

  // Check structure
  const pageCount = (content.match(PAGE_LINK_PATTERN) || []).length;
  const hasSections = /#{1,2}\s+/.test(content);
  const lineCount = content.split('\n').length;

  // If it's short with few links, it's likely a summary
  if (lineCount < 50 && pageCount < 20) {
    return 'summary';
  }

  // If it has many pages and sections, it might be full
  if (pageCount > 50 || hasSections) {
    return 'full';
  }

  return 'unknown';
}

/**
 * Extract page links from llms.txt
 */
function extractPages(content: string): LlmsPage[] {
  const pages: LlmsPage[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  PAGE_LINK_PATTERN.lastIndex = 0;

  while (true) {
    match = PAGE_LINK_PATTERN.exec(content);
    if (match === null) break;

    const title = match[1].trim();
    let url = match[2].trim();
    const key = `${title}:${url}`;

    if (seen.has(key)) continue;
    seen.add(key);

    // Normalize URL
    url = url.replace(/^#\//, '').replace(/^\.\//, '');

    // Detect page type
    let type: LlmsPage['type'] = 'unknown';
    if (url.includes('docs/') || url.includes('/docs')) type = 'docs';
    else if (url.includes('pages/')) type = 'wiki';
    else if (url.endsWith('.md')) type = 'markdown';
    else if (url.includes('packages/') || url.includes('@peria/')) type = 'package';

    pages.push({
      title,
      url,
      type,
      sourcePath: extractSourcePath(url),
    });
  }

  return pages;
}

/**
 * Extract sections from llms.txt
 */
function extractSections(content: string): Heading[] {
  const sections: Heading[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  SECTION_PATTERN.lastIndex = 0;

  while (true) {
    match = SECTION_PATTERN.exec(content);
    if (match === null) break;

    const text = match[1].trim();
    const level = match[0].startsWith('##') ? 2 : 1;

    if (seen.has(text)) continue;
    seen.add(text);

    sections.push({
      level,
      text,
      anchor: generateAnchor(text),
    });
  }

  return sections;
}

/**
 * Extract file paths from llms.txt
 */
function extractFilePaths(content: string): string[] {
  const paths: string[] = [];
  const seen = new Set<string>();

  let match: RegExpExecArray | null;
  FILE_PATH_PATTERN.lastIndex = 0;

  while (true) {
    match = FILE_PATH_PATTERN.exec(content);
    if (match === null) break;

    const path = match[1].trim();

    // Skip URLs and obvious non-source paths
    if (path.startsWith('http') || path.includes('//')) continue;
    if (path.includes('node_modules')) continue;

    if (!seen.has(path)) {
      seen.add(path);
      paths.push(path);
    }
  }

  return paths;
}

/**
 * Check if content contains URLs
 */
function containsUrls(content: string): boolean {
  return URL_PATTERN.test(content);
}

/**
 * Extract source path from URL
 */
function extractSourcePath(url: string): string | undefined {
  // Remove anchors
  const withoutAnchor = url.split('#')[0];

  // Convert URLs to file paths
  if (withoutAnchor.endsWith('.md') || withoutAnchor.endsWith('.ts')) {
    return withoutAnchor;
  }

  // Handle paths like docs/pages/overview.md
  if (withoutAnchor.startsWith('docs/') || withoutAnchor.startsWith('/docs')) {
    return withoutAnchor.replace(/^\/?docs\//, '');
  }

  return undefined;
}

/**
 * Generate anchor from text
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
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate unique ID from file path
 */
function generateId(filePath: string): string {
  const normalized = filePath.replace(/^\.\//, '').replace(/\//g, '-');
  return `llms:${normalized}`;
}

/**
 * Page extracted from llms.txt
 */
export interface LlmsPage {
  title: string;
  url: string;
  type: 'docs' | 'wiki' | 'markdown' | 'package' | 'unknown';
  sourcePath?: string;
}

/**
 * Llms.txt metadata
 */
export interface LlmsMetadata {
  exists: boolean;
  pageCount: number;
  sectionCount: number;
  hasUrls: boolean;
  filePaths: string[];
  lineCount?: number;
  byteSize?: number;
  variant: LlmsVariant;
}
