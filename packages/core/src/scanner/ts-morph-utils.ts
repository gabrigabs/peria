/**
 * ts-morph Utilities for Scanner
 *
 * Shared utilities for TypeScript source analysis using ts-morph.
 */

import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { Project, type SourceFile } from 'ts-morph';
import { ModuleKind, ModuleResolutionKind, ScriptTarget } from 'typescript';
import type { ExportSummary } from '../types/graph.js';

const IGNORED_DIRECTORIES = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  '.eria',
  '.peria',
  '.next',
  'coverage',
  '.d.ts',
]);

/**
 * Export kind mapping from ts-morph declaration kinds
 */
export function getExportKind(kindName: string): ExportSummary['kind'] {
  if (kindName.includes('Class')) return 'class';
  if (kindName.includes('Function')) return 'function';
  if (kindName.includes('Interface')) return 'interface';
  if (kindName.includes('TypeAlias')) return 'type';
  if (kindName.includes('Variable')) return 'variable';
  if (kindName.includes('Enum')) return 'enum';
  return 'other';
}

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
export function findTypeScriptFiles(dir: string, cwd: string): string[] {
  const results: string[] = [];

  function walk(directory: string): void {
    try {
      const entries = readdirSync(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(directory, entry.name);

        // Skip ignored patterns
        if (
          entry.name.startsWith('.') ||
          IGNORED_DIRECTORIES.has(entry.name) ||
          fullPath.includes('node_modules') ||
          fullPath.includes('.d.ts')
        ) {
          continue;
        }

        if (entry.isDirectory()) {
          walk(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.ts') && !entry.name.endsWith('.d.ts')) {
          // Return path relative to cwd
          results.push(fullPath.replace(`${cwd}/`, '').replace(cwd, '.'));
        }
      }
    } catch {
      // Directory doesn't exist or can't be read
    }
  }

  walk(dir);
  return results;
}

/**
 * Create a ts-morph project for source analysis
 */
export function createScannerProject(_cwd: string): Project {
  return new Project({
    skipAddingFilesFromTsConfig: true,
    compilerOptions: {
      allowJs: false,
      declaration: true,
      target: ScriptTarget.Latest,
      module: ModuleKind.ESNext,
      moduleResolution: ModuleResolutionKind.NodeJs,
    },
  });
}

/**
 * Extract exports from a source file using ts-morph
 */
export function extractExports(sourceFile: SourceFile): ExportSummary[] {
  const exports: ExportSummary[] = [];
  const exportedDeclarations = sourceFile.getExportedDeclarations();

  for (const [name, declarations] of exportedDeclarations.entries()) {
    const declaration = declarations[0];
    if (!declaration) continue;

    exports.push({
      name,
      kind: getExportKind(declaration.getKindName()),
      line: declaration.getSourceFile().getLineAndColumnAtPos(declaration.getStart()).line,
    });
  }

  return exports;
}

/**
 * Extract imports from a source file using ts-morph
 */
export function extractImports(sourceFile: SourceFile): string[] {
  const imports: string[] = sourceFile
    .getImportDeclarations()
    .map((declaration) => declaration.getModuleSpecifierValue())
    .filter((specifier) => specifier.startsWith('.') || specifier.startsWith('@peria/'));

  return [...new Set(imports)];
}

/**
 * Check if a source file has decorators
 */
export function hasDecorators(sourceFile: SourceFile): boolean {
  // Check classes for decorators
  for (const cls of sourceFile.getClasses()) {
    if (cls.getDecorators().length > 0) return true;
  }
  // Check methods for decorators
  for (const cls of sourceFile.getClasses()) {
    for (const method of cls.getMethods()) {
      if (method.getDecorators().length > 0) return true;
    }
  }
  return false;
}

/**
 * Derive a meaningful module name from file path
 * e.g., "packages/core/src/scanner/index.ts" -> "@peria/core/scanner/index"
 */
export function deriveModuleName(filePath: string, packageName?: string): string {
  if (packageName) {
    // Remove package directory prefix and file extension
    const relativePath = filePath
      .replace(/^packages\/[^/]+\/src\//, '')
      .replace(/\.ts$/, '')
      .replace(/\/index$/, '');
    return `${packageName}/${relativePath}`;
  }

  // Fallback: clean up the path
  return filePath
    .replace(/^packages\/[^/]+\/src\//, '@peria/')
    .replace(/\.ts$/, '')
    .replace(/\/index$/, '');
}
