/**
 * Build command - generates Peria wiki artifacts.
 *
 * CLI responsibilities:
 * - load config
 * - call buildWiki
 * - call the Fumadocs renderer
 * - write files
 * - log output
 */

import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import {
  type ApplicationMap,
  buildApplicationMap,
  buildWiki,
  createLlmsText,
  defineConfig,
  generateAndSaveDiagrams,
  loadConfig,
  type MermaidResult,
  type WikiManifest,
  type WikiPage,
} from '@peria/core';
import { generateFumadocsContent } from '@peria/renderer';
import { logger } from '../utils/logger.js';

export async function buildCommand(cwd: string, options?: { renderer?: string }): Promise<void> {
  logger.header('Peria Build');

  const loadedConfig = await loadConfig(cwd);
  if (!loadedConfig) {
    logger.warning('No peria.config.ts found. Using default configuration.');
  }

  const config = defineConfig(loadedConfig ?? {});
  validateRenderer(options?.renderer ?? config.docs.renderer);

  const result = await buildWiki(cwd, config);
  const docsDir = join(cwd, result.config.docs.outputDir);
  const pagesDir = join(docsDir, 'pages');
  const artifactDir = join(cwd, '.peria');
  const diagramsDir = join(cwd, '.peria', 'diagrams');

  await Promise.all([
    resetDirectory(pagesDir),
    mkdir(artifactDir, { recursive: true }),
    mkdir(diagramsDir, { recursive: true }),
  ]);

  await removeStaticRendererArtifacts(docsDir);

  let diagramResult: MermaidResult | undefined;
  if (result.config.features.mermaid) {
    logger.info('Generating Mermaid diagrams...');
    diagramResult = await generateAndSaveDiagrams(createDiagramManifest(result, cwd), {
      cwd,
      outputDir: diagramsDir,
    });
    logger.success('Generated Mermaid diagrams');
  }

  const initialAppMap = buildApplicationMap(result);
  const diagramPages = createDiagramPages({
    diagramResult,
    diagramsDir: '.peria/diagrams',
  });
  const initialGeneratedPages = [...diagramPages, createApplicationMapPage(initialAppMap)];
  const manifest = appendPagesToManifest(result.manifest, initialGeneratedPages);
  const appMap = updateApplicationMapDocs(initialAppMap, manifest);
  const generatedPages = [...diagramPages, createApplicationMapPage(appMap)];
  const pages = [...result.pages, ...generatedPages];
  const llmsText = createLlmsText(manifest, result.contextFiles);

  await writeJsonFile(join(artifactDir, 'application-map.json'), appMap);
  logger.success('Generated application map');

  await Promise.all(pages.map((page) => writeFile(join(docsDir, page.path), page.body, 'utf-8')));

  logger.info('Generating Fumadocs-compatible output...');
  const fumadocsOutput = generateFumadocsContent({
    manifest,
    pages,
    baseUrl: result.config.docs.route,
  });

  await Promise.all(
    fumadocsOutput.files.map((file) => writeOutputFile(join(docsDir, file.path), file.content))
  );

  await Promise.all([
    writeJsonFile(join(docsDir, 'wiki-manifest.json'), manifest),
    writeJsonFile(join(artifactDir, 'graph.json'), result.graph),
    writeJsonFile(join(artifactDir, 'wiki-manifest.json'), manifest),
    writeFile(join(artifactDir, 'ai-context.md'), llmsText, 'utf-8'),
    writeFile(join(cwd, 'llms.txt'), llmsText, 'utf-8'),
  ]);

  logger.success(`Generated ${pages.length} wiki pages in ${result.config.docs.outputDir}`);
  logger.success(`Generated ${fumadocsOutput.pageCount} Fumadocs MDX pages`);
  logger.success('Generated .peria/graph.json');
  logger.success('Generated llms.txt');
  logger.dim(`Commit: ${result.commit ?? 'unknown'}`);
}

function validateRenderer(renderer: string): void {
  if (renderer === 'fumadocs') {
    return;
  }

  throw new Error(
    `Unsupported renderer "${renderer}". Peria now generates Fumadocs output only; use docs.renderer = "fumadocs" or omit the renderer option.`
  );
}

