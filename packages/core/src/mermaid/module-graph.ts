/**
 * Module Graph Diagram Generator
 *
 * Generate source module maps from manifest source files.
 */

import type { PeriaManifest } from '../types/manifest.js';
import type { MermaidDiagram, MermaidOptions } from './types.js';
import { DIAGRAM_TYPE_LABELS, generateDiagramId } from './types.js';

interface ModuleNode {
  id: string;
  path: string;
  packageName: string;
  imports: string[];
}

function toNodeId(value: string): string {
  return value.replace(/[^a-zA-Z0-9]/g, '_');
}

function getPackageName(path: string, packageName?: string): string {
  if (packageName) {
    return packageName;
  }

  const match = path.match(/^packages\/([^/]+)/);
  return match ? `packages/${match[1]}` : 'root';
}

function getModuleLabel(path: string): string {
  const segments = path.split('/');
  return segments.slice(-2).join('/');
}

/**
 * Generate module graph diagrams
 */
export function generateModuleGraphDiagrams(
  manifest: PeriaManifest,
  options: MermaidOptions
): MermaidDiagram[] {
  const sourceFiles = manifest.sourceFiles ?? [];
  if (sourceFiles.length === 0) {
    return [];
  }

  const maxPerType = options.maxPerType ?? 40;
  const modules: ModuleNode[] = sourceFiles
    .filter((file) => file.path.endsWith('.ts'))
    .slice(0, maxPerType)
    .map((file) => ({
      id: file.id,
      path: file.path,
      packageName: getPackageName(file.path, file.package),
      imports: file.imports ?? [],
    }));

  if (modules.length === 0) {
    return [];
  }

  const lines: string[] = [];
  const packages = Array.from(new Set(modules.map((module) => module.packageName))).sort();
  const packageNodeIds = new Map(packages.map((pkg) => [pkg, `pkg_${toNodeId(pkg)}`]));

  lines.push('```mermaid');
  lines.push('graph LR');
  lines.push('    subgraph "Packages"');

  for (const pkg of packages) {
    const nodeId = packageNodeIds.get(pkg);
    if (!nodeId) continue;
    lines.push(`        ${nodeId}["${pkg}"]`);
    lines.push(`        style ${nodeId} fill:#6366f1,stroke:#4338ca,color:#fff`);
  }

  lines.push('    end');
  lines.push('    subgraph "Modules"');

  for (const module of modules) {
    const nodeId = `mod_${toNodeId(module.path)}`;
    lines.push(`        ${nodeId}["${getModuleLabel(module.path)}"]`);
    lines.push(`        ${packageNodeIds.get(module.packageName)} --> ${nodeId}`);
  }

  lines.push('    end');

  for (const module of modules) {
    const sourceId = `mod_${toNodeId(module.path)}`;
    const internalImports = module.imports.filter((item) => item.startsWith('@peria/'));

    for (const importName of internalImports) {
      const targetPackageId = packageNodeIds.get(importName);
      if (targetPackageId) {
        lines.push(`    ${sourceId} -. imports .-> ${targetPackageId}`);
      }
    }
  }

  lines.push('```');

  return [
    {
      id: generateDiagramId('module-graph', 'overview'),
      type: 'module-graph',
      title: `${DIAGRAM_TYPE_LABELS['module-graph']}: Overview`,
      content: lines.join('\n'),
      sourceEntities: modules.map((module) => module.id),
      confidence: 'high',
      evidence: modules.map((module) => ({
        file: module.path,
        line: 1,
        commit: manifest.repo.commit,
      })),
      lastGenerated: new Date().toISOString(),
    },
  ];
}
