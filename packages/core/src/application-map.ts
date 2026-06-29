/**
 * Application map - aggregated view of the generated Peria knowledge surface.
 */

import type { WikiBuildResult } from './types/wiki.js';

export interface ApplicationMap {
  version: string;
  generatedAt: string;
  project: {
    name: string;
    framework: string;
    entrypoint: string;
  };
  summary: {
    packages: number;
    modules: number;
    routes: number;
    schemas: number;
    commands: number;
    adapters: number;
    pages: number;
    claims: number;
  };
  packages: Array<{
    name: string;
    directory: string;
    dependencies: string[];
    exports: string[];
  }>;
  modules: Array<{
    path: string;
    packageName?: string;
    imports: string[];
    exports: string[];
  }>;
  entrypoints: {
    cli: string[];
    adapters: string[];
  };
  docs: {
    outputDir: string;
    route: string;
    renderer: string;
    pages: Array<{
      title: string;
      slug: string;
      path: string;
    }>;
  };
  git: {
    branch?: string;
    commit?: string;
    isDirty: boolean;
    changedFiles: string[];
  };
}

export function buildApplicationMap(result: WikiBuildResult): ApplicationMap {
  return {
    version: result.manifest.periaVersion,
    generatedAt: result.generatedAt,
    project: {
      name: result.config.project.name,
      framework: result.config.framework,
      entrypoint: result.config.entrypoint,
    },
    summary: {
      packages: result.packages.length,
      modules: result.modules.length,
      routes: 0,
      schemas: 0,
      commands: result.cliCommands.length,
      adapters: result.adapters.length,
      pages: result.pages.length,
      claims: result.graph.claims.length,
    },
    packages: result.packages.map((pkg) => ({
      name: pkg.name,
      directory: pkg.directory,
      dependencies: pkg.dependencies,
      exports: pkg.exports,
    })),
    modules: result.modules.map((module) => ({
      path: module.path,
      packageName: module.packageName,
      imports: module.imports,
      exports: module.exports.map((item) => item.name),
    })),
    entrypoints: {
      cli: result.cliCommands.map((command) => command.name),
      adapters: result.adapters.map((adapter) => adapter.name),
    },
    docs: {
      outputDir: result.config.docs.outputDir,
      route: result.config.docs.route,
      renderer: result.config.docs.renderer,
      pages: result.manifest.pages.map((page) => ({
        title: page.title,
        slug: page.slug,
        path: page.path,
      })),
    },
    git: {
      branch: result.git.branch,
      commit: result.git.commit,
      isDirty: result.git.isDirty,
      changedFiles: result.git.changedFiles,
    },
  };
}
