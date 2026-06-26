/**
 * Package Scanner - Scans package.json files
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { PackageEntity } from '../types/graph.js';
import { findFiles } from './index.js';

interface PackageJson {
  name?: string;
  version?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  exports?: string[] | Record<string, unknown>;
  types?: string;
}

/**
 * Extract export keys from package.json
 */
function extractExports(exports: unknown): string[] {
  if (!exports) return [];
  if (Array.isArray(exports)) return exports;
  if (typeof exports === 'object') return Object.keys(exports);
  return [];
}

/**
 * Scan package.json files
 */
export async function scanPackages(cwd: string): Promise<PackageEntity[]> {
  const packages: PackageEntity[] = [];
  const packageFiles = await findFiles(cwd, 'package.json');

  for (const file of packageFiles) {
    try {
      const content = await readFile(join(cwd, file), 'utf-8');
      const pkg = JSON.parse(content) as PackageJson;

      if (!pkg.name) continue;

      packages.push({
        id: `package:${pkg.name}`,
        name: pkg.name,
        version: pkg.version,
        directory: file === 'package.json' ? '.' : file.replace('/package.json', ''),
        manifestPath: file,
        description: pkg.description,
        scripts: pkg.scripts,
        dependencies: Object.keys(pkg.dependencies || {}),
        devDependencies: Object.keys(pkg.devDependencies || {}),
        exports: extractExports(pkg.exports),
        types: pkg.types,
        source: { file, commit: undefined },
        confidence: 'high',
      });
    } catch {
      // Skip invalid package.json
    }
  }

  return packages;
}
