/**
 * Fastify adapter for Peria
 *
 * Usage:
 * ```ts
 * import Fastify from 'fastify'
 * import { periaDocs } from '@peria/adapters/fastify'
 *
 * const app = Fastify()
 * await app.register(periaDocs, { routePrefix: '/docs' })
 * ```
 */

export interface PeriaDocsOptions {
  routePrefix?: string
  docsPath?: string
}

export interface FastifyInstance {
  get: (route: string, handler: () => Promise<unknown>) => void
}

export function periaDocs(options?: PeriaDocsOptions) {
  return async (app: FastifyInstance) => {
    app.get(options?.routePrefix ?? '/docs', async () => {
      return {
        message: 'Peria docs endpoint',
        route: options?.routePrefix ?? '/docs',
        status: 'coming soon',
      }
    })
  }
}
