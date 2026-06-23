/**
 * Graph entity types for Peria knowledge graph
 *
 * Phase 1 focuses on establishing the core entity types for routes, handlers,
 * schemas, OpenAPI operations, docs, and the relations between them.
 */

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'

// Confidence levels for extraction reliability
export type Confidence = 'high' | 'medium' | 'low'

// How an entity was extracted
export type ExtractionMethod = 'ast' | 'openapi' | 'markdown' | 'git' | 'heuristic' | 'llm' | 'manual'

// Relation types between graph entities
export type RelationType =
  | 'route_implemented_by_handler'
  | 'route_documented_by_doc_page'
  | 'route_described_by_openapi'
  | 'handler_uses_schema'
  | 'schema_described_by_openapi'
  | 'doc_page_references_route'
  | 'doc_page_references_schema'
  | 'doc_page_references_source'
  | 'schema_referenced_by_openapi'
  | 'package_exports_module'

// Source reference for provenance
export interface SourceRef {
  file: string
  line?: number
  column?: number
  commit?: string
  url?: string
}

// Heading extracted from markdown
export interface Heading {
  level: number
  text: string
  anchor: string
}

// Route mention in markdown
export interface RouteMention {
  path: string
  method?: HttpMethod
  context?: string
}

// Schema reference detected in code or docs
export interface SchemaReference {
  name: string
  type?: 'interface' | 'type' | 'class' | 'enum'
  location?: SourceRef
}

// OpenAPI parameter
export interface OpenAPIParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required?: boolean
  type?: string
  schema?: string
  description?: string
}

// OpenAPI request body
export interface OpenAPIRequestBody {
  description?: string
  required?: boolean
  contentType?: string
  schema?: string
}

// OpenAPI response
export interface OpenAPIResponse {
  statusCode: number
  description?: string
  schema?: string
  contentType?: string
}

// Handler entity - represents a function/method that handles a route
export interface HandlerEntity {
  id: string
  name: string
  file: string
  line: number
  column?: number
  module?: string
  className?: string
  methodName?: string
  decorators?: string[]
}

// Schema entity - represents a data structure (DTO, interface, type, etc.)
export interface SchemaEntity {
  id: string
  name: string
  type: 'request' | 'response' | 'both' | 'parameter' | 'body' | 'header'
  file?: string
  line?: number
  openapiRef?: string
  properties?: SchemaProperty[]
  required?: string[]
  enum?: unknown[]
  description?: string
}

// Schema property
export interface SchemaProperty {
  name: string
  type?: string
  format?: string
  description?: string
  required?: boolean
  nullable?: boolean
  default?: unknown
}

// OpenAPI operation entity
export interface OpenAPIOperation {
  id: string
  path: string
  method: HttpMethod
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: OpenAPIRequestBody
  responses?: OpenAPIResponse[]
  security?: string[]
  deprecated?: boolean
  source: SourceRef
  confidence: Confidence
}

// Route entity - represents an API endpoint
export interface RouteEntity {
  id: string
  path: string
  method: HttpMethod
  handler?: HandlerEntity
  openapiOp?: OpenAPIOperation
  schemas: SchemaEntity[]
  middleware?: string[]
  guards?: string[]
  source: SourceRef
  confidence: Confidence
  extractionMethod: ExtractionMethod
}

// Doc page entity
export interface DocPageEntity {
  id: string
  title: string
  path: string
  description?: string
  headings: Heading[]
  routeMentions: RouteMention[]
  schemaRefs: SchemaReference[]
  sourceRefs: SourceRef[]
  frontmatter?: Record<string, unknown>
  content: string
  source: SourceRef
  confidence: Confidence
}

// Agent context file (llms.txt, AGENTS.md, CLAUDE.md, etc.)
export interface AgentContextFile {
  id: string
  path: string
  variant?: 'full' | 'summary' | 'agents' | 'claude'
  exists: boolean
  title?: string
  description?: string
  headings?: Heading[]
  routeCount?: number
  sourcePaths?: string[]
}

// Package entity
export interface PackageEntity {
  id: string
  name: string
  version?: string
  directory: string
  manifestPath: string
  description?: string
  scripts?: Record<string, string>
  dependencies?: string[]
  devDependencies?: string[]
  exports?: string[]
  types?: string
  source: SourceRef
  confidence: Confidence
}

// Source file entity
export interface SourceFile {
  id: string
  path: string
  package?: string
  module?: string
  size?: number
  exports?: ExportSummary[]
  imports?: string[]
  hasDecorators?: boolean
  source: SourceRef
  confidence: Confidence
}

// Export summary
export interface ExportSummary {
  name: string
  kind: 'class' | 'function' | 'interface' | 'type' | 'variable' | 'enum' | 'other'
  line: number
}

// Git change
export interface GitChange {
  id: string
  path: string
  type: 'added' | 'modified' | 'deleted' | 'renamed'
  status: string
  insertions?: number
  deletions?: number
  commit?: string
  author?: string
  date?: string
  subject?: string
}

// Graph relation between entities
export interface GraphRelation {
  id: string
  sourceId: string
  targetId: string
  type: RelationType
  confidence: Confidence
  reason: string
  evidence?: SourceRef[]
  createdAt?: string
}

// Drift finding
export interface DriftFinding {
  id: string
  severity: 'error' | 'warning' | 'info'
  type: string
  entityId?: string
  entityType?: string
  problem: string
  expected?: string
  actual?: string
  source: SourceRef
  suggestions: string[]
  relatedEntities?: string[]
}

// Framework detection result
export interface FrameworkDetection {
  name: 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'
  confidence: Confidence
  evidence: string[]
  entrypoints?: string[]
}
