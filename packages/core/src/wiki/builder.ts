/**
 * Wiki builder for Peria projects
 *
 * Orchestrates wiki generation using collectors.
 * Collectors collect, pages render markdown, graph builds claims/entities,
 * llms-text builds llms.txt, builder orchestrates.
 */

import type { PeriaConfig, ResolvedPeriaConfig } from '../types/config.js';
import { defineConfig } from '../types/config.js';
import type { GitMetadata, WikiBuildResult, WikiManifest } from '../types/wiki.js';
import { collectAdapters } from './collectors/adapters.js';
import { collectCliCommands } from './collectors/cli.js';
import { collectContextFiles } from './collectors/context.js';
import { collectFeatures } from './collectors/features.js';
// Import collectors
import { collectGitMetadata } from './collectors/git.js';
import { getRecentHistory } from './collectors/history.js';
import { collectModules } from './collectors/modules.js';
import { collectPackages } from './collectors/packages.js';
import { createGraph } from './graph.js';
import { createLlmsText } from './llms-text.js';
// Import page and graph builders
import { createPages } from './pages.js';

const MANIFEST_VERSION = '0.1.0';

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

function createManifest(
  config: ResolvedPeriaConfig,
  generatedAt: string,
  git: GitMetadata,
  pages: Array<{ title: string; slug: string; description: string; path: string }>
): WikiManifest {
  return {
    title: `${config.project.name} Wiki`,
    tagline: config.project.tagline,
    generatedAt,
    periaVersion: MANIFEST_VERSION,
    manifestVersion: MANIFEST_VERSION,
    commit: git.commit ?? undefined,
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
