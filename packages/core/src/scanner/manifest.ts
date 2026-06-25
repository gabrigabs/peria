/**
 * Manifest Scanner - Builds manifest metadata
 */

import type {
  DocsMetadata,
  LlmsMetadata,
  OpenAPIMetadata,
  PeriaManifest,
} from '../types/manifest.js';
import type { OpenAPIOperation } from '../types/graph.js';

/**
 * Build OpenAPI metadata
 */
export function buildOpenAPIMetadata(
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
export function buildDocsMetadata(
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
export function buildLlmsMetadata(result: { path: string; variant: string; metadata?: { pageCount?: number; exists?: boolean } }): LlmsMetadata {
  const metadata = result.metadata;
  return {
    path: result.path,
    variant: result.variant === 'unknown' ? 'summary' : (result.variant as 'full' | 'summary'),
    pageCount: metadata?.pageCount || 0,
    exists: metadata?.exists ?? false,
  };
}

/**
 * Write manifest to file
 */
export async function writeManifest(cwd: string, manifest: PeriaManifest): Promise<string> {
  const { writeFile, mkdir } = await import('node:fs/promises');
  const { join } = await import('node:path');

  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}
