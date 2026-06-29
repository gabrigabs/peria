import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';

export interface PeriaDocsPathOptions {
  docsPath?: string;
  llmsPath?: string;
}

export interface ResolvedPeriaDocsPaths {
  docsDir: string;
  llmsPath: string;
}

export function resolveDocsPaths(options: PeriaDocsPathOptions = {}): ResolvedPeriaDocsPaths {
  const docsDir = isAbsolute(options.docsPath ?? 'docs')
    ? (options.docsPath ?? 'docs')
    : resolve(process.cwd(), options.docsPath ?? 'docs');

  if (!existsSync(docsDir)) {
    throw new Error(
      `Peria docs directory does not exist: ${docsDir}. Run "peria build" before mounting the adapter.`
    );
  }

  const llmsPath = options.llmsPath
    ? isAbsolute(options.llmsPath)
      ? options.llmsPath
      : resolve(process.cwd(), options.llmsPath)
    : join(dirname(docsDir), 'llms.txt');

  return { docsDir, llmsPath };
}

export async function readWikiManifest(docsDir: string): Promise<unknown> {
  const content = await readFile(join(docsDir, 'wiki-manifest.json'), 'utf-8');
  return JSON.parse(content);
}

export async function readLlmsText(llmsPath: string): Promise<string> {
  return readFile(llmsPath, 'utf-8');
}

export function resolveFallbackFile(docsDir: string): string | null {
  const indexPath = join(docsDir, 'index.html');
  if (existsSync(indexPath)) {
    return indexPath;
  }

  const readmePath = join(docsDir, 'README.md');
  if (existsSync(readmePath)) {
    return readmePath;
  }

  return null;
}

export function missingDocsPayload(docsDir: string): { error: string; message: string } {
  return {
    error: 'Documentation not available',
    message: `Peria docs were not found in ${docsDir}. Run "peria build" first.`,
  };
}
