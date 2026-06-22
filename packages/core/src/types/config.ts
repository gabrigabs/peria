/**
 * Peria configuration types
 */

export type Framework = 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'

export interface DocsConfig {
  enabled?: boolean
  route?: string
}

export interface SourcesConfig {
  openapi?: string
  markdown?: string[]
  llms?: string[]
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

export interface PeriaConfig {
  framework?: Framework
  entrypoint?: string
  docs?: DocsConfig
  sources?: Partial<SourcesConfig>
  features?: FeatureFlags
}

export const DEFAULT_FEATURES: Required<FeatureFlags> = {
  embeddedDocs: true,
  codeMap: true,
  apiReference: true,
  wiki: true,
  llms: true,
  gitDiff: true,
  changeMap: false,
  driftCheck: true,
  patchNotes: false,
  github: false,
  contextPacks: false,
  mermaid: true,
}

export const DEFAULT_DOCS: Required<DocsConfig> = {
  enabled: true,
  route: '/docs',
}

/**
 * Define configuration with sensible defaults
 */
export function defineConfig(config: PeriaConfig): Required<PeriaConfig> & { features: Required<FeatureFlags>; docs: Required<DocsConfig> } {
  return {
    framework: config.framework ?? 'other',
    entrypoint: config.entrypoint ?? 'src/index.ts',
    docs: { ...DEFAULT_DOCS, ...config.docs },
    sources: { openapi: 'openapi.yaml', markdown: ['README.md', 'docs/**/*.md'], llms: ['llms.txt', 'llms-full.txt'], ...config.sources },
    features: { ...DEFAULT_FEATURES, ...config.features },
  }
}