async function removeStaticRendererArtifacts(docsDir: string): Promise<void> {
  await Promise.all([
    rm(join(docsDir, 'index.html'), { force: true }),
    rm(join(docsDir, 'assets'), { recursive: true, force: true }),
    rm(join(docsDir, 'content.config.ts'), { force: true }),
    rm(join(docsDir, 'content', 'docs'), { recursive: true, force: true }),
    removeLegacyTopLevelMdx(join(docsDir, 'content')),
  ]);
}

async function resetDirectory(path: string): Promise<void> {
  await rm(path, { recursive: true, force: true });
  await mkdir(path, { recursive: true });
}

async function removeLegacyTopLevelMdx(contentDir: string): Promise<void> {
  try {
    const entries = await readdir(contentDir, { withFileTypes: true });
    await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
        .map((entry) => rm(join(contentDir, entry.name), { force: true }))
    );
  } catch {
    return;
  }
}

async function writeOutputFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf-8');
}

async function writeJsonFile(path: string, value: unknown): Promise<void> {
  await writeOutputFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function createDiagramPages(input: {
  diagramResult?: MermaidResult;
  diagramsDir: string;
}): WikiPage[] {
  if (!input.diagramResult) {
    return [];
  }

  return [
    createWikiPage(
      'diagrams',
      'Diagrams',
      'Mermaid diagrams generated by the same engine used by the peria diagram command.',
      renderDiagramsPage(input.diagramResult, input.diagramsDir),
      ['.peria/diagrams/metadata.json', 'packages/core/src/mermaid']
    ),
  ];
}

function createApplicationMapPage(appMap: ApplicationMap): WikiPage {
  return createWikiPage(
    'application-map',
    'Application Map',
    'Aggregate map of project packages, modules, entrypoints, docs, and Git context.',
    renderApplicationMapPage(appMap),
    ['.peria/application-map.json', 'packages/core/src/application-map.ts']
  );
}

function updateApplicationMapDocs(appMap: ApplicationMap, manifest: WikiManifest): ApplicationMap {
  return {
    ...appMap,
    summary: {
      ...appMap.summary,
      pages: manifest.pages.length,
    },
    docs: {
      ...appMap.docs,
      pages: manifest.pages.map((page) => ({
        title: page.title,
        slug: page.slug,
        path: page.path,
      })),
    },
  };
}

function createWikiPage(
  slug: string,
  title: string,
  description: string,
  body: string,
  sourcePaths: string[]
): WikiPage {
  return {
    title,
    slug,
    description,
    path: `pages/${slug}.md`,
    body,
    sourcePaths,
  };
}

function appendPagesToManifest(manifest: WikiManifest, pages: WikiPage[]): WikiManifest {
  const pageSummaries = pages.map((page) => ({
    title: page.title,
    slug: page.slug,
    description: page.description,
    path: page.path,
  }));
  const codeMapPages = new Set(['modules', 'adapters', 'wiki-ui']);

  for (const page of pages) {
    codeMapPages.add(page.slug);
  }

  return {
    ...manifest,
    pages: [...manifest.pages, ...pageSummaries],
    tree: manifest.tree.map((section) =>
      section.title === 'Code map'
        ? {
            ...section,
            pages: Array.from(codeMapPages),
          }
        : section
    ),
  };
}

function renderDiagramsPage(result: MermaidResult, diagramsDir: string): string {
  const rows = Object.entries(result.metadata.byType).map(([type, count]) => [
    `\`${type}\``,
    String(count),
  ]);
  const diagramSections = result.diagrams.map((diagram) =>
    [
      `## ${diagram.title}`,
      '',
      `- ID: \`${diagram.id}\``,
      `- Type: \`${diagram.type}\``,
      `- Confidence: ${diagram.confidence}`,
      `- Source entities: ${diagram.sourceEntities.length}`,
      `- Artifact: \`${diagramsDir}/${diagram.type}/${diagram.id}.md\``,
      '',
      diagram.content,
      '',
    ].join('\n')
  );

  return [
    '# Diagrams',
    '',
    'These Mermaid diagrams are generated during `peria build` with the same Mermaid engine used by `peria diagram`.',
    '',
    `Generated at: ${result.metadata.generatedAt}`,
    '',
    '## Coverage',
    '',
    markdownTable(['Diagram type', 'Count'], rows),
    '',
    ...diagramSections,
  ].join('\n');
}

function renderApplicationMapPage(appMap: ApplicationMap): string {
  const summaryRows = Object.entries(appMap.summary).map(([key, value]) => [key, String(value)]);
  const packageRows = appMap.packages.map((pkg) => [
    pkg.name,
    `\`${pkg.directory}\``,
    String(pkg.dependencies.length),
    String(pkg.exports.length),
  ]);
  const moduleRows = appMap.modules
    .slice(0, 40)
    .map((module) => [
      `\`${module.path}\``,
      module.packageName ?? 'unknown',
      String(module.imports.length),
      String(module.exports.length),
    ]);
  const pageRows = appMap.docs.pages.map((page) => [
    page.title,
    `\`${page.slug}\``,
    `\`${page.path}\``,
  ]);

  return [
    '# Application Map',
    '',
    'The application map is the compact artifact for answering what exists, where it lives, and how the current wiki output is connected.',
    '',
    '## Project',
    '',
    `- Name: ${appMap.project.name}`,
    `- Framework: \`${appMap.project.framework}\``,
    `- Entrypoint: \`${appMap.project.entrypoint}\``,
    `- Generated at: ${appMap.generatedAt}`,
    '',
    '## Summary',
    '',
    markdownTable(['Area', 'Count'], summaryRows),
    '',
    '## Entrypoints',
    '',
    `- CLI commands: ${appMap.entrypoints.cli.map((item) => `\`${item}\``).join(', ') || 'none'}`,
    `- Adapters: ${appMap.entrypoints.adapters.map((item) => `\`${item}\``).join(', ') || 'none'}`,
    '',
    '## Packages',
    '',
    markdownTable(['Package', 'Directory', 'Dependencies', 'Exports'], packageRows),
    '',
    '## Modules',
    '',
    markdownTable(['Module', 'Package', 'Imports', 'Exports'], moduleRows),
    '',
    '## Documentation Pages',
    '',
    markdownTable(['Title', 'Slug', 'Path'], pageRows),
    '',
    '## Git Context',
    '',
    `- Branch: \`${appMap.git.branch ?? 'unknown'}\``,
    `- Commit: \`${appMap.git.commit ?? 'unknown'}\``,
    `- Working tree: ${appMap.git.isDirty ? `${appMap.git.changedFiles.length} changed files` : 'clean'}`,
    '',
  ].join('\n');
}

