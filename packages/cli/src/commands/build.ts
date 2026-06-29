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
  type GitHubCache,
  type GitHubIssue,
  generateAndSaveDiagrams,
  loadConfig,
  type MermaidResult,
  type PeriaManifest,
  readGitHubCache,
  type WikiManifest,
  type WikiPage,
} from '@peria/core';
import { generateFumadocsContent } from '@peria/renderer';
import { logger } from '../utils/logger.js';
import { readManifest } from '../utils/manifest.js';

export async function buildCommand(cwd: string, options?: { renderer?: string }): Promise<void> {
  logger.header('Peria Build');

  const loadedConfig = await loadConfig(cwd);
  if (!loadedConfig) {
    logger.warning('No peria.config.ts found. Using default configuration.');
  }

  const config = defineConfig(loadedConfig ?? {});
  validateRenderer(options?.renderer ?? config.docs.renderer);

  const result = await buildWiki(cwd, config);
  const [scannedManifest, githubCache] = await Promise.all([
    readManifest(cwd),
    readGitHubCache(cwd),
  ]);
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
    diagramResult = await generateAndSaveDiagrams(
      createDiagramManifest(result, cwd, scannedManifest),
      {
        cwd,
        outputDir: diagramsDir,
      }
    );
    logger.success('Generated Mermaid diagrams');
  }

  const initialAppMap = buildApplicationMap(result, scannedManifest);
  const diagramPages = createDiagramPages({
    diagramResult,
    diagramsDir: '.peria/diagrams',
    baseRoute: result.config.docs.route,
  });
  const initialGeneratedPages = [
    ...diagramPages,
    createApplicationMapPage(initialAppMap),
    ...createMaintenancePages(initialAppMap),
    ...createGitHubPages(githubCache),
  ];
  const manifest = appendPagesToManifest(result.manifest, initialGeneratedPages);
  const appMap = updateApplicationMapDocs(initialAppMap, manifest);
  const generatedPages = [
    ...diagramPages,
    createApplicationMapPage(appMap),
    ...createMaintenancePages(appMap),
    ...createGitHubPages(githubCache),
  ];
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
  baseRoute: string;
}): WikiPage[] {
  if (!input.diagramResult) {
    return [];
  }

  return [
    createWikiPage(
      'diagrams',
      'Diagrams',
      'Mermaid diagrams generated by the same engine used by the peria diagram command.',
      renderDiagramsPage(input.diagramResult, input.diagramsDir, input.baseRoute),
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

function createMaintenancePages(appMap: ApplicationMap): WikiPage[] {
  return [
    createWikiPage(
      'development-map',
      'Development Map',
      'Maintenance-oriented map of packages, modules, entrypoints, and likely change areas.',
      renderDevelopmentMapPage(appMap),
      ['.peria/application-map.json', 'packages/core/src/application-map.ts']
    ),
    createWikiPage(
      'release-status',
      'Release Status',
      'Generated release-readiness summary based on package metadata and wiki output.',
      renderReleaseStatusPage(appMap),
      ['package.json', 'packages/*/package.json', 'TASKS.md']
    ),
    createWikiPage(
      'known-gaps',
      'Known Gaps',
      'Detected gaps that keep the generated wiki from being a complete adoption artifact.',
      renderKnownGapsPage(appMap),
      ['TASKS.md', '.peria/application-map.json']
    ),
  ];
}

function createGitHubPages(cache: GitHubCache | null): WikiPage[] {
  if (!cache) {
    return [];
  }

  return [
    createWikiPage(
      'github-issues',
      'GitHub Issues',
      'Cached GitHub issues created or synchronized from Peria drift findings.',
      renderGitHubIssuesPage(cache),
      ['.peria/github.json']
    ),
  ];
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
  const maintenancePages = ['development-map', 'release-status', 'known-gaps'];
  const provenancePages = new Set(['history']);

  for (const page of pages) {
    if (page.slug === 'github-issues') {
      provenancePages.add(page.slug);
      continue;
    }

    if (!maintenancePages.includes(page.slug)) {
      codeMapPages.add(page.slug);
    }
  }

  return {
    ...manifest,
    pages: [...manifest.pages, ...pageSummaries],
    tree: insertMaintenanceSection(
      manifest.tree.map((section) =>
        section.title === 'Code map'
          ? {
              ...section,
              pages: Array.from(codeMapPages),
            }
          : section.title === 'Provenance'
            ? {
                ...section,
                pages: Array.from(provenancePages),
              }
            : section
      ),
      pages
    ),
  };
}

function insertMaintenanceSection(
  tree: WikiManifest['tree'],
  pages: WikiPage[]
): WikiManifest['tree'] {
  const maintenancePages = pages
    .map((page) => page.slug)
    .filter((slug) => ['development-map', 'release-status', 'known-gaps'].includes(slug));

  if (maintenancePages.length === 0) {
    return tree;
  }

  const section = {
    title: 'Maintenance',
    pages: maintenancePages,
  };
  const provenanceIndex = tree.findIndex((item) => item.title === 'Provenance');

  if (provenanceIndex === -1) {
    return [...tree, section];
  }

  return [...tree.slice(0, provenanceIndex), section, ...tree.slice(provenanceIndex)];
}

function routeFor(baseRoute: string, slug: string): string {
  const base = baseRoute.replace(/\/+$/g, '');
  return `${base}/${slug}`;
}

function formatEntityLink(entityId: string, baseRoute: string): string {
  if (entityId.startsWith('package:')) {
    return `[${entityId}](${routeFor(baseRoute, 'packages')})`;
  }

  if (entityId.startsWith('source:')) {
    return `[${entityId}](${routeFor(baseRoute, 'modules')})`;
  }

  if (entityId.startsWith('route:')) {
    return `[${entityId}](${routeFor(baseRoute, 'application-map')})`;
  }

  if (entityId.startsWith('schema:')) {
    return `[${entityId}](${routeFor(baseRoute, 'application-map')})`;
  }

  return `\`${entityId}\``;
}

function renderDiagramsPage(result: MermaidResult, diagramsDir: string, baseRoute: string): string {
  const rows = Object.entries(result.metadata.byType).map(([type, count]) => [
    `\`${type}\``,
    String(count),
  ]);
  const diagramSections = result.diagrams.map((diagram) => {
    const entityLinks = diagram.sourceEntities
      .slice(0, 10)
      .map((entityId) => formatEntityLink(entityId, baseRoute));

    return [
      `## ${diagram.title}`,
      '',
      `- ID: \`${diagram.id}\``,
      `- Type: \`${diagram.type}\``,
      `- Confidence: ${diagram.confidence}`,
      `- Source entities: ${entityLinks.join(', ') || 'none'}${diagram.sourceEntities.length > 10 ? `, and ${diagram.sourceEntities.length - 10} more` : ''}`,
      `- Markdown artifact: \`${diagramsDir}/${diagram.type}/${diagram.id}.md\``,
      `- Mermaid source: \`${diagramsDir}/${diagram.type}/${diagram.id}.mmd\``,
      '',
      diagram.content,
      '',
    ].join('\n');
  });

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
  const routeRows = appMap.routes.map((route) => [
    `\`${route.method}\``,
    `\`${route.path}\``,
    route.handler ?? 'unknown',
    `\`${route.source}\``,
  ]);
  const schemaRows = appMap.schemas.map((schema) => [
    schema.name,
    schema.type,
    schema.source ? `\`${schema.source}\`` : 'unknown',
  ]);
  const openapiRows = appMap.openapi.map((operation) => [
    `\`${operation.method}\``,
    `\`${operation.path}\``,
    operation.operationId ?? 'unknown',
    `\`${operation.source}\``,
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
    '## Routes',
    '',
    markdownTable(['Method', 'Path', 'Handler', 'Source'], routeRows),
    '',
    '## Schemas',
    '',
    markdownTable(['Schema', 'Type', 'Source'], schemaRows),
    '',
    '## OpenAPI Operations',
    '',
    markdownTable(['Method', 'Path', 'Operation', 'Source'], openapiRows),
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

function renderDevelopmentMapPage(appMap: ApplicationMap): string {
  const packageRows = appMap.packages.map((pkg) => {
    const moduleCount = appMap.modules.filter((module) => module.packageName === pkg.name).length;
    return [
      pkg.name,
      `\`${pkg.directory}\``,
      String(moduleCount),
      pkg.dependencies.filter((dependency) => dependency.startsWith('@peria/')).join(', ') ||
        'none',
    ];
  });
  const entryRows = [
    ['CLI commands', appMap.entrypoints.cli.map((item) => `\`${item}\``).join(', ') || 'none'],
    ['Adapters', appMap.entrypoints.adapters.map((item) => `\`${item}\``).join(', ') || 'none'],
    ['Docs renderer', `\`${appMap.docs.renderer}\` at \`${appMap.docs.outputDir}\``],
  ];

  return [
    '# Development Map',
    '',
    'Use this page as the maintenance entrypoint before changing a package boundary, CLI command, adapter, or generated docs contract.',
    '',
    '## Change Areas',
    '',
    markdownTable(['Package', 'Directory', 'Modules', 'Internal dependencies'], packageRows),
    '',
    '## Entrypoints',
    '',
    markdownTable(['Surface', 'Entries'], entryRows),
    '',
    '## Suggested Reading Order',
    '',
    '- Start with `application-map` to inspect the generated aggregate.',
    '- Use `packages` before changing public package exports or dependencies.',
    '- Use `modules` before moving source files or changing imports.',
    '- Use `diagrams` when dependency or module relationships are the risky part of a change.',
    '- Use `history` to connect the current working tree to recent commits.',
    '',
  ].join('\n');
}

function renderReleaseStatusPage(appMap: ApplicationMap): string {
  const packageRows = appMap.packages.map((pkg) => [
    pkg.name,
    `\`${pkg.directory}\``,
    pkg.exports.length > 0 ? 'public surface' : 'internal or app package',
    String(pkg.dependencies.length),
  ]);

  return [
    '# Release Status',
    '',
    'This generated status is intentionally conservative. It reports what the current repository can prove from package manifests and generated wiki output.',
    '',
    '## Snapshot',
    '',
    `- Generated at: ${appMap.generatedAt}`,
    `- Git branch: \`${appMap.git.branch ?? 'unknown'}\``,
    `- Git commit: \`${appMap.git.commit ?? 'unknown'}\``,
    `- Working tree: ${appMap.git.isDirty ? `${appMap.git.changedFiles.length} changed files` : 'clean'}`,
    `- Documentation pages: ${appMap.summary.pages}`,
    `- Renderer: \`${appMap.docs.renderer}\``,
    '',
    '## Package Surface',
    '',
    markdownTable(['Package', 'Directory', 'Surface', 'Dependencies'], packageRows),
    '',
    '## Release Gates Still Worth Checking',
    '',
    '- Fresh npm install outside the monorepo.',
    '- `npm pack --dry-run` for every package intended for publication.',
    '- A generated Fumadocs host app or documented integration harness.',
    '- Adapter dogfood against a real NestJS app.',
    '',
  ].join('\n');
}

function renderGitHubIssuesPage(cache: GitHubCache): string {
  const openIssues = cache.issues.filter((issue) => issue.state === 'open');
  const rows = openIssues.map((issue) => [
    formatIssueNumber(issue),
    issue.title,
    issue.labels.map((label) => `\`${label}\``).join(', ') || 'none',
    issue.driftFindingId ? `\`${issue.driftFindingId}\`` : 'none',
    issue.source ? `\`${formatSourceRef(issue)}\`` : 'none',
  ]);

  return [
    '# GitHub Issues',
    '',
    'This page is generated from `.peria/github.json`. It shows cached issue records before or after they are synchronized with GitHub.',
    '',
    '## Snapshot',
    '',
    `- Generated at: ${cache.generatedAt}`,
    `- Repository: ${cache.repository.owner ? `${cache.repository.owner}/` : ''}${cache.repository.name}`,
    `- Open issues: ${openIssues.length}`,
    `- Total cached issues: ${cache.issues.length}`,
    `- Relations: ${cache.relations.length}`,
    '',
    '## Open Drift Issues',
    '',
    markdownTable(['Issue', 'Title', 'Labels', 'Drift finding', 'Source'], rows),
    '',
  ].join('\n');
}

function formatIssueNumber(issue: GitHubIssue): string {
  return issue.url ? `[#${issue.number}](${issue.url})` : `#${issue.number}`;
}

function formatSourceRef(issue: GitHubIssue): string {
  if (!issue.source) {
    return 'unknown';
  }

  const line = issue.source.line ? `:${issue.source.line}` : '';
  const column = issue.source.column ? `:${issue.source.column}` : '';

  return `${issue.source.file}${line}${column}`;
}

function renderKnownGapsPage(appMap: ApplicationMap): string {
  const gaps = [
    appMap.summary.routes === 0
      ? [
          'API routes',
          'No routes are present in the application map. Run `peria scan` on a framework fixture or app with route extraction enabled.',
        ]
      : ['API routes', `${appMap.summary.routes} routes are present.`],
    appMap.summary.schemas === 0
      ? [
          'Schemas',
          'No schemas are present in the application map. DTO/schema extraction still needs broader dogfood.',
        ]
      : ['Schemas', `${appMap.summary.schemas} schemas are present.`],
    appMap.openapi.length === 0
      ? [
          'OpenAPI',
          'No OpenAPI operations are present. Configure `sources.openapi` or keep this marked as unavailable.',
        ]
      : ['OpenAPI', `${appMap.openapi.length} operations are present.`],
    [
      'Fumadocs app',
      'Peria generates Fumadocs-compatible content, but does not yet scaffold or run a full host app.',
    ],
    ['GitHub sync', 'Issues, PRs, milestones, and auth are still roadmap work.'],
  ];

  return [
    '# Known Gaps',
    '',
    'This page separates generated fact from roadmap intent so the wiki does not overclaim product maturity.',
    '',
    markdownTable(['Area', 'Current state'], gaps),
    '',
    '## Practical Impact',
    '',
    '- Package, module, CLI, adapter, history, diagram, and docs-page knowledge is available in this build.',
    '- Route, schema, and OpenAPI completeness depends on a current scan manifest with those entities.',
    '- Public adoption still needs a Fumadocs host app story, adapter dogfood, and changelog/release notes.',
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
  cwd: string,
  scannedManifest?: PeriaManifest | null
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
    routes: scannedManifest?.routes ?? [],
    schemas: scannedManifest?.schemas ?? [],
    openapiOps: scannedManifest?.openapiOps ?? [],
    docsPages: scannedManifest?.docsPages ?? [],
    sourceFiles: result.modules.map((module) => ({
      id: `source:${module.path}`,
      path: module.path,
      package: module.packageName,
      module: module.path,
      exports: module.exports.map((item) => ({
        name: item.name,
        kind: item.kind,
        line: item.line,
      })),
      imports: module.imports,
      source: {
        file: module.path,
        line: 1,
        commit: result.commit,
      },
      confidence: 'high',
    })),
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
    agentContext: scannedManifest?.agentContext ?? [],
    relations: scannedManifest?.relations ?? [],
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
        status: 'M',
        commit: commit.hash,
        author: commit.author,
        date: commit.date,
        subject: commit.subject,
      })),
    },
    drift: scannedManifest?.drift ?? [],
    stats: {
      startTime: result.generatedAt,
      endTime: result.generatedAt,
      durationMs: 0,
      filesScanned: result.modules.length,
      packagesScanned: result.packages.length,
    },
  };
}
