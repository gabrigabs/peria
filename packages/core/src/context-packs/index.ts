/**
 * Context Packs Module - Main entry point
 *
 * Phase 6: Agent context packs for coding assistants.
 *
 * @example
 * ```ts
 * import { generateContextPacks, generateAndSaveContextPacks } from '@peria/core';
 *
 * const result = await generateContextPacks(manifest, { cwd: process.cwd() });
 * console.log(result.totalPacks); // Number of packs generated
 *
 * // Or generate and save in one call
 * await generateAndSaveContextPacks(manifest, { cwd: process.cwd() });
 * ```
 */

// Types
export * from './types.js';

// Constants
export { TASK_TEMPLATES } from './types.js';

// Generators
export { generateRouteContext } from './route-context.js';
export { generatePackageContext } from './package-context.js';
export { generateTaskContext } from './task-context.js';
export { generateDiffContext } from './diff-context.js';

// Main generator
export {
  generateContextPacks,
  saveContextPacks,
  generateAndSaveContextPacks,
} from './generator.js';

// Re-export types for convenience
export type {
  ContextPack,
  RouteContextPack,
  PackageContextPack,
  TaskContextPack,
  DiffContextPack,
  FullContextPack,
  ContextPackOptions,
  ContextPackResult,
  ContextVariant,
  RepoSummary,
  TaskType,
} from './types.js';
