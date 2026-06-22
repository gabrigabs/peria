/**
 * Default configuration values
 */

import type { FeatureFlags, DocsConfig } from '../types/config.js'

export const DEFAULT_ENTRYPOINT_CANDIDATES = [
  'src/main.ts',
  'src/index.ts',
  'server.ts',
  'app.ts',
  'src/server.ts',
  'src/app.ts',
  'src/app/index.ts',
]

export const DEFAULT_FEATURES: FeatureFlags = {
  embeddedDocs: true,
  codeMap: true,
  apiReference: true,
  wiki: true,
  llms: true,
  gitDiff: true,
  changeMap: false,
  driftCheck: true,
  patchNotes: false,
  github: false,
  contextPacks: false,
  mermaid: true,
}

export const DEFAULT_DOCS: DocsConfig = {
  enabled: true,
  route: '/docs',
}

export const DEFAULT_SOURCES = {
  openapi: 'openapi.yaml',
  markdown: ['README.md', 'docs/**/*.md'],
  llms: ['llms.txt', 'llms-full.txt'],
}
