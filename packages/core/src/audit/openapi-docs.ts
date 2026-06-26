/**
 * OpenAPI vs Docs Audit Check
 *
 * Checks:
 * - OpenAPI operations not documented (warning)
 * - Docs referencing non-existent schemas (warning)
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
 * OpenAPI vs Docs audit check
 */
export const runOpenAPIDocsCheck: AuditCheck = {
  name: 'openapi-docs',
  description: 'Compare OpenAPI operations against documentation',
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

    // Build set of referenced schema names from docs
    const docSchemaRefs = new Set<string>();
    for (const page of manifest.docsPages ?? []) {
      for (const ref of page.schemaRefs ?? []) {
        docSchemaRefs.add(ref.name);
      }
    }

    // Build set of defined schema names
    const definedSchemas = new Set(manifest.schemas?.map((s) => s.id) ?? []);

    // Check 1: OpenAPI operations without documentation (warning)
    for (const op of manifest.openapiOps ?? []) {
      const routeKey = `${op.method}:${op.path}`.toLowerCase();
      if (!documentedRoutes.has(routeKey)) {
        findings.push({
          id: generateId('openapi-not-documented', index++),
          severity: 'warning',
          type: 'openapi-not-documented',
          entityId: op.id,
          entityType: 'openapi-operation',
          problem: `OpenAPI operation ${op.method} ${op.path} is not documented in any doc page`,
          expected: 'At least one doc page should reference this operation',
          actual: 'No documentation found for this operation',
          source: op.source,
          suggestions: [
            `Add documentation for ${op.method} ${op.path}`,
            'Include the route in your docs pages',
          ],
        });
      }
    }

    // Check 2: Docs referencing non-existent schemas (warning)
    for (const page of manifest.docsPages ?? []) {
      for (const ref of page.schemaRefs ?? []) {
        if (!definedSchemas.has(ref.name)) {
          findings.push({
            id: generateId('doc-schema-missing', index++),
            severity: 'warning',
            type: 'doc-schema-missing',
            entityId: page.id,
            entityType: 'doc-page',
            problem: `Doc page "${page.title}" references schema "${ref.name}" which does not exist`,
            expected: `Schema "${ref.name}" should be defined in the manifest`,
            actual: 'Schema not found in manifest.schemas',
            source: page.source,
            suggestions: [
              `Define schema "${ref.name}" in your code`,
              'Or update the doc to reference an existing schema',
            ],
            relatedEntities: [ref.name],
          });
        }
      }
    }

    return findings;
  },
};
