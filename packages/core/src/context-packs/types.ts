/**
 * Context Pack Types
 *
 * Phase 6: Agent context packs for coding assistants.
 */

import type { Confidence, SourceRef } from '../types/graph.js';

/**
 * Context pack variant types
 */
export type ContextVariant = 'route' | 'package' | 'task' | 'diff' | 'full';

/**
 * Base interface for all context packs
 */
export interface ContextPack {
  id: string;
  variant: ContextVariant;
  title: string;
  description: string;
  generatedAt: string;
  content: string;
  sourceFiles: SourceRef[];
  relatedEntities: string[];
  confidence: Confidence;
  metadata?: Record<string, unknown>;
}

/**
 * Route-specific context pack
 */
export interface RouteContextPack extends ContextPack {
  variant: 'route';
  routeId: string;
  method: string;
  path: string;
}

/**
 * Package-specific context pack
 */
export interface PackageContextPack extends ContextPack {
  variant: 'package';
  packageId: string;
  packageName: string;
}

/**
 * Task-oriented context pack
 */
export interface TaskContextPack extends ContextPack {
  variant: 'task';
  task: string;
  relevantRoutes: string[];
  relevantPackages: string[];
  relevantSchemas: string[];
}

/**
 * Diff-specific context pack
 */
export interface DiffContextPack extends ContextPack {
  variant: 'diff';
  changedFiles: string[];
  affectedRouteCount: number;
  affectedSchemaCount: number;
  affectedPackageCount: number;
  impactLevel: 'high' | 'medium' | 'low';
}

/**
 * Full repository context pack
 */
export interface FullContextPack extends ContextPack {
  variant: 'full';
  summary: RepoSummary;
}

/**
 * Repository summary for full context
 */
export interface RepoSummary {
  name: string;
  framework: string;
  totalRoutes: number;
  totalSchemas: number;
  totalPackages: number;
  totalOpenAPIOps: number;
  hasOpenAPI: boolean;
}

/**
 * Options for context pack generation
 */
export interface ContextPackOptions {
  /** Maximum lines of content per pack */
  maxSize?: number;
  /** Working directory */
  cwd: string;
  /** Output directory */
  outputDir?: string;
}

/**
 * Result of context pack generation
 */
export interface ContextPackResult {
  packs: ContextPack[];
  generatedAt: string;
  totalPacks: number;
  byVariant: Record<ContextVariant, number>;
  outputDir: string;
}

/**
 * Task template definitions
 */
export const TASK_TEMPLATES = {
  'add-route': {
    title: 'Add new route',
    instructions: [
      'Identify the appropriate controller or handler file',
      'Check existing route patterns for the framework',
      'Add OpenAPI operation documentation',
      'Update any related schemas',
      'Add route to documentation',
    ],
  },
  'add-schema': {
    title: 'Add new schema',
    instructions: [
      'Identify the appropriate schema file or module',
      'Follow existing schema patterns',
      'Link schema to related routes',
      'Update OpenAPI schema references',
    ],
  },
  'add-package': {
    title: 'Add new package',
    instructions: [
      'Create package directory structure',
      'Set up package.json with proper exports',
      'Add to monorepo workspace configuration',
      'Export public APIs',
      'Add to framework adapter if needed',
    ],
  },
  'fix-drift': {
    title: 'Fix documentation drift',
    instructions: [
      'Review the drift findings from peria check',
      'Update documentation to match current code',
      'Update OpenAPI to match routes',
      'Regenerate manifest after changes',
    ],
  },
} as const;

/**
 * Predefined task types
 */
export type TaskType = keyof typeof TASK_TEMPLATES;

/**
 * Generate a context pack ID
 */
export function generateContextPackId(variant: ContextVariant, entityId?: string): string {
  const timestamp = Date.now().toString(36);
  const entity = entityId ? `-${entityId.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
  return `ctx-${variant}-${timestamp}${entity}`;
}
