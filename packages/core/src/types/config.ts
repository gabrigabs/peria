/**
 * Peria configuration types
 */

export type Framework = 'nestjs' | 'express' | 'fastify' | 'hono' | 'elysia' | 'other'

export interface DocsConfig {
  enabled?: boolean
  route?: string
  outputDir?: string
}

export interface SourcesConfig {
  openapi?: string
  markdown?: string[]
  llms?: string[]
  context?: string[]
}

export interface PackageContext {
  role?: string
  audience?: string
  responsibilities?: string[]
  notes?: string[]
}

export interface ProjectProfile {
  name?: string
  tagline?: string
  description?: string
  audience?: string
  tone?: string
  problem?: string
  currentFocus?: string
  highlights?: string[]
  packageContexts?: Record<string, PackageContext>
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
  project?: ProjectProfile
  docs?: DocsConfig
  sources?: Partial<SourcesConfig>
  features?: FeatureFlags
}

export interface ResolvedPeriaConfig {
  framework: Framework
  entrypoint: string
  project: Required<ProjectProfile> & { packageContexts: Record<string, PackageContext> }
  docs: Required<DocsConfig>
  sources: Required<SourcesConfig>
  features: Required<FeatureFlags>
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
  outputDir: 'docs',
}

export const DEFAULT_PROJECT: Required<ProjectProfile> & { packageContexts: Record<string, PackageContext> } = {
  name: 'Peria',
  tagline: 'Human-readable by default. LLM-ready by design.',
  description: 'Peria turns codebase knowledge into a traceable technical wiki.',
  audience: 'Engineers and AI coding agents who need reliable codebase context.',
  tone: 'Direct, technical, and provenance-first.',
  problem: 'Codebases lose practical knowledge when architecture, commands, docs, and Git history live in separate places.',
  currentFocus: 'Build a local-first self-documenting wiki pipeline before adding hosted integrations.',
  highlights: [
    'Markdown wiki pages are the canonical artifact.',
    'llms.txt is a compact reading map derived from the human wiki.',
    'Every generated claim should trace back to source files, line numbers, and Git context.',
  ],
  packageContexts: {},
}

/**
 * Define configuration with sensible defaults
 */
export function defineConfig(config: PeriaConfig): ResolvedPeriaConfig {
  return {
    framework: config.framework ?? 'other',
    entrypoint: config.entrypoint ?? 'src/index.ts',
    project: {
      ...DEFAULT_PROJECT,
      ...config.project,
      packageContexts: {
        ...DEFAULT_PROJECT.packageContexts,
        ...config.project?.packageContexts,
      },
    },
    docs: { ...DEFAULT_DOCS, ...config.docs },
    sources: {
      openapi: 'openapi.yaml',
      markdown: ['README.md', 'docs/**/*.md'],
      llms: ['llms.txt', 'llms-full.txt'],
      context: ['CLAUDE.md', 'AGENTS.md'],
      ...config.sources,
    },
    features: { ...DEFAULT_FEATURES, ...config.features },
  }
}
