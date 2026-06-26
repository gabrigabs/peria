/**
 * Route Context Generator
 *
 * Generate context for a specific route including handler, OpenAPI, and schemas.
 */

import type { RouteContextPack, ContextPackOptions } from './types.js';
import type { RouteEntity, OpenAPIOperation } from '../types/graph.js';
import { generateContextPackId } from './types.js';
import { truncateToLines } from './utils.js';

/**
 * Default maximum lines for route context
 */
const DEFAULT_MAX_LINES = 300;

/**
 * Generate context for a specific route
 */
export function generateRouteContext(
  route: RouteEntity,
  options: ContextPackOptions & {
    openapiOp?: OpenAPIOperation;
    description?: string;
  }
): RouteContextPack {
  const maxLines = options.maxSize ?? DEFAULT_MAX_LINES;
  const content = buildRouteContextContent(route, options);
  const truncatedContent = truncateToLines(content, maxLines);

  return {
    id: generateContextPackId('route', route.id),
    variant: 'route',
    title: `${route.method} ${route.path}`,
    description: `Context for route ${route.method} ${route.path}`,
    generatedAt: new Date().toISOString(),
    content: truncatedContent,
    sourceFiles: [route.source],
    relatedEntities: [route.id],
    confidence: route.confidence,
    routeId: route.id,
    method: route.method,
    path: route.path,
  };
}

/**
 * Build the content string for a route context
 */
function buildRouteContextContent(
  route: RouteEntity,
  options: {
    openapiOp?: OpenAPIOperation;
    description?: string;
  }
): string {
  const lines: string[] = [];

  // Header
  lines.push(`# Route Context: ${route.method} ${route.path}`);
  lines.push('');
  lines.push(`**Confidence:** ${route.confidence}`);
  lines.push(`**Source:** ${route.source.file}:${route.source.line ?? 1}`);
  lines.push('');

  // Route Definition
  lines.push('## Route Definition');
  lines.push('');
  lines.push('```typescript');
  lines.push(`// ${route.method} ${route.path}`);
  lines.push('```');
  lines.push('');

  // OpenAPI Operation
  if (options.openapiOp) {
    lines.push('## OpenAPI Documentation');
    lines.push('');
    if (options.openapiOp.summary) {
      lines.push(`**Summary:** ${options.openapiOp.summary}`);
    }
    if (options.openapiOp.description) {
      lines.push(`**Description:** ${options.openapiOp.description}`);
    }
    lines.push('');

    // Parameters
    if (options.openapiOp.parameters && options.openapiOp.parameters.length > 0) {
      lines.push('### Parameters');
      lines.push('');
      lines.push('| Name | Location | Required |');
      lines.push('|------|----------|----------|');
      for (const param of options.openapiOp.parameters) {
        lines.push(
          `| ${param.name} | ${param.in} | ${param.required ? 'Yes' : 'No'} |`
        );
      }
      lines.push('');
    }

    // Responses
    if (options.openapiOp.responses && options.openapiOp.responses.length > 0) {
      lines.push('### Responses');
      lines.push('');
      for (const response of options.openapiOp.responses) {
        lines.push(`**${response.statusCode}** ${response.description ?? ''}`);
        lines.push('');
      }
    }

    lines.push(`**Source:** ${options.openapiOp.source.file}:${options.openapiOp.source.line}`);
    lines.push('');
  }

  // Agent Instructions
  lines.push('## Agent Instructions');
  lines.push('');
  lines.push('Before editing this route:');
  lines.push('');
  if (options.openapiOp) {
    lines.push('1. Update the OpenAPI operation if changing the route signature');
  }
  lines.push('2. Run `peria check` after changes to verify drift');
  lines.push('3. Update documentation if needed');
  lines.push('');

  return lines.join('\n');
}
