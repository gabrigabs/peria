/**
 * Application map - aggregated view of the generated Peria knowledge surface.
 */

import type { PeriaManifest } from './types/manifest.js';
import type { WikiBuildResult } from './types/wiki.js';

export interface ApplicationMapArea {
  name: string;
  packageName?: string;
  directory?: string;
  moduleCount: number;
  exportCount: number;
  internalDependencies: string[];
  sourceFiles: string[];
}

export interface ApplicationMapClaimStatus {
  total: number;
  sourced: number;
  unsourced: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
}

export interface ApplicationMapReleaseSignal {
  name: string;
  status: 'ready' | 'needs-attention' | 'missing';
  detail: string;
}

export interface ApplicationMapRecentChange {
  hash: string;
  date: string;
  author: string;
  subject: string;
  referencedIssues: string[];
}

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
    private: boolean;
    publishAccess?: string;
    dependencies: string[];
    exports: string[];
    bins: string[];
  }>;
  modules: Array<{
    path: string;
    packageName?: string;
    imports: string[];
    exports: string[];
  }>;
  routes: Array<{
    method: string;
    path: string;
    handler?: string;
    source: string;
  }>;
  schemas: Array<{
    name: string;
    type: string;
    source?: string;
  }>;
  openapi: Array<{
    method: string;
    path: string;
    operationId?: string;
    source: string;
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
  areas: ApplicationMapArea[];
  claimStatus: ApplicationMapClaimStatus;
  releaseSignals: ApplicationMapReleaseSignal[];
  recentChanges: ApplicationMapRecentChange[];
}

export function buildApplicationMap(
  result: WikiBuildResult,
  scannedManifest?: PeriaManifest | null
): ApplicationMap {
  const areas = buildAreas(result);
  const claimStatus = buildClaimStatus(result);
  const releaseSignals = buildReleaseSignals(result, scannedManifest);
  const recentChanges = result.git.recentCommits.map((commit) => ({
    hash: commit.hash,
    date: commit.date,
    author: commit.author,
    subject: commit.subject,
    referencedIssues: extractIssueRefs(commit.subject),
  }));

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
      routes: scannedManifest?.routes.length ?? 0,
      schemas: scannedManifest?.schemas.length ?? 0,
      commands: result.cliCommands.length,
      adapters: result.adapters.length,
      pages: result.pages.length,
      claims: result.graph.claims.length,
    },
    packages: result.packages.map((pkg) => ({
      name: pkg.name,
      directory: pkg.directory,
      private: pkg.private,
      publishAccess: pkg.publishAccess,
      dependencies: pkg.dependencies,
      exports: pkg.exports,
      bins: pkg.bins,
    })),
    modules: result.modules.map((module) => ({
      path: module.path,
      packageName: module.packageName,
      imports: module.imports,
      exports: module.exports.map((item) => item.name),
    })),
    routes: (scannedManifest?.routes ?? []).map((route) => ({
      method: route.method,
      path: route.path,
      handler: route.handler?.name,
      source: route.source.line ? `${route.source.file}:${route.source.line}` : route.source.file,
    })),
    schemas: (scannedManifest?.schemas ?? []).map((schema) => ({
      name: schema.name,
      type: schema.type,
      source: schema.file
        ? schema.line
          ? `${schema.file}:${schema.line}`
          : schema.file
        : undefined,
    })),
    openapi: (scannedManifest?.openapiOps ?? []).map((operation) => ({
      method: operation.method,
      path: operation.path,
      operationId: operation.operationId,
      source: operation.source.line
        ? `${operation.source.file}:${operation.source.line}`
        : operation.source.file,
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
    areas,
    claimStatus,
    releaseSignals,
    recentChanges,
  };
}

function buildAreas(result: WikiBuildResult): ApplicationMapArea[] {
  return result.packages.map((pkg) => {
    const modules = result.modules.filter((module) => module.packageName === pkg.name);

    return {
      name: pkg.name,
      packageName: pkg.name,
      directory: pkg.directory,
      moduleCount: modules.length,
      exportCount: modules.reduce((total, module) => total + module.exports.length, 0),
      internalDependencies: Array.from(
        new Set(
          modules
            .flatMap((module) => module.imports)
            .filter((item) => item.startsWith('@peria/') && item !== pkg.name)
        )
      ).sort(),
      sourceFiles: modules.map((module) => module.path).sort(),
    };
  });
}

function buildClaimStatus(result: WikiBuildResult): ApplicationMapClaimStatus {
  const claims = result.graph.claims;

  return {
    total: claims.length,
    sourced: claims.filter((claim) => claim.provenance.source.length > 0).length,
    unsourced: claims.filter((claim) => claim.provenance.source.length === 0).length,
    highConfidence: claims.filter((claim) => claim.confidence === 'high').length,
    mediumConfidence: claims.filter((claim) => claim.confidence === 'medium').length,
    lowConfidence: claims.filter((claim) => claim.confidence === 'low').length,
  };
}

function buildReleaseSignals(
  result: WikiBuildResult,
  scannedManifest?: PeriaManifest | null
): ApplicationMapReleaseSignal[] {
  const publicPackages = result.packages.filter((pkg) => pkg.name.startsWith('@peria/'));
  const releasablePackages = publicPackages.filter((pkg) => !pkg.private);
  const packagesWithSurface = releasablePackages.filter(
    (pkg) => pkg.exports.length > 0 || pkg.bins.length > 0
  );
  const implementedCommands = result.cliCommands.filter(
    (command) => command.status === 'implemented'
  );
  const placeholderAdapters = result.adapters.filter((adapter) => adapter.status === 'placeholder');
  const routeCount = scannedManifest?.routes.length ?? 0;
  const schemaCount = scannedManifest?.schemas.length ?? 0;
  const openapiCount = scannedManifest?.openapiOps.length ?? 0;

  return [
    {
      name: 'Public package exports',
      status:
        packagesWithSurface.length === releasablePackages.length ? 'ready' : 'needs-attention',
      detail: `${packagesWithSurface.length}/${releasablePackages.length} releasable packages expose exports or CLI bins.`,
    },
    {
      name: 'CLI command handlers',
      status:
        implementedCommands.length === result.cliCommands.length ? 'ready' : 'needs-attention',
      detail: `${implementedCommands.length}/${result.cliCommands.length} CLI commands have implemented handlers.`,
    },
    {
      name: 'Adapter placeholders',
      status: placeholderAdapters.length === 0 ? 'ready' : 'needs-attention',
      detail:
        placeholderAdapters.length === 0
          ? 'No placeholder adapters detected.'
          : `${placeholderAdapters.length} adapters still look like placeholders.`,
    },
    {
      name: 'Route coverage',
      status: routeCount > 0 ? 'ready' : 'missing',
      detail:
        routeCount > 0
          ? `${routeCount} routes are present in the latest scan manifest.`
          : 'No routes are present in the latest scan manifest.',
    },
    {
      name: 'Schema coverage',
      status: schemaCount > 0 ? 'ready' : 'missing',
      detail:
        schemaCount > 0
          ? `${schemaCount} schemas are present in the latest scan manifest.`
          : 'No schemas are present in the latest scan manifest.',
    },
    {
      name: 'OpenAPI coverage',
      status: openapiCount > 0 ? 'ready' : 'missing',
      detail:
        openapiCount > 0
          ? `${openapiCount} OpenAPI operations are present in the latest scan manifest.`
          : 'No OpenAPI operations are present in the latest scan manifest.',
    },
  ];
}

function extractIssueRefs(subject: string): string[] {
  const matches = subject.match(/#\d+/g);
  return matches ? Array.from(new Set(matches)) : [];
}
