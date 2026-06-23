/**
 * Peria Core - Main exports
 */

// Types
export type { PeriaConfig, FeatureFlags, DocsConfig, SourcesConfig, ProjectProfile, PackageContext, Framework } from './types/config.js'
export type { ResolvedPeriaConfig } from './types/config.js'
export type { DetectedFramework, FrameworkInfo } from './types/framework.js'
export type { SourceDocument, SourceType, MarkdownSource, OpenAPISource, LlmsSource } from './types/source.js'
export type { Entity, EntityType, Claim, Provenance, KnowledgeGraph } from './types/entity.js'
export type {
  PackageSummary,
  ModuleSummary,
  ExportSummary,
  CliCommandSummary,
  FeatureSummary,
  AdapterSummary,
  ContextFileSummary,
  WikiPage,
  WikiManifest,
  KnowledgeGraphArtifact,
  WikiBuildResult,
} from './types/wiki.js'

// Graph types (Phase 1)
export type {
  Confidence,
  ExtractionMethod,
  HttpMethod,
  RelationType,
  SourceRef,
  Heading,
  RouteMention,
  SchemaReference,
  SchemaProperty,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  HandlerEntity,
  SchemaEntity,
  OpenAPIOperation,
  RouteEntity,
  DocPageEntity,
  AgentContextFile,
  PackageEntity,
  SourceFile,
  ExportSummary as SourceExportSummary,
  GitChange,
  GraphRelation,
  DriftFinding,
  FrameworkDetection,
} from './types/graph.js'

// Manifest types (Phase 1)
export type {
  PeriaManifest,
  RepoInfo,
  GitMetadata,
  FrameworkMetadata,
  OpenAPIMetadata,
  DocsMetadata,
  LlmsMetadata,
  ScanStats,
  ScanResult,
  ScanWarning,
  ScanOptions,
  SerializedManifest,
  CompactManifest,
} from './types/manifest.js'

// Manifest helpers
export { MANIFEST_VERSION, PERIA_VERSION, toCompactManifest, isValidManifest } from './types/manifest.js'

// Config
export { defineConfig, DEFAULT_FEATURES, DEFAULT_DOCS, DEFAULT_PROJECT } from './types/config.js'
export { loadConfig, configExists } from './config/loader.js'
export { DEFAULT_ENTRYPOINT_CANDIDATES } from './config/defaults.js'

// Detectors
export { detectFramework, getFrameworkOptions } from './detectors/framework.js'
export { detectEntrypoint, getEntrypointOptions, scanForEntrypoints } from './detectors/entrypoint.js'

// Wiki builder
export { buildWiki } from './wiki/builder.js'

// Parsers (Phase 1 - now implemented)
export { parseMarkdown, parseMarkdownWithUnified } from './parsers/markdown.js'
export { parseOpenAPI, parseOpenAPIDetailed } from './parsers/openapi.js'
export { parseLlms, parseLlmsContent } from './parsers/llms.js'

// Legacy parser exports for backward compatibility
export { parseCode } from './parsers/index.js'
export { parseMarkdown as legacyParseMarkdown, parseOpenAPI as legacyParseOpenAPI, parseLlms as legacyParseLlms } from './parsers/index.js'

// Scanner (Phase 1 - new)
export { scan, writeManifest } from './scanner.js'
