/**
 * Entrypoint detection from common patterns
 */

import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { DEFAULT_ENTRYPOINT_CANDIDATES } from '../config/defaults.js'

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

/**
 * Detect entrypoint from common patterns
 */
export async function detectEntrypoint(cwd: string): Promise<string | null> {
  for (const candidate of DEFAULT_ENTRYPOINT_CANDIDATES) {
    if (await fileExists(join(cwd, candidate))) {
      return candidate
    }
  }
  return null
}

/**
 * Get common entrypoint options for prompt
 */
export function getEntrypointOptions(): string[] {
  return [...DEFAULT_ENTRYPOINT_CANDIDATES]
}

/**
 * Scan directory for potential entrypoints
 */
export async function scanForEntrypoints(cwd: string): Promise<string[]> {
  const found: string[] = []

  try {
    const entries = await readdir(cwd, { recursive: true })

    for (const entry of entries) {
      if (typeof entry !== 'string') continue

      const fullPath = join(cwd, entry)
      const isFile = await fileExists(fullPath)

      if (!isFile) continue

      // Check if it's a TypeScript or JavaScript file in common locations
      if (
        /\.(ts|js|mts|mjs)$/.test(entry) &&
        (entry.startsWith('src/') || entry === 'server.ts' || entry === 'app.ts')
      ) {
        found.push(entry)
      }
    }
  } catch {
    // Directory scan failed, use defaults
  }

  return found.length > 0 ? found : DEFAULT_ENTRYPOINT_CANDIDATES
}
