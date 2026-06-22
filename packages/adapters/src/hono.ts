/**
 * Hono adapter for Peria
 *
 * Usage:
 * ```ts
 * import { Hono } from 'hono'
 * import { periaDocs } from '@peria/adapters/hono'
 *
 * const app = new Hono()
 * app.use('/docs/*', periaDocs())
 * ```
 */

export interface PeriaDocsOptions {
  docsPath?: string
}

export interface HonoContext {
  json: (data: unknown) => Response
}

export function periaDocs(_options?: PeriaDocsOptions) {
  return (c: HonoContext) => {
    return c.json({
      message: 'Peria docs endpoint',
      route: '/docs',
      status: 'coming soon',
    })
  }
}
