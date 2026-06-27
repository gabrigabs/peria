/**
 * Configuration for Peria Documentation Renderer
 */

import type { DocsMetadata, NavItem, NavSection } from './types.js';

/**
 * Renderer mode - how to generate documentation output
 */
export type RendererMode = 'static' | 'fumadocs';

export interface RendererConfigOptions {
  /**
   * Renderer mode
   * @default 'static'
   * - 'static': Generate self-contained HTML/CSS/JS (current behavior)
   * - 'fumadocs': Generate Fumadocs-compatible content for Next.js apps
   */
  mode?: RendererMode;

  /**
   * Base URL for the documentation
   * @default ''
   */
  baseUrl?: string;

  /**
   * Docs route prefix
   * @default '/docs'
   */
  docsRootPath?: string;

  /**
   * Project name
   * @default 'Peria'
   */
  projectName?: string;

  /**
   * Project description
   */
  projectDescription?: string;

  /**
   * GitHub URL for source link
   */
  githubUrl?: string;

  /**
   * Navigation sections
   */
  navigation?: NavSection[];

  /**
   * Whether to enable dark mode
   * @default true
   */
  darkMode?: boolean;

  /**
   * Logo text or HTML
   */
  logo?: string;

  /**
   * Additional CSS to inject
   */
  customCss?: string;
}

/**
 * Create renderer configuration
 */
export function createRendererConfig(options: RendererConfigOptions = {}): RendererConfigOptions {
  return {
    mode: options.mode ?? 'static',
    baseUrl: options.baseUrl ?? '',
    docsRootPath: options.docsRootPath ?? '/docs',
    projectName: options.projectName ?? 'Peria',
    projectDescription: options.projectDescription,
    githubUrl: options.githubUrl,
    navigation: options.navigation,
    darkMode: options.darkMode ?? true,
    logo: options.logo,
    customCss: options.customCss,
  };
}

/**
 * Generate navigation from manifest data
 */
export function generateNavigation(
  routes: Array<{ method: string; path: string }>,
  packages: Array<{ name: string }>,
  schemas: Array<{ name: string }>,
  driftCount: number,
  baseUrl = '/docs'
): NavSection[] {
  const sections: NavSection[] = [];

  // Start Here section
  sections.push({
    title: 'Start Here',
    items: [
      { title: 'Overview', href: `${baseUrl}/overview` },
      { title: 'AI Context', href: `${baseUrl}/ai-context` },
    ],
  });

  // API section (routes)
  if (routes.length > 0) {
    sections.push({
      title: 'API',
      items: routes.slice(0, 20).map((route) => ({
        title: `${route.method} ${route.path}`,
        href: `${baseUrl}/routes/${encodeRoutePath(route.path)}`,
      })),
    });
  }

  // Schemas section
  if (schemas.length > 0) {
    sections.push({
      title: 'Schemas',
      items: schemas.map((schema) => ({
        title: schema.name,
        href: `${baseUrl}/schemas/${schema.name}`,
      })),
    });
  }

  // Packages section
  if (packages.length > 0) {
    sections.push({
      title: 'Packages',
      items: packages.map((pkg) => ({
        title: pkg.name,
        href: `${baseUrl}/packages/${encodePackageName(pkg.name)}`,
      })),
    });
  }

  // Maintenance section (drift)
  if (driftCount > 0) {
    sections.push({
      title: 'Maintenance',
      items: [
        {
          title: `Drift Report`,
          href: `${baseUrl}/drift`,
          badge: String(driftCount),
        },
      ],
    });
  }

  return sections;
}

/**
 * Generate navigation from metadata
 */
export function generateNavigationFromMetadata(
  metadata: DocsMetadata,
  baseUrl = '/docs'
): NavSection[] {
  return generateNavigation([], [], [], metadata.stats?.driftFindings ?? 0, baseUrl);
}

/**
 * Encode route path for URL
 */
export function encodeRoutePath(path: string): string {
  return encodeURIComponent(path.replace(/\//g, '_').replace(/:/g, '_'));
}

/**
 * Encode package name for URL
 */
export function encodePackageName(name: string): string {
  return name.replace('@', '_at_').replace('/', '_slash_');
}

/**
 * Decode package name from URL
 */
export function decodePackageName(encoded: string): string {
  return encoded.replace('_at_', '@').replace('_slash_', '/');
}

/**
 * Flatten navigation to array of items
 */
export function flattenNavigation(sections: NavSection[]): NavItem[] {
  const items: NavItem[] = [];

  for (const section of sections) {
    for (const item of section.items) {
      items.push(item);
      if (item.items) {
        items.push(...item.items);
      }
    }
  }

  return items;
}

/**
 * Find navigation item by URL
 */
export function findNavItem(sections: NavSection[], url: string): NavItem | undefined {
  for (const section of sections) {
    for (const item of section.items) {
      if (item.href === url) return item;
      if (item.items) {
        for (const subItem of item.items) {
          if (subItem.href === url) return subItem;
        }
      }
    }
  }
  return undefined;
}
