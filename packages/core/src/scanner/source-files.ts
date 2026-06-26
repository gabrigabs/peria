/**
 * Source Files Scanner - Scans TypeScript source files
 *
 * Uses ts-morph for proper AST analysis to extract:
 * - Named exports (functions, classes, interfaces, types)
 * - Imports
 * - Decorator presence
 * - Meaningful module names
 */

import { join } from 'node:path';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { SourceFile } from '../types/graph.js';
import {
  createScannerProject,
  deriveModuleName,
  extractExports,
  extractImports,
  findTypeScriptFiles,
  hasDecorators,
} from './ts-morph-utils.js';

const IGNORED_EXTENSIONS = new Set(['.d.ts', '.test.ts', '.spec.ts']);

/**
 * Check if a file should be scanned
 */
function shouldScan(filePath: string): boolean {
  // Skip declaration files and test files
  for (const ext of IGNORED_EXTENSIONS) {
    if (filePath.endsWith(ext)) return false;
  }
  return true;
}

/**
 * Scan TypeScript source files
 */
export async function scanSourceFiles(
  cwd: string,
  config: ResolvedPeriaConfig
): Promise<SourceFile[]> {
  const files: SourceFile[] = [];

  // Get package name from config if available
  const packageName = config.project?.name;

  // Find all TypeScript files
  const tsFiles = findTypeScriptFiles(cwd, cwd);

  // Create ts-morph project
  const project = createScannerProject(cwd);

  // Add all source files to the project
  for (const file of tsFiles) {
    const fullPath = join(cwd, file);
    try {
      project.addSourceFileAtPath(fullPath);
    } catch {
      // Skip files that can't be added
    }
  }

  // Process each source file
  for (const sourceFile of project.getSourceFiles()) {
    const filePath = sourceFile.getFilePath().replace(`${cwd}/`, '').replace(cwd, '.');

    if (!shouldScan(filePath)) continue;

    // Skip files outside the project root
    if (!sourceFile.getFilePath().startsWith(cwd)) continue;

    try {
      // Extract exports using ts-morph
      const exports = extractExports(sourceFile);

      // Extract imports using ts-morph
      const imports = extractImports(sourceFile);

      // Check for decorators
      const decorators = hasDecorators(sourceFile);

      // Derive meaningful module name
      const module = deriveModuleName(filePath, packageName);

      files.push({
        id: `file:${filePath}`,
        path: filePath,
        module,
        exports,
        imports,
        hasDecorators: decorators,
        source: {
          file: filePath,
          line: 1,
        },
        confidence: 'high',
      });
    } catch {
      // Skip files that fail to parse
    }
  }

  return files;
}
