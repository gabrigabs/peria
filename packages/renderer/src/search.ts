/**
 * Search index generation
 */

import type { PeriaManifest } from '@peria/core';
import type { SearchEntry, SearchResult } from './types.js';

export interface SearchIndexOptions {
  /**
   * Peria manifest to generate search index from
   */
  manifest: PeriaManifest;

  /**
   * Base URL for the docs
   * @default '/docs'
   */
  baseUrl?: string;

  /**
   * Maximum entries to include
   * @default 100
   */
  maxEntries?: number;
}

/**
 * Generate search index from manifest
 */
export function generateSearchIndex(options: SearchIndexOptions): SearchEntry[] {
  const { manifest, baseUrl = '/docs', maxEntries = 100 } = options;

  const entries: SearchEntry[] = [];

  // Add routes
  for (const route of manifest.routes ?? []) {
    if (entries.length >= maxEntries) break;

    const handlerName = route.handler?.name;
    entries.push({
      id: `route-${route.method}-${route.path}`,
      type: 'route',
      title: `${route.method} ${route.path}`,
      description: handlerName ? `Handler: ${handlerName}` : undefined,
      url: `${baseUrl}/routes/${encodeURIComponent(route.path.replace(/\//g, '_'))}`,
      content: handlerName ?? '',
      keywords: [route.method.toLowerCase(), route.path, handlerName].filter((k): k is string =>
        Boolean(k)
      ),
    });
  }

  // Add packages
  for (const pkg of manifest.packages ?? []) {
    if (entries.length >= maxEntries) break;

    entries.push({
      id: `package-${pkg.name}`,
      type: 'package',
      title: pkg.name,
      description: pkg.description,
      url: `${baseUrl}/packages/${pkg.name.replace('@', '').replace('/', '-')}`,
      content: `${pkg.name} ${pkg.description}`,
      keywords: [pkg.name, pkg.description].filter((k): k is string => Boolean(k)),
    });
  }

  // Add schemas
  for (const schema of manifest.schemas ?? []) {
    if (entries.length >= maxEntries) break;

    entries.push({
      id: `schema-${schema.name}`,
      type: 'schema',
      title: schema.name,
      description: `Schema with ${schema.properties?.length ?? 0} properties`,
      url: `${baseUrl}/schemas/${schema.name}`,
      content: schema.properties?.map((p) => `${p.name}: ${p.type}`).join(' '),
      keywords: [
        schema.name,
        'schema',
        ...(schema.properties?.map((p) => p.name.toLowerCase()) ?? []),
      ],
    });
  }

  return entries;
}

/**
 * Generate JSON search index file content
 */
export function generateSearchIndexJson(options: SearchIndexOptions): string {
  const entries = generateSearchIndex(options);
  return JSON.stringify(
    {
      version: 1,
      generatedAt: new Date().toISOString(),
      entries,
    },
    null,
    2
  );
}

/**
 * Search entries for a query
 */
export function searchEntries(
  entries: SearchEntry[],
  query: string,
  options: {
    limit?: number;
  } = {}
): SearchResult[] {
  const { limit = 10 } = options;

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/).filter(Boolean);

  const scored = entries
    .map((entry) => {
      let score = 0;

      // Title match (highest weight)
      if (entry.title.toLowerCase().includes(queryLower)) {
        score += 10;
        if (entry.title.toLowerCase() === queryLower) {
          score += 20;
        }
      }

      // Keyword match
      for (const keyword of entry.keywords ?? []) {
        if (keyword.toLowerCase().includes(queryLower)) {
          score += 5;
        }
      }

      // Content match
      if (entry.content?.toLowerCase().includes(queryLower)) {
        score += 3;
      }

      // Term matching
      for (const term of queryTerms) {
        if (entry.title.toLowerCase().includes(term)) {
          score += 2;
        }
        if (entry.keywords?.some((k) => k.toLowerCase().includes(term))) {
          score += 1;
        }
      }

      return { entry, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ entry, score }) => ({
    type: entry.type as SearchResult['type'],
    id: entry.id,
    title: entry.title,
    description: entry.description,
    url: entry.url,
    score,
  }));
}

/**
 * Generate client-side search JavaScript
 */
export function generateSearchScript(entries: SearchEntry[]): string {
  return `
// Peria Search Index
const PERIA_SEARCH_INDEX = ${JSON.stringify(entries)};

function periaSearch(query) {
  if (!query || query.length < 2) return [];

  const queryLower = query.toLowerCase();

  return PERIA_SEARCH_INDEX
    .map(entry => {
      let score = 0;
      if (entry.title.toLowerCase().includes(queryLower)) score += 10;
      if (entry.keywords?.some(k => k.toLowerCase().includes(queryLower))) score += 5;
      if (entry.content?.toLowerCase().includes(queryLower)) score += 3;
      return { ...entry, score };
    })
    .filter(e => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}
`;
}
