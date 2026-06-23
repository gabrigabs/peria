/**
 * Wiki build artifact types
 */

import type { Claim, Entity } from './entity.js'
import type { ProjectProfile, ResolvedPeriaConfig } from './config.js'

export type ExportKind = 'class' | 'function' | 'interface' | 'type' | 'variable' | 'enum' | 'other'

export interface PackageSummary {
  name: string
  version?: string
  directory: string
  manifestPath: string
  description?: string
  scripts: Record<string, string>
  dependencies: string[]
  exports: string[]
}

export interface ExportSummary {
  name: string
  kind: ExportKind
  line: number
}

export interface ModuleSummary {
  path: string
  packageName?: string
  imports: string[]
  exports: ExportSummary[]
}

export interface CliCommandSummary {
  name: string
  description: string
  source: string
  line: number
  handlerPath?: string
  status: 'implemented' | 'stub' | 'missing-handler'
}

export interface FeatureSummary {
  name: string
  enabled: boolean
  source: string
  line?: number
}

export interface AdapterSummary {
  name: string
  source: string
  exports: ExportSummary[]
  status: 'implemented' | 'placeholder'
}

export interface ContextFileSummary {
  path: string
  exists: boolean
  heading?: string
}

export interface WikiPage {
  title: string
  slug: string
  description: string
  path: string
  body: string
  sourcePaths: string[]
}

export interface WikiManifestPage {
  title: string
  slug: string
  description: string
  path: string
}

export interface WikiTreeSection {
  title: string
  pages: string[]
}

export interface WikiManifest {
  title: string
  tagline: string
  generatedAt: string
  manifestVersion: string
  commit?: string
  git: GitMetadata
  project: Required<ProjectProfile>
  pages: WikiManifestPage[]
  tree: WikiTreeSection[]
}

export interface KnowledgeGraphArtifact {
  version: string
  generatedAt: string
  commit?: string
  git: GitMetadata
  entities: Entity[]
  claims: Claim[]
}

export interface GitCommitSummary {
  hash: string
  date: string
  author: string
  subject: string
}

export interface GitMetadata {
  branch?: string
  commit?: string
  shortCommit?: string
  author?: string
  authorEmail?: string
  authoredAt?: string
  subject?: string
  isDirty: boolean
  changedFiles: string[]
  recentCommits: GitCommitSummary[]
}

export interface WikiBuildResult {
  config: ResolvedPeriaConfig
  generatedAt: string
  commit?: string
  git: GitMetadata
  packages: PackageSummary[]
  modules: ModuleSummary[]
  cliCommands: CliCommandSummary[]
  features: FeatureSummary[]
  adapters: AdapterSummary[]
  contextFiles: ContextFileSummary[]
  history: string[]
  pages: WikiPage[]
  manifest: WikiManifest
  graph: KnowledgeGraphArtifact
  llmsText: string
}
