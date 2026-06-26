/**
 * Core types for Peria Documentation Renderer
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type Confidence = 'high' | 'medium' | 'low';

export type DriftStatus = 'aligned' | 'warning' | 'error';

export type Severity = 'error' | 'warning' | 'info';

export type ExtractionMethod = 'ast' | 'openapi' | 'markdown' | 'git' | 'heuristic' | 'manual';

export type EntityType = 'route' | 'schema' | 'package' | 'docs' | 'openapi' | 'module';

// Navigation

export interface NavItem {
  title: string;
  href?: string;
  items?: NavItem[];
  badge?: string;
  icon?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Page data types

export interface RoutePageData {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  handler?: {
    name: string;
    controller?: string;
    file: string;
    line: number;
  };
  schemas?: {
    request?: SchemaInfo;
    response?: SchemaInfo;
  };
  openapi?: {
    operationId?: string;
    summary?: string;
    description?: string;
  };
  docs?: {
    file: string;
    section?: string;
  };
  confidence: Confidence;
  driftStatus?: DriftStatus;
  lastChanged?: {
    commit?: string;
    date?: string;
  };
}

export interface SchemaInfo {
  name: string;
  file: string;
  line: number;
  properties?: SchemaProperty[];
}

export interface SchemaProperty {
  name: string;
  type: string;
  required: boolean;
  description?: string;
}

export interface PackagePageData {
  name: string;
  version?: string;
  directory: string;
  description?: string;
  role?: string;
  responsibilities?: string[];
  exports: ExportInfo[];
  dependencies: string[];
  scripts: string[];
  driftStatus?: DriftStatus;
}

export interface ExportInfo {
  name: string;
  type: 'class' | 'function' | 'interface' | 'type' | 'variable' | 'enum';
  file: string;
  line: number;
}

export interface SchemaPageData {
  name: string;
  file: string;
  line: number;
  properties: SchemaProperty[];
  usedBy: UsedByInfo[];
  openapiRef?: string;
  confidence: Confidence;
  driftStatus?: DriftStatus;
}

export interface UsedByInfo {
  route?: { method: HttpMethod; path: string };
  handler?: string;
  module?: string;
}

export interface ModulePageData {
  path: string;
  packageName?: string;
  exports: ExportInfo[];
  imports: string[];
  usedBy: string[];
}

// Drift finding

export interface DriftFindingData {
  id: string;
  severity: Severity;
  entityType: EntityType;
  entityId: string;
  entityName: string;
  problem: string;
  expected?: string;
  actual?: string;
  evidence: EvidenceItem[];
  suggestedAction: string;
  detectedAt: string;
}

export interface EvidenceItem {
  file: string;
  line?: number;
  context?: string;
  type?: 'code' | 'openapi' | 'docs' | 'git';
}

// Source references

export interface EvidenceSource {
  type: 'code' | 'openapi' | 'docs' | 'git';
  file: string;
  line?: number;
  commit?: string;
  extractionMethod: ExtractionMethod;
  confidence: Confidence;
  context?: string;
}

export interface SourceFile {
  path: string;
  line?: number;
  snippet?: string;
}

// Generated pages

export interface GeneratedPage {
  slug: string;
  title: string;
  description?: string;
  content: string;
  url: string;
  category?: string;
  order?: number;
  // Optional fields for compatibility
  id?: string;
  modified?: Date;
  author?: string;
  tags?: string[];
}

export interface DocsPage {
  url: string;
  title: string;
  description?: string;
  type: 'page' | 'folder';
  sections: string[];
  children?: DocsPage[];
  badge?: string;
  category?: string;
  order?: number;
}

// Metadata

export interface DocsMetadata {
  title: string;
  description?: string;
  generatedAt: string;
  manifestVersion: string;
  periaVersion?: string;
  git?: {
    branch?: string;
    commit?: string;
    isDirty: boolean;
  };
  stats?: DocsStats;
}

export interface DocsStats {
  routes: number;
  packages: number;
  schemas: number;
  pages: number;
  driftFindings: number;
  modules: number;
}

// Search

export interface SearchEntry {
  id: string;
  type: 'route' | 'package' | 'schema' | 'docs' | 'module';
  title: string;
  description?: string;
  url: string;
  content?: string;
  keywords?: string[];
}

export interface SearchResult {
  type: 'route' | 'package' | 'schema' | 'docs';
  id: string;
  title: string;
  description?: string;
  url: string;
  matchedText?: string;
  score: number;
}
