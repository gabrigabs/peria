/**
 * Enriched OpenAPI Generator
 *
 * Generates an enriched OpenAPI specification with Peria metadata.
 * This adds `x-peria` extensions to each operation with source information,
 * handler details, and drift status.
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { MatchingResult } from '../matcher/index.js';
import type { Confidence, OpenAPIOperation, SchemaEntity } from '../types/graph.js';

/**
 * Normalize a path for consistent lookup
 * Converts :param to {param} and removes trailing slashes
 */
function normalizePath(path: string): string {
  // Convert :param to {param}
  let normalized = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, '{$1}');
  // Remove trailing slashes (but keep root '/')
  normalized = normalized.replace(/\/+$/, '') || '/';
  return normalized;
}

/**
 * Peria metadata for an OpenAPI operation
 */
export interface OperationPeriaMetadata {
  /** Handler information if route has a code implementation */
  handler?: {
    className: string;
    methodName: string;
    file: string;
    line: number;
    module?: string;
  };
  /** Related documentation pages */
  docs: string[];
  /** Related schema names */
  schemas: string[];
  /** Confidence level of this match */
  confidence: Confidence;
  /** Drift status */
  drift?: 'aligned' | 'warning' | 'error';
  /** Source file information */
  source: {
    file: string;
    line?: number;
  };
  /** Extraction method */
  extractionMethod: 'ast' | 'openapi' | 'heuristic';
}

/**
 * Enriched OpenAPI operation with Peria metadata
 */
export interface EnrichedOpenAPIOperation extends OpenAPIOperation {
  // Peria enrichment
  'x-peria': OperationPeriaMetadata;
}

/**
 * Generate enriched OpenAPI with Peria metadata
 */
export function generateEnrichedOpenAPI(
  operations: OpenAPIOperation[],
  matchingResult: MatchingResult,
  routeToSchemaMap: Map<string, SchemaEntity[]>,
  routeToDocsMap: Map<string, string[]>,
  routeToModuleMap: Map<string, string>
): {
  enrichedOperations: EnrichedOpenAPIOperation[];
  stats: {
    totalOperations: number;
    withHandlers: number;
    withDocs: number;
    withSchemas: number;
    confidenceHigh: number;
    confidenceMedium: number;
    confidenceLow: number;
  };
} {
  const enrichedOperations: EnrichedOpenAPIOperation[] = [];
  let withHandlers = 0;
  let withDocs = 0;
  let withSchemas = 0;
  let confidenceHigh = 0;
  let confidenceMedium = 0;
  let confidenceLow = 0;

  // Create lookup maps for quick access
  const routeMatchMap = new Map(
    matchingResult.matches.map((match) => [
      `route:${match.route.method}:${normalizePath(match.route.path)}`,
      match,
    ])
  );

  for (const op of operations) {
    const match = routeMatchMap.get(`route:${op.method}:${normalizePath(op.path)}`);
    const route = match?.route;

    // Get related schemas for this route
    const schemas = route ? routeToSchemaMap.get(route.id) || [] : [];
    const schemaNames = schemas.map((s) => s.name);

    // Get related docs for this route
    const docs = route ? routeToDocsMap.get(route.id) || [] : [];

    // Get module info if available
    const module = route ? routeToModuleMap.get(route.id) : undefined;

    // Create enriched operation
    const enrichedOp: EnrichedOpenAPIOperation = {
      ...op,
      'x-peria': {
        handler: route?.handler
          ? {
              className: route.handler.className || '',
              methodName: route.handler.name,
              file: route.handler.file,
              line: route.handler.line,
              module,
            }
          : undefined,
        docs,
        schemas: schemaNames,
        confidence: match?.confidence || 'low',
        source: {
          file: op.source.file,
          line: op.source.line,
        },
        extractionMethod: 'openapi',
        drift: match?.matchType === 'unmatched' ? 'error' : 'aligned',
      },
    };

    enrichedOperations.push(enrichedOp);

    // Update stats
    if (route?.handler) withHandlers++;
    if (docs.length > 0) withDocs++;
    if (schemas.length > 0) withSchemas++;
    if (match?.confidence === 'high') confidenceHigh++;
    else if (match?.confidence === 'medium') confidenceMedium++;
    else confidenceLow++;
  }

  const stats = {
    totalOperations: operations.length,
    withHandlers,
    withDocs,
    withSchemas,
    confidenceHigh,
    confidenceMedium,
    confidenceLow,
  };

  return { enrichedOperations, stats };
}

/**
 * Save enriched OpenAPI to .peria/openapi.enriched.json
 */
export function saveEnrichedOpenAPI(
  enrichedOperations: EnrichedOpenAPIOperation[],
  outputPath: string
): void {
  // Ensure output directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  // Create the enriched OpenAPI spec structure
  type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head';
  const enrichedSpec: {
    openapi: string;
    info: { title: string; version: string; description: string };
    paths: Record<string, Record<HttpMethod, EnrichedOpenAPIOperation>>;
    components: { schemas: Record<string, unknown> };
  } = {
    openapi: '3.0.0',
    info: {
      title: 'Enriched OpenAPI with Peria Metadata',
      version: '1.0.0',
      description: 'OpenAPI specification enriched with Peria source metadata',
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  // Group operations by path
  const pathMap = new Map<string, Record<string, EnrichedOpenAPIOperation>>();

  for (const op of enrichedOperations) {
    if (!pathMap.has(op.path)) {
      pathMap.set(op.path, {});
    }
    const methodOps = pathMap.get(op.path);
    if (methodOps) {
      methodOps[op.method.toLowerCase() as HttpMethod] = op;
    }
  }

  // Build paths object
  for (const [path, methods] of pathMap) {
    enrichedSpec.paths[path] = methods;
  }

  // Save to file
  writeFileSync(outputPath, JSON.stringify(enrichedSpec, null, 2));
}

/**
 * Get summary of enriched OpenAPI generation
 */
export function summarizeEnrichment(stats: {
  totalOperations: number;
  withHandlers: number;
  withDocs: number;
  withSchemas: number;
  confidenceHigh: number;
  confidenceMedium: number;
  confidenceLow: number;
}): string {
  const lines: string[] = [];

  lines.push(`Enriched OpenAPI Generation Results`);
  lines.push(`===================================`);
  lines.push(``);
  lines.push(`Total Operations: ${stats.totalOperations}`);
  lines.push(``);
  const total = stats.totalOperations || 1; // Avoid division by zero
  lines.push(
    `With Code Handlers: ${stats.withHandlers} (${Math.round((stats.withHandlers / total) * 100)}%)`
  );
  lines.push(
    `With Documentation: ${stats.withDocs} (${Math.round((stats.withDocs / total) * 100)}%)`
  );
  lines.push(
    `With Schemas: ${stats.withSchemas} (${Math.round((stats.withSchemas / total) * 100)}%)`
  );
  lines.push(``);
  lines.push(`Confidence Distribution:`);
  lines.push(
    `  High: ${stats.confidenceHigh} (${Math.round((stats.confidenceHigh / total) * 100)}%)`
  );
  lines.push(
    `  Medium: ${stats.confidenceMedium} (${Math.round((stats.confidenceMedium / total) * 100)}%)`
  );
  lines.push(`  Low: ${stats.confidenceLow} (${Math.round((stats.confidenceLow / total) * 100)}%)`);

  return lines.join('\n');
}
