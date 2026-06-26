/**
 * Context Collector - Collects context file information
 */

import { readFile } from 'node:fs/promises';
import type { ContextFileSummary } from '../../types/wiki.js';

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getFirstHeading(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1];
}

export async function collectContextFiles(
  cwd: string,
  contextPaths: string[]
): Promise<ContextFileSummary[]> {
  // Read all context files in parallel
  const paths = unique(contextPaths);
  const contents = await Promise.all(paths.map((path) => readTextFile(join(cwd, path))));

  return paths.map((path, index) => ({
    path,
    exists: contents[index] !== null,
    heading: contents[index] ? getFirstHeading(contents[index]) : undefined,
  }));
}

function join(cwd: string, ...paths: string[]): string {
  return `${cwd.replace(/\\/g, '/').replace(/\/$/, '')}/${paths.join('/').replace(/\/+/g, '/')}`;
}
