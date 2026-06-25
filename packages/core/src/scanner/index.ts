/**
 * Scanner - Main Entry Point
 *
 * Orchestrates all parsers to scan a repository and produce a PeriaManifest.
 * Scanner collects facts; artifact generation is handled elsewhere.
 */

import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { nestJSAdapter } from '../adapters/nestjs/index.js';
import { loadConfig } from '../config/loader.js';
import {
  matchRoutesToOpenAPI,
  type RouteOpenAPIMatch,
  summarizeMatching,
} from '../matcher/index.js';
import { parseLlms } from '../parsers/llms.js';
import { parseMarkdown } from '../parsers/markdown.js';
import { parseOpenAPI, parseOpenAPIDetailed } from '../parsers/openapi.js';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type {
  DocPageEntity,
  GraphRelation,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
} from '../types/graph.js';
import type {
  DocsMetadata,
  FrameworkMetadata,
  GitMetadata,
  LlmsMetadata,
  OpenAPIMetadata,
  PeriaManifest,
  RepoInfo,
  ScanResult,
  ScanWarning,
} from '../types/manifest.js';

// Re-export scanner modules
export * from './packages.js';
export * from './source-files.js';
export * from './openapi.js';
export * from './markdown.js';
export * from './llms.js';
export * from './git.js';
export * from './framework.js';
export * from './relations.js';
export * from './manifest.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.eria',
  '.next',
  'coverage',
]);

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const TYPESCRIPT_EXTENSIONS = new Set(['.ts', '.tsx']);

/**
 * Resolve a path to absolute, handling relative paths
 */
function resolveAbsolutePath(cwd: string): string {
  if (isAbsolute(cwd)) {
    return cwd;
  }
  return resolve(cwd);
}

/**
 * Find files matching pattern
 */
export async function findFiles(cwd: string, pattern: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name)) {
          await walk(join(dir, entry.name));
        }
        continue;
      }

      if (entry.name === pattern) {
        files.push(relative(cwd, join(dir, entry.name)));
      }
    }
  }

  await walk(cwd);
  return files;
}

/**
 * Run a git command
 */
