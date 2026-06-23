/**
 * Peria Manifest - The portable output of `peria scan`
 *
 * This is the core artifact that represents the knowledge graph of a repository.
 * It's designed to be:
 * - Deterministic (same scan produces same result)
 * - Versioned (breaking changes bump the manifest version)
 * - Stable (consumed by docs UI, CLI, CI, agents, MCP)
 * - Readable (humans can inspect it)
 */

import type {
  Confidence,
  FrameworkDetection,
  GitChange,
  GraphRelation,
  RouteEntity,
  SchemaEntity,
  OpenAPIOperation,
  DocPageEntity,
  SourceFile,
  PackageEntity,
  AgentContextFile,
  DriftFinding,
} from './graph.js'

export const MANIFEST_VERSION = '0.1.0'
export const PERIA_VERSION = '0.1.0'

/**
 * Repository metadata
 */
export interface RepoInfo {
  name: string
  root: string
  commit: string
  branch: string
  isDirty: boolean
}

/**
 * Git metadata for the scan
 */
export interface GitMetadata {
  lastCommit: string
  shortCommit: string
  branch: string
  isDirty: boolean
  changedFiles: string[]
  recentChanges: Pick<GitChange, 'id' | 'path' | 'type' | 'commit' | 'author' | 'date' | 'subject'>[]
}

/**
 * Framework metadata
 */
export interface FrameworkMetadata {
  name: 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'
  confidence: Confidence
  entrypoint?: string
  evidence: string[]
}

/**
 * OpenAPI metadata
 */
export interface OpenAPIMetadata {
  path: string
  version?: string
  title?: string
  description?: string
  paths: string[]
  schemas: string[]
  operationsCount: number
  confidence: Confidence
}

/**
 * Markdown documentation metadata
 */
export interface DocsMetadata {
  paths: string[]
  pagesCount: number
  totalHeadings: number
  totalRouteMentions: number
  totalSchemaRefs: number
}

/**
 * llms.txt metadata
 */
export interface LlmsMetadata {
  path: string
  variant: 'full' | 'summary'
  pageCount: number
  exists: boolean
}

/**
 * Scan statistics
 */
export interface ScanStats {
  startTime: string
  endTime: string
  durationMs: number
  filesScanned: number
  packagesScanned: number
}

/**
 * The main Peria manifest - the portable output of `peria scan`
 */
export interface PeriaManifest {
  manifestVersion: string
  periaVersion: string
  generatedAt: string

  repo: RepoInfo
  framework?: FrameworkMetadata
  openapi?: OpenAPIMetadata
  docs?: DocsMetadata
  llms?: LlmsMetadata

  // Core entities
  routes: RouteEntity[]
  schemas: SchemaEntity[]
  openapiOps: OpenAPIOperation[]
  docsPages: DocPageEntity[]
  sourceFiles: SourceFile[]
  packages: PackageEntity[]
  agentContext: AgentContextFile[]

  // Relations between entities
  relations: GraphRelation[]

  // Git changes detected
  git: GitMetadata

  // Drift findings from the last scan
  drift: DriftFinding[]

  // Statistics
  stats: ScanStats
}

/**
 * Result of running `peria scan`
 */
export interface ScanResult {
  manifest: PeriaManifest
  warnings: ScanWarning[]
}

/**
 * Warning during scan (non-fatal issues)
 */
export interface ScanWarning {
  code: string
  message: string
  file?: string
  suggestion?: string
}

/**
 * Scan options
 */
export interface ScanOptions {
  cwd: string
  config?: {
    sources?: {
      openapi?: string
      markdown?: string[]
      llms?: string[]
      context?: string[]
    }
    features?: {
      embeddedDocs?: boolean
      apiReference?: boolean
      contextPacks?: boolean
    }
  }
  framework?: FrameworkDetection
  gitCommit?: string
  includeContent?: boolean
}

/**
 * Serialized manifest (for .peria/manifest.json)
 */
export type SerializedManifest = PeriaManifest

/**
 * Compact manifest for quick inspection
 */
export interface CompactManifest {
  manifestVersion: string
  periaVersion: string
  generatedAt: string
  repo: Pick<RepoInfo, 'name' | 'branch' | 'commit'>
  routesCount: number
  schemasCount: number
  docsPagesCount: number
  openapiOpsCount: number
  relationsCount: number
  driftCount: number
  isDirty: boolean
}

/**
 * Helper to create a compact manifest from full manifest
 */
export function toCompactManifest(manifest: PeriaManifest): CompactManifest {
  return {
    manifestVersion: manifest.manifestVersion,
    periaVersion: manifest.periaVersion,
    generatedAt: manifest.generatedAt,
    repo: {
      name: manifest.repo.name,
      branch: manifest.repo.branch,
      commit: manifest.repo.commit,
    },
    routesCount: manifest.routes.length,
    schemasCount: manifest.schemas.length,
    docsPagesCount: manifest.docsPages.length,
    openapiOpsCount: manifest.openapiOps.length,
    relationsCount: manifest.relations.length,
    driftCount: manifest.drift.length,
    isDirty: manifest.repo.isDirty,
  }
}

/**
 * Helper to validate manifest structure
 */
export function isValidManifest(obj: unknown): obj is PeriaManifest {
  if (!obj || typeof obj !== 'object') return false
  const manifest = obj as Record<string, unknown>

  return (
    typeof manifest.manifestVersion === 'string' &&
    typeof manifest.periaVersion === 'string' &&
    typeof manifest.generatedAt === 'string' &&
    typeof manifest.repo === 'object' &&
    Array.isArray(manifest.routes) &&
    Array.isArray(manifest.schemas) &&
    Array.isArray(manifest.openapiOps) &&
    Array.isArray(manifest.docsPages) &&
    Array.isArray(manifest.relations) &&
    Array.isArray(manifest.drift) &&
    typeof manifest.stats === 'object'
  )
}
