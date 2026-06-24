/**
 * Elysia adapter for Peria
 *
 * Usage:
 * ```ts
 * import { Elysia } from 'elysia'
 * import { periaDocs } from '@peria/adapters/elysia'
 *
 * const app = new Elysia()
 * app.use(periaDocs({ prefix: '/docs' }))
 * ```
 */

export interface PeriaDocsOptions {
  prefix?: string;
  docsPath?: string;
}

export interface ElysiaInstance {
  group: (prefix: string, callback: (group: ElysiaGroup) => ElysiaInstance) => ElysiaInstance;
  get: (path: string, handler: () => unknown) => ElysiaInstance;
}

export interface ElysiaGroup {
  get: (path: string, handler: () => unknown) => ElysiaGroup;
}

export function periaDocs(options?: PeriaDocsOptions) {
  return (app: ElysiaInstance): ElysiaInstance => {
    return app.group(options?.prefix ?? '/docs', (group: ElysiaGroup): ElysiaInstance => {
      group.get('/', () => ({
        message: 'Peria docs endpoint',
        route: options?.prefix ?? '/docs',
        status: 'coming soon',
      }));
      return app;
    });
  };
}
