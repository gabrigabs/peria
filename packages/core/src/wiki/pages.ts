/**
 * Wiki Pages - Creates wiki pages from collected data
 */

import type { ResolvedPeriaConfig } from '../types/config.js';
import type {
  AdapterSummary,
  CliCommandSummary,
  ContextFileSummary,
  FeatureSummary,
  GitMetadata,
  ModuleSummary,
  PackageSummary,
  WikiPage,
} from '../types/wiki.js';

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
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

function docLink(config: ResolvedPeriaConfig, slug: string, label: string): string {
  const baseRoute = config.docs.route.replace(/\/+$/g, '');
  return `[${label}](${baseRoute}/${slug})`;
}

export function createPage(
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

export function createPages(input: {
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
      'Fumadocs Output',
      'Fumadocs-compatible documentation generated into /docs and backed by markdown pages.',
      renderWikiUi(input.config),
      ['packages/renderer/src/index.ts', 'packages/cli/src/commands/build.ts']
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
    `- Framework: \`${input.config.framework}\``,
    `- Primary entrypoint: \`${input.config.entrypoint}\``,
    `- Packages documented: ${input.packages.length}`,
    `- TypeScript modules mapped: ${input.modules.length}`,
    `- CLI commands documented: ${input.cliCommands.length} (${implementedCommands} implemented handlers)`,
    `- Adapters documented: ${input.adapters.length} (${placeholderAdapters} placeholders)`,
    `- Feature flags documented: ${input.features.length}`,
    `- Known gaps: ${docLink(input.config, 'known-gaps', 'Known Gaps')}`,
    '',
    '## Wiki Tree Pattern',
    '',
    'The generated markdown is the canonical knowledge layer. The visual site reads these markdown files, and `llms.txt` points agents back to the same pages instead of maintaining a separate AI-only truth.',
    '',
    '## How To Use This Wiki',
    '',
    `- Start with ${docLink(input.config, 'packages', 'Packages')} and ${docLink(input.config, 'cli', 'CLI Commands')} to understand the public surface.`,
    `- Read ${docLink(input.config, 'modules', 'TypeScript Modules')} and ${docLink(input.config, 'adapters', 'Adapters')} when changing code paths.`,
    `- Use ${docLink(input.config, 'diagrams', 'Diagrams')} for package and module relationships generated by Mermaid.`,
    `- Use ${docLink(input.config, 'application-map', 'Application Map')} for the aggregate package/module/docs/Git view.`,
    `- Read ${docLink(input.config, 'configuration', 'Configuration And Features')} before changing defaults.`,
    `- Read ${docLink(input.config, 'history', 'History')} to connect generated claims to branch, author, commit, and working-tree state.`,
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
      `- Publish status: ${pkg.private ? 'private/deferred' : (pkg.publishAccess ?? 'public/default')}`,
      `- Scripts: ${
        Object.keys(pkg.scripts)
          .map((script) => `\`${script}\``)
          .join(', ') || 'none'
      }`,
      `- Package exports: ${pkg.exports.map((item) => `\`${item}\``).join(', ') || 'none'}`,
      `- CLI bins: ${pkg.bins.map((item) => `\`${item}\``).join(', ') || 'none'}`,
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

function getInternalPackageImports(packageName: string, modules: ModuleSummary[]): string[] {
  return unique(
    modules
      .filter((module) => module.packageName === packageName)
      .flatMap((module) => module.imports)
      .filter((item) => item.startsWith('@peria/') && item !== packageName)
  ).sort();
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
    '# Fumadocs Output',
    '',
    `The generated wiki is written into \`${config.docs.outputDir}\` as source-backed markdown plus Fumadocs-compatible MDX content.`,
    '',
    '## Contract',
    '',
    '- Markdown pages remain the source of truth.',
    '- `content/docs/**/*.mdx` contains the Fumadocs-compatible page content.',
    '- `content/docs/meta.json` carries sidebar ordering from the wiki manifest.',
    '- The bundled `@peria/renderer` preview app owns `source.config.ts` and the Fumadocs loader bridge.',
    '- `search-index.json` provides a compact index of page titles, headings, URLs, and source paths.',
    '- `wiki-manifest.json` remains the Peria-owned page registry for agents and tooling.',
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
