/**
 * Configuration loader for peria.config.ts
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { FeatureFlags, PeriaConfig, SourcesConfig } from '../types/config.js'

const CONFIG_FILES = [
  'peria.config.ts',
  'peria.config.mts',
  'peria.config.mjs',
  'peria.config.js',
]

/**
 * Load Peria configuration from file
 */
export async function loadConfig(cwd: string): Promise<PeriaConfig | null> {
  for (const filename of CONFIG_FILES) {
    const filepath = join(cwd, filename)
    try {
      const content = await readFile(filepath, 'utf-8')
      return await parseConfig(content, filename, filepath)
    } catch {
      // File doesn't exist or can't be read, try next
    }
  }
  return null
}

/**
 * Parse config content (simplified - full implementation would use ts-morph)
 */
async function parseConfig(content: string, filename: string, filepath: string): Promise<PeriaConfig> {
  if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
    return (await importConfigFile(filepath)) ?? {}
  }

  if (filename.endsWith('.ts') || filename.endsWith('.mts')) {
    const imported = await importConfigFile(filepath)
    if (imported) return imported

    return extractBasicConfig(content)
  }

  return {}
}

async function importConfigFile(filepath: string): Promise<PeriaConfig | null> {
  try {
    const url = pathToFileURL(filepath)
    url.searchParams.set('t', String(Date.now()))
    const module = await import(url.href)
    return module.default ?? module
  } catch {
    return null
  }
}

/**
 * Basic config extraction for MVP
 */
function extractBasicConfig(content: string): PeriaConfig {
  const config: PeriaConfig = {}

  // Extract framework
  const framework = extractStringProperty(content, 'framework')
  if (framework) {
    config.framework = framework as PeriaConfig['framework']
  }

  // Extract entrypoint
  const entrypoint = extractStringProperty(content, 'entrypoint')
  if (entrypoint) {
    config.entrypoint = entrypoint
  }

  const docs = {
    route: extractStringProperty(content, 'route'),
    outputDir: extractStringProperty(content, 'outputDir'),
  }
  if (docs.route || docs.outputDir) {
    config.docs = {}
    if (docs.route) config.docs.route = docs.route
    if (docs.outputDir) config.docs.outputDir = docs.outputDir
  }

  const sources: Partial<SourcesConfig> = {}
  const openapi = extractStringProperty(content, 'openapi')
  const markdown = extractStringArrayProperty(content, 'markdown')
  const llms = extractStringArrayProperty(content, 'llms')
  const context = extractStringArrayProperty(content, 'context')

  if (openapi) sources.openapi = openapi
  if (markdown) sources.markdown = markdown
  if (llms) sources.llms = llms
  if (context) sources.context = context

  if (Object.keys(sources).length > 0) {
    config.sources = sources
  }

  const features = extractFeatureFlags(content)
  if (Object.keys(features).length > 0) {
    config.features = features
  }

  return config
}

function extractStringProperty(content: string, key: string): string | undefined {
  const match = content.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`))
  return match?.[1]
}

function extractStringArrayProperty(content: string, key: string): string[] | undefined {
  const match = content.match(new RegExp(`${key}:\\s*\\[([^\\]]*)\\]`, 's'))
  if (!match) return undefined

  const values = Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g)).map((item) => item[1])
  return values.length > 0 ? values : undefined
}

function extractFeatureFlags(content: string): FeatureFlags {
  const features: FeatureFlags = {}
  const blockMatch = content.match(/features:\s*{(?<body>[\s\S]*?)\n\s*}/)
  const body = blockMatch?.groups?.body
  if (!body) return features

  for (const match of body.matchAll(/(\w+):\s*(true|false)/g)) {
    features[match[1] as keyof FeatureFlags] = match[2] === 'true'
  }

  return features
}

/**
 * Check if config file exists
 */
export async function configExists(cwd: string): Promise<boolean> {
  for (const filename of CONFIG_FILES) {
    try {
      await readFile(join(cwd, filename), 'utf-8')
      return true
    } catch {
      // Continue
    }
  }
  return false
}
