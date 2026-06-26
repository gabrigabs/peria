/**
 * Route vs OpenAPI Audit Check
 *
 * Compares extracted routes from code against OpenAPI operations.
 * Flags:
 * - Routes without corresponding OpenAPI operations (error)
 * - OpenAPI operations without corresponding routes (warning)
 */

import { matchRoutesToOpenAPI } from '../matcher/openapi-matcher.js';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';
import type { AuditCheck, AuditSeverity } from './types.js';

/**
 * Generate a unique ID for findings
 */
function generateId(prefix: string, index: number): string {
  return `audit-${prefix}-${Date.now().toString(36)}-${index}`;
}

/**
 * Route vs OpenAPI audit check
 */
export const runRouteOpenAPICheck: AuditCheck = {
  name: 'route-openapi',
  description: 'Compare routes in code against OpenAPI operations',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Skip if no routes or OpenAPI operations
    if (manifest.routes.length === 0 || manifest.openapiOps.length === 0) {
      return findings;
    }

    // Use the existing matcher
    const result = await matchRoutesToOpenAPI(manifest.routes, manifest.openapiOps);

    // Flag routes without OpenAPI operations (error - code exists but API spec is missing)
    for (const route of result.unmatchedRoutes) {
      findings.push({
        id: generateId('route-no-openapi', index++),
        severity: 'error',
        type: 'route-missing-openapi',
        entityId: route.id,
        entityType: 'route',
        problem: `Route ${route.method} ${route.path} has no corresponding OpenAPI operation`,
        expected: `OpenAPI operation for ${route.method} ${route.path}`,
        actual: 'No matching operation found',
        source: route.source,
        suggestions: [
          `Add OpenAPI operation for ${route.method} ${route.path}`,
          'Or remove the route if it should not be part of the API',
        ],
        relatedEntities: route.schemas.map((s) => s.id),
      });
    }

    // Flag OpenAPI operations without routes (warning - spec exists but code is missing)
    for (const op of result.unmatchedOperations) {
      findings.push({
        id: generateId('openapi-no-route', index++),
        severity: 'warning',
        type: 'openapi-missing-route',
        entityId: op.id,
        entityType: 'openapi-operation',
        problem: `OpenAPI operation ${op.method} ${op.path} has no corresponding route in code`,
        expected: `Route handler for ${op.method} ${op.path}`,
        actual: 'No matching route found',
        source: op.source,
        suggestions: [
          'Implement the route handler',
          'Or remove the OpenAPI operation if not implemented',
        ],
      });
    }

    return findings;
  },
};

/**
 * Get a summary of the route/openapi coverage
 */
export function getRouteOpenAPISummary(manifest: PeriaManifest): {
  routesTotal: number;
  routesWithOpenAPI: number;
  openapiOpsTotal: number;
  openapiOpsWithRoute: number;
} {
  const routesWithOpenAPI = manifest.routes.filter((r) => r.openapiOp !== undefined).length;
  const openapiOpsWithRoute = manifest.openapiOps.filter((op) =>
    manifest.routes.some((r) => r.openapiOp?.id === op.id)
  ).length;

  return {
    routesTotal: manifest.routes.length,
    routesWithOpenAPI,
    openapiOpsTotal: manifest.openapiOps.length,
    openapiOpsWithRoute,
  };
}
