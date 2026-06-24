/**
 * Wiki builder for Peria projects
 */

import { execFile } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { Project } from 'ts-morph';
import type { PeriaConfig, ResolvedPeriaConfig } from '../types/config.js';
import { defineConfig } from '../types/config.js';
import type { Claim, Entity, EntityRelation, EntityType, Provenance } from '../types/entity.js';
import type {
  AdapterSummary,
  CliCommandSummary,
  ContextFileSummary,
  ExportKind,
  ExportSummary,
  FeatureSummary,
  GitMetadata,
  KnowledgeGraphArtifact,
  ModuleSummary,
  PackageSummary,
  WikiBuildResult,
  WikiManifest,
  WikiPage,
} from '../types/wiki.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: string[] | Record<string, unknown>;
}

const GRAPH_VERSION = '0.1.0';
const MANIFEST_VERSION = '0.1.0';
const IGNORED_DIRECTORIES = new Set(['.git', '.eria', 'dist', 'node_modules']);

export async function buildWiki(
  cwd: string,
  configInput: PeriaConfig | ResolvedPeriaConfig = {}
): Promise<WikiBuildResult> {
  const config = defineConfig(configInput);
  const generatedAt = new Date().toISOString();

  // Independent collection operations in parallel
  const [git, packages, cliCommands, features, contextFiles, history] = await Promise.all([
    collectGitMetadata(cwd),
    collectPackages(cwd),
    collectCliCommands(cwd),
    collectFeatures(cwd, config),
    collectContextFiles(cwd, config.sources.context),
    getRecentHistory(cwd),
  ]);

  // Sequential: modules need packages, adapters need modules
  const modules = await collectModules(cwd, packages);
  const adapters = await collectAdapters(cwd, modules);

  const commit = git.commit;
  const pages = createPages({
    config,
    generatedAt,
    commit,
    git,
    packages,
    modules,
    cliCommands,
    features,
    adapters,
    contextFiles,
    history,
  });
  const manifest = createManifest(config, generatedAt, git, pages);
  const graph = createGraph({
    generatedAt,
    commit,
    git,
    packages,
    modules,
    cliCommands,
    features,
    adapters,
    pages,
  });
  const llmsText = createLlmsText(manifest, contextFiles);

  return {
    config,
    generatedAt,
    commit,
    git,
    packages,
    modules,
    cliCommands,
    features,
    adapters,
    contextFiles,
    history,
    pages,
    manifest,
    graph,
    llmsText,
  };
}

async function collectPackages(cwd: string): Promise<PackageSummary[]> {
  const packageFiles = ['package.json'];
  const packagesDir = join(cwd, 'packages');

  try {
    const packageDirs = await readdir(packagesDir, { withFileTypes: true });
    for (const entry of packageDirs) {
      if (entry.isDirectory()) {
        packageFiles.push(`packages/${entry.name}/package.json`);
      }
    }
  } catch {
    // A single-package project is still valid.
  }

  const summaries: PackageSummary[] = [];

  for (const manifestPath of packageFiles) {
    const absolutePath = join(cwd, manifestPath);
    const pkg = await readJsonFile<PackageJson>(absolutePath);
    if (!pkg?.name) continue;

    const dependencies = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ].sort();

    summaries.push({
      name: pkg.name,
      version: pkg.version,
      directory: normalizePath(dirname(manifestPath)),
      manifestPath,
      description: pkg.description,
      scripts: pkg.scripts ?? {},
      dependencies,
      exports: getExportKeys(pkg.exports),
    });
  }

  return summaries.sort((left, right) => left.directory.localeCompare(right.directory));
}

async function collectModules(cwd: string, packages: PackageSummary[]): Promise<ModuleSummary[]> {
  const tsFiles = await findTypeScriptFiles(cwd);
  const project = new Project({
    compilerOptions: {
      allowJs: false,
      declaration: true,
      module: 99,
      moduleResolution: 100,
      target: 9,
    },
    skipAddingFilesFromTsConfig: true,
  });

  const modules: ModuleSummary[] = [];

  for (const filePath of tsFiles) {
    const sourceFile = project.addSourceFileAtPath(join(cwd, filePath));
    const imports = unique(
      sourceFile.getImportDeclarations().map((declaration) => declaration.getModuleSpecifierValue())
    ).sort();
    const exportedDeclarations = sourceFile.getExportedDeclarations();
    const exports: ExportSummary[] = [];

    for (const [name, declarations] of exportedDeclarations.entries()) {
      const declaration = declarations[0];
      if (!declaration) continue;

      exports.push({
        name,
        kind: getExportKind(declaration.getKindName()),
        line: declaration.getSourceFile().getLineAndColumnAtPos(declaration.getStart()).line,
      });
    }

    modules.push({
      path: filePath,
      packageName: getPackageNameForPath(filePath, packages),
      imports,
      exports: exports.sort((left, right) => left.name.localeCompare(right.name)),
    });
  }

  return modules.sort((left, right) => left.path.localeCompare(right.path));
}

