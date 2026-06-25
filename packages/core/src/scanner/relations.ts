/**
 * Relations Scanner - Creates relations between entities
 */

import type {
  DocPageEntity,
  GraphRelation,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
} from '../types/graph.js';

export interface RelationsInput {
  routes: RouteEntity[];
  schemas: SchemaEntity[];
  openapiOps: OpenAPIOperation[];
  docsPages: DocPageEntity[];
  packages: PackageEntity[];
  sourceFiles: SourceFile[];
}

/**
 * Create relations between entities
 */
export function createRelations(input: RelationsInput): GraphRelation[] {
  const relations: GraphRelation[] = [];
  let relationId = 0;

  // Link schemas to OpenAPI operations
  for (const schema of input.schemas) {
    for (const op of input.openapiOps) {
      // Request schema -> operation
      if (op.requestBody?.schema === schema.name) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: schema.id,
          targetId: op.id,
          type: 'schema_referenced_by_openapi',
          confidence: 'high',
          reason: `Schema ${schema.name} is used in request body of ${op.method} ${op.path}`,
        });
      }

      // Response schema -> operation
      for (const response of op.responses || []) {
        if (response.schema === schema.name) {
          relations.push({
            id: `rel:${relationId++}`,
            sourceId: schema.id,
            targetId: op.id,
            type: 'schema_referenced_by_openapi',
            confidence: 'high',
            reason: `Schema ${schema.name} is used in response ${response.statusCode} of ${op.method} ${op.path}`,
          });
        }
      }
    }
  }

  // Link docs to routes (via route mentions)
  for (const doc of input.docsPages) {
    for (const mention of doc.routeMentions) {
      relations.push({
        id: `rel:${relationId++}`,
        sourceId: doc.id,
        targetId: `route:${mention.method || 'ANY'}:${mention.path}`,
        type: 'doc_page_references_route',
        confidence: 'medium',
        reason: `Doc page mentions ${mention.method || ''} ${mention.path}`,
      });
    }
  }

  // Link packages to modules
  for (const pkg of input.packages) {
    for (const file of input.sourceFiles) {
      if (file.path.startsWith(pkg.directory)) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: pkg.id,
          targetId: file.id,
          type: 'package_exports_module',
          confidence: 'high',
          reason: `File ${file.path} belongs to package ${pkg.name}`,
        });
      }
    }
  }

  // Link routes to handlers (from framework adapter extraction)
  for (const route of input.routes) {
    if (route.handler) {
      relations.push({
        id: `rel:${relationId++}`,
        sourceId: route.id,
        targetId: route.handler.id,
        type: 'route_implemented_by_handler',
        confidence: route.confidence,
        reason: `Route ${route.method} ${route.path} is implemented by ${route.handler.className}.${route.handler.name}`,
        evidence: [{ file: route.source.file, line: route.source.line }],
      });

      // Link schemas used by handler
      for (const schema of route.schemas) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: route.handler.id,
          targetId: schema.id,
          type: 'handler_uses_schema',
          confidence: route.confidence,
          reason: `Handler ${route.handler.name} uses schema ${schema.name}`,
        });
      }
    }
  }

  // Link routes to OpenAPI operations (when path and method match)
  for (const route of input.routes) {
    for (const op of input.openapiOps) {
      if (route.path === op.path && route.method === op.method) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: route.id,
          targetId: op.id,
          type: 'route_described_by_openapi',
          confidence: 'high',
          reason: `Route ${route.method} ${route.path} matches OpenAPI operation ${op.operationId || op.id}`,
        });
      }
    }
  }

  return relations;
}
