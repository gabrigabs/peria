/**
 * Mermaid Diagram Generator
 *
 * Main orchestrator for generating Mermaid diagrams.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PeriaManifest } from '../types/manifest.js';
import { generateModuleGraphDiagrams } from './module-graph.js';
import { generatePackageDepDiagrams } from './package-deps.js';
import { generateRouteFlowDiagrams } from './route-flow.js';
import { generateSchemaDiagrams } from './schema.js';
import type {
  DiagramMetadata,
  DiagramType,
  MermaidDiagram,
  MermaidOptions,
  MermaidResult,
} from './types.js';
import { generateDiagramId } from './types.js';

/**
 * Default output directory for diagrams
 */
const DEFAULT_OUTPUT_DIR = '.peria/diagrams';

/**
 * Generate all diagrams from a manifest
 */
export function generateDiagrams(manifest: PeriaManifest, options: MermaidOptions): MermaidResult {
  const diagrams: MermaidDiagram[] = [];
  const types = options.types ?? ['route-flow', 'package-deps', 'schema', 'module-graph'];

  // Route flow diagrams
  if (types.includes('route-flow')) {
    const routeDiagrams = generateRouteFlowDiagrams(manifest, options);
    diagrams.push(...routeDiagrams);
  }

  // Package dependency diagrams
  if (types.includes('package-deps')) {
    const pkgDiagrams = generatePackageDepDiagrams(manifest.packages, options);
    diagrams.push(...pkgDiagrams);
  }

  // Schema diagrams
  if (types.includes('schema')) {
    const schemaDiagrams = generateSchemaDiagrams(manifest, options);
    diagrams.push(...schemaDiagrams);
  }

  // Module graph diagrams
  if (types.includes('module-graph')) {
    const moduleDiagrams = generateModuleGraphDiagrams(manifest, options);
    diagrams.push(...moduleDiagrams);
  }

  return {
    diagrams,
    metadata: createDiagramMetadata(diagrams),
  };
}

function createDiagramMetadata(
  diagrams: MermaidDiagram[],
  generatedAt = new Date().toISOString()
): DiagramMetadata {
  const byType: Record<DiagramType, number> = {
    'route-flow': 0,
    'module-graph': 0,
    'package-deps': 0,
    schema: 0,
    'endpoint-handler': 0,
  };

  for (const diagram of diagrams) {
    byType[diagram.type]++;
  }

  return {
    generatedAt,
    totalDiagrams: diagrams.length,
    byType,
  };
}

/**
 * Generate overview diagram showing all types
 */
export function generateOverviewDiagram(manifest: PeriaManifest): MermaidDiagram {
  const lines: string[] = [];
  const routes = manifest.routes ?? [];
  const schemas = manifest.schemas ?? [];
  const packages = manifest.packages ?? [];

  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push('    subgraph "System Overview"');

  // Routes summary
  if (routes.length > 0) {
    lines.push('        routes["📡 Routes"]');
    lines.push(`        routes_text["${routes.length} endpoints"]`);
    lines.push('        routes --> routes_text');
    lines.push(`        style routes fill:#61affe,stroke:#2563eb,color:#fff`);
  }

  // Schemas summary
  if (schemas.length > 0) {
    lines.push('        schemas["📋 Schemas"]');
    lines.push(`        schemas_text["${schemas.length} types"]`);
    lines.push('        schemas --> schemas_text');
    lines.push(`        style schemas fill:#fca130,stroke:#ea580c,color:#fff`);
  }

  // Packages summary
  if (packages.length > 0) {
    lines.push('        packages["📦 Packages"]');
    lines.push(`        packages_text["${packages.length} modules"]`);
    lines.push('        packages --> packages_text');
    lines.push(`        style packages fill:#6366f1,stroke:#4338ca,color:#fff`);
  }

  // OpenAPI summary
  if (manifest.openapiOps && manifest.openapiOps.length > 0) {
    lines.push('        openapi["📖 OpenAPI"]');
    lines.push(`        openapi_text["${manifest.openapiOps.length} operations"]`);
    lines.push('        openapi --> openapi_text');
    lines.push(`        style openapi fill:#49cc90,stroke:#16a34a,color:#fff`);
  }

  lines.push('    end');
  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('route-flow', 'system-overview'),
    type: 'route-flow',
    title: 'System Overview',
    content,
    sourceEntities: [
      ...routes.map((r) => r.id),
      ...schemas.map((s) => s.id),
      ...packages.map((p) => p.id),
    ],
    confidence: 'high',
    evidence: [],
    lastGenerated: new Date().toISOString(),
  };
}

function toMermaidSource(content: string): string {
  const match = content.match(/^```mermaid\n([\s\S]*?)\n```$/);
  return match ? `${match[1]}\n` : `${content}\n`;
}

/**
 * Save diagrams to disk
 */
export async function saveDiagrams(result: MermaidResult, outputDir?: string): Promise<void> {
  const dir = outputDir ?? DEFAULT_OUTPUT_DIR;

  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });

  // Group diagrams by type
  const byType = new Map<DiagramType, MermaidDiagram[]>();

  for (const diagram of result.diagrams) {
    if (!byType.has(diagram.type)) {
      byType.set(diagram.type, []);
    }
    byType.get(diagram.type)?.push(diagram);
  }

  // Save diagrams by type
  for (const [type, diagrams] of byType) {
    const typeDir = join(dir, type);
    await mkdir(typeDir, { recursive: true });

    for (const diagram of diagrams) {
      await Promise.all([
        writeFile(join(typeDir, `${diagram.id}.md`), diagram.content, 'utf-8'),
        writeFile(join(typeDir, `${diagram.id}.mmd`), toMermaidSource(diagram.content), 'utf-8'),
      ]);
    }
  }

  // Save overview diagram
  const overview = result.diagrams.find((d) => d.title.includes('Overview'));
  if (overview) {
    const overviewPath = join(dir, 'README.md');
    await writeFile(overviewPath, overview.content, 'utf-8');
  }

  // Save metadata
  const metadataPath = join(dir, 'metadata.json');
  await writeFile(metadataPath, JSON.stringify(result.metadata, null, 2), 'utf-8');
}

/**
 * Generate and save diagrams in one call
 */
export async function generateAndSaveDiagrams(
  manifest: PeriaManifest,
  options: MermaidOptions
): Promise<MermaidResult> {
  // Add overview diagram
  const overview = generateOverviewDiagram(manifest);
  const result = generateDiagrams(manifest, options);
  result.diagrams.unshift(overview);
  result.metadata = createDiagramMetadata(result.diagrams, result.metadata.generatedAt);

  await saveDiagrams(result, options.outputDir);

  return result;
}
