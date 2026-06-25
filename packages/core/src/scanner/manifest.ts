/**
 * Manifest Scanner - Builds manifest metadata
 */

import type {
  DocsMetadata,
  LlmsMetadata,
  OpenAPIMetadata,
  PeriaManifest,
  RepoInfo,
  ScanWarning,
} from '../types/manifest.js';
import type { OpenAPIOperation } from '../types/graph.js';

/**
 * Extract schemas from OpenAPI spec
 */
function extractSchemasFromOpenAPI(
  openapiResults: Array<{ operations: OpenAPIOperation[] }>
): Array<{ name: string; type: 'request' | 'response' | 'parameter'; openapiRef?: string }> {
  const schemas: Array<{ name: string; type: 'request' | 'response' | 'parameter'; openapiRef?: string }> = [];

  for (const { operations } of openapiResults) {
    for (const op of operations) {
      // Extract from request body
      if (op.requestBody?.schema) {
        schemas.push({
          name: op.requestBody.schema,
          type: 'request',
          openapiRef: `#/components/schemas/${op.requestBody.schema}`,
        });
      }

      // Extract from responses
      for (const response of op.responses || []) {
        if (response.schema) {
          schemas.push({
            name: response.schema,
            type: 'response',
            openapiRef: `#/components/schemas/${response.schema}`,
          });
        }
      }

      // Extract from parameters
      for (const param of op.parameters || []) {
        if (param.schema) {
          schemas.push({
            name: param.name,
            type: 'parameter',
            description: param.description,
          });
        }
      }
    }
  }

  return schemas;
}

/**
 * Build OpenAPI metadata
 */
function buildOpenAPIMetadata(
  results: Array<{
    path: string;
    spec: {
      version?: string;
      metadata?: { title?: string; description?: string; paths?: string[]; schemas?: string[] };
    };
    operations: OpenAPIOperation[];
  }>,
  enrichedPath?: string
): OpenAPIMetadata | undefined {
  if (results.length === 0) return undefined;

  const first = results[0];
  return {
    path: first.path,
    version: first.spec.version,
    title: first.spec.metadata?.title,
    description: first.spec.metadata?.description,
    paths: first.spec.metadata?.paths || [],
    schemas: first.spec.metadata?.schemas || [],
    operationsCount: first.operations.length,
    confidence: 'high',
    enrichedPath,
  };
}

/**
 * Build docs metadata
 */
function buildDocsMetadata(
  results: Array<{
    path: string;
    content: {
      headings?: unknown[];
      metadata?: { routeMentions?: unknown[]; schemaRefs?: unknown[] };
    };
  }>
): DocsMetadata {
  return {
    paths: results.map((r) => r.path),
    pagesCount: results.length,
    totalHeadings: results.reduce((sum, r) => sum + (r.content.headings?.length || 0), 0),
    totalRouteMentions: results.reduce(
      (sum, r) => sum + (r.content.metadata?.routeMentions?.length || 0),
      0
    ),
    totalSchemaRefs: results.reduce(
      (sum, r) => sum + (r.content.metadata?.schemaRefs?.length || 0),
      0
    ),
  };
}

/**
 * Build llms metadata
 */
function buildLlmsMetadata(result: Awaited<ReturnType<any>>): LlmsMetadata {
  const metadata = result.metadata as { pageCount?: number; exists?: boolean } | undefined;
  return {
    path: result.path,
    variant: result.variant === 'unknown' ? 'summary' : result.variant,
    pageCount: metadata?.pageCount || 0,
    exists: metadata?.exists ?? false,
  };
}

/**
 * Write manifest to file
 */
export async function writeManifest(cwd: string, manifest: PeriaManifest): Promise<string> {
  const { writeFile } = await import('node:fs/promises');
  const { mkdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}
