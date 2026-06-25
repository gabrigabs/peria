/**
 * OpenAPI Scanner - Scans OpenAPI specifications
 */

import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { parseOpenAPI, parseOpenAPIDetailed } from '../parsers/openapi.js';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { OpenAPIOperation } from '../types/graph.js';
import type { ScanWarning } from '../types/manifest.js';

export interface OpenAPIScanResult {
  path: string;
  spec: Awaited<ReturnType<typeof parseOpenAPI>>;
  operations: OpenAPIOperation[];
}

/**
 * Scan OpenAPI specifications
 */
export async function scanOpenAPI(
  cwd: string,
  config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<OpenAPIScanResult[]> {
  const results: OpenAPIScanResult[] = [];
  const openapiPaths = config.sources?.openapi ? [config.sources.openapi] : [];

  for (const openapiPath of openapiPaths) {
    const fullPath = join(cwd, openapiPath);

    try {
      await stat(fullPath);
    } catch {
      warnings.push({
        code: 'openapi-not-found',
        message: `OpenAPI spec not found: ${openapiPath}`,
        suggestion: 'Check your config.sources.openapi path',
      });
      continue;
    }

    try {
      const spec = await parseOpenAPI(fullPath);
      const { operations } = await parseOpenAPIDetailed(fullPath);
      results.push({ path: openapiPath, spec, operations });
    } catch (err) {
      warnings.push({
        code: 'openapi-parse-error',
        message: `Failed to parse OpenAPI: ${err instanceof Error ? err.message : String(err)}`,
        file: openapiPath,
      });
    }
  }

  return results;
}
