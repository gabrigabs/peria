/**
 * Build command - generates the Peria wiki artifacts
 *
 * CLI responsibilities:
 * - load config
 * - call buildWiki
 * - call renderer
 * - call build steps (enriched OpenAPI)
 * - write files
 * - log output
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildWiki, loadConfig } from '@peria/core';
import { buildEnrichedOpenAPI } from '@peria/core/build';
import { renderWikiAssets } from '@peria/renderer';
import { logger } from '../utils/logger.js';

export async function buildCommand(cwd: string): Promise<void> {
  logger.header('Peria Build');

  const config = await loadConfig(cwd);
  if (!config) {
    logger.warning('No peria.config.ts found. Using default configuration.');
  }

  const result = await buildWiki(cwd, config ?? {});
  const docsDir = join(cwd, result.config.docs.outputDir);
  const pagesDir = join(docsDir, 'pages');
  const assetsDir = join(docsDir, 'assets');
  const artifactDir = join(cwd, '.eria');

  await mkdir(pagesDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });

  // Write all wiki pages in parallel
  await Promise.all(
    result.pages.map((page) => writeFile(join(docsDir, page.path), page.body, 'utf-8'))
  );

  // Get rendered assets from renderer package
  const { html, css, js } = renderWikiAssets({
    manifest: result.manifest,
    pages: result.pages,
    graph: result.graph,
    llmsText: result.llmsText,
  });

  // Generate enriched OpenAPI as a separate build step
  let enrichedPath: string | undefined;
  if (result.openapiOps.length > 0 && config?.features?.apiReference) {
    try {
      const enrichedResult = await buildEnrichedOpenAPI({
        cwd,
        scanResult: { manifest: result.manifest, warnings: [] },
      });
      enrichedPath = enrichedResult.path;
      if (enrichedPath) {
        logger.success(`Generated enriched OpenAPI: ${enrichedPath}`);
      }
    } catch (err) {
      logger.warning(`Failed to generate enriched OpenAPI: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // Write all remaining files in parallel
  await Promise.all([
    writeJsonFile(join(docsDir, 'wiki-manifest.json'), result.manifest),
    writeFile(join(docsDir, 'index.html'), html, 'utf-8'),
    writeFile(join(assetsDir, 'wiki.css'), css, 'utf-8'),
    writeFile(join(assetsDir, 'wiki.js'), js, 'utf-8'),
    writeJsonFile(join(artifactDir, 'graph.json'), result.graph),
    writeJsonFile(join(artifactDir, 'manifest.json'), result.manifest),
    writeFile(join(artifactDir, 'ai-context.md'), result.llmsText, 'utf-8'),
    writeFile(join(cwd, 'llms.txt'), result.llmsText, 'utf-8'),
  ]);

  logger.success(`Generated ${result.pages.length} wiki pages in ${result.config.docs.outputDir}`);
  logger.success('Generated visual wiki UI');
  logger.success('Generated .eria/graph.json');
  logger.success('Generated llms.txt');
  logger.dim(`Commit: ${result.commit ?? 'unknown'}`);
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
