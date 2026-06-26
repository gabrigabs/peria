/**
 * NestJS Adapter
 *
 * Framework adapter for extracting routes, modules, and schemas from NestJS applications.
 */

import type { FrameworkAdapter, RepoContext } from '../types.js';
import { extractRoutes } from './controller-parser.js';
import { detectNestJS } from './detector.js';
import { extractSchemas } from './dto-parser.js';
import { extractModules } from './module-parser.js';

/**
 * NestJS Framework Adapter
 *
 * Extracts structured data from NestJS applications using AST analysis.
 */
export const nestJSAdapter: FrameworkAdapter = {
  name: 'nestjs',

  async detect(context: RepoContext) {
    return detectNestJS(context);
  },

  async extractRoutes(context: RepoContext) {
    return extractRoutes(context);
  },

  async extractSchemas(context: RepoContext) {
    return extractSchemas(context);
  },

  async extractModules(context: RepoContext) {
    return extractModules(context);
  },
};

/**
 * Factory function to create a NestJS adapter instance
 */
export function createNestJSAdapter(): FrameworkAdapter {
  return nestJSAdapter;
}
