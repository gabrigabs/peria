/**
 * Package Exports Audit Check
 *
 * Verifies that package.json exports align with built dist output.
 * Flags:
 * - Missing dist directory (error)
 * - Exported files missing from dist (error)
 * - Type declarations missing (warning)
 */

import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';

import type { AuditCheck, AuditSeverity } from './types.js';
import type { DriftFinding } from '../types/graph.js';
import type { PeriaManifest } from '../types/manifest.js';

interface PackageJson {
  name: string;
  version?: string;
  exports?: Record<string, string | { types?: string; default?: string }>;
  main?: string;
  types?: string;
  module?: string;
}

/**
 * Generate a unique ID for findings
 */
function generateId(prefix: string, index: number): string {
  return `audit-${prefix}-${Date.now().toString(36)}-${index}`;
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all files in a directory recursively
 */
async function getAllFiles(dir: string, basePath: string = ''): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        files.push(...(await getAllFiles(fullPath, relativePath)));
      }
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

/**
 * Package Exports audit check
 */
export const runPackageExportsCheck: AuditCheck = {
  name: 'package-exports',
  description: 'Verify package exports align with build output',
  defaultSeverity: 'error' as AuditSeverity,

  async run(manifest: PeriaManifest, cwd: string): Promise<DriftFinding[]> {
    const findings: DriftFinding[] = [];
    let index = 0;

    // Check packages from manifest
    for (const pkg of manifest.packages) {
      const pkgDir = join(cwd, pkg.directory);
      const pkgJsonPath = join(pkgDir, 'package.json');
      const distPath = join(pkgDir, 'dist');

      // Read package.json
      let pkgJson: PackageJson | null = null;
      try {
        const content = await readFile(pkgJsonPath, 'utf-8');
        pkgJson = JSON.parse(content);
      } catch {
        // Package.json doesn't exist, skip
        continue;
      }

      // At this point, pkgJson is guaranteed to be non-null
      const pkgJsonData = pkgJson!;

      // Check if dist exists
      const distExists = await fileExists(distPath);
      if (!distExists) {
        // Only flag as error if package has exports/main/module
        if (pkgJsonData.exports || pkgJsonData.main || pkgJsonData.module) {
          findings.push({
            id: generateId('pkg-no-dist', index++),
            severity: 'error',
            type: 'package-missing-dist',
            entityId: pkg.id,
            entityType: 'package',
            problem: `Package "${pkg.name}" has exports but dist directory is missing`,
            expected: 'dist directory should exist',
            actual: 'dist directory not found',
            source: { file: pkgJsonPath },
            suggestions: ['Run "bun run build" to build packages'],
          });
        }
        continue;
      }

      // Get all files in dist
      let distFiles: string[] = [];
      try {
        distFiles = await getAllFiles(distPath);
        // Normalize paths (remove .js extensions for comparison)
        distFiles = distFiles.map((f) => f.replace(/\.js$/, '').replace(/\.d\.ts$/, ''));
      } catch {
        // Can't read dist, skip further checks
        continue;
      }

      const distFileSet = new Set(distFiles);

      // Check exports field
      if (pkgJsonData.exports) {
        for (const [exportPath, exportValue] of Object.entries(pkgJsonData.exports)) {
          // Skip node patterns
          if (exportPath.includes('*') || exportPath.includes('#')) continue;

          const exportObj = typeof exportValue === 'string'
            ? { default: exportValue }
            : exportValue;

          // Check default export
          if (exportObj.default) {
            const exportFile = exportObj.default
              .replace(/^\.\//, '')
              .replace(/\.js$/, '');

            if (!distFileSet.has(exportFile) && !distFileSet.has(`${exportFile}/index`)) {
              findings.push({
                id: generateId('pkg-export-missing', index++),
                severity: 'error',
                type: 'package-export-missing',
                entityId: pkg.id,
                entityType: 'package',
                problem: `Package "${pkg.name}" exports "${exportPath}" but file is missing from dist`,
                expected: `dist/${exportFile}.js should exist`,
                actual: 'File not found',
                source: { file: pkgJsonPath },
                suggestions: [
                  'Run "bun run build" to rebuild packages',
                  'Or check for build errors',
                ],
              });
            }
          }

          // Check types export
          if (exportObj.types) {
            const typesFile = exportObj.types
              .replace(/^\.\//, '')
              .replace(/\.d\.ts$/, '');

            // Check for .d.ts file
            const hasTypes = distFiles.some(
              (f) => f.startsWith(typesFile) && f.endsWith('.d')
            );

            if (!hasTypes) {
              findings.push({
                id: generateId('pkg-types-missing', index++),
                severity: 'warning',
                type: 'package-types-missing',
                entityId: pkg.id,
                entityType: 'package',
                problem: `Package "${pkg.name}" exports "${exportPath}" but type declarations may be missing`,
                expected: `dist/${typesFile}.d.ts should exist`,
                actual: 'Type declarations not found',
                source: { file: pkgJsonPath },
                suggestions: ['Check build output for TypeScript compilation'],
              });
            }
          }
        }
      }

      // Check main/module fields
      // Note: main/module pointing to dist that doesn't exist is a warning during development
      // because the user might not have built yet. Only flag as error if explicitly exported.
      if (pkgJsonData.main) {
        const mainFile = pkgJsonData.main.replace(/^\.\//, '').replace(/\.js$/, '');
        const isDistField = mainFile.startsWith('dist/');

        if (!distFileSet.has(mainFile)) {
          findings.push({
            id: generateId('pkg-main-missing', index++),
            severity: isDistField ? 'warning' : 'error',
            type: 'package-main-missing',
            entityId: pkg.id,
            entityType: 'package',
            problem: `Package "${pkg.name}" has "main" pointing to missing file`,
            expected: `dist/${mainFile}.js should exist`,
            actual: 'File not found',
            source: { file: pkgJsonPath },
            suggestions: isDistField
              ? ['Run "bun run build" to build packages']
              : ['Run "bun run build" to rebuild'],
          });
        }
      }

      if (pkgJsonData.module && pkgJsonData.module !== pkgJsonData.main) {
        const moduleFile = pkgJsonData.module.replace(/^\.\//, '').replace(/\.js$/, '');
        const isDistField = moduleFile.startsWith('dist/');

        if (!distFileSet.has(moduleFile)) {
          findings.push({
            id: generateId('pkg-module-missing', index++),
            severity: isDistField ? 'warning' : 'error',
            type: 'package-module-missing',
            entityId: pkg.id,
            entityType: 'package',
            problem: `Package "${pkg.name}" has "module" pointing to missing file`,
            expected: `dist/${moduleFile}.js should exist`,
            actual: 'File not found',
            source: { file: pkgJsonPath },
            suggestions: isDistField
              ? ['Run "bun run build" to build packages']
              : ['Run "bun run build" to rebuild'],
          });
        }
      }
    }

    return findings;
  },
};
