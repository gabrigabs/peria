/**
 * Framework Adapter Types
 *
 * Defines the contract for framework-specific adapters that extract
 * routes, schemas, modules, and other entities from framework code.
 */

import type { RouteEntity, SchemaEntity, Confidence } from '../types/graph.js'
import type { ResolvedPeriaConfig } from '../types/config.js'

/**
 * Context passed to adapters for extraction
 */
export interface RepoContext {
  /** Current working directory */
  cwd: string
  /** Resolved Peria configuration */
  config: ResolvedPeriaConfig
}

/**
 * Framework detection result
 */
export interface FrameworkDetectionResult {
  /** Detected framework name */
  framework: 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'
  /** Detection confidence level */
  confidence: Confidence
  /** Evidence for the detection */
  reasons: string[]
  /** Suggested entry points for the framework */
  suggestedEntrypoints: string[]
}

/**
 * Module entity (for framework module systems)
 */
export interface ModuleEntity {
  id: string
  name: string
  file: string
  line: number
  imports?: string[]
  declarations?: string[]
  exports?: string[]
  providers?: string[]
  controllers?: string[]
}

/**
 * Entrypoint entity
 */
export interface EntrypointEntity {
  id: string
  file: string
  line: number
  bootstrap?: string
  framework?: string
}

/**
 * Framework adapter interface
 *
 * Adapters extract structured data from specific frameworks
 * using AST analysis and framework-specific conventions.
 */
export interface FrameworkAdapter {
  /** Adapter name */
  name: string

  /** Detect if this framework is present in the repository */
  detect(context: RepoContext): Promise<FrameworkDetectionResult>

  /** Extract all routes from the codebase */
  extractRoutes(context: RepoContext): Promise<RouteEntity[]>

  /** Extract schemas (DTOs, entities, etc.) - optional */
  extractSchemas?(context: RepoContext): Promise<SchemaEntity[]>

  /** Extract module structure - optional */
  extractModules?(context: RepoContext): Promise<ModuleEntity[]>

  /** Extract entrypoints (main.ts, etc.) - optional */
  extractEntrypoints?(context: RepoContext): Promise<EntrypointEntity[]>
}
