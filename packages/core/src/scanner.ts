/**
 * Peria Repository Scanner
 *
 * Orchestrates all parsers to scan a repository and produce a PeriaManifest.
 */

import { execFile } from 'node:child_process';
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { basename, extname, isAbsolute, join, relative, resolve } from 'node:path';
import { nestJSAdapter } from './adapters/nestjs/index.js';
import { loadConfig } from './config/loader.js';
import { parseLlms } from './parsers/llms.js';
import { parseMarkdown } from './parsers/markdown.js';
import { parseOpenAPI, parseOpenAPIDetailed } from './parsers/openapi.js';
import type { ResolvedPeriaConfig } from './types/config.js';
import type {
  DocPageEntity,
  GraphRelation,
  OpenAPIOperation,
  PackageEntity,
  RouteEntity,
  SchemaEntity,
  SourceFile,
} from './types/graph.js';
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
} from './types/manifest.js';

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
      apiReference: false,
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
 * Scan package.json files
 */
async function scanPackages(cwd: string): Promise<PackageEntity[]> {
  const packages: PackageEntity[] = [];
  const packageFiles = await findFiles(cwd, 'package.json');

  for (const file of packageFiles) {
    try {
      const content = await readFile(join(cwd, file), 'utf-8');
      const pkg = JSON.parse(content);

      if (!pkg.name) continue;

      packages.push({
        id: `package:${pkg.name}`,
        name: pkg.name,
        version: pkg.version,
        directory: file.replace('/package.json', ''),
        manifestPath: file,
        description: pkg.description,
        scripts: pkg.scripts,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        exports: extractExports(pkg.exports),
        types: pkg.types,
        source: { file, commit: undefined },
        confidence: 'high',
      });
    } catch {
      // Skip invalid package.json
    }
  }

  return packages;
}

/**
 * Extract export keys from package.json
 */
function extractExports(exports: unknown): string[] {
  if (!exports) return [];
  if (Array.isArray(exports)) return exports;
  if (typeof exports === 'object') return Object.keys(exports);
  return [];
}

/**
 * Scan TypeScript source files
 */
async function scanSourceFiles(cwd: string, _config: ResolvedPeriaConfig): Promise<SourceFile[]> {
  const files: SourceFile[] = [];
  const tsFiles = await findTypeScriptFiles(cwd);

  for (const file of tsFiles) {
    const fullPath = join(cwd, file);

    try {
      const content = await readFile(fullPath, 'utf-8');

      files.push({
        id: `file:${file}`,
        path: file,
        module: file,
        imports: extractImports(content),
        source: { file, commit: undefined },
        confidence: 'high',
      });
    } catch {
      // Skip files we can't read
    }
  }

  return files;
}

/**
 * Extract imports from content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  const matches = content.matchAll(/import\s+.*?from\s+['"]([^'"]+)['"]/g);

  for (const match of matches) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('@peria/')) {
      imports.push(specifier);
    }
  }

  return imports;
}

/**
 * Find all TypeScript files
 */
async function findTypeScriptFiles(cwd: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(join(dir, entry.name));
        }
        continue;
      }

      const ext = extname(entry.name);
      if (TYPESCRIPT_EXTENSIONS.has(ext) && !entry.name.endsWith('.d.ts')) {
        files.push(relative(cwd, join(dir, entry.name)));
      }
    }
  }

  await walk(cwd);
  return files;
}

/**
 * Scan OpenAPI specifications
 */
async function scanOpenAPI(
  cwd: string,
  config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<
  Array<{
    path: string;
    spec: Awaited<ReturnType<typeof parseOpenAPI>>;
    operations: OpenAPIOperation[];
  }>
> {
  const results = [];
  const openapiPaths = config.sources?.openapi ? [config.sources.openapi] : [];

  for (const openapiPath of openapiPaths) {
    const fullPath = join(cwd, openapiPath);

    try {
      await stat(fullPath);
    } catch {
      warnings.push({
        code: 'openapi-not-found',
        message: `OpenAPI spec not found: ${openapiPath}`,
        suggestion: 'Check your config.sources.openapi path',
      });
      continue;
    }

    try {
      const spec = await parseOpenAPI(fullPath);
      const { operations } = await parseOpenAPIDetailed(fullPath);
      results.push({ path: openapiPath, spec, operations });
    } catch (err) {
      warnings.push({
        code: 'openapi-parse-error',
        message: `Failed to parse OpenAPI: ${err instanceof Error ? err.message : String(err)}`,
        file: openapiPath,
      });
    }
  }

  return results;
}

/**
 * Scan documentation files
 */
async function scanDocs(
  cwd: string,
  _config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<Array<{ path: string; content: Awaited<ReturnType<typeof parseMarkdown>> }>> {
  const results = [];
  const docPaths = await findMarkdownFiles(cwd);

  for (const docPath of docPaths) {
    const fullPath = join(cwd, docPath);

    try {
      const content = await readFile(fullPath, 'utf-8');
      const parsed = await parseMarkdown(docPath, content);
      results.push({ path: docPath, content: parsed });
    } catch (err) {
      warnings.push({
        code: 'doc-parse-error',
        message: `Failed to parse markdown: ${err instanceof Error ? err.message : String(err)}`,
        file: docPath,
      });
    }
  }

  return results;
}

/**
 * Find markdown files matching patterns
 */
async function findMarkdownFiles(cwd: string): Promise<string[]> {
  const files: string[] = [];
  const seen = new Set<string>();

  async function walk(dir: string): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRECTORIES.has(entry.name) && !entry.name.startsWith('.')) {
          await walk(join(dir, entry.name));
        }
        continue;
      }

      const ext = extname(entry.name);
      if (MARKDOWN_EXTENSIONS.has(ext)) {
        const relPath = relative(cwd, join(dir, entry.name));
        if (!seen.has(relPath)) {
          seen.add(relPath);
          files.push(relPath);
        }
      }
    }
  }

  await walk(cwd);
  return files;
}

