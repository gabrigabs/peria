/**
 * NestJS Adapter Utilities
 *
 * Shared utilities for NestJS adapter parsers.
 */

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  Project,
  SyntaxKind,
  type SourceFile,
} from 'ts-morph'

/**
 * Find tsconfig.json in the project
 */
export function findTsConfig(cwd: string): string | undefined {
  const candidates = [
    join(cwd, 'tsconfig.json'),
    join(cwd, 'tsconfig.build.json'),
    join(cwd, 'apps', 'api', 'tsconfig.json'),
  ]

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate
    }
  }

  return undefined
}

/**
 * Create a ts-morph project and get source files
 */
export function createTsMorphProject(cwd: string): { project: Project; sourceFiles: SourceFile[] } {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  })

  // Add all TypeScript files from the cwd
  const tsConfigPath = findTsConfig(cwd)
  if (tsConfigPath) {
    project.addSourceFilesFromTsConfig(tsConfigPath)
  } else {
    // Fallback: add files manually
    project.addSourceFiles(`${cwd}/**/*.ts`)
  }

  // Get all source files
  const sourceFiles = project.getSourceFiles()
    .filter(sf => sf.getFilePath().startsWith(cwd))
    .filter(sf => !sf.getFilePath().includes('node_modules'))
    .filter(sf => !sf.getFilePath().includes('.d.ts'))

  return { project, sourceFiles }
}
