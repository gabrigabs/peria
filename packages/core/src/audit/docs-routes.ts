/**
 * Docs vs Routes Audit Check
 *
 * Compares documentation mentions against actual routes.
 * Flags:
 * - Routes without documentation (info)
 * - Docs referencing non-existent routes (warning)
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

function routeKey(method: string | undefined, path: string): string {
  return `${method || 'GET'}:${normalizePath(path)}`.toLowerCase();
}

function normalizePath(path: string): string {
  return path.replace(/\{([^}]+)\}/g, ':$1').replace(/[`'",.;:]+$/g, '');
}

/**
 * Docs vs Routes audit check
 */
export const runDocsRoutesCheck: AuditCheck = {
  name: 'docs-routes',
  description: 'Compare documentation references against actual routes',
  defaultSeverity: 'info' as AuditSeverity,

  async run(manifest: PeriaManifest): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    if (!manifest.routes.length) {
      return findings;
    }

    // Build a set of valid route IDs
    const routeIds = new Set(manifest.routes.map((r) => routeKey(r.method, r.path)));

    // Build a set of documented routes
    const documentedRoutes = new Set<string>();

    // Check doc pages for route mentions
    for (const docPage of manifest.docsPages) {
      for (const mention of docPage.routeMentions) {
        const key = routeKey(mention.method, mention.path);
        documentedRoutes.add(key);

        // Skip if the path looks like a file path or CLI command (not an API route)
        const path = mention.path.toLowerCase();
        const isLikelyFilePath =
          path.includes('/utils/') ||
          path.includes('/prompts/') ||
          path.includes('/generators/') ||
          path.includes('/commands/') ||
          path.includes('/modules/') ||
          path.startsWith('/docs') ||
          path.includes('.md') ||
          path.includes('.ts') ||
          path.includes('.js');

        if (isLikelyFilePath) {
          // These are likely references to code modules, not API routes
          continue;
        }

        // Check if the mentioned route exists
        if (!routeIds.has(key)) {
          findings.push({
            id: generateId('doc-invalid-route', index++),
            severity: 'warning',
            type: 'doc-references-nonexistent-route',
            entityId: docPage.id,
            entityType: 'doc-page',
            problem: `Docs page "${docPage.title}" references non-existent route ${mention.method || 'GET'} ${mention.path}`,
            expected: 'Route should exist in codebase',
            actual: 'Route not found',
            source: docPage.source,
            suggestions: [
              'Update the documentation to reference the correct route',
              'Or implement the route if it should exist',
            ],
            relatedEntities: [docPage.id],
          });
        }
      }
    }

    // Check routes without documentation (only report if we have docs)
    if (manifest.docsPages.length > 0) {
      for (const route of manifest.routes) {
        const key = routeKey(route.method, route.path);
        if (!documentedRoutes.has(key)) {
          findings.push({
            id: generateId('route-no-docs', index++),
            severity: 'info',
            type: 'route-missing-documentation',
            entityId: route.id,
            entityType: 'route',
            problem: `Route ${route.method} ${route.path} is not documented`,
            expected: 'Documentation should exist for this route',
            actual: 'No documentation found',
            source: route.source,
            suggestions: [
              'Create or update documentation for this route',
              'Add route mention to existing docs page',
            ],
            relatedEntities: route.schemas.map((s) => s.id),
          });
        }
      }
    }

    return findings;
  },
};

/**
 * Get documentation coverage statistics
 */
export function getDocsCoverage(manifest: PeriaManifest): {
  totalRoutes: number;
  documentedRoutes: number;
  coveragePercent: number;
} {
  const documentedRoutes = new Set<string>();

  for (const docPage of manifest.docsPages) {
    for (const mention of docPage.routeMentions) {
      documentedRoutes.add(routeKey(mention.method, mention.path));
    }
  }

  const documented = manifest.routes.filter((r) =>
    documentedRoutes.has(routeKey(r.method, r.path))
  ).length;

  return {
    totalRoutes: manifest.routes.length,
    documentedRoutes: documented,
    coveragePercent:
      manifest.routes.length > 0 ? Math.round((documented / manifest.routes.length) * 100) : 100,
  };
}
