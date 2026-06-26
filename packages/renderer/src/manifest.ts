/**
 * Manifest conversion utilities
 */

import type { PeriaManifest } from '@peria/core';
import { generateNavigation } from './config.js';
import { generatePagesFromManifest } from './content.js';
import type { DocsPage, NavSection } from './types.js';

export interface ManifestConversionOptions {
  /**
   * Peria manifest to convert
   */
  manifest: PeriaManifest;

  /**
   * Base URL for the docs
   * @default '/docs'
   */
  baseUrl?: string;

  /**
   * Include routes in pages
   * @default true
   */
  includeRoutes?: boolean;

  /**
   * Include packages in pages
   * @default true
   */
  includePackages?: boolean;

  /**
   * Include schemas in pages
   * @default true
   */
  includeSchemas?: boolean;

  /**
   * Include drift report
   * @default true
   */
  includeDrift?: boolean;
}

/**
 * Convert Peria manifest to docs structure
 */
export function convertManifestToDocs(options: ManifestConversionOptions) {
  const {
    manifest,
    baseUrl = '/docs',
    includeRoutes = true,
    includePackages = true,
    includeSchemas = true,
    includeDrift = true,
  } = options;

  const pages = generatePagesFromManifest({
    manifest,
    baseUrl,
    includeRoutes,
    includePackages,
    includeSchemas,
    includeDrift,
  });

  const docsPages: DocsPage[] = pages.pages.map((page) => ({
    url: page.url,
    title: page.title,
    description: page.description,
    type: 'page',
    sections: [],
    category: page.category,
    order: page.order,
  }));

  return {
    metadata: pages.metadata,
    navigation: generateNavigation(
      pages.routes,
      pages.packages,
      pages.schemas,
      pages.driftFindings.length,
      baseUrl
    ),
    routes: pages.routes,
    packages: pages.packages,
    schemas: pages.schemas,
    driftFindings: pages.driftFindings,
    pages: docsPages,
  };
}

/**
 * Generate sidebar tree from manifest
 */
export function generateSidebarTree(manifest: PeriaManifest, baseUrl = '/docs'): NavSection[] {
  const routes = manifest.routes ?? [];
  const packages = manifest.packages ?? [];
  const schemas = manifest.schemas ?? [];
  const driftCount = manifest.drift?.length ?? 0;

  return generateNavigation(routes, packages, schemas, driftCount, baseUrl);
}

/**
 * Generate search index from manifest
 */
export function generateSearchIndex(manifest: PeriaManifest, baseUrl = '/docs') {
  const routes = manifest.routes ?? [];
  const packages = manifest.packages ?? [];
  const schemas = manifest.schemas ?? [];
  const docs = manifest.docsPages ?? [];

  const entries = [];

  // Add routes
  for (const route of routes) {
    const handlerName = route.handler?.name;
    entries.push({
      id: `route-${route.method}-${route.path}`,
      type: 'route' as const,
      title: `${route.method} ${route.path}`,
      description: handlerName ? `Handler: ${handlerName}` : undefined,
      url: `${baseUrl}/routes/${encodeURIComponent(route.path.replace(/\//g, '_'))}`,
      content: handlerName ?? '',
      keywords: [route.method.toLowerCase(), route.path, handlerName].filter(Boolean),
    });
  }

  // Add packages
  for (const pkg of packages) {
    entries.push({
      id: `package-${pkg.name}`,
      type: 'package' as const,
      title: pkg.name,
      description: pkg.description,
      url: `${baseUrl}/packages/${pkg.name.replace('@', '').replace('/', '-')}`,
      content: `${pkg.name} ${pkg.description}`,
      keywords: [pkg.name, pkg.description].filter(Boolean),
    });
  }

  // Add schemas
  for (const schema of schemas) {
    entries.push({
      id: `schema-${schema.name}`,
      type: 'schema' as const,
      title: schema.name,
      description: `Schema with ${schema.properties?.length || 0} properties`,
      url: `${baseUrl}/schemas/${schema.name}`,
      content: schema.properties?.map((p) => `${p.name}: ${p.type}`).join(' '),
      keywords: [
        schema.name,
        'schema',
        ...(schema.properties?.map((p) => p.name.toLowerCase()) ?? []),
      ],
    });
  }

  // Add docs
  for (const doc of docs) {
    entries.push({
      id: `docs-${doc.path}`,
      type: 'docs' as const,
      title: doc.title,
      description: doc.description,
      url: `${baseUrl}/${doc.path}`,
      content: doc.content,
      keywords: [doc.title, doc.description],
    });
  }

  return entries;
}

/**
 * Find related items for a given entity
 */
export function findRelatedItems(manifest: PeriaManifest, entityType: string, entityId: string) {
  const related = [];

  if (entityType === 'route') {
    const route = manifest.routes?.find((r) => `${r.method}-${r.path}` === entityId);
    if (route) {
      // Find related schemas
      for (const schema of route.schemas) {
        related.push({ type: 'schema', item: schema });
      }
    }
  }

  return related;
}
