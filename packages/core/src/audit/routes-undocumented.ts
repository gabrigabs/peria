/**
 * Routes Undocumented Audit Check
 *
 * Checks:
 * - Routes without any documentation (warning)
 * - Skips health-check patterns (/health, /ready, /live, /status)
 */

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
 * Health check path patterns to skip
 */
const HEALTH_CHECK_PATTERNS = [
  /^\/health$/i,
  /^\/health\//i,
  /^\/ready$/i,
  /^\/ready\//i,
  /^\/live$/i,
  /^\/live\//i,
  /^\/status$/i,
  /^\/status\//i,
  /^\/ping$/i,
  /^\/ping\//i,
];

/**
 * Check if a path is a health check pattern
 */
function isHealthCheck(path: string): boolean {
  return HEALTH_CHECK_PATTERNS.some((pattern) => pattern.test(path));
}

/**
 * Routes undocumented audit check
 */
export const runRoutesUndocumentedCheck: AuditCheck = {
  name: 'routes-undocumented',
  description: 'Check for routes without documentation',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Build set of documented route keys from docs pages
    const documentedRoutes = new Set<string>();
    for (const page of manifest.docsPages ?? []) {
      for (const mention of page.routeMentions ?? []) {
        const key = `${mention.method ?? ''}:${mention.path}`.toLowerCase();
        documentedRoutes.add(key);
      }
    }

    // Check each route for documentation
    for (const route of manifest.routes ?? []) {
      // Skip health check patterns
      if (isHealthCheck(route.path)) {
        continue;
      }

      // Skip non-trivial routes (HEAD/OPTIONS on root paths are usually framework defaults)
      if (
        (route.method === 'HEAD' || route.method === 'OPTIONS') &&
        route.path.match(/^\/?$/)
      ) {
        continue;
      }

      const routeKey = `${route.method}:${route.path}`.toLowerCase();
      if (!documentedRoutes.has(routeKey)) {
        findings.push({
          id: generateId('route-undocumented', index++),
          severity: 'warning',
          type: 'route-undocumented',
          entityId: route.id,
          entityType: 'route',
          problem: `Route ${route.method} ${route.path} is not documented in any doc page`,
          expected: 'At least one doc page should document this route',
          actual: 'No documentation found for this route',
          source: route.source,
          suggestions: [
            `Add documentation for ${route.method} ${route.path}`,
            'Create a doc page or update existing docs to mention this route',
          ],
          relatedEntities: route.schemas.map((s) => s.id),
        });
      }
    }

    return findings;
  },
};
