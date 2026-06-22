/**
 * Source document types
 */

export type SourceType = 'markdown' | 'openapi' | 'typescript' | 'llms'

export interface SourceDocument {
  id: string
  type: SourceType
  path: string
  content: string
  metadata?: Record<string, unknown>
}

export interface MarkdownSource extends SourceDocument {
  type: 'markdown'
  frontmatter?: Record<string, unknown>
  headings?: { level: number; text: string; anchor: string }[]
}

export interface OpenAPISource extends SourceDocument {
  type: 'openapi'
  version?: string
  endpoints?: OpenAPIEndpoint[]
}

export interface OpenAPIEndpoint {
  method: string
  path: string
  operationId?: string
  summary?: string
  description?: string
  tags?: string[]
}

export interface LlmsSource extends SourceDocument {
  type: 'llms'
  variant: 'full' | 'summary'
}
