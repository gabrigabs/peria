/**
 * Mermaid Module - Main entry point
 *
 * Phase 7: Generate Mermaid diagrams for routes, modules, packages, and schemas.
 *
 * @example
 * ```ts
 * import { generateDiagrams, generateAndSaveDiagrams } from '@peria/core';
 *
 * const result = generateDiagrams(manifest, { cwd: process.cwd() });
 * console.log(result.diagrams.length); // Number of diagrams generated
 *
 * // Or generate and save in one call
 * await generateAndSaveDiagrams(manifest, { cwd: process.cwd() });
 * ```
 */

// Types
export * from './types.js';

// Generators
export { generateRouteFlowDiagrams } from './route-flow.js';
export { generatePackageDepDiagrams } from './package-deps.js';
export { generateSchemaDiagrams } from './schema.js';

// Main generator
export {
  generateDiagrams,
  generateOverviewDiagram,
  saveDiagrams,
  generateAndSaveDiagrams,
} from './generator.js';

// Re-export types for convenience
export type {
  MermaidDiagram,
  MermaidOptions,
  MermaidResult,
  DiagramType,
} from './types.js';
