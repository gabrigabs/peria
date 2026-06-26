/**
 * Context Pack Generator
 *
 * Main orchestrator for generating agent context packs.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PeriaManifest } from '../types/manifest.js';
import { generateDiffContext } from './diff-context.js';
import { generatePackageContext } from './package-context.js';
import { generateRouteContext } from './route-context.js';
import { generateTaskContext } from './task-context.js';
import type {
  ContextPack,
  ContextPackOptions,
  ContextPackResult,
  ContextVariant,
  FullContextPack,
  TaskType,
} from './types.js';

/**
 * Default output directory for context packs
 */
const DEFAULT_OUTPUT_DIR = '.peria/context';

/**
 * Generate all context packs from a manifest
 */
export async function generateContextPacks(
  manifest: PeriaManifest,
  options: ContextPackOptions
): Promise<ContextPackResult> {
  const outputDir = options.outputDir ?? join(options.cwd, DEFAULT_OUTPUT_DIR);
  const packs: ContextPack[] = [];

  // Build OpenAPI operation lookup
  const openapiOpMap = new Map<string, (typeof manifest.openapiOps)[0]>();
  if (manifest.openapiOps) {
    for (const op of manifest.openapiOps) {
      const key = `${op.method}:${op.path}`.toLowerCase();
      openapiOpMap.set(key, op);
    }
  }

  // Generate route context packs
  if (manifest.routes) {
    for (const route of manifest.routes) {
      const openapiKey = `${route.method}:${route.path}`.toLowerCase();
      const openapiOp = openapiOpMap.get(openapiKey);

      const routePack = generateRouteContext(route, {
        ...options,
        openapiOp,
      });

      packs.push(routePack);
    }
  }

  // Generate package context packs
  if (manifest.packages) {
    for (const pkg of manifest.packages) {
      const pkgPack = generatePackageContext(pkg, options);
      packs.push(pkgPack);
    }
  }

  // Generate task context packs
  const taskTypes: TaskType[] = ['add-route', 'add-schema', 'add-package', 'fix-drift'];

  for (const taskType of taskTypes) {
    const taskPack = generateTaskContext(taskType, {
      ...options,
      relevantRoutes: manifest.routes?.slice(0, 5) ?? [],
      relevantPackages: manifest.packages?.slice(0, 5) ?? [],
      relevantSchemas: manifest.schemas?.slice(0, 5) ?? [],
    });

    packs.push(taskPack);
  }

  // Generate diff context pack
  try {
    const diffPack = await generateDiffContext({
      ...options,
      baseCommit: manifest.git?.lastCommit,
    });

    packs.push(diffPack);
  } catch {
    // Git diff failed, skip
  }

  // Generate full context pack
  const fullPack = generateFullContext(manifest);
  packs.push(fullPack);

  // Count by variant
  const byVariant: Record<ContextVariant, number> = {
    route: 0,
    package: 0,
    task: 0,
    diff: 0,
    full: 0,
  };

  for (const pack of packs) {
    byVariant[pack.variant]++;
  }

  return {
    packs,
    generatedAt: new Date().toISOString(),
    totalPacks: packs.length,
    byVariant,
    outputDir,
  };
}

/**
 * Generate full repository context
 */
function generateFullContext(manifest: PeriaManifest): FullContextPack {
  const lines: string[] = [];

  // Header
  lines.push('# Peria Repository Context');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Manifest:** ${manifest.generatedAt}`);
  lines.push('');

  // Repository Summary
  lines.push('## Repository Summary');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Routes | ${manifest.routes?.length ?? 0} |`);
  lines.push(`| Schemas | ${manifest.schemas?.length ?? 0} |`);
  lines.push(`| Packages | ${manifest.packages?.length ?? 0} |`);
  if (manifest.openapiOps) {
    lines.push(`| OpenAPI Operations | ${manifest.openapiOps.length} |`);
  }
  lines.push('');

  // Framework
  if (manifest.framework) {
    lines.push('## Framework');
    lines.push('');
    lines.push(`**Name:** ${manifest.framework.name}`);
    lines.push(`**Confidence:** ${manifest.framework.confidence}`);
    if (manifest.framework.entrypoint) {
      lines.push(`**Entrypoint:** ${manifest.framework.entrypoint}`);
    }
    lines.push('');
  }

  // Routes Overview
  const routes = manifest.routes ?? [];
  lines.push('## Routes Overview');
  lines.push('');
  lines.push('```');
  for (const route of routes.slice(0, 30)) {
    lines.push(`${route.method.padEnd(6)} ${route.path}`);
  }
  if (routes.length > 30) {
    lines.push(`... and ${routes.length - 30} more routes`);
  }
  lines.push('```');
  lines.push('');

  // Packages Overview
  lines.push('## Packages');
  lines.push('');
  const packages = manifest.packages ?? [];
  for (const pkg of packages) {
    lines.push(`- **${pkg.name}** (${pkg.directory})`);
  }
  lines.push('');

  // Getting Started
  lines.push('## Getting Started');
  lines.push('');
  lines.push('```bash');
  lines.push('# Scan repository');
  lines.push('peria scan');
  lines.push('');
  lines.push('# Check for drift');
  lines.push('peria check');
  lines.push('');
  lines.push('# Generate context packs');
  lines.push('peria context');
  lines.push('```');
  lines.push('');

  const content = lines.join('\n');

  return {
    id: `ctx-full-${Date.now().toString(36)}`,
    variant: 'full',
    title: 'Full Repository Context',
    description: `Complete context for ${manifest.repo?.name ?? 'repository'}`,
    generatedAt: new Date().toISOString(),
    content,
    sourceFiles: [],
    relatedEntities: [
      ...routes.map((r) => r.id),
      ...(manifest.schemas ?? []).map((s) => s.id),
      ...packages.map((p) => p.id),
    ],
    confidence: 'high',
    summary: {
      name: manifest.repo?.name ?? 'unknown',
      framework: manifest.framework?.name ?? 'unknown',
      totalRoutes: routes.length,
      totalSchemas: manifest.schemas?.length ?? 0,
      totalPackages: packages.length,
      totalOpenAPIOps: manifest.openapiOps?.length ?? 0,
      hasOpenAPI: !!manifest.openapi,
    },
  };
}

/**
 * Save context packs to disk
 */
export async function saveContextPacks(
  result: ContextPackResult,
  _manifest: PeriaManifest
): Promise<void> {
  // Create output directory
  await mkdir(result.outputDir, { recursive: true });

  // Save each pack
  for (const pack of result.packs) {
    const filename = `${pack.variant}-${pack.id.replace(/[^a-zA-Z0-9-]/g, '-')}.md`;
    const filepath = join(result.outputDir, filename);
    await writeFile(filepath, pack.content, 'utf-8');
  }

  // Save manifest
  const manifestPath = join(result.outputDir, 'manifest.json');
  const serializableResult = {
    ...result,
    packs: result.packs.map((p) => ({ ...p, content: '[content saved to file]' })),
  };
  await writeFile(manifestPath, JSON.stringify(serializableResult, null, 2), 'utf-8');

  // Save full context as README
  const fullPack = result.packs.find((p) => p.variant === 'full');
  if (fullPack) {
    const readmePath = join(result.outputDir, 'README.md');
    await writeFile(readmePath, fullPack.content, 'utf-8');
  }
}

/**
 * Generate and save context packs in one call
 */
export async function generateAndSaveContextPacks(
  manifest: PeriaManifest,
  options: ContextPackOptions
): Promise<ContextPackResult> {
  const result = await generateContextPacks(manifest, options);
  await saveContextPacks(result, manifest);
  return result;
}
