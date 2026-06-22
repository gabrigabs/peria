/**
 * Peria Core - Main exports
 */

// Types
export type { PeriaConfig, FeatureFlags, DocsConfig, SourcesConfig, Framework } from './types/config.js'
export type { DetectedFramework, FrameworkInfo } from './types/framework.js'
export type { SourceDocument, SourceType, MarkdownSource, OpenAPISource, LlmsSource } from './types/source.js'
export type { Entity, EntityType, Claim, Provenance, KnowledgeGraph } from './types/entity.js'

// Config
export { defineConfig, DEFAULT_FEATURES, DEFAULT_DOCS } from './types/config.js'
export { loadConfig, configExists } from './config/loader.js'
export { DEFAULT_ENTRYPOINT_CANDIDATES } from './config/defaults.js'

// Detectors
export { detectFramework, getFrameworkOptions } from './detectors/framework.js'
export { detectEntrypoint, getEntrypointOptions, scanForEntrypoints } from './detectors/entrypoint.js'

// Parsers (stubs)
export { parseCode, parseMarkdown, parseOpenAPI, parseLlms } from './parsers/index.js'
