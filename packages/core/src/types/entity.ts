/**
 * Entity and Claim types for knowledge graph
 */

export interface Provenance {
  source: string
  line?: number
  commit?: string
  issue?: number
  pr?: number
}

export interface Claim {
  id: string
  subject: string
  predicate: string
  object: string
  confidence: 'high' | 'medium' | 'low'
  provenance: Provenance
  timestamp?: string
}

export type EntityType =
  | 'endpoint'
  | 'service'
  | 'controller'
  | 'dto'
  | 'schema'
  | 'module'
  | 'function'
  | 'variable'
  | 'test'
  | 'page'
  | 'adr'
  | 'issue'
  | 'pr'
  | 'release'

export interface Entity {
  id: string
  name: string
  type: EntityType
  path?: string
  description?: string
  claims: Claim[]
  relations: EntityRelation[]
  metadata?: Record<string, unknown>
}

export interface EntityRelation {
  targetId: string
  relation: 'implements' | 'uses' | 'depends_on' | 'relates_to' | 'documented_in' | 'changed_by' | 'deprecates' | 'supersedes'
}

export interface KnowledgeGraph {
  entities: Map<string, Entity>
  claims: Claim[]
  version: string
  generatedAt: string
}
