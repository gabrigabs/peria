/**
 * CLI Collector - Collects CLI command information
 */

import { readFile } from 'node:fs/promises';
import type { CliCommandSummary } from '../../types/wiki.js';

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function getImplementationStatus(content: string | null): CliCommandSummary['status'] {
  if (!content) return 'missing-handler';
  if (content.includes('not implemented yet')) return 'stub';
  return 'implemented';
}

export async function collectCliCommands(cwd: string): Promise<CliCommandSummary[]> {
  const source = 'packages/cli/src/index.ts';
  const content = await readTextFile(join(cwd, source));
  if (!content) return [];

  // Extract command info first, then read handler files in parallel
  const commandInfos: Array<{
    name: string;
    description: string;
    line: number;
    handlerPath: string;
  }> = [];
  const commandPattern = /cli\.command\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g;
  commandPattern.lastIndex = 0;
  let match: RegExpExecArray | null = commandPattern.exec(content);

  while (match !== null) {
    commandInfos.push({
      name: match[1],
      description: match[2],
      line: getLineNumber(content, match.index),
      handlerPath: `packages/cli/src/commands/${match[1]}.ts`,
    });

    match = commandPattern.exec(content);
  }

  // Read all handler files in parallel
  const handlerContents = await Promise.all(
    commandInfos.map((info) => readTextFile(join(cwd, info.handlerPath)))
  );

  return commandInfos.map((info, index) => ({
    name: info.name,
    description: info.description,
    source,
    line: info.line,
    handlerPath: handlerContents[index] ? info.handlerPath : undefined,
    status: getImplementationStatus(handlerContents[index]),
  }));
}

function join(cwd: string, ...paths: string[]): string {
  // Simple join implementation
  return `${cwd.replace(/\\/g, '/').replace(/\/$/, '')}/${paths.join('/').replace(/\/+/g, '/')}`;
}
