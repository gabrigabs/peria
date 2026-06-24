/**
 * OpenAPI parser for Peria
 *
 * Uses @apidevtools/swagger-parser to parse and validate OpenAPI specs
 * and extract structured data about endpoints, schemas, and operations.
 */

import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import SwaggerParser from '@apidevtools/swagger-parser';
import type {
  HttpMethod,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
} from '../types/graph.js';
import type { OpenAPISource } from '../types/source.js';

// HTTP methods supported by OpenAPI
const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

// Schema reference pattern
const REF_PATTERN = /#\/components\/([^/]+)\/([^/]+)/;

/**
 * Parse an OpenAPI specification file
 */
export async function parseOpenAPI(filePath: string): Promise<OpenAPISource> {
  const content = await readFile(filePath, 'utf-8');
  const ext = extname(filePath).toLowerCase();

  // Determine format
  let format: 'json' | 'yaml';
  if (ext === '.json') {
    format = 'json';
  } else if (ext === '.yaml' || ext === '.yml') {
    format = 'yaml';
  } else {
    // Try to auto-detect
    try {
      JSON.parse(content);
      format = 'json';
    } catch {
      format = 'yaml';
    }
  }

  // Parse and validate with swagger-parser
  const spec = (await SwaggerParser.parse(filePath)) as Record<string, unknown>;

  // Extract version
  const specWithVersion = spec as { openapi?: string; swagger?: string };
  const version = specWithVersion.openapi || specWithVersion.swagger;

  // Extract endpoints
  const endpoints = extractEndpoints(spec);

  // Extract metadata
  const paths = Object.keys(spec.paths || {});
  const schemas = Object.keys((spec.components as Record<string, unknown>)?.schemas || {});
  const securitySchemes = Object.keys(
    (spec.components as Record<string, unknown>)?.securitySchemes || {}
  );

  const info = (spec.info as { title?: string; description?: string; version?: string }) || {};

  return {
    id: generateId(filePath),
    type: 'openapi',
    path: filePath,
    content,
    version,
    endpoints,
    metadata: {
      paths,
      schemas,
      securitySchemes,
      format,
      title: info.title,
      description: info.description,
      version: info.version,
    },
  };
}

/**
 * Extract all endpoints from an OpenAPI spec
 */
function extractEndpoints(spec: Record<string, unknown>): OpenAPISource['endpoints'] {
  const endpoints: OpenAPISource['endpoints'] = [];
  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;

  if (!paths) return endpoints;

  for (const [path, methods] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!HTTP_METHODS.includes(method.toUpperCase() as HttpMethod)) continue;

      const op = operation as Record<string, unknown>;

      endpoints.push({
        method: method.toUpperCase() as HttpMethod,
        path,
        operationId: op.operationId as string | undefined,
        summary: op.summary as string | undefined,
        description: op.description as string | undefined,
        tags: (op.tags as string[]) || [],
      });
    }
  }

  return endpoints;
}

/**
 * Parse OpenAPI spec and extract detailed operation data
 */
export async function parseOpenAPIDetailed(filePath: string): Promise<{
  spec: Record<string, unknown>;
  operations: OpenAPIOperation[];
  schemas: SchemaInfo[];
  source: { file: string };
  confidence: 'high';
}> {
  const spec = (await SwaggerParser.parse(filePath)) as Record<string, unknown>;
  const operations: OpenAPIOperation[] = [];
  const schemas: SchemaInfo[] = [];

  const paths = spec.paths as Record<string, Record<string, unknown>> | undefined;
  const components = spec.components as Record<string, Record<string, unknown>> | undefined;

  // Extract schemas
  const schemaComponents = components?.schemas as
    | Record<string, Record<string, unknown>>
    | undefined;
  if (schemaComponents) {
    for (const [name, schema] of Object.entries(schemaComponents)) {
      schemas.push({
        name,
        type: getSchemaType(schema),
        properties: extractSchemaProperties(schema),
        required: (schema.required as string[]) || [],
        description: schema.description as string | undefined,
      });
    }
  }

  // Extract operations
  if (paths) {
    for (const [path, pathMethods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathMethods)) {
        if (!HTTP_METHODS.includes(method.toUpperCase() as HttpMethod)) continue;

        const op = operation as Record<string, unknown>;
        const opMethod = method.toUpperCase() as HttpMethod;

        // Extract parameters
        const parameters = extractParameters(op.parameters as unknown[] | undefined, spec);

        // Extract request body
        const requestBody = extractRequestBody(
          op.requestBody as Record<string, unknown> | undefined,
          spec
        );

        // Extract responses
        const responses = extractResponses(
          op.responses as Record<string, unknown> | undefined,
          spec
        );

        // Extract security
        const security = extractSecurity(
          op.security as unknown[] | undefined,
          components?.securitySchemes as Record<string, unknown>
        );

        operations.push({
          id: `op:${op.operationId || `${method}-${path}`}`,
          path,
          method: opMethod,
          operationId: op.operationId as string | undefined,
          summary: op.summary as string | undefined,
          description: op.description as string | undefined,
          tags: (op.tags as string[]) || [],
          parameters,
          requestBody,
          responses,
          security,
          deprecated: op.deprecated as boolean | undefined,
          source: { file: filePath },
          confidence: 'high',
        });
      }
    }
  }

  return {
    spec,
    operations,
    schemas,
    source: { file: filePath },
    confidence: 'high',
  };
}