async function collectCliCommands(cwd: string): Promise<CliCommandSummary[]> {
  const source = 'packages/cli/src/index.ts';
  const content = await readTextFile(join(cwd, source));
  if (!content) return [];

  // Extract command info first, then read handler files in parallel
  const commandInfos: Array<{
    name: string;
    description: string;
    line: number;
    handlerPath: string;
  }> = [];
  const commandPattern = /cli\.command\(['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\)/g;
  commandPattern.lastIndex = 0;
  let match: RegExpExecArray | null = commandPattern.exec(content);

  while (match !== null) {
    commandInfos.push({
      name: match[1],
      description: match[2],
      line: getLineNumber(content, match.index),
      handlerPath: `packages/cli/src/commands/${match[1]}.ts`,
    });

    match = commandPattern.exec(content);
  }

  // Read all handler files in parallel
  const handlerContents = await Promise.all(
    commandInfos.map((info) => readTextFile(join(cwd, info.handlerPath)))
  );

  return commandInfos.map((info, index) => ({
    name: info.name,
    description: info.description,
    source,
    line: info.line,
    handlerPath: handlerContents[index] ? info.handlerPath : undefined,
    status: getImplementationStatus(handlerContents[index]),
  }));
}

async function collectFeatures(
  cwd: string,
  config: ResolvedPeriaConfig
): Promise<FeatureSummary[]> {
  const configSource = 'peria.config.ts';
  const defaultSource = 'packages/core/src/types/config.ts';
  const configContent = await readTextFile(join(cwd, configSource));
  const defaultContent = await readTextFile(join(cwd, defaultSource));

  return Object.entries(config.features)
    .map(([name, enabled]) => {
      const configLine = configContent ? findFeatureLineNumber(configContent, name) : undefined;
      const defaultLine = defaultContent ? findLineNumber(defaultContent, `${name}:`) : undefined;

      return {
        name,
        enabled,
        source: configLine ? configSource : defaultSource,
        line: configLine ?? defaultLine,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function collectAdapters(cwd: string, modules: ModuleSummary[]): Promise<AdapterSummary[]> {
  // Filter adapter modules and read all contents in parallel
  const adapterModules = modules.filter(
    (module) =>
      module.path.startsWith('packages/adapters/src/') &&
      basename(module.path, extname(module.path)) !== 'index'
  );

  const contents = await Promise.all(
    adapterModules.map((module) => readTextFile(join(cwd, module.path)))
  );

  return adapterModules
    .map((module, index) => ({
      name: basename(module.path, extname(module.path)),
      source: module.path,
      exports: module.exports,
      status: (contents[index]?.includes('coming soon') ? 'placeholder' : 'implemented') as
        | 'placeholder'
        | 'implemented',
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function collectContextFiles(
  cwd: string,
  contextPaths: string[]
): Promise<ContextFileSummary[]> {
  // Read all context files in parallel
  const paths = unique(contextPaths);
  const contents = await Promise.all(paths.map((path) => readTextFile(join(cwd, path))));

  return paths.map((path, index) => ({
    path,
    exists: contents[index] !== null,
    heading: contents[index] ? getFirstHeading(contents[index]) : undefined,
  }));
}

function createPages(input: {
  config: ResolvedPeriaConfig;
  generatedAt: string;
  commit?: string;
  git: GitMetadata;
  packages: PackageSummary[];
  modules: ModuleSummary[];
  cliCommands: CliCommandSummary[];
  features: FeatureSummary[];
  adapters: AdapterSummary[];
  contextFiles: ContextFileSummary[];
  history: string[];
}): WikiPage[] {
  return [
    createPage(
      'overview',
      `${input.config.project.name} Overview`,
      input.config.project.description,
      renderOverview(input),
      ['README.md', 'CLAUDE.md', 'AGENTS.md']
    ),
    createPage(
      'packages',
      'Packages',
      'Workspace packages, manifests, scripts, dependencies, and package exports.',
      renderPackages(input),
      ['package.json', 'packages/*/package.json']
    ),
    createPage(
      'cli',
      'CLI Commands',
      'Registered Peria CLI commands and their command registry provenance.',
      renderCliCommands(input),
      ['packages/cli/src/index.ts', 'packages/cli/src/commands']
    ),
    createPage(
      'modules',
      'TypeScript Modules',
      'Source files, imports, and exported declarations extracted with ts-morph.',
      renderModules(input),
      ['packages/*/src/**/*.ts']
    ),
    createPage(
      'adapters',
      'Adapters',
      'Framework adapters that expose the generated docs in application runtimes.',
      renderAdapters(input),
      ['packages/adapters/src']
    ),
    createPage(
      'configuration',
      'Configuration And Features',
      'Resolved config, enabled features, and config provenance.',
      renderConfiguration(input.config, input.features),
      ['peria.config.ts', 'packages/core/src/types/config.ts']
    ),
    createPage(
      'wiki-ui',
      'Wiki UI',
      'Static visual wiki shell generated into /docs and backed by markdown pages.',
      renderWikiUi(input.config),
      ['packages/docs-ui/src/index.ts', 'packages/cli/src/commands/build.ts']
    ),
    createPage(
      'history',
      'History',
      'Recent Git history captured as dated provenance for the generated wiki.',
      renderHistory(input),
      ['.git']
    ),
    createPage(
      'ai-context',
      'AI Context Map',
      'A compact reading map for agents, derived from the human wiki.',
      renderAiContext(input),
      [...input.contextFiles.map((file) => file.path), 'docs/wiki-manifest.json']
    ),
  ];
}

function createManifest(
  config: ResolvedPeriaConfig,
  generatedAt: string,
  git: GitMetadata,
  pages: WikiPage[]
): WikiManifest {
  return {
    title: `${config.project.name} Wiki`,
    tagline: config.project.tagline,
    generatedAt,
    manifestVersion: MANIFEST_VERSION,
    commit: git.commit,
    git,
    project: config.project,
    pages: pages.map((page) => ({
      title: page.title,
      slug: page.slug,
      description: page.description,
      path: page.path,
    })),
    tree: [
      { title: 'Start here', pages: ['overview', 'ai-context'] },
      { title: 'Product surface', pages: ['packages', 'cli', 'configuration'] },
      { title: 'Code map', pages: ['modules', 'adapters', 'wiki-ui'] },
      { title: 'Provenance', pages: ['history'] },
    ],
  };
}

function createGraph(input: {
  generatedAt: string;
  commit?: string;
  git: GitMetadata;
  packages: PackageSummary[];
  modules: ModuleSummary[];
  cliCommands: CliCommandSummary[];
  features: FeatureSummary[];
  adapters: AdapterSummary[];
  pages: WikiPage[];
}): KnowledgeGraphArtifact {
  const claims: Claim[] = [];
  const entities: Entity[] = [];
  let claimCount = 0;

  function claim(
    subject: string,
    predicate: string,
    object: string,
    provenance: Provenance,
    confidence: Claim['confidence'] = 'high'
  ): Claim {
    claimCount += 1;
    const nextClaim: Claim = {
      id: `claim:${claimCount}`,
      subject,
      predicate,
      object,
      confidence,
      provenance,
      timestamp: input.generatedAt,
    };
    claims.push(nextClaim);
    return nextClaim;
  }

  function entity(
    id: string,
    name: string,
    type: EntityType,
    path: string | undefined,
    description: string,
    entityClaims: Claim[],
    relations: EntityRelation[] = []
  ): void {
    entities.push({
      id,
      name,
      type,
      path,
      description,
      claims: entityClaims,
      relations,
    });
  }

  for (const pkg of input.packages) {
    const id = `package:${pkg.name}`;
    entity(
      id,
      pkg.name,
      'package',
      pkg.manifestPath,
      pkg.description ?? `Workspace package ${pkg.name}`,
      [
        claim(id, 'defined_in', pkg.manifestPath, provenance(pkg.manifestPath, 1, input.commit)),
        claim(
          id,
          'has_scripts',
          Object.keys(pkg.scripts).join(', ') || 'none',
          provenance(pkg.manifestPath, 1, input.commit)
        ),
      ]
    );
  }

  for (const module of input.modules) {
    const id = `module:${module.path}`;
    const exportNames = module.exports.map((item) => item.name).join(', ') || 'none';
    entity(
      id,
      module.path,
      'source-file',
      module.path,
      `TypeScript module with ${module.exports.length} exported declarations.`,
      [claim(id, 'exports', exportNames, provenance(module.path, 1, input.commit))]
    );

    for (const item of module.exports) {
      const exportId = `export:${module.path}:${item.name}`;
      entity(
        exportId,
        item.name,
        'export',
        module.path,
        `${item.kind} exported from ${module.path}.`,
        [
          claim(
            exportId,
            'exported_from',
            module.path,
            provenance(module.path, item.line, input.commit)
          ),
        ]
      );
    }
  }

  for (const command of input.cliCommands) {
    const id = `cli-command:${command.name}`;
    entity(id, command.name, 'cli-command', command.source, command.description, [
      claim(
        id,
        'registered_in',
        command.source,
        provenance(command.source, command.line, input.commit)
      ),
      claim(
        id,
        'described_as',
        command.description,
        provenance(command.source, command.line, input.commit)
      ),
    ]);
  }

  for (const feature of input.features) {
    const id = `feature:${feature.name}`;
    entity(
      id,
      feature.name,
      'feature',
      feature.source,
      `Feature flag ${feature.name} is ${feature.enabled ? 'enabled' : 'disabled'}.`,
      [
        claim(
          id,
          'enabled',
          String(feature.enabled),
          provenance(feature.source, feature.line, input.commit)
        ),
      ]
    );
  }

  for (const adapter of input.adapters) {
    const id = `adapter:${adapter.name}`;
    entity(
      id,
      adapter.name,
      'adapter',
      adapter.source,
      `Framework adapter exported from ${adapter.source}.`,
      [claim(id, 'defined_in', adapter.source, provenance(adapter.source, 1, input.commit))]
    );
  }

  for (const page of input.pages) {
    const id = `wiki-page:${page.slug}`;
    entity(id, page.title, 'wiki-page', page.path, page.description, [
      claim(
        id,
        'generated_from',
        page.sourcePaths.join(', '),
        provenance(page.sourcePaths[0] ?? page.path, 1, input.commit),
        'medium'
      ),
    ]);
  }

  return {
    version: GRAPH_VERSION,
    generatedAt: input.generatedAt,
    commit: input.commit,
    git: input.git,
    entities,
    claims,
  };
}

function createLlmsText(manifest: WikiManifest, contextFiles: ContextFileSummary[]): string {
  const pageLines = manifest.pages.map(
    (page) => `- ${page.title}: docs/${page.path} - ${page.description}`
  );
  const contextLines = contextFiles.map(
    (file) => `- ${file.path}${file.exists ? '' : ' (missing)'}`
  );

  return [
    '# Peria Wiki Map',
    '',
    `${manifest.project.tagline}`,
    '',
    manifest.project.description,
    '',
    'This file is derived from the human wiki generated in /docs. Read the wiki pages first, then use source links inside each page for provenance.',
    '',
    `Generated: ${manifest.generatedAt}`,
    `Branch: ${manifest.git.branch ?? 'unknown'}`,
    `Commit: ${manifest.git.commit ?? 'unknown'}`,
    `Working tree: ${manifest.git.isDirty ? 'dirty' : 'clean'}`,
    '',
    '## Reading Tree',
    ...manifest.tree.flatMap((section) => [
      `- ${section.title}`,
      ...section.pages.map((slug) => {
        const page = manifest.pages.find((item) => item.slug === slug);
        return page ? `  - ${page.title}: docs/${page.path}` : `  - ${slug}`;
      }),
    ]),
    '',
    '## Pages',
    ...pageLines,
    '',
    '## Configured Agent Context Files',
    ...contextLines,
    '',
  ].join('\n');
}

function renderOverview(input: {
  config: ResolvedPeriaConfig;
  generatedAt: string;
  commit?: string;
  git: GitMetadata;
  packages: PackageSummary[];
  modules: ModuleSummary[];
  cliCommands: CliCommandSummary[];
  features: FeatureSummary[];
  adapters: AdapterSummary[];
}): string {
  const project = input.config.project;
  const implementedCommands = input.cliCommands.filter(
    (command) => command.status === 'implemented'
  ).length;
  const placeholderAdapters = input.adapters.filter(
    (adapter) => adapter.status === 'placeholder'
  ).length;

  return [
    `# ${project.name} Overview`,
    '',
    `> ${project.tagline}`,
    '',
    project.description,
    '',
    '## Product Thesis',
    '',
    project.problem,
    '',
    `Current focus: ${project.currentFocus}`,
    '',
    '## For Whom',
    '',
    project.audience,
    '',
    '## Editorial Notes',
    '',
    ...project.highlights.map((highlight) => `- ${highlight}`),
    '',
    '## Current Snapshot',
    '',
    `- Generated at: ${input.generatedAt}`,
    `- Git branch: ${input.git.branch ?? 'unknown'}`,
    `- Git commit: ${input.commit ?? 'unknown'}`,
    `- Working tree: ${input.git.isDirty ? `${input.git.changedFiles.length} changed files` : 'clean'}`,
    `- Packages documented: ${input.packages.length}`,
    `- TypeScript modules mapped: ${input.modules.length}`,
    `- CLI commands documented: ${input.cliCommands.length} (${implementedCommands} implemented handlers)`,
    `- Adapters documented: ${input.adapters.length} (${placeholderAdapters} placeholders)`,
    `- Feature flags documented: ${input.features.length}`,
    '',
    '## Wiki Tree Pattern',
    '',
    'The generated markdown is the canonical knowledge layer. The visual site reads these markdown files, and `llms.txt` points agents back to the same pages instead of maintaining a separate AI-only truth.',
    '',
    '## How To Use This Wiki',
    '',
    '- Start with this overview for product intent and current maturity.',
    '- Read Packages and CLI Commands to understand the public surface.',
    '- Read TypeScript Modules and Adapters when changing code paths.',
    '- Read Configuration And Features before changing defaults.',
    '- Read History to connect generated claims to branch, author, commit, and working-tree state.',
    '',
  ].join('\n');
}

function renderPackages(input: {
  config: ResolvedPeriaConfig;
  packages: PackageSummary[];
  modules: ModuleSummary[];
}): string {
  const sections = input.packages.map((pkg) => {
    const context = input.config.project.packageContexts[pkg.name];
    const packageModules = input.modules.filter((module) => module.packageName === pkg.name);
    const exportCount = packageModules.reduce((total, module) => total + module.exports.length, 0);
    const internalImports = getInternalPackageImports(pkg.name, input.modules);

    return [
      `## ${pkg.name}`,
      '',
      context?.role
        ? `**Role:** ${context.role}`
        : `**Role:** ${pkg.description ?? 'Workspace package'}`,
      '',
      context?.audience
        ? `**Audience:** ${context.audience}`
        : '**Audience:** Contributors working in this package.',
      '',
      ...(context?.responsibilities?.length
        ? ['**Responsibilities:**', '', ...context.responsibilities.map((item) => `- ${item}`), '']
        : []),
      '**Why it matters:**',
      '',
      `This package contributes ${packageModules.length} source modules and ${exportCount} exported declarations to the generated knowledge graph. Its manifest lives at \`${pkg.manifestPath}\`, so package metadata and scripts remain traceable to source.`,
      '',
      '**Surface:**',
      '',
      `- Directory: \`${pkg.directory}\``,
      `- Version: ${pkg.version ?? 'unknown'}`,
      `- Scripts: ${
        Object.keys(pkg.scripts)
          .map((script) => `\`${script}\``)
          .join(', ') || 'none'
      }`,
      `- Package exports: ${pkg.exports.map((item) => `\`${item}\``).join(', ') || 'none'}`,
      `- Internal package imports: ${internalImports.map((item) => `\`${item}\``).join(', ') || 'none detected'}`,
      `- External dependencies: ${pkg.dependencies.map((dependency) => `\`${dependency}\``).join(', ') || 'none'}`,
      '',
      ...(context?.notes?.length
        ? ['**Notes:**', '', ...context.notes.map((item) => `- ${item}`), '']
        : []),
    ].join('\n');
  });

  return [
    '# Packages',
    '',
    'Packages are documented as ownership boundaries, not just manifest rows. Each section combines package.json metadata, TypeScript source coverage, internal imports, and configured editorial context.',
    '',
    ...sections,
  ].join('\n');
}

function renderCliCommands(input: { cliCommands: CliCommandSummary[] }): string {
  const rows = input.cliCommands.map((command) => [
    command.name,
    command.description,
    command.status,
    command.handlerPath ? `\`${command.handlerPath}\`` : 'missing',
    `\`${command.source}:${command.line}\``,
  ]);

  return [
    '# CLI Commands',
    '',
    'The CLI is the operator path through Peria. Commands are extracted from the CAC registry, then cross-checked against handler files so the wiki can distinguish usable flows from placeholders.',
    '',
    '## Operator Journey',
    '',
    '1. `init` creates the project configuration.',
    '2. `build` extracts knowledge and writes `/docs`, `.eria/graph.json`, and `llms.txt`.',
    '3. `serve` previews the generated wiki locally.',
    '4. `check` is reserved for drift detection once a baseline model exists.',
    '',
    '## Command Registry',
    '',
    markdownTable(['Command', 'Description', 'Status', 'Handler', 'Registry provenance'], rows),
    '',
  ].join('\n');
}

function renderModules(input: { packages: PackageSummary[]; modules: ModuleSummary[] }): string {
  const packageSections = input.packages
    .map((pkg) => {
      const modules = input.modules.filter((module) => module.packageName === pkg.name);
      if (modules.length === 0) return '';

      const rows = modules.map((module) => [
        `\`${module.path}\``,
        module.exports.map((item) => `${item.name} (${item.kind}:${item.line})`).join(', ') ||
          'none',
        module.imports.map((item) => `\`${item}\``).join(', ') || 'none',
      ]);

      return [
        `## ${pkg.name}`,
        '',
        describeModuleGroup(pkg, modules),
        '',
        markdownTable(['Module', 'Exports', 'Imports'], rows),
        '',
      ].join('\n');
    })
    .filter(Boolean);

  return [
    '# TypeScript Modules',
    '',
    'This map is extracted with `ts-morph`. It is grouped by package so the reader can see each boundary before scanning individual files.',
    '',
    ...packageSections,
    '',
  ].join('\n');
}

function renderAdapters(input: {
  adapters: AdapterSummary[];
  config: ResolvedPeriaConfig;
}): string {
  const rows = input.adapters.map((adapter) => [
    adapter.name,
    adapter.status,
    `\`${adapter.source}\``,
    adapter.exports.map((item) => `${item.name} (${item.kind})`).join(', ') || 'none',
  ]);

  return [
    '# Adapters',
    '',
    'Adapters are the runtime bridge between generated artifacts and application frameworks. In this slice they intentionally stay thin while the generated `/docs` contract stabilizes.',
    '',
    `Configured docs route: \`${input.config.docs.route}\``,
    '',
    '## Maturity',
    '',
    '- `implemented` means the file exposes behavior without a placeholder marker.',
    '- `placeholder` means the adapter contract exists but still returns or logs "coming soon" behavior.',
    '',
    '## Adapter Surface',
    '',
    markdownTable(['Adapter', 'Status', 'Source', 'Exports'], rows),
    '',
  ].join('\n');
}

function renderConfiguration(config: ResolvedPeriaConfig, features: FeatureSummary[]): string {
  const rows = features.map((feature) => [
    feature.name,
    feature.enabled ? 'enabled' : 'disabled',
    feature.line ? `\`${feature.source}:${feature.line}\`` : `\`${feature.source}\``,
  ]);

  return [
    '# Configuration And Features',
    '',
    'Peria is configured by `peria.config.ts` and resolved with defaults from `@peria/core`.',
    '',
    '## Project Profile',
    '',
    `- Name: ${config.project.name}`,
    `- Tagline: ${config.project.tagline}`,
    `- Audience: ${config.project.audience}`,
    `- Tone: ${config.project.tone}`,
    `- Current focus: ${config.project.currentFocus}`,
    '',
    'Configured highlights:',
    '',
    ...config.project.highlights.map((highlight) => `- ${highlight}`),
    '',
    '## Resolved Project Config',
    '',
    `- Framework: \`${config.framework}\``,
    `- Entrypoint: \`${config.entrypoint}\``,
    `- Docs route: \`${config.docs.route}\``,
    `- Docs output directory: \`${config.docs.outputDir}\``,
    `- Markdown sources: ${config.sources.markdown.map((item) => `\`${item}\``).join(', ')}`,
    `- AI context files: ${config.sources.context.map((item) => `\`${item}\``).join(', ')}`,
    '',
    '## Feature Flags',
    '',
    markdownTable(['Feature', 'State', 'Provenance'], rows),
    '',
  ].join('\n');
}

function renderWikiUi(config: ResolvedPeriaConfig): string {
  return [
    '# Wiki UI',
    '',
    `The visual wiki is generated into \`${config.docs.outputDir}\`. It uses \`${config.docs.outputDir}/wiki-manifest.json\` as its page registry and reads markdown from \`${config.docs.outputDir}/pages/*.md\`.`,
    '',
    '## Contract',
    '',
    '- Markdown pages remain the source of truth.',
    '- `index.html` provides search, navigation, reading metadata, and rendered markdown.',
    '- `wiki-manifest.json` is the bridge between generated pages and the browser UI.',
    '- The UI has no backend requirement; it can be served as static files.',
    '',
  ].join('\n');
}

function renderHistory(input: { git: GitMetadata; history: string[] }): string {
  const gitRows = input.git.recentCommits.map((commit) => [
    `\`${commit.hash}\``,
    commit.date,
    commit.author,
    commit.subject,
  ]);

  return [
    '# History',
    '',
    'Git context gives generated docs a date and ownership anchor. The wiki records the branch, current commit, author, and working-tree state alongside generated claims.',
    '',
    '## Current Revision',
    '',
    `- Branch: \`${input.git.branch ?? 'unknown'}\``,
    `- Commit: \`${input.git.commit ?? 'unknown'}\``,
    `- Subject: ${input.git.subject ?? 'unknown'}`,
    `- Author: ${input.git.author ?? 'unknown'}${input.git.authorEmail ? ` <${input.git.authorEmail}>` : ''}`,
    `- Authored at: ${input.git.authoredAt ?? 'unknown'}`,
    `- Working tree: ${input.git.isDirty ? `${input.git.changedFiles.length} changed files` : 'clean'}`,
    '',
    '## Working Tree Changes',
    '',
    ...(input.git.changedFiles.length > 0
      ? input.git.changedFiles.map((file) => `- \`${file}\``)
      : ['- No uncommitted changes detected at generation time.']),
    '',
    '## Recent Commits',
    '',
    markdownTable(['Commit', 'Date', 'Author', 'Subject'], gitRows),
    '',
    '## Raw Log Snapshot',
    '',
    ...(input.history.length > 0
      ? input.history.map((line) => `- ${line}`)
      : ['- No Git history available.']),
    '',
  ].join('\n');
}

function renderAiContext(input: {
  config: ResolvedPeriaConfig;
  git: GitMetadata;
  contextFiles: ContextFileSummary[];
}): string {
  const rows = input.contextFiles.map((file) => [
    `\`${file.path}\``,
    file.exists ? 'present' : 'missing',
    file.heading ?? 'No heading detected',
  ]);

  return [
    '# AI Context Map',
    '',
    `This map is tuned for ${input.config.project.audience}`,
    '',
    `Tone: ${input.config.project.tone}`,
    '',
    'Agents should treat the human wiki as the durable knowledge layer. `llms.txt` is intentionally short: it points to the page tree and configured context files instead of duplicating the full wiki.',
    '',
    '## Current Git Context',
    '',
    `- Branch: \`${input.git.branch ?? 'unknown'}\``,
    `- Commit: \`${input.git.commit ?? 'unknown'}\``,
    `- Working tree: ${input.git.isDirty ? `${input.git.changedFiles.length} changed files` : 'clean'}`,
    '',
    '## Reading Order',
    '',
    '1. `docs/pages/overview.md`',
    '2. `docs/pages/configuration.md`',
    '3. `docs/pages/packages.md`',
    '4. `docs/pages/cli.md`',
    '5. `docs/pages/modules.md`',
    '6. `docs/pages/history.md`',
    '',
    '## Configured Context Files',
    '',
    markdownTable(['File', 'Status', 'Detected heading'], rows),
    '',
  ].join('\n');
}

function createPage(
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

async function findTypeScriptFiles(cwd: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const absolutePath = join(directory, entry.name);
      const relativePath = normalizePath(relative(cwd, absolutePath));

      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await walk(absolutePath);
        }
        continue;
      }

      if (
        entry.isFile() &&
        relativePath.startsWith('packages/') &&
        /\/src\/.+\.ts$/.test(relativePath)
      ) {
        files.push(relativePath);
      }
    }
  }

  await walk(cwd);
  return files.sort();
}

async function readJsonFile<T>(path: string): Promise<T | null> {
  const content = await readTextFile(path);
  if (!content) return null;

  try {
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function getExportKeys(exportsField: PackageJson['exports']): string[] {
  if (!exportsField) return [];
  if (Array.isArray(exportsField)) return exportsField;
  return Object.keys(exportsField).sort();
}

function getPackageNameForPath(path: string, packages: PackageSummary[]): string | undefined {
  const matches = packages
    .filter((pkg) => pkg.directory !== '.' && path.startsWith(`${pkg.directory}/`))
    .sort((left, right) => right.directory.length - left.directory.length);

  return matches[0]?.name;
}

function getExportKind(kindName: string): ExportKind {
  if (kindName.includes('Class')) return 'class';
  if (kindName.includes('Function')) return 'function';
  if (kindName.includes('Interface')) return 'interface';
  if (kindName.includes('TypeAlias')) return 'type';
  if (kindName.includes('Variable')) return 'variable';
  if (kindName.includes('Enum')) return 'enum';
  return 'other';
}

function getImplementationStatus(content: string | null): CliCommandSummary['status'] {
  if (!content) return 'missing-handler';
  if (content.includes('not implemented yet')) return 'stub';
  return 'implemented';
}

function describeModuleGroup(pkg: PackageSummary, modules: ModuleSummary[]): string {
  const exportCount = modules.reduce((total, module) => total + module.exports.length, 0);
  const externalImports = unique(
    modules.flatMap((module) =>
      module.imports.filter((item) => !item.startsWith('.') && !item.startsWith('@peria/'))
    )
  );
  const topModules = modules
    .filter((module) => module.exports.length > 0)
    .sort((left, right) => right.exports.length - left.exports.length)
    .slice(0, 3)
    .map((module) => `\`${module.path}\``);

  return [
    `${pkg.name} contains ${modules.length} mapped modules and ${exportCount} exported declarations.`,
    topModules.length > 0
      ? `Highest-signal files: ${topModules.join(', ')}.`
      : 'No exported declarations were detected in this package.',
    externalImports.length > 0
      ? `External libraries visible in source imports: ${externalImports.map((item) => `\`${item}\``).join(', ')}.`
      : 'No external source imports detected.',
  ].join(' ');
}

function getInternalPackageImports(packageName: string, modules: ModuleSummary[]): string[] {
  return unique(
    modules
      .filter((module) => module.packageName === packageName)
      .flatMap((module) => module.imports)
      .filter((item) => item.startsWith('@peria/') && item !== packageName)
  ).sort();
}

function provenance(
  source: string,
  line: number | undefined,
  commit: string | undefined
): Provenance {
  return {
    source,
    line,
    commit,
  };
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

function getFirstHeading(content: string): string | undefined {
  const match = content.match(/^#\s+(.+)$/m);
  return match?.[1];
}

function getLineNumber(content: string, index: number): number {
  return content.slice(0, index).split('\n').length;
}

function findLineNumber(content: string, search: string): number | undefined {
  const index = content.indexOf(search);
  if (index === -1) return undefined;
  return getLineNumber(content, index);
}

function findFeatureLineNumber(content: string, featureName: string): number | undefined {
  const blockStart = content.search(/features:\s*{/);
  if (blockStart === -1) return undefined;

  const featureIndex = content.indexOf(`${featureName}:`, blockStart);
  if (featureIndex === -1) return undefined;

  return getLineNumber(content, featureIndex);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

function normalizePath(path: string): string {
  if (!path || path === '.') return '.';
  return path.split(sep).join('/');
}

async function getRecentHistory(cwd: string): Promise<string[]> {
  const result = await runGit(cwd, ['log', '--date=short', '--pretty=format:%h %ad %s', '-12']);
  return result ? result.split('\n') : [];
}

async function collectGitMetadata(cwd: string): Promise<GitMetadata> {
  const [
    commit,
    shortCommit,
    branch,
    author,
    authorEmail,
    authoredAt,
    subject,
    status,
    recentCommits,
  ] = await Promise.all([
    runGit(cwd, ['rev-parse', 'HEAD']),
    runGit(cwd, ['rev-parse', '--short', 'HEAD']),
    runGit(cwd, ['branch', '--show-current']),
    runGit(cwd, ['log', '-1', '--pretty=format:%an']),
    runGit(cwd, ['log', '-1', '--pretty=format:%ae']),
    runGit(cwd, ['log', '-1', '--date=iso-strict', '--pretty=format:%ad']),
    runGit(cwd, ['log', '-1', '--pretty=format:%s']),
    runGit(cwd, ['status', '--short']),
    runGit(cwd, ['log', '--date=short', '--pretty=format:%h%x09%ad%x09%an%x09%s', '-12']),
  ]);
  const changedFiles = status
    ? status
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
    : [];

  return {
    branch: branch ?? undefined,
    commit: commit ?? undefined,
    shortCommit: shortCommit ?? undefined,
    author: author ?? undefined,
    authorEmail: authorEmail ?? undefined,
    authoredAt: authoredAt ?? undefined,
    subject: subject ?? undefined,
    isDirty: changedFiles.length > 0,
    changedFiles,
    recentCommits: parseGitCommits(recentCommits),
  };
}

function parseGitCommits(value: string | null): GitMetadata['recentCommits'] {
  if (!value) return [];

  return value.split('\n').map((line) => {
    const [hash = '', date = '', author = '', subject = ''] = line.split('\t');
    return {
      hash,
      date,
      author,
      subject,
    };
  });
}

function runGit(cwd: string, args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    execFile('git', args, { cwd }, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }

      resolve(stdout.trim() || null);
    });
  });
}
