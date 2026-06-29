/**
 * Peria adapters package exports
 *
 * Supported frameworks:
 * - Express
 * - Fastify
 * - NestJS
 */

// Express adapter
export type { PeriaDocsOptions as ExpressPeriaDocsOptions } from './express.js';
// Re-export all adapters under common names for convenience
export { periaDocs as expressPeriaDocs, periaDocs } from './express.js';
// Fastify adapter
export type { FastifyInstance, PeriaDocsOptions as FastifyPeriaDocsOptions } from './fastify.js';
export { periaDocs as fastifyPeriaDocs } from './fastify.js';
// NestJS adapter
export type { INestApplication, PeriaNestOptions } from './nest.js';
export { setupPeriaDocs } from './nest.js';
