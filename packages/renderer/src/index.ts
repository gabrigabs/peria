/**
 * Peria Documentation Renderer
 *
 * Provides documentation rendering for Peria generated wikis.
 * Generates static HTML that can be served without a framework.
 * Supports markdown parsing, syntax highlighting, and navigation.
 */

// Configuration
export {
  createRendererConfig,
  decodePackageName,
  encodePackageName,
  generateNavigation,
  type RendererConfigOptions,
} from './config.js';
// Content generation
export { type ContentGenerationOptions, generatePagesFromManifest } from './content.js';
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
// Static HTML generation
export {
  generateIndexHtml,
  generatePageHtml,
  generateStaticDocs,
  type StaticDocsOptions,
} from './static.js';
// Wiki renderer
export { renderWikiAssets, renderWikiHtml, renderWikiCss, renderWikiJs, type RenderOptions, type RenderedAssets } from './renderer.js';
export type { WikiManifest, WikiPage, KnowledgeGraphArtifact } from '@peria/core';
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
