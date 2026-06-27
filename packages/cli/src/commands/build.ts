/**
 * Build command - generates the Peria wiki artifacts
 *
 * CLI responsibilities:
 * - load config
 * - call buildWiki
 * - call renderer
 * - write files
 * - log output
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildWiki, loadConfig } from '@peria/core';
import { renderWikiAssets } from '@peria/renderer';
import { logger } from '../utils/logger.js';

export async function buildCommand(cwd: string, options?: { renderer?: 'static' | 'fumadocs' }): Promise<void> {
  logger.header('Peria Build');

  const config = await loadConfig(cwd);
  if (!config) {
    logger.warning('No peria.config.ts found. Using default configuration.');
  }

  // Override renderer mode from CLI option
  const rendererMode = options?.renderer || config?.docs.renderer || 'static';

  if (rendererMode === 'fumadocs' && config?.docs.renderer !== 'fumadocs') {
    logger.warning('Fumadocs renderer selected - install fumadocs dependencies for full support');
  }

  const result = await buildWiki(cwd, config ?? {});
  const docsDir = join(cwd, result.config.docs.outputDir);
  const pagesDir = join(docsDir, 'pages');
  const assetsDir = join(docsDir, 'assets');
  const artifactDir = join(cwd, '.peria');

  await mkdir(pagesDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });

  // Write all wiki pages in parallel
  await Promise.all(
    result.pages.map((page) => writeFile(join(docsDir, page.path), page.body, 'utf-8'))
  );

  // Get rendered assets based on renderer mode
  if (rendererMode === 'fumadocs') {
    // TODO: call generateFumadocsContent() when implemented
    logger.info('Fumadocs mode - using static fallback');
  }

  // Get rendered assets from renderer package
  const { html, css, js } = renderWikiAssets({
    manifest: result.manifest,
    pages: result.pages,
    graph: result.graph,
    llmsText: result.llmsText,
  });

  // Write all remaining files in parallel
  await Promise.all([
    writeJsonFile(join(docsDir, 'wiki-manifest.json'), result.manifest),
    writeFile(join(docsDir, 'index.html'), html, 'utf-8'),
    writeFile(join(assetsDir, 'wiki.css'), css, 'utf-8'),
    writeFile(join(assetsDir, 'wiki.js'), js, 'utf-8'),
    writeJsonFile(join(artifactDir, 'graph.json'), result.graph),
    writeJsonFile(join(artifactDir, 'wiki-manifest.json'), result.manifest),
    writeFile(join(artifactDir, 'ai-context.md'), result.llmsText, 'utf-8'),
    writeFile(join(cwd, 'llms.txt'), result.llmsText, 'utf-8'),
  ]);

  logger.success(`Generated ${result.pages.length} wiki pages in ${result.config.docs.outputDir}`);
  logger.success('Generated visual wiki UI');
  logger.success('Generated .peria/graph.json');
  logger.success('Generated llms.txt');
  logger.dim(`Commit: ${result.commit ?? 'unknown'}`);
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
