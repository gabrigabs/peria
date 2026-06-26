/**
 * Framework Adapters - Index
 */

// NestJS adapter
export { createNestJSAdapter, nestJSAdapter } from './nestjs/index.js';
// Types
export type {
  EntrypointEntity,
  FrameworkAdapter,
  FrameworkDetectionResult,
  ModuleEntity,
  RepoContext,
} from './types.js';
