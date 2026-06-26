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

export { generateDiffContext } from './diff-context.js';
// Main generator
export {
  generateAndSaveContextPacks,
  generateContextPacks,
  saveContextPacks,
} from './generator.js';
export { generatePackageContext } from './package-context.js';
// Generators
export { generateRouteContext } from './route-context.js';
export { generateTaskContext } from './task-context.js';
// Re-export types for convenience
export type {
  ContextPack,
  ContextPackOptions,
  ContextPackResult,
  ContextVariant,
  DiffContextPack,
  FullContextPack,
  PackageContextPack,
  RepoSummary,
  RouteContextPack,
  TaskContextPack,
  TaskType,
} from './types.js';
// Types
export * from './types.js';
// Constants
export { TASK_TEMPLATES } from './types.js';
