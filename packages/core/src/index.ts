/**
 * Peria Core - Main exports
 */

// Framework adapters (Phase 2)
export { createNestJSAdapter, nestJSAdapter } from './adapters/nestjs/index.js';
export type {
  EntrypointEntity,
  FrameworkAdapter,
  FrameworkDetectionResult,
  ModuleEntity,
  RepoContext,
} from './adapters/types.js';
// Audit module (Phase 5)
export { AUDIT_CHECKS, getAuditCheck, listAuditChecks, runAuditChecks } from './audit/index.js';
export { CLIReporter, createCLIReporter } from './audit/reporters/cli.js';
export { createJSONReporter, JSONReporter, toJSON } from './audit/reporters/json.js';
export type {
  AuditCheck,
  AuditOptions,
  AuditResult,
  AuditSeverity,
  AuditSummary,
  CheckResult,
} from './audit/types.js';
export { DEFAULT_ENTRYPOINT_CANDIDATES } from './config/defaults.js';
export { configExists, loadConfig } from './config/loader.js';
export type {
  ContextPack,
  ContextPackOptions,
  ContextPackResult,
  ContextVariant,
  DiffContextPack,
  FullContextPack,
  PackageContextPack,
  RepoSummary,
  RouteContextPack,
  TaskContextPack,
  TaskType,
} from './context-packs/index.js';
// Context packs module (Phase 6)
export {
  generateAndSaveContextPacks,
  generateContextPacks,
  generateDiffContext,
  generatePackageContext,
  generateRouteContext,
  generateTaskContext,
  saveContextPacks,
  TASK_TEMPLATES,
} from './context-packs/index.js';
export {
  detectEntrypoint,
  getEntrypointOptions,
  scanForEntrypoints,
} from './detectors/entrypoint.js';
// Detectors
export { detectFramework, getFrameworkOptions } from './detectors/framework.js';
export type { EnrichedOpenAPIOperation, OperationPeriaMetadata } from './generators/index.js';
// Generators (Phase 3)
export {
  generateEnrichedOpenAPI,
  saveEnrichedOpenAPI,
  summarizeEnrichment,
} from './generators/index.js';
export type { MatchingResult, MatchType, RouteOpenAPIMatch } from './matcher/index.js';
// Matcher (Phase 3)
export { matchRoutesToOpenAPI, summarizeMatching } from './matcher/index.js';
export type {
  DiagramType,
  MermaidDiagram,
  MermaidOptions,
  MermaidResult,
} from './mermaid/index.js';
// Mermaid diagrams module (Phase 7)
export {
  generateAndSaveDiagrams,
  generateDiagrams,
  generateOverviewDiagram,
  generatePackageDepDiagrams,
  generateRouteFlowDiagrams,
  generateSchemaDiagrams,
} from './mermaid/index.js';
// Legacy parser exports for backward compatibility
export {
  parseCode,
  parseLlms as legacyParseLlms,
  parseMarkdown as legacyParseMarkdown,
  parseOpenAPI as legacyParseOpenAPI,
} from './parsers/index.js';
export { parseLlms, parseLlmsContent } from './parsers/llms.js';
// Parsers (Phase 1 - now implemented)
export { parseMarkdown, parseMarkdownWithUnified } from './parsers/markdown.js';
export { parseOpenAPI, parseOpenAPIDetailed } from './parsers/openapi.js';
// Scanner (Phase 1 - new)
export { scan, writeManifest } from './scanner.js';
// Types
export type {
  DocsConfig,
  FeatureFlags,
  Framework,
  PackageContext,
  PeriaConfig,
  ProjectProfile,
  ResolvedPeriaConfig,
  SourcesConfig,
} from './types/config.js';
// Config
export { DEFAULT_DOCS, DEFAULT_FEATURES, DEFAULT_PROJECT, defineConfig } from './types/config.js';
export type { Claim, Entity, EntityType, KnowledgeGraph, Provenance } from './types/entity.js';
export type { DetectedFramework, FrameworkInfo } from './types/framework.js';
// Graph types (Phase 1)
export type {
  AgentContextFile,
  Confidence,
  DocPageEntity,
  DriftFinding,
  ExportSummary as SourceExportSummary,
  ExtractionMethod,
  FrameworkDetection,
  GitChange,
  GraphRelation,
  HandlerEntity,
  Heading,
  HttpMethod,
  OpenAPIOperation,
  OpenAPIParameter,
  OpenAPIRequestBody,
  OpenAPIResponse,
  PackageEntity,
  RelationType,
  RouteEntity,
  RouteMention,
  SchemaEntity,
  SchemaProperty,
  SchemaReference,
  SourceFile,
  SourceRef,
} from './types/graph.js';
// Manifest types (Phase 1)
export type {
  CompactManifest,
  DocsMetadata,
  FrameworkMetadata,
  GitMetadata,
  LlmsMetadata,
  OpenAPIMetadata,
  PeriaManifest,
  RepoInfo,
  ScanOptions,
  ScanResult,
  ScanStats,
  ScanWarning,
  SerializedManifest,
} from './types/manifest.js';
// Manifest helpers
export {
  isValidManifest,
  MANIFEST_VERSION,
  PERIA_VERSION,
  toCompactManifest,
} from './types/manifest.js';
export type {
  LlmsSource,
  MarkdownSource,
  OpenAPISource,
  SourceDocument,
  SourceType,
} from './types/source.js';
export type {
  AdapterSummary,
  CliCommandSummary,
  ContextFileSummary,
  ExportSummary,
  FeatureSummary,
  KnowledgeGraphArtifact,
  ModuleSummary,
  PackageSummary,
  WikiBuildResult,
  WikiManifest,
  WikiPage,
} from './types/wiki.js';
// Wiki builder
export { buildWiki } from './wiki/builder.js';
