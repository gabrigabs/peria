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

// Main generator
export {
  generateAndSaveDiagrams,
  generateDiagrams,
  generateOverviewDiagram,
  saveDiagrams,
} from './generator.js';
export { generatePackageDepDiagrams } from './package-deps.js';
// Generators
export { generateRouteFlowDiagrams } from './route-flow.js';
export { generateSchemaDiagrams } from './schema.js';
// Re-export types for convenience
export type {
  DiagramType,
  MermaidDiagram,
  MermaidOptions,
  MermaidResult,
} from './types.js';
// Types
export * from './types.js';
