/**
 * Peria adapters package exports
 */

export { periaDocs as expressPeriaDocs } from './express.js'
export { periaDocs as fastifyPeriaDocs } from './fastify.js'
export { setupPeriaDocs } from './nest.js'
export { periaDocs as honoPeriaDocs } from './hono.js'
export { periaDocs as elysiaPeriaDocs } from './elysia.js'
export type { PeriaDocsOptions as ExpressPeriaDocsOptions } from './express.js'
export type { PeriaDocsOptions as FastifyPeriaDocsOptions, FastifyInstance } from './fastify.js'
export type { PeriaNestOptions, NestApplication } from './nest.js'
export type { PeriaDocsOptions as HonoPeriaDocsOptions, HonoContext } from './hono.js'
export type { PeriaDocsOptions as ElysiaPeriaDocsOptions, ElysiaInstance, ElysiaGroup } from './elysia.js'
