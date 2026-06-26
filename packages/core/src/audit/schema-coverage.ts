/**
 * Schema Coverage Audit Check
 *
 * Checks:
 * - Routes referencing schemas that don't exist (error)
 * - Schemas defined but never referenced (info)
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
 * Schema coverage audit check
 */
export const runSchemaCoverageCheck: AuditCheck = {
  name: 'schema-coverage',
  description: 'Check for schema coverage and undefined references',
  defaultSeverity: 'warning' as AuditSeverity,

  async run(manifest: PeriaManifest): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Build set of defined schema IDs
    const definedSchemas = new Set(manifest.schemas?.map((s) => s.id) ?? []);

    // Collect all schema references from routes
    const routeSchemaRefs = new Set<string>();
    for (const route of manifest.routes ?? []) {
      for (const schema of route.schemas ?? []) {
        routeSchemaRefs.add(schema.id);
      }
    }

    // Collect all schema references from OpenAPI operations
    const openapiSchemaRefs = new Set<string>();
    for (const op of manifest.openapiOps ?? []) {
      if (op.requestBody?.schema) {
        openapiSchemaRefs.add(op.requestBody.schema);
      }
      for (const response of op.responses ?? []) {
        if (response.schema) {
          openapiSchemaRefs.add(response.schema);
        }
      }
    }

    // All referenced schemas
    const allReferenced = new Set([...routeSchemaRefs, ...openapiSchemaRefs]);

    // Check 1: Routes referencing undefined schemas (error)
    for (const route of manifest.routes ?? []) {
      for (const schema of route.schemas ?? []) {
        if (schema.id && !definedSchemas.has(schema.id)) {
          findings.push({
            id: generateId('schema-undefined', index++),
            severity: 'error',
            type: 'schema-undefined',
            entityId: route.id,
            entityType: 'route',
            problem: `Route ${route.method} ${route.path} references schema "${schema.id}" which is not defined in the manifest`,
            expected: `Schema "${schema.id}" exists in manifest.schemas`,
            actual: 'Schema not found in manifest.schemas',
            source: route.source,
            suggestions: [
              `Define schema "${schema.id}" in your code or OpenAPI spec`,
              'Or update the route to reference an existing schema',
            ],
            relatedEntities: [schema.id],
          });
        }
      }
    }

    // Check 2: Undefined schema references in OpenAPI (error)
    for (const op of manifest.openapiOps ?? []) {
      if (op.requestBody?.schema && !definedSchemas.has(op.requestBody.schema)) {
        findings.push({
          id: generateId('schema-undefined', index++),
          severity: 'error',
          type: 'schema-undefined',
          entityId: op.id,
          entityType: 'openapi-operation',
          problem: `OpenAPI operation ${op.method} ${op.path} references request schema "${op.requestBody.schema}" which is not defined`,
          expected: `Schema "${op.requestBody.schema}" exists in manifest.schemas`,
          actual: 'Schema not found in manifest.schemas',
          source: op.source,
          suggestions: [
            `Define schema "${op.requestBody.schema}" in your code or OpenAPI spec`,
            'Or remove the schema reference',
          ],
          relatedEntities: [op.requestBody.schema],
        });
      }

      for (const response of op.responses ?? []) {
        if (response.schema && !definedSchemas.has(response.schema)) {
          findings.push({
            id: generateId('schema-undefined', index++),
            severity: 'error',
            type: 'schema-undefined',
            entityId: op.id,
            entityType: 'openapi-operation',
            problem: `OpenAPI operation ${op.method} ${op.path} references response schema "${response.schema}" which is not defined`,
            expected: `Schema "${response.schema}" exists in manifest.schemas`,
            actual: 'Schema not found in manifest.schemas',
            source: op.source,
            suggestions: [
              `Define schema "${response.schema}" in your code or OpenAPI spec`,
              'Or remove the schema reference',
            ],
            relatedEntities: [response.schema],
          });
        }
      }
    }

    // Check 3: Schemas defined but never referenced (info)
    for (const schema of manifest.schemas ?? []) {
      if (!allReferenced.has(schema.id)) {
        findings.push({
          id: generateId('schema-unreferenced', index++),
          severity: 'info',
          type: 'schema-unreferenced',
          entityId: schema.id,
          entityType: 'schema',
          problem: `Schema "${schema.id}" is defined but never referenced by any route or OpenAPI operation`,
          expected: 'Schema should be referenced by at least one route or OpenAPI operation',
          actual: 'Schema has no references',
          source: schema.file ? { file: schema.file, line: schema.line ?? 1 } : { file: 'unknown' },
          suggestions: [
            'Remove the unused schema if it is no longer needed',
            'Or add references to this schema in routes or OpenAPI',
          ],
        });
      }
    }

    return findings;
  },
};
