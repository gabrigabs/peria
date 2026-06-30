import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import type { GitHubCache } from './types.js';

export const GITHUB_CACHE_PATH = '.peria/github.json';

export async function readGitHubCache(cwd: string): Promise<GitHubCache | null> {
  try {
    const content = await readFile(join(cwd, GITHUB_CACHE_PATH), 'utf-8');
    return JSON.parse(content) as GitHubCache;
  } catch {
    return null;
  }
}

export async function writeGitHubCache(cwd: string, cache: GitHubCache): Promise<string> {
  const path = join(cwd, GITHUB_CACHE_PATH);

  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(cache, null, 2)}\n`, 'utf-8');

  return path;
}
