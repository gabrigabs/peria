/**
 * Peria adapters package exports
 */

export type {
  ElysiaGroup,
  ElysiaInstance,
  PeriaDocsOptions as ElysiaPeriaDocsOptions,
} from './elysia.js';
export { periaDocs as elysiaPeriaDocs } from './elysia.js';
export type { PeriaDocsOptions as ExpressPeriaDocsOptions } from './express.js';
export { periaDocs as expressPeriaDocs } from './express.js';
export type { FastifyInstance, PeriaDocsOptions as FastifyPeriaDocsOptions } from './fastify.js';
export { periaDocs as fastifyPeriaDocs } from './fastify.js';
export type { HonoContext, PeriaDocsOptions as HonoPeriaDocsOptions } from './hono.js';
export { periaDocs as honoPeriaDocs } from './hono.js';
export type { NestApplication, PeriaNestOptions } from './nest.js';
export { setupPeriaDocs } from './nest.js';
