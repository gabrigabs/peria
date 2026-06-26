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
export { DEFAULT_ENTRYPOINT_CANDIDATES } from './config/defaults.js';
export { configExists, loadConfig } from './config/loader.js';
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

// Audit module (Phase 5)
export { runAuditChecks, getAuditCheck, listAuditChecks, AUDIT_CHECKS } from './audit/index.js';
export { CLIReporter, createCLIReporter } from './audit/reporters/cli.js';
export { JSONReporter, createJSONReporter, toJSON } from './audit/reporters/json.js';
export type { AuditCheck, AuditResult, AuditOptions, AuditSeverity, CheckResult, AuditSummary } from './audit/types.js';

// Context packs module (Phase 6)
export {
  generateContextPacks,
  generateAndSaveContextPacks,
  saveContextPacks,
  generateRouteContext,
  generatePackageContext,
  generateTaskContext,
  generateDiffContext,
  TASK_TEMPLATES,
} from './context-packs/index.js';
export type {
  ContextPack,
  RouteContextPack,
  PackageContextPack,
  TaskContextPack,
  DiffContextPack,
  FullContextPack,
  ContextPackOptions,
  ContextPackResult,
  ContextVariant,
  RepoSummary,
  TaskType,
} from './context-packs/index.js';
