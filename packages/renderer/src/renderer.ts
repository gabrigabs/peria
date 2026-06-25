/**
 * Wiki Renderer - Main Entry Point
 * 
 * Orchestrates the rendering of wiki assets.
 */

import type { WikiManifest, WikiPage, KnowledgeGraphArtifact } from '@peria/core';
import { renderWikiHtml } from './html.js';
import { renderWikiCss } from './css.js';
import { renderWikiJs } from './js.js';

export interface RenderOptions {
  manifest: WikiManifest;
  pages: WikiPage[];
  graph: KnowledgeGraphArtifact;
  llmsText: string;
}

export interface RenderedAssets {
  html: string;
  css: string;
  js: string;
}

/**
 * Render all wiki assets
 */
export function renderWikiAssets(options: RenderOptions): RenderedAssets {
  return {
    html: renderWikiHtml(options.manifest),
    css: renderWikiCss(),
    js: renderWikiJs(),
  };
}

export { renderWikiHtml, renderWikiCss, renderWikiJs };