interface SchemaInfo {
  name: string;
  type?: string;
  properties?: SchemaPropertyInfo[];
  required: string[];
  description?: string;
}

interface SchemaPropertyInfo {
  name: string;
  type?: string;
  format?: string;
  description?: string;
  required?: boolean;
  nullable?: boolean;
  ref?: string;
}

/**
 * Get the type of a schema
 */
function getSchemaType(schema: Record<string, unknown>): string | undefined {
  if (schema.type) return schema.type as string;
  if (schema.properties) return 'object';
  if (schema.items) return 'array';
  if (schema.enum) return 'enum';
  if (schema.allOf || schema.oneOf || schema.anyOf) return 'composite';
  return undefined;
}

/**
 * Extract properties from a schema
 */
function extractSchemaProperties(schema: Record<string, unknown>): SchemaPropertyInfo[] {
  if (!schema.properties) return [];

  const properties: SchemaPropertyInfo[] = [];
  const props = schema.properties as Record<string, Record<string, unknown>>;
  const required = (schema.required as string[]) || [];

  for (const [name, prop] of Object.entries(props)) {
    const propRecord = prop as Record<string, unknown>;
    const ref = (propRecord.$ref as string) || undefined;

    properties.push({
      name,
      type: propRecord.type as string | undefined,
      format: propRecord.format as string | undefined,
      description: propRecord.description as string | undefined,
      required: required.includes(name),
      nullable: propRecord.nullable as boolean | undefined,
      ref,
    });
  }

  return properties;
}

/**
 * Extract parameters from an operation
 */
function extractParameters(
  parameters: unknown[] | undefined,
  spec: Record<string, unknown>
): OpenAPIParameter[] {
  if (!parameters) return [];

  const params: OpenAPIParameter[] = [];

  for (const param of parameters) {
    const p = param as Record<string, unknown>;
    const schemaRef = p.schema as Record<string, unknown>;
    const resolvedSchema = resolveRef((p.schema as { $ref?: string })?.$ref, spec);

    params.push({
      name: p.name as string,
      in: p.in as 'path' | 'query' | 'header' | 'cookie',
      required: p.required as boolean | undefined,
      type: (resolvedSchema?.type || schemaRef?.type) as string | undefined,
      schema: (resolvedSchema?.type || schemaRef?.type) as string | undefined,
      description: p.description as string | undefined,
    });
  }

  return params;
}

/**
 * Extract request body from an operation
 */
function extractRequestBody(
  requestBody: Record<string, unknown> | undefined,
  _spec: Record<string, unknown>
): OpenAPIRequestBody | undefined {
  if (!requestBody) return undefined;

  const content = requestBody.content as Record<string, unknown>;
  const jsonContent = (content?.['application/json'] || content?.['application/ld+json']) as Record<
    string,
    unknown
  >;
  const schemaRef = jsonContent?.schema as Record<string, unknown>;

  return {
    description: requestBody.description as string | undefined,
    required: requestBody.required as boolean | undefined,
    contentType: Object.keys(content || {})[0],
    schema: getSchemaName(schemaRef?.$ref as string),
  };
}

/**
 * Extract responses from an operation
 */
function extractResponses(
  responses: Record<string, unknown> | undefined,
  _spec: Record<string, unknown>
): OpenAPIResponse[] {
  if (!responses) return [];

  const result: OpenAPIResponse[] = [];

  for (const [statusCode, response] of Object.entries(responses)) {
    const resp = response as Record<string, unknown>;
    const content = resp.content as Record<string, unknown>;
    const jsonContent = (content?.['application/json'] ||
      content?.['application/ld+json']) as Record<string, unknown>;
    const schemaRef = jsonContent?.schema as Record<string, unknown>;

    result.push({
      statusCode: statusCode === 'default' ? 0 : parseInt(statusCode, 10),
      description: resp.description as string | undefined,
      schema: getSchemaName(schemaRef?.$ref as string),
      contentType: Object.keys(content || {})[0],
    });
  }

  return result;
}

/**
 * Extract security requirements
 */
function extractSecurity(
  security: unknown[] | undefined,
  securitySchemes: Record<string, unknown> | undefined
): string[] {
  if (!security) return [];

  const result: string[] = [];

  for (const item of security) {
    const sec = item as Record<string, unknown>;
    for (const name of Object.keys(sec)) {
      if (securitySchemes?.[name]) {
        result.push(name);
      }
    }
  }

  return result;
}

/**
 * Resolve a $ref to get the actual schema
 */
function resolveRef(
  ref: string | undefined,
  spec: Record<string, unknown>
): Record<string, unknown> | undefined {
  if (!ref) return undefined;

  const match = ref.match(REF_PATTERN);
  if (!match) return undefined;

  const [, component, name] = match;
  const components = spec.components as
    | Record<string, Record<string, Record<string, unknown>>>
    | undefined;

  return components?.[component]?.[name];
}

/**
 * Get schema name from a $ref
 */
function getSchemaName(ref: string | undefined): string | undefined {
  if (!ref) return undefined;

  const match = ref.match(REF_PATTERN);
  if (!match) return undefined;

  return match[2];
}

/**
 * Generate unique ID from file path
 */
function generateId(filePath: string): string {
  const normalized = filePath.replace(/^\.\//, '').replace(/\//g, '-');
  return `openapi:${normalized}`;
}
