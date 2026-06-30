/**
 * Markdown Scanner - Scans documentation files
 */

import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, join, relative } from 'node:path';
import { parseMarkdown } from '../parsers/markdown.js';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { DocPageEntity } from '../types/graph.js';
import type { ScanWarning } from '../types/manifest.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.eria',
  '.next',
  'coverage',
]);

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

/**
 * Find markdown files matching patterns
 */
export async function findMarkdownFiles(
  cwd: string,
  patterns: string[] = ['**/*.md']
): Promise<string[]> {
  const files: string[] = [];
  const seen = new Set<string>();

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(join(dir, entry.name));
        }
        continue;
      }

      const ext = extname(entry.name);
      if (MARKDOWN_EXTENSIONS.has(ext)) {
        const relPath = relative(cwd, join(dir, entry.name));
        if (!seen.has(relPath) && matchesAnyPattern(relPath, patterns)) {
          seen.add(relPath);
          files.push(relPath);
        }
      }
    }
  }

  await walk(cwd);
  return files;
}

function matchesAnyPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

function matchesPattern(path: string, pattern: string): boolean {
  if (pattern === path) {
    return true;
  }

  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, 'DOUBLE_STAR_SLASH')
    .replace(/\*\*/g, 'DOUBLE_STAR')
    .replace(/\*/g, '[^/]*')
    .replace(/DOUBLE_STAR_SLASH/g, '(?:.*/)?')
    .replace(/DOUBLE_STAR/g, '.*');
  return new RegExp(`^${escaped}$`).test(path);
}

/**
 * Scan documentation files
 */
export async function scanDocs(
  cwd: string,
  config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<Array<{ path: string; content: Awaited<ReturnType<typeof parseMarkdown>> }>> {
  const results: Array<{ path: string; content: Awaited<ReturnType<typeof parseMarkdown>> }> = [];
  const docPaths = await findMarkdownFiles(cwd, config.sources.markdown);

  for (const docPath of docPaths) {
    const fullPath = join(cwd, docPath);

    try {
      const content = await readFile(fullPath, 'utf-8');
      const parsed = await parseMarkdown(docPath, content);
      results.push({ path: docPath, content: parsed });
    } catch (err) {
      warnings.push({
        code: 'doc-parse-error',
        message: `Failed to parse markdown: ${err instanceof Error ? err.message : String(err)}`,
        file: docPath,
      });
    }
  }

  return results;
}

/**
 * Create doc page entity
 */
export function docToEntity(
  path: string,
  parsed: Awaited<ReturnType<typeof parseMarkdown>>
): DocPageEntity {
  const frontmatter = parsed.frontmatter as { title?: string } | undefined;

  return {
    id: `doc:${path}`,
    title: frontmatter?.title || basename(path, '.md'),
    path,
    headings: parsed.headings || [],
    routeMentions:
      (parsed.metadata as { routeMentions?: DocPageEntity['routeMentions'] })?.routeMentions || [],
    schemaRefs: (parsed.metadata as { schemaRefs?: DocPageEntity['schemaRefs'] })?.schemaRefs || [],
    sourceRefs:
      (parsed.metadata as { sourceLinks?: DocPageEntity['sourceRefs'] })?.sourceLinks || [],
    content: parsed.content,
    source: { file: path, commit: undefined },
    confidence: 'high',
  };
}