export function runGit(cwd: string, args: string[]): Promise<string | null> {
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

/**
 * Scan a repository and produce a PeriaManifest
 */
export async function scan(cwd: string): Promise<ScanResult> {
  const startTime = performance.now();
  const warnings: ScanWarning[] = [];

  // Resolve to absolute path for consistent behavior
  const absoluteCwd = resolveAbsolutePath(cwd);

  // Load config
  const config = await loadConfig(absoluteCwd).catch((err) => {
    warnings.push({
      code: 'config-error',
      message: `Failed to load config: ${err instanceof Error ? err.message : String(err)}`,
      suggestion: 'Using default configuration',
    });
    return null;
  });

  const resolvedConfig: ResolvedPeriaConfig = (config ??
    createDefaultConfig()) as ResolvedPeriaConfig;

  // Get repo info
  const repoInfo = await getRepoInfo(absoluteCwd);
  const gitMetadata = await collectGitMetadata(absoluteCwd);

  // Scan in parallel where possible
  const [packages, sourceFiles, openapiResults, docsResults, llmsResult] = await Promise.all([
    scanPackages(absoluteCwd),
    scanSourceFiles(absoluteCwd, resolvedConfig),
    scanOpenAPI(absoluteCwd, resolvedConfig, warnings),
    scanDocs(absoluteCwd, resolvedConfig, warnings),
    scanLlms(absoluteCwd, resolvedConfig, warnings),
  ]);

  // Extract routes and schemas using framework adapter (Phase 2)
  const detectedFramework = await detectFramework(absoluteCwd, resolvedConfig);
  const hasTsConfig = await checkTsConfig(absoluteCwd);
  const isNestJS = detectedFramework?.name === 'nestjs' && hasTsConfig;

  let routes: RouteEntity[] = [];
  let frameworkSchemas: SchemaEntity[] = [];

  if (isNestJS) {
    const context = { cwd: absoluteCwd, config: resolvedConfig };

    // Extract routes
    try {
      routes = await nestJSAdapter.extractRoutes(context);
    } catch (err) {
      warnings.push({
        code: 'route-extraction-error',
        message: `Failed to extract routes: ${err instanceof Error ? err.message : String(err)}`,
        suggestion: 'Check that the project has valid TypeScript files and tsconfig.json',
      });
    }

    // Extract schemas (optional)
    try {
      const extractAdapterSchemas = nestJSAdapter.extractSchemas;
      if (extractAdapterSchemas) {
        frameworkSchemas = await extractAdapterSchemas(context);
      }
    } catch {
      warnings.push({
        code: 'schema-extraction-skipped',
        message: 'Framework schema extraction was skipped (optional)',
      });
    }
  }

  const schemas = [...extractSchemasFromOpenAPI(openapiResults), ...frameworkSchemas];
  const openapiOps = openapiResults.flatMap((r) => r.operations);
  const docsPages = docsResults.map((r) => docToEntity(r.path, r.content));

  // Phase 3: Match routes to OpenAPI operations
  let matchingResult = null;
  if (routes.length > 0 && openapiOps.length > 0) {
    try {
      matchingResult = await matchRoutesToOpenAPI(routes, openapiOps);

      // Log matching summary if there are unmatched
      if (
        matchingResult.stats.unmatchedRoutes > 0 ||
        matchingResult.stats.unmatchedOperations > 0
      ) {
        warnings.push({
          code: 'openapi-mismatch',
          message: `OpenAPI matching: ${matchingResult.stats.unmatchedRoutes} routes without spec, ${matchingResult.stats.unmatchedOperations} operations without routes`,
          suggestion: summarizeMatching(matchingResult),
        });
      }
    } catch (err) {
      warnings.push({
        code: 'openapi-matching-error',
        message: `Failed to match routes to OpenAPI: ${err instanceof Error ? err.message : String(err)}`,
      });
    }
  }

  // Create relations
  const relations = createRelations({
    routes,
    schemas,
    openapiOps,
    docsPages,
    packages,
    sourceFiles,
  });

  // Build manifest
  const endTime = performance.now();
  const manifest: PeriaManifest = {
    manifestVersion: '0.1.0',
    periaVersion: '0.1.0',
    generatedAt: new Date().toISOString(),

    repo: repoInfo,
    framework: detectedFramework,
    openapi: buildOpenAPIMetadata(openapiResults),
    docs: buildDocsMetadata(docsResults),
    llms: buildLlmsMetadata(llmsResult),

    routes,
    schemas,
    openapiOps,
    docsPages,
    sourceFiles,
    packages,
    agentContext: [],

    relations,

    git: gitMetadata,

    drift: [],

    stats: {
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      durationMs: Math.round(endTime - startTime),
      filesScanned: sourceFiles.length + docsResults.length,
      packagesScanned: packages.length,
    },
  };

  return { manifest, warnings };
}

/**
 * Create default configuration
 */
function createDefaultConfig(): ResolvedPeriaConfig {
  return {
    framework: 'other' as const,
    entrypoint: 'src/index.ts',
    project: {
      name: basename(process.cwd()),
      tagline: 'A Peria-powered project',
      description: '',
      audience: 'Developers',
      tone: 'Technical',
      problem: '',
      currentFocus: '',
      highlights: [],
      packageContexts: {},
    },
    docs: {
      enabled: true,
      route: '/docs',
      outputDir: 'docs',
    },
    sources: {
      openapi: 'openapi.yaml',
      markdown: ['**/*.md'],
      llms: ['llms.txt'],
      context: ['CLAUDE.md', 'AGENTS.md'],
    },
    features: {
      embeddedDocs: true,
      codeMap: true,
      wiki: true,
      llms: true,
      driftCheck: true,
      apiReference: true,
      contextPacks: false,
      mermaid: false,
      embeddedDocsAdapters: false,
      gitDiff: false,
      changeMap: false,
      patchNotes: false,
      github: false,
    },
  };
}

/**
 * Get repository information
 */
async function getRepoInfo(cwd: string): Promise<RepoInfo> {
  const [commit, branch, status] = await Promise.all([
    runGit(cwd, ['rev-parse', 'HEAD']),
    runGit(cwd, ['branch', '--show-current']),
    runGit(cwd, ['status', '--porcelain']),
  ]);

  return {
    name: basename(cwd),
    root: cwd,
    commit: commit || 'unknown',
    branch: branch || 'unknown',
    isDirty: (status?.trim().length ?? 0) > 0,
  };
}

/**
 * Check if tsconfig.json exists
 */
async function checkTsConfig(cwd: string): Promise<boolean> {
  const tsConfigPaths = [
    join(cwd, 'tsconfig.json'),
    join(cwd, 'tsconfig.build.json'),
    join(cwd, 'apps', 'api', 'tsconfig.json'),
  ];

  for (const path of tsConfigPaths) {
    try {
      await stat(path);
      return true;
    } catch {
      // Try next
    }
  }
  return false;
}

/**
 * Write manifest to file
 */
export async function writeManifest(cwd: string, manifest: PeriaManifest): Promise<string> {
  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}
