/**
 * Scanner - Main Entry Point
 *
 * Orchestrates all parsers to scan a repository and produce a PeriaManifest.
 * Scanner collects facts; artifact generation is handled elsewhere.
 */

import { execFile } from 'node:child_process';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import { basename, isAbsolute, join, relative, resolve } from 'node:path';
import { nestJSAdapter } from '../adapters/nestjs/index.js';
import { loadConfig } from '../config/loader.js';
import { matchRoutesToOpenAPI, summarizeMatching } from '../matcher/index.js';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { OpenAPIOperation, RouteEntity, SchemaEntity } from '../types/graph.js';
import type {
  GitMetadata,
  PeriaManifest,
  RepoInfo,
  ScanResult,
  ScanWarning,
} from '../types/manifest.js';
import { checkTsConfig, detectFramework } from './framework.js';
import { scanLlms } from './llms.js';
import { buildDocsMetadata, buildLlmsMetadata, buildOpenAPIMetadata } from './manifest.js';
import { docToEntity, scanDocs } from './markdown.js';
import { scanOpenAPI } from './openapi.js';
import { scanPackages } from './packages.js';
import { createRelations } from './relations.js';
import { scanSourceFiles } from './source-files.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.eria',
  '.next',
  'coverage',
]);

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
 * Collect Git metadata
 */
async function collectGitMetadata(cwd: string): Promise<GitMetadata> {
  const [lastCommit, shortCommit, branch, status, recentCommits] = await Promise.all([
    runGit(cwd, ['rev-parse', 'HEAD']),
    runGit(cwd, ['rev-parse', '--short', 'HEAD']),
    runGit(cwd, ['branch', '--show-current']),
    runGit(cwd, ['status', '--short']),
    runGit(cwd, ['log', '--oneline', '-20']),
  ]);

  const changedFiles = (status || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => line.slice(3));

  const recentChanges = (recentCommits || '')
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [hash, ...subjectParts] = line.split(' ');
      return {
        id: hash,
        path: '',
        type: 'modified' as const,
        commit: hash,
        subject: subjectParts.join(' '),
      };
    });

  return {
    lastCommit: lastCommit || 'unknown',
    shortCommit: shortCommit || 'unknown',
    branch: branch || 'unknown',
    isDirty: changedFiles.length > 0,
    changedFiles,
    recentChanges,
  };
}

/**
 * Extract schemas from OpenAPI results
 */
function extractSchemasFromOpenAPI(
  openapiResults: Array<{ operations: OpenAPIOperation[] }>
): SchemaEntity[] {
  const schemas: SchemaEntity[] = [];

  for (const { operations } of openapiResults) {
    for (const op of operations) {
      if (op.requestBody?.schema) {
        schemas.push({
          id: `schema:${op.requestBody.schema}`,
          name: op.requestBody.schema,
          type: 'request',
          openapiRef: `#/components/schemas/${op.requestBody.schema}`,
        });
      }

      for (const response of op.responses || []) {
        if (response.schema) {
          schemas.push({
            id: `schema:${response.schema}`,
            name: response.schema,
            type: 'response',
            openapiRef: `#/components/schemas/${response.schema}`,
          });
        }
      }

      for (const param of op.parameters || []) {
        if (param.schema) {
          schemas.push({
            id: `param:${op.id}:${param.name}`,
            name: param.name,
            type: 'parameter',
            description: param.description,
          });
        }
      }
    }
  }

  return schemas;
}

/**
 * Scan a repository and produce a PeriaManifest
 */
export async function scan(cwd: string): Promise<ScanResult> {
  const startTime = performance.now();
  const warnings: ScanWarning[] = [];

  const absoluteCwd = resolveAbsolutePath(cwd);

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

  const repoInfo = await getRepoInfo(absoluteCwd);
  const gitMetadata = await collectGitMetadata(absoluteCwd);

  const [packages, sourceFiles, openapiResults, docsResults, llmsResult] = await Promise.all([
    scanPackages(absoluteCwd),
    scanSourceFiles(absoluteCwd, resolvedConfig),
    scanOpenAPI(absoluteCwd, resolvedConfig, warnings),
    scanDocs(absoluteCwd, resolvedConfig, warnings),
    scanLlms(absoluteCwd, resolvedConfig, warnings),
  ]);

  const detectedFramework = await detectFramework(absoluteCwd, resolvedConfig);
  const hasTsConfig = await checkTsConfig(absoluteCwd);
  const isNestJS = detectedFramework?.name === 'nestjs' && hasTsConfig;

  let routes: RouteEntity[] = [];
  let frameworkSchemas: SchemaEntity[] = [];

  if (isNestJS) {
    const context = { cwd: absoluteCwd, config: resolvedConfig };

    try {
      routes = await nestJSAdapter.extractRoutes(context);
    } catch (err) {
      warnings.push({
        code: 'route-extraction-error',
        message: `Failed to extract routes: ${err instanceof Error ? err.message : String(err)}`,
        suggestion: 'Check that the project has valid TypeScript files and tsconfig.json',
      });
    }

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

  if (routes.length > 0 && openapiOps.length > 0) {
    try {
      const matchingResult = await matchRoutesToOpenAPI(routes, openapiOps);

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

  const relations = createRelations({
    routes,
    schemas,
    openapiOps,
    docsPages,
    packages,
    sourceFiles,
  });

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

export async function writeManifest(cwd: string, manifest: PeriaManifest): Promise<string> {
  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}
