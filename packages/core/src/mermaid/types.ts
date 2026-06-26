/**
 * Mermaid Diagram Types
 *
 * Phase 7: Generate Mermaid diagrams for routes, modules, packages, and schemas.
 */

import type { Confidence, SourceRef } from '../types/graph.js';

/**
 * Diagram types
 */
export type DiagramType =
  | 'route-flow'
  | 'module-graph'
  | 'package-deps'
  | 'schema'
  | 'endpoint-handler';

/**
 * Mermaid diagram entity
 */
export interface MermaidDiagram {
  id: string;
  type: DiagramType;
  title: string;
  content: string;
  sourceEntities: string[];
  confidence: Confidence;
  evidence: SourceRef[];
  stale?: boolean;
  lastGenerated?: string;
}

/**
 * Diagram metadata
 */
export interface DiagramMetadata {
  generatedAt: string;
  totalDiagrams: number;
  byType: Record<DiagramType, number>;
}

/**
 * Mermaid generation options
 */
export interface MermaidOptions {
  /** Working directory */
  cwd: string;
  /** Output directory */
  outputDir?: string;
  /** Diagram types to generate */
  types?: DiagramType[];
  /** Maximum diagrams per type */
  maxPerType?: number;
  /** Preserve existing mermaid blocks */
  preserveExisting?: boolean;
}

/**
 * Result of diagram generation
 */
export interface MermaidResult {
  diagrams: MermaidDiagram[];
  metadata: DiagramMetadata;
}

/**
 * Generate a unique diagram ID
 */
export function generateDiagramId(type: DiagramType, entityId?: string): string {
  const timestamp = Date.now().toString(36);
  const entity = entityId ? `-${entityId.replace(/[^a-zA-Z0-9]/g, '-')}` : '';
  return `diagram-${type}-${timestamp}${entity}`;
}

/**
 * Diagram type labels
 */
export const DIAGRAM_TYPE_LABELS: Record<DiagramType, string> = {
  'route-flow': 'Route Flow',
  'module-graph': 'Module Graph',
  'package-deps': 'Package Dependencies',
  schema: 'Schema Diagram',
  'endpoint-handler': 'Endpoint Handler',
};