/**
 * Scan llms.txt
 */
async function scanLlms(
  cwd: string,
  config: ResolvedPeriaConfig,
  warnings: ScanWarning[]
): Promise<Awaited<ReturnType<typeof parseLlms>>> {
  const llmsPaths = config.sources?.llms || ['llms.txt'];

  for (const llmsPath of llmsPaths) {
    const fullPath = join(cwd, llmsPath);

    try {
      await stat(fullPath);
      return await parseLlms(fullPath);
    } catch {
      // Try next path
    }
  }

  warnings.push({
    code: 'llms-not-found',
    message: 'No llms.txt found',
    suggestion: 'Run `peria build` to generate llms.txt',
  });

  return {
    id: 'llms:unknown',
    type: 'llms',
    path: '',
    content: '',
    variant: 'unknown',
    metadata: {
      exists: false,
      pageCount: 0,
      sectionCount: 0,
      hasUrls: false,
      filePaths: [],
      lineCount: 0,
      variant: 'unknown',
    },
  };
}

/**
 * Extract schemas from OpenAPI spec
 */
function extractSchemasFromOpenAPI(
  openapiResults: Array<{ operations: OpenAPIOperation[] }>
): SchemaEntity[] {
  const schemas: SchemaEntity[] = [];

  for (const { operations } of openapiResults) {
    for (const op of operations) {
      // Extract from request body
      if (op.requestBody?.schema) {
        schemas.push({
          id: `schema:${op.requestBody.schema}`,
          name: op.requestBody.schema,
          type: 'request',
          openapiRef: `#/components/schemas/${op.requestBody.schema}`,
        });
      }

      // Extract from responses
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

      // Extract from parameters
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
 * Create doc page entity
 */
function docToEntity(
  path: string,
  parsed: Awaited<ReturnType<typeof parseMarkdown>>
): DocPageEntity {
  const frontmatter = parsed.frontmatter as { title?: string } | undefined;

  return {
    id: `doc:${path}`,
    title: frontmatter?.title || basename(path, '.md'),
    path,
    headings: parsed.headings || [],
    routeMentions:
      (parsed.metadata as { routeMentions?: DocPageEntity['routeMentions'] })?.routeMentions || [],
    schemaRefs: (parsed.metadata as { schemaRefs?: DocPageEntity['schemaRefs'] })?.schemaRefs || [],
    sourceRefs:
      (parsed.metadata as { sourceLinks?: DocPageEntity['sourceRefs'] })?.sourceLinks || [],
    content: parsed.content,
    source: { file: path, commit: undefined },
    confidence: 'high',
  };
}

/**
 * Create relations between entities
 */
function createRelations(input: {
  routes: RouteEntity[];
  schemas: SchemaEntity[];
  openapiOps: OpenAPIOperation[];
  docsPages: DocPageEntity[];
  packages: PackageEntity[];
  sourceFiles: SourceFile[];
}): GraphRelation[] {
  const relations: GraphRelation[] = [];
  let relationId = 0;

  // Link schemas to OpenAPI operations
  for (const schema of input.schemas) {
    for (const op of input.openapiOps) {
      // Request schema -> operation
      if (op.requestBody?.schema === schema.name) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: schema.id,
          targetId: op.id,
          type: 'schema_referenced_by_openapi',
          confidence: 'high',
          reason: `Schema ${schema.name} is used in request body of ${op.method} ${op.path}`,
        });
      }

      // Response schema -> operation
      for (const response of op.responses || []) {
        if (response.schema === schema.name) {
          relations.push({
            id: `rel:${relationId++}`,
            sourceId: schema.id,
            targetId: op.id,
            type: 'schema_referenced_by_openapi',
            confidence: 'high',
            reason: `Schema ${schema.name} is used in response ${response.statusCode} of ${op.method} ${op.path}`,
          });
        }
      }
    }
  }

  // Link docs to routes (via route mentions)
  for (const doc of input.docsPages) {
    for (const mention of doc.routeMentions) {
      relations.push({
        id: `rel:${relationId++}`,
        sourceId: doc.id,
        targetId: `route:${mention.method || 'ANY'}:${mention.path}`,
        type: 'doc_page_references_route',
        confidence: 'medium',
        reason: `Doc page mentions ${mention.method || ''} ${mention.path}`,
      });
    }
  }

  // Link packages to modules
  for (const pkg of input.packages) {
    for (const file of input.sourceFiles) {
      if (file.path.startsWith(pkg.directory)) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: pkg.id,
          targetId: file.id,
          type: 'package_exports_module',
          confidence: 'high',
          reason: `File ${file.path} belongs to package ${pkg.name}`,
        });
      }
    }
  }

  // Link routes to handlers (from framework adapter extraction)
  for (const route of input.routes) {
    if (route.handler) {
      relations.push({
        id: `rel:${relationId++}`,
        sourceId: route.id,
        targetId: route.handler.id,
        type: 'route_implemented_by_handler',
        confidence: route.confidence,
        reason: `Route ${route.method} ${route.path} is implemented by ${route.handler.className}.${route.handler.name}`,
        evidence: [{ file: route.source.file, line: route.source.line }],
      });

      // Link schemas used by handler
      for (const schema of route.schemas) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: route.handler.id,
          targetId: schema.id,
          type: 'handler_uses_schema',
          confidence: route.confidence,
          reason: `Handler ${route.handler.name} uses schema ${schema.name}`,
        });
      }
    }
  }

  // Link routes to OpenAPI operations (when path and method match)
  for (const route of input.routes) {
    for (const op of input.openapiOps) {
      if (route.path === op.path && route.method === op.method) {
        relations.push({
          id: `rel:${relationId++}`,
          sourceId: route.id,
          targetId: op.id,
          type: 'route_described_by_openapi',
          confidence: 'high',
          reason: `Route ${route.method} ${route.path} matches OpenAPI operation ${op.operationId || op.id}`,
        });
      }
    }
  }

  return relations;
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
 * Detect framework
 */
