/**
 * SDK shared types
 */

export type Framework = 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'

export interface PeriaConfig {
  framework?: Framework
  entrypoint?: string
  docs?: {
    enabled?: boolean
    route?: string
  }
  sources?: {
    openapi?: string
    markdown?: string[]
    llms?: string[]
  }
  features?: FeatureFlags
}

export interface FeatureFlags {
  embeddedDocs?: boolean
  codeMap?: boolean
  apiReference?: boolean
  wiki?: boolean
  llms?: boolean
  gitDiff?: boolean
  changeMap?: boolean
  driftCheck?: boolean
  patchNotes?: boolean
  github?: boolean
  contextPacks?: boolean
  mermaid?: boolean
}

export interface PeriaOptions {
  config?: PeriaConfig
  docsPath?: string
}

export interface PeriaInstance {
  /**
   * Serve embedded documentation
   */
  serve: () => Promise<void>
  /**
   * Get knowledge graph
   */
  getGraph: () => Promise<unknown>
  /**
   * Search entities
   */
  search: (query: string) => Promise<unknown[]>
}
