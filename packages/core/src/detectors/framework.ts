/**
 * Framework detection from package.json dependencies
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { DetectedFramework, FrameworkInfo } from '../types/framework.js'
import { FRAMEWORK_PACKAGES, FRAMEWORK_LABELS } from '../types/framework.js'

interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

/**
 * Detect framework from package.json
 */
export async function detectFramework(cwd: string): Promise<FrameworkInfo | null> {
  try {
    const pkgPath = join(cwd, 'package.json')
    const content = await readFile(pkgPath, 'utf-8')
    const pkg: PackageJson = JSON.parse(content)

    const deps = { ...pkg.dependencies, ...pkg.devDependencies }

    // Check for known framework packages
    for (const [packageName, framework] of Object.entries(FRAMEWORK_PACKAGES)) {
      if (deps[packageName]) {
        return {
          framework,
          confidence: 'high',
          evidence: `Found ${packageName} in dependencies`,
        }
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Get list of available frameworks for prompt
 */
export function getFrameworkOptions(): { value: DetectedFramework; label: string }[] {
  return Object.entries(FRAMEWORK_LABELS).map(([value, label]) => ({
    value: value as DetectedFramework,
    label,
  }))
}
