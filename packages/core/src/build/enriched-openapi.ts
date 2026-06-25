/**
 * Enriched OpenAPI Builder
 *
 * Generates enriched OpenAPI with Peria metadata.
 * This is a build step, not part of the scanner.
 */

import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import type { RouteEntity, SchemaEntity } from '../types/graph.js';
import type { ScanResult } from '../types/manifest.js';
import { generateEnrichedOpenAPI, saveEnrichedOpenAPI } from '../generators/enriched-openapi.js';

export interface BuildEnrichedOpenAPIOptions {
  cwd: string;
  scanResult: ScanResult;
}

export interface BuildEnrichedOpenAPIResult {
  path: string | undefined;
  stats: {
    totalOperations: number;
    withHandlers: number;
    withDocs: number;
    withSchemas: number;
  };
}

/**
 * Build enriched OpenAPI as a separate step
 * 
 * This function generates enriched OpenAPI by adding Peria metadata
 * (handler info, docs, schemas) to each OpenAPI operation.
 */
export async function buildEnrichedOpenAPI(
  options: BuildEnrichedOpenAPIOptions
): Promise<BuildEnrichedOpenAPIResult> {
  const { cwd, scanResult } = options;
  const { manifest } = scanResult;
  
  const { routes, openapiOps, docsPages } = manifest;

  // Only generate if there are OpenAPI operations
  if (openapiOps.length === 0) {
    return {
      path: undefined,
      stats: {
        totalOperations: 0,
        withHandlers: 0,
        withDocs: 0,
        withSchemas: 0,
      },
    };
  }

  // Build route-to-schema and route-to-docs maps
  const routeToSchemaMap = new Map<string, SchemaEntity[]>();
  const routeToDocsMap = new Map<string, string[]>();
  const routeToModuleMap = new Map<string, string>();

  for (const route of routes) {
    routeToSchemaMap.set(route.id, route.schemas);

    // Build docs map from route mentions (only docs that mention this specific route)
    const routeMentions = docsPages.flatMap((dp) =>
      dp.routeMentions.filter((rm) => rm.path === route.path).map(() => dp.path)
    );
    routeToDocsMap.set(route.id, [...new Set(routeMentions)]);

    // Build module map from handler
    if (route.handler?.className) {
      routeToModuleMap.set(route.id, route.handler.className);
    }
  }

  // Generate enriched OpenAPI
  const { enrichedOperations, stats } = generateEnrichedOpenAPI(
    openapiOps,
    { matches: [], unmatchedRoutes: [], unmatchedOperations: [], stats: { totalRoutes: 0, totalOperations: 0, exactMatches: 0, operationIdMatches: 0, fuzzyMatches: 0, unmatchedRoutes: 0, unmatchedOperations: 0 } },
    routeToSchemaMap,
    routeToDocsMap,
    routeToModuleMap
  );

  // Save enriched OpenAPI to .peria directory
  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });
  const enrichedPath = join(manifestDir, 'openapi.enriched.json');
  await saveEnrichedOpenAPI(enrichedOperations, enrichedPath);

  return {
    path: 'openapi.enriched.json',
    stats: {
      totalOperations: stats.totalOperations,
      withHandlers: stats.withHandlers,
      withDocs: stats.withDocs,
      withSchemas: stats.withSchemas,
    },
  };
}