async function detectFramework(
  cwd: string,
  config: ResolvedPeriaConfig
): Promise<FrameworkMetadata | undefined> {
  // Check package.json for framework dependencies
  const pkgPath = join(cwd, 'package.json');
  try {
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const frameworks: Array<[string, string[]]> = [
      ['nestjs', ['@nestjs/core']],
      ['express', ['express']],
      ['fastify', ['fastify']],
      ['hono', ['hono']],
      ['elysia', ['elysia']],
    ];

    for (const [name, packages] of frameworks) {
      for (const p of packages) {
        if (deps[p]) {
          return {
            name: name as FrameworkMetadata['name'],
            confidence: 'high',
            entrypoint: config.entrypoint,
            evidence: [`Found ${p} in dependencies`],
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  return {
    name: 'other',
    confidence: 'low',
    evidence: ['No framework detected from package.json'],
  };
}

/**
 * Build OpenAPI metadata
 */
function buildOpenAPIMetadata(
  results: Array<{
    path: string;
    spec: {
      version?: string;
      metadata?: { title?: string; description?: string; paths?: string[]; schemas?: string[] };
    };
    operations: OpenAPIOperation[];
  }>
): OpenAPIMetadata | undefined {
  if (results.length === 0) return undefined;

  const first = results[0];
  return {
    path: first.path,
    version: first.spec.version,
    title: first.spec.metadata?.title,
    description: first.spec.metadata?.description,
    paths: first.spec.metadata?.paths || [],
    schemas: first.spec.metadata?.schemas || [],
    operationsCount: first.operations.length,
    confidence: 'high',
  };
}

/**
 * Build docs metadata
 */
function buildDocsMetadata(
  results: Array<{
    path: string;
    content: {
      headings?: unknown[];
      metadata?: { routeMentions?: unknown[]; schemaRefs?: unknown[] };
    };
  }>
): DocsMetadata {
  return {
    paths: results.map((r) => r.path),
    pagesCount: results.length,
    totalHeadings: results.reduce((sum, r) => sum + (r.content.headings?.length || 0), 0),
    totalRouteMentions: results.reduce(
      (sum, r) => sum + (r.content.metadata?.routeMentions?.length || 0),
      0
    ),
    totalSchemaRefs: results.reduce(
      (sum, r) => sum + (r.content.metadata?.schemaRefs?.length || 0),
      0
    ),
  };
}

/**
 * Build llms metadata
 */
function buildLlmsMetadata(result: Awaited<ReturnType<typeof parseLlms>>): LlmsMetadata {
  const metadata = result.metadata as { pageCount?: number; exists?: boolean } | undefined;
  return {
    path: result.path,
    variant: result.variant === 'unknown' ? 'summary' : result.variant,
    pageCount: metadata?.pageCount || 0,
    exists: metadata?.exists ?? false,
  };
}

/**
 * Run a git command
 */
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

/**
 * Find files matching pattern
 */
async function findFiles(cwd: string, pattern: string): Promise<string[]> {
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
 * Write manifest to file
 */
export async function writeManifest(cwd: string, manifest: PeriaManifest): Promise<string> {
  const manifestDir = join(cwd, '.peria');
  await mkdir(manifestDir, { recursive: true });

  const manifestPath = join(manifestDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));

  return manifestPath;
}
