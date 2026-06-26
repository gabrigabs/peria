/**
 * Route Flow Diagram Generator
 *
 * Generate endpoint-to-handler flow diagrams in Mermaid format.
 */

import type { MermaidDiagram, MermaidOptions } from './types.js';
import { generateDiagramId, DIAGRAM_TYPE_LABELS } from './types.js';
import type { PeriaManifest } from '../types/manifest.js';

/**
 * Generate route flow diagrams
 */
export function generateRouteFlowDiagrams(
  manifest: PeriaManifest,
  options: MermaidOptions
): MermaidDiagram[] {
  const diagrams: MermaidDiagram[] = [];

  if (manifest.routes.length === 0) {
    return diagrams;
  }

  // Group routes by path prefix
  const routeGroups = groupRoutesByPrefix(manifest.routes.map((r) => ({
    method: r.method,
    path: r.path,
    id: r.id,
    source: { file: r.source.file, line: r.source.line ?? 1 },
  })));

  // Generate one diagram per group (limit to maxPerType)
  const maxPerType = options.maxPerType ?? 5;
  const groups = Object.entries(routeGroups).slice(0, maxPerType);

  for (const [prefix, routes] of groups) {
    const diagram = generateGroupDiagram(prefix, routes);
    diagrams.push(diagram);
  }

  // Generate overall route map if we have multiple groups
  if (groups.length > 1) {
    const overview = generateOverviewDiagram(manifest.routes.map((r) => ({
      method: r.method,
      path: r.path,
      id: r.id,
    })));
    diagrams.unshift(overview);
  }

  return diagrams;
}

/**
 * Group routes by their path prefix
 */
function groupRoutesByPrefix(
  routes: { method: string; path: string; id: string; source: { file: string; line: number } }[]
): Record<string, typeof routes> {
  const groups: Record<string, typeof routes> = {};

  for (const route of routes) {
    const segments = route.path.split('/').filter(Boolean);
    const prefix = segments.length > 1 ? `/${segments[0]}` : route.path;

    if (!groups[prefix]) {
      groups[prefix] = [];
    }
    groups[prefix].push(route);
  }

  return groups;
}

/**
 * Generate a diagram for a route group
 */
function generateGroupDiagram(
  prefix: string,
  routes: { method: string; path: string; id: string; source: { file: string; line: number } }[]
): MermaidDiagram {
  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('graph LR');
  lines.push(`    subgraph "${prefix}"`);

  for (const route of routes) {
    const methodColor = getMethodColor(route.method);
    const nodeId = `route_${route.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`        ${nodeId}["\`${route.method} ${route.path}\`"]`);
    lines.push(`        style ${nodeId} fill:${methodColor},stroke:#333,stroke-width:2px`);
  }

  lines.push('    end');
  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('route-flow', prefix.replace(/[^a-zA-Z0-9]/g, '-')),
    type: 'route-flow',
    title: `${DIAGRAM_TYPE_LABELS['route-flow']}: ${prefix}`,
    content,
    sourceEntities: routes.map((r) => r.id),
    confidence: 'high',
    evidence: routes.map((r) => r.source),
    lastGenerated: new Date().toISOString(),
  };
}

/**
 * Generate an overview diagram of all routes
 */
function generateOverviewDiagram(
  routes: { method: string; path: string; id: string }[]
): MermaidDiagram {
  const lines: string[] = [];

  lines.push('```mermaid');
  lines.push('graph TD');
  lines.push('    subgraph "Routes"');

  // Limit to 20 routes for overview
  const limitedRoutes = routes.slice(0, 20);

  for (const route of limitedRoutes) {
    const methodColor = getMethodColor(route.method);
    const nodeId = `route_${route.id.replace(/[^a-zA-Z0-9]/g, '_')}`;
    lines.push(`        ${nodeId}["\`${route.method} ${route.path}\`"]`);
    lines.push(`        style ${nodeId} fill:${methodColor},stroke:#333,stroke-width:2px`);
  }

  lines.push('    end');

  if (routes.length > 20) {
    lines.push(`    more["... and ${routes.length - 20} more routes"]`);
  }

  lines.push('```');

  const content = lines.join('\n');

  return {
    id: generateDiagramId('route-flow', 'overview'),
    type: 'route-flow',
    title: `${DIAGRAM_TYPE_LABELS['route-flow']}: Overview`,
    content,
    sourceEntities: limitedRoutes.map((r) => r.id),
    confidence: 'high',
    evidence: [],
    lastGenerated: new Date().toISOString(),
  };
}

/**
 * Get color for HTTP method
 */
function getMethodColor(method: string): string {
  const colors: Record<string, string> = {
    GET: '#61affe',
    POST: '#49cc90',
    PUT: '#fca130',
    PATCH: '#50e3c2',
    DELETE: '#f93e3e',
    OPTIONS: '#9012fe',
    HEAD: '#9012fe',
  };
  return colors[method.toUpperCase()] ?? '#999999';
}
