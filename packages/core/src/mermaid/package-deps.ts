/**
 * Module Graph Diagram Generator
 *
 * Generate module dependency diagrams in Mermaid format.
 */

import type { MermaidDiagram, MermaidOptions } from './types.js';
import { generateDiagramId, DIAGRAM_TYPE_LABELS } from './types.js';
import type { PackageEntity } from '../types/graph.js';

/**
 * Generate package dependency diagrams
 */
export function generatePackageDepDiagrams(
  packages: PackageEntity[],
  options: MermaidOptions
): MermaidDiagram[] {
  const diagrams: MermaidDiagram[] = [];

  if (packages.length === 0) {
    return diagrams;
  }

  // Generate dependency graph
  const depGraph = generateDepGraph(packages);
  if (depGraph) {
    diagrams.push(depGraph);
  }

  // Generate individual package diagrams
  const maxPerType = options.maxPerType ?? 3;
  for (const pkg of packages.slice(0, maxPerType)) {
    const diagram = generatePackageDiagram(pkg);
    diagrams.push(diagram);
  }

  return diagrams;
}

/**
 * Generate overall dependency graph
 */
function generateDepGraph(packages: PackageEntity[]): MermaidDiagram | null {
  const lines: string[] = [];
  const nodeIds = new Map<string, string>();

  lines.push('```mermaid');
  lines.push('graph LR');
  lines.push('    subgraph "Packages"');

  // Create nodes for each package
  for (const pkg of packages) {
    const nodeId = `pkg_${pkg.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
    nodeIds.set(pkg.id, nodeId);
    lines.push(`        ${nodeId}["${pkg.name}"]`);
    lines.push(`        style ${nodeId} fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff`);
  }

  lines.push('    end');

  // Create dependency edges
  for (const pkg of packages) {
    const sourceId = nodeIds.get(pkg.id);
    if (!sourceId) continue;

    const deps = pkg.dependencies ?? [];

    for (const dep of deps) {
      // Find the target package
      const targetPkg = packages.find((p) => dep.startsWith(p.name) || dep === p.name);
      if (targetPkg) {
        const targetId = nodeIds.get(targetPkg.id);
        if (targetId && targetId !== sourceId) {
          lines.push(`    ${sourceId} --> ${targetId}`);
        }
      }
    }
  }

  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('package-deps', 'overview'),
    type: 'package-deps',
    title: `${DIAGRAM_TYPE_LABELS['package-deps']}: Overview`,
    content,
    sourceEntities: packages.map((p) => p.id),
    confidence: 'high',
    evidence: packages.map((p) => p.source),
    lastGenerated: new Date().toISOString(),
  };
}

/**
 * Generate diagram for a single package
 */
function generatePackageDiagram(pkg: PackageEntity): MermaidDiagram {
  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push(`    subgraph "${pkg.name}"`);

  // Package node
  lines.push(`        pkg["📦 ${pkg.name}"]`);
  lines.push(`        style pkg fill:#6366f1,stroke:#4338ca,stroke-width:2px,color:#fff`);

  // Version info
  if (pkg.version) {
    lines.push(`        version["v${pkg.version}"]`);
    lines.push(`        pkg --> version`);
  }

  // Exports
  const exports = pkg.exports ?? [];
  if (exports.length > 0) {
    lines.push('        subgraph "Exports"');
    for (const exp of exports.slice(0, 10)) {
      const expId = `exp_${exp.replace(/[^a-zA-Z0-9]/g, '_')}`;
      lines.push(`            ${expId}["${exp}"]`);
      lines.push(`            pkg --> ${expId}`);
    }
    lines.push('        end');
  }

  lines.push('    end');

  // Dependencies
  const deps = pkg.dependencies ?? [];
  if (deps.length > 0) {
    lines.push('    subgraph "Dependencies"');
    for (const dep of deps.slice(0, 10)) {
      lines.push(`        dep_${dep.replace(/[^a-zA-Z0-9]/g, '_')}["${dep}"]`);
    }
    lines.push('    end');
  }

  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('package-deps', pkg.name),
    type: 'package-deps',
    title: `${DIAGRAM_TYPE_LABELS['package-deps']}: ${pkg.name}`,
    content,
    sourceEntities: [pkg.id],
    confidence: pkg.confidence,
    evidence: [pkg.source],
    lastGenerated: new Date().toISOString(),
  };
}
