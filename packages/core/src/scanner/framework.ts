/**
 * Framework Scanner - Detects framework type
 */

import { readFile, stat } from 'node:fs/promises';
import { join } from 'node:path';
import type { ResolvedPeriaConfig } from '../types/config.js';
import type { FrameworkMetadata } from '../types/manifest.js';

/**
 * Check if tsconfig.json exists
 */
export async function checkTsConfig(cwd: string): Promise<boolean> {
  const tsConfigPaths = [
    join(cwd, 'tsconfig.json'),
    join(cwd, 'tsconfig.build.json'),
    join(cwd, 'apps', 'api', 'tsconfig.json'),
  ];

  for (const path of tsConfigPaths) {
    try {
      await stat(path);
      return true;
    } catch {
      // Try next
    }
  }
  return false;
}

interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

/**
 * Detect framework
 */
export async function detectFramework(
  cwd: string,
  config: ResolvedPeriaConfig
): Promise<FrameworkMetadata | undefined> {
  // Check package.json for framework dependencies
  const pkgPath = join(cwd, 'package.json');
  try {
    const content = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content) as PackageJson;
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    const frameworks: Array<[string, string[]]> = [
      ['nestjs', ['@nestjs/core']],
      ['express', ['express']],
      ['fastify', ['fastify']],
      ['hono', ['hono']],
      ['elysia', ['elysia']],
    ];

    for (const [name, packages] of frameworks) {
      for (const p of packages) {
        if (deps[p]) {
          return {
            name: name as FrameworkMetadata['name'],
            confidence: 'high',
            entrypoint: config.entrypoint,
            evidence: [`Found ${p} in dependencies`],
          };
        }
      }
    }
  } catch {
    // Ignore
  }

  return {
    name: 'other',
    confidence: 'low',
    evidence: ['No framework detected from package.json'],
  };
}
