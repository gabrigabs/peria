/**
 * NestJS Adapter Utilities
 *
 * Shared utilities for NestJS adapter parsers.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Project, type SourceFile } from 'ts-morph';

/**
 * Find tsconfig.json in the project
 */
export function findTsConfig(cwd: string): string | undefined {
  const candidates = [
    join(cwd, 'tsconfig.json'),
    join(cwd, 'tsconfig.build.json'),
    join(cwd, 'apps', 'api', 'tsconfig.json'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

/**
 * Recursively find all TypeScript files in a directory
 */
function findTsFiles(dir: string, ignorePatterns: string[]): string[] {
  const results: string[] = [];

  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      // Skip ignored patterns
      if (ignorePatterns.some((pattern) => fullPath.includes(pattern))) {
        continue;
      }

      if (entry.isDirectory()) {
        results.push(...findTsFiles(fullPath, ignorePatterns));
      } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return results;
}

/**
 * Create a ts-morph project and get source files
 */
export function createTsMorphProject(cwd: string): { project: Project; sourceFiles: SourceFile[] } {
  const project = new Project({
    skipAddingFilesFromTsConfig: true,
  });

  // Add all TypeScript files from the cwd
  const tsConfigPath = findTsConfig(cwd);
  if (tsConfigPath) {
    // Use addSourceFilesFromTsConfig if available
    project.addSourceFilesFromTsConfig(tsConfigPath);
  } else {
    // Fallback: add files manually using recursive search
    const tsFiles = findTsFiles(cwd, ['node_modules', '.d.ts']);
    for (const file of tsFiles) {
      project.addSourceFileAtPath(file);
    }
  }

  // Get all source files
  const sourceFiles = project
    .getSourceFiles()
    .filter((sf) => sf.getFilePath().startsWith(cwd))
    .filter((sf) => !sf.getFilePath().includes('node_modules'))
    .filter((sf) => !sf.getFilePath().includes('.d.ts'));

  return { project, sourceFiles };
}
