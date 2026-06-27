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
import { renderWikiAssets, generateFumadocsContent } from '@peria/renderer';
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
  const contentDir = join(docsDir, 'content');
  const artifactDir = join(cwd, '.peria');

  await mkdir(pagesDir, { recursive: true });
  await mkdir(assetsDir, { recursive: true });
  await mkdir(contentDir, { recursive: true });
  await mkdir(artifactDir, { recursive: true });

  // Write all wiki pages in parallel (skip for fumadocs mode)
  if (rendererMode !== 'fumadocs') {
    await Promise.all(
      result.pages.map((page) => writeFile(join(docsDir, page.path), page.body, 'utf-8'))
    );
  }

  // Generate output based on renderer mode
  if (rendererMode === 'fumadocs') {
    logger.info('Generating Fumadocs-compatible output...');

    const fumadocsOutput = generateFumadocsContent({
      manifest: result.manifest,
      baseUrl: config?.docs.route ?? '/docs',
    });

    // Write MDX files
    await Promise.all(
      fumadocsOutput.files.map((file) =>
        writeFile(join(docsDir, file.path), file.content, 'utf-8')
      )
    );

    // Write content config
    await writeFile(
      join(docsDir, 'content.config.ts'),
      fumadocsOutput.contentConfig,
      'utf-8'
    );

    logger.success(`Generated ${fumadocsOutput.files.length} MDX pages`);
    logger.success('Generated content.config.ts for Fumadocs');
  }

  // Get rendered assets from renderer package (static mode)
  const { html, css, js } = renderWikiAssets({
    manifest: result.manifest,
    pages: result.pages,
    graph: result.graph,
    llmsText: result.llmsText,
  });

  // Write all remaining files in parallel
  await Promise.all([
    writeJsonFile(join(docsDir, 'wiki-manifest.json'), result.manifest),
    ...(rendererMode === 'fumadocs' ? [] : [
      writeFile(join(docsDir, 'index.html'), html, 'utf-8'),
      writeFile(join(assetsDir, 'wiki.css'), css, 'utf-8'),
      writeFile(join(assetsDir, 'wiki.js'), js, 'utf-8'),
    ]),
    writeJsonFile(join(artifactDir, 'graph.json'), result.graph),
    writeJsonFile(join(artifactDir, 'wiki-manifest.json'), result.manifest),
    writeFile(join(artifactDir, 'ai-context.md'), result.llmsText, 'utf-8'),
    writeFile(join(cwd, 'llms.txt'), result.llmsText, 'utf-8'),
  ]);

  logger.success(`Generated ${result.pages.length} wiki pages in ${result.config.docs.outputDir}`);
  if (rendererMode === 'fumadocs') {
    logger.success('Generated Fumadocs MDX content');
  } else {
    logger.success('Generated visual wiki UI');
  }
  logger.success('Generated .peria/graph.json');
  logger.success('Generated llms.txt');
  logger.dim(`Commit: ${result.commit ?? 'unknown'}`);
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, 'utf-8');
}
