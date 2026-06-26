/**
 * LLM Scanner - Scans llms.txt files
 */

import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseLlms } from '../parsers/llms.js';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { ScanWarning } from '../types/manifest.js';

/**
 * Scan llms.txt
 */
export async function scanLlms(
  cwd: string,
  config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<Awaited<ReturnType<typeof parseLlms>>> {
  const llmsPaths = config.sources?.llms || ['llms.txt'];

  for (const llmsPath of llmsPaths) {
    const fullPath = join(cwd, llmsPath);

    try {
      await stat(fullPath);
      return await parseLlms(fullPath);
    } catch {
      // Try next path
    }
  }

  warnings.push({
    code: 'llms-not-found',
    message: 'No llms.txt found',
    suggestion: 'Run `peria build` to generate llms.txt',
  });

  return {
    id: 'llms:unknown',
    type: 'llms',
    path: '',
    content: '',
    variant: 'unknown',
    metadata: {
      exists: false,
      pageCount: 0,
      sectionCount: 0,
      hasUrls: false,
      filePaths: [],
      lineCount: 0,
      variant: 'unknown',
    },
  };
}
