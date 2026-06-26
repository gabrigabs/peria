/**
 * NestJS Framework Detector
 *
 * Detects NestJS applications by looking for:
 * - @nestjs/core in dependencies
 * - main.ts with NestFactory.create()
 * - Files with @Controller, @Module, @Injectable decorators
 * - app.module.ts pattern
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { FrameworkDetectionResult, RepoContext } from '../types.js';

/**
 * Common NestJS entry points
 */
export const NESTJS_ENTRYPOINTS = [
  'src/main.ts',
  'main.ts',
  'apps/api/src/main.ts',
  'apps/server/src/main.ts',
];

/**
 * Files that suggest NestJS usage (reserved for future use)
 */
// const _NESTJS_PATTERNS = [
//   /\.controller\.ts$/,
//   /\.module\.ts$/,
//   /\.service\.ts$/,
//   /\.guard\.ts$/,
//   /\.pipe\.ts$/,
//   /\.interceptor\.ts$/,
//   /\.decorator\.ts$/,
//   /\.dto\.ts$/,
//   /\.entity\.ts$/,
//   /\.schema\.ts$/,
// ];

/**
 * NestJS-specific imports (reserved for future use)
 */
// const _NESTJS_IMPORTS = [
//   '@nestjs/common',
//   '@nestjs/core',
//   '@nestjs/platform-express',
//   '@nestjs/platform-fastify',
// ];

/**
 * Detect if a repository is a NestJS application
 */
export async function detectNestJS(context: RepoContext): Promise<FrameworkDetectionResult> {
  const { cwd } = context;
  const reasons: string[] = [];
  const suggestedEntrypoints: string[] = [];

  // Check package.json for @nestjs/core
  try {
    const pkgPath = join(cwd, 'package.json');
    const pkgContent = await readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(pkgContent);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['@nestjs/core']) {
      reasons.push(`@nestjs/core@${deps['@nestjs/core']} found in dependencies`);
    }

    if (deps['@nestjs/common']) {
      reasons.push(`@nestjs/common found in dependencies`);
    }
  } catch {
    // package.json not found or invalid
  }

  // Check for main.ts with NestFactory.create
  for (const entrypoint of NESTJS_ENTRYPOINTS) {
    try {
      const entryPath = join(cwd, entrypoint);
      const content = await readFile(entryPath, 'utf-8');

      if (content.includes('NestFactory.create')) {
        reasons.push(`NestFactory.create() found in ${entrypoint}`);
        suggestedEntrypoints.push(entrypoint);
      }
    } catch {
      // File doesn't exist
    }
  }

  // Check for app.module.ts pattern
  const modulePatterns = ['app.module.ts', 'src/app.module.ts', 'apps/api/src/app.module.ts'];
  for (const pattern of modulePatterns) {
    try {
      const modulePath = join(cwd, pattern);
      const content = await readFile(modulePath, 'utf-8');

      if (content.includes('@Module') && content.includes('@Controller')) {
        reasons.push(`@Module decorator found in ${pattern}`);
      }
    } catch {
      // File doesn't exist
    }
  }

  // Determine confidence based on evidence
  let confidence: 'high' | 'medium' | 'low' = 'low';
  if (reasons.length >= 3) {
    confidence = 'high';
  } else if (reasons.length >= 1) {
    confidence = 'medium';
  }

  return {
    framework: 'nestjs',
    confidence,
    reasons,
    suggestedEntrypoints,
  };
}