function markdownTable(headers: string[], rows: string[][]): string {
  if (rows.length === 0) {
    return '_No entries found._';
  }

  const header = `| ${headers.map(escapeTableCell).join(' | ')} |`;
  const separator = `| ${headers.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => `| ${row.map(escapeTableCell).join(' | ')} |`);

  return [header, separator, ...body].join('\n');
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br>');
}

function createDiagramManifest(
  result: Awaited<ReturnType<typeof buildWiki>>,
  cwd: string
): Parameters<typeof generateAndSaveDiagrams>[0] {
  return {
    manifestVersion: result.manifest.manifestVersion,
    periaVersion: result.manifest.periaVersion,
    generatedAt: result.generatedAt,
    repo: {
      name: result.config.project.name,
      root: cwd,
      commit: result.git.commit ?? '',
      branch: result.git.branch ?? '',
      isDirty: result.git.isDirty,
    },
    routes: [],
    schemas: [],
    openapiOps: [],
    docsPages: [],
    sourceFiles: [],
    packages: result.packages.map((pkg) => ({
      id: `package:${pkg.name}`,
      name: pkg.name,
      version: pkg.version,
      directory: pkg.directory,
      manifestPath: pkg.manifestPath,
      description: pkg.description,
      scripts: pkg.scripts,
      dependencies: pkg.dependencies,
      exports: pkg.exports,
      source: {
        file: pkg.manifestPath,
        line: 1,
        commit: result.commit,
      },
      confidence: 'high',
    })),
    agentContext: [],
    relations: [],
    git: {
      lastCommit: result.git.commit ?? '',
      shortCommit: result.git.shortCommit ?? '',
      branch: result.git.branch ?? '',
      isDirty: result.git.isDirty,
      changedFiles: result.git.changedFiles,
      recentChanges: result.git.recentCommits.map((commit) => ({
        id: commit.hash,
        path: '',
        type: 'modified',
        commit: commit.hash,
        author: commit.author,
        date: commit.date,
        subject: commit.subject,
      })),
    },
    drift: [],
    stats: {
      startTime: result.generatedAt,
      endTime: result.generatedAt,
      durationMs: 0,
      filesScanned: result.modules.length,
      packagesScanned: result.packages.length,
    },
  };
}
