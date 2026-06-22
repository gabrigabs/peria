/**
 * Express adapter for Peria
 *
 * Usage:
 * ```ts
 * import express from 'express'
 * import { periaDocs } from '@peria/adapters/express'
 *
 * const app = express()
 * app.use('/docs', periaDocs())
 * ```
 */

export interface PeriaDocsOptions {
  route?: string
  docsPath?: string
}

export function periaDocs(options?: PeriaDocsOptions): unknown {
  return (_req: unknown, res: unknown) => {
    const response = res as { json: (data: unknown) => void }
    response.json({
      message: 'Peria docs endpoint',
      route: options?.route ?? '/docs',
      status: 'coming soon',
    })
  }
}
