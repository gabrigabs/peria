/**
 * Configuration loader for peria.config.ts
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PeriaConfig } from '../types/config.js'

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
      return await parseConfig(content, filename)
    } catch {
      // File doesn't exist or can't be read, try next
    }
  }
  return null
}

/**
 * Parse config content (simplified - full implementation would use ts-morph)
 */
async function parseConfig(content: string, filename: string): Promise<PeriaConfig> {
  // For MVP, we use a simple eval approach with Bun's ability to handle TS
  // In production, use ts-morph or esbuild to properly parse

  if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
    // Dynamic import for JS configs
    const tempModule = await import(`data:text/javascript,${encodeURIComponent(content)}`)
    return tempModule.default || tempModule
  }

  if (filename.endsWith('.ts') || filename.endsWith('.mts')) {
    // For TS configs, we'll need a proper parser
    // MVP fallback: try to extract basic structure
    return extractBasicConfig(content)
  }

  return {}
}

/**
 * Basic config extraction for MVP
 */
function extractBasicConfig(content: string): PeriaConfig {
  const config: PeriaConfig = {}

  // Extract framework
  const frameworkMatch = content.match(/framework:\s*['"](\w+)['"]/)
  if (frameworkMatch) {
    config.framework = frameworkMatch[1] as PeriaConfig['framework']
  }

  // Extract entrypoint
  const entrypointMatch = content.match(/entrypoint:\s*['"]([^'"]+)['"]/)
  if (entrypointMatch) {
    config.entrypoint = entrypointMatch[1]
  }

  // Extract docs route
  const routeMatch = content.match(/route:\s*['"]([^'"]+)['"]/)
  if (routeMatch) {
    config.docs = { route: routeMatch[1] }
  }

  return config
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
