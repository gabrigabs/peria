/**
 * Peria Documentation Renderer
 *
 * Provides documentation rendering for Peria generated wikis.
 * Generates Fumadocs-compatible MDX content and source config.
 */

export type { KnowledgeGraphArtifact, WikiManifest, WikiPage } from '@peria/core';
// Configuration
export {
  createRendererConfig,
  decodePackageName,
  encodePackageName,
  generateNavigation,
  type RendererConfigOptions,
  type RendererMode,
} from './config.js';
// Content generation
export { type ContentGenerationOptions, generatePagesFromManifest } from './content.js';
// Fumadocs-compatible content generation
export {
  type FumadocsContentOptions,
  type FumadocsOutput,
  type FumadocsOutputFile,
  generateFumadocsContent,
  type PageTreeNode,
} from './fumadocs.js';
// Manifest utilities
export {
  convertManifestToDocs,
  generateSidebarTree,
  type ManifestConversionOptions,
} from './manifest.js';
// Markdown utilities
export { type MarkdownOptions, parseMarkdown, renderMarkdownToHtml } from './markdown.js';
// Search index
export {
  generateSearchIndex,
  generateSearchIndexJson,
  generateSearchScript,
  type SearchIndexOptions,
  searchEntries,
} from './search.js';
// Types
export type {
  Confidence,
  DocsMetadata,
  DocsPage,
  DriftFindingData,
  EvidenceSource,
  GeneratedPage,
  HttpMethod,
  NavItem,
  NavSection,
  PackagePageData,
  RoutePageData,
  SchemaPageData,
  SearchEntry,
  SearchResult,
  SourceFile,
} from './types.js';
