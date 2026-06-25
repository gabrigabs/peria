/**
 * Source Files Scanner - Scans TypeScript source files
 */

import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { SourceFile } from '../types/graph.js';
import { findFiles } from './index.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.eria',
  '.next',
  'coverage',
]);

const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Extract imports from content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const matches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);

  for (const match of matches) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('@peria/')) {
      imports.push(specifier);
    }
  }

  return imports;
}

/**
 * Find all TypeScript files
 */
async function findTypeScriptFiles(cwd: string): Promise<string[]> {
  const files: string[] = [];

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
      if (TYPESCRIPT_EXTENSIONS.has(ext) && !entry.name.endsWith('.d.ts')) {
        files.push(relative(cwd, join(dir, entry.name)));
      }
    }
  }

  await walk(cwd);
  return files;
}

/**
 * Scan TypeScript source files
 */
export async function scanSourceFiles(cwd: string, _config: ResolvedPeriaConfig): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  const tsFiles = await findTypeScriptFiles(cwd);

  for (const file of tsFiles) {
    const fullPath = join(cwd, file);

    try {
      const content = await readFile(fullPath, 'utf-8');

      files.push({
        id: `file:${file}`,
        path: file,
        module: file,
        imports: extractImports(content),
        source: { file, commit: undefined },
        confidence: 'high',
      });
    } catch {
      // Skip files we can't read
    }
  }

  return files;
}
